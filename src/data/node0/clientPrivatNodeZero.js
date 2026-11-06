/** Node 0 cookie-session composition, enabled only by the package bootstrap.
 * A cookie session is an opaque server credential. This module never reads a
 * cookie, constructs a JWT, persists an identity or falls back to another DB.
 */
import {CONTRACTE_NUCLI,VERSIO_NORMES_CONVIVENCIA} from '../contracte.js';
import {BACKEND_ID_NODE_ZERO,CONVIDAT_NODE_ZERO} from './adaptadorNodeZeroHttp.js';
import {capturaAdminUsuaris,validaLlistaAdminUsuaris,validaInvitacioAdmin,validaConnexioAdmin} from '../adminUsuaris.js';
import {validaLotDadesObertes} from '../dadesObertesLot.js';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail=(codi,message='Esta operació no està disponible al Node 0.',extra={})=>Object.assign(new Error(message),{codi,code:codi,retriable:false,...extra});
const absent=()=>{throw fail('sense-capacitat');};
const stale=()=>fail('NODE0_IDENTITAT_CANVIADA','La identitat ha canviat; la resposta no s’ha aplicat.',{name:'AbortError',efectePotHaverPassat:true});
const invalid=()=>fail('BACKEND_RESPOSTA_INVALIDA','El Node 0 ha tornat dades invàlides.');
const own=(value,key)=>Object.hasOwn(value,key);
const PAGE_SECTIONS=new Set(['mur','mercat','events','multimedia']);
const PUBLISH_SECTIONS=new Set([...PAGE_SECTIONS,'notes']);
const INSTANT=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const authorityKeys=new Set(['id','sectionId','tenant_id','tenantId','created_at','createdAt','updated_at','updatedAt','author_org_id','authorOrgId','author_entity_id','author_id','author_user_id','owner_user_id','ownerUserId','author_agent_id','authorAgentId','isSystem','isAvis','is_pinned','pinned_position','mainHref','slug','article','autor','source','srcDelPort']);
function dataCopy(input){
  let nodes=0;
  const copy=(value,depth=0)=>{
    if(++nodes>20000||depth>20)throw invalid();
    if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
    if(!plain(value)&&!Array.isArray(value))throw invalid();
    const output=Array.isArray(value)?[]:Object.create(null);
    if(Array.isArray(value)&&Reflect.ownKeys(value).length!==value.length+1)throw invalid();
    for(const key of Reflect.ownKeys(value)){
      if(Array.isArray(value)&&key==='length')continue;
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(typeof key!=='string'||!descriptor?.enumerable||!own(descriptor,'value'))throw invalid();
      output[key]=copy(descriptor.value,depth+1);
    }
    return output;
  };return copy(input);
}
function userFrom(body){
  if(!plain(body)||!own(body,'user'))throw invalid();
  if(body.user===null)return null;
  const value=body.user;
  if(!plain(value)||typeof value.id!=='string'||!UUID.test(value.id)||typeof value.email!=='string'||value.email.length>254||
    typeof value.email_confirmed_at!=='string'||!Number.isFinite(Date.parse(value.email_confirmed_at)))throw invalid();
  const meta=plain(value.user_metadata)?value.user_metadata:{};
  const metadata={};for(const field of ['full_name','avatar_url','username','town_name'])if(typeof meta[field]==='string'&&meta[field].length<=2048)metadata[field]=meta[field];
  return Object.freeze({id:value.id.toLowerCase(),email:value.email,email_confirmed_at:value.email_confirmed_at,
    user_metadata:Object.freeze(metadata),...(metadata.full_name?{full_name:metadata.full_name}:{}),...(metadata.avatar_url?{avatar_url:metadata.avatar_url}:{})});
}
function row(value){if(!plain(value)||typeof value.id!=='string'||!UUID.test(value.id))throw invalid();return value;}
const list=value=>{if(!Array.isArray(value)||value.some(item=>!plain(item)))throw invalid();return value;};
function note(value){
  row(value);if(!Number.isSafeInteger(value.revision)||value.revision<1)throw invalid();
  const mapped={id:value.id,revision:value.revision};
  const fields={folder_id:'folderId',title:'title',subtitle:'subtitle',lead:'lead',content:'content',copyright:'copyright',categories:'categories',tags:'tags',
    hero_image:'heroImage',logo_image:'logoImage',logo_image_dark:'logoImageDark',is_published:'isPublished',published_submission_id:'publishedSubmissionId',
    status:'estat',trashed_at:'enPapereraAl',icon:'icon',publish_date:'publishDate',fitxa:'fitxa',origen:'origen',created_at:'createdAt',updated_at:'updatedAt'};
  for(const[key,target]of Object.entries(fields))if(own(value,key))mapped[target]=value[key];
  return mapped;
}
function message(value,filId){
  row(value);if(!Number.isSafeInteger(value.seq)||value.seq<1||value.fil_id&&value.fil_id!==filId)throw invalid();
  return {id:value.id,filId:value.fil_id??filId,seq:value.seq,usuariId:value.usuari_id,autorNom:value.autor_nom??null,text:value.cos??null,
    tipus:value.tipus??'text',respostaA:value.resposta_a??null,editatAl:value.editat_al??null,esborratAl:value.esborrat_al??null,
    metadades:plain(value.metadades)?value.metadades:{},esIA:value.es_ia===true,comOrgId:value.com_org_id??null,creatAl:value.creat_al};
}
function thread(value){
  row(value);const output={id:value.id,tipus:value.tipus??'directe',titol:value.titol??null};
  const fields={altres_noms:'altresNoms',altres:'altres',org_id:'entitatId',entitat_nom:'entitatNom',com_entitat:'comEntitat',imatge_url:'imatgeUrl',
    actualitzat_al:'actualitzatAl',ultim_text:'ultimText',ultim_tipus:'ultimTipus',ultim_al:'ultimAl',ultim_autor_id:'ultimAutorId',ultim_seq:'ultimSeq',
    llegit_fins_seq:'llegitFinsSeq',rebut_fins_seq:'rebutFinsSeq',llegit_pels_altres_fins_seq:'llegitPelsAltresFinsSeq',no_llegits:'noLlegits',
    arxivat_al:'arxivatAl',fixat_al:'fixatAl',silenciat_fins_al:'silenciatFinsAl',preferit_al:'preferitAl',no_llegit_manual:'noLlegitManual',comunitat_id:'comunitatId',rol:'rol',participants:'participants',participant:'participant'};
  for(const[key,target]of Object.entries(fields))if(own(value,key))output[target]=value[key];return output;
}
const PENDING=Object.freeze(['appendChatMessages','appendSectionSubmissionNetworkOnly','loginWithMagicLink','loginWithGoogle','recullTornadaOAuth','subscribeToXat','unsubscribeFromXat']);
function defaultEmit(detail){if(globalThis.window?.dispatchEvent&&typeof CustomEvent==='function')globalThis.window.dispatchEvent(new CustomEvent('sdp:auth-change',{detail}));}

/** Internal DI only: habilitaPrivat is a build/package choice, not host config.
 * The canonical cookie helper takes expectedActor in per-call config; the
 * server must compare it inside the same transaction before setting claims.
 */
export async function preparaClientPrivatNodeZero({publicAdapter,transport,habilitaPrivat=false,emetCanvi=defaultEmit}={}){
  if(!publicAdapter||CONTRACTE_NUCLI.some(name=>typeof publicAdapter[name]!=='function')||typeof publicAdapter.lligEstatNodeZero!=='function')throw new TypeError('Cal l’adaptador públic Node 0 complet.');
  if(habilitaPrivat!==true)return Object.freeze({adapter:publicAdapter,privatActiu:false,motiu:'bandera-apagada'});
  const status=await publicAdapter.lligEstatNodeZero();
  if(status?.node!=='node0'||status?.postgresql?.ok!==true||status?.capabilities?.userSessions!==true)return Object.freeze({adapter:publicAdapter,privatActiu:false,motiu:'servidor-sense-sessions'});
  if(!transport||typeof transport.demanaAuth!=='function'||typeof emetCanvi!=='function')throw new TypeError('Transport de sessió requerit.');
  const cfg=publicAdapter.configuracio;
  if(cfg?.backendId!==BACKEND_ID_NODE_ZERO||!UUID.test(cfg.tenantId??''))throw new TypeError('Àmbit Node 0 invàlid.');
  const bound=status.capabilities.actorBinding===true&&typeof transport.demanaPrivat==='function';
  const roles=status.capabilities.roleRead===true&&bound;
  const publications=status.capabilities.sectionSubmissions===true&&bound;
  const pages=status.capabilities.paginacioSeccions===true&&bound;
  const norms=status.capabilities.norms===true&&bound;
  let epoch=0,user=null,state='unknown',closed=false,uncertain=false,queue=Promise.resolve(),pending=0;
  const emit=()=>{const detail=Object.freeze({user,backendId:cfg.backendId,backendUrl:cfg.backendUrl,tenantId:cfg.tenantId,epoch,sessionState:state});
    queueMicrotask(()=>{try{emetCanvi(detail);}catch{/* UI listeners cannot roll back a server authentication. */}});};
  const open=()=>{if(closed)throw fail('NODE0_TANCAT','L’adaptador està tancat.');if(uncertain)throw fail('NODE0_SESSIO_INCERTA','Cal recarregar per tornar a comprovar la sessió.',{requiresReload:true});};
  function config(value={}){
    if(!plain(value))throw new TypeError('Configuració invàlida.');
    if(value.backendId!==undefined&&value.backendId!==cfg.backendId||value.backendUrl!==undefined&&value.backendUrl!==cfg.backendUrl||value.tenantId!==undefined&&value.tenantId!==cfg.tenantId)throw fail('NODE0_AMBIT_INVALID');
    return value.signal?{signal:value.signal}:{};
  }
  const current=ticket=>{open();if(ticket!==epoch)throw stale();};
  function poison(){epoch++;user=null;state='uncertain';uncertain=true;emit();}
  function commit(body,ticket,notify=true){
    current(ticket);const verified=userFrom(body);
    if(user?.id!==verified?.id)epoch++;
    user=verified;state='verified';if(notify)emit();return user;
  }
  function serial(work){const result=queue.then(work);queue=result.catch(()=>{});return result;}
  async function refreshNow(ticket,options,notify=true){const value=await transport.demanaAuth('session',{},options);return commit(value,ticket,notify);}
  function actualitzaSessio(options={}){
    open();const signal=config(options),ticket=epoch;
    return serial(async()=>{current(ticket);try{return Boolean(await refreshNow(ticket,signal));}catch(error){if(ticket===epoch&&state!=='verified')poison();throw error;}});
  }
  // Refresh is awaited before the adapter can be injected/rendered. No auth
  // event is emitted while the old backend might still own the document.
  try{await refreshNow(epoch,{},false);}catch{poison();throw fail('NODE0_SESSIO_INCERTA','No s’ha pogut comprovar la cookie del Node 0.',{requiresReload:true});}
  function mutate(action,body,options={},validate=()=>true){
    open();const signal=config(options);
    if(['logout','password','norms'].includes(action)){
      if(!bound)throw fail('sense-capacitat','Falta el vincle entre la identitat esperada i la cookie.');
      signal.expectedActor=actor().id;
    }
    // A password form is mounted under RequireAuth. Keep its previously
    // verified actor visible until the server actually clears the cookie;
    // private RPCs are still blocked while changing and the epoch is advanced.
    const ticket=++epoch;if(action!=='password')user=null;state='changing';pending++;emit();
    let completedEpoch=null;
    const job=serial(async()=>{
      let dispatched=false;
      try{
        current(ticket);dispatched=true;
        const result=await transport.demanaAuth(action,body,signal);current(ticket);validate(result);
        const observed=await transport.demanaAuth('session',{},config(options));current(ticket);
        const verified=userFrom(observed);
        if(action==='login'){
          const expected=userFrom(result);commit(observed,ticket);completedEpoch=epoch;
          if(!expected||verified?.id!==expected.id)throw stale();
          return {user};
        }
        commit(observed,ticket);completedEpoch=epoch;
        if(['logout','password'].includes(action)&&verified)throw stale();
        return result;
      }catch(error){
        // A timeout/abort/5xx after dispatch may have installed a cookie despite
        // the lost response. No later login/logout/private request is retried.
        const definitive=Number.isInteger(error?.status)&&error.status>=400&&error.status<500;
        if(dispatched&&!definitive&&error?.codi!=='NODE0_IDENTITAT_CANVIADA')poison();
        else if(definitive&&ticket===epoch){try{await refreshNow(ticket,{});}catch{poison();}}
        throw error;
      }finally{pending--;}
    });
    return job.then(result=>{if(completedEpoch!==null)current(completedEpoch);return result;});
  }
  function actor(){open();if(state!=='verified'||pending)throw fail('NODE0_AUTH_PENDENT','La identitat encara s’està comprovant.');if(!user)throw fail('sense-permis','Cal iniciar sessió.',{status:401});return {ticket:epoch,id:user.id};}
  async function rpc(action,body,options={},write=false){
    open();if(!bound)throw fail('sense-capacitat','Falta el vincle entre la identitat esperada i la cookie.');
    const captured=actor(),signal=config(options);
    try{const value=await transport.demanaPrivat(action,body,{...signal,expectedActor:captured.id});current(captured.ticket);if(user?.id!==captured.id)throw stale();return value;}
    catch(error){if(captured.ticket===epoch&&[401,409].includes(error?.status)&&(error.status===401||error.serverCode==='session_actor_changed')){epoch++;user=null;state='unknown';emit();}if(error?.codi==='NODE0_IDENTITAT_CANVIADA'&&write)error.efectePotHaverPassat=true;throw error;}
  }
  async function authBound(action,body,options={}){
    const captured=actor(),signal=config(options);
    try{const value=await transport.demanaAuth(action,body,{...signal,expectedActor:captured.id});current(captured.ticket);return value;}
    catch(error){if(captured.ticket===epoch&&(error?.status===401||error?.status===409&&error.serverCode==='session_actor_changed')){epoch++;user=null;state='unknown';emit();}throw error;}
  }
  function normsDto(value,accepted=false){
    if(!plain(value)||typeof value.versio!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.versio)||
      value.acceptada_al!==null&&(typeof value.acceptada_al!=='string'||!Number.isFinite(Date.parse(value.acceptada_al)))||accepted&&value.acceptada_al===null)throw invalid();
    return {versio:value.versio,acceptadaAl:value.acceptada_al};
  }
  let mapping=null;
  const mappers=()=>mapping??=(import('../mapejadorSeccions.js'));
  function pageCursor(value){if(!plain(value)||typeof value.createdAt!=='string'||!INSTANT.test(value.createdAt)||!Number.isFinite(Date.parse(value.createdAt))||typeof value.id!=='string'||!UUID.test(value.id))throw invalid();return {createdAt:value.createdAt,id:value.id};}
  const encodeCursor=(section,actorId,cursor)=>JSON.stringify([cfg.tenantId,actorId,section,cursor.createdAt,cursor.id]);
  async function sectionPage(section,cursor,limit,options){
    if(!pages||!PAGE_SECTIONS.has(section))return absent();
    if(!Number.isInteger(limit)||limit<1||limit>50)throw fail('NODE0_LIMIT_INVALID');
    const captured=actor();let next=null;
    if(cursor!==null){let decoded;try{decoded=JSON.parse(cursor);}catch{throw fail('NODE0_CURSOR_INVALID');}
      if(!Array.isArray(decoded)||decoded.length!==5||decoded[0]!==cfg.tenantId||decoded[1]!==captured.id||decoded[2]!==section)throw fail('NODE0_CURSOR_INVALID');
      next=pageCursor({createdAt:decoded[3],id:decoded[4]});
    }
    const result=await rpc('loadSeccioPage',{sectionId:section,limit,...(next?{cursor:next}:{})},options);
    if(!plain(result)||!Array.isArray(result.rows)||result.rows.length>limit||typeof result.complete!=='boolean'||new TextEncoder().encode(JSON.stringify(result.rows)).byteLength>1048576)throw invalid();
    const cursorOut=result.nextCursor===null?null:pageCursor(result.nextCursor);
    if(result.complete!==(cursorOut===null)||!result.complete&&result.rows.length===0)throw invalid();
    const mapper=await mappers();current(captured.ticket);
    const elements=result.rows.map(value=>{
      row(value);if(value.section_id!==section||!UUID.test(value.owner_user_id??'')||value.author_org_id!==null&&value.author_org_id!==undefined&&!UUID.test(value.author_org_id)||!INSTANT.test(value.created_at??''))throw invalid();
      return mapper.elementDeFilaPublicada({id:value.id,payload:value.payload,titol:value.title,createdAt:value.created_at,updatedAt:value.updated_at,
        ownerUserId:value.owner_user_id,authorOrgId:value.author_org_id,sectionId:section});
    });
    if(cursorOut){const last=result.rows.at(-1);if(cursorOut.createdAt!==last.created_at||cursorOut.id!==last.id)throw invalid();}
    current(captured.ticket);
    return {elements,complete:result.complete,nextCursor:cursorOut?encodeCursor(section,captured.id,cursorOut):null};
  }
  const adapter={...publicAdapter};
  if(bound&&status.capabilities.restauracioDadesObertes===true){
    adapter.restauraDadesObertes=async(lot,options={})=>{
      const captured=dataCopy(lot);if(validaLotDadesObertes(captured).length||captured.versio!=='1.2.0')throw fail('NODE0_PAQUET_INVALID');
      return rpc('restauraDadesObertes',{lot:captured},options,true);
    };
    adapter.importaMunicipiOpenData=async(bytes,sha256Esperat,options={})=>{
      if(!(bytes instanceof Uint8Array)||bytes.length>1048576||!/^[a-f0-9]{64}$/.test(sha256Esperat??''))throw fail('NODE0_PAQUET_INVALID');
      let binary='';for(const byte of new Uint8Array(bytes))binary+=String.fromCharCode(byte);
      return rpc('importaMunicipiOpenData',{zipBase64:btoa(binary),sha256Esperat},options,true);
    };
  }
  if(bound&&status.capabilities.administracioUsuaris===true){
    adapter.adminLlistaUsuarisRegistrats=async(input={},options={})=>{const captured=capturaAdminUsuaris(input);return validaLlistaAdminUsuaris(await rpc('adminLlistaUsuarisRegistrats',{entrada:captured},options),captured.limit);};
    adapter.adminAssignaMembreOrganitzacio=async(input,options={})=>{const captured=capturaAdminUsuaris(input,'membre');return validaInvitacioAdmin(await rpc('adminAssignaMembreOrganitzacio',{entrada:captured},options,true),captured);};
    adapter.adminConnectaUsuari=async(input,options={})=>{const captured=capturaAdminUsuaris(input,'connecta');return validaConnexioAdmin(await rpc('adminConnectaUsuari',{entrada:captured},options,true),captured);};
  }
  Object.assign(adapter,{
    getCurrentUser:()=>{open();return user;},getDefaultUserId:()=>{open();return user?.id??CONVIDAT_NODE_ZERO;},
    async loginWithPassword(email,password,options={}){return mutate('login',{email,password},options,result=>{userFrom(result);});},
    async registerWithPassword(email,password,metadata={},options={}){
      if(!plain(metadata)||metadata.accepta_rgpd!==true||typeof metadata.versio_politica!=='string'||!metadata.versio_politica)throw fail('consent_required','Cal acceptar explícitament la versió mostrada de la política.');
      return mutate('register',{email,password,metadata},options,result=>{if(result?.verification_required!==true)throw invalid();});
    },
    async logout(options={},scope={}){
      if(scope.scope!==undefined&&scope.scope!=='local'||scope.abast!==undefined&&scope.abast!=='actor')return absent();
      await mutate('logout',{},options,result=>{if(result?.logged_out!==true)throw invalid();});return true;
    },
    async updateUserPassword(password,options={}){
      if(typeof options.currentPassword!=='string'||!options.currentPassword)throw fail('NODE0_CONTRASENYA_ACTUAL','Cal la contrasenya actual.');
      await mutate('password',{currentPassword:options.currentPassword,password},options,result=>{if(result?.password_changed!==true||result.login_required!==true)throw invalid();});return true;
    },
    async getProfile(options={}){open();if(state==='verified'&&!user)return null;const value=await rpc('getProfile',{},options);if(value===null)return null;row(value);if(value.id!==user.id)throw invalid();return value;},
    async updateProfile(updates,options={}){const value=await rpc('updateProfile',{updates},options,true);row(value);if(value.id!==user.id)throw invalid();return value;},
    async listMyOrganizations(options={}){open();if(state==='verified'&&!user)return [];return list(await rpc('listMyOrganizations',{},options));},
    async createOrganization(organization,options={}){if(status.capabilities.createOrganization!==true)return absent();return row(await rpc('createOrganization',{organization},options,true));},
    async updateOrganization(id,updates,options={}){const value=await rpc('updateOrganization',{id,updates},options,true);row(value);return value;},
    async loadNotes(owner,options={}){
      open();if(owner!==undefined&&owner!==(user?.id??CONVIDAT_NODE_ZERO))throw fail('NODE0_PROPIETARI_INVALID');
      const body={};for(const field of ['noteId','limit'])if(options[field]!==undefined)body[field]=options[field];
      if(options.cursor!=null){let tuple;try{tuple=JSON.parse(options.cursor);}catch{throw fail('NODE0_CURSOR_INVALID');}if(!Array.isArray(tuple)||tuple.length!==3||tuple[0]!==cfg.tenantId||tuple[1]!==user?.id||!UUID.test(tuple[2]))throw fail('NODE0_CURSOR_INVALID');body.cursor=tuple[2];}
      const result=await rpc('loadNotes',body,options);list(result?.rows);if(!Number.isInteger(result.limit)||result.limit<1||result.limit>200||result.rows.length>result.limit+1)throw invalid();
      if(options.noteId!==undefined&&result.rows.some(value=>value.id!==options.noteId))throw invalid();
      const complete=result.rows.length<=result.limit,rows=result.rows.slice(0,result.limit),notes=rows.map(value=>({...note(value),contentLoaded:own(value,'content')}));
      return {notes,noteFolders:[],notesComplete:complete,complete,nextCursor:complete?null:JSON.stringify([cfg.tenantId,user.id,rows.at(-1).id]),
        ...(options.noteId!==undefined?{noteResolution:{id:options.noteId,status:notes.length?'found':'not-found'}}:{})};
    },
    async createNote(input,options={}){return note(await rpc('createNote',{input},options,true));},
    async updateNote(id,updates,expectedRevision,options={}){return note(await rpc('updateNote',{id,updates,expectedRevision},options,true));},
    async loadFils(options={}){return list(await rpc('loadFils',{},options)).map(thread);},
    async loadMissatges(filId,options={}){
      if(options.visitant)return absent();const body={filId};for(const[from,to]of [['abansDeSeq','before'],['despresDeSeq','after'],['limit','limit']])if(options[from]!==undefined)body[to]=options[from];
      return list(await rpc('loadMissatges',body,options)).map(value=>message(value,filId)).sort((a,b)=>a.seq-b.seq);
    },
    async enviaMissatge(filId,cos,options={}){
      const value=typeof cos==='string'?{text:cos}:cos;if(!plain(value)||typeof value.text!=='string'||!value.text.trim())throw fail('NODE0_MISSATGE_INVALID');
      if(value.tipus!==undefined&&value.tipus!=='text')return absent();
      const body={filId,id:value.id??globalThis.crypto.randomUUID(),text:value.text.trim()};for(const field of ['tipus','respostaA','metadades'])if(value[field]!==undefined)body[field]=value[field];
      const result=list(await rpc('enviaMissatge',body,options,true));if(result.length!==1||result[0].id!==body.id)throw invalid();return message(result[0],filId);
    },
    async marcaLlegit(filId,options={}){
      const body={filId};for(const field of ['rebutFinsSeq','llegitFinsSeq'])if(options[field]!==undefined)body[field]=options[field];
      const result=list(await rpc('marcaLlegit',body,options,true));if(result.length!==1)throw invalid();
      return {llegitFinsSeq:result[0].llegit_fins_seq??null,rebutFinsSeq:result[0].rebut_fins_seq??null};
    },
    async creaFilDirecte(altreUsuariId,titol=null,options={}){const value=await rpc('creaFilDirecte',{altreUsuariId,titol},options,true);if(typeof value!=='string'||!UUID.test(value))throw invalid();return value;},
    async carregaMembres(cerca,options={}){return list(await rpc('carregaMembres',{...(cerca!==undefined?{cerca}:{}),...(options.limit!==undefined?{limit:options.limit}:{})},options));},
    destroy(){if(closed)return;epoch++;user=null;state='closed';closed=true;emit();transport.destroy?.();publicAdapter.destroy();},
    operacions:Object.freeze({lecturaPublica:true,autenticacio:true,escriptura:bound,xatText:bound,xatTempsReal:false,
      paginacioSeccions:pages,publicacions:publications,normesConvivencia:norms,
      pendent:Object.freeze([...PENDING.filter(name=>name!=='appendSectionSubmissionNetworkOnly'||!publications),...(status.capabilities.createOrganization===true?[]:['createOrganization'])])})
  });
  for(const name of PENDING)adapter[name]=async()=>absent();
  if(publications)adapter.appendSectionSubmissionNetworkOnly=async(submission,options={})=>{
    const captured=actor(),input=dataCopy(submission);
    if(!plain(input)||!PUBLISH_SECTIONS.has(input.sectionId)||input.id!==undefined&&!UUID.test(input.id))throw fail('NODE0_PUBLICACIO_INVALIDA');
    const id=input.id??globalThis.crypto.randomUUID();
    if(!plain(input.payload??{})||new TextEncoder().encode(JSON.stringify(input.payload??{})).byteLength>128*1024)throw fail('NODE0_PUBLICACIO_MASSA_GRAN');
    const mapper=await mappers();current(captured.ticket);
    // Existing neutral mapper + real DOMPurify. This is not an HTML escaper or
    // substitute sanitizer; server-authoritative fields are removed separately.
    const normalized=mapper.mapSectionSubmissionToItem({...input,id,payload:input.payload??{}});
    const payload=Object.fromEntries(Object.entries(normalized).filter(([key])=>!authorityKeys.has(key)));
    const wire={id,sectionId:input.sectionId,payload};for(const field of ['title','description','actor'])if(own(input,field))wire[field]=input[field];
    let saved;try{saved=await rpc('appendSectionSubmissionNetworkOnly',{submission:wire},options,true);}catch(error){error.requestId=id;throw error;}
    row(saved);if(saved.id!==id||saved.owner_user_id!==captured.id||saved.section_id!==input.sectionId||!INSTANT.test(saved.created_at??''))throw invalid();
    const published=mapper.elementDeFilaPublicada({id:saved.id,payload:saved.payload,titol:saved.title,createdAt:saved.created_at,updatedAt:saved.updated_at,
      ownerUserId:saved.owner_user_id,authorOrgId:saved.author_org_id,sectionId:saved.section_id});current(captured.ticket);
    return {id:saved.id,ownerUserId:saved.owner_user_id,authorOrgId:saved.author_org_id??null,sectionId:saved.section_id,title:saved.title,
      description:saved.description,createdAt:saved.created_at,payload:published};
  };
  if(pages){
    adapter.loadSeccioPage=({seccio,cursor=null,limit=50,signal}={},options={})=>sectionPage(seccio,cursor,limit,{...options,...(signal?{signal}:{})});
    adapter.loadMur=async(owner,options={})=>{
      if(owner!==undefined&&owner!==(user?.id??CONVIDAT_NODE_ZERO))throw fail('NODE0_PROPIETARI_INVALID');
      const base=await publicAdapter.loadMur(owner,options);if(state==='verified'&&!user)return base;
      const result=await Promise.all(['mur','events','mercat'].map(section=>sectionPage(section,null,50,options))),mapper=await mappers();
      const paginacio={};['mur','events','mercat'].forEach((section,index)=>{if(!result[index].complete)paginacio[section]=result[index].nextCursor;});
      return {feedPosts:mapper.mergeById(base.feedPosts,result[0].elements),events:mapper.mergeById(base.events,result[1].elements),marketItems:mapper.mergeById(base.marketItems,result[2].elements),paginacio};
    };
    adapter.loadMultimedia=async(owner,options={})=>{
      if(owner!==undefined&&owner!==(user?.id??CONVIDAT_NODE_ZERO))throw fail('NODE0_PROPIETARI_INVALID');
      const base=await publicAdapter.loadMultimedia(owner,options);if(state==='verified'&&!user)return base;
      const result=await sectionPage('multimedia',null,50,options),mapper=await mappers();
      return {mediaItems:mapper.mergeById(base.mediaItems,result.elements),...(result.complete?{}:{paginacio:{multimedia:result.nextCursor}})};
    };
  }
  const invalidEmailProof=()=>fail('SDP-CORREU-001','Revisa el correu o la prova de verificació.');
  const proof=(token,password,metadata,required)=>{
    if(metadata!==null&&metadata!==undefined)metadata=dataCopy(metadata);
    if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token)||typeof password!=='string'||password.length<12||password.length>256)throw invalidEmailProof();
    if(required||metadata!==null&&metadata!==undefined){if(!plain(metadata)||metadata.accepta_rgpd!==true||typeof metadata.versio_politica!=='string'||!metadata.versio_politica)throw invalidEmailProof();}
    return {token,password,...(metadata?{metadata}:{} )};
  };
  const mailRequest=(action,value,options={})=>{
    open();if(typeof value!=='string'||value.length>254||!value.includes('@'))return Promise.reject(invalidEmailProof());
    const ticket=epoch;return transport.demanaAuth(action,{email:value},config(options)).then(result=>{current(ticket);if(result?.verification_required!==true&&result?.recovery_requested!==true)throw invalid();return result;});
  };
  if(status.capabilities.emailVerificationWithPassword===true){
    adapter.confirmaCorreu=async(token,password,metadata,options={})=>mutate('verify-email',proof(token,password,metadata,true),options,value=>{if(value?.verified!==true||value.login_required!==true)throw invalid();});
    adapter.reenviaVerificacioCorreu=(email,options)=>mailRequest('resend-verification',email,options);
  }
  if(status.capabilities.emailPasswordRecovery===true){
    adapter.demanaRestablimentCorreu=(email,options)=>mailRequest('request-password-reset',email,options);
    adapter.restablixContrasenyaAmbCorreu=async(token,password,metadata=null,options={})=>mutate('reset-password',proof(token,password,metadata,false),options,value=>{if(value?.password_changed!==true||value.login_required!==true)throw invalid();});
  }
  if(roles){adapter.refrescaSessio=actualitzaSessio;adapter.elMeuRol=async options=>{const role=await rpc('elMeuRol',{},options);if(role!==null&&(typeof role!=='string'||!role))throw invalid();return role;};}
  if(norms){
    adapter.estatNormes=async(options={})=>{
      open();if(state==='verified'&&!user){const policy=await transport.demanaAuth('policy',{},config(options));return normsDto({versio:policy?.normsVersion,acceptada_al:null});}
      return normsDto(await authBound('norms-state',{},options));
    };
    adapter.acceptaNormes=async(version,options={})=>{
      if(version!==VERSIO_NORMES_CONVIVENCIA)throw fail('versio-invalida','La versió de les normes mostrada no coincidix.');
      return normsDto(await authBound('norms',{accept:true,version},options),true);
    };
  }
  // Include the mapper's final microtask in the epoch boundary as well. A
  // completed HTTP request must not deliver actor A's DTO after login B starts.
  for(const name of ['getProfile','updateProfile','listMyOrganizations','createOrganization','updateOrganization','loadNotes','createNote','updateNote',
    'loadFils','loadMissatges','enviaMissatge','marcaLlegit','creaFilDirecte','carregaMembres',...(roles?['elMeuRol']:[]),
    ...(publications?['appendSectionSubmissionNetworkOnly']:[]),...(pages?['loadMur','loadMultimedia','loadSeccioPage']:[]),...(norms?['estatNormes','acceptaNormes']:[])]){
    const method=adapter[name];adapter[name]=(...args)=>{open();const ticket=epoch;return Promise.resolve().then(()=>{current(ticket);return method(...args);})
      .then(value=>{current(ticket);return value;},error=>{if(ticket!==epoch)throw stale();throw error;});};
  }
  return Object.freeze({adapter:Object.freeze(adapter),privatActiu:true,actualitzaSessio,
    async lligPoliticaAlta(options={}){open();return transport.demanaAuth('policy',{},config(options));},
    async acceptaNormes(version,options={}){if(!norms)return absent();return adapter.acceptaNormes(version,options);},
    inspecta:()=>Object.freeze({epoch,state,userId:user?.id??null,requiresReload:uncertain,actorBinding:bound,sessioCapability:roles})});
}
