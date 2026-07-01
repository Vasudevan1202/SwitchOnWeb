/* Firebase Firestore integration placeholder */
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

window.FIREBASE_CONFIG = firebaseConfig;

window.submitToFirestore = async (collectionName, payload) => {
  if (!window.firebase || !window.firebase.firestore) {
    console.warn('Firebase SDK is not loaded. Form submission is simulated locally.');
    return { ok: true, simulated: true };
  }

  const db = window.firebase.firestore();
  await db.collection(collectionName).add(payload);
  return { ok: true, simulated: false };
};
