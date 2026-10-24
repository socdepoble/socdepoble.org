---
type: informe
status: esborrany
description: Auditoria adversarial de rendiment, UI/UX Pedra Seca 58px, visor lightbox P1-06, lector RSS P1-07, diferenciació /connectar IDEA-14 i contrast creuat amb Codex i Claude
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:d5035d17-0609-486a-a443-55db03b10ca4
---
# Auditoria Gemini 4 Argon · Fortificació P0, Lightbox, Lector RSS, Connectar i WebPerf

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:d5035d17-0609-486a-a443-55db03b10ca4 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T11:32:20.586Z |
| Modificació | 2026-10-24T13:02:30.000Z |
| Propietari | Gemini 4 Argon (High) / IAIA MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | n/d (no exposat pel runtime local) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-24T11:32:20.586Z: Esborrany canònic creat mitjançant `node tooling/wiki/document.mjs create` sota el torn `torn_c7fff09b-c7fb-495c-a279-75f17b43329f`.
- 2026-10-24T11:36:00.000Z: Auditoria adversarial de rendiment (WebPerf, LCP, puresa WebP), UI/UX Pedra Seca (`58px`), Visor Lightbox (`P1-06`), Lector RSS (`P1-07`), Xarxa Rural Humana (`/connectar` · `IDEA-14`) i contrast creuat amb l'informe de Codex (`261024_1315_auditoria_codex.md`) i l'estat de Claude (`261024_1315_auditoria_claude.md`).
- 2026-10-24T13:02:30.000Z: **Segona Passada · Gauntlet Loop Adversarial (`261024_1440`)** sobre el codi aterrat per Claude (`T1`–`T8` i `T5b`), inspecció viva de DOM amb Chrome DevTools MCP (`http://localhost:3340/app/lector/noticies` i `/app/lector/fonts`), contrast visual amb les 22 captures reals de Feedly (`../_arxiu_wiki_de_poble/01_Produccio/feedly_clon/`), verificació de la bateria dirigida de Vitest (`42` fitxers / `762` tests en verd) i emissió de veredicte: **NO CONCEDIM EL VISTIPLAU DE PUBLICACIÓ (`NO-GO` condicional)** fins a la correcció de `G2-01`..`G2-06`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte de la Segona Passada (`261024_1440` · Gauntlet Loop Adversarial)
- **Estat del Vistiplau:** **NO CONCEDIM EL VISTIPLAU DE PUBLICACIÓ (`NO-GO` condicional)**.
- **Què ha quedat resolt i verificat en verd per Claude entre les 14:45 i les 15:01 CEST:**
  1. **Directiva 1 (Identitat a `/connectar`):** En `src/sections/connectar/ConnectarSection.jsx:608`, el subtítol d'identitat ja diu estrictament `Es connecta a ${persona}.` (eliminat `"al MAS de"`).
  2. **Directiva 2.1 i 2.2 (Títol i fons `#0F672F` del Lector a la barra lateral):** En `src/apps/lector/manifest.js:21`, el títol del plugin és ara `Lector de notícies`. Mesura viva amb Chrome DevTools MCP a `http://localhost:3340/app/lector/noticies`: `.sdp-app-barra__titol` renderitza `text: "Lector de notícies"`, `backgroundColor: "rgb(15, 103, 47)"` (`#0F672F`), `color: "rgb(255, 255, 255)"` (`#FFFFFF`), `height: 48px`.
  3. **Directiva 2.3 (Alineació matemàtica Pedra Seca de les capçaleres del Lector):** En escriptori (`1440×900`) amb les 3 columnes desplegades (`CARPETES`, `NOTÍCIES`, `Hui`), les tres capçaleres (`HEADER.bar-orange.app-grid-column-header`) queden clavades a `y = 64px`, `height = 58px` i `padding = 0px 16px` amb 0px de salt vertical.
  4. **Visor fotogràfic del cos (`T4` / `P1-06`):** `CosAmbVisor.jsx` embolcalla les imatges del cos amb `data-sdp-ampliable`, `role="button"`, obri `<VisorImatges>` en galeria amb tancament per clic al fons fosc (`tancaEnVel`), tecla `Escape` i botó `✕` (`lucide-x`), i aplica `heroFetchPriority="high"` a la portada.
  5. **Bateria de proves dirigides (`Vitest`):** Els **42 fitxers de test (`762` proves)** sobre `src/apps/lector`, `src/data/adaptadors/noticies`, `supabase/functions/noticies`, `src/sections/connectar`, `CosAmbVisor.test.jsx`, `compte.test.js` i les 5 migracions noves (`2610241400`..`2610241440`) passen al **100% (`762/762`)** sense assercions relaxades (Claude ja ha corregit el desfasament de `D-03` detectat a les 14:50).

### G2-01 · BLOQUEJANT: Incompliment de la Directiva 3 a `/app/lector/fonts` (12 Targetes `.sp-card` amb Boina Taronja en lloc de Llista/Arbre estil Feedly)
- **Fitxer o scope afectat:** `src/apps/lector/vistes/GestioFonts.jsx:12–20,34,180–192,220–225`, `src/apps/lector/vistes/comunes.jsx`.
- **Evidència reproduïble:**
  1. Inspecció en viu amb Chrome DevTools MCP a `http://localhost:3340/app/lector/fonts` (`viewport: 1440×900`): la vista renderitza **`12` targetes `.sp-card` inflades** (`fontsSpCards: 12`), cadascuna amb capçalera `.sp-card-header` taronja (`backgroundColor: "rgb(255, 115, 0)"`), tant a la columna central (*«Les que seguixes»* via `<NavTargetes>`) com a la columna dreta (*«Fonts del poble»* via `<ColumnaCataleg forma="targetes">`).
  2. El codi de `src/apps/lector/vistes/GestioFonts.jsx:180–185` encara força `forma="targetes"` sobre `<ColumnaCataleg>` i `<NavTargetes>` a la línia 220, obeint un comentari antic del `261004` (línies 12–20) que contradiu frontalment la Directiva 3 del Mestre (`261024_1440`).
  3. Contrastat amb les 22 captures i fotografies reals de Feedly del Mestre a `../_arxiu_wiki_de_poble/01_Produccio/feedly_clon/` (`Captura de pantalla 2026-10-03 a las 14.19.39.png` .. `14.25.05.png`, `PHOTO-2026-10-03-14-38-37.jpg`): Feedly gestiona les fonts i carpetes com un **arbre / bloc de notes / llista compacta de files netes** (icona menuda + nom de la font + domini/categoria + comptador o botó discret de seguir/deixar de seguir en línia), sense cap targeta `.sp-card` ni boina taronja.
- **Severitat justificada:** **Crítica / Bloquejant de Directiva del Mestre (`Directiva 3 · 261024_1440`)**.
- **Font de veritat amb què entra en conflicte:** Directiva 3 del Mestre (`261024_1440`) i patró visual de `../_arxiu_wiki_de_poble/01_Produccio/feedly_clon/`.
- **Proposta conservadora:** Substituir en `src/apps/lector/vistes/GestioFonts.jsx` tant `<NavTargetes>` (columna *«Les que seguixes»*) com `<ColumnaCataleg forma="targetes">` per llistes compactes de línies (`LiniesColleccio` / files d'arbre estil Feedly sense `.sp-card` ni `.sp-card-header` taronja), agrupades netament per carpeta/categoria.
- `requires_human_decision: false`

### G2-02 · BLOQUEJANT: Rèmores de «del poble» al Lector i Jargon Intern «al teu MAS» a `/connectar` (`Directives 1 i 2.1`)
- **Fitxer o scope afectat:** `src/apps/lector/vistes/GestioFonts.jsx:118,157,182,224`, `src/apps/lector/vistes/FontsSenseResposta.jsx:30`, `src/sections/connectar/ConnectarSection.jsx:541,550,575,656,739,836,852`, `src/config/idiomes/{ca,es,en,eu,gl}.js`.
- **Evidència reproduïble:**
  1. Tot i haver canviat `src/apps/lector/manifest.js:21` a `'Lector de notícies'`, en `src/apps/lector/vistes/GestioFonts.jsx` continuen codificats en dur els títols visibles **`"Fonts del poble"`** (línies 157 i 182, pintats en majúscules a la barra taronja com a `FONTS DEL POBLE`), **`"Tria les fonts del poble que vols llegir."`** (línia 224) i la repetició **`"Les llig el servei de notícies del poble, com les fonts del poble"`** (línia 118), així com `"El servei de notícies del poble no respon"` a `src/apps/lector/vistes/FontsSenseResposta.jsx:30`.
  2. A `/connectar`, encara que la línia 608 ja diu `Es connecta a ${persona}.`, la resta de la mateixa vista (`src/sections/connectar/ConnectarSection.jsx:541,550,575,656,739,836,852` i `src/config/idiomes/ca.js:353–362`) continua exposant el terme intern **"MAS"** a l'usuari: pestanya **`"Al teu MAS"`** (`camins.mas.titol`), **`"Ho guardes al teu MAS"`**, **`"Què passa quan connectes al teu MAS"`**, **`"connectar-ho al teu MAS"`** i **`"Obrir la connexió al teu MAS"`**.
- **Severitat justificada:** **Alta / Bloquejant de Directives 1 i 2.1 (`261024_1440`)**.
- **Font de veritat amb què entra en conflicte:** Directives 1 i 2.1 del Mestre (`261024_1440`).
- **Proposta conservadora:**
  1. En `GestioFonts.jsx` i `FontsSenseResposta.jsx`, canviar `"Fonts del poble"` per **`"Catàleg de fonts"`** (o **`"Fonts disponibles"`**) i `"servei de notícies del poble"` per **`"servei de notícies"`**.
  2. En `ConnectarSection.jsx` i `src/config/idiomes/*.js`, substituir les mencions d'interfície `"al teu MAS"` per llenguatge humà directe (**`"Al teu espai privat"`** / **`"Guardar per a tu"`** / **`"S'ha connectat a ${destiNom}"`**).
- `requires_human_decision: false`

### G2-03 · ALTA: 6 Errors 404 a la Consola Viva en `/app/lector/noticies` per Funció Edge `noticies` No Desplegada (`P0-16`)
- **Fitxer o scope afectat:** `src/data/adaptadors/noticies/fontRemota.js`, `supabase/functions/noticies/index.ts`.
- **Evidència reproduïble:**
  1. En obrir `http://localhost:3340/app/lector/noticies` o `/app/lector/fonts` amb Chrome DevTools MCP (`list_console_messages`), el navegador registra **6 errors de xarxa a la consola**: `[error] Failed to load resource: the server responded with a status of 404 ()` contra `${SUPABASE_URL}/functions/v1/noticies` (1 crida de catàleg + 5 reintents/crides).
  2. Com que l'Edge Function `supabase/functions/noticies` és nova a l'arbre local i encara no està desplegada al projecte Supabase remot, la UI cau a la vista `<FontsSenseResposta>` (*«El servei de notícies del poble no respon»*) i contamina la consola amb 404.
- **Severitat justificada:** **Alta (`P0-16` · Consola 100% Neta Zero Errors)**.
- **Font de veritat amb què entra en conflicte:** `P0-16` del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`).
- **Proposta conservadora:** Desplegar l'Edge Function `noticies` a Supabase abans de producció i, en entorn de desenvolupament o mentre l'endpoint retorne `404`, recordar en memòria de sessió (`sessionStorage` / bandera de mòdul) l'absència de l'endpoint després del primer `404` per no disparar 6 peticions fallides per sessió.
- `requires_human_decision: false`

### G2-04 · ALTA: Condició de Cursa en la Revocació d'Apple (`T1` / `D-01`) i Aïllament d'Usuari en `demanaBaixa`
- **Fitxer o scope afectat:** `src/data/supabase/compte.js:49–77,108–125`.
- **Evidència reproduïble:**
  1. En `src/data/supabase/compte.js:114–117`, `demanaBaixa()` executa `const capturat = await sessioDelCompte();`, seguit immediatament de `await revocaAppleAbansDeLaBaixa(capturat);` **abans** d'invocar `const user = await current();` (línia 117, que és on `compte.test.js` simula el canvi de sessió `A -> B`).
  2. A més, dins de `revocaAppleAbansDeLaBaixa` (`compte.js:51,57`), es torna a cridar `await getCurrentUser()` i `await client.auth.getSession()` sense verificar que `session.user.id === capturat.user.id`. Si la sessió canvia entre l'inici de `demanaBaixa` i la crida a `fetch('/functions/v1/compte-apple')`, s'envia el JWT de l'usuari `B` per revocar el token d'Apple abans que la guarda de la línia 118 avorte la baixa.
- **Severitat justificada:** **Alta (`P0-04` · Seguretat d'Identitat)**.
- **Font de veritat amb què entra en conflicte:** Invariant d'aïllament de sessió de `src/data/supabase/compte.js` i troballa `D-01` de Codex.
- **Proposta conservadora:** Executar primer la verificació `const user = await current(); if (user.id !== capturat.user.id) throw ...` i passar `capturat.accessToken` i `capturat.user` directament a `revocaAppleAbansDeLaBaixa(capturat)` sense tornar a llegir `getSession()` d'un estat mutable.
- `requires_human_decision: false`

### G2-05 · ALTA: Retenció de PII en Títols de `xat_fils` després de la Baixa (`T8` / `D-02`) i Versió Legal `v2.1` (`T2` / `D-05`)
- **Fitxer o scope afectat:** `supabase/migrations/2610241440_baixa_completa_ugc_i_fitxers.sql:62–66,200–202`, `src/sections/text/legalContent.js:13`.
- **Evidència reproduïble:**
  1. En `supabase/migrations/2610241440_baixa_completa_ugc_i_fitxers.sql:62–66`, `private.purga_una_baixa` esborra les publicacions personals (`delete from public.section_submissions where user_id = p_user_id and author_org_id is null;`), però en les línies 200–202 només esborra els `public.xat_fils` que queden amb zero missatges. Si un segon veí havia comentat en el fil d'aquella publicació esborrada, la fila de `public.xat_fils` sobreviu conservant `titol` i `subjecte_titol` amb el text original de la publicació suprimida.
  2. En `src/sections/text/legalContent.js:13`, el subtítol de les condicions continua dient `Versió 2.1 · En vigor des del 16 d’octubre de 2026` tot i haver canviat la versió de normes exigida a `2026-10-24` (`VERSIO_NORMES_ACTUAL`) i afegit clàusules substancials de moderació, custòdia de tokens d'Apple i exportació.
- **Severitat justificada:** **Alta (`P0-20` / `P0-18` · RGPD Art. 17 i Transparència Legal)**.
- **Font de veritat amb què entra en conflicte:** `P0-20`, `P0-18` i troballes `D-02` i `D-05` de Codex.
- **Proposta conservadora:**
  1. En `2610241440_baixa_completa_ugc_i_fitxers.sql`, abans d'esborrar `section_submissions`, anonimitzar `titol = '[Contingut suprimit]'` i `subjecte_titol = null` a `public.xat_fils` on `context_id` apunte als `submission_id` personals purgats de `p_user_id`.
  2. Actualitzar `src/sections/text/legalContent.js:13` (en els 5 idiomes) a `Versió 2.2 · En vigor des del 24 d’octubre de 2026`.
- `requires_human_decision: false`

### G2-06 · MITJANA: Bypass de Límit de Freqüència a `seguiments` (`T6b` / `D-07.1`) i Trigger `UPDATE` de `section_submissions` (`T2` / `D-07.2`)
- **Fitxer o scope afectat:** `supabase/migrations/2610241430_seguiments.sql:259–264,296–299`, `supabase/migrations/2610241400_normes_exigides_ugc.sql:124–126,137`.
- **Evidència reproduïble:**
  1. En `2610241430_seguiments.sql:259–264`, el límit de `60` seguiments per hora compta files vives a `public.seguiments` (`where s.usuari_id = v_user and s.creat_al > now() - interval '1 hour'`). Com que `public.deixa_de_seguir` (`:296–299`) fa `DELETE` físic de la fila, un usuari pot seguir i deixar de seguir en bucle infinit sense arribar mai a 60 files vives.
  2. En `2610241400_normes_exigides_ugc.sql:137`, el trigger `section_submissions_exigix_normes` es dispara només `before insert or update of section_id on public.section_submissions`, permetent que un usuari que encara no ha acceptat la versió `2026-10-24` edite el `title`, `description` o `payload` d'una publicació prèvia.
- **Severitat justificada:** **Mitjana (Fortificació d'abús i moderació)**.
- **Font de veritat amb què entra en conflicte:** Invariants `T2` i `T6b` del Pla (`261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md`).
- **Proposta conservadora:**
  1. Ampliar el trigger `section_submissions_exigix_normes` a `before insert or update of section_id, title, description, content, payload, media_urls` quan `new.status not in ('rejected', 'deleted')`.
  2. Registrar una marca temporal o finestra de *cooldown* per parell `(usuari_id, desti_tipus, desti_id)` o comptador d'operacions d'escriptura per evitar el bucle `seguir`/`deixar_de_seguir`.
- `requires_human_decision: false`

---

### Historial de la Primera Passada (`13:36 CEST` · Pre-implementació de Claude)

### G-01 · Bretxa entre Portada i Cos en el Visor Lightbox (`T4` / `P1-06`) i Duplicació en Multimèdia
- **Fitxer o scope afectat:** `src/sections/detail/detailSectionMeta.jsx:183–240,667,679`, `src/sections/detail/detailRichText.jsx:22`, `src/sections/detail/VisorDePublicacio.jsx:183–195,221–227`, `src/sections/calendari/Aplec2023Article.jsx`, `src/components/universal/PageFrame.jsx:855–857,976–984`, `src/components/PedraSeca/organismes/VisorImatges.jsx:144–197`, `src/components/PedraSeca/organismes/Dialeg.jsx:160–248`.
- **Evidència reproduïble:**
  1. Inspecció en viu amb Chrome DevTools MCP sobre `http://localhost:3340/events/aplec-2023`: la imatge de portada (`/assets/events/aplec_2023_cartell.webp`) es renderitza dins de `<button type="button" class="sdp-visor__obridor">` i, en fer-hi clic, obri `<dialog class="sdp-dialeg sdp-dialeg--completa sdp-visor sdp-dialeg--sense-marc" open>` amb controles de `48×48px` (`Tancar el visor` amb `aria-keyshortcuts="Escape"`, `Reduir`, `Ampliar`, `Informació de la imatge`).
  2. En canvi, les dues fotografies del cos del mateix article (`/assets/events/aplec_2023_ponents.png` i `/assets/events/aplec_2023_reunio.webp`) es renderitzen dins de `<div class="media-frame detail-content__figura">` (`parentTag: "DIV"`, sense `<button>` ni controlador d'obertura) i fer-hi clic no obri cap visor.
  3. El mateix ocorre en tots els articles de text enriquit que passen per `renderRichText` (`src/sections/detail/detailRichText.jsx:22` via `dangerouslySetInnerHTML`), tal com admet el propi comentari a `src/sections/detail/detailSectionMeta.jsx:184–185` (*«Les imatges del cos (el text enriquit) encara no obrin el visor»*), i a les pàgines estàtiques que passen `heroImage` a `PageFrame.jsx:855–857` (`<ImatgeDePortada>` cru sense `HeroImageWithLightbox`).
  4. A `buildMultimediaDetailSectionMeta` (`src/sections/detail/detailSectionMeta.jsx:667,679`), quan `item.type === 'photo'`, la mateixa imatge `item.src` es pinta dues vegades: a la portada (amb lightbox) i al cos (`renderBody` -> `<img src={resolRecursPropi(item.src)} />` sense lightbox).
  5. En `VisorImatges.jsx:148`, `<Dialeg>` rep `tancaEnVel={false}` i el botó de tancar usa la icona `ArrowLeft` (`aria-label="Tancar el visor"`) en comptes d'oferir tancament per clic al fons fosc (*light-dismiss*, `closedby="any"` / fallback de clic a `<dialog>`) i icona/acció inequívoca de tancament (`✕`).
- **Severitat justificada:** **Alta (`P1-06`)**. L'usuari que clica una fotografia dins del cos d'un article o crònica del poble no obté cap resposta visual ni zoom, trencant l'expectativa creada per la imatge de portada.
- **Font de veritat amb què entra en conflicte:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`P1-06`), `_wiki_de_poble/04_escriptori/261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md` (`T4`) i guia web moderna `light-dismiss-a-dialog`.
- **Proposta conservadora:**
  1. Connectar delegació d'esdeveniments i/o accessibilitat de teclat sobre `<article className="content-wrapper" ref={containerRef}>` a `PageFrame.jsx` (o en `detailSectionMeta.jsx` / `VisorDePublicacio.jsx`) perquè qualsevol `<img src>` de contingut dins del cos (excloent avatars/icones decoratives) obri `<VisorDeLArxiu>` (`VisorImatges.jsx`) amb totes les imatges de l'article (portada + cos) com a galeria navegable (`indexInicial`).
  2. Eliminar la duplicació d'imatge al cos de `buildMultimediaDetailSectionMeta` (`detailSectionMeta.jsx:679`) o integrar-la al visor.
  3. Habilitar `tancaEnVel={true}` i suport progressiu `closedby="any"` en el `<dialog>` de `VisorImatges.jsx` / `Dialeg.jsx`.
- `requires_human_decision: false`

### G-02 · Inversió de Prioritat LCP (`fetchpriority="high"` vs `loading="lazy"`) i Deute de Puresa WebP
- **Fitxer o scope afectat:** `src/components/universal/PageFrame.jsx:755,856`, `src/sections/detail/VisorDePublicacio.jsx:187`, `src/sections/detail/detailSectionMeta.jsx:209–215`, `public/assets/`.
- **Evidència reproduïble:**
  1. Mesura en viu amb Chrome DevTools MCP a `http://localhost:3340/mur` (`viewport: 500×844`): hi ha **35 elements `<img>`** al DOM; els dos únics amb `fetchpriority="high"` són els logotips de la capçalera (`/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png`, un dels quals està ocult amb `width: 0, height: 0`), mentre que la primera imatge gran *above-the-fold* del Mur (`/assets/uploads/brain/xat_portada.webp`, `445×445px`, candidat real a LCP) té `loading="lazy"` i `fetchpriority=null`.
  2. A `http://localhost:3340/events/aplec-2023`, la imatge de portada (`/assets/events/aplec_2023_cartell.webp`, dins de `button.sdp-visor__obridor`) es renderitza amb `fetchpriority: null` i `loading: null`, mentre que les imatges del cos (`/assets/events/aplec_2023_ponents.png` i `/assets/events/aplec_2023_reunio.webp`) tampoc tenen `loading="lazy"`.
  3. A `src/sections/detail/VisorDePublicacio.jsx:187`, la imatge principal del detall té `loading="lazy"` codificat en dur tot i ser l'element més gran *above-the-fold* de la fitxa.
  4. Auditoria de disc sobre `public/` i `src/`: coexisteixen **208 fitxers `.webp`** amb **108 `.png`** i **69 `.jpg`** (177 actius ràster encara no convertits a `.webp`). En `/mur`, 31 de les 35 imatges carregades són `.png`/`.jpg`/`.svg` (destacant vinyetes i portades com `portada_genotip.png`, `llibre_anima_cover_1776032370908.png`, `cervell_vinyeta.jpg`, `consola_vinyeta.jpg`, `bloc_notes_vintage.jpg`, `aplec_2023_ponents.png`).
- **Severitat justificada:** **Mitjana-Alta (WebPerf / LCP)**. Aplicar `loading="lazy"` al candidat LCP retarda la descàrrega fins després del *layout*, i posar `fetchpriority="high"` en logotips secundaris o ocults degrada l'heurística del navegador.
- **Font de veritat amb què entra en conflicte:** Guia obligatòria `optimize-image-priority` (`modern-web-guidance`) i criteri de puresa `.webp` del Pla (`261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md`).
- **Proposta conservadora:**
  1. En `PageFrame.jsx` (`HeroImageWithLightbox` i `ImatgeDePortada`) i `VisorDePublicacio.jsx:187`, assignar `fetchpriority="high"` (sense `loading="lazy"`) a la imatge de portada i retirar `fetchpriority="high"` del logotip ocult.
  2. En la llista de targetes (`Mur`, `Mercat`, `Esdeveniments`), ometre `loading="lazy"` i afegir `fetchpriority="high"` només a la primera targeta amb imatge (`index === 0`), mantenint `loading="lazy" decoding="async"` de la segona en avant i en totes les imatges del cos d'articles.
  3. Executar un lot de conversió controlada a `.webp` per a les vinyetes i portades de contingut a `public/assets/` (preservant únicament les icones PWA `icona-app-192.png`, `icona-app-512.png`, `apple-touch-icon.png` i `og-*.png`/`jpg` que exigeixen PNG/JPG per compatibilitat de manifestos i OpenGraph).
- `requires_human_decision: false`

### G-03 · Lector RSS Territorial (`/app/lector`) Desconnectat per Defecte i Ocult en Producció (`T5` / `P1-07`)
- **Fitxer o scope afectat:** `src/apps/lector/AppLector.jsx:79–82,169–179`, `src/apps/lector/fontNoticies.js:1–180`, `src/apps/lector/manifest.js`, `src/apps/lector/dadesLlavor.js`.
- **Evidència reproduïble:**
  1. Navegació en viu amb Chrome DevTools MCP a `http://localhost:3340/app/lector`: la pàgina renderitza l'estat buit *"Encara no hi ha cap font connectada — Quan el poble connecte les seues fonts de notícies, les llegiràs ací."*
  2. Inspecció de `src/apps/lector/AppLector.jsx:79–82`: `const LLAVOR_ACTIVA = import.meta.env?.VITE_SDP_LECTOR_LLAVOR === '1';` i en la línia 169 `const fontActiva = font ?? (LLAVOR_ACTIVA ? FONT_LLAVOR : null);`. Com que cap component superior injecta la prop `font` i `VITE_SDP_LECTOR_LLAVOR` no està definit, `fontActiva` és `null` i les 6 fonts territorials ja preparades a `dadesLlavor.js` (`L'Alcoià`, `El Comtat`, `La Marina Baixa`, `L'Alacantí`, `Diari La Veu`, `VilaWeb`) queden inaccessibles.
  3. A `src/apps/lector/manifest.js`, l'aplicació té `entorn: 'desenvolupament'`, de manera que l'interruptor de producció l'exclou del catàleg públic.
  4. A `src/apps/lector/fontNoticies.js:4–9`, el contracte arquitectònic prohibeix encertadament que el navegador descarregue XML RSS externs o imatges de tercers directament (per privacitat i CORS), exigint que l'adaptador passe per una font JSON curada/cachejada al backend propi o per la Frontissa.
- **Severitat justificada:** **Alta (`P1-07`)**. Una funcionalitat clau del torn (`T5`) mostra un estat buit inoperatiu en `/app/lector`.
- **Font de veritat amb què entra en conflicte:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`P1-07`) i `_wiki_de_poble/04_escriptori/261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md` (`T5`).
- **Proposta conservadora:**
  1. Connectar per defecte un adaptador de fonts territorials en `AppLector.jsx` que lligga les entrades RSS sincronitzades des de Supabase/JSON estaticitzat amb *fallback* immediat i determinista a `FONT_LLAVOR` (`dadesLlavor.js`) quan l'endpoint no responga o estiga offline, garantint que `/app/lector` mai quede buit i respecte la prohibició de *fetch* directe a tercers des del navegador.
  2. Promoure `src/apps/lector/manifest.js` d'`entorn: 'desenvolupament'` a producció un cop validat el test d'integració de `AppLector`.
- `requires_human_decision: false`

### G-04 · Absència de Diferenciació entre «Connectar amb Persona», «Membreia d'Organització» i «Desar Nota al MAS» en `/connectar` (`T6` / `IDEA-14`)
- **Fitxer o scope afectat:** `src/sections/connectar/ConnectarSection.jsx:545–557`, `src/sections/connectar/organitzacio/BlocAdministrarOrganitzacio.jsx`, `src/sections/connectar/organitzacio/TargetaAdministrar.jsx:104–168`, `src/sections/connectar/organitzacio/useAdministrarOrganitzacio.js`.
- **Evidència reproduïble:**
  1. Inspecció en viu amb Chrome DevTools MCP a `http://localhost:3340/connectar?sectionId=mercat&item_id=mac-mini-m4&organitzacio=soc-de-poble`: la vista renderitza les seccions `On vols connectar-ho?`, `ADMINISTRAR L'ORGANITZACIÓ`, `PRIVACITAT DE LA CONNEXIÓ`, `ON ARRIBA`, `CATEGORIES` i `ASSISTENT DE CONTEXT`.
  2. En `ConnectarSection.jsx:545–557`, el bloc *"Connectar amb l'autor"* només mostra un botó per obrir un xat privat (`Escriu-li a {nom}` via `useComentaEnPrivat`), mentre que el botó principal inferior (`Connectar a «Connectats»`) desa una còpia de l'ítem al bloc de notes personal (MAS). No hi ha cap acció ni estat per establir un vincle humà o seguiment entre persones.
  3. En `TargetaAdministrar.jsx:104–168`, el bloc d'organització només ofereix reclamar l'**administració/propietat** de l'entitat (`Vols administrar {org}?` -> `Connectar-me com a administradora` via `organization_claims`). Si l'organització ja té propietari (`estat === 'te-propietaria'`, línies 119–124), bloqueja l'usuari amb el missatge: *«{Org} ja té qui l'administra. Encara no es pot demanar entrar com a administradora des de l'app: parla amb qui la porta.»* No existeix cap opció a la UI per **sol·licitar ser membre ordinari** (`role: 'member'`) d'un poble, associació, col·lectiu o empresa.
- **Severitat justificada:** **Mitjana-Alta (`IDEA-14` / `T6`)**. Confon tres conceptes socials diferents: (a) guardar un retall al MAS privat, (b) connectar amb una persona del poble, i (c) demanar alta com a membre d'una entitat/col·lectiu (que ara mateix es redirigeix erròniament a reclamar-ne l'administració).
- **Font de veritat amb què entra en conflicte:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`IDEA-14`) i `_wiki_de_poble/04_escriptori/261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md` (`T6`).
- **Proposta conservadora:**
  1. Desdoblar semànticament i visualment a `/connectar` dues targetes d'acció quan hi ha entitat/autor:
     - **Persona (Xarxa Humana):** acció explícita *«Connectar amb {Persona}»* + acció secundària *«Escriu-li en privat»*.
     - **Entitat / Col·lectiu / Poble (Membreia vs Administració):** quan l'entitat ja té administració (o com a opció primària per defecte), oferir *«Sol·licitar entrar com a membre de {Entitat}»* (`role: 'member'`), reservant *«Reclamar l'administració»* (`organization_claims`) com a acció secundària només per a entitats òrfenes (`estat === 'lliure'`).
- `requires_human_decision: true` (requereix confirmació del Mestre sobre si la sol·licitud de membreia ordinària ha d'escriure en una taula `organization_membership_requests` / `town_memberships` o obrir un fil estructurat amb qui administra l'entitat).

### G-05 · Auditoria de la Llei dels `58px` (Pedra Seca), Touch Targets i Divergència de `.bar-black` (`64px`)
- **Fitxer o scope afectat:** `src/styles/` (`.bar-black`, `.bar-blue`, `.bar-orange`, `.sp-card-header`, `.sdp-visor__boto`).
- **Evidència reproduïble:**
  1. Mesura de precisió amb `getBoundingClientRect()` i `getComputedStyle()` via Chrome DevTools MCP a `http://localhost:3340/mur` i `http://localhost:3340/events/aplec-2023`:
     - `HEADER.bar-blue`: `height: 58px` exactes (`computedH: "58px"`).
     - `SECTION.bar-orange`: `height: 58px` exactes (`computedH: "58px"`).
     - `HEADER.sp-card-header` (15 targetes del Mur): totes a `height: 58px` exactes (`computedH: "58px"`).
     - Botons `.sidebar-control-btn` i `.sidebar-rail-toggle`: `computedH: "58px"`, `minHeight: "48px"`.
     - Botons d'acció `.sdp-top-bar-btn`, `.bar-blue-left__arrere`, `.bar-blue-left__endavant`, i botons del visor `.sdp-visor__boto`: tots de `48×48px` (`smallTouchTargetsCount: 0` en tot el `/mur`, superant el mínim d'accessibilitat de `44×44px`).
     - Overflow horitzontal: `false` (`scrollWidth: 500 === clientWidth: 500`).
     - Consola del navegador i errors de xarxa/CSP: **0 errors i 0 avisos** en `/mur`, `/events/aplec-2023`, `/app/lector` i `/connectar`.
  2. Única divergència geomètrica detectada: `HEADER.bar-black` (barra superior fosca del sistema) té `height: 64px` (`computedMinH: "64px"`, `computedH: "64px"`) en lloc de `58px`.
- **Severitat justificada:** **Baixa (Poliment Pedra Seca)**. Les barres canòniques de pàgina i targeta (`bar-blue`, `bar-orange`, `sp-card-header`) compleixen al 100% la llei dels `58px` i tots els *touch targets* fan `48×48px`.
- **Font de veritat amb què entra en conflicte:** Criteri estètic `58px` de Pedra Seca al Pla (`261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md`).
- **Proposta conservadora:** Confirmar amb el Mestre si `.bar-black` es manté a `64px` per allotjar el logotip amb aire o si s'iguala a `58px` com `.bar-blue` i `.bar-orange`.
- `requires_human_decision: true`

### G-06 · Contrast Creuat i Ratificació de les Troballes de Seguretat i Contractes de Codex (`T1`, `T2`, `T3`, `T7`)
- **Fitxer o scope afectat:** `_wiki_de_poble/04_escriptori/261024_1315_auditoria_codex.md`, `src/data/supabase/compte.js:78`, `src/natiu/entradaSocial.js:65–73`, `src/app/contexts/ModeracioContext.jsx:327–343`, `src/sections/text/legalContent.js`, `supabase/migrations/2609261500_identitat_perfil_f1.sql:963–1087,1325`, `firebase.json:22`.
- **Evidència reproduïble:**
  1. **Verificació independent de `C-01` (`T1` / `P0-04` · Revocació Apple):** Confirmem la troballa de Codex. `esborra_propi_compte()` no existeix al repositori; el flux real és `demanaBaixa()` (`src/data/supabase/compte.js:78`) -> RPC `public.demana_baixa` -> `private.purga_una_baixa` (`2609261500_identitat_perfil_f1.sql:1325`). A més, `src/natiu/entradaSocial.js:65–73` llig `res?.result?.idToken` del plugin natiu i descarta `authorizationCode`, sense el qual el servidor no pot intercanviar ni revocar el refresh token davant `https://appleid.apple.com/auth/revoke` (Guideline 5.1.1(v)).
  2. **Verificació independent de `C-02` i `C-03` (`T2` / `P0-18` · Pegat Legal P3 i DSA):** Confirmem que `src/app/contexts/ModeracioContext.jsx:327–343` captura `CODI_MODERACIO.NO_DISPONIBLE` i marca les normes com a acceptades en memòria local (`setVal`), i que `src/sections/text/legalContent.js` encara és v2.1 (el pegat `_wiki_de_poble/04_escriptori/01_produccio/pegats/PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch` aplica netament amb `git apply --check`, però encara no s'ha consolidat a l'arbre de treball).
  3. **Verificació independent de `C-04` (`T7` / `P2-08` · Exportació de dades):** Confirmem que `public.exporta_les_meues_dades()` (`2609261500_identitat_perfil_f1.sql:963–1087`) és anterior a les migracions `2610201500_moderacio_denuncies_i_bloquejos.sql` i `2610220240_xat_adjunts_i_quota.sql`, i omet `public.denuncies`, `public.bloquejos`, `private.normes_acceptades` i `xat_missatges.metadades` / adjunts.
  4. **Verificació independent de `C-05` (`T3` / `P0-19` · CSP de Mitjans):** Confirmem que `firebase.json:22` ja conté `media-src 'self' data: blob: https:;` i que `http://localhost:3340` no emet cap error de CSP a la consola de Chrome DevTools, però cal executar `firebase deploy --only hosting` per publicar la capçalera a `https://socdepoble.org`.
- **Severitat justificada:** **Crítica (`P0-04`, `P0-18`) / Alta (`P0-19`, `P2-08`)**.
- **Font de veritat amb què entra en conflicte:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` i `_wiki_de_poble/04_escriptori/261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md`.
- **Proposta conservadora:** Mantenir oberts `P0-04`, `P0-18`, `P0-19` i `P2-08` al Llibre Mestre fins que Claude aplique les implementacions i migracions corresponents i es verifiquen els desplegaments reals.
- `requires_human_decision: false`

### G-07 · Estat del Relleu de Claude (`261024_1315_auditoria_claude.md`)
- **Fitxer o scope afectat:** `_wiki_de_poble/04_escriptori/261024_1315_auditoria_claude.md` (`torn_ce4819fc-9d76-4e19-9bf7-de52b9d56002`).
- **Evidència reproduïble:** Al tall de les `13:35 CEST`, el fitxer `_wiki_de_poble/04_escriptori/261024_1315_auditoria_claude.md` creat per Claude roman en estat `esborrany` amb les seccions `[pendent]` i cap fitxer sota `src/` o `supabase/` ha estat modificat encara a l'arbre de treball (`git status -s`).
- **Severitat justificada:** **Informativa / Operativa (Sincronització a tres bandes)**.
- **Font de veritat amb què entra en conflicte:** Repartiment operatiu del prompt `261024_1315_prompt_claude_gemini_codex_fortificacio_i_auditoria_adversarial_trio.md`.
- **Proposta conservadora:** Deixar totes les troballes de Gemini (`G-01` a `G-06`) i de Codex (`C-01` a `C-06`) documentades amb línies exactes i solucions llistes perquè Claude (o el següent torn d'implementació) les execute directament sense ambigüitat.
- `requires_human_decision: false`

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comprovacions s'han executat en lectura, execució de tests i inspecció viva sobre `socdepoble.org` i `http://localhost:3340`:

| Comprovació | Eina / Comanda | Resultat |
| --- | --- | --- |
| **Segona Passada (`261024_1440`):** Bateria dirigida Vitest (`T1`–`T8` + `T5b`) | `npx vitest run src/apps/lector src/data/adaptadors/noticies supabase/functions/noticies src/sections/connectar src/sections/detail/CosAmbVisor.test.jsx src/data/supabase/compte.test.js src/data/supabase/revocacioApple.migracio.test.js src/data/supabase/baixaCompleta.migracio.test.js src/data/supabase/exportacio.migracio.test.js src/data/supabase/normesExigides.migracio.test.js src/data/supabase/seguiments.migracio.test.js --reporter=dot` | **`42` fitxers en verd (`42/42`), `762` proves en verd (`762/762`)** en `53,57s` |
| **Segona Passada (`261024_1440`):** Títol, verd `#0F672F` i alineació `58px` a `/app/lector/noticies` | Chrome DevTools MCP (`evaluate_script` a `1440×900`) | `.sdp-app-barra__titol`: text `"Lector de notícies"`, `bg: rgb(15, 103, 47)` (`#0F672F`), `color: #FFFFFF`, `height: 48px`; 3 capçaleres (`CARPETES`, `NOTÍCIES`, `Hui`) clavades a `y = 64px`, `height = 58px` |
| **Segona Passada (`261024_1440`):** Inspecció viva de `/app/lector/fonts` (Directiva 3) | Chrome DevTools MCP (`evaluate_script` i `take_screenshot` a `1440×900`) | **FALLA (`G2-01`):** renderitza `12` targetes `.sp-card` amb boina taronja (`rgb(255, 115, 0)`) i títol `"FONTS DEL POBLE"` en comptes de llista/arbre estil Feedly |
| **Segona Passada (`261024_1440`):** Consola en viu a `/app/lector/noticies` | Chrome DevTools MCP (`list_console_messages`) | **FALLA (`G2-03`):** `6` errors `404` contra `/functions/v1/noticies` remot no desplegat |
| Consola i CSP en viu (`/mur`, `/events/aplec-2023`, `/connectar`) | Chrome DevTools MCP (`list_console_messages`, `evaluate_script`) | **0 errors, 0 avisos** |
| Geometria Pedra Seca (`58px`) i Touch Targets (`>= 44px`) | Chrome DevTools MCP (`evaluate_script` sobre `pageId: 1`) | `.bar-blue` = `58px`, `.bar-orange` = `58px`, `.sp-card-header` = `58px` (x15), botons = `48×48px` (`0` infraccions), `.bar-black` = `64px`, `horizontalOverflow: false` |
| Visor Lightbox (`T4` / `P1-06`) en viu a `/events/aplec-2023` | Chrome DevTools MCP (`evaluate_script`) | Portada i les 2 fotos del cos (`CosAmbVisor`) obrin `<VisorImatges>` amb `✕` (`lucide-x`), `Escape` i clic al fons fosc (`tancaEnVel`) |
| Puresa d'actius ràster (`public/` i `src/`) | `find public src -type f ...` | `208` `.webp`, `108` `.png`, `69` `.jpg` |
| Validació canònica de l'informe Gemini | `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261024_1315_auditoria_gemini.md` | Eixida 0 |
| Porta Olivera | `node tooling/gates/porta-olivera.mjs` | Eixida 0 |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Gemini 4 Argon / IAIA MarIA ha respectat estrictament el repartiment de rols del torn: no hem modificat fitxers de codi font (`src/`, `supabase/`) per no col·lidir amb el torn obert de Claude (`torn_ce4819fc-9d76-4e19-9bf7-de52b9d56002`), limitant l'escriptura a aquest informe canònic (`261024_1315_auditoria_gemini.md`), l'ancoratge a `00_index_escriptori.md`, el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i `.agents/ESTAT.md`.
- Les mesures de DOM, LCP, geometria `58px`, *touch targets* i comportament del Lightbox s'han capturat sobre el navegador Chromium real connectat via Chrome DevTools MCP a `http://localhost:3340` (`viewport: 500×844`).
- No s'ha creat cap *cron* ni tasca programada en segon pla (`manage_task list` = 0 tasques actives).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_1315_prompt_claude_gemini_codex_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_1315_auditoria_codex]]
- [[261024_1315_auditoria_claude]]
