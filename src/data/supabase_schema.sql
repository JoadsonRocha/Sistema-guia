-- ============================================================
-- SCRIPT SQL DE CONFIGURAÇÃO INICIAL - NEXUS POLÍTICA (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela de Locais e Seções Eleitorais do TRE
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

-- Índices de busca rápida para o cruzamento de dados do TRE com a Campanha
CREATE INDEX IF NOT EXISTS idx_tre_coordinator ON tre_locations(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_tre_zona_clean ON tre_locations(zona_clean);
CREATE INDEX IF NOT EXISTS idx_tre_municipio ON tre_locations(municipio);

-- 2. Tabela de Estados da Campanha por Coordenador Geral
CREATE TABLE IF NOT EXISTS coordinator_campaigns (
  coordinator_id TEXT PRIMARY KEY,
  campaign_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Registros Individuais da Campanha (Eleitores, Líderes, Demandas, Materiais)
CREATE TABLE IF NOT EXISTS campaign_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coordinator_id TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'eleitor', 'lider', 'demanda', 'material', 'equipe'
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_record_type_id UNIQUE (record_type, record_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_coordinator ON campaign_records(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_type ON campaign_records(record_type);

-- Desabilitar RLS para prototipagem rápida ou habilitar acesso anônimo com leitura/escrita pública:
ALTER TABLE tre_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_records ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre via Anon Key (Chave Pública da sua campanha)
DROP POLICY IF EXISTS "Permite leitura e escrita publica tre_locations" ON tre_locations;
DROP POLICY IF EXISTS "Permite leitura e escrita publica coordinator_campaigns" ON coordinator_campaigns;
DROP POLICY IF EXISTS "Permite leitura e escrita publica campaign_records" ON campaign_records;

CREATE POLICY "Permite leitura e escrita publica tre_locations" ON tre_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permite leitura e escrita publica coordinator_campaigns" ON coordinator_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permite leitura e escrita publica campaign_records" ON campaign_records FOR ALL USING (true) WITH CHECK (true);
