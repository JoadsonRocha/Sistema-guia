/**
 * SupabaseProvider
 *
 * Provides global authentication context using Supabase Auth:
 * - Listens to Auth state changes and syncs user profiles from Supabase database
 * - Exposes login, logout, signup and password helpers
 * - Implements inactivity auto-logout and BFCache re-initialization
 *
 * Notes:
 * - In production the provider avoids trusting localStorage for auth state.
 * - Demo mode can be enabled for testing via `demoRole` (disabled in production builds by upstream checks).
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import logoImg from '../assets/logo.png';
import { getSupabaseClient, resetSupabaseClient } from './supabase';
import { supabaseDataService } from './supabaseService';

export type UserRole = 'coordenador_geral' | 'coordenador_regional' | 'lider' | 'coordenador';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  name?: string | null;
  role?: UserRole;
  region?: string | null;
  coordinatorId?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  forcePasswordChange?: boolean;
}

interface AuthContextType {
  user: any;
  role: UserRole | null;
  loading: boolean;
  forcePasswordChange: boolean;
  sessionLocked: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGeral, setIsGeral] = useState(false);
  const [isRegional, setIsRegional] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState<string | null>(null);

  // Helper to sync user profile state from Supabase
  /**
   * syncUserProfile
   *
   * Populate the local React state from an auth user object returned by Supabase
   * or from a local cached profile. Responsible for deriving roles/flags.
   */
  const syncUserProfile = async (authUser: any) => {
    if (!authUser) {
      setUser(null);
      setRole(null);
      setIsAdmin(false);
      setIsGeral(false);
      setIsRegional(false);
      setIsLeader(false);
      setUserRegion(null);
      setCoordinatorId(null);
      setLoading(false);
      return;
    }

    const uid = authUser.id || authUser.uid;
    const email = (authUser.email || '').toLowerCase();
    const isAntonio = email.includes('antonio');
    const isJoadson = email.includes('joadsonrocharr') || email.includes('joadson');

    // Retrieve pending invite metadata if available
    let pendingInvite: any = null;
    try {
      const rawInvite = sessionStorage.getItem('nexus_pending_invite') || localStorage.getItem('nexus_pending_invite');
      if (rawInvite) pendingInvite = JSON.parse(rawInvite);
    } catch (e) {}

    // Fetch user profile and pre-registration from Supabase
    let profile: any = await supabaseDataService.getDocument('users', uid);
    let preRegDoc: any = email ? await supabaseDataService.getDocument('pre_registrations', email) : null;

    if (!preRegDoc && email) {
      try {
        const allPreRegs = await supabaseDataService.getCollection<any>('pre_registrations');
        preRegDoc = allPreRegs.find(pr => pr.email && pr.email.toLowerCase() === email);
      } catch (e) {}
    }

    // Check regional_coordinators collection as a direct source of truth
    let regionalCoordDoc: any = null;
    if (email) {
      try {
        const allRegs = await supabaseDataService.getCollection<any>('regional_coordinators');
        regionalCoordDoc = allRegs.find(rc => rc.email && rc.email.toLowerCase() === email);
      } catch (e) {}
    }

    // Check teams collection for team leader registration
    let teamDoc: any = null;
    if (email) {
      try {
        const allTeams = await supabaseDataService.getCollection<any>('teams');
        teamDoc = allTeams.find(t => (t.leaderEmail && t.leaderEmail.toLowerCase() === email) || (t.email && t.email.toLowerCase() === email));
      } catch (e) {}
    }

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlRole = (searchParams?.get('role') || (pendingInvite?.email?.toLowerCase() === email ? pendingInvite?.role : null)) as UserRole | null;
    const urlCoordId = searchParams?.get('coordinatorId') || pendingInvite?.coordinatorId;
    const urlRegionalCoordId = searchParams?.get('regionalCoordId') || pendingInvite?.regionalCoordId;
    const urlRegion = searchParams?.get('region') || pendingInvite?.region || regionalCoordDoc?.region;
    const urlTeamId = searchParams?.get('teamId') || pendingInvite?.teamId || teamDoc?.id;

    // Determine target role based on verified registry
    let metaRole: UserRole | null = null;
    if (isJoadson) {
      metaRole = 'coordenador_geral';
    } else if (regionalCoordDoc || preRegDoc?.role === 'coordenador_regional' || urlRole === 'coordenador_regional' || authUser?.user_metadata?.role === 'coordenador_regional' || isAntonio) {
      metaRole = 'coordenador_regional';
    } else if (preRegDoc?.role === 'lider' || teamDoc || urlRole === 'lider' || authUser?.user_metadata?.role === 'lider') {
      metaRole = 'lider';
    } else if (preRegDoc?.role || authUser?.user_metadata?.role || urlRole) {
      metaRole = (preRegDoc?.role || authUser?.user_metadata?.role || urlRole) as UserRole;
    }

    const metaCoordId = preRegDoc?.coordinatorId || regionalCoordDoc?.coordinatorId || teamDoc?.coordinatorId || authUser?.user_metadata?.coordinatorId || urlCoordId;

    if (!profile) {
      if (preRegDoc || regionalCoordDoc || teamDoc) {
        const sourceDoc = preRegDoc || regionalCoordDoc || teamDoc;
        const assignedRole: UserRole = metaRole || (sourceDoc.role as UserRole) || (regionalCoordDoc ? 'coordenador_regional' : 'lider');
        profile = {
          id: uid,
          uid,
          email,
          role: assignedRole,
          name: sourceDoc.name || sourceDoc.leader || authUser.user_metadata?.full_name || authUser.displayName || email.split('@')[0],
          phone: sourceDoc.phone || sourceDoc.leaderPhone || '',
          region: sourceDoc.region || urlRegion || null,
          coordinatorId: metaCoordId || uid,
          regionalCoordId: sourceDoc.regionalCoordId || urlRegionalCoordId || null,
          teamId: sourceDoc.teamId || teamDoc?.id || urlTeamId || null,
          teamName: sourceDoc.teamName || teamDoc?.name || null,
          forcePasswordChange: true,
          createdAt: Date.now()
        };
      } else {
        const determinedRole: UserRole = metaRole || (isAntonio ? 'coordenador_regional' : (isJoadson ? 'coordenador_geral' : 'lider'));
        const determinedCoordId = (determinedRole === 'coordenador_geral') ? uid : (metaCoordId || uid);
        profile = {
          id: uid,
          uid,
          email,
          role: determinedRole,
          name: authUser.user_metadata?.full_name || authUser.displayName || (isJoadson ? 'Joadson Rocha' : isAntonio ? 'ANTONIO FURTADO' : email.split('@')[0]),
          region: authUser.user_metadata?.region || urlRegion || (isAntonio ? 'REGIÃO 1 - BV' : null),
          coordinatorId: determinedCoordId,
          createdAt: Date.now()
        };
      }
      await supabaseDataService.setDocument('users', uid, profile, true);
    } else {
      let updated = false;
      const targetRole = metaRole;
      const targetCoordId = metaCoordId;

      // Auto-correct role if the user is registered as a regional coordinator but profile was erroneously saved as 'lider'
      if (targetRole && profile.role !== targetRole && !isJoadson) {
        profile.role = targetRole;
        updated = true;
      }
      if (targetCoordId && profile.coordinatorId !== targetCoordId && !isJoadson && profile.role !== 'coordenador_geral') {
        profile.coordinatorId = targetCoordId;
        updated = true;
      }
      if ((preRegDoc?.regionalCoordId || urlRegionalCoordId) && !profile.regionalCoordId) {
        profile.regionalCoordId = preRegDoc?.regionalCoordId || urlRegionalCoordId;
        updated = true;
      }
      if ((preRegDoc?.teamId || teamDoc?.id || urlTeamId) && !profile.teamId) {
        profile.teamId = preRegDoc?.teamId || teamDoc?.id || urlTeamId;
        updated = true;
      }
      if ((preRegDoc?.teamName || teamDoc?.name) && !profile.teamName) {
        profile.teamName = preRegDoc?.teamName || teamDoc?.name;
        updated = true;
      }
      if ((preRegDoc?.region || regionalCoordDoc?.region || urlRegion) && !profile.region) {
        profile.region = preRegDoc?.region || regionalCoordDoc?.region || urlRegion;
        updated = true;
      }
      if (updated) {
        await supabaseDataService.setDocument('users', uid, profile, true);
      }
    }

    let currentRole: UserRole = profile.role || (isAntonio ? 'coordenador_regional' : 'coordenador_geral');
    if (isJoadson) {
      currentRole = 'coordenador_geral';
    } else if (isAntonio && currentRole !== 'coordenador_regional') {
      currentRole = 'coordenador_regional';
    }

    const regionalCheck = currentRole === 'coordenador_regional';
    const geralCheck = (currentRole === 'coordenador_geral' || currentRole === 'coordenador') && !regionalCheck;
    const leaderCheck = currentRole === 'lider';
    const adminCheck = geralCheck || regionalCheck;

    const effectiveCoordId = geralCheck ? uid : (profile.coordinatorId || uid);

    const alreadyChanged = localStorage.getItem(`nexus_pwd_changed_${uid}`) === 'true' || 
                           sessionStorage.getItem(`nexus_pwd_changed_${uid}`) === 'true' ||
                           profile?.forcePasswordChange === false ||
                           profile?.passwordChangedAt;

    const mustForcePassword = !alreadyChanged && !!profile?.forcePasswordChange;

    setUser({
      uid,
      id: uid,
      email,
      displayName: profile.name || authUser.user_metadata?.full_name || authUser.displayName || email,
      emailVerified: true
    });
    setRole(currentRole);
    setIsGeral(geralCheck);
    setIsRegional(regionalCheck);
    setIsLeader(leaderCheck);
    setIsAdmin(adminCheck);
    setUserRegion(profile.region || (isAntonio ? 'REGIÃO 1 - BV' : null));
    setForcePasswordChange(mustForcePassword);
    setCoordinatorId(effectiveCoordId);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      // Fetch initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncUserProfile(session.user);
        } else {
          // In production we avoid trusting localStorage for auth state.
          const isProd = (import.meta as any)?.env?.MODE === 'production' || (import.meta as any)?.env?.PROD === true;
          if (!isProd) {
            const localUser = localStorage.getItem('nexus_auth_user');
            if (localUser) {
              try {
                syncUserProfile(JSON.parse(localUser));
              } catch (e) {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          } else {
            // production: mark loaded and rely on Supabase session/cookie
            setLoading(false);
          }
        }
      }).catch(() => setLoading(false));

      // Listen to auth changes and keep local state in sync with Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          // Avoid persisting full session in localStorage in production
          const isProd = (import.meta as any)?.env?.MODE === 'production' || (import.meta as any)?.env?.PROD === true;
          if (!isProd) {
            localStorage.setItem('nexus_auth_user', JSON.stringify(session.user));
          }
          syncUserProfile(session.user);
        } else {
          try { localStorage.removeItem('nexus_auth_user'); } catch(e) {}
          syncUserProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local storage auth fallback if Supabase not yet connected
      const localUser = localStorage.getItem('nexus_auth_user');
      if (localUser) {
        try {
          syncUserProfile(JSON.parse(localUser));
        } catch (e) {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Inactivity logout: auto-logout after configured idle minutes (defaults to 30)
  useEffect(() => {
    const idleMinutes = Number((import.meta as any)?.env?.VITE_IDLE_LOGOUT_MINUTES || 30);
    const idleMs = Math.max(1, idleMinutes) * 60 * 1000;
    const lastActivity = { current: Date.now() } as { current: number };
    const timerRef = { current: 0 } as { current: number };

    const resetTimer = () => {
      lastActivity.current = Date.now();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        // Logout on inactivity
        if (user) {
          logout().catch(() => {});
        }
      }, idleMs);
    };

    const events = ['mousemove', 'keydown', 'visibilitychange', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [user]);

  // Handle BFCache (pageshow/pagehide) to cleanup and re-init Supabase realtime/auth
  useEffect(() => {
    const handlePageHide = () => {
      try {
        // reset client to ensure websockets/subscriptions are re-created on show
        resetSupabaseClient();
      } catch (e) {
        // ignore
      }
    };

    const handlePageShow = (ev: PageTransitionEvent | Event) => {
      const persisted = (ev as any)?.persisted === true || document.visibilityState === 'visible';
      if (!persisted) return;
      try {
        const s = getSupabaseClient();
        if (!s) return;
        // Re-fetch session and re-sync profile so subscriptions/auth state are restored
        s.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            localStorage.setItem('nexus_auth_user', JSON.stringify(session.user));
            syncUserProfile(session.user);
          } else {
            const localUser = localStorage.getItem('nexus_auth_user');
            if (localUser) {
              try {
                syncUserProfile(JSON.parse(localUser));
              } catch (e) {}
            }
          }
        }).catch(() => {});
      } catch (e) {}
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow as EventListener);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') handlePageShow(new Event('pageshow'));
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow as EventListener);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const login = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } else {
      throw new Error('Supabase não configurado');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });
      if (error) throw error;
      if (data.user) {
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
        await syncUserProfile(data.user);
      }
    } else {
      // Fallback local login for dev/offline
      const fakeUser = {
        id: `usr_${Date.now()}`,
        uid: `usr_${Date.now()}`,
        email,
        user_metadata: { full_name: email.split('@')[0] }
      };
      localStorage.setItem('nexus_auth_user', JSON.stringify(fakeUser));
      await syncUserProfile(fakeUser);
    }
  };

  const signupWithEmail = async (email: string, pass: string, userRole: UserRole, extraData?: any) => {
    const supabase = getSupabaseClient();
    let userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: extraData?.name || email.split('@')[0],
            role: userRole,
            coordinatorId: extraData?.coordinatorId || '',
            regionalCoordId: extraData?.regionalCoordId || '',
            teamId: extraData?.teamId || '',
            region: extraData?.region || ''
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        userId = data.user.id;
      }
    }

    const profileData = {
      id: userId,
      uid: userId,
      email: email.toLowerCase(),
      role: userRole,
      createdAt: Date.now(),
      ...extraData
    };

    // 1. Gravar no cache virtual offline-first de registros de campanha (users)
    await supabaseDataService.setDocument('users', userId, profileData, true);

    // 2. Sincronizar na tabela física 'profiles' relacional no Supabase para garantir consistência de RLS
    if (supabase && userId) {
      try {
        await supabase.from('profiles').update({
          full_name: extraData?.name || email.split('@')[0],
          role: userRole,
          region: extraData?.region || null,
          coordinator_id: extraData?.coordinatorId ? extraData.coordinatorId : null,
          team_id: extraData?.teamId ? extraData.teamId : null,
          force_password_change: extraData?.forcePasswordChange !== undefined ? extraData.forcePasswordChange : false
        }).eq('id', userId);
      } catch (err) {
        console.warn("Aviso ao persistir dados adicionais na tabela física profiles:", err);
      }
    }

    localStorage.setItem('nexus_auth_user', JSON.stringify(profileData));
    await syncUserProfile(profileData);
  };

  const logout = async () => {
    setSessionLocked(true);
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('nexus_auth_user');
    await syncUserProfile(null);
    setSessionLocked(false);
  };

  const changePassword = async (newPass: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
    }
    const uid = user?.uid || user?.id;
    if (uid) {
      const now = Date.now();
      localStorage.setItem(`nexus_pwd_changed_${uid}`, 'true');
      sessionStorage.setItem(`nexus_pwd_changed_${uid}`, 'true');
      setForcePasswordChange(false);
      
      await supabaseDataService.setDocument('users', uid, { 
        forcePasswordChange: false,
        passwordChangedAt: now 
      }, true);

      if (user?.email) {
        try {
          await supabaseDataService.setDocument('pre_registrations', user.email.toLowerCase(), { 
            forcePasswordChange: false,
            passwordChangedAt: now 
          }, true);
        } catch (e) {}
      }

      if (supabase) {
        try {
          await supabase.from('profiles').update({
            force_password_change: false
          }).eq('id', uid);
        } catch (e) {}
      }
    }
  };

  const resetPassword = async (userEmail: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    }
  };

  const verifyEmail = async () => {
    // Handled automatically by Supabase Auth
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading, 
      sessionLocked,
      login, 
      loginWithEmail, 
      signupWithEmail, 
      logout, 
      isAdmin, 
      isGeral, 
      isRegional, 
      isLeader, 
      userRegion, 
      forcePasswordChange, 
      changePassword, 
      resetPassword, 
      verifyEmail,
      coordinatorId
    }}>
      {(!loading || user) ? children : (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 select-none">
          <div className="relative flex flex-col items-center max-w-sm w-full text-center">
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
            
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">Nexus Política</h2>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Conectado ao Supabase Cloud...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseProvider');
  }
  return context;
}
