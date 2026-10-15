---
type: informe
status: esborrany
description: 'Execució de Claude Opus 5.5: Gestoria en tres passos per a la fita del dia 20, avatar propi i actor actiu del Xat, amb proves i revisió adversarial'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7dc02fd3-b1b4-4c4e-929a-a651549d1d0f:9b46eac6-54ec-4904-a907-db04e384e2c1
---
# Auditoria i execució de Claude Opus 5.5 a la Taula de l'Olivera

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7dc02fd3-b1b4-4c4e-929a-a651549d1d0f:9b46eac6-54ec-4904-a907-db04e384e2c1 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T14:36:08.633Z |
| Modificació | 2026-10-14T15:58:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, app d'escriptori), amb 18 subagents en tres workflows |
| Tokens consumits | ~4,1 M en subagents (lectura 1,42 M; implementació i revisió 2,17 M; poliment i suite 0,50 M) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-14T14:36:08.633Z: esborrany creat; contingut i verificació pendents.
- 2026-10-14T14:40Z · **Relleu 1 (canal viu):** torn obert, lectura en paral·lel en marxa, cap edició de codi.
- 2026-10-14T14:57Z · **Relleu 2:** línia base mesurada, decisions d'abast i correccions a Gemini 4 (vegeu Troballes §5).
- 2026-10-14T15:35Z · **Relleu 3:** implementació feta, revisió adversària sense cap objecció alta ni mitjana.
- 2026-10-14T15:58Z · **Tancament de l'execució:** poliment de 8 objeccions baixes, suite sencera en verd, verificació al navegador i decisions per al Mestre. v1.1.0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Què queda fet (resum per al Mestre)

**Gestoria · Facturació en tres preguntes (G1).** A `/app/gestoria/facturacio` la factura nova es llig com a «Qui factura?» (nom legal i NIF del perfil, només de lectura), «A qui i què?» i «Revisa i emet». En emetre, la factura s'obri sola amb el botó «Imprimeix o desa en PDF». Un selector «Client d'una factura anterior» omple els cinc camps del client, que es poden editar. Veri*Factu, l'AEAT, l'XML de prova i els interruptors del QR van darrere de «Detalls tècnics». El tipus de factura, la data de l'operació i la descripció van a «Més opcions», que s'obri sola si hi ha cap opció triada. «Data de pas» ara és «Primer dia que factures ací». Els passos 1 i 2, quan ja estan fets, queden recollits. Tot dins de `src/sections/gestoria/facturar/`, que **no és font de cap tractor**: el Mestre no ha de tornar a signar res.

**Gestoria · Full trimestral congelat fins al 20.** No l'he tocat. Les seues fonts (`PanellGestoria`, `useGestoria`, `ContenidorGestoria`, `VistaPreviaFull`, `EnviamentGestoria` i el nucli) són a l'empremta dels tractors `gestoria.factures` i `gestoria.correus` (`src/sections/gestoria/tractors.js:28-107`), aprovats hui a les 11:37Z. Gemini 4 l'ha declarat apte per al dia 20 i el meu lector no hi ha trobat cap bloqueig. Les millores possibles van a §3, perquè totes obliguen a tornar a signar.

**Xat · Front A.** El peu del rail pinta la foto pròpia. Usa `CaraXat` (`ClosCaXat.jsx:387-389`), que resol pel port les fotos pujades `sdp-media://`. La proposta del pla (`<Avatar src={joAvatar}>`) no hauria funcionat: `Avatar` descarta les referències `sdp-media://` i pinta les inicials (`src/components/PedraSeca/atoms/Avatar.jsx:63-67`). Sense foto, el peu és idèntic a abans: ho he comprovat al navegador.

**Xat · Front C, sense mentir.** El backend **no** deixa triar amb quina veu s'envia un missatge. `xat_envia` no rep cap actor i decidix per fil a partir de `xat_participants.com_org_id` (migració `2610081543`:195-258). Per això `joId`, `joNom` i `joAvatar` continuen sent la persona, i ara la capçalera de `XatContext` ho explica. XatContext exposa `entitatActiva`, que és el mateix `actor` que pinta la barra negra. Amb Sóc de Poble actiu, el peu del rail pinta el seu logo en quadrat i el botó diu «Tu: ajustos (actues com a Sóc de Poble)». El compositor diu qui signa de veritat a cada fil:
- als fils on signa l'entitat: «Escrius com a Sóc de Poble»;
- als fils personals amb una entitat activa: «Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble».

La línia queda lligada al camp amb `aria-describedby`. Hi ha tres claus i18n noves a les cinc llengües.

**Identitat · Front B.** La regla del Mestre (pujada a Sóc de Poble > foto d'OAuth > inicials) viu en un sol punt, `triaAvatar` (`src/app/contexts/personaDeSessio.js`). La crida `personaDeSessio`, i ara també `/el-meu-perfil` (`PerfilContext.jsx:424`). La firma i la validesa de la fila no canvien.

**Línia base.** La suite tenia **1 prova roja** abans de començar: `indexConsola.test.js:322`. La imatge `fedivers_vinyeta.jpg` va entrar amb el commit 31d93d88 sense actualitzar la prova. Ara està arreglada, i les 18 il·lustracions de les ordres continuen sent 18. També he donat 20 s a `HistoricCofre.test.jsx:284`, que fallava per temps quan la suite corre en paral·lel.

### 2. Per què el Mestre pot continuar veient la foto de Google a gentdelatorre.net

Els Fronts A i B arreglen el codi, però probablement no la causa. La foto naix a `public.profiles.avatar_url`, i el trigger d'alta hi copia la de Google (`supabase/migrations/2609261500_identitat_perfil_f1.sql:796-810`). Si la foto es va pujar al Supabase local (127.0.0.1:54321) i no al de producció, la fila de producció continua tenint Google, i el codi pinta bé la dada que té. Cal mirar dues coses a gentdelatorre.net:
1. Si `profiles.avatar_url` del compte comença per `https://lh3.googleusercontent.com`: cal tornar a pujar la foto en eixe entorn.
2. Si a la consola apareix «[supabase] Avís consultant profiles»: `getProfile` falla i manen les metadades de Google (`src/data/supabase/auth.js:167-201`).

### 3. Decisions que només pot prendre el Mestre

1. **Full trimestral, després del 20** (tots obliguen a tornar a signar els tractors de factures i correu):
   - el CSV i l'XLSX per a la gestora tenen 8 columnes, sense Quota IRPF (`nucli/plantilla.js:79-88`); una factura amb retenció ix amb Subtotal + IVA diferent del Total;
   - «Genera-la igualment» accepta factures encara en dòlars i les escriu amb «€» (`useGestoria.js:605-610`, `nucli/diners.js:109-114`);
   - la revisió feta es perd en canviar de mòdul o tancar la pestanya (`ShellGestoria.jsx:472-492`);
   - un IVA estranger de més del 21,6 % (l'irlandés del 23 %) ix en roig amb un missatge de «base i IVA al revés» (`nucli/model.js:308-312`);
   - cal decidir si fal.ai i Anthropic porten `ivaHabitual 0` al catàleg (inversió del subjecte passiu): és una decisió fiscal.
2. **El Tauler s'obri al 4T 2026**, però hui és oberta la presentació del 3T (fins al 20/10). El text ja ho diu (`tauler/nucli/targetesTauler.js:485-490`). Un botó «Ves al 3T» és fàcil (`ShellGestoria.jsx:416-427` ja canvia el trimestre), però toca fonts del tractor del Tauler. El Full trimestral ja agafa el 3T per defecte (`useGestoria.js:162-165`).
3. **Aprovar els tractors fa eixir de la Gestoria**: es va a la Wiki i no hi ha cap camí de tornada (`src/apps/gestoria/rutes.js:36, 44-47`).
4. **«Qui factura?» amb diverses identitats** (Javi autònom, Sóc de Poble, el Rentonar): hui hi ha un sol perfil fiscal (`useFacturacio.js:191`). És un redisseny.
5. **Pont llibre → Full trimestral**: les factures emeses a la Facturació no entren al full, que només llig la carpeta de PDF. És un redisseny i toca fonts signades.
6. **Front C:** la línia «Escrius com a {entitat}» ix sempre que el servidor signa com l'entitat, també si a la barra actues com a persona. És la veritat, però és un píxel nou. Queda així o només quan la barra diu una altra cosa?
7. **ADR «veu de l'actor al xat»:** vols que una entitat puga signar en qualsevol fil (General, directes, pàgines)? Caldria un paràmetre nou a `xat_envia` validat al servidor, canviar la clau única de `xat_participants`, la RLS, el contracte del port i el kit de conformitat.
8. **L'actor dins de `ambitEstable`** (`XatContext.jsx`): canviar d'actor torna a muntar el xat sencer i n'esborra les bombolles en error, encara que el servidor torne la mateixa llista. Ho mantenim?
9. **Altres cadenes de foto** que no passen per `triaAvatar`: `src/sections/notes/autoriaNota.js:152`, `src/data/localPerfils.js:91` i la fila de reserva d'`src/data/supabase/auth.js:198`. A més, l'avatar redó de la capçalera de /el-meu-perfil llig només la fila (`perfilCamps.js:110`).

### 4. Pendents menors (sense decisió humana)

- Les claus d'eu i gl de `section.xat.signa.*` i `section.xat.ajustos.obriComEntitat` són una proposta i les ha de revisar algú que parle basc i gallec. Van marcades a `src/config/i18n.js`.
- El catàleg de disseny (`EspecimenXatRail.jsx:99`, `EspecimenXat.jsx:247`) no nomena les props noves `joAvatar`, `entitatActiva` ni la línia de qui signa.
- Encara queda jerga «del pas» als missatges de `src/sections/gestoria/facturacio/` (`serie.js:145-148`, `emissio.js:154`, `magatzemPerfil.js:94, 157`, `configEmpresa.js:106`), fora de l'abast de G1.
- Paritat de la llavor: als Avisos, `localXat.js:401` signa com l'entitat, però el fil diu `comEntitat: false` (`localXat.js:307`). `quiSigna` ho cobrix amb la regla del canal.
- `personaDeSessio.js` importa ara `sanitize.js` (DOMPurify) i ja no es pot importar en Node pur. Hui no ho fa ningú.

### 5. Contrast amb Gemini 4 (261014_1638)

Coincidim en la trampa de `sdp-media://` al Front A, en la finestra de la firma, en el veredicte «apte per al 20» del Full i en el fet que `facturar/` no és font de cap tractor. Discrepàncies, verificades al codi:
- `NIF_INVALID` és severitat «mitjana», no «alta» (`nucli/model.js:317`). La segona casella del pas 4 només ix per `MONEDA_ESTRANGERA`, `IVA_INCOHERENT` o IVA > 21,6 %.
- Per al rail, `CaraXat` i no `AvatarResolt`: `AvatarResolt` pinta les inicials un fotograma abans de la imatge (`src/hooks/useResolvedAsset.js:131`).
- Front C: no he apuntat `joNom`/`joAvatar` a l'actor actiu, com proposava Gemini. Tots els missatges propis passarien a «other» (`missatges.js:129-142` compara amb `joId`) i es trencaria la decisió d'Onada 3 fixada a `XatContext.test.jsx`. El camp real és `actor.avatar`, no `actor.avatarUrl` (`IdentitatContext.jsx:143, 149`).
- Rutes inexistents: `components/universal/Avatar.jsx`, `TopBar.jsx` i `components/universal/identitat/personaDeSessio.js`. Un avatar va al bucket `mitjans`, no a `mitjans_privats` (`src/data/supabase/storage.js:282-300`).
- «Emissió PDF Veri*Factu en 1 clic» no és possible: el codi diu que la menció VERI*FACTU i la remissió a l'AEAT no existixen (`ImpressioFactura.jsx:23-28`). No he promés res de «segellat» ni d'«oficial».

### 6. Retroalimentació sobre la plantilla `prompt_local`

- Per a Claude, el hook local (`tooling/gates/hooks-local.mjs` i `mutation-policy.mjs`) **bloqueja** escriure a `.agents/` (ESTAT, LEDGER) i executar `tancament.mjs`. El prompt ho demana igualment. La plantilla hauria de dir que eixos passos són de MarIA quan l'executor és Claude o Codex.
- El canal viu «cada 10-15 minuts» funciona si el document d'auditoria es crea complet des del primer relleu: la porta de la plantilla refusa qualsevol escriptura amb seccions `[pendent]`.
- Un pla que proposa una línia de codi concreta (Front A) hauria de demanar a l'executor que la verifique contra el component abans d'aplicar-la. La del pla no funcionava.
- La ruta `tooling/session/mapa-consola.mjs` del prompt és `tooling/brain/mapa-consola.mjs` (ho va detectar Gemini 4).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Suite sencera de vitest** (`npx vitest run src tests --silent --reporter dot`, inici 17:38:19, 830 s, sobre el codi final): **1.039 fitxers; 17.619 proves verdes, 0 roges, 89 omeses.** Línia base d'abans: 1.038 fitxers, 17.561 verdes, 1 roja i 89 omeses. El fitxer nou és `Compositor.test.jsx`.
- Després de la suite només he tocat comentaris, en cinc fitxers. Les proves afectades, tornades a passar: `personaDeSessio`, `PerfilContext` i `IdentitatContext.perfil` donen 118/118; `Compositor` i `ClosCaXat` donen 46/46.
- **`node --test`** (vitest no les cobrix) sobre 10 fitxers relacionats: `lint_xat`, `lint_pantalla_completa`, `lint_logica_usuari`, `tractor-inline-styles`, `tractor-importacions`, `design-contracts`, `gestoria-3t-real`, `public_exports`, `pedra-debt` i `action-contrast`. Hi ha 6 fallades, i cap no ve d'este torn:
  - 4 són de `gestoria-3t-real.test.mjs`. Llig la carpeta real del 3T i declara deute conegut: G3T-04 i G3T-05 («falta de veres una factura a la carpeta») i l'extracte Norma 43 absent. Cap dels mòduls que importa ha canviat.
  - 2 són diagnòstics de `lint_logica_usuari.test.mjs` sobre una llista fixa de fitxers d'un torn antic (260927_1925): classes òrfenes de `PageFrame.jsx` i tokens del calendari a `modules.css`. Ningú no ha tocat cap dels dos fitxers.
  - No vaig mesurar `node --test` abans de començar. Per tant, «no ve d'este torn» és una inferència feta a partir del que lligen eixes proves, no una comparació.
- **Tractors:** `git status --short` no mostra cap fitxer llistat a `src/sections/gestoria/tractors.js`. `src/sections/tractors` i `privacitat.test.js` són verds.
- **Revisió adversària:** dues lents per front (correcció/regressió i doctrina/píxel/accessibilitat). No ha eixit cap objecció alta ni mitjana. He aplicat 8 de les 9 baixes; l'altra, el contracte del catàleg, queda a §4. Una part d'una objecció es va rebutjar perquè no es podia reproduir: `potEscriure` no pot fer aparéixer la línia amb el camp muntat.
- **Navegador** (localhost:3340, pestanya pròpia):
  - `/app/gestoria/facturacio` es pinta neta després de recarregar, amb l'entradeta planera, «Detalls tècnics» plegat i «Primer dia que factures ací», i sense errors de consola.
  - A `/xat` sense sessió, el peu del rail és idèntic a abans: «T» i «Tu».
  - Els errors `useSession`/`useIdentitat ha de ser usat dins de…` que es veuen durant l'edició són de recàrrega en calent (URL amb `?t=…`) i no es reproduïxen en carregar de nou. És la directiva 4 de l'ESTAT, que continua oberta.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No he emés cap factura de prova al navegador.** El llibre és de només afegir (cadena Veri*Factu) i el panell és compartit amb el Mestre: una factura falsa s'hi quedaria per sempre. El flux «emet → PDF» està provat amb jsdom. Abans del 20 convé que el Mestre hi faça una passada amb una factura real.
- **No he verificat al navegador el cas amb foto ni amb entitat activa**: no hi ha sessió en la pestanya, i no introduïsc contrasenyes. Ho cobrixen les proves (`XatSection.avatars.test.jsx`, `ClosCaXat.test.jsx`).
- **ESTAT, LEDGER i `tancament.mjs` són de MarIA.** El hook local em bloqueja `.agents/` i `tancament.mjs`. No he fet cap commit ni he mogut cap document.
- A l'arbre hi ha canvis d'altres actors fets en paral·lel que no són meus: `src/sections/detail/`, `src/sections/pobles/`, `wordpress-plugin/`, `.agents/` i el pla 1450.
- No he deixat cap cron ni cap tasca programada: «cadascuna a sa casa».

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_1450_pla_implementacio_sincronitzacio_identitats_i_xat]]
- [[261014_1605_prompt_claude_opus_i_gemini4_taula_olivera]]
- [[261014_1638_auditoria_gemini4]]
