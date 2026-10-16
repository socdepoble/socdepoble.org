---
type: informe
status: esborrany
description: 'Auditoria del codi, contractes i proves de la Fase 1 del Gauntlet: dignitat de persona, targeta redundant i emoticones.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_9674401f-d730-449d-97ae-1c09b98d9dbf:518e37b1-3ac0-45d1-8820-4321d6bb34b7
---
# Auditoria adversarial Codex — Fase 1: identitat i perfil

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9674401f-d730-449d-97ae-1c09b98d9dbf:518e37b1-3ac0-45d1-8820-4321d6bb34b7 |
| Versió del document | 1.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:27:06.046Z |
| Modificació | 2026-10-15T17:51:45.532611+00:00 |
| Propietari | codex |
| Aprovació humana | Auditoria autoritzada pel mandat directe del Mestre; decisions tècniques delegades en MarIA |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (model exacte no exposat en este torn) |
| Tokens consumits | No mesurats; cap recompte inventat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-15T17:27:06.046Z: esborrany creat amb la plantilla canònica.

2026-10-15: primer relleu per a Claude i MarIA. Auditoria en curs; encara no hi ha diff a `src/`. Les proves enfocades de partida passen (50 fitxers, 639 proves). CI completa en execució.

2026-10-15: **CI ja roja a Node abans de qualsevol pegat de Fase 1.** Node: 944 casos, 936 passen, 4 fallen, 1 salt i 3 TODO. Les quatre fallades reals són d'empaquetat WordPress; els tres diagnòstics TODO no són quatre fallades addicionals. Vitest estava encara en execució en eixe primer tall. El primer informe de Claude era una plantilla sense conclusions.

2026-10-15T17:51:45.532611+00:00: tall final; F4 corregit per Claude i verificat 5/5; informe/acta i relleus completats, tancament global roig delimitat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen final del tall auditat: T1–T3 funcionen i F4 està corregit i verificat.** No hi ha regressió funcional confirmada en els consumidors revisats. Claude ha incorporat el control explícit `ambDrets`, ha netejat les projeccions de persona, ha conservat el bus de la llista amb `targetaViva:false` i ha canviat els quatre glifs. Els 14 fitxers del recorregut integrat tenen SHA-256 idèntic abans/després de la prova estable. La suite ampliada va detectar una incompatibilitat al test de `SectionItemCard`; Claude l’ha corregida i el repàs passa 5/5 amb les fonts estables. No queda cap defecte nou confirmat dins de l’abast auditat. La CI global i el tancament documental continuen rojos pels motius delimitats més avall. Base Git: `2a65ebb6a19d985b5a457a5b388764ca8edc7bd0`; s'audita el diff no confirmat damunt d'esta base.

| ID | Resultat al tall | Evidència i seguiment |
| --- | --- | --- |
| F1 | Resolució de codi contrastada | Persona sense copyright ni categoria; `objecte.tipus` no confon article amb autor. Proves de lectura, editable i llicència antiga passen |
| F2 | Resolució contrastada | Aside absent i targeta de llista reactiva després d'editar en DOM real |
| F3 | Resolució contrastada | 👁️ 🔐 🛡️ 🌐 amb `.sdp-fitxa-emoji-xl`, `aria-hidden=true` i sense SVG |
| F4 | P2 resolt i comprovat | Fixture d’entitat real i control persona incorporats per Claude; `SectionItemCard.test.jsx` passa 5/5, 2,38 s, amb 2.034 hashes estables |
| CI1 | P2, deute preexistent | Quatre fallades de fixtures WordPress incompatibles amb la clau configurada |
| CI2 | P2, deute preexistent | Dos tests Vitest esperen una URL opaca antiga i una pàgina sense la targeta legal ja incorporada |

F1–F3 eren incompliments de la base, no regressions introduïdes per Claude; ara estan resolts en el pegat observat. CI1/CI2 impedixen declarar verda la CI global. Tots els punts tenen `requires_human_decision: false` dins del mandat actual.

### F4 — P2 resolt: fixture de categoria sobre una persona

**Reproducció inicial i relleu a Claude:** la bateria ampliada acaba amb **1.068 passen i 1 falla** (79 fitxers, 49,67 s). Fallada a `src/components/SectionItemCard.test.jsx:45`: espera `['sp-card-labels', 'sp-card-accio']` i rep `['sp-card-accio']`. La fixture `BASE.to='/gent/pepa'` representa una persona encara que el test li passe `eyebrow="Entitat"`; la nova supressió de categoria és correcta. L'asseriment de propagació de categories ha d'usar una ruta/descriptor d'entitat real, i ha de conservar-se un cas persona que exigisca només l'acció. No llevar el control de la ranura ni restaurar categories de persona per fabricar verd. `requires_human_decision: false`.

Era una incompatibilitat introduïda pel contracte nou, diferent de CI1/CI2 preexistents. **Resolució comprovada:** Claude ha canviat la fixture a `/empresa/forn`, ha conservat l’asseriment de propagació de categories/acció i ha afegit el control de persona sense categories. El repàs passa **5/5**, eixida 0, 2,38 s; els **2.034 hashes** abans/després són idèntics. Evidència: `/tmp/sdp-codex-fase1-final/section-card.summary.json` i `section-card.log`. Durant esta bateria han canviat `DocumentEditor.test.jsx` i `CopyrightPage.test.jsx`; cap fitxer productiu ha canviat. Els dos tests modificats s’han repetit després: **81/81 passen**, eixida 0, 7,02 s, **2.034 hashes font iguals abans/després**. Estos 81 casos se solapen amb la bateria gran i no se sumen. Evidència: `/tmp/sdp-codex-fase1-final/recheck.summary.json` i `recheck.log`. Fonts i resultat: `/tmp/sdp-codex-fase1-final/summary.json` i `run.log`.

### Revisió del pegat de Claude

- `UniversalCard.jsx` filtra segons l'objecte representat. Les targetes de contingut del Mur/Mercat/actes conserven drets encara que l'autor siga persona.
- `perfilCamps.js` separa `copyrightDeFitxa` (dada real/persistència) del copyright visual buit de persona, inclosos els esborranys antics. `PerfilEditor` compara l'autodesament amb la dada real per no fabricar conflictes; la sincronització de llicència T39 continua.
- `ambDrets:false` desactiva selector, peu i detall de drets a l'editor. En reserva/baixa, el consumidor real aporta `emptyDocument` ja net. No es presenta com a error el fet que l'opció genèrica no es propague a tots els renderers: no s'ha demostrat una via real de persona afectada.
- `PerfilPublicSection` elimina la categoria de persona i els drets, conservant el poble. Els avisos «Baixa en curs» i «Sense connexió» no es tracten com una classificació humana a suprimir.
- `CopyrightPage.jsx` retira la instrucció obsoleta de canviar llicència des del perfil. Cap canvi funcional de drets de les notes observat.

### Advertiments de la base que han orientat el pegat (històric)

1. **Suprimir només el valor del copyright a PerfilEditor no basta.** `DocumentEditor.jsx` aplica un valor de reserva «© Sóc de Poble» i activa el selector d'autoria a partir de `updateLocal`. Cal comprovar el DOM final, inclosa la persona en lectura (reserva o baixa), amb un control explícit de visibilitat que no altere articles ni notes.
2. **Hi ha més vies de presentació.** `fitxaDeLectura` inventa «© Nom»; `PerfilPublicSection.jsx` el torna a inventar i posa l'etiqueta Persona; `DetallVistes` reutilitza documents de perfil per a targeta/A4/PDF. La prova ha de travessar estes vies, no sols el constructor de props de l'editor.
3. **Una publicació signada per una persona continua sent contingut.** La guarda de `UniversalCard` ha d'identificar el tipus de l'objecte representat, mai el tipus de l'autor. `SectionItemCard` ja deriva el descriptor `objecte` de la ruta de persona.
4. **La suite actual encara exigix el comportament antic.** Hi ha assertions de la quarta columna i del copyright de persona. Un verd d'esta base no prova la directiva nova. Mantindre la cobertura d'autodesament i l'herència de llicència de les notes (T39), amb casos negatius per a articles i organitzacions.

Cada punt és una instrucció de contrast tècnic per a MarIA/Claude; `requires_human_decision: false`. No s'ha modificat codi font.

### Matriu d’acceptació i assertions de la base a substituir

| Cas | Evidència actual | Acceptació |
| --- | --- | --- |
| Persona editable | `PerfilEditor.test.jsx:6` substituïx tot `DocumentEditor`; `DocumentEditor.jsx:470,484` reinventa copyright i selector | Comprovar el DOM amb el renderer real, amb llicència desada i buida |
| Persona en reserva o baixa | `PerfilEditor.jsx:675-679` usa `emptyDocument`; `DocumentEditor.jsx:189-190` pinta els drets d'eixe document | Sense drets ni categoria Persona; conservar avisos de reserva/baixa |
| Directori de persones | `ProfileSection.xat.test.jsx:41-47` exigix una categoria per a Pepa i IAIA | Separar persona humana d'IA i organització; preservar poble i accions |
| Perfil públic | `PerfilPublicSection.jsx:233-237,277-278` afegix etiquetes i copyright | Comprovar persona pròpia i aliena, dades remotes i fallback seed |
| Les vistes, A4 i portada | `DetallVistes.jsx:48,66,91,98`; `DocumentPrintPreview.jsx:31-41` | Sense llicència del perfil encara que hi haja copyright antic o esborrany; nota i organització intactes |
| Quarta columna | `PerfilEditor.test.jsx:55-61` exigix `targetaViva:true`; `PerfilShell.targetaViva.test.jsx` prova la duplicació | Absència de l'aside redundant, però actualització de la targeta de la llista després d'editar |
| Glifs rics | `perfilModel.js:125,139,150,161`; `PerfilShell.test.jsx:130` espera Eye | 👁️, 🔐, 🛡️, 🌐 amb `.sdp-fitxa-emoji-xl`; `ItemMedia.jsx:63-69` ja ho suporta; nom accessible intacte |
| Drets del contingut | Herència T39 a `PerfilEditor.test.jsx:739-847` | Una nota/article signada per persona conserva els drets; no esborreu la preferència emmagatzemada |

La retirada de categories de persona no és una ordre per a llevar avisos d'estat o de permisos. La condició ha de representar la persona objecte de la fitxa, no qualsevol article seu.

### CI de partida: quatre fallades d'empaquetat a contrastar

`tests/enxufe-empaqueta.test.mjs` espera una clau pública buida al plugin i usa claus efímeres en les fixtures. El plugin del repositori ja porta una clau configurada. La prova del valor buit i tres empaquetats fallen per eixe desacord. No s'ha alterat la clau ni s'ha desactivat la comprovació: cal corregir l'aïllament de les fixtures, conservant el rebuig real de signatures divergents. Fallades: `tests/enxufe-empaqueta.test.mjs:168,175,248,276`; la substitució fràgil és a les línies 59–62. Els tests, `wordpress-plugin/eines/empaqueta.mjs` i `wordpress-plugin/includes/actualitzador.php` són idèntics a HEAD: deute preexistent. Cap indici de denegació del sandbox en estes fallades. Els tres TODO provenen de `lint_enxufe.test.mjs:304` i `lint_logica_usuari.test.mjs:305,338`.

**Coordinació de proves:** Codex ha completat una sola `npm run test:ci`: eixida 1, Node=1 i Vitest=1. Vitest: 17.691 passen, 2 fallen, 89 saltades; 1.041 fitxers (1.033 passen, 2 fallen, 6 saltats), 763,92 s. Claude ha modificat codi durant l’execució: és una CI amb versions concurrents i no certifica el tall final del pegat. Els assajos adversarials addicionals viuen només a `/tmp`, amb un worker i sense modificar les proves de producte.

**CI2a — Vitest:** també apareix una fallada a `PublicacioDetall.imatgesPropies.test.jsx`, cas «un avatar i una portada sdp-media:// es pinten com abans». La prova encara espera l'URL que genera `resolveAsset`, mentre la barra taronja ja resol referències opaques pel port. Test i cadena de components són idèntics a HEAD; reproducció aïllada confirmada: **15 passen i 1 falla**, eixida 1, 9,25 s. A la línia 155 el test espera `/sdp-media://mitjans/poble/u/perfil/a.webp` però rep una URL HTTPS resolta pel port (contracte també provat a `BarraTaronja.test.jsx:278-284`). No és una regressió de Fase 1, del sandbox ni de l’ordre de suites. Traça: `/tmp/sdp-codex-fase1-notes.log`.

**CI2b — pàgina de drets:** `paginaDeText.test.js:137:109` falla amb `[]` esperat i `['div']` rebut. `pageContent.js:456` ja inclou una targeta legal incrustada i dos enllaços, mentre les assertions 137–138 només admeten prosa i un enllaç. Test i font són idèntics a HEAD. No és una regressió del perfil; cal actualitzar el contracte del test sense eliminar la cobertura de títols ni d'enllaços.

### Contrast documental i millora de la convocatòria

S'han llegit [[261015_1945_auditoria_claude]] i [[261015_1945_auditoria_gemini4]]. Claude encara té l'informe en plantilla al tall, però el seu diff sí és observable i s'ha auditat directament. No se li atribuïx un dictamen que encara no ha escrit.

Coincidència amb Gemini: objecte persona ≠ article d'autor persona; preservar herència T39 i bus viu; xarxa del Lector a través del port de l'amfitrió. Dos matisos per a MarIA:

1. Els avisos de Gemini T-G4-01/02/03 descriuen la base i ara s'han de reavaluar contra el pegat. `NavGlyph` tracta l'emoji plegat en format menut; XL està acreditat en `ItemMedia`, no en tot el rail.
2. El canvi de cinc XML per noms i enllaços de divulgadors només és llavor, no acredita ingestió RSS real. La mateixa proposta de Gemini distingix correctament el connector extern; cal provar-lo separadament abans de dir «integració en viu». Ampliar la llista de dominis del test no és, per si sol, prova de privacitat. Les comparacions Feedly/Loyverse/Holded de l'informe són propostes arquitectòniques; no s'hi adjunta captura o traça REA que permeta certificar fidelitat al producte de referència.

Millora per a MarIA: cada relleu ha d'identificar SHA/diff, «base / pegat en curs / pegat verificat», casos negatius i balanç per corredor. «17.500 proves» és context històric, no un recompte executable. `test:ci` cobreix Node primari i Vitest; no les suites Node de laboratori/sessió. Cap plantilla ni regla s'ha modificat en esta auditoria.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
| --- | --- |
| Porta Olivera inicial | Eixida 0; avisos heretats de sediment de l'índex |
| `npx --no-install vitest run src/sections/profile/ src/components/PedraSeca/organismes/UniversalCard --maxWorkers=2` | 50 fitxers, 639 proves passen, 33,37 s; estat anterior a la Fase 1 |
| UniversalCard + PageFrame copyright, revisió paral·lela | 11 fitxers, 149 proves passen; parcialment solapades amb l'anterior, no se sumen |
| `npm run test:ci` | Eixida 1. Node: 936 passen, 4 fallen, 1 salt i 3 TODO. Vitest: 17.691 passen, 2 fallen, 89 salts. Execució amb canvis concurrents |
| Bateria ampliada de producte | 79 fitxers: 1.068 passen i 1 falla (F4), 49,67 s; dos tests han canviat, cap font productiva |
| Repàs de F4 després de la correcció | `SectionItemCard.test.jsx`: 5/5 passen, 2,38 s, 2.034 hashes estables; recompte solapat |
| Repàs dels dos tests canviats | 81/81 passen, 7,02 s, 2.034 hashes estables; recompte solapat |
| Acceptació integrada sobre pegat estable | 5/5 passen, 5,66 s, 14 hashes iguals abans/després. Persona editable (copyright buit/antic), reserva/baixa, llista reactiva sense aside i emojis reals |
| Navegació a `http://localhost:3340/el-meu-perfil` | El navegador d'auditoria es redirigix a registre: sense sessió autenticada. No acredita l'aspecte del perfil privat |

### Acceptació independent del pegat

Els mateixos vuit casos sobre el pegat passen **8/8**, 2,22 s, 11 hashes font iguals abans/després. Les cinc fallades de la base queden resoltes i els tres controls de contingut/organització continuen passant. Evidència: `/tmp/sdp-codex-fase1-qa/run2.log`, `run2-results.json` i `run2-source-hashes.json`.

La cadena integrada real passa **5/5**, 5,66 s, 14 hashes estables: `/tmp/sdp-codex-fase1-profile-qa/vitest.run2.log`, `hashes.run2.before.json` i `hashes.run2.after.json`. No s’ha modificat cap test del producte des de Codex.

ESLint dels huit fitxers productius canviats: eixida 0 amb `--max-warnings=0`, traça `/tmp/sdp-codex-fase1-eslint.log`.

### Reproducció adversarial executable de la base

Assaig a `/tmp/sdp-codex-fase1-qa/`, separat de `src/`: **8 casos, 5 fallen i 3 passen**, 5,59 s, un worker. Els cinc casos fallits demostren el que encara mostra la base: copyright de persona, categories, reaparició a Les vistes, drets a la portada/peu del PDF i fallback «© Pepa». Els tres controls conserven drets/categories d'article signat per persona i d'organització; l'enllaç de drets continua portant a `/page/drets-autor`.

Són assajos sobre els components i mapatges reals actuals, sense mocks funcionals i amb zero crides de xarxa. No són proves de navegador ni una imposició d'una API nova: si Claude canvia el contracte, es contrastaran amb els consumidors reals abans d'atribuir una regressió. Els sis fitxers font mantingueren exactament el mateix SHA-256 abans/després. No són tests `[DEFECTE]` que passen celebrant un error: les cinc assercions d'acceptació fallen explícitament.

Reproducció local (la carpeta temporal no forma part de la suite de producte):

```sh
node '/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/node_modules/vitest/vitest.mjs' run --config /tmp/sdp-codex-fase1-qa/vitest.config.mjs --reporter=verbose
```

Fitxers de suport: `fase1.acceptacio.test.jsx`, `vitest.config.mjs`, `results.json`, `run.log` i `source-hashes.json` dins d'eixa carpeta. La traça de la CI és `/tmp/sdp-codex-fase1-ci.log`, i la de la bateria enfocada, `/tmp/sdp-codex-fase1-focused.log`.


### Empremta del codi productiu auditat

Tall: `2026-10-15T17:49:19.148636+00:00`. Huit fitxers de producte modificats; no s’ha creat cap commit. Manifest complet a `/tmp/sdp-codex-fase1-final/production-cut.json`.

| Fitxer | SHA-256 |
| --- | --- |
| `src/components/PedraSeca/organismes/UniversalCard.jsx` | `9be3b6ea7b641096358c258267cb0697a9290d56b24325d393fa24ab8f410f5d` |
| `src/components/universal/DocumentEditor.jsx` | `dfedac6315657e92d71fe3ff3b419c9f2e092d4b3c93ccc5a667b65256159f55` |
| `src/components/universal/drets/CopyrightPage.jsx` | `4f58ce65ccca89e88486573f550223fef60e5211c0e8827dffb5536905723c3f` |
| `src/sections/profile/PerfilEditor.jsx` | `33c81e51f33d2521a3e6c231d468ca5ff8f1a6bf2e0b69afd332ea4dd81e7b7a` |
| `src/sections/profile/PerfilPublicSection.jsx` | `bf285ba450b3929eb486deeca74854cb9a3e50dfa8843cd8ebf3d0c0e4ee8f43` |
| `src/sections/profile/fitxaDePerfil.js` | `35bde542bdec79edf1f2c715b7af9a4849821746dd78e4cac065a80e978ed69b` |
| `src/sections/profile/perfilCamps.js` | `22f7f4efab253d6b40cc1aa8a9e1b03005dc29449a9113e3f0fc3ec2d93bdb0c` |
| `src/sections/profile/perfilModel.js` | `cf4aa32c62fd33f51dbabfa7c8523abe4d178fa2d443ebc3e921f6317bda4a63` |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Abast: Fase 1 del Pla i del Prompt 261015_1900, més regressions dels consumidors compartits. Codex audita; Claude conserva l'edició exclusiva de `src/`. Cap canvi en Supabase, permisos, secrets, instal·lacions o desplegaments. No s'ha creat cap cron ni monitor. Els processos de proves són d'una sola execució.

Fases de Xat, Lector/Feedly, TPV i Gestoria: només cobertura de regressió si apareixen en la CI; no es certifica la seua implementació ni l'absència de fugues de memòria.

**Tancament documental comprovat: `valid:false`, estat `planned`, 454 incidències.** Són 453 del graf heretat (411 àncores, 23 enllaços i 19 orfes) més «Canvis de codi fora de l’abast documental»: el comprovador considera tot el delta compartit de `src/` encara que Codex no l’haja editat. Olivera, plantilles, autoritat, ledger, segell, skills i compilació de Wiki passen amb eixida 0; SCC falla. Els avisos inicials d’ESTAT/LEDGER ja estan resolts i el ledger conserva una signatura vàlida. Traça: `/tmp/sdp-codex-fase1-closure-final.log`.

Informe i acta propis: `document.mjs check` retorna `valid:true`, `errors:[]`. El torn mecànic no es declara tancat, no es canvia el seu abast per ocultar codi alié ni s’arxiven originals. El lliurament de l’auditoria està complet; la salut global continua separada.

La bateria enfocada i el repàs dels tests canviats estan completats. F4 queda resolt i comprovat; resten les sis fallades globals anteriors i la verificació visual autenticada. El pegat té acceptació independent estable; el resultat no acredita una sessió privada de navegador ni la salut global del repositori.

Cobertura addicional recomanada, sense elevar-la a defecte: incorporar al test persistent de `DetallVistes` l’absència de drets al `srcdoc` A4/portada amb copyright antic o esborrany; els casos temporals independents ja ho comproven.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261015_1900_pla_implementacio_xat_identitat_i_perfil]]
- [[261015_1900_prompt_gauntlet_claude_codex_gemini]]
- [[261015_1933_acta_marmota_codex_fase1]]
- [[261015_1945_auditoria_claude]]
- [[261015_1945_auditoria_gemini4]]
