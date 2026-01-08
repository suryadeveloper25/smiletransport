import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationScreen: React.FC = () => {
const navigation =useNavigation();

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#210777ff" }}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity>
            <MaterialIcons name="arrow-back" size={30} style={styles.Icon}
              onPress={() => navigation.navigate('Home')} />
          </TouchableOpacity>
          <Text style={styles.headerText} >Notification</Text>
          <TouchableOpacity>
            <MaterialIcons name="notifications-none" size={30} style={styles.Icon1}
              onPress={() => navigation.navigate('Home')} />
          </TouchableOpacity>

        </View>
        </View>
        </SafeAreaView>
  );
}

export default NotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', width: "100%"},
  header: { width: '100%', height: 60, backgroundColor: '#210777ff', flexDirection: 'row', },
  headerText: {
    flex: 1,
    fontSize: 24, fontWeight: 'bold', color: '#fff', top: 15, fontFamily: 'Poppins', marginLeft: 100
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  Icon: {
    left: 10, top: 20, color: "#fff"
  },
  Icon1: {
    left: 80, top: 20, color: "#fff"
  },

})