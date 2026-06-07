import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let isFirebaseEnabled = false;
let db: any = null;
let auth: any = null;

if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
    isFirebaseEnabled = true;
    console.log("Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.warn("Failed to initialize Firebase with real credentials, using Local Storage mode:", error);
  }
} else {
  console.log("No active Firebase config key detected. Defaulting to high-quality Client-Side Local Storage (Guest Chat Mode).");
}

export { db, auth, isFirebaseEnabled };

// Test connection to Firestore as outlined in Firebase Integration Skill
export async function testConnection() {
  if (!isFirebaseEnabled || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore client connection validated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Active Firestore client is offline.");
    }
  }
}

// Call connection test
if (typeof window !== "undefined") {
  testConnection();
}
