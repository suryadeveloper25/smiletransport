import type { StackScreenProps } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export type ApplicationStackParamList = {
    Home: undefined;
    DrawerNav:undefined;
    Profile: undefined;
    Notification: undefined;
    Setting: undefined;
    ResetPassword: undefined;
    About: undefined;
    Splash: undefined;

    
};

export type ApplicationScreenProps = StackScreenProps<ApplicationStackParamList>;

export type AuthStackParamList = {
    Login: undefined;
    ForgotPassword: undefined;
    Splash:undefined;
    Home: undefined;
    DrawerNav:undefined;
};

export type AuthStackScreenProps = StackScreenProps<AuthStackParamList>;


export type DrawerNaviagtorParamList = {
    Home: undefined;
    Profile: undefined;
    Notification: undefined;
    Setting: undefined;
    ResetPassword: undefined;
    About: undefined;
    Login: undefined;
    DrawerNav: undefined;
    
  };

export type DrawerNaviagtorScreenProps = DrawerNavigationProp<DrawerNaviagtorParamList>;

