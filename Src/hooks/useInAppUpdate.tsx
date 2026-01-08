import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import SpInAppUpdates, {
    IAUUpdateKind,
    StartUpdateOptions,
    IAUInstallStatus,
    StatusUpdateEvent,
    AndroidStatusEventListener
} from 'sp-react-native-in-app-updates';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_PRIORITY_UPDATE = 4;
const UPDATE_DISMISSED_KEY = 'update_dismissed_version';
const LAST_CHECK_KEY = 'last_update_check_time';
// const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

interface UpdateResult {
    shouldUpdate: boolean;
    storeVersion?: string;
    updatePriority?: number;
    other?: {
        storeVersion?: string;
    };
}

const useInAppUpdate = (): void => {
    const hasChecked = useRef<boolean>(false);
    const inAppUpdatesRef = useRef<SpInAppUpdates | null>(null);
    const statusListenerRef = useRef<AndroidStatusEventListener | null>(null);

    useEffect(() => {
        // Prevent multiple checks in the same session
        if (hasChecked.current) {
            console.log('⏭️ Update already checked this session');
            return;
        }

        const checkForUpdates = async (): Promise<void> => {
            try {
                // Skip if not installed from Play Store
                const installerPackageName = await DeviceInfo.getInstallerPackageName();
                console.log('📦 Installer package:', installerPackageName);

                if (installerPackageName !== 'com.android.vending') {
                    console.log('⚠️ App not installed from Play Store. Skipping update check.');
                    console.log('ℹ️ In-app updates only work for Play Store installations.');
                    return;
                }

                // Check time-based throttling
                const lastCheckTime = await AsyncStorage.getItem(LAST_CHECK_KEY);
                const now = Date.now();

                if (lastCheckTime) {
                    const timeSinceLastCheck = now - parseInt(lastCheckTime, 10);
                    if (timeSinceLastCheck < UPDATE_CHECK_INTERVAL) {
                        console.log(`⏰ Update checked ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes ago. Skipping.`);
                        return;
                    }
                }

                const curVersion = DeviceInfo.getVersion();
                const buildNumber = DeviceInfo.getBuildNumber();
                console.log(`🔍 Checking for updates (v${curVersion} / build ${buildNumber})`);

                inAppUpdatesRef.current = new SpInAppUpdates(false);

                // Check without passing curVersion - let library handle comparison
                const result = await inAppUpdatesRef.current.checkNeedsUpdate() as UpdateResult;
                console.log('Update check result:', result);

                // Mark that we've checked (regardless of result)
                await AsyncStorage.setItem(LAST_CHECK_KEY, now.toString());
                hasChecked.current = true;

                if (result.shouldUpdate) {
                    const storeVersion = result.storeVersion || result.other?.storeVersion;
                    console.log(`📦 Store version: ${storeVersion}, Current: ${curVersion}`);

                    // Check if user already dismissed this version
                    const dismissedVersion = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
                    const updatePriority = result?.updatePriority || 0;
                    const isHighPriority = updatePriority >= HIGH_PRIORITY_UPDATE;

                    // Don't show flexible updates if user dismissed this version
                    if (!isHighPriority && dismissedVersion === storeVersion) {
                        console.log(`⏭️ User already dismissed update for v${storeVersion}`);
                        return;
                    }

                    // Add status update listener for flexible updates
                    if (!isHighPriority && inAppUpdatesRef.current) {
                        // Define the listener function
                        const statusListener: AndroidStatusEventListener = (status: StatusUpdateEvent) => {
                            console.log('📥 Update status:', status.status);

                            switch (status.status) {
                                case IAUInstallStatus.DOWNLOADED:
                                    console.log('✅ Update downloaded successfully!');
                                    console.log('🔄 Installing update now...');

                                    // Automatically install the update after download
                                    setTimeout(() => {
                                        if (inAppUpdatesRef.current) {
                                            // installUpdate() returns void, not a Promise
                                            try {
                                                inAppUpdatesRef.current.installUpdate();
                                                console.log('✅ Installation triggered - app will restart');
                                            } catch (err) {
                                                console.log('❌ Installation failed:', err);
                                            }
                                        }
                                    }, 500);
                                    break;

                                case IAUInstallStatus.DOWNLOADING:
                                    const bytesDownloaded = status.bytesDownloaded || 0;
                                    const totalBytes = status.totalBytesToDownload || 1;
                                    const progress = Math.round((bytesDownloaded / totalBytes) * 100);
                                    console.log(`⬇️ Downloading update: ${progress}%`);
                                    break;

                                case IAUInstallStatus.FAILED:
                                    console.log('❌ Update download/install failed');
                                    break;

                                case IAUInstallStatus.INSTALLED:
                                    console.log('✅ Update installed successfully!');
                                    break;

                                case IAUInstallStatus.INSTALLING:
                                    console.log('⚙️ Installing update...');
                                    break;

                                case IAUInstallStatus.PENDING:
                                    console.log('⏳ Update pending...');
                                    break;

                                case IAUInstallStatus.UNKNOWN:
                                    console.log('❓ Update status unknown');
                                    break;
                            }
                        };

                        // Store the listener reference for cleanup
                        statusListenerRef.current = statusListener;
                        inAppUpdatesRef.current.addStatusUpdateListener(statusListener);
                    }

                    const updateOptions: StartUpdateOptions =
                        Platform.select({
                            ios: {
                                title: 'Update available',
                                message: isHighPriority
                                    ? 'A critical update is required to continue using the app.'
                                    : 'A new version of the app is available. Would you like to update?',
                                buttonUpgradeText: 'Update',
                                buttonCancelText: isHighPriority ? undefined : 'Later',
                            },
                            android: {
                                updateType: isHighPriority
                                    ? IAUUpdateKind.IMMEDIATE
                                    : IAUUpdateKind.FLEXIBLE,
                            },
                        }) || { updateType: IAUUpdateKind.FLEXIBLE };

                    console.log('Starting update with type:', updateOptions);

                    try {
                        await inAppUpdatesRef.current.startUpdate(updateOptions);
                        console.log('✅ Update flow started successfully');
                    } catch (err) {
                        console.log('In-app update cancelled or failed:', err);

                        // Store dismissed version for flexible updates
                        if (!isHighPriority && storeVersion) {
                            await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, storeVersion);
                            console.log(`💾 Saved dismissed version: ${storeVersion}`);
                        }
                    }
                } else {
                    console.log('✅ App is already up to date.');
                    // Clear dismissed version when up to date
                    await AsyncStorage.removeItem(UPDATE_DISMISSED_KEY);
                }
            } catch (error) {
                console.log('❌ In-app update error:', error);
            }
        };

        if (Platform.OS === 'android') {
            checkForUpdates();
        }

        // Cleanup listener on unmount
        return () => {
            if (inAppUpdatesRef.current && statusListenerRef.current) {
                try {
                    // Pass the stored listener reference to remove it
                    inAppUpdatesRef.current.removeStatusUpdateListener(statusListenerRef.current);
                    console.log('🧹 Status listener removed');
                } catch (error) {
                    console.log('Error removing status listener:', error);
                }
            }
        };
    }, []);

    // Handle app state changes - check for pending updates when app resumes
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
            if (nextAppState === 'active' && Platform.OS === 'android') {
                try {
                    console.log('📱 App resumed - checking for pending updates...');

                    if (!inAppUpdatesRef.current) {
                        inAppUpdatesRef.current = new SpInAppUpdates(false);
                    }

                    // Check if there's a downloaded update waiting to be installed
                    const result = await inAppUpdatesRef.current.checkNeedsUpdate() as UpdateResult;

                    if (result.shouldUpdate) {
                        const updatePriority = result?.updatePriority || 0;
                        const isHighPriority = updatePriority >= HIGH_PRIORITY_UPDATE;

                        // If it's a flexible update that was downloaded, install it
                        if (!isHighPriority && inAppUpdatesRef.current) {
                            console.log('🔄 Found pending flexible update, installing...');
                            try {
                                // installUpdate() returns void
                                inAppUpdatesRef.current.installUpdate();
                                console.log('✅ Installation triggered');
                            } catch (err) {
                                console.log('❌ Installation failed:', err);
                            }
                        }
                    }
                } catch (error) {
                    console.log('Error checking pending update on resume:', error);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);
};

export default useInAppUpdate;