import React from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CookiesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-6">
            <div className="w-12 h-12 bg-amber-600/10 rounded-xl flex items-center justify-center">
              <Cookie className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Política de Cookies</h1>
              <p className="text-sm text-[var(--text-secondary)]">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">1. O que são Cookies?</h2>
              <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou smartphone) quando você acessa sites e aplicações web. Eles servem para lembrar suas preferências e melhorar sua experiência.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Como utilizamos os Cookies</h2>
              <p>O Nexus Política utiliza majoritariamente <strong>Cookies Essenciais (Estritamente Necessários)</strong>, fundamentais para o funcionamento do sistema:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Autenticação:</strong> Para manter sua sessão ativa com segurança (tokens de login).</li>
                <li><strong>Preferências Visuais:</strong> Para lembrar sua escolha entre o Modo Claro (Light Mode) e Modo Escuro (Dark Mode).</li>
                <li><strong>Desempenho:</strong> Para armazenar temporariamente em cache algumas informações da campanha e reduzir o consumo da sua internet.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Cookies de Terceiros</h2>
              <p>Não utilizamos cookies de terceiros para rastreamento publicitário ou retargeting. Toda a infraestrutura analítica é interna e focada exclusivamente no funcionamento do painel da campanha.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Como gerenciar os Cookies</h2>
              <p>Você pode configurar seu navegador para recusar cookies ou alertá-lo quando eles estiverem sendo enviados. Contudo, observe que ao bloquear cookies essenciais, as funcionalidades de login e os painéis de controle do sistema deixarão de funcionar corretamente.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
