import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/SupabaseProvider';
import { showToast } from '../components/GlobalToastHost';

export function ForcePasswordChangePage() {
  const { changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (newPassword.length < 6) {
      return setAuthError('A nova senha deve ter pelo menos 6 caracteres');
    }
    try {
      await changePassword(newPassword);
      showToast('Senha alterada com sucesso!', 'success');
      // Redirection is handled by ProtectedRoute once forcePasswordChange becomes false
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao alterar senha');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center selection:bg-blue-600 selection:text-white transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[var(--bg-secondary)] p-10 rounded-sm shadow-2xl border border-[var(--border-color)] relative"
      >
        <div className="w-20 h-20 bg-blue-600/10 rounded-sm flex items-center justify-center mx-auto mb-8 border border-blue-600/20">
          <Lock className="w-10 h-10 text-blue-600" />
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
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] p-4.5 rounded-sm focus:outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-inner"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {authError && <p className="text-red-500 text-[10px] font-black text-center bg-red-500/5 py-3 rounded-sm border border-red-500/10 uppercase tracking-widest">{authError}</p>}
          <button 
            type="submit"
            className="w-full bg-zinc-950 text-white dark:bg-blue-600 dark:text-white py-5 rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-blue-500"
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
