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

// //   const getCurrentISTTime = () => {
// //   // Get current IST time
// //   const now = new Date().toLocaleTimeString('en-GB', {
// //     timeZone: 'Asia/Kolkata',
// //     hour12: false,
// //   });

// //   // Split hours, minutes, seconds
// //   const [hours, minutes, seconds] = now.split(':');
// //   // const hourNum = parseInt(hours, 10);

// //   // const suffix = hourNum >= 13 ? ' pm' : ' am';

// //   return `${hours}:${minutes}:${seconds}`;
// // };


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

// const sendNextStopNotification = async (nextStop: Stop) => {
//   try {
//     const orgId = await AsyncStorage.getItem('orgId');
//     const driverId = await AsyncStorage.getItem('driver_Id');

//     // Detailed validation logging
//     console.log('🔍 Validation Check:');
//     console.log('  orgId:', orgId);
//     console.log('  driverId:', driverId);
//     console.log('  route_Id:', nextStop.route_Id);
//     console.log('  stop_Id:', nextStop.stop_Id);

//     if (!orgId || !driverId || !nextStop.route_Id || !nextStop.stop_Id) {
//       console.error('❌ Missing required fields');
//       return;
//     }

//     // ✅ FIXED: Use stop_Id in URL (not stop_name)
//     const url = `https://www.vtsmile.in/app/api/driver/track_next_stop_api?orgId=${orgId}&driver_Id=${driverId}&route_Id=${nextStop.route_Id}&stop_Id=${nextStop.stop_Id}`;

//     console.log('📣 NEXT STOP API URL:', url);

//     const res = await axios.post(url);

//     console.log('✅ Next stop notification response:', res.data);
    
//     if (res.data.isSuccess) {
//       console.log(`✅ Successfully notified students for stop: ${nextStop.stop_name}`);
//     } else {
//       console.warn('⚠️ API response:', res.data.message);
//     }
//   } catch (error: any) {
//     console.error('❌ Next stop notification error:', error.response?.data || error.message);
    
//     // Additional error details
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//     }
//   }
// };
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
//         await sendNextStopNotification(nextStop);
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
//             await sendNextStopNotification(nextStop);
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



import React, { useEffect, useRef, useState, useCallback, use } from 'react';
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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
  
  const sendNextStopNotification = async (nextStop: Stop) => {
  try {
    const orgId = await AsyncStorage.getItem('orgId');
    const driverId = await AsyncStorage.getItem('driver_Id');

    if (!orgId || !driverId || !nextStop.route_Id || !nextStop.stop_Id) {
      console.error('❌ Missing required fields');
      return;
    }

    // ✅ FIXED: Use stop_Id in URL (not stop_name)
    const url = `https://www.vtsmile.in/app/api/driver/track_next_stop_api?orgId=${orgId}&driver_Id=${driverId}&route_Id=${nextStop.route_Id}&stop_Id=${nextStop.stop_Id}`;

    // console.log('📣 NEXT STOP API URL:', url);

    const res = await axios.post(url);

    console.log('✅ Next stop notification response:', res.data);
    
    if (res.data.isSuccess) {
      console.log(`✅ Successfully notified students for stop: ${nextStop.stop_name}`);
    } else {
      console.warn('⚠️ API response:', res.data.message);
    }
  } catch (error: any) {
    console.error('❌ Next stop notification error:', error.response?.data || error.message);
    
    // Additional error details
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
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

      // console.log('📍 Route API Response:', res.data.trackPlanDetails);

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

      // console.log('💾 Saving stop data:', params);

      const response = await axios.post(
        'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
        params
      );

      // console.log('✅ Stop saved successfully:', response.data);

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
            await sendNextStopNotification(nextStop);
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
useEffect(() => {
  fetchRouteFromAPI();
}, []  );

  // useFocusEffect(
  //   useCallback(() => {
  //     (async () => {
  //       // Restore route
  //       const saved = await AsyncStorage.getItem('route_path');
  //       if (saved) {
  //         const savedRoute = JSON.parse(saved);
  //         setPath(savedRoute);

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
  //         await fetchRouteFromAPI();
  //       }

  //       // Restore reached stops and passenger count
  //       const reachedStops = await loadReachedStops();
  //       reachedStopsRef.current = reachedStops;
        
  //       const savedPassengers = await loadPassengerCount();
  //       setPassengerCount(savedPassengers);

  //       // Restore tracking state and RESUME GPS if needed
  //       const tracking = await loadTrackingState();
  //       if (tracking && saved) {
  //         console.log('🔄 Resuming tracking from previous session...');
  //         setIsTracking(true);
          
  //         // Restart GPS watching
  //         const hasPermission = await requestPermission();
  //         if (hasPermission) {
  //           watchId.current = Geolocation.watchPosition(
  //             (position) => {
  //               onLocationUpdate(position);
  //             },
  //             (error) => {
  //               console.error('GPS Error on resume:', error);
  //             },
  //             {
  //               enableHighAccuracy: true,
  //               distanceFilter: GPS_DISTANCE_FILTER,
  //               interval: GPS_UPDATE_INTERVAL,
  //               fastestInterval: 1000,
  //               showLocationDialog: true,
  //               forceRequestLocation: true,
  //             }
  //           );
  //         }
  //       }
  //     })();

  //     return () => {
  //       // Don't stop tracking when navigating away
  //       // stopTracking();
  //     };
  //   }, [])
  // );

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
                source={require('../assets/Yellow school bus illustration.png')}
                style={{ width: 70, height: 70, }}
              />
   
              
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
//   Image,
//   Dimensions,
//   ScrollView,
//   StyleSheet,
// } from 'react-native';
// import MapView, {
//   Marker,
//   Polyline,
//   PROVIDER_GOOGLE,
//   AnimatedRegion,
//   Circle,
// } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
// import { Divider } from 'react-native-paper';
// import { fonts } from '../Root/Config';
// import axios from 'axios';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// /* ============================================
//    IMPROVED CONSTANTS
//    ============================================ */
// const DEFAULT_COORDINATE = {
//   latitude: 13.053215,
//   longitude: 80.224194,
// };

// const STOP_REACH_RADIUS = 30;
// const GPS_UPDATE_INTERVAL = 1500; // Faster updates for smoother tracking
// const GPS_DISTANCE_FILTER = 2; // Lower filter for better accuracy

// /* ============================================
//    TYPES
//    ============================================ */
// interface Stop {
//   latitude: number;
//   longitude: number;
//   stop_name: string;
//   stop_Id: string;
//   route_Id: string;
//   passenger_count: number;
// }

// interface LocationCoords {
//   latitude: number;
//   longitude: number;
//   accuracy: number;
//   speed: number;
//   timestamp: number;
// }

// interface TrackingStats {
//   distance: number;
//   speed: number;
//   accuracy: number;
//   avgSpeed: number;
// }

// /* ============================================
//    STYLES
//    ============================================ */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     height: 70,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '700',
//     marginLeft: 15,
//     letterSpacing: 0.5,
//   },
//   map: {
//     flex: 1,
//   },
//   bottomPanel: {
//     backgroundColor: '#f5f7fa',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     maxHeight: '45%',
//   },
//   statsContainer: {
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 12,
//     marginHorizontal: 4,
//     borderLeftWidth: 4,
//     elevation: 2,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#666',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1a1a1a',
//   },
//   statSubtext: {
//     fontSize: 10,
//     color: '#999',
//     marginTop: 2,
//   },
//   nextStopCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginHorizontal: 16,
//     marginVertical: 12,
//     padding: 14,
//     borderLeftWidth: 5,
//     borderLeftColor: '#ff6b6b',
//     elevation: 2,
//   },
//   nextStopLabel: {
//     fontSize: 11,
//     color: '#ff6b6b',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     marginBottom: 4,
//   },
//   nextStopName: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginBottom: 6,
//   },
//   nextStopDetails: {
//     fontSize: 12,
//     color: '#666',
//   },
//   progressContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   progressBar: {
//     height: 6,
//     backgroundColor: '#e0e0e0',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#1abc9c',
//     borderRadius: 3,
//   },
//   progressText: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 6,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   controlsContainer: {
//     flexDirection: 'row',
//     gap: 10,
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 12,
//     elevation: 3,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//     letterSpacing: 0.5,
//   },
//   trackingBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1abc9c',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginHorizontal: 16,
//     marginBottom: 8,
//     alignSelf: 'flex-start',
//   },
//   trackingDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#fff',
//     marginRight: 8,
//     animation: 'pulse 2s infinite',
//   },
//   trackingText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   accuracyIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e8f5e9',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   accuracyText: {
//     fontSize: 11,
//     color: '#2e7d32',
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   modal: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     width: '85%',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//     elevation: 8,
//   },
// });

// /* ============================================
//    MAIN COMPONENT
//    ============================================ */
// const ImprovedHomeScreen = () => {
//   const navigation = useNavigation();
//   const mapRef = useRef<MapView>(null);
//   const watchId = useRef<number | null>(null);
//   const reachedStopsRef = useRef(new Set<number>());
//   const appState = useRef(AppState.currentState);
//   const isAnimatingRef = useRef(false);
//   const locationHistoryRef = useRef<LocationCoords[]>([]);

//   // State
//   const [driverName, setDriverName] = useState('');
//   const [path, setPath] = useState<Stop[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);
//   const [passengerCount, setPassengerCount] = useState(0);
//   const [currentLocation, setCurrentLocation] = useState<any>(null);
//   const [routeCompleted, setRouteCompleted] = useState(false);
//   const [customAlertVisible, setCustomAlertVisible] = useState(false);
//   const [trackingStats, setTrackingStats] = useState<TrackingStats>({
//     distance: 0,
//     speed: 0,
//     accuracy: 0,
//     avgSpeed: 0,
//   });
//   const [nextStop, setNextStop] = useState<Stop | null>(null);
//   const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);

//   const animatedCoordinate = useRef(
//     new AnimatedRegion({
//       ...DEFAULT_COORDINATE,
//       latitudeDelta: 0.01,
//       longitudeDelta: 0.01,
//     })
//   ).current;

//   /* ============================================
//      PERMISSIONS & SETUP
//      ============================================ */
//   const requestPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location for accurate bus tracking',
//             buttonPositive: 'Allow',
//             buttonNegative: 'Deny',
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
//         <h6 style="margin:0 0 8px 0;">Enable Location Services for accurate tracking</h6>
//         <p style="margin:8px 0;">Recommended settings:</p>
//         <ul style="padding-left:18px; margin:8px 0;">
//           <li><b>High Accuracy Mode</b></li>
//           <li><b>GPS + Network</b></li>
//         </ul>
//       `,
//       ok: 'Turn on',
//       cancel: 'Cancel',
//       enableHighAccuracy: true,
//       showDialog: true,
//       openLocationServices: true,
//     })
//       .then((success) => console.log('✅ Location services enabled'))
//       .catch((error) => console.log('❌ Location services error:', error));
//   };

//   /* ============================================
//      TIME HELPERS
//      ============================================ */
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

//   /* ============================================
//      STORAGE FUNCTIONS
//      ============================================ */
//   const saveTrackingState = async (value: boolean) => {
//     await AsyncStorage.setItem('isTracking', value ? '1' : '0');
//   };

//   const loadTrackingState = async () => {
//     const value = await AsyncStorage.getItem('isTracking');
//     return value === '1';
//   };

//   const saveReachedStops = async (stops: Set<number>) => {
//     await AsyncStorage.setItem('reachedStops', JSON.stringify(Array.from(stops)));
//   };

//   const loadReachedStops = async () => {
//     const saved = await AsyncStorage.getItem('reachedStops');
//     if (saved) return new Set<number>(JSON.parse(saved));
//     return new Set<number>();
//   };

//   const savePassengerCount = async (count: number) => {
//     await AsyncStorage.setItem('passengerCount', count.toString());
//   };

//   const loadPassengerCount = async () => {
//     const saved = await AsyncStorage.getItem('passengerCount');
//     return saved ? parseInt(saved, 10) : 0;
//   };

//   /* ============================================
//      DISTANCE & SPEED CALCULATIONS
//      ============================================ */
//   const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 6371000; // Earth radius in meters
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);

//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

//     return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
//   };

//   const calculateSpeed = (coords: LocationCoords[]): number => {
//     if (coords.length < 2) return 0;
//     const lastCoord = coords[coords.length - 1];
//     const prevCoord = coords[coords.length - 2];
    
//     const distance = getDistance(
//       prevCoord.latitude,
//       prevCoord.longitude,
//       lastCoord.latitude,
//       lastCoord.longitude
//     );
//     const timeDiff = (lastCoord.timestamp - prevCoord.timestamp) / 1000; // seconds
    
//     if (timeDiff === 0) return 0;
//     const speedMs = distance / timeDiff;
//     return speedMs * 3.6; // Convert m/s to km/h
//   };

//   const calculateAverageSpeed = (coords: LocationCoords[]): number => {
//     if (coords.length < 2) return 0;
//     const totalDistance = coords.reduce((sum, coord, i) => {
//       if (i === 0) return 0;
//       return (
//         sum +
//         getDistance(
//           coords[i - 1].latitude,
//           coords[i - 1].longitude,
//           coord.latitude,
//           coord.longitude
//         )
//       );
//     }, 0);

//     const totalTime = (coords[coords.length - 1].timestamp - coords[0].timestamp) / 1000;
//     return totalTime === 0 ? 0 : (totalDistance / totalTime) * 3.6;
//   };

//   /* ============================================
//      NOTIFICATIONS
//      ============================================ */
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
//           pressAction: { id: 'default' },
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
//         body: 'All stops reached. Great job!',
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

//   /* ============================================
//      API CALLS
//      ============================================ */
//   const sendNextStopNotification = async (nextStop: Stop) => {
//     try {
//       const orgId = await AsyncStorage.getItem('orgId');
//       const driverId = await AsyncStorage.getItem('driver_Id');

//       if (!orgId || !driverId || !nextStop.route_Id || !nextStop.stop_Id) {
//         console.error('❌ Missing required fields');
//         return;
//       }

//       const url = `https://www.vtsmile.in/app/api/driver/track_next_stop_api?orgId=${orgId}&driver_Id=${driverId}&route_Id=${nextStop.route_Id}&stop_Id=${nextStop.stop_Id}`;

//       const res = await axios.post(url);
//       console.log('✅ Next stop notification sent:', res.data);
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
//         Alert.alert('Error', 'Driver credentials not found');
//         return;
//       }

//       const res = await axios.post(
//         `https://www.vtsmile.in/app/api/driver/route_track_plan_api?orgId=${orgId}&driver_Id=${driverId}`
//       );

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
//         setNextStop(route[0]);
//         await AsyncStorage.setItem('route_path', JSON.stringify(route));

//         animatedCoordinate.setValue(route[0]);

//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(route, {
//             edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
//             animated: true,
//           });
//         }, 500);
//       } else {
//         Alert.alert('No Route Found', 'No route assigned for today');
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

//       const response = await axios.post(
//         'https://www.vtsmile.in/app/api/driver/vehicle_track_save_api',
//         params
//       );

//       console.log('✅ Stop saved:', response.data);
//       return response.data.isSuccess;
//     } catch (error: any) {
//       console.error('❌ Save stop error:', error.message);
//       return false;
//     }
//   };

//   /* ============================================
//      STOP DETECTION
//      ============================================ */
//   const checkStopReached = async (lat: number, lng: number) => {
//     if (!path.length || !isTracking) return;

//     for (let i = 0; i < path.length; i++) {
//       if (reachedStopsRef.current.has(i)) continue;

//       const stop = path[i];
//       const dist = getDistance(lat, lng, stop.latitude, stop.longitude);

//       if (dist <= STOP_REACH_RADIUS) {
//         console.log(`🎯 Stop ${i + 1} reached: ${stop.stop_name}`);

//         reachedStopsRef.current.add(i);
//         await saveReachedStops(reachedStopsRef.current);

//         const saved = await saveStopReached(stop, i);

//         if (saved) {
//           await showStopNotification(stop.stop_name, i + 1, path.length);

//           const newCount = passengerCount + stop.passenger_count;
//           setPassengerCount(newCount);
//           await savePassengerCount(newCount);

//           const nextIndex = i + 1;
//           if (nextIndex < path.length) {
//             const next = path[nextIndex];
//             setNextStop(next);
//             await sendNextStopNotification(next);
//           }

//           if (reachedStopsRef.current.size === path.length) {
//             setRouteCompleted(true);
//             stopTracking();
//             await showRouteCompletedNotification();
//             Alert.alert(
//               'Route Completed! 🎉',
//               'All stops reached successfully!',
//               [{ text: 'OK', onPress: () => setRouteCompleted(false) }]
//             );
//           }
//         }
//         break;
//       }
//     }
//   };

//   /* ============================================
//      GPS TRACKING
//      ============================================ */
//   const onLocationUpdate = (position: any) => {
//     if (!path.length) return;

//     const { latitude, longitude, accuracy, speed } = position.coords;
//     const timestamp = Date.now();

//     const newCoord: LocationCoords = {
//       latitude,
//       longitude,
//       accuracy: accuracy || 0,
//       speed: speed || 0,
//       timestamp,
//     };

//     // Keep only last 30 coordinates for history
//     locationHistoryRef.current.push(newCoord);
//     if (locationHistoryRef.current.length > 30) {
//       locationHistoryRef.current.shift();
//     }

//     console.log(`📍 GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy?.toFixed(1)}m)`);

//     setCurrentLocation({ latitude, longitude });

//     // Calculate speeds
//     const currentSpeed = calculateSpeed(locationHistoryRef.current);
//     const avgSpeed = calculateAverageSpeed(locationHistoryRef.current);

//     setTrackingStats((prev) => ({
//       ...prev,
//       speed: Math.max(0, currentSpeed),
//       accuracy: accuracy || 0,
//       avgSpeed: Math.max(0, avgSpeed),
//     }));

//     // IMPROVED: Smoother animation with better sync
//     if (!isAnimatingRef.current) {
//       isAnimatingRef.current = true;

//       animatedCoordinate.timing({
//         latitude,
//         longitude,
//         duration: 800, // Adjusted for smoother transitions
//         useNativeDriver: false,
//       }).start(() => {
//         isAnimatingRef.current = false;
//       });

//       // Keep camera in sync
//       if (isTracking) {
//         mapRef.current?.animateCamera(
//           {
//             center: { latitude, longitude },
//             zoom: 17,
//           },
//           { duration: 800 }
//         );
//       }
//     }

//     checkStopReached(latitude, longitude);
//   };

//   const startTracking = async () => {
//     if (isTracking) {
//       Alert.alert('Already Tracking', 'GPS tracking is already active');
//       return;
//     }

//     if (!path.length) {
//       Alert.alert('No Route', 'Please load a route first');
//       return;
//     }

//     const hasPermission = await requestPermission();
//     if (!hasPermission) {
//       Alert.alert('Permission Required', 'Location permission is needed');
//       return;
//     }

//     setIsTracking(true);
//     await saveTrackingState(true);
//     locationHistoryRef.current = [];

//     console.log('🚀 GPS tracking started');

//     watchId.current = Geolocation.watchPosition(
//       (position) => onLocationUpdate(position),
//       (error) => {
//         console.error('GPS Error:', error);
//         Alert.alert('GPS Error', error.message);
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
//     console.log('🛑 GPS tracking stopped');
//     setIsTracking(false);
//     await saveTrackingState(false);

//     if (watchId.current !== null) {
//       Geolocation.clearWatch(watchId.current);
//       watchId.current = null;
//     }
//     locationHistoryRef.current = [];
//   };

//   const handleExitApp = () => {
//     setCustomAlertVisible(false);
//     setTimeout(() => {
//       BackHandler.exitApp();
//     }, 100);
//   };

//   /* ============================================
//      LIFECYCLE
//      ============================================ */
//   useEffect(() => {
//     fetchRouteFromAPI();
//   }, []);

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
//         console.log('App returned to foreground');
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
//         setCustomAlertVisible(true);
//         return true;
//       };

//       const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
//       return () => backHandler.remove();
//     }, [])
//   );

//   /* ============================================
//      RENDER
//      ============================================ */
//   if (loading) {
//     return (
//       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
//         <ActivityIndicator size="large" color="#1abc9c" />
//         <Text style={{ marginTop: 15, fontSize: 16, color: '#666', fontWeight: '600' }}>
//           Loading route...
//         </Text>
//       </View>
//     );
//   }

//   const progressPercent = path.length > 0 ? (reachedStopsRef.current.size / path.length) * 100 : 0;
//   const nextStopIndex = Array.from(reachedStopsRef.current).length;
//   const hasNextStop = nextStopIndex < path.length && nextStop;

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.container}>
//         {/* IMPROVED HEADER */}
//         <LinearGradient
//           colors={['#0d47a1', '#1565c0']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.header}
//         >
//           <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
//             <MaterialIcons name="menu" size={26} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Bus Live Tracking</Text>
//           {isTracking && (
//             <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
//               <View
//                 style={{
//                   width: 10,
//                   height: 10,
//                   borderRadius: 5,
//                   backgroundColor: '#4caf50',
//                   marginRight: 8,
//                 }}
//               />
//               <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Live</Text>
//             </View>
//           )}
//         </LinearGradient>

//         {/* MAP WITH ENHANCED MARKERS */}
//         <MapView
//           ref={mapRef}
//           provider={PROVIDER_GOOGLE}
//           style={styles.map}
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
//               strokeWidth={5}
//               strokeColor="#1abc9c"
//               lineDashPattern={[5, 5]}
//             />
//           )}

//           {/* Accuracy Circle */}
//           {currentLocation && (
//             <Circle
//               center={currentLocation}
//               radius={trackingStats.accuracy}
//               fillColor="rgba(26, 188, 156, 0.1)"
//               strokeColor="rgba(26, 188, 156, 0.3)"
//               strokeWidth={1}
//             />
//           )}

//           {/* Animated Bus Marker */}
//           <Marker.Animated
//             coordinate={animatedCoordinate}
//             anchor={{ x: 0.5, y: 0.5 }}
//             flat={true}
//           >
//             <View style={{ alignItems: 'center' }}>
//               <Image
//                 source={require('../assets/Yellow school bus illustration.png')}
//                 style={{ width: 70, height: 70 }}
//               />
//             </View>
//           </Marker.Animated>

//           {/* Stop Markers */}
//           {path.map((stop, i) => {
//             const isReached = reachedStopsRef.current.has(i);
//             const isNext = !isReached && i === nextStopIndex;

//             return (
//               <Marker
//                 key={`stop-${i}`}
//                 coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
//                 title={`Stop ${i + 1}: ${stop.stop_name}`}
//                 description={`Passengers: ${stop.passenger_count}`}
//               >
//                 <View style={{ alignItems: 'center' }}>
//                   <View
//                     style={{
//                       backgroundColor: isReached ? '#27ae60' : isNext ? '#ff6b6b' : '#95a5a6',
//                       borderRadius: 24,
//                       width: 48,
//                       height: 48,
//                       justifyContent: 'center',
//                       alignItems: 'center',
//                       borderWidth: isNext ? 3 : 2,
//                       borderColor: '#fff',
//                       elevation: 3,
//                     }}
//                   >
//                     <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
//                       {i + 1}
//                     </Text>
//                   </View>
//                   {isNext && (
//                     <View
//                       style={{
//                         position: 'absolute',
//                         width: 60,
//                         height: 60,
//                         borderRadius: 30,
//                         borderWidth: 2,
//                         borderColor: '#ff6b6b',
//                         top: -6,
//                         left: -6,
//                       }}
//                     />
//                   )}
//                 </View>
//               </Marker>
//             );
//           })}
//         </MapView>

//         {/* IMPROVED BOTTOM PANEL */}
//         <View style={styles.bottomPanel}>
//           <ScrollView
//             scrollEnabled={bottomSheetExpanded}
//             bounces={false}
//             showsVerticalScrollIndicator={false}
//           >
//             {/* Driver Info & Status */}
//             <View style={styles.statsContainer}>
//               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//                 <View>
//                   <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>👨‍✈️ Driver</Text>
//                   <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 2 }}>
//                     {driverName}
//                   </Text>
//                 </View>
//                 {isTracking && (
//                   <View style={styles.trackingBadge}>
//                     <View
//                       style={[
//                         styles.trackingDot,
//                         { backgroundColor: '#fff' },
//                       ]}
//                     />
//                     <Text style={styles.trackingText}>TRACKING</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Stats Cards */}
//               <View style={styles.statsRow}>
//                 <View style={[styles.statCard, { borderLeftColor: '#1abc9c' }]}>
//                   <Text style={styles.statLabel}>Speed</Text>
//                   <Text style={styles.statValue}>{trackingStats.speed.toFixed(1)}</Text>
//                   <Text style={styles.statSubtext}>km/h</Text>
//                 </View>
//                 <View style={[styles.statCard, { borderLeftColor: '#ff9f43' }]}>
//                   <Text style={styles.statLabel}>Avg Speed</Text>
//                   <Text style={styles.statValue}>{trackingStats.avgSpeed.toFixed(1)}</Text>
//                   <Text style={styles.statSubtext}>km/h</Text>
//                 </View>
//               </View>

//               <View style={styles.statsRow}>
//                 <View style={[styles.statCard, { borderLeftColor: '#e74c3c' }]}>
//                   <Text style={styles.statLabel}>Passengers</Text>
//                   <Text style={styles.statValue}>{passengerCount}</Text>
//                   <Text style={styles.statSubtext}>picked</Text>
//                 </View>
//                 <View style={[styles.statCard, { borderLeftColor: '#3498db' }]}>
//                   <Text style={styles.statLabel}>Accuracy</Text>
//                   <Text style={styles.statValue}>{trackingStats.accuracy.toFixed(0)}</Text>
//                   <Text style={styles.statSubtext}>meters</Text>
//                 </View>
//               </View>

//               {/* Progress Bar */}
//               <View style={styles.progressContainer}>
//                 <View style={styles.progressBar}>
//                   <View
//                     style={[
//                       styles.progressFill,
//                       { width: `${progressPercent}%` },
//                     ]}
//                   />
//                 </View>
//                 <Text style={styles.progressText}>
//                   {reachedStopsRef.current.size} of {path.length} stops completed
//                 </Text>
//               </View>

//               {/* Next Stop Card */}
//               {hasNextStop && (
//                 <View style={styles.nextStopCard}>
//                   <Text style={styles.nextStopLabel}>📍 Next Stop</Text>
//                   <Text style={styles.nextStopName}>{nextStop.stop_name}</Text>
//                   <Text style={styles.nextStopDetails}>
//                     👥 {nextStop.passenger_count} students waiting
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </ScrollView>

//           {/* Controls */}
//           <View style={styles.controlsContainer}>
//             <TouchableOpacity
//               style={[
//                 styles.button,
//                 {
//                   backgroundColor:
//                     isTracking || !path.length ? '#ccc' : '#1abc9c',
//                 },
//               ]}
//               disabled={isTracking || !path.length}
//               onPress={startTracking}
//             >
//               <Text style={styles.buttonText}>START</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[
//                 styles.button,
//                 {
//                   backgroundColor: !isTracking ? '#ccc' : '#e74c3c',
//                 },
//               ]}
//               disabled={!isTracking}
//               onPress={stopTracking}
//             >
//               <Text style={styles.buttonText}>STOP</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* IMPROVED EXIT MODAL */}
//         <Modal
//           visible={customAlertVisible}
//           transparent
//           animationType="fade"
//           onRequestClose={() => setCustomAlertVisible(false)}
//         >
//           <View style={styles.modal}>
//             <View style={styles.modalContent}>
//               <MaterialIcons name="exit-to-app" size={40} color="#e74c3c" />
//               <Text
//                 style={{
//                   fontSize: 18,
//                   fontWeight: '700',
//                   color: '#1a1a1a',
//                   marginTop: 16,
//                   marginBottom: 8,
//                 }}
//               >
//                 Exit Application?
//               </Text>
//               <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>
//                 Tracking will stop. Are you sure?
//               </Text>

//               <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
//                 <TouchableOpacity
//                   style={{
//                     flex: 1,
//                     paddingVertical: 12,
//                     backgroundColor: '#f0f0f0',
//                     borderRadius: 8,
//                     alignItems: 'center',
//                   }}
//                   onPress={() => setCustomAlertVisible(false)}
//                 >
//                   <Text style={{ fontWeight: '700', color: '#1a1a1a' }}>Cancel</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={{
//                     flex: 1,
//                     paddingVertical: 12,
//                     backgroundColor: '#e74c3c',
//                     borderRadius: 8,
//                     alignItems: 'center',
//                   }}
//                   onPress={handleExitApp}
//                 >
//                   <Text style={{ fontWeight: '700', color: '#fff' }}>Exit</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default ImprovedHomeScreen;
