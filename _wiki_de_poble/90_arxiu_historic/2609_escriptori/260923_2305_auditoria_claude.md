---
type: informe
status: esborrany
description: Estat real de l'ADR-2026-09 Model B contra el codi viu i de la fortificació C1-C9, amb portes executades i bretxa del confinament verificada
tags:
  - auditoria
visibility: private
reflex: sdp:torn_24ebd3e9-0a9a-44ab-b8be-c213c71750fe:88a9301c-66b1-48ff-84f2-acf59db5df0e
---
# Auditoria de la fortificació local i de l'enchufe amb Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_24ebd3e9-0a9a-44ab-b8be-c213c71750fe:88a9301c-66b1-48ff-84f2-acf59db5df0e |
| Versió | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T21:14:57.959Z |
| Modificació | 2026-09-23T21:58:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5 |
| Tokens consumits | no mesurat (el col·lector no registra consum) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23T21:14:57.959Z: esborrany creat; contingut i verificació pendents.
2026-09-23T21:31:00.000Z: troballes, verificació i límits completats. Tall d'evidència: HEAD f03affcb, branca backup-notes-publish.
2026-09-23T21:45:00.000Z: llegida l'auditoria de Codex de les 23:12. A6 reescrita perquè era falsa (la seua F2 tenia raó, verificat al disc). Afegida la rèplica d'Olivera i la nota del 109/109.
2026-09-23T21:58:00.000Z: segona passada. El prompt ha crescut (tasca 3 · Consola, i tres preguntes obertes amb petició de codi) i **l'arbre de treball també**: A1 i A6 estan tancades al disc des de la meua entrega. Reverificat tot el Bloc A contra el tall nou, afegits el Bloc C (refactorització de la Consola, codi exacte) i el Bloc D (respostes amb codi).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen en una línia

Les dos ferides P0 de l'ADR (backend injectable i comodí `*.supabase.co`) **s'han tancat al disc durant l'AFK**, i això obliga a dir la cosa important: ni la porta ni les 82 proves han notat el canvi — donen exactament el mateix verd abans i després de bescanviar el Model A pel Model B, així que res impedix desfer-ho demà sense que ningú se n'adone. El que queda obert és governança (tres documents, tres Sollutias), l'exemple d'integració que ara **mentix en silenci**, i una Frontissa que llig del domini que li diga la pàgina amfitriona.

---

### Bloc 0 · El tall d'evidència s'ha mogut

L'auditoria de les 23:31 es va escriure contra l'arbre de les 23:05. Entre les 23:31 i les 23:51 algú ha editat `src/host.js` i `src/PedraSecaEmbed.jsx`. No ho retrec —no hi havia ordre de congelar el disc, només de no tocar codi *a partir del consens*— però ho registre perquè canvia el significat de mitja auditoria:

- `git diff -- src/host.js` → `configura({ backend, auth })` passa a `configura({ auth })`, amb el comentari «Model B: només configurem política d'autenticació, backend innegociable». Desapareixen `validaBackendImplementation` de l'import i les dos línies que injectaven el backend.
- `git diff -- src/PedraSecaEmbed.jsx` → desapareix `const isSupabaseCo = uOrigin.endsWith('.supabase.co')`, i l'origen de `VITE_SUPABASE_URL` s'afig a la llista explícita.
- `git status --porcelain` → `A src/data/adaptadors/sollutia/client.js`: la Frontissa que jo vaig declarar inexistent (A3) ara existix i està indexada.

**Regla que em pose i que propose per a tots:** una auditoria en AFK val pel commit i l'hora que declara. Si l'arbre es mou, la troballa no es «desmenteix», es **reverifica**. Això és el que fa esta segona passada.

---

### Bloc A · L'ADR-2026-09 i l'enchufe amb Sollutia

#### A1 · TANCADA AL CODI, OBERTA A LA PORTA · El Model B ja es complix, i cap comprovació ho sap

- **Abast:** `src/host.js:117-121`, `src/host.js:136-150`, `src/data/backendPort.js:8-17`.
- **Estat nou:** `configura({ auth } = {})` només crida `setRuntimePolicy({ auth })`. `arrenca()` seguix consultant `getBackendImplementation()` (línia 138), però `setBackendImplementation` **no s'exposa enlloc**: `exposaGlobal` (línia 297) congela una API de deu claus i eixa no hi és. Des d'una pàgina amfitriona ja no hi ha cap camí per a injectar un backend. L'ADR es complix.
- **El problema que queda, i és el gros:** he executat `node tooling/gates/tractor-enxufe.mjs` **abans** (23:31, codi Model A) i **després** (23:51, codi Model B). Les dos voltes: `E1 ✅ E2 ✅ E3 ✅ E4 ✅ · «El port és abastable, el contracte quadra i el pany es tanca on toca»`. He executat `npm test` les dos voltes: **82/82 les dos**. S'ha canviat el model d'arquitectura que l'ADR declara innegociable i **cap de les dos xarxes de seguretat ha canviat ni un caràcter**.
- **Conseqüència:** la reversió a Model A és invisible. Qui torne a posar `backend` dins de `configura` passarà la porta, passarà les proves i passarà el pre-commit.
- **Severitat:** P0 de garantia (no de funcionament).
- **Proposta concreta:** una llei E5 a `tractor-enxufe.mjs` que llija `src/host.js`, extraga la signatura de `configura` i **exigisca** que el desestructurat no continga `backend`; i una prova de node que importe `host.js`, cride `configura({ backend: {…} })` i afirme que **llança**. Una porta que no s'ha demostrat capaç de posar-se roja no és una comprovació (`tests/fortificacio.test.mjs:1-3`).

#### A1b · P0 · L'exemple d'integració de Sollutia ara mentix en silenci

- **Abast:** `tooling/mocks/sollutiaBackend.js:75-84`.
- **Evidència:** `simulaInjeccioSollutia()` fa `const resultat = configura({ backend: mockSollutiaBackend })`. Amb la signatura nova, `backend` **es descarta sense error**: `configura` només llig `auth`. La funció imprimix «Resultat configuració», crida `arrenca()`, **monta Supabase** i retorna `true`. L'únic exemple del repositori que Sollutia copiaria diu que ha injectat el seu backend quan no ha injectat res.
- **Severitat:** P0 d'integració. Un no-op silenciós és pitjor que un rebuig: el rebuig s'arregla en cinc minuts; el silenci es descobrix en producció.
- **Proposta:** `configura` ha de ser *fail-closed* amb les claus desconegudes. Codi exacte al Bloc D2. I el mock: o s'actualitza a la crida que hui és legal, o se'n va a l'arxiu. Un exemple que no compila contra el contracte viu no és documentació, és una trampa.

#### A2 · P0 · Tres documents de govern situen Sollutia en tres llocs distints

Sense canvis des de les 23:31; és l'única troballa d'este bloc que ningú ha tocat.

- `ADR-2026-09 §Context B`: «Sollutia allotja el Web Component `<soc-de-poble>`».
- `.agents/LEDGER.md:15`: «S'elimina la consideració de Sollutia com a allotjament del frontend; la destinació final verificada és Firebase Hosting».
- `AGENTS.md §8` i `QUI_SOC.md §5`: «Sollutia ofereix el backend (Supabase)».
- **Severitat:** P0 documental. Resposta completa amb el text exacte a **D1**. `requires_human_decision: true`.

#### A3 · REVISADA · La Frontissa ja existix, i llig del domini que li diga la pàgina amfitriona

- **Abast:** `src/data/adaptadors/sollutia/client.js` (nou, indexat), `src/config/runtimePolicy.js:29-41`, `src/PedraSecaEmbed.jsx:142-217`.
- **El que ja està bé:** `ESCRIPTURES_PERMESES = []` existix i és cert; `method: 'GET'` i `credentials: 'omit'` són els que l'ADR demana.
- **Defecte 1 · L'emissor no és una adreça de dades.** `llig()` fa `new URL(recurs, policy.auth.issuer)`. `auth.issuer` és **l'emissor de sessions** —qui signa els JWT que `adoptaSessioExterna` accepta— i arriba de `configura({auth:{issuer}})` o de l'atribut HTML `sollutia-issuer`. Fer-lo servir de base de lectura de dades fon dos autoritats distintes en un sol camp: qui puga escriure l'HTML de la pàgina amfitriona tria d'on llig el producte.
- **Defecte 2 · Fuga d'origen.** `new URL(recurs, base)` amb un `recurs` absolut **ignora la base**. `llig('https://on-siga/x')` ix del domini sense que res ho pare. No hi ha comprovació de `endpoint.origin === base.origin`.
- **Defecte 3 · Sense temps màxim, sense `redirect: 'error'`, sense comprovar `content-type`.** Una redirecció 302 cap a un altre origen la seguix el `fetch` per defecte; una resposta `text/html` entra a `res.json()` i peta on no toca.
- **Severitat:** P1. **Proposta:** client enter reescrit a **D2**, amb camp propi `frontissa.origen` a la política, separat de `auth.issuer`.

#### A4 · P1 · La Porta Adaptadors ha certificat la Frontissa sense mirar-la

- `tooling/gates/tractor-adaptadors.mjs:38-42` busca `POST|PUT|PATCH|DELETE`, DDL i `service_role` dins de `src/data/adaptadors/sollutia/`.
- **Executat a les 23:51, amb `client.js` ja al disc:** `✅ [FRONTISSA] Frontera neta · Sollutia només lectura · 1 contracte(s) capturat(s) validat(s)`. **Exactament el mateix verd que a les 23:31, quan la carpeta no tenia cap client.**
- És el mateix patró que A1: el verd és cert i no significa res. La porta no mira ni l'origen, ni el `redirect`, ni si `ESCRIPTURES_PERMESES` es consulta enlloc (no es consulta: és una constant exportada que no llig ningú).
- **Proposta:** F2 ha d'exigir, a més, que existisca client, que declare `ESCRIPTURES_PERMESES`, que cada `fetch` du `redirect: 'error'` i que la base no vinga de `auth.issuer`.

#### A5 · P2 · La «Porta de la Frontera» ja no mira la frontera

Sense canvis. `tooling/gates/tractor-sollutia.mjs`: S2 (INSTANCIA-UNICA), l'única llei que mirava el Web Component, està retirada (línia 107, capçalera buida). S1 escaneja `index.html + wordpress-plugin/**`, i `wordpress-plugin/` està gitignorat: en local mira dos superfícies, en un clon net i a la CI en mira una, i no ho diu. **Proposta:** o es renomena a «Porta de Tokens i Build», o se li torna una llei que mire la costura de veres.

#### A6 · TANCADA · El comodí `*.supabase.co` ja no hi és; el que queda és una llista per a quatre papers distints

- **Abast:** `src/PedraSecaEmbed.jsx:160-217`.
- **Estat nou (verificat al diff):** la línia `uOrigin.endsWith('.supabase.co')` ha desaparegut. `ORIGENS_PERMESOS` són tres orígens explícits, més `new URL(import.meta.env.VITE_SUPABASE_URL).origin` si existix, més localhost en `DEV`. La meua troballa i la F2 de Codex estan ateses.
- **El que queda obert, i és un defecte de disseny, no una recaiguda:**
  1. **Una sola llista per a quatre papers.** `supabaseUrl`, `botApiUrl`, `oauthRelayUrl` i `sollutiaIssuer` comparteixen filtre (línia 201). Qui escriga l'HTML pot **intercanviar-los**: apuntar l'emissor de sessions al projecte Supabase i el backend al domini de Sollutia. Tots quatre passen perquè tots quatre són «de la llista».
  2. **Quarta grafia del domini.** Ací: `socdepoble.sollutia.com` i `socdepoble.sollutia.cat`. A `runtimePolicy.js:71-74`: `sollutia.cat` i `socdepoble.sollutia.com`. A `public/auth/callback.html`: `sollutia.cat` i `socdepoble.sollutia.com`. Tres fitxers, tres llistes, cap idèntica. Ningú sap quin domini s'ha acordat.
  3. **Rebuig silenciós.** `delete net[field]` sense una sola línia de consola. Si `VITE_SUPABASE_URL` no existix en temps de compilació —i el bundle standalone ha tingut `import.meta.env` buit històricament— l'atribut `supabase-url` de l'amfitrió **s'esborra sempre** i l'integrador no sap per què no funciona.
  4. **`basePath` i `pluginUrl` no passen per cap llista d'orígens** (només pel filtre de protocol de la línia 195). `resolveAsset` (`src/config/assetResolver.js:40-42`) usa `pluginUrl` com a base de **totes** les imatges. `plugin-url="https://on-siga"` desvia tota la media de la pàgina. No és execució de codi; és marcatge i defacement. P2.
- **Codi exacte de la solució a D3.**

#### A7 · Tancat en verd, amb una esmena de Codex acceptada

`public/auth/callback.html:88-102` compara `u.hostname` amb `===` contra quatre amfitrions i localhost només si el propi document és localhost. `adoptaSessioExterna` (`src/data/identitat.js:255-325`) és fail-closed de veres (issuer, `iss`, `aud`, `sub` uuid, caducitat, `user_metadata` filtrada per allowlist de quatre camps). **Esmena que accepte de Codex:** compara *hostname*, no origen, així que `https://sollutia.cat:444` hi entra. Un port no és un detall: un port és una altra aplicació.

#### A8 · P2 · `parentOrigins` només pot ampliar la llista blanca, mai reduir-la

- `src/config/runtimePolicy.js:62-94`: `esOrigenPermes` retorna `true` per a `socdepoble.org`, `auth.socdepoble.org`, `sollutia.cat` i `socdepoble.sollutia.com` **abans** de consultar `_policy.auth.parentOrigins` (línia 83). Un desplegament que passe `parentOrigins: []` per a tancar-se seguix confiant en Sollutia.
- Les quatre línies cablejades comparen **hostname** (`h === 'sollutia.cat'`); la comprovació dinàmica, en canvi, ja compara origen sencer (`u.origin === new URL(po).origin`). La part nova està ben feta i la vella no, dins de la mateixa funció.
- **Impacte:** `src/host.js:307-370` accepta ordres `SDP_HOST_CMD` (`injectaSessio`, `expulsaSessio`, `arrenca`) de qualsevol d'eixos orígens.
- **Tancat des de les 23:31:** el `postMessage` de la línia 375 ja només emet `{fase, configurable}` (`estatSegur`), no l'estat sencer. Eixa fuita menor està resolta.
- **Proposta:** que `auth.parentOrigins`, quan es done explícitament, **substituïsca** la llista cablejada, i que les quatre línies comparen `u.origin`.

---

### Bloc B · La fortificació local

#### B1 · P0 · El confinament de la shell es travessa amb un punt i coma

Sense canvis. `tooling/gates/mutation-policy.mjs:24-32`: l'allowlist casa per prefix amb cua lliure (`( [a-zA-Z0-9_./-]+)*$` per a `git`, `npm run porta`, `node tooling/gates/*.mjs`). El `;` és una cosa després d'un espai. **Provat en execució a les 23:2x** amb càrrega inofensiva (`git status --porcelain -uno ; echo …`): el hook autoritza i **les dos ordres s'executen**. Agreujant: la línia 30 accepta qualsevol `node tooling/gates/executor-mutacio.mjs <el que siga>`, de manera que la regla estricta de `hooks-local.mjs:77` (exactament dos arguments) no arriba a manar mai. **Proposta:** igualtat exacta contra llista tancada, o parseig rebutjant tot operador, i traure `executor-mutacio.mjs` del patró genèric.

> **Matís que done a Codex (la seua esmena a B4).** Té raó: `pwd ; id` i `npm test | id` ja fallen, perquè la línia 25 rebutja `[&|;<>$` \\]` per a **tota** ordre. El forat és de composició: la regla general rebutja el `;`, i les regles de prefix de les línies 28-31 s'avaluen *després* i tornen `true` pel seu compte. Les proves negatives han de cobrir els prefixos, no les ordres nues.

#### B2 · MIG TANCADA · Les tres peces de la fortificació ja estan a l'índex, encara no al repositori

- `git status --porcelain -uall -- tooling/gates` (23:51) → `A tooling/gates/executor-mutacio.mjs`, `A tooling/gates/git-staged.mjs`, `A tooling/gates/mutation-policy.mjs`. Han passat de `??` a `A`. Estan *staged*, no *committed*.
- Mentres no hi haja commit, un clon net seguix sense `mutation-policy.mjs`, i `hooks-local.mjs:10` l'importa: la importació peta, el hook PreToolUse ix amb codi ≠ 0 i **tota crida d'eina queda bloquejada**. La fortificació no protegiria: paralitzaria.
- **Proposta:** commit. És la condició prèvia de tot este bloc i ara només falta prémer.

#### B3 · P0 · La CI continua roja per construcció

- `git status --porcelain -uall -- tests` (23:51) → `?? tests/git-hooks.test.mjs`, `?? tests/security-chain.test.mjs`. **Seguixen sense versionar.**
- `.github/workflows/wiki-integrity.yml:40` els nomena els dos per nom dins de `node --test`. El primer pas del job falla a GitHub abans d'arribar a `npm run gate`.
- Es resol amb el mateix commit de B2, i **només si s'hi inclouen els tests**. Posar els scripts i deixar-se les proves fa la CI igual de roja.

#### B4 · P1 · Cap prova cobrix la bretxa de B1

`tests/hooks-local.test.mjs:33,76` només afirma que `pwd` s'accepta i que amb el context trencat es denega. Cap cas amb prefix + operador. **Proposta:** tres casos negatius escrits **abans** de tocar cap regex —`git status --porcelain ; id`, `npm run porta && id`, `node tooling/gates/segella.mjs --update`— perquè es veja que passen a roig. L'últim és de Codex i és el millor dels tres: una bandera mutadora dins d'un prefix de lectura.

#### B5 · P2 · L'allowlist de lectura només coneix `tooling/gates/`, i la cadena viu en quatre carpetes

`mutation-policy.mjs:30-31` admet `node tooling/gates/*.mjs` i `node tooling/wiki/document.mjs`. La cadena crida també `tooling/verify-ledger.mjs`, `tooling/wiki/tractor-frontera-auth.mjs`, `tooling/wiki/tractor-cognitiu.mjs`, `tooling/wiki/reflex_petorreta.mjs`, `tooling/brain/tractor-pedra-seca.mjs`, `tooling/wiki/llaurador_indexs.mjs`, `tooling/wiki/tractor-frontmatter.mjs`, `tooling/wiki/tractor-nomenclatura.mjs` i `tooling/wiki/teixidor.mjs`. **Verificat:** `node tooling/wiki/tractor-frontera-auth.mjs` → BLOQUEIG. Un agent confinat pot executar la cadena sencera (60 passos amb build i lint) però no pot aïllar-ne 9 portes per a diagnosticar. Això empeny cap a l'execució total o cap a la bretxa de B1.

#### B6 · P2 · El `segell-auto` de PostToolUse crida a cada operació i sempre falla

Cada lectura i cada ordre d'esta sessió ha tornat «[segell-auto] Origen no acreditat: segell divergent; cap resegellat automàtic». PostToolUse no pot aturar el que ja s'ha fet: és soroll constant que ensinistra a ignorar els avisos de la fortificació. No propose tocar-ho: el resegellat és zona de governança.

#### B7 · P1 · El confinament prohibix la verificació que el prompt demana

El prompt fixa `http://localhost:3340` com a URL de proves. El hook `PreToolUse` de `.claude/settings.json` no té `matcher`: s'aplica a **totes** les eines, i `knownRead` (`mutation-policy.mjs:20-22`) només coneix `Read`, `Glob`, `Grep`, `Bash` i quatre àlies. Qualsevol eina de navegador ix per la branca «Eina opaca» i es denega. **Tot el Bloc C està raonat contra el codi i el full d'estils, no contra píxels.** Qui ho aplique ha d'obrir el navegador ell.

---

### Bloc C · Refactorització de la Consola Termodinàmica

Ordre del Mestre: fora pestanyes, model de targetes, entradilla amb finalitat, avís de saturació, resum visual i gràfic, Instantània a dalt, Refrescar centrat, i **exclusivament targetes del sistema de disseny**.

#### C0 · La troballa prèvia: hi ha quatre famílies de targeta i cap d'elles mana

| Família | On viu | Vora | Ombra | Radi | Component |
| --- | --- | --- | --- | --- | --- |
| `.sp-card` | `src/css/components.css:551` | cap | `--sdp-ombra-2` permanent | `--sdp-radi-m` | `UniversalCard` (`Targeta`) |
| `.sdp-indicator-card` | `src/css/modules.css:1135` | 1px transparent | `--sdp-ombra-2` permanent | `--sdp-radi-g` | `UniversalIndicatorCard` |
| `.stat-card` | `src/css/modules.css:1242` | 1px `--sdp-vora` | `--sdp-ombra-1` permanent | `--sdp-radi-s` | **cap: maqueta solta** |
| `.sdp-consola__xifra` | `src/css/components.css:366` | 1px `--sdp-vora` | cap | `--sdp-radi-m` | **cap: local de la Consola** |

Quatre superfícies que volen dir «targeta», amb tres radis, tres ombres i tres vores. Canviar-ne una no en canvia cap altra: exactament el que el Mestre vol evitar. A més, les tres primeres porten `box-shadow` permanent i `sdp-pedra-seca §5` diu que «les targetes normals se separen amb vores o color de fons, **no amb ombra permanent**»: el full d'estils contradiu el reglament, i això és un cas per al Mestre, no per a mi.

**El que NO faig i per què:** `.sp-card` (la targeta mestra) té `max-width: 500px; margin: 0 auto 32px` i capçal taronja / peu blau. Ficar-hi els panells de la Consola —que són taules amples— els capa a 500px i els pinta amb el crom d'una targeta de mur. **La targeta mestra no és una targeta de quadre de comandament.** Per a un panell de control el sistema ja té la peça correcta, i el catàleg ho diu amb estes paraules: `UniversalIndicatorCard` → «Per a filtres o panells d'un quadre de comandament» (`EspecimenIndicador.jsx:25`).

**Decisió, doncs:** dos famílies i cap de nova.
- `Estadistica` (`.stat-card`) per als números del resum.
- `UniversalIndicatorCard` (`.sdp-indicator-card`) per a les quatre targetes de panell.
- El detall llarg (taules) va dins del `Dialeg` que la Consola ja obri per a les fonts dels rebuts.

I un acte d'unificació, que és el que el Mestre demana literalment quan diu «si no existeixen, unifiqueu-les»: **`.stat-card` puja de maqueta a component**. Hui el mateix marcatge està escrit a mà al catàleg i reinventat a la Consola amb un altre nom. Amb el component, canviar `.stat-card` els canvia tots.

#### C1 · Fitxer nou · `src/components/PedraSeca/organismes/Estadistica.jsx`

El DOM és **caràcter per caràcter** el de la maqueta del catàleg: la pàgina de disseny no es mou ni un píxel.

```jsx
/**
 * Estadistica.jsx — la targeta d'estadística del sistema (.stat-card).
 *
 * La maqueta vivia solta al catàleg (EspecimenIndicador.jsx:34-40) i
 * reinventada a la Consola (.sdp-consola__xifra). Ara és un sol component:
 * qui toque .stat-card a modules.css els canvia tots alhora.
 *
 * No porta estils inline ni classes pròpies (sdp-pedra-seca §7).
 */
export function Estadistica({ icona = null, valor, etiqueta, className = '' }) {
  return (
    <div className={['stat-card', className].filter(Boolean).join(' ')}>
      {icona ? <div className="stat-icon">{icona}</div> : null}
      <div className="stat-info">
        <div className="stat-value">{valor}</div>
        <div className="stat-label">{etiqueta}</div>
      </div>
    </div>
  );
}
```

#### C2 · Façana · `src/components/PedraSeca/index.js`

Una línia, davall de `UniversalIndicatorCard`:

```js
export { UniversalIndicatorCard } from './organismes/UniversalIndicatorCard.jsx';
export { Estadistica } from './organismes/Estadistica.jsx';
```

#### C3 · Catàleg · `src/sections/disseny/cataleg/detalls/EspecimenIndicador.jsx`

Per `sdp-pedra-seca §9`, el manual mana. Les dos maquetes passen a consumir el component; l'eixida visual és idèntica.

```jsx
import { Especimen } from '../Especimen.jsx';
import { UniversalIndicatorCard, Estadistica } from '../../../../components/PedraSeca/index.js';

/* … el bloc d'UniversalIndicatorCard no es toca … */

      <h4>Targeta d’estadística</h4>
      <Estadistica icona={<Users size={16} aria-hidden="true" />} valor="5.847" etiqueta="Habitants" />

      <h4>Graella d’estadístiques</h4>
      <div className="stat-grid">
        {ESTADISTIQUES.map(([Icona, valor, etiqueta]) => (
          <Estadistica key={etiqueta} icona={<Icona size={16} aria-hidden="true" />} valor={valor} etiqueta={etiqueta} />
        ))}
      </div>
```

I al `descripcio` de l'`Especimen`, canviar «la maqueta de targetes d'estadística (stat-card) heretada de la pàgina de Fonaments» per «la targeta d'estadística (`Estadistica`), que és el component del sistema per a un número amb etiqueta».

#### C4 · Font de dades · `tooling/vite/consola-iaia.mjs`

La Consola no pot avisar de saturació perquè **hui no compta artefactes**. El que hi ha és `segell.filesCount`, i eixe número és **19**: són les skills segellades, no el cervell. Un llindar de 150 sobre 19 no vol dir res. Perquè l'avís siga honest, la font l'ha de calcular:

```js
/* Artefactes del cervell: fitxers reals davall de .agents/. És el número
   que creix sol (un JSON per torn, un rebut per context) i el que satura
   el context d'arrencada. No compta enllaços simbòlics: no hi ha bucles. */
const EXCLOU_CERVELL = new Set(['node_modules', '.git', 'locks']);

function comptaArtefactes(dir, prof = 0) {
  if (prof > 6) return 0;
  let entrades;
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  let n = 0;
  for (const e of entrades) {
    if (EXCLOU_CERVELL.has(e.name)) continue;
    if (e.isDirectory()) n += comptaArtefactes(path.join(dir, e.name), prof + 1);
    else if (e.isFile()) n += 1;
  }
  return n;
}
```

I dins de `recullConsola()`, just abans del `return`:

```js
  let cervellEntrades = [];
  try { cervellEntrades = fs.readdirSync(AGENTS_DIR, { withFileTypes: true }); } catch { /* sense cervell */ }
  const cervell = {
    artefactes: comptaArtefactes(AGENTS_DIR),
    perCarpeta: cervellEntrades
      .filter((e) => e.isDirectory() && !EXCLOU_CERVELL.has(e.name))
      .map((e) => ({ carpeta: e.name, n: comptaArtefactes(path.join(AGENTS_DIR, e.name), 1) }))
      .sort((a, b) => b.n - a.n)
  };
```

…i afegir `cervell,` a l'objecte retornat, entre `segell` i `immunitari`.

> **El que NO li pose, i és una decisió del Mestre.** «Base de dades diària i per sessió per a l'Acta Marmota» **no es pot fer només amb això**: `.agents/.diari_sessio.jsonl` és un sol fitxer que es reescriu, així que no hi ha història per sessió, i les entrades `consum.tokens` **no existixen** (el diari no en té cap: `consola-iaia.mjs:51-52` ho diu al comentari). Per a tindre la base de dades caldria rotar el diari (`.agents/diari/AAMMDD_HHMM.jsonl`) i que algú escriga els consums. Això toca `tooling/brain/`, que és cervell, i no ho faig sense ordre. `requires_human_decision: true`.

#### C5 · Transformació de dades · `src/sections/consola/consolaContent.js`

Tres afegits. Cap toca el que ja hi ha.

```js
/** Llindar de saturació del cervell. Un sol lloc, perquè el canvie qui mane. */
export const LLINDAR_ARTEFACTES = 150;
```

Dins de `normalitza()`, davall del bloc del `segell` (el `null` és deliberat: un servidor antic no inventa un zero):

```js
  let cervell = null;
  if (b.cervell != null) {
    const c = objecte(b.cervell, 'cervell');
    cervell = {
      artefactes: numero(c.artefactes, 'cervell.artefactes', true),
      perCarpeta: llista(c.perCarpeta ?? [], 'cervell.perCarpeta').map((v, i) => {
        const f = objecte(v, `cervell.perCarpeta[${i}]`);
        return {
          carpeta: text(f.carpeta, `cervell.perCarpeta[${i}].carpeta`),
          n: numero(f.n, `cervell.perCarpeta[${i}].n`, true)
        };
      })
    };
  }
```

…i `cervell,` dins del `return` (entre `segell` i `immunitari`).

I la sèrie diària, que és l'únic gràfic que es pot pintar amb dades reals: els rebuts porten `t`.

```js
const DIA = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Rebuts per dia local, finestra tancada de `dies` dies fins a `ara`.
 * Els dies sense activitat tornen 0: són part de la mesura, no un forat.
 */
export function perDia(rebuts, dies = 7, ara = new Date()) {
  const finestra = [];
  for (let i = dies - 1; i >= 0; i -= 1) {
    const d = new Date(ara);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    finestra.push(DIA(d));
  }
  const compte = new Map(finestra.map((k) => [k, 0]));
  for (const r of rebuts) {
    if (!r.t) continue;
    const d = new Date(r.t);
    if (Number.isNaN(d.getTime())) continue;
    const k = DIA(d);
    if (compte.has(k)) compte.set(k, compte.get(k) + 1);
  }
  return finestra.map((dia) => ({ dia, n: compte.get(dia) }));
}
```

**Prova que hauria d'acompanyar-ho** (`src/sections/consola/consolaContent.test.js`, vitest, com les de Notes): que `perDia([], 7)` torne set zeros; que un rebut d'ahir caiga a la casella d'ahir i no a la d'avui; i que un `t` invàlid no tombe la funció.

#### C6 · La secció · `src/sections/consola/ConsolaSection.jsx`

Fitxer sencer. Els quatre `Panell*` no canvien de lògica: canvien de lloc (de pestanya a diàleg) i els dos `sdp-consola__resum` passen a `stat-grid` amb `Estadistica`.

```jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw, Brain, ShieldCheck } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Dialeg, Taula, Insignia, EstatBuit, Carregant, Progres,
  Graella, UniversalIndicatorCard, Estadistica
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import {
  carregaConsola, resumSkills, resumConsums, perDia, curt, dataLocal, LLINDAR_ARTEFACTES
} from './consolaContent.js';

/* ── Peces internes (sense classes noves fora de sdp-consola__*) ─────────── */

const Mono = ({ children }) => <code className="sdp-consola__mono">{children}</code>;

const n = (x, locale) => Number(x).toLocaleString(locale);

/* ── Panells: ara són el contingut del diàleg, no d'una pestanya ─────────── */

function PanellConsums({ consums, locale }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <Mono>.agents/.diari_sessio.jsonl</Mono> no conté cap entrada <Mono>consum.tokens</Mono>.
        Quan un agent en registre, apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  return (
    <>
      <div className="stat-grid">
        <Estadistica valor={n(total.entrada, locale)} etiqueta="Tòkens d'entrada" />
        <Estadistica valor={n(total.eixida, locale)} etiqueta="Tòkens d'eixida" />
        <Estadistica valor={n(consums.length, locale)} etiqueta="Sessions" />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Sessions</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <th scope="row">{a.agent}</th>
              <td>{n(a.sessions, locale)}</td>
              <td>{n(a.entrada, locale)}</td>
              <td>{n(a.eixida, locale)}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa:
        quan hi haja font (§3.6 de l'auditoria 260920_0300), es connecta ací.
      </EstatBuit>
    );
  }
  return (
    <div className="sdp-consola__llista">
      {credits.map((c) => (
        <Progres key={c.proveidor} etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit} max={c.limit} />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, locale, onVeure }) {
  if (rebuts.length === 0) {
    return (
      <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
        El diari de sessió no té entrades <Mono>matrix.rebut</Mono>.
      </EstatBuit>
    );
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Petició</th>
          <th scope="col">Protocol</th>
          <th scope="col">Fonts</th>
          <th scope="col"><span className="sdp-nomes-lector">Accions</span></th>
        </tr>
      </thead>
      <tbody>
        {rebuts.map((r, i) => {
          const quan = dataLocal(r.t, locale);
          return (
            <tr key={`${r.t}-${r.peticio}-${i}`}>
              <td>{quan}</td>
              <td><Mono>{curt(r.peticio)}</Mono></td>
              <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
              <td>{r.fonts.length}</td>
              <td>
                <Boto varietat="fantasma" onClick={() => onVeure(r)} aria-label={`Veure les ${r.fonts.length} fonts del rebut de ${quan}`}>
                  Veure fonts
                </Boto>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell, locale }) {
  const { total, orfes, fantasmes, nucli } = resumSkills(skills);
  return (
    <>
      <div className="stat-grid">
        <Estadistica valor={n(total, locale)} etiqueta="Skills" />
        <Estadistica valor={n(nucli.length, locale)} etiqueta="Nucli (core)" />
        <Estadistica valor={n(orfes.length, locale)} etiqueta="Orfes (disc sense manifest)" />
        <Estadistica valor={n(fantasmes.length, locale)} etiqueta="Fantasmes (manifest sense disc)" />
      </div>
      {segell ? (
        <p className="sdp-consola__segell">
          Segell <Mono>{curt(segell.hash)}</Mono> · {segell.filesCount} fitxers · {dataLocal(segell.timestamp, locale)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa className="sdp-taula--llarga">
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">{s.core ? <strong>{s.nom}</strong> : s.nom}</th>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="neutre">sense estat</Insignia>}</td>
              <td>{s.alManifest ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">no</Insignia>}</td>
              <td>{s.alDisc ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">esborrat</Insignia>}</td>
              <td>{s.descripcio}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* ── Entradilla: què és açò, i el número que importa ─────────────────────── */

function Resum({ dades, locale }) {
  const { total } = resumConsums(dades.consums);
  const { total: skills } = resumSkills(dades.skills);
  return (
    <div className="stat-grid">
      <Estadistica icona={<Brain size={16} aria-hidden="true" />}
        valor={dades.cervell ? n(dades.cervell.artefactes, locale) : '—'}
        etiqueta="Artefactes al cervell" />
      <Estadistica icona={<Puzzle size={16} aria-hidden="true" />}
        valor={n(skills, locale)} etiqueta="Skills al cens" />
      <Estadistica icona={<Receipt size={16} aria-hidden="true" />}
        valor={n(dades.rebuts.length, locale)} etiqueta="Rebuts Matrix" />
      <Estadistica icona={<ShieldCheck size={16} aria-hidden="true" />}
        valor={n(dades.immunitari.operacions, locale)} etiqueta="Operacions immunitàries" />
      <Estadistica icona={<Activity size={16} aria-hidden="true" />}
        valor={n(total.entrada + total.eixida, locale)} etiqueta="Tòkens registrats" />
    </div>
  );
}

/* El gràfic és de barres natives (Progres): zero CSS nova, zero dependències.
   El percentatge que pinta cada barra és respecte del dia més actiu de la
   finestra, i per això l'etiqueta porta sempre el número absolut. */
function Activitat({ rebuts, locale }) {
  const dies = useMemo(() => perDia(rebuts, 7), [rebuts]);
  const max = Math.max(1, ...dies.map((d) => d.n));
  return (
    <section aria-labelledby="consola-activitat">
      <h2 id="consola-activitat">Activitat dels últims set dies</h2>
      {dies.map((d) => (
        <Progres key={d.dia}
          etiqueta={`${new Date(`${d.dia}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.n} rebuts`}
          valor={d.n} max={max} />
      ))}
    </section>
  );
}

/* ── Secció ─────────────────────────────────────────────────────────────── */

export function ConsolaPanells() {
  const { locale } = useUIState();
  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);
  const [panellObert, setPanellObert] = useState(null);
  const enCurs = useRef(null);                      // AbortController de la càrrega viva

  /* Una sola càrrega viva: refrescar cancel·la l'anterior i desmuntar cancel·la l'última. */
  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    carregaConsola(ac.signal)
      .then((d) => { if (ac.signal.aborted) return; setDades(d); setError(null); setEstat(d ? 'ready' : 'absent'); })
      .catch((e) => { if (ac.signal.aborted) return; setError(e); setEstat('error'); });
  }, []);

  useEffect(() => {
    carrega();
    return () => enCurs.current?.abort();
  }, [carrega]);

  const panells = dades ? [
    {
      id: 'consums', titol: 'Consums', icona: Activity,
      resum: dades.consums.length ? `${n(dades.consums.length, locale)} sessions registrades` : 'Sense cap registre',
      contingut: <PanellConsums consums={dades.consums} locale={locale} />
    },
    {
      id: 'credits', titol: 'Crèdits', icona: Coins,
      resum: dades.credits ? `${dades.credits.length} proveïdors` : 'Sense font al repositori',
      contingut: <PanellCredits credits={dades.credits} />
    },
    {
      id: 'rebuts', titol: 'Rebuts Matrix', icona: Receipt,
      resum: `${n(dades.rebuts.length, locale)} lectures acreditades`,
      contingut: <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} />
    },
    {
      id: 'skills', titol: 'Skills', icona: Puzzle,
      resum: `${n(dades.skills.length, locale)} al cens`,
      contingut: <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} />
    }
  ] : [];

  const obert = panells.find((p) => p.id === panellObert) ?? null;
  const missatgeError = error?.message || String(error);
  const saturat = dades?.cervell && dades.cervell.artefactes > LLINDAR_ARTEFACTES;

  return (
    <>
      <div className="sdp-consola">
        <div className="sdp-consola__capcal">
          {dades?.generat ? (
            <p className="sdp-consola__instantania">
              Instantània: {dataLocal(dades.generat, locale)} · {dades.immunitari.operacions} operacions immunitàries
            </p>
          ) : null}
          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={carrega}>
            Refrescar
          </Boto>
        </div>

        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

        {estat === 'absent' ? (
          <EstatBuit titol="Consola no disponible en este entorn">
            El servidor no exposa <Mono>/__iaia/consola.json</Mono>. La consola només existix al servidor
            de desenvolupament (plugin <Mono>sdp:consola-iaia</Mono>).
          </EstatBuit>
        ) : null}

        {estat === 'error' && !dades ? (
          <EstatBuit titol="No s'ha pogut llegir la consola">
            <pre className="sdp-consola__mono">{missatgeError}</pre>
          </EstatBuit>
        ) : null}

        {estat === 'error' && dades ? (
          <Alerta to="error" titol="No s'ha pogut refrescar">
            Es mostra l'última instantània bona. <Mono>{missatgeError}</Mono>
          </Alerta>
        ) : null}

        {saturat ? (
          <Alerta to="avis" titol="El cervell està saturat">
            {n(dades.cervell.artefactes, locale)} fitxers davall de <Mono>.agents/</Mono>, per damunt del
            llindar de {LLINDAR_ARTEFACTES}. Les carpetes que més pesen:{' '}
            {dades.cervell.perCarpeta.slice(0, 3).map((c) => `${c.carpeta} (${c.n})`).join(', ')}.
          </Alerta>
        ) : null}

        {dades ? (
          <>
            <Resum dades={dades} locale={locale} />
            <Activitat rebuts={dades.rebuts} locale={locale} />
            <Graella minWidth="16rem" gap={6}>
              {panells.map((p) => (
                <UniversalIndicatorCard key={p.id}
                  icon={<p.icona size={24} aria-hidden="true" />}
                  title={p.titol}
                  subtitle={p.resum}
                  onClick={() => setPanellObert(p.id)} />
              ))}
            </Graella>
          </>
        ) : null}
      </div>

      <Dialeg
        obert={obert !== null}
        onTanca={() => setPanellObert(null)}
        titol={obert ? obert.titol : ''}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setPanellObert(null)}>Tancar</Boto>}
      >
        {obert ? obert.contingut : null}
      </Dialeg>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <Taula titol="Fonts del rebut" densa>
            <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
            <tbody>
              {rebutObert.fonts.map((f) => (
                <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Dialeg>
    </>
  );
}

export default function ConsolaSection() {
  const { t } = useUIActions();
  const titol = t('section.consola.title', 'Consola Termodinàmica');
  const lead = t('section.consola.lead',
    "Ací es veu, d'un colp d'ull, l'estat termodinàmic de l'eixam: quant ha crescut el cervell, "
    + "quines lectures s'han acreditat, quines skills hi ha al cens i què ha fet el sistema immunitari. "
    + "Serveix per a avisar de saturació abans que embosse el context i per a donar números, no impressions, "
    + "a l'Acta Marmota de final de jornada.");
  useSEO({ title: titol, description: lead });

  return (
    <UniversalPage
      title={titol}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={lead}
      chrome="system"
    >
      <ConsolaPanells />
    </UniversalPage>
  );
}
```

#### C7 · Full d'estils · `src/css/components.css`

Dos canvis, i cap token nou. El primer centra l'entradilla i el botó (l'ordre del Mestre); el segon esborra el que queda mort.

```css
  /* ── CONSOLA TERMODINÀMICA ────────────────────────────────────────── */
  .sdp-consola__capcal {
    display: flex; flex-direction: column; align-items: center; gap: var(--sdp-space-4);
    margin-bottom: var(--sdp-space-6); padding-bottom: var(--sdp-space-4);
    border-bottom: 2px solid var(--sdp-vora);
    text-align: center;
  }
  .sdp-consola__instantania, .sdp-consola__segell { margin: 0; color: var(--sdp-text-suau); font-weight: 700; }
  .sdp-consola__segell { margin-bottom: var(--sdp-space-4); }
  .sdp-consola__mono { font-family: var(--sdp-font-mono); font-size: 0.9em; overflow-wrap: anywhere; }
  .sdp-consola__llista { display: flex; flex-direction: column; gap: var(--sdp-space-4); }
```

S'esborren `.sdp-consola__resum`, `.sdp-consola__xifra`, `.sdp-consola__xifra-valor` i `.sdp-consola__xifra-etiqueta` (línies 362-372): ja no les usa ningú, i deixar-les seria la cinquena família de targeta.

#### C8 · El que este canvi costa, dit clar

1. **Els números canvien d'aspecte.** `.sdp-consola__xifra` era una columna centrada amb el número en `--sdp-text-h2`; `.stat-card` és una fila d'icona + número de `1.5rem`. És un canvi visual **ordenat pel Mestre**, no una fuita de la Llei del Píxel, però s'ha de saber abans d'aplicar-lo.
2. **Dos targetes buides seguiran buides.** Consums i Crèdits no tenen font (`credits: null` sempre, `consum.tokens` mai escrit). El model de targetes no ho arregla: el que fa és **traure-ho a la cara** en compte d'amagar-ho darrere d'una pestanya. Això és el que jo recomane: el subtítol de la targeta diu «Sense font al repositori» sense que calga clicar.
3. **El detall passa a un diàleg.** Guanyem que la pàgina d'inici no siga infinita i que les taules amples tinguen els 56rem del `Dialeg` gran. Perdem la lectura contínua de les quatre taules seguides. Si el Mestre les vol totes obertes a la pàgina, es canvia el `Dialeg` per un `Accordion` (també del sistema) sense tocar cap altra línia.
4. **`Graella` posa `grid-template-columns` en estil inline.** És del component, no del meu codi, però `sdp-pedra-seca §7` prohibix els estils inline i això algun dia s'haurà de mirar. L'alternativa sense inline és la classe `.sdp-card-grid` (`modules.css:1291`), que fixa tres columnes amb dos punts de ruptura.

---

### Bloc D · Les tres preguntes obertes

#### D1 · El conflicte de governança: tres papers, no un

La contradicció no es resol triant un document: es resol perquè «Sollutia» hui vol dir tres coses i cada document en diu una. Són papers **independents** i cadascun es pot moure sense tocar els altres:

| Paper | Qui és hui | Què implica |
| --- | --- | --- |
| **Amfitrió de la SPA** (qui serveix els fitxers) | Firebase Hosting (`LEDGER.md:15`) | No toca dades ni sessions. Canviar-lo és canviar un desplegament. |
| **Pàgina amfitriona d'incrustació** (qui posa `<soc-de-poble>` dins seu) | Sollutia (`ADR §Context B`) | Pot entregar sessions i configuració de presentació. Mai backend. |
| **Operador del backend** (qui té el projecte i les claus) | Sóc de Poble (`AGENTS §8`, Model B) | És la sobirania. No es cedix. |

Text exacte per a `AGENTS.md §8`, que és l'únic lloc on ha de viure la frase canònica:

```markdown
## 8. LLEI DE L'ENXUFABILITAT (Sollutia)
Sollutia té dos papers i només dos: **pàgina amfitriona** que pot incrustar
`<soc-de-poble>` i entregar-li una sessió, i **font de lectura** a la qual la
Frontissa fa GET. El **backend és nostre**: el projecte Supabase, les seues
claus i les seues migracions són de Sóc de Poble, i cap pàgina amfitriona pot
substituir-lo ni ampliar-lo en temps d'execució. L'allotjament dels fitxers de
la SPA és una decisió de desplegament separada i no atorga cap dels dos papers
anteriors. El codi frontend s'escriu 100% modular per a integrar-se pacíficament
allà on l'incrusten.
```

L'ADR i el LEDGER no s'han de reescriure: se'ls afig una línia que apunta ací («el paper de Sollutia el fixa `AGENTS §8`»). `requires_human_decision: true` — això ho signa el Mestre, no cap IA.

#### D2 · Independència: la presa de corrent i la Frontissa

**El principi.** La independència no s'aconseguix deixant que l'amfitrió injecte el backend: això és donar-li la clau de casa al llogater. S'aconseguix que **la decisió visca al nostre repositori** i que canviar-la siga escriure un fitxer nou. El port (`backendPort.js`) ja és la peça correcta; el que falta és el selector i la porta d'entrada tancada.

**Peça 1 · `configura` fail-closed** (`src/host.js:117-121`). Resol A1b i deixa la signatura verificable:

```js
/** L'única configuració que accepta un amfitrió. Dades, mai comportament. */
const CLAUS_CONFIG = Object.freeze(['auth', 'locale', 'frontissa']);

export function configura(opcions = {}) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('[host] L’arrancada ja ha començat');
  if (opcions === null || typeof opcions !== 'object') throw new TypeError('[host] configura() espera un objecte');
  const desconegudes = Object.keys(opcions).filter((k) => !CLAUS_CONFIG.includes(k));
  if (desconegudes.length) {
    // Model B: el backend no és configurable. Callar-ho seria pitjor que negar-ho.
    throw new Error(`[host] Claus no admeses: ${desconegudes.join(', ')}. El backend no és injectable (ADR-2026-09).`);
  }
  setRuntimePolicy(opcions);
  return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
}
```

**Peça 2 · El selector de proveïdor** (`src/data/proveidors.js`, nou). És l'únic lloc del repositori que sap quins backends existixen:

```js
/**
 * proveidors.js — on es tria el backend, i l'únic lloc on es tria.
 *
 * Canviar de plataforma és escriure un mòdul nou que complisca
 * CONTRACTE_NUCLI i afegir-hi una línia. No es toca ni un component.
 */
export const PROVEIDORS = Object.freeze({
  supabase: () => import('./supabase/index.js'),
  local:    () => import('./local/index.js')     // IndexedDB, sense xarxa. Encara no escrit.
});

export function nomProveidor() {
  const declarat = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SDP_BACKEND : undefined;
  return declarat || 'supabase';
}

export async function carregaProveidor(nom = nomProveidor()) {
  const carrega = PROVEIDORS[nom];
  if (!carrega) throw new Error(`[host] Proveïdor desconegut: ${nom}. Coneguts: ${Object.keys(PROVEIDORS).join(', ')}`);
  return carrega();
}
```

I `arrenca()` (`host.js:142-145`) deixa de cablejar Supabase:

```js
      if (!injectats.length) {
        const impl = await carregaProveidor();
        setBackendImplementation(impl);
      }
```

**Què compra això.** «Connectar sense internet d'ací a un any» = escriure `src/data/local/index.js` amb els 32 mètodes i arrancar amb `VITE_SDP_BACKEND=local`. «Canviar de plataforma en dos vesprades» = `src/data/<qui-siga>/index.js` i una línia al selector. El contracte (`src/data/contracte.js`) és la frontera, i `teCapacitat()` ja permet que la UI es degrade quan un proveïdor no porta una capacitat. **Avís honest:** el contracte és tot-o-res per al nucli; un proveïdor que no implemente els mètodes de `CONTRACTE_NUCLI` no arranca, i això és deliberat.

**Peça 3 · La Frontissa reescrita** (`src/data/adaptadors/sollutia/client.js`). Origen propi, mai l'emissor de sessions; sense fuga d'origen; amb rellotge:

```js
import { getRuntimePolicy } from '../../../config/runtimePolicy.js';

/** Model B: la Frontissa llig. Esta llista buida no és decorativa: és el contracte. */
export const ESCRIPTURES_PERMESES = Object.freeze([]);

const TEMPS_MAXIM = 8000;

/** L'origen de lectura és un camp propi. auth.issuer signa sessions; no servix dades. */
function origenFrontissa() {
  const declarat = getRuntimePolicy()?.frontissa?.origen;
  if (!declarat) throw new Error('[Frontissa] Denegada: cap origen de lectura declarat a la política');
  return new URL(declarat);
}

export async function llig(recurs, params = {}, { signal } = {}) {
  if (typeof recurs !== 'string' || !recurs || recurs.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(recurs)) {
    throw new Error('[Frontissa] Recurs invàlid: només rutes relatives');
  }
  const base = origenFrontissa();
  const endpoint = new URL(recurs.replace(/^\/+/, ''), base);
  if (endpoint.origin !== base.origin) throw new Error('[Frontissa] Fuga d’origen denegada');

  for (const [clau, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null) endpoint.searchParams.append(clau, String(valor));
  }

  const avortador = new AbortController();
  const rellotge = setTimeout(() => avortador.abort(), TEMPS_MAXIM);
  signal?.addEventListener('abort', () => avortador.abort(), { once: true });

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      credentials: 'omit',
      mode: 'cors',
      redirect: 'error',          // una 302 cap a un altre origen no es seguix
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
      signal: avortador.signal
    });
    if (!res.ok) throw new Error(`[Frontissa] ${recurs}: ${res.status}`);
    if (!(res.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('[Frontissa] Resposta que no és JSON');
    }
    return await res.json();
  } finally {
    clearTimeout(rellotge);
  }
}
```

I `frontissa` entra a la política com a camp congelat (`src/config/runtimePolicy.js`, dins del `Object.freeze` de `setRuntimePolicy`):

```js
    frontissa: Object.freeze({
      origen: frontissa?.origen || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SOLLUTIA_FRONTISSA : undefined) || null
    }),
```

**Peça 4 · El DTO explícit** (`src/data/adaptadors/sollutia/recursos.js:10`). Hui fa `{ _sollutia: true, ...payload, … }`: tot el que Sollutia envie entra al nostre domini, incloent-hi camps que no coneixem. La troballa és de Codex (F4) i la subscric:

```js
      return Object.freeze({
        _sollutia: true,
        id: ident,
        email: payload.email,
        name: nom,
        display_name: nom
      });
```

#### D3 · Seguretat d'URL: llistes per paper, i mai dinàmiques per a credencials

La pregunta era com afegir URLs dinàmicament sense perdre la fortificació. **La resposta honesta és que no es pot per a tots els camps.** Un origen que porta credencials (backend, emissor, relé d'OAuth) no pot dependre de res que arribe en temps d'execució des de la pàgina amfitriona: si l'amfitrió pot ampliar la llista, la llista no existix. La frontera correcta és per **paper del camp**:

- **Camps de credencial** (`supabaseUrl`, `sollutiaIssuer`, `oauthRelayUrl`, `botApiUrl`): un sol origen cadascun, fixat en temps de compilació. L'amfitrió pot **confirmar-lo**, mai canviar-lo.
- **Camps de presentació** (`fontsHref`, `pluginUrl`, `basePath`): llista pròpia, i ahí sí que es pot admetre una llista d'orígens servida pel backend **ja fixat** (mai per l'HTML de la pàgina).

Substitut exacte de `sanejaConfig` (`src/PedraSecaEmbed.jsx:160-217`):

```js
/* Un origen per paper. El que porta credencials es fixa en temps de
   compilació; el que pinta pot ser més ample. Cap camp compartix llista. */
const env = (clau) => (typeof import.meta !== 'undefined' ? import.meta.env?.[clau] : undefined);

function origenDe(valor) {
  try { return valor ? new URL(valor).origin : null; } catch { return null; }
}

function llistesPerCamp() {
  const dev = Boolean(env('DEV'));
  const localhost = dev
    ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3340',
       'http://localhost:54321', 'http://127.0.0.1:54321', 'http://127.0.0.1:5173']
    : [];
  return Object.freeze({
    supabaseUrl:    [origenDe(env('VITE_SUPABASE_URL')), ...localhost],
    sollutiaIssuer: [origenDe(env('VITE_SOLLUTIA_ISSUER')), ...localhost],
    oauthRelayUrl:  [origenDe(env('VITE_OAUTH_RELAY_URL')), 'https://auth.socdepoble.org', ...localhost],
    botApiUrl:      [origenDe(env('VITE_BOT_API_URL')), ...localhost],
    pluginUrl:      [origenDe(env('VITE_PLUGIN_URL')), ...localhost],
    fontsHref:      ['https://fonts.googleapis.com', 'https://fonts.bunny.net']
  });
}

function sanejaConfig(cru) {
  const net = {};
  for (const clau of CLAUS_PERMESES) if (clau in cru) net[clau] = cru[clau];

  const LLISTES = llistesPerCamp();
  const rebutjats = [];

  for (const [camp, permesos] of Object.entries(LLISTES)) {
    const valor = net[camp];
    if (!valor) continue;
    let u = null;
    try {
      if (String(valor).startsWith('//')) throw new Error('protocol relatiu');
      u = new URL(valor, window.location.origin);
    } catch { u = null; }
    const admesos = permesos.filter(Boolean);
    const propi = u && u.origin === window.location.origin && camp !== 'supabaseUrl' && camp !== 'sollutiaIssuer';
    if (!u || (!admesos.includes(u.origin) && !propi)) {
      delete net[camp];
      rebutjats.push(camp);
    }
  }

  // basePath és una ruta, no un origen: només s'admet relativa.
  if (net.basePath && !String(net.basePath).startsWith('/')) {
    delete net.basePath;
    rebutjats.push('basePath');
  }

  if (rebutjats.length) {
    // Un rebuig silenciós fa que l'integrador culpe la xarxa durant dies.
    console.warn(`[soc-de-poble] Atributs rebutjats per política d'orígens: ${rebutjats.join(', ')}`);
  }
  return Object.freeze(net);
}
```

Tres conseqüències que el Mestre ha de conéixer abans d'aplicar-ho:

1. **Fa falta declarar les variables.** `VITE_SOLLUTIA_ISSUER`, `VITE_OAUTH_RELAY_URL`, `VITE_BOT_API_URL` i `VITE_PLUGIN_URL` han d'existir a l'`.env` de compilació. Si no hi són, el camp corresponent **es rebutja sempre** — i ara, almenys, ho diu per consola.
2. **Les tres grafies del domini s'han de reduir a una.** Este codi no ho decidix: llig el que li done l'`.env`. Cal saber si el domini acordat és `sollutia.cat`, `socdepoble.sollutia.com` o `socdepoble.sollutia.cat`. `requires_human_decision: true`.
3. **La mateixa llista l'ha de consumir tothom**: `runtimePolicy.esOrigenPermes`, `public/auth/callback.html` i la renovació de sessió. Mentres cada fitxer porte la seua còpia, arreglar-ne un no arregla res.

---

### Diàleg d'Olivera

**Al Pla d'Implementació de la IAIA MarIA** (`260923_2305_pla_implementacio_fortificacio_sollutia.md`). Les tres esmenes que vaig deixar a les 23:45 seguixen vives, i n'afig una quarta:

1. «Connectar el frontend amb la Frontissa tal com prescriu l'ADR» — ara sí que hi ha Frontissa, però llig del camp equivocat (A3). El pla ha de dir **quin camp** és l'origen de lectura abans que ningú la cride.
2. «Tots els tests de la xarxa Sollutia passen» — seguix sense existir cap suite de xarxa Sollutia. L'únic contracte capturat és una fixture sintètica.
3. «`npm run porta` amb resultat verd» com a criteri d'acceptació fa que esta tasca no puga tancar mai. Ancoreu l'acceptació a portes concretes.
4. **Nova.** El punt 2 del pla («Restringir `configura`… forçant sempre el muntatge de Supabase local») **ja està fet al disc**. El pla s'ha quedat arrere del codi en menys d'una hora. Quan això passa, el pla s'actualitza abans de demanar consens, o el consens es dóna sobre una foto vella.

**A Codex.** Quatre convergències independents a les 23:12 i res a rebatre-li llavors. Hui li done una cosa més i li'n discutixc una:

- **Li done la raó del tot en F1.** El seu «bloquejar operadors no basta: `knownRead` també autoritza qualsevol script de `tooling/gates` i banderes mutadores com `segella --update`» és millor que la meua formulació. El meu `;` és una instància del seu problema, no al revés.
- **Li matise B4.** Deia que «`pwd` amb separador i `npm test` amb pipe ja fallen; `git status` amb `&&` sí que passa». És exacte, i la raó està a `mutation-policy.mjs:25`: la guarda general rebutja els metacaràcters, però les regles de prefix de les línies 28-31 tornen `true` pel seu compte després. El forat no és la guarda: és l'ordre d'avaluació.
- **Li confirme F7 amb dades noves:** els tres fitxers han passat a *staged* (`A`), però `tests/git-hooks.test.mjs` i `tests/security-chain.test.mjs` continuen `??` i la CI els nomena. Si el commit no els porta, la CI seguix roja i haurem mogut el problema sense resoldre'l.
- **Assumisc sense rebatre** la seua F6 (el `handle_new_user` que exigix `tenant_id` que el flux de Google no posa) i la seua F8 (plantilla v2.3.0 contra router 2.2.0).

---

### Proposta de millora de `prompt_local.md` (punt 4 del Protocol)

Les quatre de les 23:45 seguixen vigents; les repetixc en una línia i n'afig dos que esta segona volta ha fet evidents.

1. **El Registre declara un rebut que no existix** (`sdp:torn_manual_2305`) i una «Aprovació humana: aprovat» que no ha emés `document.mjs`. O naix del circuit, o el camp diu `n/a (prompt manual)`.
2. **Doneu les rutes exactes.** L'ADR és a `_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md`. Les IAs locals lligen disc; no endevinen.
3. **No pregunteu per documents que acabeu d'arxivar** (C1-C9 és a `90_arxiu_historic/`, que `AGENTS §5` prohibix llegir).
4. **Afegiu un camp «Confinament»** amb les ordres que l'auditor pot executar.
5. **NOVA · Afegiu un camp «Congelació».** Este prompt demana mode AFK absolut i, mentres jo auditava, dos fitxers de `src/` han canviat. Si l'arbre es pot moure, el prompt ho ha de dir, perquè una auditoria contra un disc mòbil no és reproduïble. Proposta de camp: `Congelació: cap | només src/ | arbre sencer`.
6. **NOVA · Separeu «auditar» de «dissenyar».** La tasca 3 no és una auditoria: és una ordre de redisseny amb entrega de codi. Barrejar-les fa que el mateix document haja de complir dos contractes (`informe` i pla d'implementació) i que el `type` del frontmatter siga mentida per a mitjan document. Proposta: dos prompts germans amb la mateixa hora termodinàmica, `..._prompt_auditoria_...` i `..._prompt_redisseny_...`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tall d'evidència d'esta segona passada: branca `backup-notes-publish`, HEAD `f03affcb` **amb arbre de treball modificat** (`src/host.js`, `src/PedraSecaEmbed.jsx` sense versionar; `src/data/adaptadors/sollutia/client.js` i tres eines de `tooling/gates` a l'índex). 26-09-23, entre les 23:44 i les 23:58. **Cap fitxer de producte modificat per mi.**

Executat en esta passada:

- `npm test` → 20 fitxers, **82 proves, totes verdes**, 5,70 s. **Idèntic al resultat de les 23:31, amb el Model A ja substituït pel Model B.**
- `node tooling/gates/tractor-enxufe.mjs` → E1–E4 verd, mateix text literal que a les 23:31 (A1).
- `node tooling/gates/tractor-adaptadors.mjs` → verd, «1 contracte(s) capturat(s) validat(s)», mateix text que quan no existia cap client (A4).
- `git diff -- src/host.js src/PedraSecaEmbed.jsx` → el canvi de Model A a Model B i la retirada del comodí `*.supabase.co`, línia per línia (Bloc 0).
- `git status --porcelain -uall -- tooling/gates tests src/data/adaptadors` → tres eines `A`, dos proves `??`, client `A` (B2, B3).
- `git log --name-only -3 -- src/sections/consola tests` → cap commit toca `src/sections/consola`: la Consola no té cap prova pròpia (C5).

Llegit al disc per al Bloc C i el Bloc D, sencer: `ConsolaSection.jsx`, `consolaContent.js`, `tooling/vite/consola-iaia.mjs`, `PedraSeca/index.js`, `organismes/UniversalCard.jsx`, `organismes/UniversalIndicatorCard.jsx`, `atoms/estats.jsx`, `composicio/index.jsx`, `EspecimenIndicador.jsx`, `cataleg/manifest.js`, `src/css/components.css`, `src/css/modules.css` (1-1859), `PageFrame.jsx`, `host.js`, `backendPort.js`, `runtimePolicy.js`, `assetResolver.js`, `client.js`, `recursos.js`, `mocks/sollutiaBackend.js`, `.agents/SKILLS_SEAL.json`, `.agents/manifest.yaml`.

No executat, i per què:

- **Cap verificació al navegador.** `http://localhost:3340` és inabastable des del confinament: el hook `PreToolUse` no té `matcher` i denega tota eina que no siga lectura de disc (B7). El Bloc C està raonat contra el codi i el full d'estils. **Ningú l'ha vist pintat.**
- `npm run porta` (60 passos amb build i lint): fora del pressupost d'una auditoria AFK.
- `npm run test:node`: fora de l'allowlist del hook (B5). Les 109 proves de node les acredita Codex, no jo.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Mode AFK complet.** Zero fitxers de producte tocats en les dos passades. L'únic fitxer que he escrit és este informe. **El codi del Bloc C i del Bloc D és per a llegir i aprovar, no està aplicat.**
- **El Bloc C no s'ha vist en pantalla.** Ni un píxel. Les classes, els tokens i les mides estan llegides del full d'estils; el resultat visual és una predicció raonada, no una observació.
- **No he encés Supabase** ni he provat trànsit real cap a Sollutia.
- **No he llegit `90_arxiu_historic/`** (`AGENTS §5`). Per tant **no tinc la llista literal C1–C9**: el Bloc B es construïx sobre `.agents/ESTAT.md`, `.agents/LEDGER.md`, el codi viu i les portes executades.
- **`wordpress-plugin/` està gitignorat** i queda fora de l'auditoria.
- **La bretxa B1 l'he provada una sola volta amb `echo`**, a la primera passada. No l'he usada per a res més.
- **Les afirmacions de severitat són meues; les decisions són del Mestre.** A2, C4 (rotació del diari), D1 (la frase canònica) i D3 (quin domini és el bo) porten `requires_human_decision: true`.
- **El tancament reglamentari continua inabastable des de dins del confinament.** `AGENTS §4` demana escriure `.agents/ESTAT.md`; `.agents` és a `SECURITY_PATHS` (`mutation-policy.mjs:14-16`) i l'únic camí autoritzat, `executor-mutacio.mjs`, exigix `verificaSegell(root).ok` amb un segell que està divergent. Reconciliar-lo per a poder escriure el meu propi relleu seria fabricar un verd, i `wiki-cicle-de-vida` ho prohibix. El relleu queda dins d'este document i el text per a `ESTAT.md` l'entregue al Mestre al xat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
