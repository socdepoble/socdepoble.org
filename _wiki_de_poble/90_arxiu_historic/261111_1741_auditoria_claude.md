---
type: informe
status: esborrany
description: 'R19 Carril 0+1: estat CAS dels kits R18, portes, reanomenat zonaHerbari, Panell de Control i auditoria botànica de les làmines del Node 0, amb MCR i D01-D15'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c07d6452-890f-4994-abdb-168cf2457b70:2a1d915f-7192-47b3-a8d3-131d2b20b417
---
# Auditoria de Claude · Onada R19, Carril 0+1: arbitratge del COMMIT R18, Panell i rigor botànic

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c07d6452-890f-4994-abdb-168cf2457b70:2a1d915f-7192-47b3-a8d3-131d2b20b417 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T16:41:32.017Z |
| Modificació | 2026-11-11T19:18:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Claude Code, Ultracode |
| Tokens consumits | Sense comptador per torn a la sessió; els workflows es declaren a Verificació |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T16:41:32.017Z · Esborrany creat amb el circuit documental (torn `torn_c07d6452`, abast `code`).
- 2026-11-11T16:56:00.000Z · Relleu viu del Loop 1: portes, `design_guard` a 0/0, reanomenat `zonaHerbari`, estat CAS mesurat i workflow del Loop 1 en marxa.
- 2026-11-11T19:18:00.000Z · Loop 1 i Loop 2 tancats: MCR, D01–D15, vot del kit de Codex, consens botànic i ordres del COMMIT R18 per a MarIA.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Senyal per al tauler

El hook (`tooling/gates/hooks-local.mjs`) refusa escriure fora del repositori («Ruta fora del repositori»). Este bloc és l'entrada de Claude a la Mesa de Consens i s'actualitza en cada loop. MarIA el copia a `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/TAULER_CONVERSA_I_CONSENS_R19.md`.

```markdown
## Claude · Loop 1 (17:41 CET, en marxa) · Carril 0+1

- design_guard.mjs --arrel=src: 0 crítics, 0 avisos (abans 4). [CONFORME]
- tractor-enxufe.mjs E1..E4: exit 0. tractor-rls.mjs: 0 infraccions sobre 95 fitxers SQL. porta-olivera: verda.
- Reanomenat zonaCanaleta → zonaHerbari (5 fitxers de src, 353 mencions): 60/60 proves de l'herbari en verd.
- [OBJECCIÓ P1-PANELL-03 · confirmada] registrePlugins.js:553 té genealogia amb obrir: null perquè el kit R18-EXTREME de Carbon va sobreescriure la versió de P0-114 de Claude. En correcció al Loop 1.
- Kit R18.2 de Codex: aplicat a l'arbre viu (mesura byte a byte amb wc -c). Possibles pèrdues de fusió en censImatges.js, avisadorPreferencies.js i pageContent.js: en diagnosi.
- Mesa: el hook de Claude no deixa escriure a ../_investigacio_ia_de_poble/. Les objeccions de Claude viuen a 04_escriptori/261111_1741_auditoria_claude.md.

### [OBJECCIÓ P0-BOT-02 · Claude · 18:05 CET] El Gauntlet del Node 0 inverteix fets correctes. NO injectar AUDITORIA_BOTANICA_GAUNTLET_NODE0_R19.json ni generar imatges amb els seus prompts.

- herbari-005-ametler (Prunus dulcis): el JSON diu «fil·lotaxi oposta, no alternada», «composició pinnada, no simple» i «merisme cymós». Realitat: fulles ALTERNES i SIMPLES, oblongolanceolades, de marge serrat-crenulat; flors solitàries o geminades, pentàmeres. El prompt_v1_habit i el prompt_v2_macro ja porten «leaf arrangement (opposite)»: generarien una planta falsa.
- herbari-083-olivera (Olea europaea): el JSON diu «alternada, no oposada», «marge dentat, no enter» i «flors unisexuals, no en panícula». Realitat: fulles OPOSADES, simples, de marge ENTER; flors hermafrodites (o polígames), tetràmeres, amb 2 estams, en panícules axil·lars.
- Causa 1 (sense font): wikiImageUrl és "" en els dos registres. fetch_wiki_extracts (orquestrador, línies 65-83) s'empassa qualsevol error amb except: pass; el crític treballa sense cap extracte i no ho declara.
- Causa 2 (biaix del crític): el prompt de phi4 (línies 155-165) li demana trobar el que és «FALS» i tornar «claus corregides», sense opció de conservar el que és correcte ni d'aportar la cita de la font. Un model local de 14B sense font gira els caràcters per a complir.
- Causa 3 (cap porta determinista): aprovatInicial false però el tauler els anuncia com a «llestes per a laminesBotaniquesNode0.js + Z-Image-Turbo».
- Correcció proposada: (a) sense extracte no buit de Wikipedia o Wikispecies → registre «sense_font», cap correcció; (b) cada correcció del crític ha de citar literalment la frase de la font, i es descarta si la cita no és a l'extracte; (c) taula determinista de caràcters clau (fil·lotaxi, composició, marge, merisme, estams, fruit) com a prova (laminesBotaniquesNode0.rigor.test.js, carril de Codex) que el JSON del Node 0 ha de passar abans d'injectar res; (d) els prompts d'imatge es generen des de la taula verificada, no des del text del model.
- L'orquestrador no escriu a src/ ni a public/ (només al JSON, al dossier i al tauler): l'arbre viu no està afectat.

## Claude · Loop 1 tancat (19:36 CET) · 19 agents, 4 fases (construcció, Gauntlet de 4 àrbitres, correcció, reverificació)

- T3 Genealogia al Panell [CONFORME després de correcció]: registrePlugins.js obri /app/genealogia amb ESTAT_PROVES; GESTORIA_COMPILADA, SALUT_COMPILADA i GENEALOGIA_COMPILADA amaguen targeta i insígnia quan el build les trau (paquet de l'amfitrió). aplicacions.js: set fitxes connectades + Snippet (/control?fitxa=snippet); DetallEspai passa per useDestiDelPlugin i pinta «No disponible ací» amb el motiu del Panell. Motiu 'document-no-propi' en cinc llengües: «Guarda dades personals delicades…» (ja no diu «salut» per a l'Arbre). /versions: «a la web pròpia de Sóc de Poble, hui el porten set».
- [OBJECCIÓ ALS KITS] Codex i Carbon: si el vostre kit porta registrePlugins.js, presentacioPlugins.js, registrePlugins.test.js, aplicacions.js, DetallEspai.jsx o pageContent.r10.js d'una instantània anterior, la precondició CAS ha de fallar. No forceu: obrir null de R18-EXTREME és una regressió (P1-PANELL-03).
- CAS: restaurades dues pèrdues de fusió que la diagnosi va demostrar. FitxaArbreMonumental.jsx recupera l'arbitratge R17.3 (Xylella amb font, CIEF sense «Decret 154/2018», Ordenança amb notaFont, «sense dada verificada»). paginesTrilogiaIMoliEditorial.js recupera la regex CORREU fitada de Carbon (ReDoS: 4.421 ms → 375 ms). Intencionats i no restaurats: censImatges.js, arbresMonumentals2020.test.jsx, mapes evacuats. Incert (decidix el Consell): sessió d'Avisador R18.2 (avisadorClau R17.2 contra clauAvisadorDelXat).
- tractor-cens C4: 6 correccions lèxiques («8 escoles locals», «3 fronteres d'enginyeria») a agents_equip_ia.md, 00_index_escriptori.md i l'acta 261110_0618 (esmena sense rastre: MarIA l'anota al LEDGER). Queden 7 coincidències en fitxers que Claude no pot tocar: .agents/ESTAT.md:183 i el pla R19 (l.58 ×4, l.138 ×2; vinculat amb hash al torn de MarIA). C3 de tractor-cens és inert: consell.json no té no_membres.
- Frontissa: cap de les 9 claus es pot aprovar tal com està (8 «corregir abans», 1 «decisió humana»). La més greu: receptes ha perdut «proposta assistida, pendent de validació humana» als al·lèrgens (salut, R15b RV-03). En correcció al Loop 2.
- Botànica [OBJECCIÓ P0-BOT-03]: auditoria visual de les 67 làmines de laminesBotaniquesNode0.js (24 espècies). 10 conformes i 57 amb objecció; a més, falten 3 variants. La síntesi exacta per severitat arriba amb el Loop 2. El text de l'ametler descriu «inflorescències capçudes» (és flor solitària o geminada). avisMetodologic diu «auditada morfològicament»: afirmació falsa en present. Proposta: retirar eixa frase i les làmines amb P0 fins que passen laminesBotaniquesNode0.rigor.test.js.
- Suite: 10 proves roges al Perfil i 14 fitxers de la Consola per SquareBadge.jsx:61 (useUIActionsOpcional sense guarda; R18). En correcció al Loop 2.

## Claude · Loop 2 tancat (20:16 CET) · 14 agents (6 correctors, 6 àrbitres, auditoria del kit de Codex, síntesi botànica)

- SquareBadge [PASSA]: guarda useAccionsUIOpcional amb el patró de useTraductorOpcional; cap píxel. src/sections/profile 110 fitxers i src/sections/consola 55 fitxers en verd.
- Xylella [PASSA]: revisionsArbresCief.js ja no diu «contenció», «obligatòria» ni «urgència»; amenaces i mesures null («sense dada verificada»); la prova R19 mira també els panells Revisions i CIEF. Prova ReDoS per raó de mides, no per llindar absolut.
- Workspace [PASSA]: CatalegWorkspace.estatPublicacio, PageFrame.logo i enganxatCamps en verd.
- Rancis [PASSA]: comentaris DEROGAT, etiquetaObrir del registre al Perfil («Obrir l’Arbre Genealògic»), icona Users per a l'Arbre, apps-del-paquet.test.mjs amb genealogia.
- Proves de text [PASSA després d'arbitratge]: AparadorFediversity deriva 53/153 del contracte viu; paginaDeText separa el copyright d'entrada (COPYRIGHT_SDP, P0-115) dels drets de l'obra (DRETS_QUE_DINEM a CreditsQueDinem). Claude ha tancat les dues roges que quedaven: BancLlavorsWorkspaceSection.jsx usa useUIStateOpcional (objectesDeContext 6→5 importadors, cap píxel) i l'enllaç /plugin/genealogia del valencià d'aiVoice torna a ser <strong> (llei T8). PageDetailSection T8 accepta el Fragment del showcase de publicar_mapa (R18) i conserva la invariant del botó baix.
- [OBJECCIÓ P1-ALERGENS-02 · oberta] Al·lèrgens de /page/receptes: el text ja torna a dir «proposta assistida, pendent de validació humana» en cinc llengües, però l'àrbitre demostra que «la proposta mai diu que no n'hi haja» és fals des de R17/R18: la matriu mostra «— No en porta segons el text» en 1.730 de 2.086 files. Proposta ca: «Quan una fila diu “— No en porta segons el text”, descriu el text del llibre, no el plat: només una persona pot declarar que un al·lergen no hi és.» Decidix MarIA o el Mestre (les cinc llengües, eu i gl sense revisió nativa).
- [VOT KIT CODEX R19 · integrar_amb_condicions] (1) cas_drift: set fitxers del kit han canviat al viu després del segell (5 idiomes, pageContent.r10.js, AparadorFediversity.test.jsx); verifica_i_aplica.py el refusa sencer. No forçar: Codex torna a segellar sobre l'arbre post-COMMIT R18 o fusió a 3 vies en còpia, conservant documentNoPropi, /versions i AparadorFediversity del viu. (2) P1: tests/copublicacio-postgres.test.mjs fa skip sense SDP_PGLITE_MODULE i no és a test:precommit; cap porta executada sosté l'AAL2. (3) P1: la Wiki del port passa de «no són 153 operacions verificades en remot» a una promesa positiva; cal conservar la fórmula negativa amb 156. (4) P2: títols de la IAIA a IndexedDB sense oblit; rigor.test.js de les làmines passa sense cap variant; administracio-multipoble perd el recompte de migracions. PII: cap nom real a les fixtures GEDCOM.
- [CONSENS BOTÀNIC Claude + Codex] Les dues auditories independents arriben al mateix: les 67 làmines no es poden publicar. Codex les posa en quarantena al seu kit; la síntesi de Claude sobre 72 caselles (24 espècies × 3 variants): 10 conformes, 27 P0, 22 P1, 8 P2 i 5 absents. Textos: 127 objeccions (19 P0, 45 P1, 63 P2); 13 de 24 textos amb algun P0. Causes: llavors genèriques a totes les v3, fulles i flors d'una altra família, fenologia impossible i cultivars sense el seu tret. Codex porta 24 estudis morfològics corregits al seu kit; els 24 de Claude (amb fonts Flora Iberica i POWO) s'han de contrastar amb els de Codex abans d'injectar res a laminesBotaniquesNode0.js.
```

### Relleu viu

- **17:42 · Portes.** `design_guard` tenia 4 crítics: `#619` sense el prefix `WP` que la porta ja exclou (dos comentaris) i dos dobles de `UniversalPage` amb `<h1>` a `Columna2Canonica.test.jsx`. Els dos specifiers (`UniversalPage` i `UniversalPage.jsx`) resolen al mateix mòdul i Vitest el mocka per identitat resolta: en queda un, amb l'`<h1>` dins de `header.page-title`, com a `PageFrame`. Resultat: 0 crítics, 0 avisos; 10/10 proves.
- **17:43 · T2.** `zonaCanaleta`, `zonesCanaleta` i `localitzacionsCanaleta` passen a `zonaHerbari`, `zonesHerbari` i `localitzacionsHerbari` a `herbariLaTorre117.js`, la seua prova, `FitxaHerbari.jsx`, `modelHerbariWorkspace.js` i `pageContent.r9.test.js`. Cap altre fitxer del repositori els usa. El topònim «Camí Volaor-Parades-Canaleta» d'`arbresMonumentals2020.js` i el nom del fitxer font `cartells_la_canaleta.txt` (dada de procedència amb SHA-256) queden intactes. 60/60 proves.
- **17:50 · Estat CAS mesurat.** El kit R18.2 de Codex està aplicat: la majoria de postimatges tenen els mateixos bytes a l'arbre viu i la resta han crescut després (Carbon, MarIA). Quatre fitxers són més curts que el kit i es diagnostiquen: `censImatges.js` (−7.450 B), `avisadorPreferencies.js` (−580 B), `pageContent.js` (−74 B) i `arbresMonumentals2020.test.jsx` (−58 B). Del suplement T4 de Genealogia, cinc de set fitxers són idèntics i dos han crescut.
- **17:52 · Genealogia al Panell.** L'app `/app/genealogia` existix i està registrada a `registreApps.js`, però `registrePlugins.js` torna a dir «en obres» amb `obrir: null`: el kit de Carbon va portar una instantània anterior a P0-114. `aplicacions.js` té totes les utilitats en `pendent`.
- **18:05 · Anella del Node 0.** El primer lot del Gauntlet botànic local (dues espècies, 16:47-16:50 UTC) empitjora la font: gira la fil·lotaxi de l'ametler i de l'olivera. Vegeu l'objecció P0-BOT-02 al senyal. La visió directa de `herbari-083-olivera-v2-macro.webp` (lectura de la imatge) mostra flors de cinc pètals amb més de dos estams al costat d'olives verdes: també la imatge actual té una al·lucinació morfològica (l'olivera fa flors tetràmeres amb 2 estams). L'auditoria visual completa de les 67 làmines és al workflow del Loop 1.
- **19:36 · Loop 1 tancat.** Workflow de 19 agents (4,86 M de tokens, 1.351 crides, 104 minuts). Genealogia: el constructor va encendre l'Arbre; quatre àrbitres el van tombar (tres P1 al paquet de l'amfitrió, la frase falsa «només s'omple amb el teclat», el Snippet sense sincronitzar i la doble política Perfil/Panell); la correcció ho va resoldre tot i la reverificació confirma les huit objeccions resoltes. Només queda roja la suite del Perfil per `SquareBadge.jsx:61`, que no és del carril. CAS: dues restauracions, cap reintroducció de mapes evacuats (prova `fotos.mapa === null` als 19 arbres). Cens: sis esmenes lèxiques. Frontissa: nou claus revisades. Botànica: 24 espècies, 67 làmines.
- **19:36 · Loop 2 llançat.** Sis carrils de fitxers disjunts (SquareBadge, al·lèrgens, Xylella, proves de text, Workspace, comentaris rancis), un àrbitre adversari per carril, auditoria creuada del kit R19 de Codex i síntesi botànica.
- **19:45 · Navegador.** `/control` pinta set targetes amb «En proves · Beta oberta», l'Arbre Genealògic inclòs, i cada enllaç té nom accessible. `/app/genealogia`, `/app/salut`, `/app/gestoria`, `/app/bar`, `/app/nevera/casa`, `/app/lector` i `/page/avisador` carreguen sense cap alerta. Per a una onada següent: les apps no tenen `h1` dins de la closca de la plataforma i `/app/nevera/casa` acaba a `/app/nevera/casa/casa` (cal comprovar si és la subvista prevista).
- **20:16 · Loop 2 tancat.** Quatre carrils passen a la primera; dos fallen a l'arbitratge. Claude tanca les roges amb diagnòstic exacte (BancLlavors, enllaç T8, PageDetailSection T8): 8 fitxers i 261/261 proves, més 13/13. Queda oberta la frase d'absència dels al·lèrgens (P1-ALERGENS-02) per a decisió humana.

### Matriu de Conformitat de Requeriments (MCR)

| Requeriment | Estat | Evidència i abast |
| --- | --- | --- |
| T1 · Portes constitucionals a 0 | `[PARCIAL]` | design_guard 0/0, tractor-enxufe E1–E4, tractor-rls 0/95, Olivera verda. tractor-cens: 7 coincidències C4 en fitxers que Claude no pot escriure (ESTAT:183, pla l.58 i l.138). tractor-pedra-seca i frontissa-contingut: no executables pel hook. |
| T1 · Correccions de les 16:08 preservades | `[FET]` | `{ SquareBadge }`, NotFoundPage diferida, mapes evacuats (`fotos.mapa === null` als 19 arbres), cap entitat no registrada com a publicadora a les fitxes tocades. |
| T2 · zonaCanaleta → zonaHerbari | `[FET]` | 5 fitxers de src, 60/60 proves. Topònim i fitxer font conservats. |
| T3 · /app/genealogia al Panell i sincronia amb el Perfil | `[FET]` | Registre, aplicacions, DetallEspai i motiu del Panell en cinc llengües; paquet de l'amfitrió sense targeta ni insígnia. 1.387 proves de plugins, control, plataforma i genealogia. |
| T3 · COMMIT R18, push i deploy | `[NO FET]` per Claude | Bloquejat pel hook; ordres per a MarIA a Límits. |
| T3 · Frontissa (9 claus) | `[NO APROVABLE ENCARA]` | 8 «corregir abans» i 1 «decisió humana» (dispositius). aiVoice i /versions ja corregits al Loop 1. |
| Loop 2 · Fortificació de les apps del Panell | `[FET]` en proves | 213 fitxers i 4.792 proves de Salut, Gestoria, Bar, Nevera i Lector; set rutes verificades al navegador. |
| Loop 2 · Suite que bloqueja el COMMIT R18 | `[FET]` en els lots executats | SquareBadge, objectesDeContext, paginaDeText, AparadorFediversity, PageDetailSection T8, CatalegWorkspace, PageFrame.logo i enganxatCamps en verd. La suite global sencera no s'ha executat en este torn. |
| Loop 3 · Auditoria creuada dels kits R19 | `[PARCIAL]` | Kit de Codex: vot «integrar amb condicions». Kit de Carbon R19: no auditat en este torn. |
| Loop 3 · Làmines del Node 0 sense al·lucinacions | `[NO COMPLIT]` | 10 de 72 caselles conformes. Consens Claude + Codex: quarantena. |
| Consens unànime | `[NO FET]` | Claude i Codex coincidixen en botànica i Genealogia; falten el vot de Carbon i el del Node 0. |

### Dimensions D01–D15

Escala del pla: 5 = capacitat parcial observada, 8 = capacitat local amb proves adversarials, 10 = acceptació completa.

| Codi | Dimensió | Nota | Evidència i límit |
| --- | --- | --- | --- |
| D01 | Enxufabilitat i Port Neutral (Model B) | 8/10 | E1–E4 en verd; Claude no toca el port. Integració remota pendent. |
| D02 | Seguretat, RLS, Auth AAL2 i Sanejament | 7/10 | RLS 0/95; regex de correus fitada amb prova roja-verda. L'AAL2 del kit de Codex no té porta executada. |
| D03 | Disseny Pedra Seca i Coherència Geomètrica | 8/10 | Design Guard 3.771 fitxers, 0/0. tractor-pedra-seca no executat. |
| D04 | Accessibilitat WCAG 2.2 AAA i Ergonomia Rural | 6/10 | Noms accessibles i etiquetes iguals al Panell i al Perfil. Apps sense `h1`; cap prova AAA. |
| D05 | Rendiment i Pressupost del Nucli Verge | 6/10 | Canvis dins de trossos diferits; el pes no s'ha mesurat (build bloquejat). |
| D06 | Local-First, Resiliència Offline i Privadesa | 7/10 | Cap PII familiar. Títols de la IAIA sense oblit (kit Codex). |
| D07 | Paritat Pentalingüe i Qualitat Editorial | 6/10 | Motiu i Genealogia en cinc llengües. Al·lèrgens eu i gl sense revisió nativa; Frontissa detecta subtítols incoherents. |
| D08 | Custòdia Patrimonial i Ètica d'Autoria | 5/10 | Xylella i autoria de dos nivells restaurades. Làmines no publicables; llicència CC de «Què dinem?» no acreditada. |
| D09 | SEO Semàntic, Social Cards i Federació POSSE | 5/10 | No exercit en este torn. |
| D10 | Dades Obertes i Portabilitat Municipal | 7/10 | La presentació de l'Arbre diu la veritat sobre GEDCOM i la còpia anonimitzada. |
| D11 | Qualitat de Proves i Verificació Mecànica | 7/10 | Cada correcció amb fase roja i àrbitre. Suite global sencera no executada. |
| D12 | Compatibilitat Multi-Dispositiu i WebKit Rural | 5/10 | Només comprovació d'escriptori al navegador integrat. |
| D13 | Governança Documental i Higiene d'Escriptori | 6/10 | Circuit documental vàlid. Frontissa amb 9 pendents; esmena lèxica d'una acta sense rastre al LEDGER. |
| D14 | Gratuïtat Radical i Claredat del Sistema de Plugins | 9/10 | Set eines obertes amb insígnia honesta; el paquet de l'amfitrió no promet el que no porta. |
| D15 | Sostenibilitat Estratègica i Orquestració Colmena | 6/10 | 33 agents amb àrbitres. El tauler no és escrivible per a Claude; Carbon sense auditar. |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Design Guard | `node tooling/gates/design_guard.mjs --arrel=src` | Abans: 4 crítics. Després: 3.771 fitxers, 0 crítics, 0 avisos |
| Enxufe | `node tooling/gates/tractor-enxufe.mjs` | E1..E4 en verd |
| RLS | `node tooling/gates/tractor-rls.mjs` | 0 infraccions estàtiques sobre 95 fitxers SQL |
| Olivera | `node tooling/gates/porta-olivera.mjs --informe` | Safata buida; 8 documents vius declarats |
| Proves de les portes | `npx vitest run src/sections/patrimoni/Columna2Canonica.test.jsx src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx` | 10/10 |
| Proves de l'herbari | `npx vitest run src/data/patrimoni/herbariLaTorre117.test.js src/sections/text/pageContent.r9.test.js src/sections/patrimoni/HerbariWorkspaceSection.test.jsx src/sections/detail/PageDetailSection.herbari.test.jsx src/sections/patrimoni/laminesBotaniquesNode0.test.jsx` | 60/60 |
| Loop 1 · Genealogia i Panell (reverificació) | `npx vitest run src/sections/plugins src/sections/profile src/sections/control src/apps/plataforma src/apps/genealogia src/sections/text/pageContent.versions.test.js` (19:26) | 184 fitxers; 2.897 PASS, 10 FAIL (totes per SquareBadge, corregit al Loop 2) |
| Loop 1 · Apps del Panell | `npx vitest run src/apps/salut src/apps/gestoria src/sections/gestoria src/apps/bar src/apps/nevera src/apps/lector` | 213 fitxers; 4.792 PASS, 2 omeses, 0 FAIL |
| Loop 2 · Perfil i Consola | `npx vitest run src/sections/profile` i `npx vitest run src/sections/consola` | 110 fitxers en verd (1.448 PASS en la passada final del lot); 55 fitxers, 1.130 PASS |
| Tancament de Claude | `npx vitest run` de objectesDeContext, paginaDeText, BancLlavors (focus i tornada), pageContent.versions, r9, r10 i ReceptesQueDinem (20:14) | 8 fitxers, 261/261 PASS |
| PageDetailSection T8 | `npx vitest run src/sections/detail/PageDetailSection.test.jsx src/sections/detail/PublicarMapaShowcase.test.jsx` (20:15) | 13/13 PASS |
| Design Guard final | `node tooling/gates/design_guard.mjs --arrel=src` (20:14) | 3.771 fitxers, 0 crítics, 0 avisos |
| Workflows | r19-loop1-claude (19 agents) i r19-loop2-claude (14 agents) | 33 agents, 7,44 M de tokens, 1.971 crides d'eina |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook:** Claude no pot executar `git add`/`commit`/`push`, `npm run lint`, `npm run build`, `tractor-cens.mjs`, `tractor-pedra-seca.mjs`, `frontissa-contingut.mjs` ni escriure a `.agents/`, `tooling/`, `scripts/` o fora del repositori. El COMMIT R18, el deploy i la regeneració de `voresImatges.json`, `wikiManifest.js` i `rag-index.json` són de MarIA o del Mestre.
- **Mesa de Consens:** el tauler és fora del repositori; el senyal de Claude viu en este document.
- **No verificat en este torn:** suite global sencera, ESLint, pes de l'entrada, build web i WordPress, tractor-cens, tractor-pedra-seca, frontissa-contingut, kit R19 de Carbon, mòbil i tauleta.
- **Ordres per a MarIA (COMMIT R18), una per línia, en este ordre:**
  1. Aplicar els dos nouText de C4 al pla R19 (l.58 i l.138), tornar-lo a vincular amb `node tooling/wiki/document.mjs plan --turn-id torn_c9496ba8-7054-4950-af29-31b28476df6c --file _wiki_de_poble/04_escriptori/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md` i corregir `.agents/ESTAT.md:183` («les 8 escoles locals d'Ollama»).
  2. `node tooling/gates/tractor-cens.mjs` i `node tooling/brain/tractor-pedra-seca.mjs`, totes dues amb eixida 0.
  3. Decidir P1-ALERGENS-02 (frase d'absència en cinc llengües) i la llicència de DRETS_QUE_DINEM.
  4. `npm run lint` i `npx vitest run` sencer; qualsevol roja nova s'atribuïx abans de continuar.
  5. Regenerar `voresImatges.json` amb el script Python de la capçalera de `voresImatges.test.js`, i després `npm run build` (sostre web 250.000 B gzip-9).
  6. `node tooling/gates/frontissa-contingut.mjs` i aprovació humana de les 9 claus després de les correccions de l'informe.
  7. `git add` del tall R18 + R19 de Claude, commit amb el hook sencer (sense `--no-verify`) i `git push fork backup-notes-publish`.
  8. Deploy des del commit verificat i migració `2611110455` a Supabase (superadmin + aal2).
  9. Kit R19 de Codex: no forçar el cas_drift; segellar de nou sobre l'arbre post-commit.
- **Text per a l'ESTAT i el LEDGER (escriptura de MarIA):** «R19 · Claude Carril 0+1: Genealogia oberta al Panell amb sincronia Perfil/Panell i paquet de l'amfitrió honest; restaurades l'auditoria R17.3 de Xylella i la regex de correus fitada; suite del COMMIT R18 desbloquejada en els lots executats; Frontissa amb 9 claus per corregir; làmines del Node 0 en quarantena per consens Claude + Codex; esmena lèxica C4 de l'acta 261110_0618 (línies 9, 16 i 42).»

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[../90_arxiu_historic/261111_1720_prompt_claude_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_prompt_claude_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[../90_arxiu_historic/261111_0206_auditoria_claude|261111_0206_auditoria_claude]]
- [[../90_arxiu_historic/261111_0205_auditoria_codex|261111_0205_auditoria_codex]]
- [[../90_arxiu_historic/261111_0612_auditoria_gemini_carbon_extrema_i_futur|261111_0612_auditoria_gemini_carbon_extrema_i_futur]]
