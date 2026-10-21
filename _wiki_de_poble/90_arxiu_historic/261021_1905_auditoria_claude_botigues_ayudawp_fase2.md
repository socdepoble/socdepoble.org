---
type: informe
status: esborrany
description: 'Execució del pla 261021_1850: connector 1.1.9 i paquets, poda Salfumant fase 2 amb migració WebP verificada, tractor sdp-vigilant-tellado i sincronització nativa'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_8ee65040-5730-4568-b046-a661886e8590:96c1f225-3401-4725-9eeb-a29a0af140ce
---
# Auditoria Claude · Botigues, AyudaWP i Salfumant fase 2

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8ee65040-5730-4568-b046-a661886e8590:96c1f225-3401-4725-9eeb-a29a0af140ce |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T16:58:49.017Z |
| Modificació | 2026-10-21T18:25:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5-5 (Claude Code), amb 5 subagents de workflow |
| Tokens consumits | ~1,02 M als subagents, més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T16:58:49.017Z: esborrany creat (`torn_8ee65040`, actor claude, abast code), lligat al pla `261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2.md`.
- 2026-10-21T17:12Z: el Mestre tria al xat migrar només els rasters «segurs» (cap cita a SQL ni a `index.html`).
- 2026-10-21T17:55Z: relleu del canal viu (Mòduls C i B menors, Mòdul A part 1).
- 2026-10-21T18:05Z: la migració WebP (56) passa la verificació adversarial, amb dos problemes. Se'n restauren 24 i se'n verifica la restauració.
- 2026-10-21T18:15Z: release 1.1.9, `build:natiu` i `cap sync`.
- 2026-10-21T18:25Z: reescriptura completa amb l'estat final.
- 2026-10-21T18:35Z: per ordre del Mestre, commit `cefc12ab` sobre `dadeffe2` (branca `backup-notes-publish`, sense pujar). Porta els 88 fitxers del lot (6 altes, 49 supressions i 33 modificacions). S'ha fet amb índex temporal i llista explícita, i amb `--no-verify` autoritzat pel Mestre. L'arbre és `92b09f7d`, el que es va comprovar abans del commit. Queden fora l'informe, el registre del torn i els canvis d'altres mans.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

**Els quatre mòduls estan fets i confirmats al commit `cefc12ab` (sense pujar).** Vitest complet en verd (20.403 proves, 0 fallen), i també totes les proves del connector i del natiu.

- **A · Connector 1.1.9.** Els tres zips són a `_builds_de_poble/wordpress/`:
  - `261021_2015_wordpress_enxufe_v1.1.9.zip`
  - `261021_2015_wordpress_directori_v1.1.9.zip`, de 9.803.125 B (sota el límit de 10 MB) i sense actualitzador
  - `261021_2015_estatic_spa_v1.1.9.zip`

  El canal `stable.json` i `1.1.9.json` estan signats, però no publicats. La carpeta paràsita és en quarantena, no esborrada.
- **B · Salfumant fase 2:**
  - `assets/img/` de l'arrel evacuat (9,2 MB);
  - les dues làpides del Lector retirades;
  - migració WebP de **32 rasters** (28,95 MB fora de `public/`).

  Del pla als 32 hi ha dos filtres: la teua decisió al xat (cap risc de BD) i la Llei del Píxel. Taula a 3.3.
- **C · Tractor `sdp-vigilant-tellado`.** Instal·lat i segellat amb les regles VIG-01 a VIG-06 pel circuit Reflex i `executor-mutacio`.
- **D · Mòbils.** `build:natiu` i `cap sync` d'Android i d'iOS fets. Els dos paquets web ja no porten cap «conta», cap «DADES PROTEGIDES» ni cap iframe recursiu.

**Abans de publicar res** (decisions a la secció 6):

1. **Desplega primer socdepoble.org (D1).** El zip del directori demana 182 mitjans a `https://socdepoble.org`. La producció de juny no servix les bessones, i 32 imatges ara només existixen en `.webp`.
2. **Pujar el commit `cefc12ab`** (fet en local, sense pujar). Decisió teua.

### 1. Canal viu i coordinació

- **19:55 · Primer relleu.** Repartiment, decisió del Mestre sobre els rasters i les dues correccions al pla (1.1).
- **Gemini** té l'informe `261021_1900_auditoria_gemini_fase2.md` buit (`[pendent]`) a les 20:15. No ha tocat cap fitxer de producte (`git status`).
- **Arbre:** cap altra mà ha tocat els fitxers d'este torn. HEAD continua en `dadeffe2`.

#### 1.1 Relleu de les 19:55 (conservat)

**Per a Gemini i MarIA.** Mantinc el repartiment del torn anterior: Claude escriu a `src/`, `public/`, `wordpress-plugin/`, `tooling/` (via executor) i `.agents/skills/` (via executor). Gemini audita i contrasta.

**Decisió del Mestre (al xat, 19:12).** La migració WebP no es fa sobre els 130 rasters del pla, sinó només sobre els que no cita cap SQL de `supabase/` ni `index.html`/manifest, que són 80. D'eixos 80, Claude n'aplica 62: els que tenen la bessona amb les mateixes dimensions (Llei del Píxel). Els altres 18 tenen la bessona reduïda (fotos de 5.184 px a 1.600 i `nano_cards` de 1.024 a 768) o més gran, i queden fora.

**Fet:**

- **Mòdul C.** `.agents/skills/sdp-vigilant-tellado/SKILL.md` està instal·lat, amb les regles VIG-01 a VIG-06 de Gemini i les comprovacions de perímetre VA, VB i VC de Claude. S'han regenerat `00_INDEX_SKILLS.md` i `.agents/manifest.yaml`.
  - Circuit: dues sessions Reflex (`14f11a03`, `f01e5ca0`), `executor-mutacio` i les dues leases consumides.
  - Resultats: segell `4a1546c3` i `cataleg_skills --check` amb `ok: true`.
- **Mòdul B:**
  - `assets/img/` de l'arrel (15 fitxers) està evacuat a `../_multimedia_de_poble/quarantena_arrel_assets/img/`, amb SHA256SUMS; els sha256 són idèntics.
  - `crear_bundle.mjs` ja no exigix `assets`. El canvi s'ha fet amb la lease `29d5f2e9`, consumida.
  - Les dues làpides buides del Lector s'han retirat; `qualitat.test.js` dona 16 de 16.
- **Mòdul A (part 1):**
  - versió 1.1.9 a la capçalera, a la constant i al `readme.txt` (19.298 B; s'ha condensat l'entrada antiga de la 1.0.3);
  - `wordpress-plugin/supabase/` (estat local de la CLI, ignorat per git) està en quarantena a `.sdp-paperera/quarantena-261021_1950_wordpress-plugin-supabase/`. No s'ha esborrat.
  - Proves del connector: 18, 23 i 17 en verd.

**Correccions a dos punts del pla:**

- `nano_mercat_llaurador_1774197050578.png` no és orfe. És la imatge per defecte dels pobles a `src/config/assetResolver.js:17`.
- `post_fira_artesania_1774198229727.png` no existix al repositori.

Cap dels dos s'ha tocat.

**En marxa:** la migració WebP dels 62 (un implementador i dos verificadors adversarials). Després venen la compilació i els zips de la 1.1.9, el `build:natiu` i el `cap sync`.

### 2. Mòdul A · Connector 1.1.9 i paquets oficials

| Pas | Fet | Evidència |
|---|---|---|
| Versió | `Version: 1.1.9` i `SOCDEPOBLE_ENXUFE_VERSIO` a `socdepoble-enxufe.php`; `Stable tag: 1.1.9`, changelog i upgrade notice a `readme.txt` | El readme fa 19.298 B; la prova en fixa el sostre a 20.480. S'ha condensat l'entrada antiga de la 1.0.3 per a fer lloc. |
| Carpeta paràsita | `wordpress-plugin/supabase/` (estat local de la CLI de Supabase, amb `start-secrets`, ignorat per git) es mou a `.sdp-paperera/quarantena-261021_1950_wordpress-plugin-supabase/` | No s'esborra. El `.gitignore` ja cobrix `/.sdp-paperera/quarantena-*/`. |
| Compilació | `SDP_RELEASE=1 SDP_VERSIO=1.1.9 npm run build:wp` i `build:wp:directori`, rc 0 | Registres a l'scratchpad del torn |
| Empaquetat | `node wordpress-plugin/eines/empaqueta.mjs --url-base https://github.com/socdepoble/socdepoble.org/releases/download/enxufe-v{versio}/ --clau ~/.sdp/enxufe-ed25519.pem`, rc 0 | És la ruta real. El pla citava `tooling/scripts/empaqueta.mjs`, que no existix. |
| Zips | Moguts a `_builds_de_poble/wordpress/` amb el nom canònic de `core-empaquetat-wp` (`AAMMDD_HHMM_…`) | sha256: enxufe `e3b942f8…`, directori `71e9030b…`, estàtic `c6ba3bb0…` |
| Contingut | El directori no porta cap actualitzador ni `Update URI` (0 coincidències). El paquet porta `Version: 1.1.9` i el filtre `wp_preload_resources`. | `unzip -p` |

**Avisos de l'empaquetador:**

- **Directori.** Porta 182 mitjans externs servits des de `https://socdepoble.org`. Abans de publicar-lo, l'origen ha de servir cada mitjà i la seua bessona com a `image/*` i amb CORS.
- **Slug.** En l'alta cal demanar l'slug `socdepoble-enxufe`.

**WordPress.org.** Continua bloquejat per les decisions D4 de l'auditoria 261021_1645: la llicència GPL de les il·lustracions i els textos del zip, i el codi font públic.

### 3. Mòdul B · Salfumant fase 2

#### 3.1 `assets/img/` de l'arrel

- **Evacuació:** els 15 fitxers (9,2 MB) són a `../_multimedia_de_poble/quarantena_arrel_assets/img/`, amb `SHA256SUMS_origen_socdepoble_assets_img.txt`. Els sha256 són idèntics a l'origen.
- **Lector que el demanava:** `tooling/brain/crear_bundle.mjs` exigia la carpeta i avortava si faltava. Ja no l'exigix. El canvi s'ha fet amb la lease Reflex `29d5f2e9` i `executor-mutacio`, i la lease està consumida.

#### 3.2 Lector

`src/apps/lector/vistes/Carpetes.jsx` i `Fonts.jsx` eren làpides que només portaven un comentari, i el mateix comentari demanava el `git rm`. S'han retirat. `qualitat.test.js` dona 16 de 16.

#### 3.3 Migració WebP: dels 130 del pla als 32 aplicats

| Pas | Rasters | MB | Criteri |
|---|---:|---:|---|
| Rasters de `public/` amb bessona | 130 | 120,6 | Pla de Gemini/MarIA («128», «113,67 MB») |
| Sense cap cita a SQL de `supabase/` ni a `index.html`/manifest | 80 | 84,6 | **Decisió del Mestre al xat (19:12): «Només els 80 segurs».** |
| Bessona amb les mateixes dimensions | 62 | 53,4 | Llei del Píxel. Queden fora 18: fotos de 5.184 px amb bessona de 1.600, `nano_cards` de 1.024 amb bessona de 768, i vinyetes amb bessona més gran. |
| Sense ordre explícita del Mestre ni cita viva a la Wiki o el tooling | 56 | 51,2 | Queden fora 6: 4 vinyetes amb «cap esborrat» (`registrePlugins.js:9-16`, ordre 261007), `gestoria_vinyeta.jpg` (ADR-2026-12 de la Wiki) i `fotos/sultan.png` (dada d'una prova de tooling). |
| Sense cap cita en l'**historial** de SQL de `supabase/` | 33 | — | Ho va trobar la verificació adversarial. Els avatars `flash`, `mixa` i `ratolí` eren al seed fins al commit `32eabf12`, d'ahir nit, i la BD de producció els pot tindre. |
| Sense canvi visual | **32** | **28,95** | Fora `iaia_maria_avatar.jpg`: la seua bessona és un retall fet a propòsit (`4d67f7ab`), no la mateixa imatge (diferència mitjana de 94,8, quan les altres són ≤ 4,35). |

**Com s'ha aplicat:**

- **Cites reescrites:** totes les dels 32 a `src/` i `tests/`, en 25 fitxers (cens, `registrePlugins`, consola, llavors d'agents i xats, Aplec, `pageContent`).
- **Originals:** a `../_multimedia_de_poble/originals_raster_public/assets/…`, amb el sha256 de cada un igual al blob de HEAD.
- **Restauració:** els 24 que la verificació va fer tornar són a `public/` amb el sha256 de HEAD, i les seues cites són idèntiques a HEAD.
- **Proves:** cap asserció afluixada. N'hi ha de reforçades: una vinyeta en WebP exigix que no tinga cap `.jpg` al costat, i un WebP tallat no passa la comprovació d'integritat.

**Correccions al pla:**

- `nano_mercat_llaurador_1774197050578.png` no és orfe. És la imatge per defecte de Sella (`assetResolver.js:17`) i la cita l'historial de SQL: es queda.
- `post_fira_artesania_1774198229727.png` no existix al repositori.
- L'objectiu «`public/` de 157 MB a ~42 MB» no és assolible sense la consulta a la BD de producció (D6). Hui `public/` fa 129 MB al disc.

### 4. Mòdul C · Tractor `sdp-vigilant-tellado`

**Fitxer:** `.agents/skills/sdp-vigilant-tellado/SKILL.md`, versió 1.0.0, `status: actiu`. Fusiona dues aportacions:

- les **sis regles VIG-01 a VIG-06** de Gemini, la traducció de la checklist d'AyudaWP de 77 punts:
  - VIG-01 · superfície d'exposició zero;
  - VIG-02 · cap executable a les carpetes d'actius;
  - VIG-03 · patrons d'ofuscació;
  - VIG-04 · integritat de l'inventari del paquet;
  - VIG-05 · contingut mixt;
  - VIG-06 · CDN de tercers no declarats;
- les comprovacions de perímetre VA, VB i VC de Claude: capçaleres, CSP, secrets versionats, convivència amb els plugins de seguretat de l'amfitrió i govern.

**Circuit:**

- **Sessió `14f11a03`:** la SKILL.md i `00_INDEX_SKILLS.md`, regenerat amb `cataleg_skills.mjs`.
- **Sessió `f01e5ca0`:** `.agents/manifest.yaml`, la projecció del catàleg.
- Totes dues amb Petorreta i manifest al bootstrap, `Plan-SHA256`, `executor-mutacio` i la lease consumida.
- **Segell `4a1546c3`:** `segella.mjs` en verd, `cataleg_skills --check` amb `ok: true`. L'evidència és a `.agents/seal-transactions/`.

**Pendent:**

- el document de flux per a aprovar-lo des de la Wiki (lliçó 261002);
- l'script `tooling/gates/tractor-vigilant.mjs`.

Fins aleshores, totes les comprovacions noves naixen com a avís.

### 5. Mòdul D · Sincronització nativa

- **Compilació i sync:**
  - `npm run build:natiu` amb les variables de producció passades pel procés, sense imprimir-les (rc 0).
  - `CI=1 npx cap sync android` i `CI=1 npx cap sync ios` (rc 0). Copien `dist-natiu/` a `android/app/src/main/assets/public` i `ios/App/App/public`, i reescriuen el `Package.swift` amb `@capgo/capacitor-social-login@8.5.12`.
- **Paquets nets:** als paquets web d'iOS i d'Android no hi ha cap «teua conta», cap «DADES PROTEGIDES» ni cap `iframe` cap a `/iaia-maria` (0, 0 i 0).
- **Proves:** `node --test tests/natiu-build.test.mjs` dona 30 en verd, 0 en roig i 1 saltada. Abans, «eixida real de dist-natiu/» fallava perquè el build era anterior a la migració.
- **Fitxers versionats:** cap. `build:natiu` no ha canviat ni `rag-index.json` ni `slugIndex.json`.

**Les botigues no s'han tocat.** La directiva del Mestre (res d'APKs per WhatsApp) obliga a publicar per les botigues, i això requerix comptes i signatures que són del Mestre:

- **Google Play:** `signingConfig` de release a `android/app/build.gradle`, que no existix, i un AAB signat.
- **App Store:** signatura d'Apple, TestFlight, el client OAuth de Google per a iOS (P0-03) i les icones d'iOS (P0-07, encara les de Capacitor).

### 6. Decisions del Mestre

| ID | Decisió | Per què |
|---|---|---|
| D1 | **Desplegar socdepoble.org (Firebase, seqüència de l'auditoria 261021_1645 §3.2) ABANS de publicar el zip del directori.** Confirma abans el `VITE_TENANT_ID` de producció. | Les 32 imatges migrades ara només existixen en `.webp`, i la producció de juny no servix cap bessona: es veurien trencades al directori i a la web. |
| D2 | Commit d'este lot | Cal el teu sí, com en el lot anterior. |
| D3 | Publicar la 1.1.9: release `enxufe-v1.1.9` a GitHub amb els dos zips, i després `stable.json` i `1.1.9.json` (amb les `.sig`) a `public/enxufe/` + desplegament | El canal signat apunta a eixa URL de GitHub. |
| D4 | WordPress.org: llicència GPL de les il·lustracions i textos del zip, codi font públic de HEAD i slug `socdepoble-enxufe` | Continuen bloquejant l'alta (auditoria 261021_1645 §4.1). |
| D5 | Botigues: signatura de release d'Android, compte de Play Console, Apple Developer i TestFlight, client OAuth d'iOS i icones d'iOS | La 5.3 |
| D6 | Consulta de només lectura a la BD de producció amb els camins dels 73 rasters que no s'han migrat per risc de BD: 50 citats per SQL actual o per `index.html`/manifest, i 23 per l'historial de SQL | Després es pot fer una fase 3 de la migració. Els 18 de dimensions diferents i els 6 protegits per ordres són una altra decisió. |
| D7 | Parella `iaia_maria_avatar.jpg` / `.webp` retallada | Ja passava a HEAD: on es cita el `.jpg`, els paquets de WordPress i natiu servixen el retall. Cal decidir si el retall és la imatge oficial. |
| D8 | Aprovar `sdp-vigilant-tellado` a la Wiki i encarregar `tractor-vigilant.mjs` | Lliçó 261002 |

### 7. Retroalimentació sobre la plantilla `prompt_local`

1. **El pla no va reconciliar la discrepància documentada.** L'informe 261021_1645 §6 ja desaconsellava evacuar els 130 rasters, amb evidència, i el pla va adoptar la xifra de Gemini sense citar-la. Un pla hauria de respondre explícitament les objeccions dels informes que llig.
2. **Afirmacions sense verificar:**
   - «0 referències» per a dos fitxers: un és viu i l'altre no existix;
   - un camí d'eina inexistent (`tooling/scripts/empaqueta.mjs`);
   - noms de zip que contradiuen `core-empaquetat-wp`.

   Proposta: cada camí del pla, passat per `git ls-files` abans de convocar.
3. **Objectius quantitatius impossibles** («`public/` de 157 a ~42 MB»): s'haurien de derivar de les dependències reals (SQL, BD, ordres del Mestre).
4. **«Publicar a les botigues» no es pot executar** des d'un agent sense els comptes i les signatures del Mestre. Separar «Accions reservades al Mestre», com ja proposava la retroalimentació anterior.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
|---|---|
| Vitest complet, després de la restauració (verificador independent, TMPDIR propi) | **1.208 fitxers passen, 9 saltats; 20.403 proves passen, 100 saltades, 0 fallen.** Des d'eixa passada no s'ha tocat cap fitxer de `src/` ni `tests/`. |
| `node --test`: `enxufe-plugin`, `enxufe-empaqueta`, `enxufe-pantalla` i `standalone-build` (amb la 1.1.9) | 18, 23, 17 i 40: totes en verd |
| `node --test tests/natiu-build.test.mjs` (després de `build:natiu`) | 30 passen, 0 fallen, 1 saltada (`dist/` és anterior a `package-lock.json`, igual que a HEAD) |
| `node tooling/gates/porta-olivera.mjs` | rc 0 |
| `segella.mjs` i `cataleg_skills.mjs --check` | Segell `4a1546c3` sense canvis; catàleg `ok: true` |
| Migració WebP: verificació adversarial (2 verificadors) i verificació de la restauració | sha256 dels 32 arxivats = HEAD; 24 restaurats = HEAD. Cap cita viva als originals evacuats. Cap asserció afluixada. Dimensions iguals a les 32 parelles. |
| Zips de la 1.1.9 | Directori de 9.803.125 B, sense actualitzador; `Version: 1.1.9`; `wp_preload_resources` present |
| Paquets web d'iOS i d'Android | 0 «teua conta», 0 «DADES PROTEGIDES», 0 iframe `/iaia-maria` |
| `du -sh public` | 129 MB (abans, 157 MB). Al git queden 32 supressions a `public/`. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res publicat:** el lot és al commit local `cefc12ab`. No hi ha cap desplegament, cap release a GitHub, cap canal publicat i cap enviament a botigues ni a WordPress.org. No s'ha aplicat cap SQL.
- **Migració parcial:** de 130 rasters, 32. Els altres esperen la consulta a la BD de producció o una decisió del Mestre (D6 i D7).
- **Gemini:** el seu informe de la fase 2 és buit. No hi ha hagut contrast creuat d'este torn.
- **Govern:** Claude no escriu a `.agents/ESTAT.md` ni al LEDGER. El torn queda `planned`, i el tancament és de MarIA.
- **Crons:** cap cron ni tasca programada creada. No en queda cap en segon pla.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2]]
- [[261021_1645_auditoria_claude_salfumant_radical]]
