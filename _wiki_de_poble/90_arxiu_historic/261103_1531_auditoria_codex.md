---
type: informe
status: esborrany
description: Implementació i verificació del xat privat d’entitats i dels logotips duals de l’editor, amb límits tècnics Fediversity.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:44b830ec-620d-4f11-870e-46c46443eb43
---
# Carril 2 · Xat privat d’entitats, logotips Dia/Nit i evidències Fediversity

Rebut d'implementació del carril 2 del Pla del Teler. Les comprovacions corresponen a l'arbre viu local; no acrediten cap desplegament, migració remota ni enviament de correu.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:44b830ec-620d-4f11-870e-46c46443eb43 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T14:32:00.073Z |
| Modificació | 2026-11-03T14:53:00.000Z |
| Propietari | Codex |
| Aprovació humana | Ordre directa del Mestre en este xat: executar el Pla del Teler aprovat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 · Codex (identificador detallat no exposat per l'entorn) |
| Tokens consumits | No mesurables amb les eines d'esta sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-03: implementació del carril 2, amb subagents Codex i propietat exclusiva de fitxers. La distribució interna no substituïx els carrils de MarIA, Gemini ni Claude.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Xat privat d'entitats

- `FakeChatOnboarding.jsx` ja no usa Sóc de Poble com a reserva universal. Oli de La Torre, per `olidelatorre` o `3073b933-69fc-4c3e-80dc-b0df9c6b8391`, obri un únic `fake-entitat:<id>` amb el nom i l'avatar declarats. La comunitat es reserva al destinatari explícit Sóc de Poble; es mantenen les excepcions de Javi i la IAIA.
- El resolvedor pur de `xatsPerDefecte.js` admet entitats del padró i organitzacions declarades al contingut core, per id, slug o àlies, mai pel nom. Oli s'ha afegit al padró públic amb l'UUID i el logotip facilitats. Les altres entitats es poden llegir pel directori del port; un error o una identitat desconeguda no es converteixen en un altre destinatari.
- Les lectures es cancel·len en desmuntar o canviar de backend; la mostra no passa els seus ids al lector remot. Els fils buits es declaren carregats, evitant «Carregant la conversa…» indefinit.
- Recarregar `/xat/fake-entitat:ID` reconstruïx la identitat pública pel mateix resolvedor, amb espera i avís de xarxa; no persistix missatges. Canviar d'amfitrió remunta tota la mostra i oblida també textos i respostes pendents.
- La ruta `/assets/mercat/oli_logo.png` del prompt no existix al paquet. S'ha incorporat una còpia portable del logotip real del perfil públic a `public/assets/uploads/brain/oli_de_la_torre_logo.webp` (600 × 600), sense crear carpetes ni modificar-ne els píxels, i s'ha declarat com a logotip exclòs del cens fotogràfic. Font contrastada al DOM del perfil d'Oli; imatge carregada i revisada visualment. Oli és al padró però queda explícitament fora de `CLAUS_FUNDACIONALS`: no obté cap reserva de perfil ni privilegi de les tres identitats del Mestre.
- `XatContext.jsx` conserva els ids acceptats pel proveïdor. Davant un error de format, resol el slug d'entitat pel directori del mateix port i conserva les guardes de sessió, renovació i cancel·lació. En seed/local resol també els àlies rebutjats pel padró. Cap ampliació de permisos ni canvi del port/adaptador.
- `xatCorporatiu.js` permet que «En privat» conserve Oli, Rentonar i les entitats declarades. `navigation.js` i `detailSectionMeta.jsx` s'han contrastat: ja conserven l'autor correcte i no requerixen canvis.

### IDEA-70 · logotip Dia/Nit

- La UI vigent és `NotesEditor → DocumentEditor → UniversalEditorShell`; `NotesSection.jsx` no conté el control. S'ha ampliat eixe recorregut amb `logoImageDark`, una acció pròpia per pujar/canviar/eliminar la variant nocturna i quatre textos en CA/ES/EN/EU/GL.
- `elementDeSeccio.js` produïx `{ clar, fosc?, alt: '' }`, amb les mateixes guardes de font/privacitat per a les dues imatges i resolució de `sdp-media://`. `PageFrame` ja tria la variant pel tema i no s'ha duplicat eixa lògica.
- Notes conserva el camp en preparació, neteja, persistència local, escriptura remota i promoció/publicació com a `logo_image_dark`. Els camps de dia i nit s'editen i s'eliminen independentment.
- Migració additiva preparada: `supabase/migrations/2611031500_notes_logo_mode_nit.sql`, només `public.notes.logo_image_dark text`. **No aplicada remotament.** Un esquema antic usa la quarantena existent i informa que la variant només s'ha conservat al dispositiu; no declara un èxit remot fals.

### Evidències Fediversity i deute que continua obert

1. El paquet municipal viu a `nix/`, no a `pkgs/socdepoble-node0/`. Falta Nix instal·lat, lock, avaluació, build i VM NixOS/Nginx. Les proves de text/HTTP local no certifiquen eixa execució.
2. El motor rural és una biblioteca opt-in provada i documentada a `src/data/local/README.md`; encara no té consumidor de producció. Replay remot idempotent i sincronització real amb Supabase continuen pendents.
3. ActivityPub, WebFinger, NodeInfo, OpenData, cues i encaixada local tenen proves verdes. No acrediten Mastodon remot ni inbox desplegada: `SDP_AP_ACTIVA` continua apagada i ARB-M13-04 continua sent requisit d'activació.
4. `/page/fediversity` encara no reflectix `nix/` ni el motor opt-in i conserva una frase antiga sobre regles WebFinger heretades. Trasllat al carril 1/3: actualitzar l'evidència mantenint explícits estos límits. IDEA-38 del Llibre Mestre conserva un pressupost històric de 42.000 €; no usar-lo com a pressupost vigent davant els 50.000 € de la candidatura.
5. El flake arrel encara exclou `scripts/botigues/associacio-apps.json`; `nix/flake.nix` té un pegat específic. Cal completar el Nix real abans de declarar el paquet verificat.

### Context i retroalimentació

Llegits AGENTS, Genotip, índex mestre, taxonomia, ESTAT_ACTUAL, workflow, Pedra Seca, circuit documental, Pla i acta de relleu. Els subagents han llegit íntegrament el Llibre Mestre en tres trams 1–110, 111–220 i 221–323, el Prompt i l'índex de l'Escriptori; lectura i conclusions contrastades amb el codi. La lectura distribuïda no és una auditoria completa de cada tasca històrica. Llegit també [[261103_1542_auditoria_maria]]: acredita 239 proves del carril 1 i declara verificació SQL dels set productes; ací no es replica ni s'amplia eixa afirmació remota.

Millora proposada per a la plantilla: assignar fitxers segons el recorregut viu i declarar el límit de cada evidència (unitat, navegador, remot). `NotesSection` i `pkgs/socdepoble-node0/` són referències desfasades en este encàrrec. `npm run portes` no existix; la comanda vigent és `npm run porta`. El model detallat només s'hauria d'exigir si l'entorn l'exposa; no s'ha d'inventar a partir del nom del carril. L'índex també conserva una etiqueta «O7–21» amb destí O7–9 i una àncora duplicada a l'acta 0328; es deixen intactes com a precisions menors de l'orquestradora.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Xat focalitzat: 87 proves en 3 fitxers; camí autenticat/corporatiu: 126 proves en 2 fitxers. Hi ha solapament de suites; no se sumen com a proves úniques.
- Logotips/editor/i18n: 564 proves en 16 fitxers, sense fallades; ESLint dels fitxers d'eixe subcarril net.
- Fediversity: 382 proves Vitest en 17 fitxers; Node 175 passades, 0 fallades i 1 omesa (Nix absent) en 10 fitxers. La passada seqüencial amb permisos per servidors HTTP locals resolgué els `EPERM listen` del sandbox i un timeout ENX-03 de 10 ms sota càrrega. No confondre el timeout de la passada inicial amb interoperabilitat remota.
- `design_guard.mjs`: 3.058 fitxers, 0 crítics i 0 avisos, eixida 0. `check-editorial-copy.mjs`: `valid: true`, eixida 0; el cens conserva incompliments fora del seu abast modificat. `frontissa-contingut.mjs`: 16/16, eixida 0.
- Navegador localhost, càrrega final en pestanya nova: xat d'Oli amb nom i avatar real carregat, fil buit llest, recàrrega conserva destinatari, 0 avisos/errors. Control del logo nocturn visible i centrat en clar/fosc a Notes, 0 avisos/errors en la comprovació del subagent. No s'han escrit notes ni dades remotes; tema restaurat. Durant HMR de l'arbre compartit sí s'observaren errors de backend incomplet (`loadCoreContent`/`getCurrentUser`); desapareixen en càrrega nova, però són una troballa per a P0-16 i no una certificació global de consola neta.
- Integració Xat/Detail/Notes i dades associades: 280 fitxers, 3.905 proves passades i 6 fallades de dos fitxers que canviaren durant l'execució (restauració Fake i exclusió fundacional). La reexecució final dels fitxers afectats més padró/cens/IAIA i una regressió d'entitat homònima passa **88/88 en 5 fitxers**. No s'ha repetit sencera la passada de 526 s després d'estabilitzar eixos fitxers.
- `npm run porta`: **eixida 1**, aturada a Tractor Psicopatia amb 6 contradiccions `ZOMBIE-LOCAL-FIRST`/`ZOMBIE-OFFLINE-FIRST` a les actes `261103_0328`, `261103_1228`, `src/data/local/pontEmergenciaRural.js` i `src/data/local/README.md`. Són fora dels fitxers d'implementació d'este carril. Registre d'execució a `/private/tmp/sdp-codex-teler-porta.log`; cal relleu al carril 4, sense suprimir la norma.
- Circuit documental `document.mjs check`: `valid: true`. Porta Olivera final verda en la comprovació, amb les auditories de Codex i MarIA ancorades.
- `node tooling/gates/tancament.mjs`: `valid: true`, eixida 0 (Olivera, plantilles, autoritat, ledger, segell, skills, wiki i SCC). És el tancament documental; no anul·la la fallada de la porta global de producte. ESLint final del carril i `git diff --check` també a 0.

Comandes de regressió finals:

```sh
npx vitest run src/data/identitatsSeed.fundacionals.test.js src/data/localPerfils.test.js src/sections/xat/components/FakeChatOnboarding.test.jsx src/sections/xat/components/FakeChatOnboarding.iaia.test.jsx src/sections/multimedia/censImatges.test.js --maxWorkers=2
npx vitest run src/sections/xat/ src/sections/detail/ src/sections/notes/ src/data/xatsPerDefecte.test.js src/data/identitatsSeed.pilot.test.js src/data/identitatsSeed.fundacionals.test.js src/data/identitatsSeed.autoria.test.js src/data/localPerfils.test.js src/data/localPerfils.directori.test.js src/sections/control/xatCorporatiu.test.jsx src/hooks/useAccions.comentar.test.jsx
```

Comandes de contrast Fediversity executades pel subagent (sense repetir suites):

```sh
npx vitest run src/data/activitypub.test.js src/data/federacio/inboxActivityPub.test.js src/data/federacio/inboxActivityPub.inspeccio.test.js src/data/exportaMunicipiOpenData.test.js src/data/importaMunicipiOpenData.test.js src/data/importaMunicipiOpenData.adaptadorLocal.test.js src/data/importaMunicipiOpenData.v100.test.js src/data/entradaOpenDataDelPoble.test.js src/data/supabase/contracteExportacioFederacio.test.js src/data/supabase/exportacioFederacio.contracte.test.js src/config/firebaseHosting.webfinger.seguretat.test.js --maxWorkers=2
npx vitest run supabase/functions/ap-inbox-verifica/cuaLliurament.test.js supabase/functions/ap-inbox-verifica/gestor.test.js supabase/functions/ap-inbox-verifica/dosNodes.test.js supabase/functions/ap-inbox-verifica/magatzem.conformitat.test.js src/data/supabase/apInbox.migracio.test.js src/data/supabase/exportacioFederacio.dosComptes.test.js --maxWorkers=2
node --test --test-concurrency=1 tests/fediversity-nixos-module.test.mjs tests/enxufe-backend-offline-first.test.mjs tests/persistencia-local-rural.test.mjs tests/cua-operacions-offline.test.mjs tests/portabilitat-fediversity.test.mjs tests/pont-emergencia-rural.test.mjs tests/opendata-fediversity.test.mjs tooling/seo/genera-federacio.test.mjs tooling/seo/publicacions-federades.test.mjs tooling/vite/federacio-iaia.test.mjs
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'han executat els carrils d'edició de contingut/Supabase de MarIA, ni la inspecció multilingüe completa de Gemini, ni l'auditoria final de Claude. No es declara el Teler complet ni la consola neta de totes les rutes.
- No s'ha aplicat la migració SQL, desplegat, fet commit ni enviat el correu a Fede. Cal verificar persistència real amb l'esquema nou.
- Les organitzacions dinàmiques absents del padró de `localXat` conserven la ruta però poden rebre `SDP-XAT-004` amb sessió local. Oli i Rentonar sí s'obrin; el camí remot s'ha provat amb transport simulat, sense certificar permisos en producció.
- Cap cron ni schedule creat per este equip. No es cancel·len tasques alienes. Les pestanyes de QA es tanquen en acabar; el servidor 3340 ja existia i no és nostre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
