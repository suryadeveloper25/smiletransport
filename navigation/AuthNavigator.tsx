import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { ApplicationStackParamList, AuthStackParamList, DrawerNaviagtorParamList,  } from './NavigatorRoot';
import CustomDrawer from './CustomDrawer';
import HomeScreen from '../Src/Home';
import ProfileScreen from '../Src/Profile';
import SettingScreen from '../Src/Setting';
import NotificationScreen from '../Src/Notification';
import LoginScreen from '../Src/Login';
import AboutScreen from '../Src/About';
import ResetPasswordScreen from '../Src/Resetpassword';
import SplashScreen from '../Src/Splash';

const Stack = createStackNavigator<ApplicationStackParamList>();

export const ApplicationNavigator: React.FC = () => {
  // const { variant } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
       <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DrawerNav" component={DrawerNav} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name= 'Setting' component={SettingScreen} options={{ headerShown:false}} />
      <Stack.Screen name= 'About' component={AboutScreen} options={{headerShown: false}} />
    </Stack.Navigator>
  );
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator initialRouteName='Splash' screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name='Login' component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="DrawerNav" component={DrawerNav} options={{ headerShown: false }} />

    </AuthStack.Navigator>
  );
}




const Drawer = createDrawerNavigator<DrawerNaviagtorParamList>();

export const DrawerNav: React.FC = () => {
  
  return (
    <Drawer.Navigator initialRouteName='Home'   detachInactiveScreens={false}   
      screenOptions={{
        drawerStyle: { width: '80%', }
      }}
      drawerContent={(props) => <CustomDrawer  {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeScreen}  options={{ headerShown: false }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Drawer.Screen name= 'Setting' component={SettingScreen} options={{ headerShown:false}} />
      <Drawer.Screen name= 'About' component={AboutScreen} options={{headerShown: false}} />
      <Drawer.Screen name='Login' component={LoginScreen}   options={{headerShown: false}} />
    </Drawer.Navigator>
  )
}