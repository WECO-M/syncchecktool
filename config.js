/* IORA Group · SyncCheck configuration.
   FIREBASE_CONFIG: null = local mode (no login, reads ..\local\data.local.js on this laptop only).
   With the Firebase web config below the login is ON. The config is safe to publish: it only identifies the project,
   the Firestore rules protect the data. Never put data in this folder. */
window.SC_CONFIG = {
 FIREBASE_CONFIG: {
  apiKey: "AIzaSyCs9m6us8WObOXUSmgVpPUnUp6wOKqHflg",
  authDomain: "syncchecktool.firebaseapp.com",
  projectId: "syncchecktool",
  storageBucket: "syncchecktool.firebasestorage.app",
  messagingSenderId: "604899321151",
  appId: "1:604899321151:web:75acea86df705855ec5f8a"
 },
 ADMIN_EMAIL: "ng_thianwei@iora.com.my",
 LOCAL_DATA: "../local/data.local.js",
};
