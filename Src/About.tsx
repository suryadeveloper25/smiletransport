import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TouchableWithoutFeedback, Keyboard, Dimensions, ScrollView, ActivityIndicator, Alert, Modal, BackHandler } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { fonts } from '../Root/Config';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { logoutAction } from '../Root/userAction';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Entypo from 'react-native-vector-icons/Entypo';
// const { height } = Dimensions.get("window");
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { fonts } from '../Root/Config';
import LinearGradient from 'react-native-linear-gradient';

const AboutScreen = (Props: any) => {

  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const dispatch = useDispatch()
  const [customAlertVisible, setCustomAlertVisible] = useState(false);

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
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3c58e8" />
        <Text style={{ marginTop: 10, fontFamily: 'Poppins-Regular' }}>Loading...</Text>
      </View>
    );
  }
  return (
    <TouchableWithoutFeedback onPress={() => { setShowDropdown(false); Keyboard.dismiss(); }}>
      <SafeAreaView style={{ flex: 1, marginBottom: -30, backgroundColor: "#ff9f43" }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#ff9f43', '#ff9f43',]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <TouchableOpacity onPress={() => Props.navigation.navigate('Home')}>
                <MaterialIcons name="arrow-back" size={30} style={{ top: 15, marginLeft: 15, color: '#fff' }} />
              </TouchableOpacity>
              <Text style={styles.headerText}>About</Text>
            </LinearGradient>
          </View>
          <View style={{ alignItems: 'center', width: "100%", height: '80%', borderBottomRightRadius: 18, borderBottomLeftRadius: 18, }}>
            <LinearGradient
              colors={['#ff9f43', '#feca57',]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ alignItems: 'center', width: "100%", height: '30%', borderBottomRightRadius: 18, borderBottomLeftRadius: 18 }}
            >


              <Image source={require('../assets/ic_notification.png')} style={{ width: 80, height: 80, marginTop: 50 }} />
              <Text style={{
                color: '#fff', fontSize: 18,
                fontFamily: fonts.FONT_REGULAR,
                marginTop: 10
              }}>About SMILE Transport</Text>

            </LinearGradient>
          </View>
          {/* Password Form */}
          <View style={styles.form}>
            <ScrollView>
              <Text style={{ color: '#6a6666ff', fontSize: 14, marginTop: 10, letterSpacing: 1, textAlign: 'justify', fontFamily: fonts.FONT_REGULAR }}>{`SMILE Driver – The mobile application provides real-time vehicle tracking and allows parents to view the live location of their child’s transport vehicle. It includes features such as notifications and alerts for pickup, drop-off, delays, and emergencies, which help improve communication and transport safety. The app ensures service quality by offering accurate tracking, regular updates, and easy access to information. Additionally, it provides technical support and user-friendly navigation to ensure a smooth and reliable experience for all users.`}

              </Text>
              <Text style={{
                color: 'black', fontSize: 16,
                fontFamily: fonts.FONT_BOLD,
                marginTop: 10,
              }}>{'- Powered by VT Technologies'}
              </Text>
            </ScrollView>
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
                backgroundColor: "#fbfbfbff",   // 🔹 Background color
                borderRadius: 12,
                padding: 20,
                alignItems: "center"
              }}>

                <Text style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#c34646ff",           // 🔹 Title text color
                  marginBottom: 10, bottom: 5,
                }}>
                  Confirm Exit
                </Text>
                <MaterialIcons name="crisis-alert" size={24} style={styles.icon2} />
                <Divider style={styles.divider} />

                <Text style={{
                  fontSize: 15,
                  fontFamily: fonts.FONT_MEDIUM,
                  color: "#5e5d5dff",           // 🔹 Message text color
                  marginBottom: 20,
                  textAlign: "center", bottom: 30
                }}>
                  Are you sure you want to exit?
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", bottom: 25 }}>
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
                      borderRadius: 15, marginLeft: 10
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

export default AboutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', width: "100%", marginBottom: -40, },
  header: {
    width: '100%', height: 60, backgroundColor: '#220876ff', flexDirection: 'row',
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: {
    fontSize: 24, color: '#fff', top: hp('2%'),
    fontFamily: fonts.FONT_BOLD,
    marginLeft: wp('30%')
  },
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
    bottom: 450,
    // marginTop: -28, 
    borderWidth: 1, borderColor: 'red',
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
    backgroundColor: '#ff6f3c',
    borderRadius: 7,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center'
  },
  icon2: {
    right: 65, bottom: 40, color: "#981313ff"
  },
  divider: {
    height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%', bottom: 35,
  },
  resetButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
  },

});

