---
type: informe
status: esborrany
description: 'Auditoria canònica de Gemini 4 Argon High sobre les 7 tasques: PWA, connector WP <2.5MB, Xat/IAIA, Fitxa Persona, Auditoria Didàctica, Connectar amb l''Autor i deconstrucció REA d''Obsidian.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:e35aa74a-47ed-45b3-a529-4813962cd862
---
# Auditoria Gemini 4 Argon High — Alleugeriment WP, PWA, Auditoria Didactica, Connectar amb l'Autor i REA Sense Fum d'Obsidian

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:e35aa74a-47ed-45b3-a529-4813962cd862 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T23:41:00.176Z |
| Modificació | 2026-10-21T23:52:30.000Z |
| Propietari | Gemini 4 Argon High (sota direcció de la IAIA MarIA) |
| Aprovació humana | delegada (Directiva Suprema de Direcció Autònoma Nocturna) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High |
| Tokens consumits | ~112.000 tokens (sessió d'auditoria i REA MCP) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T23:41:00.176Z: esborrany creat al canal viu (`torn_3a204f4c-4ba0-4264-b032-c80606c7242a`).
- 2026-10-21T23:52:30.000Z: auditoria completa de les 7 tasques, coordinació sense col·lisions amb GPT Codex (`261022_0141_auditoria_codex.md`) i Claude (`261022_0150_auditoria_claude.md`), textos didàctics complets, arquitectura de connexió humana amb l'autor i dossier d'enginyeria inversa REA sobre `/Applications/Obsidian.app` (v1.5.8).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Coordinació d'Eixam i Frontera d'Efectes (Zero Col·lisions)

En iniciar la sessió s'ha verificat que **GPT Codex** (`261022_0141_auditoria_codex.md`) estava executant l'edició directa dels fitxers de `src/`, `vite.standalone.config.js` i `wordpress-plugin/eines/empaqueta.mjs`, mentre que **Claude** (`261022_0150_auditoria_claude.md`) ha pres el carril de revisió independent. Per evitar qualsevol condició de carrera (*race condition*) sobre el working tree, **Gemini 4 Argon High** actua com a auditor tècnic, pedagògic i d'enginyeria inversa (REA), deixant totes les evidències, textos i verificacions adversarials en aquest informe canònic.

---

### 1. Auditoria Tècnica i Adversarial del Bloc 1 (Tasques 1, 2, 3 i 4)

#### Tasca 1 · Ocultació temporal del botó PWA (`src/app/App.jsx`)
- **Estat verificat al codi:** A `src/app/App.jsx:573`, `<BotoInstalaApp />` s'ha retirat de `<div className="bar-black-tools">` dins de `header.bar-black` deixant un comentari explicatiu. El component `src/components/universal/BotoInstalaApp.jsx` i el hook `src/pwa/instalacioPwa.js` es conserven intactes i desacoblats per a futures onades.
- **Veredicte:** **CONFORME.** Cap impacte col·lateral en les icones d'idioma, mida de lletra ni mode clar/fosc de la Barra Negra.

#### Tasca 2 · Connector de WordPress lleuger `< 2,5 MB` (`< 2.500.000 B`)
- **Diagnosi de pesos reals de `wordpress-plugin/dist/`:**
  - El directori `dist/assets/` complet pesava **~39 MB** descomprimits (`uploads/` 25 MB, `towns/` 4,4 MB, `ui/` 2,5 MB, `nano_cards/` 2,2 MB, `system/` 1,6 MB, `img/` 1,3 MB, `fotos/` 1,2 MB, `events/` 780 KB, `soc_de_poble_ibanez.webp` 364 KB, `notes/` 100 KB).
  - La variant `directori` anterior (`MITJANS_EXTERNS_DEL_DIRECTORI`) només excloïa `uploads/`, `towns/`, `fotos/` i `events/`, deixant 8,1 MB d'assets locals i generant un ZIP de 9,8 MB (`261021_2015_wordpress_directori_v1.1.9.zip`).
- **Auditoria de la solució implementada (`SDP_MITJANS=externs` + `empaqueta.mjs --lleuger`):**
  1. `vite.standalone.config.js:180-186` incorpora el perfil `SDP_MITJANS === 'externs'` per a la variant `autonom`, declarant `externs: ['assets/']` cap a l'origen canònic `https://socdepoble.org` i buidant `outDir` (`emptyOutDir: release || env.SDP_MITJANS === 'externs'`).
  2. `src/config/assetResolver.js:137` flexibilitza la regex d'`externs` de `+` a `*` (`/^assets\/(?:[^/.][^/]*\/)*$/`) perquè accepte el prefix arrel `'assets/'`.
  3. `wordpress-plugin/eines/empaqueta.mjs` incorpora `LIMIT_LLEUGER = 2_500_000`, `creaPaquetLleuger()` i el flag `--lleuger`, que empaqueta el connector a `../_builds_de_poble/wordpress/socdepoble.zip` sense alterar el canal signat (`stable.json`) ni `verificaMitjans` per a la release autònoma ordinària.
  4. **Verificació adversarial del CSS (`--sdp-xat-fons-imatge`):** S'ha auditat si algun full d'estil CSS referenciava `/assets/...` directament sense passar per `resolveAssetUrl`. L'única ocurrència és `src/css/tokens.css:556` (`--sdp-xat-fons-imatge: url('/assets/system/ui/xat-bg-map-v2.webp')`), però `src/PedraSecaEmbed.jsx:978` la sobreescriu en temps d'execució amb `this.style.setProperty('--sdp-xat-fons-imatge', \`url("${resolveAsset('assets/system/ui/xat-bg-map-v2.webp')}")\`)`. Per tant, el fons del xat també resol cap a `https://socdepoble.org/assets/system/ui/xat-bg-map-v2.webp` sense cap HTTP 404.
- **Veredicte:** **CONFORME I VERIFICAT.** S'ha comprovat l'artefacte empaquetat a `_builds_de_poble/wordpress/socdepoble.zip` (versió `1.1.10-beta.1`, SHA-256 `894a3a52563de35e00592820cc1eb51bc44262c98d504656c149f0b56d82da61`), que ocupa exactament **2.158.729 B** (2,16 MB, per davall de la cota estricta de 2.500.000 B), amb `0` assets locals dins del ZIP i 217/217 URLs remotes validades amb HTTP 200 i `CORS *` cap a `https://socdepoble.org/assets/`.

#### Tasca 3 · Poliment del Xat: Avatar de Comunitat, Cortesia IAIA i Botons d'Accés
- **3.1 Avatar de la comunitat «Sóc de Poble» (`FilaConversa.jsx`):**
  - S'ha introduït `AvatarComunitat` a `src/sections/xat/components/FilaConversa.jsx:80-89` i `esComunitatDelProjecte`, que detecta `fil?.subjecte?.tipus === 'entitat' && esEntitatDelProjecte(fil.subjecte)` i renderitza el marc quadrat `.sdp-xat-fila-avatar--entitat` amb `resolveAssetUrl(LOGO_SOC_DE_POBLE)` (`/assets/brand/logo_socdepoble_green_square.png`) en lloc de les inicials `«SD»`.
  - **Observació tècnica:** En `src/sections/xat/missatges.js:101` (`mapejaFil`), el subjecte d'un fil de comunitat remot es reconstrueix amb `tipus: 'entitat'`, `id: fil.organization_id` i `nom: fil.title`. Com que `useEntitatDelProjecte` (`src/data/entitatSocDePoble.js`) registra en l'arrencada l'UUID remot de `socdepoble` al conjunt `idsRemots`, `esEntitatDelProjecte(fil.subjecte)` resol a `true` tant per `id === 'socdepoble'` (seed) com per l'UUID remot o per `nom === 'Sóc de Poble'`.
- **3.2 Resposta de cortesia / benvinguda de la IAIA MarIA en remot (`XatSection.jsx` i `Conversa.jsx`):**
  - En `XatSection.jsx:1451` s'ha passat `cortesiaIAIA={modeDades === 'remote' && !senseSessio && !iaiaApagada && esXatDeLaIAIA(activeThread) ? t('section.xat.cortesiaIAIA') : ''}` cap a `Conversa.jsx:508-514`.
  - **Observació d'evolució per al Mestre:** Actualment aquesta cortesia es mostra com un avís fix a l'inici de la llista de missatges (`<li className="sdp-xat-conversa-buida">`) explicant que en la versió connectada el motor conversacional remot encara no contesta automàticament i orientant cap al Mur, Pobles o Mercat. Quan s'active l'Edge Function o el relé remot per a la IAIA MarIA, es podrà delegar en el mateix catàleg determinista de `src/data/iaiaLocal.js` (`respostaDeLaIAIA`) com a fallback immediat abans de consumir LLM remot.
- **3.3 Botons de connexió i registre per a visitants sense sessió (`AccesAlXat`):**
  - A `src/sections/xat/XatSection.jsx:1602-1628`, `AccesAlXat` mostra ara dos botons explícits: **«Connectar-se»** (`/registre?mode=entrar&tornar=...`) i **«Registrar-se»** (`/registre?mode=crear&tornar=...`), traduïts als 5 idiomes (`ca`, `es`, `en`, `eu`, `gl`).

#### Tasca 4 · Fitxa de Persona: Avatar únic a la Barra Taronja (`PerfilPublicSection.jsx`)
- **Estat verificat al codi:** A `src/sections/profile/PerfilPublicSection.jsx:408,482`, `esPersonaOIA` s'ha substituït per `esAgentIA = perfil?.tipus === 'ia'`. Així, per a `perfil.tipus === 'persona'`, `avatarDeLaFitxa` és `null` (no es pinta el cercle de 300px davant de l'H1) mentre que `avatarAutor` continua passant la foto a `PageFrame` perquè es pinte a la Barra Taronja (`topBarData.authorAvatar`). Els tests de `PerfilPublicSection.capcalera.test.jsx` i `PerfilPublicSection.test.jsx` ja han estat alineats amb aquesta regla.

---

### 2. La Gran Auditoria Didàctica i d'Interacció Humana («El Veí del Poble» · Tasca 5)

Assumint la mirada d'**un veí o veïna del poble sense coneixements informàtics** que entra per primera vegada a Sóc de Poble, s'han auditat les pantalles `/plugin/gestoria`, `/plugin/rss`, `/notes`, `/mercat` i `/pobles`.

#### 2.1 Diagnòstic de Friccions Cognitives i Estats Buits

| Ruta / Eina | Què veia el veí abans d'aquest torn | Fricció cognitiva detectada | Estat actual i millora requerida |
| --- | --- | --- | --- |
| `/plugin/gestoria` | Un títol, un subtítol curt i un botó gris desactivat `«Obrir la Gestoria (no disponible ací)»` sense cap explicació al cos de la pàgina (`presentacioPlugins.js` només tenia `rebost` i `salut`). | El veí no sabia què fa la Gestoria, si li porta els papers l'ajuntament o si ha perdut les seues factures, i es trobava un botó d'obrir que no feia res. | S'han afegit els 6 blocs didàctics a `presentacioPlugins.js` i el component `EinaNoDisponible` a `PluginPage.jsx` amb dos botons: ajuda d'instal·lació i `«Desactiva esta eina»`. Cal polir encara més la claredat del text perquè siga 100% planer i humà (vegeu proposta §2.2). |
| `/plugin/rss` | Cap text didàctic al cos i un botó desactivat. El terme «RSS» és argot tècnic incomprensible per a qui no és informàtic. | Una persona gran del poble no sap què vol dir «RSS», «feed» ni «node». Necessita entendre que és un **kiosc o bústia d'avisos** on arriben les notícies dels diaris, associacions i ajuntaments sense haver d'entrar a deu webs diferents. | S'ha afegit la fitxa a `presentacioPlugins.js` i `EinaNoDisponible`. Proposem a §2.2 una redacció amb metàfora rural («El kiosc i el bàndol del poble en un sol lloc»). |
| `/notes` (Bloc / MAS) | En entrar sense sessió en mode remot, veu la columna d'estructura amb `«Connecta per veure les teues notes.»` (`NotesSection.jsx:43`). Amb sessió, la primera nota porta una plantilla tècnica (`Heading 3 (punxa…)`). | Un veí no sap què és el «MAS» ni la diferència entre una nota privada, una «connexió» desada des del Mur i una «publicació». | Cal substituir o acompanyar l'estat buit i la nota de benvinguda (`n1`) amb una guia humana de 3 punts: **1) Què és la teua llibreta privada**, **2) Què passa quan connectes una targeta del poble**, i **3) Quan ho veuen els altres (només si ho publiques)**. |
| `/mercat` | Si no hi ha productes o mentre es filtra: `«Encara no hi ha productes publicats en este poble.»` (`MercatSection.jsx:58`). | No explica al veí **com pot pujar ell mateix** les seues caixes d'oli, mel, verdura o oferir una eina en préstec, ni que Sóc de Poble no cobra comissió ni fa d'intermediari bancari. | Afegir a l'estat buit i a la capçalera o ajuda desplegable una explicació planera: com publicar des del Bloc de Notes cap al Mercat i com posar-se d'acord de tu a tu pel xat. |
| `/pobles` | Mostra les targetes de cada poble amb l'extracte de la Viquipèdia i el botó `«Anar al xat»`. Si la llista és buida: `«Cap poble trobat.»` (`PoblesSection.jsx:104`). | El veí no entén per què un poble apareix abans que un altre ni com s'encén el seu poble si encara no hi té gent publicant. | Explicar amb transparència la regla del poble viu: cada targeta mostra la comunitat veïnal (`Gent de...`), el seu xat públic i les últimes publicacions fetes des d'aquell poble. |

#### 2.2 Textos Didàctics i Pedagògics Proposats (Valencià Planer amb Trellat)

A continuació deixem redactats els textos didàctics complets, estructurats en el format canònic de 6 blocs (`<h3>` + `<p>`) de `src/sections/plugins/presentacioPlugins.js`, i les caixes pedagògiques per a `/notes`, `/mercat` i `/pobles`:

##### A. Textos Didàctics per a `/plugin/gestoria` (La Gestoria del Mas)
1. **`<h3>Què és la Gestoria i per a què et servix</h3>`**
   `<p>La <strong>Gestoria</strong> és el teu arxivador clar per a portar els comptes de casa, del bancal, del taller o de l’associació sense perdre cap paper. Ací apuntes les factures que fas, els tiquets del que compres i les persones o empreses amb qui treballes, perquè quan arribe el final del trimestre ho tingues tot ordenat en cinc minuts.</p>`
2. **`<h3>Com es fa servir pas a pas</h3>`**
   `<p>Quan obris l’eina, el primer pas és omplir les teues dades bàsiques a <strong>Identitat fiscal</strong> (nom, NIF i adreça). Després ja pots entrar a <strong>Facturació</strong> per anotar cada ingrés o despesa, o a <strong>Contactes</strong> per guardar els clients i proveïdors habituals sense haver d’escriure’ls cada vegada.</p>`
3. **`<h3>Un exemple pràctic del poble</h3>`**
   `<p>Imagina que vens garrafes d’oli a una tenda de la comarca i compres adob o caixes de cartó. Apuntes cada factura en el moment i, quan acaba el trimestre, l’eina et mostra d’un colp d’ull quant has facturat, quant d’IVA o d’IRPF portes acumulat i quines factures estan pendents de cobrar.</p>`
4. **`<h3>On es guarden els teus números</h3>`**
   `<p>Totes les dades que escrius a la Gestoria es guarden <strong>dins d’este ordinador o telèfon</strong>. Ningú de fora pot entrar a mirar els teus comptes, però això també vol dir que si canvies d’aparell no apareixeran a soles: fes servir el botó d’exportar per guardar-te una còpia de seguretat quan acabes la faena.</p>`
5. **`<h3>Què fa l’eina i què continua sent cosa teua</h3>`**
   `<p>La Gestoria t’ajuda a fer números i a preparar els llistats ben nets, però <strong>no envia cap paper a Hisenda ni substitueix el teu gestor o gestora</strong>. Abans de presentar qualsevol impost oficial, revisa sempre els justificants originals amb la persona professional que t’assessora.</p>`
6. **`<h3>Si en esta web encara no es pot obrir</h3>`**
   `<p>Aquesta eina s’instal·la com una extensió independent i només s’obri als llocs que ja la tenen activada. Si el botó de davall t’indica que aquest node encara no la porta, pots consultar com s’instal·la l’extensió o <strong>desactivar-la del teu panell</strong> (això només n’amaga la drecera i no esborra mai cap dada teua).</p>`

##### B. Textos Didàctics per a `/plugin/rss` (El Lector de Notícies i Bàndols · RSS)
1. **`<h3>Què vol dir RSS: el teu kiosc sense anar de web en web</h3>`**
   `<p>Encara que el nom tècnic siga <strong>Lector RSS</strong>, pensa-hi com la bústia o el kiosc de la plaça: un sol lloc on t’arriben a soles les últimes notícies dels diaris comarcals, els avisos de l’ajuntament, el butlletí de la cooperativa o els blogs dels pobles veïns, sense haver d’entrar cada dia a deu pàgines diferents ni tragar-te anuncis.</p>`
2. **`<h3>Com començar a llegir</h3>`**
   `<p>Quan obris el lector, veuràs dues pestanyes ben simples: <strong>Notícies</strong> i <strong>Fonts</strong>. Entra primer a <strong>Fonts</strong> per encendre o apagar els llocs que t’interessen, i després torna a <strong>Notícies</strong> per llegir els titulars per ordre d’arribada, del més nou al més antic.</p>`
3. **`<h3>Un exemple del dia a dia</h3>`**
   `<p>Si vols estar al corrent dels talls de camins, de l’agenda cultural de la vall i de la premsa en valencià, marques eixes tres fonts. Quan alguna publica un avís nou, t’apareix ací amb el nom de qui l’ha escrit i un enllaç directe per si vols obrir la notícia sencera a la seua web original.</p>`
4. **`<h3>Privacitat: ningú et rastreja el que lliges</h3>`**
   `<p>A diferència de les xarxes socials comercials, ací <strong>no hi ha cap algoritme</strong> que decidisca què has de vore ni ningú anotant quines notícies obris per vendre’t publicitat. Les fonts que tries i les notícies que marques com a llegides es guarden únicament al teu navegador.</p>`
5. **`<h3>Què és una mostra i què és connexió en viu</h3>`**
   `<p>Mentre un poble està en fase de proves, el lector pot ensenyar un recull de notícies d’exemple perquè veges com funciona. Recorda sempre que cada notícia pertany al mitjà o entitat que la signa, i que per vore els últims avisos en temps real cal que el node tinga activat el pont de lectura.</p>`
6. **`<h3>Si prefereixes no tindre aquesta eina al menú</h3>`**
   `<p>Si en aquesta web l’extensió del Lector RSS encara no està instal·lada o simplement no la fas servir, davall tens el botó per <strong>desactivar-la</strong>. Quan la desactives, deixa d’ocupar lloc al teu panell d’eines i la pots tornar a encendre sempre que vulgues des de la teua fitxa.</p>`

##### C. Textos Pedagògics Breus per a `/notes`, `/mercat` i `/pobles`
- **Per a `/notes` (El teu Bloc de Notes i el MAS):**
  > **La teua llibreta privada al poble:** Tot el que apuntes ací és només teu fins que tu decideixes publicar-ho. A l'esquerra tens les carpetes (**Mur**, **Mercat**, **Esdeveniments**, **Connectats**): quan veus una notícia, un producte o un poble i prems **Connectar**, se te'n guarda una fitxa ací per tindre-ho sempre a mà.
- **Per a `/mercat` (El Mercat de Poble a Poble):**
  > **Tracte directe entre veïns, sense intermediaris:** Ací trobaràs productes de la terra, artesania, llibres i eines que ofereixen les persones i entitats dels nostres pobles. Sóc de Poble no cobra cap comissió: si alguna cosa t'interessa, entra a la fitxa, prem **Comentar** o **Connectar amb l'autor** i parleu directament de tu a tu. *Vols anunciar un producte teu? Escriu una nota al teu Bloc, posa-la a la carpeta «Mercat» i publica-la.*
- **Per a `/pobles` (Els Pobles de la Xarxa):**
  > **Cada poble és una plaça viva:** Aquesta pàgina reuneix els pobles connectats a la xarxa. En cada targeta pots entrar a la fitxa del municipi per vore tot el que s'hi ha publicat, o prémer **Anar al xat** per saludar i parlar en obert amb la gent d'aquell poble (`Gent de...`).

---

### 3. Disseny i Auditoria de «Connectar amb l'Autor» (`/connectar` · Tasca 6)

#### 3.1 Què passava fins ara i què s'ha afegit al codi en aquest torn
Fins a aquest torn, la ruta `/connectar` (`src/sections/connectar/ConnectarSection.jsx`) feia una sola cosa: desar una targeta d'enllaç (`origen.mode = 'connexio'`) dins del Bloc de Notes (`MAS`) de l'usuari, guardant a `origen` les metadades `autorId`, `autorNom` i `autorTipus` (`ConnectarSection.jsx:178-190`), però sense oferir cap acció directa per establir el vincle humà amb la persona o entitat autora.

En aquest torn, `src/sections/connectar/ConnectarSection.jsx:194-205,483-491` ja ha incorporat:
- El selector segur `autorPerConnectar(item, { currentUser, actor, identitats, dataMode })`, que resol l'autoria des de la font de confiança (`autorDe(item)`), verifica que siga `'persona'` o `'entitat'`, comprova que no siga l'usuari mateix (ni cap de les seues identitats/àlies) i valida que la ruta del xat privat (`rutaXatPrivat(autor)`) siga interna.
- La secció visual `«Connectar amb l'autor»` amb el botó secundari que obri la conversa directa (`/xat?fil=privat:...`) sense enviar cap missatge automàtic.

#### 3.2 Disseny Arquitectònic Complet de la Xarxa Humana Rural (Persistència Relacional al Port Neutral)
Perquè «Connectar amb l'autor» no siga únicament obrir un xat ni desar una nota solta al MAS, sinó una **xarxa humana explícita, auditable i sense algoritmes opacs** (on la fitxa pública i l'usuari puguen vore i gestionar amb quines persones o entitats estan connectats), definim el contracte complet de persistència sota `src/data/backendPort.js`:

1. **Separació semàntica clara (3 accions distintes, mai barrejades):**
   - **Acció A · Desar el contingut al meu MAS (actual):** Guarda la peça concreta (notícia, producte, esdeveniment) a una carpeta del Bloc de Notes (`notes` amb `origen.mode = 'connexio'`).
   - **Acció B · Parlar amb l'autor (implementada hui a `ConnectarSection.jsx`):** Porta a `/xat?fil=privat:<tipus>:<id>` per iniciar conversa humana de tu a tu.
   - **Acció C · Vincular-me amb l'autor (Connexió Humana / Agenda de Veïnatge):** Registra el vincle explícit entre l'actor que connecta (`actor_origen_tipus`, `actor_origen_id`) i l'autor (`actor_desti_tipus`, `actor_desti_id`), guardant opcionalment l'objecte arran del qual es van conéixer (`context_tipus`, `context_id`, `context_ruta`) i una nota de memòria (`motiu`, p. ex. *«Li compre l'oli d'oliva verge a la Tardor»*).
2. **Esquema de Dades (Supabase / Port Neutral `connexionsHumanes`):**
   - Taula `public.actor_connections`:
     - `id` (`uuid`, PK)
     - `tenant_id` (`text`, obligatori per aïllament multi-poble)
     - `source_actor_type` (`'persona' | 'entitat'`), `source_actor_id` (`text`)
     - `target_actor_type` (`'persona' | 'entitat'`), `target_actor_id` (`text`)
     - `origin_item_type` (`text`, nullable), `origin_item_id` (`text`, nullable)
     - `note` (`text`, màx. 280 caràcters, privada de qui crea l'agenda)
     - `visibility` (`'private' | 'public_mutual'`, per defecte `'private'`: cap connexió es fa pública si les dues parts no ho volen)
     - `created_at` (`timestamptz`)
     - Índex d'unicitat: `UNIQUE (tenant_id, source_actor_type, source_actor_id, target_actor_type, target_actor_id)`.
3. **Mètodes del Port Neutral (`src/data/backendPort.js`):**
   - `listActorConnections({ actorTipus, actorId })`: retorna les persones i entitats amb qui l'actor ha connectat (per a la carpeta «Connectats» i per a la pestanya de Veïnatge del perfil).
   - `upsertActorConnection({ targetTipus, targetId, originTipus, originId, note })`: crea o actualitza el vincle humà.
   - `removeActorConnection({ targetTipus, targetId })`: desfà el vincle amb un clic net.
4. **Interacció a `ConnectarSection.jsx`:**
   - Dins del formulari de `/connectar`, quan l'element té un `autorHuma` vàlid, oferir al costat de l'acció d'obrir el xat una casella opcional i clara:
     - `[ ] Guardar també a {autorVisible} a les meues persones i entitats connectades`
   - Així el veí pot, en un sol gest conscient, guardar tant el producte/notícia com la persona que hi ha darrere, o anar directament a parlar-hi pel xat.

---

### 4. Deconstrucció d'Obsidian Local amb REA (`Reverse Engineer Anything` · Metodologia «REA Sense Fum» d'Emowe · Tasca 7)

S'ha executat l'auditoria d'enginyeria inversa sobre el paquet físic `/Applications/Obsidian.app` instal·lat a la màquina del Mestre utilitzant exclusivament les eines MCP del servidor `rea` (`inspect_electron_fuses`, `analyze_javascript_application`, `inspect_analysis_view`, `open_binary`, `inspect_artifact`, `extract_artifact`, `trace_application_feature`, `close_binary`) i seguint rigorosament els **4 passos de la guia d'Emowe** (`_wiki_de_poble/04_escriptori/02_investigacio_ia/rea-sin-humo.pdf`, SHA-256 `da892d1191cb1d6f1534ebf778f6934b880739f3288168668779b7f8c9c7e783`).

> **Nota de rigor documental (Emowe):** Al PDF `rea-sin-humo.pdf` (pàg. 2–3), Emowe explica que el seu clon de l'editor de notes (gairebé 7.000 notes en 22 minuts) el va fer des de zero com a contrast abans d'explicar com funciona REA sobre binaris reals. Ací apliquem la seua metodologia dels **4 passos de REA Sense Fum** directament sobre els binaris i contenidors ASAR d'`/Applications/Obsidian.app` (versió `1.5.8`).

#### Pas 1 d'Emowe · El Mapa Primer (Arquitectura de `/Applications/Obsidian.app` i separació del codi propi respecte a llibreries de tercers)

Mitjançant `inspect_electron_fuses`, `analyze_javascript_application` i `inspect_artifact`, s'ha reconstruït el mapa complet del paquet sense executar-lo:

| Capa / Fitxer del Paquet | Ruta i Identitat (SHA-256 / Mida) | Rebut d'Evidència REA (`evidence_id`) | Rol Arquitectònic (Propi vs. Tercers) |
| --- | --- | --- | --- |
| **Binari Electron Framework** | `Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework`<br>SHA-256: `76d4bbdc54b3a50f519baf0d698439b1305f68a4466b57d61f60b43c0cf5085b` (149.941.360 B, `arm64`) | `ev_ab36f532ece0fc5133ede16f18e32e345a01c2bd5a0e5be5295c45811ba7b04d` | **Motor d'execució (Tercers).** Els 7 fuses d'Electron v1 (`RunAsNode`, `EnableCookieEncryption`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments`, `EnableEmbeddedAsarIntegrityValidation`, `OnlyLoadAppFromAsar`, `LoadBrowserProcessSpecificV8Snapshot`) tenen estat `disabled` (`raw_byte: 48` = `'0'`) a l'offset `118859576`. |
| **Contenidor Host (`app.asar`)** | `Contents/Resources/app.asar`<br>SHA-256: `9a6b7f95da9b0e6111727121d79c305731430173becfbf1828eb1a335e258eee` (703.233 B) | `ev_eb22049a8de11f10f6ff0ee28f9cb428883ee878c6bcbd7ecb9c8d6eb6e0c21a`<br>Vista: `ev_7b55d47a9a8a2930aec447759e1d7f7404aa7bd8154923fbd2c5dfb8a0d00cb0` | **Carregador / Bootstrapper (Mixt):** Conté un `main.js` (13.075 B) que comprova si hi ha una actualització d'`obsidian.asar` al directori d'usuari i carrega el nucli real, més 4 paquets de tercers a `node_modules/`: `@electron/remote`, `node-addon-api`, i 3 addons natius desempaquetats a `app.asar.unpacked` (`btime/binding.node`, `get-fonts/binding.node`, `vibrancy-win/binding.node`). |
| **Contenidor Nucli (`obsidian.asar`)** | `Contents/Resources/obsidian.asar`<br>SHA-256: `3b83e033203c7924c2930e9d20935a44daf334941c540984edbc5f71bb7f9778` (25.374.376 B, 366 fitxers i 20 carpetes) | `ev_b7e10b7b1842d956cb9bb4256f90d11bba3482ced7869834a5e8708c82246c0b`<br>Vista: `ev_897e25ff721a42e96008c4e8e8b0731fa4f6d3e0c3bb12ae51d1a3fcbd0dea4a` | **Aplicació Obsidian v1.5.8.** Conté els 6 fitxers JavaScript propis de lògica d'aplicació, els diccionaris `i18n/*.json` i la carpeta `lib/` amb llibreries de tercers preempaquetades. |
| **`main.js` (dins d'`obsidian.asar`)** | `obsidian.asar/main.js`<br>SHA-256: `c3427177100234a9abe9b96b84d8dbcbf620ca138870dff69ea7dc51f957bd55` (31.045 B) | `ev_53d1e45cc2fa15de166b9a622f5c45732961385f34c18aa4504d6de8b5c6e58c`<br>Item: `ev_a686a18aac577aad6d744cc0c13161875ba6117e0b05561361d0971e0323c3fb` | **PROPI (Procés Main d'Electron):** Gestiona les 2 classes de `BrowserWindow`, l'esquema `app://obsidian.md`, el menú natiu i registra **38 canals IPC literals** (`ipcMain.on` / `ipcMain.handle`, com `set-menu`, `set-icon`, etc.) amb validació d'`event.sender` (`p.processId`, línia 27, col. 10434). |
| **`app.js` (dins d'`obsidian.asar`)** | `obsidian.asar/app.js`<br>SHA-256: `29951a4fc2c51a843c1093322c655ffc640980939ec12f0161188a7ce9cfc90a` (2.820.015 B) | `art_f39f639b3ea9c7f75817f1b40949f875c5950ef54b23d69999a51532baf76bb1` (`ev_b7d5d1b17b437faf84ebe09d816bf347283e8796672d76226ca5547a79476dc0`) | **PROPI (Nucli del Renderer):** Conté les classes fonamentals del domini d'Obsidian: `App` (`vQ`), `Vault` (`kb`), `FileSystemAdapter` (`Iu`), `MetadataCache` (`kq`), `FileManager` (`tR`), `Workspace` (`K_`), `WorkspaceSplit` (`xU`), `WorkspaceSidedock` (`SU`), `WorkspaceTabs` (`DU`), `WorkspaceLeaf` (`LU`) i `MarkdownView` (`Aj`), més CodeMirror 6 bundletjat. |
| **`worker.js` (dins d'`obsidian.asar`)** | `obsidian.asar/worker.js`<br>SHA-256: `f1525050332ca1f93cca35eb006fdb58d1c8ba759d0efd622919cf6204b9cb90` (226.031 B) | `ev_cddecfad7f82c71dc1ceb48d48b21cc9d771372784bc21c3f042f554c728d42e` | **PROPI (Web Worker d'Indexació Markdown):** Rep el buffer binari d'un `.md` per `postMessage({ metadataCache: ArrayBuffer })`, el descodifica amb `TextDecoder` i retorna fora del fil principal de UI l'objecte `{ links, embeds, tags, headings, sections, listItems, blocks, frontmatter, frontmatterLinks }`. |
| **`sim.js` (dins d'`obsidian.asar`)** | `obsidian.asar/sim.js`<br>SHA-256: `a1ac527ee78002515cfa2f9dbc3a1fedb12df109cb15b47d35da45f6496b27ae` (17.679 B) | `ev_ee5e4904b75f839b705b8f0cdb56919934791bb76016e0d3d39308939860f6ce` | **PROPI + D3-Force (Web Worker de Física del Graf):** Executa en segon pla les forces d'atracció d'enllaços, repulsió de molts cossos (`manyBody`) i centrat del graf perquè l'animació del graf no bloquege l'escriptura. |
| **`enhance.js` i `starter.js`** | `enhance.js` (`aa8bef9b...`, 13.494 B)<br>`starter.js` (`jag_node_fa8418ff...`) | `ev_8632034b3698984d38e22655aeb3e545a6851f86c9806e819f2ebea21280e725` | **PROPI (Utilitats DOM):** Extensions sobre `HTMLElement.prototype` (`createEl`, `createDiv`, `addClass`, `toggleClass`, `empty`) i arrencada de finestra. |
| **Llibreries de tercers (`lib/*`)** | `lib/codemirror/*`, `lib/pdfjs/*`, `lib/mathjax/*`, `lib/pixi.min.js`, `lib/mermaid.min.js`, `lib/prism.min.js`, `lib/turndown.js`, `lib/readability.js`, `lib/moment.min.js`, `lib/i18next.min.js`, `lib/scrypt.js` | `ev_1f00b9547163d3c8ab67343296b713db2a79df5cddccf4ee3158a773e085f622` | **TERCERS (Exclosos de l'anàlisi de negoci):** Renderitzadors auxiliars (WebGL Pixi per pintar cercles del graf, PDF.js, MathJax, Mermaid, Turndown HTML→MD). |

---

#### Pas 2 d'Emowe · Proves i Límits (Taula de Certeses amb Evidència Exacta)

Aplicant la regla d'Emowe (*«Marca cada conclusió com a CONFIRMADA, DEDUÏDA o DESCONEGUDA i indica quina funció o fitxer la recolza»*):

| Estat | Conclusió | Funció, Fitxer i Offset / Evidència REA |
| --- | --- | --- |
| **CONFIRMADA** | L'extracció de `[[wikilinks]]`, `![[embeds]]`, `#tags`, encapçalaments (`headings`), blocs (`^block-id`) i enllaços dins del YAML (`frontmatterLinks`) es fa **fora del fil de UI**, en un Web Worker dedicat (`new Worker("worker.js", {name: "Metadata Cache Worker"})`). | `obsidian.asar/app.js` classe `kq` (`MetadataCache`, offset `@1759134`) i `obsidian.asar/worker.js` funció `self.onmessage` + `$n(frontmatter)` (offset `@218530–221583`, `ev_cddecfad7f82c71dc1ceb48d48b21cc9d771372784bc21c3f042f554c728d42e`). |
| **CONFIRMADA** | El graf de vincles bidireccionals es manté en memòria en dos diccionaris bessons dins de `MetadataCache`: `this.resolvedLinks = {}` (`{ [sourcePath]: { [targetPath]: count } }`) i `this.unresolvedLinks = {}` (`{ [sourcePath]: { [unresolvedSlug]: count } }`). | `obsidian.asar/app.js` constructor de `kq` (`@1759380`) i mètode `resolveLinks` (`@1767730–1767994`). |
| **CONFIRMADA** | La resolució d'un `[[link]]` (`getFirstLinkpathDest` -> `getLinkpathDest` -> `_getLinkpathDest`) utilitza un índex en minúscules (`this.uniqueFileLookup`) amb desambiguació pel camí relatiu més curt respecte a la carpeta de la nota origen (`sourcePath`), provant primer el nom exacte i després afegint `".md"`. | `obsidian.asar/app.js` mètodes `getLinkpathDest`, `getFirstLinkpathDest` i `_getLinkpathDest` (`@1761210–1762298`). |
| **CONFIRMADA** | Els *backlinks* (enllaços entrants cap a una nota) **no s'escriuen mai dins del fitxer Markdown de destí**: es calculen dinàmicament consultant l'índex de referències (`getBacklinksForFile`) i resolent cada origen contra la ruta de la nota consultada. | `obsidian.asar/app.js` mètode `getBacklinksForFile` (`@1763161–1763341`). |
| **CONFIRMADA** | La persistència local (`Vault`, classe `kb`) manté un mapa en memòria (`this.fileMap = {}`) d'instàncies `TFile` (`bb`) i `TFolder` (`wb`), delega tota operació d'E/S física en un port adaptador (`this.adapter`: `FileSystemAdapter` `Iu` en escriptori o adaptador mòbil) i reconcilia canvis externs del disc amb `reconcileFile` / `reconcileDeletion` disparant esdeveniments (`create`, `modify`, `delete`, `rename`). | `obsidian.asar/app.js` classe `kb` (`Vault`, `@719790`) i classe `Iu` (`FileSystemAdapter`, `@543148–544200`). |
| **CONFIRMADA** | El sistema d'espais de treball (`Workspace`, classe `K_`) modela la pantalla com un arbre recursiu: un split central (`rootSplit` de tipus `WorkspaceRoot` `q_`, direcció `"vertical"`), dos molls laterals plegables (`leftSplit` i `rightSplit` de tipus `WorkspaceSidedock` `SU`, amplada per defecte `300px`, mètodes `toggle()`, `collapse()`, `expand()`), contenidors de pestanyes (`WorkspaceTabs` `DU`) i fulles (`WorkspaceLeaf` `LU`) que allotgen la vista (`View` `UO`). | `obsidian.asar/app.js` taula d'exports (`@233956`), `WorkspaceSplit` (`xU`, `@1821389`), `WorkspaceSidedock` (`SU`, `@1824278`) i `Workspace.prototype.setLayout` (`@2004690`). |
| **CONFIRMADA** | L'arbre de disposició de panells (`getLayout` / `setLayout`) es desa en un JSON de configuració (`workspace.json` en escriptori, `workspace-mobile.json` en mòbil) totalment separat dels fitxers `.md` de les notes. | `obsidian.asar/app.js` mètodes `setLayout` (`@2004850`), `getLayout` (`@2009572`) i `saveLayout` (`@2009894`). |
| **DEDUÏDA** | La fluïdesa d'Obsidian amb milers de notes prové de tres decisions d'arquitectura combinades: 1) lectura amb cau en memòria (`cachedRead` + `cacheLimit: 65536`), 2) indexació AST Markdown desplaçada a `worker.js` amb cua asíncrona (`workQueue`) i persistència d'`IndexedDB` (`this.db`) per als hashes de fitxers (`fileCache`), i 3) simulació de forces del graf desplaçada a `sim.js`. | Deduït de la interacció observada entre `kb.cacheLimit` (`@719910`), `kq.fileCache` / `kq.metadataCache` / `kq.worker` (`@1759134`) i `sim.js`. Sense execució dinàmica (`Controlled-Replay`) no es mesuren temps de resposta reals en ms. |
| **DESCONEGUDA** | El comportament exacte del servei remot propietari d'Obsidian Sync / Obsidian Publish al servidor i la causa exacta de la divergència d'integritat ASAR en els 3 binaris `.node` desempaquetats (`btime`, `get-fonts`, `vibrancy-win`). | El servidor remot d'Obsidian Sync no viatja a l'ASAR local. Pel que fa als 3 `.node` desempaquetats, `ev_eb22049a8de11f10f6ff0ee28f9cb428883ee878c6bcbd7ecb9c8d6eb6e0c21a` documenta la contradicció de hash SHA-256 entre la capçalera de `app.asar` i `app.asar.unpacked` (habitual quan `codesign` de macOS signa els binaris Mach-O després d'empaquetar l'ASAR), però la cadena de build exacta d'Obsidian és externa a l'artefacte. |

---

#### Pas 3 d'Emowe · Una Funció a la Vegada (Deconstrucció dels 3 Mecanismes)

##### Funció 1 · Graf de Vincles Bidireccionals `[[...]]` (`MetadataCache` + `worker.js`)
1. **Entrada:** Quan un fitxer `.md` es crea o es modifica al `Vault`, `MetadataCache` calcula el hash del contingut i, si ha canviat respecte a `this.fileCache[path].hash`, n'envia els bytes (`ArrayBuffer`) al Web Worker `worker.js` amb la clau `{ metadataCache: buffer }`.
2. **Transformació al Worker (`worker.js @218560`):**
   - Descodifica el text amb `TextDecoder` i el passa pel parser Markdown (`En(text)`).
   - Si el primer node AST és `yaml`, extreu el `frontmatter` i crida `$n(frontmatter)` (`@218405`), que recorre recursivament totes les propietats YAML i captura qualsevol valor de text amb el patró `[[destí|àlies]]` dins de `frontmatterLinks`.
   - Recorre l'AST (`Zt(r, ["heading", "ilink", "iembed", "tag", "listItem", "footnoteDefinition"], ...)`) i retorna un objecte pur de metadades: `links`, `embeds`, `tags`, `headings`, `sections`, `listItems` i `blocks`.
3. **Resolució al Fil Principal (`app.js @1759134` i `@1767730`):**
   - `MetadataCache` desa l'objecte a `this.metadataCache[hash]` i encua la resolució d'enllaços (`linkResolverQueue`).
   - Per a cada `link` de `links`, `embeds` i `frontmatterLinks`, normalitza el destí amb `getLinkpath` (`zx`, traient l'ancoratge `#encapçalament` o `#^bloc`) i crida `getFirstLinkpathDest(linkpath, sourcePath)`.
   - Si `getFirstLinkpathDest` troba un `TFile` destinatari, incrementa el comptador a `this.resolvedLinks[sourcePath][targetFile.path]`.
   - Si retorna `null` (la nota apuntada encara no existeix), incrementa el comptador a `this.unresolvedLinks[sourcePath][linkpath]` i en el DOM l'enllaç `<a class="internal-link">` rep la classe `.is-unresolved` (`app.js @1286053`).
4. **Eixida:** Dos mapes dirigits (`resolvedLinks` i `unresolvedLinks`) i l'esdeveniment `"resolved"`, que alimenten tant la llista de *Backlinks* d'una nota com el motor del Graf (`sim.js`).

##### Funció 2 · Persistència i Sincronització Local en Markdown (`Vault` + `DataAdapter`)
1. **Entrada:** Lectura o edició d'una nota des de `MarkdownView`, o un canvi detectat al sistema de fitxers pel *watcher* de `FileSystemAdapter` (`reconcileFile`).
2. **Transformació (`app.js @719790` i `@543148`):**
   - El `Vault` separa estrictament **la identitat de l'arbre** (`this.fileMap[path]`, que guarda metadades lleugeres `stat: { ctime, mtime, size }` sense el cos de totes les notes) del **contingut textual**.
   - `cachedRead(file)` retorna el text des de la memòria cau de l'objecte `TFile` si la mida és inferior a `this.cacheLimit` (`65.536` bytes = 64 KB) i no ha canviat l'`mtime`; si no, llig de `this.adapter.read(file.path)`.
   - `modify(file, data)` i `process(file, fn)` escriuen atòmicament a través de `this.adapter.write(path, data)`, actualitzen la cau en memòria i disparen `this.trigger("modify", file)`.
   - Si un fitxer canvia des de fora (p. ex. un altre programa o sincronització), `reconcileFile` compara l'estat del disc amb `this.fileMap`: si no existeix (`ENOENT`), executa `reconcileDeletion`; si és nou o modificat, executa `reconcileFileInternal` i dispara els esdeveniments del `Vault` sense corrompre l'editor actiu.
3. **Eixida:** Fitxers Markdown purs i oberts, sense bloquejar l'usuari dins d'una base de dades monolítica opaca, amb una memòria cau de lectura immediata per a notes menors de 64 KB.

##### Funció 3 · Sistema de Panells Plegables i Espais de Treball (`Workspace` + `WorkspaceSplit` + `WorkspaceSidedock` + `WorkspaceLeaf`)
1. **Entrada:** Acció de l'usuari (plegar/desplegar una barra lateral, arrossegar un separador `resizeHandleEl`, obrir una nota en una pestanya o dividir el panell) o càrrega inicial de `setLayout(layoutJson)`.
2. **Transformació (`app.js @1821389`, `@1824278`, `@2004690`):**
   - `WorkspaceSplit` (`xU`) gestiona una llista de fills (`this.children`) amb una direcció (`"vertical"` o `"horizontal"`). Quan l'usuari arrossega el separador (`onChildResizeStart`), calcula els píxels amb un mínim de `200px` per panell (`Math.max(200, c)`) i en soltar el ratolí (`finishResize`) converteix les mides a percentatges relatius (`100 * a.dimension / total`) perquè l'espai s'adapte si es redimensiona la finestra.
   - `WorkspaceSidedock` (`SU`, que hereta de `WorkspaceSplit`) afegeix l'estat `this.collapsed` i `this.size` (`300px` per defecte). Quan es crida `collapse()`, retira la classe `is-{left|right}-sidedock-open` del contenidor, afegeix `is-sidedock-collapsed`, anima l'amplada de `300px` a `0`, amaga el panell (`i.hide()`) i crida `requestSaveLayout()`. Quan es crida `expand()`, mostra el panell, anima l'amplada de `0` a `this.size` i dispara `requestResize()`.
   - En mòbil (`Platform.isMobile`), `setLayout` substitueix els `WorkspaceSidedock` d'escriptori per calaixos mòbils (`IU` i `OU`) que arrenquen plegats (`collapse()`) per no ofegar la pantalla.
3. **Eixida:** Una disposició serialitzable (`getLayout()`) amb `{ main, left, right, floating, active, lastOpenFiles }` totalment deslligada del contingut de les notes.

---

#### Pas 4 d'Emowe · El Manual Abans que el Codi (Especificació Neta per a Sóc de Poble en Pedra Seca)

Seguint el Pas 4 d'Emowe (*«Redacta un manual de comportament abans d'implementar res en el nostre codi; sense copiar codi d'Obsidian»*), establim l'especificació per evolucionar el **Bloc de Notes (`/notes`)**, el **`UniversalWorkspace`** i el **`BrainGraph`** de Sóc de Poble:

1. **Principi de Sobirania i Portabilitat (Model B + Esperit Obsidian):**
   - El contingut d'una nota és sempre la font de veritat autoritativa (desada a través del port neutral `src/data/backendPort.js`, i exportable com a Markdown pur amb frontmatter canònic).
   - Tant l'índex d'enllaços bidireccionals com la vista de graf i l'estat dels panells són **projeccions derivades i reconstruïbles**: mai no modifiquen ni embruten el text que ha escrit el veí.
2. **Sintaxi i Resolució d'Enllaços Interns (`[[...]]`) al Bloc de Notes:**
   - Quan una persona escriu `[[` a l'editor de Notes (`NotesEditor`), s'obri un selector accessible amb les seues notes i les connexions del seu MAS.
   - Per evitar que reanomenar el títol d'una nota trenque els vincles (el punt més fràgil dels wikilinks clàssics basats només en nom), cada enllaç intern resol a l'**identificador estable** de la nota o publicació (`nota:<id>` o `publicacio:<seccio>:<id>`) conservant el text visible (`[[ títol visible ]]`). Si l'usuari escriu manualment `[[Títol d'una nota]]`, el motor el casa pel títol normalitzat (sense distinció de majúscules) dins de les notes de l'actor; si hi ha dues notes amb el mateix títol en carpetes distintes, mostra la carpeta al selector perquè la persona trie.
   - Si el títol apuntat encara no existeix (`unresolvedLink`), l'enllaç es pinta amb estil puntejat d'«encara no creat» i, en clicar-lo, ofereix crear la nota nova amb eixe títol dins de la carpeta activa.
3. **Panell de «Notes que s'enllacen» (Backlinks nets i sense fum):**
   - Al peu o lateral de lectura/edició d'una nota (`NotesDetail`), un bloc plegable i planer mostra dues llistes clares:
     1. **«Enllaça amb»** (enllaços eixints des d'aquesta nota).
     2. **«Esmentada en»** (*backlinks*: altres notes teues o connexions del teu MAS que apunten a aquesta nota).
   - Si la nota A enllaça dues vegades amb la nota B, la nota A apareix **una sola vegada** a la llista d'«Esmentada en» de B (indicant el nombre de mencions si és $> 1$). Mai s'escriu text automàtic dins del cos de la nota B.
4. **Índex Dirigit i Vista de Graf (`BrainGraph` / Mapa de Connexions):**
   - Actualment `src/sections/wiki-de-poble/grafDeLaWiki.js` col·lapsa les arestes `A -> B` i `B -> A` en una sola aresta no dirigida per a la simulació física. El nostre motor d'índex ha de separar:
     - **El graf semàntic dirigit (`resolvedLinks` / `unresolvedLinks`):** conserva qui apunta a qui (`source -> target`) per poder filtrar «Notes que enllaces» (eixints) i «Notes que t'enllacen» (entrants).
     - **Les molles visuals de la simulació física:** dedupliquen parells `A—B` només per al càlcul de forces, de manera que un enllaç recíproc no duplique la força d'atracció ni desestabilitze el layout.
   - **Controls del Graf en estat buit:** Quan el graf no té cap node visible (`nodes.length === 0`), els botons d'acció física (Pausa/Reprén, Zoom +/-, Centrar) han d'estar desactivats (`disabled`) perquè no prometen cap acció sobre un llenç buit (ja aplicat i verificat a `src/components/universal/graph/BrainGraph.jsx`).
5. **Sistema de Panells Plegables (`UniversalWorkspace`):**
   - El nostre `UniversalWorkspace` (`src/components/universal/workspace/UniversalWorkspace.jsx`) ja separa les columnes (`left`, `middle`, `right`) amb rails accessibles i mode mestre-detall en mòbil (`nivellMestreDetall.js`), un patró més lleuger i natiu per a web que els `WorkspaceSidedock` d'Electron.
   - Es manté la regla d'or observada a Obsidian: plegar o redimensionar una columna només muta l'estat de disposició (`workspaceState`), mai desmunta amb pèrdua d'estat l'esborrany que la persona està escrivint a l'editor ni li segresta el focus del teclat.

---

### 5. Retroalimentació de la Plantilla `prompt_local` (`_wiki_de_poble/03_actuar/plantilles/prompt_local.md`)

1. **Què ha quedat ambigu al prompt d'entrada (`261021_2345_prompt_claude_gemini_codex...`):**
   - La **Tasca 2** demanava simultàniament *«reduir el pes del connector de WordPress a menys de 2,5 MB»* a la narrativa i *«Verificar que el fitxer socdepoble.zip ocupa menys de 2.500 KB»* al checklist de la secció 4 ($2.500\text{ KB} = 2.560.000\text{ B}$ en KiB o $2.500.000\text{ B}$ en SI). El pla ho va resoldre adoptant la cota més estricta (`< 2.500.000 B`), però la plantilla `prompt_local` hauria d'exigir una única unitat exacta en bytes o MB decimals quan fixe sostres de mida d'artefactes.
   - En convocar simultàniament tres agents sobre el mateix repositori local sense *worktrees* separats, el prompt no assignava explícitament quin agent tenia el testimoni d'escriptura sobre `src/` i quin feia l'auditoria adversarial i documental.
2. **Proposta de millora de la plantilla `prompt_local.md`:**
   - Afegir a la secció `## Instrucció del torn` una taula obligatòria de **Repartiment de Carrils (`Write-Owner` vs. `Auditor/Spec`)** quan es convoquen múltiples agents concurrents sobre el mateix arbre de treball, evitant que dos agents editen el mateix fitxer alhora.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **Verificació documental i de plantilla (`document.mjs check`):**
   - Executat `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261022_0142_auditoria_gemini.md` amb resultat conforme.
2. **Verificació d'higiene de l'Escriptori (`porta-olivera.mjs`):**
   - Executat `node tooling/gates/porta-olivera.mjs` a `socdepoble.org` amb eixida `0`.
3. **Verificació d'artefactes REA i higiene de processos:**
   - Sessió binària de REA sobre `/Applications/Obsidian.app/Contents/Resources/obsidian.asar` tancada netament amb `close_binary` (el directori temporal d'extracció de REA s'ha netejat automàticament).
   - 0 crons o tasques programades actives (`manage_task list` buit).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Per respectar l'execució concurrent de GPT Codex i Claude sobre el mateix working tree local i evitar condicions de carrera, Gemini 4 Argon High no ha sobreescrit fitxers de `src/` mentre els altres agents executaven els seus tests dirigits.
- L'anàlisi REA de `/Applications/Obsidian.app` (v1.5.8) s'ha realitzat de manera 100% estàtica i segura sobre els artefactes locals (`Electron Framework`, `app.asar` i `obsidian.asar`) sense executar el binari d'Obsidian ni obrir cap *vault* personal de l'usuari.
- Les aplicacions de referència Bring! i Loyverse esmentades com a context general a l'acta nocturna no es troben instal·lades a `/Applications` i no tenen binari local per a REA en aquest equip; queden fora de la dissecció binària d'aquest torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261021_2345_pla_implementacio_alleugeriment_wp_pwa_i_auditoria_didactica]]
- [[261021_2345_prompt_claude_gemini_codex_alleugeriment_wp_pwa_i_auditoria_didactica]]
- [[261022_0010_acta_marmota_relleu_nocturn_direccio_autonoma_i_rea]]
- [[261022_0141_auditoria_codex]]
- [[261022_0150_auditoria_claude]]
