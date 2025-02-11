// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFPo6kan3TsA-8ak-y6aowHJqrwZedAUo",
  authDomain: "talaat-c40db.firebaseapp.com",
  projectId: "talaat-c40db",
  storageBucket: "talaat-c40db.firebasestorage.app",
  messagingSenderId: "724861850438",
  appId: "1:724861850438:web:fa8fb5ed3edcfa76f60b47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, app, auth };
