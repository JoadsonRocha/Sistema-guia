import React, { createContext, useContext, useEffect, useState } from 'react';
import logoImg from '../assets/logo.png';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail
} from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  user: User | null;
  role: 'coordenador' | 'lider' | null;
  loading: boolean;
  forcePasswordChange: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, role: 'coordenador' | 'lider', extraData?: any) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
  coordinatorId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'coordenador' | 'lider' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState<string | null>(null);

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
        unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setRole(data.role);
            setForcePasswordChange(!!data.forcePasswordChange);
            const isCoordOrAdmin = data.role === 'coordenador';
            setIsAdmin(isCoordOrAdmin);

            if (isCoordOrAdmin) {
              setCoordinatorId(currentUser.uid);
            } else {
              // Priority 1: Check teamId's coordinatorId (source of truth)
              let resolvedCoordId = '';
              if (data.teamId) {
                try {
                  const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
                  if (teamSnap.exists()) {
                    const teamData = teamSnap.data();
                    if (teamData.coordinatorId) {
                      resolvedCoordId = teamData.coordinatorId;
                      console.log(`🧠 [Auth] Resolved coordinatorId ${resolvedCoordId} from teamId: ${data.teamId}`);
                    }
                  }
                } catch (e) {
                  console.error("Error reading team for auth coordinatorId:", e);
                }
              }

              // Priority 2: Fallback to leader email match
              if (!resolvedCoordId && currentUser.email) {
                try {
                  const emailVariants = Array.from(new Set([
                    currentUser.email.toLowerCase(),
                    currentUser.email
                  ])).filter(Boolean);
                  const qTeams = query(collection(db, 'teams'), where('leaderEmail', 'in', emailVariants));
                  const snapTeams = await getDocs(qTeams);
                  if (!snapTeams.empty) {
                    const teamId = snapTeams.docs[0].id;
                    const teamData = snapTeams.docs[0].data();
                    resolvedCoordId = teamData.coordinatorId || '';
                    if (resolvedCoordId) {
                      await setDoc(doc(db, 'users', currentUser.uid), {
                        teamId: teamId,
                        teamName: teamData.name || '',
                        coordinatorId: resolvedCoordId
                      }, { merge: true });
                      console.log(`🧠 [Auth] Healed leader profile using matching team: ${teamId}`);
                    }
                  }
                } catch (e) {
                  console.error("Error matching team by email for auth:", e);
                }
              }

              // Priority 3: Fallback to user document's coordinatorId
              if (!resolvedCoordId && data.coordinatorId) {
                resolvedCoordId = data.coordinatorId;
              }

              // Apply the resolved coordinatorId
              if (resolvedCoordId) {
                setCoordinatorId(resolvedCoordId);
                if (data.coordinatorId !== resolvedCoordId) {
                  try {
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      coordinatorId: resolvedCoordId
                    }, { merge: true });
                    console.log(`🧠 [Auth] Propagated correct coordinatorId ${resolvedCoordId} to user profile`);
                  } catch (e) {
                    console.error("Error writing propagated coordinatorId:", e);
                  }
                }
              } else {
                setCoordinatorId(null);
              }
            }
          } else {
            // The user document does not exist.
            // Let's check if there is a pre_registration for this email.
            if (currentUser.email) {
              try {
                const preRegSnap = await getDoc(doc(db, 'pre_registrations', currentUser.email.toLowerCase()));
                if (preRegSnap.exists()) {
                  const preRegData = preRegSnap.data();
                  if (preRegData.role === 'coordenador') {
                    setRole('coordenador');
                    setIsAdmin(true);
                    setForcePasswordChange(true);
                    setCoordinatorId(currentUser.uid);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      email: currentUser.email.toLowerCase(),
                      role: 'coordenador',
                      name: preRegData.name || currentUser.displayName || 'Coordenador',
                      phone: preRegData.phone || '',
                      forcePasswordChange: true,
                      createdAt: Date.now()
                    });
                    console.log(`🧠 [Auth] Created coordinator profile from pre_registration for ${currentUser.email}`);
                  } else {
                    setRole('lider');
                    setIsAdmin(false);
                    setForcePasswordChange(true);
                    setCoordinatorId(preRegData.coordinatorId || null);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      email: currentUser.email.toLowerCase(),
                      role: 'lider',
                      name: preRegData.name || currentUser.displayName || 'Líder',
                      phone: preRegData.phone || '',
                      address: preRegData.address || '',
                      teamName: preRegData.teamName || '',
                      teamId: preRegData.teamId || '',
                      coordinatorId: preRegData.coordinatorId || '',
                      forcePasswordChange: true,
                      createdAt: Date.now()
                    });
                    console.log(`🧠 [Auth] Created missing profile from pre_registration for ${currentUser.email}`);
                  }
                } else {
                  const emailVariants = Array.from(new Set([
                    currentUser.email.toLowerCase(),
                    currentUser.email
                  ])).filter(Boolean);
                  const qTeams = query(collection(db, 'teams'), where('leaderEmail', 'in', emailVariants));
                  const snapTeams = await getDocs(qTeams);
                  if (!snapTeams.empty) {
                    const teamId = snapTeams.docs[0].id;
                    const teamData = snapTeams.docs[0].data();
                    setRole('lider');
                    setIsAdmin(false);
                    setForcePasswordChange(false);
                    setCoordinatorId(teamData.coordinatorId || null);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      email: currentUser.email.toLowerCase(),
                      role: 'lider',
                      name: teamData.leader || currentUser.displayName || 'Líder',
                      phone: teamData.leaderPhone || '',
                      address: teamData.leaderAddress || '',
                      teamName: teamData.name || '',
                      teamId: teamId,
                      coordinatorId: teamData.coordinatorId || '',
                      createdAt: Date.now()
                    });
                    console.log(`🧠 [Auth] Created profile from matching team for ${currentUser.email}`);
                  } else {
                    // Default fallback: No pre_registration or team. Create a coordinator profile for them
                    // so they have their own campaign!
                    setRole('coordenador');
                    setIsAdmin(true);
                    setForcePasswordChange(false);
                    setCoordinatorId(currentUser.uid);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      email: currentUser.email.toLowerCase(),
                      role: 'coordenador',
                      name: currentUser.displayName || 'Coordenador',
                      createdAt: Date.now()
                    });
                    console.log(`🧠 [Auth] Created isolated coordinator campaign for ${currentUser.email}`);
                  }
                }
              } catch (e) {
                console.error("Error healing missing profile:", e);
              }
            }
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, 'get', `users/${currentUser.uid}`);
          setLoading(false);
        });
      } else {
        setRole(null);
        setIsAdmin(false);
        setForcePasswordChange(false);
        setCoordinatorId(null);
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
    } catch (error: any) {
      if (error?.code === 'auth/cancelled-popup-request') {
        console.warn("Login Google cancelado ou requisição sobreposta:", error);
        return;
      }
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      // Check if user has forcePasswordChange
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));
      if (userDoc.exists() && userDoc.data().forcePasswordChange) {
        // We'll handle this in the App component by checking the role and this flag
      }
    } catch (error: any) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, userRole: 'coordenador' | 'lider', extraData?: any) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        // Create profile in Firestore
        await setDoc(doc(db, 'users', res.user.uid), {
          email: email,
          role: userRole,
          createdAt: Date.now(),
          ...extraData
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

  const changePassword = async (newPass: string) => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado");
    try {
      await updatePassword(auth.currentUser, newPass);
      
      // Clear flag in Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        forcePasswordChange: false
      }, { merge: true });
    } catch (error) {
      console.error("Password change failed:", error);
      throw error;
    }
  };

  const resetPassword = async (userEmail: string) => {
    try {
      await sendPasswordResetEmail(auth, userEmail);
    } catch (error) {
      console.error("Password reset email failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, loginWithEmail, signupWithEmail, logout, isAdmin, forcePasswordChange, changePassword, resetPassword, coordinatorId }}>
      {(!loading || user) ? children : (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 select-none">
          <div className="relative flex flex-col items-center max-w-sm w-full text-center">
            {/* Logo container with subtle ambient glow */}
            <div className="relative mb-6">
              <div className="absolute -inset-2 bg-blue-600/20 rounded-full blur-xl animate-pulse" />
              <img 
                src={logoImg} 
                onError={(e) => { 
                  const t = e.currentTarget; 
                  if (!t.dataset.fallback) { 
                    t.dataset.fallback = 'true'; 
                    t.src = '/logo.png'; 
                  } 
                }} 
                alt="Logo Nexus Política" 
                className="relative w-24 h-24 object-contain mx-auto drop-shadow-md"
              />
            </div>
            
            {/* Loading Spinner */}
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            
            {/* System Title & Status */}
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">Nexus Política</h2>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Iniciando sistema seguro...</p>
          </div>
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
