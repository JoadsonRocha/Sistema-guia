import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  user: User | null;
  role: 'coordenador' | 'lider' | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, role: 'coordenador' | 'lider') => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'coordenador' | 'lider' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const handleFirestoreError = (error: any, operationType: string, path: string) => {
      let errorMessage = error.message;
      if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = "Acesso Negado: Sem permissão para ler perfil.";
      }
      const errInfo = {
        error: errorMessage,
        operationType,
        path,
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          isAnonymous: auth.currentUser?.isAnonymous,
        }
      };
      console.error("Erro no Firestore:", JSON.stringify(errInfo));
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setRole(data.role);
            setIsAdmin(data.role === 'coordenador' || currentUser.email?.toLowerCase() === "sergiosilvabezerra@gmail.com");
          } else if (currentUser.email?.toLowerCase() === "sergiosilvabezerra@gmail.com") {
            setIsAdmin(true);
            setRole('coordenador');
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, 'get', `users/${currentUser.uid}`);
          setLoading(false);
        });
      } else {
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, userRole: 'coordenador' | 'lider') => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        // Create profile in Firestore
        await setDoc(doc(db, 'users', res.user.uid), {
          email: email,
          role: userRole,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, loginWithEmail, signupWithEmail, logout, isAdmin }}>
      {(!loading || user) ? children : (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
           <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-zinc-400 font-bold uppercase tracking-widest">Iniciando Segurança Águia...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
}
