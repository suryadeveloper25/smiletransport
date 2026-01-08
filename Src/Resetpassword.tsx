import React, { useState,useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, Modal, BackHandler} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
// import { fonts } from '../Root/Config';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { fonts } from '../Root/Config';

function ResetPasswordScreen(Props: any) {
    // const [oldPassword, setOldPassword] = useState('');
    // const [newPassword, setNewPassword] = useState('');
    // const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
 const navigation = useNavigation();
const [customAlertVisible, setCustomAlertVisible] = useState(false);

  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validAlert, setValidAlert] = useState("");

  const [id, setId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

 const getSessionUser = async () => {
    try {
      const staffId = await AsyncStorage.getItem("id");
      const staffMobile = await AsyncStorage.getItem("mobile");
      const staffOrgId = await AsyncStorage.getItem("orgId");
      const staffEmail = await AsyncStorage.getItem("emailId");

      setId(staffId || "");
      setMobile(staffMobile || "");
      setOrgId(staffOrgId || "");
      setEmail(staffEmail || "");
    } catch (err) {
      console.log("Error loading session", err);
    }
  };

    useEffect(() => {
    getSessionUser();
    setTimeout(() => setLoading(false), 2000);
  }, []);

  // === LOGOUT ===
  const logout = async () => {
    await AsyncStorage.removeItem("isloggedIn");
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Ensure Login screen exists in stack
    });
  };

  const confirmLogout = () => {
    setCustomAlertVisible(true); // show custom alert
      return true; 
  };
  // === UPDATE PASSWORD API ===
  const updatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setValidAlert("Please fill all fields!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidAlert("Sorry! Passwords do not match.");
      return;
    }

    try {
      const url = `https://www.vtsmile.in/app/api/faculties/staff_reset_password?Id=${id}&old_password=${oldPassword}&new_password=${newPassword}&orgId=${orgId}`;
      console.log("API:", url);

      const response = await axios.put(url);

      if (response.data.isSuccess) {
        setValidAlert(response.data.message);
        logout(); // force logout after password change
      } else {
        setValidAlert(response.data.message);
      }
    } catch (error) {
      console.log("Error:", error);
      setValidAlert("Something went wrong, please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3c58e8" />
        <Text>Loading...</Text>
      </View>
    );
  }
    return (
        <TouchableWithoutFeedback onPress={() => { setShowDropdown(false); Keyboard.dismiss(); }}>
            <SafeAreaView style={{ flex: 1,backgroundColor:'#220876ff' }}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => Props.navigation.navigate('Setting')}>
                            <MaterialIcons name="arrow-back" size={30} style={{ top: 15, marginLeft: 15, color: '#fff' }} />
                        </TouchableOpacity>
                        <Text style={styles.headerText}>Reset Password</Text>
                        {/* <View style={{ width: wp('10%'), height: wp('10%'), borderRadius: 45, marginLeft: wp('10%'), top: hp('2%'), backgroundColor: '#fbfbfbff', }}>
                            <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
                                {/* <Image source={require('../assest/icons8-administrator-male-50.png')} style={{ width: wp('9%'), height: wp('9%'), alignSelf: 'center', }} /> */}
                            {/* </TouchableOpacity>
                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    <TouchableOpacity onPress={() => { Props.navigation.navigate('HomeTab',{ screen:'Profile'}) }} style={styles.dropdownItem}>
                                        <MaterialIcons name="person" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { Props.navigation.navigate('Setting') }} style={styles.dropdownItem}>
                                        <MaterialIcons name="settings" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Settings</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={confirmLogout} style={styles.dropdownItem}>
                                        <MaterialIcons name="logout" size={20} style={{ color: 'red' }} />
                                        <Text style={styles.dropdownText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
                            )} */}
                        {/* </View> */} 
                    </View>
                    <View style={{ alignItems: 'center', width: "100%", height: '30%', backgroundColor: '#220876ff', borderBottomRightRadius: 18, borderBottomLeftRadius: 18 }}>
                        <Image source={require('../assets/reset-password_11135314.png')} style={{ width: 80, height: 80, marginTop: 50 ,tintColor:'#fff'}} />
                        <Text style={{ color: '#fff', fontSize: 18,
                             fontFamily:fonts.FONT_REGULAR, 
                             marginTop: 10 }}>Change Your Password</Text>
                    </View>
                    {/* Password Form */}
                    <View style={styles.form}>
                        {/* Old Password */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="password" size={24} color="#c73e3eff" />
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="Old Password"
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                placeholderTextColor="#aaa"
                            />
                        </View>
                        {/* New Password */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="password" size={24} color="#c73e3eff" />
                            <TextInput
                                style={styles.input}
                                secureTextEntry
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholderTextColor="#aaa"
                            />
                        </View>
                        {/* Confirm New Password */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="password" size={24} color="#c73e3eff" />
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showPassword}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholderTextColor="#aaa"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={24} color="#c73e3eff" />
                            </TouchableOpacity>
                        </View>
                          {validAlert ? <Text style={styles.error}>{validAlert}</Text> : null}

                        {/* Reset Button */}
                        <TouchableOpacity style={styles.resetButton}onPress={updatePassword}>
                            <Text style={styles.resetButtonText}>RESET</Text>
                        </TouchableOpacity>

                        
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
      width: "80%",height:180,
      backgroundColor: "#fbfbfbff",   // 🔹 Background color
      borderRadius: 12,
      padding: 20,
      alignItems: "center"
    }}>
         
      <Text style={{
        fontSize: 18,
        fontWeight: "bold",
        color: "#c34646ff",           // 🔹 Title text color
        marginBottom: 10,bottom:5,
      }}>
        Confirm Exit
      </Text>
      <MaterialIcons name="crisis-alert" size={24} style={styles.icon2} />
       <Divider style={styles.divider} />

      <Text style={{
        fontSize: 15,
        fontFamily:fonts.FONT_MEDIUM,
        color: "#5e5d5dff",           // 🔹 Message text color
        marginBottom: 20,
        textAlign: "center",bottom:30
      }}>
        Are you sure you want to exit?
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" ,bottom:25}}>
        <TouchableOpacity
          style={{
            backgroundColor: "#bcc6fbff",   // 🔹 Button bg
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
}

export default ResetPasswordScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', width: "100%",  marginBottom: -40,  },
    header: {
        width: '100%', height: 70, backgroundColor: '#220876ff', flexDirection: 'row',
    },
    headerText: { fontSize: 22, color: '#fff', top: hp('2%'),
        fontFamily:fonts.FONT_BOLD,
         marginLeft: wp('20%') },
    topSection: { alignItems: 'center', marginTop: 24 },
    icon: { marginBottom: 6 },
    changePassword: { color: '#ffd600', fontSize: 16, marginBottom: 20 },
    form: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 18,
        shadowColor: '#aaa',
        shadowOpacity: 0.1,
        elevation: 2,
        marginTop: -28, borderWidth: 1, borderColor: 'red',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#e3e3e3',
        borderWidth: 1,
        borderRadius: 7,
        marginBottom: 16,
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: '#222',
        backgroundColor: 'transparent'
    },
    resetButton: {
        backgroundColor: '#343caaff',
        borderRadius: 7,
        paddingVertical: 12,
        marginTop: 12,
        alignItems: 'center'
    },
     icon2: {
    right: 65,bottom:40, color: "#981313ff"
  },
  divider: {
    height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%',bottom:35,
  },
    resetButtonText: { color: '#fff', fontSize: 16,
        fontFamily:fonts.FONT_BOLD 
    },
    bottomIconContainer: { alignItems: 'center', marginTop: 30 },
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
    }, logoutBtn: {
    marginTop: 30,
    alignItems: "center",
  },
  logoutText: {
    color: "#ec6337",
    fontWeight: "500",
  },
      error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

});