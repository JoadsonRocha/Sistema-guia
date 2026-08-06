import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/SupabaseProvider';
import { supabaseService } from '../lib/supabaseService';
import { validateGeneralCoordinatorRegistration, triggerUpgradeRedirect } from '../lib/planService';
import logoImg from '../assets/logo.png';

export function LoginPage() {
  const { 
    login, 
    loginWithEmail, 
    signupWithEmail, 
    resetPassword,
    setDemoRole
  } = useAuth();
  
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'coordenador_geral' | 'coordenador_regional' | 'lider'>('coordenador_geral');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Handle URL Params for Easy Access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('access_token');
    
    if (emailParam) {
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
       try {
         window.history.replaceState({}, document.title, window.location.pathname);
       } catch (e) {
         console.warn("Navegação/Histórico restrito no iframe:", e);
       }
    }
  }, []);

  const handleStartDemoMode = () => {
    setDemoRole('coordenador_geral');
    navigate('/dashboard');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        if (userRole === 'coordenador_geral') {
          const validation = await validateGeneralCoordinatorRegistration();
          if (!validation.allowed) {
            triggerUpgradeRedirect(validation.reason!, true);
            return;
          }
        }
        await signupWithEmail(email, password, userRole);
      } else {
        try {
          await loginWithEmail(email, password);
        } catch (err: any) {
          // Se falhou o login padrão, verificar se é um pré-registro
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || (err.message && err.message.includes('INVALID_LOGIN_CREDENTIALS'))) {
            const preRegDoc = await supabaseService.getDocument('pre_registrations', email.toLowerCase()) as any;
            
            if (preRegDoc && preRegDoc.tempPassword === password) {
              const assignedRole = preRegDoc.role || 'lider';
              await signupWithEmail(email, password, assignedRole, {
                name: preRegDoc.name || '',
                phone: preRegDoc.phone || '',
                address: preRegDoc.address || '',
                region: preRegDoc.region || '',
                teamName: preRegDoc.teamName || '',
                teamId: preRegDoc.teamId || '',
                coordinatorId: preRegDoc.coordinatorId || '',
                forcePasswordChange: true
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
        setAuthError('Este e-mail já possui uma conta activa no Supabase. Se você é o líder João Cardoso e já criou uma senha personalizada anteriormente, por favor faça o login usando a SUA SENHA cadastrada. Caso tenha esquecido, clique em "Esqueceu a senha?" abaixo para redefinir.');
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
    setShowDomainGuide(false);
    try {
      await login();
    } catch (err: any) {
      console.error("Google Auth error caught:", err);
      const errorMsg = err.message || '';
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/cancelled-popup-request' || errorMsg.includes('cancelled-popup-request')) {
        setAuthError('Requisição de login cancelada ou já em andamento. Clique novamente se necessário.');
      } else if (errorCode === 'auth/popup-closed-by-user' || errorMsg.includes('popup-closed-by-user')) {
        setAuthError('Janela de autenticação fechada antes de concluir o login.');
      } else if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
        setAuthError('Domínio de visualização não autorizado no Supabase.');
        setShowDomainGuide(true);
      } else if (errorCode === 'auth/popup-blocked' || errorMsg.includes('popup-blocked')) {
        setAuthError('O popup de login foi bloqueado pelo navegador. Ative as permissões de popups para este domínio.');
      } else if (errorCode === 'auth/operation-not-allowed' || errorMsg.includes('operation-not-allowed')) {
        setAuthError('O login do Google não está ativado no Supabase. Ative o Google em "Authentication > Sign-in method" no Console.');
      } else {
        setAuthError(errorMsg || 'Erro na autenticação com Google. Verifique o console do navegador.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 md:p-12 text-center selection:bg-blue-600 selection:text-white transition-colors duration-500 relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[var(--bg-secondary)] p-10 md:p-14 rounded-[28px] shadow-[0_25px_85px_-30px_rgba(2,132,199,0.45)] border border-[var(--border-color)] relative z-20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center gap-3 mb-6 text-[var(--text-primary)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">Acesso restrito</p>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Painel operacional Nexus Política</p>
          </div>
        </div>
        <div className="flex justify-center mb-6 text-[var(--text-primary)]">
          <div className="flex items-center justify-center bg-transparent w-full">
            <img 
              src={logoImg} 
              onError={(e) => { const t = e.currentTarget; if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = '/logo.png'; } }} 
              alt="Logo Nexus Política" 
              className="max-h-56 md:max-h-72 w-full max-w-[300px] md:max-w-[360px] object-contain transition-all" 
            />
          </div>
        </div>
        
        <form onSubmit={handleEmailAuth} className="space-y-6 text-left relative z-10">
          {isRegistering && (
            <div className="bg-[var(--bg-tertiary)] p-1 rounded-sm flex mb-6 border border-[var(--border-color)] shadow-inner">
              <div className="flex-1 py-3 rounded-sm font-black text-[10px] tracking-widest bg-blue-600 text-white shadow-lg text-center uppercase">
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
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
              placeholder="operador@sistema.com"
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
                  className="text-[9px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest transition-colors focus:outline-none"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 pr-12 rounded-sm focus:outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-inner placeholder:[var(--text-secondary)] placeholder:opacity-30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-blue-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="space-y-3">
              <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-sm border border-red-500/20 tracking-wider">
                {authError}
              </p>
              
              {showDomainGuide && (
                <div className="bg-blue-600/5 border border-blue-600/20 rounded-sm p-4 text-left space-y-3 animate-fadeIn">
                  <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Passo a Passo de Configuração do Firebase (Nova Interface):
                  </h4>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] leading-relaxed uppercase opacity-80">
                    O login com Google exige autorização do domínio nas configurações do seu projeto no Firebase Console.
                  </p>
                  
                  <div className="space-y-2 mt-2">
                    <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)]">1. Copie o domínio do seu aplicativo:</span>
                    
                    {[
                      window.location.hostname,
                    ].filter((val, idx, self) => self.indexOf(val) === idx).map((dom) => (
                      <div key={dom} className="flex items-center justify-between bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-2 rounded-sm gap-2">
                        <code className="text-[9px] font-mono select-all truncate text-[var(--text-primary)]">{dom}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(dom);
                            setCopiedDomain(dom);
                            setTimeout(() => setCopiedDomain(null), 2000);
                          }}
                          className="px-2 py-1 text-[8px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-sm hover:bg-blue-500 active:scale-95 transition-all shrink-0"
                        >
                          {copiedDomain === dom ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-[9px] text-[var(--text-secondary)] leading-relaxed space-y-2 pt-2 border-t border-[var(--border-color)]">
                    <p className="font-bold uppercase"><span className="text-blue-600 dark:text-blue-400 font-black">2.</span> Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline text-blue-600 dark:text-blue-400 font-black">Firebase Console</a> e abra o seu projeto.</p>
                    <p className="font-bold uppercase"><span className="text-blue-600 dark:text-blue-400 font-black">3.</span> No menu esquerdo, clique em <strong className="text-[var(--text-primary)]">Authentication</strong>.</p>
                    <p className="font-bold uppercase"><span className="text-blue-600 dark:text-blue-400 font-black">4.</span> Clique em <strong className="text-[var(--text-primary)]">Configurações</strong>.</p>
                    <p className="font-bold uppercase"><span className="text-blue-600 dark:text-blue-400 font-black">5.</span> Acesse <strong className="text-[var(--text-primary)]">Domínios autorizados</strong>.</p>
                    <p className="font-bold uppercase"><span className="text-blue-600 dark:text-blue-400 font-black">6.</span> Clique em <strong className="text-[var(--text-primary)]">Adicionar domínio</strong>, cole o endereço copiado e confirme.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
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
          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24">
             <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
             <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
             <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
             <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google Cloud Auth
        </button>

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--border-color)] relative z-10 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="hover:text-blue-600 transition-colors opacity-70"
          >
            {isRegistering ? 'Efetuar Login' : 'Registrar Operador'}
          </button>

          <button 
            onClick={handleStartDemoMode}
            className="text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1 font-extrabold"
          >
            ⚡ Testar Demonstração ao Vivo
          </button>

          <button 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1 font-extrabold"
          >
            Página de Vendas &rarr;
          </button>
        </div>
      </motion.div>
      
      <p className="mt-12 text-[10px] font-black text-[var(--text-secondary)] opacity-20 uppercase tracking-[0.5em] relative z-20">Eagle Intelligence Systems • 2026</p>
    </div>
  );
}
