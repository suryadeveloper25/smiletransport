// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   PermissionsAndroid,
//   Platform,
//   Alert,
//   AppState,
// } from 'react-native';
// import MapView, {
//   Marker,
//   Polyline,
//   PROVIDER_GOOGLE,
//   AnimatedRegion,
// } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
// import MaterialIcons from '@react-native-vector-icons/material-icons';
// import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';

// /* ---------------- CONSTANTS ---------------- */
// const DEFAULT_COORDINATE = {
//   latitude: 13.053215,
//   longitude: 80.224194,
// };

// const STOP_REACH_RADIUS = 30; // meters
// const GPS_UPDATE_INTERVAL = 2000; // 2 seconds
// const GPS_DISTANCE_FILTER = 5; // 5 meters
// const ANIMATION_DURATION = 3000; // 3 seconds per segment

// /* ---------------- TYPES ---------------- */
// interface Stop {
//   latitude: number;
//   longitude: number;
//   stop_name: string;
//   stop_Id: string;
//   route_Id: string;
//   passenger_count: number;
// }

// /* ---------------- SCREEN ---------------- */
// const HomeScreen = () => {
//   const navigation = useNavigation();
//   const mapRef = useRef<MapView>(null);
//   const watchId = useRef<number | null>(null);
//   const reachedStopsRef = useRef(new Set<number>());
//   const appState = useRef(AppState.currentState);
//   const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const currentStopIndexRef = useRef(0);

//   // State
//   const [driverName, setDriverName] = useState('');
//   const [path, setPath] = useState<Stop[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);
//   const [passengerCount, setPassengerCount] = useState(0);
//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [routeCompleted, setRouteCompleted] = useState(false);

//   const animatedCoordinate = useRef(
//     new AnimatedRegion({
//       ...DEFAULT_COORDINATE,
//       latitudeDelta: 0.01,
//       longitudeDelta: 0.01,
//     })
//   ).current;

//   /* ---------------- PERMISSIONS ---------------- */
//   const requestPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location for bus tracking',
//             buttonPositive: 'OK',
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.warn(err);
//         return false;
//       }
//     }
//     return true;
//   };

//   const setupLocationServices = () => {
//     LocationServicesDialogBox.checkLocationServicesIsEnabled({
//       message: `
//         <h6 style="margin:0 0 8px 0;">For accurate bus tracking, enable Location Services</h6>
//         <p style="margin:8px 0;">Please turn on:</p>
//         <ul style="padding-left:18px; margin:8px 0;">
//           <li><b>High Accuracy Mode</b></li>
//           <li><b>GPS Location</b></li>
//         </ul>
//       `,
//       ok: 'Turn on',
//       cancel: 'Cancel',
//       enableHighAccuracy: true,
//       showDialog: true,
//       openLocationServices: true,
//       preventOutSideTouch: false,
//       preventBackClick: false,
//       providerListener: false,
//     })
//       .then((success) => {
//         console.log('✅ Location services enabled:', success);
//       })
//       .catch((error) => {
//         console.log('❌ Location services error:', error.message);
//       });
//   };

//   /* ---------------- DATE/TIME HELPERS ---------------- */
//   const getCurrentISTDate = () => {
//     return new Date().toLocaleDateString('en-CA', {
//       timeZone: 'Asia/Kolkata',
//     });
//   };

//   const getCurrentISTTime = () => {
//     return new Date().toLocaleTimeString('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       hour12: false,
//     });
//   };

//   const saveTrackingState = async (value: boolean) => {
//     await AsyncStorage.setItem('isTracking', value ? '1' : '0');
//   };

//   const loadTrackingState = async () => {
//     const value = await AsyncStorage.getItem('isTracking');
//     return value === '1';
//   };

//   /* ---------------- DISTANCE CALCULATION ---------------- */
//   const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371000; // Earth's radius in meters
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);

//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
//   };

//   /* ---------------- NOTIFICATION ---------------- */
//   const showStopNotification = async (stopName: string, stopNumber: number, totalStops: number) => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'stop-reached',
//         name: 'Stop Reached',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '🚌 Stop Reached!',
//         body: `${stopName} - Stop ${stopNumber} of ${totalStops}`,
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           pressAction: {
//             id: 'default',
//           },
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   const showRouteCompletedNotification = async () => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'route-completed',
//         name: 'Route Completed',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '✅ Route Completed!',
//         body: 'All stops have been reached. Great job!',
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   /* ---------------- API CALLS ---------------- */
//   const sendNextStopNotification = async (currentStop: Stop, nextStop: Stop) => {
//     try {
//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       const params = {
//         orgId,
//         driver_Id: driverId,
//         route_Id: currentStop.route_Id,
//         current_stop_Id: currentStop.stop_Id,
//         next_stop_Id: nextStop.stop_Id,
//         next_stop_name: nextStop.stop_name,
//         triggered_date: getCurrentISTDate(),
//         triggered_time: getCurrentISTTime(),
//       };

//       console.log('📣 Sending NEXT STOP notification:', params);

//       const res = await axios.post(
//         'https://www.vtsmile.in/app/api/driver/next_stop_notification_api',
//         params
//       );

//       console.log('✅ Parent notification API response:', res.data);
//     } catch (error: any) {
//       console.error('❌ Next stop notification error:', error.message);
//     }
//   };

//   const fetchRouteFromAPI = async () => {
//     try {
//       setLoading(true);

//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         Alert.alert('Error', 'Driver credentials not found. Please login again.');
//         return;
//       }

//       const res = await axios.post(
//         `https://www.vtsmile.in/app/api/driver/route_track_plan_api?orgId=${orgId}&driver_Id=${driverId}`
//       );

//       console.log('📍 Route API Response:', res.data.trackPlanDetails);

//       if (res.data.isSuccess && res.data.trackPlanDetails?.length > 0) {
//         const route = res.data.trackPlanDetails.map((p: any) => ({
//           latitude: Number(p.latitude),
//           longitude: Number(p.longitude),
//           stop_name: p.stop_name,
//           stop_Id: p.stop_Id,
//           route_Id: p.route_Id,
//           passenger_count: Number(p.no_of_passengers) || 0,
//         }));

//         setPath(route);
//         await AsyncStorage.setItem('route_path', JSON.stringify(route));
        
//         // Set initial bus position to first stop
//         animatedCoordinate.setValue(route[0]);

//         // Zoom to show entire route
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(route, {
//             edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//             animated: true,
//           });
//         }, 500);
//       } else {
//         Alert.alert('No Route Found', 'No route assigned for today.');
//       }
//     } catch (error: any) {
//       console.error('❌ Fetch route error:', error);
//       Alert.alert('Error', `Failed to load route: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveStopReached = async (stop: Stop, stopIndex: number) => {
//     try {
//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         console.error('❌ Missing credentials');
//         return false;
//       }

//       const params = {
//         driver_Id: driverId,
//         orgId,
//         route_Id: stop.route_Id,
//         stop_name: stop.stop_Id,
//         stop_lat: stop.latitude.toString(),
//         stop_lng: stop.longitude.toString(),
//         reached_date: getCurrentISTDate(),
//         reached_time: getCurrentISTTime(),
//       };

//       console.log('💾 Saving stop data:', params);

//       const response = await axios.post(
//         'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
//         params
//       );

//       console.log('✅ Stop saved successfully:', response.data);

//       if (response.data.isSuccess) {
//         return true;
//       } else {
//         console.error('❌ Backend returned error:', response.data);
//         return false;
//       }
//     } catch (error: any) {
//       console.error('❌ Save stop reached error:', error.response?.data || error.message);
//       return false;
//     }
//   };

//   /* ---------------- SMOOTH ANIMATION LOGIC ---------------- */
//   const animateBusToNextStop = async (stopIndex: number) => {
//     if (stopIndex >= path.length) {
//       console.log('🏁 Route completed!');
//       setRouteCompleted(true);
//       stopTracking();
//       await showRouteCompletedNotification();
//       Alert.alert(
//         'Route Completed! 🎉',
//         'All stops have been reached successfully!',
//         [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
//       );
//       return;
//     }

//     const stop = path[stopIndex];
//     console.log(`🚌 Animating to stop ${stopIndex + 1}: ${stop.stop_name}`);

//     // Animate bus to this stop
//     animatedCoordinate.timing({
//       latitude: stop.latitude,
//       longitude: stop.longitude,
//       duration: ANIMATION_DURATION,
//       useNativeDriver: false,
//     }).start();

//     // Animate camera to follow
//     mapRef.current?.animateCamera(
//       {
//         center: { latitude: stop.latitude, longitude: stop.longitude },
//         zoom: 16,
//       },
//       { duration: ANIMATION_DURATION }
//     );

//     // Mark stop as reached
//     reachedStopsRef.current.add(stopIndex);
    
//     // Save to backend
//     const saved = await saveStopReached(stop, stopIndex);

//     if (saved) {
//       // Show notification
//       await showStopNotification(stop.stop_name, stopIndex + 1, path.length);

//       // Update passenger count
//       setPassengerCount((prev) => prev + stop.passenger_count);

//       // Notify next stop parents
//       const nextIndex = stopIndex + 1;
//       if (nextIndex < path.length) {
//         const nextStop = path[nextIndex];
//         await sendNextStopNotification(stop, nextStop);
//         console.log(`📣 Notified parents for NEXT STOP: ${nextStop.stop_name}`);
//       }
//     }

//     // Update current index
//     currentStopIndexRef.current = stopIndex;
//   };

//   const startSmoothAnimation = () => {
//     if (animationIntervalRef.current) {
//       clearInterval(animationIntervalRef.current);
//     }

//     let currentIndex = 0;

//     // Animate to first stop immediately
//     animateBusToNextStop(currentIndex);

//     // Set interval to move to next stops
//     animationIntervalRef.current = setInterval(() => {
//       currentIndex++;
      
//       if (currentIndex >= path.length) {
//         if (animationIntervalRef.current) {
//           clearInterval(animationIntervalRef.current);
//           animationIntervalRef.current = null;
//         }
//         return;
//       }

//       animateBusToNextStop(currentIndex);
//     }, ANIMATION_DURATION + 500); // Add 500ms delay between stops
//   };

//   /* ---------------- GPS TRACKING (Original Logic) ---------------- */
//   const onLocationUpdate = (position: any) => {
//     if (!path.length) return;

//     const { latitude, longitude, accuracy } = position.coords;

//     console.log(`📍 GPS Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy?.toFixed(1)}m)`);

//     setCurrentLocation({ latitude, longitude });

//     // Animate bus marker to new position
//     animatedCoordinate.timing({
//       latitude,
//       longitude,
//       duration: 1000,
//       useNativeDriver: false,
//     }).start();

//     // Keep camera following bus
//     mapRef.current?.animateCamera(
//       {
//         center: { latitude, longitude },
//         zoom: 16,
//       },
//       { duration: 1000 }
//     );

//     // Check if reached any stop
//     checkStopReached(latitude, longitude);
//   };

//   const checkStopReached = async (lat: number, lng: number) => {
//     if (!path.length || !isTracking) return;

//     for (let i = 0; i < path.length; i++) {
//       if (reachedStopsRef.current.has(i)) continue;

//       const stop = path[i];
//       const dist = getDistance(lat, lng, stop.latitude, stop.longitude);

//       console.log(`📏 Distance to stop ${i + 1} (${stop.stop_name}): ${dist.toFixed(2)}m`);

//       if (dist <= STOP_REACH_RADIUS) {
//         console.log(`🎯 Stop ${i + 1} reached: ${stop.stop_name}`);

//         reachedStopsRef.current.add(i);

//         const saved = await saveStopReached(stop, i);

//         if (saved) {
//           await showStopNotification(stop.stop_name, i + 1, path.length);
//           setPassengerCount((prev) => prev + stop.passenger_count);

//           const nextIndex = i + 1;
//           if (nextIndex < path.length) {
//             const nextStop = path[nextIndex];
//             await sendNextStopNotification(stop, nextStop);
//             console.log(`📣 Notified parents for NEXT STOP: ${nextStop.stop_name}`);
//           }

//           if (reachedStopsRef.current.size === path.length) {
//             console.log('🏁 Route completed!');
//             setRouteCompleted(true);
//             stopTracking();
//             await showRouteCompletedNotification();
//             Alert.alert(
//               'Route Completed! 🎉',
//               'All stops have been reached successfully!',
//               [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
//             );
//           }
//         }

//         break;
//       }
//     }
//   };

//   /* ---------------- TRACKING CONTROL ---------------- */
//   const startTracking = async () => {
//     if (isTracking || !path.length) {
//       if (!path.length) {
//         Alert.alert('No Route', 'Please load a route first');
//       }
//       return;
//     }

//     const hasPermission = await requestPermission();
//     if (!hasPermission) {
//       Alert.alert('Permission Required', 'Location permission is required for tracking');
//       return;
//     }

//     setIsTracking(true);
//     await saveTrackingState(true);
//     console.log('🚀 Starting smooth bus animation...');

//     // Start smooth animation through all stops
//     startSmoothAnimation();

//     // Also start GPS tracking for real-time updates (optional)
//     // Comment this out if you only want simulated movement
//     watchId.current = Geolocation.watchPosition(
//       (position) => {
//         onLocationUpdate(position);
//       },
//       (error) => {
//         console.error('GPS Error:', error);
//       },
//       {
//         enableHighAccuracy: true,
//         distanceFilter: GPS_DISTANCE_FILTER,
//         interval: GPS_UPDATE_INTERVAL,
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       }
//     );
//   };

//   const stopTracking = async () => {
//     console.log('🛑 Stopping tracking...');
//     setIsTracking(false);
//     await saveTrackingState(false);

//     // Clear animation interval
//     if (animationIntervalRef.current) {
//       clearInterval(animationIntervalRef.current);
//       animationIntervalRef.current = null;
//     }

//     // Clear GPS watch
//     if (watchId.current !== null) {
//       Geolocation.clearWatch(watchId.current);
//       watchId.current = null;
//     }
//   };

//   /* ---------------- LIFECYCLE ---------------- */
//   useFocusEffect(
//     useCallback(() => {
//       (async () => {
//         const saved = await AsyncStorage.getItem('route_path');

//         if (saved) {
//           const savedRoute = JSON.parse(saved);
//           setPath(savedRoute);

//           if (savedRoute.length > 0) {
//             animatedCoordinate.setValue(savedRoute[0]);

//             setTimeout(() => {
//               mapRef.current?.fitToCoordinates(savedRoute, {
//                 edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//                 animated: true,
//               });
//             }, 300);
//           }
//         } else {
//           await fetchRouteFromAPI();
//         }

//         const tracking = await loadTrackingState();
//         setIsTracking(tracking);
//       })();

//       return () => {};
//     }, [])
//   );

//   useFocusEffect(
//     useCallback(() => {
//       if (path && path.length > 0) {
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(path, {
//             edgePadding: { top: 80, bottom: 80, left: 50, right: 50 },
//             animated: true,
//           });
//         }, 300);
//       }
//     }, [path])
//   );

//   useEffect(() => {
//     setupLocationServices();
//     requestPermission();
//     AsyncStorage.getItem('driver_name').then((n) => setDriverName(n || 'Driver'));

//     const subscription = AppState.addEventListener('change', (nextAppState) => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         console.log('App has come to the foreground');
//       }
//       appState.current = nextAppState;
//     });

//     return () => {
//       LocationServicesDialogBox.stopListener();
//       subscription.remove();
//       stopTracking();
//     };
//   }, []);

//   /* ---------------- UI ---------------- */
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#0e0868ff" />
//         <Text style={{ marginTop: 10 }}>Loading route...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
//       <View style={{ flex: 1, backgroundColor: '#fff' }}>
//         {/* Header */}
//         <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', width: "100%" }}>
//           <LinearGradient
//             colors={['#ff9f43', '#feca57']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 0, y: 0.9 }}
//             style={{ height: 60, flexDirection: 'row', alignItems: 'center', width: "100%" }}
//           >
//             <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
//               <MaterialIcons name="menu" size={24} color="#fff" style={{ margin: 18 }} />
//             </TouchableOpacity>
//             <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Bus Live Tracking</Text>
//           </LinearGradient>
//         </View>

//         {/* Map */}
//         <MapView
//           ref={mapRef}
//           provider={PROVIDER_GOOGLE}
//           style={{ flex: 1 }}
//           initialRegion={{
//             ...DEFAULT_COORDINATE,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//           }}
//           showsUserLocation={true}
//           showsMyLocationButton={true}
//           followsUserLocation={false}
//           showsCompass={true}
//           showsTraffic={false}
//         >
//           {/* Route Polyline */}
//           {path.length > 1 && (
//             <Polyline
//               coordinates={path.map((p) => ({
//                 latitude: p.latitude,
//                 longitude: p.longitude,
//               }))}
//               strokeWidth={4}
//               strokeColor="#1abc9c"
//               lineDashPattern={[1]}
//             />
//           )}

//           {/* Animated Bus Marker */}
//           <Marker.Animated coordinate={animatedCoordinate} anchor={{ x: 0.5, y: 0.5 }} flat={true}>
//             <View style={{ alignItems: 'center' }}>
//               <Text style={{ fontSize: 40 }}>🚌</Text>
//             </View>
//           </Marker.Animated>

//           {/* Stop Markers */}
//           {path.map((stop, i) => {
//             const isReached = reachedStopsRef.current.has(i);
//             return (
//               <Marker
//                 key={`stop-${i}`}
//                 coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
//                 title={`${i + 1}. ${stop.stop_name}`}
//                 description={`Passengers: ${stop.passenger_count}`}
//                 pinColor={isReached ? '#27ae60' : '#e74c3c'}
//               >
//                 <View style={{ alignItems: 'center' }}>
//                   <View
//                     style={{
//                       backgroundColor: isReached ? '#27ae60' : '#e74c3c',
//                       borderRadius: 20,
//                       padding: 8,
//                       borderWidth: 2,
//                       borderColor: '#fff',
//                     }}
//                   >
//                     <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</Text>
//                   </View>
//                 </View>
//               </Marker>
//             );
//           })}
//         </MapView>

//         {/* Bottom Controls */}
//         <View style={{ padding: 15, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderTopColor: '#ddd' }}>
//           {/* Info Section */}
//           <View style={{ marginBottom: 10 }}>
//             <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>👨‍✈️ Driver: {driverName}</Text>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//               <Text style={{ fontSize: 14 }}>
//                 👥 Passengers: <Text style={{ fontWeight: 'bold' }}>{passengerCount}</Text>
//               </Text>
//               <Text style={{ fontSize: 14 }}>
//                 🛑 Stops: <Text style={{ fontWeight: 'bold' }}>{reachedStopsRef.current.size} / {path.length}</Text>
//               </Text>
//             </View>
//             {isTracking && (
//               <Text style={{ fontSize: 12, color: '#27ae60', marginTop: 5 }}>
//                 ● Tracking Active
//               </Text>
//             )}
//           </View>

//           {/* Control Buttons */}
//           <View style={{ flexDirection: 'row', gap: 8 }}>
//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: isTracking || !path.length ? '#95a5a6' : '#27ae60',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={isTracking || !path.length}
//               onPress={startTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 START
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: !isTracking ? '#95a5a6' : '#e74c3c',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={!isTracking}
//               onPress={stopTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 STOP
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {routeCompleted && (
//             <View
//               style={{
//                 backgroundColor: '#27ae60',
//                 padding: 12,
//                 borderRadius: 8,
//                 marginTop: 10,
//               }}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
//                 ✅ Route Completed Successfully!
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;




import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  AppState,
  BackHandler,
  Modal,Image
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  AnimatedRegion,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Divider } from 'react-native-paper';
import { fonts } from '../Root/Config';
import axios from 'axios';

/* ---------------- CONSTANTS ---------------- */
const DEFAULT_COORDINATE = {
  latitude: 13.053215,
  longitude: 80.224194,
};

const STOP_REACH_RADIUS = 30; // meters
const GPS_UPDATE_INTERVAL = 2000; // 2 seconds
const GPS_DISTANCE_FILTER = 5; // 5 meters

/* ---------------- TYPES ---------------- */
interface Stop {
  latitude: number;
  longitude: number;
  stop_name: string;
  stop_Id: string;
  route_Id: string;
  passenger_count: number;
}

/* ---------------- SCREEN ---------------- */
const HomeScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const watchId = useRef<number | null>(null);
  const reachedStopsRef = useRef(new Set<number>());
  const appState = useRef(AppState.currentState);
  const isAnimatingRef = useRef(false); // Prevent animation conflicts

  // State
  const [driverName, setDriverName] = useState('');
  const [path, setPath] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [passengerCount, setPassengerCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      ...DEFAULT_COORDINATE,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  /* ---------------- PERMISSIONS ---------------- */
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for bus tracking',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const setupLocationServices = () => {
    LocationServicesDialogBox.checkLocationServicesIsEnabled({
      message: `
        <h6 style="margin:0 0 8px 0;">For accurate bus tracking, enable Location Services</h6>
        <p style="margin:8px 0;">Please turn on:</p>
        <ul style="padding-left:18px; margin:8px 0;">
          <li><b>High Accuracy Mode</b></li>
          <li><b>GPS Location</b></li>
        </ul>
      `,
      ok: 'Turn on',
      cancel: 'Cancel',
      enableHighAccuracy: true,
      showDialog: true,
      openLocationServices: true,
      preventOutSideTouch: false,
      preventBackClick: false,
      providerListener: false,
    })
      .then((success) => {
        console.log('✅ Location services enabled:', success);
      })
      .catch((error) => {
        console.log('❌ Location services error:', error.message);
      });
  };

  /* ---------------- DATE/TIME HELPERS ---------------- */
  const getCurrentISTDate = () => {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
  };

  const getCurrentISTTime = () => {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    });
  };

  const saveTrackingState = async (value: boolean) => {
    await AsyncStorage.setItem('isTracking', value ? '1' : '0');
  };

  const loadTrackingState = async () => {
    const value = await AsyncStorage.getItem('isTracking');
    return value === '1';
  };

  // Save and load reached stops
  const saveReachedStops = async (stops: Set<number>) => {
    await AsyncStorage.setItem('reachedStops', JSON.stringify(Array.from(stops)));
  };

  const loadReachedStops = async () => {
    const saved = await AsyncStorage.getItem('reachedStops');
    if (saved) {
      return new Set<number>(JSON.parse(saved));
    }
    return new Set<number>();
  };

  // Save passenger count
  const savePassengerCount = async (count: number) => {
    await AsyncStorage.setItem('passengerCount', count.toString());
  };

  const loadPassengerCount = async () => {
    const saved = await AsyncStorage.getItem('passengerCount');
    return saved ? parseInt(saved, 10) : 0;
  };

  /* ---------------- DISTANCE CALCULATION ---------------- */
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  /* ---------------- NOTIFICATION ---------------- */
  const showStopNotification = async (stopName: string, stopNumber: number, totalStops: number) => {
    try {
      const channelId = await notifee.createChannel({
        id: 'stop-reached',
        name: 'Stop Reached',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.displayNotification({
        title: '🚌 Stop Reached!',
        body: `${stopName} - Stop ${stopNumber} of ${totalStops}`,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const showRouteCompletedNotification = async () => {
    try {
      const channelId = await notifee.createChannel({
        id: 'route-completed',
        name: 'Route Completed',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      await notifee.displayNotification({
        title: '✅ Route Completed!',
        body: 'All stops have been reached. Great job!',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  /* ---------------- API CALLS ---------------- */
  const sendNextStopNotification = async (currentStop: Stop, nextStop: Stop) => {
    try {
      const orgId = await AsyncStorage.getItem('orgId');
      const driverId = await AsyncStorage.getItem('driver_Id');

      const params = {
        orgId,
        driver_Id: driverId,
        route_Id: currentStop.route_Id,
        current_stop_Id: currentStop.stop_Id,
        next_stop_Id: nextStop.stop_Id,
        next_stop_name: nextStop.stop_name,
        triggered_date: getCurrentISTDate(),
        triggered_time: getCurrentISTTime(),
      };

      console.log('📣 Sending NEXT STOP notification:', params);

      const res = await axios.post(
        'https://www.vtsmile.in/app/api/driver/next_stop_notification_api',
        params
      );

      console.log('✅ Parent notification API response:', res.data);
    } catch (error: any) {
      console.error('❌ Next stop notification error:', error.message);
    }
  };

  const fetchRouteFromAPI = async () => {
    try {
      setLoading(true);

      const orgId = await AsyncStorage.getItem('orgId');
      const driverId = await AsyncStorage.getItem('driver_Id');

      if (!orgId || !driverId) {
        Alert.alert('Error', 'Driver credentials not found. Please login again.');
        return;
      }

      const res = await axios.post(
        `https://www.vtsmile.in/app/api/driver/route_track_plan_api?orgId=${orgId}&driver_Id=${driverId}`
      );

      console.log('📍 Route API Response:', res.data.trackPlanDetails);

      if (res.data.isSuccess && res.data.trackPlanDetails?.length > 0) {
        const route = res.data.trackPlanDetails.map((p: any) => ({
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          stop_name: p.stop_name,
          stop_Id: p.stop_Id,
          route_Id: p.route_Id,
          passenger_count: Number(p.no_of_passengers) || 0,
        }));

        setPath(route);
        await AsyncStorage.setItem('route_path', JSON.stringify(route));
        
        // Set initial bus position to first stop
        animatedCoordinate.setValue(route[0]);

        // Zoom to show entire route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(route, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }, 500);
      } else {
        Alert.alert('No Route Found', 'No route assigned for today.');
      }
    } catch (error: any) {
      console.error('❌ Fetch route error:', error);
      Alert.alert('Error', `Failed to load route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveStopReached = async (stop: Stop, stopIndex: number) => {
    try {
      const orgId = await AsyncStorage.getItem('orgId');
      const driverId = await AsyncStorage.getItem('driver_Id');

      if (!orgId || !driverId) {
        console.error('❌ Missing credentials');
        return false;
      }

      const params = {
        driver_Id: driverId,
        orgId,
        route_Id: stop.route_Id,
        stop_name: stop.stop_Id,
        stop_lat: stop.latitude.toString(),
        stop_lng: stop.longitude.toString(),
        reached_date: getCurrentISTDate(),
        reached_time: getCurrentISTTime(),
      };

      console.log('💾 Saving stop data:', params);

      const response = await axios.post(
        'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
        params
      );

      console.log('✅ Stop saved successfully:', response.data);

      if (response.data.isSuccess) {
        return true;
      } else {
        console.error('❌ Backend returned error:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Save stop reached error:', error.response?.data || error.message);
      return false;
    }
  };

  /* ---------------- STOP DETECTION ---------------- */
  const checkStopReached = async (lat: number, lng: number) => {
    if (!path.length || !isTracking) return;

    for (let i = 0; i < path.length; i++) {
      if (reachedStopsRef.current.has(i)) continue;

      const stop = path[i];
      const dist = getDistance(lat, lng, stop.latitude, stop.longitude);

      console.log(`📏 Distance to stop ${i + 1} (${stop.stop_name}): ${dist.toFixed(2)}m`);

      if (dist <= STOP_REACH_RADIUS) {
        console.log(`🎯 Stop ${i + 1} reached: ${stop.stop_name}`);

        reachedStopsRef.current.add(i);
        await saveReachedStops(reachedStopsRef.current);

        const saved = await saveStopReached(stop, i);

        if (saved) {
          await showStopNotification(stop.stop_name, i + 1, path.length);

          const newCount = passengerCount + stop.passenger_count;
          setPassengerCount(newCount);
          await savePassengerCount(newCount);

          const nextIndex = i + 1;
          if (nextIndex < path.length) {
            const nextStop = path[nextIndex];
            await sendNextStopNotification(stop, nextStop);
            console.log(`📣 Notified parents for NEXT STOP: ${nextStop.stop_name}`);
          }

          if (reachedStopsRef.current.size === path.length) {
            console.log('🏁 Route completed!');
            setRouteCompleted(true);
            stopTracking();
            await showRouteCompletedNotification();
            Alert.alert(
              'Route Completed! 🎉',
              'All stops have been reached successfully!',
              [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
            );
          }
        }

        break;
      }
    }
  };

  /* ---------------- GPS TRACKING ---------------- */
  const onLocationUpdate = (position: any) => {
    if (!path.length) return;

    const { latitude, longitude, accuracy } = position.coords;

    console.log(`📍 GPS Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy?.toFixed(1)}m)`);

    setCurrentLocation({ latitude, longitude });

    // Use timing animation with ref check to prevent conflicts
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      
      animatedCoordinate.timing({
        latitude,
        longitude,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        isAnimatingRef.current = false;
      });

      // Keep camera following bus
      mapRef.current?.animateCamera(
        {
          center: { latitude, longitude },
          zoom: 16,
        },
        { duration: 1000 }
      );
    }

    // Check if reached any stop
    checkStopReached(latitude, longitude);
  };

  const startTracking = async () => {
    if (isTracking) {
      console.log('⚠️ Already tracking');
      return;
    }

    if (!path.length) {
      Alert.alert('No Route', 'Please load a route first');
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is required for tracking');
      return;
    }

    setIsTracking(true);
    await saveTrackingState(true);
    console.log('🚀 Starting GPS tracking...');

    watchId.current = Geolocation.watchPosition(
      (position) => {
        onLocationUpdate(position);
      },
      (error) => {
        console.error('GPS Error:', error);
        Alert.alert('GPS Error', `Unable to get location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: GPS_DISTANCE_FILTER,
        interval: GPS_UPDATE_INTERVAL,
        fastestInterval: 1000,
        showLocationDialog: true,
        forceRequestLocation: true,
      }
    );
  };

  const stopTracking = async () => {
    console.log('🛑 Stopping GPS tracking...');
    setIsTracking(false);
    await saveTrackingState(false);

    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const handleExitApp = () => {
    setCustomAlertVisible(false);
    setTimeout(() => {
      BackHandler.exitApp();
    }, 100);
  };

  /* ---------------- LIFECYCLE ---------------- */
  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Restore route
        const saved = await AsyncStorage.getItem('route_path');
        if (saved) {
          const savedRoute = JSON.parse(saved);
          setPath(savedRoute);

          if (savedRoute.length > 0) {
            animatedCoordinate.setValue(savedRoute[0]);

            setTimeout(() => {
              mapRef.current?.fitToCoordinates(savedRoute, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }, 300);
          }
        } else {
          await fetchRouteFromAPI();
        }

        // Restore reached stops and passenger count
        const reachedStops = await loadReachedStops();
        reachedStopsRef.current = reachedStops;
        
        const savedPassengers = await loadPassengerCount();
        setPassengerCount(savedPassengers);

        // Restore tracking state and RESUME GPS if needed
        const tracking = await loadTrackingState();
        if (tracking && saved) {
          console.log('🔄 Resuming tracking from previous session...');
          setIsTracking(true);
          
          // Restart GPS watching
          const hasPermission = await requestPermission();
          if (hasPermission) {
            watchId.current = Geolocation.watchPosition(
              (position) => {
                onLocationUpdate(position);
              },
              (error) => {
                console.error('GPS Error on resume:', error);
              },
              {
                enableHighAccuracy: true,
                distanceFilter: GPS_DISTANCE_FILTER,
                interval: GPS_UPDATE_INTERVAL,
                fastestInterval: 1000,
                showLocationDialog: true,
                forceRequestLocation: true,
              }
            );
          }
        }
      })();

      return () => {
        // Don't stop tracking when navigating away
        // stopTracking();
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (path && path.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(path, {
            edgePadding: { top: 80, bottom: 80, left: 50, right: 50 },
            animated: true,
          });
        }, 300);
      }
    }, [path])
  );

  useEffect(() => {
    setupLocationServices();
    requestPermission();
    AsyncStorage.getItem('driver_name').then((n) => setDriverName(n || 'Driver'));

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
      }
      appState.current = nextAppState;
    });

    return () => {
      LocationServicesDialogBox.stopListener();
      subscription.remove();
      stopTracking();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setCustomAlertVisible(true);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0e0868ff" />
        <Text style={{ marginTop: 10 }}>Loading route...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', width: "100%" }}>
          <LinearGradient
            colors={['#ff9f43', '#feca57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.9 }}
            style={{ height: 60, flexDirection: 'row', alignItems: 'center', width: "100%" }}
          >
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <MaterialIcons name="menu" size={24} color="#fff" style={{ margin: 18 }} />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Bus Live Tracking</Text>
          </LinearGradient>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            ...DEFAULT_COORDINATE,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={isTracking}
          showsCompass={true}
          showsTraffic={false}
        >
          {/* Route Polyline */}
          {path.length > 1 && (
            <Polyline
              coordinates={path.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))}
              strokeWidth={4}
              strokeColor="#1abc9c"
              lineDashPattern={[1]}
            />
          )}

          {/* Animated Bus Marker */}
          <Marker.Animated coordinate={animatedCoordinate} anchor={{ x: 0.5, y: 0.5 }} flat={true}>
            <View style={{ alignItems: 'center' }}>
              <Image 
              source={require("../assets/bus_4256435.png")}
              style={{width: 30, height: 30, tintColor:'#fff202ff'}} />
              {/* <Text style={{ fontSize: 40 }}>🚌</Text> */}
            </View>
          </Marker.Animated>

          {/* Stop Markers */}
          {path.map((stop, i) => {
            const isReached = reachedStopsRef.current.has(i);
            return (
              <Marker
                key={`stop-${i}`}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={`${i + 1}. ${stop.stop_name}`}
                description={`Passengers: ${stop.passenger_count}`}
                pinColor={isReached ? '#27ae60' : '#e74c3c'}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: isReached ? '#27ae60' : '#e74c3c',
                      borderRadius: 20,
                      padding: 8,
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</Text>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Bottom Controls */}
        <View style={{ padding: 15, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderTopColor: '#ddd' }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>👨‍✈️ Driver: {driverName}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14 }}>
                👥 Passengers: <Text style={{ fontWeight: 'bold' }}>{passengerCount}</Text>
              </Text>
              <Text style={{ fontSize: 14 }}>
                🛑 Stops: <Text style={{ fontWeight: 'bold' }}>{reachedStopsRef.current.size} / {path.length}</Text>
              </Text>
            </View>
            {isTracking && (
              <Text style={{ fontSize: 12, color: '#27ae60', marginTop: 5 }}>
                ● Tracking Active
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: isTracking || !path.length ? '#95a5a6' : '#27ae60',
                padding: 14,
                borderRadius: 8,
                elevation: 2,
              }}
              disabled={isTracking || !path.length}
              onPress={startTracking}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                START
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: !isTracking ? '#95a5a6' : '#e74c3c',
                padding: 14,
                borderRadius: 8,
                elevation: 2,
              }}
              disabled={!isTracking}
              onPress={stopTracking}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                STOP
              </Text>
            </TouchableOpacity>
          </View>

          {routeCompleted && (
            <View
              style={{
                backgroundColor: '#27ae60',
                padding: 12,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                ✅ Route Completed Successfully!
              </Text>
            </View>
          )}
        </View>

        <Modal
          visible={customAlertVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomAlertVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <View style={{
              width: "80%", height: 180,
              backgroundColor: "#fbfbfbff",
              borderRadius: 12,
              padding: 20,
              alignItems: "center"
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#c34646ff",
                marginBottom: 10, bottom: 5, marginLeft: 10
              }}>
                Confirm Exit
              </Text>
              <MaterialIcons name="crisis-alert" size={24} style={{ right: 65, bottom: 40, color: "#981313ff" }} />
              <Divider style={{ height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%', bottom: 35 }} />

              <Text style={{
                fontSize: 15,
                fontFamily: fonts.FONT_MEDIUM,
                color: "#5e5d5dff",
                marginBottom: 20,
                textAlign: "center", bottom: 30
              }}>
                Are you sure you want to exit?
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", bottom: 25 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#bcc6fbff",
                    paddingVertical: 10,
                    paddingHorizontal: 30,
                    borderRadius: 15,
                    marginRight: 10
                  }}
                  onPress={() => setCustomAlertVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>No</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#e53935",
                    paddingVertical: 10,
                    paddingHorizontal: 30,
                    borderRadius: 15, marginLeft: 10
                  }}
                  onPress={handleExitApp}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   PermissionsAndroid,
//   Platform,
//   Alert,
//   AppState,
//   BackHandler,
//   Modal,
// } from 'react-native';
// import MapView, {
//   Marker,
//   Polyline,
//   PROVIDER_GOOGLE,
//   AnimatedRegion,
// } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
// import MaterialIcons from '@react-native-vector-icons/material-icons';
// import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import { Divider } from 'react-native-paper';
// import { fonts } from '../Root/Config';

// /* ---------------- CONSTANTS ---------------- */
// const DEFAULT_COORDINATE = {
//   latitude: 13.053215,
//   longitude: 80.224194,
// };

// const STOP_REACH_RADIUS = 30; // meters
// const GPS_UPDATE_INTERVAL = 2000; // 2 seconds
// const GPS_DISTANCE_FILTER = 5; // 5 meters

// /* ---------------- TYPES ---------------- */
// interface Stop {
//   latitude: number;
//   longitude: number;
//   stop_name: string;
//   stop_Id: string;
//   route_Id: string;
//   passenger_count: number;
// }

// /* ---------------- SCREEN ---------------- */
// const HomeScreen = () => {
//   const navigation = useNavigation();
//   const mapRef = useRef<MapView>(null);
//   const watchId = useRef<number | null>(null);
//   const reachedStopsRef = useRef(new Set<number>());
//   const appState = useRef(AppState.currentState);

//   // State
//   const [driverName, setDriverName] = useState('');
//   const [path, setPath] = useState<Stop[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);
//   const [passengerCount, setPassengerCount] = useState(0);
//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [routeCompleted, setRouteCompleted] = useState(false);
//   const [customAlertVisible, setCustomAlertVisible] = useState(false);
  
//   const animatedCoordinate = useRef(
//     new AnimatedRegion({
//       ...DEFAULT_COORDINATE,
//       latitudeDelta: 0.01,
//       longitudeDelta: 0.01,
//     })
//   ).current;

//   /* ---------------- PERMISSIONS ---------------- */
//   const requestPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location for bus tracking',
//             buttonPositive: 'OK',
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.warn(err);
//         return false;
//       }
//     }
//     return true;
//   };

//   const setupLocationServices = () => {
//     LocationServicesDialogBox.checkLocationServicesIsEnabled({
//       message: `
//         <h6 style="margin:0 0 8px 0;">For accurate bus tracking, enable Location Services</h6>
//         <p style="margin:8px 0;">Please turn on:</p>
//         <ul style="padding-left:18px; margin:8px 0;">
//           <li><b>High Accuracy Mode</b></li>
//           <li><b>GPS Location</b></li>
//         </ul>
//       `,
//       ok: 'Turn on',
//       cancel: 'Cancel',
//       enableHighAccuracy: true,
//       showDialog: true,
//       openLocationServices: true,
//       preventOutSideTouch: false,
//       preventBackClick: false,
//       providerListener: false,
//     })
//       .then((success) => {
//         console.log('✅ Location services enabled:', success);
//       })
//       .catch((error) => {
//         console.log('❌ Location services error:', error.message);
//         // Alert.alert('Location Required', 'Please enable location services to use bus tracking');
//       });
//   };

//   /* ---------------- DATE/TIME HELPERS ---------------- */
//   const getCurrentISTDate = () => {
//     return new Date().toLocaleDateString('en-CA', {
//       timeZone: 'Asia/Kolkata',
//     });
//   };

//   const getCurrentISTTime = () => {
//     return new Date().toLocaleTimeString('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       hour12: false,
//     });
//   };


//   const saveTrackingState = async (value: boolean) => {
//   await AsyncStorage.setItem('isTracking', value ? '1' : '0');
// };

// const loadTrackingState = async () => {
//   const value = await AsyncStorage.getItem('isTracking');
//   return value === '1';
// };

//   /* ---------------- DISTANCE CALCULATION ---------------- */
//   const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371000; // Earth's radius in meters
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);

//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
//   };

//   /* ---------------- NOTIFICATION ---------------- */
//   const showStopNotification = async (stopName: string, stopNumber: number, totalStops: number) => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'stop-reached',
//         name: 'Stop Reached',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '🚌 Stop Reached!',
//         body: `${stopName} - Stop ${stopNumber} of ${totalStops}`,
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           pressAction: {
//             id: 'default',
//           },
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   const showRouteCompletedNotification = async () => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'route-completed',
//         name: 'Route Completed',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '✅ Route Completed!',
//         body: 'All stops have been reached. Great job!',
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   /* ---------------- API CALLS ---------------- */

//   const sendNextStopNotification = async (currentStop: Stop, nextStop: Stop) => {
//   try {
//     const orgId = await AsyncStorage.getItem('orgId');
//     const driverId = await AsyncStorage.getItem('driver_Id');

//     const params = {
//       orgId,
//       driver_Id: driverId,
//       route_Id: currentStop.route_Id,
//       current_stop_Id: currentStop.stop_Id,
//       next_stop_Id: nextStop.stop_Id,
//       next_stop_name: nextStop.stop_name,
//       triggered_date: getCurrentISTDate(),
//       triggered_time: getCurrentISTTime(),
//     };

//     console.log('📣 Sending NEXT STOP notification:', params);

//     const res = await axios.post(
//       'https://www.vtsmile.in/app/api/driver/next_stop_notification_api',
//       params
//     );

//     console.log('✅ Parent notification API response:', res.data);
//   } catch (error: any) {
//     console.error('❌ Next stop notification error:', error.message);
//   }
// };

//   const fetchRouteFromAPI = async () => {
//     try {
//       setLoading(true);
//       // reachedStopsRef.current.clear();
//       // setPassengerCount(0);
//       // setRouteCompleted(false);

//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         Alert.alert('Error', 'Driver credentials not found. Please login again.');
//         return;
//       }

//       const res = await axios.post(
//         `https://www.vtsmile.in/app/api/driver/route_track_plan_api?orgId=${orgId}&driver_Id=${driverId}`
//       );

//       console.log('📍 Route API Response:', res.data.trackPlanDetails);

//       if (res.data.isSuccess && res.data.trackPlanDetails?.length > 0) {
//         const route = res.data.trackPlanDetails.map((p: any) => ({
//           latitude: Number(p.latitude),
//           longitude: Number(p.longitude),
//           stop_name: p.stop_name,
//           stop_Id: p.stop_Id,
//           route_Id: p.route_Id,
//           passenger_count: Number(p.no_of_passengers) || 0,
//         }));

//         setPath(route);
//        await AsyncStorage.setItem('route_path', JSON.stringify(route));
//         // Set initial bus position to first stop
//         animatedCoordinate.setValue(route[0]);

//         // Zoom to show entire route
//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(route, {
//             edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//             animated: true,
//           });
//         }, 500);

//         // Alert.alert('Route Loaded', `${route.length} stops loaded successfully!`);
//       } else {
//         Alert.alert('No Route Found', 'No route assigned for today.');
//       }
//     } catch (error: any) {
//       console.error('❌ Fetch route error:', error);
//       Alert.alert('Error', `Failed to load route: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveStopReached = async (stop: Stop, stopIndex: number) => {
//     try {
//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         console.error('❌ Missing credentials');
//         return false;
//       }

//       const params = {
//         driver_Id: driverId,
//         orgId,
//         route_Id: stop.route_Id,
//         stop_name: stop.stop_Id,
//         stop_lat: stop.latitude.toString(),
//         stop_lng: stop.longitude.toString(),
//         reached_date: getCurrentISTDate(),
//         reached_time: getCurrentISTTime(),
//       };

//       console.log('💾 Saving stop data:', params);

//       const response = await axios.post(
//         'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
//         params
//       );

//       console.log('✅ Stop saved successfully:', response.data);

//       if (response.data.isSuccess) {
//         return true;
//       } else {
//         console.error('❌ Backend returned error:', response.data);
//         return false;
//       }
//     } catch (error: any) {
//       console.error('❌ Save stop reached error:', error.response?.data || error.message);
//       return false;
//     }
//   };

//   /* ---------------- STOP DETECTION ---------------- */
//   const checkStopReached = async (lat: number, lng: number) => {
//     if (!path.length || !isTracking) return;

//     for (let i = 0; i < path.length; i++) {
//       // Skip already reached stops
//       if (reachedStopsRef.current.has(i)) continue;

//       const stop = path[i];
//       const dist = getDistance(lat, lng, stop.latitude, stop.longitude);

//       console.log(`📏 Distance to stop ${i + 1} (${stop.stop_name}): ${dist.toFixed(2)}m`);

//       if (dist <= STOP_REACH_RADIUS) {
//         console.log(`🎯 Stop ${i + 1} reached: ${stop.stop_name}`);

//         // Mark as reached
//         reachedStopsRef.current.add(i);

//         // Save to backend
//         const saved = await saveStopReached(stop, i);

//         if (saved) {
//           // Show notification
//           await showStopNotification(stop.stop_name, i + 1, path.length);

//           // Update passenger count
//           setPassengerCount((prev) => prev + stop.passenger_count);

//               // notify next stop parents
//     const nextIndex = i + 1;

//     if (nextIndex < path.length) {
//       const nextStop = path[nextIndex];

//       await sendNextStopNotification(stop, nextStop);

//       console.log(
//         `📣 Notified parents for NEXT STOP: ${nextStop.stop_name}`
//       );
//     }

//           // Check if route is completed
//           if (reachedStopsRef.current.size === path.length) {
//             console.log('🏁 Route completed!');
//             setRouteCompleted(true);
//             stopTracking();
//             await showRouteCompletedNotification();
//             Alert.alert(
//               'Route Completed! 🎉',
//               'All stops have been reached successfully!',
//               [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
//             );
//           }
//         }

//         break; // Only process one stop at a time
//       }
//     }
//   };

//   /* ---------------- GPS TRACKING ---------------- */
//   const onLocationUpdate = (position: any) => {
//     if (!path.length) return;

//     const { latitude, longitude, accuracy } = position.coords;

//     console.log(`📍 GPS Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy?.toFixed(1)}m)`);

//     setCurrentLocation({ latitude, longitude });

//     // Animate bus marker to new position
//     animatedCoordinate.timing({
//       latitude,
//       longitude,
//       duration: 1000,
//       useNativeDriver: false,
//     }).start();

//     // Keep camera following bus
//     mapRef.current?.animateCamera(
//       {
//         center: { latitude, longitude },
//         zoom: 16,
//       },
//       { duration: 1000 }
//     );

//     // Check if reached any stop
//     checkStopReached(latitude, longitude);
//   };

//   const startTracking = async () => {
//     if (isTracking || !path.length) {
//       if (!path.length) {
//         Alert.alert('No Route', 'Please load a route first');
//       }
//       return;
//     }

//     // Check permissions
//     const hasPermission = await requestPermission();
//     if (!hasPermission) {
//       Alert.alert('Permission Required', 'Location permission is required for tracking');
//       return;
//     }

//     setIsTracking(true);
//      await saveTrackingState(true);
//     console.log('🚀 Starting GPS tracking...');

//     watchId.current = Geolocation.watchPosition(
//       (position) => {
//         onLocationUpdate(position);
//       },
//       (error) => {
//         console.error('GPS Error:', error);
//         Alert.alert('GPS Error', `Unable to get location: ${error.message}`);
//       },
//       {
//         enableHighAccuracy: true,
//         distanceFilter: GPS_DISTANCE_FILTER,
//         interval: GPS_UPDATE_INTERVAL,
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       }
//     );
//   };

//   const stopTracking = async() => {
//     console.log('🛑 Stopping GPS tracking...');
//     setIsTracking(false);
//       await saveTrackingState(false); 

//     if (watchId.current !== null) {
//       Geolocation.clearWatch(watchId.current);
//       watchId.current = null;
//     }
//   };



//   /* ---------------- LIFECYCLE ---------------- */
//   // useFocusEffect(
//   //   useCallback(() => {
//   //     fetchRouteFromAPI();

//   //     return () => {
//   //       stopTracking();
//   //     };
//   //   }, [])
//   // );


//     const handleExitApp = () => {
//     setCustomAlertVisible(false); // hide popup
//     setTimeout(() => {
//       BackHandler.exitApp();
//     }, 100); // wait briefly for UI to update
//   };

// useFocusEffect(
//   useCallback(() => {
//     (async () => {

//       // restore route always
//       const saved = await AsyncStorage.getItem('route_path');

//       if (saved) {
//         const savedRoute = JSON.parse(saved);
//         setPath(savedRoute);

//         // reset animated bus marker starting point
//         if (savedRoute.length > 0) {
//           animatedCoordinate.setValue(savedRoute[0]);

//           setTimeout(() => {
//             mapRef.current?.fitToCoordinates(savedRoute, {
//               edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//               animated: true,
//             });
//           }, 300);
//         }
//       } else {
//         // if not saved, fetch fresh route
//         await fetchRouteFromAPI();
//       }

//       // restore tracking flag
//       const tracking = await loadTrackingState();
//       setIsTracking(tracking);

//     })();

//     return () => {};

    
//   }, [])
// );


// useFocusEffect(
//   useCallback(() => {
//     if (path && path.length > 0) {
//       setTimeout(() => {
//         mapRef.current?.fitToCoordinates(path, {
//           edgePadding: { top: 80, bottom: 80, left: 50, right: 50 },
//           animated: true,
//         });
//       }, 300);
//     }
//   }, [path])
// );


//   useEffect(() => {
//     setupLocationServices();
//     requestPermission();
//     AsyncStorage.getItem('driver_name').then((n) => setDriverName(n || 'Driver'));

//     // Handle app state changes (background/foreground)
//     const subscription = AppState.addEventListener('change', (nextAppState) => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         console.log('App has come to the foreground');
//       }
//       appState.current = nextAppState;
//     });

//     return () => {
//       LocationServicesDialogBox.stopListener();
//       subscription.remove();
//       stopTracking();
//     };
//   }, []);

  
//   useFocusEffect(
//     useCallback(() => {
   
//       const backAction = () => {
//         setCustomAlertVisible(true); // show custom alert
//         return true; // prevent default back action
//       };


//       const backHandler = BackHandler.addEventListener(
//         "hardwareBackPress",
//         backAction
//       );

//       return () => backHandler.remove();
//     }, [])
//   );
//   /* ---------------- UI ---------------- */
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#0e0868ff" />
//         <Text style={{ marginTop: 10 }}>Loading route...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1,backgroundColor: "transparent" }}>
//       <View style={{ flex: 1,  backgroundColor:'#fff'}}>
//         {/* Header */}
//         <View style={{ height: 60, flexDirection: 'row', alignItems: 'center' ,width:"100%"}}>
//                <LinearGradient
//                   // colors={['#0969b8ff', '#6cbcfd']}
//                    colors={['#ff9f43', '#feca57',]}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 0, y: 0.9 }}
//                  style={{ height: 60, flexDirection: 'row', alignItems: 'center',width:"100%" }}
//                   // style={styles.schoolCard}

//                 >
//           <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
//             <MaterialIcons name="menu" size={24} color="#fff" style={{ margin: 18 }} />
//           </TouchableOpacity>
//           <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Bus Live Tracking</Text>
//           </LinearGradient>
//         </View>

//         {/* Map */}
//         <MapView
//           ref={mapRef}
//           provider={PROVIDER_GOOGLE}
//           style={{ flex: 1 }}
//           initialRegion={{
//             ...DEFAULT_COORDINATE,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//           }}
//           showsUserLocation={true}
//           showsMyLocationButton={true}
//           followsUserLocation={isTracking}
//           showsCompass={true}
//           showsTraffic={false}
//         >
//           {/* Route Polyline */}
//           {path.length > 1 && (
//             <Polyline
//               coordinates={path.map((p) => ({
//                 latitude: p.latitude,
//                 longitude: p.longitude,
//               }))}
//               strokeWidth={4}
//               strokeColor="#1abc9c"
//               lineDashPattern={[1]}
//             />
//           )}

//           {/* Animated Bus Marker */}
//           <Marker.Animated coordinate={animatedCoordinate} anchor={{ x: 0.5, y: 0.5 }} flat={true}>
//             <View style={{ alignItems: 'center' }}>
//               <Text style={{ fontSize: 40 }}>🚌</Text>
//             </View>
//           </Marker.Animated>

//           {/* Stop Markers */}
//           {path.map((stop, i) => {
//             const isReached = reachedStopsRef.current.has(i);
//             return (
//               <Marker
//                 key={`stop-${i}`}
//                 coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
//                 title={`${i + 1}. ${stop.stop_name}`}
//                 description={`Passengers: ${stop.passenger_count}`}
//                 pinColor={isReached ? '#27ae60' : '#e74c3c'}
//               >
//                 <View style={{ alignItems: 'center' }}>
//                   <View
//                     style={{
//                       backgroundColor: isReached ? '#27ae60' : '#e74c3c',
//                       borderRadius: 20,
//                       padding: 8,
//                       borderWidth: 2,
//                       borderColor: '#fff',
//                     }}
//                   >
//                     <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{i + 1}</Text>
//                   </View>
//                 </View>
//               </Marker>
//             );
//           })}
//         </MapView>

//         {/* Bottom Controls */}
//         <View style={{ padding: 15, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderTopColor: '#ddd' }}>
//           {/* Info Section */}
//           <View style={{ marginBottom: 10 }}>
//             <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>👨‍✈️ Driver: {driverName}</Text>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//               <Text style={{ fontSize: 14 }}>
//                 👥 Passengers: <Text style={{ fontWeight: 'bold' }}>{passengerCount}</Text>
//               </Text>
//               <Text style={{ fontSize: 14 }}>
//                 🛑 Stops: <Text style={{ fontWeight: 'bold' }}>{reachedStopsRef.current.size} / {path.length}</Text>
//               </Text>
//             </View>
//             {isTracking && (
//               <Text style={{ fontSize: 12, color: '#27ae60', marginTop: 5 }}>
//                 ● Tracking Active
//               </Text>
//             )}
//           </View>

//           {/* Control Buttons */}
//           <View style={{ flexDirection: 'row', gap: 8 }}>
//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: isTracking || !path.length ? '#95a5a6' : '#27ae60',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={isTracking || !path.length}
//               onPress={startTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 START
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: !isTracking ? '#95a5a6' : '#e74c3c',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={!isTracking}
//               onPress={stopTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 STOP
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {routeCompleted && (
//             <View
//               style={{
//                 backgroundColor: '#27ae60',
//                 padding: 12,
//                 borderRadius: 8,
//                 marginTop: 10,
//               }}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
//                 ✅ Route Completed Successfully!
//               </Text>
//             </View>
//           )}
//         </View>

//            <Modal
//           visible={customAlertVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setCustomAlertVisible(false)}
//         >
//           <View style={{
//             flex: 1,
//             backgroundColor: "rgba(0,0,0,0.6)",
//             justifyContent: "center",
//             alignItems: "center"
//           }}>
//             <View style={{
//               width: "80%", height: 180,
//               backgroundColor: "#fbfbfbff",   // 🔹 Background color
//               borderRadius: 12,
//               padding: 20,
//               alignItems: "center"
//             }}>

//               <Text style={{
//                 fontSize: 18,
//                 fontWeight: "bold",
//                 color: "#c34646ff",           // 🔹 Title text color
//                 marginBottom: 10, bottom: 5, marginLeft: 10
//               }}>
//                 Confirm Exit
//               </Text>
//               <MaterialIcons name="crisis-alert" size={24} style={{  right: 65, bottom: 40, color: "#981313ff"}} />
//               <Divider style={{    height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%', bottom: 35,}} />

//               <Text style={{
//                 fontSize: 15,
//                 fontFamily: fonts.FONT_MEDIUM,
//                 color: "#5e5d5dff",           // 🔹 Message text color
//                 marginBottom: 20,
//                 textAlign: "center", bottom: 30
//               }}>
//                 Are you sure you want to exit?
//               </Text>

//               <View style={{ flexDirection: "row", justifyContent: "space-between", bottom: 25 }}>
//                 <TouchableOpacity
//                   style={{
//                     backgroundColor: "#bcc6fbff",   // 🔹 Button bg
//                     paddingVertical: 10,
//                     paddingHorizontal: 30,
//                     borderRadius: 15,
//                     marginRight: 10
//                   }}
//                   onPress={() => setCustomAlertVisible(false)}
//                 >
//                   <Text style={{ color: "#fff", fontWeight: "bold" }}>No</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={{
//                     backgroundColor: "#e53935",   // 🔹 Button bg
//                     paddingVertical: 10,
//                     paddingHorizontal: 30,
//                     borderRadius: 15, marginLeft: 10
//                   }}
//                   onPress={handleExitApp}
//                 >
//                   <Text style={{ color: "#fff", fontWeight: "bold" }}>Yes</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;


// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   PermissionsAndroid,
//   Platform,
//   Alert,
//   AppState,
// } from 'react-native';
// import MapView, {
//   Marker,
//   Polyline,
//   PROVIDER_GOOGLE,
//   AnimatedRegion,
// } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
// import MaterialIcons from '@react-native-vector-icons/material-icons';
// import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';

// /* ---------------- CONSTANTS ---------------- */
// const DEFAULT_COORDINATE = {
//   latitude: 13.053215,
//   longitude: 80.224194,
// };

// const STOP_REACH_RADIUS = 30; // meters
// const GPS_UPDATE_INTERVAL = 2000; // 2 seconds
// const GPS_DISTANCE_FILTER = 5; // 5 meters
// const MAX_RETRIES = 3;
// const RETRY_DELAY = 2000;

// /* ---------------- TYPES ---------------- */
// interface Stop {
//   latitude: number;
//   longitude: number;
//   stop_name: string;
//   stop_Id: string;
//   route_Id: string;
//   passenger_count: number;
// }

// /* ---------------- SCREEN ---------------- */
// const HomeScreen = () => {
//   const navigation = useNavigation();
//   const mapRef = useRef<MapView>(null);
//   const watchId = useRef<number | null>(null);
//   const reachedStopsRef = useRef(new Set<number>());
//   const appState = useRef(AppState.currentState);
//   const isMountedRef = useRef(true);
//   const retryCountRef = useRef(0);

//   // State
//   const [driverName, setDriverName] = useState('');
//   const [path, setPath] = useState<Stop[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);
//   const [passengerCount, setPassengerCount] = useState(0);
//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [routeCompleted, setRouteCompleted] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const animatedCoordinate = useRef(
//     new AnimatedRegion({
//       ...DEFAULT_COORDINATE,
//       latitudeDelta: 0.01,
//       longitudeDelta: 0.01,
//     })
//   ).current;

//   /* ---------------- PERMISSIONS ---------------- */
//   const requestPermission = async (): Promise<boolean> => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location for bus tracking',
//             buttonPositive: 'OK',
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.error('Permission request error:', err);
//         return false;
//       }
//     }
//     return true;
//   };

//   const setupLocationServices = () => {
//     LocationServicesDialogBox.checkLocationServicesIsEnabled({
//       message: `
//         <h6 style="margin:0 0 8px 0;">For accurate bus tracking, enable Location Services</h6>
//         <p style="margin:8px 0;">Please turn on:</p>
//         <ul style="padding-left:18px; margin:8px 0;">
//           <li><b>High Accuracy Mode</b></li>
//           <li><b>GPS Location</b></li>
//         </ul>
//       `,
//       ok: 'Turn on',
//       cancel: 'Cancel',
//       enableHighAccuracy: true,
//       showDialog: true,
//       openLocationServices: true,
//       preventOutSideTouch: false,
//       preventBackClick: false,
//       providerListener: false,
//     })
//       .then((success) => {
//         console.log('✅ Location services enabled:', success);
//       })
//       .catch((error) => {
//         console.log('❌ Location services error:', error.message);
//       });
//   };

//   /* ---------------- DATE/TIME HELPERS ---------------- */
//   const getCurrentISTDate = () => {
//     return new Date().toLocaleDateString('en-CA', {
//       timeZone: 'Asia/Kolkata',
//     });
//   };

//   const getCurrentISTTime = () => {
//     return new Date().toLocaleTimeString('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       hour12: false,
//     });
//   };

//   /* ---------------- STORAGE HELPERS ---------------- */
//   const saveTrackingState = async (value: boolean): Promise<void> => {
//     try {
//       await AsyncStorage.setItem('isTracking', value ? '1' : '0');
//     } catch (error) {
//       console.error('Failed to save tracking state:', error);
//     }
//   };

//   const loadTrackingState = async (): Promise<boolean> => {
//     try {
//       const value = await AsyncStorage.getItem('isTracking');
//       return value === '1';
//     } catch (error) {
//       console.error('Failed to load tracking state:', error);
//       return false;
//     }
//   };

//   const saveRouteToStorage = async (route: Stop[]): Promise<void> => {
//     try {
//       await AsyncStorage.setItem('route_path', JSON.stringify(route));
//     } catch (error) {
//       console.error('Failed to save route:', error);
//     }
//   };

//   const loadRouteFromStorage = async (): Promise<Stop[] | null> => {
//     try {
//       const saved = await AsyncStorage.getItem('route_path');
//       if (!saved) return null;

//       const savedRoute = JSON.parse(saved);
      
//       // Validate route structure
//       if (!Array.isArray(savedRoute) || savedRoute.length === 0) {
//         await AsyncStorage.removeItem('route_path');
//         return null;
//       }

//       // Validate each stop has required fields
//       const isValid = savedRoute.every(stop => 
//         stop.latitude && 
//         stop.longitude && 
//         stop.stop_name && 
//         stop.stop_Id && 
//         stop.route_Id
//       );

//       if (!isValid) {
//         await AsyncStorage.removeItem('route_path');
//         return null;
//       }

//       return savedRoute;
//     } catch (error) {
//       console.error('Failed to load route:', error);
//       await AsyncStorage.removeItem('route_path');
//       return null;
//     }
//   };

//   /* ---------------- DISTANCE CALCULATION ---------------- */
//   const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 6371000; // Earth's radius in meters
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);

//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
//   };

//   /* ---------------- NOTIFICATION ---------------- */
//   const showStopNotification = async (
//     stopName: string, 
//     stopNumber: number, 
//     totalStops: number
//   ): Promise<void> => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'stop-reached',
//         name: 'Stop Reached',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '🚌 Stop Reached!',
//         body: `${stopName} - Stop ${stopNumber} of ${totalStops}`,
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           pressAction: {
//             id: 'default',
//           },
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   const showRouteCompletedNotification = async (): Promise<void> => {
//     try {
//       const channelId = await notifee.createChannel({
//         id: 'route-completed',
//         name: 'Route Completed',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//       });

//       await notifee.displayNotification({
//         title: '✅ Route Completed!',
//         body: 'All stops have been reached. Great job!',
//         android: {
//           channelId,
//           importance: AndroidImportance.HIGH,
//           sound: 'default',
//         },
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   };

//   /* ---------------- API CALLS WITH RETRY ---------------- */
//   const fetchRouteFromAPI = async (retryCount = 0): Promise<void> => {
//     try {
//       setLoading(true);
//       setError(null);

//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         throw new Error('Driver credentials not found. Please login again.');
//       }

//       const res = await axios.post(
//         `https://www.vtsmile.in/app/api/driver/route_track_plan_api?orgId=${orgId}&driver_Id=${driverId}`,
//         {},
//         {
//           timeout: 10000, // 10 second timeout
//         }
//       );

//       console.log('📍 Route API Response:', res.data);

//       if (res.data.isSuccess && res.data.trackPlanDetails?.length > 0) {
//         const route = res.data.trackPlanDetails.map((p: any) => ({
//           latitude: Number(p.latitude),
//           longitude: Number(p.longitude),
//           stop_name: p.stop_name,
//           stop_Id: p.stop_Id,
//           route_Id: p.route_Id,
//           passenger_count: Number(p.no_of_passengers) || 0,
//         }));

//         if (isMountedRef.current) {
//           setPath(route);
//           await saveRouteToStorage(route);
          
//           // Set initial bus position to first stop
//           animatedCoordinate.setValue(route[0]);

//           // Zoom to show entire route
//           setTimeout(() => {
//             if (isMountedRef.current && mapRef.current) {
//               mapRef.current.fitToCoordinates(route, {
//                 edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//                 animated: true,
//               });
//             }
//           }, 500);
//         }

//         retryCountRef.current = 0;
//       } else {
//         throw new Error('No route assigned for today.');
//       }
//     } catch (error: any) {
//       console.error('❌ Fetch route error:', error);

//       // Retry logic for network errors
//       if (
//         retryCount < MAX_RETRIES && 
//         (error.code === 'ECONNABORTED' || error.message.includes('Network'))
//       ) {
//         console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
//         setTimeout(() => {
//           if (isMountedRef.current) {
//             fetchRouteFromAPI(retryCount + 1);
//           }
//         }, RETRY_DELAY);
//         return;
//       }

//       if (isMountedRef.current) {
//         setError(error.message);
//         Alert.alert('Error', `Failed to load route: ${error.message}`);
//       }
//     } finally {
//       if (isMountedRef.current) {
//         setLoading(false);
//       }
//     }
//   };

//   const saveStopReached = async (stop: Stop, stopIndex: number): Promise<boolean> => {
//     try {
//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId) {
//         console.error('❌ Missing credentials');
//         return false;
//       }

//       const params = {
//         driver_Id: driverId,
//         orgId,
//         route_Id: stop.route_Id,
//         stop_name: stop.stop_Id,
//         stop_lat: stop.latitude.toString(),
//         stop_lng: stop.longitude.toString(),
//         reached_date: getCurrentISTDate(),
//         reached_time: getCurrentISTTime(),
//       };

//       console.log('💾 Saving stop data:', params);

//       const response = await axios.post(
//         'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
//         params,
//         {
//           timeout: 8000,
//         }
//       );

//       console.log('✅ Stop saved successfully:', response.data);

//       if (response.data.isSuccess) {
//         return true;
//       } else {
//         console.error('❌ Backend returned error:', response.data);
//         return false;
//       }
//     } catch (error: any) {
//       console.error('❌ Save stop reached error:', error.response?.data || error.message);
      
//       // Queue for retry if network error
//       if (error.message.includes('Network') || error.code === 'ECONNABORTED') {
//         // TODO: Implement offline queue
//         console.log('Network error - should queue for retry');
//       }
      
//       return false;
//     }
//   };

//   /* ---------------- STOP DETECTION ---------------- */
//   const checkStopReached = async (lat: number, lng: number): Promise<void> => {
//     if (!path.length || !isTracking || !isMountedRef.current) return;

//     for (let i = 0; i < path.length; i++) {
//       // Skip already reached stops
//       if (reachedStopsRef.current.has(i)) continue;

//       const stop = path[i];
//       const dist = getDistance(lat, lng, stop.latitude, stop.longitude);

//       console.log(`📏 Distance to stop ${i + 1} (${stop.stop_name}): ${dist.toFixed(2)}m`);

//       if (dist <= STOP_REACH_RADIUS) {
//         console.log(`🎯 Stop ${i + 1} reached: ${stop.stop_name}`);

//         // Mark as reached
//         reachedStopsRef.current.add(i);

//         // Save to backend
//         const saved = await saveStopReached(stop, i);

//         if (saved && isMountedRef.current) {
//           // Show notification
//           await showStopNotification(stop.stop_name, i + 1, path.length);

//           // Update passenger count
//           setPassengerCount((prev) => prev + stop.passenger_count);

//           // Check if route is completed
//           if (reachedStopsRef.current.size === path.length) {
//             console.log('🏁 Route completed!');
//             setRouteCompleted(true);
//             await stopTracking();
//             await showRouteCompletedNotification();
            
//             if (isMountedRef.current) {
//               Alert.alert(
//                 'Route Completed! 🎉',
//                 'All stops have been reached successfully!',
//                 [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
//               );
//             }
//           }
//         }

//         break; // Only process one stop at a time
//       }
//     }
//   };

//   /* ---------------- GPS TRACKING ---------------- */
//   const onLocationUpdate = (position: any): void => {
//     if (!path.length || !isMountedRef.current) return;

//     const { latitude, longitude, accuracy } = position.coords;

//     console.log(`📍 GPS Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy?.toFixed(1)}m)`);

//     if (isMountedRef.current) {
//       setCurrentLocation({ latitude, longitude });

//       // Animate bus marker to new position
//       animatedCoordinate.timing({
//         latitude,
//         longitude,
//         duration: 1000,
//         useNativeDriver: false,
//       }).start();

//       // Keep camera following bus
//       mapRef.current?.animateCamera(
//         {
//           center: { latitude, longitude },
//           zoom: 16,
//         },
//         { duration: 1000 }
//       );

//       // Check if reached any stop
//       checkStopReached(latitude, longitude);
//     }
//   };

//   const startTracking = async (): Promise<void> => {
//     if (isTracking || !path.length || !isMountedRef.current) {
//       if (!path.length) {
//         Alert.alert('No Route', 'Please load a route first');
//       }
//       return;
//     }

//     // Check permissions
//     const hasPermission = await requestPermission();
//     if (!hasPermission) {
//       Alert.alert('Permission Required', 'Location permission is required for tracking');
//       return;
//     }

//     setIsTracking(true);
//     await saveTrackingState(true);
//     console.log('🚀 Starting GPS tracking...');

//     // Clear any existing watch
//     if (watchId.current !== null) {
//       Geolocation.clearWatch(watchId.current);
//     }

//     watchId.current = Geolocation.watchPosition(
//       (position) => {
//         if (isMountedRef.current) {
//           onLocationUpdate(position);
//         }
//       },
//       (error) => {
//         console.error('GPS Error:', error);
//         if (isMountedRef.current) {
//           Alert.alert('GPS Error', `Unable to get location: ${error.message}`);
//           stopTracking();
//         }
//       },
//       {
//         enableHighAccuracy: true,
//         distanceFilter: GPS_DISTANCE_FILTER,
//         interval: GPS_UPDATE_INTERVAL,
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       }
//     );
//   };

//   const stopTracking = async (): Promise<void> => {
//     console.log('🛑 Stopping GPS tracking...');
    
//     try {
//       if (isMountedRef.current) {
//         setIsTracking(false);
//       }
      
//       await saveTrackingState(false);

//       if (watchId.current !== null) {
//         Geolocation.clearWatch(watchId.current);
//         watchId.current = null;
//       }
//     } catch (error) {
//       console.error('Error stopping tracking:', error);
//     }
//   };

//   /* ---------------- LIFECYCLE ---------------- */
//   useFocusEffect(
//     useCallback(() => {
//       let isCancelled = false;

//       (async () => {
//         try {
//           // Restore route always
//           const savedRoute = await loadRouteFromStorage();

//           if (isCancelled || !isMountedRef.current) return;

//           if (savedRoute) {
//             setPath(savedRoute);

//             // Reset animated bus marker starting point
//             if (savedRoute.length > 0) {
//               animatedCoordinate.setValue(savedRoute[0]);

//               setTimeout(() => {
//                 if (!isCancelled && isMountedRef.current && mapRef.current) {
//                   mapRef.current.fitToCoordinates(savedRoute, {
//                     edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//                     animated: true,
//                   });
//                 }
//               }, 300);
//             }
//           } else {
//             // If not saved, fetch fresh route
//             await fetchRouteFromAPI();
//           }

//           // Restore tracking flag (but don't auto-start tracking)
//           const tracking = await loadTrackingState();
//           if (!isCancelled && isMountedRef.current) {
//             // Only restore the flag, don't actually start tracking
//             // User must manually press START button
//             setIsTracking(false);
//             await saveTrackingState(false);
//           }
//         } catch (error) {
//           console.error('Error in useFocusEffect:', error);
//         }
//       })();

//       return () => {
//         isCancelled = true;
//       };
//     }, [])
//   );

//   useFocusEffect(
//     useCallback(() => {
//       if (path && path.length > 0 && mapRef.current) {
//         setTimeout(() => {
//           if (isMountedRef.current && mapRef.current) {
//             mapRef.current.fitToCoordinates(path, {
//               edgePadding: { top: 80, bottom: 80, left: 50, right: 50 },
//               animated: true,
//             });
//           }
//         }, 300);
//       }
//     }, [path])
//   );

//   useEffect(() => {
//     isMountedRef.current = true;
    
//     setupLocationServices();
//     requestPermission();
    
//     AsyncStorage.getItem('driver_name')
//       .then((n) => {
//         if (isMountedRef.current) {
//           setDriverName(n || 'Driver');
//         }
//       })
//       .catch(console.error);

//     // Handle app state changes (background/foreground)
//     const subscription = AppState.addEventListener('change', (nextAppState) => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         console.log('App has come to the foreground');
//         // Optionally refresh route or check tracking state
//       }
//       appState.current = nextAppState;
//     });

//     return () => {
//       isMountedRef.current = false;
//       LocationServicesDialogBox.stopListener();
//       subscription.remove();
//       stopTracking();
//     };
//   }, []);

//   /* ---------------- UI ---------------- */
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
//         <ActivityIndicator size="large" color="#ff9f43" />
//         <Text style={{ marginTop: 10, fontSize: 16 }}>Loading route...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
//       <View style={{ flex: 1, backgroundColor: '#fff' }}>
//         {/* Header */}
//         <LinearGradient
//           colors={['#ff9f43', '#feca57']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 0, y: 0.9 }}
//           style={{ height: 60, flexDirection: 'row', alignItems: 'center', width: '100%' }}
//         >
//           <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
//             <MaterialIcons name="menu" size={24} color="#fff" style={{ margin: 18 }} />
//           </TouchableOpacity>
//           <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
//             Bus Live Tracking
//           </Text>
//         </LinearGradient>

//         {/* Error Banner */}
//         {error && (
//           <View style={{ backgroundColor: '#e74c3c', padding: 12 }}>
//             <Text style={{ color: '#fff', textAlign: 'center' }}>{error}</Text>
//             <TouchableOpacity 
//               onPress={() => fetchRouteFromAPI()}
//               style={{ marginTop: 8, alignSelf: 'center' }}
//             >
//               <Text style={{ color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline' }}>
//                 Retry
//               </Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Map */}
//         <MapView
//           ref={mapRef}
//           provider={PROVIDER_GOOGLE}
//           style={{ flex: 1 }}
//           initialRegion={{
//             ...DEFAULT_COORDINATE,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//           }}
//           showsUserLocation={true}
//           showsMyLocationButton={true}
//           followsUserLocation={isTracking}
//           showsCompass={true}
//           showsTraffic={false}
//           loadingEnabled={true}
//           loadingIndicatorColor="#ff9f43"
//         >
//           {/* Route Polyline */}
//           {path.length > 1 && (
//             <Polyline
//               coordinates={path.map((p) => ({
//                 latitude: p.latitude,
//                 longitude: p.longitude,
//               }))}
//               strokeWidth={4}
//               strokeColor="#1abc9c"
//               lineDashPattern={[1]}
//             />
//           )}

//           {/* Animated Bus Marker */}
//           <Marker.Animated 
//             coordinate={animatedCoordinate} 
//             anchor={{ x: 0.5, y: 0.5 }} 
//             flat={true}
//             tracksViewChanges={false}
//           >
//             <View style={{ alignItems: 'center' }}>
//               <Text style={{ fontSize: 40 }}>🚌</Text>
//             </View>
//           </Marker.Animated>

//           {/* Stop Markers */}
//           {path.map((stop, i) => {
//             const isReached = reachedStopsRef.current.has(i);
//             return (
//               <Marker
//                 key={`stop-${i}`}
//                 coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
//                 title={`${i + 1}. ${stop.stop_name}`}
//                 description={`Passengers: ${stop.passenger_count}`}
//                 pinColor={isReached ? '#27ae60' : '#e74c3c'}
//                 tracksViewChanges={false}
//               >
//                 <View style={{ alignItems: 'center' }}>
//                   <View
//                     style={{
//                       backgroundColor: isReached ? '#27ae60' : '#e74c3c',
//                       borderRadius: 20,
//                       padding: 8,
//                       borderWidth: 2,
//                       borderColor: '#fff',
//                     }}
//                   >
//                     <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
//                       {i + 1}
//                     </Text>
//                   </View>
//                 </View>
//               </Marker>
//             );
//           })}
//         </MapView>

//         {/* Bottom Controls */}
//         <View style={{ padding: 15, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderTopColor: '#ddd' }}>
//           {/* Info Section */}
//           <View style={{ marginBottom: 10 }}>
//             <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
//               👨‍✈️ Driver: {driverName}
//             </Text>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//               <Text style={{ fontSize: 14 }}>
//                 👥 Passengers: <Text style={{ fontWeight: 'bold' }}>{passengerCount}</Text>
//               </Text>
//               <Text style={{ fontSize: 14 }}>
//                 🛑 Stops: <Text style={{ fontWeight: 'bold' }}>
//                   {reachedStopsRef.current.size} / {path.length}
//                 </Text>
//               </Text>
//             </View>
//             {isTracking && (
//               <Text style={{ fontSize: 12, color: '#27ae60', marginTop: 5 }}>
//                 ● Tracking Active
//               </Text>
//             )}
//           </View>

//            <View style={{ flexDirection: 'row', gap: 8 }}>
//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: isTracking || !path.length ? '#95a5a6' : '#27ae60',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={isTracking || !path.length}
//               onPress={startTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 START
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{
//                 flex: 1,
//                 backgroundColor: !isTracking ? '#95a5a6' : '#e74c3c',
//                 padding: 14,
//                 borderRadius: 8,
//                 elevation: 2,
//               }}
//               disabled={!isTracking}
//               onPress={stopTracking}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
//                 STOP
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {routeCompleted && (
//             <View
//               style={{
//                 backgroundColor: '#27ae60',
//                 padding: 12,
//                 borderRadius: 8,
//                 marginTop: 10,
//               }}
//             >
//               <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
//                 ✅ Route Completed Successfully!
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default HomeScreen;
