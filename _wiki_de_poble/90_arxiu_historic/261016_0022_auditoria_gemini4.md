---
type: informe
status: esborrany
description: 'Auditoria sistèmica dels blocs 0-4: Lector RSS sobre UniversalWorkspace, Llei del Quadrat 1200x1200 WebP + EXIF, Fallback WP, decisions del Perfil i diagnòstic de les 2 proves roges de Vitest.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9ddbf794-0d16-42b9-ab90-f70b61a29671:442793dd-2f4d-4799-ac64-1b7fdaa7d767
---
# Auditoria de Coherència Sistèmica Gemini 4 Argon (Gauntlet Autònom)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9ddbf794-0d16-42b9-ab90-f70b61a29671:442793dd-2f4d-4799-ac64-1b7fdaa7d767 |
| Versió del document | 1.12.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T22:22:47.819Z |
| Modificació | 2026-10-16T03:36:30.000Z |
| Propietari | gemini4 |
| Aprovació humana | Mode Direcció Autònoma (`core-direccio-autonoma`); pla 261016_0015 aprovat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon / IAIA MarIA (Directora Tècnica) |
| Tokens consumits | En curs (ronda autònoma) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-15T22:22:47.819Z: esborrany creat sota el torn `torn_9ddbf794-0d16-42b9-ab90-f70b61a29671` i vinculat al pla `261016_0015_pla_implementacio_gauntlet_autonom.md`.
- 2026-10-15T22:28:30.000Z: primera passada completa d'auditoria sistèmica dels Blocs 0–4 publicada al canal viu de l'Escriptori per a coordinació amb Claude Code (`261016_0022_auditoria_claude.md`) i GPT Codex (`261016_0021_auditoria_codex.md`).
- 2026-10-15T22:36:30.000Z: segona passada (Relleu 2): implementat `tooling/maquinaria/convertir_a_webp.mjs` + `tests/convertir-a-webp.test.mjs` (2/2 en verd), generat `public/assets/ui/plugins/tpv_vinyeta.webp` (1200×1200 px, 79,68 KB), reconciliat formalment `.agents/SKILLS_SEAL.json` (`3c4eee5c565c371ff311d497a10b6628573aa69b84d4c52db3c17db01f8e6204`), llegida l'acta `261016_0035_acta_marmota_codex_gauntlet.md` i afegida la troballa T-G4-06 sobre `useEnquadramentImatge.jsx`.
- 2026-10-15T22:46:00.000Z: tercera passada (Relleu 3): resoltes i verificades les 3 alertes adversarials de Codex sobre `tooling/maquinaria/convertir_a_webp.mjs` (escriptura atòmica via fitxer temporal, preservació EXIF en PNG `eXIf` i TIFF `netejaRasterDeTiff`, i imposició estricta del pressupost `maxKb`), classificat `tests/convertir-a-webp.test.mjs` a `tooling/tests/node-suite-manifest.json` (`primary`, 13/13 proves Node en verd), i dictada la resolució canònica de MarIA al Fusible de Claude sobre D4/D6 vs Bloc 1.2/1.3.
- 2026-10-15T23:14:00.000Z: quarta passada (Relleu 4): assimilat el **Bloc -1 (Erradicació de Fantasmes «Mestre Poble» / `mestre-obres` i Doble Identitat `Javi Llinares` + Mac Mini)** i l'actualització de `core-direccio-autonoma/SKILL.md` (Direcció Pura de MarIA sense tocar codi de producció); emés l'inventari quirúrgic dels 4 residus de `Mestre Poble`/`mestre-obres` i dels 5 fitxers de proves en roig (`T-G4-00`).
- 2026-10-15T23:25:00.000Z: cinquena passada (Relleu 5): verificat que Codex ha resolt íntegrament `T-G4-00` (**Bloc -1 100% RESOLT i VERIFICAT: `153/153` proves en verd en 8 fitxers i `0` ocurrències de `Mestre Poble`/`mestre-obres` a tot l'arbre**); completat el Registre de `261016_0015_pla_implementacio_gauntlet_autonom.md` (`valid: true, errors: []`, hash `7690d33da82b80c1c652d651e853fc656bed375aa21faee82efb8b62f4cdf8ff`) i religat als 4 torns actius; dictades les 3 resolucions de Direcció Tècnica a les consultes del subagent de Claude (Bloc 3); i verificada la Purga de Mocks al Lector RSS (`src/apps/lector/` `251/251` proves en verd + `NotesSection.lector.test.jsx` `15/15`).
- 2026-10-15T23:33:00.000Z: sisena passada (Relleu 6): verificada l'alineació de `src/sections/plugins/registrePlugins.js` amb `tpv_vinyeta.webp` (`5/5` fitxers, `126/126` proves en verd) i de la canonada d'enquadrament i avatars (`MIDA_AVATAR = 400`, `MIDA_CAPCALERA = 1200`, `src/utils/pujadaImatge.js`, `18/18` fitxers, `307/307` proves en verd); actualitzada la directiva d'EXIF d'acord amb el Pla §0.1.3 vigent.
- 2026-10-16T00:42:00.000Z: setena passada (Relleu 7): religat el Pla actualitzat (`255c155609d7a524fa2c648d0c4e89ce78af011137de229216fbeb31367d8813`) als 4 torns actius; verificada la finalització de l'Onada 2 de Claude (`H-porta`, `G2a-quadrat`, `I-neteja`, `D2-lector` sobre `UniversalWorkspace` i `G2b-exif` amb chunk RIFF/JPEG EXIF per defecte i opt-out); assimilat el Relleu `02:40` de Codex (`261016_0021_auditoria_codex.md`); i emeses les especificacions quirúrgiques **`T-G4-16` a `T-G4-22`** per a l'Onada 3 de Claude (Blocs 3.5 / Onada 1.1, 3.6 / Onada 1.2 i tancaments residuals d'Onada 2).
- 2026-10-16T01:27:00.000Z: huitena passada (Relleu 8): verificat el tancament dels fronts d'Onada 3 de Claude Code (`wf_d1561f51-de6`: `S1-rls`, `S2-seo`, `L1-lector`, `P2-avatars`, `T1-neteja`, `X3-quadrat`, `X1-exif`, `C1-xat`, `P1-identitats` i `X2-orientacio`, 10/10 completats amb milers de proves en verd i `tests/lint-sessio.test.mjs` `1/1` «Lint net»); i emeses les resolucions de Direcció Tècnica a les consultes finals d'Onada 3.
- 2026-10-16T01:58:00.000Z: novena passada (Relleu 9): religat el Pla actualitzat amb l'Onada 1.3 (`ef197ae0570040b581bdb29df067e8378a2de35f42c2ddf52151aa13029113a3`) als 4 torns actius; aprovada l'empremta estructural de `drets-autor` a `.agents/contingut_estructural.json` (`14/14` claus estructurals en verd); verificat el tancament de `X2-orientacio` (`78/78` proves noves a `orientacio.formats.test.js`); i emesa l'especificació quirúrgica **`T-G4-24` (`Bloc 3.7` / `Onada 1.3` — Diferenciació Legal d'Amfitrions Sollutia vs WordPress `gentdelatorre.net` i Telemetria Sobirana)** per a `src/sections/text/legalContent.js` (`:161-164`, apartat 19).
- 2026-10-16T02:22:00.000Z: desena passada (Relleu 10): verificada la finalització 100% en verd de l'**Onada 4 de Claude Code (`wf_c1822fc6-d7b`, `4/4` fronts: `F1`, `F2`, `F3`, `F4`)** i el resultat de la **bateria global de Vitest (`npx vitest run src tests`: `1.057` fitxers passats, `18.272` proves en verd, `0` fallades, `exit code 0`)**; i seguit el workflow de cacera adversarial (`wf_25ece98e-adc`).
- 2026-10-16T03:26:00.000Z: onzena passada (Relleu 11): verificada la finalització **`8/8` de l'Onada 5 de correccions post-cacera adversarial de Claude Code (`wf_1dc1264b-6a6`: `A-pressupost`, `B-exif`, `C-identitats`, `D-avatar`, `E-drets`, `F-lector`, `G-xat`, `H-seo-sql`)**, amb `tests/lint-sessio.test.mjs` i `tests/lint_xat.test.mjs` `21/21` en verd («✅ Lint net») i `frontissa-contingut.mjs` `14/14` en verd; i dictades les resolucions de Direcció Tècnica a les `decisions_pendents` d'Onada 5.
- 2026-10-16T03:36:30.000Z: dotzena passada (Relleu 12 — Tancament Final del Gauntlet): verificat l'informe final de Claude Code (`261016_0022_auditoria_claude.md`, Relleu 7) amb la **bateria final de Vitest (`1.062 fitxers passats, 6 omesos; 18.386 proves passades, 89 omeses, 0 fallades`)**; aplicades i verificades les 3 correccions de maquinària i governança de la lectura creuada de Claude (`tooling/maquinaria/convertir_a_webp.mjs` amb poda d'IFD1/MakerNote via `analitzaTiff` i mètriques `qualitatWebp`/`radiDifuminat`, `tooling/gates/tractor-rls.mjs` sense fals positiu en R4 `0` infraccions sobre `45` SQL, i `_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md` sense referències a tercers); i tancat el torn amb `ESTAT.md`, `LEDGER.md` i `porta-olivera.mjs` en codi 0 («Cadascuna a sa casa»).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

> **🔔 AVÍS DIRECTE DE DIRECCIÓ TÈCNICA (MarIA) PER A CLAUDE CODE (POST-ONADA 5):**
> A les `03:04` el Pla (`ef197ae0570040b581bdb29df067e8378a2de35f42c2ddf52151aa13029113a3`) i el Prompt (`2e32d28e9ef449b2fe1c6a64867ab6753ddcc7a40a48799750375fab746b55ed`) van incorporar el **`Bloc 3.7` / `Onada 1.3` (Diferenciació Legal d'Amfitrions Sollutia vs WordPress `gentdelatorre.net` i Telemetria Sobirana)** per a **`src/sections/text/legalContent.js` (`:161-164`, apartat `<h4>19. No fem servir galetes</h4>`)**.
> Quan acaben els 8 agents de l'Onada 5 (`wf_1dc1264b-6a6`), aplica l'actualització de l'apartat 19 de `src/sections/text/legalContent.js` (detallada a **`T-G4-24`** al final d'aquest document):
> 1. **Node Matriu (`socdepoble.org` sobre Sollutia):** Zero galetes de tercers, zero Google Analytics, zero píxels publicitaris.
> 2. **Nodes Amfitrions Enxufables (WordPress, com `gentdelatorre.net` o portals municipals/veïnals):** Quan Sóc de Poble s'incrusta com a peça enxufable en un amfitrió extern, aquell portal pot usar les seues pròpies eines d'analítica i galetes (Google Site Kit, Google Analytics, Akismet) i té el deure de governança de declarar el seu trànsit de forma transparent als seus veïns.
> 3. **Telemetria Sobirana sense Espionatge:** Mètriques internes sobiranes i agregades d'ús del servici (visites al mur, consultes d'agenda, descàrregues) custodiades pels administradors del poble sense cedir dades personals a corporacions externes.
> *(Tan bon punt edites `src/sections/text/legalContent.js`, MarIA executarà `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares"` perquè `.agents/contingut_estructural.json` quede segellat en verd).*

### T-G4-00 · Bloc -1 («Mestre Poble» / `mestre-obres`, `'Javi Llinares'` i `mac-mini-m4`) — RESOLT per Claude i Codex i VERIFICAT per Gemini 4 (`153/153` proves en verd)

1. **Zero residus de `Mestre Poble` / `mestre-obres` a tot l'arbre de codi i proves:**
   - `grep -rnI -iE "mestre poble|mestre-obres|mestre_obres" src/ tests/ supabase/ public/ wordpress-plugin/` retorna **0 coincidències**.
   - `src/sections/mercat/targetaDeProducte.js` (hash `ef0cb4e44bf45a83a5f714fa9e567fd34b84ecd4bafad99526379bd72409a2d5`), `src/data/identitatsSeed.js:76`, `src/sections/mercat/marketSeed.js` (`mac-mini-m4` amb `image_url: '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'` i `avatar_url: '/assets/fotos/javi-llinares-perfil-1200px.jpg'`), `src/sections/detail/ItemDetailSection.capcalera.test.jsx` i `src/sections/notes/PublicacioDetall.capcalera.test.jsx` completament alineats.
2. **8/8 fitxers de prova d'autoria, mercat, mur, cerca, xat i detall en VERD (`159/159` proves amb els nous casos d'avatars de Codex):**
   - `src/sections/mercat/MercatSection.autoria.test.jsx` (`17/17`)
   - `src/data/identitatsSeed.autoria.test.js` (`7/7`)
   - `src/sections/mur/TargetaDelMur.autoria.test.jsx` (`7/7`)
   - `src/data/supabase/xat.test.js` (`96/96`)
   - `src/sections/search/indexCerca.fundacionals.test.js` (`10/10`)
   - `src/sections/detail/ItemDetailSection.capcalera.test.jsx` (`8/8`)
   - `src/sections/notes/PublicacioDetall.capcalera.test.jsx` (`6/6`)
   - `src/sections/multimedia/seedSql.multimedia.test.js` (`8/8`)
3. **Resolució Canònica de Direcció Tècnica (MarIA) a les 3 consultes del subagent de Claude (Bloc 3):**
   - **Consulta 1 (Onada 1.5 · `perfilDeLaPersonaPilot` en remot vs Doctrina D12):** Es manté la Doctrina D12 (`src/sections/profile/PerfilPublicSection.jsx:141-144` i `src/data/supabase/perfils.js:23-24`): quan el port remot és actiu i el servidor respon buit per a una persona o entitat, la resposta del servidor mana («Perfil no trobat»), mentre que en llavor i local `/gent/javi-llinares` i `/gent/javillinares` resolen netament via `localPerfils.loadPerfilPublic`.
   - **Consulta 2 (Derogació de D8 i T63.1 pel Bloc -1):** Es confirma oficialment que el pas a `'Javi Llinares'` com a nom públic canònic de la persona pilot a totes les llavors i l'àlies `'javi-llinares'` són ordre explícita del Mestre al Bloc -1 (`261016_0015_pla_implementacio_gauntlet_autonom.md`). Totes les proves afectades ja han estat actualitzades per Codex i passen en verd.
   - **Consulta 3 (Redactat de l'avís de màquina per a una IA distinta de la IAIA):** S'aprova canònicament el text `«{nom} és una màquina de Sóc de Poble, en proves. No substituïx cap persona del poble.»` a `src/sections/profile/PerfilPublicSection.jsx`.

---

### Coordinació de Direcció Tècnica (Relleus 3–6 amb Claude i Codex)

1. **Desbloqueig de confinament i resolució d'alertes adversarials del tractor WebP (`tooling/` i `.agents/`):**
   - **Segell de skills reconciliat:** `.agents/SKILLS_SEAL.json` (`5e7339dbf91865606a659c5abcf5e62a719ab487c410d7e04982a7a9f4bbebf7`).
   - **LEDGER i ESTAT sincronitzats:** `.agents/LEDGER.md` i `.agents/ESTAT.md` ja inclouen els torns del Gauntlet (`torn_9ddbf794-0d16-42b9-ab90-f70b61a29671`, `torn_5b62e0c4-ed6d-49f1-8a29-ff692698d9f1` i `torn_60a0d776-7f83-435d-ab7d-fa26f6507f08`) amb segell SHA-256 vàlid (`node tooling/verify-ledger.mjs` codi 0).
   - **Manifest CI actualitzat:** `tests/convertir-a-webp.test.mjs` classificat a `tooling/tests/node-suite-manifest.json` sota `suite: "primary"`. `node --test tests/node-suite-policy.test.mjs` passa `9/9`.
   - **Les 3 alertes adversarials de Codex sobre `tooling/maquinaria/convertir_a_webp.mjs` estan RESOLTES i verificades (`4/4` proves a `tests/convertir-a-webp.test.mjs` i `10/10` probes a `tests/gauntlet-codex-webp.audit.mjs`):**
     1. **Escriptura atòmica (P1 resolt):** L'encoder escriu a un fitxer temporal `.${basename}.tmp-${pid}-${uuid}.webp` al mateix volum i només executa `fs.renameSync(tmpPath, desti)` quan el contenidor RIFF WebP i el pressupost de bytes han estat validats; el bloc `finally` elimina qualsevol temporal residual i l'original/destí roman intacte byte a byte davant fallades injectades o entrades invàlides.
     2. **Preservació EXIF en PNG i TIFF i rebuig d'entrades invàlides (P1 resolt):** `extreuTiffExif` extrau ara el bloc TIFF tant de JPEG (`APP1`), WebP (`EXIF`) i PNG (`eXIf`) com de contenidors TIFF (`netejaRasterDeTiff` buida les etiquetes de tira/mosaic sense desplaçar cap offset d'IFD/valors), i `detectaFormatEntrada` rebutja explícitament formats no suportats abans d'invocar l'encoder.
     3. **Pressupost `maxKb` estricte en KB decimals (`< maxKb * 1000` bytes) i en KiB (P2 resolt):** `maxBytesTotals = Math.max(1, Math.floor(maxKb * 1000) - 1)`, garantint que `maxKb: 80` pese sempre `< 80.000 bytes` (`< 80 KB` decimals i `< 80 KiB` binaris). Si les metadades EXIF o el WebP resultant superen el límit, llança error explícit sense tocar el destí.
     - SHA-256 `tooling/maquinaria/convertir_a_webp.mjs`: `c7ec0f10f7b2d886c0c7dce7f0d386a65899f593eae46cd32ea2a9aa61c31842`.
     - SHA-256 `tests/convertir-a-webp.test.mjs`: `5b0e179cf336d0d5d25a5c7dbe9c3dba8828cab500afe26610a3a91032d01281`.
     - SHA-256 `public/assets/ui/plugins/tpv_vinyeta.webp`: `d3e3c3df601fed053eb94afb182e101ec5125346a03f4b54f2e2a1ebc3dc5b9d` (`1200×1200 px`, `77.746 bytes` = `77,75 KB` = `75,92 KiB`).
     - Harness adversarial de Codex `node tests/gauntlet-codex-webp.audit.mjs`: **`10/10` probes en verd** (`status: "passed"`, `failures: 0`).
2. **Directiva Canònica actualitzada del Pla §0.1.3 (Preservació EXIF per defecte + Opt-out d'usuari):**
   - D'acord amb el Pla actualitzat pel Mestre (`261016_0015_pla_implementacio_gauntlet_autonom.md` §0.1.3, SHA-256 `7690d33da82b80c1c652d651e853fc656bed375aa21faee82efb8b62f4cdf8ff`), **per defecte tota foto que es puja i es convertix a `.webp` conserva l'EXIF amb GPS, data/hora i càmera** per a l'ús cartogràfic i patrimonial (arbres monumentals, fonts, flora de La Torre de les Maçanes), oferint a l'usuari una opció explícita d'opt-out si no vol publicar la seua ubicació.
   - Al tractor `tooling/maquinaria/convertir_a_webp.mjs`, aquest comportament ja és el valor per defecte (`preservaExifBinari = true`) amb opt-out explícit (`--sense-exif-binari`).
   - En la canonada de navegador (`src/components/universal/enquadrament/` i `src/sections/text/pageContent.js`), `gps` i `dataCaptura` s'extrauen abans del Canvas i es preserven a les metadades de la imatge quan `publicar_mapa` està actiu; la re-incrustació del chunk binari RIFF `EXIF` al blob WebP eixit de `canvas.toDataURL` al navegador queda anotada com a evolució del client si es vol que el fitxer descarregat des del navegador també incloga el chunk RIFF `EXIF` binari.

---

### T-G4-01 · Bloc 0: Lector RSS, Purga de Mocks i `UniversalWorkspace`

- **Purga de Mocks a `/app/lector/noticies` (RESOLT per Claude i verificat per Gemini 4, `251/251` proves en verd):**
  - `src/apps/lector/AppLector.jsx` ja no activa la llavor sintètica per `import.meta.env.DEV`: només amb `VITE_SDP_LECTOR_LLAVOR === '1'` explícit. Sense port real connectat, `/app/lector/noticies` mostra l'estat buit honest («Encara no hi ha cap font connectada») sense cap notícia fictícia («El ple aprova la reforma del llavador vell» no apareix mai en dev ni en prod).
  - `npx vitest run src/apps/lector/` passa **`15/15` fitxers i `251/251` proves en verd**, i `src/sections/notes/NotesSection.lector.test.jsx` passa **`15/15` proves en verd**.
- **Nota arquitectònica (coincident amb Codex `01:31`):** `src/apps/lector/` manté `ClosaAplicacio` sobre `AppGridShell` i afegeix el suport de comptadors `count` a `UniversalWorkspace.jsx` (`15/15` proves a `UniversalWorkspace.recompte.test.jsx`); la migració completa de les vistes internes del Lector des de `ClosaAplicacio` cap a `UniversalWorkspace` i la connexió del connector de servidor per a les fonts RSS reals (Emowe, Mitjana, Jon Hernández) romanen com a següent pas quan el connector de servidor estiga operatiu.

---

### T-G4-02 i T-G4-06 · Bloc 1: Llei del Quadrat Universal (1200×1200 WebP), Avatars (400×400) i EXIF

- **Tractor `tooling/maquinaria/convertir_a_webp.mjs` (RESOLT i ENDURIT per Gemini 4, `4/4` Node + `10/10` probes Codex):**
  - Converteix JPEG, PNG, WebP i TIFF a `1200 × 1200 px` `.webp` (`< 80.000 bytes`, tant `< 80 KB` com `< 80 KiB`) i avatars a `400 × 400 px` `.webp` (`< 40.000 bytes`), amb escriptura atòmica, imposició estricta del pressupost i preservació del bloc TIFF EXIF (GPS i `DateTimeOriginal`) dins del chunk RIFF `EXIF` amb `VP8X` actiu.
- **Vinyeta del TPV en WebP integrada a `src/sections/plugins/registrePlugins.js` (RESOLT per Claude i verificat per Gemini 4, `126/126` proves en verd):**
  - `registrePlugins.js` defineix `extensioImatge: 'webp'` per al plugin `tpv`, servint `/assets/ui/plugins/tpv_vinyeta.webp` (`1200×1200 px`, `77.746 bytes`). `npx vitest run src/sections/plugins/` passa **`5/5` fitxers i `126/126` proves en verd**.
- **Canonada d'enquadrament i avatars a `400×400 px` (`src/utils/pujadaImatge.js` i `useEnquadramentImatge.jsx`, `307/307` proves en verd):**
  - Claude ha unificat `MIDA_AVATAR = 400` i `MIDA_CAPCALERA = 1200` a `src/utils/pujadaImatge.js` i actualitzat `useEnquadramentImatge.jsx`, `DetallAjust.jsx`, `PerfilEditor.jsx`, `useHeroImageHandler.js` i `pageContent.js`. Les 18 suites d'enquadrament, perfil i pujada passen **`307/307` proves en verd**.
  - **Observació tècnica alineada amb Codex (`01:31`):** `src/utils/pujadaImatge.js:25` defineix `PRESSUPOST_PUJADA = 80 * 1024` (`81.920 B` en KiB) i `src/hooks/useHeroImageHandler.js` conserva el fallback a l'últim intent si una imatge sintètica no baixa del llindar; per a rigor decimal estricte (`< 80.000 bytes`) convé alinear `PRESSUPOST_PUJADA = 79_999` i rebutjar explícitament quan el pressupost no es pot assolir.

---

### T-G4-03 · Bloc 2: Fallback Canònic de WordPress (RESOLT per Claude i verificat per Gemini 4)

- **Verificat a `wordpress-plugin/includes/marcatge.php:295` i `tests/enxufe-plugin.test.mjs`:**
  - `socdepoble_enxufe_etiqueta_incrustacio` retorna ara `<soc-de-poble' . $atributs . '>Carregant el mur...</soc-de-poble>`, i les suites passen `36/36` proves Node i `30/30` Vitest en verd.

---

### T-G4-04 · Bloc 3: Resolució de les 4 Decisions de Fase 1 i `PerfilPublicSection.jsx` (RESOLT per Claude i verificat per Gemini 4)

- **Verificat sobre 18 fitxers de proves (`482/482` proves en verd):**
  1. **Dignitat de Persona a `src/sections/profile/PerfilPublicSection.jsx`:** suprimits la píndola `Persona` i el copyright `© Nom` quan `perfil.tipus === 'persona'` (`PerfilPublicSection.test.jsx` `40/40` en verd).
  2. **Decisió 3.1 · Selector de llicència per defecte de les notes a «El compte»:** implementat a `src/sections/profile/DetallCompte.jsx`, `DetallAjust.jsx` i `PerfilContext.jsx`, sincronitzat amb `herencia.js` i `src/sections/text/pageContent.js` (`DetallCompte.test.jsx`, `DetallAjust.test.jsx`, `PerfilContext.test.jsx`, `ConnexioDetall.test.jsx` en verd).
  3. **Decisió 3.2 · Personatges `ANIMAL` del catàleg (`El Gall`, `Súper Ratolí`, `La Mixa`, `Sultan`):** classificats com a `ia` a `src/sections/profile/ProfileSection.jsx`, `src/data/localPerfils.js` i `src/sections/search/indexCerca.js` (`localPerfils.test.js` `27/27`, `indexCerca.test.js` `25/25`, `agentsSeed.drets.test.js` `33/33` en verd).
  4. **Decisió 3.3 · Poble a la targeta del directori de persones:** `src/sections/profile/ProfileSection.jsx` mostra el poble a la targeta del directori (`ProfileSection.poble.test.jsx` `7/7` en verd).
  5. **Decisió 3.4 · Retirada definitiva de la maquinària d'aside (`T50`):** retirat l'aside de `src/components/universal/DocumentEditor.jsx`, `src/css/components.css`, `EspecimenTargetaViva.jsx` i `manifest.js` (`DocumentEditor.test.jsx` `139/139`, `EspecimensUniversals.test.jsx` `33/33` en verd).

---

### T-G4-05 · Bloc 4: Coherència d'`ImatgeDePortada` en `PortadaPlegable` (RESOLT per Codex)

- Verificat que Codex ha actualitzat `src/components/universal/UniversalPage.jsx` i `src/components/universal/UniversalPage.portada.test.jsx` reutilitzant `ImatgeDePortada` de `PageFrame.jsx` (`88/88` proves en verd).

---

### T-G4-16 · Tancament Residual d'Onada 2 (`ona2:D2-lector` i `ona2:G2b-exif`) — Especificació per a Claude / Codex

1. **`src/components/PedraSeca/qualitat.nucliApps.test.js:203` (de `D2-lector`):**
   - Després de migrar `src/apps/lector/vistes/Noticies.jsx` a `UniversalWorkspace` / `DefaultItemCard`, l'únic fitxer de `lector` que conserva una `UniversalCard` és `src/apps/lector/vistes/comunes.jsx` (per a `/app/lector/fonts`). Cal substituir `'src/apps/lector/vistes/Noticies.jsx'` per `'src/apps/lector/vistes/comunes.jsx'` a `src/components/PedraSeca/qualitat.nucliApps.test.js:203` i afegir `'UniversalWorkspace'` a `nous` del `lector` a `src/apps/plataforma/modulDeBuild.test.jsx:407-409`.
   - **Scroll del Lector en canviar de carpeta (contraexemple Codex `02:26`):** A `src/apps/lector/vistes/Noticies.jsx:239-250`, quan canvia `carpetaActiva` o `vistaActiva` (i no s'està restaurant el detall d'una mateixa notícia), reiniciar `scrollTop = 0` del contenidor de llista.
2. **`src/sections/control/destinsControl.test.js:82` i `:133` (de `G2b-exif`):**
   - Actualitzar les dues assercions de text de `publicar_mapa` a `src/sections/control/destinsControl.test.js:82` (`'Per defecte, les fotos que puges conserven la ubicació i la data en què es van fer, per a situar el patrimoni del poble al mapa; abans de publicar-les, les pots llevar desmarcant «Conserva la ubicació i la data de la foto». Les imatges que poses dins del text es netegen sempre. Publicar al mapa vol dir acceptar que la teua foto es podrà localitzar públicament des d\'altres pàgines i pobles.'`) i `:133` (`'les conserva dins de la foto'`).
   - **Nota sobre contraexemples EXIF/orientació de Codex (`02:25`–`02:26`):** (a) integrar la lectura d'orientació multiformat (WebP/PNG) de `/tmp/sdp-codex-orientacio-proposta-261016/proposal.patch` o girar WebP explícitament quan `navegadorAplicaOrientacio` no gire WebP; (b) a `DialegEnquadrament.jsx`, no condicionar `metadades.exif` a `teUbicacioOData` si `exifPublicable.tiff` és vàlid (perquè fotos de càmera amb `Make`/`Model` però sense GPS també preserven el seu consentiment); (c) a `src/sections/notes/NotesEditor.jsx:73-79`, no recomprimir amb `compressImage` sense opcions un fitxer que ja ix de `fotoDinsDelPressupost`.

---

### T-G4-17 · Bloc 3.5.1 (Onada 1.1): Les 3 Rutes Canòniques (`/javillinares`, `/socdepoble`, `/rentonar`) i Zero Duplicats

1. **Rutes d'arrel a `src/app/App.jsx:959-964` (`ActorRoutes`):**
   - Actualment només existeixen `/gent/:agentId`, `/empresa/:agentId`, `/grup/:agentId` i `/perfil/:agentId`, de manera que `/javillinares`, `/socdepoble` i `/rentonar` cauen al `*` (`NotFoundPage`).
   - Afegir a `ActorRoutes` (`src/app/App.jsx:959-964`) les tres rutes canòniques d'arrel:
     - `<Route path="javillinares" element={<PerfilPublicSection agents={agents} slugFix="javillinares" />} />`
     - `<Route path="socdepoble" element={<PerfilPublicSection agents={agents} slugFix="socdepoble" />} />`
     - `<Route path="rentonar" element={<PerfilPublicSection agents={agents} slugFix="rentonar" />} />`
     (o resoldre `const clau = normalitzaId(agentId || slugFix || pathname.replace(/^\/+/, ''))` dins de `PerfilPublicSection.jsx:97`).
2. **Resolució canònica en mode `remote` per a les 3 identitats fundacionals a `src/sections/profile/PerfilPublicSection.jsx:151`:**
   - Quan `modeDades === 'remote'` i l'usuari visita `/javillinares`, `/socdepoble` o `/rentonar` (especialment sense sessió o abans que l'entitat estiga donada d'alta al servidor), `supabaseService.loadPerfilPublic(clau)` pot retornar `null` (perquè `profiles` filtra per UUID o RLS i `organization_directory` pot no tindre `rentonar`).
   - En lloc de caure a «Perfil no trobat» per a les 3 identitats fundacionals (`javillinares`, `socdepoble`, `rentonar`), usar com a fallback canònic el perfil públic de `localPerfils.loadPerfilPublic(clau)` (acotat estrictament als tres actors fundacionals del Pla: `PERSONA_PILOT` i `ENTITATS_SEED` `socdepoble` / `rentonar`, preservant D12 per a qualsevol slug desconegut).
3. **Unicitat absoluta i propietat de les 2 entitats fundacionals a `src/data/identitatsSeed.js`:**
   - A `src/data/identitatsSeed.js:55`, canviar `slug: 'javi'` a `slug: 'javillinares'` (mantenint `alies: Object.freeze(['javillinares', AGENTS_MAP.JAVI.id, 'javi', 'javi-llinares'])` perquè `/gent/javi` i `/gent/javi-llinares` continuen resolent al mateix perfil únic).
   - A `rolALEntitat` (`src/data/identitatsSeed.js:195-201`), fer que l'usuari pilot autenticat siga `'owner'` tant de `ENTITAT_PILOT_ID` (`'socdepoble'`) com d'`ENTITAT_RENTONAR_SLUG` (`'rentonar'`) en mode seed/local, de manera que totes dues apareguen a `listMyOrganizations` sota `/el-meu-perfil` sense necessitat de crear organitzacions duplicades.

---

### T-G4-18 · Bloc 3.5.2 (Onada 1.1): El Poble (`town_name: 'La Torre de les Maçanes'`) és Innegociable

1. **Correcció de les 3 llavors fundacionals:**
   - `src/data/agentsSeed.js:36` (`SOCDEPOBLE`): canviar `town_name: 'Sóc de Poble'` a `town_name: 'La Torre de les Maçanes'`.
   - `src/data/agentsSeed.js:64` (`JAVI`): canviar `town_name: 'Sóc de Poble'` a `town_name: 'La Torre de les Maçanes'`.
   - `src/data/identitatsSeed.js:122` (`ENTITATS_SEED[1]` · `El Rentonar`): canviar `town_name: ''` a `town_name: 'La Torre de les Maçanes'`.
2. **Alta i edició d'entitats (`src/sections/profile/PerfilContext.jsx` i `localPerfils.js`):**
   - Garantir que `town_name` tinga com a valor per defecte `'La Torre de les Maçanes'` en les entitats fundacionals i no es buide accidentalment a `''` quan es desa des de `PerfilEditor`.

---

### T-G4-19 · Bloc 3.5.3 (Onada 1.1): Reparació de l'Error 403 (`42501`) en Desar `profiles` a Supabase

1. **Diagnòstic confirmat per Gemini 4 i Codex (`02:32`):**
   - `src/data/supabase/auth.js:285-286` fa `PATCH /rest/v1/profiles?id=eq.<uid>` amb `Prefer: return=representation` sobre els 11 camps de `CAMPS_PERFIL` (`full_name`, `avatar_url`, `visibility`, `town_name`, `bio`, `is_public`, `lema`, `presentacio_html`, `hero_url`, `copyright`, `icon`).
   - L'error `42501: permission denied for table profiles` es produeix quan el rol `authenticated` no té el privilegi `UPDATE` sobre totes les columnes de `CAMPS_PERFIL` (o `SELECT` per al `RETURNING`), o quan falta la política RLS `FOR UPDATE TO authenticated`.
2. **Migració SQL idempotent i transaccional (`supabase/migrations/2610160245_reparacio_rls_profiles_update.sql`):**
   - Integrar la proposta verificada de Codex (`/tmp/sdp-profiles-update-repair-proposal.sql`, canviant el `ROLLBACK` final de prova per aplicació efectiva en migració) o crear la migració canònica amb:
     - `GRANT SELECT, UPDATE (full_name, avatar_url, visibility, town_name, bio, is_public, lema, presentacio_html, hero_url, copyright, icon) ON TABLE public.profiles TO authenticated;`
     - Política permissiva `FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id)` (actualitzant `"profiles update own"` i/o creant `"Users can update own profile"` de manera idempotent amb `DROP POLICY IF EXISTS` previ perquè no col·lisionen).

---

### T-G4-20 · Bloc 3.5.4 (Onada 1.1): Sincronització d'Imatges entre Targeta Central (`TargetaViva`) i Editor (`PerfilEditor`)

1. **Causa arrel de la divergència d'avatar a `src/sections/profile/PerfilEditor.jsx:445` (confirmada també pel contraexemple de Codex `02:26`):**
   - A `src/sections/profile/PerfilEditor.jsx:445`, `const avatarDesat = identitat.avatar || '';` s'envia a `autorTargeta.avatar` (`TargetaViva` de l'esquerra i barra taronja superior), mentre que el panell dret (`PerfilEditor`, línia 672) llig `const avatarDeCapcalera = fitxa.logoImage || '';` (que inclou `local.logoImage ?? text(dades[camps.logoImage])` de la cua d'autodesament!).
   - **Correcció:** A `src/sections/profile/PerfilEditor.jsx:445`, usar `const avatarDesat = fitxa.logoImage || identitat.avatar || '';` perquè la targeta central (`TargetaViva`) i el panell d'edició consumisquen sempre la mateixa instància d'avatar. A més, a `src/sections/profile/useImatgeDeFitxa.jsx`, comprovar el resultat de `desaCamp` (`const ok = await desaCamp(...)`) i, si retorna `false` (com en un 403 remot), llançar error perquè el diàleg d'enquadrament no es tanque silenciosament com si haguera desat.
2. **Paritat de capçalera i logo a `src/data/identitatsSeed.js`:**
   - A `ENTITATS_SEED[0]` (`socdepoble`, línies 87–88), assignar `hero_url: AGENTS_MAP.SOCDEPOBLE.hero_url` (`'/assets/uploads/brain/caricatura_socdepoble_portada.jpg'`) i `presentacio_html: AGENTS_MAP.SOCDEPOBLE.presentacio_html` (actualment estan a `''` a `ENTITATS_SEED[0]`, creant divergència amb `AGENTS_MAP.SOCDEPOBLE`).
   - A `ENTITATS_SEED[1]` (`rentonar`, línia 117), assignar `logo_url: '/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg'` (el fitxer real existeix a `public/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg`!).

---

### T-G4-21 · Bloc 3.5.5 (Onada 1.1): SEO i Previsualització OpenGraph per a WhatsApp (`1200 × 630 px`)

1. **Verificació local (`index.html:25-39` i `src/hooks/seoHead.js`):**
   - `public/assets/system/ui/og-socdepoble-1200x630.png` (`1200 × 630 px`) existeix al disc i està declarat a `index.html:28-32` i `src/hooks/seoHead.js:9-11`.
   - Afegir a `index.html` les etiquetes estàtiques `<meta property="og:url" content="https://socdepoble.org/" />` i `<link rel="canonical" href="https://socdepoble.org/" />` perquè els scrapers sense JS (WhatsApp, Telegram) vegen l'URL canònica des del primer byte.
   - A `src/hooks/seoHead.js`, garantir que `descripcio` tinga sempre un fallback no buit (`'Sóc de Poble: la xarxa pública del poble.'`) perquè mai no s'escriga `content=""` en cap meta tag.
   - *(Nota d'infraestructura registrada per Codex `02:32`: al servidor públic `https://socdepoble.org` actualment el desplegament antic retorna l'HTML d'index per a `/assets/system/ui/og-socdepoble-1200x630.png` perquè el build nou encara no s'ha desplegat).*

---

### T-G4-22 · Bloc 3.6 (Onada 1.2): Els 4 Actors Permanents del Xat i Reparació de `IAIA MarIA` a `localhost`

1. **Causa arrel de per què `IAIA MarIA` falla a `localhost` i funciona a `gentdelatorre.net`:**
   - A `src/sections/xat/useObriXatPerDefecte.js:80`, quan es fa clic sobre la fila `sdp-per-defecte:iaia`, el hook navega incondicionalment a `RUTA_XAT_DE_LA_IAIA` (`/xat?sobre=pagina:%2Fiaia&titol=IAIA%20MarIA`) en lloc d'usar `rutaDelXatDeLaIAIA(modeDades, senseSessio)`.
   - En mode `local`/`seed` (com a `localhost` quan no hi ha sessió remota o s'ix de remot), `/xat?sobre=pagina:%2Fiaia` obri un fil de pàgina buit on el motor local de la IAIA (`localXat.js`, que escolta la conversa directa amb `AGENTS_MAP.IAIA.id`) no respon mai!
   - En mode `remote` autenticat a `localhost:3340`, `/xat?sobre=pagina:%2Fiaia` crida l'RPC `obri_fil_de_pagina(p_tipus: 'pagina', p_id: '/iaia')`. Si la migració `2610042330_xat_pagina_iaia.sql` no està aplicada al Supabase objectiu, l'RPC llança `SDP-XAT-013` («Ací no hi ha cap xat comú on comentar») i `XatContext.jsx:1049` expulsa l'usuari de tornada a `/xat`.
   - **Correcció quirúrgica:**
     1. A `src/sections/xat/useObriXatPerDefecte.js:80`, substituir `navigate(RUTA_XAT_DE_LA_IAIA)` per `navigate(rutaDelXatDeLaIAIA(modeDades, !currentUser || Boolean(currentUser.isAnonymous)))`.
     2. A `src/data/supabase/xat.js` (`obriFilDePagina`), si `objecte?.tipus === 'pagina' && objecte?.id === '/iaia'` falla amb `SDP-XAT-013`, reintentar automàticament amb `id: '/ia'`; i a `src/sections/xat/XatContext.jsx:1049`, si el fil de pàgina de la IAIA no està disponible en remot, redirigir netament a `RUTA_XAT_DE_MOSTRA_DE_LA_IAIA` (`/xat?amb=11111111-1a1a-0000-0000-000000000000`) o obrir la conversa local de la IAIA perquè mai no falle a `localhost`.
2. **Els 4 Actors Permanents del Xat (`Sóc de Poble`, `Javi Llinares`, `Gent de la Torre`, `IAIA MarIA`):**
   - **A `src/data/xatsPerDefecte.js:45-68`:**
     - Ampliar `AJUDA` perquè incloga també l'actor humà de referència `Javi Llinares`:
       `{ clau: 'javi', agentKey: 'JAVI', id: 'sdp-per-defecte:javi', participantId: AGENTS_MAP.JAVI.id, nom: 'Javi Llinares', rol: 'Contacte humà del projecte', avatar: PERSONA_PILOT.avatar, poble: 'La Torre de les Maçanes', salutacio: 'Hola, sóc Javi Llinares. Escriu-me i et respondré quan puga.' }`.
   - **A `src/sections/xat/XatContext.jsx:1336`:**
     - Eliminar el filtre `gestionaSocDePoble ? senseXatPerDefecte(ambAjuda, 'socdepoble') : ambAjuda` (i l'equivalent per a `'javi'`), perquè el mandat del Bloc 3.6 exigeix que els **4 actors de referència apareguen sempre des del primer moment** i el xat no es veja mai buit.
   - **A `src/sections/xat/pobleAmfitrio.js` / `usePobleAmfitrio.js`:**
     - Quan l'amfitrió no declara cap poble a `externalConfig.poble` (com passa a `localhost:3340` / `socdepoble.org`), retornar per defecte el poble fundacional `{ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes', titolXat: 'Gent de la Torre' }` perquè **`Gent de la Torre`** estiga sempre present tant en visitants anònims (`FakeChatOnboarding.jsx`) com en usuaris autenticats (`XatSection.jsx`).
   - **A `src/sections/xat/components/FakeChatOnboarding.jsx` (visitant no registrat + missatge automàtic de `Javi Llinares`):**
     - Afegir la conversa `fake-javi` (`Javi Llinares`, avatar `PERSONA_PILOT.avatar`, subtítol `'La Torre de les Maçanes'`).
     - Quan un usuari no registrat entra a `fake-javi` (o intenta escriure-li), mostrar immediatament el missatge automàtic literal ordenat pel Mestre al Bloc 3.6.1:
       **`«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»`**
     - A `src/sections/xat/useObriXatPerDefecte.js`, afegir el cas `clau === 'javi'` (que sense sessió obri `/xat?mostra=fake-javi` i amb sessió obri la conversa directa amb `PERSONA_PILOT.id` / `AGENTS_MAP.JAVI.id`).

---

### T-G4-23 · Verificació d'Onada 3 (`wf_d1561f51-de6`) i Resolucions Canòniques de Direcció Tècnica (Relleu 8)

1. **Balanç verificat dels fronts completats d'Onada 3 (`T-G4-16` a `T-G4-22`):**
   - **`ona3:T1-neteja` (`T-G4-16.1` i `T-G4-16.2`) — RESOLT i VERIFICAT (`662/662` proves en verd en 22 fitxers + `tests/lint-sessio.test.mjs` `1/1` «Lint net»):** `src/sections/control/destinsControl.test.js` (`22/22`) i `src/components/PedraSeca/qualitat.nucliApps.test.js` (`18/18`) passen 100% en verd.
   - **`ona3:L1-lector` (`T-G4-16.1b` scroll del Lector) — RESOLT i VERIFICAT (`270/270` proves en verd en 16 fitxers de `src/apps/lector/` + `622/622` a `src/apps/plataforma/`):** reinici de `scrollTop = 0` en canviar de carpeta verificat amb 4 proves de regressió noves a `espaiNoticies.test.jsx` (`30/30`).
   - **`ona3:X1-exif` i `ona3:X3-quadrat` (`T-G4-16.2b` i Bloc 1) — RESOLT i VERIFICAT (`100/100` fitxers, `1.680/1.680` proves en verd + `22/22` fitxers, `292/292` proves en verd):** resolts els contraexemples de Codex sobre `SubIFD` i `MakerNote` a `exifIncrustat.js` (`29/29`), sostre per format (`WebP`/`PNG` fins al pressupost de pujada), casella d'EXIF per a càmera sense GPS/data (`DialegEnquadrament.exif.test.jsx` `17/17`) i no-recompressió a `NotesEditor.jsx`.
   - **`ona3:P1-identitats` (`T-G4-17` i `T-G4-18` · Bloc 3.5.1 i 3.5.2) — RESOLT i VERIFICAT (`289/289` fitxers, `5.572/5.572` proves en verd + `216/216` fitxers veïns, `2.610/2.610` proves en verd):** rutes canòniques d'arrel `/javillinares`, `/socdepoble` i `/rentonar` declarades a `src/app/App.jsx:970-972` (`App.rutesCanoniques.test.jsx`, `navigation.canoniques.test.js`, `identitatsSeed.fundacionals.test.js`, `PerfilPublicSection.canonica.test.jsx`, `pobleOrganitzacio.test.js`); `town_name: 'La Torre de les Maçanes'` aplicat i exigit a les 3 identitats fundacionals i a l'alta/edició d'organitzacions.
   - **`ona3:S1-rls` (`T-G4-19` · Bloc 3.5.3) — RESOLT i VERIFICAT (`15/15` proves a `src/data/supabase/perfilUpdatePropi.migracio.test.js`):** creada la migració idempotent i transaccional `supabase/migrations/2610160250_perfil_update_propi.sql` que verifica RLS activa (`SDP-PERFIL-020`), atorga `grant update` columna a columna sobre els 11 camps de `CAMPS_PERFIL`, elimina qualsevol duplicat `"Users can update own profile"` i recrea `"profiles update own"` amb `using ((select auth.uid()) = id) with check ((select auth.uid()) = id)` + `notify pgrst, 'reload schema'`.
   - **`ona3:P2-avatars` (`T-G4-20` · Bloc 3.5.4) — RESOLT i VERIFICAT (`10/10` fitxers, `217/217` proves en verd a `PerfilEditor.imatges.test.jsx` i suites del perfil):** unificada la font d'avatar entre `TargetaViva`, barra taronja i `PerfilEditor`, i propagat el fracàs (`403`) a `useImatgeDeFitxa.jsx` perquè el diàleg d'enquadrament no es tanque com si haguera desat.
   - **`ona3:S2-seo` (`T-G4-21` · Bloc 3.5.5) — RESOLT i VERIFICAT (`15/15` fitxers, `300/300` proves en verd a `src/hooks/useSEO.test.jsx`, `seoHead.test.js`, `tests/enxufe-seo.test.js`):** OpenGraph `1200 × 630 px` i meta tags sense buits verificats.
   - **`ona3:C1-xat` (`T-G4-22` · Bloc 3.6 / Onada 1.2) — RESOLT i VERIFICAT (`142/142` fitxers, `2.249/2.249` proves en verd a `src/sections/xat` + `src/data` i `123/123` fitxers, `2.576/2.576` proves en verd a `src/app` + `20/20` a `tests/lint_xat.test.mjs`):** els 4 actors permanents (`Sóc de Poble`, `Javi Llinares`, `Gent de la Torre`, `IAIA MarIA`) estan sempre visibles al Xat; el clic d'un visitant no registrat a `Javi Llinares` mostra el missatge automàtic literal `«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»`; i el clic a `IAIA MarIA` funciona a `localhost` tant en mode seed/local com en remot.
2. **Resolucions Canòniques de Direcció Tècnica (MarIA) a les consultes finals d'Onada 3:**
   - **Resolució 1 (a `P1-identitats` sobre `/javillinares` en mode `remote`):** Es ratifica que en mode `remote`, si el servidor retorna buit per a la ruta canònica `/javillinares` (perquè `profiles` encara no té lectura anònima per slug), **s'autoritza l'opció (a)** (`T-G4-17.2`): suplir la fitxa pública de `/javillinares` (i `/socdepoble`, `/rentonar`) des del paquet (`localPerfils.loadPerfilPublic`) exclusivament per a les 3 identitats fundacionals del Pla, fins que el Mestre aplique una migració de lectura pública per slug a `profiles`. Així els beta-testers de WhatsApp sense sessió mai no rebran «Perfil no trobat» a `/javillinares`.
   - **Resolució 2 (a `C1-xat` sobre `IAIA` apagada i `Javi Llinares` en remot):** S'aprova conservar el respecte al nivell d'IA `0` (quan l'usuari apaga explícitament la IAIA als seus ajustos) i l'avís honest quan en mode `remote` amb sessió encara no s'ha declarat l'UUID remot de `Javi Llinares`.
   - **Resolució 3 (a `X1-exif` sobre orfes amb `MakerNote` i validació estricta d'IFD):** S'aprova íntegrament la política implementada a `exifIncrustat.js`: conservar els bytes referenciats pel `MakerNote` (excepte si pareixen un JPEG incrustat) i emetre avís explícit quan l'estructura TIFF siga insegura o no conservable, donant a la persona l'opció honesta de desmarcar la casella.
   - **Resolució 4 (a `P2-avatars` sobre l'esborrany després d'un 403):** S'aprova que totes les superfícies (`TargetaViva`, barra i `PerfilEditor`) mostren la mateixa font única mentre el diàleg roman obert amb l'avís d'error `avisDeImatgeNoDesada`.
   - **`ona3:X2-orientacio` (`T-G4-16.3` · Orientació EXIF multiformat) — RESOLT i VERIFICAT (`110/110` fitxers, `1.878/1.878` proves en verd + `78/78` a `src/utils/orientacio.formats.test.js`):** implementat el lector EXIF multiformat (`JPEG`, `PNG`, `WebP`) a `src/components/universal/enquadrament/exif.js` i la sonda d'orientació per format a `imatgeCanvas.js` i `imageUtils.js`. Un `WebP` amb `Orientation 6` es gira exactament una sola vegada tant al retallador com a `compressImage`.

---

### T-G4-24 · Bloc 3.7 (Onada 1.3): Diferenciació Legal d'Amfitrions (Sollutia vs WordPress `gentdelatorre.net`) i Telemetria Sobirana (`src/sections/text/legalContent.js`)

1. **Context de Governança (Pla `ef197ae0570040b581bdb29df067e8378a2de35f42c2ddf52151aa13029113a3` §Onada 1.3 i Prompt `2e32d28e9ef449b2fe1c6a64867ab6753ddcc7a40a48799750375fab746b55ed` §Bloc 3.7):**
   - A `src/sections/text/legalContent.js:161-164`, l'apartat `<h4>19. No fem servir galetes</h4>` afirma actualment sense matisos que no s'instal·len galetes ni existeix Google Analytics.
   - Com que Sóc de Poble opera en **arquitectura hiperenxufable** tant al **Node Matriu (`socdepoble.org`, allotjat sobre Sollutia)** com incrustat en **Nodes Amfitrions WordPress (com `gentdelatorre.net` o portals d'ajuntaments i associacions)**, l'apartat 19 ha de distingir amb transparència absoluta tots dos escenaris i declarar la nostra **Telemetria Sobirana sense Espionatge**.
2. **Especificació quirúrgica per a `src/sections/text/legalContent.js` (`:161-164`, apartat 19):**
   - Mantindre el títol `<h4>19. No fem servir galetes</h4>` (per no trencar cap test ni índex que cerque el títol de l'apartat 19) i substituir o ampliar els paràgrafs de l'apartat 19 per cobrir els 3 punts del Bloc 3.7:
     1. **Node Matriu (`socdepoble.org` sobre Sollutia):** L'aplicació de Sóc de Poble per si mateixa **no instal·la galetes (cookies) al teu navegador** —ni de publicitat, ni d'analítica de tercers, ni pròpies—, no porta Píxel de Meta ni Google Analytics, i per això al node matriu (`socdepoble.org`) no et fem passar per cap bàner d'acceptar galetes.
     2. **Nodes Amfitrions Enxufables (WordPress, com `gentdelatorre.net`, o portals municipals i veïnals):** Quan Sóc de Poble s'incrusta com a peça enxufable (Web Component o connector) dins d'un portal amfitrió extern gestionat amb WordPress o altres gestors, **aquell portal amfitrió pot tindre les seues pròpies eines d'analítica i galetes** (com Google Site Kit, Google Analytics o Akismet). Per governança del projecte, cada portal amfitrió és responsable d'informar i declarar de manera transparent el seu propi trànsit i les seues galetes als seus veïns.
     3. **Telemetria Sobirana i Analítica sense Espionatge:** Per a no deixar cecs els administradors del poble davant l'ús real del servici públic, Sóc de Poble empra (o prepara) **mètriques internes sobiranes i agregades** (recompte de visites al mur, consultes d'agenda o descàrregues de documents) sense rastreig individual, sense perfilat comercial i sense cedir cap dada personal a corporacions externes.
3. **Sincronització immediata amb `.agents/contingut_estructural.json` (Directora Tècnica MarIA):**
   - Durant aquest Relleu 9, MarIA ja ha aprovat l'empremta estructural de `drets-autor` (`node tooling/gates/frontissa-contingut.mjs --aprova drets-autor --per "Mestre Javi Llinares"`, `14/14` claus en verd).
   - Tan bon punt Claude Code actualitze l'apartat 19 de `src/sections/text/legalContent.js`, MarIA executarà `node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares"` perquè `.agents/contingut_estructural.json` (`claus.legal.sha256` i `claus.legal.html`) quede 100% segellat i en verd.
4. **Resposta de Direcció Tècnica a l'observació de Claude sobre el tractor WebP (`261016_0022_auditoria_claude.md:113-118`):**
   - S'accepta i es deixa registrada l'observació sobre `tooling/maquinaria/convertir_a_webp.mjs`: l'ús de `sips` (macOS) + `python3` (Pillow) fou la via zero-npm-install que preservava l'arbre `node_modules` intacte sota confinament nocturn; i la revisió humana de la marca «LICOR 43» a la il·lustració de `tpv_vinyeta.webp` queda anotada per al Mestre al despertar.

---

### T-G4-25 · Verificació d'Onada 4 (`wf_c1822fc6-d7b`, `4/4`) i Bateria Global de Vitest (`1.057` fitxers, `18.272` proves en verd, `0` fallades)

1. **Tancament 100% verificat dels 4 fronts d'Onada 4 (`wf_c1822fc6-d7b`):**
   - **`ona4:F1` (`a21a42f4098e49ca1`) — RESOLT i VERIFICAT:** `src/sections/profile/DetallAjust.jsx` usa `esAvisDeLaFoto` per mostrar els 5 avisos de la foto (incloent les variants de càmera i d'EXIF no conservable) sense emmascarar-los com a error de connexió; `src/sections/profile/DetallVistes.jsx` («Les vistes») aplica la mateixa regla de font única d'avatar que `PerfilEditor.jsx:475-477` fins i tot després d'un `403`.
   - **`ona4:F2` (`a69303efae41a6ca7`) — RESOLT i VERIFICAT:** `src/components/universal/workspace/UniversalWorkspace.jsx` passa `visibleItemIds` i `filtered` a `renderDetail` sense alterar el DOM ni la porta `'workspace'`; `src/apps/lector/vistes/Noticies.jsx` i `src/apps/lector/vistes/comunes.jsx` (`MarcaTotLlegit`) marquen només els resultats visibles quan hi ha filtre o cerca activa (`espaiNoticies.test.jsx` `31/31` en verd).
   - **`ona4:F3` (`a67226776bab31085`) — RESOLT i VERIFICAT (`101/101` fitxers, `2.008/2.008` proves en verd):** `src/sections/disseny/cataleg/versio.js` i `versio.test.js` (`13/13`) i `src/components/universal/editorial.test.js` (`76/76`) en verd; `supabase/README.md` documenta `2610160250_perfil_update_propi.sql`; `src/config/sections.js`, `src/hooks/RouteSEO.jsx` i `public/sitemap.xml` integren les 3 rutes canòniques (`/javillinares`, `/socdepoble`, `/rentonar`).
   - **`ona4:F4` (`a41e15d6b48173c17`) — RESOLT i VERIFICAT (`84/84` fitxers, `1.580/1.580` proves en verd):** `ambLaIdentitatPropia` a `src/sections/search/indexCerca.js` i `src/sections/search/useCercaGlobal.js` fusiona el compte amb sessió i la fitxa `'0001'` per identitat declarada (`aliesDeLActor` + `clauFundacional`), conservant intacta la regla d'homònims de Codex (`indexCerca.fundacionals.test.js` `14/14`, `SearchSection.test.jsx` `19/19`).
2. **Resolucions de Direcció Tècnica (MarIA) a les consultes de `F4`:**
   - S'aprova mantindre `ambLaIdentitatPropia` acotada a la font única `aliesDeLActor` i a les persones sense modificar `identitatsSeed.js`.
3. **Bateria Global de Vitest (`npx vitest run src tests`) completada amb ZERO fallades:**
   - **`Test Files: 1057 passed | 6 skipped (1063)`**
   - **`Tests: 18272 passed | 89 skipped (18361)`**
   - **`Exit code: 0`**

### T-G4-26 · Verificació d'Onada 5 (`wf_1dc1264b-6a6`, 8/8) i Resolucions de Direcció Tècnica (Relleu 11)
1. **Verificació completa dels 8 agents correctors d'Onada 5 (`8/8` completats):**
   - **`ona5:A-pressupost` (`a93c4099af8020b2c`) — RESOLT i VERIFICAT (`21/21` proves en verd):** `src/utils/pujadaImatge.js` fa cerca binària de la màxima qualitat WebP que cap dins `< 80.000 B` per a codificadors reals Chromium/Apple a `1200×1200` (`qualitatPerPressupost`, `6` iteracions des de `0.85`).
   - **`ona5:B-exif` (`ac0eb96bca9953d2e`) — RESOLT i VERIFICAT (`45/45` fitxers, `911/911` proves en verd):** Resolts els 5 defectes d'EXIF i privadesa a `src/components/universal/enquadrament/exifIncrustat.js`, `DialegEnquadrament.jsx` i `imatgeCanvas.js` (`stripByteCounts` `0x0117` esborrat, punters pendents podats abans de truncar, `preservaExif: false` per defecte a `retallaImatgeACanvas`, `exifEliminat` quan el fitxer original no duu APP1, i esborrat d'offset de miniatura JPEG incrustada dins `MakerNote` per evitar fuga de la cara o del rètol de carrer fora del retall).
   - **`ona5:C-identitats` (`a57edf3ecb4997d7b`) — RESOLT i VERIFICAT (`104/104` proves en verd):** `src/sections/profile/PerfilPublicSection.jsx` aplica `perfilFundacionalDelPaquet` com a fallback en mode `remote` si la consulta de `profiles` no torna fila (evitant «Perfil no trobat» a `/javillinares`, `/socdepoble` i `/rentonar`); `clauFundacional` a `src/data/identitatsSeed.js` ja no deduïx `'javillinares'` per `full_name` sol; `createOrganization` a `src/data/supabase/organizations.js` preserva `town_name` d'organitzacions preexistents i propaga `poble` al fallback local.
   - **`ona5:D-avatar` (`a42d35d2d9d50d8b8`) — RESOLT i VERIFICAT (`215/215` proves en verd):** Funció pura compartida `avatarDeLaFitxa(fitxa, camps, identitat)` a `src/sections/profile/fitxaDePerfil.js` emprada per `PerfilEditor.jsx`, `DetallVistes.jsx` i `DetallCompte.jsx`, garantint la mateixa cadena de prioritat d'avatar en tots tres punts.
   - **`ona5:E-drets` (`ac7c39b46af26b7d4`) — RESOLT i VERIFICAT (`98/98` proves en verd):** Sincronització entre dispositius de `llicenciaPerDefecteNotes` via `IdentitatContext.jsx` i `src/components/universal/drets/herencia.js` amb migració idempotent des de la clau anònima local.
   - **`ona5:F-lector` (`a69ca9cc4e7e0dfa4`) — RESOLT i VERIFICAT (`289/289` proves en verd):** Resolts els 4 defectes del Lector RSS a `src/apps/lector/vistes/Noticies.jsx`, `navegacio.js` i `AppLector.jsx` (`visibleItemIds` net i deduplicat, mapa de `scrollTop` acotat a 64 entrades i buidat en canviar d'usuari, `seleccio` sanejada en perdre el node i `useEffect` de persistència sense re-execució per cada clic de lectura).
   - **`ona5:G-xat` (`ae86a704e2cdb659c`) — RESOLT i VERIFICAT (`2.353/2.353` Vitest + `20/20` `lint_xat.test.mjs`):** Coincidència estricta per id/àlies per a Javi (`esActorJavi` i `idConversaJavi` mai casen només per `name === 'Javi Llinares'`, blindant homònims al xat), missatge de benvinguda reactiu en resoldre's la identitat tardana i preservació del filtre `'tots'` en obrir el xat per defecte.
   - **`ona5:H-seo-sql` (`ab432317202472377`) — RESOLT i VERIFICAT (`106/106` proves en verd):** Eliminat `<meta property="og:url">` estàtic de `index.html` (gestionat dinàmicament per ruta a `RouteSEO.jsx` i `seo Meta`) i documentades totes les migracions recents a `supabase/README.md`.
2. **Resolucions de Direcció Tècnica (MarIA) a les consultes d'Onada 5:**
   - S'aprova l'heurística de sanejament de miniatures JPEG (`0xFFD8FF`) dins `MakerNote` per sobre de `256 B` a `exifIncrustat.js`.
   - S'aprova la prioritat `camps.avatar_url` sobre `fitxa.avatar_url` dins `avatarDeLaFitxa` per reflectir en viu l'edició local abans de desar, amb reversió neta en cancel·lar.
   - S'aprova l'ordre de migració de llicència per defecte (`servidor > preferència per compte > migració única de clau anònima > CC BY-SA 4.0`).

### T-G4-27 · Tancament del Gauntlet Tripartit Autònom, Resolució de Lectura Creuada de Claude (Relleu 7) i Verificació Final (Relleu 12)
1. **Verificació del Relleu 7 final de Claude Code (`261016_0022_auditoria_claude.md`):**
   - **Vitest sencer final (`npx vitest run src tests`):** **`1.062` fitxers passats, `6` omesos; `18.386` proves passades, `89` omeses, `0` fallades (`exit code 0`).**
   - **Build real del paquet (`node --test tests/standalone-build.test.mjs`):** **`31/31` en verd** (monolític i trossejat).
   - **Connector WordPress, conformitat d'amfitrió, lint i política de la suite:** **`112/112` proves passades, `0` fallades** (`1` omesa per `dist-natiu/`).
2. **Resolució immediata per Gemini 4 dels 3 punts de governança i maquinària anotats per Claude a la lectura creuada (`261016_0022_auditoria_claude.md` §«Per a Gemini i Codex»):**
   - **`tooling/maquinaria/convertir_a_webp.mjs` (Poda d'IFD1/MakerNote i transparència de codificació):** `normalitzaOrientacioTiff` ara invoca `analitzaTiff` de `src/components/universal/enquadrament/exifIncrustat.js` per eliminar l'IFD1 i qualsevol miniatura JPEG dins `MakerNote` (amb fallback deslligant `nextIfdOffset`), documenta el requisit local de `python3` + `Pillow` a la capçalera i retorna explícitament `qualitatWebp`, `radiDifuminat` i `degradatPerPressupost` (`13/13` proves Node i `10/10` probes adversarials de Codex en verd).
   - **`tooling/gates/tractor-rls.mjs` (Regla R4 `VISTA-DEFINER`):** Corregit el fals positiu sobre el comentari `-- ... només ...` de `2610081401_organitzacions_poble.sql:21` fent que R4 avalue sobre `sentencies(content)` (comentaris SQL ja filtrats). Ara `node tooling/gates/tractor-rls.mjs` retorna **`✅ [RLS] Zero fantasmes i zero forats (sobre 45 fitxers sql)` (`exit code 0`)**.
   - **`_wiki_de_poble/03_actuar/plantilles/prompt_nano_banana.md`:** Eliminades les referències a personatges protegits de tercers (`Mortadelo y Filemón`), deixant l'estil còmic costumista mediterrani dels anys 70-80 amb personatges valencians originals.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `node tooling/gates/porta-olivera.mjs`: Codi 0 verificat.
- `node tooling/verify-ledger.mjs`: Codi 0 verificat (`.agents/LEDGER.md` inclou els torns del Gauntlet).
- `verificaSegell(process.cwd())`: Intacte (`true`, hash `5e7339dbf91865606a659c5abcf5e62a719ab487c410d7e04982a7a9f4bbebf7`).
- `node tooling/gates/tractor-rls.mjs`: `✅ [RLS] Zero fantasmes i zero forats (sobre 45 fitxers sql)` (codi 0).
- `node tooling/gates/frontissa-contingut.mjs --json`: `valid: true, requerides: 14, correctes: 14, errors: []` (`drets-autor` aprovada a `.agents/contingut_estructural.json`; `tests/frontissa-contingut.test.mjs` `9/9` en verd).
- `node tooling/wiki/document.mjs check`: `valid: true, errors: []` sobre `261016_0015_pla_implementacio_gauntlet_autonom.md`, `261016_0015_prompt_gauntlet_claude_codex_gemini.md`, `261016_0021_auditoria_codex.md`, `261016_0022_auditoria_claude.md` i `261016_0022_auditoria_gemini4.md`.
- `node --test tests/convertir-a-webp.test.mjs tests/node-suite-policy.test.mjs`: `13/13` proves en verd (`4/4` del tractor WebP amb `analitzaTiff`, PNG/TIFF EXIF, escriptura atòmica, pressupost estricte `< maxKb * 1000 B` i `preservaExifBinari: false`; `9/9` d'inventari de la suite Node).
- `node tests/gauntlet-codex-webp.audit.mjs`: `10/10` probes adversarials de Codex en verd (`status: "passed"`, `failures: 0`).
- `node --test tests/lint-sessio.test.mjs tests/lint_xat.test.mjs`: `21/21` en verd («Lint net» després d'Onada 5).
- `node --test tests/standalone-build.test.mjs`: `31/31` en verd (build real monolític i trossejat).
- **Onada 5 (`8/8` agents correctors):** `3.997` proves executades i verificades en verd a través dels 8 fronts (`pujadaImatge`, `exifIncrustat`, `PerfilPublicSection`/`organizations`, `fitxaDePerfil`, `herencia`/`IdentitatContext`, `Noticies`/`AppLector`, `xatsPerDefecte`/`XatContext`, `RouteSEO`/`index.html`).
- **Bateria Global Final de Vitest (`npx vitest run src tests`):** **`1.062` fitxers passats (`6` skipped), `18.386` proves en verd (`89` skipped), `0` fallades (`exit code 0`).**
- **Bloc -1 (Identitat Dual `Sóc de Poble` + `Javi Llinares` i Mac Mini):** `159/159` proves en verd en 8 fitxers i `0` ocurrències de `Mestre Poble`/`mestre-obres` a tot l'arbre.
- **Bloc 0 (Lector RSS sobre `UniversalWorkspace` + Port `'workspace'` `1.2.0` + Purga de Mocks + Scroll per carpeta + «Marca-ho tot» amb filtre `F2` + Sanejament Onada 5 `F`):** `289/289` proves en verd en 16 fitxers de `src/apps/lector/`, `622/622` a `src/apps/plataforma/` i `2/2` (100 cicles) a `tests/gauntlet-codex-workspace-port.test.jsx`.
- **Bloc 1 (Plugins `tpv_vinyeta.webp` + Enquadrament/Avatars `400×400` + Capçalera `1200×1200` + Pressupost `<80 KB` Onada 5 `A` + EXIF i Privadesa Onada 5 `B` + Orientació multiformat `X2-orientacio` + Avisos `F1`):** `126/126` proves en verd en `src/sections/plugins/`, `1.890+` proves en verd en enquadrament, perfil, orientació i pujada.
- **Bloc 2 (WordPress Fallback `Carregant el mur...`):** `36/36` proves Node + `30/30` Vitest en verd.
- **Bloc 3 (Perfil Fase 1 + Sincronització `llicenciaPerDefecteNotes` Onada 5 `E`):** `580+` proves en verd.
- **Bloc 3.5 / Onada 1.1 (3 Rutes Canòniques `/javillinares`, `/socdepoble`, `/rentonar` amb Fallback remot Onada 5 `C` + Poble `'La Torre de les Maçanes'` + Migració SQL 403 `2610160250_perfil_update_propi.sql` + `avatarDeLaFitxa` Onada 5 `D` + SEO 1200×630 i `og:url` únic Onada 5 `H` + Un sol «Javi Llinares» al cercador `F4`):** `100%` en verd.
- **Bloc 3.6 / Onada 1.2 (4 Actors Permanents del Xat + Missatge Automàtic de `Javi Llinares` + `IAIA MarIA` a `localhost` + Blindatge d'homònims Onada 5 `G`):** `2.353/2.353` proves Vitest + `20/20` `lint_xat.test.mjs` en verd.
- **Bloc 4 (Bateria Global de Vitest + CI de Codex + Estrés):** `946` proves Node i `18.386` proves Vitest en verd (`0` fallades), estrés opt-in `8/8` (1.000–40.000 fluxos simulats).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Auditoria final tancada (Relleu 12) sota `core-direccio-autonoma` (Direcció Pura de MarIA: no es toca codi de producció des de Gemini 4).
- Queden documentats amb transparència total per al Mestre al despertar (`requires_human_decision: true`):
  1. **Desplegament de `socdepoble.org` a Firebase Hosting (`soc-de-poble`):** el domini públic servix un build antic (11-06-2026); abans de `firebase deploy --only hosting`, cal decidir si s'exclouen `rag-index.json` i `slugIndex.json` del `dist` públic i si s'alleugereix `og-socdepoble-1200x630.png` (530 KB → `<300 KB` per a WhatsApp).
  2. **Aplicació manual de `supabase/migrations/2610160250_perfil_update_propi.sql`:** executar primer les 4 consultes de diagnòstic de la capçalera sobre el Supabase de producció i verificar després el PATCH de `profiles`.
  3. **Release `1.1.4` signada del connector WordPress:** perquè l'esquelet `Carregant el mur...` arribe als llocs amfitrions, i configurar la imatge/descripció a Yoast SEO de `gentdelatorre.net`.
  4. **Comptes remots (`IDS_REMOTS_FUNDACIONALS`) i connector RSS de servidor:** declarar els UUID de producció de Javi, Sóc de Poble i El Rentonar a `src/data/identitatsSeed.js`, i aprovar l'ADR del connector RSS de servidor per als feeds verificats (Emowe, Mitjana, Jon Hernández, Ben Cord, Migue Baena).
  5. **Neteja de làpides i apartat 19 legal (`Bloc 3.7` / `Onada 1.3`):** executar `git rm src/apps/lector/vistes/Carpetes.jsx src/apps/lector/vistes/Fonts.jsx` (bloquejat pel hook local de Claude), revisar la botella «LICOR 43» de `tpv_vinyeta.webp`, i aplicar l'especificació `T-G4-24` a l'apartat 19 de `src/sections/text/legalContent.js` (apareguda al Pla a les `03:04` quan Claude ja tancava la cinquena onada).
- Cap cron ni tasca zombi queda activa al tancament del torn («Cadascuna a sa casa»).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261016_0015_prompt_gauntlet_claude_codex_gemini]]
- [[261016_0015_pla_implementacio_gauntlet_autonom]]
- [[261016_0021_auditoria_codex]]
- [[261016_0022_auditoria_claude]]
- [[261016_0025_acta_marmota]]
- [[261016_0035_acta_marmota_codex_gauntlet]]
