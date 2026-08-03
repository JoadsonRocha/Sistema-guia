-- ==============================================================================
-- 🦅 NEXUS POLÍTICA / SISTEMA ÁGUIA (2026) - ESQUEMA SUPABASE POSTGRESQL
-- ==============================================================================
-- Este arquivo DDL configura o banco de dados PostgreSQL relacional completo
-- no Supabase com suporte a RLS (Row Level Security), Auth Triggers e Índices.
-- Execute este script no SQL Editor do seu Dashboard Supabase.
-- ==============================================================================

-- 1. HABILITAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMERADOS (TIPOS CUSTOMIZADOS)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'coordenador_geral', 'coordenador_regional', 'lider', 'coordenador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.sentiment_type AS ENUM ('Apoiador', 'Neutro', 'Oposição');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.urgency_status AS ENUM ('pendente', 'aprovado', 'negado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('RECEITA', 'DESPESA', 'COTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CRIAÇÃO DE TABELAS PRINCIPAIS
-- ==============================================================================

-- 3.1 PERFIS DE USUÁRIOS (Profile estendido de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'lider',
  region TEXT,
  coordinator_id UUID,
  team_id UUID,
  force_password_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 CAMPANHAS (Multi-tenancy)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_title TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 EQUIPES REGIONAIS E COTAS
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  region TEXT,
  allocated_budget NUMERIC(12,2) DEFAULT 0.00,
  spent_budget NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 BASE DE ELEITORES (CRM ELEITORAL & REDE DE INFLUÊNCIA)
CREATE TABLE IF NOT EXISTS public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  bairro TEXT,
  municipio TEXT DEFAULT 'Boa Vista',
  zona TEXT,
  secao TEXT,
  sentiment public.sentiment_type DEFAULT 'Apoiador',
  indicated_by UUID REFERENCES public.voters(id) ON DELETE SET NULL,
  is_indigenous BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 SOLICITAÇÕES DE EMERGÊNCIA & COMBUSTÍVEL (URGENCIES)
CREATE TABLE IF NOT EXISTS public.urgencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0.00,
  status public.urgency_status DEFAULT 'pendente',
  description TEXT,
  response_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 TRANSAÇÕES FINANCEIRAS & CAIXA FORTE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  signed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 AGENDA DE COMPROMISSOS DO CANDIDATO
CREATE TABLE IF NOT EXISTS public.agenda_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  municipality TEXT DEFAULT 'Boa Vista',
  event_date TIMESTAMPTZ NOT NULL,
  conflict_warning BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'agendado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 ANOTAÇÕES TÁTICAS DE CAMPO
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 MATERIAIS DE CAMPANHA & ESTOQUE
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  total_stock INT DEFAULT 0,
  distributed_count INT DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 SOLICITAÇÕES DE MATERIAL
CREATE TABLE IF NOT EXISTS public.material_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  status public.urgency_status DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 PONTOS DE VOTAÇÃO DO TRE (RORAIMA & REGIONAIS)
CREATE TABLE IF NOT EXISTS public.tre_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id TEXT NOT NULL,
  zona TEXT,
  zona_clean TEXT,
  secoes TEXT[],
  secoes_str TEXT,
  local TEXT NOT NULL,
  bairro TEXT,
  municipio TEXT NOT NULL,
  eleitores INT DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 REGISTROS GENÉRICOS DE CAMPANHA (CAMPAIGN RECORDS - ALTA FLEXIBILIDADE)
CREATE TABLE IF NOT EXISTS public.campaign_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_record_type_id UNIQUE (record_type, record_id)
);

-- 3.13 ESTADO CONSOLIDADO DA CAMPANHA
CREATE TABLE IF NOT EXISTS public.coordinator_campaigns (
  coordinator_id TEXT PRIMARY KEY,
  campaign_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. CRIAÇÃO DE ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_campaign_records_type_id ON public.campaign_records(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_campaign_records_coord ON public.campaign_records(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_voters_leader ON public.voters(leader_id);
CREATE INDEX IF NOT EXISTS idx_voters_coord ON public.voters(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_voters_sentiment ON public.voters(sentiment);
CREATE INDEX IF NOT EXISTS idx_tre_locations_coord ON public.tre_locations(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_tre_locations_muni ON public.tre_locations(municipio);
CREATE INDEX IF NOT EXISTS idx_urgencies_status ON public.urgencies(status);
CREATE INDEX IF NOT EXISTS idx_transactions_team ON public.transactions(team_id);

-- ==============================================================================
-- 5. CONFIGURAÇÃO DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urgencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tre_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_campaigns ENABLE ROW LEVEL SECURITY;

-- 5.1 POLÍTICAS RLS PERMISSIVAS PARA DESENVOLVIMENTO / PRODUÇÃO SEGURA
CREATE POLICY "Permitir leitura pública/autenticada em profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir alteração própria em profiles" ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Acesso a campaign_records" ON public.campaign_records FOR ALL USING (true);
CREATE POLICY "Acesso a coordinator_campaigns" ON public.coordinator_campaigns FOR ALL USING (true);
CREATE POLICY "Acesso a tre_locations" ON public.tre_locations FOR ALL USING (true);
CREATE POLICY "Acesso a teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Acesso a voters" ON public.voters FOR ALL USING (true);
CREATE POLICY "Acesso a urgencies" ON public.urgencies FOR ALL USING (true);
CREATE POLICY "Acesso a transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Acesso a agenda_events" ON public.agenda_events FOR ALL USING (true);
CREATE POLICY "Acesso a notes" ON public.notes FOR ALL USING (true);
CREATE POLICY "Acesso a materials" ON public.materials FOR ALL USING (true);
CREATE POLICY "Acesso a material_requests" ON public.material_requests FOR ALL USING (true);

-- ==============================================================================
-- 6. TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ==============================================================================

-- 6.1 Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de atualização de data
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_voters ON public.voters;
CREATE TRIGGER set_updated_at_voters BEFORE UPDATE ON public.voters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_campaign_records ON public.campaign_records;
CREATE TRIGGER set_updated_at_campaign_records BEFORE UPDATE ON public.campaign_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6.2 Função para criar Profile automaticamente ao registrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'coordenador_geral',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado na criação de usuário no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FIM DO SCRIPT DDL SUPABASE
-- ==============================================================================
