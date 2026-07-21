import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './lib/FirebaseProvider';
import { firestoreService } from './lib/firestoreService';
import PublicVoterRegister from './components/PublicVoterRegister';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import CaboDashboard from './components/CaboDashboard';
import { safeLocalStorage } from './utils/safeStorage';

export default function App() {
  const { 
    user, 
    login, 
    loginWithEmail, 
    signupWithEmail, 
    logout, 
    loading, 
    isAdmin, 
    forcePasswordChange, 
    changePassword, 
    resetPassword 
  } = useAuth();

  const [view, setView] = useState<'coord' | 'cabo'>('cabo');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('aguia-theme') as 'light' | 'dark') || 'light';
  });

  const [isExternalRegister] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('leaderId') || params.has('liderId') || params.has('teamId');
  });
  
  const [extLeaderId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('leaderId') || params.get('liderId');
  });
  
  const [extTeamId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('teamId');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem('aguia-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    if (user) {
      setView(isAdmin ? 'coord' : 'cabo');
    }
  }, [user, isAdmin]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'coordenador' | 'lider'>('coordenador');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Handle URL Params for Easy Access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('access_token');
    
    if (emailParam) {
      // Se já houver alguém logado e for outro e-mail, forçar logout para o líder entrar
      if (user && user.email !== emailParam) {
        logout();
      }
      setEmail(emailParam);
    }
    
    if (tokenParam) {
      try {
        const decodedPass = atob(tokenParam);
        setPassword(decodedPass);
      } catch (e) {
        console.error("Token inválido");
      }
    }

    if (emailParam || tokenParam) {
       // Limpar URL para não ficar poluído
       try {
         window.history.replaceState({}, document.title, window.location.pathname);
       } catch (e) {
         console.warn("Navegação/Histórico restrito no iframe:", e);
       }
    }
  }, [user]);

  if (isExternalRegister) {
    return <PublicVoterRegister leaderId={extLeaderId} teamId={extTeamId} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 transition-colors duration-500">
         <div className="relative">
           <ShieldCheck className="w-20 h-20 text-yellow-500 animate-pulse mb-6 relative z-10" />
           <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
         </div>
         <div className="space-y-3 text-center">
           <p className="text-[var(--text-primary)] font-black uppercase tracking-[0.3em] text-xs animate-pulse">SISTEMA ÁGUIA</p>
           <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[9px] opacity-50">Estratégia 2026 • Carregando Inteligência</p>
         </div>
         <div className="mt-10 w-48 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
           <motion.div 
             initial={{ x: '-100%' }}
             animate={{ x: '100%' }}
             transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
             className="w-full h-full bg-yellow-500"
           />
         </div>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (newPassword.length < 6) {
      return setAuthError('A nova senha deve ter pelo menos 6 caracteres');
    }
    try {
      await changePassword(newPassword);
      alert("Senha alterada com sucesso!");
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao alterar senha');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await signupWithEmail(email, password, userRole);
      } else {
        try {
          await loginWithEmail(email, password);
        } catch (err: any) {
          // Se falhou o login padrão, verificar se é um pré-registro
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || (err.message && err.message.includes('INVALID_LOGIN_CREDENTIALS'))) {
            const preRegDoc = await firestoreService.getDocument('pre_registrations', email.toLowerCase()) as any;
            
            if (preRegDoc && preRegDoc.tempPassword === password) {
              // É um líder com senha temporária! Criar a conta oficial agora.
              await signupWithEmail(email, password, 'lider', {
                name: preRegDoc.name,
                phone: preRegDoc.phone,
                address: preRegDoc.address,
                teamName: preRegDoc.teamName,
                teamId: preRegDoc.teamId,
                coordinatorId: preRegDoc.coordinatorId || '',
                forcePasswordChange: true // Obrigar a trocar a senha
              });
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error caught:", err);
      const errorMsg = err.message || '';
      const errorCode = err.code || '';

      if (errorCode === 'auth/email-already-in-use' || errorMsg.includes('email-already-in-use')) {
        setAuthError('Este e-mail já possui uma conta activa no Firebase. Se você é o líder João Cardoso e já criou uma senha personalizada anteriormente, por favor faça o login usando a SUA SENHA cadastrada. Caso tenha esquecido, clique em "Esqueceu a senha?" abaixo para redefinir.');
      } else if (errorCode === 'auth/invalid-credential' || errorMsg.includes('invalid-credential') || errorMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
        setAuthError('Chave de acesso (senha) incorreta para este operador. Se você recebeu uma senha temporária por WhatsApp, verifique se digitou as letras e números exatamente iguais.');
      } else if (errorCode === 'auth/user-not-found' || errorMsg.includes('user-not-found')) {
        setAuthError('Operador não encontrado. Se você é um líder novo, certifique-se de que o coordenador cadastrou o seu e-mail corretamente.');
      } else if (errorCode === 'auth/too-many-requests' || errorMsg.includes('too-many-requests')) {
        setAuthError('Acesso bloqueado temporariamente por excesso de tentativas incorretas. Aguarde alguns instantes ou mude sua senha.');
      } else {
        setAuthError(errorMsg || 'Erro na autenticação. Verifique suas credenciais.');
      }
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    try {
      await login();
    } catch (err: any) {
      console.error("Google Auth error caught:", err);
      const errorMsg = err.message || '';
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
        setAuthError('Domínio de visualização não autorizado no Firebase. Adicione os domínios do AI Studio em "Authentication > Settings > Authorized domains" no Firebase Console.');
      } else if (errorCode === 'auth/popup-blocked' || errorMsg.includes('popup-blocked')) {
        setAuthError('O popup de login foi bloqueado pelo navegador. Ative as permissões de popups para este domínio.');
      } else if (errorCode === 'auth/operation-not-allowed' || errorMsg.includes('operation-not-allowed')) {
        setAuthError('O login do Google não está ativado no Firebase. Ative o Google em "Authentication > Sign-in method" no Console.');
      } else {
        setAuthError(errorMsg || 'Erro na autenticação com Google. Verifique o console do navegador.');
      }
    }
  };

  if (user && forcePasswordChange) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center selection:bg-yellow-500 selection:text-zinc-950 transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[var(--bg-secondary)] p-10 rounded-sm shadow-2xl border border-[var(--border-color)] relative"
        >
          <div className="w-20 h-20 bg-yellow-500/10 rounded-sm flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none mb-3">Definir Identidade</h1>
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-10 opacity-70">Por segurança, altere sua senha de acesso inicial</p>
          
          <form onSubmit={handlePasswordChange} className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Nova Senha Operacional</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {authError && <p className="text-red-500 text-[10px] font-black text-center bg-red-500/5 py-3 rounded-sm border border-red-500/10 uppercase tracking-widest">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-yellow-400"
            >
              AUTENTICAR NOVA SENHA
            </button>
          </form>

          <button 
            onClick={logout}
            className="mt-10 text-[10px] font-black text-[var(--text-secondary)] hover:text-red-500 uppercase tracking-widest transition-colors opacity-50"
          >
            Encerrar Sessão
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 md:p-12 text-center selection:bg-yellow-500 selection:text-zinc-950 transition-colors duration-500 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-secondary)] p-10 md:p-14 rounded-sm shadow-2xl border border-[var(--border-color)] relative z-20 backdrop-blur-sm"
        >
          <div className="flex justify-center mb-8 text-[var(--text-primary)]">
            <div className="p-4 bg-zinc-950 rounded-sm shadow-2xl shadow-yellow-500/10 border border-white/5">
              <ShieldCheck className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none mb-3">SISTEMA ÁGUIA</h1>
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-12 opacity-60">Diretiva de Coordenação Operacional</p>
          
          <form onSubmit={handleEmailAuth} className="space-y-6 text-left relative z-10">
            {isRegistering && (
              <div className="bg-[var(--bg-tertiary)] p-1 rounded-sm flex mb-6 border border-[var(--border-color)] shadow-inner">
                <div className="flex-1 py-3 rounded-sm font-black text-[10px] tracking-widest bg-yellow-500 text-zinc-950 shadow-lg text-center uppercase">
                  Somente Coordenador
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Credencial de E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
                placeholder="operador@aguia.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block opacity-60">Chave de Acesso</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        alert("Por favor, digite o seu e-mail no campo acima antes de solicitar a redefinição.");
                        return;
                      }
                      if (confirm(`Deseja enviar um e-mail de redefinição de senha para ${email}?`)) {
                        try {
                          await resetPassword(email);
                          alert(`E-mail de redefinição enviado com sucesso para ${email}! Verifique sua caixa de entrada.`);
                        } catch (err: any) {
                          alert(`Erro ao enviar e-mail de redefinição: ${err.message || err}`);
                        }
                      }
                    }}
                    className="text-[9px] font-black text-yellow-600 hover:text-yellow-500 uppercase tracking-widest transition-colors focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-sm border border-red-500/20 tracking-wider">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-zinc-950 text-white dark:bg-yellow-500 dark:text-zinc-950 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 dark:hover:bg-yellow-400 transition-all active:scale-95"
            >
              {isRegistering ? 'Solicitar Cadastro' : 'Autenticar Unidade'}
            </button>
          </form>

          <div className="relative my-10 z-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)]"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 tracking-[0.4em] opacity-40">LOGIN CORPORATIVO</div>
          </div>

          <button 
            onClick={handleGoogleAuth}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-4.5 rounded-sm font-black text-[10px] uppercase flex items-center justify-center gap-4 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all shadow-sm relative z-10"
          >
            <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24">
               <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
               <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
               <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
               <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Cloud Auth
          </button>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-10 text-[10px] font-black text-[var(--text-secondary)] hover:text-yellow-600 uppercase tracking-widest transition-colors opacity-50 block w-full relative z-10"
          >
            {isRegistering ? 'Já possui acesso? Efetuar Login' : 'Ainda não é operador? Registrar'}
          </button>
        </motion.div>
        
        <p className="mt-12 text-[10px] font-black text-[var(--text-secondary)] opacity-20 uppercase tracking-[0.5em] relative z-20">Eagle Intelligence Systems • 2026</p>
      </div>
    );
  }

  return (
    <div className={`${theme} min-h-screen transition-colors duration-300`}>
      {view === 'coord' ? (
        <CoordinatorDashboard theme={theme} setTheme={setTheme} />
      ) : (
        <CaboDashboard theme={theme} setTheme={setTheme} />
      )}
    </div>
  );
}
