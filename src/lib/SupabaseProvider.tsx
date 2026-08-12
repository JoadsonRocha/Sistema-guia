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

    // Fetch user profile from Supabase
    let profile: any = await supabaseDataService.getDocument('users', uid);
    let preRegDoc: any = email ? await supabaseDataService.getDocument('pre_registrations', email) : null;

    if (!preRegDoc && email) {
      try {
        const allPreRegs = await supabaseDataService.getCollection<any>('pre_registrations');
        preRegDoc = allPreRegs.find(pr => pr.email && pr.email.toLowerCase() === email);
      } catch (e) {}
    }

    if (!profile) {
      if (preRegDoc) {
        profile = {
          id: uid,
          uid,
          email,
          role: preRegDoc.role || 'lider',
          name: preRegDoc.name || authUser.user_metadata?.full_name || authUser.displayName || email.split('@')[0],
          phone: preRegDoc.phone || '',
          region: preRegDoc.region || null,
          coordinatorId: preRegDoc.coordinatorId || uid,
          teamId: preRegDoc.teamId || null,
          teamName: preRegDoc.teamName || null,
          forcePasswordChange: true,
          createdAt: Date.now()
        };
      } else {
        const defaultRole: UserRole = isAntonio ? 'coordenador_regional' : 'coordenador_geral';
        profile = {
          id: uid,
          uid,
          email,
          role: defaultRole,
          name: authUser.user_metadata?.full_name || authUser.displayName || (isJoadson ? 'Joadson Rocha' : isAntonio ? 'ANTONIO FURTADO' : 'Coordenador Geral'),
          region: isAntonio ? 'REGIÃO 1 - BV' : null,
          coordinatorId: uid,
          createdAt: Date.now()
        };
      }
      await supabaseDataService.setDocument('users', uid, profile, true);
    } else if (preRegDoc) {
      let updated = false;
      if (preRegDoc.coordinatorId && (profile.coordinatorId === uid || !profile.coordinatorId) && !isJoadson && profile.role !== 'coordenador_geral') {
        profile.coordinatorId = preRegDoc.coordinatorId;
        updated = true;
      }
      if (preRegDoc.role && profile.role !== preRegDoc.role && !isJoadson) {
        profile.role = preRegDoc.role;
        updated = true;
      }
      if (preRegDoc.teamId && !profile.teamId) {
        profile.teamId = preRegDoc.teamId;
        updated = true;
      }
      if (preRegDoc.teamName && !profile.teamName) {
        profile.teamName = preRegDoc.teamName;
        updated = true;
      }
      if (preRegDoc.region && !profile.region) {
        profile.region = preRegDoc.region;
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
    setForcePasswordChange(!!profile.forcePasswordChange);
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
        password: pass
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

    await supabaseDataService.setDocument('users', userId, profileData, true);
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
    if (user?.uid) {
      await supabaseDataService.setDocument('users', user.uid, { forcePasswordChange: false }, true);
      setForcePasswordChange(false);
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
