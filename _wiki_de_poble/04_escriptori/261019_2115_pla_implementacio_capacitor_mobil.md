---
type: document
status: esborrany
description: Pla tècnic per a instal·lar Capacitor 8, connectar politicaDeMitjans autonom a vite.natiu.config.js i preparar el llançament a Android i iOS
tags:
  - implementacio
visibility: private
reflex: sdp:torn_b133a06e-33c6-4d0e-ab14-aea86b297f5b:7b31811b-b1d7-4a7a-b94d-7de4e84eabd2
---
# Pla d'Implementació — Fase C: Capacitor 8 i Empaquetat Mòbil

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b133a06e-33c6-4d0e-ab14-aea86b297f5b:7b31811b-b1d7-4a7a-b94d-7de4e84eabd2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T19:15:12.978Z |
| Modificació | 2026-10-19T21:18:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Aprovat pel Mestre per àudio (19/10/2026 21:13) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Antigravity) + Claude Code + Gemini 4 Argon |
| Tokens consumits | ~16.5k / 2M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-19T19:15:12.978Z: esborrany creat.
- 2026-10-19T21:18:00.000Z: Pla completat i aprovat pel Mestre per àudio («Adelante con la fase C»). El Mestre delega la decisió tècnica i coordinació autònoma en la IAIA MarIA (sessió de lectura/descans). Incorporació preceptiva del Sentinella de Seguretat (`core-seguretat-audit`), connectors REA (`reverse-engineer-anything`) i auditoria d'alletjament extrem del Core de Sóc de Poble.
- 2026-10-19T21:28:00.000Z: Correcció d'higiene segons instruccions del Mestre (Àudio 21:26). Evacuats els 11 documents consumits de les fases A i B a `90_arxiu_historic/261019_fases_a_i_b_webp_i_skills/`. L'Escriptori queda lliure amb només els 3 documents vius de la Fase C. S'afigen les tasques d'automillora de `core-higiene-escriptori` (Claude) i destil·lació dels 49 ítems de `02_investigacio_ia` (Gemini).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Closca nativa Capacitor 8 (versió fixada 8.5.x)
- **Instal·lació de dependències a package.json:** `@capacitor/core@^8.5.0`, `@capacitor/cli@^8.5.0`, `@capacitor/android@^8.5.0`, `@capacitor/ios@^8.5.0`.
- **Configuració canònica:** desplegar `capacitor.config.json` des del laboratori `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/capacitor.config.json.txt` a l'arrel del repositori.
  - AppId: `org.socdepoble.app`
  - AppName: `Sóc de Poble`
  - webDir: `dist-natiu`
  - androidScheme: `https`, iosScheme: `capacitor`, hostname: `localhost`
  - android: `minWebViewVersion: 100`, `allowMixedContent: false`
  - plugins: deshabilitar `CapacitorHttp` i `CapacitorCookies` per defecte (privacitat i aïllament estricte).

### 2. Optimització radical de mitjans a `vite.natiu.config.js`
- **Connectar `politicaDeMitjans('autonom')`:** importar i aplicar la política de mitjans definida a `src/config/politicaDeMitjans.js`.
- **Efecte de pes:** en construir `dist-natiu`, s'ometen els fitxers originals PNG/JPG pesats quan existix la bessona WebP, aconseguint que la carpeta `dist-natiu/` passe de **169 MB a 48 MB** (−71% de pes), complint folgadament els requeriments de descàrrega de Google Play i App Store.
- **Blindatge d'esquema d'URL:** revisar `isSafeUrl` a `src/components/universal/UniversalUtils.js` per permetre `capacitor://` com a esquema vàlid i segur a iOS.

### 3. Scripts d'empaquetat i botigues (`scripts/botigues/`)
- Moure i materialitzar els tractors del laboratori `nous/botigues/` a `scripts/botigues/`:
  - `entorn.mjs` (verificació de SDKs, Node 22+, Xcode 27+, Android Studio Otter).
  - `preflight.mjs` (comprovació de binaris, icones PNG a sang, fitxes de botiga).
  - `puja-android.mjs` (signatura AAB i publicació a pista interna).
  - `puja-ios.mjs` (validació de perfils Provisioning i TestFlight via altool/xcrun).
  - Prova de contracte: activar `tests/botigues.test.mjs`.

### 4. Sentinella de Seguretat Mòbil (`core-seguretat-audit`)
- **Zero Confiança al Client:** el bundle natiu és un client públic no de confiança.
- **Permisos mínims:** validar que `AndroidManifest.xml` i `Info.plist` no sol·liciten cap permís perillós innecessari (`CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`) excepte quan siga imprescindible i sota interacció explícita.
- **CSP Nativa Segellada:** meta CSP estricta sense `eval`, amb `worker-src: 'none'` i connexió exclusiva als dominis segellats de Supabase i entorns locals de desenvolupament.
- **Aïllament de credencials:** cap clau de servei (Service Role) ni secrets emmagatzemats en clar al WebView (`localStorage`/`sessionStorage`).

### 5. Connectors REA (`reverse-engineer-anything`)
- Utilització d'eines d'enginyeria inversa (REA) per disseccionar les millors pràctiques d'aplicacions cíviques i rurals de referència (patrons de càrrega offline, configuracions de WebView, manifestos de permisos i gestió de memòria cau).

### 6. Estratègia d'alletjament extrem: Core vs Plugins
- Analitzar i documentar amb precisió com el **Core pur de Sóc de Poble (arrencada + shell + sessió + port neutral)** pesarà menys de **300-500 KB**, i com la càrrega sota demanda (`import()`) dels diferents mòduls/plugins (Mercat, Fadrins, TPV/Loiverse, etc.) permetrà una aplicació ultralleugera que corre instantània fins i tot amb connexions 3G rurals.

### 7. Automillora de la Higiene Documental de l'Escriptori (`core-higiene-escriptori`)
- **Evacuació completada:** moguts els 11 documents de les fases anteriors d'avui a `90_arxiu_historic/261019_fases_a_i_b_webp_i_skills/`. L'Escriptori conté exclusivament els 3 documents vius de la Fase C.
- **Blindatge de la skill (encàrrec a Claude):** revisar i millorar la redacció i el codi del procediment d'higiene perquè abans d'iniciar una nova onada o prompt, l'orquestradora estiga obligada a sublimar les conclusions i arxivar immediatament els documents de la fase anterior, garantint que la següent IA troba una taula impol·luta sense soroll de context.

### 8. Destil·lació dels 49 ítems de `02_investigacio_ia` (encàrrec a Gemini)
- **Anàlisi del laboratori:** auditar de manera integral els 49 elements acumulats a `02_investigacio_ia/` des de setembre.
- **Preservació del coneixement:** extreure i protegir les lliçons clau, enllaços a repositoris de GitHub, patrons arquitectònics i eines d'automillora contínua.
- **Pla de neteja:** preparar la proposta per evacuar els experiments històrics cap a `_investigacio_ia_de_poble/` o `90_arxiu_historic/`, deixant el laboratori reduït als projectes realment actius.

### 9. Lògica d'UX de la Cerca, Enllaç al Perfil Públic i Targetes (Instrucció del Mestre 21:34)
- **Elevació del Cercador (`/cerca`):** El quadre de cerca (`UniversalSearch`) queda massa avall forçant l'scroll. Cal reubicar-lo immediatament davall de l'H1 de la pàgina (`Busca dins del contingut`) de manera que quede accessible en el primer plec visual sense haver de fer scroll.
- **Correcció de la destinació d'enllaç de persona:** A `src/sections/search/indexCerca.js:371`, la cerca associava `href: '/el-meu-perfil'` a la pròpia persona. Això és un error greu d'UX: la cerca pública ha d'enllaçar sempre a la **fitxa pública** (`/javillinares` o `/gent/:id`), mai a l'editor privat.
- **Botó d'accés al perfil públic des de l'editor (`/el-meu-perfil`):** A `PerfilEditor.jsx` / `PerfilShell.jsx`, afegir un botó d'acció clar tipus «Veure fitxa pública» / «Obrir la teua pàgina» que permeta a l'usuari anar directament a la seua fitxa pública sense haver d'escriure la URL a mà a la barra del navegador.
- **Visualització en Targetes (Cards vs Llistat):** Permetre que els resultats de cerca de Persones, Pobles i Mercat es puguen mostrar en format Targeta rica (`UniversalCard` / `TargetaViva` / `GraellaTargetes`) a més del llistat compacte, o oferir un selector de vista.
- **Verificació de fitxes úniques i zero duplicats/fantasmes:** Assegurar que tant per a persones com per a organitzacions es manté una sola fitxa canònica al graf sense entrades duplicades.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació de configuració de Capacitor:**
   ```bash
   node -e "const c = JSON.parse(require('fs').readFileSync('capacitor.config.json')); console.log('AppId:', c.appId, 'webDir:', c.webDir);"
   ```
2. **Build natiu optimitzat i mesura de mida:**
   ```bash
   npm run build:natiu
   du -sh dist-natiu/
   ```
   *Criteri d'acceptació:* Grandària inferior a 60 MB (objectiu ~48 MB amb WebP).
3. **Proves unitàries i d'integració:**
   ```bash
   npm run lint
   npm test
   ```
4. **Porta Olivera:**
   ```bash
   node tooling/gates/porta-olivera.mjs --informe
   ```

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Incompatibilitats de Capacitor 8 amb plugins legacy:** S'utilitzen exclusivament els paquets oficials de Capacitor 8.5.x sense dependències de tercers no mantingudes.
2. **Resolució d'imatges amb capacitor://localhost:** Risc de bloqueig a iOS si `isSafeUrl` només admet HTTP/HTTPS. Es mitiga afegint la prova de frontera i la whitelist de l'esquema natiu.
3. **Rebuig a Apple Store per guideline 4.2 o 4.3:** Es mitiga amb una sola app modular amb selector de municipi en temps d'execució i característiques natives (notificacions push, emmagatzematge local durador).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261019_1715_auditoria_claude_infraestructura]]
- [[261019_1730_auditoria_gemini_skills_i_laboratori]]

