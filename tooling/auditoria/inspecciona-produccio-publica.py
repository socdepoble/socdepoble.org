#!/usr/bin/env python3
"""R21.6 public GET audit; never invokes RPC, reads .env, or persists bodies.
Public observations cannot certify privileged migration history. Exit2 means
drift/unknown, exit1 incomplete/invalid, never a fabricated parity PASS.
"""
import argparse,base64,hashlib,json,re,subprocess,sys
from collections import deque
from pathlib import Path

WEB='https://socdepoble.org'
MAX_ASSETS=600
MAX_TOTAL=32*1024*1024
MAX_BODY=8*1024*1024
PUBLIC_KEYS=frozenset(['towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil'])
EDGES=('noticies','notifica-xat','compte-apple','notifica-xat-desperta','purga-fitxers','ap-inbox-verifica','iaia')
SHAPE=re.compile(r'["\']([A-Za-z0-9_-]{87})["\']')
DEPENDENCY=re.compile(r'["\'](?:\.?/?(?:assets/)?)?([A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8,16}\.js)["\']')
ASSET=re.compile(r'/assets/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8,16}\.js\Z')
class AuditError(Exception):
    def __init__(self,code):self.code=code
def require(condition,code):
    if not condition:raise AuditError(code)
def digest(value):return hashlib.sha256(value if isinstance(value,bytes) else value.encode()).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def b64(value):return base64.urlsafe_b64decode(value+'='*((4-len(value)%4)%4))
def point(candidate):
    try:
        raw=b64(candidate)
        if len(raw)!=65 or raw[0]!=4 or base64.urlsafe_b64encode(raw).decode().rstrip('=')!=candidate:return False
        x=int.from_bytes(raw[1:33],'big');y=int.from_bytes(raw[33:],'big')
        p=0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
        curve_b=0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b
        return x<p and y<p and (y*y-(x*x*x-3*x+curve_b))%p==0
    except Exception:return False
def bundled_config(text):
    origins=set(re.findall(r'https://[a-z0-9]{20}\.supabase\.co',text))
    require(len(origins)==1,'bundled_backend_origin_unknown')
    tokens=set(re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',text))
    anon=[]
    for token in tokens:
        try:role=json.loads(b64(token.split('.')[1])).get('role')
        except Exception:continue
        require(role in ('anon',None),'bundled_privileged_credential')
        if role=='anon':anon.append(token)
    publishable=set(re.findall(r'sb_publishable_[A-Za-z0-9_-]+',text))
    require(len(anon)+len(publishable)==1,'bundled_public_key_unknown')
    return next(iter(origins)),(anon+list(publishable))[0]

class Transport:
    def __init__(self,fixture=None):self.fixture=fixture;self.backend=None;self.observations=[];self.total=0
    def get(self,url,key=None):
        web=url.startswith(WEB+'/') and (url==WEB+'/' or ASSET.fullmatch(url[len(WEB):]))
        backend=self.backend and url.startswith(self.backend+'/')
        suffix=url[len(self.backend):] if backend else ''
        backend=backend and (suffix=='/rest/v1/' or suffix.startswith('/rest/v1/app_content?') or suffix in ['/rest/v1/'+n+'?select=*&limit=0' for n in ['section_submissions','profiles','notes','note_folders']] or suffix in ['/functions/v1/'+n for n in EDGES])
        require(web or backend,'authority_or_path_not_allowed')
        require(not key or backend,'credential_authority_mismatch')
        if self.fixture is not None:
            response=self.fixture.get(url)
            require(isinstance(response,dict),'fixture_response_missing')
            require(response.get('method','GET')=='GET','fixture_method_not_get')
            status=response.get('status');body=response.get('body','')
            require(isinstance(status,int) and isinstance(body,str),'fixture_response_invalid')
            raw=body.encode()
        else:
            config='url = '+json.dumps(url)+'\n'
            if key:
                config+='header = '+json.dumps('apikey: '+key)+'\n'+'header = '+json.dumps('Authorization: Bearer '+key)+'\n'
            if suffix=='/rest/v1/':config+='header = "Accept: application/openapi+json"\n'
            # -q disables inherited curlrc. GET is explicit, redirects forbidden.
            run=subprocess.run(['/usr/bin/curl','-q','--config','-','--request','GET','--silent','--show-error','--proto','=https','--max-time','25','--max-filesize',str(MAX_BODY),'--write-out','\n%{http_code}'],input=config.encode(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
            require(run.returncode==0,'public_transport_failed')
            try:raw,status=run.stdout.rsplit(b'\n',1);status=int(status)
            except Exception:raise AuditError('public_response_invalid')
        require(100<=status<=599,'public_status_invalid')
        require(len(raw)<=MAX_BODY,'public_body_limit')
        require(not 300<=status<400,'public_redirect_refused')
        self.total+=len(raw);require(self.total<=MAX_TOTAL,'public_total_limit')
        self.observations.append({'service':'web' if web else 'bundled_backend','path':url[len(WEB):] if web else suffix,'method':'GET','status':status,'bytes':len(raw),'sha256':digest(raw)})
        return status,raw

def run_audit(transport,root):
    status,html=transport.get(WEB+'/');require(status==200,'public_index_unavailable')
    scripts=re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)["\']',html.decode('utf8'))
    entries=[value for value in scripts if value.startswith('/assets/index-')]
    require(len(entries)==1 and ASSET.fullmatch(entries[0]),'public_entry_invalid')
    status,raw=transport.get(WEB+entries[0]);require(status==200,'public_entry_unavailable')
    text=raw.decode('utf8');origin,key=bundled_config(text);transport.backend=origin
    assets={};pending=deque([(entries[0],raw)]);names=set();points=set();apparent=set()
    while pending:
        path,cached=pending.popleft()
        if path in assets:continue
        require(len(assets)<MAX_ASSETS,'public_asset_limit')
        if cached is None:
            code,cached=transport.get(WEB+path);require(code==200,'public_asset_unavailable')
        body=cached.decode('utf8');refs=set(DEPENDENCY.findall(body))
        values=set(SHAPE.findall(body));apparent.update(values);points.update(x for x in values if point(x))
        names.update(re.findall(r'VITE_[A-Z0-9_]+',body))
        assets[path]={'bytes':len(cached),'sha256':digest(cached)}
        pending.extend(('/assets/'+name,None) for name in sorted(refs) if '/assets/'+name not in assets)
    schema_status,schema_body=transport.get(origin+'/rest/v1/',key)
    try:schema=json.loads(schema_body)
    except Exception:schema={}
    schema_paths=sorted(name for name in schema.get('paths',{}) if isinstance(name,str) and re.fullmatch(r'/(?:rpc/)?[A-Za-z0-9_]{1,128}',name)) if schema_status==200 and isinstance(schema,dict) else []
    rows=[];complete=False
    for offset in range(0,10000,500):
        route='/rest/v1/app_content?select=tenant_id,key,payload,version,updated_at&order=tenant_id.asc,key.asc&offset='+str(offset)+'&limit=500'
        code,body=transport.get(origin+route,key);require(code==200,'public_content_unavailable')
        data=json.loads(body);require(isinstance(data,list) and len(data)<=500,'public_content_shape')
        rows.extend(data)
        if len(data)<500:complete=True;break
    require(complete,'public_content_pagination_limit')
    summaries=[]
    for row in rows:
        require(isinstance(row,dict) and isinstance(row.get('key'),str),'public_content_row_shape')
        payload=row.get('payload')
        identifier=row['key'] if re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,63}',row['key']) else '<invalid-key>'
        summaries.append({'key':identifier,'keySha256':digest(row['key']),'tenantSha256':digest(str(row.get('tenant_id'))),'version':row.get('version') if isinstance(row.get('version'),int) else None,'payloadType':type(payload).__name__,'items':len(payload) if isinstance(payload,list) else None,'payloadSha256':digest(canonical(payload))})
    relations={}
    for name in ['section_submissions','profiles','notes','note_folders']:
        code,body=transport.get(origin+'/rest/v1/'+name+'?select=*&limit=0',key)
        try:error=json.loads(body)
        except Exception:error={}
        error_code=error.get('code') if isinstance(error,dict) else None
        relations[name]={'status':code,'code':error_code if isinstance(error_code,str) and re.fullmatch(r'[A-Z0-9_]{1,32}',error_code) else None}
    edges={}
    for name in EDGES:
        code,body=transport.get(origin+'/functions/v1/'+name,key)
        try:error=json.loads(body)
        except Exception:error={}
        gateway_code=error.get('code') if isinstance(error,dict) else None
        edges[name]={'status':code,'state':'route_absent' if code==404 and gateway_code=='NOT_FOUND' else 'method_guard_observed_runtime_unknown' if code==405 else 'authentication_or_other_state_unknown'}
    drift=[]
    for name in sorted({row['key'] for row in summaries}-PUBLIC_KEYS):drift.append({'code':'public_catalogue_key_outside_boundary','key':name})
    for name in ['section_submissions','profiles','notes','note_folders']:
        if relations[name]['status']==200:drift.append({'code':'raw_zero_row_select_authorized','relation':name,'rowVisibility':'not_proved'})
    for name,value in edges.items():
        if value['state']=='route_absent':drift.append({'code':'edge_route_absent','function':name})
    if not points:drift.append({'code':'no_p256_vapid_literal_observed','scope':'all referenced hashed JS chunks; runtime injection/obfuscated construction not certified'})
    local=[]
    for file in sorted((root/'supabase/migrations').glob('*.sql')):
        local.append({'file':file.name,'sha256':digest(file.read_bytes()),'remoteAppliedState':'unknown'})
    return {'schema':'sdp.r21.6.public-production.v1','ok':False,'publicCollectionComplete':True,'fullParityCertified':False,'remoteMutations':0,'methods':['GET'],'rawBodiesPersisted':False,'rawKeysPrinted':False,'publicBundle':{'entry':entries[0],'assets':assets,'referencedChunks':len(assets),'publicKeySha256':digest(key),'backendOriginSha256':digest(origin),'literalViteNames':sorted(names),'viteValues':'unknown_unless_explicitly_observed','apparent87CharStrings':len(apparent),'validP256PointLiterals':len(points),'vapidPublicFingerprints':sorted(digest(x)for x in points)},'openapi':{'status':schema_status,'visiblePaths':schema_paths,'scope':'anon metadata only'},'appContent':summaries,'zeroRowRelations':relations,'edges':edges,'drift':drift,'unknown':['privileged_applied_migration_history','authenticated_RPC_runtime','effective_provider_secrets_permissions','physical_delivery'],'localMigrations':local,'nextReadOnlyStep':'psql service=sdp_audit -X -v ON_ERROR_STOP=1 -f tooling/auditoria/audita-servidor-lectura.sql','requests':transport.observations}

class SafeParser(argparse.ArgumentParser):
    def error(self,message):
        # Unknown operator arguments can accidentally contain a credential.
        # Never echo them or a parser-generated message into a shared log.
        sys.stdout.write(json.dumps({'ok':False,'error':'invalid_arguments','rawKeysPrinted':False})+'\n')
        raise SystemExit(1)
def main():
    parser=SafeParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--live',action='store_true');mode.add_argument('--fixture',type=Path)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--out',type=Path)
    args=parser.parse_args()
    try:
        fixture=json.loads(args.fixture.read_text()) if args.fixture else None
        result=run_audit(Transport(fixture),args.root)
        result['collectionMode']='fixture' if args.fixture else 'live'
        result['observationAuthority']='controlled-replay' if args.fixture else 'external-service'
        output=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
        if args.out:args.out.write_text(output)
        else:sys.stdout.write(output)
        return 2  # Public observations alone never certify privileged parity.
    except Exception as error:
        code=error.code if isinstance(error,AuditError) else 'operation_failed'
        sys.stdout.write(json.dumps({'ok':False,'publicCollectionComplete':False,'fullParityCertified':False,'error':code,'rawKeysPrinted':False})+'\n')
        return 1
if __name__=='__main__':sys.exit(main())
