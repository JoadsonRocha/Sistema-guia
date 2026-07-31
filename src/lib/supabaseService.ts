import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { TreLocationItem } from './treDataService';

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
        // Table might not exist yet, but credentials are valid
        if (error.code === '42P01') {
          return { success: true, message: 'Conectado com sucesso! (Crie a tabela tre_locations com o script SQL fornecido)' };
        }
        return { success: false, message: `Erro ao conectar: ${error.message}` };
      }
      return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro de rede ou credenciais inválidas.' };
    }
  },

  // Save TRE locations to Supabase in batches for high speed
  async saveTreLocations(coordinatorId: string, locations: TreLocationItem[]): Promise<{ success: boolean; count: number; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, count: 0, error: 'Supabase não configurado' };

    try {
      // First, delete previous records for this coordinator or append
      await client.from('tre_locations').delete().eq('coordinator_id', coordinatorId);

      // Prepare records
      const rows = locations.map(loc => ({
        coordinator_id: coordinatorId,
        zona: loc.zona,
        zona_clean: loc.zonaClean,
        secoes: loc.secoes,
        secoes_str: loc.secoesStr,
        local: loc.local,
        bairro: loc.bairro || '',
        municipio: loc.municipio || '',
        eleitores: loc.eleitores || 0,
        raw_data: loc
      }));

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
  async loadTreLocations(coordinatorId: string): Promise<TreLocationItem[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('tre_locations')
        .select('*')
        .eq('coordinator_id', coordinatorId);

      if (error || !data) return null;

      return data.map(item => ({
        id: item.id || `sup_${item.zona_clean}_${item.local}`,
        zona: item.zona,
        zonaClean: item.zona_clean,
        secoes: item.secoes || [],
        secoesStr: item.secoes_str,
        local: item.local,
        bairro: item.bairro,
        municipio: item.municipio,
        eleitores: item.eleitores
      }));
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
