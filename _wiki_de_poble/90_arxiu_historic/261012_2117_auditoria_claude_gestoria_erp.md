---
type: informe
status: esborrany
description: 'Implementació i revisió adversarial del Panell ERP de la Gestoria: rail intern, selector de trimestre, vista comprimida, barres, mòbil i proposta del calendari d’IA.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_835f94bd-d03c-4875-84f8-5870bd2c536c:f2ffbba7-2d7f-4967-8f3c-d1b0522b37c8
---
# Auditoria Claude · Panell ERP de la Gestoria V2

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_835f94bd-d03c-4875-84f8-5870bd2c536c:f2ffbba7-2d7f-4967-8f3c-d1b0522b37c8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T19:16:52.952Z |
| Modificació | 2026-10-12T20:20:00Z |
| Propietari | agent-local |
| Aprovació humana | Decisions del Mestre al xat (261012 vespre); tractors pendents de signatura |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), amb workflows de subagents del mateix model |
| Tokens consumits | No mesurats per document; els workflows en reporten uns 7,9 M de subagents (comprensió 1,9 M, revisió 3,7 M, mòbil 2,3 M) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-12T19:16:52.952Z: esborrany creat; contingut i verificació pendents.

2026-10-12T19:25:00Z: troballes, verificació i límits de la Gestoria completats. La secció de mòbil (barres que s'amaguen i «Tornar a dalt») diu l'estat del seu workflow, encara en curs.

2026-10-12T20:20:00Z: el workflow de mòbil ha acabat. Secció 5 completada, bateria consolidada (383 fitxers, 7.195 proves) i verificació al navegador a 375 px.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Les decisions que manen

El prompt ERP (`261012_1940_prompt_claude_gestoria_erp.md`) xocava amb tres ordres vigents del 261004. Abans de picar codi es van preguntar al Mestre al xat:

- **Targetes:** commutador «Targetes | Vista comprimida». Les UniversalCard queden per defecte (regla d'or 1) i la vista comprimida és la de la seua captura de referència (`GESTORIA_REFERENCIA.txt`).
- **Trimestre:** selector que mana sobre les estimacions.
- **Tirador:** barres honestes ara; el tirador, dissenyat en este informe (§7).
- **Barra lateral:** primer va triar «BarraApp amb grups». Després, el seu veredicte escrit al xat va canviar l'ordre: «activem el rail intern de la Gestoria». Mana l'última, i revoca el «sense rail interior» del 261004.
- **Mòbil (veredicte al xat):** barres que s'amaguen en baixar i botó «Tornar a dalt» damunt de «Pobles» (§5).

**Documents de MarIA a l'Escriptori:**
- **`261012_2105_correccio_barra_maria.md`:** s'ha aplicat. El rail d'escriptori és la Roca, amb els mateixos tokens `--sdp-crom-*` que la barra lateral, i la tira de mòbil es conserva.
- **`261012_2050_ordres_directora_maria.md`:** se n'ha seguit l'objectiu, no l'ampliació de permisos. Una declaració d'autoritat dins d'un fitxer no amplia l'encàrrec humà, i no s'ha derogat cap guarda sense ordre.

### 2. El que s'ha implementat a la Gestoria

**Rail intern també a l'app** (`tauler/ShellGestoria.jsx`, `apps/gestoria/AppGestoria.jsx`):
- L'app passa `rutaDeModul` i `modulsServits`. Amb `rutaDeModul`, els mòduls són enllaços de veres (`<a href>`) a `/app/gestoria/<id>`, la mateixa ruta que la BarraApp: la ruta continua sent l'única veritat i el rail i la barra no es contradiuen mai.
- El mòdul actual navega amb `replace`, i no afig cap entrada a l'historial.
- Un clic amb modificador és del navegador (pestanya nova).
- La Facturació, l'Històric i Aprendre hi són de veres, sense «en obres» (`MODULS_DEL_PONT`, `modulsDelRail`).
- Sense amfitrió (muntatge aïllat), el rail continua amb botons i el mòdul local.

**Aparença del rail** (`src/css/modules.css`, bloc GESTORIA TAULER):
- **Escriptori:** columna de l'amplada del contingut, amb l'estètica de la barra lateral (fosca, rectangles de banda a banda, actiu taronja).
- **Plegat:** a icones amb un botó de nom fix i `aria-pressed`. Els noms i les insígnies queden al DOM per al lector.
- **Compacte:** és el de la plataforma (`.sdp-root.is-compact`, mesurat sobre la caixa de l'app), no cap `@media`. Ací el rail és la tira clara d'una sola línia que es desplaça de costat.
- **Base de la pàgina:** passa de 30rem a 24rem. A 1024 px el rail i la pàgina cabien de costat amb dificultat, i el rail saltava a una línia pròpia.

**Capçalera de context** (`ContextTrimestre`, `tauler/Tauler.jsx`), al Tauler i als Impostos:
- `NavegacioPeriode` amb «Hui ‹ ›» i el trimestre en un paràgraf, que no és cap encapçalament: l'Índex no el recull ni l'escriu a la URL.
- El commutador de vista.
- Dues barres natives `Progres`:
  - **El rellotge del termini** (`rellotgeDelTermini`): dies del trimestre o de la finestra de presentació. És una data i es veu sempre. Si avui hi ha oberta la presentació d'un altre trimestre, ho diu («Ara és oberta la presentació del 3T 2026: acaba el 20/10/2026.»), i qualifica els terminis d'orientatius, perquè a `impostos.js` són [NO VERIFICAT].
  - **Hisenda sobre la caixa real** (`hisendaSobreCaixa`): és una xifra. Amb l'ull tancat només es diu quan falta la dada; ni el signe de l'estimació ni el de la caixa.
- Als Bancs només hi ha el commutador, amb la mateixa píndola.

**Selector que mana:**
- `periodeTriat` passa a `dadesDelTauler({ periode })`.
- Quan el Full analitza un trimestre nou, el selector el torna a seguir: és l'acte més recent.
- «Oblida les dades» el torna al dia d'avui.
- El dia d'avui es torna a llegir quan la pestanya torna a primer pla i quan es prem «Hui».

**Vista comprimida** (`TaulaComprimida`):
- Una `Taula` densa per bloc, de dues columnes: el concepte, amb el subtítol i les etiquetes davall, i la xifra.
- Cada fila obri la pàgina de la seua targeta.
- La xifra la governa l'ull de la boina, i no hi ha ull per fila.
- La regió de la taula es diu «Taula · …», perquè no repetisca el nom de la secció.

**Fitxa del tractor** (`fitxes/gestoria_tauler.md`): descriu el selector, la capçalera, la vista comprimida i l'ocultació, perquè el que es signa diga el que fa el codi.

### 3. Revisió adversarial pròpia (33 agents)

Tres lents independents (privacitat, correcció i doctrina/accessibilitat), i dos escèptics per troballa que en intenten la refutació. N'han sobreviscut 11 i se n'han refutat 4. Totes les reals s'han corregit:

- **Alta · privacitat.** Amb l'ull tancat, la capçalera deixava saber si la caixa és zero o en descobert, perquè el motiu canviava. A més, demanava triar uns extractes que ja s'havien triat.
  - Ara `sense` només vol dir que falta la dada.
  - El descobert i el «res» són estats propis i també s'amaguen.
  - Hi ha una prova que exigix el mateix text amb l'ull tancat per a una caixa positiva i per a una en descobert.
- **Mitjana · el rellotge amagava el termini que corre.** De l'1 al 20 d'octubre, la capçalera mirava el 4T i no avisava del 3T. Ara ho fa el camp `obert`.
- **Mitjana · la tira retallava l'anell de focus.** Ara l'anell va per dins.
- **Baixa:**
  - El dia d'avui quedava fixat en muntar.
  - El mòdul actual duplicava l'historial.
  - Les entrades del rail de l'app eren botons i ara són enllaços.
  - El botó de plegar canviava de nom i deia «contret» d'una llista visible.
  - La píndola dels Bancs era diferent.
  - La vista comprimida en mòbil era parcial i alta.

### 4. Auditoria de Codex (`261012_2022_auditoria_codex.md`)

- **GES-04 (resolta):**
  - El «res a pagar» ara diu que és el net del 303 i del 130, i remet a la targeta Hisenda per al detall de cada model.
  - Tots els estats amb dada porten `completa`, i la capçalera diu «Estimació incompleta».
  - La caixa a zero ja no es confon amb l'absència de dada.
- **GES-05 (resolta al rail):** la tira depén de `.sdp-root.is-compact` i no de la finestra.
- **GES-01, GES-02 i GES-03 (obertes):** són preexistents al cable V2 i fora de l'abast d'esta ordre. No s'han tocat:
  - la retenció perduda a l'historial del full;
  - la còpia del Full que sobreviu a un canvi de font;
  - la pastilla de data compartida per les xifres fiscals.

### 5. Mòbil: barres que acompanyen l'scroll i «Tornar a dalt»

Ordre del veredicte al xat, executada per un workflow paral·lel (investigar, implementar, tres revisors i correcció) sobre la closca de l'app, fora de la Gestoria.

**Estat: acabat i verificat.**

**Hook `src/hooks/useBarresAmbScroll.js`:**
- Funció pura `seguentEstat`. Llindar `--sdp-space-6`, i al cim (2 × `--sdp-alt-accio`) i al final del recorregut les barres tornen.
- Escolta el scroll en captura sobre l'arrel, que val també dins de Shadow DOM, agrupat amb rAF.
- El primer scroll d'un desplaçador només en pren la posició: una taula o un carrusel que llisca de costat no torna les barres.
- No amaga res amb el focus de teclat dins d'una barra, amb un diàleg obert ni amb l'Índex.
- El Tab cap a una barra amagada restaura la posició; abans saltava 461 px.
- Es reinicia en canviar de ruta. Res no va a l'emmagatzematge.

**Closca (`App.jsx`):**
- Actiu només amb `isCompact && !immersiu`.
- L'atribut `data-sdp-barres` és `dalt` (blava i taronja) o `totes` (també la barra inferior).

**CSS (`layout.css`):**
- Canvia el `top` del sticky a negatiu. No fa servir `transform`: així la barra que va amb el contingut el seguix.
- La barra inferior baixa amb `translateY(100%)`.
- En repòs, la pintura és idèntica a la d'abans.
- En escriptori no canvia res.

**Gestoria:** la regla `static` de les seues barres ara només val fora del compacte (`modules.css`).

**Botó «Tornar a dalt»** (`PedraSeca/atoms/BotoTornarADalt.jsx`):
- Té espècimen al catàleg (§9) i `VERSIO_CATALEG` pujada.
- Fix damunt de «Pobles».
- Visible quan es puja després d'haver baixat més d'una pantalla.
- No apareix al final del recorregut, on taparia l'última targeta, ni quan hi ha un peu ancorat (el compositor del Xat, «Desar autoria»).
- Puja suau, i instantani amb moviment reduït, i porta el focus al `<main>`.

**Revisió adversarial (3 lents):** 6 troballes, totes reals i totes corregides, amb proves noves (hook 23+, botó 5, capes 13, closca 4).

**Decisió que queda per al Mestre (D7):** la barra NEGRA no s'amaga. És la regla de la fase de poliment del 261007 («la negra mai») i l'única porta al calaix. Per això el «100 % de la pantalla» deixa 64 px dalt. Si la vol fora, cal un pla propi.

**Pendent per a MarIA:** les skills `sdp-universal-page` i `sdp-app-grid-shell` han de dir que les barres acompanyen el scroll en compacte (`.agents/` no és escrivible per a este torn).

### 6. Proposta: les IAs com a membres de l'equip al calendari (tasca 6)

Base llegida: `src/utils/esdeveniment.js`, `src/sections/calendari/fonts/contracteFonts.js`, `tooling/gates/fatiga-hook.mjs`, `tooling/brain/tracker_consum.mjs`, `.agents/consell.json`, `src/data/contracte.js`.

**Què hi ha hui:**
- No existix cap «calendari d'equip». `/calendari` és públic i del poble, el de la Consola és de processos i el de Burocràcia està en obres.
- Cap font actual no sap «bloquejat fins a…»: el CSV de consum no té l'hora de restabliment.
- La «fatiga» del sensor és la saturació d'una conversa de MarIA, no l'esgotament d'un compte de proveïdor.

**Model proposat** (`sdp.equip-ia.v1`, de fallada tancada com `creaEsdeveniment`):

```js
MembreIA = { id /* de consell.json */, proveidor /* clau de PROVEIDORS */, compte /* etiqueta, mai correu */,
  estat /* disponible | fatigat | bloquejat | desconegut */, finsA /* ISO amb desfasament */,
  motiu /* limit-setmanal | limit-sessio | credits | saturacio-context | manual */, restantPct /* 0-100 o null */,
  font /* manual | consum-csv | fatiga-hook */, actualitzat /* ISO */ }
```

**Regles:**
- `bloquejat` sense `finsA` és `desconegut`.
- Un `finsA` passat diu «a confirmar», no «disponible».
- Una dada rància és `desconegut`.
- Sense mesura, `null`, mai zero.

**Fases:**

| Fase | On | Port de backend | Decisió |
| --- | --- | --- | --- |
| 1 (recomanada) | Consola, només en DEV: el middleware `consola-iaia.mjs` afig `equip` (de `consell.json`, `.agents/equip_ia.json` escrit pel Mestre o MarIA, el CSV i la traça de fatiga) i es pinta amb `CalendariEsdeveniments`/`VistaSetmana` com a franja «No disponible» (un bloqueig de dilluns a divendres va a «Tot el dia») | Intacte | Cap |
| 2 | Font local «Equip IA» a `/calendari` (`creaFont` amb `colorToken: 'avis'`), generalitzant `useFontsCalendari` a fonts sense OAuth | Intacte | Visibilitat: `/calendari` és públic |
| 3 | Capacitat opcional `equipIA` (tot o res per capacitat), taula amb RLS de propietària | Capacitat nova | ADR i kit de conformitat |

**ICS:** un generador estret en el patró d'`icsTerminis` (títol genèric, `CLASS:PRIVATE`, `TRANSP:OPAQUE`). Estat de l'art: `VFREEBUSY` amb `FBTYPE=BUSY-UNAVAILABLE` (RFC 5545) i l'`eventType: 'outOfOffice'` de Google Calendar v3.

**Mai:** l'estat de salut del Mestre (carboni), API de proveïdors sense ADR, ni dades d'esta mena en carpetes que es publiquen (`01_ser`, `02_saber`, `03_actuar`).

`requires_human_decision: true`: on viu el calendari d'equip i qui el veu.

### 7. El tirador de projecció (dissenyat, no implementat)

No es pot fer bé al Tauler sense dos passos previs:

1. **Un sol motor.** El Tauler calcula amb `impostos.js` (factures). La simulació de l'Històric usa `simulacio.js` (operacions del banc), amb un 130 diferent (5 % de difícil justificació) i el 303 amb compensació. Projectar amb un motor i mostrar l'altre donaria dos 130 per al mateix trimestre.
2. **Un adaptador de factures a operacions**, que no existix (cap productor d'`origen: 'factura'`).

**Disseny recomanat, a l'Històric (motor B):**
- Una funció pura `vendaHipotetica({ base, data, suposits })` a `historic/nucli/operacions.js`, amb les fórmules que ja hi ha. No calcula cap impost nou: només fabrica una dada.
- `simula` amb l'operació afegida.
- Delta del trimestre amb `provisioDe`, i per any amb `comparaEscenari`.

**Condicions:**
- Estat local del tirador, confirmat només en deixar-lo anar. Si no, desaria al cofre a cada moviment.
- Màxim fix, que no depenga de les dades: si en depenguera, delataria l'escala amb l'ull tancat.
- Resultats per `Xifra`.
- Espècimen del `range` al catàleg abans de programar-lo (Pedra Seca §9).

Toca fonts de `gestoria.historic`.

### 8. Retroalimentació de la plantilla `prompt_local`

- **Conflictes amb ordres vigents.** El prompt ERP no deia que el rail interior, la substitució de targetes i les barres HSL xocaven amb ordres vigents (261004) i amb Pedra Seca (tokens hex, cap `hsl()`). Proposta: una secció obligatòria «Ordres vigents que este prompt revoca o toca», amb la cita.
- **Riscos de governança.** No avisava que tocar la closca torna els tractors a «pendent»; el prompt V2 sí que ho feia. Proposta: un camp de riscos de governança (tractors, fronteres, signatures).
- **Mesures ambigües.** «15pt» és ambigu davant dels tokens (`--sdp-ui-base` = 15px; 15pt ≈ 20px). Proposta: mesures sempre en tokens.
- **Canal viu.** El relleu cada 10-15 minuts a l'Escriptori, amb el circuit `document.mjs`, costa un document per relleu. Proposta: un sol informe viu amb Historial, com fa Codex.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat observat |
| --- | --- |
| Línia base abans de tocar res: `npx vitest run src/sections/gestoria src/apps/gestoria` | 111 fitxers, 2.565 proves, totes verdes |
| Després de la implementació: `npx vitest run src/sections/gestoria src/sections/tractors src/apps/gestoria src/apps/plataforma` | 160 fitxers, 3.754 proves, totes verdes |
| Després de les correccions de la revisió, de Codex i de MarIA: `npx vitest run src/sections/gestoria/tauler src/apps/gestoria src/sections/tractors src/sections/gestoria/qualitat.test.js src/sections/gestoria/privacitat.test.js src/css` | 58 fitxers, 1.082 proves, totes verdes |
| Navegador (`vite-dev`, 3340), 1024 px | El rail en columna fosca al costat de la pàgina; la capçalera amb trimestre, commutador, rellotge i avís del termini obert |
| Navegador, 375 px | Tira d'una sola línia; vista comprimida llegible; la capçalera s'apila |
| Mòbil, workflow propi: `npx vitest run src/hooks/useBarresAmbScroll.test.jsx src/app src/css src/sections/disseny src/components/PedraSeca` | 227 fitxers, 3.869 proves verdes (2 omeses) |
| Bateria consolidada final de tots dos fronts: `npx vitest run src/sections/gestoria src/sections/tractors src/apps src/app src/css src/hooks src/sections/disseny src/components/PedraSeca src/components/layout` | 383 fitxers, 7.195 proves verdes, 2 omeses, cap fallada |
| Navegador, 375 px, `/app/gestoria/tauler` | En baixar, `data-sdp-barres="totes"`: la blava, la taronja i la barra inferior s'amaguen i queda la negra. En pujar, tornen i apareix «Tornar a dalt» damunt de «Pobles». El rail compacte és la tira clara |

**Proves noves:**
- **Rail:**
  - enllaços amb `href` a l'app;
  - el mòdul actual sense entrada a l'historial;
  - clic amb modificador;
  - plegat amb `aria-pressed`;
  - `modulsDelRail`.
- **Capçalera:**
  - el selector mana, i no escriu res a la URL ni als encapçalaments;
  - el selector torna a seguir el Full quan analitza un trimestre nou;
  - el rellotge, en totes les seues fases i vores (20/10, 21/10, 30/01 i 31/01), i l'avís del termini obert;
  - Hisenda sobre la caixa: tots els estats, i el text amb l'ull tancat idèntic per a descobert, res i xifra.
- **Vista comprimida:** xifres fora del DOM fins a l'ull, cada fila obri la seua pàgina, la vista es conserva entre mòduls, i cap `[style]`.

Les proves de l'app que fixaven l'ordre revocada («sense rail intern») ara fixen la nova: una sola barra de l'app, el rail fora de la barra i un sol `aria-current` a la barra. Cap altra guarda s'ha afeblit.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Tractors:** `ShellGestoria.jsx`, `Tauler.jsx`, `targetesTauler.js` i la fitxa en són fonts. `gestoria.tauler` i `gestoria.historic` han de tornar a signar-se amb Touch ID; ja estaven pendents abans d'este torn.
- **Segell:** el hook `segell-auto` avisa de «segell divergent» a cada eina des de l'inici de la sessió. És un estat previ, i no s'ha resegellat res.
- **Arbre concurrent:** altres agents han tocat al mateix temps `src/sections/tractors/nucli/aprovacio.js`, `webauthn.js` i el plugin de WordPress. No són d'este torn i no s'han revisat.
- **Fora d'abast:** les troballes GES-01, GES-02 i GES-03 de Codex continuen obertes.
- **Pont:** en anar a un mòdul del pont, la closca es desmunta i la vista triada i el plegat tornen al valor per defecte. És el comportament de sempre del pont.
- **Mòbil:** la barra negra no s'amaga (D7, §5) fins que el Mestre ho decidisca.
- **Tancament:** este torn no pot escriure `.agents/ESTAT.md` ni el LEDGER, ni executar `tancament.mjs`, perquè el hook ho reserva a l'executor amb lease. El relleu per a l'ESTAT el porta el missatge final del xat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
