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
  sendPasswordResetEmail,
  sendEmailVerification
} from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

export type UserRole = 'coordenador_geral' | 'coordenador_regional' | 'lider' | 'coordenador';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  forcePasswordChange: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, role: UserRole, extraData?: any) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  isAdmin: boolean;
  isGeral: boolean;
  isRegional: boolean;
  isLeader: boolean;
  userRegion: string | null;
  coordinatorId: string | null;
  demoRole: UserRole | null;
  setDemoRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGeral, setIsGeral] = useState(false);
  const [isRegional, setIsRegional] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [userRegion, setUserRegion] = useState<string | null>(null);
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
            let currentRole: UserRole = data.role || 'coordenador_geral';

            const userEmail = (currentUser.email || data.email || '').toLowerCase();
            const userName = (data.name || currentUser.displayName || '').toLowerCase();
            const isAntonio = userEmail.includes('antonio') || userName.includes('antonio');

            if (isAntonio && currentRole !== 'coordenador_regional') {
              currentRole = 'coordenador_regional';
              try {
                await setDoc(doc(db, 'users', currentUser.uid), { role: 'coordenador_regional' }, { merge: true });
              } catch (e) {
                console.warn("Could not sync role to user doc:", e);
              }
            }

            setRole(currentRole);
            setForcePasswordChange(!!data.forcePasswordChange);
            
            const regionalCheck = currentRole === 'coordenador_regional';
            const geralCheck = (currentRole === 'coordenador_geral' || currentRole === 'coordenador') && !regionalCheck;
            const leaderCheck = currentRole === 'lider';
            const adminCheck = geralCheck || regionalCheck;

            setIsGeral(geralCheck);
            setIsRegional(regionalCheck);
            setIsLeader(leaderCheck);
            setIsAdmin(adminCheck);
            setUserRegion(data.region || (isAntonio ? 'REGIÃO 1 - BV' : null));

            if (adminCheck) {
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
                  } catch (e) {
                    console.error("Error writing propagated coordinatorId:", e);
                  }
                }
              } else {
                setCoordinatorId(null);
              }
            }
          } else {
            // The user document does not exist. Check pre_registrations
            if (currentUser.email) {
              try {
                const emailLow = currentUser.email.toLowerCase();
                const isAntonio = emailLow.includes('antonio');
                const preRegSnap = await getDoc(doc(db, 'pre_registrations', emailLow));
                if (preRegSnap.exists()) {
                  const preRegData = preRegSnap.data();
                  const targetRole: UserRole = preRegData.role || (isAntonio ? 'coordenador_regional' : 'lider');
                  const isCoordRole = targetRole === 'coordenador_geral' || targetRole === 'coordenador' || targetRole === 'coordenador_regional';
                  
                  setRole(targetRole);
                  setIsAdmin(isCoordRole);
                  setIsGeral(targetRole === 'coordenador_geral' || targetRole === 'coordenador');
                  setIsRegional(targetRole === 'coordenador_regional' || isAntonio);
                  setIsLeader(targetRole === 'lider');
                  setUserRegion(preRegData.region || (isAntonio ? 'REGIÃO 1 - BV' : null));
                  setForcePasswordChange(true);
                  setCoordinatorId(isCoordRole ? currentUser.uid : (preRegData.coordinatorId || null));

                  await setDoc(doc(db, 'users', currentUser.uid), {
                    email: emailLow,
                    role: targetRole,
                    name: preRegData.name || currentUser.displayName || (isAntonio ? 'ANTONIO FURTADO' : 'Usuário'),
                    phone: preRegData.phone || '',
                    address: preRegData.address || '',
                    region: preRegData.region || (isAntonio ? 'REGIÃO 1 - BV' : ''),
                    subLocations: preRegData.subLocations || '',
                    teamName: preRegData.teamName || '',
                    teamId: preRegData.teamId || '',
                    coordinatorId: preRegData.coordinatorId || (isCoordRole ? currentUser.uid : ''),
                    forcePasswordChange: true,
                    createdAt: Date.now()
                  });
                } else {
                  // Default fallback: Check if Antonio or Regional
                  const defaultRole: UserRole = isAntonio ? 'coordenador_regional' : 'coordenador_geral';
                  setRole(defaultRole);
                  setIsAdmin(true);
                  setIsGeral(!isAntonio);
                  setIsRegional(isAntonio);
                  setIsLeader(false);
                  setUserRegion(isAntonio ? 'REGIÃO 1 - BV' : null);
                  setForcePasswordChange(false);
                  setCoordinatorId(currentUser.uid);
                  await setDoc(doc(db, 'users', currentUser.uid), {
                    email: emailLow,
                    role: defaultRole,
                    name: currentUser.displayName || (isAntonio ? 'ANTONIO FURTADO' : 'Coordenador Geral'),
                    createdAt: Date.now()
                  });
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
        setIsGeral(false);
        setIsRegional(false);
        setIsLeader(false);
        setUserRegion(null);
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
        return;
      }
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, userRole: UserRole, extraData?: any) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await setDoc(doc(db, 'users', res.user.uid), {
          email: email.toLowerCase(),
          role: userRole,
          createdAt: Date.now(),
          ...extraData
        });
        // Tentar enviar e-mail de verificação automaticamente ao criar a conta
        try {
          await sendEmailVerification(res.user);
        } catch (vErr) {
          console.warn("Aviso ao enviar e-mail de verificação na criação da conta:", vErr);
        }
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

  const verifyEmail = async () => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado");
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error("Verification email failed:", error);
      throw error;
    }
  };

  // Compute effective auth context values for Demo Mode or normal Auth
  let effectiveUser = user;
  let effectiveRole = role;
  let effectiveIsAdmin = isAdmin;
  let effectiveIsGeral = isGeral;
  let effectiveIsRegional = isRegional;
  let effectiveIsLeader = isLeader;
  let effectiveUserRegion = userRegion;
  let effectiveCoordinatorId = coordinatorId;

  if (demoRole) {
    if (demoRole === 'coordenador_geral') {
      effectiveUser = {
        uid: 'demo_coord_geral',
        email: 'geral@nexuspolitica.com.br',
        displayName: 'Coordenador Geral (Demo)',
        emailVerified: true
      } as any;
      effectiveRole = 'coordenador_geral';
      effectiveIsGeral = true;
      effectiveIsRegional = false;
      effectiveIsLeader = false;
      effectiveIsAdmin = true;
      effectiveUserRegion = null;
      effectiveCoordinatorId = 'demo_coord_geral';
    } else if (demoRole === 'coordenador_regional') {
      effectiveUser = {
        uid: 'demo_coord_regional',
        email: 'regional.norte@nexuspolitica.com.br',
        displayName: 'Coordenador Regional (Demo)',
        emailVerified: true
      } as any;
      effectiveRole = 'coordenador_regional';
      effectiveIsGeral = false;
      effectiveIsRegional = true;
      effectiveIsLeader = false;
      effectiveIsAdmin = true;
      effectiveUserRegion = 'REGIÃO 1 - NORTE';
      effectiveCoordinatorId = 'demo_coord_geral';
    } else if (demoRole === 'lider') {
      effectiveUser = {
        uid: 'demo_lider',
        email: 'lider.bairro@nexuspolitica.com.br',
        displayName: 'Líder de Bairro (Demo)',
        emailVerified: true
      } as any;
      effectiveRole = 'lider';
      effectiveIsGeral = false;
      effectiveIsRegional = false;
      effectiveIsLeader = true;
      effectiveIsAdmin = false;
      effectiveUserRegion = 'REGIÃO 1 - NORTE';
      effectiveCoordinatorId = 'demo_coord_geral';
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser, 
      role: effectiveRole, 
      loading: demoRole ? false : loading, 
      login, 
      loginWithEmail, 
      signupWithEmail, 
      logout, 
      isAdmin: effectiveIsAdmin, 
      isGeral: effectiveIsGeral, 
      isRegional: effectiveIsRegional, 
      isLeader: effectiveIsLeader, 
      userRegion: effectiveUserRegion, 
      forcePasswordChange, 
      changePassword, 
      resetPassword, 
      verifyEmail,
      coordinatorId: effectiveCoordinatorId,
      demoRole,
      setDemoRole
    }}>
      {(!loading || effectiveUser) ? children : (
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
