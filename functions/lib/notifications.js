"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyPriceChange = exports.sendNotification = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
// Constants for better maintainability
const PRICE_CHANGE_THRESHOLD = 0.05; // 5%
// Create a reference to the function
const sendNotificationFunction = functions.https.onCall({
    cors: true,
    maxInstances: 10,
}, async (request) => {
    try {
        const { userId, notification } = request.data;
        if (!userId || !notification) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields: userId and notification");
        }
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.fcmToken)) {
            throw new functions.https.HttpsError("not-found", "User has no FCM token");
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
    }
    catch (error) {
        console.error("Error sending notification:", error);
        throw new functions.https.HttpsError("internal", "Failed to send notification", error instanceof Error ? error.message : "Unknown error");
    }
});
// Export the function for direct use
exports.sendNotification = sendNotificationFunction;
// Example function to send a notification when an asset's price changes significantly
exports.notifyPriceChange = functions.firestore.onDocumentUpdated("users/{userId}/assets/{assetId}", async (event) => {
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
            const response = await fetch(`
                https://${process.env.GCLOUD_PROJECT}.cloudfunctions.net/sendNotification`, {
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
            });
            if (!response.ok) {
                throw new Error("Failed to call sendNotification function");
            }
        }
        return null;
    }
    catch (error) {
        console.error("Error in notifyPriceChange:", error);
        return null;
    }
});
//# sourceMappingURL=notifications.js.map