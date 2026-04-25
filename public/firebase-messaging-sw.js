importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This config must match your src/firebase/config.ts
firebase.initializeApp({
  apiKey: "AIzaSyC3WscspmJTDO4TSmjaBm1zjD7nZm7Dndc",
  authDomain: "studio-2095008967-a581a.firebaseapp.com",
  projectId: "studio-2095008967-a581a",
  storageBucket: "studio-2095008967-a581a.firebasestorage.app",
  messagingSenderId: "582176676121",
  appId: "1:582176676121:web:a858ab7e28997d5db64d88"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});