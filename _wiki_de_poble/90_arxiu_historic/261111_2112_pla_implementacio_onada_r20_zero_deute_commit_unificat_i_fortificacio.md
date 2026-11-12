---
type: document
status: esborrany
description: 'Pla d''execució nocturna autònoma multi-hora de les 12 IAs (Onada R20): liquidació del deute tècnic pendent, commit net R18+R19 i poliment 10/10 de totes les funcionalitats existents.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:db881192-2e01-4050-99a6-fe914a5e81c9
---
# Pla d'Implementació — Onada R20 Nocturna · Zero Deute Tècnic, Commit Unificat R18+R19 i Fortificació Funcional 10/10

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_90b4b884-028e-4b28-95f0-7a5f958f0064:db881192-2e01-4050-99a6-fe914a5e81c9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T20:11:08.391Z |
| Modificació | 2026-11-11T20:13:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | aprovada pel Mestre Javi Llinares (2026-11-11 21:05 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA |
| Tokens consumits | ~24.000 (sessió d'orquestració R20) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-11T20:11:08Z (v1.0.0):** Creació canònica i aprovació operativa per a la Marató Nocturna `Onada R20` després del tancament de l'`Onada R19` (`261111_1741_auditoria_claude.md`, `261111_1822_auditoria_codex.md`, `261111_1951_auditoria_gemini_carbon.md`) i de l'activació pel Mestre de `Sign in with Apple`, `Google OAuth iOS + Android` i la migració SQL `2611112005_mur_lectura_publica_foraster.sql` a Supabase de producció.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Radiografia Sincera de l'Estat Actual i Deute Tècnic Real (`Llei 0 · Veritat Nua`)

Després d'inspeccionar l'arbre viu (`HEAD = c07f78b83`, `R17a`), les tres auditories finals d'`R19` i els dos kits CAS externs pendents d'integrar (`261111_kit_codex_r19_copublicacio_gedcom_i_xat` i `261111_kit_carbon_r19_barra_taronja_composta_i_editorial`), aquest és el diagnòstic exacte sense maquillatge:

1. **`[P0-1 · Arbre viu sense commit des d'R17a + 2 Kits CAS R19 pendents d'assimilar]`:**
   - L'arbre viu acumula els canvis d'`R18`, les reparacions de `Claude R19 Bucle 1 i Bucle 2` (`zonaCanaleta -> zonaHerbari`, obertura d'`/app/genealogia`, guarda opcional de `SquareBadge`, CIEF `null` honest en Xylella, regex `CORREU` acotada de `4421ms` a `375ms`, fragment T8 de `PageDetailSection`), més la configuració nativa d'aquesta nit (`ios/App/App/Info.plist` amb `CFBundleURLSchemes` per a Google iOS i `supabase/migrations/2611112005_mur_lectura_publica_foraster.sql`).
   - Fora de l'arbre viu, esperen a `../_investigacio_ia_de_poble/`:
     - **Kit Codex R19 Revisió 2 (`261111_kit_codex_r19_copublicacio_gedcom_i_xat`):** `203` operacions verificades amb **`0` deriva CAS** contra l'arbre actual (`verifica_i_aplica.py --target .` en verd). Aporta el port neutral `copublicacio` + RPC `2611111735_copublicacio_registrada.sql` (AAL2 + `?registre=persona|organitzacio`), `GEDCOM 5.5.1/7.0`, auto-titulació IndexedDB de xats amb la IAIA, Web Locks/transaccions per a 6 apps del Panell, càrrega diferida (`0 B` a l'arrencada) de `laminesBotaniquesNode0.js`, 24 fitxes morfològiques corregides i quarantena reversible de les 67 làmines sintètiques al·lucinades.
     - **Kit Gemini Carbon R19 (`261111_kit_carbon_r19_barra_taronja_composta_i_editorial`):** `37` fitxers i `126/126` proves visuals Chromium CDP. Presenta només **1 línia de deriva CAS** a `src/sections/text/pageContent.r10.js:101` (`<a href="/plugin/genealogia">` afegit per Claude a les `20:14 CET`) més el pegat creuat de 4 fitxers `evidencia/creuada/carbon-ruta-registre-opcional.patch`.
2. **`[P0-2 · 9 Claus en Roig a frontissa-contingut.mjs + Honestedat Documental P1-ALERGENS-02, FITA_R19 i DRETS_QUE_DINEM]`:**
   - `node tooling/gates/frontissa-contingut.mjs` bloqueja ara mateix 9 claus (`anima`, `arbres-monumentals`, `dispositius`, `disseny`, `fedivers`, `fediversity`, `node-zero`, `receptes`, `versions`).
   - Abans d'aprovar els nous hashes de Frontissa cal corregir tres punts de veracitat:
     - **`P1-ALERGENS-02` (`src/sections/text/pageContent.patrimoniR14.js` en `ca, es, en, eu, gl`):** Substituir *"La proposta mai diu que no n'hi haja"* (contradit per les `1.730` files que mostren *"— No en porta segons el text"*) per *"Quan una fila diu «— No en porta segons el text», descriu el text del llibre, no el plat: només una persona pot declarar que un al·lergen no hi és."* en les 5 llengües.
     - **`FITA_R19` (`src/sections/text/pageContent.r10.js` dins del kit de Carbon):** Corregir la frase que parlava de *"noves fotografies... generades"* perquè reflectisca la veritat acordada: quarantena reversible de les 67 imatges sintètiques no verificades, correcció de 24 estudis morfològics i càrrega diferida de `0 B` a l'arrencada.
     - **`DRETS_QUE_DINEM` (`src/sections/text/pageContent.dretsPatrimoni.js` + `pageContent.patrimoniR14.js`):** Alinear la declaració de drets amb el que acredita exactament la font primària verificada.
3. **`[P0-3 · 2 Assercions Antiguades a tests/natiu-build.test.mjs (línies 742-749) + Frontmatter README (271 > 220)]`:**
   - Actualitzar `tests/natiu-build.test.mjs` perquè accepte l'únic import fulla sense efectes laterals `./pageContent.dretsPatrimoni.js` a `pageContent.patrimoniR14.js` (`P0-115`) i el recurs `og_image` vigent `assets/uploads/patrimoni/receptes-ibanez-social-1200x630.jpg` (`P0-117`).
   - Escurçar `description` a `src/data/adaptadors/noticies/README.md` (`271 -> <= 220` caràcters) perquè `npm run porta:frontmatter` passe net.
4. **`[P1-4 · Porta SQL AAL2 Omesa sense SDP_PGLITE_MODULE + Oblit Individual de Títols IAIA + Fallades Heretades en Suite Global]`:**
   - `tests/copublicacio-postgres.test.mjs` fa `skip` si no es defineix `SDP_PGLITE_MODULE`, deixant sense prova executada l'AAL2 i la concurrència SQL entre connexions.
   - Falta l'acció d'**oblit/esborrat individual** d'un títol de conversa amb la IAIA en `IndexedDB` (més enllà de la purga total en tancar sessió).
   - La passada global massiva de Vitest arrossega fallades i timeouts preexistents sota càrrega que cal triar i extirpar per lots.
5. **`[P1-5 · Fricció Real a /notes per Publicar al Mur (Cas Damià Llorens) + Poliment 10/10 d'Entrada 1-Clic, Perfil i les 7 Apps del Panell]`:**
   - El veí Damià Llorens Jordà té 2 notes creades a `/notes` que no apareixen al `/mur` perquè romanen com a esborranys privats (`notes_publicades: 0, notes_totals: 2`): cal fer cristal·lí a `/notes` el commutador `Privat (només per a tu)` vs `Públic · Publicar al Mur del poble`, amb selector de poble i botó semàntic **Blau `Publicar` → Verd `Publicat`** (`iaia-maria-core §12.2`).
   - Revisió exhaustiva de les 7 apps obertes del Panell (`Genealogia`, `Gestoria`, `TPV Bar`, `Rebost/Nevera`, `Salut`, `Lector RSS`, `L'Avisador`): corregir el doble segment `/app/nevera/casa/casa`, assegurar `<h1>` semàntic en totes les vistes `/app/*`, persistència transaccional `IndexedDB` i geometria impecable a `280px / 375px / 768px / 1440px`.
6. **`[P1-6 · 3 Objeccions Òptiques i 6 Jurisdiccions CC-BY-3.0-US Pendents al Patrimoni Botànic]`:**
   - Tancar l'auditoria òptica real de `atles-14-all-v3-llavor`, `cv-04-alberginia-blanca` i `herbari-046-espigol` + les 6 normalitzacions `CC-BY-3.0-US` amb `gemma3:12b` al Node 0 i verificació TASL + SHA-256 estricta.

---

### 2. Bústia de Dubtes i Arbitratge Autònom de la Directora (`Zero Interrupció Nocturna`)

Qualsevol dubte tècnic durant la matinada s'escriu a `../_investigacio_ia_de_poble/261111_2112_mesa_consens_nocturna_r20/TAULER_CONVERSA_I_CONSENS_R20.md`. Criteris ja arbitrats per MarIA:
- **Sostre de `16 MiB` en diff binari (`antigravity-hook` / `pre-commit`):** Si en escenificar la quarantena o optimització d'imatges el diff binari supera `16 MiB`, Claude divideix netament en dos commits atòmics consecutius (`1r codi + dades + tests`, `2n lot binari acotat`), **sense usar mai `--no-verify`**.
- **Migracions SQL noves (`2611111735_copublicacio_registrada.sql`):** Es versionen i verifiquen amb `tractor-rls.mjs` + PGlite local; l'aplicació contra el Supabase remot de producció es deixa preparada i documentada per al Mestre si requereix SQL Editor remot, sense fingir mai que ja corre en remot (`Llei 0`).
- **Prioritat absoluta:** **Zero invenció de funcionalitats noves.** Tot l'esforç va a estabilitat, zero deute tècnic, tests verds i UX 10/10 del que ja tenim.

---

### 3. Repartiment Ortogonal de Carrils (`Zero Col·lisions d'Escriptura`)

| Carril | Agent i Model | Entorn d'Escriptura | Abast Exclusiu en `Onada R20` |
| --- | --- | --- | --- |
| **Carril 1** | **Claude (`Opus 5.5 Extra · Ultracode`)** | Arbre viu `socdepoble.org/` (únic amb permís Git i `src/` viu) | **Bucle 1:** Reparar `P1-ALERGENS-02`, `DRETS_QUE_DINEM`, `natiu-build.test.mjs`, `noticies/README.md`; assimilar reconciliats `Kit Codex R19` + `Kit Carbon R19` (corregint `FITA_R19` honesta i deriva d'1 línia a `pageContent.r10.js` + `carbon-ruta-registre-opcional.patch`); aprovar les 9 claus de Frontissa i **segellar `COMMIT R18 + R19` net a `HEAD`**. **Bucle 2+ (fins a esgotar tokens):** Reparar `/app/nevera/casa` + `<h1>` d'`/app/*`, atacar per lots les proves roges de la suite global Vitest, i assimilar els kits `R20` de Codex i Carbon en un segon `COMMIT R20` + `npx cap sync ios && npx cap sync android`. |
| **Carril 2** | **Codex (`GPT-6.1 Sol / Astra Ultra`)** | Clon efímer `/tmp/sdp_codex_r20` + Kit CAS a `../_investigacio_ia_de_poble/261111_kit_codex_r20_sql_aal2_panell_i_suite_verda/` | **Bucle 1:** Eliminar el `skip` silenciós de `tests/copublicacio-postgres.test.mjs` connectant motor PostgreSQL/PGlite real verificable i provant concurrència multi-connexió + AAL2 + anti-autoaprovació. **Bucle 2:** Implementar l'oblit individual de títols auto-titulats del xat IAIA (`IndexedDB`) + auditoria transaccional i d'importació/exportació de les 7 apps obertes del Panell (`Genealogia`, `Gestoria`, `Bar`, `Nevera`, `Salut`, `Lector`, `Avisador`). **Bucle 3+ (fins a esgotar tokens):** Caçar i reparar timeouts i fallades heretades de la suite global Vitest en lots atòmics dins del seu Kit CAS. |
| **Carril 3** | **Gemini 4 Carbon High** | Clon efímer `/tmp/sdp_carbon_r20` + Kit CAS a `../_investigacio_ia_de_poble/261111_kit_carbon_r20_notes_mur_ux_panell_i_optica/` | **Bucle 1:** UX Pedra Seca 10/10 a `/notes` per publicar al `/mur` sense confusió (commutador clar `Privat` vs `Públic · Mur del poble`, selector de poble i botó semàntic Blau `Publicar` → Verd `Publicat` en 5 idiomes, cas Damià). **Bucle 2:** Auditoria i poliment Chromium CDP (`280/375/768/1440 px × clar/fosc`) d'Entrada 1-Clic (`Apple` + `Google`), Mur públic `Foraster`, Perfil multi-poble i les 7 apps del Panell. **Bucle 3:** Tancar les 3 objeccions òptiques Wikimedia Commons (`all`, `albergínia blanca`, `espígol`) + 6 llicències `CC-BY-3.0-US` amb `gemma3:12b` i sincronitzar `/versions` (`FITA_R20`), `/page/node-zero`, `/page/fediversity` i `/disseny`. |
| **Carril 4** | **Node 0 (`Mac mini M4 · 8 Escoles Locals`)** | `http://192.168.0.23:11434` amb lock `/tmp/sdp_node0_gauntlet.lock` + Auditoria Escriptori `261111_2132_auditoria_node0_assemblea_8_escoles_r20.md` | Orquestrador autònom nocturn (`orquestrador_nocturn_8_escoles_node0_r20.py`) amb 6 missions Gauntlet (`Tesi → Contraauditoria → Veredicte Pre-Mastegat`): audita en viu totes les auditories i kits d'Escriptori (`M1`), fiscalitat IVA/IRPF/Verifactu de Gestoria i TPV Bar (`M2`), seguretat PII/XSS de les 7 apps del Panell (`M3`), flux universal `/notes` -> `/mur` i 8 àmbits `IDEA-61` (`M4`), Frontissa Sollutia + Open Data/Fediversity (`M5`), i purga lingüística 5 idiomes + herbari + `useCapaEnrere` (`M6`). |

---

### 4. Cua d'Autodespatx Continu Pre-Mastegada pel Node 0 (`Bucle 4+` mentre queden Tokens)

Quan qualsevol de les 3 cadires de frontera (`Claude`, `Codex`, `Gemini Carbon`) complete els seus bucles inicials i encara dispose de finestra/tokens, **NO s'atura**: llig obligatòriament `_wiki_de_poble/04_escriptori/261111_2132_auditoria_node0_assemblea_8_escoles_r20.md` i `../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_R20.md` i ataca per ordre estricte de carril:
1. **Claude (`Carril 1`):** Resol les objeccions d'`M1` sobre el `COMMIT R18 + R19`, integra els pegats verificats d'`M3`/`M4` (`RutaApps`, `useCapaEnrere` `P0-24b`) i neteja el deute pendent de `fronteres-skills.mjs` (`P1-30`).
2. **Codex (`Carril 2`):** Converteix les troballes matemàtiques i fiscals d'`M2` (`Gestoria` IVA/IRPF/cadena SHA-256 i `TPV Bar`) i els vectors XSS/PII d'`M3` (`src/apps/lector/nucli/html.js`, `Salut`, `Genealogia`) en tests de regressió Vitest + pegats dins del seu Kit CAS.
3. **Gemini Carbon (`Carril 3`):** Aplica les millores UX/semàntiques d'`M4` sobre els 8 àmbits rurals de publicació (`IDEA-61` / `destinsControl.js`) i la purga lingüística/botànica d'`M6` en les 5 llengües (`P1-22`, corregint les al·lucinacions morfològiques pendents d'herbari).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Portes Constitucionals Obligatòries abans de cada Commit al Carril 1:**
   - `node tooling/gates/porta-olivera.mjs` (`EXIT 0`)
   - `npm run porta:frontmatter` (`0` errors, `0` avisos)
   - `node tooling/gates/tractor-cens.mjs` (`EXIT 0`)
   - `node tooling/gates/tractor-rls.mjs` (`EXIT 0`)
   - `node tooling/brain/tractor-pedra-seca.mjs` (`PASSA`)
   - `node tooling/gates/frontissa-contingut.mjs` (`EXIT 0` amb les 9 claus corregides i aprovades)
   - `npx eslint . --max-warnings=0` (`0` errors, `0` avisos)
   - `npm run build:web` (`<= 250.000 B` gzip-9), `npm run build:wp` i `npm run build:natiu` (`EXIT 0`)
2. **Proves Funcionals i de Regressió:**
   - `tests/natiu-build.test.mjs`, `tests/botigues.produccio.test.js`, `tests/copublicacio-postgres.test.mjs` (executat realment sense `skip`), suites de `Mur`, `Notes`, `Perfil`, `BarraTaronja`, `GEDCOM`, `Xat IAIA` i les 7 apps del Panell en verd.
   - Verificació Chromium CDP a `280px`, `375px`, `768px` i `1440px` en mode clar i fosc (`0` errors de consola, `0` desbordaments horitzontals).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Esgotament sobtat de quota en Claude Ultracode o Codex a mitjan matinada:** Mitigat estructurant el treball en **bucles atòmics tancats**. El **Bucle 1** de Claude consolida immediatament el `COMMIT R18 + R19` a `HEAD`, de manera que encara que els tokens s'esgoten al Bucle 2 o 3, tota la feina d'`R18 + R19` ja queda segellada a Git i cada millora posterior de Codex/Carbon queda empaquetada en kits CAS idempotents.
- **Deriva CAS entre kits paral·lels:** Mitigada prohibint a Codex i Carbon tocar `socdepoble.org/` i assignant fitxers ortogonals (Codex en motor SQL/IndexedDB/tests de dades; Carbon en UX `/notes`, CSS/geometria i metadades òptiques/editorials).
- **Bloqueig d'execució autònoma per hooks (`force_ask`):** Mitigat prohibint mesclar `SECURITY_PATHS` (`tooling/`, `.agents/`, `scripts/`) amb `rm`, `mv` o `node -e` i fixant `RequestFeedback: false` en qualsevol artefacte.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../90_arxiu_historic/261111_1741_auditoria_claude|261111_1741_auditoria_claude]]
- [[../90_arxiu_historic/261111_1822_auditoria_codex|261111_1822_auditoria_codex]]
- [[../90_arxiu_historic/261111_1951_auditoria_gemini_carbon|261111_1951_auditoria_gemini_carbon]]
- [[261111_2132_auditoria_node0_assemblea_8_escoles_r20]]
