import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import notifee from '@notifee/react-native';

// ---------------- BACKGROUND HANDLER (must be top-level) ----------------
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📩 Background Notification:", remoteMessage);

  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    android: {
      channelId,
      sound: 'hollow',
    },
  });
});

// ---------------- FOREGROUND HANDLER ----------------
async function onForegroundMessage(message: any) {
  console.log("📩 Foreground Notification:", message);

  if (AppState.currentState === "active") {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    await notifee.displayNotification({
      title: message.notification?.title,
      body: message.notification?.body,
      android: {
        channelId,
        sound: 'hollow',
      },
    });
  }
}

// ---------------- MAIN HOOK ----------------
const usePushNotification = () => {

  useEffect(() => {
    const init = async () => {
      await notifee.requestPermission();
      const token = await getFcmToken();
      console.log("🌐 FCM Token:", token);
    };

    init();

    // Foreground Notification Listener
    const unsubscribeMessage = messaging().onMessage(onForegroundMessage);

    // When app opened from background
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📨 Opened from Background:', remoteMessage.notification);
    });

    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📨 Opened from Killed State:', remoteMessage.notification);
        }
      });

    // Subscribe to topic
    messaging().subscribeToTopic('allDevices');

    // Listen for token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log("🔄 Token Refreshed:", newToken);

      const oldToken = await AsyncStorage.getItem("fcmToken");

      if (oldToken !== newToken) {
        console.log("🔥 Updating stored FCM token...");
        await AsyncStorage.setItem("fcmToken", newToken);

        // Send updated token to backend
        // await sendTokenToServer(newToken);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, []);
};

// ---------------- TOKEN HANDLER ----------------
const getFcmToken = async () => {
  try {
    const oldToken = await AsyncStorage.getItem('fcmToken');
    const newToken = await messaging().getToken();

    if (!newToken) {
      console.log("⚠️ Failed to fetch FCM token");
      return null;
    }

    if (oldToken !== newToken) {
      console.log("🔥 New Token Generated:", newToken);
      await AsyncStorage.setItem('fcmToken', newToken);

      // await sendTokenToServer(newToken);
    } else {
      console.log("✔️ Token unchanged:", newToken);
    }

    return newToken;
  } catch (error) {
    console.log("❌ FCM Token Error:", error);
    return null;
  }
};

export default usePushNotification;
