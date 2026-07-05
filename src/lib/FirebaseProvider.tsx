import React, { createContext, useContext, useEffect, useState } from 'react';
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
            const isCoordOrAdmin = data.role === 'coordenador' || (data.role !== 'lider' && currentUser.email?.toLowerCase() === "sergiosilvabezerra@gmail.com");
            setIsAdmin(isCoordOrAdmin);
            
            if (currentUser.email?.toLowerCase() === "sergiosilvabezerra@gmail.com" && data.role !== 'coordenador') {
              try {
                await setDoc(doc(db, 'users', currentUser.uid), {
                  role: 'coordenador'
                }, { merge: true });
                console.log("🧠 [Auth] Healed coordinator role in Firestore for Sérgio");
              } catch (e) {
                console.error("Error healing coordinator role:", e);
              }
            }

            if (isCoordOrAdmin) {
              setCoordinatorId(currentUser.uid);
            } else if (data.coordinatorId) {
              setCoordinatorId(data.coordinatorId);
            } else if (data.teamId) {
              try {
                const teamSnap = await getDoc(doc(db, 'teams', data.teamId));
                if (teamSnap.exists()) {
                  const teamData = teamSnap.data();
                  if (teamData.coordinatorId) {
                    setCoordinatorId(teamData.coordinatorId);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      coordinatorId: teamData.coordinatorId
                    }, { merge: true });
                    console.log(`🧠 [Auth] Healed missing coordinatorId for leader ${currentUser.uid}`);
                  } else {
                    setCoordinatorId(null);
                  }
                } else {
                  setCoordinatorId(null);
                }
              } catch (e) {
                console.error("Error healing coordinatorId:", e);
                setCoordinatorId(null);
              }
            } else {
              // No coordinatorId and no teamId in user document.
              // Try to find if there is a team where leaderEmail matches user's email
              try {
                const qTeams = query(collection(db, 'teams'), where('leaderEmail', '==', currentUser.email?.toLowerCase() || ''));
                const snapTeams = await getDocs(qTeams);
                if (!snapTeams.empty) {
                  const teamId = snapTeams.docs[0].id;
                  const teamData = snapTeams.docs[0].data();
                  setCoordinatorId(teamData.coordinatorId || null);
                  await setDoc(doc(db, 'users', currentUser.uid), {
                    teamId: teamId,
                    teamName: teamData.name || '',
                    coordinatorId: teamData.coordinatorId || ''
                  }, { merge: true });
                  console.log(`🧠 [Auth] Healed leader profile using matching team: ${teamId}`);
                } else {
                  // Fallback: search for first coordinator
                  const qCoords = query(collection(db, 'users'), where('role', '==', 'coordenador'), limit(1));
                  const snapCoords = await getDocs(qCoords);
                  if (!snapCoords.empty) {
                    const coordId = snapCoords.docs[0].id;
                    setCoordinatorId(coordId);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      coordinatorId: coordId
                    }, { merge: true });
                    console.log(`🧠 [Auth] Assigned coordinatorId fallback: ${coordId}`);
                  } else {
                    setCoordinatorId(null);
                  }
                }
              } catch (e) {
                console.error("Error healing missing team/coordinator:", e);
                setCoordinatorId(null);
              }
            }
          } else if (currentUser.email?.toLowerCase() === "sergiosilvabezerra@gmail.com") {
            setIsAdmin(true);
            setRole('coordenador');
            setForcePasswordChange(false);
            setCoordinatorId(currentUser.uid);
            try {
              await setDoc(doc(db, 'users', currentUser.uid), {
                name: currentUser.displayName || 'Sérgio Silva Bezerra',
                email: currentUser.email,
                role: 'coordenador',
                createdAt: Date.now()
              }, { merge: true });
            } catch (err) {
              console.error("Erro ao salvar perfil do coordenador:", err);
            }
          } else {
            // The user document does not exist, and it's not the admin.
            // Let's check if there is a pre_registration for this email.
            if (currentUser.email) {
              try {
                const preRegSnap = await getDoc(doc(db, 'pre_registrations', currentUser.email.toLowerCase()));
                if (preRegSnap.exists()) {
                  const preRegData = preRegSnap.data();
                  setRole('lider');
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
                } else {
                  // Try to find if there is a team where leaderEmail matches user's email
                  const qTeams = query(collection(db, 'teams'), where('leaderEmail', '==', currentUser.email.toLowerCase()));
                  const snapTeams = await getDocs(qTeams);
                  if (!snapTeams.empty) {
                    const teamId = snapTeams.docs[0].id;
                    const teamData = snapTeams.docs[0].data();
                    setRole('lider');
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
                    // Fallback: No pre_registration or team. Create a default leader profile linked to first coordinator
                    let fallbackCoordId = '';
                    const qCoords = query(collection(db, 'users'), where('role', '==', 'coordenador'), limit(1));
                    const snapCoords = await getDocs(qCoords);
                    if (!snapCoords.empty) {
                      fallbackCoordId = snapCoords.docs[0].id;
                    }
                    setRole('lider');
                    setForcePasswordChange(false);
                    setCoordinatorId(fallbackCoordId || null);
                    await setDoc(doc(db, 'users', currentUser.uid), {
                      email: currentUser.email.toLowerCase(),
                      role: 'lider',
                      name: currentUser.displayName || 'Líder Regional',
                      coordinatorId: fallbackCoordId,
                      createdAt: Date.now()
                    });
                    console.log(`🧠 [Auth] Created default leader profile for ${currentUser.email}`);
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
    } catch (error) {
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
