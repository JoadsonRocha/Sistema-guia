import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPage() {
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
            <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Política de Privacidade</h1>
              <p className="text-sm text-[var(--text-secondary)]">Adequação à LGPD • Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Coleta de Dados</h2>
              <p>Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma e para a coordenação da campanha eleitoral, incluindo, mas não se limitando a:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dados de identificação (Nome, E-mail, Telefone/WhatsApp).</li>
                <li>Dados geográficos (Bairro, Zona, Localização aproximada).</li>
                <li>Interações na plataforma (Demandas, Status de Mobilização).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Uso dos Dados (Finalidade)</h2>
              <p>Os dados coletados são utilizados exclusivamente para:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gerenciamento estratégico da campanha política associada ao cadastro.</li>
                <li>Comunicação via WhatsApp ou e-mail sobre eventos, convocações e informativos da campanha.</li>
                <li>Análises estatísticas anonimizadas de mobilização.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Proteção e Armazenamento</h2>
              <p>Implementamos medidas técnicas e administrativas rigorosas (criptografia em repouso e em trânsito) para proteger seus dados contra acessos não autorizados, perdas ou alterações. Os dados são armazenados em servidores seguros em nuvem gerenciados pela infraestrutura Supabase/Google Cloud.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Compartilhamento de Dados</h2>
              <p>Não vendemos, alugamos ou comercializamos dados pessoais sob nenhuma hipótese. Os dados são acessíveis apenas pelos Coordenadores e Líderes autorizados da campanha vinculada.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Direitos do Titular (LGPD)</h2>
              <p>Você tem o direito de solicitar a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Acesso, correção ou atualização de seus dados pessoais.</li>
                <li>A exclusão definitiva dos seus dados de nossa base.</li>
                <li>A revogação do consentimento para recebimento de mensagens.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
