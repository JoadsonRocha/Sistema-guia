import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { TreLocationItem, parseSecoes, extractZonaNum } from './treDataService';

export interface CampaignRecord {
  id?: string;
  coordinator_id: string;
  type: 'eleitor' | 'lider' | 'demanda' | 'material' | 'equipe';
  data: any;
  created_at?: string;
}

export const supabaseService = {
  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase não está configurado. Insira a URL e a Anon Key.' };
    }
    try {
      const { data, error } = await client.from('tre_locations').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation "tre_locations" does not exist')) {
        if (error.code === '42P01') {
          return { success: true, message: 'Conectado com sucesso! (A tabela tre_locations ainda não foi criada no SQL Editor)' };
        }
        return { success: false, message: `Erro ao conectar: ${error.message}` };
      }
      return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro de rede ou credenciais inválidas.' };
    }
  },

  // Save TRE locations to Supabase in batches for high speed
  async saveTreLocations(coordinatorId: string, locations: any[]): Promise<{ success: boolean; count: number; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, count: 0, error: 'Supabase não configurado' };

    try {
      // First, delete previous records for this coordinator
      await client.from('tre_locations').delete().eq('coordinator_id', coordinatorId);

      if (!locations || locations.length === 0) {
        return { success: true, count: 0 };
      }

      // Prepare records supporting both VotingLocation and TreLocationItem structures
      const rows = locations.map(loc => {
        const nmMuni = String(loc.nmMunicipio || loc.municipio || '').trim();
        const nmLoc = String(loc.nmLocalVotacao || loc.local || '').trim();
        const zRaw = String(loc.nrZona || loc.zona || '').trim();
        const zClean = loc.zonaClean || extractZonaNum(zRaw) || '1';
        const zLabel = loc.zona || (zRaw ? `${zRaw}ª ZE` : '1ª ZE');

        let secoesArr: string[] = [];
        let secoesStr = '';

        if (Array.isArray(loc.secoes)) {
          secoesArr = loc.secoes;
          secoesStr = loc.secoes.join(', ');
        } else if (typeof loc.secoes === 'string') {
          secoesStr = loc.secoes;
          secoesArr = parseSecoes(loc.secoes);
        } else if (loc.nrSecao) {
          secoesStr = String(loc.nrSecao);
          secoesArr = parseSecoes(String(loc.nrSecao));
        }

        const eleit = Number(loc.qtEleitorSecao ?? loc.eleitores) || 0;

        return {
          coordinator_id: coordinatorId,
          zona: zLabel,
          zona_clean: zClean,
          secoes: secoesArr,
          secoes_str: secoesStr,
          local: nmLoc,
          bairro: loc.nmBairro || loc.bairro || '',
          municipio: nmMuni || 'MUNICÍPIO ÚNICO',
          eleitores: eleit,
          raw_data: loc
        };
      });

      // Insert in chunks of 500 to prevent payload overflow
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await client.from('tre_locations').insert(chunk);
        if (error) {
          console.error('Error inserting TRE chunk into Supabase:', error);
          throw error;
        }
        inserted += chunk.length;
      }

      return { success: true, count: inserted };
    } catch (err: any) {
      console.error('Failed to save TRE locations to Supabase:', err);
      return { success: false, count: 0, error: err.message };
    }
  },

  // Load TRE locations for a coordinator from Supabase
  async loadTreLocations(coordinatorId: string): Promise<any[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('tre_locations')
        .select('*')
        .eq('coordinator_id', coordinatorId);

      if (error || !data || data.length === 0) return null;

      return data.map(item => {
        const raw = item.raw_data || {};
        const secoesArr = Array.isArray(item.secoes) ? item.secoes : [];
        const secoesStr = item.secoes_str || secoesArr.join(', ') || '';
        const secoesCount = secoesArr.length > 0 ? secoesArr.length : (raw.secoesCount || 1);

        return {
          nmMunicipio: item.municipio || raw.nmMunicipio || 'MUNICÍPIO ÚNICO',
          municipio: item.municipio || raw.municipio || 'MUNICÍPIO ÚNICO',
          nmLocalVotacao: item.local || raw.nmLocalVotacao || '',
          nmLocalVotacaoOriginal: item.local || raw.nmLocalVotacaoOriginal || '',
          local: item.local || raw.local || '',
          nrZona: item.zona_clean || raw.nrZona || '',
          zona: item.zona || raw.zona || '',
          nrSecao: secoesStr,
          secoes: secoesStr,
          secoesCount: secoesCount,
          nmBairro: item.bairro || raw.nmBairro || '',
          bairro: item.bairro || raw.bairro || '',
          qtEleitorSecao: item.eleitores || raw.qtEleitorSecao || 0,
          eleitores: item.eleitores || raw.eleitores || 0,
          cdTipoSecaoAgregada: raw.cdTipoSecaoAgregada ?? -1,
          dsTipoSecaoAgregada: raw.dsTipoSecaoAgregada || 'Principal',
          nrSecaoPrincipal: raw.nrSecaoPrincipal ?? -1,
          nrLocalVotacao: raw.nrLocalVotacao ?? '',
          dsEndereco: raw.dsEndereco || raw.endereco || '',
          endereco: raw.endereco || raw.dsEndereco || '',
          dsEnderecoLocvtOriginal: raw.dsEnderecoLocvtOriginal || ''
        };
      });
    } catch (err) {
      console.error('Failed to load TRE locations from Supabase:', err);
      return null;
    }
  },

  // Save generic campaign records (voters, leaders, demands, teams)
  async saveCampaignRecord(coordinatorId: string, type: 'eleitor' | 'lider' | 'demanda' | 'material' | 'equipe', recordData: any): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('campaign_records').insert({
        coordinator_id: coordinatorId,
        record_type: type,
        record_id: recordData.id || String(Date.now()),
        payload: recordData
      });
      return !error;
    } catch (e) {
      console.error('Supabase campaign record save error:', e);
      return false;
    }
  },

  // Batch sync campaign state
  async syncCampaignState(coordinatorId: string, campaignState: any): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('coordinator_campaigns').upsert({
        coordinator_id: coordinatorId,
        updated_at: new Date().toISOString(),
        campaign_data: campaignState
      }, { onConflict: 'coordinator_id' });

      return !error;
    } catch (e) {
      console.error('Supabase campaign sync error:', e);
      return false;
    }
  },

  // Load campaign state
  async loadCampaignState(coordinatorId: string): Promise<any | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('coordinator_campaigns')
        .select('campaign_data')
        .eq('coordinator_id', coordinatorId)
        .single();

      if (error || !data) return null;
      return data.campaign_data;
    } catch (e) {
      console.error('Supabase campaign state load error:', e);
      return null;
    }
  }
};
