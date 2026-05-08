// import React, { useState,useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
// import MaterialIcons from '@react-native-vector-icons/material-icons';
// import { useNavigation } from '@react-navigation/native';
// // import messaging from '@react-native-firebase/messaging';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import axios from 'axios';
// // import { useDispatch } from 'react-redux';
// // import { loginAction } from '../Root/userAction';

// function LoginScreen() {
//   const [mobile, setMobile] = useState("");
//   const [password, setPassword] = useState("");
// //   const [fcmToken, setFcmToken] = useState("");
//   const [passwordVisible, setPasswordVisible] = useState(true);
//   const [isLoading, setIsLoading] = useState(false);
// //   const [errorMsg, setErrorMsg] = useState('');
//   const navigation = useNavigation();


//   useEffect(() => {
//     // getDeviceToken();
//   }, []);


//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>
//         {/* <Image source={require('../assest/smile-logo.png')} /> */}

//         <Text style={styles.subtitle}>Login to access faculty information.</Text>

//         <Text style={styles.label}>Mobile No.</Text>
//         <View style={styles.inputBox}>
//           <MaterialIcons name="phone" size={22} color="#666" style={styles.icon} />
//           <TextInput
//             style={styles.input}
//             placeholderTextColor={'black'}
//             placeholder="Your Mobile No."
//             keyboardType="phone-pad"
//             maxLength={10}
//             value={mobile}
//             onChangeText={setMobile}
//           />
//         </View>
//         {/* {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null} */}

//         <Text style={styles.label}>Password</Text>
//         <View style={styles.inputBox}>
//           <MaterialIcons name="lock" size={22} color="#666" style={styles.icon} />
//           <TextInput
//             style={styles.input}
//             placeholderTextColor={'black'}
//             placeholder="Your Password"
//             secureTextEntry={passwordVisible}
//             value={password}
//             onChangeText={setPassword}
//           />
//           <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
//             <MaterialIcons
//               name={passwordVisible ? "visibility-off" : "visibility"}
//               size={22}
//               color="#666"
//             />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.loginButton} onPress={()=> navigation.navigate('DrawerNav')} disabled={isLoading} >
//           <Text style={styles.loginButtonText}>LOGIN</Text>
//         </TouchableOpacity>
//         <View style={{flexDirection:'row',bottom:15}}>
//           <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
//             <MaterialIcons name="lock" size={22} style={{top:35,right:25,color:'#666'}}/>
//             <Text style={styles.forgot}>Forgot Password?</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//       <Text style={styles.powered}>Powered by VT Technologies</Text>
//     </View>
//   );
// }
// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#11095aff',
//     alignItems: 'center',
//     justifyContent: 'center'
//   },
//     errorText: {
//     color: 'red',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   card: {
//     width: '90%',
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     padding: 20,
//     alignItems: 'center',
//     elevation: 8,
//   },
//   logoText: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     letterSpacing: 2
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#444',
//     marginVertical: 10,
//     textAlign: 'center'
//   },
//   label: {
//     alignSelf: 'flex-start',
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#444',
//     marginTop: 18
//   },
//   inputBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f6f6f6',
//     borderRadius: 8,
//     marginTop: 8,
//     paddingHorizontal: 10,
//     width: '100%'
//   },
//   icon: {
//     marginRight: 8
//   },
//   input: {
//     flex: 1,
//     height: 46,
//     fontSize: 16,
//     color: '#222'
//   },
//   loginButton: {
//     marginTop: 28,
//     backgroundColor: '#5517adff',
//     borderRadius: 26,
//     width: '100%',
//     paddingVertical: 12,
//     alignItems: 'center'
//   },
//   loginButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//     letterSpacing: 1.2
//   },
//   forgot: {
//     marginTop: 16,
//     color: '#444',
//     fontWeight:'bold'
//   },
//   powered: {
//     marginTop: 24,
//     color: '#fff',
//     fontSize: 13,
//     letterSpacing: 1
//   }
// });



import React, { useCallback, useEffect, useState } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  NativeModules,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { loginAction } from '../Root/userAction';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../Root/Config';
import messaging from '@react-native-firebase/messaging';
import { showMessage, } from "react-native-flash-message";
import { SafeAreaView } from 'react-native-safe-area-context';
const { PhoneNumberHint } = NativeModules
const LoginScreen = () => {
  const navigation = useNavigation();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const getPhoneNumber = async () => {
    try {
      const number = await PhoneNumberHint.showPhoneNumberHint();

      const digitsOnly = number.replace(/\D/g, '');
      // Get last 10 digits
      const last10Digits = digitsOnly.slice(-10);

      setMobile(last10Digits);
      // page === 'login' ? generateOtp(last10Digits) : createUser(last10Digits);
    } catch (error: unknown) {
      let message = "Something went wrong while fetching the phone number.";

      // Type-safe way to access message
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }

      console.error("PhoneNumberHint error:", error);
      // showValidationError(message);
    }
  };
  useEffect(() => {
    const timer = setTimeout(async () => {
      // const consent = await AsyncStorage.getItem("phoneNumberConsent");
      // if (consent === "true") {
      getPhoneNumber();
      // }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  const dispatch = useDispatch();

  const getNewFcmToken = async () => {
    try {
      await messaging().deleteToken();
      const newToken = await messaging().getToken();

      if (!newToken) return null;

      await AsyncStorage.setItem("fcmToken", newToken);
      return newToken;

    } catch (e) {
      console.log("FCM token error:", e);
      return null;
    }
  };

  const logIn = async () => {

    if (!mobile || !password) {
      showMessage({
        message: "Error",
        description: "Please enter a valid Mobile Number and Password!",
        type: "danger",
      });
      return;
    }

    setIsLoading(true);

    try {

      // LOGIN API CALL
      const loginURL =
        `https://www.vtsmile.in/app/api/driver/driver_login_api?driver_mobile=${encodeURIComponent(mobile)}&driver_licence=${encodeURIComponent(password)}`;

      // console.log("LOGIN URL:", loginURL);

      const loginRes = await axios.post(loginURL);

      // console.log("LOGIN RESPONSE:", loginRes.data);

      if (!loginRes?.data?.isSuccess) {
        showMessage({
          message: "Login Failed",
          description: "Invalid Mobile Number or Password!",
          type: "danger",
        });
        return;
      }

      const userData = loginRes.data.result?.[0];

      if (!userData) {
        Alert.alert("Login Failed", "Invalid response data!");
        return;
      }

      // GET FCM TOKEN AFTER SUCCESSFUL LOGIN
      const token = await getNewFcmToken();
      console.log("token==>", token)
      if (!token) {
        showMessage({
          message: "FCM Error",
          description: "Unable to get FCM Token",
          type: "danger",
        });
        return;
      }

      const driverId = userData.driver_Id || userData.driver_id;
      const orgId = userData.orgId || userData.org_id;

      // SAVE TOKEN API CALL
      const fcmUpdateURL =
        `https://www.vtsmile.in/app/api/driver/driver_login_fcmtoken_update_api?orgId=${encodeURIComponent(orgId)}&driverId=${encodeURIComponent(driverId)}&FCMToken=${encodeURIComponent(token)}`;

      // console.log("FCM UPDATE URL:", fcmUpdateURL);

      const fcmRes = await axios.post(fcmUpdateURL);

      // console.log("FCM UPDATE RESPONSE:", fcmRes.data);

      if (!fcmRes?.data?.isSuccess) {
        showMessage({
          message: "Warning",
          description: "Login OK but FCM token not updated",
          type: "warning",
        });
      }

      // SAVE DATA
      dispatch(loginAction(userData));

      await AsyncStorage.multiSet([
        ["isLoggedIn", "true"],
        ["mobile", userData.driver_mobile],
        ["driver_Id", String(driverId)],
        ["orgId", String(orgId)],
        ["driver_name", userData.driver_name],
      ]);

      navigation.navigate("DrawerNav");

      showMessage({
        message: "Login Successful",
        description: `Welcome back!`,
        type: "success",
      });

    } catch (error) {

      console.log("LOGIN ERROR:", error?.response?.data || error);

      showMessage({
        message: "Network Error",
        description: "Check your Internet connection",
        type: "danger",
      });

    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();   // or navigation.goBack()
        return true;
      };

      // add listener
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // cleanup correctly
      return () => backHandler.remove();
    }, [])
  );


  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        {/* Top orange header */}
        <View style={styles.headerTop}>
          <LinearGradient
            colors={['#FF5A3C', '#FF5A3C']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View style={styles.headerTriangle}>
          <LinearGradient
            colors={['#FF5A3C', '#FF5A3C']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>


        <View style={styles.content}>
          <Text style={styles.title}>User Login</Text>


          <Text style={styles.label}>Mobile No</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="phone" size={22} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholderTextColor={'black'}
              placeholder="Your Mobile No"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}

            />
          </View>
          {/* {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null} */}

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="lock" size={22} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholderTextColor={'black'}
              placeholder="Your Password"
              secureTextEntry={passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <MaterialIcons
                name={passwordVisible ? "visibility-off" : "visibility"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={logIn} disabled={isLoading} >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>

        </View>



      </View>
      <Text style={styles.powered}>Powered by VT Technologies</Text>
    </SafeAreaView>
  );
};

const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fefefeff', // mint green background
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    height: 110,
    backgroundColor: '#FF5A3C',
    transform: [{ rotate: '-10deg' }],
    width: '120%',
    bottom: 35,
    right: 20

  },

  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontFamily: fonts.ROBOTO_BOLD,
    color: '#444',
    marginTop: 18
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    width: '100%'
  },

  icon: {
    marginRight: 8
  },

  loginButton: {
    marginTop: 28,
    backgroundColor: '#5517adff',
    borderRadius: 26,
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center'
  },
  loginButtonText: {
    color: '#fff',
    fontFamily: fonts.FONT_BOLD,
    fontSize: 16,
    letterSpacing: 1.2
  },
  forgot: {
    marginTop: 16,
    color: '#444',
    fontWeight: 'bold'
  },
  powered: {
    marginTop: 24,
    color: '#981a1aff',
    fontSize: 13,
    letterSpacing: 1,
    fontFamily: fonts.ROBOTO_BOLD,
  },
  headerTriangle: {
    position: 'absolute',
    right: -CARD_WIDTH * 0.3,
    top: -24,
    width: '145%',
    height: 110,
    backgroundColor: '#ffcabaff',
    transform: [{ rotate: '15deg' }],

  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.FONT_BOLD,
    color: '#FF5A3C',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    // height: 46,
    // borderRadius: 12,
    // backgroundColor: '#FFE7DB',
    // paddingHorizontal: 16,
    // marginBottom: 14,
    // fontSize: 14,
    // color: '#FF5A3C',
    flex: 1,
    height: 46,
    borderRadius: 12,
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#222',
    fontFamily: fonts.ROBOTO_MEDIUM,
  },

  loginBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF5A3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.FONT_BOLD,
  },

});

export default LoginScreen;
