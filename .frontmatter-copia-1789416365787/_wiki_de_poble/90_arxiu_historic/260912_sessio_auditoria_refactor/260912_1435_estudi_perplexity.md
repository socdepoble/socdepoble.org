Perplexity: Auditoria tècnica del paquet auditoria
Bundle auditat: 260912_1421_BUNDLE_auditoria.md
Àmbit: React SPA + Supabase BaaS, arquitectura Online-First
Evidència disponible: bundle adjunt, amb codi, SQL, Wiki, scripts i tests.
Veredicte
El paquet mostra una correcció conscient de diversos problemes P0 —especialment OAuth PKCE, sessions fantasma, RLS del xat i edició de perfils—, però no el consideraria tancat per a producció sense una ronda addicional de verificacions.
Els riscos principals són:
Migracions SQL potencialment contradictòries i ordre d’aplicació fràgil.
Privacitat de perfils debilitada per una migració posterior.
Actualitzacions de dades amb control d’autorització incomplet en alguns camins.
OAuth amb proteccions correctes en principi, però amb contractes GoTrue i postMessage encara dependents de verificació d’execució.
Realtime incomplet: el canal filtra pel tenantid, però el filtratge pel fil es fa en client.
Cobertura de proves insuficient per als riscos de seguretat i migració.
No hi ha evidència en el bundle que s’haja executat realment npm test, npm run lint, npm run build ni les migracions contra una base de dades neta. Per tant, les conclusions següents són d’anàlisi estàtica.
Troballes prioritàries
P0 — La migració de perfils reobre una lectura global
La migració 202609110600_perfil_avatar_i_permisos.sql conté:
grant select on table public.profiles to authenticated, anon;
i substitueix la política de lectura pròpia per:
create policy profiles_read_own on public.profiles for select to authenticated, anon using (true);
Això permet llegir totes les files de public.profiles, inclosos camps que el frontend no necessàriament hauria de publicar: fullname, visibility, avatarurl, townname, bio, ispublic i qualsevol columna futura exposada per la consulta.
A més, contradiu la migració inicial, que definia lectura pròpia:
using (auth.uid() is not null and id = auth.uid())
Correcció mínima
Eliminar la política global i restaurar la lectura pròpia:
drop policy if exists profiles_read_own on public.profiles; create policy profiles_read_own on public.profiles for select to authenticated using (auth.uid() is not null and id = auth.uid());
Eliminar també l’accés d’anon:
revoke all on table public.profiles from anon; grant select on table public.profiles to authenticated;
Si el directori del poble necessita mostrar noms, no s’ha d’obrir profiles sencera. Cal mantindre la funció o vista específica amb una projecció mínima i condicions explícites de pertinença.
Verificació:
select grantee, privilege_type from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles'; select policyname, roles, cmd, qual from pg_policies where schemaname = 'public' and tablename = 'profiles';
Criteri d’acceptació:
anon no té SELECT sobre profiles.
La política no conté using (true).
Un usuari autenticat no pot llegir el perfil d’un altre usuari mitjançant REST.
Impacte: P0, privacitat i possible incompliment del contracte legal indicat al bundle.
P0 — updateOrganization envia actualitzacions sense whitelisting
El frontend executa:
updateOrganization(id, updates, config)
i el backend envia directament:
body: updates
La política RLS limita qui pot actualitzar, però no substitueix una whitelist de camps. Si qualsevol capa superior passa propietats addicionals, es pot intentar modificar informació que no correspon a l’edició normal: tenantid, slug, kind, createdby, visibility o altres columnes futures.
Correcció mínima
Limitar els camps al backend:
const payload = { name: updates?.name, lema: updates?.lema, description: updates?.description, logourl: updates?.logourl, }; Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });
I mantindre una política SQL que impedisca modificar camps estructurals. La whitelist del frontend no és suficient: ha d’estar al límit de backend.
Verificació:
Intentar actualitzar tenantid, slug, kind i createdby.
Confirmar que són rebutjats o ignorats.
Confirmar que name, lema, description i logourl funcionen per a owner o admin.
P1 — profiles actualitza auth.users i public.profiles de manera no atòmica
updateProfile fa dues escriptures independents:
PUT /auth/v1/user sobre user_metadata.
PATCH /rest/v1/profiles sobre public.profiles.
Si la primera funciona i la segona falla, l’usuari queda amb dades divergents. El codi captura l’error de profiles, mostra un avís i continua si authUpdatedUser existeix.
Això pot produir:
Nom diferent entre Auth i profiles.
Avatar diferent segons la pantalla.
Estat de privacitat divergent.
Sensació de desat correcte quan només s’ha actualitzat una de les dues fonts.
Correcció mínima recomanada
Escollir una única font canònica per als camps de perfil. La correcció mínima, sense redissenyar l’arquitectura, és:
Fer public.profiles la font canònica dels camps de perfil.
Actualitzar auth.users.user_metadata només si és estrictament necessari.
Si es mantenen les dues escriptures, marcar l’operació com a fallida quan la segona no acaba bé i refrescar les dades.
Com a mínim:
if (!profileRow) { throw new Error('El perfil no s’ha pogut sincronitzar completament.'); }
No s’hauria de retornar una resposta aparentment correcta si només ha funcionat Auth.
Verificació:
Forçar un error RLS o de xarxa en el PATCH /profiles.
Comprovar que la UI no informa d’un desat complet.
Comprovar que una recàrrega no recupera valors divergents.
P1 — El directori de perfils no està prou acotat
El bundle descriu que el directori ha de mostrar únicament el nom imprescindible d’altres membres del poble. Però la migració de perfils obri tota la taula i la funció membresdelpoble no és l’únic camí d’accés si profiles queda llegible.
La documentació també reconeix que el directori és una obertura que afecta la privacitat i el consentiment.
Correcció mínima
Mantindre:
profiles privada.
Una funció SECURITY DEFINER o vista segura que retorne únicament:
id
fullname
opcionalment un avatar públic explícit
Només quan:
la persona que consulta està autenticada;
és membre del mateix poble;
el perfil de l’altra persona compleix la política de visibilitat o consentiment.
No exposar:
correu;
data d’alta;
rol;
bio;
townname;
metadades d’Auth;
qualsevol columna no necessària.
OAuth PKCE i relay
Aspectes correctes
El circuit presenta diverses decisions sòlides:
Relay únic amb origen validat per igualtat exacta.
Rebuig de startsWith, includes i expressions regulars.
code retornat com a codi PKCE, no com a token.
code_verifier conservat només en sessionStorage.
Validació d’estat abans del bescanvi.
Neteja de paràmetres OAuth amb history.replaceState.
Rebuig de rutes amb .., fragments o formes sospitoses.
Limitació d’intents amb circuit breaker.
Validació de event.origin i event.source en postMessage.
El relay també declara una llista d’orígens permesos i evita redireccions obertes.
Risc pendent — Contracte GoTrue no verificat
El propi codi assenyala que cal verificar contra la versió real de GoTrue si el bescanvi espera:
grant_type=pkce auth_code=...
Aquesta verificació no està demostrada en el bundle. Si el servidor espera noms diferents, tot el flux falla encara que la criptografia i la validació siguen correctes.
Correcció mínima
Afegir una prova d’integració que execute el flux complet amb:
Login Google.
Retorn al relay.
Publicació del codi a la finestra mare.
Bescanvi del codi.
Rebuig d’un state incorrecte.
Rebuig d’un sdporigin no inclòs a la whitelist.
Rebuig d’un sdppath amb ...
Rebuig d’un code reutilitzat.
No cal afegir cap dependència nova: es pot fer amb el mock existent de Sollutia i proves de navegador ja disponibles en el projecte.
Risc pendent — postMessage accepta dos orígens
El listener permet:
if (e.origin !== relayOrigin && e.origin !== window.location.origin) return;
Això pot ser necessari per al camí de desenvolupament, però amplia el conjunt de missatgers acceptables. La seguretat depén també de:
e.source === emergent
La prova ha de demostrar que:
un altre iframe no pot injectar un codi;
una finestra del mateix origen però diferent de emergent és rebutjada;
un missatge amb type incorrecte és rebutjat;
un missatge sense code ni error no resol la promesa.
RLS i migracions del xat
Correcció P0 ben orientada
La migració del xat identifica correctament el problema circular:
Per inserir el primer participant cal llegir el fil.
Per llegir el fil cal ser participant.
Per tant, ningú pot inserir el primer participant.
La funció private.escreadordelfil i la política:
with check ( private.esparticipant(filid) or private.escreadordelfil(filid) )
resolen el cas del creador inicial. També es corregeix l’eixida de participants amb una política DELETE, que abans no existia tot i que hi havia permisos DML.
Risc P1 — Control del creador i consistència de usuariid
La migració documenta que una versió anterior escrivia un identificador de convidat o slug en lloc de l’UUID d’Auth, provocant 22P02 o errors RLS. El camí actual delega en enviaMissatge, cosa adequada, però cal verificar que totes les entrades passen pel mateix camí.
Correcció mínima
Afegir proves SQL i de backend per garantir:
usuariid = auth.uid() en qualsevol inserció de missatge.
Un usuari no pot enviar missatges en un fil del qual no és participant.
El creador pot inserir el primer participant.
Un segon usuari del mateix poble no pot afegir-se arbitràriament a qualsevol fil.
Un usuari d’un altre poble no pot crear ni consultar fils.
Les lectures només retornen fils on l’usuari participa.
Risc P1 — SECURITY DEFINER i search_path
Les funcions sensibles usen SECURITY DEFINER SET search_path, però cal verificar que el valor és explícit i segur en totes les funcions. En funcions de privilegis elevats, la forma recomanada és:
set search_path = public, pg_temp
o, millor encara, un esquema privat explícit i referències qualificades.
També cal verificar que no hi ha funcions antigues amb la mateixa signatura i permisos heretats.
Verificació:
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid), prosecdef, proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where prosecdef;
Criteri d’acceptació:
Les funcions SECURITY DEFINER sensibles tenen search_path explícit.
PUBLIC i anon no tenen EXECUTE.
Només authenticated pot executar les RPC necessàries.
Realtime
El codi crea un canal per cada fil, però el filtre de Supabase Realtime només inclou el tenantid:
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xatmissatges', filter: `tenantid=eq.${tenantId}`, }, payload => { if (payload.new?.filid === filId) callback(payload.new); });
Això pot ser funcional des del punt de vista de la UI, però no és un filtratge de servidor per filid. El client rep insercions de tots els fils del mateix tenant i després les descarta.
Correcció mínima
Si la versió de Realtime permet el filtre compost, usar-lo. Si només permet un filtre, mantindre el filtratge client però:
verificar que RLS de Realtime no exposa missatges de fils aliens;
evitar confiar en el filtratge client com a frontera de seguretat;
afegir una prova amb dos fils i dos usuaris.
El criteri de seguretat és que un usuari no puga rebre dades d’un fil alié, encara que el seu navegador estiga subscrit al canal.
Càrrega de dades i Online-First
La documentació és coherent amb el mandat Online-First:
Les lectures poden usar dades seed segons el mode configurat.
Les escriptures importants no han de convertir-se en una cua local.
updateNote rebutja explícitament l’actualització sense servidor.
El fallback local no s’ha d’interpretar com a persistència de negoci.
Aquesta frontera és important i no cal transformar-la en Local-First.
Risc P1 — Incoherència entre modes documentats i implementats
El README descriu auto, supabase, hybrid i seed, però la implementació mostrada de normalizeDataMode només admet:
const allowed = ['remote', 'seed', 'local'];
i retorna remote per defecte.
Això és una discrepància verificable entre contracte i implementació. Pot provocar que:
VITE_DATA_MODE=auto no tinga el comportament documentat;
supabase siga ignorat;
hybrid no s’aplique;
les proves i la documentació descriguen un sistema diferent del que executa.
Correcció mínima
Escollir un únic vocabulari. Atés el mandat actual, recomane eliminar modes no suportats del README i deixar clar:
remote: BD remota obligatòria seed: dades de demostració, sense persistència
O implementar explícitament els modes documentats. No mantindre dos contractes diferents.
Verificació:
Crear una taula de proves:
Valor
Resultat esperat
remote
Carrega Supabase i falla si no hi ha configuració
seed
Carrega dades seed
absent
Comportament documentat
auto
Acceptat o rebutjat explícitament
hybrid
Acceptat o rebutjat explícitament
valor desconegut
Error o fallback documentat
Gestió de notes i concurrència
updateNote usa revision en el filtre:
?revision=eq.${expectedRevision}
i considera conflicte qualsevol resposta sense files. És una bona base per a control optimista.
Risc pendent
El frontend ha de demostrar que sempre passa expectedRevision. Si arriba buit, l’actualització no aplica control de concurrència:
const revFilter = expectedRevision ? `&revision=eq.${expectedRevision}` : '';
Això permet sobreescriure una revisió més nova si algun consumidor omet el paràmetre.
Correcció mínima
Fer obligatori expectedRevision:
if (!Number.isInteger(expectedRevision)) { throw new Error('Cal indicar la revisió esperada per actualitzar la nota.'); }
Només permetre una via administrativa separada si realment es necessita actualització sense revisió.
Verificació:
Dos clients carreguen la mateixa nota.
El primer actualitza amb revisió n.
El segon intenta actualitzar també amb n.
El segon ha de rebre conflicte i no modificar la dada.
Dependències i principis del paquet
El paquet declara dependències de React, Supabase, Tiptap, Dexie, DOMPurify, Lucide i altres. No es pot determinar només amb el bundle si totes són necessàries en la construcció final, però hi ha una advertència clara: Dexie i dexie-react-hooks apareixen al paquet mentre la filosofia actual rebutja persistència local de dades de negoci.
Això no és necessàriament un problema si s’utilitzen per a un propòsit estrictament no funcional, però cal demostrar-ho.
Correcció mínima
Executar una auditoria d’ús:
npm ls --depth=0 rg "from ['\"]dexie|from ['\"]dexie-react-hooks" src tests tooling
Eliminar qualsevol dependència que no tinga importació real o ús justificat. No afegir cap dependència nova per resoldre els punts d’aquesta auditoria.
Pla de verificació mínim
1. Integritat del repositori
Executar:
npm ci npm run lint npm test -- --run npm run build npm run porta
Guardar:
sortida completa;
codi d’eixida;
versió de Node;
hash del commit;
hash del bundle auditat.
2. Base de dades neta
Aplicar les migracions en l’ordre documentat:
schema.sql
schema_notes.sql
260908_xat_v2.sql
260908_xat_v2_correccions.sql
260908_xat_v2_membres.sql
260912_admin_panel.sql
202609110600_perfil_avatar_i_permisos.sql
seed.sql
Després verificar:
select tablename from information_schema.tables where table_schema = 'public' order by tablename;
I les RPC:
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname in ( 'creafildirecte', 'xatfilsmeus', 'xatmissatgesdelfil', 'xatmarcallegit', 'membresdelpoble' );
3. Proves de privacitat
Amb dos usuaris i dos pobles:
Usuari A no pot llegir el perfil complet de B.
Usuari A només pot veure el nom mínim de B si comparteixen poble i la política ho permet.
Usuari A no pot llegir notes de B.
Usuari A no pot llegir missatges d’un fil alié.
anon no pot llegir profiles, organizations privades ni dades de xat.
4. Proves d’autorització
Usuari normal no pot executar RPC d’administració.
Membre normal no pot editar una organització.
owner i admin poden editar només els camps permesos.
No es poden canviar tenantid, slug, kind ni propietari mitjançant PATCH.
No es pot crear una organització fora del poble de la sessió.
5. Proves OAuth
Origen autoritzat.
Origen desconegut.
Ruta amb ...
Ruta amb fragment.
state incorrecte.
Codi reutilitzat.
Popup tancat.
COOP amb via storage.
Fallback de redirecció completa.
Codi amb caràcters reservats.
SDP-LOCK
Activar SDP-LOCK per al desplegament si no es resolen aquests punts:
Política profiles_read_own substituïda per using (true).
SELECT concedit a anon sobre profiles.
Absència de proves contra una base de dades neta.
Absència de proves que demostren el contracte real del bescanvi PKCE.
Actualitzacions d’organització sense whitelist de camps.
expectedRevision opcional en actualitzacions de notes.
Funcions SECURITY DEFINER amb search_path no verificat.
Tests, lint o build no executats amb èxit.
Correccions mínimes ordenades
Prioritat
Correcció
Evidència d’acceptació
P0
Tancar lectura global de profiles
anon rebutjat i usuari només veu el propi perfil
P0
Eliminar using (true) en perfils
Política amb condició d’identitat o funció específica
P0
Validar migracions sobre BD neta
Totes les taules, triggers, RPC i RLS presents
P1
Whitelist de camps en updateOrganization
Camps estructurals rebutjats
P1
Fer obligatori expectedRevision
Conflicte reproduïble entre dos clients
P1
Validar SECURITY DEFINER
search_path explícit i permisos mínims
P1
Cobrir OAuth amb proves d’integració
PKCE, state, origins i popup verificats
P1
Cobrir Realtime amb dos fils
No hi ha fuga de missatges entre fils
P2
Alinear DATA_MODE amb README
Modes acceptats i refusats documentats
P2
Auditar dependències supèrflues
npm ls i imports justificats
Conclusió operativa: el bundle té una base tècnica sòlida i documenta bé diversos incidents anteriors, però el canvi de permisos de perfils és una regressió crítica que requereix correcció immediata. Fins que no es tanque eixe punt i no hi haja evidència d’execució de migracions, proves i build, el paquet ha de romandre en estat esborrany i amb SDP-LOCK actiu.
