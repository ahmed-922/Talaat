// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaRLZnBvzmpITAHd9gKhMcl4BQFU9lJPI",
  authDomain: "taskat-a0d3d.firebaseapp.com",
  projectId: "taskat-a0d3d",
  storageBucket: "taskat-a0d3d.firebasestorage.app",
  messagingSenderId: "1055116345617",
  appId: "1:1055116345617:web:377497f2becc9847bcccb0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };