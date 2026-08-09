/**
 * supabaseService
 *
 * Lightweight data service wrapper around Supabase client providing:
 * - Local caching in `localStorage` for offline-first behavior
 * - Helpers to persist and load campaign state and TRE locations
 * - Batch sync and upsert convenience methods used by the UI sync bar
 */
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { TreLocationItem, parseSecoes, extractZonaNum } from './treDataService';

export interface CampaignRecord {
  id?: string;
  coordinator_id: string;
  type: 'eleitor' | 'lider' | 'demanda' | 'material' | 'equipe';
  data: any;
  created_at?: string;
}

export interface OfflineAction {
  action: 'set' | 'delete';
  path: string;
  id: string;
  data?: any;
  timestamp: number;
}

function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem('nexus_offline_queue');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function pushToOfflineQueue(action: OfflineAction) {
  const queue = getOfflineQueue();
  // Se for set, substituir sets anteriores do mesmo doc
  const filtered = queue.filter(q => !(q.path === action.path && q.id === action.id));
  filtered.push(action);
  localStorage.setItem('nexus_offline_queue', JSON.stringify(filtered));
  window.dispatchEvent(new Event('offline_queue_updated'));
}

function clearOfflineQueue() {
  localStorage.removeItem('nexus_offline_queue');
  window.dispatchEvent(new Event('offline_queue_updated'));
}

/**
 * getLocalKey
 *
 * Return a deterministic localStorage key for a given collection `path` and optional `id`.
 * - Item keys: `nexus_sb_<path>_<id>`
 * - List keys: `nexus_sb_<path>_list`
 */
function getLocalKey(path: string, id?: string) {
  return id ? `nexus_sb_${path}_${id}` : `nexus_sb_${path}_list`;
}

/**
 * getLocalList
 *
 * Read a cached collection from localStorage. Returns an empty array on error.
 */
function getLocalList<T>(path: string): T[] {
  try {
    const raw = localStorage.getItem(getLocalKey(path));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

/**
 * setLocalList
 *
 * Persist a collection to localStorage using the `getLocalKey` naming scheme.
 */
function setLocalList(path: string, list: any[]) {
  try {
    localStorage.setItem(getLocalKey(path), JSON.stringify(list));
  } catch (e) {}
}

export const supabaseDataService = {
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
          nmMunicipio: raw.nmMunicipio || item.municipio || 'MUNICÍPIO ÚNICO',
          municipio: raw.municipio || item.municipio || 'MUNICÍPIO ÚNICO',
          nmLocalVotacao: raw.nmLocalVotacao || item.local || '',
          nmLocalVotacaoOriginal: raw.nmLocalVotacaoOriginal || raw.nmLocalVotacao || item.local || '',
          local: raw.nmLocalVotacao || item.local || '',
          nrZona: raw.nrZona || item.zona_clean || '',
          zona: raw.zona || item.zona || '',
          nrSecao: secoesStr,
          secoes: secoesStr,
          secoesCount: secoesCount,
          nmBairro: raw.nmBairro || item.bairro || '',
          bairro: raw.bairro || item.bairro || '',
          qtEleitorSecao: raw.qtEleitorSecao ?? item.eleitores ?? 0,
          eleitores: raw.qtEleitorSecao ?? item.eleitores ?? 0,
          cdTipoSecaoAgregada: raw.cdTipoSecaoAgregada ?? -1,
          dsTipoSecaoAgregada: raw.dsTipoSecaoAgregada || 'Principal',
          nrSecaoPrincipal: raw.nrSecaoPrincipal ?? -1,
          nrLocalVotacao: raw.nrLocalVotacao ?? '',
          dsEndereco: raw.dsEndereco || raw.endereco || '',
          endereco: raw.dsEndereco || raw.endereco || '',
          dsEnderecoLocvtOriginal: raw.dsEnderecoLocvtOriginal || raw.dsEndereco || ''
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
  },

  async getCollection<T>(path: string): Promise<T[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('campaign_records')
          .select('record_id, payload')
          .eq('record_type', path);

        if (!error && data) {
          const items = data.map(row => ({
            id: row.record_id,
            ...(row.payload || {})
          })) as T[];
          setLocalList(path, items);
          return items;
        }
      } catch (e) {
        console.warn(`Supabase getCollection error for ${path}:`, e);
      }
    }
    return getLocalList<T>(path);
  },

  async getCount(path: string, coordinatorId?: string): Promise<number> {
    const client = getSupabaseClient();
    if (client) {
      try {
        let query = client.from('campaign_records').select('id', { count: 'exact', head: true }).eq('record_type', path);
        if (coordinatorId && coordinatorId !== 'demo_coord_geral') {
           query = query.or(`coordinator_id.eq.${coordinatorId},payload->>coordinatorId.eq.${coordinatorId}`);
        }
        const { count, error } = await query;
        if (!error && count !== null) {
          return count;
        }
      } catch (e) {
         console.warn(`Supabase getCount error for ${path}:`, e);
      }
    }
    // Fallback offline
    const all = getLocalList<any>(path);
    if (coordinatorId && coordinatorId !== 'demo_coord_geral') {
       return all.filter(item => item.coordinatorId === coordinatorId || item.coordinator_id === coordinatorId).length;
    }
    return all.length;
  },

  async getDocument<T>(path: string, id: string): Promise<T | null> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('campaign_records')
          .select('record_id, payload')
          .eq('record_type', path)
          .eq('record_id', id)
          .maybeSingle();

        if (!error && data && data.payload) {
          return { id: data.record_id, ...data.payload } as T;
        }
      } catch (e) {
        console.warn(`Supabase getDocument error for ${path}/${id}:`, e);
      }
    }

    const localItems = getLocalList<any>(path);
    const found = localItems.find(item => item.id === id);
    if (found) return found as T;

    try {
      const raw = localStorage.getItem(getLocalKey(path, id));
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
  },

  async setDocument(path: string, id: string, data: any, merge: boolean = true) {
    const client = getSupabaseClient();
    const payload = { id, ...data };
    const coordinatorId = data.coordinatorId || data.coordinator_id || data.userId || 'default';

    // Local storage sync: keep a local copy for offline-first UX
    const items = getLocalList<any>(path);
    const idx = items.findIndex(item => item.id === id);
    if (idx >= 0) {
      items[idx] = merge ? { ...items[idx], ...payload } : payload;
    } else {
      items.push(payload);
    }
    setLocalList(path, items);
    try {
      localStorage.setItem(getLocalKey(path, id), JSON.stringify(payload));
    } catch (e) {}

    if (client) {
      try {
        const { error } = await client.from('campaign_records').upsert({
          coordinator_id: coordinatorId,
          record_type: path,
          record_id: id,
          payload: payload
        }, { onConflict: 'record_type,record_id' });
        
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase setDocument error for ${path}/${id}:`, e);
        if (!window.navigator.onLine || e.message?.includes('fetch') || e.message?.includes('Network')) {
          pushToOfflineQueue({ action: 'set', path, id, data: payload, timestamp: Date.now() });
        }
      }
    } else {
      pushToOfflineQueue({ action: 'set', path, id, data: payload, timestamp: Date.now() });
    }
  },

  async updateDocument(path: string, id: string, data: any) {
    const existing = (await this.getDocument(path, id)) || {};
    const updated = { ...existing, ...data };
    await this.setDocument(path, id, updated, true);
  },

  async deleteDocument(path: string, id: string) {
    const items = getLocalList<any>(path).filter(item => item.id !== id);
    setLocalList(path, items);
    try {
      localStorage.removeItem(getLocalKey(path, id));
    } catch (e) {}

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from('campaign_records')
          .delete()
          .eq('record_type', path)
          .eq('record_id', id);
          
        if (error) throw error;
      } catch (e: any) {
        console.warn(`Supabase deleteDocument error for ${path}/${id}:`, e);
        if (!window.navigator.onLine || e.message?.includes('fetch') || e.message?.includes('Network')) {
          pushToOfflineQueue({ action: 'delete', path, id, timestamp: Date.now() });
        }
      }
    } else {
       pushToOfflineQueue({ action: 'delete', path, id, timestamp: Date.now() });
    }
  },

  async addDocument(path: string, data: any): Promise<string> {
    const id = data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await this.setDocument(path, id, data, true);
    return id;
  },

  subscribeToCollection<T>(path: string, callback: (data: T[]) => void) {
    (this as any).getCollection(path).then(callback);

    const client = getSupabaseClient();
    if (client) {
      const channel = client
        .channel(`public:campaign_records:${path}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'campaign_records',
          filter: `record_type=eq.${path}`
        }, () => {
          (this as any).getCollection(path).then(callback);
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }

    return () => {};
  },

  subscribeToCollectionFiltered<T>(path: string, coordinatorId: string, callback: (data: T[]) => void) {
    (this as any).getCollectionFiltered(path, coordinatorId).then(callback);

    const client = getSupabaseClient();
    if (client) {
      const channel = client
        .channel(`public:campaign_records:${path}:${coordinatorId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'campaign_records',
          filter: `record_type=eq.${path}`
        }, () => {
          (this as any).getCollectionFiltered(path, coordinatorId).then(callback);
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }

    return () => {};
  },

  async getCollectionFiltered<T>(path: string, coordinatorId: string): Promise<T[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('campaign_records')
          .select('record_id, payload')
          .eq('record_type', path)
          .or(`coordinator_id.eq.${coordinatorId},payload->>coordinatorId.eq.${coordinatorId}`);

        if (!error && data) {
          const items = data.map(row => ({
            id: row.record_id,
            ...(row.payload || {})
          })) as T[];
          return items;
        }
      } catch (e) {
        console.warn(`Supabase getCollectionFiltered error for ${path}:`, e);
      }
    }

    const all = getLocalList<any>(path);
    return all.filter(item => item.coordinatorId === coordinatorId || item.coordinator_id === coordinatorId) as T[];
  },

  async getCollectionPaginated<T>(path: string, coordinatorId: string, options: { page: number; pageSize: number; filters?: any }): Promise<{ data: T[], total: number }> {
    const client = getSupabaseClient();
    const { page, pageSize, filters } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (client && window.navigator.onLine) {
      try {
        let query = client.from('campaign_records').select('record_id, payload', { count: 'exact' }).eq('record_type', path);
        if (coordinatorId && coordinatorId !== 'demo_coord_geral') {
           query = query.or(`coordinator_id.eq.${coordinatorId},payload->>coordinatorId.eq.${coordinatorId}`);
        }

        if (filters?.search) {
          query = query.ilike('payload->>name', `%${filters.search}%`);
        }
        if (filters?.intention) {
          query = query.eq('payload->>sentiment', filters.intention);
        }
        if (filters?.voted !== undefined) {
           query = query.eq('payload->>voted', filters.voted ? 'true' : 'false');
        }

        const { data, error, count } = await query.range(from, to);

        if (!error && data) {
          const items = data.map(row => ({
            id: row.record_id,
            ...(row.payload || {})
          })) as T[];
          return { data: items, total: count || 0 };
        }
      } catch (e) {
        console.warn(`Supabase getCollectionPaginated error for ${path}:`, e);
      }
    }

    // Fallback offline (local storage)
    let all = getLocalList<any>(path);
    if (coordinatorId && coordinatorId !== 'demo_coord_geral') {
       all = all.filter(item => item.coordinatorId === coordinatorId || item.coordinator_id === coordinatorId);
    }
    
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      all = all.filter(item => item.name?.toLowerCase().includes(s));
    }
    if (filters?.intention) {
      all = all.filter(item => item.sentiment === filters.intention);
    }
    if (filters?.voted !== undefined) {
      all = all.filter(item => !!item.voted === filters.voted);
    }

    const total = all.length;
    const paginated = all.slice(from, to + 1);
    
    return { data: paginated as T[], total };
  },

  async uploadImage(file: File, bucket: string = 'public_assets'): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await client.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return null;
      }

      const { data } = client.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.error('Error uploading image:', e);
      return null;
    }
  },

  getQueue() {
    return getOfflineQueue();
  },

  async processSyncQueue() {
    const queue = getOfflineQueue();
    if (queue.length === 0) return true;

    const client = getSupabaseClient();
    if (!client || !window.navigator.onLine) return false;

    let allSuccess = true;
    for (const action of queue) {
      try {
        if (action.action === 'set' && action.data) {
          const coordinatorId = action.data.coordinatorId || action.data.coordinator_id || action.data.userId || 'default';
          const { error } = await client.from('campaign_records').upsert({
            coordinator_id: coordinatorId,
            record_type: action.path,
            record_id: action.id,
            payload: action.data
          }, { onConflict: 'record_type,record_id' });
          if (error) throw error;
        } else if (action.action === 'delete') {
          const { error } = await client.from('campaign_records')
            .delete()
            .eq('record_type', action.path)
            .eq('record_id', action.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error(`Falha ao sincronizar item da fila (${action.action} ${action.path}/${action.id}):`, err);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      clearOfflineQueue();
    }
    return allSuccess;
  }

};

export const supabaseService = supabaseDataService;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    supabaseService.processSyncQueue().catch(console.error);
  });
}
