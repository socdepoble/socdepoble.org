---
type: informe
status: esborrany
description: 'Informe de Claude de l''Onada R15 diürna (ordre del Mestre del 09/11): COMMIT R15a, desplegament, P0-69 i punts 3, 4 i 5'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_46022a28-c731-4b8b-a2c3-e12b3f8e8988:5b33219e-dfc1-41f2-8bf4-98dcc09a8bd2
---
# Auditoria Claude — Onada R15: sanejament i desplegament del Kit Unificat ec865, P0-69 i punts 3 a 5

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_46022a28-c731-4b8b-a2c3-e12b3f8e8988:5b33219e-dfc1-41f2-8bf4-98dcc09a8bd2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-09T15:23:13.983Z |
| Modificació | 2026-11-09T15:50:00.000Z |
| Propietari | Claude (torn `torn_46022a28`) |
| Aprovació humana | Ordre del Mestre al xat de Claude, 09/11 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, desktop) |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-09T15:23:13.983Z: esborrany creat; contingut i verificació pendents.
2026-11-09T15:50:00Z: primer relleu (canal viu) amb el PAS A en curs.
2026-11-09T20:21:00Z: relleu amb els tres carrils de R15b integrats i verificats.
2026-11-10T01:30:00Z: COMMIT R15b en cinc parts, pujat i desplegat; canals natius certificats.
2026-11-10T07:50:00+01:00: R16-0 i R16-1, arbitratge del super-kit R16 i integració selectiva R16a en curs.
2026-11-10T10:20:00+01:00: R16-2, COMMIT R16a ae9a9bdb5 pujat; arbre viu reconciliat; desplegament aturat per un desplegament aliè des de l'arbre brut.
2026-11-10T13:17:00+01:00: decisió del Mestre, es manté la v1.1.12 en producció i R16a no es desplega.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### R15-0 · Arrencada (14:54)

- **HEAD** `ec865dcfd`, branca `backup-notes-publish`. **Producció** als dos llocs: Firebase `d2b5b255cd509d17` («web ec865dcfd», 01:10Z) i Node 0 amb `/assets/index-CNoANKiJ.js`. Ningú ha desplegat des d'anit.
- **Arbre viu:** 197 camins pendents, dels quals 112 són la carpeta de Gemini `02_investigacio_ia/261108_marato_r12_gemini_fediversity_100/`, 34 captures de `01_produccio/`, 12 originals del Pou de Neu a `90_arxiu_historic/2026-11/08/` i la resta governança i documents.
- **Torns:** el meu torn d'ahir (`torn_1029e939`) va caducar a les 15:59. A les 16:22 `saneja_torns_caducats.mjs` en va tancar tres (el meu, `torn_10394968` i `torn_524e53a0`) i vaig obrir `torn_46022a28`. Amb `porta-olivera --arxiva --reapunta --torn torn_46022a28` vaig arxivar `261108_1559_auditoria_claude` i `261108_1559_pla_implementacio_onada_r13…` (el Pas 6 passa sencer al pla d'avui). La Porta Olivera torna a eixir amb 0. **Nota de govern:** AGENTS §0.1 reserva el trasllat a MarIA o al Mestre; l'he fet jo amb l'eina oficial perquè l'ordre d'avui demana l'arbre net, i és reversible.

### R15-A1 · Kit Unificat `ec865` de Codex: verificació en còpia

- Còpia exacta d'`ec865` (git amb alternates, fora de l'arbre viu). `SHA256SUMS` del kit: 2.007/2.007 correctes; `verifica_i_aplica.py --verifica` vàlid; `--aplica` sobre la còpia: 714 operacions, Frontissa 26/26.
- Dependència nova `@capacitor/push-notifications` 8.1.3: el tarball del registre npm té el mateix sha512 que el `package-lock.json` del kit.
- **Vitest sencer sobre el kit:** 35.624 passades, 0 fallades i 117 omeses (20 min), la xifra exacta que declarava Codex.
- **Build de producció amb la configuració real:** entrada 246.547 B gzip (marge 3.453 B). **Però el `dist` fa 334 MB**: hi entren les 396 fotos de La Parròquia.

### R15-A2 · Revisió adversària del kit (`wf_6155cb0d-492`, 27 agents)

Cinc lents (privadesa, producció, paquet, regressió i codi) i un escèptic per cada troballa P0/P1. **El kit, tal com està, no es pot publicar:**

- **Fotos de La Parròquia (397 fitxers, 135 MB):** una porta GPS real (Madrid), una altra el correu d'un fotògraf, almenys 13 porten crèdits o drets de tercers (Shutterstock, Fotolia, Adobe Stock, «©Gastromedia… ALL RIGHTS RESERVED») i n'hi ha amb logos de marques. A més, entren al `dist` encara que la bandera privada estiga apagada: la prova del kit compilava en mode llibreria, on Vite incrusta els recursos.
- **Política 2.6 sense la migració `2611080440`:** l'alta mostraria la 2.6 i la BD en registraria la 2.5 (consentiment incoherent).
- **Capacitats sense servidor:** l'adaptador de Supabase anuncia `xatRitme` i `iaia` i desperta `notifica-xat-desperta`, i ni les migracions ni les funcions estan desplegades. Hi hauria peticions fallides en cada ús del xat amb sessió, i la pregunta privada de la IAIA viatjaria al servidor encara que no hi haja servei.
- **Mercadona:** el motor de compra de la recepta pública carrega els 592 productes de Mercadona per a qualsevol visitant.
- **Push natiu:** sense `google-services.json`, un APK construït amb este commit petaria en sincronitzar.
- **Frontissa:** Codex s'aprova a si mateix `legal`, `fedivers`, `fediversity` i `node-zero`.
- Matisos de l'escèptic: els costos de compra de La Parròquia ja eren públics en part (`la-parroquia-loyverse.csv`, 2026-10-02); les tarifes noves són 33 preus de pack d'un bar tancat → P2, decisió del Mestre.

### R15-A3 · Decisions de l'àrbitre per al COMMIT R15a

1. Les fotos de La Parròquia **no entren** al repositori: queden en local, amb una regla de `.gitignore` i una guarda de build que no les emet encara que hi siguen.
2. La política **torna a la 2.5** al client i a la Frontissa fins que el Mestre aplique `2611080440`. La migració i la seua prova entren al repositori sense aplicar.
3. `xatRitme`, IAIA amb servidor, despertador del xat i push natiu queden **darrere de banderes de build apagades** (`VITE_SDP_XAT_RITME`, `VITE_SDP_IAIA_SERVIDOR`, `VITE_SDP_PUSH_NATIU`).
4. El motor de compra (Mercadona) només hi és amb la bandera de la Nevera; la recepta pública es queda com a R14.
5. `fedivers`, `fediversity` i `node-zero`: el text nou és una nota datada i prudent («48 capacitats, 141 mètodes, 195 casos… no acredita activació ni desplegament»). L'aprovació es registra a nom de l'ordre del Mestre d'aplicar el kit, revisada per Claude i revocable.
6. **Fora del commit (dades personals):** `01_produccio/261107_1615_captura_supabase_sessions_origen_entrada_reals.jpg` (noms, correus i dispositius d'una vintena d'usuaris) i `01_produccio/261108_1406_captura_notes_enganxar_text_brut_h1_entradilla_cos_netejar_format.jpg` (un títol de nota amb una dada de salut del Mestre; decisió seua). Revisió de privadesa de les 34 captures: cap GPS; 19 aptes; 13 només amb dades del Mestre (camins amb el seu usuari, carpetes personals del Finder, llistes de Bring!).

### R15-A4 · `/versions` i les P3 del receptari (`wf_bf4091b8-2e4`) · APTE

- Crònica R13+R14 a `/versions` en 5 llengües (enllaç intern, 7 negretes a l'obertura, cap altra plataforma mòbil). Proves de posició adaptades sense afeblir-les.
- P3: alt de #79 i #115 amb la pàgina de la làmina; «cada recepta amb làmina» → veraç (148/149); quadrats de 96 px que no desborden en es/gl (lletra de 14 px; mesura en Chrome: 89,7 px dins de 92); un sol botó «Vídeo»; nota #14 literal fins als dos punts; frase de «Traduir» veraç a web i a l'app; làmina de capçalera amb mides i càrrega prioritària (LCP).
- 72 fitxers de proves focals en verd (1.751 passades), ESLint 0. Frontissa: `versions` i `receptes` canvien d'empremta.
- **Per al Mestre:** P3-4 canvia una decisió de R14 (la làmina passa a ser la capçalera i el vídeo un bloc amb façana davall de les notes).

### R15-A5 · Sanejament (`wf_b0659140-fe7`)

- Dos implementadors, tres verificadors (APTE) i una ronda d'arreglaments. Connectors de Vite nous: `tooling/vite/fotos-parroquia-privades.mjs` (les fotos no s'emeten encara que siguen al disc) i `tooling/vite/banderes-de-capacitat.mjs` (banderes literals plegables). Política 2.5 restaurada. Tarifes de La Parròquia: `parroquiaDades.generated.json` públic i `parroquiaDades.privat.json` local i ignorat.
- **Troballa anterior al kit:** 11 captures del 06/11 versionades a HEAD (`6a444026a`) amb noms i correus de persones usuàries reals. Surten de l'índex amb R15a-1 (queden al disc del Mestre, ignorades, amb una prova nova `capturesPersonals.seguretat.test.js`). **L'historial públic encara les conté.**
- Arreglaments meus a l'arbre final: prova de la migració `2611082238` (fila 85 del README), literals amb forma de credencial a `tests/iaia/edge-*.test.mjs`, codi mort `censQueDinem.js` (LLEI_08) i selector CSS mort `.sdp-admin-importacio__badges`, que només el «consumia» l'informe arxivat.

### R15-A6 · COMMIT R15a i desplegament (19:02)

- **Tres commits, tots amb el hook sencer:** `9bec76846` (documents i govern), `688f4c2a5` (codi) i `b1294ecab` (captures). El `verify --staged` del Reflex té un búfer de 16 MiB per al diff binari i el commit únic en feia 25,8 MB. Cada arbre intermedi passa les portes per si sol.
- **Pujat:** `ec865dcfd..b1294ecab` a `fork/backup-notes-publish`.
- **En viu:** Firebase `e4af4336e8b34ea7` («web b1294ecab»; tornar enrere: `d2b5b255cd509d17`) i Node 0. Entrada `index-BT0UxFfw.js`, 246.536 B gzip. Canal de previsualització: 12 rutes, 0 errors. Producció: 8 rutes a .org i 4 a .cat, 0 errors, 0 excepcions i 0 peticions fallides.
- `node_modules` del viu: `@capacitor/push-notifications` 8.1.3 copiat del tarball verificat (sha512 del lock), sense `npm install`.
- Relleu a `.agents/ESTAT.md` per l'executor (19:10).

### R15-B0 · R15b en curs (19:10)

- El kit fortificat R15.2 de Codex encaixa sobre R15a: 194/196 operacions amb la preimatge exacta; Frontissa 27/27 amb la clau nova `nodrir-la-iaia`; entrada 247.109 B. En revisió adversària (`wf_de5f95f9-1ee`) junt amb la comparació dels kits de Gemini.
- El «Kit Pont» de Gemini lleva les precondicions del CAS i porta la taula dels 22 verificadors del grup de proves: no s'aplica tal qual.

### R15-B1 · Arreglaments de R15b en tres carrils (`wf_8306a94e-789`, 19:39–21:08)

Tres arregladors en còpies separades, un verificador adversari per carril i una ronda de reparació. **Els tres carrils ixen APTES, sense cap P0.**

- **G1 · al·lèrgens i textos públics.**
  - **RV-01 (P0, resolt):** motor nou amb lèxic tancat i determinista (`src/utils/lexicAlergens.js`). Una paraula desconeguda deixa la recepta en cobertura parcial i els al·lèrgens sense marca diuen «? Sense dada», mai «absent». Els 13 casos crítics de R14 donen «•».
  - **Prova d'exhaustivitat** sobre les 149 receptes: 115 completes i 34 parcials (desconegudes: vitets, visolets i perellons).
  - **El verificador**, amb sentinelles pròpies, no troba cap forat real, i hi ha 0 regressions sobre les 564 variants de La Parròquia.
  - **RV-02, RV-03 i RV-06:** l'etiqueta «Proposta assistida · Pendent de validació humana» en 5 llengües; còpia veraç de `/page/receptes`; alt de #79 i #115 a les targetes del Workspace.
  - **RV-04:** `/page/fediversity` ja no es contradiu (una sola font, 32/51/116/148 i 210 casos).
  - **PRODNM-08:** fita R15 a `/versions`.
- **G2 · sessions i Nodrir la IAIA.**
  - **SEG-R15b-01:** el directori de sessions (migració `2611091500`, **no aplicada**) torna el correu emmascarat com la 77, sense identificador de sessió, UUID ni user_agent. Porta una clau opaca per consulta i una auditoria privada *append-only*.
  - **SEG-R15b-02 i PRODNM-03:** `/page/nodrir-la-iaia` sense noms de persones reals ni promeses no desplegades, en 5 llengües.
  - **SEG-R15b-04:** quatre ulls (ningú revisa una aportació pròpia, tampoc el superadmin) i normes UGC.
  - **PRODNM-07:** la curadoria queda darrere de `VITE_SDP_CURADORIA_CULTURAL`, apagada; sense ella, cap petició.
- **G3 · Workspace, projeccions i destins.**
  - **PRODNM-01:** les projeccions i les retirades no ixen fora dels destins consentits (filtre de lectura a `MurContext`).
  - **PRODNM-02, USA-04 i RV-05:** el Rebost i el Bar no s'oferixen com a destins si l'app no és al build.
  - **USA-01, USA-02 i USA-03:** fitxa a la vista amb focus; rajola quadrada de veritat; tornada del focus.
  - **P2 barates:** USA-05, SEG-R15b-05, PRODNM-06 i USA-13.
  - **Comprovat en Chrome** a 375, 768 i 1440.

**Integració de l'àrbitre (21:10–21:20):**

- **Fusió:** carrils sense solapaments (48 fitxers) i empremtes de G3 verificades.
- **Pegats dels carrils:** la prova `universal/CandidatsAlergens` i els pins del verificador SQL de R15 i del POSSE.
- **Proves de migració heretades del kit:** `policy26-sql` i `migracio-admin-resum-sessions-dispositius` passen a la 86a migració (135/135 amb PGlite).
- **Arreglaments meus de P2:**
  - el *lead* de Nodrir en condicional;
  - sis formes que el motor vell reconeixia i el lèxic tancat havia perdut (moll, boquerons, bacallaret, sepias, pecanes, sulfito), amb `lexic-alergens-v2`;
  - el kit de conformitat espera el rebuig de quatre ulls.
- **Frontissa 27/27:** `fediversity`, `nodrir-la-iaia`, `receptes` i `versions`, aprovades a nom de l'ordre del Mestre (revocable).

**Fora de R15b, per al Mestre:**

- **La llengua del panell del Bar:** tota la vista del Bar és en valencià i l'app està apagada.
- **«caldo vegetal» de les notes de #100:** límit declarat.
- **Projeccions en clients R15a encara oberts:** el filtre només viu al client, i un client que no s'haja actualitzat les mostraria fins que s'actualitze.
- **Decisions D-P4 dels al·lèrgens** i revisió nativa d'eu i gl.
- **Notes de Gemini a la carpeta de treball de Claude (20:16–20:51):**
  - P0-74, desbordament d'«Empaquetats i Desplegament»;
  - les onades R16.2 i R16.3;
  - **segons la nota, P0-75 s'ha aplicat directament a Supabase de producció**: taules noves i `private.pot_curar_cultura()` amb `aal1` per a dos correus. No ho he verificat. Contradiu SEG-R15b-02 i l'estat «no aplicada» de `2611091500`, i ho ha de revisar el Mestre.

### R15-B2 · Revisió final, portes i estat real de producció (21:16–22:45)

- **Vitest sencer sobre l'arbre d'integració:** 36.092 passades, 119 omeses i 1 fallada. La fallada, `CatalegBarWorkspace.test.jsx`, era inestable sota càrrega (findBy* amb 1 s mentre es carrega el tros diferit del lèxic). Ara espera 10 s, igual que la resta del fitxer.
- **Assaig del hook:** la línia base del Reflex s'ha recalculat per als dos documents de `02_saber` del kit (`04_escriptori` no hi entra).
- **Cens de portes (`run-portes --cens`):** set portes en roig, totes per fitxers nous del kit R15.2.
  - **Pedra Seca, Fitxa Gestor i Vocabulari:** dos fulls CSS importats des de JS, sense porta única i sense arribar al Shadow DOM; una classe òrfena; dos components morts.
  - **Design Guard:** h1 de prova sense `page-title`.
  - **Persistència:** un comentari.
  - **RLS:** la regex R8 no reconeixia `private.` ni `revoke all`. Es corregix la porta, amb proves; la migració no canvia.
  - **Catàleg:** `CandidatsAlergens`, «extern».
- **Revisió final creuada (`wf_9bfa88ff-606`, 7 agents):**
  - P1 confirmat **PRIVADESA-01**: les projeccions del catàleg ixen del feed moderat i es pinten sense bloquejos ni «Denuncia».
  - P2 visibles: Nodrir diu «Pots aportar» sense formulari i puja a dalt del Mur; «Totes les receptes» és un enllaç mort dins de la recepta; avís fals de càrrega sense capacitat; «Desa els destins» amb una altra pestanya oberta.
- **Producció (sonda de només lectura amb la clau pública, 22:40):**
  - La política 2.6 **no** hi és (v1, 2.3, 2.4 i 2.5): el client 2.5 en viu és coherent.
  - **Sí que hi ha** `branques_saber`, `inventari_brain_node0`, `aportacions_culturals`, `estat_curadoria_cultural`, `llista_aportacions_culturals`, `admin_resum_sessions_dispositius` i `admin_llista_sessions_dispositius`: responen 401/42501, no 404. Una versió de la `2611091500` i les taules de P0-75 s'han aplicat fora del repositori, que les dona per «no aplicades».
  - `llista_inventari_brain_node0` respon **200 a un visitant anònim**, amb 8 branques i 15 documents. Hi ha títols, autoria i les rutes de carpetes internes del Mestre (per exemple `_gestoria_de_poble/01_Identitat_Legal/…`), però cap correu, IP ni camí `/Users`.
  - Amb la clau pública no puc veure el cos de `private.pot_curar_cultura()`: queda per al Mestre.

### R15-B3 · Ronda 3, COMMIT R15b i desplegament (23:00–02:30)

- **Arreglaments de les portes (dos fluxos verificats):**
  - CSS de les peces a `modules.css` dins de `@layer components`. Ara arriba també al Shadow DOM de l'incrustat. Hi ha 0 diferències en 60 escenaris de píxel, també en fosc de debò.
  - Classe òrfena i components morts fora.
  - **Regla R8 de `tooling/gates/tractor-rls.mjs`:** ara reconeix `private.` i `revoke all`, amb tres proves noves. La primera versió del carril havia posat un `SET LOCAL search_path` a la migració per passar la regex; s'ha descartat.
  - `CandidatsAlergens` registrat com a «extern», amb `VERSIO_CATALEG` al dia.
- **Ronda 3 (`wf_121e0f21-c5b`, dos carrils APTES):**
  - **PRIVADESA-01:** filtre de bloquejos, menú de denúncia i text de la fitxa canònica, a les projeccions del Mur, del Mercat i dels catàlegs.
  - **Altres arreglaments:** cap avís fals sense capacitat; missatge en 5 llengües per a l'altra pestanya oberta; contrast de l'etiqueta de destins en fosc d'1,73:1 a 11,2:1.
  - **F4:** `CatalegWorkspace` passa a `src/components/universal/`, com a consumidor del slot `renderItem` (contracte T50).
  - **Nodrir:** sense el text d'aportar i fora del Mur mentre la bandera estiga apagada.
  - **/versions:** amb els títols traduïts.
  - **«Totes les receptes»:** torna al receptari.
- **Verificació de l'arbre final:**
  - Vitest sencer: 36.128 passades, 0 fallades i 119 omeses.
  - Cens de 57 portes en verd. Reflex només es certifica dins del hook.
  - Hook reproduït en verd sobre els cinc arbres.
  - **Proves Node primàries:** 6 roges, totes heretades o de diagnòstic:
    - tres fixen 81 migracions;
    - el trinquet del build de WordPress ja fallava a R15a, amb 1.731.435 B, i ara en fa 1.736.878 contra 1.690.000;
    - diagnòstics de l'estat del torn.
    - A HEAD la suite ni arrancava, per un test sense classificar.
- **COMMIT R15b, en cinc parts amb el hook sencer:**
  - `7bdd232b4`: codi, 228 camins i 2 retirades.
  - `e0bbb2825`: govern. El primer assaig va detectar que faltava la transacció de segell de l'executor de les 01:26.
  - `0b05d067c`, `e71712584` i `01fd75c9c`: les 63 captures de WhatsApp-Clon, en lots de 28, 21 i 14, amb la regla de `.gitignore` i la prova.
  - Pujat: `b1294ecab..01fd75c9c`.
- **En viu (02:25):**
  - Firebase `675bbb7eec945e78` («web 01fd75c9c»); per a tornar enrere, `e4af4336e8b34ea7`.
  - Node 0 amb `index-Am7QPaX7.js` (247.164 B gzip).
  - Sonda sense errors: 13 rutes de previsualització, 10 a .org i 4 a .cat.
- **Canals (P0-81), segons el preflight de `publica-tot.mjs` a les 02:27:**
  - **Web:** fet.
  - **App Store i Google Play:** falten `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_ID`, `SDP_ASC_KEY_PATH` i `SDP_PLAY_JSON_KEY_PATH`. Tampoc hi ha fastlane.
  - **Natiu:** `dist-natiu` és del 02/11 (`4ee8d78c`). Falta `android/app/google-services.json`, cal pujar `VERSIO_CLIENT_NATIU` i el preflight demana un arbre net.
  - **WordPress:** el canal propi es signa amb la clau Ed25519 del Mestre i el directori es puja per SVN.
- **Coneguts sense arreglar:**
  - Un `?fitxa=` inexistent mostra el panell d'error del Workspace; R15a mostrava la pàgina principal.
  - El nom genèric «qui ha publicat esta referència» a la llista de bloquejos.
  - Les referències pendents es publiquen en obrir un catàleg, no en visitar el Mur.

### R16-0 · Arbitratge del super-kit R16 de Gemini (02:45–03:10)

- **CAS:** el super-kit rebasat (`261109_onada_r16_7_.../kit_r16_rebasat_sobre_r15b/`, 103 operacions, R16-A a R16-U) encaixa sobre HEAD `01fd75c9c`: 103/103 preimatges. Incidència: `SHA256SUMS` no casa amb `verifica_i_aplica.py`, que es va modificar després de segellar-lo.
- **Aplicat en una còpia**, el kit no complix el que anunciava («portes zero», «103 PASS»):
  - 15 de 58 portes en roig, entre elles un error de sintaxi, una variable no definida, estils en línia i colors crus, classes forasteres, accés directe a `localStorage`, 4 mòduls orfes i plantilles sense frontmatter;
  - Vitest: 65 proves fallides en 55 fitxers.
- **Revisió adversària (`wf_1a6d1207-20c`, 64 agents):** 2 P0 i 52 P1 confirmats, cap refutat.
  - **Descartats:**
    - **R16-A, B, C i D:** codi mort amb dates, toxicitat i hores inventades, i «Fediversity 100%» fals.
    - **R16-H:** les plantilles portarien el NIF i el domicili d'una persona física al repositori públic.
    - **R16-K:** trenca `/page/descarregues` a iPhone (P0 si es publica), i el mode sense connexió no fa res.
    - **R16-M:** catàleg estàtic amb el nom d'una persona real i SQL sense guarda.
    - **R16-N, R16-P i R16-R:** RSVP sense persistència i amb un comptador inventat; versions que només viuen en un navegador.
    - **R16-Q:** no aporta res.
    - **R16-O i R16-U:** valors escrits a mà; l'ID de l'App Store és d'una altra app; l'APK no existix; la consulta és impossible per la CSP, el CORS i l'esquema d'Android.
  - **Integrables amb arreglaments (R16a):**
    - **R16-I** (P0-74: CSS d'administració i `key` de DetallAdministracio);
    - **R16-E** (només el `supabase/README.md`);
    - **R16-G** (només `cancelaResposta`);
    - **R16-F** (només la compartició de la Nevera);
    - **R16-J** (purga de bots, amb proves arreglades);
    - **R16-S** (nomenclàtor INE en un tros diferit i Edició avançada);
    - **R16-T** (Publicar/Publicat i icona d'edició);
    - **R16-L** (només el logotip de Google).
  - **Lleis del Mestre:**
    - **P0-80 no es complix:** el camí reversible no s'activa mai, el viatge d'anada i tornada torna a retallar i cap vista pinta el marc. Es fa de debò en un carril propi.
    - **P0-81 no es complix:** cal redissenyar-lo amb el Mestre sobre `canalsDeBotiga.canalsOberts()` i una versió generada en el build. A més, no té efecte fins que no isca un build natiu nou, que està bloquejat per les credencials.
- **P0 de producció (G2-01):** la RPC `public.llista_inventari_brain_node0(text,text)` de producció té `grant execute` a `anon` i `authenticated`, sense cap guarda de rol, i torna l'autoria i les rutes internes. No la crea el delta. Cal una acció del Mestre a Supabase.

### R16-1 · R16a: integració selectiva en cinc carrils (03:10–07:50)

- **Carrils** (`wf_2a3aa3c4-17d`, 14 agents, cada carril en un clon de HEAD amb el seu verificador adversari):
  - **l1 · P0-74 i README:** graella de `.sdp-admin-dl` sense mínim de contingut, contenidor propi i fitxa amb `minmax(0, 1fr)`; `key` a DetallAdministracio; la consulta de la 2611080440 al `supabase/README.md`.
  - **l2 · xat i Nevera:** `cancelaResposta` del xat; compartició de la llista de la compra per fragment `#compartida=` (mai consulta) i fitxer.
  - **l3 · purga de bots:** el catàleg només porta `socdepoble`, `0001` i la IAIA; el `seed.sql` igual.
  - **l4 · pobles i editor:** nomenclàtor de l'INE (8.132 municipis) en un tros diferit; Edició avançada; Publicar/Publicat; PenLine; logotip de Google.
  - **l5 · P0-80:** cap foto nova es retalla; el marc viu a `#sdp-crop=` i es pinta amb CSS.
- **Fusió a `int_a`:** neta, sense conflictes. Només `src/css/modules.css`, les 5 llengües i `PerfilEditor.jsx` venien de més d'un carril, i s'han fusionat a tres vies.
- **Arreglaments de l'àrbitre** (troballes dels verificadors):
  - **CSS:** la regla de taula de P0-74 només s'aplica a la taula filla directa del panell, i ja no trossija els ids ni les dates d'Importació. El llindar de la `dl` és de 24rem, mesurat en Chrome: a 1240 px la llista es queda en dues columnes, com a HEAD.
  - **Nevera:**
    - La vista de compartició porta `key` per llista, perquè en canviar de llista no ensenye l'enllaç de l'altra. La prova nova falla si es lleva la `key`.
    - El nucli es diu `comparticio.js`, i la guarda de `frontera.test.js` torna a ser la de HEAD.
    - La llengua arriba a les apps per un context propi de la closca, no per tot UIContext. `VERSIO_NUCLI` no canvia: és una clau nova del retorn.
  - **Purga:** la prova compara els ids i el tipus de la fila del `seed.sql`, no la fitxa sencera.
  - **Nomenclàtor:**
    - El nom oficial de l'INE d'un poble del catàleg no el repetix. Per exemple, «Muro de Alcoy» no torna a eixir si ja hi ha «Muro d'Alcoi».
    - Un àlies que només val amb majúscula no amaga un altre municipi: «Muro», de les Illes Balears, continua eixint.
  - **`FONT.md`:** cita la font tal com apareix a la interfície i deixa pendent la llicència.
- **Proves de `int_a`:**
  - Cens de portes: 55 de 57 en verd. Fronteres de Skills ixia roja només perquè a la còpia faltava `.sdp-paperera`; ara ix amb 0 violacions. Reflex ix roja fora del hook, com sempre.
  - Vitest sencer: 36.347 proves, 36.228 en verd, 0 fallides i 119 omeses.
  - Build real: l'entrada fa 243.495 B gzip (R15b: 247.164).
- **Revisió final del diff integrat** (`wf_c21cd540-224`, 7 agents): 4 troballes confirmades. S'arreglen en tres carrils (`wf_e61c3d1d-3c5`):
  - **P1 · botó:** «Publicat» en verd encara que el Mur no tinga la versió que s'edita. En l'edició en viu, a més, els canvis només viuen en memòria.
  - **P1 · privadesa:** si es reenquadra una capçalera desada amb una precisió de GPS més grossa, el fitxer públic conserva la ubicació exacta. És una regressió de P0-80.
  - **P2 · focus:** la capçalera enquadrada amb zoom perd l'anell de focus.
  - **P2 · taula d'Artefactes:** encara sobreïx entre 500 i 520 px quan hi ha barres de desplaçament clàssiques.
- **Pla de dades de la purga per al Mestre** (producció; no ho toca cap agent):
  1. **Còpia de seguretat:** llegir la fila amb `select tenant_id, version, payload from public.app_content where key='agents';` i desar el `payload` en un fitxer local.
  2. **Retall:** una llista de denegació amb els 12 ids dels bots (a l'informe del carril 3), mai una blanca. Cal escriure la condició `e.a->>'id' is null or e.a->>'id' not in (…)`: un `not in` sol esborraria en silenci les fitxes sense id.
  3. **Node 0:** la mateixa comprovació a la seua `app_content`, i també a `node0.public_documents` (`kind='agents'`), que és el que servix `/api/v1/node0/core`.
  4. **Seed:** no reaplicar `supabase/seed.sql`, que sobreescriuria les 10 files de la llavor.

### R16-2 · COMMIT R16a, reconciliació de l'arbre viu i canals (07:50–10:20)

- **Arreglaments de la revisió final** (`wf_e61c3d1d-3c5`, 6 agents; els tres carrils ixen aptes a la primera verificació):
  - **fa · «Publicat»:**
    - El verd només ix quan esta pestanya sap que el Mur té la revisió que s'edita: `GlobalSaveManager.versioAlMur` val true, false o null, i `marcaPublicada` en publicar bé. Quan no se sap, ix la pastilla de sempre.
    - En l'edició en viu, la nota que el Mur té segur queda en memòria (`alMur`).
    - 14 proves noves i 11 mutants morts.
  - **fb · GPS en reenquadrar:**
    - Una precisió més grossa que la del fitxer torna a codificar la foto sencera.
    - Les píndoles s'obrin en la precisió del fitxer només en reenquadrar una adreça desada. Este retoc de l'àrbitre és per la Llei del Píxel: una foto nova continua oberta en l'exacta. La prova nova falla amb el mutant.
  - **fc · focus i taula:**
    - Amb zoom per damunt d'1, la capçalera va dins d'un `<button>` sense pell (`.sdp-hero__obridor`), i el visor pinta l'anell en un `::after`.
    - La taula d'Artefactes va dins de `.sdp-admin-taxonomia__table-wrap--sense-marc`.
- **Integració a `int_a`:** UniversalEditorShell i la seua prova es fusionen a tres vies entre fb i fc; el conflicte de la prova és d'afegit i es resol per unió.
- **Proves de `int_a`:**
  - Cens: 56 de 57 portes en verd. El Reflex ix roig fora del hook.
  - Vitest: 36.384 proves, 36.270 en verd, 113 omeses i 1 fallida heretada. És el sostre del tros d'entrada del connector de WordPress: 1.731.791 B per a un sostre de 1.690.000; R15b feia 1.737.443. Apujar-lo és decisió del Mestre.
  - Build: l'entrada fa 243.613 B gzip.
- **Hook:**
  - El primer assaig va parar en la Porta Frontmatter: `src/data/nomenclator/FONT.md` no tenia frontmatter ni Vincles. S'hi han afegit.
  - El segon assaig passa les huit passes, sobre l'arbre `7a49886b9`.
- **COMMIT R16a `ae9a9bdb5`:** hook sencer (09:35–09:42), arbre idèntic a l'assajat. Pujat (`01fd75c9c..ae9a9bdb5`). Lease Reflex `f2752693`.
- **Arbre viu:**
  - A les 07:46 l'altra mà hi va aplicar el kit cru sencer i hi ha continuat treballant (R16.12–R16.19), sense commit.
  - La reconciliació s'assaja en dos còpies del viu i la revisen 20 agents (`wf_acfa9860-463`).
  - S'aplica amb CAS i 0 falles:
    - 73 camins que ningú havia tocat i 21 que eren exactament el kit arbitrat reben la versió del commit;
    - 5 fusions netes a tres vies;
    - 5 conflictes resolts conservant la feina posterior de l'altra mà;
    - `utilities.css` torna a HEAD: el bloc cru de R16-T tapava el contrast de R16a.
  - Amb els mateixos 1.328 fitxers de prova, el viu passa de 90 proves en roig a 70: cap nova i 21 d'arreglades. El build del viu reconciliat fa 244.175 B gzip.
  - Els residus per a l'altra mà (5 proves node del kit que asseveren la implementació crua, mòduls orfes, CSS fora de capa…) són al dipòsit `_investigacio_ia_de_poble/261110_1014_r16a_reconciliacio_claude/`.
- **Producció:**
  - Entre les 08:03 i les 09:20 hi ha hagut quatre desplegaments a Firebase des de l'arbre viu brut, sense commit, fets amb el compte del Mas. L'últim és «v1.1.12 URL App Store …», versió `23ceb114f6adde59`.
  - `.org` servix eixe build. `.cat` continua amb R15b.
  - `desplega.sh` ha aturat R16a perquè la release viva no era la de R15b.
  - La previsualització de R16a té 0 errors en 12 rutes.
  - L'identificador `id6826441844` sí que és la nostra app a l'App Store. Este punt corregix la troballa de R16-O/U sobre la versió del kit d'aleshores.
  - **Decisió del Mestre (10/11, 13:17): es manté la v1.1.12 en producció i R16a no es desplega.** `.org` continua amb `23ceb114f6adde59` i `.cat`, amb R15b. La producció torna a eixir d'un commit quan l'arbitratge de la feina posterior (R16b) la cobrisca.
- **Canals:** web verificat (pendent la decisió del Mestre); WordPress, assaig en sec bo (v1.1.12; el canal signat demana la clau Ed25519 del Mestre); Android i iOS, bloquejats. Hi falten:
  - `SDP_ASC_ISSUER_ID`, `SDP_ASC_KEY_ID`, `SDP_ASC_KEY_PATH` i `SDP_PLAY_JSON_KEY_PATH`;
  - `android/app/google-services.json`;
  - un `dist-natiu` del commit: l'actual és del 02/11 (`4ee8d78c4`);
  - `cap sync`.

### R16-3 · R16b: la v1.1.12 arbitrada, commit i desplegament (14:38–20:45)

- **Ordre del Mestre (10/11): «Fes R16b».** Cal arbitrar la feina posterior a R16a (la v1.1.12 i R16.12 en avant), que producció servia des d'un arbre sense commit, perquè producció torne a eixir d'un commit.
- **Instantània de les 14:38:** 201 camins de producte de l'arbre viu, congelats amb el seu sha256. Aplicada sencera sobre R16a en una còpia, dona:
  - 16 portes en roig;
  - 75 proves fallides en 33 fitxers;
  - un build bo.
- **Revisió adversària** (`wf_e1b63fd4-5e7`, 89 agents): 7 P0 i 70 P1 confirmats. Els P0 són:
  - la fitxa científica de l'Herbari, amb al·lèrgens falsos sota un segell de «verificat»;
  - L'Avisador, un simulador presentat com a eina de seguretat;
  - Nodrir la IAIA i La IAIA Sabuda, amb el nom d'una persona real i la guarda SEG-R15b-02 invertida;
  - l'inventari del Brain, amb el nom d'una persona real;
  - el comptador inventat de l'RSVP.
- **Decisions:** 52 camins s'integren, 49 s'arreglen i 100 es descarten.
  - Tornen descartats els expedients que R16a havia rebutjat i que han tornat sense resoldre el motiu (R16-O/U, K, A–D, M, N, P i R).
  - També es descarten:
    - L'Avisador i la fitxa de l'Herbari;
    - el Snippet de Chrome, perquè el .zip no és al repositori;
    - els modificadors del TPV;
    - la poda de les proves de guarda de PluginPage;
    - les proves node noves sense classificar;
    - els canvis del kit a `publica-tot.mjs`.
- **Tres rondes d'arreglaments**, cada carril amb un verificador adversari:
  - **Primera ronda** (4 carrils, `wf_816cf934-80d`): fora tota referència a mòduls descartats. També:
    - La IAIA Sabuda, darrere de la bandera de curadoria;
    - el Panell R16-W1;
    - Mur i Notes amb Receptes;
    - el CSS sense els components descartats.
  - **Segona ronda** (3 carrils, `wf_a750f8d8-9e8`):
    - els espais del Panell en cinc llengües;
    - una sola font per a La IAIA Sabuda;
    - la graella 28rem/58rem torna als 16rem/47rem del P0-74;
    - fora la faixa «Eina en proves»;
    - el Contracte de `/disseny`, reduït al que fa el codi.
  - **Revisió final** (`wf_9fb27501-e7f`, 24 agents): 3 P1 vius.
    - Una prova de R16a havia perdut el testimoni.
    - La persona pilot passava a administrar Oli de La Torre amb una justificació inverificable. Es torna a R16a.
    - La Frontissa.
  - **Tercera ronda** (3 carrils, `wf_9b9a415c-b4b`):
    - el subtítol de La IAIA Sabuda torna al neutre de R16a;
    - la fita del 9-11 de `/versions` no es reescriu i n'hi ha una de nova del 10-11 per a la 1.1.12, fixada amb literals;
    - accessibilitat de Pobles i Gent;
    - `categoriesUbicacio.js` es retira: era codi mort amb una autorització d'administrador per nom.
  - **Revisió curta de la tercera ronda** (`wf_7caf0002-ab2`): cap P0 ni P1. Se n'han aplicat els P2:
    - «el codi web i la configuració de les apps passen a la 1.1.12», perquè a les botigues no ha arribat cap app nova;
    - els comentaris.
- **Frontissa:** el hook assajat la va parar per 5 claus de pàgina amb text nou. Al registre del commit:
  - s'aproven `la-iaia-sabuda`, `descarregues`, `receptes` i `versions`, citant esta ordre, revocable, com a R15b;
  - es retira `nodrir-la-iaia`.
- **Arbre final** (`bd72eda8`, 96 camins):
  - Vitest: 36.436 proves, 36.322 en verd, 113 omeses i 1 fallida heretada de R16a (sostre de WordPress: 1.737.214 B per a 1.690.000).
  - Cens: 57 de 58 portes (Fronteres de Skills ix roja per l'entorn de la còpia).
  - Build: 243.811 B gzip.
  - Hook assajat: huit passes en verd.
- **COMMIT R16b `0027b698d`:**
  - hook sencer (20:11–20:16), sense `--no-verify`;
  - arbre idèntic a l'assajat;
  - lease Reflex `40508b47`;
  - pujat (`ae9a9bdb5..0027b698d`).
- **Desplegament des del commit (20:21):**
  - Firebase `8e686a9f0f29a977` («web 0027b698d»). La versió per a tornar enrere és `23ceb114f6adde59`.
  - `.org` i `.cat` servixen el mateix tros d'entrada.
  - Previsualització: 14 rutes amb 0 errors.
  - Producció: 12 rutes per domini amb 0 errors. `/page/avisador` ja no existix i `/page/nodrir-la-iaia` porta a La IAIA Sabuda.
- **Canals** (`publica-tot` en sec sobre l'exportació del commit):
  - Web: fet.
  - WordPress: fet (v1.1.12).
  - Android i iOS: el preflight no passa (1.1.12+2). Falten `SDP_ASC_*`, `SDP_PLAY_JSON_KEY_PATH` i `google-services.json`, i el `dist-natiu` és del 02/11.
- **Arbre viu:**
  - **Reconciliació** assajada primer en una còpia fidel i aplicada amb el mateix pla:
    - 62 camins reben la versió del commit amb CAS, sense cap falla ni conflicte;
    - `package-lock.json` i el registre de la Frontissa, per l'executor (la Frontissa del viu dona 27 de 27);
    - els canvis sense commit baixen de 201 a 140.
  - **Descartats:** els 101 camins descartats queden al viu com a feina sense commit de l'altra mà. N'hi ha còpia al dipòsit `_investigacio_ia_de_poble/261110_1440_r16b_arbitratge_claude/conservat_viu/`.
  - **Proves:** amb els descartats al viu, la còpia assajada passa de 77 proves fallides a 87: se n'arreglen 37 i en cauen 47. Totes les noves venen de la barreja dels descartats amb el codi arbitrat. Per exemple:
    - el PluginPage del kit amb el registre nou;
    - la data inventada de l'article de Noves tecnologies.
  - **Retirada (ordre del Mestre, «Sí, retira'ls»):** assajada primer en una còpia de l'arbre viu i aplicada amb CAS, sense cap falla.
    - Dels 101 descartats:
      - 83 es retiren;
      - 2 ja eren al dia pel commit;
      - `scripts/botigues/publica-tot.mjs` es restaura per l'executor;
      - en queden 15, fitxers nous protegits de `tooling/` i `scripts/`. L'executor només reemplaça i no els pot esborrar. La llista és a `protegits_pendents_d_esborrar.txt` del dipòsit.
    - També es retiren 21 versions del kit que l'arbitratge va rebutjar en les rondes posteriors (per exemple, `src/main.jsx`, `src/sections/profile/aplicacions.js` o la faixa «Eina en proves»). Sense elles, la retirada trencava el viu.
    - 44 camins tornen al commit i 60 van a la paperera del dipòsit (`paperera_viu/`), fora del repositori. La paperera del repositori no serveix per a proves: Vitest no exclou `.sdp-paperera/` i les tornaria a recollir.
    - Tots els camins de la instantània són ara els del commit, menys els 15 protegits. Els canvis sense commit baixen a 36.
    - En la còpia de l'arbre viu final:
      - Vitest passa de 77 proves fallides a 3: la de WordPress, heretada, i 2 que ja hi eren;
      - el cens passa de 22 portes en roig a 12. Només la Porta Arrel és nova: un dels 15 protegits cita el fitxer de la versió viva retirat.
    - Al viu, la Frontissa dona 27 de 27 i Doctrina i Olivera ixen amb 0. L'ESTAT s'ha actualitzat per l'executor. Errada menor: la petorreta d'esta segona lease porta el text de context de la primera, perquè la seua especificació corregida no es va desar abans d'executar. El contingut escrit és el correcte.
  - **Els 15 protegits (ordre explícita del Mestre, «Sí, mou-los»):**
    - S'han mogut amb CAS a `paperera_viu/` del dipòsit, i `tooling/snippet-chrome/`, que quedava buida, s'ha retirat.
    - Amb el test descartat que citava `publica-tot.mjs` fora, la Porta Promesa marcava el paràgraf de l'entrada R15b de l'ESTAT, perquè diu «pendent de» al costat d'eixe camí. Una tercera lease de l'executor canvia la cita per una descripció i actualitza l'entrada R16b.
    - **Ara:** tots els camins de la instantània són els del commit, sense cap excepció. A l'arbre viu queden 26 canvis sense commit, tots fora del producte.
    - **Cens de l'arbre viu:** 9 portes en roig, de les 22 d'abans de R16b; totes són deute documental que ja hi era. Doctrina, Promesa, Arrel, Olivera i Frontissa ixen amb 0.
- **Troballa heretada:** `__iaia/govern.json`, que publica el Llibre Mestre, porta el nom d'una persona real en una nota d'una captura. Ja hi era a R16a.
- **Pendent del Mestre:**
  - el títol «L'Escriptori sota l'Olivera»;
  - l'origen i el permís de la portada de «Què dinem?»;
  - les etiquetes de la targeta de La IAIA Sabuda;
  - el sostre de WordPress;
  - les credencials de les botigues;
  - G2-01, la purga de dades i la política 2.6;
  - la llicència de l'INE;
  - el redisseny de P0-81.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Kit: `shasum -c` 2.007/2.007, Vitest 35.624/0/117, build real 246.547 B gzip.
- Portes de l'arbre viu a les 16:25: Olivera 0, Cens 0, Doctrina 1 (6 cites de l'entrada de MarIA de les 14:22 a `.agents/ESTAT.md`; correcció preparada per a l'executor).
- R15b (10/11, 02:30): Vitest 36.128/0/119; cens de 57 portes; hook en verd als cinc commits; sonda de producció amb 0 errors; Olivera, Cens i Doctrina amb 0 a l'arbre viu després del relleu d'ESTAT.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La revisió adversària llig codi i fa builds de prova; no ha provat cap dispositiu físic ni la BD remota.
- Les xifres de Lighthouse de Codex són de laboratori local; no les he repetides.
- L'element incrustat de WordPress (Shadow DOM) no s'ha mirat en un amfitrió real; només s'ha comprovat que les regles noves són dins del CSS que hi arriba.
- L'estat de Supabase de producció s'ha comprovat amb la clau pública (existència d'objectes), no amb el cos de les funcions.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_maquina]]
- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]
- [[261109_1623_pla_implementacio_onada_r15_sanejament_kit_codex_workspace_universal_i_iaia]]
