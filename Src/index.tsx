
import React from "react";

import { AuthNavigator, DrawerNav, } from "../navigation/AuthNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../Root/store";



const MainScreen = () => {
const isAuthenticated = useSelector((state: RootState) => state.userData.isAuthenticated);
  return (
    <NavigationContainer >        
        {isAuthenticated ? <DrawerNav/> : <AuthNavigator/>} 
     
    </NavigationContainer>
  
  );
};

export default MainScreen;
