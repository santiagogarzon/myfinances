import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface User {
  email: string;
  uid: string;
  displayName: string;
  lastLoginAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<() => void>;
  clearError: () => void;
}

const AUTH_STORAGE_KEY = '@auth_user';

// Helper function to store user data
const storeUserData = async (user: User | null) => {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

// Helper function to load user data
const loadUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  email: firebaseUser.email || '',
  uid: firebaseUser.uid,
  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
  lastLoginAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  signUp: async (email: string, password: string) => {
    try {
      console.log('Starting Firebase sign up process for email:', email);
      set({ isLoading: true, error: null });
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase user created successfully');
      
      const user = convertFirebaseUser(userCredential.user);
      await storeUserData(user);
      await AsyncStorage.setItem('@is_logged_in', 'true');
      
      set({ user, isLoading: false });
      console.log('Sign up completed successfully');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'An error occurred during sign up';
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log('Starting sign in process for email:', email);
      set({ isLoading: true, error: null });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign in successful');
      
      const user = convertFirebaseUser(userCredential.user);
      await storeUserData(user);
      await AsyncStorage.setItem('@is_logged_in', 'true');
      
      set({ user, isLoading: false });
      console.log('Sign in completed successfully');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'An error occurred during sign in';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      console.log('Starting logout process');
      set({ isLoading: true, error: null });
      
      await firebaseSignOut(auth);
      await storeUserData(null);
      await AsyncStorage.removeItem('@is_logged_in');
      
      set({ user: null, isLoading: false });
      console.log('Logout completed successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  initializeAuth: async () => {
    try {
      console.log('Initializing auth...');
      set({ isLoading: true, error: null });

      // Set up Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Firebase auth state changed:', firebaseUser ? 'user logged in' : 'no user');
        
        if (firebaseUser) {
          // User is signed in with Firebase
          const user = convertFirebaseUser(firebaseUser);
          await storeUserData(user);
          await AsyncStorage.setItem('@is_logged_in', 'true');
          set({ user, isLoading: false });
        } else {
          // User is signed out
          await storeUserData(null);
          await AsyncStorage.removeItem('@is_logged_in');
          set({ user: null, isLoading: false });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, isLoading: false, error: 'Failed to initialize authentication' });
      throw error;
    }
  },
}));