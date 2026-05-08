// import React from "react";
// import { View, Text } from "react-native";

// const ProfileScreen: React.FC = () => {
//   return (
//     <View>
//       <Text>Profile Screen</Text>
//     </View>
//   );
// }   

// export default ProfileScreen;


import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fonts } from '../Root/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const ProfileScreen: React.FC = (Props: any) => {

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

  useEffect(() => {
    getUser();
    getProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3c58e8" />
        <Text style={{ marginTop: 10, fontFamily: 'Poppins-Regular' }}>Loading...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, marginBottom: -50, backgroundColor: "#ff9f43"  }}>


      <View style={styles.container}>

        <View style={styles.profileHeader}>


          <LinearGradient
            colors={['#ff9f43', '#feca57',]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.9 }}
            style={styles.profileHeader1}
          // style={{width:"100%",height:'50%'}}             
          >
            <TouchableOpacity >
              <MaterialIcons name="arrow-back" size={24} style={styles.icon1}
                onPress={() => Props.navigation.navigate('Home')} />
            </TouchableOpacity>
            <Image
              source={
                profile?.driver_img && profile.driver_img !== ""
                  ? { uri: "https://www.vtsmile.in/app/" + profile.driver_img }
                  : require("../assets/icons8-administrator-male-50.png")
              }
              style={styles.avatar}
            />

            {/* <Image
        source={{ uri: "https://www.vtsmile.in/app/" + profile.driver_img }}
        style={styles.avatar}
    /> */}

          </LinearGradient>
        </View>


        {/* Profile Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>USER PROFILE</Text>
          {profile && (
            <>
              <View style={{ flexDirection: 'row' }}>
                <MaterialIcons name="person" size={24} style={styles.icon} />
                <Text style={styles.labal}>Name :</Text>
                <Text style={styles.value}>{profile.driver_name}</Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <MaterialIcons name="email" size={24} style={styles.icon} />
                <Text style={styles.labal}>Licence No :</Text>
                <Text style={styles.value}>{profile.driver_licence}</Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <MaterialIcons name="phone" size={24} style={styles.icon} />
                <Text style={styles.labal}>Mobile No :</Text>
                <Text style={styles.value}>{profile.driver_mobile}</Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <MaterialIcons name="location-on" size={24} style={styles.icon} />
                <Text style={styles.labal}>Adhar No :</Text>
                <Text style={styles.value}>{profile.driver_adhar}</Text>
              </View>
            </>
          )}

        </View>
      </View>
    </SafeAreaView>
  );
}
export default ProfileScreen;

// StyleSheet for the above UI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // paddingTop: 40,
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 40,
    marginBottom: -40,

  },
  profileHeader1: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 45,
    marginBottom: -80,
    bottom: 40

  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  labal: {
    fontSize: 18, fontFamily: fonts.ROBOTO_BOLD, marginLeft: 10, marginTop: 20
  },
  value: {
    fontSize: 16, fontFamily: fonts.ROBOTO_MEDIUM, marginLeft: 20, marginTop: 20, top: 3,
    width: '75%'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    marginBottom: 20
  },
  name: {
    marginTop: 20,
    fontFamily: fonts.ROBOTO_BOLD,
    fontSize: 18,
    color: '#130f0fff',

  },

  formCard: {
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 12,
    width: '90%',
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,

  },
  formTitle: {
    fontFamily: fonts.ROBOTO_BOLD,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },

  icon: {
    marginTop: 20,
    color: '#1e1d1fff',
  },
  icon1: {
    right: 160,
    bottom: 20,
    color: '#ffffffff',
  },


});