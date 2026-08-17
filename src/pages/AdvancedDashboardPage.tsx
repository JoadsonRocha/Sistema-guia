import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/SupabaseProvider';
import { supabaseService } from '../lib/supabaseService';
import { KpiGrid } from '../components/dashboard/organisms/KpiGrid';
import { KpiCard } from '../components/dashboard/molecules/KpiCard';
import { ChartWidget } from '../components/dashboard/organisms/ChartWidget';
import { FilterBar } from '../components/dashboard/organisms/FilterBar';
import { AiInsightsWidget } from '../components/dashboard/organisms/AiInsightsWidget';
import { Users, Target, TrendingUp, Trophy } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { ChartTooltip } from '../components/dashboard/atoms/ChartTooltip';
import { reportService } from '../services/reportService';
import { TseAnalyticsPanel } from '../components/TseAnalyticsPanel';

export const AdvancedDashboardPage: React.FC = () => {
  const { user, coordinatorId } = useAuth();
  const [voters, setVoters] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const coordId = coordinatorId || user?.uid || '';
      if (!coordId) return;

      const [votersData, teamsData, goalsData] = await Promise.all([
        supabaseService.getCollectionFiltered<any>('voters', coordId),
        supabaseService.getCollectionFiltered<any>('teams', coordId),
        supabaseService.getCollectionFiltered<any>('goals', coordId)
      ]);

      setVoters(votersData || []);
      setTeams(teamsData || []);
      setGoals(goalsData || []);
      setLoading(false);
    };

    fetchData();
  }, [coordinatorId, user]);

  // Compute filtered voters based on dateRange
  const filteredVoters = useMemo(() => {
    if (dateRange === 'all') return voters;
    
    const now = new Date();
    return voters.filter(v => {
      if (!v.createdAt) return false;
      const date = new Date(v.createdAt);
      if (dateRange === 'today') {
        return date.toDateString() === now.toDateString();
      }
      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (dateRange === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [voters, dateRange]);

  // KPIs
  const totalVoters = filteredVoters.length;
  const totalMeta = goals.reduce((acc, g) => acc + (Number(g.targetVoters) || 0), 0) || 5000;
  const progressPercent = Math.min(100, Math.round((totalVoters / totalMeta) * 100));

  const votersWithPhone = filteredVoters.filter(v => v.phone && v.phone.length > 5).length;
  const validPhonePercent = totalVoters > 0 ? Math.round((votersWithPhone / totalVoters) * 100) : 0;

  // Chart 1: Neighborhoods
  const neighborhoodData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVoters.forEach(v => {
      const b = (v.bairro || 'Não Informado').toUpperCase().trim();
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredVoters]);

  // Chart 2: Gender
  const genderData = useMemo(() => {
    let m = 0, f = 0, o = 0;
    filteredVoters.forEach(v => {
      const gen = (v.gender || v.genero || '').toLowerCase();
      if (gen.startsWith('m')) m++;
      else if (gen.startsWith('f')) f++;
      else o++;
    });
    return [
      { name: 'Masculino', value: m, color: '#3b82f6' },
      { name: 'Feminino', value: f, color: '#ec4899' },
      { name: 'Outros/N.I.', value: o, color: '#94a3b8' }
    ].filter(d => d.value > 0);
  }, [filteredVoters]);

  // Chart 3: Top Teams
  const topTeamsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVoters.forEach(v => {
      const t = (v.team || v.teamName || 'Sem Equipe').trim();
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredVoters]);

  // Global Export
  const handleExportGlobalPdf = () => {
    reportService.generatePDF({
      title: 'Relatório Executivo de Desempenho',
      subtitle: `Visão: ${dateRange === 'all' ? 'Geral' : dateRange}`,
      userName: user?.displayName || 'Coordenador',
      type: 'dashboard_global',
      columns: [
        { header: 'Bairro', dataKey: 'name' },
        { header: 'Eleitores', dataKey: 'value' }
      ],
      data: neighborhoodData
    });
  };

  const dashboardDataForAi = {
    total_eleitores: totalVoters,
    meta_geral: totalMeta,
    progresso_porcento: progressPercent,
    top_bairros: neighborhoodData,
    perfil_genero: genderData,
    top_equipes: topTeamsData
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando inteligência de dados...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full bg-slate-50 min-h-screen">
      <FilterBar 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange}
        title="Dashboard Estratégico (Power BI)"
        actions={
          <button 
            onClick={handleExportGlobalPdf}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Exportar Relatório PDF
          </button>
        }
      />

      <AiInsightsWidget dashboardData={dashboardDataForAi} />

      <TseAnalyticsPanel coordinatorId={coordinatorId || user?.uid} />

      <KpiGrid>
        <KpiCard 
          title="Total de Eleitores" 
          value={totalVoters} 
          icon={Users}
          trend={totalVoters > 0 ? 'up' : 'neutral'}
          trendValue="+ Ativos"
        />
        <KpiCard 
          title="Meta de Campanha" 
          value={totalMeta} 
          icon={Target}
        />
        <KpiCard 
          title="Progresso da Meta" 
          value={progressPercent} 
          suffix="%"
          icon={TrendingUp}
          trend={progressPercent > 50 ? 'up' : 'neutral'}
          trendValue={progressPercent > 50 ? 'No ritmo' : 'Abaixo'}
        />
        <KpiCard 
          title="Qualidade de Contato" 
          value={validPhonePercent} 
          suffix="%"
          icon={Trophy}
          trend={validPhonePercent > 80 ? 'up' : 'down'}
          trendValue="c/ Telefone"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartWidget title="Eleitores por Bairro (Top 10)" subtitle="Distribuição geográfica da base">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={neighborhoodData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} width={90} />
              <Tooltip content={<ChartTooltip />} cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWidget>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartWidget title="Perfil por Gênero">
             <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {genderData.map(g => (
                <div key={g.name} className="flex items-center text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: g.color}}></div>
                  {g.name}
                </div>
              ))}
            </div>
          </ChartWidget>

          <ChartWidget title="Top 5 Equipes">
             <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topTeamsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 10}} tickFormatter={(val) => val.length > 8 ? val.substring(0,8)+'...' : val} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWidget>
        </div>
      </div>
    </div>
  );
};
