import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';
import { useSettingsStore } from "../store/settingsStore";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationToken {
  token: string;
  deviceId: string;
  platform: string;
  createdAt: Date;
}

class NotificationService {
  private db = getFirestore();
  private auth = getAuth();

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications are not available in the simulator');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      // Save the token to Firestore
      await this.saveTokenToFirestore(token);

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Save token to Firestore
  private async saveTokenToFirestore(token: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.log('No user logged in, cannot save token');
      return;
    }

    try {
      const userDocRef = doc(this.db, 'users', user.uid);
      await setDoc(userDocRef, {
        fcmToken: token,
        lastTokenUpdate: new Date(),
      }, { merge: true });
      
      console.log('FCM token saved successfully');
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  }

  // Remove token from Firestore
  async removeTokenFromFirestore(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(this.db, 'users', user.uid);
      await setDoc(userDocRef, {
        fcmToken: null,
        lastTokenUpdate: new Date(),
      }, { merge: true });
      
      console.log('FCM token removed successfully');
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }

  // Check if a notification type is enabled
  async shouldSendNotification(type: "priceAlerts" | "portfolioSummary" | "marketUpdates"): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;

    try {
      const userDocRef = doc(this.db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // If no preferences are set, use defaults
      if (!userData?.notificationPreferences) {
        return type === "priceAlerts" || type === "portfolioSummary"; // Default to true for these
      }

      return userData.notificationPreferences[type] ?? true;
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      return false;
    }
  }

  // Set up notification listeners
  setupNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponseReceived: (response: Notifications.NotificationResponse) => void
  ) {
    const notificationListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponseReceived
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  private async getDeviceIdentifier(): Promise<string> {
    // Use a combination of device info to create a unique identifier
    const deviceType = await Device.getDeviceTypeAsync();
    const deviceBrand = Device.brand || "unknown";
    const deviceModel = Device.modelName || "unknown";
    const appId = Application.applicationId || "unknown";
    const deviceId = `${deviceType}-${deviceBrand}-${deviceModel}-${appId}`;
    return deviceId;
  }
}

export const notificationService = new NotificationService(); 