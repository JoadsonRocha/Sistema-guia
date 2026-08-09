-- ==============================================================================
-- 🦅 NEXUS POLÍTICA / SISTEMA ÁGUIA (2026) - ESQUEMA SUPABASE POSTGRESQL (BLINDAGEM PROD)
-- ==============================================================================
-- Este arquivo DDL configura o banco de dados PostgreSQL relacional no Supabase
-- com ISOLAMENTO MULTI-TENANT RIGOROSO e REGRAS RLS (Row Level Security) DE PRODUÇÃO.
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

-- 3.2 CAMPANHAS (Multi-tenancy Isolado)
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

-- 3.4 BASE DE ELEITORES (CRM ELEITORAL & REDE DE INFLUÊNCIA - DADOS SENSÍVEIS)
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

-- 3.6 TRANSAÇÕES FINANCEIRAS & CAIXA FORTE (SIGILO FINANCEIRO)
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

-- 3.11 PONTOS DE VOTAÇÃO DO TRE
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

-- 3.12 REGISTROS GENÉRICOS DE CAMPANHA
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
-- 4. ÍNDICES DE DESEMPENHO E BUSCA RÁPIDA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_campaign_records_type_id ON public.campaign_records(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_campaign_records_coord ON public.campaign_records(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_voters_leader ON public.voters(leader_id);
CREATE INDEX IF NOT EXISTS idx_voters_coord ON public.voters(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_voters_sentiment ON public.voters(sentiment);
CREATE INDEX IF NOT EXISTS idx_tre_locations_coord ON public.tre_locations(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_urgencies_status ON public.urgencies(status);
CREATE INDEX IF NOT EXISTS idx_transactions_team ON public.transactions(team_id);

-- ==============================================================================
-- 5. FUNÇÕES AUXILIARES DE NÍVEL DE SEGURANÇA (SECURITY DEFINER)
-- ==============================================================================

-- 5.1 Verificar se o usuário autenticado é Administrador ou Coordenador
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS BOOLEAN AS $$
DECLARE
  u_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
  RETURN u_role IN ('admin', 'coordenador_geral', 'coordenador_regional', 'coordenador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Obter o coordinator_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_coordinator_id()
RETURNS UUID AS $$
DECLARE
  c_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(coordinator_id, id) INTO c_id FROM public.profiles WHERE id = auth.uid();
  RETURN c_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. CONFIGURAÇÃO DE SEGURANÇA RIGOROSA ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
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

-- Limpar políticas antigas/permissivas caso existam
DROP POLICY IF EXISTS "Leitura de Perfis da Campanha" ON public.profiles;
DROP POLICY IF EXISTS "Atualização do Próprio Perfil ou por Coordenador" ON public.profiles;
DROP POLICY IF EXISTS "Seleção de Eleitores Isolada" ON public.voters;
DROP POLICY IF EXISTS "Cadastro de Eleitores por Líderes Autenticados" ON public.voters;
DROP POLICY IF EXISTS "Edição e Exclusão de Eleitores por Autor ou Coordenador" ON public.voters;
DROP POLICY IF EXISTS "Exclusão de Eleitores por Coordenador" ON public.voters;
DROP POLICY IF EXISTS "Acesso Financeiro Restrito a Coordenadores" ON public.transactions;
DROP POLICY IF EXISTS "Leitura de Urgências por Líder ou Coordenador" ON public.urgencies;
DROP POLICY IF EXISTS "Criação de Urgência por Líder" ON public.urgencies;
DROP POLICY IF EXISTS "Aprovação de Urgência Apenas por Coordenadores" ON public.urgencies;
DROP POLICY IF EXISTS "Isolamento de Registros por Coordenador" ON public.campaign_records;
DROP POLICY IF EXISTS "Isolamento de Estado da Campanha" ON public.coordinator_campaigns;
DROP POLICY IF EXISTS "Acesso Autenticado a TRE Locations" ON public.tre_locations;
DROP POLICY IF EXISTS "Gestão de TRE Locations por Coordenadores" ON public.tre_locations;
DROP POLICY IF EXISTS "Atualização de TRE Locations por Coordenadores" ON public.tre_locations;
DROP POLICY IF EXISTS "Exclusão de TRE Locations por Coordenadores" ON public.tre_locations;

-- 6.1 POLÍTICAS PARA PROFILES
CREATE POLICY "Leitura de Perfis da Campanha" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid()
      OR public.is_admin_or_coordinator()
      OR coordinator_id = public.get_my_coordinator_id()
    )
  );

CREATE POLICY "Atualização do Próprio Perfil ou por Coordenador" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR public.is_admin_or_coordinator()
    OR coordinator_id = public.get_my_coordinator_id()
  );

-- 6.2 POLÍTICAS PARA ELEITORES (VOTERS - BLINDAGEM DE DADOS)
-- Líderes de Campo só visualizam eleitores cadastrados por eles mesmos.
-- Coordenadores visualizam todos os eleitores da coordenação.
CREATE POLICY "Seleção de Eleitores Isolada" ON public.voters
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      leader_id = auth.uid()
      OR coordinator_id = public.get_my_coordinator_id()
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Cadastro de Eleitores por Líderes Autenticados" ON public.voters
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      leader_id = auth.uid()
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Edição e Exclusão de Eleitores por Autor ou Coordenador" ON public.voters
  FOR UPDATE USING (
    leader_id = auth.uid()
    OR public.is_admin_or_coordinator()
    OR coordinator_id = public.get_my_coordinator_id()
  );

CREATE POLICY "Exclusão de Eleitores por Coordenador" ON public.voters
  FOR DELETE USING (
    leader_id = auth.uid()
    OR public.is_admin_or_coordinator()
    OR coordinator_id = public.get_my_coordinator_id()
  );

-- 6.3 POLÍTICAS PARA TRANSAÇÕES FINANCEIRAS (SIGILO TOTAL)
-- Apenas Coordenadores e Admins possuem acesso às finanças e caixa forte.
-- Líderes de campo NÃO podem ler nem registrar movimentações do caixa geral.
CREATE POLICY "Acesso Financeiro Restrito a Coordenadores" ON public.transactions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND public.is_admin_or_coordinator()
  );

-- 6.4 POLÍTICAS PARA URGENCIAS & COMBUSTÍVEL
CREATE POLICY "Leitura de Urgências por Líder ou Coordenador" ON public.urgencies
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      leader_id = auth.uid()
      OR coordinator_id = public.get_my_coordinator_id()
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Criação de Urgência por Líder" ON public.urgencies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      leader_id = auth.uid()
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Aprovação de Urgência Apenas por Coordenadores" ON public.urgencies
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin_or_coordinator()
      OR coordinator_id = public.get_my_coordinator_id()
    )
  );

-- 6.5 POLÍTICAS PARA CAMPAIGN_RECORDS E ESTADO CONSOLIDADO
CREATE POLICY "Isolamento de Registros por Coordenador" ON public.campaign_records
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      coordinator_id = auth.uid()::text 
      OR coordinator_id = public.get_my_coordinator_id()::text
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Isolamento de Estado da Campanha" ON public.coordinator_campaigns
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      coordinator_id = auth.uid()::text 
      OR coordinator_id = public.get_my_coordinator_id()::text
      OR public.is_admin_or_coordinator()
    )
  );

CREATE POLICY "Acesso Autenticado a TRE Locations" ON public.tre_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestão de TRE Locations por Coordenadores" ON public.tre_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_or_coordinator());

CREATE POLICY "Atualização de TRE Locations por Coordenadores" ON public.tre_locations
  FOR UPDATE USING (auth.uid() IS NOT NULL AND public.is_admin_or_coordinator());

CREATE POLICY "Exclusão de TRE Locations por Coordenadores" ON public.tre_locations
  FOR DELETE USING (auth.uid() IS NOT NULL AND public.is_admin_or_coordinator());

-- ==============================================================================
-- 7. TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_voters ON public.voters;
CREATE TRIGGER set_updated_at_voters BEFORE UPDATE ON public.voters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_campaign_records ON public.campaign_records;
CREATE TRIGGER set_updated_at_campaign_records BEFORE UPDATE ON public.campaign_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar Profile ao registar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'lider',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FIM DO SCRIPT DDL SUPABASE PROD HARDENED
-- ==============================================================================
