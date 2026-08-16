import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsPage() {
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
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Termos de Uso</h1>
              <p className="text-sm text-[var(--text-secondary)]">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Aceitação dos Termos</h2>
              <p>Ao acessar e utilizar a plataforma Nexus Política, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Uso da Plataforma</h2>
              <p>A plataforma destina-se ao gerenciamento estratégico de campanhas políticas. Você concorda em utilizar a plataforma apenas para fins legais e éticos, respeitando as leis eleitorais vigentes no país.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Não fornecer informações falsas ou enganosas no cadastro.</li>
                <li>Não utilizar a plataforma para disseminação de spam, discursos de ódio ou desinformação (fake news).</li>
                <li>Não tentar violar a segurança ou integridade do sistema.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Contas de Usuário</h2>
              <p>O acesso às áreas operacionais (painel de controle) exige a criação de uma conta. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem sob sua conta.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Limitação de Responsabilidade</h2>
              <p>O Nexus Política é uma ferramenta de gestão. Não nos responsabilizamos pelos resultados eleitorais, pelo conteúdo das mensagens enviadas aos eleitores através da plataforma ou pelo uso indevido dos dados por parte das equipes de campanha.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Modificações dos Termos</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários ativos.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
