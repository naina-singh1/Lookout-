import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1kAXu5Tk8pr-o2IbcG2JuKRnqbH0vKsg",
  authDomain: "lookout-7d0fa.firebaseapp.com",
  projectId: "lookout-7d0fa",
  storageBucket: "lookout-7d0fa.firebasestorage.app",
  messagingSenderId: "443067175529",
  appId: "1:443067175529:web:d6ffd04c41b640b4a548f8",
};

// Guard against duplicate initialization on Expo Fast Refresh
const existingApps = getApps();
const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = existingApps.length === 0
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app);