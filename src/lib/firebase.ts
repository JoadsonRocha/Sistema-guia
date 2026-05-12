import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Safety check for empty or missing config
const safeConfig = firebaseConfig || {};

const app = initializeApp(safeConfig);
// Para o banco de dados padrão, muitas vezes é melhor não passar o ID se for "(default)"
export const db = (safeConfig as any).firestoreDatabaseId && (safeConfig as any).firestoreDatabaseId !== "(default)"
  ? getFirestore(app, (safeConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Log de verificação (visível apenas no console do desenvolvedor)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("🦅 [Sistema Águia] Usuário Conectado:", user.email, "UID:", user.uid);
  } else {
    console.warn("🦅 [Sistema Águia] Nenhum usuário autenticado.");
  }
});

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
