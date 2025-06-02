import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyDTNZX_AXpZNSgEnuPY_OXCUJz5GJejn8M",
    authDomain: "my-finances-8ee6f.firebaseapp.com",
    projectId: "my-finances-8ee6f",
    storageBucket: "my-finances-8ee6f.appspot.com",
    messagingSenderId: "200203109264",
    appId: "1:200203109264:web:c8978c1634908dd1a9a915",
    measurementId: "G-N8WCEK7W55"
  };

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If Firebase is already initialized, get the existing app
  if (error.code === 'app/duplicate-app') {
    app = getApp();
  } else {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db, app }; 