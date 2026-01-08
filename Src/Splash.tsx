
import React, { useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Image } from 'react-native';

const SplashScreen = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate('Login');
    }, 2000);
  }, [navigation]);

  return (
   
    <View style={styles.container}>
      <View style={styles.centerContent}>
    
        <Image 
          source={require('../assets/ic_notification.png')}
          style={styles.logo}
        />
        <Text style={styles.smileText}>SMILE TRANSPORT</Text>
      </View>
    
      <View style={styles.bottomSection}>
        <Text style={styles.vtText}>
          <Text style={styles.vtText1}>VT</Text> Technologies
        </Text>
      </View>
    </View>
   
    
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6a11cb',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  smileText: {
    fontFamily: 'Roboto-Bold',
    fontSize: 20,
    color: '#fff',
    marginTop: 10,
    letterSpacing: 1,
  },
  bottomSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  vtText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  vtText1: {
     color: '#23d2fe' 
  }
});