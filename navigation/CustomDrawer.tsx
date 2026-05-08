import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useDispatch, } from "react-redux";
import { logoutAction } from '../Root/userAction';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

import { Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../Root/Config";
import axios from "axios";
import { showMessage } from "react-native-flash-message";


interface DrawerContentProps {
  navigation: any;
}

const CustomDrawer: React.FC<DrawerContentProps> = () => {
  //   const [studentData, setStudentData] = useState<any>({});
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch()
  const [ordId, setOrgId] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const getUser = async () => {
    const ordId = await AsyncStorage.getItem("orgId");
    const driverId = await AsyncStorage.getItem("driver_Id");
    setOrgId(ordId || "");
    setDriverId(driverId || "");

  };

  const getProfile = async () => {
    try {
      setLoading(true);

      const ordId = await AsyncStorage.getItem("orgId");
      const driverId = await AsyncStorage.getItem("driver_Id");

      const response = await axios.post(
        "https://www.vtsmile.in/app/api/driver/driver_profile_api?orgId=" + ordId + "&driver_Id=" + driverId,
      );

      // console.log("Profile API Response:", response.data);

      if (response.data.isSuccess) {
        setProfile(response.data.driverDetails[0]);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.log("API Error:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  const Logout = async () => {
    try {
      await AsyncStorage.removeItem("FCM Token");
      await AsyncStorage.removeItem("sessionToken"); // if you store login token
      await AsyncStorage.removeItem("isLoggedIn");   // if you track login

      dispatch(logoutAction());
      navigation.navigate("Login");
      showMessage({
        message: "Logged Out",
        description: "You have successfully logged out!",
        type: "success",
        backgroundColor: "#1E90FF",
        color: "#FFFFFF",
      });
    } catch (e) {
      console.log("Error during logout", e);
      console.log("Logout error", e);
      showMessage({
        message: "Logout Failed",
        description: "Something went wrong. Please try again!",
        type: "danger",
        backgroundColor: "#FF4C4C",
        color: "#FFFFFF",
      });
    }
  }
  const confirmLogout = () => {
    setCustomAlertVisible(true); // show custom alert
    return true; // prevent default back action
  };
  // const confirmLogout = () => {
  //       Alert.alert("Logout Info", "Are you sure you want to logout?", [
  //         { text: "No", style: "cancel",},
  //         { text: "Yes", onPress: Logout },
  //       ]);
  //     };


  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (ordId && driverId) {
      getProfile();
    }
  }, [ordId, driverId]);

  return (
    <View style={styles.container}>

      {/* ================= PROFILE SECTION ================= */}
      <View style={styles.profileSection}>

        <View style={styles.profileImage1}>
          <Image
            source={
              profile?.driver_img && profile.driver_img !== ""
                ? { uri: "https://www.vtsmile.in/app/" + profile.driver_img }
                : require("../assets/icons8-administrator-male-50.png")
            }
            style={styles.profileImage}
          />
          {/* <Image
                        style={styles.profileImage}
                        source={require('../assets/icons8-administrator-male-50.png')}
                      /> */}
          <Text style={styles.welcomeText}>{profile?.driver_name || ""}</Text>
        </View>

        <Text style={styles.welcomeText1}>{profile?.driver_mobile || ""}</Text>
        <Divider style={styles.divider1} />
      </View>


      <View style={styles.menuContainer}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <MaterialIcons name="person" size={30} style={{ marginRight: 10, color: '#fff' }} />
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.link}>Profile</Text>
            </TouchableOpacity>
          </View>


          {/* <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <MaterialIcons name="notifications-none" size={30} style={{ marginRight: 10, color: '#fff' }} />
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Text style={styles.link}>Notification</Text>
          </TouchableOpacity>
        </View> */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <MaterialIcons name="settings" size={30} style={{ marginRight: 10, color: '#fff' }} />
            <TouchableOpacity onPress={() => navigation.navigate('About')}>
              <Text style={styles.link}>Setting</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <MaterialIcons name="logout" size={30} style={{ marginRight: 10, color: '#fff' }} />
            <TouchableOpacity onPress={confirmLogout}>

              <Text style={styles.link}>Logout</Text>
            </TouchableOpacity>
          </View>
          {/* <Text style={styles.footerText}>{'VT Technologies SMILE v14.9'}</Text> */}


        </View>
      </View>

      {/* ================= LOGOUT MODAL ================= */}
      <Modal visible={customAlertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: 'row' }}>
              <MaterialIcons name="crisis-alert" size={hp("4%")} color="#981313" />
              <Text style={styles.modalTitle}>Confirm Logout</Text>
            </View>
            <Divider style={styles.divider} />

            <Text style={styles.modalMsg}>Are you sure you want to Logout?</Text>

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.noBtn}
                onPress={() => setCustomAlertVisible(false)}
              >
                <Text style={styles.btnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.yesBtn}
                onPress={Logout}
              >
                <Text style={styles.btnText}>Yes</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6b93b",
    padding: wp("5%"),
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10
  },

  link: {
    fontSize: 18,
    marginVertical: 5, marginLeft: 10,
    color: '#FFF',
    fontFamily: fonts.ROBOTO_BOLD
  },

  profileSection: {
    // backgroundColor:'red',
    paddingBottom: hp("15%"),
  },
  divider: {
    height: 1, backgroundColor: '#5b5959ff', marginVertical: 10, width: '115%',
  },
  divider1: {
    height: 1, backgroundColor: '#f4f4f4ff', marginVertical: 35, width: '110%', right: wp(3.5)
  },
  profileImage: {
    width: wp("18%"),
    height: hp("20%"),
    resizeMode: "contain",
    bottom: wp('11%'),
    left: wp(1)
  },
  profileImage1: {
    flexDirection: 'row',
    width: wp("20%"),
    height: hp("10%"),
    backgroundColor: '#ffffffff',
    top: hp(5),
    borderRadius: 15

  },

  titleText: {
    color: "#fff",
    fontSize: hp("3%"),
    // fontFamily: fonts.FONT_BOLD,
    bottom: hp(9)
  },


  welcomeText: {
    color: "#fff",
    width: '270%',
    fontSize: 20,
    marginLeft: 20,
    marginTop: 10,
    fontFamily: fonts.ROBOTO_BOLD
  },
  welcomeText1: {
    color: "#fff",
    width: '270%',
    fontSize: 20,
    marginLeft: wp('24%'),
    fontFamily: fonts.ROBOTO_BOLD
  },

  menuContainer: {
    flex: 1,
    bottom: hp("18%"),
    // marginBottom: hp("2%"),
  },

  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp("0.5%"),
  },

  userText: {
    color: "#fff",
    fontSize: hp("2.2%"),
    marginLeft: wp("2%"),
    // fontFamily: fonts.ROBOTO_BOLD
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp("2%"),
    bottom: hp(9)
  },

  menuText: {
    fontSize: hp("2.4%"),
    color: "#fff",
    marginLeft: wp("3%"),
    //   fontFamily:fonts.FONT_BOLD,

  },

  versionLabel: {
    color: "#fff",
    fontSize: hp("1.8%"),
    marginTop: hp("3%"),
    marginLeft: wp("2%"),
    bottom: hp(7),
    // fontFamily: fonts.ROBOTO_BOLD
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: wp("80%"),
    backgroundColor: "#fff",
    padding: hp("3%"),
    borderRadius: wp("4%"),
    alignItems: "center",
  },

  modalTitle: {
    fontSize: hp("2.5%"),
    color: "#c34646",
    fontWeight: "bold",
  },

  modalMsg: {
    fontSize: hp("2%"),
    color: "#555",
    marginTop: hp("2%"),
    textAlign: "center",
  },

  modalRow: {
    flexDirection: "row",
    marginTop: hp("3%"),
  },

  noBtn: {
    backgroundColor: "#bcc6fb",
    paddingVertical: hp("1.2%"),
    paddingHorizontal: wp("8%"),
    borderRadius: wp("3%"),
    marginRight: wp("3%"),
  },

  yesBtn: {
    backgroundColor: "#e53935",
    paddingVertical: hp("1.2%"),
    paddingHorizontal: wp("8%"),
    borderRadius: wp("3%"),
  },

  btnText: {
    fontSize: hp("2%"),
    color: "#fff",
    fontWeight: "bold",
  },
});
