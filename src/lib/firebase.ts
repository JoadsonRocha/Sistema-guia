import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Safety check for empty or missing config
const safeConfig = (firebaseConfig || {}) as any;

const app = initializeApp(safeConfig);
console.log("🦅 [Firebase Initialized] Project:", safeConfig.projectId, "DB:", safeConfig.firestoreDatabaseId);

export const db = getFirestore(app, safeConfig.firestoreDatabaseId);

// Habilitar Persistência Offline (Requisito: Dependência de Sinal de Internet)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("eagle: persistence failed-precondition (multiple tabs)");
    } else if (err.code === 'unimplemented') {
      console.warn("eagle: persistence unimplemented (browser)");
    }
  });
} catch (e) {
  console.warn("indexedDB initialization was blocked inside this environment sandbox:", e);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Log de verificação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("🦅 [Auth Change] Logged in as:", user.email, "UID:", user.uid);
  } else {
    console.log("🦅 [Auth Change] No user logged in.");
  }
});

// Validate Connection removed to avoid unauthenticated connection-test permission alerts on load.

export { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail, sendEmailVerification };
export type { User };
