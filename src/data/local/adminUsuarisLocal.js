import {capturaAdminUsuaris} from '../adminUsuaris.js';
import {PERSONES_SEED} from '../localPerfils.js';
import {ENTITATS_SEED} from '../identitatsSeed.js';
/** Local authority is injected by the composition, never inferred from a profile. */
export function creaAdminUsuarisLocal(e){
  const etiquetes=new Map(),editors=new Map();
  e.alTancar(()=>{etiquetes.clear();editors.clear();});
  const denied=code=>Object.assign(new Error('Administració local no autoritzada.'),{code});
  async function autoritza(operacio,config){
    const check=e.abast(),personaId=e.usuari()?.id,authority=e.opcions.administracioLocal;
    if(!authority)throw denied('no-disponible');
    const tenantId=config?.tenantId??config?.tenant_id;
    if(typeof tenantId!=='string'||tenantId!==e.configuracio.tenantId||config.tenantId&&config.tenant_id&&config.tenantId!==config.tenant_id)throw denied('abast-invalid');
    if(!personaId)throw denied('sense-sessio');
    if(!authority.pobles.some(p=>p.id===tenantId))throw denied('sense-permis');
    if(await authority.autoritza(Object.freeze({personaId,tenantId,operacio}))!==true)throw denied('sense-permis');
    check();if(config.signal?.aborted)throw new DOMException('Operació cancel·lada.','AbortError');
    return {check,personaId,tenantId};
  }
  return {
    async adminLlistaUsuarisRegistrats(value={},config={}){
      const input=capturaAdminUsuaris(value),a=await autoritza('adminLlistaUsuarisRegistrats',config);a.check();
      const rows=(e.coleccio('persones').length?e.coleccio('persones'):PERSONES_SEED).map(p=>({id:p.id,full_name:p.full_name??p.nom??p.name??'',avatar_url:p.avatar_url??p.avatar??'',town_name:p.town_name??p.poble??'',organitzacions:[],categoria:etiquetes.get(`${a.personaId}:${p.id}`)??null,origen:'llavor'}));
      for(const org of e.coleccio('entitats').length?e.coleccio('entitats'):ENTITATS_SEED){
        let members;try{members=e.perfils.llistaMembresOrganitzacio(org.id,e.usuari());}
        catch(error){if(error?.code==='SDP-ORGMEM-002')continue;throw error;}
        for(const p of rows){const member=members.find(m=>String(m.id)===String(p.id));if(!member)continue;
          const role=member.rol??member.role;
          p.organitzacions.push({id:org.id,nom:org.name??org.nom??'',rol:role==='owner'?'owner':role==='admin'?'admin':editors.has(`${org.id}:${p.id}`)?'editor':'membre'});
        }
      }
      return rows.sort((x,y)=>String(x.id).localeCompare(String(y.id))).slice(input.offset,input.offset+input.limit);
    },
    async adminAssignaMembreOrganitzacio(value,config={}){
      const input=capturaAdminUsuaris(value,'membre',{local:true}),a=await autoritza('adminAssignaMembreOrganitzacio',config);a.check();
      // Canonical local membership operations retain owner and tenant restrictions.
      const data={tipus:'persona',id:input.usuariId,rol:input.rol==='admin'?'admin':'member'};
      if(input.lleva)e.perfils.llevaMembreOrganitzacio(input.organitzacioId,data,e.usuari());
      else e.perfils.desaMembreOrganitzacio(input.organitzacioId,data,e.usuari());
      const key=`${input.organitzacioId}:${input.usuariId}`;
      if(input.rol==='editor'&&!input.lleva)editors.set(key,true);else editors.delete(key);
      return {...input,llevat:input.lleva};
    },
    async adminConnectaUsuari(value,config={}){
      const input=capturaAdminUsuaris(value,'connecta',{local:true}),a=await autoritza('adminConnectaUsuari',config);a.check();
      const vincle=e.seguiments.segueix({tipus:'persona',id:input.usuariId},e.contextSeguiments());
      etiquetes.set(`${a.personaId}:${input.usuariId}`,input.categoria);
      return {...input,vincle:e.copia(vincle)};
    }
  };
}
