---
type: informe
status: esborrany
description: Auditoria de Fable sobre la identitat dual amb Supabase, el clon de WhatsApp del Xat i el redisseny de l'Explorador del cervell, amb la visió de xarxa federada entre nodes i codi proposat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:db4d8e13-87e8-45d8-b1e3-86062af8f2f8
---
# Auditoria de Fable: identitat dual, xat familiar i explorador del cervell

Resposta a la petorreta [[260926_1235_prompt_fable]] i aportació a la pissarra [[260926_1235_pla_implementacio_fable]]. Mode AFK absolut: cap línia de codi de producte s'ha tocat. Tot el codi d'este document és proposta, escrit contra els fitxers llegits i les portes que el vigilaran; s'instal·la només quan el Pla estiga consensuat. Cada troballa porta fitxer i línia, evidència, severitat, font de veritat amb què xoca i proposta conservadora. Les decisions que no es poden deduir van marcades amb `requires_human_decision: true`. Les migracions se citen amb el prefix M (M01 = `supabase/migrations/260908_0000_initial_schema.sql`, M02 = `260908_xat_v2.sql`, M03 = `260908_xat_v2_correccions.sql`, M04 = `260908_xat_v2_membres.sql`, M05 = `260911_0600_perfil_avatar_i_permisos.sql`, M10 = `260914_0100_auditoria_rls_fixes.sql`, M11 = `260915_0000_seguretat_profunda_deepseek.sql`, M13 = `260916_2300_correccions_mur_i_xat.sql`, M16 = `260920_0600_xat_limit_correccio.sql`, M18 = `260926_1200_publicacions_autoria.sql`).

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:db4d8e13-87e8-45d8-b1e3-86062af8f2f8 |
| Versió | 1.1.1 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T11:19:31.227Z |
| Modificació | 2026-09-26T12:15Z (aproximat: el rellotge del sistema no és accessible des del hook) |
| Propietari | Claude Fable 5.1 |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), Claude Code a l'app d'escriptori |
| Tokens consumits | Fil principal no mesurat amb precisió (el comptador de l'arnés marca uns 100 k del pressupost de 15 M); subagent d'inventari del codi 905.092 tokens en 178 crides i 29 minuts; subagent de l'esquema SQL 494.635 tokens en 62 crides i 28 minuts |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Lectures fetes abans d'escriure (senceres, amb l'eina Read): AGENTS.md, QUI_SOC.md, ON_ESTIC.md, 02_genotip.md, 00_index.md, taxonomia_documental.md, l'última Acta Marmota (260926_0845), l'ESTAT, la petorreta i el pla de les 12:35, les skills sdp-pedra-seca, sdp-workflow, wiki-documentacio-i-reflex, sdp-app-grid-shell, sdp-universal-page, sdp-universal-editor, sdp-casos-us-essencials i core-estrategia-ia, PROTOCOL_PETORRETA.md, els dos ADR (online-first i Model B), la visió del perfil universal (260913_0635), el sistema nerviós (visió futura) i l'arquitectura tècnica unificada. Del codi: identitat.js, sessionService.js, backendPort.js, contracte.js, host.js, main.jsx, PedraSecaEmbed.jsx, tots els mòduls de src/data/supabase, la Frontissa de Sollutia, IdentitatContext, SessionContext, RequireAuth, OnboardingSection i OnboardingSteps, PerfilShell, PerfilContext i DetallAjust, XatSection, XatContext i XatControlSection amb els seus tests, App.jsx, sections.js, navigation.js, UniversalWorkspace, WorkspaceContext, AppGridShell, AppGridColumn, DocumentEditor, UniversalEditorShell, UniversalToolbar, NotesSection, NotesEditor, NotesDetail, NotaFitxa, NotesDataContext, ExploradorMapa, BrainGraph i el seu test, useForceLayout, grafMapa, contracteMapa, MapaConsola, ConsolaSection, consolaPagines, peces.jsx, vistesMapa.test, el catàleg de Disseny (manifest, registre, EspecimenXat), les peces Pedra Seca usades, tokens.css i index.css, i les portes hooks-local, mutation-policy, command-policy, porta-reflex, porta-olivera, porta-plantilla-viva, turns.mjs, core.mjs, document.mjs, draft-write.mjs, tractor-enxufe, tractor-rls, tractor-importacions, tractor-cataleg, tractor-persistencia i design_guard. Per subagent Explore (només lectura, fitxers seguits per Git): les 18 migracions de `supabase/migrations/` i `supabase/seed.sql` senceres, i els rangs de línies de `src/css/modules.css` i `src/css/utilities.css` que pinten el Xat, el graf i l'Explorador.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-26T11:19:31.227Z: esborrany creat; contingut i verificació pendents.
2026-09-26T11:55Z (aproximat): versió 1.0.0 completa amb les tres directives que el Mestre ha afegit pel xat durant el torn (xarxa federada hipermodular; reutilitzar les taules connections, realms i user_realms; el perfil s'edita amb l'Editor Universal). Esquema SQL i rangs de CSS marcats com a pendents.
2026-09-26T12:15Z (aproximat): versió 1.1.0. Incorpora els dos inventaris: l'esquema del Xat línia a línia, l'autoria dual que el servidor ja té muntada i el client no usa (I2), l'absència de `realms`, `user_realms`, `connections` i `posts` a tot el repositori (I11), els rangs exactes del CSS (X9, E4) i les proves que el redisseny toca (§4.6). El codi proposat s'ajusta a les columnes reals.
2026-09-26T12:30Z (aproximat): versió 1.1.1. El Pla de la IAIA MarIA ha crescut mentre auditava (exportació de dades i baixa amb quarantena; tota la gestió d'usuari dins del Workspace; barra blava dalt i eines de text sticky davall de l'entradilla): s'hi responen I15 i I16 i les decisions D12 i D13. Aportació de Fable escrita al Pla.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Directives rebudes pel xat que no són a la petorreta

Tres ordres han arribat pel xat mentre auditava i no viuen en cap document de l'Escriptori. Sense este apartat, Codex i la IAIA MarIA no les veurien. Les recull perquè el Pla les incorpore.

1. **Xarxa social hipermodular i federada** (Mestre, 26-09, primera interrupció). El sistema naix perquè qualsevol comunitat agafe el projecte Creative Commons i munte el seu node. Hui el node treballa contra el backend de Sollutia (Supabase); demà un altre node pot córrer sobre WordPress o ser un sistema local. Els nodes s'han de poder comunicar entre ells a l'estil d'un fedivers, i la persona tindrà un panell de control per a triar quins nodes, persones o entitats d'altres pobles vol seguir. IdentitatContext, l'estructura de dades, el Mur i el Xat han d'estar acoblats de manera neta i modular, sense codi monolític ni exclusiu.
2. **Reutilitzar la base de dades existent** (segona interrupció). Segons el Mestre, ja hi ha taules a Supabase per a la visió de xarxa i nodes: `connections`, `realms`, `user_realms` i altres. No s'inventen taules noves per als lligams ni per als dominis de la federació. Vegeu I11: cap fitxer del repositori les crea.
3. **El perfil s'edita amb l'Editor Universal** (tercera interrupció, amb dues captures de /notes). Cap editor nou ni formularis genèrics aïllats per a les dades del perfil: l'editor de notes i la seua UniversalCard són l'eina nativa amb què la persona gestiona el seu perfil. Les captures mostren exactament la forma: H1 amb el nom, H2 amb el lema, entradilla amb la presentació, cos lliure, targeta viva a la columna central.

Font de veritat amb què xoquen: cap; amplien l'abast de la petorreta. Proposta: la IAIA MarIA les empelta a la secció «Canvis proposats» del Pla, amb esta auditoria com a font.

### 1. Identitat: què hi ha de veritat i què falta

#### I1 · La identitat dual existix al context i no té cap interruptor a la interfície

- Fitxer: `src/app/contexts/IdentitatContext.jsx` línies 50-169.
- Evidència: el context calcula `actorType` (persona o entitat), `actorId`, `actorKey` (`tipus::id`, línia 105), la llista `identitats` amb la bandera `activa` (línies 123-132) i exposa `setActor(type, id)` (línies 135-149), validat contra les pertinences reals de `list_my_organizations`. Cap fitxer llegit crida `setActor`: ni PerfilShell, ni DetallAjust, ni NotesEditor, ni XatSection. Els consumidors només lligen `actorId` o `actorKey` (MurContext línia 13, NotesDataContext línia 103, XatContext línia 150, NotaFitxa línia 19, NotesEditor línia 54). Cal confirmar amb `grep -rn "setActor" src` que no hi ha cap consumidor fora dels fitxers llegits.
- Severitat: alta per a l'objectiu de la petorreta. La persona no pot triar actuar com a Rentonar o com a empresa: la maquinària és correcta i ningú l'endolla.
- Font de veritat: petorreta §Instrucció punt 1 («Autor Org vs. Autor Publicador»); visió del perfil universal §1 (columna d'identitats).
- Proposta: un `SelectorIdentitat` a la barra taronja de l'editor (ranura `identityActions` que DocumentEditor i UniversalEditorShell ja tenen, DocumentEditor.jsx línies 28-29 i 165) i a la capçalera del Perfil. Codi a §1.6.

#### I2 · El servidor ja sap publicar com a organització; el client no li ho diu

- Fitxers: M01 línia 99 (`section_submissions.author_org_id`), M01 línies 771-779 (política d'inserció: `author_org_id is null or private.can_manage_organization(author_org_id)`), M13 línies 11-40 (`trg_force_submission_author` escriu `payload.author_name` amb el nom de l'organització quan hi ha `author_org_id`), M18 línies 49-80 (`pot_signar_com_organitzacio` i la restricció CHECK). Client: `src/data/supabase/content.js` línies 52-69; `src/sections/connectar/ConnectarSection.jsx` línies 76-97; `src/sections/mur/MurContext.jsx` línia 17.
- Evidència: la base de dades té la columna, la política, el CHECK i el trigger que fan possible signar com a entitat. `appendSectionSubmissionNetworkOnly` mai envia `author_org_id`: escriu `owner_user_id` i prou (línies 65-67). ConnectarSection construïx `author_name` des de `currentUser.user_metadata` (línies 80-82), cosa que el trigger de M13 sobreescriu igualment. El Mur usa `actorId` només com a clau de càrrega, i `loadMur` l'ignora (content.js línies 100-102).
- Severitat: alta, però barata: és una columna al DTO.
- Font de veritat: Genotip llei 6 (Supabase autoritatiu amb RLS): la signatura ja la valida el servidor; el client només ha d'enviar-la.
- Proposta: el DTO d'enviament porta `actor: { tipus, id }`; l'adaptador escriu `author_org_id: actor.tipus === 'entitat' ? actor.id : null`. Cap migració. Codi a §1.6.

#### I3 · La sessió mor amb la pestanya: decisió de producte, no bug

- Fitxer: `src/data/identitat.js` línies 44-50 i 120-130; `src/config/storage.js` línies 60-100.
- Evidència: JWT, refresh token i usuari viuen a sessionStorage per la correcció P0 del 260908 (sessió fantasma). Tancar el navegador obliga a tornar a entrar. `sessioRecuperable` (línies 166-171) només renova dins de la mateixa pestanya.
- Severitat: mitjana. Per a gent major que vol «que siga com el WhatsApp», tornar a entrar cada dia és fricció; per a un origen compartit amb l'amfitrió (Sollutia) és la protecció que el codi explica.
- Font de veritat: la decisió escrita al mateix fitxer; ADR-2026-09 (Model B: l'amfitrió pot entregar la sessió amb `injectaSessio`).
- Proposta: `requires_human_decision: true`. Tres opcions: (a) mantindre-ho i que Sollutia entregue la sessió en cada càrrega (ja previst a host.js línies 213-215); (b) refresh token a localStorage amb el JWT efímer, acceptant el risc descrit al fitxer; (c) cookie HttpOnly del domini d'autenticació, que exigix canvi al servidor. Recomane (a) mentre l'amfitrió siga Sollutia i (b) només per al mode autònom (main.jsx), darrere d'una bandera de configuració.

#### I4 · El registre amb confirmació de correu deixa la persona sense guia

- Fitxers: `src/sections/onboarding/OnboardingSection.jsx` línies 29-41 i 118-126; `src/sections/onboarding/OnboardingSteps.jsx` línies 43-65; `src/data/supabase/auth.js` línies 154-172.
- Evidència: quan GoTrue exigix confirmar el correu, `registerWithPassword` torna sense `access_token` i no desa cap sessió. OnboardingSection mostra un toast genèric i no passa mai `confirmationEmail` a RegistrationStep, que té preparada la targeta «Confirma el teu compte» (línies 43-65) i no s'usa mai.
- Severitat: mitjana. Font de veritat: petorreta («lògica completa i 100% interactiva»).
- Proposta: en tornar sense sessió, guardar el correu i passar-lo a RegistrationStep. Sis línies, codi a §1.6.

#### I5 · El consentiment RGPD el registra el servidor en donar d'alta, amb versió fixa

- Fitxers: M11 línies 41-92 (`handle_new_user` vigent: si `accepta_rgpd = 'true'` a les metadades, escriu `profiles.consentiment_rgpd_at` i una fila a `consentiments` amb `versio_politica = 'v1'`); M11 línies 23-39 (`registra_consentiment`); `src/data/supabase/auth.js` línies 174-175; OnboardingSection línia 33.
- Evidència: el client envia `accepta_rgpd` a `user_metadata` i el trigger fa la resta. `registraConsentiment` no la crida cap fitxer llegit; només faria falta per a re-consentir una versió nova de la política. La versió és una cadena fixa `'v1'` al trigger.
- Severitat: baixa. Proposta: quan canvie el text legal, la interfície demana el consentiment nou amb `registraConsentiment('rgpd_acepta', VERSIO)`; la versió vigent la fixa el Mestre (`requires_human_decision: true`). La 1.0.0 d'esta auditoria ho donava com a forat: no ho és.

#### I6 · Un mètode obligatori del contracte que sempre llança

- Fitxers: `src/data/contracte.js` línia 10; `src/data/supabase/auth.js` línies 196-199.
- Evidència: `loginWithMagicLink` és al nucli obligatori i la implementació llança sempre («temporalment desactivada»). Qualsevol backend nou (WordPress, local) haurà d'implementar un mètode mort per a passar `validaBackendImplementation`.
- Severitat: baixa, però toca la federació: el nucli ha de ser el mínim que tot node pot complir.
- Proposta: moure `loginWithMagicLink` a una capacitat opcional `entradaPerCorreu` (patró CAPACITATS ja existent) o retirar-lo del nucli fins que torne amb PKCE.

#### I7 · La fitxa pública no ix de `profiles` ni d'`organizations`

- Fitxers: `src/sections/profile/ProfileSection.jsx` línies 6-9 i 38-54; `src/app/App.jsx` línies 575-580.
- Evidència: /gent/:id, /empresa/:id i /grup/:id es pinten amb la llista `agents` d'`app_content` (la llavor), no amb `profiles` ni `organizations`. Una persona registrada no té fitxa pública real, i una organització creada des del Perfil tampoc. La vista `organization_directory` (M01 línies 700-717) existix i cap fitxer del client la llig.
- Severitat: alta per a la directiva 3 (perfil com a nota) i per a la federació (una persona ha de tindre una fitxa adreçable).
- Font de veritat: visió del perfil universal §3 (la fitxa és una UniversalCard generada de la UniversalPage).
- Proposta: la fitxa pública es genera del mateix document que edita `PerfilEditor` (§1.6) i es resol per `profiles.id` (només amb `is_public`) o per `organizations.slug` via `organization_directory`; `agents` queda com a directori de la llavor fins que es migre.

#### I8 · El perfil ja usa la closca de l'editor, però no l'editor

- Fitxer: `src/sections/profile/DetallAjust.jsx` línies 321-348 i 230-311.
- Evidència: DetallAjust embolcalla cada ajust amb `UniversalEditorShell` i `UniversalToolbar`, però el contingut és un formulari per camp (input, textarea, checkbox). No hi ha `DocumentEditor` (TipTap), ni cos de biografia, ni targeta viva a la columna central: PerfilShell pinta els ajustos com a fitxes genèriques (PerfilShell línies 62-74).
- Severitat: alta per a la directiva 3. Font de veritat: directiva 3; skill sdp-universal-editor §1-3; captures del Mestre.
- Proposta: `PerfilEditor` amb l'adaptador de DocumentEditor (§1.6) i PerfilShell amb dos elements per identitat: «Fitxa» (l'editor) i «Compte» (contrasenya, correu, sessió, que es queden a DetallAjust). La targeta viva de la columna central és la mateixa `NotaFitxa` activa, sense canvis.

#### I9 · Camps que la directiva demana i columnes que l'esquema té

| Camp de l'editor | Persona (`profiles`) | Organització (`organizations`) |
| --- | --- | --- |
| Títol (H1) | `full_name` (M01 línia 64; grant d'update M05 línia 17) | `name` (M01 línia 77; grant d'update M01 línia 863) |
| Subtítol (H2, lema) | cap columna: proposta `lema text` | `lema` (M01 línia 80; grant d'update sí) |
| Entradilla (presentació) | `bio` (M05 línia 11; grant d'update sí) | `description` (M01 línia 81; grant d'update sí) |
| Cos (biografia en HTML) | cap columna: proposta `presentacio_html text` | cap columna: proposta igual |
| Logotip o avatar | `avatar_url` (M05 línia 9; grant d'update sí) | `logo_url` (M18 línia 47) sense cap grant de columna: vegeu I12 |
| Capçalera (hero) | cap columna: proposta `hero_url text` | cap columna |
| Publicat | `is_public` (M05 línia 12; grant d'update sí). `visibility` només admet `'private'` (M01 línia 65): no s'ha d'usar per a publicar | `visibility` (`public` o `members`, M01 línia 82; grant d'update sí), que `updateOrganization` no mapeja (organizations.js línies 19-21) |

`requires_human_decision: true` per a les columnes noves (`lema`, `presentacio_html`, `hero_url`). Mentre no existisquen, l'editor ho diu en pantalla (el camp es queda en local i avisa), mai en silenci.

#### I10 · Crear una organització no pregunta ni el nom ni el tipus

- Fitxers: `src/sections/profile/PerfilShell.jsx` línies 101-110; `src/sections/profile/PerfilContext.jsx` línies 204-236; M01 línies 480-612 (`create_organization` exigix `kind` company o group, slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`, nom de 2 a 120).
- Evidència: el botó «NOVA ORG» crea «Organització nova» de tipus `company` amb slug `org-<Date.now()>` sense diàleg. Un grup necessita empresa mare que la persona administre (M01 línies 416-448, `can_create_group`); el client no ho pregunta mai.
- Severitat: mitjana. Proposta: `Dialeg` amb `Camp` nom, `GrupOpcions` tipus (empresa o grup) i, si és grup, `Selector` d'empresa mare de la llista `identitats`; el slug es deriva de `normalizeSlug(nom)` (onboardingModel.js línies 4-12, ja existent i sense ús a la interfície).

#### I11 · Federació: cap fitxer del repositori crea `realms`, `user_realms`, `connections` ni `posts`

- Fitxers: les 18 migracions de `supabase/migrations/` i `supabase/seed.sql`, llegides senceres pel subagent; `.git/index` com a llista de fitxers seguits.
- Evidència: zero coincidències de `realm`, `user_realms`, `connections`, `follow`, `node`, `federat`, `instance`, `peer`, `remote` ni `domain` en cap fitxer SQL. Tampoc hi ha cap taula `posts` ni `tenants`. El tenant és `public.towns` (M01 línies 7-14) i la pertinença de persones a pobles és `public.town_memberships` (M01 línies 23-32; clau primària `(town_id, user_id)`, per tant una persona pot ser de diversos pobles, encara que l'alta només en crea una). La pestanya «posts · Table Editor» del navegador del Mestre (captura) mostra una taula que el repositori no coneix.
- Lectura: si `realms`, `user_realms`, `connections` i `posts` existixen, viuen només al Supabase viu, creades fora de les migracions. És deriva d'esquema: `tractor-rls` no les pot auditar, cap agent les pot llegir i qualsevol codi que les use es basaria en columnes endevinades.
- Severitat: alta (bloqueja la fase de federació i la directiva 2).
- Font de veritat: directiva 2 («l'esquema públic que has llegit»); Genotip llei 10 (el contingut inspeccionat és evidència; una afirmació és una afirmació).
- Proposta: `requires_human_decision: true`. Abans de tocar res, un bolcat de l'esquema viu al repositori, com a migració amb data: `supabase db dump --schema public -f supabase/migrations/260926_HHMM_esquema_viu.sql` (o `pg_dump --schema-only` contra la base) i la definició de cada taula nova amb la seua RLS. Amb el bolcat, la 1.2.0 d'esta auditoria alinea els traductors de §2.1 amb les columnes reals. Mentrestant, la correspondència més pròxima que el repositori sí que té: `towns` fa de realm dins d'una mateixa instància, `town_memberships` fa de `user_realms`, i `connections` no té cap equivalent.

#### I12 · El logotip de les organitzacions no pot ni llegir-se ni escriure's des del client

- Fitxers: M18 línies 45-47 (afig `organizations.logo_url`); M01 línies 731-745 i 863 (grants per columna a `organizations`, cap inclou `logo_url`); M01 línies 614-658 (`list_my_organizations` torna 12 columnes, sense `logo_url`); client: `src/data/supabase/organizations.js` línies 19-21, `src/app/contexts/IdentitatContext.jsx` línies 111 i 128, `src/sections/profile/PerfilContext.jsx` línies 53 i 134.
- Evidència: l'RPC que alimenta les identitats no torna `logo_url`, així que l'avatar d'entitat és sempre `null` a IdentitatContext i a PerfilContext; el PATCH de `logo_url` no té grant de columna i, amb `revoke all` previ, PostgREST el rebutja amb 42501. El comentari de M18 diu «el client ja el llig i l'escriu»: el llig i l'escriu sense èxit.
- Severitat: alta per al perfil d'entitat. Proposta: `grant select (logo_url), update (logo_url) on public.organizations to authenticated` i afegir `organization.logo_url` al `returns table` i al `select` de `list_my_organizations`. Migració curta; cal aplicar-la a la base viva i comprovar-la (`requires_human_decision: true`).

#### I13 · Esborrar una organització esborra les seues publicacions

- Fitxers: M01 línia 99 (`author_org_id ... on delete cascade`); M18 línies 13-16 (`add column if not exists ... on delete set null`, que no fa res perquè la columna ja existix).
- Evidència: la intenció de M18 és conservar la publicació i deixar l'autoria en blanc; la restricció vigent és la de M01. Hi ha dos índexs sobre la mateixa columna (M01 línies 153-154 i M18 línies 18-20).
- Severitat: alta (pèrdua de dades). Proposta: migració que faça `alter table public.section_submissions drop constraint <nom_fk>` i la torne a crear amb `on delete set null`, i que esborre l'índex duplicat. `requires_human_decision: true`.

#### I14 · L'alta amb Google d'una persona nova pot fallar al trigger

- Fitxers: M11 línies 41-92 (`handle_new_user` vigent llança `SDP-REG-001` si `raw_user_meta_data.tenant_id` no és un uuid); `src/data/oauthRelay.js` línies 186-193 (la URL d'autorització no porta cap metadada d'usuari); `src/sections/onboarding/OnboardingSection.jsx` línia 33 (el registre amb contrasenya sí que envia `tenant_id`).
- Evidència: GoTrue crea `auth.users` en la primera entrada amb Google amb les metadades del proveïdor, que no porten `tenant_id`. El trigger llança i l'alta fracassa. No s'ha provat contra la base viva: és una lectura dels fitxers.
- Severitat: alta si es confirma. Proposta: provar-ho en staging amb un compte de Google nou; si falla, el trigger ha de tindre un poble per defecte per a altes sense metadades (com feia M10) o el relé ha de portar `tenant_id` a l'estat del flux i completar l'alta amb un RPC després del bescanvi. `requires_human_decision: true`.

#### I15 · Exportar les dades i donar-se de baixa: l'esquema no ho preveu (petició nova del Pla)

- Fitxers: M01 línies 45-57 (`section_submissions.owner_user_id uuid not null`, sense clau forana); `260914_0000_schema_notes.sql` línies 5-23 (`notes.owner_user_id`, sense clau forana); M01 línies 62-71, M01 línia 104, M02 línies 8-37 i M11 línies 7-21 (`profiles.id`, `organization_memberships.user_id`, `xat_fils.creat_per`, `xat_participants.usuari_id`, `xat_missatges.usuari_id`, `xat_lectures.usuari_id` i `consentiments.user_id`, tots `references auth.users(id) on delete cascade`).
- Evidència: no hi ha cap columna `deleted_at`, cap estat de baixa, cap RPC d'exportació ni de baixa, i cap mètode al contracte del port. Esborrar `auth.users` hui: esborra el perfil, els consentiments, les pertinences a pobles i organitzacions, els seus missatges dins de les converses d'altres persones i, si la persona va crear el fil, la conversa sencera per a l'altra part (`xat_fils.creat_per` en cascada arrossega `xat_missatges`); deixa orfes les publicacions i les notes, amb el nom de l'autor dins de `payload.author_name`.
- Severitat: alta (RGPD: portabilitat i supressió), i el Pla ho demana «per defecte».
- Proposta (`requires_human_decision: true`, D12): (1) RPC `exporta_les_meues_dades()` security definer que torne un jsonb amb perfil, pertinences, organitzacions on mana, publicacions pròpies, notes pròpies, consentiments i els missatges propis (mai els dels altres), descarregable com a JSON des de «El compte»; (2) baixa en dos passos: `demana_baixa()` marca `profiles.baixa_demanada_at`, anonimitza en el moment (nom «Veïna que se n'ha anat», avatar nul, `is_public` fals), lleva la persona del padró i tanca les sessions; una tasca programada (no un trigger) esborra `auth.users` passats N dies, cosa que allibera el correu per a tornar-se a registrar; `cancela_baixa()` desfà la marca dins del termini; (3) abans d'esborrar cal decidir què passa amb les publicacions i notes orfes: conservar-les anònimes (patrimoni del poble) o esborrar-les (dret d'oblit); (4) `crea_fil_directe` i els fils existents: passar `creat_per` a `on delete set null` perquè la baixa d'una persona no esborre la conversa de l'altra. Port: capacitat opcional `compte` amb `exportaLesMeuesDades`, `demanaBaixa` i `cancelaBaixa`, cap d'elles al nucli.

#### I16 · Barra blava dalt i eines de text ancorades davall de l'entradilla (petició nova del Pla)

- Fitxers: `src/components/universal/UniversalEditorShell.jsx` línies 187-243 (`{topBar}` es pinta abans de la `UniversalPage`, dins de `.sdp-editor-shell-atomic`; la barra blava és la de la pàgina amb `chrome="context"`); `src/components/universal/DocumentEditor.jsx` línies 161-168 (la barra d'eines TipTap va com a `topBar`); skill sdp-universal-editor §3 (barra d'eines davall de l'entradilla, sticky, amb estat bàsic i desplegat); skill sdp-app-grid-shell §2 (la barra blava a la fila dels controls de les altres columnes).
- Evidència: hui l'ordre a la columna dreta és eines de text (fila 1), barra blava (fila 2), capçalera, taronja, H1, píndoles, H2, entradilla, cos (captures del Mestre). El Pla demana barra blava a la fila 1 i les eines davall de l'entradilla, ancorades en fer scroll.
- Severitat: mitjana (redisseny amb ordre del Mestre; toca Notes i Perfil alhora).
- Proposta: `UniversalEditorShell` guanya `posicioEines: 'dalt' | 'davall-entradilla'` (per defecte `'dalt'`: Llei del Píxel per a qui no ho demane); amb `'davall-entradilla'`, el `topBar` es pinta com a primer fill del cos de la `UniversalPage`, dins del contenidor de scroll de l'editor, amb `position: sticky; top: 0` (`.sdp-editor-tools--ancorada`), i la columna deixa de tindre la fila pròpia d'eines, de manera que la barra blava puja a la fila 1. `UniversalWorkspace.test` i `NotesEditor.test` s'han de revisar contra l'ordre nou del DOM. Decisió D13: aplicar-ho a Notes i Perfil alhora (recomanat: és el mateix editor) o només al Perfil.

### 2. Arquitectura federada proposada (costures, no transport)

Principis que ixen del codi i de les directives:

1. **Un node és (backendId, origen, tenantId).** Ja és així a les claus d'àmbit de tots els proveïdors (MurContext línies 15-16; NotesDataContext línies 105-113; XatContext línies 152-153; PerfilContext línies 69-70; sessionService línia 32): el codi ja distingix «a quin node i a quin poble pertanyen estes dades» sense dir-ho enlloc. Passa a ser un objecte `node` que el port exposa amb `getNodeActual(config)`. A Supabase: `backendId: 'supabase'`, `origen: supabaseUrl`, `tenantId` (una fila de `towns`). A un node WordPress futur: `backendId: 'wordpress'`, `origen: la seua URL`.
2. **Un actor té adreça.** `actor.handle` = `identificador@poble`: persona local `javi@latorre`, entitat local `rentonar@latorre` (el slug d'organització ja és únic per poble, M01 línia 86), actor remot el que vinga de la taula de connexions quan existisca al repositori. `actorKey` no canvia de format (`tipus::id`): els tests existents (XatContext.test línia 8, scopedProviders.test línia 5) i les claus d'esborranys de Notes en depenen. El poble s'afig a banda, com a `actorRealm`.
3. **El nucli del contracte es queda com està; la federació és una capacitat.** Patró existent a `contracte.js` línies 37-60 (`mitjans`, `agenda`): un backend sense federació continua sent vàlid i la interfície ho pregunta amb `teCapacitat('federacio')`. El tractor d'enxufe (E2) obliga que cada mètode nou estiga al contracte i delegat al port: codi a §2.1.
4. **Cap taula nova s'inventa, però tampoc se n'endevina cap.** L'adaptador de Supabase es queda en esquelet amb tres traductors fins que el bolcat de I11 done les columnes reals de `realms`, `user_realms` i `connections`. Els noms de columna només apareixeran dins dels traductors.
5. **El Mur i el Xat reben l'origen de cada peça.** Cada publicació i cada fil porta `origen: { realm, node }`; per als locals és el node propi. Quan un node remot arribe per la Frontissa (patró `src/data/adaptadors/sollutia/`, només GET), les targetes ja saben pintar «de tal poble».
6. **La sessió no viatja entre nodes.** Un node remot es llig, no s'hi escriu (mateixa llei que Sollutia: `ESCRIPTURES_PERMESES` buida). Seguir algú d'un altre node és una fila a la taula de connexions del node propi.

#### 2.1 Contracte i port: la capacitat `federacio`

```js
// src/data/contracte.js — afegir dins de CAPACITATS (cap canvi al nucli)
federacio: Object.freeze([
  'getNodeActual',        // (config) → { backendId, origen, tenantId, realm }
  'llistaRealms',         // (config) → [{ id, nom, handle, esPropi }]
  'llistaElsMeusRealms',  // (config) → pertinences de la sessió
  'llistaConnexions',     // ({ actor }, config) → [{ id, desti: { tipus, id, handle, realm }, estat, creatAl }]
  'creaConnexio',         // ({ actor, desti }, config) → connexió
  'retiraConnexio',       // (id, config) → true
  'resolActor'            // (handle, config) → { tipus, id, nom, avatar, realm } | null
])
```

```js
// src/data/backendPort.js — delegació (tractor-enxufe E2 exigix la simetria)
export const getNodeActual = asseguraMetode('getNodeActual');
export const llistaRealms = asseguraMetode('llistaRealms');
export const llistaElsMeusRealms = asseguraMetode('llistaElsMeusRealms');
export const llistaConnexions = asseguraMetode('llistaConnexions');
export const creaConnexio = asseguraMetode('creaConnexio');
export const retiraConnexio = asseguraMetode('retiraConnexio');
export const resolActor = asseguraMetode('resolActor');
```

```js
// src/data/supabase/federacio.js — esquelet. NO s'activa fins que el bolcat de I11 done les columnes.
// Mentre no hi haja bolcat, `getNodeActual` i `llistaRealms` es poden servir amb `towns` i
// `town_memberships`, que sí que existixen (M01 línies 7-32).
import { getCurrentUser, getResolvedConfig, request } from './runtime.js';

export function getNodeActual(config = {}) {
  const { supabaseUrl, tenantId } = getResolvedConfig(config);
  return { backendId: 'supabase', origen: supabaseUrl, tenantId, realm: tenantId };
}
export async function llistaRealms(config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) return [];
  const rows = await request('/rest/v1/towns?select=id,slug,name,is_open&order=name.asc', config, { signal: config.signal });
  return Array.isArray(rows) ? rows.map((t) => aRealm(t, tenantId)) : [];
}
export async function llistaElsMeusRealms(config = {}) {
  const user = getCurrentUser();
  if (!user?.id) return [];
  const rows = await request(`/rest/v1/town_memberships?select=town_id,role&user_id=eq.${encodeURIComponent(user.id)}`, config, { signal: config.signal });
  return Array.isArray(rows) ? rows.map((m) => ({ realm: m.town_id, rol: m.role })) : [];
}
/* Les tres operacions de connexions s'escriuen quan hi haja esquema al repositori. */
export async function llistaConnexions() { throw new Error('Federació: la taula de connexions no és al repositori (auditoria 260926_1330, I11).'); }
export async function creaConnexio() { throw new Error('Federació: la taula de connexions no és al repositori (auditoria 260926_1330, I11).'); }
export async function retiraConnexio() { throw new Error('Federació: la taula de connexions no és al repositori (auditoria 260926_1330, I11).'); }
export async function resolActor() { return null; }

const aRealm = (t, tenantId) => ({ id: t.id, nom: t.name, handle: t.slug, esPropi: t.id === tenantId, obert: Boolean(t.is_open) });
```

Mentre la capacitat tinga mètodes que llancen, no s'ha de registrar al contracte: `validaBackendImplementation` (backendPort.js línies 37-40) exigix la capacitat sencera o cap, i `teCapacitat('federacio')` diria que sí. L'esquelet es queda al Laboratori (`04_escriptori/02_investigacio_ia/`) fins al bolcat.

#### 2.2 Context i panell de connexions

- `IdentitatContext` afig `node` (de `getNodeActual`) i `actorRealm`, sense tocar `actorKey`.
- Nova llesca `src/sections/connexions/` amb `ConnexionsSection.jsx` sobre `UniversalWorkspace`: columna 1, grups «Persones», «Entitats», «Pobles i nodes» (de `llistaRealms`); columna 2, connexions com a fitxes `sdp-gestor-fitxa` (avatar, nom, handle); columna 3, la `UniversalCard` de l'actor destí amb «Seguir» o «Deixar de seguir» al peu blau (equivalència atòmica amb la barra blava, skill sdp-universal-page §A). El botó NOVA obri un `Dialeg` amb un `Camp` per a escriure un handle o buscar al padró (`carregaMembres`).
- Ruta `/connexions` a ActorRoutes i entrada a `SECTIONS` només quan `teCapacitat('federacio')` siga cert: un node sense federació no mostra el panell.
- Res d'açò obri transport entre nodes: és la llibreta d'adreces del node propi.

### 3. Xat: el clon familiar de WhatsApp

#### X1 · El Xat viu fora de la graella de tres columnes

- Fitxer: `src/sections/xat/XatSection.jsx` línies 172-366.
- Evidència: maquetació pròpia (`xat-layout`, `xat-sidebar`, `xat-main`) amb classes `d-desktop-only` i `d-mobile-only` per a mòbil. No usa `AppGridShell` ni `UniversalWorkspace`, que ja resolen amplàries, plegat, rail d'icones, panells en mòbil i configuració (roda dentada).
- Severitat: alta per a la petorreta («integrat a l'AppGridShell»). Font de veritat: skill sdp-app-grid-shell §1-3; petorreta §Instrucció punt 2.
- Proposta: WhatsApp Web és, literalment, la graella amb la columna esquerra plegada: un rail d'icones a l'esquerra, la llista al centre, la conversa a la dreta. `CategoryRail` (UniversalWorkspace línies 454-488) ja pinta eixe rail. Codi a §3.6.

#### X2 · Controls fantasma: la meitat del WhatsApp actual no fa res

- Fitxer: `src/sections/xat/XatSection.jsx`.
- Evidència: les píndoles «Tot, No llegit, Grups, IAIES, +» (línies 224-230) canvien `activeFilter` i `filteredThreads` no el llig mai (línies 98-102); el «+» no té gestor. Al menú de la conversa (línies 458-482) només «Seleccionar missatges» fa res: «Info. del contacte», «Cercar», «Silenciar», les tres telefonades, «Obrir en una finestra nova» i «Tancar xat» són botons muts. Videotrucada i trucada estan desactivats (456-457). El clip d'adjuntar (550-552) no obri res. «Info. del contacte» no pot funcionar ni amb voluntat: `xat_fils_meus` torna `altres_noms` i no cap identificador (M03 línies 203-260).
- Severitat: alta. Per a gent major, un botó que no fa res és pitjor que un botó que no hi és: DetallAjust ho diu bé («honestedat abans que promeses», línies 189-203).
- Font de veritat: Genotip llei 9 (precisió) i el mateix criteri del perfil.
- Proposta: només queden a la interfície les accions que el backend sap fer hui (cercar dins de la conversa, seleccionar, enviar al Bloc); la resta s'elimina o va a «Opcions del Xat» (XatControlSection) com a pendents declarats. Per a «Info del contacte» cal que `xat_fils_meus` torne `altres_ids uuid[]` (migració curta). `requires_human_decision: true` per a trucades i vídeo (no hi ha cap transport).

#### X3 · El Xat depén del Bloc de Notes per a saber qui és

- Fitxer: `src/sections/xat/XatSection.jsx` línies 19-23.
- Evidència: `XatSection` es reinicia amb `useNotesData().workspaceKey`. XatContext ja calcula el seu `scopeKey` (línies 152-153) i no l'exposa.
- Severitat: mitjana (acoblament entre llesques; trenca la modularitat que demana la directiva 1).
- Proposta: XatContext exposa `scopeKey`; XatSection es reinicia amb ell. La dependència de Notes es queda només dins de l'acció «Enviar al Bloc de Notes».

#### X4 · No es veuen els no llegits, i les dades ja hi són

- Fitxer: `src/sections/xat/XatContext.jsx` línia 122 (`noLlegits` mapejat de `no_llegits`, que `xat_fils_meus` calcula amb `xat_lectures`, M03 línies 229-240); `XatSection.jsx` línies 308-333 (no es pinta).
- Severitat: mitjana; guany immediat. Proposta: `Insignia to="info"` amb el nombre a la fitxa, i el recompte total al rail.

#### X5 · Temps real: el camí garantit és el sondeig, i és a propòsit

- Fitxers: M03 línies 350-376 (el bloc que afegiria `xat_missatges` a la publicació `supabase_realtime` és dins d'un comentari, amb l'avís «comprova que Realtime RLS està actiu al panell»); `src/sections/xat/XatContext.jsx` línies 21-28 i 52-54 (sondeig de 5 s al fil obert i 25 s a la llista); `src/data/supabase/xat.js` línies 28-48 (subscripció que no rep res).
- Severitat: alta per a «tan ràpid i fluid com l'original».
- Proposta: descomentar el bloc de M03 en una migració nova, activar Realtime RLS al panell i baixar el sondeig del fil obert a 15 s com a xarxa de seguretat. `requires_human_decision: true` (cost de Realtime i comprovació al panell).

#### X6 · Les converses es tallen als 50 últims missatges i no hi ha manera de vore'n més

- Fitxers: M16 línies 4-43 (`xat_missatges_del_fil` torna com a molt els 50 més recents, en ordre ascendent); `src/data/supabase/xat.js` línies 92-95 (el client en demana 200); `XatContext.jsx` línies 220-257 (cap cursor ni paginació).
- Evidència: la migració del 20-09 va posar un topall dur de 50 per rendiment; el client no ho sap i no pot paginar. A WhatsApp, pujar carrega l'historial.
- Severitat: mitjana. Proposta: paràmetre `p_abans timestamptz default null` a l'RPC (`where m.creat_al < coalesce(p_abans, 'infinity')`) i «Carregar missatges anteriors» al capdamunt del registre; `loadMissatges(filId, { abans })` al port sense canviar la signatura pública (paràmetre opcional a `config`).

#### X7 · El padró filtra pel consentiment i el client filtra pel nom en local

- Fitxers: M10 línies 67-109 (`membres_del_poble` vigent: amaga qui no té `consentiment_rgpd_at` i torna buit, en lloc de llançar, a qui no és membre); `src/data/supabase/xat.js` línies 181-184 (crida l'RPC sense `p_cerca` i filtra amb `.ilike('nom', …)` damunt del resultat).
- Evidència: el filtre en local funciona, però l'RPC ja té `p_cerca` i el límit de 100 files es queda al servidor: en un poble de més de 100 persones amb consentiment, qui no siga a la primera pàgina no es troba mai.
- Severitat: baixa ara, mitjana quan el poble cresca. Proposta: passar `p_cerca` a l'RPC i llevar l'`ilike` local.

#### X8 · Els menús de WhatsApp que sí que es poden fer amb el que hi ha

| Gest de WhatsApp | Es pot fer hui | Amb què |
| --- | --- | --- |
| Llista amb avatar, nom, últim missatge, hora, no llegits | sí | `xat_fils_meus` (M03 línies 203-260) ja torna tot; falta pintar `noLlegits` |
| Píndoles Xats i No llegits | sí | categories del Workspace amb `categoryIds` calculats |
| Píndoles Persones, Entitats, IAIES | no | `xat_fils` no té tipus (M02 línies 8-15); `es_ia` és per missatge (M03 línies 61-62) |
| Cerca de xats i de persones | sí | `state.query` del Workspace i `membres_del_poble` amb `p_cerca` |
| Nou xat (triar del padró) | sí | `crea_fil_directe` idempotent (M03 línies 128-192) |
| Bombolles amb cua, dia separador, hora | sí | només presentació |
| Un tic (enviat) | sí | `estatEnviament` |
| Doble tic (entregat, llegit) | no | `xat_lectures` guarda una data per fil i persona (M02 línies 32-37), no per missatge |
| Escrivint… | no | cap canal de presència |
| Adjuntar imatge | parcial | `uploadToStorage` existix; `xat_missatges` només té `text` (M02 línies 24-30) |
| Silenciar, arxivar, fixar | no | cap columna |
| Trucades i vídeo | no | cap transport |
| Info del contacte | no | `xat_fils_meus` torna noms, no identificadors |
| Avatar de l'altra persona a la llista | no | `xat_fils_meus` no torna `avatar_url` |

Els «no» i «parcial» són decisions d'esquema per al Mestre; el codi de §3.6 els deixa el lloc sense fingir-los.

#### X9 · On viu el CSS del Xat, i qui més en depén

- Fitxers: `src/css/modules.css` línies 2185-2638 (tot el bloc `.xat-*`, `.sdp-chat-bubble*` i les seues consultes de mitjans, dins de `@layer legacy`, capa que va de la línia 724 a la 3282); línia 599 (`.xat-header-dropdown`, `@layer components`); línia 3801 (`.xat-header-menu`, fora de tota capa); `src/css/utilities.css` línies 20-46 (`.xat-scroll-area`, `.xat-header-info`, `.xat-header-subtitle`, `.xat-divider`, `.xat-empty`, `.xat-bubble-wrapper*`, `.xat-bubble-content`, `.xat-sender-name`, dins de `@layer components` d'un fitxer que hauria de tindre només utilitats).
- Evidència addicional: `src/components/PedraSeca/molecules/Dropdown.jsx` línia 39 pinta el seu menú amb la classe `xat-header-dropdown`: una molècula canònica depén d'una classe del Xat legat. `XatSection.jsx` línia 500 usa `sdp-chat-bubble--triat` i cap full la defineix. `DevicesSection.jsx` línia 428 també usa `.sdp-chat-bubble`.
- Severitat: mitjana (deute que condiciona la retirada).
- Proposta: el Xat nou usa el prefix `sdp-xat-` (§3.6); en retirar el bloc legat es conserva `.xat-header-dropdown` fins que Dropdown.jsx tinga classe pròpia (`sdp-desplegable__menu`), i les utilitats del Xat ixen d'`utilities.css`.

#### 3.6 Codi proposat del Xat

Estructura (llesca `src/sections/xat/`, cap peça nova a PedraSeca per a no tocar el catàleg fins que siga canònica):

- `XatContext.jsx`: exposa `scopeKey` i `totalNoLlegits`.
- `XatSection.jsx`: prim, es reinicia amb `scopeKey` i pinta `XatWorkspace`.
- `XatWorkspace.jsx`: la graella.
- `XatFitxa.jsx`: la fitxa de la llista.
- `XatConversa.jsx`: capçalera, missatges per dies, compositor.
- `XatNouContacte.jsx`: el padró en un `Dialeg` calaix.
- Secció XAT nova a `src/css/modules.css` (`@layer components`, prefix `sdp-xat-`), i retirada del bloc de les línies 2185-2638 quan la nova vista substituïsca la vella (vegeu X9).

```jsx
// src/sections/xat/XatWorkspace.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, MessageSquareDot, Users } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useXat } from './XatContext';
import { XatFitxa } from './XatFitxa.jsx';
import { XatConversa } from './XatConversa.jsx';
import { XatNouContacte } from './XatNouContacte.jsx';

/* Les píndoles de WhatsApp com a categories: plegada, la columna és el rail
   d'icones de WhatsApp Web. Només les vistes que l'esquema pot omplir (X8):
   «Persones», «Entitats» i «IAIES» entraran quan xat_fils porte tipus. */
const VISTES = Object.freeze([
  { id: 'totes', label: 'Xats', icon: MessageSquare, admet: () => true },
  { id: 'no-llegits', label: 'No llegits', icon: MessageSquareDot, admet: (f) => f.noLlegits > 0 }
]);
/* «Nova conversa» és el nom accessible que App.test.jsx línia 76 espera. */
const ETIQUETES = Object.freeze({
  categories: 'XAT', items: 'CONVERSES', create: 'Nova conversa', creating: 'Obrint…',
  search: 'Cerca un xat', empty: 'Encara no tens cap conversa. Prem «Nova conversa» per a triar amb qui vols parlar.',
  select: 'Tria una conversa de la llista.', all: 'Xats'
});
const ICONES = Object.freeze({ categories: MessageSquare, items: Users });

const aElement = (fil) => ({
  id: String(fil.id),
  categoryIds: VISTES.filter((v) => v.admet(fil)).map((v) => v.id),
  title: fil.name,
  subtitle: fil.lastMessageTime,
  excerpt: fil.lastMessagePreview,
  image: fil.avatar_url || '',
  searchText: fil.searchText,
  updatedAt: fil.createdAtTs ? new Date(fil.createdAtTs).toISOString() : undefined,
  data: fil
});

export function XatWorkspace() {
  const { chatThreads, status, avis, getThreadMessages, sendChatMessage, obriFil, creaFil, cercaMembres, recarrega } = useXat();
  const { threadId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [nouObert, setNouObert] = useState(Boolean(params.get('context')));

  useEffect(() => { obriFil(threadId || null); }, [threadId, obriFil]);

  const model = useMemo(() => ({
    status: status === 'loading' ? 'loading' : 'ready',
    error: avis ? new Error(avis) : null,
    refresh: recarrega,
    itemsComplete: true,
    navigationGroups: [{ id: 'vistes', label: null, options: VISTES.map((v, order) => ({ id: v.id, label: v.label, icon: v.icon, order })) }],
    items: chatThreads.map(aElement)
  }), [chatThreads, status, avis, recarrega]);

  const contextQuery = params.get('context') ? `?context=${encodeURIComponent(params.get('context'))}` : '';
  const onSelectionChange = useCallback(({ itemId }) => {
    if ((itemId ?? null) === (threadId ?? null)) return;
    navigate(itemId ? `/xat/${encodeURIComponent(itemId)}${contextQuery}` : '/xat');
  }, [navigate, threadId, contextQuery]);

  /* «Nova conversa» no crea res: obri el padró. Es torna null perquè el Workspace no espere cap id. */
  const onCreate = useCallback(async () => { setNouObert(true); return null; }, []);

  const obriAmb = useCallback(async (membre) => {
    try {
      const id = membre.fil_id || await creaFil(membre.usuari_id, null);
      setNouObert(false);
      if (id) navigate(`/xat/${encodeURIComponent(id)}${contextQuery}`);
    } catch (error) {
      if (error?.name !== 'AbortError') showToast(error?.message || 'No s’ha pogut obrir la conversa.', 'error');
    }
  }, [creaFil, navigate, contextQuery, showToast]);

  const activeThread = threadId ? chatThreads.find((f) => String(f.id) === threadId) : null;

  return (
    <>
      <UniversalWorkspace
        model={model}
        initialSelection={{ categoryId: 'totes' }}
        selection={{ itemId: threadId ?? undefined }}
        onSelectionChange={onSelectionChange}
        onCreate={onCreate}
        labels={ETIQUETES}
        icons={ICONES}
        tagFilter={false}
        renderItem={({ item, active, onSelect }) => <XatFitxa item={item} active={active} onSelect={onSelect} />}
        renderDetail={() => (activeThread
          ? <XatConversa key={activeThread.id} fil={activeThread} missatges={getThreadMessages(activeThread.id)}
              onEnvia={sendChatMessage} textInicial={params.get('context') || ''} />
          : null)}
        className="sdp-xat"
        listClassName="sdp-xat__llista"
        detailClassName="sdp-xat__conversa"
      />
      <XatNouContacte obert={nouObert} onTanca={() => setNouObert(false)} cercaMembres={cercaMembres} onTria={obriAmb} />
    </>
  );
}
```

```jsx
// src/sections/xat/XatFitxa.jsx — la fila de WhatsApp: avatar 44 px, nom, últim missatge, hora, globus
import { Avatar, Insignia } from '../../components/PedraSeca';

export function XatFitxa({ item, active, onSelect }) {
  const fil = item.data;
  const noLlegits = Number(fil?.noLlegits) || 0;
  return (
    <button type="button" className={`sdp-gestor-fitxa sdp-xat-fitxa${noLlegits ? ' sdp-xat-fitxa--pendent' : ''}`}
      aria-current={active ? 'true' : undefined} onClick={onSelect}
      aria-label={`${item.title}. ${noLlegits ? `${noLlegits} sense llegir. ` : ''}${item.excerpt || ''}`}>
      <Avatar nom={item.title} src={item.image || null} mida="md" />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-xat-fitxa__cap">
          <span className="sdp-gestor-fitxa__titol">{item.title}</span>
          <time className="sdp-xat-fitxa__hora">{item.subtitle}</time>
        </span>
        <span className="sdp-xat-fitxa__peu">
          <span className="sdp-gestor-fitxa__subtitol">{item.excerpt}</span>
          {noLlegits > 0 && <Insignia to="info">{noLlegits}</Insignia>}
        </span>
      </span>
    </button>
  );
}
```

```jsx
// src/sections/xat/XatConversa.jsx — capçalera, dies, bombolles i compositor
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock3, Search, Send, X } from 'lucide-react';
import { Avatar, Boto } from '../../components/PedraSeca';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';

const LOCALE = 'ca-ES';
const DIA_MS = 86400000;
const inici = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
export function etiquetaDia(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dies = Math.round((inici(Date.now()) - inici(d)) / DIA_MS);
  if (dies <= 0) return 'Hui';
  if (dies === 1) return 'Ahir';
  if (dies < 7) return d.toLocaleDateString(LOCALE, { weekday: 'long' });
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'long', year: 'numeric' });
}
/* Agrupa per dia natural: la clau és l'inici del dia, no el text. */
export function perDies(missatges) {
  const grups = [];
  for (const m of missatges) {
    const clau = m.creatAl ? inici(m.creatAl) : 0;
    const ultim = grups[grups.length - 1];
    if (ultim && ultim.clau === clau) ultim.missatges.push(m);
    else grups.push({ clau, etiqueta: m.creatAl ? etiquetaDia(m.creatAl) : '', missatges: [m] });
  }
  return grups;
}

export function XatConversa({ fil, missatges, onEnvia, textInicial = '' }) {
  const [text, setText] = useState(textInicial);
  const [cerca, setCerca] = useState(null); // null = tancada
  const graella = useAppGrid();
  const registre = useRef(null);
  const camp = useRef(null);

  useEffect(() => { registre.current?.scrollTo({ top: registre.current.scrollHeight }); }, [missatges.length, fil?.id]);
  /* El compositor creix amb el text, com a WhatsApp: alçada al DOM, no al JSX. */
  useEffect(() => {
    const el = camp.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const visibles = useMemo(() => {
    const q = String(cerca || '').trim().toLowerCase();
    return q ? missatges.filter((m) => String(m.text || '').toLowerCase().includes(q)) : missatges;
  }, [missatges, cerca]);
  const dies = useMemo(() => perDies(visibles), [visibles]);

  const envia = async (e) => {
    e?.preventDefault();
    const cos = text.trim();
    if (!cos) return;
    setText('');
    try { await onEnvia(fil, cos); }
    catch { setText(cos); }
  };
  const tecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envia(); }
  };

  return (
    <section className="sdp-xat-conversa" aria-label={`Conversa amb ${fil.name}`}>
      <header className="sdp-xat-conversa__cap">
        <button type="button" className="sdp-boto sdp-boto--fantasma d-mobile-only" aria-label="Tornar a les converses"
          onClick={() => graella.setPanellObert('middle')}><ArrowLeft size={24} aria-hidden="true" focusable="false" /></button>
        <Avatar nom={fil.name} src={fil.avatar_url} mida="md" />
        <div className="sdp-xat-conversa__qui">
          <strong>{fil.name}</strong>
          {fil.altresNoms?.length > 1 && <span className="sdp-xat-conversa__membres">{fil.altresNoms.join(', ')}</span>}
        </div>
        <div className="sdp-xat-conversa__accions">
          {cerca === null
            ? <Boto varietat="fantasma" icona={Search} aria-label="Cercar en esta conversa" onClick={() => setCerca('')}>{''}</Boto>
            : (
              <label className="sdp-xat-conversa__cerca">
                <span className="sr-only">Cercar en esta conversa</span>
                <input autoFocus type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cercar…" />
                <button type="button" className="sdp-boto sdp-boto--fantasma" aria-label="Tancar la cerca" onClick={() => setCerca(null)}><X size={20} aria-hidden="true" /></button>
              </label>
            )}
        </div>
      </header>

      <div className="sdp-xat-conversa__registre" ref={registre} role="log" aria-live="polite" aria-relevant="additions">
        {missatges.length === 0 && <p className="sdp-xat-conversa__buit">Cap missatge encara. Escriu el primer.</p>}
        {dies.map((dia) => (
          <div key={dia.clau} className="sdp-xat-dia">
            {dia.etiqueta && <p className="sdp-xat-dia__etiqueta"><span>{dia.etiqueta}</span></p>}
            {dia.missatges.map((m, i) => (
              <article key={m.id ?? `pos-${i}`}
                className={`sdp-xat-bombolla${m.sender === 'me' ? ' sdp-xat-bombolla--meua' : ''}${m.is_ai ? ' sdp-xat-bombolla--ia' : ''}`}>
                {m.sender !== 'me' && fil.altresNoms?.length > 1 && <span className="sdp-xat-bombolla__qui">{m.author}</span>}
                <p className="sdp-xat-bombolla__text">{m.text}</p>
                <span className="sdp-xat-bombolla__meta">
                  <time dateTime={m.creatAl}>{m.time_label}</time>
                  {m.sender === 'me' && (m.estatEnviament === 'pendent'
                    ? <Clock3 size={14} aria-label="Enviant" />
                    : <Check size={14} aria-label="Enviat" />)}
                </span>
              </article>
            ))}
          </div>
        ))}
      </div>

      <form className="sdp-xat-compositor" onSubmit={envia}>
        <label className="sr-only" htmlFor={`xat-text-${fil.id}`}>Escriu un missatge</label>
        <textarea id={`xat-text-${fil.id}`} ref={camp} rows={1} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={tecla} placeholder="Escriu un missatge" enterKeyHint="send" />
        <Boto varietat="primari" tipus="submit" icona={Send} aria-label="Enviar" disabled={!text.trim()}>{''}</Boto>
      </form>
    </section>
  );
}
```

Notes del codi: `Boto` amb `children` buit pinta només la icona i conserva 44 px (Boto.jsx línies 20-26). El «Tornar» en mòbil usa el context de la graella (`setPanellObert('middle')`), com fa UniversalToolbar línia 65. Enviar al Bloc de Notes i seleccionar missatges es conserven de `ChatConversation` actual (línies 402-432 i 487-547) com a mode de selecció; s'han omés ací per llegibilitat, no per retirar-los. L'avatar de l'altra persona serà les inicials fins que `xat_fils_meus` torne `avatar_url` (X8).

```css
/* src/css/modules.css · § XAT (capa components, només tokens) */
@layer components {
  .sdp-xat .sdp-workspace-detail { padding: 0; background: var(--sdp-fons-lectura); }
  .sdp-xat-fitxa { align-items: center; }
  .sdp-xat-fitxa__cap, .sdp-xat-fitxa__peu { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sdp-space-2); }
  .sdp-xat-fitxa__hora { flex: none; font-size: var(--sdp-text-meta); color: var(--sdp-text-suau); }
  .sdp-xat-fitxa--pendent .sdp-gestor-fitxa__titol { font-weight: 700; color: var(--sdp-text-titol); }
  .sdp-xat-fitxa--pendent .sdp-xat-fitxa__hora { color: var(--sdp-accio-text); }

  .sdp-xat-conversa { display: flex; flex-direction: column; min-height: 100%; height: 100%; }
  .sdp-xat-conversa__cap { display: flex; align-items: center; gap: var(--sdp-space-3); min-height: var(--sdp-alt-accio);
    padding: var(--sdp-space-2) var(--sdp-space-4); background: var(--sdp-fons-targeta); border-bottom: 1px solid var(--sdp-vora); }
  .sdp-xat-conversa__qui { display: flex; flex-direction: column; min-width: 0; flex: 1; line-height: var(--sdp-leading-snug); }
  .sdp-xat-conversa__membres { font-size: var(--sdp-text-meta); color: var(--sdp-text-suau); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sdp-xat-conversa__accions { display: flex; align-items: center; gap: var(--sdp-space-1); }
  .sdp-xat-conversa__cerca { display: flex; align-items: center; gap: var(--sdp-space-1); }
  .sdp-xat-conversa__cerca input { min-height: var(--sdp-touch); border: 1px solid var(--sdp-vora-control); border-radius: var(--sdp-radi-pastilla);
    padding: 0 var(--sdp-space-4); background: var(--sdp-fons-app); color: var(--sdp-text-cos); font: inherit; }

  .sdp-xat-conversa__registre { flex: 1; overflow-y: auto; padding: var(--sdp-space-4); display: flex; flex-direction: column; gap: var(--sdp-space-2); }
  .sdp-xat-conversa__buit { margin: auto; color: var(--sdp-text-suau); text-align: center; }
  .sdp-xat-dia { display: flex; flex-direction: column; gap: var(--sdp-space-1); }
  .sdp-xat-dia__etiqueta { align-self: center; margin: var(--sdp-space-3) 0; font-size: var(--sdp-text-meta); color: var(--sdp-text-suau); }
  .sdp-xat-dia__etiqueta span { padding: var(--sdp-space-1) var(--sdp-space-3); border-radius: var(--sdp-radi-pastilla); background: var(--sdp-fons-subtil); }

  .sdp-xat-bombolla { position: relative; max-width: min(75%, 68ch); align-self: flex-start; padding: var(--sdp-space-2) var(--sdp-space-3);
    border-radius: var(--sdp-radi-m); border-top-left-radius: var(--sdp-space-1); background: var(--sdp-fons-targeta); color: var(--sdp-text-cos);
    border: 1px solid var(--sdp-vora); line-height: var(--sdp-leading-body); }
  .sdp-xat-bombolla--meua { align-self: flex-end; border-top-left-radius: var(--sdp-radi-m); border-top-right-radius: var(--sdp-space-1);
    background: var(--sdp-accio-subtil); border-color: var(--sdp-accio-subtil); }
  .sdp-xat-bombolla--ia { border-color: var(--sdp-accent); }
  .sdp-xat-bombolla__qui { display: block; font-size: var(--sdp-text-meta); font-weight: 700; color: var(--sdp-accent-text); }
  .sdp-xat-bombolla__text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .sdp-xat-bombolla__meta { display: flex; justify-content: flex-end; align-items: center; gap: var(--sdp-space-1);
    margin-top: var(--sdp-space-1); font-size: var(--sdp-text-meta); color: var(--sdp-text-suau); }

  .sdp-xat-compositor { display: flex; align-items: flex-end; gap: var(--sdp-space-2); padding: var(--sdp-space-2) var(--sdp-space-4);
    background: var(--sdp-fons-targeta); border-top: 1px solid var(--sdp-vora); }
  .sdp-xat-compositor textarea { flex: 1; min-height: var(--sdp-touch); max-height: 160px; resize: none; padding: var(--sdp-space-3) var(--sdp-space-4);
    border: 1px solid var(--sdp-vora-control); border-radius: var(--sdp-radi-g); background: var(--sdp-fons-app); color: var(--sdp-text-cos);
    font: inherit; font-size: var(--sdp-text-base); line-height: var(--sdp-leading-body); }
  .sdp-xat-compositor textarea:focus-visible { outline: 2px solid var(--sdp-focus); outline-offset: 2px; }
}
```

Tot el CSS usa tokens semàntics (Pedra Seca §2), múltiples de 4 px (§3), 44 px de zona tàctil (§6), cap ombra decorativa (§5) i cap `:has()` (skill sdp-app-grid-shell §4). L'única «ombra» de WhatsApp (la cua de la bombolla) es resol amb radis asimètrics, no amb pseudoelements.

### 4. Explorador del cervell: redisseny

#### E1 · La disposició actual és la contrària de la demanada

- Fitxer: `src/sections/consola/mapa/ExploradorMapa.jsx` línies 112-183.
- Evidència: barra amb un `Camp` «Filtra per nom» de fila sencera (115-119), graf (127-139), paràgraf de llegenda «Cada punt és una peça del Mas…» (141-147) i els tres plegables de filtres davall del graf (148-182). El botó «Filtres» de la barra fa scroll cap avall per a obrir-los (103-110).
- Severitat: alta (és l'encàrrec). Font de veritat: petorreta §Instrucció punt 3.
- Proposta: quadre de comandament a dalt, graf a baix ocupant la resta, sense llegenda. Codi a §4.5.

#### E2 · El panell «fatal» és l'inspector lateral de BrainGraph, que la Wiki també usa

- Fitxer: `src/components/universal/graph/BrainGraph.jsx` línies 577-603 (aside amb títol, `select` de tots els nodes, detall i veïns) i 604-611 (controls flotants); CSS a `src/css/modules.css` línies 3664-3687.
- Evidència: l'inspector i els controls són fills fixos del component universal. Canviar-los a pèl canvia també el graf de la Wiki (`grafDeLaWiki`, línies 166-231; muntat a WikiDePobleSection.jsx línies 69-74 en una branca que el model ja no obri) i els 12 tests de BrainGraph.test.jsx, que depenen del `select` (test «explora metadades dels tres tipus amb teclat», línies 67-74) i dels títols dels botons (línies 160-169).
- Severitat: alta (risc de trencar la Wiki mentre s'arregla l'Explorador). Font de veritat: Llei del Píxel (sdp-workflow, lliçó 260923).
- Proposta: BrainGraph guanya quatre props amb valors per defecte iguals al comportament actual (`inspector='lateral'`, `controls='propis'`, `selectedId` no controlat, `onSelectionChange` opcional) i una API imperativa per `ref` (`apropa`, `allunya`, `centra`, `pausa`, `repren`, `selecciona`). La Wiki no passa cap prop nova i no canvia. L'Explorador demana `inspector="cap"` i `controls="cap"` i pinta el detall pel seu compte.

#### E3 · Un detall de node que no robe espai al graf

- Proposta: en clicar un node, una targeta de detall superposada al marc del graf (`aside` no modal, cantó inferior dret en pantalla ampla; full inferior en estret), amb el nom, el tipus com a `Insignia`, la font en `Mono`, les relacions «Llig, Escriu, Crida o governa, El criden» com a botons que tornen a seleccionar, i els avisos. Es tanca amb el botó o amb Escape. No es fa amb `Dialeg` perquè `showModal()` bloquejaria el graf mentre s'explora (Dialeg.jsx línia 37), i explorar és anar de node en node. Per al teclat, el `Selector` «Vés a la peça» viu al quadre de comandament.
- `requires_human_decision: true` entre superposició (recomanada) i calaix modal a la dreta.

#### E4 · On viu el CSS de l'Explorador, i què més hi ha al voltant

- Fitxers: `src/css/modules.css` línies 3942-4153 (tot el bloc `.sdp-explorador*`, `@layer components`); línies 824-850 (`.sdp-brain-graph-*` bàsic, `@layer legacy`) i 3653-3702 (inspector i controls, `@layer components`; `.sdp-wiki-graf` a 3697-3701, que l'Explorador reaprofita com a classe del marc del graf, ExploradorMapa.jsx línia 127).
- Rastres: `src/sections/consola/mapa/MapaConsola.jsx.tmp` existix i és buit (empremta `e3b0c442…` a l'inventari del torn). `grafMapa.js` línia 152 cita `explorador.css` i `App.jsx` línia 300 cita `navegacio.css`: cap dels dos existix (index.css només cus base, sdp, wiki, layout, components, modules, AppGridShell.css i PerfilShell.css). `src/sections/README.md` línia 35 descriu fitxers del Xat (`chatSeed.js`, `chatContent.js`, `chatRuntime.js`) que no existixen.
- Severitat: baixa. Proposta: esborrar el `.tmp` per lease; corregir els tres comentaris.

#### 4.5 Codi proposat de l'Explorador

```jsx
// src/components/universal/graph/BrainGraph.jsx — diferència essencial (la resta no canvia)
import React, { forwardRef, useImperativeHandle, /* … */ } from 'react';

const BrainGraph = forwardRef(function BrainGraph({
  onNodeClick, className = '', graf, estil = ESTIL_WIKI, forces, fletxes = false, textos = TEXTOS_WIKI, renderDetall,
  enquadra = false,
  inspector = 'lateral',   // 'lateral' (Wiki, com fins ara) | 'cap' (l'amfitrió pinta el detall)
  controls = 'propis',     // 'propis' (botons flotants) | 'cap' (l'amfitrió els té al seu quadre)
  selectedId: selectedIdProp, onSelectionChange
}, ref) {
  const [selectedIdIntern, setSelectedIdIntern] = useState('');
  const controlat = selectedIdProp !== undefined;
  const selectedId = controlat ? selectedIdProp : selectedIdIntern;
  const setSelectedId = useCallback((id) => {
    if (!controlat) setSelectedIdIntern(id);
    onSelectionChange?.(id);
  }, [controlat, onSelectionChange]);
  /* … tot el cos actual, amb setSelectedId en lloc del setter d'useState … */
  useImperativeHandle(ref, () => ({
    apropa: handleZoomIn, allunya: handleZoomOut, centra: handleReset,
    pausa: () => setIsSimulationActive(false), repren: () => setIsSimulationActive(true),
    selecciona: setSelectedId, veins: () => neighbours
  }), [handleZoomIn, handleZoomOut, handleReset, setSelectedId, neighbours]);

  return (
    <div ref={containerRef} className={`sdp-brain-graph-wrapper ${className}`}>
      <canvas /* igual */ />
      {inspector === 'lateral' && (<aside className="sdp-brain-graph-inspector" aria-label={textos.inspector}>{/* igual que ara */}</aside>)}
      {controls === 'propis' && (<div className="sdp-brain-graph-controls" role="group" aria-label="Controls del graf">{/* igual que ara */}</div>)}
    </div>
  );
});
export default BrainGraph;
```

`handleZoomIn`, `handleZoomOut` i `handleReset` passen a `useCallback` perquè la `ref` siga estable. Amb els valors per defecte, el DOM és idèntic a l'actual: els 12 tests de BrainGraph.test.jsx no canvien.

```jsx
// src/sections/consola/mapa/ExploradorMapa.jsx — quadre de comandament dalt, graf baix, detall superposat
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Maximize, Pause, Play, RotateCcw, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Boto, Camp, Insignia, Interruptor, PillToggle, Selector } from '../../../components/PedraSeca';
import BrainGraph from '../../../components/universal/graph/BrainGraph';
import { Mono } from '../peces.jsx';
import { TIPUS_NODE, CONFIANCES } from './contracteMapa.js';
import { ESTIL_MAPA, FORCES, NOMS_CONFIANCA, NOMS_TIPUS, TEXTOS_EXPLORADOR, etiquetaNode, filtresInicials, grafDelMapa, relacionsDe } from './grafMapa.js';

const OPCIONS_FORCES = Object.freeze([{ valor: 'compacte', text: 'Compacte' }, { valor: 'normal', text: 'Normal' }, { valor: 'espaiat', text: 'Espaiat' }]);
const DENSITAT_INICIAL = 'normal';
const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info' });
const plural = (n, un, molts) => `${n} ${n === 1 ? un : molts}`;
const encesos = (grup) => Object.values(grup).filter(Boolean).length;

function comptaCanvis(filtres, densitat) {
  const inici = filtresInicials();
  const diferents = (grup) => Object.keys(inici[grup]).filter((clau) => filtres[grup][clau] !== inici[grup][clau]).length;
  return diferents('tipus') + diferents('confiances') + Number(filtres.orfes !== inici.orfes)
    + Number(filtres.fletxes !== inici.fletxes) + Number(densitat !== DENSITAT_INICIAL);
}

/* Un menú del quadre: <details> natiu (Baseline 2022, sense Popover API), amb el
   resum estilat com a botó de 44 px. Només un d'obert alhora. */
function Menu({ titol, estat, obert, onObre, children }) {
  return (
    <details className="sdp-explorador__menu" open={obert} onToggle={(e) => onObre(e.currentTarget.open)}>
      <summary className="sdp-boto sdp-boto--secundari">
        <span>{titol}</span><span className="sdp-explorador__estat">{estat}</span>
        <ChevronDown size={18} aria-hidden="true" focusable="false" />
      </summary>
      <div className="sdp-explorador__opcions">{children}</div>
    </details>
  );
}

function Relacions({ arestes, cap, onVes }) {
  if (!arestes.length) return <dd>—</dd>;
  return (
    <dd>
      <ul className="sdp-explorador__veins">
        {arestes.map((a) => (
          <li key={`${a.de}|${a.a}|${a.tipus}`}>
            <button type="button" className="sdp-explorador__vei" onClick={() => onVes(a[cap])}>
              {etiquetaNode({ id: a[cap] })}<span className="sdp-explorador__tipus-aresta"> · {a.tipus}, {a.confianca}</span>
            </button>
          </li>
        ))}
      </ul>
    </dd>
  );
}

function DetallNode({ mapa, node, onVes, onTanca }) {
  const r = relacionsDe(mapa, node.id);
  const tanca = useRef(null);
  useEffect(() => { tanca.current?.focus(); }, [node.id]);
  return (
    <aside className="sdp-explorador__detall" aria-label="Detall de la peça" onKeyDown={(e) => { if (e.key === 'Escape') onTanca(); }}>
      <header className="sdp-explorador__detall-cap">
        <Insignia to="neutre">{NOMS_TIPUS[node.type] ?? node.type}</Insignia>
        <h3>{node.label}</h3>
        <button ref={tanca} type="button" className="sdp-boto sdp-boto--fantasma" aria-label="Tancar el detall" onClick={onTanca}>
          <X size={20} aria-hidden="true" focusable="false" />
        </button>
      </header>
      <dl className="sdp-explorador__dades">
        <dt>Font</dt><dd>{node.font ? <Mono>{node.font}</Mono> : '—'}</dd>
        <dt>Llig</dt><Relacions arestes={r.llig} cap="a" onVes={onVes} />
        <dt>Escriu</dt><Relacions arestes={r.escriu} cap="a" onVes={onVes} />
        <dt>Crida o governa</dt><Relacions arestes={r.crida} cap="a" onVes={onVes} />
        <dt>El criden</dt><Relacions arestes={r.elCriden} cap="de" onVes={onVes} />
        {node.type === 'skill' && r.opaca && <><dt>Entrades i eixides</dt><dd>caixa opaca: no declara què llig ni què produïx</dd></>}
        <dt>Avisos</dt>
        <dd>{r.avisos.length ? r.avisos.map((a) => <Insignia key={a.codi} to={TO_SEVERITAT[a.severitat]}>{a.codi}</Insignia>) : 'cap'}</dd>
      </dl>
    </aside>
  );
}

export function ExploradorMapa({ mapa }) {
  const idCerca = useId();
  const graf = useRef(null);
  const [filtres, setFiltres] = useState(filtresInicials);
  const [densitat, setDensitat] = useState(DENSITAT_INICIAL);
  const [cercaOberta, setCercaOberta] = useState(false);
  const [menuObert, setMenuObert] = useState(null);       // 'tipus' | 'confianca' | null
  const [enPausa, setEnPausa] = useState(false);
  const [seleccio, setSeleccio] = useState('');

  const dades = useMemo(() => grafDelMapa(mapa, filtres), [mapa, filtres]);
  const commuta = (grup, clau) => setFiltres((f) => ({ ...f, [grup]: { ...f[grup], [clau]: !f[grup][clau] } }));
  const posa = (clau, valor) => setFiltres((f) => ({ ...f, [clau]: valor }));
  const perTipus = useMemo(() => {
    const m = new Map();
    for (const n of mapa.nodes) m.set(n.tipus, (m.get(n.tipus) || 0) + 1);
    return m;
  }, [mapa]);
  const canvis = comptaCanvis(filtres, densitat);
  const restableix = () => { setFiltres(filtresInicials()); setDensitat(DENSITAT_INICIAL); };
  const node = useMemo(() => dades.nodes.find((n) => n.id === seleccio) || null, [dades, seleccio]);
  const ves = useCallback((id) => { setSeleccio(id); graf.current?.selecciona(id); }, []);
  const obreMenu = (nom) => (obert) => setMenuObert(obert ? nom : (menuObert === nom ? null : menuObert));

  return (
    <section className="sdp-explorador">
      <div className="sdp-explorador__quadre" role="toolbar" aria-label="Quadre de comandament del graf">
        <div className="sdp-explorador__grup" role="search">
          <button type="button" className="sdp-boto sdp-boto--secundari" aria-expanded={cercaOberta} aria-controls={idCerca}
            aria-label={cercaOberta ? 'Tancar la cerca' : 'Cercar una peça pel nom'} onClick={() => setCercaOberta((v) => !v)}>
            {cercaOberta ? <X size={20} aria-hidden="true" focusable="false" /> : <Search size={20} aria-hidden="true" focusable="false" />}
          </button>
          {cercaOberta && (
            <Camp etiqueta="Nom de la peça" className="sdp-explorador__cerca sr-only-etiqueta">
              <input id={idCerca} autoFocus type="search" className="sdp-control" value={filtres.cerca}
                placeholder="Cerca una peça i els seus veïns" onChange={(e) => posa('cerca', e.target.value)} />
            </Camp>
          )}
        </div>
        <Menu titol="Tipus" estat={`${encesos(filtres.tipus)} de ${TIPUS_NODE.length}`} obert={menuObert === 'tipus'} onObre={obreMenu('tipus')}>
          {TIPUS_NODE.map((t) => (
            <Interruptor key={t} etiqueta={<><span className="sdp-explorador__punt" data-tipus={t} aria-hidden="true" />{`${NOMS_TIPUS[t]} (${perTipus.get(t) || 0})`}</>}
              actiu={filtres.tipus[t]} onCanvi={() => commuta('tipus', t)} />
          ))}
          <Interruptor etiqueta="Òrfens: peces sense cap relació" actiu={filtres.orfes} onCanvi={(v) => posa('orfes', v)} />
        </Menu>
        <Menu titol="Confiança" estat={`${encesos(filtres.confiances)} de ${CONFIANCES.length}`} obert={menuObert === 'confianca'} onObre={obreMenu('confianca')}>
          {CONFIANCES.map((c) => <Interruptor key={c} etiqueta={NOMS_CONFIANCA[c]} actiu={filtres.confiances[c]} onCanvi={() => commuta('confiances', c)} />)}
        </Menu>
        <PillToggle etiqueta="Densitat del graf" opcions={OPCIONS_FORCES} valor={densitat} onCanvi={setDensitat} className="sdp-explorador__densitat" />
        <Interruptor etiqueta="Fletxes" actiu={filtres.fletxes} onCanvi={(v) => posa('fletxes', v)} className="sdp-explorador__fletxes" />
        <div className="sdp-explorador__grup" role="group" aria-label="Vista del graf">
          <Boto varietat="secundari" icona={enPausa ? Play : Pause} aria-label={enPausa ? 'Reprendre la simulació' : 'Pausar la simulació'}
            onClick={() => { setEnPausa((p) => { (p ? graf.current?.repren : graf.current?.pausa)?.(); return !p; }); }}>{''}</Boto>
          <Boto varietat="secundari" icona={ZoomIn} aria-label="Apropar" onClick={() => graf.current?.apropa()}>{''}</Boto>
          <Boto varietat="secundari" icona={ZoomOut} aria-label="Allunyar" onClick={() => graf.current?.allunya()}>{''}</Boto>
          <Boto varietat="secundari" icona={Maximize} aria-label="Centrar el graf" onClick={() => graf.current?.centra()}>{''}</Boto>
          {(canvis > 0 || filtres.cerca) && <Boto varietat="fantasma" icona={RotateCcw} onClick={restableix}>Restablir</Boto>}
        </div>
        <Camp etiqueta="Vés a la peça" className="sdp-explorador__ves sr-only-etiqueta">
          <Selector value={seleccio} onChange={(e) => ves(e.target.value)}
            opcions={[{ valor: '', etiqueta: 'Vés a la peça…' }, ...dades.nodes.map((n) => ({ valor: n.id, etiqueta: n.label }))]} />
        </Camp>
        <p className="sdp-explorador__recompte" role="status">{plural(dades.nodes.length, 'peça', 'peces')} · {plural(dades.links.length, 'relació', 'relacions')}</p>
      </div>

      <div className="sdp-wiki-graf sdp-explorador__graf">
        <BrainGraph ref={graf} graf={dades} estil={ESTIL_MAPA} forces={FORCES[densitat]} fletxes={filtres.fletxes} enquadra
          textos={TEXTOS_EXPLORADOR} inspector="cap" controls="cap" selectedId={seleccio} onSelectionChange={setSeleccio} />
        {node && <DetallNode mapa={mapa} node={node} onVes={ves} onTanca={() => ves('')} />}
        {dades.nodes.length === 0 && (
          <div className="sdp-explorador__buit" role="status">
            <p>{filtres.cerca.trim() ? `Cap peça casa amb «${filtres.cerca.trim()}» amb estos filtres.` : 'Cap peça passa estos filtres.'}</p>
            <Boto varietat="secundari" icona={RotateCcw} onClick={restableix}>Restablir filtres</Boto>
          </div>
        )}
      </div>
    </section>
  );
}
```

Dues coses que el codi anterior no oculta: `Camp` obliga a tindre etiqueta visible (formulari.jsx línies 10-13); ací s'amaga amb `sr-only-etiqueta` només perquè la lupa ja és l'etiqueta visual, i cal decidir si Pedra Seca ho admet (`requires_human_decision: true`). `Selector` exigix viure dins de `Camp` (línia 53): per això el «Vés a la peça» hi va embolcallat.

```css
/* src/css/modules.css · § EXPLORADOR (substituïx el bloc de les línies 3942-4153).
   Les nou regles .sdp-explorador__punt[data-tipus="…"] es conserven byte a byte:
   grafMapa.test.js línies 224-230 les llig del full i les compara amb ESTIL_MAPA. */
@layer components {
  .sdp-explorador { display: flex; flex-direction: column; gap: var(--sdp-space-3); }
  .sdp-explorador__quadre { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sdp-space-2);
    padding: var(--sdp-space-2); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-g); background: var(--sdp-fons-targeta); }
  .sdp-explorador__grup { display: flex; align-items: center; gap: var(--sdp-space-1); }
  .sdp-explorador__cerca .sdp-control { min-width: 16rem; }
  .sr-only-etiqueta .sdp-camp__etiqueta { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .sdp-explorador__menu { position: relative; }
  .sdp-explorador__menu summary { list-style: none; display: inline-flex; align-items: center; gap: var(--sdp-space-2); cursor: pointer; }
  .sdp-explorador__menu summary::-webkit-details-marker { display: none; }
  .sdp-explorador__estat { color: var(--sdp-text-suau); font-size: var(--sdp-text-meta); }
  .sdp-explorador__menu .sdp-explorador__opcions { position: absolute; top: calc(100% + var(--sdp-space-1)); left: 0; z-index: 2;
    min-width: 18rem; display: flex; flex-direction: column; gap: var(--sdp-space-1); padding: var(--sdp-space-3);
    border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-m); background: var(--sdp-fons-elevat); box-shadow: var(--sdp-ombra-2); }
  .sdp-explorador__recompte { margin: 0 0 0 auto; color: var(--sdp-text-suau); font-size: var(--sdp-text-small); font-variant-numeric: tabular-nums; }
  .sdp-explorador__graf { position: relative; height: clamp(26rem, 72vh, 60rem); height: clamp(26rem, 72svh, 60rem); border: 0; border-radius: var(--sdp-radi-g); overflow: hidden; }
  .sdp-explorador__graf > .sdp-brain-graph-wrapper { min-height: 0; }
  .sdp-explorador__buit { position: absolute; inset: 0; z-index: 1; display: grid; place-content: center; justify-items: center;
    gap: var(--sdp-space-3); padding: var(--sdp-space-6); text-align: center; pointer-events: none; }
  .sdp-explorador__buit > * { margin: 0; pointer-events: auto; }
  .sdp-explorador__buit > p { max-width: 36ch; color: var(--sdp-text-cos); font-size: var(--sdp-text-base); line-height: 1.6; }
  .sdp-explorador__detall { position: absolute; right: var(--sdp-space-4); bottom: var(--sdp-space-4); z-index: 3;
    width: min(360px, calc(100% - 2 * var(--sdp-space-4))); max-height: calc(100% - 2 * var(--sdp-space-4)); overflow: auto;
    padding: var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-g); background: var(--sdp-fons-elevat); box-shadow: var(--sdp-ombra-3); }
  .sdp-explorador__detall-cap { display: flex; align-items: center; gap: var(--sdp-space-2); }
  .sdp-explorador__detall-cap h3 { flex: 1; margin: 0; font-size: var(--sdp-text-h6); line-height: var(--sdp-leading-tight); }
  .sdp-explorador__veins { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--sdp-space-1); }
  .sdp-explorador__vei { min-height: var(--sdp-touch); text-align: left; background: none; border: 0; color: var(--sdp-accio-text); font: inherit; cursor: pointer; }
  .sdp-explorador__tipus-aresta { color: var(--sdp-text-suau); font-size: var(--sdp-text-meta); }
  .sdp-explorador__punt { display: inline-block; width: 0.75rem; height: 0.75rem; margin-inline-end: var(--sdp-space-2); border-radius: var(--sdp-radi-pastilla); }
  .sdp-explorador__punt[data-tipus="skill"] { background: var(--sdp-accent); }
  .sdp-explorador__punt[data-tipus="ruta"] { background: var(--sdp-accio); }
  .sdp-explorador__punt[data-tipus="plantilla"] { background: var(--sdp-exit); }
  .sdp-explorador__punt[data-tipus="agent"] { background: var(--sdp-text-titol); }
  .sdp-explorador__punt[data-tipus="hook"] { background: var(--sdp-avis); }
  .sdp-explorador__punt[data-tipus="tasca"] { background: var(--sdp-accio-text); }
  .sdp-explorador__punt[data-tipus="porta"] { background: var(--sdp-error); }
  .sdp-explorador__punt[data-tipus="script"] { background: var(--sdp-text-suau); }
  .sdp-explorador__punt[data-tipus="document"] { background: var(--sdp-vora-forta); }
  @media (max-width: 720px) {
    .sdp-explorador__detall { right: 0; bottom: 0; left: 0; width: auto; max-height: 60%; border-radius: var(--sdp-radi-g) var(--sdp-radi-g) 0 0; }
  }
}
```

Les dues ombres (`--sdp-ombra-2`, `--sdp-ombra-3`) són funcionals: eleven un menú flotant i una targeta superposada damunt del graf, exactament el cas que Pedra Seca §5 admet. La regla `.sdp-wiki-graf` (línies 3697-3701) no es toca: és de la Wiki.

#### 4.6 Proves que el redisseny toca

- `src/sections/consola/mapa/grafMapa.test.js` importa i renderitza `ExploradorMapa` (línies 7, 161, 181 i 209) i llig `src/css/modules.css` per a comparar les nou regles `.sdp-explorador__punt[data-tipus="…"]` amb `ESTIL_MAPA.colors` (línies 224-230). El CSS de §4.5 les conserva; les proves que renderitzen el component s'han de revisar contra el DOM nou (lupa en lloc de camp visible, quadre abans del graf).
- `src/sections/consola/ConsolaSection.test.jsx` (línies 144-182, 191 i 235) i `ConsolaSection.navegacio.test.jsx` arriben a /consola/explorador amb `BrainGraph` simulat: canviar els rètols del quadre pot afectar-les.
- `BrainGraph.test.jsx` (12 proves) no canvia amb els valors per defecte; s'hi afigen tres casos: `inspector="cap"` no pinta l'aside; `controls="cap"` no pinta els botons; la `ref` apropa i centra.
- Prova nova `ExploradorMapa.test.jsx`: el quadre precedix el graf al DOM; no existix cap text «Cada punt és una peça»; la lupa obri i tanca la cerca; apagar un tipus lleva els seus nodes; el `Selector` selecciona i obri el detall; Escape el tanca; Restablir torna a l'inici.
- Del Xat: `App.test.jsx` línia 76 espera el botó «Nova conversa» a la ruta per defecte (es conserva el nom accessible); `ConnectarSection.test.jsx` línies 38 i 44 esperen `/xat/new-thread` i `/xat?context=…` (no canvien); `XatSection.test.jsx` s'ha de reescriure contra el Workspace; `allLoaders.test.jsx` compta els espècimens del catàleg (EspecimenXat es queda, amb les classes noves).

### 5. Portes que el codi proposat ha de passar (i com)

| Porta | Què vigila | Com el codi hi passa |
| --- | --- | --- |
| tractor-enxufe E1, E2 | cap import de supabase fora del port; contracte i port sincronitzats | `federacio.js` només s'importa des de `supabase/index.js`; cada mètode nou és a CAPACITATS i delegat al port |
| tractor-cataleg C1, C2 | cap component nou a PedraSeca sense registre i espècimen | les peces del Xat i de l'Explorador viuen a les seues llesques, no a PedraSeca |
| design_guard | cap `style=` a JSX, cap hex cru, fonts de 16 px, 44 px tàctils | l'alçada del compositor es posa al DOM (com AppGridShell línies 134-141); tot en tokens |
| tractor-persistencia L2 | cap localStorage fora de storage.js | la preferència d'identitat ja passa per `setVal` (IdentitatContext línies 28-37) |
| tractor-rls R2, R3, R6 | RLS activa, cap `using (true)`, `search_path` a les funcions definer | tota columna nova va amb política; les RPC noves (X2, X6) copien el patró de M03 |
| Vitest | 738 proves | els valors per defecte de BrainGraph i el format d'`actorKey` no canvien |

### 6. Pla d'acció progressiu i comprovable

**F0 · Consens (este torn).** La IAIA MarIA incorpora §0 i les decisions D1-D11 al Pla; Codex contrasta. El Mestre bolca l'esquema viu (I11). Cap codi.

**F1 · Identitat (dos torns amb lease de codi).**
1. Onboarding: `confirmationEmail` (I4). Prova nova amb `registerWithPassword` que torna sense sessió.
2. `SelectorIdentitat` a la barra taronja de Notes i del Perfil (I1). Prova: canviar `actorKey` reinicia Notes (NotesDataContext.test ja ho cobrix).
3. `author_org_id` al DTO d'enviament (I2), sense migració. Prova: content.test amb actor entitat espera `author_org_id` al cos del POST.
4. Migració curta: grants i `list_my_organizations` amb `logo_url` (I12); `on delete set null` a `author_org_id` (I13). `npm run porta:rls` en verd.
5. `PerfilEditor` i PerfilShell amb «Fitxa» i «Compte» (I8, I9). Prova: PerfilShell.test (render de la fitxa amb DocumentEditor, desat per camp, avís quan la columna no existix).
6. Diàleg de creació d'organització (I10).
Portes: `npx vitest run src/sections/profile src/sections/onboarding src/data/supabase`, `npm run porta:enxufe`, `npm run porta:rls`.

**F2 · Federació (un torn, després del bolcat de l'esquema viu).** Capacitat `federacio` completa (els tres traductors alineats), `node` i `actorRealm` a IdentitatContext, ConnexionsSection darrere de `teCapacitat('federacio')`. Cap transport remot. Portes: `npm run porta:enxufe`, `npm run porta:rls`, Vitest de la llesca.

**F3 · Xat (dos torns).** `scopeKey` al context (X3); XatWorkspace, XatFitxa, XatConversa, XatNouContacte i CSS nou (X1, X2, X4); `p_cerca` a l'RPC (X7); publicació Realtime si el Mestre ho autoritza (X5); paginació (X6) i `altres_ids` amb `avatar_url` a `xat_fils_meus` (X2, X8) com a migració curta; retirada del bloc legat conservant `.xat-header-dropdown` (X9). Portes: `npx vitest run src/sections/xat src/app`, `npm run porta:design-guard`, navegador a 3340 en ample, mitjà i estret.

**F4 · Explorador (un torn).** Props i `ref` a BrainGraph (E2), ExploradorMapa nou (E1, E3), CSS, esborrat del `.tmp` i correcció dels comentaris (E4), proves (§4.6). Portes: `npx vitest run src/components/universal/graph src/sections/consola`, navegador: la Wiki idèntica píxel a píxel.

### 7. Decisions per al Mestre

| Id | Decisió | Recomanació |
| --- | --- | --- |
| D1 | Persistència de sessió (I3) | (a) Sollutia entrega la sessió; (b) només en mode autònom, darrere de bandera |
| D2 | Columnes noves de perfil: `lema`, `presentacio_html`, `hero_url` (I9) | migració additiva, grants de columna i RLS del propietari |
| D3 | Versió de la política RGPD per a re-consentir (I5) | la del text de /legal vigent; el trigger la té fixa a `'v1'` |
| D4 | Publicació Realtime de `xat_missatges` (X5) | sí, descomentant el bloc de M03 i revisant Realtime RLS al panell |
| D5 | Trucades, vídeo, silenciar, arxivar (X2, X8) | fora de la interfície fins que hi haja transport o columna |
| D6 | Lectura per missatge (doble tic) | taula de lectures per missatge només si es vol la paritat; si no, un tic i prou |
| D7 | Detall del node: superposició o calaix modal (E3) | superposició |
| D8 | Etiqueta amagada a la cerca de l'Explorador (§4.5) | admetre `sr-only-etiqueta` només quan la icona és l'etiqueta |
| D9 | Bolcat de l'esquema viu al repositori (I11) | sí, abans de qualsevol codi de federació |
| D10 | `author_org_id` amb `on delete set null` i grants de `logo_url` (I12, I13) | sí, migració curta |
| D11 | Alta amb Google d'una persona nova (I14) | provar en staging; si falla, poble per defecte al trigger |
| D12 | Exportació i baixa amb quarantena (I15): termini de la quarantena i destí de les publicacions orfes | 30 dies; publicacions anònimes conservades, notes esborrades |
| D13 | Barra blava dalt i eines sticky (I16): Notes i Perfil alhora, o només Perfil | alhora, amb `posicioEines` per defecte intacte fins a l'ordre |

### 8. Higiene del torn i del cervell

- El torn `torn_72024433` porta un rebut (`a49c748d`) per a `260926_1235_prompt_identitat_fable.md`, fitxer que no existix a l'Escriptori. `checkTurn` (turns.mjs línies 151-167) inclou tots els fitxers dels rebuts i marcarà «Document eliminat sense relleu»: este torn no podrà arribar a `closed`. Cal un `handoff` o un torn nou per a la implementació. Severitat mitjana, `requires_human_decision: true`.
- El torn té `scope: documents`: qualsevol canvi a `src/` el faria fallar («Canvis de codi fora de l'abast documental», línia 157). Coherent amb l'AFK; la implementació necessita torn `code`.
- L'índex de l'Escriptori ancora `01_produccio/260925_1550_briefing_ui_editor_claude`, però l'inventari del torn situa eixe fitxer a `_wiki_de_poble/01_produccio/`, fora de l'Escriptori: una àncora que apunta al no-res o un fitxer fora de lloc. Severitat baixa.
- `supabase/README.md` acaba la seua llista a la migració 260914_0100 i diu que la llavor ompli `chat_threads`, taula que cap migració crea. Cinc parells de migracions comparteixen prefix de versió (260908 quatre voltes; 260912, 260914, 260916 i 260920 dues), cosa que l'ordre alfabètic manual tolera i `supabase db push` rebutjaria. Severitat baixa; deute documentat, no bloqueja.
- El hook `hooks-local.mjs` (línies 84-90) deixa passar `SendMessage` però no `SubagentHandback`: els subagents Explore no poden tornar el seu informe pel canal normal i el reenvien per missatge. Ha funcionat, però costa: 905 k tokens i 178 crides el primer, perquè sense `Glob`, `Grep` ni `Bash` va haver de llegir `.git/index` per a saber quins fitxers existixen. Severitat mitjana per al pressupost de tokens.
- Millora del prompt local (petició de la petorreta §7.4): afegir una secció «Directives afegides durant el torn» que l'autor omple quan interromp pel xat, perquè les ordres no visquen només a la memòria d'una IA; exigir la superfície de fitxers de l'encàrrec (lliçó 260923 «l'abast es definix per superfície»); i que la fila «Model IA» porte el nom real del model, no un àlies comercial.

#### 1.6 Codi proposat d'identitat i perfil

```jsx
// src/sections/onboarding/OnboardingSection.jsx — diferència (I4)
const [confirmationEmail, setConfirmationEmail] = useState('');
const handleRegister = async (fields) => {
  setBusyStep('register'); setError('');
  try {
    const resultat = await registerWithPassword(fields.email, fields.password,
      { full_name: fields.name, avatar_url: fields.avatar_url, accepta_rgpd: Boolean(fields.rgpd), tenant_id: externalConfig.tenantId }, externalConfig);
    if (resultat?.access_token) {
      showToast('Compte creat. Benvinguda al Mas.', 'success');
      window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    } else {
      setConfirmationEmail(String(fields.email || '').trim().toLowerCase());
    }
  } catch (err) { setError(readableBackendError(err)); }
  finally { setBusyStep(null); }
};
// … i a la vista:
<RegistrationStep isBusy={busyStep === 'register'} error={error} confirmationEmail={confirmationEmail}
  onRegister={handleRegister} onLogin={handleLogin} onClearError={() => setError('')} />
```

```jsx
// src/sections/profile/SelectorIdentitat.jsx — l'interruptor de la identitat dual (I1)
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { Avatar, Dropdown, DropdownItem } from '../../components/PedraSeca';

export function SelectorIdentitat() {
  const { identitats, actor, setActor } = useIdentitat();
  if (identitats.length < 2) return null;
  return (
    <Dropdown right minWidth="280px" trigger={(
      <button type="button" className="btn-icon-orange" aria-label={`Actues com a ${actor.nom}. Canviar identitat`} title="Canviar identitat">
        <Avatar nom={actor.nom} src={actor.avatar} mida="xs" />
      </button>
    )}>
      {identitats.map((i) => (
        <DropdownItem key={`${i.tipus}:${i.id}`} onClick={() => setActor(i.tipus, i.id)}
          className={i.activa ? 'sdp-dropdown-item--actiu' : ''} icon={<Avatar nom={i.nom} src={i.avatar} mida="xs" />}>
          {i.nom}{i.rol !== 'persona' ? ` · ${i.rol}` : ''}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
```

```js
// src/data/supabase/content.js — diferència (I2): l'actor viatja com a author_org_id
export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  /* … igual fins a `payload` … */
  const authorOrgId = submission?.actor?.tipus === 'entitat' && submission.actor.id ? String(submission.actor.id) : null;
  await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [{ id, tenant_id: tenantId,
      owner_user_id: ownerUserId, author_org_id: authorOrgId, section_id: sectionId, title: stored.title,
      description: stored.description, payload, created_at: createdAt }] });
  return { ...stored, authorOrgId };
}
// MurContext.sendSectionSubmission afig `actor` del context d'identitat abans de cridar el port:
//   appendSectionSubmissionNetworkOnly({ ...sub, actor }, config)
```

```jsx
// src/sections/profile/PerfilEditor.jsx — la fitxa d'una identitat és una nota (I8, I9)
import { useCallback, useMemo, useState } from 'react';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { usePerfil } from './PerfilContext.jsx';
import { SelectorIdentitat } from './SelectorIdentitat.jsx';

/* Camp de l'editor → columna real (I9). `null` = encara no té columna: es
   guarda en local i es diu en pantalla, mai en silenci. */
const CAMPS = Object.freeze({
  persona: Object.freeze({ title: 'full_name', subtitle: null, lead: 'bio', content: null, logoImage: 'avatar_url', heroImage: null }),
  organitzacio: Object.freeze({ title: 'name', subtitle: 'lema', lead: 'description', content: null, logoImage: 'logo_url', heroImage: null })
});

export function PerfilEditor({ identitat }) {
  const { guardarCampPerfil, pujaMitja } = usePerfil();
  const { showToast } = useToast();
  const mena = identitat.mena === 'persona' ? 'persona' : 'organitzacio';
  const camps = CAMPS[mena];
  const dades = identitat.dades || {};
  const [local, setLocal] = useState({});

  const document = useMemo(() => ({
    id: identitat.id,
    title: local.title ?? dades[camps.title] ?? '',
    subtitle: local.subtitle ?? (camps.subtitle ? dades[camps.subtitle] : '') ?? '',
    lead: local.lead ?? (camps.lead ? dades[camps.lead] : '') ?? '',
    content: local.content ?? '',
    logoImage: local.logoImage ?? dades[camps.logoImage] ?? '',
    heroImage: local.heroImage ?? '',
    isPublished: mena === 'persona' ? Boolean(dades.is_public) : dades.visibility === 'public',
    copyright: `© ${dades[camps.title] || identitat.nom}`
  }), [identitat.id, identitat.nom, dades, camps, local, mena]);

  const updateLocal = useCallback((_id, camp, valor) => setLocal((p) => (p[camp] === valor ? p : { ...p, [camp]: valor })), []);
  const saveRemote = useCallback(async (_id, camp, valor) => {
    const columna = camps[camp];
    if (!columna) { showToast('Este camp encara no té columna al servidor: es queda en esta pantalla.', 'error'); return; }
    try { await guardarCampPerfil(columna, valor, identitat.id); }
    catch (e) { showToast(e?.message || 'No s’ha pogut desar.', 'error'); }
  }, [camps, guardarCampPerfil, identitat.id, showToast]);
  const publish = useCallback(async () => {
    try {
      if (mena === 'persona') await guardarCampPerfil('is_public', !dades.is_public, identitat.id);
      else await guardarCampPerfil('visibility', dades.visibility === 'public' ? 'members' : 'public', identitat.id);
    } catch (e) { showToast(e?.message || 'No s’ha pogut canviar la visibilitat.', 'error'); }
  }, [guardarCampPerfil, dades.is_public, dades.visibility, identitat.id, mena, showToast]);
  const uploadMedia = useCallback((fitxer) => pujaMitja(fitxer, mena === 'persona' ? 'avatars' : 'organitzacions'), [pujaMitja, mena]);

  const adapter = useMemo(() => ({
    document, updateLocal, saveRemote, publish, uploadMedia,
    labels: [identitat.rol, mena === 'persona' ? 'Persona' : identitat.mena === 'grup' ? 'Grup' : 'Empresa'],
    identityActions: <SelectorIdentitat />,
    barAuthorAvatar: identitat.avatar || '',
    barAuthorName: identitat.nom,
    barAuthorLocation: dades.town_name || '',
    previewTitle: document.isPublished ? 'Fitxa pública' : 'Fitxa privada',
    previewHelp: document.isPublished ? 'La gent del poble pot vore esta fitxa.' : 'Només tu veus esta fitxa. Publica-la des del botó de la barra.'
  }), [document, updateLocal, saveRemote, publish, uploadMedia, identitat, mena, dades.town_name]);

  return <DocumentEditor key={identitat.id} adapter={adapter} onToast={showToast} />;
}
```

Tres condicions perquè este editor funcione de veritat: `updateOrganization` ha de mapejar `visibility` (organizations.js línies 19-21, una línia); `logo_url` necessita els grants de I12; i `DocumentEditor` sembra el cos amb `LLAVOR_NOTA` importada de NotesSection (DocumentEditor.jsx línies 14 i 138), una dependència d'un component universal cap a una llesca: cal un `adapter.seedContent` opcional perquè el perfil no arranque amb «Heading 3 (punxa ací…)».

```jsx
// src/sections/profile/PerfilShell.jsx — el model: dos elements per identitat (I8)
const items = identitats.flatMap((identitat) => [
  { id: `${identitat.id}-fitxa`, categoryIds: [String(identitat.id)], title: 'La fitxa', subtitle: 'Nom, lema, presentació i foto', icon: identitat.mena === 'persona' ? UserRound : Building2, data: { mena: 'fitxa', identitat } },
  { id: `${identitat.id}-compte`, categoryIds: [String(identitat.id)], title: 'El compte', subtitle: 'Correu, contrasenya i sessió', icon: Lock, data: { mena: 'compte', identitat } }
]);
const renderDetail = ({ item }) => (item?.data?.mena === 'fitxa'
  ? <PerfilEditor identitat={item.data.identitat} />
  : <DetallCompte identitat={item?.data?.identitat} />); // els ajustos de contrasenya, correu i eixir, trets de DetallAjust
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Executat amb èxit pel circuit documental (Bash autoritzat per `command-policy.mjs`): `document.mjs context` i `document.mjs create` per a este fitxer; rebuts `66b1abca` i `db4d8e13` al torn. Cap altra ordre de shell ha passat: el hook bloqueja `node --version`, `ls` i `cat` com a shell opaca. El hook posterior `segell-auto.mjs` ha avisat en desar la 1.0.0 («segell divergent; cap resegellat automàtic»): és el segell de les skills, no este document, i ja venia divergent de torns anteriors.
- No executat, i per tant no acreditat: Vitest, lint, portes, build i navegador. Les 738 proves verdes són l'últim relleu de l'ESTAT (Opus 5.5, 26-09), no una mesura d'este torn.
- Ordres de verificació que el hook sí que admet i que l'executor del Pla ha de córrer abans de tocar res: `npx vitest run src/sections/xat src/sections/profile src/components/universal/graph src/sections/consola`, `npm run porta:enxufe`, `npm run porta:rls`, `git status --short`.
- L'esquema SQL s'ha llegit sencer (18 migracions i la llavor, fitxers seguits per Git), no contra la base viva: cap troballa sobre grants, triggers o polítiques està provada amb una consulta real. I12, I13 i I14 són lectures de fitxer que el Mestre ha de confirmar en staging.
- Cap línia de codi de producte s'ha modificat (AFK absolut). Els blocs de codi d'este document s'han escrit contra les signatures llegides, sense compilar-los: poden portar errors de detall que Vitest i ESLint diran a la F1-F4.
- Refutació pròpia (lliçó de les auditories adversarials): I1 depén d'un `grep` que no he pogut executar; I5 de la 1.0.0 ha caigut en llegir M11 (el trigger sí que registra el consentiment); I11 contradiu la directiva 2 i s'ha de resoldre amb el bolcat, no amb la meua paraula ni amb la memòria del Mestre.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Les taules `realms`, `user_realms`, `connections` i `posts` no s'han pogut auditar perquè no són al repositori (I11). Tot el codi de federació de §2 és esquelet fins al bolcat; cap columna s'ha inventat.
- La base de dades viva no s'ha consultat: ni grants efectius, ni publicació Realtime, ni el resultat real de l'alta amb Google (I14).
- Navegador no obert: la comparació amb WhatsApp Web es fa de memòria de producte (rail d'icones, llista, conversa, píndoles de filtre, dies separadors, tics), no d'una captura d'este torn.
- La federació proposada dissenya costures dins del node propi. Qualsevol transport entre nodes (ActivityPub, federació per API) necessita un ADR nou que revise l'ADR-2026-08, com exigix la porta de maduresa del sistema nerviós.
- Els inventaris per subagent han vist només fitxers seguits per Git: cap fitxer SQL sense seguir (si n'hi haguera) hi apareix. `git status --short` a l'inici del torn no en mostrava cap.
- `supabase/seed.sql` línia 16 (la càrrega `pages`, uns 56 k tokens en una sola línia) no s'ha pogut llegir.
- Cap escriptura a ESTAT ni LEDGER: són governança i el hook les denega; el relleu l'ha de fer qui tinga lease, com a l'Acta del 26-09 08:45.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_1235_prompt_fable]]
- [[260926_1235_pla_implementacio_fable]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[arquitectura_sistema_nervios]]
- [[260913_0635_arquitectura_perfil_universal]]
- [[taxonomia_documental]]
- [[auditoria_canonica]]
