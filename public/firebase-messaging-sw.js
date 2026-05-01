
// Standalone Service Worker for Native-Style Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC3WscspmJTDO4TSmjaBm1zjD7nZm7Dndc",
  authDomain: "studio-2095008967-a581a.firebaseapp.com",
  projectId: "studio-2095008967-a581a",
  storageBucket: "studio-2095008967-a581a.firebasestorage.app",
  messagingSenderId: "582176676121",
  appId: "1:582176676121:web:a858ab7e28997d5db64d88"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970',
    data: { url: '/' }, // Tapping notification opens the app root
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
