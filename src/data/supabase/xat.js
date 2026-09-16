/**
 * @module supabase/xat
 * @description Xat en temps real amb Supabase Realtime.
 * @contract
 *   - subscribeToChat(roomId, callback)
 *   - unsubscribeFromChat(subscription)
 *   - sendMessage(message)
 *   - fetchMessages(roomId, limit)
 */

import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { getResolvedConfig } from './runtime.js';
import { handleError } from './utils.js';

const TABLE = 'xat_missatges';

export const subscribeToXat = async (roomId, callback) => {
  try {
    const supabase = await getClient();
    const channel = supabase
      .channel(`xat_room_${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE, filter: `fil_id=eq.${roomId}` },
        (payload) => callback(null, payload.new)
      )
      .on('error', (error) => callback(error, null))
      .subscribe();

    return { subscription: channel, error: null };
  } catch (error) {
    return { subscription: null, error: handleError(error) };
  }
};

export const unsubscribeFromXat = async (subscription) => {
  if (subscription) {
    const supabase = await getClient();
    supabase.removeChannel(subscription);
  }
};

export const enviaMissatge = async (filId, cos, config = {}) => {
  try {
    const supabase = await getClient(config);
    const user = usuariDeSessio();
    if (!user) throw new Error("Usuari no identificat");

    const { data, error } = await supabase.from(TABLE).insert({
      fil_id: filId,
      usuari_id: user.id,
      text: cos
    }).select().single();
    
    if (error) throw error;
    
    // Mapejar al format que espera XatContext
    return {
      id: data.id,
      filId: data.fil_id,
      usuariId: data.usuari_id,
      text: data.text,
      esIA: data.es_ia,
      creatAl: data.creat_al
    };
  } catch (error) {
    throw new Error(handleError(error)?.message || "Error a l'enviar el missatge");
  }
};

export const loadMissatges = async (filId, config = {}) => {
  try {
    const supabase = await getClient(config);
    const { data, error } = await supabase.rpc('xat_missatges_del_fil', {
      p_fil_id: filId,
      p_limit: 200
    });
    if (error) throw error;
    
    // El RPC retorna id, usuari_id, autor_nom, cos, es_ia, creat_al
    return data.map(m => ({
      id: m.id,
      filId: filId,
      usuariId: m.usuari_id,
      autorNom: m.autor_nom,
      text: m.cos,
      esIA: m.es_ia,
      creatAl: m.creat_al
    }));
  } catch (error) {
    throw new Error(handleError(error)?.message || "Error al carregar missatges");
  }
};

export const marcaLlegit = async (filId, config = {}) => {
  try {
    const supabase = await getClient(config);
    const { data, error } = await supabase.rpc('xat_marca_llegit', {
      p_fil_id: filId
    });
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleError(error)?.message || "Error al marcar com a llegit");
  }
};

export const loadFils = async (config = {}) => {
  try {
    const supabase = await getClient(config);
    
    // Obtenir el tenant actual
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) return [];

    const { data, error } = await supabase.rpc('xat_fils_meus', { p_tenant_id: tenantId });
    if (error) throw error;
    
    return data.map(f => ({
      id: f.id,
      titol: f.titol,
      actualitzatAl: f.actualitzat_al,
      altresNoms: f.altres_noms || [],
      ultimText: f.ultim_text,
      ultimAl: f.ultim_al,
      noLlegits: f.no_llegits
    }));
  } catch (error) {
    throw new Error(handleError(error)?.message || "Error al carregar converses");
  }
};

export const creaFilDirecte = async (altreUsuariId, titol = null, config = {}) => {
  try {
    const supabase = await getClient(config);
    
    // Obtenir el tenant actual
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) throw new Error("No s'ha seleccionat cap poble");

    const { data, error } = await supabase.rpc('crea_fil_directe', {
      p_tenant_id: tenantId,
      p_altre_usuari: altreUsuariId,
      p_titol: titol
    });
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(handleError(error)?.message || "Error al crear la conversa");
  }
};

export const carregaMembres = async (textSearch, config = {}) => {
  try {
    const supabase = await getClient(config);
    const tenantId = getResolvedConfig(config).tenantId;
    if (!tenantId) return [];
    
    let query = supabase.rpc('membres_del_poble', { p_tenant_id: tenantId });
    if (textSearch) {
      query = query.ilike('nom', `%${textSearch}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

