import {capturaCopiaCompte,FORMAT_COPIA_COMPTE} from '../portabilitatCompte.js';
import {NOTE_FOLDERS_SEED} from '../carpetesSeed.js';
const fail=code=>{throw Object.assign(new TypeError('Còpia local no disponible.'),{code,codi:code});};
export function capturaInicialPortable(input,{mode,persistenciaNotes,magatzemNotes,actor}) {
  if (input === null) return null;
  const snapshot=capturaCopiaCompte(input);
  if (snapshot.titularId!==actor) fail('copia-actor');
  if (mode!=='local'||persistenciaNotes!=='memoria'||magatzemNotes!==null) fail('copia-desti-no-atomic');
  for (const seed of NOTE_FOLDERS_SEED) {
    const row=snapshot.dades.noteFolders.find(folder=>folder.id===seed.id);
    if (!row || JSON.stringify(row)!==JSON.stringify(seed)) {
      // Canonical input may have a different own-property order.
      if (!row||row.id!==seed.id||row.name!==seed.name||row.parentId!==seed.parentId||Object.keys(row).length!==Object.keys(seed).length) fail('copia-carpeta-sistema');
    }
  }
  return snapshot;
}
export function creaPortabilitatLocal(e,snapshotPatrimoni,creaCandidat) {
  const actor=()=>{const user=e.usuari();if(!user?.id)fail('copia-actor');return user;};
  const business=user=>({...e.perfils.llegixNegociPortable(user),patrimoni:snapshotPatrimoni(user.id)});
  return {
    async llegixCopiaCompte(config={}) {
      const user=actor(),check=e.abast(),before=business(user);
      const notes=await e.notes.llegixSnapshot(user.id,e.ci(config));check();
      if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.','AbortError');
      if(JSON.stringify(before)!==JSON.stringify(business(user)))fail('copia-snapshot-modificat');
      return capturaCopiaCompte({format:FORMAT_COPIA_COMPTE,titularId:user.id,tenantId:e.configuracio.tenantId,generatAl:e.ara().toISOString(),dades:{...before,...notes}});
    },
    async restauraCopiaCompte(input,config={}) {
      const user=actor(),check=e.abast(),snapshot=capturaCopiaCompte(input);
      if(snapshot.titularId!==user.id)fail('copia-actor');
      await Promise.resolve();check();
      if(config.signal?.aborted)throw new DOMException('Operació cancel·lada.','AbortError');
      const adaptador=creaCandidat(snapshot);
      return {adaptador,restauracio:{creats:Object.fromEntries(Object.entries(snapshot.dades).map(([key,value])=>[key,Array.isArray(value)?value.length:1])),durabilitat:'memoria',destinacio:'copia-local-inactiva',actiuModificat:false}};
    }
  };
}
