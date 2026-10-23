---
type: informe
status: esborrany
description: 'Construcció i Gauntlet de Claude per al Cercador Universal: directori públic d''entitats, padró sense 403, rànquing i resiliència; amb evidència remota'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9d450882-0487-4ddb-bd39-b71e2bcb84d1:d5eb6841-a9ff-452b-b794-f86a243c8362
---
# Auditoria Claude: Cercador Universal Desacoblat i Resilient

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9d450882-0487-4ddb-bd39-b71e2bcb84d1:d5eb6841-a9ff-452b-b794-f86a243c8362 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T20:20:09.540Z |
| Modificació | 2026-10-22T21:42:00.000Z |
| Propietari | Claude (torn_9d450882) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | ~ (no mesurat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-22T20:20:09.540Z: esborrany creat; contingut i verificació pendents.
2026-10-22T20:25Z: relleu 1 (diagnosi, cap codi tocat encara).
2026-10-22T20:36Z: relleu 2 (codi de T1–T3 escrit).
2026-10-22T20:50Z: relleu 3 (proves verdes i prova en viu).
2026-10-22T20:58Z: relleu 4 (correcció del SQL del Relleu 2 de Gemini).
2026-10-22T21:35Z: Gauntlet adversarial tancat (4 crítics, 7 verificacions), esmenes aplicades i dictamen final.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Relleu 1 · 22:25 · Diagnosi (cap fitxer de codi tocat)

Per a Gemini (torn_241a9f50) i MarIA. Claude construïx; reserva d'escriptura, fins al relleu final:
`src/data/contracte.js`, `src/data/backendPort.js`, `src/data/supabase/organizations.js`, `src/data/supabase/index.js`, `src/data/localPerfils.js`, `src/sections/search/*` i els seus tests, les claus `section.search.*` dels diccionaris.

1. **Reproduït:** `/cerca?q=figuera` sense sessió torna 0 a totes les pestanyes (localhost:3340, mode remot).
2. **Tenant partit al Supabase remot (evidència REST anònima, 22:15):** les 3 files d'`organization_directory` (La Figuera, El Rentonar, Sóc de Poble) i les 8 files d'`app_content` són del tenant `11111111-2222-3333-4444-555555555555`, que a `towns` és «Poble de Llavors» (`seed-town`). `edd2f840-…` és La Torre de les Maçanes a `towns`, i no té cap fila d'`app_content`. Amb `VITE_TENANT_ID=edd2f840-…` (canvi de les 22:06 a `.env.local` i `.env.production.local`), el contingut base, el Mur i les organitzacions del Mestre (`list_my_organizations` filtra per `p_tenant_id`) queden en un altre tenant. **Decisió del Mestre abans de cap desplegament** (vegeu §Decisions).
3. **La vista ja és bona:** `organization_directory` viva té les 15 columnes de `2610081401` (amb `town_name`), lectura `anon` operativa. La Figuera hi és amb `town_name = 'La Torre de les Maçanes'`; El Rentonar i Sóc de Poble, amb `town_name` null.
4. **Logo opac:** `logo_url` és `sdp-media://mitjans/…`. `primeraImatge` de l'índex i l'àtom `Avatar` el descarten (inicials). Cal resoldre'l pel port (`useResolvedAsset`, com `CaraXat`).
5. **403 del padró:** `carregaMembres` (xat.js:650) normalitza SDP-XAT-003 amb `code: 'SDP-XAT-003'` i el text «Estàs en Mode Foraster…». El cercador el pot reconéixer pel codi, mai pel text.
6. **Límit de verificació en viu:** el navegador de l'app bloqueja el host `*.supabase.co` del projecte (`ERR_CONNECTION_CLOSED`; altres hosts carreguen). La prova remota es farà amb Chrome headless des del shell.

### Relleu 2 · 22:36 · Codi de T1–T3 escrit (proves noves en curs)

Per a Gemini: el diff ja es pot auditar. Fet (sense tocar cap fitxer fora de la reserva):
- `contracte.js`: capacitat opcional nova **`directoriEntitats: ['listPublicOrganizations']`** i `LIMIT_DIRECTORI_ENTITATS = 500`. El nom és el meu, no el `directoriOrganitzacions` del vostre Relleu 1: coincidim en la decisió (capacitat a banda), només canvia el nom.
- `backendPort.js`: `listPublicOrganizations = asseguraMetode(...)`. `supabase/index.js`: export explícit (els `export *` repetits s'anul·len).
- `supabase/organizations.js`: GET a `organization_directory` amb **columnes explícites** (mai `*`), `order=name.asc,id.asc`, `limit`, **sense filtre de tenant**; consulta opcional com a `and=(or(name,slug,lema,description ilike))` amb les paraules netejades (cap coma, parèntesi ni cometa arriba a PostgREST). Provat contra el remot: «figuera» → La Figuera; «natural terreta» → La Figuera.
- `localPerfils.js`: `listPublicOrganizations` (només `visibility = 'public'`, fila amb les columnes de la vista, `tenant_id` null).
- `indexCerca.js`: `deOrganitzacio`; plegat ampliat (`ŀ`, «col.legi», lligadures NFKD, œ æ ß ø ł đ ı) amb `partsRessaltades` al mateix compàs; rànquing per graons (frase igual / paraula del títol / prefix / dins del títol / lema-ofici / cos) amb pes IDF i desempat pel poble actiu; l'avatar porta `ref` si el logo és del bucket públic.
- `useCercaGlobal.js`: font `directori` independent del xat i de la sessió (memòria de 5 min per àmbit); padró tancat **per codi** (`SDP-XAT-001/003`, `SENSE_PERMIS`, 403/42501) = font llesta i buida, sense avís; cap font no queda «carregant» més de 10 s.
- `SearchSection.jsx` i `targetaDeResultat.js`: el logo opac es resol pel port (`useResolvedAsset`).
- Dues claus noves als 5 diccionaris: `section.search.font.directori`, `section.search.errorTermini`.

Discrepància amb el vostre Relleu 1, amb evidència: la vista remota **no** té `headline`, `bio`, `avatar_url`, `town_id` ni `LEFT JOIN towns`. La lectura anònima de les 22:15 torna exactament les 15 columnes de `2610081401` (`town_name` és columna de `organizations`). I l'enllaç `/empresa/<slug>` no s'obri sempre: el perfil remot resol el slug només dins del tenant configurat (`perfils.js:160-166`), per això `deOrganitzacio` porta al slug només quan el tenant de la fila és l'actiu.

### Relleu 3 · 22:50 · Proves verdes i prova en viu (Gauntlet adversarial en curs)

- Proves noves: 5 fitxers, 60 casos (contracte, directori local, adaptador remot, índex pur, integració de /cerca). Una prova vella reorientada a propòsit (SearchSection.test.jsx: el padró que falla «de veres» és ara una fallada de xarxa; el foraster amb `code` SDP-XAT-003 ja no pinta cap avís). Cas nou al kit de conformitat (`listPublicOrganizations`, passades seed i remota).
- Portes: ESLint 0 avisos; `lint_logica_usuari` 17/17, `lint-sessio` 1/1, `lint_xat` 20/20, `migracio-organitzacions-poble` 10/10; qualitat (xat, data, fronteres, i18n, conformitat, rutes canòniques, fantasmes) 108/108; `tractor-enxufe` E2 verd (E1 vermell per 7 proves velles, cap meua).
- **En viu, sense sessió, remot (Chrome headless des del shell contra localhost:3340):** `/cerca?q=figuera` → Tot 1 · Entitats 1 · «La Figuera», meta «La Torre de les Maçanes», «Natural art 🌸 Made in La Terreta», **logo resolt pel port** (Storage 200, 600 px), cap avís d'error (només l'informatiu «Sense entrar…»). `/cerca?q=rentonar` → El Rentonar amb logo. `/cerca?q=poble&tipus=entitats` → un sol «Sóc de Poble».
- **En viu, la conseqüència del tenant partit:** l'enllaç de La Figuera és `/empresa/a6d028a2-…` (s'obri: «La Figuera · Entitat · La Torre de les Maçanes»). **`/empresa/lafiguera` torna ara «Perfil no trobat»**: el slug es busca a `tenant_id=eq.edd2f840-…` i la fila és de `1111…`. És efecte del canvi de `.env` de les 22:06, no del codi del cercador. Sóc de Poble ix amb `/empresa/a240e870-…` en lloc de `/socdepoble` pel mateix motiu (l'app no troba l'entitat pilot dins de La Torre).

### Relleu 4 · 22:58 · Per a Gemini, MarIA i el Mestre: NO executeu el SQL del Relleu 2 de Gemini

Gràcies pel dictamen. Dues correccions amb evidència, la segona de seguretat:
1. Els pesos citats no són els del codi: `PES_FRASE_IGUAL = 10` (no 100), `dinsDelTitol: 2` (no 3), `PES_POBLE_ACTIU = 0.4` (no 0,25). Vegeu `indexCerca.js` · `PES`.
2. **El bloc SQL proposat no s'ha d'executar.**
   - `public.tenant_memberships` no existix en cap migració: la taula és `public.town_memberships (town_id, user_id, role)` (`2609080000_initial_schema.sql:23-29`). El pas 3 fallaria i el `COMMIT` desfaria tot el bloc.
   - La intenció del pas 3 és un forat: dona pertinença al poble a qui té `profiles.town_name` com «La Torre», i eixa columna l'escriu la mateixa persona (`grant update (… town_name …) on public.profiles to authenticated`, `2609110600_perfil_avatar_i_permisos.sql:17`). Qualsevol compte es faria veí i llegiria el padró i el xat del poble.
   - Els passos 1-2 mouen només `organizations` i `app_content`. Hi ha 11 taules amb `tenant_id` o `town_id` (`app_content`, `app_content_historial`, `denuncies`, `notes`, `organization_claims`, `organization_member_organizations`, `organization_memberships`, `organizations`, `section_submissions`, `town_memberships`, `xat_fils`): amb les organitzacions mogudes i les seues pertinences no, `list_my_organizations` (que filtra per la pertinença) deixaria el Mestre sense les seues entitats.
   - Proposta conservadora (al meu informe final, §Decisions): primer una diagnosi de només lectura de quines files hi ha a cada tenant; després, el Mestre tria entre tornar `VITE_TENANT_ID` al tenant de les dades o moure totes les taules juntes en una migració revisada.

### Dictamen final · 23:35

#### 1. Matriu de Conformitat de Requeriments (MCR)

| Requeriment del Pla | Estat | Evidència / Fitxer Comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| T1 · `listPublicOrganizations` a `contracte.js` i `backendPort.js` | `[FET]` | Capacitat opcional `directoriEntitats` + `LIMIT_DIRECTORI_ENTITATS` (`contracte.js`); export al port; `contracte.directoriEntitats.test.js` | — |
| T1 · Crida a `organization_directory` (`supabase/organizations.js`) | `[FET]` | Columnes explícites (no `select=*`, és més segur), sense filtre de tenant, patró tolerant als accents, reintent de columna absent; export explícit a `supabase/index.js`; `organizations.directori.test.js` (14 casos) | — |
| T1 · Mètode local per a `seed` i `local` (`localPerfils.js`) | `[FET]` | Només `visibility = 'public'`, fila de la vista, plegat real; `localPerfils.directori.test.js` | — |
| T1 · Kit de conformitat (Llei de l'Enxufabilitat) | `[FET]` | Cas 30 a `conformitat/kit.js`; passades seed i remota amb fila de veres (`supabase/conformitat.test.js`) | — |
| T2 · `deOrganitzacio` (títol, poble, lema, logo, `/empresa/<slug>`) | `[FET]` | `indexCerca.js`; el slug només quan el tenant de la fila és l'actiu (si no, `/empresa/<id>`, que sí que s'obri) | El slug en viu espera la decisió D1 |
| T2 · Plegat valencià exhaustiu | `[FET]` | à/á è/é í/ï ò/ó ú/ü ç, `l·l`, `ŀ`/`Ŀ`, «col.legi», lligadures, amplada completa, œ æ ß ø ł đ ı, lletres astrals; ressaltat al mateix compàs (fuzz de 600.000 cadenes del crític) | — |
| T2 · Rànquing multicriteri (exacte > prefix > títol > lema/ofici > cos) | `[FET]` | `puntua` per graons, frase amb repetides, pes IDF; `indexCerca.cercador.test.js` | — |
| T2 · Ponderació per proximitat | `[FET]` | El poble actiu és la primera clau de desempat (`compara`): mai capgira un graó | — |
| T3 · Font `entitatsPubliques` a l'índex | `[FET]` | Font `directori` a `useCercaGlobal.js`, independent del xat i de la sessió, memòria de 5 min per àmbit | — |
| T3 · 403 del padró silenciós | `[FET]` | `esPadroTancat` pel `code` (SDP-XAT-001/003, SENSE_PERMIS) o 403/42501 de la causa; 5 proves d'integració | — |
| T3 · Una sola fitxa canònica | `[FET]` | Mateixa clau `entitats:<id>` que la pròpia i el padró; `hrefDeLaFusio`; ids del directori a `delProjecte` | Les canòniques remotes de Sóc de Poble i El Rentonar esperen D1 o D2 |
| T3 · Resiliència (fail-safe) | `[FET]` | Termini de 10 s per font amb reintent; la resta es pinta; directori que sobreviu a un canvi de filtre | — |
| T4 · `VITE_TENANT_ID` al poble real | `[PARCIAL]` | Ja fet per MarIA a les 22:06 (no l'he tocat). Té conseqüències (§3) | Decisió D1 del Mestre |
| T5 · SQL de la vista amb `town_name` i grants | `[FET]` | És `2610081401_organitzacions_poble.sql`, ja al repo; la vista viva en té les 15 columnes; consultes de verificació a §4 | El README encara la diu «NO aplicada» (D3) |
| Criteri 1 · «figuera» → Tot i Entitats amb 1, logo i enllaç | `[PARCIAL]` | En viu: Tot 1, Entitats 1, logo resolt. Enllaç `/empresa/a6d028a2-…` | `/empresa/lafiguera` torna «Perfil no trobat» amb el tenant actual (D1) |
| Criteri 2 · Carmen i Damián sense 403 | `[PARCIAL]` | Codi i proves: el padró es demana al tenant de La Torre i el 403 ja no pinta cap error | Sense poder entrar com a veí, no ho he vist en viu |
| Criteri 3 · Convidat/foraster sense error roig | `[FET]` | En viu (anònim) i en proves (foraster): només l'avís informatiu d'entrar | — |
| Criteri 4 · Proves | `[FET]` | Vegeu §Verificació | — |
| Risc · Compatibilitat de `useCercaGlobal` | `[FET]` | Mateixa signatura i mateixa forma de retorn; l'única consumidora (`SearchSection.jsx`) no canvia de contracte | — |

#### 2. Gauntlet adversarial (4 crítics amb context net, 7 refutadors)

| # | Troballa | Gravetat | Veredicte | Acció |
| :--- | :--- | :--- | :--- | :--- |
| 1 | La bonificació del poble capgirava graons amb dues paraules (pes IDF baix) | mitjana | Confirmada | Corregit: el poble és clau d'ordre, no punts. Prova nova |
| 2 | L'enllaç és `/empresa/<uuid>` i no `/empresa/lafiguera` | mitjana | Refutada (dades, no codi) | D1 |
| 3 | Dues fitxes de Sóc de Poble amb el tenant partit | mitjana | Refutada (en viu ix una sola) | D1 o D2 |
| 4 | El termini vençut no s'oblidava: tornar a Tot avisava a l'instant | baixa | Confirmada | Corregit. Prova nova |
| 5 | El directori es tallava i es tornava a demanar en canviar de filtre | baixa | Refutada (sense eixida errònia) | Millorat igualment (xarxa rural). Prova nova |
| 6 | «Bora Bora», «Pas a pas»: la frase sense repetides perdia el títol exacte | baixa | Confirmada | Corregit. Prova nova |
| 7 | Lletres astrals (negretes de xarxes) trobades però sense ressaltar | baixa | Confirmada | Corregit (`mapaPlegat` per punt de codi). Prova nova |
| 8 | Una lletra astral al tall de 40 partia un parell suplent: `URI malformed` | baixa | Sense verificar (sostre); comprovada a mà | Corregit. Prova nova |
| 9 | Més de 500 entitats: el filtre del servidor no plegava accents | baixa | Sense verificar; comprovada a mà | Corregit: patró tolerant (superconjunt), provat en viu amb «FIGUÉRA». Prova nova |
| 10 | La passada remota del kit era buida (el doble tornava `[]`) | baixa | Sense verificar; comprovada a mà | Corregit: el doble torna una fila amb les columnes demanades |
| 11 | El contracte prometia `code` als errors i l'adaptador només dona `status` | baixa | Sense verificar; certa | Corregit el text del contracte |
| 12 | El filtre local no normalitzava (NFC/NFD) | baixa | Sense verificar; certa | Corregit: plegat real al local. Prova nova |
| 13 | Duplicat de Sóc de Poble (crític de l'índex) | baixa | Mateix cas que el 3 | D1 o D2 |

Revisat i sense defecte, segons els crítics: cap injecció a PostgREST (també `and`, `or(`, `not.eq`, `%`, `*`, cometes), cap tempesta de peticions, StrictMode net, cap correu a l'índex, cap regressió als altres consumidors de `plega` (291 proves).

#### 3. Decisions del Mestre (`requires_human_decision: true`)

- **D1 · El tenant partit (bloqueja el desplegament a Firebase).** Al Supabase remot, les persones (`town_memberships`, després de la purga de les 19:00) són de La Torre (`edd2f840-…`), però les 3 organitzacions, les 8 files d'`app_content` i, segurament, la resta de taules amb `tenant_id` són del poble de llavor (`1111…`). Amb `.env.local` i `.env.production.local` a La Torre: `/empresa/lafiguera` dona «Perfil no trobat», el contingut base remot és buit, i `list_my_organizations` no torna les entitats del Mestre. Opcions:
  - **A.** Tornar `VITE_TENANT_ID` a `1111…` i donar d'alta al poble de llavor, per id, les persones que calga. És el canvi més xicotet, però el poble es continua dient «Poble de Llavors».
  - **B.** Moure totes les files de `1111…` a `edd2f840-…` en una sola migració revisada, amb les 11 taules juntes i comprovant els conflictes de `unique (tenant_id, slug)`. És la solució neta.

  En qualsevol cas, primer cal la diagnosi de només lectura de §4. Mai el bloc SQL del Relleu 2 de Gemini (Relleu 4). Si el Mestre tria B, Claude escriu la migració amb el resultat de la diagnosi.
- **D2 · Declarar els UUID remots de les identitats fundacionals.** Sóc de Poble `a240e870-4aef-4d92-b138-e8b4e2f2123a` i El Rentonar `b2c87505-53b1-4108-902f-2313e77b9968` a `IDS_REMOTS_FUNDACIONALS` (`identitatsSeed.js`). Amb això, ixen amb `/socdepoble` i `/rentonar` i es fusionen amb el catàleg sense dependre del tenant. És doctrina fundacional, i per això no l'he tocada.
- **D3 · Estat de `2610081401`.** L'acta 2215 diu que el Mestre ja l'ha aplicada, i la vista viva en té les columnes. `supabase/README.md` encara diu «NO aplicada», i `tests/migracio-organitzacions-poble.test.mjs` fixa eixe text. Canviar-ho és cosa del Mestre.
- **D4 (opcional) · Avís al foraster.** El padró tancat ara és silenciós, com demanava el prompt. Si el Mestre vol una línia informativa (no roja) del tipus «La gent del poble només la veuen els seus veïns», és una clau nova als 5 diccionaris.

#### 4. SQL per al Mestre (T5 i diagnosi de D1)

Totes quatre consultes són de només lectura. La primera i la segona verifiquen T5: han de tornar les 15 columnes de `2610081401`, acabades en `town_name`, i `SELECT` per a `anon` i `authenticated`. La tercera i la quarta fan la diagnosi de D1.

```sql
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'organization_directory'
 order by ordinal_position;

select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'organization_directory'
 order by grantee;

-- Diagnosi de D1: quantes files té cada tenant a cada taula amb tenant_id.
select c.table_name,
       (xpath('/row/t/text()', fila))[1]::text as tenant_id,
       (xpath('/row/n/text()', fila))[1]::text::int as files
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
 cross join lateral unnest(xpath('/table/row', query_to_xml(
       format('select tenant_id as t, count(*) as n from public.%I group by tenant_id', c.table_name), false, false, ''))) as fila
 where c.table_schema = 'public' and c.column_name = 'tenant_id'
 order by 1, 2;

-- I les pertinences de persones, per poble.
select m.town_id, w.name, m.role, count(*) as persones
  from public.town_memberships m left join public.towns w on w.id = m.town_id
 group by 1, 2, 3 order by 1, 3;
```

#### 5. Fitxers tocats per Claude en este torn

- **Codi:** `src/data/contracte.js`, `src/data/backendPort.js`, `src/data/supabase/organizations.js`, `src/data/supabase/index.js`, `src/data/localPerfils.js`, `src/data/conformitat/kit.js`, `src/sections/search/indexCerca.js`, `src/sections/search/useCercaGlobal.js`, `src/sections/search/SearchSection.jsx`, `src/sections/search/targetaDeResultat.js`.
- **Diccionaris:** `src/config/idiomes/{ca,es,en,eu,gl}.js`, amb dues claus cadascun.
- **Catàleg:** `src/sections/disseny/cataleg/detalls/EspecimenCercaFiltres.jsx` (la mostra «Una font ha fallat» ja no és el foraster) i `versio.js` (versió posada al dia, com exigix la guarda).
- **Proves noves:** `src/data/contracte.directoriEntitats.test.js`, `src/data/localPerfils.directori.test.js`, `src/data/supabase/organizations.directori.test.js`, `src/sections/search/indexCerca.cercador.test.js`, `src/sections/search/SearchSection.cercador.test.jsx`.
- **Proves tocades:** `src/sections/search/SearchSection.test.jsx` (una expectativa reorientada a propòsit) i `src/data/supabase/conformitat.test.js` (el doble del directori).
- **No he tocat:** `.env*`, `.agents/` (ni ESTAT ni LEDGER, que són de MarIA), `supabase/` (ni migracions ni `seed.sql`, que té una altra mà a mig fer) ni `identitatsSeed.js`. No he fet cap commit.

#### 6. Incidències pròpies (transparència)

- **Un torn obert sense voler.** `node tooling/gates/obrir_torn.mjs --help` no mostra l'ajuda: va obrir el torn `torn_b0ac5d1c-c182-438b-ab6e-f694c3aa57be`, amb actor `agent-local`. No l'he usat ni l'he esborrat. El torn bo és `torn_9d450882`. Tancar-lo o arxivar-lo és cosa de MarIA.
- **Escapes convertides.** Les escapes `\uXXXX` que escric a les eines d'edició arriben al disc com a caràcters literals (combinants invisibles dins d'una classe de regex). Les he restituïdes amb un script; el diff final ja porta les escapes.

#### 7. Retroalimentació per a la plantilla `prompt_local`

- **Separar fets i hipòtesis.** El prompt donava per fet que T4 «alinea» el tenant, i el canvi ja aplicat partia les dades. Proposta: una secció «Estat verificat del remot» amb la consulta REST que ho prova i l'hora.
- **Criteris de dades.** Un criteri que depén de les dades («enllaç a `/empresa/lafiguera`») hauria de dir de quines dades depén. Si no, queda `[PARCIAL]` sense culpa del codi.
- **SQL proposat.** Qualsevol SQL per al Mestre hauria de portar una consulta prèvia de només lectura i la llista de taules afectades. Per exemple, el del Relleu 2 de Gemini apuntava a una taula inexistent.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres, des de `socdepoble.org/`, sobre l'arbre final:
- **Línia base abans de tocar res (22:20):** `npx vitest run src/sections/search/ src/data/` → 108 fitxers, 2.065 proves verdes.
- **Abast afectat després del Gauntlet:** `npx vitest run src/sections/search/ src/data/ src/sections/disseny/ src/config/i18n.idiomes.test.js src/sections/xat/qualitat.test.js src/apps/plataforma/fronteres.test.js src/sections/profile/qualitat.rutesCanoniques.test.js src/sections/detail/qualitat.fantasmes.test.js` i els consumidors del plegat (cercaXat, ajustosXat, DialegNovaConversa, NotesEditor) → **150 fitxers, 2.705 proves verdes**.
- **Suite sencera** (`npx vitest run`, 23:06): **21.045 proves verdes, 8 vermelles i 100 omeses, en 3 fitxers vermells, cap del torn:**
  - `laboratori-telefonades-261006` (git abrevia els hash a 9 caràcters);
  - `MercatSection.autoria` (llig el `seed.sql` que una altra mà té en `stage`);
  - `CalendariSection.robustesa` (una altra mà edita ara `CalendariSection.jsx`, els seus tests i `MurSection.jsx`; tot sol passa, 188/188).
  La passada anterior (22:48) va donar 21.043 verdes i només els dos primers vermells.
- **Portes:**
  - `npx eslint --max-warnings=0` sobre tots els fitxers tocats → 0;
  - `node --test tests/lint_logica_usuari.test.mjs` 17/17, `tests/lint-sessio.test.mjs` 1/1, `tests/lint_xat.test.mjs` 20/20, `tests/migracio-organitzacions-poble.test.mjs` 10/10;
  - `node tooling/gates/tractor-enxufe.mjs` → E2 verd. E1 té 7 infraccions en proves velles, cap meua.
- **Gauntlet:** workflow de 4 crítics (hook, índex, dades, acceptació) i 7 refutadors. Els crítics van fer un fuzz de 600.000 cadenes, un mutant d'`esPadroTancat`, StrictMode i una sonda d'injecció a PostgREST. 13 troballes: 4 confirmades, 3 refutades i 6 comprovades a mà; 10 corregides amb prova, 3 de dades a les decisions (§2).
- **En viu**, sense sessió, en mode remot, amb Chrome headless contra `localhost:3340`. Les rutes `/cerca?q=figuera`, `?q=FIGU%C3%89RA`, `?q=natural%20terreta&tipus=entitats`, `?q=rentonar` i `?q=poble&tipus=entitats` es comporten com diu el Relleu 3, amb el logo servit pel Storage (200). `?q=carmen` torna 0 resultats, sense cap avís d'error, i amb l'avís informatiu «Sense entrar…».
- **Remot (REST anònim):** el filtre tolerant troba La Figuera amb «figuera», «FIGUÉRA» i «natural terreta», El Rentonar amb «rentonar patrimoni» i Sóc de Poble amb «pobles connectats». «zzzz» no troba res.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Carmen i Damián no els he vist en viu.** Cal una sessió d'un veí de La Torre, i no puc entrar amb les credencials del Mestre. El codi i les proves cobrixen el camí: el padró s'enviaria al tenant `edd2f840-…`, on viuen les seues pertinences segons l'acta 1900.
- **El navegador de l'app no arriba a `*.supabase.co`.** Tota la prova en viu ha anat per Chrome headless des del shell.
- **Les decisions D1–D4 són del Mestre.** No he tocat cap `.env`, cap migració ni `identitatsSeed.js`. Cap SQL s'ha executat contra el remot: només lectures REST anònimes.
- **Res commitejat.** Tampoc he escrit ESTAT ni LEDGER, que són de MarIA. El torn `torn_9d450882` queda obert amb este informe vinculat.
- **El Relleu 2 de Gemini** (`261022_2210_auditoria_gemini.md`, §4 i §Límits) continua recomanant el seu bloc SQL. La correcció és el Relleu 4 d'este informe.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
