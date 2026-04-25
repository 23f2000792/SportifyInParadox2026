// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

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
  const notificationTitle = payload.notification.title || 'Sportify Update';
  const notificationOptions = {
    body: payload.notification.body || 'New broadcast available!',
    icon: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970',
    badge: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970',
    data: {
      url: '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});