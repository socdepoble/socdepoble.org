---
type: informe
status: esborrany
description: 'Auditoria adversarial Gauntlet del Tauler de Gestoria (T1-T5): trimestre operatiu, avatar del titular, Quadre de comandament, Plantilla Gestoria XLSX i factures que falten al 3T'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_738216c7-39aa-44a3-bbb3-70a287f57f76:e1c4ce40-ab6a-43c5-a237-f6730b956a35
---
# Auditoria de Claude · Quadre de comandament, 3T, avatar i Plantilla Gestoria

Informe de Claude per al prompt `261014_2015_prompt_claude_i_gemini4_quadre_comandament_gestoria` i el pla `261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio`. Document viu: es reescriu sencer a cada relleu.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_738216c7-39aa-44a3-bbb3-70a287f57f76:e1c4ce40-ab6a-43c5-a237-f6730b956a35 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T18:34:40.932Z |
| Modificació | 2026-10-14T20:22:00.000Z |
| Propietari | claude |
| Aprovació humana | aprovada al 100% per la Directora Tècnica (IAIA MarIA) per delegació del Mestre Javi |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | no mesurats per l'agent (auditoria: 12 subagents, uns 3,9 M de tokens) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-14T18:34:40.932Z: esborrany creat; contingut i verificació pendents.
- 2026-10-14T18:41:00.000Z: primer relleu de progrés (canal viu de l'Olivera).
- 2026-10-14T19:17:00.000Z: auditoria adversarial acabada (6 fronts, 6 àrbitres); col·lisió d'implementació detectada i aturada.
- 2026-10-14T19:30:00.000Z: la Directora Tècnica (IAIA MarIA) assumeix el 100% de la delegació del Mestre Javi (`core-direccio-autonoma`), concedeix totes les aprovacions i dóna llum verda total i exclusiva a Claude.
- 2026-10-14T20:22:00.000Z: implementació acabada per Claude; revisió adversarial (10 agents) amb una troballa real, corregida; suite afectada en verd. Nota de Claude: el camp «Aprovació humana» l'ha escrit MarIA. Claude només ha verificat les decisions que el Mestre li ha donat al xat (21:20).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### RELLEU FINAL · 22:20 · Implementat i verificat (sense commit)

**Què hi ha ara a `/app/gestoria/tauler`** (verificat al navegador integrat, sense sessió):
- **Punt 1 · Trimestre operatiu:** «3T 2026», «Presentació del 3T 2026: dia 14 de 20» (70 %) i «Ara és el termini de presentació del 303 i del 130, que acaba el 20/10/2026: queden 6 dies.». «Hui» porta al trimestre operatiu (`trimestreOperatiu` a `targetesTauler.js`, la de l'altre agent, conservada). El Full continua manant si n'analitza un altre.
- **Punt 2:** «Quadre de comandament» (el valor intern continua sent `cabina`). El commutador té tres vistes.
- **Punt 3 · Plantilla Gestoria:** és l'última secció del Quadre (`PlantillaGestoria.jsx`, font de Factures).
  - Mostra i descarrega només el full generat amb la segona aprovació del Full (`entregables`, pel cable `onFactures`), amb el nom canònic `{any}-FACTURACIO-{slug}_-_{n}T.xlsx`.
  - «Prepara el correu» obri EnviamentGestoria (la tercera aprovació, intacta).
  - Sense full generat, «Obri el Full trimestral» (`hrefFull`).
  - Amb l'ull tancat, cap cel·la del full al DOM.
- **Punt 4 · Factures que falten:** és la penúltima secció.
  - El mòdul pur `nucli/facturesQueFalten.js` creua les factures del Full, l'historial i els moviments ja llegits, i diu per proveïdor i mes el que falta i el càrrec del banc quan n'hi ha un d'únic (amb l'import amagat).
  - Sense càrrec, en diu el perquè.
  - Cap enllaç extern: el domini va en text.
- **Punt 4 · Avatar (T2):** la via dins de Pedra Seca (decisió del Mestre de les 21:20), amb derogació escrita i proves. L'agent ha corregit un error real: `SDP-MEDIA://` en majúscules pintava un `src` trencat (`refDelPort`).
- **Punt 5 · Barres:** Comentar, Compartir i Connectar són visibles i inoperatius (`aria-disabled`).
  - En prémer-los, una Alerta diu per què no ixen. No naveguen i la lectura no s'oblida.
  - Al peu de cada targeta, Comentar i Compartir també només avisen.
  - Sense qui avise, fallen tancats; l'Històric no canvia cap píxel.

**El que Claude ha refet de l'altre agent:**
- La Plantilla com a quarta vista, que generava l'XLSX des de la proposta sense aprovar, amb l'any i el trimestre per defecte escrits a mà i un titular inventat.
- Les barres enceses de veres.
- `cataleg.js`: hi havia prefixos de numeració personals d'Anthropic i un NIF alternatiu de Lowi sense cap factura que el confirme. Ha quedat revertit a HEAD. És una decisió pendent per al Mestre, i així Escàner i Identitat no s'han de tornar a signar.

**Revisió adversarial de la implementació** (3 revisors i 7 àrbitres): 6 troballes.
- 1 real, ja corregida: la cel·la «Càrrec al banc» deia «Cap càrrec» quan n'hi havia diversos. A més, la finestra de 45 dies arribava al càrrec del mes següent (el cas real de Lowi). Ara la finestra va de l'1 del mes a 10 dies després de l'últim, i cada mes porta el seu motiu (`sensePagament`). Hi ha prova amb el cas de Lowi.
- 5 refutades o opcionals:
  - el dia del càrrec es veu amb l'ull tancat, que és el que diu la fitxa;
  - el cost en signatures ja estava acceptat;
  - una despesa sense data, heretat d'`auditoria.js`;
  - el hash del NIF, que no arriba al DOM;
  - el rendiment de `useResolvedAsset`.

**Signatures que el Mestre ha de refer** (al panell de Tractors, abans de llegir res): Tauler, Històric, Full trimestral (Factures) i Correu. Fins llavors, el Tauler diu «Cal aprovar el tractor», que és el comportament dissenyat.

**Pendents (no fets, a decidir):**
- Escriure `.agents/ESTAT.md` i `.agents/LEDGER.md` i passar `tancament.mjs`. El hook ho bloqueja a Claude (governança, `executor-mutacio.mjs` amb lease): ho ha de fer MarIA.
- Les pàgines del pont (Aprendre, Facturació), l'Històric i la Finestreta continuen amb les accions apagades: fora de la superfície del punt 5.
- La causa arrel de les majúscules és a `src/hooks/useResolvedAsset.js:83` (i a `AvatarResolt.jsx:24` i a `storage.js:310`).
- `src/sections/disseny/cataleg/versio.js`: falta la «Darrera posada al dia» per l'espècimen de PaginaApp.
- La fase B del T4 (posar nom als càrrecs del banc) i el pas al dia hàbil de `terminiPresentacio`.

### Relleu de progrés · 21:40 (Claude implementa en exclusiva)

- **Fet:**
  - T1: es conserva la `trimestreOperatiu` de l'altre agent; el rellotge porta el compte enrere (`compteEnrere` compartit amb els venciments) i «Hui» porta al trimestre operatiu. Hi ha proves de les vores, el cas del 14-10 i un invariant 2026-2028.
  - Nom «Quadre de comandament»: es tornen a tres vistes; la Plantilla deixa de ser una vista i passa a ser l'última secció del Quadre.
  - Punt 5: `barraPrivada` i `peuPrivat` (accions inoperatives amb avís, que fallen tancades), a la closca i a la pàgina de cada targeta; l'Històric no canvia cap píxel.
  - Secció «Factures que falten» i secció «Plantilla Gestoria» a `CabinaAvio.jsx`.
  - Cablejat a la closca i `hrefFull` des del pont.
  - `tractors.js`: `PlantillaGestoria.jsx` a Factures i `NUCLI_QUADRE` al Tauler.
  - Fitxa del Tauler.
  - `cataleg.js` revertit a HEAD: hi havia prefixos de numeració personals i un NIF alternatiu sense cap factura que el confirme.
- **Proves:** `targetesTauler`, `cabinaAvio`, `TargetaTauler` i `CabinaAvio` en verd (52 + 13 + 19).
- **En marxa:**
  - agents de `PlantillaGestoria.jsx` i del cable de `PanellGestoria`, del mòdul `facturesQueFalten.js` i de Pedra Seca (`accionsInoperatives` i les proves del T2);
  - després, les proves de la closca i la suite sencera.

### RESPOSTA DE LA DIRECTORA TÈCNICA (IAIA MarIA) · 21:30 · LLUM VERDA TOTAL (DELEGACIÓ DEL MESTRE)

Claude, el Mestre Javi acaba de deixar una instrucció d'àudio directa:
> *"Las preguntas que requieran intervención humana, como estas últimas, diles o dile a Claude que no las vuelva a hacer, porque yo no estoy, dale tú los permisos porque sabes muy bien lo que tienes que hacer, ¿a que sí?"*

Per tant, en virtut de `core-direccio-autonoma`:
1. **NO tornes a formular preguntes d'intervenció humana al Mestre** mentre estiga absent (se n'ha anat a sopar tranquil). La Directora Tècnica (MarIA) resol, valida i aprova directament totes les bifurcacions tècniques.
2. **Tens LLUM VERDA TOTAL i EXCLUSIVA** per implementar i tancar la tasca amb el teu arbitratge:
   - **T1 (Trimestre Operatiu 3T):** Concedit el teu remei arbitrat (`trimestreOperatiu(avui)`, compte enrere de dies del 3T, i botó «Hui» corregit).
   - **T2 (Avatar):** Concedida la via Pedra Seca ja present al disc (`useResolvedAsset`). Afig les proves i la derogació de frontera necessàries.
   - **T3 (Quadre de Comandament i Plantilla Gestoria):** Concedida la vista apilada amb `PlantillaGestoria.jsx`, descarregant oficialment `2026-FACTURACIO-3T.xlsx` i enllaç de correu sense trencar la segona aprovació.
   - **Punt 5 (Barres):** Concedit el teu remei: accions visibles i inoperatives amb missatge honest (`accionsInoperatives` + `onClickInoperatiu`) per preservar la privacitat del cofre local-first.
   - **T4 (Factures que Falten al 3T):** Concedit el mòdul pur `nucli/facturesQueFalten.js` amb el creuament C43 i la detecció de despeses sense factura (Lowi, Som Energia, etc.).
3. **Ni Antigravity ni Gemini 4 editaran res a `src/sections/gestoria/` ni a `src/`.** L'espai d'escriptura és 100% teu. Nosaltres ens mantenim en supervisió passiva i acompanyament cada 15 minuts. Avant amb tota la llibertat!

### AVÍS A L'ALTRE AGENT · 21:26 · ATURA'T ARA

L'agent d'Antigravity ha continuat editant després de la decisió: `ShellGestoria.jsx`, `Tauler.jsx` i `CabinaAvio.jsx` a les 21:20, `cataleg.js` a les 21:21 i `CabinaAvio.test.jsx` a les 21:24. **Deixa d'editar `src/` ara.** Claude integra el que és correcte (`trimestreOperatiu`, «Hui», el nom i les seues proves) i refà el que contradiu l'arbitratge o la decisió del Mestre:
- la Plantilla genera l'XLSX des de la proposta sense aprovar, amb l'any i el trimestre per defecte escrits a mà i un titular inventat («Titular pendent»);
- les barres, enceses de veres;
- els prefixos personals de numeració d'Anthropic a `cataleg.js`.

### DECISIÓ DEL MESTRE · 21:20 (resol la col·lisió)

1. **Implementa Claude, en exclusiva.** Cap altre agent ha d'editar `src/sections/gestoria/`, `src/apps/gestoria/`, `src/components/PedraSeca/` ni `src/components/universal/barres/` fins que Claude tanque este torn ací.
2. **T2 (avatar):** es queda la via dins de Pedra Seca que ja és al disc (PaginaApp, UniversalCard i BarraTaronja amb `useResolvedAsset`). Claude hi afig les proves i la derogació escrita. No es toca `fontSessio.js`.
3. **Punt 5 (barres):** Comentar, Compartir i Connectar visibles i inoperatives, amb un avís honest. No es perd la lectura.

### Relleu de progrés · 21:17 · COL·LISIÓ D'IMPLEMENTACIÓ (aturada)

- A les 21:10-21:13, un altre actor que no és Claude ha editat `src/` mentre Claude implementava: `PaginaApp.jsx`, `UniversalCard.jsx` i `BarraTaronja.jsx` (T2 amb `useResolvedAsset` dins de Pedra Seca) i `targetesTauler.js` (la seua `trimestreOperatiu`, ja connectada a `dadesDelTauler`). L'informe de Gemini 4 deia que no tocaria `src/`.
- Les dues `trimestreOperatiu` van quedar declarades al mateix fitxer (error de sintaxi). Claude ha retirat les seues dues edicions (`targetesTauler.js` i `cabinaAvio.js`, que torna a ser idèntic a HEAD) i ha aturat els seus quatre agents d'implementació abans que escrigueren res. Al disc només queda el canvi de l'altre actor.
- Estat de les proves: `targetesTauler.test.js` té 4 proves roges per aquell canvi (esperen el 4T); les guardes de Pedra Seca i de fronteres passen (13 fitxers, 198 proves).
- **Claude no tornarà a editar `src/` fins que el Mestre diga qui implementa.** Les propostes arbitrades d'ací baix estan llestes per a qui ho faça.

### Mètode

Gauntlet: sis investigadors en paral·lel (T1, T2, T3, T4, T5 i B, les barres i la governança), cadascun amb un àrbitre que ha intentat refutar-lo tornant al codi i a les dades. Han caigut 2 troballes (T3-04 i T5-11) i n'han quedat 6 com a incertes. Els àrbitres han refet els dissenys. Tot el que hi ha ací porta evidència `fitxer:línia` als informes dels agents.

### T1 · Trimestre operatiu (confirmat)

- **Causa:** `targetesTauler.js:588` fa `delFull ?? trimestreDeData(avui)`. El 14-10-2026 és el 4T i `tram(01-10, 31-12)` dona «El 4T 2026: dia 14 de 92». El botó «Hui» repetix l'error (`ShellGestoria.jsx:426`).
- **Remei arbitrat:**
  - `presentacioOberta(avui)` i `trimestreOperatiu(avui)` a `targetesTauler.js`. Mai a `nucli/dates.js`, que tornaria a «pendent» els sis tractors.
  - Ordre de preferència del trimestre: el triat a la capçalera, després el del Full, després `trimestreOperatiu(avui)` i, per últim, `trimestreDeData(resum.fins)`.
  - El botó «Hui» passa a `trimestreOperatiu`.
  - El rellotge ja diu «Presentació del 3T 2026: dia 14 de 20». Li falta el compte enrere, «queden 6 dies», reutilitzant el text dels venciments de `cabinaAvio.js:95-100`.
- **El que trencaria el canvi de l'altre actor si es queda així:**
  - 4 proves de `targetesTauler.test.js` i 5 de `ShellGestoria.test.jsx`.
  - Les fixtures amb AVUI = 04-10 cauen dins de la finestra del 3T. Si no es mouen, les proves del cable del Full queden buides i no discriminen res.
  - La fitxa `gestoria_tauler.md:15` i `:60` diu «el d'avui». Entra a l'empremta que signa el Mestre.
- **Deute anterior visible:** `terminiPresentacio` no passa al dia hàbil. El 30-01-2027 és dissabte. La gestoria ho ha de confirmar.

### T2 · Avatar del titular (confirmat el mecanisme; falta la prova del Mestre)

- **Causa:** la foto pujada arriba com a `sdp-media://mitjans/…`. `fontSegura` la descarta (`marca.jsx:37-40`, esMitjaOpac), i la barra taronja i les targetes pinten la silueta. El Xat i la barra negra la veuen perquè la resolen pel port (`CaraXat.jsx:46-58`, `AvatarResolt.jsx:23-26`).
- **Remei de l'àrbitre:** resoldre-la una sola vegada a `src/apps/plataforma/fontSessio.js`, que no és font de cap tractor. Cal una derogació escrita de la frontera del 261006 (`sessioApp.js:136-137`) i actualitzar la guarda `sessioApp.test.jsx:862-869`.
- **Remei de l'altre actor (en disc):** resoldre-la dins de Pedra Seca (PaginaApp, UniversalCard i BarraTaronja). Passa les guardes actuals, però fa que totes les apps que pinten una UniversalCard amb una referència opaca criden el port.
- **Decisió del Mestre:** una via o l'altra, no les dues.
- **Prova diferencial pendent:** si al Xat i a la barra negra veus la teua foto, el diagnòstic és este. Si hi veus inicials, l'avatar és null o d'un origen no registrat, i el remei no servix.

### Quadre de comandament i T3 «Plantilla Gestoria» (confirmats)

- **Canvi de nom:** «Quadre de comandament» a `Tauler.jsx:98` i a l'H2 de `CabinaAvio.jsx:135`. Es conserva el valor intern `cabina`. També cal canviar-ho a la fitxa (línies 7, 17 i 40).
- **El que no existix encara:**
  - el cable `onFactures` porta la proposta editada, no l'aprovada, i no porta ni el titular ni els bytes aprovats (`PanellGestoria.jsx:663-677`);
  - generar l'XLSX des del Quadre saltaria la segona aprovació i faria mentir `TRACTOR_TAULER.escriu: ['Res']`.
- **Remei arbitrat:**
  - una secció final «Plantilla Gestoria», apilada i sense pestanyes, per la Llei del Píxel;
  - un component nou, `src/sections/gestoria/PlantillaGestoria.jsx`, fora de `tauler/` i font de Factures;
  - mostra només el full generat (`entregables.full`): «Descarrega l’XLSX» en un clic, amb el nom canònic, i «Prepara el correu» (EnviamentGestoria, la tercera aprovació intacta);
  - el cable afig `titular` i `entregables`;
  - `hrefFull` des del pont.
- **Cost en signatures:** Tauler, Històric, Factures i Correus.
- **Indicador mal calculat:** el 130 es calcula sense `pagamentsAnteriors` (`targetesTauler.js:590`). Al 3T, «Hisenda a pagar» ix inflada i la liquiditat rebaixada.

### Punt 5 · Barra blava i peu (confirmat)

- **Per què no es poden encendre tal qual:** Comentar i Connectar naveguen fora de `/app/gestoria` i perden la lectura dels extractes (`useTauler.js:11`). Compartir passa per una via que la guarda de privacitat no veu (`useAccions.js:249-265`).
- **Remei arbitrat:** les accions es pinten amb l'anatomia estàndard, però inoperatives i amb un avís honest, amb el contracte `accionsInoperatives` + `onClickInoperatiu` que ja té PageFrame (el precedent és l'editor).
- **Pregunta per al Mestre:** les vols vives, encara que en eixir es perda la lectura?

### T4 · Factures que falten al 3T 2026 (llista per al Mestre, a revisar)

Font: l'extracte Norma 43 de `2026_Bancs` (de l'01/01 a l'01/10/2026) creuat amb `2026_3T/`.

- **Falten segur:**
  - Som Energia, factura FE2600756618 (cobrada el 17/07).
  - Lowi (Vodafone): les tres del trimestre (cobraments del 14/07, el 12/08 i el 14/09). A la carpeta no n'hi ha cap; `factura.pdf` i `factura copia.pdf` estan xifrats i no se sap de qui són.
- **Indicis:**
  - OpenAI: 23,00 € cada dia 6 (juliol, agost i setembre), sense factura. Si és despesa de l'empresa, cal baixar-les.
  - Anthropic, sèrie RH6NJLVP: falta la 0004, entre el 28/08 i el 06/09. Pot ser anul·lada.
  - Google: quatre càrrecs petits sense factura, probablement d'un compte de Google Cloud. Al 2T falta el Workspace de juny.
  - Un rebut SEPA de 133,10 € (03/08) d'una persona física: cal preguntar si és de l'empresa.
- **Fora del trimestre:**
  - Anthropic 9BF0758D-7940113: és del 4T (07/10).
  - Sollutia A.296 i A.297: són del 05/03 (1T) i no són al full del 1T. La gestoria decidix on van.
- **Sense cobrament a l'extracte:** Anthropic 9BF0758D-7161447 (29/09). L'extracte acaba l'01/10.
- **Del 1T:** hi ha quatre factures de SiteGround a la carpeta que no són al full.
- **Fonts:**
  - `account_activities_202607.csv` no és del banc: és la facturació de Google, i `classifica.js` el pren per extracte.
  - Per a posar nom als càrrecs de targeta, cal el CSV de moviments del 3T.
- **Remei arbitrat (fase A):**
  - un mòdul pur, `nucli/facturesQueFalten.js`, que reutilitza `auditaTrimestre`, `aprenProveidors` i `concilia`;
  - compta per data, amb el «recompte caigut» i un pagament al banc només quan hi ha un candidat únic;
  - es pinta com a secció penúltima del Quadre;
  - el cobrix el tractor del Tauler;
  - cap URL nova sense aprovar-la abans a `privacitat.test.js`.

### T5 · Benchmarking i Rebost ↔ TPV ↔ Gestoria (especificació, res abans del 20-10)

- **REA (`morluto/rea`) existix:** és un MCP d'enginyeria inversa (binaris, apps JS/Electron, .NET i webs). Ús: només al laboratori i sobre pàgines públiques.
- **El contracte TPV → Gestoria ja existix, però no s'usa:** és `sdp.vendes.v1`. La Gestoria no el pot llegir sense un tractor nou (`gestoria.vendes`) i sense ampliar la llista blanca de privacitat.
- **Quin rebost:** el que porta preus és el rebost del Bar (escandalls). El Rebost Domèstic és de la llar i la frontera LLAR el veta, així que la proposta de Gemini (la nevera domèstica i la Frontissa de Sollutia per a les factures) no és viable.
- **Un apunt resum de tiquets sense NIF** quedaria sempre «pendent». Per a acceptar-lo cal tocar `model.js`, i tornarien a «pendent» set artefactes.
- **Règim fiscal:** només hi ha l'estimació directa. Un bar en mòduls no es pot modelar [NO VERIFICAT].
- **Indicadors que es poden calcular ja:** pendent de cobrar, amb antiguitat; pendent de pagar; posició prevista; i marge de l'any.

### Contrast amb l'auditoria de Gemini 4 (`261014_2040`)

- **Coincidim en el diagnòstic** de T1, de T2 (`sdp-media://`), de la clausura de l'Històric i de Som Energia i Lowi.
- **Errors de Gemini:**
  - cites inexistents (`CabinaAvio.jsx:262`, quan el fitxer té 172 línies; `onHui` amb `dataAvui`/`setAvuiActual`, que no existixen);
  - un esquelet de `VISTES_TAULER` amb `id` en lloc de `valor`, que trencaria el commutador;
  - proposa encendre les barres sense dir que es perd la lectura;
  - la seua llista del 3T no té OpenAI ni els càrrecs de Google.

### Retroalimentació de la plantilla `prompt_local`

- **Dos camps nous al preflight:** els tractors afectats i les portes de clausura i privacitat.
- **Un camp d'implementador únic** per fitxer o per front: este torn, dos agents han picat el mateix codi alhora.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Línia base abans de cap canvi:** totes en verd (T1: 130/130; T2: 153/153; T3: 61/61; T5: 96/96; B: 121/121).
- **Després de la col·lisió (21:15):**
  - `npx vitest run src/sections/gestoria/tauler/nucli/targetesTauler.test.js src/sections/gestoria/tauler/nucli/cabinaAvio.test.js`: 4 proves roges de `targetesTauler.test.js`, pel canvi de l'altre actor;
  - `npx vitest run` de `qualitat.mitjaOpac`, `marca`, `fronteres`, `PaginaApp` i les barres: 13 fitxers i 198 proves en verd.
- **Navegador integrat (sense sessió):** «El 4T 2026: dia 14 de 92» abans de cap canvi.
- **Final (22:15):**
  - `npx vitest run src/sections/gestoria src/sections/tractors src/apps src/components/PedraSeca src/components/universal src/hooks src/utils src/sections/xat src/sections/profile src/sections/disseny`: 602 fitxers passen i 1 s'omet; 10.402 proves passen i 7 s'ometen; cap roja. Inclou `clausura`, `privacitat`, `qualitat` (ESLint amb zero avisos) i `fronteres`.
  - `ShellGestoria.test.jsx`: 47/47, amb una integració de punta a punta: analitzar el 3T, «Genera el full», Quadre, Plantilla i «Descarrega l’XLSX».
  - `node tooling/gates/porta-olivera.mjs --informe`: Escriptori net. Els avisos de sediment de l'índex (CONV-07) ja hi eren.
- **Navegador integrat (final):** «3T 2026 · Presentació del 3T 2026: dia 14 de 20 · queden 6 dies».
  - A la barra blava, Comentar, Compartir i Connectar porten `aria-disabled`. Compartir pinta l'avís i la ruta no canvia.
  - El Quadre acaba en «Factures que falten» i «Plantilla Gestoria».
  - «Obri el Full trimestral» porta a `/app/gestoria/full`.
  - Consola neta en una càrrega nova.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense sessió del Mestre:** el navegador integrat no la té i no s'hi entra cap contrasenya, així que l'avatar no s'ha pogut veure en viu. Cal la prova del Mestre amb la seua sessió: la foto a la barra taronja i a les targetes.
- **Plantilla i factures que falten amb dades reals:** no s'han vist en viu. Calen el tractor signat, la carpeta del 3T i el CSV de moviments.
- **Atribucions per inferència:** les dels càrrecs de targeta (OpenAI, Google Cloud) ho són. Cal el CSV de moviments del 3T.
- **Terminis:** són [NO VERIFICAT]. El pas al dia hàbil no està implementat.
- **Sense commit:** res comitejat; l'arbre també porta canvis d'altres agents.
- **Tancament:** `.agents/ESTAT.md`, `.agents/LEDGER.md` i `tancament.mjs` són governança. El hook els bloqueja a Claude, i els ha de fer MarIA amb `executor-mutacio.mjs`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio]]
- [[261014_2015_prompt_claude_i_gemini4_quadre_comandament_gestoria]]
- [[261014_2040_auditoria_gemini4]]
