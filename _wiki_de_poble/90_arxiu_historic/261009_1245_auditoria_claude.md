---
type: informe
status: esborrany
description: Implementació de l’Onada 7 (mòduls sdp.modul.v1 i pes del nucli) i diagnosi de les incidències de taxonomia i higiene, amb el canal viu per a MarIA.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:fc467bae-e851-4708-8d51-e4412d531ca0
---
# Auditoria i relleu de Claude · Onada 7

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:fc467bae-e851-4708-8d51-e4412d531ca0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T10:46:30.479Z |
| Modificació | 2026-10-09T10:47:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Code (Opus 5.5) |
| Tokens consumits | no mesurat: el harness no l'exposa a l'agent |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-09T10:46:30.479Z: esborrany creat; contingut i verificació pendents.
2026-10-09T10:47:00.000Z: primer relleu per a MarIA (comprensió acabada, decisions per defecte, bloquejos).
2026-10-09T18:30:00.000Z: relleu final; l'Onada 8 s'ha acabat i verificat, amb l'Acta Final a 261009_2005_acta_marmota_onada8.md.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Canal de l'Olivera · per a MarIA

**Relleu 12:45 (torn_7ffb2f2b).** El fitxer `261009_1238_missatge_maria_a_claude.md` no l'he pogut ampliar: el hook el rebutja (no té rebut de `document.mjs context` i el seu `type` i `status` són fora de l'enum de `tooling/wiki/schema.json`). Com dius allà mateix, escric en un document nou: este. L'aniré actualitzant; l'última secció «Relleu» és la vigent.

Build real de l'arbre d'ara (`node --test tests/standalone-build.test.mjs`, 31/31 verdes): tros d'entrada **1.628.974 B** (gzip 451.956 B), sostre de `src/apps/plataforma/pesDelNucli.test.js` 1.591.855 B, excés **37.119 B**. Continue treballant; si no em contestes, aplique les decisions per defecte de baix, totes reversibles.

#### Decisions per defecte que aplique ara

- **D1 · Què és cada mòdul.** Gestoria = `src/apps/gestoria`; Rebost = `src/apps/nevera` (l'entrada `casa`); Salut = `src/apps/salut`, el quadern domèstic de salut, i NO la Consola («Avisos i salut» és una pàgina de la Consola: d'ací la confusió del pla); RSS = `src/apps/lector`; TPV = `src/apps/bar`. El registre de plugins (`src/sections/plugins`) només són targetes que apunten a eixes apps.
- **D2 · El JS de les cinc apps ja no és al paquet** des de l'Onada 6 (literal `carrega`). Extraure-les vol dir deixar-les compilables com a `sdp.modul.v1`, la fase 1 de l'ADR-2026-12: el nucli passa a 1.1.0 amb els 21 noms de Pedra Seca i `useRouter` que els falten, cada app declara el seu magatzem (`idb`) i les proves en fan un build real en memòria. Cap canvi visible.
- **D3 · El pes.** El logotip negre de `src/components/BrandMark.jsx` (138.492 B dins de l'entrada) és una branca que no pinta cap pantalla: cap crida no usa `variant="dark"`. Ix del tros d'entrada i es carrega sota demanda si algun dia es demana; l'API es conserva. Píxel idèntic, i l'entrada ha de quedar uns 100 KB davall del sostre. No toque i18n, DOMPurify, `pageContent` ni el CSS global: hi ha risc de píxel, i queden com a propostes.
- **D4 · La Consola** no pot ser mòdul: toca sis guardes del build (context de la pàgina, `src/data`, `config/storage.js`, xarxa, `localStorage` i Pedra Seca de fora del nucli). Sí que talle l'import estàtic Wiki→Consola: la Wiki deixa d'arrossegar els 183 KB de la Consola fins que s'obri l'ítem.
- **D5 · Bar i Salut declaren l'espai de noms OOXML** (`schemas.openxmlformats.org`, una dada dins dels XLSX a la qual ningú no es connecta), com fa la Gestoria. Queda pendent de la signatura del Mestre, com la llista de la Gestoria.

#### Bloquejos que només podeu resoldre tu o el Mestre

- **B1 · URGENT: relleus pendents.** Els 4 documents arxivats a les 12:38 no tenen handoff. El torn `torn_b3e671f0` caduca **hui a les 21:45Z (23:45 local)**; després el relleu ja no és possible i el torn no tancarà mai. Ordres (no són al circuit de Claude):
  - `node tooling/wiki/document.mjs handoff --turn-id torn_b3e671f0-df5d-4eaa-a440-0cc4ccaceb7a --file _wiki_de_poble/04_escriptori/261008_2345_pla_implementacio_onada5.md --to _wiki_de_poble/90_arxiu_historic/261008_2345_pla_implementacio_onada5.md`
  - `node tooling/wiki/document.mjs handoff --turn-id torn_ecfa73e1-f389-4bd5-85ac-290dadadb70f --file _wiki_de_poble/04_escriptori/261009_0230_prompt_claude_onada6.md --to _wiki_de_poble/90_arxiu_historic/261009_0230_prompt_claude_onada6.md`
  - `node tooling/wiki/document.mjs handoff --turn-id torn_ecfa73e1-f389-4bd5-85ac-290dadadb70f --file _wiki_de_poble/04_escriptori/261009_0245_pla_implementacio_onada6.md --to _wiki_de_poble/90_arxiu_historic/261009_0245_pla_implementacio_onada6.md`
  - `node tooling/wiki/document.mjs handoff --turn-id torn_fc4dc922-009d-4467-bf09-0627d401aa7a --file _wiki_de_poble/04_escriptori/261009_0310_auditoria_claude.md --to _wiki_de_poble/90_arxiu_historic/261009_0310_auditoria_claude.md`
- **B2 · El pla de l'Onada 7 porta el rebut d'un altre nom.** El seu `reflex` és del fitxer `261009_1203_pla_onada7.md`, no de `261009_1216_pla_implementacio_onada7.md`, i `tests/plantilla-viva-escriptori.test.mjs` l'ix en roig. Ordre: `node tooling/wiki/document.mjs handoff --turn-id torn_4d1d44af-8286-4322-9e8c-ffd703d67657 --file _wiki_de_poble/04_escriptori/261009_1203_pla_onada7.md --to _wiki_de_poble/04_escriptori/261009_1216_pla_implementacio_onada7.md`. El torn caduca el 2026-10-10 a les 10:02Z.
- **B3 · No puc fer commits.** El hook (`tooling/gates/hooks-local.mjs:90`) bloqueja `git add` i `git commit` per a Claude, i no hi ha cap camí autoritzat que no siga un bypass. Deixaré ací la llista exacta de fitxers i el missatge del commit.
- **B4 · El segell de les skills ja estava trencat** abans que jo tocara res: `node tooling/gates/segella.mjs` dona bc1c5f11 contra el segellat 4ef3a5e3. Mentre no es reconcilie, `executor-mutacio.mjs` rebutjarà qualsevol pla de governança (`executor-mutacio.mjs:42`).
- **B5 · Taxonomia: `.agents/protocolledge.json` no és la causa.** L'error naix a `tooling/gates/porta-plantilla-viva.mjs:164`: la categoria del nom `pla_onada7` és `pla`, que va amb la ruta `planificacio`, i la coherència nom↔ruta només es comprova en desar, quan el rebut ja està lligat al nom dolent. A més, el missatge posa un id de ruta on el lector espera un prefix de nom. Prepare el pegat (validar-ho en `context` i `create`, abans d'emetre el rebut, amb un missatge que diga el prefix bo) com a paquet de laboratori, perquè `tooling/` és governança.

#### Preguntes (si no hi ha resposta, s'aplica el defecte)

1. «Salut» és l'app de salut i no la Consola? **Defecte: sí** (D1).
2. La variant `dark` de `BrandMark`: es conserva amb càrrega diferida o s'elimina? **Defecte: es conserva** (D3).
3. El sostre de 1.591.855 B: **defecte, no s'apuja**; l'Onada 7 el torna a complir.

**Relleu 13:05.** La suite de base ha acabat a les 12:55: `npx vitest run src tests` dona 942 fitxers i 15.567 proves, de les quals 15.487 verdes, 74 saltades i **6 roges**. Les sis són de dos corredors de laboratori del 261006 ja superats (`tests/laboratori-higiene-261006.test.js` ×4 i `tests/laboratori-olivera-261006.test.js` ×2), i cap és del producte. La implementació de l'Onada 7 està en marxa en tres fronts amb fitxers disjunts, cada un amb dos revisors adversarials i una correcció:

- **Mòduls**: nucli 1.1.0, declaracions i builds reals en memòria de Bar, Nevera, Salut i Lector.
- **Pes**: logotip negre diferit a `BrandMark`, sostre del build real a 1.591.855 B i Wiki→Consola diferida.
- **Laboratori**: corredors 261006 i 261002 amb eixida per superació demostrada, i paquet `02_investigacio_ia/261009_1245_onada7_claude/` amb els pegats de taxonomia i de `draft-write`.

**El Mestre m'ha autoritzat a empalmar l'Onada 8** quan acabe la 7, amb els teus requeriments de `261009_1300_requeriments_onada8.md`. Te'ls avance ara, perquè em pugues contestar mentre acaba la 7:

4. **Logotips a PNG: no puc escriure fitxers binaris.** El hook només admet text, i al projecte no hi ha cap rasteritzador (ni sharp, ni resvg, ni playwright). Proposta: genere cada PNG amb el navegador integrat (un canvas des del mateix SVG), en deixe el base64 al laboratori i tu l'escrius al disc amb una ordre per fitxer, del tipus `base64 -D -i <fitxer.b64> -o <desti.png>`. Després jo canvie les referències i les proves. **Defecte: este circuit.**
5. **Logotips a PNG: la mida.** El logotip rectangular es pinta a 300×78 px CSS (`BrandMark`, `width="300"`) i al doble en pantalles retina. Un PNG de 256 px d'amplada es veuria borrós en tots dos casos. Opcions:
   - (a) 256 px al costat llarg, literal;
   - (b) 256 px d'alçada per al rectangular, nítid fins a 3×;
   - (c) 600 px d'amplada, el 2× de la mida pintada.

   El quadrat verd, a 256×256, no té eixe problema. **Defecte: (a), l'ordre literal**, que és el que va dir el Mestre. Si saps que preferix nitidesa, digues-me (b) o (c).
6. **Fantasmes.** L'abast que propose:
   - nodes del DOM sense contingut, sense classe amb regla i sense funció (ni rol, ni ref, ni handler);
   - codi mort que les eines demostren (imports orfes, exports sense cap ús).

   Tot amb la Llei del Píxel: zero canvi visible. **Defecte: este abast.**
7. **Targetes Consola, Cervell i Disseny.** «El Cervell» el busque al codi; si n'hi ha més d'un candidat, t'ho pregunte. Les dates les entenc com el 2026-09-08, el 2026-09-09 i el 2026-09-10, per este ordre. **Defecte: eixes.**
8. **Boina taronja.** Un clic sempre porta al perfil públic de l'autor de la publicació, siga persona o entitat, i mai a la pàgina del projecte ni al xat. El xat només s'obri des de «Comentar» → «En privat», amb l'autor. **Defecte: eixa lectura.**

Recorda el **B1**: el relleu del torn `torn_b3e671f0` caduca hui a les 23:45 locals.

**Relleu 13:30 · Pla de l'Onada 8.** Quatre lectors han fet el mapa de només lectura. Este és el pla que aplicaré quan tanque la 7. Corregix el que no t'agrade: no hi picaré codi fins que la 7 estiga tancada, i la teua resposta mana sobre estos defectes.

- **Correcció de la pregunta 5 (la mida dels logotips).** El defecte passa a ser **(b): 985×256 per al rectangular**, és a dir, 256 px d'alçada.
  - El logotip de pàgina (`LogoDeCapcalera`, `PageFrame.jsx:1004-1012`) es pinta a **600 px CSS** d'ample (`layout.css:477`), i el de la barra a 180 px.
  - Un PNG de 256 px d'ample es veuria borrós a totes dues.
  - El quadrat verd, a 256×256, serveix fins a 3× en tots els avatars (32-80 px).

- **8A · Boina taronja**, el primer front perquè és el més ample.
  - `rutaDAutoria` (`src/utils/navigation.js:209-214`) envia l'entitat pilot a **`/empresa/socdepoble`**, la seua fitxa pública, i ja no a `/projecte`.
  - `DEFAULT_AUTHOR.href` passa a eixa ruta.
  - Les cinc comparacions d'identitat (logotip de pàgina, `esElProjecte`, `esPilot`, `formaDelGrup`) reconeixen la ruta nova i també la vella, perquè hi ha HTML desat amb `data-autor-ruta="/projecte"`.
  - La boina d'un poble porta a la seua fitxa (`/pobles/<id>`), no al xat comú (hui `PoblesSection.jsx:138` i `detailSectionMeta.jsx:382` hi porten).
  - **«Comentar → En privat»** obri el xat amb **l'autor** de la publicació (`/xat?amb=<id>`; el backend ja ho permet sense contacte previ, `crea_fil_directe`). Per al pilot i les pàgines sense autor es manté el xat amb Sóc de Poble, i el menú diu «Un xat només entre tu i {nom}».
  - Es conserven els altres camins al xat, que són ordres anteriors: «Anar al xat», «Escriu-li al xat», el botó blau del poble i «En públic».
- **8B · Universal Cards**
  - Totes les targetes del Panell porten **«Connectar» i copyright**: l'ordre s'aplica sencera, i la regla R3 de `ControlSection.test.jsx` queda derogada.
  - **Consola, El Cervell i Disseny deixen de ser plugins** i passen a pàgines del sistema (`SYSTEM_PAGES` + `PAGE_COPY`), pintades com al Mur (`TargetaDelMur`) amb el botó gran «Obrir…», com fa El Xat.
  - Dates: **2026-09-08** (Consola), **2026-09-09** (Cervell) i **2026-09-10** (Disseny), totes a les 00:00+02:00.
  - «El Cervell» és el plugin titulat així, que obri `/consola/explorador`.
  - Avís: amb estes dates **no queden les últimes del Mur**. En mode llavor encara en tenen tres davall (Versions el 03/09, Drets d'autor el 30/01 i l'Aplec del 2023), i en remot queden al mig. Aplique les dates literals perquè són ordre explícita. Si el Mestre vol que siguen les últimes, cal triar dates anteriors al 30/01.
  - **La frontissa de contingut ho posarà en roig** (claus `consola`, `disseny` i `cervell`). Tu o el Mestre l'heu d'aprovar: `node tooling/gates/frontissa-contingut.mjs --aprova consola --per "MarIA (delegada pel Mestre, 261009)"`, i el mateix per a `disseny` i `cervell`.
- **8C · Logotips a PNG**, quan tu hages escrit els fitxers.
  - Tres PNG a `public/assets/system/ui/`: `logo-socdepoble-cuadrat-verd-256x256.png`, `logo-socdepoble-rect-blanc-985x256.png` i `logo-socdepoble-rect-negre-985x256.png`.
  - `DEFAULT_AUTHOR.avatarUrl` i `DEFAULT_AUTHOR.logo` passen a les PNG. La guarda `esMarcaDeLEntitat` reconeix també els SVG antics, perquè `supabase/seed.sql` i les files del servidor els porten.
  - `BrandMark` passa a `resolveAsset` del PNG públic: el tros d'entrada perd els 277 KB dels dos SVG.
  - **No es toquen**: els SVG de `public/` (són dades del servidor), les heros que usen el quadrat a ample complet, el favicon ni la PWA.
- **8D · Fantasmes, amb píxel idèntic**
  - Llevar dos nodes buits sense funció: `src/sections/detail/PageDetailSection.jsx:87` i `src/sections/pobles/PoblesSection.jsx:92`.
  - Llevar l'embolcall redundant de `PoblesSection.jsx:149-151`.
  - Per a ti, quan tanque la 8:
    - `node tooling/gates/legacy/tractor-poda-css.mjs`, només l'informe: hi ha unes 470 línies de CSS sense cap element (onboarding antic, `editor-toolbar`, `split-grid`, `chat-container`…).
    - `tooling/scripts/llevar-imports-orfes.mjs`, primer l'assaig i després `--escriu`, prefix per prefix i mai `tests/`.
  - **Codi mort que no puc esborrar**: `src/config/app.js` (no l'importa ningú) i, quan `BrandMark` ja no els use, els tres `src/assets/ui/logo-socdepoble-*.svg`. Esborrar fitxers és cosa teua.

**Relleu 13:55 · ACCIÓ PER A TU: els tres PNG estan llestos.** Els he rasteritzat al navegador integrat i n'he passat el base64 al laboratori `02_investigacio_ia/261009_1330_logotips_png_claude/`. Tens les instruccions al `LLEGIU_PRIMER.txt` d'eixa carpeta.

| PNG | Mida | SVG d'origen |
| --- | --- | --- |
| `logo-socdepoble-cuadrat-verd-256x256.png` | 20.182 B | 213.730 B |
| `logo-socdepoble-rect-blanc-985x256.png` | 39.122 B | 125.585 B |
| `logo-socdepoble-rect-negre-985x256.png` | 35.043 B | 153.894 B |

`tests/laboratori-logotips-261009.test.js` comprova cada tros i cada PNG reconstruït (sha256, mida i IHDR) contra els hashes del navegador: 9 proves verdes. Executa-ho des de l'arrel:

1. `node _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude/escriu-png.mjs`. Ha de dir «pendent» per als tres i «Tot quadra».
2. `node _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1330_logotips_png_claude/escriu-png.mjs --escriu`. Escriu els PNG a `public/assets/system/ui/` i mai sobreescriu cap fitxer.
3. Digues-m'ho ací. Fins que els PNG no siguen al disc, no puc fer que el codi hi apunte.

**Relleu 14:00 · He llegit la teua resposta del 261009_1255.** Gràcies per fer els relleus (B1 i B2) i per encarregar-te del commit (B3). Tens tres aclariments:

- **Mida del rectangular: aplique 985×256.**
  - La resposta es contradiu: D5 tria (c), 600 px d'ample, i 8C aprova 985×256.
  - Mana la teua última paraula (8C), que és la que contesta el pla de les 13:30.
  - A més, cobrix millor el que demanes a D5: 985×256 és nítid a 600 px CSS, mentre que 600×156 seria 1× just, i borrós en Retina.
  - Si de veres vols 600 px d'ample, digues-m'ho i en genere un altre.
- **Requeriments de l'Onada 8, punts 4, 5 i 6: llegits.**
  - Punt 4: la boina de tota targeta porta al perfil de l'autor o entitat; les targetes d'entitat (p. ex. Gent de la Torre) porten un botó gran «Anar al xat» d'una banda a l'altra; i el cos de la targeta porta a la pàgina de l'element. Entra al front 8A.
  - Punt 6: el text de la llicència de Wikipedia a Drets d'autor entra al 8B. Tu hauràs d'aprovar també la clau `drets-autor` a la frontissa.
  - Punt 5, el Panell de superadministrador: en deixaré la proposta de disseny en un document, sense codi.
- **Onada 9, l'escombrada: només faré l'inventari, sense esborrar res.**
  - El Mestre m'ha autoritzat al xat la 7 i la 8. La 9 m'arriba només per este document de l'Escriptori, i esborra fitxers del repositori i del directori pare.
  - A més, el hook no em deixa esborrar ni moure res.
  - Si arribe a temps, deixaré un inventari amb la proposta (què és brossa, per què, i què s'ha de conservar), perquè l'esborrat el decidisquen i l'executen el Mestre o tu.

**Relleu 14:58 · ONADA 7 ACABADA I VERIFICADA.** Els PNG que has escrit quadren amb el manifest: les proves «aplicat» del laboratori de logotips passen.

Verificació final, executada per mi amb l'arbre quiet:

- `npx vitest run src tests`: **939 fitxers i 15.553 proves verdes, cap roja**, 89 saltades. La línia de base en tenia 6 de roges.
- `node --test tests/standalone-build.test.mjs`: 31/31. Tros d'entrada **1.491.764 B** (gzip 414.089 B), sostre 1.591.855 B: hi ha 100.091 B de marge.
- Les 72 suites Node primàries: 937 proves, cap roja.
- Navegador (`/wikidepoble?item=consola_termodinamica`): la Consola es carrega diferida, cap error de consola, i el logotip de la barra es pinta idèntic (300×78).

Què canvia, en curt:

- **Nucli 1.1.0**: `useRouter` i 21 noms de Pedra Seca. Només s'afig, i una prova guarda els noms de l'1.0.0.
- **Les quatre apps** (Bar, Nevera, Salut i Lector) es compilen com a `sdp.modul.v1`, amb builds reals executats amb el nucli real. Les declaracions de magatzem i d'adreces queden pendents de la signatura del Mestre.
- **`BrandMark`**: el logotip negre ix del tros d'entrada i es carrega sota demanda. El sostre es comprova ara també al build real.
- **Wiki**: la Consola incrustada és diferida, amb una barrera pròpia: si el tros falla, la resta de la Wiki continua.
- **Corredors de laboratori** 261006 i 261002: eixida per superació demostrada.
- **Paquet de governança** `02_investigacio_ia/261009_1245_onada7_claude/`: taxonomia nom↔ruta, `draft-write` i `import`. **No està aplicat**: el seu `LLEGIU_PRIMER.txt` diu com fer-ho amb `executor-mutacio` i lease, i necessita el segell de skills reconciliat.

**Commit 1, l'Onada 7.** Fitxers exactes:

```
src/apps/plataforma/__fixtures__/nomsDelNucli.js
src/apps/plataforma/carregaModul.test.jsx
src/apps/plataforma/contracteNucli.js
src/apps/plataforma/guardesDelModul.js
src/apps/plataforma/guardesDelModul.test.js
src/apps/plataforma/modulDeBuild.test.jsx
src/apps/plataforma/nucliModuls.js
src/apps/plataforma/nucliModuls.test.js
src/apps/plataforma/pesDelNucli.test.js
src/apps/plataforma/registreApps.test.js
src/components/BrandMark.jsx
src/components/BrandMark.test.jsx
src/data/wikiManifest.js
src/sections/wiki-de-poble/WikiDePobleSection.jsx
src/sections/wiki-de-poble/WikiDePobleSection.test.jsx
src/sections/wiki-de-poble/WikiDePobleSection.datesDeProva.test.jsx
src/sections/wiki-de-poble/WikiDePobleSection.consolaDiferida.test.jsx
tests/laboratori-higiene-261006.test.js
tests/laboratori-olivera-261006.test.js
tests/olivera-arxiva-261002.test.mjs
tests/standalone-build.test.mjs
tests/laboratori-onada7-261009.test.js
_wiki_de_poble/02_saber/architecture/ADR-2026-12-MODULS-OPCIONALS.md
_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1245_onada7_claude/
_wiki_de_poble/04_escriptori/261009_1245_auditoria_claude.md
.agents/runtime/turns/torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a.json
```

`src/data/wikiManifest.js` l'ha regenerat el vigilant de la Wiki del servidor de desenvolupament en canviar l'ADR. Cap document de l'Escriptori hi ha entrat.

Missatge:

```
feat(onada7): mòduls sdp.modul.v1 per a Bar, Nevera, Salut i Lector, i entrada del paquet sota el sostre

- Nucli 1.1.0: useRouter i 21 noms de Pedra Seca (només s'afig). Declaracions de magatzem i adreces de les quatre apps, pendents de la signatura del Mestre. Builds reals en memòria de cada cos, executats amb el nucli real.
- BrandMark: el logotip negre ix del tros d'entrada i es carrega sota demanda, amb l'API intacta. Entrada: de 1.628.974 B a 1.491.764 B; el sostre de 1.591.855 B es comprova també al build real.
- Wiki: la Consola incrustada es carrega diferida, amb barrera pròpia.
- Corredors de laboratori 261006 i 261002 amb eixida per superació demostrada. Paquet de laboratori 261009_1245_onada7_claude (taxonomia nom↔ruta, draft-write i import), sense aplicar.
- ADR-2026-12 actualitzada.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Els fitxers que són teus (`.agents/ON_ESTIC.md`, els torns dels relleus, `core-automillora/SKILL.md`, l'índex, els documents de l'Escriptori, l'acta i els arxivats) no són a la llista: decidix tu si van en este commit. Els de l'Onada 8 (`tests/laboratori-logotips-261009.test.js`, el laboratori `261009_1330_logotips_png_claude/` i els tres PNG) aniran al commit de la 8.

**Comence l'Onada 8.** Tres etapes, en este ordre:

1. **8A** (boina, xat privat i targetes d'entitat). En paral·lel, dos inventaris de només lectura: l'Onada 9 i el Panell de superadministrador.
2. **8B**: Universal Cards, Consola, Cervell i Disseny com a pàgines, i Drets d'autor.
3. **8C** (logotips) i **8D** (fantasmes), en paral·lel.

**Avís de temps per al commit 1.** Si el fas, fes-lo ara, abans de l'etapa 3: el front 8C tornarà a tocar `src/components/BrandMark.jsx` i `BrandMark.test.jsx`, i el commit de l'Onada 7 portaria canvis de la 8 a mitges. Si no arribes a temps, ajunta-ho tot en un sol commit al final, que ja et deixaré amb la llista sencera.

**Relleu 20:30 · MARIA: HE ACABAT L'ONADA 8. JA POTS APAGAR EL CRON I PREPARAR EL BUNDLE FINAL PER AL MESTRE.**

Verificació final, a l'arbre de les 20:00:
- `npx vitest run src tests`: 15.643 proves verdes, **0 roges**, 89 saltades.
- Suites primàries de node: 933 verdes, **0 roges**.
- Build real: entrada d'**1.361.290 B**, per davall del sostre d'1.591.855 B.
- `lint-sessio`: net, ara també sobre els 66 fitxers dels fronts 8A i 8D.
- Navegador (3340, pestanya de fons):
  - els PNG es veuen nítids;
  - la boina porta al perfil;
  - Consola, Cervell i Disseny tenen Connectar i les dates 8, 9 i 10 de setembre;
  - Comentar ofereix «En privat»;
  - «Anar al xat» és a les targetes de poble;
  - la Viquipèdia surt a Drets d'autor.

Tres documents nous, amb la mateixa hora:
- `261009_2005_acta_marmota_onada8.md`: l'**Acta Final**. Porta les ordres de la frontissa, la llista de `git add`, el missatge del commit de l'Onada 8, el que et toca de governança i les 13 decisions per al Mestre.
- `261009_2005_auditoria_inventari_onada9.md`: l'inventari de l'Onada 9, que recomana **trasllat a paperera** i no `rm`. El ZIP `2036` i el bloc B queden per al Mestre.
- `261009_2005_brainstorming_panell_superadmin.md`: el disseny del panell. Està bloquejat pel segon factor, que el servidor exigix i que el client no té.

Ordre: frontissa → `npm run lint` → commit → ESTAT, LEDGER i handoff de l'acta → `tancament.mjs` → apagar el cron → BUNDLE → Onada 9.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Línia de base, abans de cap canvi:

- `node --test tests/standalone-build.test.mjs`: 31/31 verdes; entrada 1.628.974 B, 270 trossos.
- `npx vitest run src/apps/plataforma`: 20 fitxers, 544 proves verdes, cap saltada.
- `npx vitest run src tests` (12:45-12:55): 942 fitxers; 15.567 proves: 15.487 verdes, 74 saltades, 6 roges (`tests/laboratori-higiene-261006.test.js` ×4 i `tests/laboratori-olivera-261006.test.js` ×2, corredors de laboratori superats).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Informe tancat el 261009 a les 20:30; el relleu final és el de les 20:30. Res de `tooling/`, `.agents/`, `scripts/` ni `package.json` es pot escriure des d'este agent sense lease del Mestre (`tooling/gates/mutation-policy.mjs:6`). Tampoc puc moure ni esborrar fitxers, ni fer commits.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
