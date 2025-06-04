import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationRequest {
  userId: string;
  notification: NotificationPayload;
}

interface NotificationPreferences {
  priceAlerts: boolean;
  portfolioSummary: boolean;
  marketUpdates: boolean;
}

// Constants for better maintainability
const PRICE_CHANGE_THRESHOLD = 0.05; // 5%

// Create a reference to the function
const sendNotificationFunction = functions.https.onCall<NotificationRequest>({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  try {
    const { userId, notification } = request.data;

    if (!userId || !notification) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: userId and notification"
      );
    }

    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      throw new functions.https.HttpsError(
        "not-found",
        "User has no FCM token"
      );
    }

    // Check notification preferences
    const preferences = userData.notificationPreferences as NotificationPreferences | undefined;
    const notificationType = notification.data?.type;

    // If preferences exist and the notification type is disabled, don't send
    if (preferences && notificationType) {
      switch (notificationType) {
        case "price_change":
          if (!preferences.priceAlerts) {
            return { success: false, reason: "preferences_disabled" };
          }
          break;
        case "portfolio_summary":
          if (!preferences.portfolioSummary) {
            return { success: false, reason: "preferences_disabled" };
          }
          break;
        case "market_update":
          if (!preferences.marketUpdates) {
            return { success: false, reason: "preferences_disabled" };
          }
          break;
      }
    }

    const message = {
      token: userData.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
    };

    await admin.messaging().send(message);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send notification",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Export the function for direct use
export const sendNotification = sendNotificationFunction;

// Example function to send a notification when an asset's price changes significantly
export const notifyPriceChange = functions.firestore.onDocumentUpdated(
  "users/{userId}/assets/{assetId}",
  async (event) => {
    try {
      if (!event.data) {
        return null;
      }

      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      if (!beforeData || !afterData) {
        return null;
      }

      const beforePrice = beforeData.currentPrice || 0;
      const afterPrice = afterData.currentPrice || 0;
      const change = ((afterPrice - beforePrice) / beforePrice) * 100;

      // Only notify if price change is significant (e.g., > 5%)
      if (Math.abs(change) > PRICE_CHANGE_THRESHOLD * 100) {
        const userId = event.params.userId;
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const userData = userDoc.data();

        // Check if price alerts are enabled
        const preferences = userData?.notificationPreferences as NotificationPreferences | undefined;
        if (preferences && !preferences.priceAlerts) {
          console.log("Price alerts disabled for user:", userId);
          return null;
        }

        const assetName = afterData.name || "Asset";
        const direction = change > 0 ? "increased" : "decreased";
        const absChange = Math.abs(change).toFixed(2);

        const notification = {
          title: "Price Alert",
          body: `${assetName} has ${direction} by ${absChange}%`,
          data: {
            type: "price_change",
            assetId: event.params.assetId,
            change: change.toString(),
          },
        };

        // Call the sendNotification function directly using v2 API
        const response = await fetch(
          `https://${process.env.GCLOUD_PROJECT}.cloudfunctions.net/sendNotification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: {
                userId,
                notification,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to call sendNotification function");
        }
      }

      return null;
    } catch (error) {
      console.error("Error in notifyPriceChange:", error);
      return null;
    }
  }
);
