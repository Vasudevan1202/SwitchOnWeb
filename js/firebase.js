/* Firebase Firestore integration */
const firebaseConfig = window.FIREBASE_CONFIG || null;

if (!firebaseConfig) {
  console.warn('Firebase configuration is missing. Firestore submissions will be queued locally.');
}

if (window.firebase && window.firebase.initializeApp && firebaseConfig) {
  if (!window.firebase.apps || window.firebase.apps.length === 0) {
    window.firebase.initializeApp(firebaseConfig);
  }
}

window.submitToFirestore = async (collectionName, payload) => {
  if (!window.firebase || !window.firebase.firestore) {
    console.warn('Firebase SDK is not loaded. Form submission is simulated locally.');
    return { ok: true, simulated: true };
  }

  const db = window.firebase.firestore();
  await db.collection(collectionName).add(payload);
  return { ok: true, simulated: false };
};
