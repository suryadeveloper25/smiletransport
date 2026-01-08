// import React from "react";
// import { View, Text } from "react-native";

// const SettingScreen: React.FC = () => {
//   return (
//     <View>
//       <Text>Attendance Screen</Text>
//     </View>
//   );
// }

// export default SettingScreen;


import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, Modal, BackHandler, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Card, Divider } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { logoutAction } from '../Root/userAction';
import { useDispatch } from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';
import { fonts } from '../Root/Config';

const SettingScreen = (Props: any) => {
const [showDropdown, setShowDropdown] = useState(false);
 const navigation = useNavigation();
   const [isLoading, setIsLoading] = useState(true);
   const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const dispatch = useDispatch()
  const logout = async () => {
try {
    await AsyncStorage.removeItem("FCM Token");
    await AsyncStorage.removeItem("sessionToken"); // if you store login token
    await AsyncStorage.removeItem("isLoggedIn");   // if you track login
    // ⚠️ Don’t remove staffId, orgId unless you re-save them on next login
    dispatch(logoutAction());
    navigation.navigate("Login");
  } catch (e) {
    console.log("Error during logout", e);
  }
  }
    const confirmLogout = () => {
        setCustomAlertVisible(true); // show custom alert
         return true; // prevent default back action
      };
 useFocusEffect(
     useCallback(() => {
    setIsLoading(true);
        setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    },[])
  );
   if (isLoading) {
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3c58e8" />
               <Text style={{ marginTop: 10,fontFamily:'Poppins-Regular'}}>Loading...</Text>
          </View>
        );
      }

    return (
        <TouchableWithoutFeedback onPress={() => { setShowDropdown(false); Keyboard.dismiss(); }}>
            <SafeAreaView style={{ flex: 1,backgroundColor:'#220876ff' }}>
              
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity>
                            <MaterialIcons name="arrow-back" size={RFValue(24)} style={{ top: hp('2%'), marginLeft: wp('4%'), color: '#fff' }}
                                onPress={() => Props.navigation.navigate('Home')} />
                        </TouchableOpacity>

                        <Text style={styles.headerText} >Setting</Text>

                        <View style={{ width: wp('10%'), height: wp('10%'), borderRadius: 45,marginLeft: wp('23%'), top: hp('2%'), backgroundColor: '#fbfbfbff', }}>
                            <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
                                <Image source={require('../assets/icons8-administrator-male-50.png')} style={{  width: wp('9%'),height: wp('9%'), alignSelf: 'center', }} />
                            </TouchableOpacity>
                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    <TouchableOpacity onPress={() => { Props.navigation.navigate('Profile') }} style={styles.dropdownItem}>
                                        <MaterialIcons name="person" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Profile</Text>
                                    </TouchableOpacity>
                                    {/* <TouchableOpacity onPress={() => { Props.navigation.navigate('Setting') }} style={styles.dropdownItem}>
                                        <MaterialIcons name="settings" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Settings</Text>
                                    </TouchableOpacity> */}
                                    <TouchableOpacity onPress={confirmLogout} style={styles.dropdownItem}>
                                        <MaterialIcons name="logout" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={{ alignItems: 'center', width: "100%", height: '30%', backgroundColor: '#220876ff', borderBottomRightRadius: 18, borderBottomLeftRadius: 18 ,}}>
                        <Image source={require('../assets/setting_18090455.png')} style={{  width: wp('25%'),  height: wp('25%'),marginTop: hp('6%'), tintColor:'#fff'}} />
                        <Text style={{ color: '#fff', fontSize: 18, 
                          fontFamily:fonts.FONT_REGULAR,
                           marginTop: 10 }}>App Setting</Text>
                    </View>

                    <Card style={{ backgroundColor: '#fff', padding:12,top:20, borderRadius: 18, elevation: 8,width:'95%',alignSelf:'center',borderWidth: 1, borderColor: 'red' }}>
                        <Card.Content>
                            <View style={styles.infoRow}>
                                <MaterialIcons name="password" size={25} style={styles.Icon} />
                                <Text style={styles.infoLabel}>Reset Password</Text>
                                <View style={{marginLeft:60}}>
                                <TouchableOpacity>
                                    <MaterialIcons name="arrow-forward-ios" size={20} style={styles.Icon1}
                                        onPress={() => Props.navigation.navigate('ResetPassword')} />
                                </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.infoValue}>To reset your app password</Text>

                            <View style={{ flexDirection: 'row', marginTop: 40, marginLeft: 20 }}>
                                <MaterialIcons name="format-list-bulleted-add" size={25} style={styles.Icon} />
                                <Text style={{ color: '#5e5a5aff', fontSize: 18, 
                                  fontFamily:fonts.FONT_BOLD 
                                  }}>About SMILE Faculty</Text>
                      <View style={{marginLeft:15}}>
                                <TouchableOpacity>
                                    <MaterialIcons name="arrow-forward-ios" size={20} style={{  color: 'red', top: hp('1%'), left: wp('2%'), }}
                                        onPress={() => Props.navigation.navigate('About')} />

                                </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={{ color: '#2d2c2cff', fontSize: 14, marginLeft: 50, bottom: 5,
                              fontFamily:fonts.FONT_REGULAR
                               }}>About app terms and details</Text>

                        </Card.Content>
                    </Card>

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
      width: "80%",height:180,
      backgroundColor: "#fbfbfbff",   // 🔹 Background color
      borderRadius: 12,
      padding: 20,
      alignItems: "center"
  // width: wp('80%'),
  // height: hp('25%'),
  // borderRadius: wp('3%'),
  // padding: wp('10%'),
  // backgroundColor: "#fbfbfbff", 
    }}>
         
      <Text style={{
        fontSize: 18,
        fontWeight: "bold",
        color: "#c34646ff",           // 🔹 Title text color
        marginBottom: 10,bottom:5,
      }}>
        Confirm Logout
      </Text>
      <MaterialIcons name="crisis-alert" size={24} style={styles.icon2} />
       <Divider style={styles.divider} />

      <Text style={{
        fontSize: 15,
        // fontFamily:fonts.FONT_MEDIUM,
        color: "#5e5d5dff",           // 🔹 Message text color
        marginBottom: 20,
        textAlign: "center",bottom:30
      }}>
        Are you sure you want to Logout?
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" ,bottom:25}}>
        <TouchableOpacity
          style={{
            backgroundColor: "#bcc6fbff",   // 🔹 Button bg
            // paddingVertical: 10,
            // paddingHorizontal: 30,
            // borderRadius: 15,
             paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('7%'),
    borderRadius: wp('4%'),
            // marginRight: 10
          }}
          onPress={() => setCustomAlertVisible(false)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>No</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#e53935",   // 🔹 Button bg
            paddingVertical: 10,
            paddingHorizontal: 30,
            borderRadius: 15,marginLeft: 10
          }}
          onPress={logout}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Yes</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

                </View>
                
            </SafeAreaView>

        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', width: "100%", marginBottom: -40,  },
    header: { width: '100%', height: 70, backgroundColor: '#220876ff', flexDirection: 'row', },
    // headerText: {
    //     fontSize: 24, color: '#fff', top: 15, fontFamily:fonts.FONT_BOLD, marginLeft: 90
    // },
    headerText: {
  fontSize: RFValue(20),
  color: '#fff',
  top: hp('2%'),
  fontFamily: fonts.FONT_BOLD,
  marginLeft: wp('30%'),
},
       center: { flex: 1, justifyContent: "center", alignItems: "center" },
    Icon: {
        color: "red", right: 10
    },
    Icon1: {
        color: "red", top: 8
    },
     icon2: {
    right: wp('18%'),bottom: hp('5%'), color: "#981313ff"
  },
  divider: {
    height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%',bottom:35,
  },
    infoRow: { marginBottom: 8, marginLeft: 20, flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    infoLabel: { color: '#5e5a5aff', fontSize: 18, 
      fontFamily:fonts.FONT_BOLD 
    },
    infoValue: { color: '#2d2c2cff', fontSize: 14, marginLeft: 50, bottom: 5, 
      fontFamily:fonts.FONT_REGULAR 
    },

    dropdown: {
        position: 'absolute',
        top: 55,
        right: -10,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        paddingVertical: 10,
        zIndex: 999,
        width: 140,
    },

    dropdownItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },

    dropdownText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
});

export default SettingScreen;

