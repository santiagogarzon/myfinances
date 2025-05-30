import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with default persistence
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db, app }; 