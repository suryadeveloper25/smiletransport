

import { combineReducers,createStore } from "redux";
// import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "@react-native-async-storage/async-storage";
import userReducer from "./UserReducer";



// persist config
const persistConfig = {
  key: "root",
  storage,
};

// root reducer
const rootReducer = combineReducers({
  userData: userReducer,
});

// wrap persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// configure store
export const store = createStore(persistedReducer)  

export const persistor = persistStore(store);

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
