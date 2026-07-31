import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, Copy, ExternalLink, Key, Link as LinkIcon, RefreshCw, X, Code2 } from 'lucide-react';
import { getSupabaseCredentials, setSupabaseCredentials, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      if (creds.url && creds.anonKey) {
        testConn();
      }
    }
  }, [isOpen]);

  const testConn = async () => {
    setStatus({ loading: true });
    const res = await supabaseService.testConnection();
    setStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseCredentials(url, anonKey);
    await testConn();
    if (onConnected) onConnected();
  };

  const handleClear = () => {
    setSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setStatus({ loading: false, message: 'Configurações do Supabase removidas.' });
  };

  const sqlScript = `-- SCRIPT SQL SUPABASE - NEXUS POLÍTICA
CREATE TABLE IF NOT EXISTS tre_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinator_id TEXT NOT NULL,
  zona TEXT NOT NULL,
  zona_clean TEXT NOT NULL,
  secoes JSONB DEFAULT '[]'::jsonb,
  secoes_str TEXT,
  local TEXT NOT NULL,
  bairro TEXT,
  municipio TEXT,
  eleitores INTEGER DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tre_coordinator ON tre_locations(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_tre_zona_clean ON tre_locations(zona_clean);

CREATE TABLE IF NOT EXISTS coordinator_campaigns (
  coordinator_id TEXT PRIMARY KEY,
  campaign_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinator_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tre_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso tre_locations" ON tre_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso coordinator_campaigns" ON coordinator_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso campaign_records" ON campaign_records FOR ALL USING (true) WITH CHECK (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Conexão Banco de Dados Supabase (PostgreSQL)</h2>
              <p className="text-xs text-slate-400">Banco relacional de alta performance para a campanha eleitoral nacional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Alert */}
          {status.message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 border ${
              status.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {status.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-semibold">{status.success ? 'Conectado!' : 'Atenção / Verificação'}</p>
                <p className="text-slate-600 mt-0.5">{status.message}</p>
              </div>
            </div>
          )}

          {/* Setup Guide Step-by-Step */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>🚀 Passo a passo no Supabase (Gratuito & Ilimitado):</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold hover:text-emerald-800">supabase.com <ExternalLink className="w-3 h-3 inline" /></a> e crie sua conta/projeto.</li>
              <li>No painel do projeto, vá em <strong>Project Settings → API</strong>.</li>
              <li>Copie a <strong>Project URL</strong> e a chave <strong>anon public key</strong> e cole abaixo.</li>
              <li>No menu lateral do Supabase, vá em <strong>SQL Editor</strong> e rode o script SQL para criar as tabelas.</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                Project URL (URL do Projeto Supabase)
              </label>
              <input
                type="url"
                placeholder="https://xyzxyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Anon / Public API Key (Chave Pública)
              </label>
              <textarea
                rows={3}
                placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-mono text-slate-800"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Limpar Credenciais
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={testConn}
                  disabled={status.loading || !url || !anonKey}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </button>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  Salvar e Conectar
                </button>
              </div>
            </div>
          </form>

          {/* SQL Script Accordion */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setShowSql(!showSql)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Ver Script SQL de Criação das Tabelas
              </span>
              <span className="text-slate-500">{showSql ? 'Ocultar ▲' : 'Mostrar ▼'}</span>
            </button>

            {showSql && (
              <div className="mt-2 relative">
                <button
                  onClick={copySql}
                  className="absolute top-3 right-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md flex items-center gap-1 font-medium transition-colors border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                </button>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-56">
                  {sqlScript}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
