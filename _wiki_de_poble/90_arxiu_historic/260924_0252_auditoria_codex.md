---
type: informe
status: esborrany
description: Auditoria amb carreres de sessió reproduïdes, exportació privada sintètica, governança, UX i SEO; sense canvis de producte.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7cc4fce1-02ec-444c-9498-665a938776e6:c27bea11-e9c1-45cc-9740-a2ba78d04e83
---
# Auditoria de fortificació global — Codex

Esta guia és consultiva i de només lectura sobre el producte. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260924-0252 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; macOS; navegador Chromium local |
| Creació | 2026-09-24T02:52:28+02:00 |
| Modificació | 2026-09-24T03:15:06+02:00 |
| Propietari | Codex; Javi com a responsable del projecte |
| Aprovació humana | pendent; esta auditoria no autoritza implementació |
| Plantilla | auditoria_canonica.md v2.0.0, ruta auditoria |
| Torn | torn_7cc4fce1-02ec-444c-9498-665a938776e6 |
| Model IA | GPT-6; variant exacta no exposada en esta sessió |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats amb fiabilitat; no s'inventa una xifra. |
| Tall de codi | HEAD e2179043f607f71252e056fdf2ce52395db4b99a més arbre de treball preexistent |
| requires_human_decision | true; prioritats i canvis futurs requerixen el consens demanat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Llegits AGENTS, Genotip, índex mestre, arrencada i estat recent; aplicats els skills locals `sdp-workflow`, `wiki-documentacio-i-reflex` i `sdp-pedra-seca`. Llegides la plantilla del prompt, la plantilla canònica de l'auditoria i la pissarra compartida. La plantilla d'auditoria té SHA-256 `ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d`. El rebut acredita entrega, no comprensió.

**Nota global: 6/10.** És un judici professional orientatiu, no una mètrica certificada. El done perquè Javi el demana expressament. Significa «base funcional amb arquitectura pròpia i proves útils, amb fronteres importants encara obertes». No significa «preparat per a posar dades privades reals de moltes persones».

**Què heu construït:** una aplicació React modular per a una comunitat, amb un sistema visual propi, contingut estructurat, notes, publicacions, xat i una capa d'integració encapsulable. Al costat hi ha un sistema extens de governança i documentació executable. Això és treball real i aprofitable. La implementació actual depén de serveis centrals com Supabase: la voluntat d'autonomia no equival encara a una xarxa federada o plenament descentralitzada.

**La teua professió no invalida el projecte.** La qualitat es jutja pel comportament observat. Ací hi ha decisions bones: invalidació per generacions, fronteres de configuració, sanejament HTML central, proves de regressió i separació de dades. També hi ha camins que no usen les mateixes proteccions. No veig motiu per a proposar una reescriptura completa. Veig un treball de consolidació amb criteris d'acceptació mesurables.

La distància fins a un nivell òptim no es pot convertir honestament en dies sense validar el backend i acordar el producte mínim. La seqüència és clara: tancar sessió/privacitat, fer fiable la cadena de verificació, completar fluxos funcionals i SEO, validar usabilitat, i assajar la integració real. Afegir més regles o més models sense estos assajos no resol la manca d'evidència.

| Dimensió | Valoració orientativa | Motiu |
| --- | --- | --- |
| Arquitectura i dades | 6/10 | Bones peces reutilitzables; Xat, OAuth i perfil trenquen la uniformitat del cicle de sessió. |
| Seguretat i privacitat | 4/10 | Carreres reproduïdes, exportadors desiguals i aprovacions de tractors insuficients. No hi ha bypass remot de RLS demostrat. |
| Pedra Seca, UX i accessibilitat | 6/10 | Identitat recognoscible; contrast insuficient en controls reals, retall mòbil i un flux Connectar incomplet. |
| SEO i semàntica | 5/10 | Hi ha infraestructura; el head conserva metadades d'una altra ruta. |
| Skills, scripts i verificació | 6/10 | Molta instrumentació, però no tota s'executa ni tota diferencia lectura de mutació. |

La nota global és una síntesi, no la mitjana exacta d'estes cinc columnes. Cap auditoria finita pot demostrar invulnerabilitat absoluta. Ací, a més, hi ha contraexemples executables que refuten el 10/10.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-24T03:15:06+02:00: informe, rèplica i pla lliurats; document validat, tancament global roig declarat.

- 02:52: tall inicial de 558 fitxers rellevants, amb hashes individuals guardats fora del repositori. SHA-256 del manifest serialitzat com a JSON ordenat amb separadors compactes: `e9e01c196e83d96e9bbadbf5f2283816887bae2d4ff55a169d59ccd9b25be6d5`. No confondre un inventari amb lectura manual de totes les línies.
- Proves existents, compilacions a directori temporal, inspecció de navegador i sondes sintètiques. No s'han executat registres, missatges, pujades, migracions ni operacions destructives contra serveis reals.
- Hi havia canvis de producte sense commit abans de començar. Durant l'auditoria `NotaFitxa.jsx` ha canviat concurrentment. Els resultats de les proves corresponen al moment d'execució, no a un arbre congelat per sempre.
- Llegida l'auditoria de Claude de les 03:00 quan ha aparegut. La rèplica tècnica és al final de Troballes i s'incorpora al pla compartit. No s'ha modificat el seu informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Com llegir les prioritats

**P1**: resoldre abans d'usar dades sensibles o executar automàticament el camí afectat. **P2**: defecte funcional, d'accessibilitat, rendiment o fiabilitat que necessita una correcció planificada. **P3**: millora menor. No declare cap P0 de compromís remot actiu: no n'hi ha una prova en esta auditoria. «Reproduït» significa una prova executada; «estàtic» significa un camí de codi verificat sense executar-ne l'efecte perillós.

### C01 · P1 · El retorn OAuth pot ressuscitar una sessió després d'eixir

**On:** `src/data/oauthRelay.js:89-108`, cridat des del popup i de `gestionaTornada` a la línia 335. Confiança alta; reproduït.

`bescanvia` espera el token i després crida `desaSessio` sense comprovar que l'intent continue vigent. La contrasenya sí que usa `versioSessio` i un identificador de petició a `src/data/supabase/auth.js:128-151`. Eixa protecció no arriba al relay OAuth.

**Reproducció:** iniciar un retorn amb `code` i `state` sintètics vàlids en emmagatzematge, retindre el `fetch`, executar `esborraSessio`, i resoldre el bescanvi amb l'usuari A. Resultat: `usuariDeSessio().id === 'A'` després d'haver eixit. El fetch tampoc porta `signal` ni `redirect: 'error'`. No he enviat codis ni tokens reals.

**Impacte:** el resultat tardà d'un intent cancel·lat torna a autenticar l'aplicació. També pot competir amb un altre inici de sessió. La prova acredita la resurrecció després de logout, no un robatori de compte remot.

**Proposta conceptual, no pegat aplicat:**

```js
const intent = beginAuthAttempt(); // captura generació, id i AbortController
const response = await exchangeCode({ signal: intent.signal, redirect: 'error' });
if (!isCurrentAuthAttempt(intent)) throw new DOMException('Intent caducat', 'AbortError');
desaSessio(response);
```

`beginAuthAttempt` i `isCurrentAuthAttempt` són noms proposats: cal construir-los sobre la font de sessió existent, invalidar-los amb logout/configuració i aplicar-los als dos camins OAuth. Afegir termini màxim i neteja determinista. **Acceptació:** retorn tardà després de logout o segon login no escriu cap credencial; mateix test en popup i retorn complet.

### C02 · P1 · Xat conserva missatges privats de la sessió anterior

**On:** `src/sections/xat/XatContext.jsx:148-165,448-465`; providers persistents a `src/app/App.jsx:481-495`. Confiança alta; reproduït.

Xat llig `currentUser`, però no la generació de sessió. Quan no hi ha usuari buida fils; `filActiu` i `missatgesPerFil` continuen vius. El valor públic del context retorna `missatgesPerFil[filActiu]` sense comprovar l'amo. Canviar de ruta no desmunta els providers.

**Reproducció:** A obri `fil-A` i rep `SECRET SINTETIC A`; després el mock de sessió passa a anònim i augmenta generació. El hook continua retornant el missatge i `filActiu === 'fil-A'`. La prova s'ha fet sobre el provider real amb transport fals. No afirma que s'haja vist un missatge real en pantalla ni que el backend haja lliurat dades alienes.

**Impacte:** dades anteriors disponibles al context després de logout, i risc de mescla quan canvia actor, municipi o configuració. Els callbacks de lectures, enviaments i subscripcions han de quedar invalidats també; buidar només un array no resol les respostes tardanes.

```js
const scope = scopeOf({ actorId, tenantId, generacio, backendIdentity });
const visible = cache.scope === scope ? cache : EMPTY_CHAT;
// En cada callback asíncron:
if (requestScope !== currentScopeRef.current) return;
// En canviar scope: cancel·lar, desubscriure i descartar la cache antiga.
```

La màscara de lectura ha de ser immediata; un `useEffect` de neteja tot sol encara deixa un render amb dades antigues. **Acceptació:** A→logout→B, canvi de tenant i resposta tardana deixen zero missatges d'A accessibles des del context de B.

### C03 · P1 · Una resposta antiga d'edició de perfil s'aplica a la sessió següent

**On:** `src/data/supabase/auth.js:97-117`; consumidor `src/sections/profile/PerfilContext.jsx`. Confiança alta; reproduït amb transport i sessió simulats.

`updateProfile` captura l'usuari A, espera PUT a Auth, fa PATCH al perfil i crida `actualitzaUsuariSessio` sense comprovar generació després de cap await. En la prova, la sessió passa a B mentre el PUT està pendent. Quan torna A, la funció intenta aplicar el nom i email d'A a la sessió actual B. El PATCH simulat retorna `[]` i igualment es declara èxit amb dades de reserva.

`actualitzaUsuariSessio` conserva l'id de B i combina camps seleccionats: **no he demostrat que l'id o el token de B es convertisquen en A, ni que es modifique remotament el registre de B**. Sí que hi ha corrupció de metadades locals i un èxit fals si el PATCH no modifica cap fila.

```js
const epoch = versioSessio;
const actor = getCurrentUser()?.id;
const stillCurrent = () => versioSessio === epoch && getCurrentUser()?.id === actor;
const authUser = await updateAuthMetadata(updates);
if (!stillCurrent()) throw new DOMException('Sessió canviada', 'AbortError');
const rows = await updateProfileRow(actor, updates);
if (!stillCurrent()) throw new DOMException('Sessió canviada', 'AbortError');
if (rows.length !== 1) throw new Error('El perfil no s’ha actualitzat');
actualitzaUsuariSessio(authUser);
```

Les funcions de transport del fragment són pseudocodi. Cal capturar també configuració/token de l'operació, invalidar el consumidor del perfil i decidir com informar d'un èxit parcial Auth/taula: no són una transacció única. **Acceptació:** resposta d'A descartada després de B; cap segon write amb identitat canviada; zero files no es presenta com a guardat.

### C04 · P1 · Els exportadors públics no compartixen frontera de privacitat

**On:** `tooling/wiki/compile-wiki-to-app.mjs:28-42,125-164`; `tooling/wiki/core/build_slug_index.mjs:5-47`. Confiança alta; reproduït amb fitxers sintètics.

El compilador restringix les carpetes principals a SER/SABER/ACTUAR, però no exclou `visibility: private`. Tampoc rebutja un enllaç simbòlic a un fitxer Markdown: el recorre com a fitxer i `readFileSync` seguix el destí. La prova posa un document privat dins de `02_saber` i un symlink que apunta a `.agents/intern.md`: **els dos cossos sintètics entren al manifest**.

El generador de slugs recorre explícitament `.agents`, no filtra visibilitat i llig `parsed.meta` quan el parser retorna `data`. La prova amb `title` i `slug` personalitzats acaba usant el nom del fitxer. L'índex públic actual té **174 entrades, 41 de `.agents` i 13 de l'Escriptori**. Això són noms i rutes, no els cossos sencers. El manifest generat actual té 68 elements i **zero amb `attributes.visibility === 'private'`**: no declare una fuga actual de cossos privats a producció; declare una frontera fallida demostrada i metadades internes presents en l'artefacte públic local.

El RAG sí que té un filtre `visibility: private`: tres exportadors, tres criteris diferents.

```js
const real = fs.realpathSync(file);
const rel = path.relative(publicRoot, real);
if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) reject();
if (fs.lstatSync(file).isSymbolicLink()) reject();
const { data, body } = parseFrontmatter(raw);
if (data.visibility !== 'public') return; // migració explícita del catàleg existent
```

La proposta de publicació explícita requerix classificar els documents existents; no s'ha d'aplicar a cegues deixant la wiki buida. Reutilitzar la mateixa política en manifest, slugs, RAG i SEO, excloure `.agents` i Escriptori dels artefactes públics i validar col·lisions d'id. **Acceptació:** fixtures privats, symlinks i rutes fora d'abast mai entren en cap eixida pública; title/slug explícits sí que es respecten.

### C05 · P1 · `knownRead` admet ordres que escriuen

**On:** `tooling/gates/mutation-policy.mjs:20-37`; retorn anticipat de `tooling/gates/hooks-local.mjs:68-77`. Confiança alta; comprovació de decisions sense executar ordres perilloses.

La llista de lectura accepta qualsevol script `tooling/gates/...` amb flags simples i quasi qualsevol `npm run porta:...`. He passat les següents cadenes **com a dades** a la política i al hook:

| Cadena analitzada, no executada | knownRead | hook local |
| --- | --- | --- |
| `node tooling/gates/segella.mjs --update` | true | code 0 |
| `node tooling/gates/design_guard.mjs --baseline` | true | code 0 |
| `node tooling/gates/porta-olivera.mjs --arxiva` | true | code 0 |
| `npm run porta:sanejador` | true | code 0 |

Actualitzar baseline, arxivar i sanejar són mutacions. `segella --update` té comprovacions pròpies addicionals; admetre la cadena no prova que la invocació nua resegelle amb èxit. El defecte és classificar-la com a lectura i saltar la resta de la política. Ja es rebutgen `git diff --output` i `porta:baseline`, però les exclusions puntuals no tanquen la família.

**Impacte:** el hook no és una frontera fiable entre lectura i escriptura. No s'ha provat escapar del sandbox del sistema operatiu; és una debilitat de la governança local.

```js
const READ_COMMANDS = new Map([
  ['segella.mjs', new Set([''])],
  ['design_guard.mjs', new Set(['--arrel=src'])],
  ['porta-olivera.mjs', new Set(['--informe'])],
]);
// Parsejar argv, comprovar executable/cwd/ruta real i acceptar només
// combinacions explícites. Tot mode d’escriptura va per executor i lease.
```

El mapa és il·lustratiu, no un parser de shell llest per a copiar. Preferir un executor estructurat amb `shell:false`. **Acceptació:** cada mode mutador és denegat sense lease encara que compartisca executable amb una comprovació de lectura; proves de flags, cwd, wrappers npm i rutes simbòliques.

### C06 · P1 · Plaquetes comprova que existix aprovació, però no el contingut aprovat

**On:** `scripts/immunitari/plaquetes.mjs:278-308,313-362`. Confiança alta per lectura; no executat `aplica`.

`aprova` guarda el hash complet de la recepta. `aplica` només comprova `existsSync(aPath)` i llig la recepta actual; no contrasta el hash de l'aprovació. Una recepta alterada després de l'aprovació conserva el permís. El requisit d'arbre Git net és una barrera addicional, però no substituïx l'enllaç criptogràfic entre aprovació i bytes executats.

També hi ha `path.join(REPO_ROOT, op.fitxer)` sense confinament real, cap hash d'origen en `DESTRUEIX` i `runGit` usa `execSync` amb paths interpolats en una shell. Les cometes dobles no neutralitzen substitucions de shell presents en un nom manipulat. Les operacions fan commits amb `--no-verify`.

**Impacte condicionat:** qui puga modificar la recepta o els seus paths pot desviar una aprovació anterior, moure fitxers no previstos i intentar execució mitjançant interpolació. No és una entrada remota demostrada; és un problema del tractor local amb capacitat destructiva.

```js
const approved = JSON.parse(readFileSync(approvalFile, 'utf8'));
const bytes = readFileSync(recipeFile);
if (sha256(bytes) !== approved.hash) throw new Error('La recepta ha canviat');
const recipe = validateRecipe(JSON.parse(bytes));
for (const op of recipe.operacions) {
  validateConfinedRealPath(op.fitxer);
  validateSourceHash(op); // també destrucció/moviment
}
spawnSync('git', ['add', '--', validatedPath], { cwd: root, shell: false });
```

Validar tota la recepta abans del primer efecte, limitar tipus/rutes, impedir symlinks i consum múltiple ambigu, i registrar resultat parcial si falla. No prescric desactivar els hooks per fer-la passar. **Acceptació:** recepta canviada, `../`, symlink, metacaràcters i origen canviat fallen abans de cap mutació.

### C07 · P2 · Connectar perd el context i oferix una via de Notes que no alimenta Notes

**On:** `src/sections/connectar/ConnectarSection.jsx:124-182`; `src/sections/mur/MurContext.jsx:30-33`; carregadors de Notes en `src/data/supabase`. Confiança alta per traça; no enviat contingut remot.

El botó de producte aporta paràmetres contextuals, però Connectar inicia en Xat i el submit fa `navigate('/xat')`: no obri una conversa amb el venedor ni transporta una referència útil al producte. La persona pensa que està connectant amb algú i arriba a la bústia genèrica.

La seua opció Notes prepara un `sectionSubmission`, però Notes ja es carrega de `public.notes`. Guardar en `section_submissions` no crea una nota que aparega allí. A més, `sendSectionSubmission` no invalida/actualitza el Mur després del write. Els providers persistents mantenen el resultat anterior fins a un refresc explícit. Són dos problemes separats: refrescar no arregla una taula de destí equivocada.

**Proposta:** una sola intenció contextual `{kind, targetUserId, itemId}` validada; per a una nota, usar l'operació canònica de Notes i navegar a l'id retornat. Per a publicacions, refrescar o actualitzar el recurs del mateix scope després d'èxit. Copy explícit («Parlar amb…», «Publicar al Mur», «Crear nota») conservant els components Pedra Seca. **Acceptació:** cada acció acaba en l'objecte anunciat, visible sense recàrrega manual, i una resposta tardana no invalida el scope d'un altre usuari.

### C08 · P2 · El head conserva el producte anterior en Connectar i Notes

**On:** `src/hooks/useSEO.js:11-101`; rutes sense propietari equivalent del head. Confiança alta; navegador real.

**Reproducció:** obrir `/mercat/samarreta-socdepoble`, entrar a Connectar i després a Notes. Observació final a `/notes?nota=n1`:

```text
title = Samarreta Sóc de Poble | Sóc de Poble
canonical = http://localhost:3340/mercat/samarreta-socdepoble
meta robots = absent
```

`useSEO` no neteja el que posseïx en desmuntar; tampoc depén de `pathname` quan calcula el canonical implícit. Les rutes que no el criden hereten metadades. Una recàrrega neta i una navegació client poden donar heads diferents. El manifest SEO temporal genera 31 rutes, 25 indexables; Notes no forma part de la llista explícita de no-index del generador revisat.

**Proposta:** un únic propietari del head al nivell de router, amb metadades derivades de ruta i dades vigents. Diferenciar pantalles privades d'objectes públics compartits i publicar `noindex` coherent per les primeres. Mantindre canonical/OG/JSON-LD sincronitzats i retirar els anteriors. Si el host gestiona el head, ha de complir el mateix contracte.

Google pot renderitzar JavaScript: no declare que «SPA = invisible». Tampoc un `noindex` o un `robots.txt` protegixen dades privades; la protecció és d'accés. Cal verificar HTML inicial, URL directa i navegació en el hosting real. Fonts: [Google, SEO amb JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [directives robots](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

**Semàntica comprovada:** a `/wikidepoble?item=02_genotip` hi ha un `main`, dos `article` i quatre `header`; la quantitat de headers per si sola no és un error. El títol de la carcassa i el Markdown generen dos H1 visibles (`02_genotip` i el títol del Genotip), i el quadre ISO salta a H4. Definir un títol principal i nivells de secció coherents. El DOM de la mostra no conté `time` ni `address`: no totes les pantalles els necessiten. On s’exposa una data documental, usar `time` amb una data real; reservar `address` per informació de contacte, no per qualsevol topònim. `UniversalCard` ja usa `article`, `header` i `time` quan rep un badge amb datetime. Hi ha botons natius, noms accessibles i un enllaç de salt; això és una bona base, no una certificació completa d’accessibilitat.

**Acceptació:** matriu Mercat→Connectar→Notes→Mur, càrrega directa i botó arrere: títol, canonical, robots i JSON-LD sempre corresponen a la ruta actual. La falta de `wordpress-plugin/inc/sdp-seo.php` en esta còpia impedix donar per validat un head PHP; generar un manifest sense eixe fitxer no demostra la integració WordPress.

### C09 · P2 · Contrast insuficient en controls reals; AAA no acreditat

**On:** `src/css/tokens.css`, controls de Connectar, `src/config/crom.js` i `PanellCrom`. Confiança alta per mesura de DOM i càlcul independent.

En Connectar he mesurat text blanc sobre `rgb(9,132,227)` (`#0984e3`) en «Afegir» i «Connectar a Xat», amb 14,4 px i pes 700. Contrast aproximat **3,87:1**. No és text gran als efectes de WCAG: no arriba al 4,5:1 d'AA per a text normal ni al 7:1 d'AAA. El botó superior «Connectar» inspeccionat usa un blau més fosc: no afirme que tots els botons compartisquen la fallada. Font: [WCAG, contrast mínim](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

Conservar L i C en OKLCH mentre canvia el hue no és una demostració de conservar el contrast WCAG calculat a partir de luminància sRGB, especialment amb conversió i límits de gamut. La promesa del panell cromàtic necessita comprovació per parelles semàntiques i estats, no un comentari.

**Proposta:** conservar la identitat de marca i definir un token d'acció adequat per a text blanc; calcular contrast de les parelles efectives en cada tema, hue i estat actiu/focus. No substituir sistemàticament tots els blaus per un color arbitrari. **Acceptació:** cap text normal d'acció per davall d'AA; documentar les parelles que realment arriben a AAA i verificar focus/disabled per criteri aplicable.

### C10 · P2 · La capçalera es retalla a 320 px en la configuració amb Crom

**On:** `src/css/layout.css`, `PageFrame` i grup d'icones. Confiança alta; navegador local en DEV.

Amb viewport CSS de **320 × 800**, el contenidor principal mesura 320 px però té contingut de 356 px; el botó Perfil arriba a x≈355,95 i queda retallat. `overflow: clip` amaga l'excés. Hi ha marges residuals de les icones i una acció addicional de Crom.

L'evidència correspon al conjunt de controls **DEV/superadministrador**. No l'extrapole automàticament a la capçalera pública amb menys botons. El problema continua sent real per eixe perfil i per contenidors estrets de l'embed.

**Proposta:** prioritzar accions i agrupar les secundàries en un menú accessible a partir de l'amplària del contenidor; revisar gap i margin duplicats. No reduir silenciosament text ni diana tàctil. **Acceptació:** 320/360/390 px, embed estret i text ampliat no amaguen Perfil, tancament ni acció principal; comprovar teclat i focus visible. No he certificat lector de pantalla ni Safari/iOS.

### C11 · P2 · Hi ha proves verdes, però la porta de lliurament no està verda

**On:** lint, Design Guard, catàleg skills, contracte documental i cadena de portes. Reproduït.

- Vitest: **103/103**, 28 fitxers, amb 2 workers.
- ESLint: **0 errors i 64 warnings**, però exit 1 perquè el contracte és `--max-warnings=0`.
- Node, nou fitxers de proves seleccionats: **124/134**. Nou fallen en la preparació del catàleg per `core-edicio-segura`; un altre falla amb `ReferenceError: versioSessio is not defined` en la prova de transport basada en fixture. No són deu vulnerabilitats de producció distintes.
- Design Guard: **257 fitxers, 84 crítics del seu classificador i 5 avisos**. Deute puja en inline styles, raw colors, diana tàctil i headings. Algunes coincidències són dades generades o noms compartits amb classes pròpies: no equival a 84 errors visuals demostrats ni s'ha de fer substitució massiva per regex.
- Diagnòstic de portes en mode lectura: **2 fallades** (segell i contracte documental). La cadena ordinària de Claude para en el segell; el seu resultat no informa de les portes posteriors.

**Proposta:** diferenciar «passa», «falla» i «no executat»; un mode diagnòstic complet però sense mutacions i una porta de release que exigisca totes les comprovacions requerides. Reconciliar skills amb el seu catàleg abans de resegellar, validar cada warning i incorporar les reproduccions C01–C06. No normalitzar baseline només per fer callar la porta. **Acceptació:** CI reproduïble i verda sobre un commit concret, sense dependència d'evidència obtinguda abans de canvis posteriors.

### C12 · P2 · Olivera i la documentació presenten garanties desiguals

**On:** `tooling/gates/porta-olivera.mjs`, `tooling/documental/turns.mjs`, índex de l'Escriptori i pla compartit. Confiança alta; lectura i comprovacions.

La funció `checkOlivera` ha retornat `valid:true` mentre `--informe` assenyalava 2 documents sense àncora i 6 àncores que apunten a documents ja retirats de l'Escriptori. Els camins no apliquen totes les mateixes condicions. El reconeixement de pla és per data/nom, no una validació completa de rebut, cognom i contingut. La comprovació de caselles pot confondre tasques pendents del prompt amb la secció zero de preflight. El CLI d'Olivera, separat del hook local general, declara explícitament fail-open davant JSON incomprensible.

El prompt marca preflight complet però no té rebut persistent vàlid; el pla compartit usa `type: pla_implementacio`, fora de l'enum, i inicialment no té rebut/àncora. La plantilla **sí que emet `type: document`** en `SDP:EIXIDA`. No cal ampliar l'enum per justificar un document que s'ha apartat de la plantilla. Cal regularitzar-lo pel circuit existent.

L'orfandat dona 14 enllaços trencats i 5 orfes en el tall inicial. Part del problema és la resolució entre carpetes/històric: cada incidència s'ha de classificar abans de moure o esborrar res. La comprovació global d'un torn també pot detectar canvis de codi d'un altre agent com a violació de l'abast documental; `ownPaths` només limita documents, no tot el delta de producte.

**Proposta:** un sol avaluador estructurat per CLI i hook, validar exactament el preflight corresponent i la ruta canònica del pla, explicitar «no avaluat» en lloc de «verd», i una base d'evidència aïllada o propietat de canvis que permeta auditoria concurrent. El fail-open d'una porta d'higiene no s'ha de presentar com una barrera de seguretat. **Acceptació:** mateix arbre i mateix payload produïxen el mateix veredicte; cap casella textual substituïx un rebut verificat.

### C13 · P2 · Aïllament, rendiment i integració encara necessiten assajos de producte

**On:** `useScopedResource`, `CoreContentContext`, `IdentitatContext`, `App.jsx`, embeds, migracions SQL. Troballes estàtiques i límits d'acceptació.

1. **CoreContent:** `useScopedResource` retorna un objecte nou en cada render i el memo de Core depén d'eixe objecte. El `reduce` de pages copia l'acumulador cada vegada. És treball evitable; no prova un bucle infinit. Estabilitzar referències i usar `Object.fromEntries` és raonable després de preservar la màscara de scope. Mesurar renders i latència abans de donar una severitat de rendiment alta.
2. **Error boundaries:** hi ha boundary global i de ruta. Els providers de seccions viuen per damunt del boundary de ruta. Un error inesperat allí pot degradar tota l'aplicació. Un sol boundary al voltant de tots els providers no dona independència a cada secció: cal modularitzar providers o proporcionar fallback coherent per domini. No sacrificar esborranys locals en un reinici global.
3. **Identitat:** la preferència d'entitat activa és estat client, no prova de pertinença ni permís SQL. Hi ha un TODO de verificació de membres. El selector ha de consumir membres autoritzats i el servidor ha de revalidar cada acció.
4. **Pes:** build web: chunk principal ≈659,97 kB, gzip190,53 kB; Notes ≈465,44 kB, gzip149,29 kB. Embed IIFE ≈2.588,51 kB, gzip778,38 kB. Són mides de compilació, no una mesura de Core Web Vitals. Cal assajar xarxa lenta i separar càrrega per ruta quan aporte millora real.
5. **SQL/Sollutia:** el tractor RLS passa sobre 18 fitxers SQL. No executa una matriu de permisos en la instància remota. El trigger d'alta revisat exigix tenant vàlid; el login Google no acredita en esta auditoria el circuit complet que el proveïx. Cal provar alta nova, login existent, logout, renovació i canvi de rol/tenant amb dos usuaris reals de staging. No s'ha demostrat ni una integració real satisfactòria ni un bypass RLS. En PostgreSQL, diverses polítiques permissives es combinen amb OR; revisar l'estat final desplegat, no només l'existència d'una política en un fitxer. Font: [PostgreSQL, Row Security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
6. **Retenció local:** les notes i cues en IndexedDB estan associades a scope, però l'eixida no equival a eliminació dels cossos del dispositiu. Decidir retenció en dispositiu compartit sense destruir esborranys pendents. Shadow DOM i sessionStorage no són fronteres contra JavaScript del mateix origen.

**Acceptació:** matriu de degradació per secció, perfil de càrrega mòbil, recuperació d'esborrany després d'error i matriu de permisos/auth en staging amb evidència versionada. No cal crear un sistema nou de governança per a cada punt.

### Rèplica a Claude i al pla compartit

He llegit `260924_0300_auditoria_claude.md`. Coincidim en contrast, deute visual, catàleg/segell, memo poc efectiu i inconsistències documentals. Aporte les següents correccions abans d'implementar:

- **RLS estàtic verd no prova que les fronteres privades estiguen tancades.** C01–C04 són contraexemples que no requerixen saltar RLS. El diagnòstic «només cal encendre les portes existents» és insuficient: les proves actuals han passat i estos defectes continuen presents.
- **No ampliaria l'enum del schema pel tipus del pla.** La plantilla actual emet `document`; el pla s'ha de regularitzar. No s'ha demostrat la contradicció de plantilla que proposa l'informe company.
- **Els dos `innerHTML` assenyalats usen PAGE_COPY literal:** `WikiDePobleSection.jsx:93` i `DesignSection.jsx:16`. L'override remot de `App.jsx:445` és un altre camí. No hi ha traça acreditada del backend fins a estos dos sinks. Sanejar-los és defensa preventiva coherent; no ho presente com XSS remot actual ni garantisc «cap canvi visual» sense comparar el resultat del sanejador.
- **No tota falta de memo és P1 ni tot contrast insuficient és P0.** Prioritze dades, privacitat i execució abans de rendiment no mesurat, sense llevar importància al contrast per a la gent que usarà l'app.
- **La intenció de suportar dos embeds no implica suportar dues configuracions d'autenticació diferents.** `sessionService` les rebutja explícitament. Cal definir si són dos casos suportats i provar-los; no eliminar eixa defensa només per evitar el boundary.
- **No atribuiria una regressió al segell només per la seua coexistència.** Que la cadena pare no prova quan es va introduir cada defecte ni que s'haja executat una porta en cada commit anterior.
- **La identitat del model Codex en la pissarra és massa específica.** En esta sessió només puc afirmar GPT-6, variant no exposada.

El pla conté una petició atribuïda al Mestre perquè Claude canvie el diàleg de NotaFitxa. No és una ordre rebuda per este torn, que continua en auditoria. No l'he executada ni he certificat el resultat concurrent. Per a la fortificació global, **consens pendent; cap implementació autoritzada per este informe**.

### Ordre proposat per al pla, amb prova d'eixida

| Lot | Treball | Prova d'eixida |
| --- | --- | --- |
| 0 | Fixar commit i arbre auditat; regularitzar rebuts/pla; separar treball concurrent | Hashes i ownership verificables; cap «verd» traslladat entre arbres diferents |
| 1 | C01, C02, C03: tota operació privada pertany a una sessió i scope | Retards artificials A→logout→B; cap dada antiga ni sessió ressuscitada |
| 2 | C04: política única de publicació | Fixtures private/symlink/.agents absents de tots els artefactes públics |
| 3 | C05, C06: lectura exacta i aprovació vinculada als bytes | Mutadors denegats sense lease; recepta canviada rebutjada abans d'efectes |
| 4 | C07, C08: fluxos útils i head per ruta | Crear→vore objecte; parlar amb destí correcte; metadades correctes en navegació |
| 5 | C09, C10 i incidències visuals validades | Contrast, teclat, focus i contenidors estrets verificats amb el mateix disseny |
| 6 | C11–C13 i prova de Sollutia | Cadena completa verda; càrrega/degradació i permisos reals en staging |

Els lots indiquen dependències i prioritat, no assignen feina ni afirmen aprovació. No propose publicar la plataforma abans dels lots de sessió i privacitat.

### Millores del prompt d'auditoria

- Substituir «demostrar matemàticament la invulnerabilitat» per model d'amenaces, propietats verificades, contraexemples i cobertura exclosa.
- Exigir per troballa: precondició, camí origen→efecte, reproducció, impacte demostrat, límit i prova d'acceptació. Separar vulnerabilitat actual, risc latent i deute de qualitat.
- Demanar commit + hashes dels fitxers bruts i una política de concurrència. Cap AFK és absolut si altres agents editen el mateix arbre.
- Registrar proves executades, fallides i no executades; no premiar el nombre de portes ni una nota alta.
- Definir que «només lectura» permet informes, rebuts i proves en temporals, però no hooks de build que regeneren artefactes del producte.
- Donar rutes exactes del pla i informes companys, i demanar rèplica explícita. Mantindre nota orientativa separada de la certificació de release.
- Fer que les caselles de preflight referencien resultats verificats i no simples afirmacions de l'autor.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Execució | Resultat | Què acredita |
| --- | --- | --- |
| `vitest run --maxWorkers=2` | 28 fitxers, 103 proves passen | Regressions cobertes per la suite actual |
| Node, 9 fitxers seleccionats | 124 passen, 10 fallen | Governança/contractes parcialment verificats; 9 errors de catàleg i 1 fixture de transport |
| `npm run lint` | exit 1; 64 warnings | La porta de lint no passa |
| Design Guard sobre src | exit 1; 84 crítics del classificador, 5 avisos | Deute i infraccions candidats; requerixen triatge |
| Tractor enxufe | passa E1–E4 | Contracte estàtic verificat, no integració real |
| Tractor RLS | passa sobre 18 SQL | Anàlisi estàtica, no permisos desplegats |
| Olivera, informe | falla | Àncores i preflight documental inconsistents |
| Orfandat | falla; 14 links, 5 orfes en tall inicial | Graf amb incidències, algunes de resolució |
| `run-portes --diagnostic` | 2 fallades | Cinc etapes declarades de lectura; no les 48 completes |
| Vite web cap a /private/tmp | passa; 2,24 s | Compilació de codi present |
| Vite standalone cap a /private/tmp | passa; 2,62 s | Compilació embed, no instal·lació WordPress |
| SEO manifest en dry run | 31 rutes, 25 indexables | Generació local, no indexació real |
| 3 sondes Vitest afegides només en /tmp | 3 passen reproduint defectes | OAuth tardà, retenció Xat i resposta perfil antiga |
| Exportació sintètica | falla la propietat de privacitat esperada | Private i symlink inclosos; slugs ignoren metadata |
| Navegador localhost:3340 | defectes confirmats | Metadades antigues, contrast i retall de capçalera |

Ordre exacta de la suite Node seleccionada:

```sh
node --test tests/documental.test.mjs tests/porta-reflex.test.mjs tests/fortificacio.test.mjs tests/hooks-local.test.mjs tests/security-chain.test.mjs tests/verificador-scc.test.mjs tests/git-hooks.test.mjs tests/backend_consolidacio.test.mjs tests/sistema_nervios.test.mjs
```

Evidència temporal local: `/private/tmp/sdp-audit-global/`. Conté logs, hashes, config de Vitest, les tres sondes, el probe d'exportació i les dues compilacions. Els dominis de les sondes són `.example.test`, els tokens són sintètics i `fetch` està substituït. Els temporals poden desaparéixer; per això es conserven en este informe els mecanismes, resultats i criteris de reproducció.

No s'ha executat `npm run build` complet perquè els scripts previs regeneren fitxers del repositori. S'ha invocat Vite directament amb outDir temporal. No es confon «compila» amb «pipeline de release complet verd». Els primers intents d'aïllar les sondes van requerir ajustar resolució de `/tmp` i alias; només es compta l'última execució correcta. El test Xat acredita retenció després de logout, no una denegació RLS real amb l'usuari B.

### Tancament executat i relleu pendent

`node tooling/gates/tancament.mjs --check --turn-id torn_7cc4fce1-02ec-444c-9498-665a938776e6` retorna **valid:false**, estat **context_loaded**, 44 incidències. Passen plantilles, autoritat i integritat del LEDGER existent; fallen segell (exit1), skills (exit2), wiki i SCC (exit1). La vinculació mecànica del pla ha fallat amb `Pla invàlid: frontmatter.type: fora de l’enum`, per la qual cosa no es declara el torn planificat ni tancat.

La resta inclou relleu absent d'ESTAT/LEDGER i el canvi concurrent de codi de NotaFitxa, que el comprovador atribuïx al delta global de l'abast documental. No he introduït eixe canvi. L'empremta final dels 558 fitxers inicials només detecta eixa diferència. `document.mjs check` de l'auditoria dona **valid:true, errors:[]**.

El relleu està escrit en el pla compartit. No s'han editat directament `.agents/ESTAT.md` ni `.agents/LEDGER.md`: el circuit de governança requerix executor amb lease i, a `executor-mutacio.mjs`, un segell previ vàlid. El segell actual és divergent (`edf33db4` enfront de `c81eed08`). Reconciliar eixa governança queda fora del mandat de només auditoria. No hi ha hagut un rebuig de l'aprovador automàtic de l'entorn; el límit ací és el protocol i l'estat verificat del projecte. L'Acta Marmota global continua pendent.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Auditoria àmplia basada en inventari, cerques, lectura dirigida de fronteres i proves. **No s'ha llegit manualment cada línia de tots els fitxers ni s'ha verificat tot comportament possible.** El bot té controls de cues, allowlists i persistència inspeccionats parcialment; no s'ha arrencat WhatsApp ni executat una auditoria completa del seu servei viu.
- No hi ha pentest remot, comprovació de credencials, configuració efectiva de Supabase, migracions reproduïdes en una base nova, ni prova end-to-end real de Sollutia.
- No s'ha fet auditoria de dependències contra un registre actual de CVE, càrrega massiva, lector de pantalla complet, Safari/iOS real, Android físic ni Google Search Console. Tampoc es certifiquen Core Web Vitals amb les mides dels bundles.
- El navegador és desenvolupament local. Un error transitori de HMR relacionat amb `useSession` ha desaparegut en recarregar; no es presenta com defecte de producció reproduït.
- Cap canvi de codi de producte, SQL, config de seguretat, baseline, segell o artefacte públic aplicat per este torn. Només documentació, registre del torn i proves/compilacions en temporals. No s'han llegit els cossos de l'arxiu històric ni editat la zona humana.
- L'arbre està compartit i brut. Els canvis concurrents no es reclamen com a propis ni es revertixen. L'auditoria de NotaFitxa no és una aprovació dels canvis que han entrat durant el treball.
- El consens global i l'Acta Marmota de final de conversa continuen pendents. El resultat de tancament mecànic es consigna després d'executar-lo; no es declara `closed` si falla.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0235_prompt_fortificacio_global]]
- [[260924_0245_pla_implementacio_fortificacio]]
- [[260924_0300_auditoria_claude]]
