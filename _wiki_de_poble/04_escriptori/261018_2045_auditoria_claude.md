---
type: informe
status: esborrany
description: Informe de Claude Code sobre la implementació de les Tasques 0 a 4 del Pla 261018_1605, amb proves, revisió adversarial i decisions pendents del Mestre.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7fc20280-109a-449c-bf03-44468881020d:6d47aa9e-c5ce-4e15-88c6-df42fbb48931
---
# Auditoria Claude · Perfil públic, poble a la barra, avatar propi i Multimèdia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7fc20280-109a-449c-bf03-44468881020d:6d47aa9e-c5ce-4e15-88c6-df42fbb48931 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (`localhost:3340`, paquet en mode remot; accés pilot en mode llavor) |
| Creació | 2026-10-18T18:42:13.743Z |
| Modificació | 2026-10-18T18:50:00.000Z |
| Propietari | claude |
| Aprovació humana | aprovat (Pla 261018_1605 aprovat pel Mestre; encàrrec directe al xat de Claude Code, 18-10-2026) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, app d'escriptori) com a orquestrador, amb tres workflows de subagents: mapa (6 lectors i un crític), implementació (3 franges de fitxers disjunts i un integrador) i revisió adversarial (4 lents, 2 escèptics per troballa i un reparador) |
| Tokens consumits | ≈12,95 M en subagents (1,89 M + 1,33 M + 9,73 M), més el fil principal (no mesurat amb precisió) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-18 (≈16:35): lectura del Pla i del Prompt 1605 i mapa del codi real (els noms de fitxer del pla no existixen tots: no hi ha `UniversalCard/CardHeader.jsx`; la targeta és `src/components/PedraSeca/organismes/UniversalCard.jsx` i la barra, `src/components/universal/barres/BarraTaronja.jsx`).
- 2026-10-18 (17:50): troballa de coordinació. Gemini 4 ja havia fet una primera passada sobre T0–T4 (≈24 fitxers de `src/` sense commit i `DetallMultimedia.jsx` nou) i l'auditoria [[261018_1718_auditoria_perfil_public_multimedia_i_poble]]. Claude hi construïx a sobre, sense revertir-la en bloc.
- 2026-10-18 (18:00–19:00): implementació en tres franges de fitxers disjunts (dades i autenticació; port de mitjans; UI del Perfil) i integració.
- 2026-10-18 (19:00–20:25): revisió adversarial: 37 troballes, 31 confirmades per dos escèptics. El reparador n'aplica 15; Claude n'aplica 3 més. Les que demanen criteri humà passen a este informe.
- 2026-10-18 (20:00–20:40): comprovació visual a `localhost:3340` (escriptori 1440 px, pantalla estreta i mòbil 375 px).
- 2026-10-18 (20:40): lectura del Prompt i del Pla 2000 i dels informes [[261018_2030_auditoria_codex]] i [[261018_2030_auditoria_gemini]]; contrast de les seues troballes amb el codi real.
- 2026-10-18 (20:48): ordre del Mestre al xat sobre F3: «condiciona “Elimina” i “Eliminar duplicats” a la capacitat integritatMitjans fins que existisca el contracte de Codex». Aplicada a `DetallMultimedia.jsx`, amb la seua prova.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Balanç per tasca (demanat · fet · pendent)

| Tasca | Fet en codi (verificat) | Pendent o fora del codi |
| --- | --- | --- |
| **T0** Unificació de Javi | `PERSONA_PILOT` (`src/data/identitatsSeed.js`) és la font canònica única: nom, foto, bio, lema i poble. La llavor de `localhost` (`localPerfils.js`) i la fila remota del compte de Javi la fan servir. El compte remot es reconeix pel correu `socdepoblecom@gmail.com`, però només si està confirmat o té identitat de Google. `hidrataPerfilPersonaPilot` omple només els buits i canvia la foto de Google per la canònica. Fragments SQL per a l'alineació real: `supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql` i `…_publica_perfil_javi_llinares.sql`. | El client no pot escriure la fila remota: cal que el Mestre execute els fragments (§4). Capçalera canònica: no n'hi ha cap (`hero_url ''`). La fitxa pública `/javillinares` que veu el veïnat continua eixint del catàleg fins que es declare l'UUID a `IDS_REMOTS_FUNDACIONALS`. |
| **T1** Públic per defecte | `is_public: true` en llavor, reserva i hidratació. Un `is_public` absent es llig com a públic. Avís literal del Mestre a «El compte» quan la fitxa desada és pública (`AVIS_FITXA_PUBLICA`, `visibilitatFitxa.js`; `Alerta` de Pedra Seca, sense rol viu). L'opció privada sempre és accessible. Migració `supabase/migrations/2610181800_perfil_public_per_defecte.sql` (`is_public` amb default `true`, **NO aplicada**), entrada al catàleg i prova estàtica. | `visibility: 'public'` literal: impossible a `profiles` (F2). Textos d'alta i legals que encara diuen «privat» (F1). |
| **T2** Poble a la barra | «Nom · Poble» a la barra de l'editor i a la targeta viva de la columna central, per CSS acotat a `.perfil-pagina` (`src/css/components.css`), sense canvi de DOM. Si no hi cap: nom a la primera línia i «· Poble» a la segona, amb punts suspensius. El subtítol de «La fitxa» és «Nom · Poble». Poble de la persona a «El compte»: canviar-lo, afegir-ne més d'un, «Fer principal» i «Llevar», només amb pobles del catàleg. | El multi-poble es desa com «A · B» a `town_name` (F7). La regla «només del catàleg» és de la UI; el servidor admet qualsevol text de fins a 120 caràcters. |
| **T3** Avatar propi | Un sol classificador «propi» (`esFontImatgePropia`, `src/utils/sanitize.js`). La fila de reserva posa primer la foto pròpia. `reafirmaAvatarPropi` (`auth.js`), després de cada entrada amb Google, reescriu a GoTrue la foto pròpia de la fila, que Google havia xafat. La de Google es guarda a `picture`. Renovar el token desa el que torna GoTrue (no ressuscita fotos esborrades en un altre dispositiu). | Cal la migració 2610160250: sense ella el PATCH dona 403 i cap foto pròpia arriba a la fila. És la causa més probable del símptoma de `gentdelatorre.net`. |
| **T4** Multimèdia | Apartat «Multimèdia» 🖼️ davall d'«Els nodes», només per a la persona que pot editar la fitxa. `DetallMultimedia.jsx` llista les fotos del Storage de l'usuari (capacitat opcional nova `mitjansPropis`: `llistaElsMeusMitjans`, `esborraElMeuMitja`), l'avatar i la capçalera actius i la foto de Google (sense referent). Duplicats per etag i mida. Accions d'un clic: [Posa com a avatar] i [Posa com a capçalera]. **Esborrat tancat** fins que el backend declare `integritatMitjans` (F3, ordre del Mestre de les 20:48). Amb la capacitat: confirmació, mai l'avatar o la capçalera actius, ni una foto citada a la presentació; només la carpeta `avatars`. 48 miniatures i «Mostra’n més». | El contracte `comprovaUsImatge` de Codex i, després, l'avís «està en ús a [Nom]» (F3). En la llavor de `localhost` no hi ha biblioteca (F8). |
| **403** (pla, s4) | Sense canvi de codi: la migració `2610160250_perfil_update_propi.sql` ja existix. | L'aplica el Mestre (§4). |

### 2. Correccions fetes sobre la primera passada de Gemini

| Fitxer | Defecte de la primera passada | Correcció |
| --- | --- | --- |
| `localPerfils.js`, `auth.js`, `identitatsSeed.js` | Files de persona amb `visibility: 'public'`, que el CHECK de `profiles` rebutja (23514) i la sentinella EST-VISIBILITAT marca en roig. | `visibility: 'private'` i `is_public: true`. |
| `DetallMultimedia.jsx` | Propietat decidida pel NOM de l'autor; «Elimina» i «Eliminar duplicats» només amagaven la foto al navegador (`getVal`/`setVal`); classe arrel no declarada (porta vocabulari); foto de Google com a imatge de tercers amb referent. | Reescrit: font per `userId` (ruta del Storage), esborrat real pel port, cap dada de negoci al navegador, `referrerPolicy="no-referrer"`, classes declarades. |
| `DetallAjust.jsx` | Avís fix fins i tot amb la fitxa privada; text lliure per a afegir pobles; `<input>` i `<button>` crus. | Avís només si la fitxa desada és pública; pobles només del catàleg; peces de Pedra Seca. |
| `personaDeSessio.js`, `identitatsSeed.js` | Tres classificadors OAuth paral·lels i incoherents. | Un de sol a `sanitize.js` (`esAvatarDeProveidorOAuth`). |
| `identitat.js` | En renovar, la foto pròpia anterior es conservava fins i tot quan s'havia esborrat o canviat en un altre dispositiu. | Retirat: la prioritat la donen la fila i `reafirmaAvatarPropi`. |
| `identitatsSeed.js`, `fitxaDePerfil.js` | Correu de Javi acceptat sense confirmar, també en un perfil o en una sessió adoptada de l'amfitrió. | Només amb `email_confirmed_at`, `confirmed_at` o identitat de Google; `clauFundacional` ja no accepta correus. |
| `NotesContext.jsx`, `clauDelPoble.js` | Amb «A · B» a `town_name`, una nota rebia un `poble_id` que no casava amb cap poble. | Es pren el poble principal (`poblePrincipal`, `src/sections/pobles/nomsDelPoble.js`). |

### 3. Troballes obertes (contracte d'informe)

**F1 · Textos d'alta i legals que contradiuen el públic per defecte** · severitat **alta**: és una falta de transparència RGPD si s'aplica la migració sense canviar-los.
- Abast: `src/sections/onboarding/OnboardingSection.jsx:432,445` (píndola «Perfil privat»), `src/sections/onboarding/OnboardingSteps.jsx:177` («El teu perfil queda privat…»), `src/sections/text/legalContent.js` §13 (promet nom i foto només al poble), `src/sections/profile/visibilitatFitxa.js` `PERSONA.avisPublica` («…la fitxa només la veus tu»).
- Evidència: `grep -n "Perfil privat" src/sections/onboarding/*.jsx`. La RPC `perfil_public` (2610021520) torna la fitxa sencera a qualsevol sessió autenticada si `is_public`.
- Font de veritat: l'ordre del Mestre (públic per defecte) contra el que es promet en l'alta.
- Proposta conservadora: no aplicar 2610181800 fins que el Mestre redacte els textos nous. Són fora de les superfícies encarregades (lliçó 260923 «l'abast es definix per superfície»), i per això no s'han tocat.
- `requires_human_decision: true`.

**F2 · `visibility: 'public'` no es pot escriure a `profiles`** · severitat **alta**: trencaria cada alta.
- Evidència: `supabase/migrations/2609080000_initial_schema.sql:65,70`, `check (visibility = 'private')`; la política d'alta exigix `'private'`; `src/sections/tractors/sentinelles/estructural.js:102-104`.
- Font de veritat: l'esquema i la sentinella estructural.
- Proposta: «públic» d'una persona = `is_public`, que és el que lligen totes les superfícies i la RPC. Si el Mestre vol el literal, cal una migració que canvie el CHECK i la política i una revisió de la sentinella. No es recomana.
- `requires_human_decision: true` (només si es vol el literal).

**F3 · L'esborrat de Multimèdia no sap si la foto està en ús en una publicació** · severitat **alta**. Coincidix amb Codex R1/R2 (P1) i Gemini A2.1.
- Abast: `src/sections/profile/DetallMultimedia.jsx` (`confirmaEsborrat`), `src/data/supabase/storage.js` (`esborraElMeuMitja`), polítiques de `mitjans` (`2609200300_blindatge_storage_i_contingut.sql:49-72`).
- Evidència: una nota o un post antic que porte `sdp-media://mitjans/<poble>/<uid>/avatars/x.webp` perd la imatge si l'usuari l'esborra. Les mitigacions actuals no ho cobrixen: només `avatars`, cap activa ni protegida, cap citada a `presentacio_html`, i l'avís «Si l’havies posada en alguna publicació, allí deixarà de vore’s».
- Font de veritat: Pla 2000, Fase 5 («Protecció relacional d'esborrat») i el contracte `comprovaUsImatge` que proposa Codex.
- **Aplicat (ordre del Mestre, 20:48):** «Elimina» i «Eliminar duplicats» depenen de la capacitat `integritatMitjans` (`CAPACITAT_INTEGRITAT`, `DetallMultimedia.jsx`). No està al contracte, i `teCapacitat` torna `false`: els botons estan desactivats i ho expliquen (`MOTIU_SENSE_INTEGRITAT`, `AVIS_SENSE_INTEGRITAT`). `confirmaEsborrat` tampoc no esborra sense la capacitat. Els duplicats es continuen veient, i posar d'avatar o de capçalera continua igual. Prova: «sense la comprovació d’ús del servidor, cap esborrat…» (`DetallMultimedia.test.jsx`).
- Pendent: quan Codex declare la capacitat a `contracte.js`, amb el mateix nom, l'esborrat haurà de consultar `comprovaUsImatge` abans de cridar `esborraElMeuMitja` i pintar l'avís «està en ús a [Nom]».
- `requires_human_decision: false` (decidit pel Mestre).

**F4 · T0 és una convergència d'un sol sentit** · severitat **mitjana**.
- Evidència: `hidrataPerfilPersonaPilot` torna a omplir a cada lectura els camps que Javi buide (bio, lema) i torna a posar la foto canònica si tria la de Google. El veïnat veu la fila remota crua.
- Font de veritat: T0 («mateixes dades sense divergències»).
- Proposta: executar una vegada el fragment d'alineació. Després, o es retira la hidratació de les files reals (es deixa per a la reserva), o es declara l'UUID (§4).
- `requires_human_decision: true`.

**F5 · El paquet v1.1.6 es va generar amb codi a mig fer** · severitat **mitjana**.
- Evidència: `wordpress-plugin/builds/261018_1853_*`, `261018_1857_*` i `261018_1939_*_v1.1.6.zip`, i `stable.json` (signat, `generat: 2026-10-18T17:39:58Z`), mentre les franges i el reparador encara editaven `src/` (fins a les 20:25) i abans de la revisió adversarial. No l'ha generat Claude.
- Font de veritat: el cicle de publicació (porta, proves i revisió abans del segell).
- Proposta: no distribuir v1.1.6 com a estable; regenerar-lo quan el conjunt estiga revisat i confirmat.
- `requires_human_decision: true`.

**F6 · Edició concurrent de `src/app/contexts/personaDeSessio.js` (20:14, no és de Claude)** · severitat **mitjana**.
- Evidència: `git diff -- src/app/contexts/personaDeSessio.js` («Ordre del Mestre (261018, uniformització d'avatar)»): `perfilDeFila` pren `hero_url` quan no hi ha `avatar_url`, i `avatarDePersona` pren la foto de les identitats de Google. Les troballes A1.1 i A1.2 de Gemini es referixen a este canvi, no a la feina de Claude.
- Font de veritat: «Llevar l'avatar» vol dir inicials (`identitat.persistencia.test.js:220-232`) i T3. Una capçalera panoràmica no pot fer d'avatar.
- Proposta: qui va fer el canvi el revisa. Claude no el reverteix sense ordre.
- `requires_human_decision: true`.

**F7 · Multi-poble dins d'una sola columna de text** · severitat **mitjana**.
- Evidència: `town_name = 'La Torre de les Maçanes · Penàguila'` (prova visual en llavor). Es replica a `user_metadata` i és la «location» de l'autoria.
- Font de veritat: el risc del prompt («no alterar la signatura de profiles»).
- Proposta: es manté sense esquema nou. Una pertinença real (`town_memberships`) canviaria l'abast de les dades i necessita una ADR.
- `requires_human_decision: true` (si es vol pertinença real).

**F8 · Multimèdia no té biblioteca en la llavor (`localhost`, persona pilot)** · severitat **baixa**.
- Evidència: en mode llavor no hi ha Storage, i `llistaElsMeusMitjans` torna `[]`; es veuen l'avatar, la capçalera i la foto canònica.
- Proposta: verificar-la contra el remot quan el Mestre hi entre amb el seu compte.
- `requires_human_decision: false`.

**F9 · El bucket públic `mitjans` es pot llistar sense sessió** · severitat **baixa**; ja existia.
- Evidència: `2609130500_bucket_mitjans.sql:16-18`.
- Proposta: el contracte de Codex (R2) ho ha de tancar.
- `requires_human_decision: true`.

**F10 · Dins del Perfil, tots els `Boto` es pinten blaus** · severitat **baixa**.
- Evidència: `src/sections/profile/PerfilShell.css:229-253`. «Elimina» té la mateixa aparença que «Posa com a avatar».
- Proposta: decisió de disseny del Mestre. `PerfilShell.ambit.test.js` fixa exactament tres selectors.
- `requires_human_decision: true`.

**F11 · Accions del Pla 1605 fora de les cinc tasques** · severitat **baixa**.
- Evidència: el pla té tres accions més (targetes navegables a `UniversalCard.jsx`, conversió WebP al client i fortificació del xat amb REA), afegides a les 16:34 sense entrada a l'historial. No són a les cinc tasques encarregades al xat, i no s'han executat.
- Proposta: tractar-les dins del Pla 2000, que ja n'absorbix dues.
- `requires_human_decision: true`.

**F12 · L'auditoria 1718 de Gemini ja no descriu el codi** · severitat **baixa**.
- Evidència: diu «visibility: 'public'», «tipus: 'poble'» i una barra «Nom · Poble» que en aquell moment no existia. Este informe la substituïx per al Mestre. Claude no edita documents d'una altra IA.
- `requires_human_decision: false`.

### 4. Instruccions per al Mestre (editor SQL de Supabase, en este ordre)

1. **Arreglar el 403:** aplicar `supabase/migrations/2610160250_perfil_update_propi.sql`. És la precondició de tot el que desa el Perfil en remot (avatar, capçalera, poble, estat).
2. **Alinear la fitxa de Javi (una sola vegada):** executar `supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql`. Primer la consulta de lectura de la capçalera; omple només els buits i canvia la foto de Google per la canònica. Si es vol publicada, executar també, una sola vegada, `…_publica_perfil_javi_llinares.sql`.
3. **Públic per defecte per als veïns nous:** aplicar `supabase/migrations/2610181800_perfil_public_per_defecte.sql` **només amb els textos de F1 ja canviats**. No modifica cap fitxa existent.
4. **Opcional:** passar l'UUID del compte `socdepoblecom@gmail.com` (Authentication → Users) per a declarar-lo a `IDS_REMOTS_FUNDACIONALS`. Llavors `/javillinares` mostra la fila real al veïnat amb sessió. I, si es vol entrar amb Google a `localhost:3340`, afegir-lo a les Redirect URLs de Supabase Auth.

### 5. Contrast amb les auditories de Codex i Gemini (2030)

| Troballa | Verificació al codi real | Posició de Claude |
| --- | --- | --- |
| Codex R1/R2 (P1) | Certa: l'esborrat va directe a `storage.remove`, i les polítiques no miren referències. | D'acord (F3). Esborrat ja condicionat a `integritatMitjans`; R2 (polítiques de Storage) continua sent de backend. |
| Codex R9 | Certa: la biblioteca és per usuari i poble actiu, amb un tall de 10 pàgines × 100 per carpeta. No és un àlbum per actor. | D'acord; depén del contracte `llistaMitjansActor`. |
| Gemini A1.1 / A1.2 | Certes, però sobre un canvi que no és de Claude (F6). | D'acord amb A1.2: una capçalera no és un avatar. |
| Gemini A2.1 | Certa en el fons. La crida citada no és la real: és `esborraElMeuMitja(entrada.ref, configDelPort)`, `DetallMultimedia.jsx:469`. | = F3. |
| Gemini A2.2 | `avatars` com a única carpeta esborrable és una tria de seguretat deliberada (les altres carpetes són de publicacions). L'esborrat en sèrie és acceptable per a pocs fitxers. | Es revisa quan existisca el contracte d'integritat. |
| Gemini A2.3 | Els duplicats es busquen només entre les fotos del Storage (etag i mida). Les fotos de la fitxa es fusionen per la font normalitzada. Les etiquetes que cita (`injectaActiva`, `clauDuplicat`) no existixen al codi. | Sense canvi. |
| Gemini A3.1 / A3.2 | Certes: `censImatges.js:165` (`2-sidebar.png`) i `MultimediaSection.jsx:145,159` (clau amb índex). | Fora del 1605; encaixen al rol de Claude del Pla 2000. |

### 6. Revisió del Prompt i del Pla 2000 (retroalimentació)

- **Dependències:** l'àlbum per actor (persona, entitat, agent) i l'avís «està en ús a [Nom]» depenen dels contractes de Codex (`llistaMitjansActor`, `comprovaUsImatge`). Claude els pot pintar amb la capacitat absent, però no inventar-ne les dades.
- **Encavalcaments amb el treball sense commit:** la Fase 5 reescriu `DetallMultimedia.jsx`, i la Fase 7 (avatar net i enquadrament en un clic) toca `PerfilEditor.jsx`, que ja té canvis d'este torn. Convé confirmar abans el conjunt actual.
- **Proves:** la xifra de «687 tests» del pla 2000 ja no és la de hui (perfil: 713; suite completa: ≈19.500). `src/sections/multimedia/censImatges.test.js` ja falla a HEAD (9 imatges OG de La Torre sense entrada al cens). És la mateixa peça que la neteja de fòssils (`2-sidebar.png`), i convé arreglar-les juntes.
- **Abast de Claude:** la poda de `10_metriques` i `02_investigacio_ia` mou documents. AGENTS §0.1 la reserva a MarIA o al Mestre. Claude no la farà.
- **Aprovació:** el prompt 2000 diu «Aprovació humana: pendent». Claude no tocarà codi d'eixe pla fins a la sincronització que anuncie el Mestre.
- **Plantilla (`prompt_local`):** proposte (1) un repartiment de fitxers per agent, perquè una auditora no implemente, com va passar en el 1605; (2) una entrada d'historial obligatòria quan un pla aprovat canvia; (3) distingir «dissenyat», «implementat», «provat en local» i «verificat en remot».

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació (des de `socdepoble.org`) | Resultat |
| --- | --- |
| `npx vitest run src/sections/profile/` (20:48, després de la porta de F3) | **51/51 fitxers, 714/714 proves** passades. |
| `npx vitest run src/data src/app/contexts src/utils src/components/universal src/components/PedraSeca src/sections/notes src/sections/pobles src/sections/mur src/sections/tractors src/sections/onboarding src/sections/multimedia` | 483 fitxers passats, 1 fallat i 1 omés; 7.510 proves passades, 1 fallada i 5 omeses. L'única fallada és `censImatges.test.js`, que ja fallava a HEAD: `censImatges.js` i `public/` no s'han tocat. |
| Suite completa `npx vitest run` (integrador, abans de les darreres correccions) | 1.134 fitxers i 19.486 proves; 1 sola fallada, la mateixa `censImatges`. |
| `node --test tests/migracio-convergencia-perfil.test.mjs tests/migracio-identitat-f1.test.mjs tests/lint_logica_usuari.test.mjs tests/lint-sessio.test.mjs` | 56 proves: 54 passades, 0 fallades, 2 `todo` diagnòstics que ja hi eren. |
| `npx eslint --max-warnings=0` sobre els 58 fitxers JS/JSX nous o tocats | 0 missatges. |
| Portes (només lectura): vocabulari, estils en línia, `design_guard`, tokens, `innerhtml`, persistència, importacions, TDZ, pedra seca, llavor, RLS | Cap violació nova als fitxers del conjunt. Les vermelles ja ho eren abans. `tractor-rls` en verd (47 SQL). |
| Visual a `localhost:3340` (accés pilot, mode llavor) | Barra de l'editor: «Javi Llinares · La Torre de les Maçanes». Poble afegit i desat en llavor: «… · Penàguila». Avís d'«El compte». Apartat Multimèdia. Targeta estreta i mòbil 375 px amb punts suspensius i el poble sempre visible. |
| Porta Olivera abans de l'informe | Exit 0 (avisos de sediment de l'índex ja existents). |

No verificat: cap flux contra el Supabase remot (`gentdelatorre.net`): PATCH 200, entrada amb Google, llistat i esborrat reals del Storage. Depenen de les migracions del §4.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Sense accés al Supabase remot ni a secrets. Cap migració ni fragment aplicat, cap commit, cap release ni cap desplegament.
- L'arbre és compartit: hi ha canvis concurrents d'altres agents que este informe no certifica. Són la migració `2610181915_organitzacions_correu_i_membres.sql`, el paquet v1.1.6, `.agents/ESTAT.md` i l'edició de `personaDeSessio.js` (F6).
- Claude no pot escriure a `.agents/` (ESTAT, LEDGER). El tancament del torn `torn_7fc20280-109a-449c-bf03-44468881020d` amb `tancament.mjs` és de MarIA o del Mestre.
- No s'ha mogut ni arxivat cap document de l'Escriptori, i no s'ha llegit `90_arxiu_historic/`.
- Este torn no ha creat cap cron ni cap tasca programada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261018_1605_pla_implementacio_perfil_public_multimedia_i_poble]]
- [[261018_1605_prompt_claude_gemini_perfil_public_i_multimedia]]
- [[261018_1718_auditoria_perfil_public_multimedia_i_poble]]
- [[261018_2000_prompt_claude_gemini_capacitats_matrix_i_poda]]
- [[261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki]]
- [[261018_2030_auditoria_codex]]
- [[261018_2030_auditoria_gemini]]
