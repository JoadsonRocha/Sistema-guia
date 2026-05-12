import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Safety check for empty or missing config
const safeConfig = firebaseConfig || {};

const app = initializeApp(safeConfig);
export const db = getFirestore(app, (safeConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection (Safe attempt)
async function testConnection() {
  if (!(safeConfig as any).apiKey) {
    console.error("Firebase API Key is missing. Check your configuration.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error) {
    console.warn("Initial connection test failed, but app may still work:", error);
  }
}
testConnection();

export { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export type { User };
