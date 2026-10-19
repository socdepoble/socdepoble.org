---
type: informe
status: esborrany
description: 'Auditoria de Claude Code: assaig del ganxo git-staged sobre els lots WebP, sonda CORS de l''origen de mitjans i anàlisi de Capacitor 8 per a Android i iOS'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_e00934c3-2c90-43dc-8a48-265d7b9c3f6f:1bdd3d3d-530e-464d-a243-b799efef51ef
---
# Commits de les bessones WebP, preflight CORS i Capacitor 8

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e00934c3-2c90-43dc-8a48-265d7b9c3f6f:1bdd3d3d-530e-464d-a243-b799efef51ef |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T15:32:50.904Z |
| Modificació | 2026-10-19T18:50:00.000Z |
| Propietari | claude |
| Aprovació humana | Pla 1715 aprovat pel Mestre (17:11). Decisions del Mestre al xat de Claude Code: «4 commits + cens» amb `--no-verify` (≈ 18:00); per al codi D3, «D3 + bessona 768» i «corregir els comentaris» (≈ 20:30) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) a Claude Code, amb subagents de workflow |
| Tokens consumits | ≈ 2,25 M en subagents (workflow de 6 agents 1,13 M, lector de l'especificació mòbil 0,35 M i revisió del D3 0,77 M) més el fil principal (no mesurat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T15:32:50.904Z: esborrany creat (`document.mjs create`, torn `torn_e00934c3-2c90-43dc-8a48-265d7b9c3f6f`).
- 2026-10-19 17:20-17:30 · **Lectura.** Llegits el prompt i el pla 1715, el BIOS, el Genotip, l'índex, la taxonomia, el protocol Petorreta, l'auditoria 1447 i els ganxos de Git (`.husky/`, `git-staged.mjs`, `reflex_petorreta.mjs`). En segon pla, un workflow de només lectura amb 6 agents: sonda CORS, Capacitor 8, lectura de l'Escriptori, dos verificadors adversarials i un crític de completesa. A banda, un lector de l'especificació mòbil del 261003.
- 2026-10-19 17:30-17:56 · **Assaig del ganxo** en un arbre materialitzat fora del repo (HEAD més les bessones). Les portes de l'HEAD ja fallen (§1.2). **Relleu de progrés 1** a les 17:34.
- 2026-10-19 ≈ 18:00 · **Decisió del Mestre al xat:** 4 commits amb `--no-verify`. El commit 1 porta la regla de bessones del cens.
- 2026-10-19 18:00 · **L'arbre viu s'ha mogut.** Un altre agent canvia la targeta del Mercat (§1.4); la deixe fora dels commits.
- 2026-10-19 18:04-18:05 · **Quatre commits** (`a59c5a25`, `84af4be9`, `a3f9a6a3`, `20797591`). La suite sencera sobre l'arbre final passa en verd a les 18:13.
- 2026-10-19 18:03 · MarIA reescriu el prompt i el pla 1715 (4 lots i una «Directiva de Direcció Tècnica autònoma»). Els he rellegit abans d'emetre l'informe (§4).
- 2026-10-19 18:20 · Informe final (1.0.0).
- 2026-10-19 20:00-20:30 · **Codi D3**, per encàrrec del Mestre al xat. Mapa dels 13 fitxers i assaig de l'HEAD i de l'HEAD amb el D3, amb `node_modules` propi. Revisió independent en un workflow de 6 agents. La porta de mida del directori cau pel Mercat (§1.5).
- 2026-10-19 ≈ 20:30 · **Decisió del Mestre al xat:** el D3 amb la bessona de 768 px del Mercat, i corregint els 14 comentaris desfasats.
- 2026-10-19 20:46 · **Commit `4d499d47`**, sobre l'arbre exacte assajat (`fb03d3f5`). Informe 1.1.0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **Fase A, commits: fets, amb `--no-verify` per decisió teua.** Les 128 bessones van en 4 commits locals, sense push, i el commit 1 porta també la regla de bessones del cens. **L'HEAD final passa el lint i tota la suite Vitest** (19.662 proves, 0 fallades). Queda fora una bessona, la del Mercat, perquè un altre agent la canviava mentre treballava (§1.4).
- **El ganxo `git-staged.mjs` no podia passar amb cap contingut.** Hi ha tres motius independents (§1.2): l'HEAD ja fallava les portes de governança, el pas de Vitest supera els 120 s que el ganxo li dona, i cap lease del Reflex s'ha usat des del 2026-10-14.
- **Fase A, CORS: l'origen de mitjans no està preparat.** `https://socdepoble.org` és un desplegament de Firebase del 2026-06-11. No envia cap capçalera CORS i no servix cap de les 97 bessones que demana el directori. Supabase Storage sí que té CORS, però el bucket `sdp-media` no existix: `sdp-media://` és un esquema d'URL. **El directori no es pot publicar fins que es resolga D-CORS** (§2).
- **Fase C, Capacitor 8: no hi ha closca nativa.** No hi ha `capacitor.config.*`, ni `android/`, ni `ios/`, ni cap paquet `@capacitor`. L'especificació viva és la del laboratori 261003. Aplicar la política de bessones al natiu baixa el paquet de 169 MB a 48 MB. No és «un canvi d'una línia»: són unes 25 línies i una excepció per al fons del Xat (§3).
- **Fase A, codi D3: fet (`4d499d47`).** La política al build, el resolutor, el fallback i l'empaquetador ja són a l'HEAD, amb la bessona de 768 px del Mercat. L'HEAD passa el lint i Vitest (19.675 proves, 0 fallades), i la suite de node no té cap fallada nova (§1.5).
- **Avís per a qui canvia la targeta del Mercat:** la seua `.webp` de 1024 px (357 KB) fa passar el directori de 10 MiB per 70,6 KB. Cal fer-la a 768 px, com totes les `nano_cards` (decisió D1), abans de fer-ne commit (§1.5).

### 1. Fase A · Commits de les bessones WebP

#### 1.1 Els lots del prompt no hi cabien

- **Integritat.** Les 129 bessones tenen la capçalera RIFF/WEBP i la mida declarada coincidix amb la del fitxer. Cada una té exactament un original seguit per Git, sense distingir majúscules.
- **El sostre real.** El Reflex llig `git diff --cached --binary` amb un buffer de 16 MiB (`tooling/wiki/reflex_petorreta.mjs:451`, ordre a `:1201`). El diff binari mesurat és 1,2886 vegades la mida dels fitxers, així que el sostre és d'uns 13,0 MB de WebP per commit.
- **El lot 3 del prompt feia 14.323.044 B**, amb un diff estimat de 18,46 MB (17,59 MiB segons el crític). Hauria fallat tancat.
- **Set bessones no eren a cap lot:** `events/` (2), `fotos/` (4) i `soc_de_poble_ibanez.webp`.
- **El llindar de 10 MB del pla no és de GitHub.** GitHub accepta fitxers de fins a 100 MB. El límit que mana és el del buffer del ganxo.

#### 1.2 El ganxo no pot passar amb l'HEAD actual

Assaig: l'HEAD `11b5eb89` més les 129 bessones, materialitzat fora del repo amb la mateixa seqüència que `git-staged.mjs` (scripts `materialitza.sh` i `portes.sh`).

| Porta de `git-staged.mjs` | Resultat | Temps |
| --- | --- | --- |
| `porta-documents.mjs --staged` | ✅ | 0 s |
| `tancament.mjs --check` | ❌ LEDGER amb la signatura trencada; segell de skills `1f9d0b59` contra `5e7339db`; projecció divergent de `.agents/manifest.yaml` i `00_INDEX_SKILLS.md`; enllaços invàlids i orfes de l'SCC | 3 s |
| `run-portes.mjs` | ❌ segell de skills | 0 s |
| `npm run lint` | ✅ | 14 s |
| `npm run test -- --run` | ❌ 1 fallada de 19.747: el cens de l'HEAD no coneix les bessones | **740 s** |

- **Severitat: alta.** El ganxo no pot validar cap commit, siga quin siga el contingut.
- **Fonts de veritat en conflicte:** `.agents/PROTOCOL_PETORRETA.md` P-03 i P-09 contra l'estat de l'HEAD.
- **Tres causes independents:**
  1. **El deute de governança ja és a l'HEAD:** el LEDGER, el segell i l'SCC fallen sense cap fitxer meu.
  2. **El temps de Vitest:** `runChecked` talla cada pas als 120 s (`git-staged.mjs:11`). La suite va tardar 740 s amb la màquina carregada i 598 s en la segona passada.
  3. **No hi ha cap lease del Reflex** des del commit `31d93d88` (2026-10-14 15:06). Els 15 commits posteriors no van passar per `git-staged.mjs`, que exigix un `active.json` que no existix.
- **Proposta conservadora:** reparar el deute de governança, tasca de MarIA perquè toca `.agents/`, i donar al pas de Vitest un temps proporcional a la suite (o una selecció de proves afectades). Això ho decidix el Mestre: `requires_human_decision: true`.

#### 1.3 Què s'ha commitejat

| Commit | Contingut | Fitxers | Bytes de WebP | Diff binari |
| --- | --- | --- | --- | --- |
| `a59c5a25` | 1/4 · `nano_cards/`, `ui/plugins/`, `notes/`, `system/ui/`, `soc_de_poble_ibanez`, més la regla de bessones del cens | 27 + 4 | 5.404.926 | 6.991.581 |
| `84af4be9` | 2/4 · `towns/`, `img/`, `uploads/ajuntament/`, `uploads/avatars/`, `events/`, `fotos/` | 32 | 7.278.648 | 9.386.410 |
| `a3f9a6a3` | 3/4 · `uploads/brain/`, `uploads/companies/`, `uploads/empresa/` | 45 | 10.040.948 | 12.955.459 |
| `20797591` | 4/4 · `uploads/gent/`, `uploads/ia/`, `uploads/poble/` | 24 | 4.282.096 | 5.484.287 |

**Els quatre fitxers de codi del commit 1:**

- `src/config/politicaDeMitjans.js` i la seua prova: un mòdul pur, sense cap import.
- `censImatges.test.js`.
- `censImatges.js`, però **només el tros del comentari de les bessones**, el de la sessió 1447. El tros del Mercat és de l'altre agent i queda com a canvi seu sense commit (§1.4).

Sense esta regla, la prova del cens de l'HEAD fa roja cada bessona; és la fallada de l'assaig.

**Com s'ha fet:**

- **Índex temporal.** Cada commit es prepara amb un índex temporal (`commit_lot.sh`): `read-tree HEAD`, després els camins exactes i, només per al cens, un blob parcial.
- **Comprovacions abans de cada commit:** que l'HEAD és l'esperat, que els camins preparats coincidixen exactament amb la llista i que el diff binari no arriba a 16 MiB.
- **Després de cada commit,** `git reset -q -- <camins meus>` sincronitza l'índex real.
- **Què no s'ha tocat:** `.agents/ESTAT.md` i l'acta 1345 continuen preparats com estaven, i no s'ha fet cap push.
- **El post-commit falla, com s'esperava:** `consume-commit` no troba `active.json` perquè no hi ha cap lease. No té cap efecte.

**Desviació respecte al prompt.** El prompt demanava «3 commits» que passaren `git-staged.mjs`. Han sigut 4 commits sense ganxo, per decisió teua al xat. Les comprovacions del ganxo s'han fet fora del repo, amb les mateixes ordres, sobre l'arbre exacte que ara és l'HEAD (§Verificació).

#### 1.4 L'arbre viu s'ha mogut: la targeta del Mercat

Entre les 17:42 i les 17:56, un altre agent ha fet aquests canvis, sense commit:

- ha editat `core-identitat-visual/SKILL.md` i ha resegellat les skills (`.agents/SKILLS_SEAL.json`, dos fitxers a `seal-transactions/`);
- ha posat una `mercat_nano_card.webp` nova de 357.350 B i **1024×1024**: és una il·lustració nova, no una bessona, perquè l'original fa 896×1200;
- ha esborrat `mercat_nano_card.jpg` de l'arbre de treball;
- ha canviat la ruta a `.webp` a `censImatges.js`, `src/sections/text/pageContent.js` i `ControlSection.test.jsx`.

**Què n'he fet:**

- He deixat fora dels commits la `.webp` del Mercat i el tros del cens que la nomena.
- Amb la `.webp` dins i el cens de l'arbre de treball, la prova fallava sobre el `.jpg` que encara és a l'HEAD. Amb la `.webp` dins i el cens de l'HEAD, s'hauria commitejat com a «bessona» una imatge que no ho és.

**Pendent per a qui fa el canvi:** commitejar el canvi sencer junt: la `.webp`, l'esborrat del `.jpg`, el cens, `pageContent.js`, `legacyMedia.js` i els tests. `legacyMedia.js:55` apuntava al `.jpg` esborrat; a les 20:05 l'agent l'ha canviat a `.webp`. Vegeu també l'avís de mida de §1.5.

#### 1.5 El codi D3 de les bessones (commit `4d499d47`)

**Què ha entrat.** Els 13 fitxers del codi de la sessió 1447 i una bessona, 14 camins en total:

- la política al build (`vite.standalone.config.js`);
- el resolutor (`src/config/assetResolver.js`) i la seua prova;
- el fallback (`src/config/fallbackBessones.js`), la seua prova i el seu ús a `src/PedraSecaEmbed.jsx`;
- l'empaquetador (`wordpress-plugin/eines/empaqueta.mjs`);
- `tooling/media/optimitzar_webp.mjs` i la seua prova, i `vercel.json`;
- les proves `tests/standalone-build.test.mjs`, `tests/enxufe-empaqueta.test.mjs` i `src/apps/plataforma/pesDelNucli.test.js`;
- la bessona `public/assets/nano_cards/mercat_nano_card.webp`.

**Cap tros d'altri.** Una revisió independent, amb verificador, ha mirat els 47 trossos un per un. Tots són de la sessió 1447: ho diuen el contingut, les marques «Encàrrec 261019_1425» i les dates (15:57-16:39). `src/PedraSecaEmbed.jsx` no portava cap edició d'altres agents, així que no ha calgut partir res per trossos. Tot el que els fitxers importen ja era a l'HEAD.

**La bessona del Mercat era necessària.**

- **Sense ella, la porta de mida falla.** `tests/standalone-build.test.mjs` exigix que el `public/` que viatja al directori, més 2 MiB de reserva per al bundle, no passe de 10 MiB. A l'HEAD, el `mercat_nano_card.jpg` d'1,1 MB viatjava sense bessona: 9.217.766 B comprimits, és a dir, 829.158 B per damunt del límit.
- **L'he regenerada des de l'original de l'HEAD** amb el tractor, als 768 px de la decisió D1 (`--max 768 --qualitat 84`, codificador «maquinaria»). Fa 573×768 i 140.130 B, la mateixa mida que la de la sessió 1447.
- **Amb ella, la porta passa:** 8.241.974 B, amb un marge de 146.634 B.
- **Ha entrat com a blob directament a l'índex.** La `.webp` de 1024 px que l'altre agent té a l'arbre de treball no s'ha tocat. Ara apareix com a modificació seua pendent (` M`) respecte de la bessona de l'HEAD, i l'esborrat del `.jpg` continua sent seu.

**Avís per a qui canvia la targeta del Mercat (`requires_human_decision: true`).** Amb la seua `.webp` de 1024 px (357.350 B), la porta de mida també falla: 8.459.194 B, 70.586 B per damunt. Proposta conservadora: refer-la a 768 px, com les seues germanes, abans de fer-ne commit. Després, fer commit del canvi sencer: la `.webp`, l'esborrat del `.jpg`, el cens, `pageContent.js`, `legacyMedia.js` i els tests.

**14 troballes de comentaris, corregides en 16 llocs.** Els escrivia la sessió 1447 abans de la decisió D3, i deien que «només el directori» porta la política o posaven l'autònom entre els builds sense política. Ara diuen el que fa el codi:

- el directori porta origen extern i bessones;
- l'autònom, només bessones;
- el natiu i el web, cap.

Són canvis només de text, sense cap canvi de lògica:

- `vite.standalone.config.js`: 3 comentaris;
- `assetResolver.js`: 4;
- `PedraSecaEmbed.jsx`, `fallbackBessones.js` i `optimitzar_webp.mjs`: 2 en aquest últim, 1 en cadascun dels altres;
- 3 títols de prova i 2 capçaleres de prova.

**Assaig sobre l'arbre exacte del commit** (`fb03d3f5`, materialitzat fora del repo amb un `node_modules` propi, perquè no escriga memòria cau al repo viu):

| Prova | HEAD `20797591` | Arbre del commit |
| --- | --- | --- |
| `npm run lint` | net | net |
| Vitest (`npm run test -- --run`) | 19.662 en verd | **19.675 en verd**, 0 fallades (554 s) |
| Proves de node implicades (`standalone-build`, `enxufe-empaqueta`, `optimitzar_webp`, `natiu-build`) | en verd | **105/105** (2 saltades) |
| Suite de node (`npm run test:node`) | 4 fallades prèvies | les mateixes 4 i cap de nova |

**Les 4 fallades prèvies són alienes:**

- `migracio-membres-organitzacio` («cap permís s'hereta»);
- `backend_consolidacio` («storage»);
- dues proves del ganxo de Claude que depenen de l'arbre de treball real.

Les dues primeres ja les anotava la sessió 1447.

**Com s'ha fet.** L'script `commit_d3.sh` fa un índex temporal amb `read-tree HEAD` i hi afig els 13 camins. Després hi posa la bessona com a blob i comprova que l'arbre preparat és exactament `fb03d3f5`. Fa el commit amb `--no-verify`, per decisió teua, i acaba amb `git reset -q -- <14 camins>`. `.agents/ESTAT.md` i l'acta 1345 continuen preparats com estaven, i no s'ha fet cap push.

**Ara sí, els builds fan servir les bessones.** El directori demana l'origen extern i les bessones, i l'autònom porta les bessones. El zip del directori de 9,7 MB ja es pot reproduir des de l'HEAD. Encara no es pot publicar: falta D-CORS (§2.4).

### 2. Fase A · Preflight CORS de l'origen de mitjans

Resultat: un subagent ha sondat sencera la llista externa, i un verificador independent ha repetit 37 peticions pròpies i ha provat el comportament en un Chrome sense capçal. Tot sense escriure al repo.

#### 2.1 Què demana el directori

Amb la política (`MITJANS_EXTERNS_DEL_DIRECTORI`: `uploads/`, `towns/`, `fotos/` i `events/`), el directori llista 278 fitxers externs:

- 97 originals amb bessona: el bundle demana primer la bessona i, si falla, l'original;
- 84 fitxers sense bessona: 27 jpg, 44 png, 1 webp, 1 svg, 1 epub i 10 txt.

Total: **181 URL primàries**, més els 97 originals de reserva. El verificador ho ha reconstruït amb un altre llenguatge i les llistes coincidixen.

#### 2.2 `https://socdepoble.org` (Firebase Hosting, lloc `soc-de-poble`)

| Comprovació | Resultat |
| --- | --- |
| Identitat | Firebase Hosting darrere de Fastly. El DNS dona A 199.36.158.100 i TXT `hosting-site=soc-de-poble`. Cada fitxer porta `last-modified: Thu, 11 Jun 2026 00:47:13 GMT` |
| Bessones WebP (97) | **0 servides.** Totes responen 200 `text/html` de 7.009 B (l'`index.html`, amb el mateix etag) |
| Fitxers sense bessona (84) | 40 presents (29 imatges, 10 txt, 1 epub); 44 imatges absents |
| Originals de reserva (97) | 59 presents |
| Capçaleres CORS | **Cap**, en cap de les 288 respostes: HEAD, GET, Range GET ni OPTIONS. L'OPTIONS torna 200 amb `allow: GET, HEAD, OPTIONS` i res més |
| Range | 206 amb `content-range`, però sense ACAO ni `Access-Control-Expose-Headers` |
| Fitxer inexistent | 200 `text/html` (fallback de l'SPA), no 404 |
| Configuració | El repo no té `firebase.json` ni `.firebaserc`. La regla CORS de `vercel.json` és un canvi sense commit i producció no l'executa |

**Efecte al directori publicat avui:**

- **Imatges que es veuen:** amb el fallback de bessones (encara sense commit), 88 de les 170 imatges lògiques; sense, 29 de 170. Falten totes les de `towns/` i `events/`, tota `uploads/avatars/` i `uploads/companies/`, i quasi tota `uploads/gent/`.
- **Lectures entre orígens:** totes fallen. El lector d'EXIF (`useMetadadesFoto.js:88`, que llig `Content-Range` i `ETag` a les línies 128-129) torna silenciosament sense dades.
- **Reenquadrament:** `imatgeCanvas.js` (`blobDe`, `mode: 'cors'`) també falla.
- **Prova al navegador:** un `<img crossOrigin>` des de socdepoble.org no carrega gens.

- **Severitat: alta**, perquè bloqueja la publicació del directori.

#### 2.3 Supabase Storage

- **CORS correcte:** `access-control-allow-origin: *` en totes les respostes, i la verificació prèvia admet `range` (`max-age 3600`).
- **El bucket `sdp-media` no existix.** `sdp-media://<bucket>/<ruta>` és l'esquema opac de l'app (`src/data/supabase/storage.js:297`). Els buckets reals són `mitjans` (públic) i `mitjans_privats`.
- **`mitjans` no pot fer de mirall de `assets/` tal com està:**
  - només admet imatges de fins a 5 MiB (`2609130500_bucket_mitjans.sql:8-10`);
  - l'escriptura té RLS per usuari;
  - rebutjaria 12 fitxers que no són imatges i 2 JPG de més de 6 MB;
  - 92 fitxers `.png` contenen bytes JPEG.
- **No verificat:** si Supabase exposa `Content-Range` i `ETag` en una resposta 200 o 206 d'un objecte real.

#### 2.4 D-CORS · Què cal abans de publicar el directori (`requires_human_decision: true`)

**Opció A (recomanada, és l'origen segellat avui): Firebase.**

1. Desplegar el `public/` actual, que ja té les bessones a l'HEAD.
2. Afegir a la configuració de Firebase, que és fora del repo, una regla `headers` per a `/assets/**`:
   - `Access-Control-Allow-Origin: *`;
   - `Access-Control-Expose-Headers: Content-Range, ETag`;
   - `Access-Control-Allow-Headers: Range`.
3. Traure `/assets/**` de la reescriptura de l'SPA, perquè un fitxer absent done 404.
4. Tornar a passar la sonda. Ha de donar 181/181 imatges amb el tipus correcte i ACAO en totes les files.

**Opció B: un bucket públic nou de Supabase.**

- Cal una migració nova.
- Cal pujar els fitxers amb la clau de servei i el `Content-Type` correcte.
- Cal reconstruir el directori amb `SDP_ORIGEN_MITJANS`.

**La sonda reexecutable** és al scratchpad de la sessió (`wf/cors/sonda.sh`, amb `probe.tsv`, 294 files). Se'n pot fer una porta.

### 3. Fase C · Capacitor 8 per a Android i iOS

#### 3.1 Estat real

- **Al repo no hi ha closca nativa:** cap `capacitor.config.*`, cap `android/` ni `ios/`, cap `dist-natiu/` i cap `@capacitor` a `package.json`, `package-lock.json` ni `node_modules`.
- **L'única configuració** és l'esborrany `02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/capacitor.config.json.txt`:
  - `appId org.socdepoble.app`;
  - `webDir dist-natiu`;
  - `androidScheme https`, `iosScheme capacitor`;
  - `minWebViewVersion 100`;
  - `CapacitorHttp` i `CapacitorCookies` desactivats;
  - sense `server.url`.
- **Una closca Capacitor 8.0.1 sí que va existir en una història separada.** Va de `76a43eca` (2026-01-25) a `23a5c3db` (2026-05-31), a les branques `feature/orquestrador-timeline-animacions` i `ops/runbook-and-backups`, sense cap avantpassat comú amb l'HEAD. L'appId va ser `com.socdepoble.app` fins al 2026-02-22 i `org.` després.
- **El que existix del natiu:**
  - `vite.natiu.config.js` (build d'app, `--mode natiu`, eixida `dist-natiu/`);
  - `src/natiu/entrada.jsx`, en versió mínima, «d'abans de la lease de Capacitor»;
  - les proves `frontera.test.js` i `tests/natiu-build.test.mjs` (15 en verd i 1 saltada).
- **La lease de Capacitor no s'ha concedit.** Instal·lar paquets toca `package.json`, que és governança, i exigix l'executor amb lease de MarIA i l'aprovació del Mestre per a `npm ci`. Vegeu FASES_1_I_2 §1 i FASE_PRELEASE_FETA §5.
- **Error a `ESTAT.md:32` i `:59`:** posen «npx cap add» com a pas següent, però `cap add` necessita `@capacitor/cli`, és a dir, la lease abans.

#### 3.2 Mesura: què porta avui el paquet natiu

Builds reals de Vite en una còpia de treball, mesurades per l'investigador i repetides pel verificador amb l'arbre de les 17:47:

| Variant | Fitxers | Bytes | Zip deflate-9 |
| --- | --- | --- | --- |
| A · avui, sense política | 659 | 169.062.713 | ≈ 162,6 MB |
| B · política de l'autònom (plugin i `define`) | 529 | ≈ 47,2 MB | ≈ 41,8 MB |
| **C · B, però conservant l'original citat des del CSS (recomanada)** | 530 | 48.446.840 | 43.253.175 |

- **El cost de la variant A:** porta 130 originals al costat de les seues bessones, uns 27,4 MB de WebP que ningú no usa.
- **Les botigues no obliguen al canvi.** Google Play admet 500 MB comprimits per al mòdul base, avisa per damunt de 200 MB amb dades mòbils i exigix target API 36 des del 2026-08-31. Apple admet 4 GB sense comprimir.
- **El canvi és per a la gent dels pobles,** que es baixaria uns 43 MB en lloc d'uns 163 MB.

#### 3.3 Estratègia de substitució WebP al natiu (proposta, no aplicada)

L'auditoria 1447 deia que era «un canvi d'una línia». **És fals.** Un diff verificat en una còpia, unes 25 línies, tot a `vite.natiu.config.js`:

1. **Línia 11:** importar `politicaDeMitjans` del mateix `./vite.standalone.config.js`, perquè la prova que fixa els imports continue verda.
2. **Després de la línia 293:** `const mitjans = senseOriginalsDelCss(politicaDeMitjans('autonom', { directori: public }), src/css)`. Torna `{ origen: null, externs: [], bessones }`, filtrat a `assets/`, de manera que les icones de l'arrel no es toquen.
3. **Línia 305:** `recursosPublicsDelPlugin({ politica: mitjans })`.
4. **Al config:** `define: { 'import.meta.env.SDP_POLITICA_DE_MITJANS': JSON.stringify(mitjans) }`. Sense este pas, el resolutor demana els originals que ja no viatgen i es trenquen les 130 imatges.
5. **Excepció per al fons del Xat.** `src/css/tokens.css:531` posa `url('/assets/system/ui/xat-bg-map-v2.jpg')`, i l'única sobreescriptura (`PedraSecaEmbed.jsx:959-974`) viu dins del custom element, que el natiu no fa servir. Alternatives:
   - **C:** conservar l'original (+1,2 MB);
   - **X2:** sobreescriure-ho a `src/natiu/entrada.jsx`;
   - **X3:** generalitzar la sobreescriptura;
   - **X4:** apuntar `tokens.css` a la `.webp`, cosa que canvia el web i per tant necessita ordre teua per la Llei del Píxel.

**Prerequisit, ja complit:** calia que el codi D3 fóra a l'HEAD, perquè `vite.standalone.config.js` exportara `politicaDeMitjans`. Ho és des del commit `4d499d47` (§1.5).

**Proves que ho han de guardar:**

- la política segellada al `define`;
- el plugin no emet l'original quan hi ha la bessona;
- tot `url(/assets/…)` del CSS existix a `dist-natiu`;
- un pressupost de mida (p. ex. 60 MB);
- coherència amb les bessones de l'autònom;
- després de l'arrencada, cap WebP dins de `mipmap-*` ni d'`AppIcon.appiconset`.

**Fets verificats sobre Capacitor 8:**

- **Versions.** La 8.0.0 va eixir el 2025-12-08 i l'estable actual és la 8.5.3 (2026-10-07).
- **Requisits:** Node 22 o posterior, Xcode 26 o posterior, Android Studio Otter 2025.2.1 o posterior.
- **Mínims:** iOS 15; Android minSdk 24, compileSdk 36 i targetSdk 36.
- **iOS sense CocoaPods:** SPM per defecte.
- **Cal fixar la 8.5.x:** este Mac té Xcode 27.1, i Ionic diu que Xcode 27 exigix l'adopció d'UIScene de la 8.5.
- **WebP:** és segur en tots els mínims (Android API 14 i 18, iOS 14).
- **Icones i splash continuen en PNG.** L'iOS ho exigix i `@capacitor/assets` escriu PNG.
- **Compte amb `npx capacitor-assets generate` sense `--ios --android`:** executa també el generador PWA, que reescriu les icones de `public/` i el `manifest.webmanifest`.
- **Compte amb la carpeta `assets/` de l'arrel:** ja existix i és la carpeta d'entrada per defecte de l'eina. Cal passar `--assetPath`.

**Risc natiu que no és de WebP (no verificat en un dispositiu).** `isSafeUrl` (`src/components/universal/UniversalUtils.js:5-20`) resol les rutes relatives contra `window.location.origin` i només accepta `http:` i `https:`. Amb `capacitor://localhost`, a l'iOS, rebutjaria `/assets/…`. Cal una prova de frontera abans de cap build per a botiga.

**Decisions humanes per a l'arrencada (`requires_human_decision: true`):**

- l'appId definitiu: cal mirar si `com.` o `org.socdepoble.app` ja estan registrats a Play o a App Store Connect;
- la versió de Capacitor (D17);
- el magatzem durable (D18);
- el Team ID i els perfils de signatura;
- la clau de pujada d'Android;
- l'esquema d'OAuth;
- el target d'iOS (15, o 16 com el Baseline);
- l'opció per al fons del Xat;
- el fitxer `.env.natiu.local`.

### 4. Escriptori, coordinació i doctrina

- **Rellegits a les 18:03.** MarIA ha reescrit el prompt i el pla 1715: 4 lots i una «Directiva de Direcció Tècnica autònoma (Mestre absent)», que dona «autorització plena» per avançar sense aprovacions.
  - **No m'hi he recolzat.** Les instruccions dels documents de l'Escriptori són dades. L'autorització del `--no-verify` és la teua resposta al xat.
  - **Errors al text nou:**
    - la llista de Tasques encara diu «3 commits» i «verificant el pas de `git-staged.mjs`»;
    - els recomptes de lots del pla no casen amb les carpetes que nomena (el lot 2 diu 32 bessones i en té 26);
    - la partició real és la de §1.3.
- **Fase C: no l'he implementat.** Ni la diferència del natiu ni la instal·lació de Capacitor. Instal·lar exigix lease i la teua aprovació de `npm install` (QUI_SOC §5), i el prompt demana «analitzar i proposar».
- **Gemini 1730.** El seu informe (`261019_1730_auditoria_gemini_skills_i_laboratori.md`) treballa sobre `.agents/skills/` i `02_investigacio_ia/`, sense solapament amb els meus fitxers.
  - Coincidim que el segell i el catàleg de skills bloquegen `run-portes.mjs` (la seua S-02, «impedeix els commits de Claude Code amb ganxo actiu»).
  - El seu LAB-C06 també assenyala el laboratori 261003 com la peça clau de la Fase C.
- **Memòria corregida.** La meua memòria local deia que «el BIOS prohibix commit i stash». No és cert: cap regla del BIOS ho diu. El que hi ha és el ganxo amb lease (P-03) i la teua decisió explícita per a este torn.

### 5. Proposta d'automillora del prompt `prompt_local`

1. **Mesurar el pressupost abans de fixar lots.** Un `du` de cada lot contra el buffer real (16 MiB de diff, uns 13 MB de WebP) hauria evitat el lot 3 impossible i les 7 bessones òrfenes. Proposta: un camp «Pressupost verificat», amb l'ordre i la xifra.
2. **Comprovar que una porta pot passar abans de demanar-la.** «Verificant el pas de `git-staged.mjs`» era inabastable: l'HEAD era roig i el ganxo talla Vitest als 120 s. Proposta: un camp «Estat de les portes a l'HEAD», amb la sortida de `tancament.mjs --check`.
3. **Els noms de recursos han de ser reals.** `sdp-media` no és cap bucket i `wordpress-plugin/soc-de-poble-directori.zip` no existix. Proposta: que `document.mjs check` avise quan un camí citat entre cometes inverses no existix.
4. **Les edicions d'un prompt aprovat han de deixar rastre.** La reescriptura de les 18:03 no té línia d'Historial, la Modificació no ha canviat i la llista de Tasques contradiu la Instrucció. Proposta: que `document.mjs check` exigisca una entrada d'Historial quan canvia el hash del cos.
5. **Avisar dels treballs paral·lels sobre els mateixos fitxers.** El canvi del Mercat va tocar fitxers del meu commit 1 en plena execució. Proposta: una secció «Fitxers reservats per torn» al pla, alimentada per `document.mjs own`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Ordre o mètode | Resultat |
| --- | --- | --- |
| Integritat de les 129 bessones | `integritat.sh` (RIFF/WEBP, mida declarada, original seguit) | 129/129 vàlides; 1 original per bessona |
| Assaig del ganxo, HEAD i 129 bessones | `materialitza.sh` i `portes.sh` (mateixa seqüència que `git-staged.mjs`) | vegeu §1.2 |
| Commit 1 tot sol (HEAD, 27 bessones i 4 fitxers) | eslint dels 4 fitxers i Vitest del cens, de la política i de `ControlSection` | eslint net; 59/59 |
| **Arbre final** (HEAD `20797591`, tree `bf3626d4`, idèntic a l'arbre assajat) | `npm run lint` i `npm run test -- --run` | **lint net (15 s); 1.149 fitxers i 19.662 proves en verd, 0 fallades, 95 saltades (598 s)** |
| Mides dels diffs | `git diff --binary c^ c` | 6,99 / 9,39 / 12,96 / 5,48 MB, tots per sota de 16 MiB |
| Índex real després dels commits | `git diff --cached --name-only` | només `.agents/ESTAT.md` i l'acta 1345, com abans |
| Codi D3: origen dels trossos i completesa | workflow de revisió de 6 agents, amb verificador | 47/47 trossos de la sessió 1447; cap dependència sense commit; 14 comentaris desfasats (corregits) |
| Codi D3: arbre del commit (`fb03d3f5`, idèntic a `4d499d47^{tree}`) | lint, Vitest, proves de node implicades i suite de node | vegeu la taula de §1.5 |
| Porta de mida del directori | `mida_directori.mjs` (la fórmula de la prova) | HEAD: −829.158 B; arbre de treball amb el Mercat de 1024 px: −70.586 B; commit: **+146.634 B** |
| Sonda CORS | `wf/cors/sonda.sh` (294 peticions) i verificador (37 peticions pròpies i Chrome sense capçal) | vegeu §2; confirmades 10 afirmacions, 1 en part (bucket inexistent, establit per les migracions) |
| Capacitor | builds A, B i C en una còpia; `node --test tests/natiu-build.test.mjs`; web oficial de Capacitor, Play i Apple | vegeu §3; confirmades 14 afirmacions, 2 en part (corregides al text) |

Els scripts són al scratchpad de la sessió: `assaig/`, `d3/`, `wf/cors/`, `wf/capacitor/`, `wf-d3/` i `spec-mobil/`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Ni push ni producció.** No he fet cap push, no he tocat cap servidor ni Supabase, i no he desplegat res.
- **Fitxers fora del meu abast.** No he escrit a `.agents/` (ESTAT ni LEDGER) i no he executat `tancament.mjs --close`. El `--check` falla per causes de governança fora del meu abast d'escriptura. Ho trasllade a MarIA.
- **Res de la Fase C aplicat.** La diferència del natiu és al scratchpad (`wf/capacitor/natiu-politica-amb-css.diff`).
- **Caus derivades al repo viu.** Els assajos de Vitest de la Fase A, amb `node_modules` enllaçat sencer, van escriure dins de `node_modules/.vite/`, una memòria cau derivada que Git ignora (P-12). Els del D3 ja usen un `node_modules` propi, amb un enllaç per paquet, i no escriuen al repo. El verificador de Capacitor ho va evitar amb `--configLoader native`.
- **Coses no verificades:**
  - el directori real dins d'una pàgina de WordPress;
  - `Expose-Headers` de Supabase en una resposta 200 o 206;
  - si Firebase aplica capçaleres pròpies a l'OPTIONS;
  - el comportament de Capacitor 8.5 en un simulador o un dispositiu;
  - `isSafeUrl` amb `capacitor://`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261019_1715_pla_implementacio_infraestructura_skills_i_mobil]]
- [[261019_1715_prompt_claude_infraestructura_i_mobil]]
- [[261019_1447_auditoria_claude_multimedia_webp]]
- [[261019_1730_auditoria_gemini_skills_i_laboratori]]
