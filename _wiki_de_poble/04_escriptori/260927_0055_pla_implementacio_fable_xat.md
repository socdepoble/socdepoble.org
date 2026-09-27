---
type: document
status: esborrany
description: 'Abast F0 del Xat estil WhatsApp: migracio additiva amb seq i marques, RPC idempotents, adaptador i context amb enviament fiable i paginacio, UI sobre AppGridShell amb especimens i tests.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_46088ffc-8b7e-4175-88ad-150c315da4c5:f175be6c-bd77-4f87-a8f7-31fb4ab1aab7
---
# Xat F0 (Fonament): dades, adaptador, context i UI sobre AppGridShell

**Estat del Pla:** en execució (autoritzat per la Instrucció del torn de la petorreta `260927_0055_prompt_fable_xat.md`, Mode AFK; el text d'este pla no ha passat per cap revisió humana)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_46088ffc-8b7e-4175-88ad-150c315da4c5:f175be6c-bd77-4f87-a8f7-31fb4ab1aab7 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T23:23:51.125Z |
| Modificació | 2026-09-27T02:40:00.000Z |
| Propietari | Claude Fable 5.1 (torn torn_46088ffc) |
| Aprovació humana | implícita per a l'encàrrec (Instrucció del torn 0055); pendent per al text d'este pla |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (`claude-fable-5-1`), mode Ultracode amb subagents de Workflow |
| Tokens consumits | Subagents fins al pla: 6,2 M (mapa v1 perdut perquè el hook bloqueja StructuredOutput: 2,88 M; mapa v2 caigut pel límit setmanal: 1,61 M; mapa v2 complet: 1,71 M). Fil principal: el client no exposa el recompte. Fricció alta: hook bloqueja StructuredOutput, qualsevol Bash no llistat, escriptures a `.agents/` i fora del repositori |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-26T23:23:51.125Z: esborrany creat; contingut i verificació pendents.

2026-09-27 (matinada): el Mestre afig a mà la NOTA URGENT sobre l'alineació de les barres laterals plegades (conservada literalment al principi de Canvis proposats).

2026-09-27T02:40Z: Fable llig les 2.036 línies de l'especificació d'Opus, l'acta marmota 0110, l'informe de vistes 0050 i el mapa de sis lectors (contracte, BD, closca, espècimens, tests, portes), i redacta els canvis, la verificació i els riscos.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

**NOTA URGENT DEL MESTRE PER A FABLE ULTRACODE (Estils UI):**
El Mestre ha revisat el disseny i ha demanat explícitament que tu, Fable, t'encarregues d'unificar els estils de les barres laterals plegades. 
**Requisits de disseny (Armonia visual i alineació):**
1. Tots els botons i icones superiors de les barres (la *sidebar* principal blava, la *sidebar* de control i les *sidebars* internes del *workspace*) han d'estar **perfectament alineats visualment a la mateixa altura**.
2. Quan les barres estan plegades, tots els elements i icones de menú cap avall han de tindre **exactament la mateixa separació vertical** entre ells a totes les columnes, i han d'estar centrats horitzontalment i verticalment.
3. Han de semblar una "taula d'icones" contínua on l'alineació és mil·limètrica. Tot va recte cap amunt, però respectant de manera estricta les mateixes distàncies (el mateix CSS unificat, sense excepcions ni botons aïllats) per no trencar l'harmonia visual de la Pedra Seca.

Si us plau, revisa la classe dels elements agrupats (`gap`, `margin`, `padding` i l'alineació del panell superior) en implementar el Xat i aplicar estos retocs estructurals.

### 1. Context i troballes

- L'especificació d'Opus (`260926_2330_skill_esborrany_xat.md`) és un menú: 484 elements, tots `[ ]`, i 24 decisions `DEC-*` obertes. El seu §3 diu «si no està marcat `[x]` o depén d'una DEC oberta, para i pregunta». La Instrucció del torn del Mestre diu el contrari: «implementa; comença per les dades; UI idèntica a WhatsApp; usa l'AppGridShell». Este pla resol la tensió: s'executa la fase **F0 (Fonament)** del full de ruta d'Opus (UX-F, l. 1868-1874), que és deute del xat actual i requisit de tot el que ve, i es deixen fora els elements que exigixen una decisió que el Mestre no ha pres ni per escrit ni pel context.
- El xat actual: quatre taules (`xat_fils`, `xat_participants`, `xat_missatges`, `xat_lectures`), inserció directa a la taula sense identificador de client (`src/data/supabase/xat.js:66-70`), historial tallat a 50 sense cursor (`260920_0600_xat_limit_correccio.sql:39`), no llegits calculats però no pintats (`XatContext.jsx:122`), filtres que no filtren (`XatSection.jsx:225-228`), menú i capçalera que prometen accions mortes (l. 453-479), botons de trucada inactius, `<input>` en lloc de `<textarea>`, tot el CSS a `@layer legacy` amb radis i mides a mà (`modules.css:2183-2640`), disposició pròpia fora d'AppGridShell, i dependència creuada de `useNotesData().workspaceKey` (`XatSection.jsx:20-22`).
- Realtime: `xat_missatges` no és a la publicació; el client subscriu `postgres_changes` i no rep res mai. Cap migració usa `realtime.send`. La porta `tractor-rls.mjs` R1 acusaria de «taula fantasma» qualsevol política sobre `realtime.messages` (l'esquema `realtime` no està exempt, només `storage`).
- Contracte: `src/data/contracte.js` és `SDP-LOCK`; la porta E2 (`tractor-enxufe.mjs:116-150`) obliga a tindre cada nom exportat pel port també al contracte, així que **afegir una capacitat nova sempre toca contracte.js**. El port només fixa noms i que siguen funcions: ampliar la signatura d'un mètode existent és compatible i no toca el contracte.
- Mode seed: `xat.js` ignora `runtimeDataMode`; `APP_SEED` no té xat; el prefix `mock-fil-` de `XatContext.jsx:227,438` és un residu sense generador. Sense Supabase local (l'ESTAT diu «PostgreSQL/staging absents») el xat no es pot vore al navegador amb dades.
- Closca: Notes munta `UniversalWorkspace`, que crida `AppGridShell` i pinta dos `AppGridColumn` per columna (fila 1 fosca amb títol, fila 2 intensa amb lupa i CREAR). En mode `estret` (<720 px) `AppGridShell.jsx:100-102` fixa `panellObert = null` i es veu el detall abans que la llista (confirma UX-A05). El CSS de secció ha de viure a `src/css/modules.css` (la porta de vocabulari V1 només reconeix els fulls canònics de `src/css/` i V3 prohibix `.css` sota `src/sections`).
- Portes que mosseguen el codi nou: cap `style=`, cap hex, cap `font-size` en px menor de 16, controls de 44 px, tokens només semàntics i declarats només a `tokens.css`, classes usades han d'existir al CSS canònic, paritat i18n en cinc llengües (`ca, es, en, eu, gl`), `eol-last`, zero avisos d'ESLint (`--max-warnings=0`), `react-hooks/exhaustive-deps`. El hook només deixa executar `npx vitest run <fitxers>`, `node --test tests/*.test.mjs`, `npm run porta:enxufe|rls|design-guard|olivera|documents|plantilles` i lectures de git. Ni `lint`, ni `tancament.mjs`, ni escriptures a `.agents/` o `package.json` (executor amb lease, fora de l'abast d'este agent).

### 2. Decisions preses per a poder executar (supòsits explícits, revocables pel Mestre)

- **DEC-01 = A.** «Idèntic a WhatsApp» en disposició, gestos i noms; identitat visual Pedra Seca (blau acció, taronja marca), cap verd, logotip ni icona de WhatsApp. Ho fixa la Instrucció del torn («idèntica a WhatsApp») més UX-A02 (risc de marca).
- **DEC-02 = A.** El xat es munta sobre `AppGridShell` (ordre literal del Mestre) amb els `AppGridColumn` que ja usa el Workspace: rail esquerre plegat per defecte (com la barra estreta de WhatsApp Web), llista amb cerca i píndoles al centre, conversa a la dreta. No s'usa `UniversalWorkspace` perquè el seu model d'ítems i les regles de `tractor-fitxa-gestor` (F4/F8: sis elements i pressupost vertical de 96 px) no admeten la fila de conversa de WhatsApp (nom, hora, previsualització i comptador).
- **DEC-03 = NO en este torn.** `contracte.js` no es toca. Els 8 mètodes del xat continuen al nucli i **amplien la signatura de manera compatible** (un segon paràmetre que admet cadena o objecte, opcions dins de `config`). Cap capacitat nova. El criteri 6 d'ARQ-L03 («un backend sense xat arranca») queda pendent de l'ordre expressa del Mestre.
- **DEC-04 = A.** Marques per número d'ordre (`seq`) a `xat_participants`; `xat_lectures` es conserva en convivència (les RPC noves l'escriuen també) i les seues polítiques es tanquen amb `es_participant` (hui qualsevol autenticat pot inserir lectures a fils aliens).
- **DEC-14.** WCAG 2.2 AA general; objectius tàctils de 44 px (`--sdp-touch`) i cap estat només per color.
- **ARQ-A02 amb UUID v4**, no v7: l'ordre el posa el servidor amb `seq`; l'identificador de client només cal per a la idempotència. S'usa `generateUUID()` de `runtime.js` (ja existent, `crypto.randomUUID`), sense dependència ni funció nova, i el nom del camp és `id` (la llei L3 de persistència vigila `messageId` amb `Date.now()`).
- **ARQ-J04 no s'aplica** (canviar la clau forana de l'autor a `set null` és l'únic canvi no additiu del capítol i la frontera de confiança §2 exigix ordre expressa). Queda com a risc documentat: la purga d'una baixa continua esborrant els missatges propis de les converses dels altres.
- **Realtime (ARQ-F01) a mitges, honestament.** La migració crea el disparador que emet `realtime.send` al canal privat `xat:f:<fil_id>` (embolicat en `exception when others` perquè cap enviament falle per Realtime). Les polítiques sobre `realtime.messages` (ARQ-D02) **no** entren al repositori fins que algú amb lease afegisca l'esquema `realtime` a l'exempció R1 de `tractor-rls.mjs`; el SQL exacte s'adjunta a l'auditoria. El client subscriu el canal privat i, si el servidor el rebutja, continua amb el sondeig que ja existix. El `postgres_changes` que mai rebia res es retira.
- **Mode seed del xat.** Com fan `content.js` i `notes.js`, `xat.js` delega a un magatzem local en memòria (`src/data/localXat.js` + `src/data/xatSeed.js`) quan `runtimeDataMode !== 'remote'`. És l'única manera de vore i provar el xat al navegador sense Supabase i substituïx el residu `mock-fil-`.
- **Nota del Mestre (barres plegades):** és un redisseny ordenat explícitament; s'executa com a tall propi (§4.F) i es verifica a Notes, Xat i Control amb captures.

### 3. Preguntes obertes per al Mestre

1. DEC-03: autoritzes moure els 8 mètodes del xat de `CONTRACTE_NUCLI` a `CAPACITATS.xat` (i què fem amb `appendChatMessages`)? Sense això cap WordPress ni node local pot arrancar sense xat.
2. ARQ-J04: autoritzes l'únic canvi no additiu (autor dels missatges `on delete set null` i làpida abans de la purga)? Sense això el criteri 5 d'acceptació de F0 no es pot complir.
3. Realtime: qui afig l'exempció de l'esquema `realtime` a `tooling/gates/tractor-rls.mjs` (zona amb lease) perquè les polítiques d'ARQ-D02 puguen entrar?
4. Fila de conversa: 72 px (proporció de WhatsApp, token nou `--sdp-xat-fila-mida`) és el valor triat ací; si preferixes 86 (Notes) o 96 (Llei de la Fitxa) és un canvi d'un token.
5. La barra mòbil flotant de l'app dins d'una conversa oberta (UX-A05 diu que s'amaga, com WhatsApp): no es toca en este torn perquè és closca global; ho confirmes per a F1?
6. `xat_lectures`: es retira en F1 després de la convivència, o es conserva com a registre?

### 4. Canvis proposats per fitxer

Cada tall té propietari únic de fitxers per a poder treballar en paral·lel sense trepitjar-se. Els contractes entre talls (adaptador ↔ context ↔ UI) són els d'este apartat i no es negocien sobre la marxa.

#### 4.A · Base de dades (propietari: tall «bd»)

**[NEW] `supabase/migrations/260927_0200_xat_f0_fonament.sql`** (additiva, idempotent, revisada i NO aplicada; capçalera i transacció amb el patró de `260926_1500_identitat_perfil_f1.sql`: `begin; set local lock_timeout = '5s'; set local statement_timeout = '120s'; … notify pgrst, 'reload schema'; commit;`).

1. `xat_fils`: `tipus text not null default 'directe' check (…)`, `ultim_seq bigint not null default 0`, `descripcio`, `imatge_url`, `permisos jsonb default '{}'`, `comunitat_id`, `org_id` (ARQ-C01). Constraint `char_length(titol) <= 100 not valid` i `validate constraint`.
2. `xat_participants`: `rol`, `eixit_al`, `visible_des_de_seq`, `visible_fins_seq`, `llegit_fins_seq`, `rebut_fins_seq`, `buidat_fins_seq`, `silenciat_fins_al`, `arxivat_al`, `fixat_al`, `preferit_al`, `no_llegit_manual`, `avisos`, `etiqueta`, `com_org_id` (ARQ-C02) i índex `(usuari_id, fil_id)`.
3. `xat_missatges`: `alter column text drop not null`; `seq bigint`, `tipus`, `resposta_a`, `cadena_arrel`, `reenviat`, `reenviaments`, `editat_al`, `esborrat_al`, `esborrat_per`, `caduca_al`, `metadades`, `versio_xifrat` (ARQ-C03); constraint `char_length(text) <= 4096 not valid` + validate; **backfill** de `seq` amb `row_number() over (partition by fil_id order by creat_al, id)`; `seq set not null`; índex únic `(fil_id, seq)`; `xat_fils.ultim_seq = max(seq)`; backfill de `llegit_fins_seq` des de `xat_lectures` (màxim `seq` amb `creat_al <= ultim_llegit_al`); índex parcial de caducitat.
4. Disparador `private.xat_assigna_seq()` BEFORE INSERT (assigna `seq`, `creat_al`, `caduca_al`, actualitza `ultim_seq` i `actualitzat_al` dins de la mateixa transacció); es retira `on_nou_missatge` (AFTER) perquè queda cobert. El disparador de límit de freqüència (`trg_rate_limit_xat`) es conserva.
5. `revoke insert on public.xat_missatges from authenticated` i `drop policy xat_missatges_insercio` (ARQ-A05: totes les escriptures per RPC).
6. `private.es_participant` passa a exigir membre actiu (`visible_fins_seq is null`); noves `private.seq_visible(fil, seq)` i `private.es_admin_del_fil(fil)`; nova política de lectura de `xat_missatges` amb `seq_visible` i `caduca_al` (ARQ-D01). Totes les funcions `security definer set search_path = ''` a la capçalera, amb `revoke execute … from public, anon; grant … to authenticated`.
7. `xat_lectures`: les tres polítiques afigen `private.es_participant(fil_id)` (forat actual).
8. RPC noves: `xat_envia(p_id uuid, p_fil_id uuid, p_tipus text, p_text text, p_resposta_a uuid, p_metadades jsonb) returns table (id, seq, creat_al)` idempotent (`insert … on conflict (id) do nothing`; si ja existia i és meu el torna; si és d'una altra persona, `SDP-XAT-008`; comprova membre actiu `SDP-XAT-006`, text buit o > 4096 `SDP-XAT-007`, tipus no permés al client `SDP-XAT-010`); `xat_historial(p_fil_id, p_abans_de_seq bigint, p_limit int)` (seq < cursor, 50 per defecte, màxim 100, `SDP-XAT-009` si límit invàlid; exclou `xat_amagats` quan existisca: en F0 no existix, no s'hi fa referència); `xat_nous(p_fil_id, p_despres_de_seq)`; `xat_marca(p_fil_id, p_rebut_fins bigint, p_llegit_fins bigint) returns table (rebut_fins_seq, llegit_fins_seq)` amb `greatest()` (una marca no retrocedix; `null` = fins a `ultim_seq`) i escriptura de convivència a `xat_lectures`; `xat_fils_meus(p_tenant_id)` **v2** (`drop function` previ perquè canvia el tipus de retorn): `id, tipus, titol, imatge_url, actualitzat_al, altres_noms, ultim_text, ultim_al, ultim_autor_id, ultim_seq, llegit_fins_seq, rebut_fins_seq, llegit_pels_altres_fins_seq` (mínim entre els altres membres actius), `no_llegits = greatest(0, ultim_seq - greatest(llegit_fins_seq, buidat_fins_seq))`, `arxivat_al, fixat_al, silenciat_fins_al, preferit_al, no_llegit_manual`. `xat_missatges_del_fil` i `xat_marca_llegit` es conserven (compatibilitat); `xat_marca_llegit` també puja `llegit_fins_seq` a `ultim_seq`.
9. Realtime: `private.xat_avisa_nous()` AFTER INSERT → `perform realtime.send(jsonb_build_object('filId', new.fil_id, 'seq', new.seq), 'nous', 'xat:f:' || new.fil_id::text, true)` dins de `begin … exception when others then null; end`.
10. Codis nous documentats a la capçalera: `SDP-XAT-006` (no eres membre actiu), `007` (missatge buit o massa llarg), `008` (identificador d'una altra persona), `009` (cursor o límit invàlid), `010` (tipus de missatge reservat al servidor).

**[MODIFY] `supabase/README.md`**: afegir la migració al llistat i una nota de l'ordre d'aplicació.

**[NEW] `tests/xat_f0_migracio.test.mjs`** (`node --test`): llig la migració i comprova invariants de text: cap `using (true)`, tota funció `security definer` porta `set search_path`, cada `create or replace function public.*` té el seu `revoke … from public, anon`, cap `grant insert` sobre `xat_missatges`, els cinc codis nous apareixen, el README la llista.

#### 4.B · Capa de dades (propietari: tall «dades»)

**[MODIFY] `src/data/supabase/xat.js`** (noms del nucli intactes, signatures ampliades de manera compatible):

- `loadFils(config)` → `Conversa[]`: `{ id, tipus, titol, altresNoms, imatgeUrl, actualitzatAl, ultimText, ultimAl, ultimAutorId, ultimSeq, llegitFinsSeq, rebutFinsSeq, llegitPelsAltresFinsSeq, noLlegits, arxivatAl, fixatAl, silenciatFinsAl, preferitAl, noLlegitManual }` (RPC `xat_fils_meus`).
- `loadMissatges(filId, config)` → `Missatge[]` ordenats per `seq` ascendent; opcions dins de `config`: `abansDeSeq` (→ RPC `xat_historial`), `despresDeSeq` (→ `xat_nous`), `limit` (per defecte 50, màxim 100). Sense opcions: `xat_historial` sense cursor (els 50 últims). `Missatge = { id, filId, seq, usuariId, autorNom, text, tipus, respostaA, editatAl, esborratAl, metadades, esIA, creatAl }`.
- `enviaMissatge(filId, cos, config)` → `Missatge`: `cos` pot ser una cadena (compatibilitat amb `content.js:48`) o `{ id, text, tipus = 'text', respostaA = null, metadades = {} }`; si no ve `id` es genera amb `generateUUID()`; crida RPC `xat_envia` (ja no `insert` directe) i torna el missatge amb `seq` i `creatAl` del servidor.
- `marcaLlegit(filId, config)` → `{ llegitFinsSeq, rebutFinsSeq }` via RPC `xat_marca` amb `config.llegitFinsSeq` i `config.rebutFinsSeq` (sense ells: fins a l'últim).
- `carregaMembres(text, config)`: passa `p_cerca` al servidor (ja no `ilike` al client, XAT-A06) i **llança** l'error en lloc d'empassar-se'l (la UI ja pinta `errorMembres`).
- `subscribeToXat(filId, callback, config)`: canal `xat:f:<filId>` en mode `broadcast` privat (`config: { private: true }`), esdeveniment `nous` → `callback(null, { tipus: 'nous', filId, seq })`; error de subscripció → `callback(error, null)`. `unsubscribeFromXat` igual.
- Errors: `throw` d'un `Error` amb `message` = text del servidor quan comença per `SDP-XAT-` (hui es perd perquè `handleError` no torna `message`), `code` = `SDP-XAT-NNN` i `retriable` (`true` per a xarxa, temps d'espera o `AbortError`; `false` per a codis SDP).
- `comprovaSenyal`/`ambSenyal` es conserven a totes les crides (el test `xat.test.js:25-30` ho exigix).
- Mode seed: si `getResolvedConfig(config).runtimeDataMode !== 'remote'`, cada funció delega a `localXat`.

**[NEW] `src/data/xatSeed.js`**: tres converses de mostra del poble pilot (dos directes i una amb títol) i uns 40 missatges amb `seq`, hores repartides en tres dies (per als separadors) i un missatge del sistema, un d'esborrat i un de la IAIA. **[NEW] `src/data/localXat.js`**: magatzem en memòria (singleton de mòdul) amb la mateixa API que l'adaptador remot: assigna `seq`, respecta la idempotència per `id`, pagina, marca, cerca membres, i `subscribeToXat` torna `{ subscription: null, error: null }`. L'usuari actual és `getCurrentUser()?.id || getDefaultUserId()`.

**[MODIFY] `src/data/supabase/storage.js`**: constant amb nom `MIDA_MAX_PRIVADA = 26214400` (25 MiB) en lloc del literal `25242880` (ARQ-G07); `MIDA_MAX_PUBLICA = 5242880`.

**[MODIFY] `src/data/supabase/xat.test.js`**: `enviaMissatge` passa a esperar `client.rpc('xat_envia', …)` amb `p_id`; casos nous per a cursor, `xat_marca`, error `SDP-XAT-007` conservat, `retriable`, i mode seed.

#### 4.C · Estat (propietari: tall «context»)

**[MODIFY] `src/sections/xat/XatContext.jsx`** i **[NEW] `src/sections/xat/missatges.js`** (funcions pures, provades a banda: fusió per `seq`, derivació d'estat, espera exponencial amb component aleatori, càlcul de no llegits).

Valor de `useXat()` (contracte amb la UI):

- `status`, `avis`, `scopeKey` (la clau d'àmbit que hui és privada; substituïx `useNotesData().workspaceKey`, ARQ-H01), `filActiu`, `obriFil(filId|null)`, `creaFil`, `cercaMembres`, `recarrega` (com ara).
- `chatThreads: Fil[]` = `{ id, tipus, title, name, avatar_url, altresNoms, ultimText, ultimAl (ISO), ultimSeq, llegitFinsSeq, llegitPelsAltresFinsSeq, noLlegits, arxivat, fixat, silenciat, preferit, searchText }`. La UI formata les hores amb el `locale` de `useUIState()` (XAT-P11); el context ja no formata.
- `totalNoLlegits: number` (suma de `noLlegits` de les converses no silenciades ni arxivades).
- `getThreadMessages(filId)` → `Missatge[]` ordenats per `seq` i, al final, els pendents i fallits: `{ id, threadId, seq, usuariId, text, tipus, sender: 'me'|'other', author, is_ai, creatAl, respostaA, esborrat, metadades, estatEnviament: 'pendent'|'enviat'|'llegit'|'error', error }`. `llegit` = propi amb `seq <= fil.llegitPelsAltresFinsSeq` (XAT-C04); `enviat` = el servidor ha tornat `seq` (XAT-C02); `pendent` (XAT-C01); `error` amb el text del servidor (XAT-C10).
- `hiHaMesAntics(filId)`, `carregantAntics(filId)`, `carregaMesAntics(filId)` (XAT-A23: `loadMissatges` amb `abansDeSeq` = `seq` mínim carregat; `hiHaMes` = la pàgina ha vingut plena).
- `sendChatMessage(fil, text)`: crea `id` amb `generateUUID()`, pinta la bombolla `pendent` abans de la xarxa (llei L4 i ARQ-H02), crida `enviaMissatge(filId, { id, text })`; en èxit substituïx la bombolla pel missatge del servidor; en error **retriable** reintenta sola tres vegades amb espera 1 s, 2 s, 4 s més component aleatori (ARQ-H03), sempre amb el mateix `id` (XAT-A25); si s'esgoten o l'error no és retriable, la bombolla passa a `error` i es queda (XAT-B25). No llança: torna `[]` en fallar. `reintenta(missatgeId)` i `descartaFallit(missatgeId)`.
- `marcaVist(filId, seq)`: la UI ho crida quan una bombolla entra en pantalla amb la pestanya visible (XAT-C08); el context agrupa les crides (una cada 2 s per conversa, mai cap arrere) i actualitza `llegitFinsSeq` i `noLlegits` de la conversa en local abans de confirmar.
- Temps real només avisa (ARQ-A06): en rebre `{ tipus: 'nous', seq }` es demanen els missatges amb `loadMissatges(filId, { despresDeSeq: seqMaxim })`; el sondeig continua com a xarxa de seguretat (25 s llista; conversa oberta 5 s sense canal, 30 s amb canal viu) i en tornar la pestanya (`visibilitychange`) o la xarxa (`online`) es demanen els nous.
- Avís dins de l'app (XAT-J01): quan arriba un missatge d'una altra persona i la ruta actual no comença per `/xat`, `showToast` amb el nom de l'autor (sense el text). Si el proveïdor de notificacions o el router no estan disponibles per damunt de `XatProvider` a `App.jsx:446`, es documenta i s'omet (no es reordenen proveïdors en este torn).
- Es retira el residu `mock-fil-` (el mode seed viu ara a la capa de dades).

**[MODIFY] `src/sections/xat/XatContext.test.jsx`**: es conserven els set casos actuals (adaptats a `chatThreads` sense `lastMessageTime`) i s'afigen: idempotència del `id` en reintent, pendent → enviat → llegit, error no retriable sense reintent, retriable amb tres reintents (temporitzadors falsos), paginació per `seq`, `marcaVist` agrupat i monòton, `totalNoLlegits`, `scopeKey` exposada.

#### 4.D · Interfície (propietari: tall «ui»)

**[MODIFY] `src/sections/xat/XatSection.jsx`** i **[NEW] `src/sections/xat/components/`**: `FilaConversa.jsx`, `FilaPersona.jsx`, `LlistaConverses.jsx`, `CapcaleraConversa.jsx`, `Bombolla.jsx`, `MarquesEstat.jsx`, `PastillaNoLlegits.jsx`, `SeparadorDia.jsx`, `Compositor.jsx`, `PanellInicialMobil.jsx`; **[NEW] `src/sections/xat/temps.js`** (etiquetes «ara», «ahir», dia de la setmana, data, amb `Intl` i el `locale` de la llengua) i **[NEW] `src/sections/xat/enllacos.js`** (troba URL http/https, torna segments text/enllaç amb `host` i `sospitos` si el domini porta `xn--`; cap `innerHTML`).

- Closca (DEC-02): `AppGridShell` amb `className="sdp-workspace sdp-xat"`, `leftCollapsed` per defecte `true` (rail com WhatsApp Web) i recordat amb `getVal/setVal('sdp-xat-rail')` de `src/config/storage.js`. Cada columna: `<aside className="sdp-workspace-column">` amb dos `AppGridColumn` (fila 1 `esDark` amb títol i icona; fila 2 `esDark="intens"`) i el cos, com fa `UniversalWorkspace.jsx:366-434` i `669-788`.
- Rail esquerre: títol «Xat»; entrades «Converses» (activa) i «Control del xat» (`/control-xat`, roda). Plegat: `AppGridColumn variant="collapsed"` amb les mateixes icones.
- Columna central: títol «Converses»; fila 2 amb la lupa (obri la fila de cerca) a l'esquerra i el botó primari «Conversa nova» a la dreta (`aria-label="Nova conversa"`: `App.test.jsx:76` en depén). Davall: fila de cerca (quan està oberta), píndoles fixes **Tot · No llegits · Preferits · Grups** que filtren de veres (XAT-A17: no llegits = `noLlegits > 0 || noLlegitManual`; grups = `tipus === 'grup'`; preferits = `preferit`), i `<ul className="sdp-xat-llista">` de `FilaConversa` (botó de 72 px: avatar de 48 px, nom, hora a la dreta, previsualització d'una línia amb l'autor si és grup, `PastillaNoLlegits` amb el número i text accessible «N missatges no llegits»; mai només un punt de color). Amb «Conversa nova» actiu, la llista mostra la gent del poble (`FilaPersona`) amb cerca al servidor i un botó per a tornar.
- Columna dreta: sense conversa, l'estat buit actual (`TextSection 'anima'`). Amb conversa: `CapcaleraConversa` (fletxa d'arrere només en mode `estret`, avatar, nom, línia secundària amb els noms dels altres membres: res que no funcione; **cap botó de trucada**, XAT-M01; menú `⋯` només amb «Seleccionar missatges», UX-D03), `<ol className="sdp-xat-missatges" aria-live="polite">` amb `SeparadorDia`, botó «Carrega'n més» a dalt (XAT-P13) i càrrega automàtica per `IntersectionObserver` en arribar amunt, `Bombolla` (pròpia a la dreta amb `--sdp-accio-subtil`, aliena a l'esquerra amb `--sdp-fons-elevat`, hora i `MarquesEstat` dins a baix a la dreta; nom de l'autor escrit en grups; variant `sistema` centrada amb text d'i18n a partir de `metadades.clau`; variant `esborrat` en cursiva «S'ha esborrat este missatge»; variant `error` amb icona d'avís, text «No s'ha enviat» i botons «Torna-ho a provar» i «Descarta»), menú de bombolla amb «Copia el text» (XAT-B12, `navigator.clipboard`), enllaços amb `rel="noopener noreferrer"` i avís de domini enganyós (XAT-B05). `marcaVist` es crida des d'un `IntersectionObserver` sobre les bombolles alienes quan `document.visibilityState === 'visible'`.
- `Compositor`: `<textarea>` que creix fins a 6 línies (XAT-B01, UX-A08); a l'escriptori Retorn envia i Maj+Retorn fa salt de línia; en mode `estret` Retorn fa salt i s'envia amb el botó; botó «Envia» de 44 px a la dreta, desactivat sense text; límit de 4.096 caràcters amb comptador visible a partir de 3.900 (XAT-B03). Cap botó d'adjuntar ni de micròfon (són F1: la interfície no promet el que no fa).
- Mode de selecció i Retall cap a Notes: es conserven tal com són (`useNotesData().creaNota`), amb els mateixos textos que els tests exigixen («Seleccionar missatges», «Enviar al Bloc de Notes»).
- Mòbil (UX-A05, UX-C04, UX-D08): `PanellInicialMobil` dins de la columna dreta usa `useAppGrid()`: si `mida === 'estret'` i no hi ha conversa, `setPanellObert('middle')`; en obrir-ne una, `tancaPanells()`; la fletxa d'arrere navega a `/xat`. Sense tocar `AppGridShell.jsx`.
- Títol de la pestanya (XAT-J02): `useSEO({ title: totalNoLlegits ? \`(${totalNoLlegits}) Xat\` : 'Xat' })`; res de `document.title` a mà.
- Configuració de l'espai de treball (NOU REQUISIT MESTRE): S'ha d'afegir l'opció per triar l'amplària de les columnes (Compacta, Per defecte, Ampla) dins de «Control del xat» (exactament la mateixa funcionalitat/modal i lògica d'ajust de les columnes del `UniversalWorkspace`), perquè l'usuari puga donar més espai al xat si ho desitja des d'un iPad o pantalla similar.
- `XatSection` usa `scopeKey` de `useXat()` com a `key` (ARQ-H01) i deixa `useNotesData()` només per a `creaNota`.
- Tots els textos per `t()` amb claus `section.xat.*` (XAT-P10).

**[MODIFY] `src/css/modules.css`**: el bloc del xat de `@layer legacy` (l. 2183-2640) es substituïx per un bloc nou dins de `@layer components` amb classes `sdp-xat-*`: només tokens (`--sdp-radi-m` per a les bombolles, `--sdp-radi-pastilla`, `--sdp-touch` per a tot control, `--sdp-text-meta` per a hores i marques, `--sdp-alt-accio` per a barres), fons del mapa amb la variant `:host([data-theme="dark"])`, un sol punt de tall delegat a `data-layout` de la closca, sense `!important`, i es retiren les regles `.xat-*` mortes i el `.search-bar-basic` duplicat del xat. Les classes `.chat-*` de l'espècimen (l. 2111-2161) es retiren quan l'espècimen passe a les classes noves.

**[MODIFY] `src/css/tokens.css`**: dos tokens de mida al bloc `:root, :host, .sdp-root`: `--sdp-xat-fila-mida: 72px` i `--sdp-xat-bombolla-max: 75%`. Cap color nou.

**[MODIFY] `src/config/i18n.js`**: claus `section.xat.*` noves en **les cinc llengües** (paritat exigida per la llei 7 de `tractor-pedra-seca`): filtres, estats buits, capçalera, compositor, marques d'estat, errors, menús, sistema, «Nova conversa», «Carrega'n més», etc. Es reutilitzen `searchPlaceholder`, `composePlaceholder`, `send`, `selectConversation`, `options`.

**[MODIFY] `src/components/PedraSeca/atoms/Avatar.jsx`** i **`src/css/sdp.css`**: prop opcional `llavor` (l'identificador de la persona) que afig `sdp-avatar--to-N` (N d'1 a 6, derivat de l'identificador i no del nom, PER-B03) amb sis parelles de tokens semàntics ja existents (`info`, `exit`, `avis`, `error`, `accio-subtil`/`accio-text`, `accent-subtil`/`accent-text`); prop opcional `alt` per a poder passar `alt=""` quan la foto va al costat del nom (PER-B04). Sense `llavor` ni `alt` el comportament és idèntic a l'actual (Llei del Píxel fora del xat).

**[MODIFY] `src/sections/xat/XatSection.test.jsx`**: casos actuals reescrits sobre la UI nova amb `getByRole` i `aria-label` (no per índex de `.xat-header-btn`), més: píndoles que filtren, comptador de no llegits pintat, compositor Retorn/Maj+Retorn, bombolla en error amb «Torna-ho a provar», enllaç segur, títol amb comptador (mock d'`useUIState` amb `manageDocumentHead: true`), mòbil llista primer.

#### 4.E · Espècimens (propietari: tall «especimens», després de 4.D)

**[MODIFY] `src/sections/disseny/cataleg/detalls/EspecimenXat.jsx`**: mostra els components reals de `src/sections/xat/components/` (UX-B01 fila de conversa amb i sense no llegits, UX-B02 bombolla pròpia, aliena, de sistema, esborrada, amb enllaç, amb error; UX-B03 compositor amb `textarea`; UX-B05 pastilla de no llegits i les tres marques d'estat) i conserva l'`import { Avatar, Boto }` del barril que exigix `tractor-cataleg` C2. **[MODIFY] `src/sections/disseny/cataleg/manifest.js`**: `subtitle`/`lead` de l'entrada `xat` actualitzats.

#### 4.F · Barres laterals plegades (NOTA URGENT del Mestre; propietari: tall «rails»)

**[MODIFY] `src/components/layout/AppGridShell.css`**, **`src/components/layout/AppGridColumn.jsx`** (la variant `collapsed` perd el `style={{…}}` de la l. 61 a favor d'una classe), i els fulls de la barra principal blava i de la barra de control (a localitzar: `src/css/layout.css` o `sdp.css`, i la secció Control). Un sol joc de regles de rail: fila superior de `var(--sdp-alt-accio)` amb la icona centrada; cada icona següent en una cel·la quadrada de `var(--sdp-touch)` centrada horitzontal i verticalment; la mateixa separació vertical (`var(--sdp-space-2)`) a totes les columnes; cap botó fora de la graella. Es mesura abans i després amb el navegador a Notes, Xat i Control (escriptori 1280 px) i s'adjunten captures a l'auditoria. Res a `AppGridShell.jsx` llevat que la mesura ho exigisca.

#### 4.G · Verificació executable sota el hook (propietari: tall «integracio»)

**[NEW] `tests/lint_xat.test.mjs`** (`node --test`): linta amb l'API d'`ESLint` (devDependency) tots els fitxers tocats en este torn amb la mateixa configuració que `npm run lint` i falla amb qualsevol avís. No s'afig a `package.json` (zona amb lease): és l'única forma que el hook deixa d'executar el linter.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Ordres que el hook deixa executar (`tooling/gates/mutation-policy.mjs:43-70`) i que es passaran en este ordre:

1. `npx vitest run src/sections/xat src/data/supabase/xat.test.js src/app/App.test.jsx src/components` (tots els tests del xat, l'smoke test de l'app i els components tocats).
2. `node --test tests/lint_xat.test.mjs` (ESLint amb zero avisos sobre els fitxers del torn).
3. `node --test tests/xat_f0_migracio.test.mjs` (invariants de la migració).
4. `npm run porta:rls` (regles R1-R8 sobre `supabase/**`), `npm run porta:enxufe` (E1-E4: cap import de Supabase fora de `src/data`, noms del port = noms del contracte), `npm run porta:design-guard` (hex, `style=`, mides tàctils, `font-size`).
5. Navegador (`vite-dev`, `http://localhost:3340`, mode seed): captures d'escriptori (1280 px) i mòbil (375 px) de la llista, una conversa amb bombolles pròpies, alienes, de sistema i en error, el compositor, el rail plegat i desplegat a Xat, Notes i Control (nota del Mestre), i el títol de la pestanya amb el comptador. Es comprova la consola sense errors.
6. Revisió adversarial amb agents (cada troballa refutada per dos revisors amb lents diferents: correcció i tests; RLS i seguretat; Pedra Seca, portes i accessibilitat; enxufabilitat i contracte) abans de donar-ho per fet.

Criteris d'acceptació de F0 (ARQ-L03) que es podran demostrar en este torn: (1) un missatge enviat dos vegades es guarda una (test del context amb el mateix `id` i test de l'adaptador); (2) l'historial antic es carrega fent scroll o amb «Carrega'n més» (test i navegador en mode seed); (3) el comptador de no llegits és correcte i es pinta (test); (4) un error de xarxa es veu a la bombolla i es pot reintentar (test i navegador). No es poden demostrar: (5) la baixa sense trencar les converses dels altres (ARQ-J04 exclòs) i (6) un backend sense la capacitat `xat` (DEC-03 exclòs). La migració no s'executa contra cap base de dades (no n'hi ha cap de local).

No es pot executar en este torn: `npm run lint` complet, `node tooling/gates/tancament.mjs`, `porta:persistencia`, `porta:tokens`, `porta:vocabulari`, `porta:pedra-seca`, ni la cadena `run-portes.mjs` (hook). Queden per al pre-commit del Mestre; els seus criteris s'han incorporat com a regles d'escriptura en cada tall.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Esquema i client desacoblats.** L'adaptador nou crida `xat_envia`, `xat_historial`, `xat_nous`, `xat_marca` i la v2 de `xat_fils_meus`. Contra un Supabase amb l'esquema actual el xat remot fallarà amb «esquema no aplicat» fins que el Mestre revise i aplique `260927_0200_xat_f0_fonament.sql`. El mode seed no ho tapa: ho fa visible.
- **`revoke insert` sobre `xat_missatges`.** Qualsevol client vell que inserisca directament deixarà de poder-ho fer. És intencionat (ARQ-A05), però cal aplicar migració i client junts.
- **`es_participant` només membres actius.** Canvia la semàntica d'una funció que usen totes les polítiques del xat; hui no hi ha ningú «eixit», així que no hi ha efecte fins als grups (F1).
- **Backfill de `seq`** sobre taules amb files: `row_number()` per conversa i `validate constraint` poden tardar en converses grans; el `statement_timeout` de 120 s de la migració és el límit. Sense base local no es pot cronometrar.
- **Realtime a mitges:** el disparador emet a un canal privat que cap política autoritza encara; el client caurà al sondeig. Si Supabase no té la funció `realtime.send`, el bloc `exception` ho amaga: cal comprovar-ho al panell.
- **Cadena de portes i pre-commit.** No es poden executar `lint`, `tokens`, `vocabulari`, `pedra-seca` ni `fitxa-gestor` des del hook. Els criteris s'han aplicat a mà i amb `tests/lint_xat.test.mjs`, però una identitat nova al criquet de `design_guard` o de `tractor-pedra-seca` es veurà al pre-commit del Mestre.
- **Llei del Píxel fora del xat.** El tall F (barres plegades) i la prop `llavor` d'Avatar toquen superfícies compartides. Avatar sense `llavor` no canvia; el tall F sí que canvia píxels a Notes i Control per ordre explícita del Mestre i s'adjunten captures.
- **Tests existents.** `XatSection.test.jsx` i `xat.test.js` es reescriuen (la UI i el transport canvien); `App.test.jsx:76` es conserva pel literal «Nova conversa».
- **`useNotesData` dins del xat.** Es talla `workspaceKey`; `creaNota` es queda per al Retall (dependència documentada, no arquitectònica).
- **Governança fora d'abast:** ESTAT, LEDGER, `tancament.mjs`, `package.json` (afegir el test de lint a `test:node`) i `tractor-rls.mjs` (exempció `realtime`) necessiten executor amb lease; les línies exactes es deixen a l'auditoria per a MarIA o el Mestre.
- **Consum.** Dos mapes perduts (4,5 M de tokens) abans de tindre'n un: el hook bloqueja StructuredOutput (cap `schema` als agents d'este repositori) i el límit setmanal va caure a mig torn. Cal registrar-ho a la telemetria de consum quan el Mestre ho ordene.

### Investigació de Telemetria Humana
Quan hages acabat amb la implementació del Xat (i tinguem crèdits lliures), dedica uns tokens a investigar a fons els darrers estudis sobre eficiència entre IA i humans per millorar el *Tractor Cognitiu*. L'objectiu és trobar nous mètodes objectius per a mesurar la "Qualitat Cognitiva" sense pressuposar fatiga per la quantitat d'hores (pels efectes hormonals). També s'han de proposar maneres de mesurar les incidències i interrupcions: com tractar estadísticament quan el Mestre es desperta de matinada mitja hora només per copiar un codi, o com fer estimacions aproximades per "mitges hores" de la seua activitat per no tornar-nos bojos quadrant minuts.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
