

import { db, messaging } from "./firebase";
import { doc, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';

export const FCM_TOKEN_COLLECTION = "fcmTokens";
export const FCM_TOKEN_KEY = "fcmToken"; // key for storing FCM token in Firestore
const VAPID_KEY = "BO_S_rDM4aLr0BhDY-_LrZSUrNR9vusncXZAbqXAmom16C2pDOa5z2VhjcMLYzCWs1bQ-iBJoysEMkeGYdlykJg";

// Requests permissions to show notifications.
async function requestNotificationsPermissions(uid) {
  console.log('Requesting notifications permission...');
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    // Notification permission granted.
    await saveMessagingDeviceToken(uid);
  } else {
    console.log('Unable to get permission to notify.');
  }
}

// Saves the messaging device token to Cloud Firestore.
export async function saveMessagingDeviceToken(uid) {
  console.log('save msg device token');

  try {
    const msg = await messaging();
    const fcmToken = await getToken(msg, { vapidKey: VAPID_KEY });
    if (fcmToken) {
      console.log('Got FCM device token:', fcmToken);
      // Save device token to Firestore
      const tokenRef = doc(db, FCM_TOKEN_COLLECTION, uid);
      await setDoc(tokenRef, { fcmToken });
      // This will fire when a message is received while the app is in the foreground.
      // When the app is in the background, firebase-messaging-sw.js will receive the message instead.
      onMessage(msg, (message) => {
        console.log(
          'New foreground notification from Firebase Messaging!',
          message.notification
        );
        new Notification(message.notification.title, { body: message.notification.body });
      });
    } else {
      // Need to request permissions to show notifications.
      requestNotificationsPermissions(uid);
    }
  } catch (error) {
    console.error('Unable to get messaging token.', error);
  };
}