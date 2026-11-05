/** Fixed local RPC surface. Session validation and RLS claims share one transaction.
 * No arbitrary table, function, role, tenant or user identifier comes from HTTP.
 */
import { randomUUID } from 'node:crypto';
import { sqlText, sqlJson } from './postgres-node0.mjs';
import { hashSessioNodeZero, contextSqlNodeZero } from './auth-node0.mjs';

const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const LOCAL_FAILURE=Symbol('node0-backend-local-failure');
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{status,[LOCAL_FAILURE]:true});};
const uuid=v=>typeof v==='string'&&UUID.test(v)?v.toLowerCase():fail('invalid_id');
const text=(v,max=1000)=>typeof v==='string'&&v.length<=max&&!v.includes('\0')&&v.isWellFormed()?v:fail('invalid_text');
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max?v:fail('invalid_integer');
const intSql=v=>`${sqlText(String(v))}::integer`;
const bigintSql=v=>`${sqlText(String(v))}::bigint`;
const maybeUuid=v=>v==null?'NULL':`${sqlText(uuid(v))}::uuid`;
const maybeInt=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>v==null?'NULL':bigintSql(integer(v,min,max));
const result=(expression,status=200)=>`SELECT json_build_object('status',${status},'body',${expression});`;
const rows=query=>`coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (${query}) r),'[]'::jsonb)`;
const first=query=>`(SELECT to_jsonb(r) FROM (${query}) r LIMIT 1)`;
const fields=(input,mapping)=>{
  if(!plain(input))fail('invalid_fields');const values=[];
  for(const key of Object.keys(input)){
    if(!Object.hasOwn(mapping,key))fail('unsupported_field');const spec=mapping[key];
    const [column,type,max]=spec;let value=input[key];
    if(type==='text')value=sqlText(text(value,max));
    else if(type==='bool'){if(typeof value!=='boolean')fail('invalid_boolean');value=`${sqlText(value?'true':'false')}::boolean`;}
    else if(type==='uuid')value=maybeUuid(value);
    else if(type==='list'){if(!Array.isArray(value)||value.length>100)value=fail('invalid_list');value=sqlJson(value.map(v=>text(v,200)));}
    else if(type==='url'){
      if(value==null||value==='')value=sqlText('');else{let url;try{url=new URL(text(value,2048));}catch{fail('invalid_image_url');}if(url.protocol!=='https:'||url.username||url.password)fail('invalid_image_url');value=sqlText(url.href);}
    }else fail('unsupported_field');
    values.push([column,value]);
  }
  if(!values.length)fail('empty_fields');return values;
};
const NOTE={folderId:['folder_id','text',120],title:['title','text',1000],subtitle:['subtitle','text',2000],lead:['lead','text',5000],content:['content','text',512000],copyright:['copyright','text',256],categories:['categories','list'],tags:['tags','list'],heroImage:['hero_image','url'],logoImage:['logo_image','url'],logoImageDark:['logo_image_dark','url'],isPublished:['is_published','bool'],publishedSubmissionId:['published_submission_id','uuid']};
const PROFILE={full_name:['full_name','text',120],avatar_url:['avatar_url','url'],visibility:['visibility','text',20],town_name:['town_name','text',300],bio:['bio','text',500],is_public:['is_public','bool'],lema:['lema','text',256],presentacio_html:['presentacio_html','text',20000],hero_url:['hero_url','url'],copyright:['copyright','text',256],icon:['icon','text',64]};
const ORGANIZATION={name:['name','text',120],slug:['slug','text',120],description:['description','text',500],kind:['kind','text',60],parentOrganizationId:['parent_organization_id','uuid'],lema:['lema','text',256],logo_url:['logo_url','url'],visibility:['visibility','text',20],presentacio_html:['presentacio_html','text',20000],hero_url:['hero_url','url'],copyright:['copyright','text',256],town_name:['town_name','text',300]};
const NOTE_COLUMNS='id,folder_id,title,subtitle,lead,content,copyright,categories,tags,hero_image,logo_image,logo_image_dark,is_published,published_submission_id,revision,status,trashed_at,fitxa,origen,created_at,updated_at';
const ORG_COLUMNS='id,tenant_id,slug,name,kind,parent_organization_id,lema,description,visibility,created_at,updated_at,logo_url,hero_url,presentacio_html,copyright,town_name';
const orgJson=alias=>`jsonb_build_object(${ORG_COLUMNS.split(',').map(key=>`${sqlText(key)},${alias}.${key}`).join(',')})`;
const SUBMISSION_COLUMNS='id,tenant_id,owner_user_id,author_org_id,section_id,title,description,payload,created_at,updated_at';
const AUTHORITY_KEYS=new Set(['author_org_id','authorOrgId','author_entity_id','author_id','author_user_id','owner_user_id','ownerUserId','author_agent_id','authorAgentId','isSystem','isAvis','is_pinned','pinned_position','mainHref','slug','article','autor','source','srcDelPort']);

export function sqlContextSessioNodeZero(hash,expectedActor){
  if(typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash))fail('session_required',401);
  if(typeof expectedActor!=='string'||!UUID.test(expectedActor))fail('actor_binding_required',409);
  const expected=sqlText(expectedActor.toLowerCase());
  return `BEGIN;\nDO $node0_context$ DECLARE c jsonb; BEGIN
    c := ${contextSqlNodeZero(hash)};
    IF c IS NULL THEN RAISE EXCEPTION 'session_required' USING ERRCODE='28000'; END IF;
    IF c->'user'->>'id' IS DISTINCT FROM ${expected} THEN RAISE EXCEPTION 'session_actor_changed' USING ERRCODE='N0A01'; END IF;
    PERFORM set_config('request.jwt.claim.sub',c->'user'->>'id',true);
    PERFORM set_config('request.jwt.claim.role','authenticated',true);
    PERFORM set_config('request.jwt.claims',(c->'claims')::text,true);
  END $node0_context$;\nSET LOCAL ROLE authenticated;\n`;
}

export function compilaOperacioNodeZero(action,body,tenantId){
  const tenant=`${sqlText(uuid(tenantId))}::uuid`;
  if(!plain(body))fail('invalid_body');
  // Unknown top-level keys are rejected, including owner_user_id, userId and tenantId.
  const keys={getProfile:[],elMeuRol:[],updateProfile:['updates'],loadNotes:['noteId','cursor','limit'],createNote:['input'],updateNote:['id','updates','expectedRevision'],listMyOrganizations:[],createOrganization:['organization'],updateOrganization:['id','updates'],appendSectionSubmissionNetworkOnly:['submission'],loadSeccioPage:['sectionId','cursor','limit'],loadFils:[],loadMissatges:['filId','before','after','limit'],enviaMissatge:['filId','id','text','tipus','respostaA','metadades'],marcaLlegit:['filId','rebutFinsSeq','llegitFinsSeq'],creaFilDirecte:['altreUsuariId','titol'],carregaMembres:['cerca','limit']};
  if(!Object.hasOwn(keys,action))fail('operation_unavailable',501);
  if(Object.keys(body).some(key=>!keys[action].includes(key)))fail('unexpected_field');
  const noteWhere=`tenant_id=${tenant} AND owner_user_id=(SELECT auth.uid())`;
  if(action==='getProfile')return result(first('SELECT * FROM public.profiles WHERE id=(SELECT auth.uid())'));
  if(action==='elMeuRol')return result("to_jsonb(coalesce((SELECT role FROM public.user_platform_roles WHERE user_id=(SELECT auth.uid()) LIMIT 1),'usuari'))");
  if(action==='updateProfile'){
    const set=fields(body.updates,PROFILE).map(([k,v])=>`${k}=${v}`).join(',');
    return `WITH changed AS (UPDATE public.profiles SET ${set} WHERE id=(SELECT auth.uid()) RETURNING *) SELECT jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM changed) THEN 200 ELSE 404 END,'body',coalesce(${first('SELECT * FROM changed')},jsonb_build_object('error','profile_unavailable')));`;
  }
  if(action==='loadNotes'){
    const limit=body.limit===undefined?100:integer(body.limit,1,200);
    const filter=body.noteId?` AND id=${sqlText(uuid(body.noteId))}::uuid`:body.cursor?` AND id<${sqlText(uuid(body.cursor))}::uuid`:'';
    return result(`jsonb_build_object('rows',${rows(`SELECT ${NOTE_COLUMNS} FROM public.notes WHERE ${noteWhere} AND status='activa'${filter} ORDER BY id DESC LIMIT ${intSql(limit+1)}`)},'limit',${intSql(limit)})`);
  }
  if(action==='createNote'){
    if(!plain(body.input))fail('invalid_fields');const {id,...input}=body.input;
    const values=fields(input,NOTE),noteId=id?uuid(id):randomUUID();
    return `WITH changed AS (INSERT INTO public.notes(id,tenant_id,owner_user_id,${values.map(([k])=>k).join(',')}) VALUES(${sqlText(noteId)}::uuid,${tenant},(SELECT auth.uid()),${values.map(([,v])=>v).join(',')}) RETURNING ${NOTE_COLUMNS}) ${result(first('SELECT * FROM changed'),201)}`;
  }
  if(action==='updateNote'){
    const id=uuid(body.id),revision=integer(body.expectedRevision,0,2147483646),set=fields(body.updates,NOTE).map(([k,v])=>`${k}=${v}`).join(',');
    return `WITH changed AS (UPDATE public.notes SET ${set} WHERE ${noteWhere} AND id=${sqlText(id)}::uuid AND revision=${intSql(revision)} RETURNING ${NOTE_COLUMNS})
      SELECT jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM changed) THEN 200 WHEN EXISTS(SELECT 1 FROM public.notes WHERE ${noteWhere} AND id=${sqlText(id)}::uuid) THEN 409 ELSE 404 END,'body',coalesce(${first('SELECT * FROM changed')},jsonb_build_object('error','note_unavailable_or_revision_conflict')));`;
  }
  if(action==='listMyOrganizations')return result(rows(`SELECT * FROM public.list_my_organizations(${tenant})`));
  if(action==='createOrganization'){
    const org=body.organization;
    if(!plain(org)||Object.keys(org).some(key=>!['name','slug','kind','lema','description','parentOrganizationId','town_name'].includes(key)))fail('invalid_organization');
    const name=text(org.name,120).trim(),slug=text(org.slug,120).trim().toLowerCase(),kind=text(org.kind,60),town=text(org.town_name,300).trim();
    if(name.length<2||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!['company','group'].includes(kind)||!town)fail('invalid_organization');
    const lemma=sqlText(text(org.lema??'',256)),description=sqlText(text(org.description??'',500)),parent=maybeUuid(org.parentOrganizationId);
    // The canonical RPC creates the real creator membership. Town persistence
    // is in the same transaction, so a failed PATCH cannot leave a partial org.
    // An idempotent retry never silently changes an existing organisation's town.
    return `DO $node0_organization$ DECLARE previous_id uuid; previous_town text; created jsonb; BEGIN
      PERFORM pg_advisory_xact_lock(hashtextextended(${sqlText(`node0-org:${tenantId.toLowerCase()}:${slug}`)},0));
      SELECT id,town_name INTO previous_id,previous_town FROM public.organizations WHERE tenant_id=${tenant} AND slug=${sqlText(slug)};
      created:=public.create_organization(${tenant},${sqlText(kind)},${sqlText(name)},${sqlText(slug)},${lemma},${description},${parent});
      IF previous_id IS NOT NULL AND previous_id=(created->>'id')::uuid THEN
        IF previous_town IS DISTINCT FROM ${sqlText(town)} THEN RAISE EXCEPTION 'organization_town_conflict' USING ERRCODE='23505'; END IF;
        SELECT ${orgJson('o')} INTO created FROM public.organizations o WHERE id=previous_id AND tenant_id=${tenant};
      ELSE
        UPDATE public.organizations o SET town_name=${sqlText(town)} WHERE o.id=(created->>'id')::uuid AND o.tenant_id=${tenant} RETURNING ${orgJson('o')} INTO created;
        IF created IS NULL THEN RAISE EXCEPTION 'organization_unavailable' USING ERRCODE='42501'; END IF;
      END IF;
      PERFORM set_config('node0.result',created::text,true);
    END $node0_organization$;
    ${result("current_setting('node0.result')::jsonb",201)}`;
  }
  if(action==='updateOrganization'){
    const set=fields(body.updates,ORGANIZATION).map(([k,v])=>`${k}=${v}`).join(',');
    return `WITH changed AS (UPDATE public.organizations SET ${set} WHERE tenant_id=${tenant} AND id=${sqlText(uuid(body.id))}::uuid RETURNING ${ORG_COLUMNS}) SELECT jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM changed) THEN 200 ELSE 404 END,'body',coalesce(${first('SELECT * FROM changed')},jsonb_build_object('error','organization_unavailable')));`;
  }
  if(action==='appendSectionSubmissionNetworkOnly'){
    const submission=body.submission;
    if(!plain(submission)||Object.keys(submission).some(key=>!['id','sectionId','title','description','payload','actor'].includes(key)))fail('invalid_submission');
    const id=submission.id?uuid(submission.id):randomUUID(),section=text(submission.sectionId,32);
    if(!['mur','mercat','events','multimedia','notes'].includes(section))fail('invalid_section');
    const source=submission.payload??{};
    if(!plain(source)||Buffer.byteLength(JSON.stringify(source))>128*1024)fail('invalid_submission_payload');
    const payload=Object.fromEntries(Object.entries(source).filter(([key])=>!AUTHORITY_KEYS.has(key)));
    if(payload.type==='sistema')delete payload.type;
    if(Object.hasOwn(payload,'origen')){
      if(!plain(payload.origen))delete payload.origen;
      else payload.origen=Object.fromEntries(Object.entries(payload.origen).filter(([key])=>key!=='abast'));
    }
    const title=text(submission.title??payload.title??'',1000),description=text(submission.description??payload.description??payload.summary??'',10000);
    let org='NULL',actorCheck='';
    if(submission.actor!==undefined){
      const actor=submission.actor;
      if(!plain(actor)||Object.keys(actor).some(k=>!['tipus','id'].includes(k))||!['persona','entitat'].includes(actor.tipus))fail('invalid_submission_actor');
      if(actor.tipus==='entitat')org=`${sqlText(uuid(actor.id))}::uuid`;
      else if(actor.id!==undefined){const expected=sqlText(uuid(actor.id));actorCheck=`DO $node0_publisher$ BEGIN IF (SELECT auth.uid())::text IS DISTINCT FROM ${expected} THEN RAISE EXCEPTION 'publisher_mismatch' USING ERRCODE='42501'; END IF; END $node0_publisher$;\n`;}
    }
    // Authoritative columns and payload aliases both derive from the verified
    // SQL context. Canonical RLS, organisation signing and norms triggers run.
    const content=`${sqlJson(payload)}||jsonb_build_object('id',${sqlText(id)},'ownerUserId',(SELECT auth.uid()),'author_org_id',${org},'authorOrgId',${org},'sectionId',${sqlText(section)})`;
    return actorCheck+`WITH changed AS (INSERT INTO public.section_submissions(id,tenant_id,owner_user_id,author_org_id,section_id,title,description,payload)
      VALUES(${sqlText(id)}::uuid,${tenant},(SELECT auth.uid()),${org},${sqlText(section)},${sqlText(title)},${sqlText(description)},${content})
      ON CONFLICT(id) DO UPDATE SET author_org_id=EXCLUDED.author_org_id,section_id=EXCLUDED.section_id,title=EXCLUDED.title,description=EXCLUDED.description,payload=EXCLUDED.payload
      WHERE section_submissions.tenant_id=${tenant} AND section_submissions.owner_user_id=(SELECT auth.uid()) RETURNING ${SUBMISSION_COLUMNS})
      SELECT jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM changed) THEN 201 ELSE 409 END,'body',coalesce(${first('SELECT * FROM changed')},jsonb_build_object('error','publication_conflict')));`;
  }
  if(action==='loadSeccioPage'){
    const section=text(body.sectionId,32),limit=body.limit===undefined?50:integer(body.limit,1,50);
    if(!['mur','mercat','events','multimedia'].includes(section))fail('invalid_section');
    let cursor='';
    if(body.cursor!=null){
      const c=body.cursor;
      if(!plain(c)||Object.keys(c).length!==2||!Object.hasOwn(c,'createdAt')||!Object.hasOwn(c,'id')||typeof c.createdAt!=='string'||c.createdAt.length>64||!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(c.createdAt)||!Number.isFinite(Date.parse(c.createdAt)))fail('invalid_cursor');
      cursor=` AND (created_at,id)<(${sqlText(c.createdAt)}::timestamptz,${sqlText(uuid(c.id))}::uuid)`;
    }
    // Respect the canonical member-only RLS; this action is never public CORS.
    // Bound bytes as well as row count and return an explicit continuation.
    return `WITH candidates AS MATERIALIZED (SELECT ${SUBMISSION_COLUMNS} FROM public.section_submissions WHERE tenant_id=${tenant} AND section_id=${sqlText(section)}${cursor} ORDER BY created_at DESC,id DESC LIMIT ${intSql(limit+1)}),
      sized AS (SELECT candidates.*,row_number() OVER(ORDER BY created_at DESC,id DESC) AS n,sum(octet_length(row_to_json(candidates)::text)+2) OVER(ORDER BY created_at DESC,id DESC ROWS UNBOUNDED PRECEDING) AS bytes FROM candidates),
      chosen AS (SELECT ${SUBMISSION_COLUMNS} FROM sized WHERE n<=${intSql(limit)} AND bytes<=1048576),
      page AS (SELECT coalesce(jsonb_agg(to_jsonb(chosen) ORDER BY created_at DESC,id DESC),'[]'::jsonb) AS items FROM chosen)
      SELECT jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM candidates) AND NOT EXISTS(SELECT 1 FROM chosen) THEN 413 ELSE 200 END,'body',CASE WHEN EXISTS(SELECT 1 FROM candidates) AND NOT EXISTS(SELECT 1 FROM chosen) THEN jsonb_build_object('error','publication_too_large_to_read') ELSE jsonb_build_object('rows',page.items,'complete',(SELECT count(*) FROM candidates)=(SELECT count(*) FROM chosen),'nextCursor',CASE WHEN (SELECT count(*) FROM candidates)>(SELECT count(*) FROM chosen) THEN (SELECT jsonb_build_object('createdAt',created_at,'id',id) FROM chosen ORDER BY created_at,id LIMIT 1) ELSE NULL END) END) FROM page;`;
  }
  if(action==='loadFils')return result(rows(`SELECT * FROM public.xat_fils_meus(${tenant})`));
  if(action==='carregaMembres')return result(rows(`SELECT * FROM public.membres_del_poble(${tenant},${body.cerca==null?'NULL':sqlText(text(body.cerca,200))},${intSql(body.limit===undefined?100:integer(body.limit,1,100))})`));
  if(action==='creaFilDirecte')return result(`to_jsonb(public.crea_fil_directe(${tenant},${sqlText(uuid(body.altreUsuariId))}::uuid,${body.titol==null?'NULL':sqlText(text(body.titol,300))}))`);
  const fil=uuid(body.filId);
  // RPCs own participant/moderation checks. This additional scope guard prevents
  // a valid member of another town using a foreign thread through this Node.
  const scope=`DO $node0_scope$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.xat_fils WHERE id=${sqlText(fil)}::uuid AND tenant_id=${tenant}) THEN RAISE EXCEPTION 'thread_unavailable' USING ERRCODE='42501'; END IF; END $node0_scope$;\n`;
  if(action==='loadMissatges'){
    if(body.before!=null&&body.after!=null)fail('ambiguous_cursor');
    const query=body.after!=null?`public.xat_nous(${sqlText(fil)}::uuid,${maybeInt(body.after)})`:`public.xat_historial(${sqlText(fil)}::uuid,${maybeInt(body.before)},${intSql(body.limit===undefined?50:integer(body.limit,1,100))})`;
    return scope+result(rows(`SELECT * FROM ${query}`));
  }
  if(action==='enviaMissatge'){
    // First phase text messages only; no claimed encrypted delivery or uploads.
    if(body.tipus!==undefined&&body.tipus!=='text')fail('message_type_unavailable',501);
    if(body.metadades!==undefined&&(!plain(body.metadades)||Object.keys(body.metadades).length))fail('message_metadata_unavailable',501);
    return scope+result(rows(`SELECT * FROM public.xat_envia(${sqlText(uuid(body.id))}::uuid,${sqlText(fil)}::uuid,'text',${sqlText(text(body.text,10000))},${maybeUuid(body.respostaA)},'{}'::jsonb)`),201);
  }
  if(action==='marcaLlegit'){
    const received=maybeInt(body.rebutFinsSeq),read=maybeInt(body.llegitFinsSeq);
    const onlyReceived=body.rebutFinsSeq!=null&&(body.llegitFinsSeq==null||body.llegitFinsSeq===0);
    // The 75 canonical migrations do not install xat_marca_rebut. Never turn
    // delivery into a false read acknowledgement through xat_marca fallback.
    if(onlyReceived)fail('delivery_receipt_unavailable',501);
    return scope+result(rows(`SELECT * FROM public.xat_marca(${sqlText(fil)}::uuid,${received},${read})`));
  }
  fail('operation_unavailable',501);
}

export function creaBackendPrivatNodeZero({db,tenantId,origin='https://socdepoble.cat'}={}){
  if(typeof db?.query!=='function')throw new TypeError('node0_backend_database_required');uuid(tenantId);
  return Object.freeze({capabilities:Object.freeze({actorBinding:true,roleRead:true,createOrganization:true,sectionSubmissions:true,paginacioSeccions:true}),async handle(action,{headers={},body={}}={}){
    if(headers.origin!==origin)return {status:403,body:{error:'origin_rejected'}};
    try{
      const hash=hashSessioNodeZero(headers);if(!hash)fail('session_required',401);
      const operation=compilaOperacioNodeZero(action,body,tenantId);
      // This header is an assertion to compare, never a source for owner/claims.
      // A cross-tab cookie change must not silently act as the new person.
      const expected=headers['x-sdp-expected-actor'];
      const response=await db.query(sqlContextSessioNodeZero(hash,expected)+operation+'\nCOMMIT;',{privateValues:true});
      if(!plain(response)||!Number.isInteger(response.status)||response.status<200||response.status>599)fail('invalid_database_response',503);
      return response;
    }catch(error){
      const state=error.sqlState;
      const local=error?.[LOCAL_FAILURE]===true;
      const status=local?error.status:(state==='28000'?401:state==='42501'?403:['23505','N0A01'].includes(state)?409:/^(?:22|23)/.test(state||'')?400:503);
      return {status,body:{error:local?error.message:state==='N0A01'?'session_actor_changed':status===401?'session_required':status===403?'permission_denied':status===409?'conflict':'node0_private_operation_failed'}};
    }
  }});
}
