/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import 'react-native-gesture-handler';
import { Provider} from 'react-redux';
import { store } from './Root/store';
import MainScreen from './Src';
import FlashMessage from 'react-native-flash-message';
import usePushNotification from './Src/pushNotification';
import useInAppUpdate from './Src/hooks/useInAppUpdate';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
usePushNotification();
 	useInAppUpdate();
	return (
	<Provider store={store}>
		<SafeAreaProvider>
			<MainScreen />
			<FlashMessage position="bottom" />
		</SafeAreaProvider>
		</Provider>
	);
}

export default App;