import { capturaIdPagina, capturaTaxonomiaPagina } from '../taxonomia/taxonomiaPagina.js';
/* Només és autoritat del magatzem LOCAL, mai de Supabase. Es denega per
   defecte i no es deriva de noms, rols del perfil ni camps del payload. */
export function creaTaxonomiaPaginesLocal(e) {
  const files = new Map();
  return {
    async actualitzaTaxonomiaPagina(id, input, config = {}) {
      const net = capturaTaxonomiaPagina(id,input), viu = e.abast(), actor = e.usuari()?.id;
      if (!actor || !e.opcions.administracioLocal || await e.opcions.administracioLocal.autoritza({ operacio: 'actualitzaTaxonomiaPagina', tenantId: e.configuracio.tenantId, actorId: actor, idPagina: id }) !== true) throw Object.assign(new Error('Cal administració editorial de Sóc de Poble.'), { code: 'sense-permis' });
      viu(); config.signal?.throwIfAborted();
      const antiga = files.get(id);
      if ((antiga?.versio ?? 0) !== net.versio) throw Object.assign(new Error('La pàgina ha canviat. Recarrega abans de desar.'), { code: 'conflicte-versio' });
      const fila = Object.freeze({ ...net, versio: net.versio + 1 });
      files.set(id,fila); return structuredClone(fila);
    },
    async lligTaxonomiaPagina(id,config={}) {
      capturaIdPagina(id);const viu=e.abast(),actor=e.usuari()?.id;
      if (!actor || !e.opcions.administracioLocal || await e.opcions.administracioLocal.autoritza({operacio:'lligTaxonomiaPagina',tenantId:e.configuracio.tenantId,actorId:actor,idPagina:id})!==true) throw Object.assign(new Error('Cal administració editorial de Sóc de Poble.'),{code:'sense-permis'});
      viu();config.signal?.throwIfAborted();return files.has(id) ? structuredClone(files.get(id)) : null;
    }
  };
}
