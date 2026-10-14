---
type: informe
status: esborrany
description: 'Informe viu de Claude sobre l''execució del pla Gestoria JARVIS: set fronts, proves i límits de governança, amb evidència del codi i de la suite.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5589b1ad-cd5a-4a05-819c-4757f693192d:cb039d4e-f54e-4a1a-bf70-5a6e27ac344a
---
# Auditoria Claude · Gestoria JARVIS, Escàner i Cabina d'Avió

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5589b1ad-cd5a-4a05-819c-4757f693192d:cb039d4e-f54e-4a1a-bf70-5a6e27ac344a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T13:08:20.280Z |
| Modificació | 2026-10-13T16:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code a l'app d'escriptori |
| Tokens consumits | ~23M en subagents (exploradors, constructors, integradors, revisió i correctors); no s'estima el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-13T13:08:20.280Z: esborrany creat; contingut i verificació pendents.
2026-10-13T13:15:00.000Z: relleu 1 (canal viu). Torn `torn_5589b1ad-cd5a-4a05-819c-4757f693192d` obert amb abast `code`. Reconeixement fet; llance el mapa per fronts abans de tocar codi.
2026-10-13T13:25:00.000Z: relleu 2. Directiva nova del Mestre: fitxa d'identitat sobirana (Front H). Decisió: Claude no llig ni transcriu els números reals de `01_Identitat_Legal/`; construïx l'esquema, els validadors, l'extractor local i la Finestreta, i és el navegador qui llig la carpeta, proposa i desa xifrat al cofre després de la confirmació humana. Mai a `public.profiles`. Línia base de la suite en curs: `HistoricCofre.test.jsx` ja falla abans de cap canvi meu (a investigar si és lentitud o defecte).
2026-10-13T13:45:00.000Z: relleu 3. Mapa per fronts i decisions; consens amb l'auditoria de Codex (GES-A1…A6).
2026-10-13T14:40:00.000Z: relleu 4. Onada 1 lliurada (8 constructors).
2026-10-13T15:30:00.000Z: relleu 5. Onada 2 lliurada (4 constructors); integració en curs.
2026-10-13T16:15:00.000Z: relleu 6. Integració, suite completa en verd, revisió adversarial.
2026-10-13T16:20:00.000Z: relleu 7 i tancament de l'informe. Correccions de la revisió aplicades; suite final en verd; límits declarats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Relleu 1 · Reconeixement (abans de tocar codi)

- **Rutes del prompt que no existixen:** `src/sections/gestoria/escaner/PanellEscaner.jsx`, `gestoriaBancs.js` i `ConsolaTermodinamica.jsx` no hi són. L'Escàner és el mòdul `escaner` de `ShellGestoria.jsx` (`enObres: true`); la Consola és `src/sections/consola/ConsolaSection.jsx`; el selector de carpeta amb reserva `webkitdirectory` ja existix a `src/sections/gestoria/font/fontNavegador.js`.
- **Empremta dels tractors:** `ShellGestoria.jsx`, `Tauler.jsx`, `TargetaTauler.jsx` i `useTauler.js` són fonts de `gestoria.tauler`; `Tauler.jsx` també de `gestoria.historic`; `useGestoria.js` i `PanellGestoria.jsx` de `gestoria.factures` i `gestoria.correus` (`src/sections/gestoria/tractors.js`). Tocar-los torna el tractor a «empremta divergent»: el Mestre l'haurà de tornar a signar al panell de Tractors.
- **Governança fora del meu abast:** `.agents/skills_index.json` i `.claude/skills/` són camins de governança (`tooling/gates/mutation-policy.mjs`, `SECURITY_PATHS`); només s'hi escriu amb `executor-mutacio.mjs` i lease, i l'executor no crea symlinks. `core-direccio-autonoma` i `core-informes-pdf` no són ni a l'índex ni a `.claude/skills/`.
- **Trasllats a `02_investigacio_ia/`:** AGENTS §0.1 i §12 reserven moure fitxers a MarIA o al Mestre i protegixen eixa carpeta. Claude en farà la destil·lació i la llista de trasllat; no mourà res.

### Relleu 3 · Mapa per fronts i decisions (15:45)

Nou exploradors de només lectura han mapejat els fronts. Línia base de la suite completa (`npx vitest run src`, 15:10–15:33): **989 fitxers, 16.509 proves: 16.500 verdes, 8 omeses, 1 roja prèvia** (`src/sections/gestoria/historic/HistoricCofre.test.jsx:264`, temps esgotat de 5 s sota càrrega). El «8.158» del prompt no és el recompte real.

Llegida l'auditoria de Codex [[261013_1510_auditoria_codex]]. Hi ha consens en GES-A1…A6 (motors financers): s'arreglen abans que la Cabina en pinte les xifres (Front I). ATOM-A1…A5 (TPV i composabilitat) queden fora d'este encàrrec i es registren com a pendents.

| Front | Decisió (amb el motiu) |
| --- | --- |
| A · Avatar | Mòdul pur `src/app/contexts/personaDeSessio.js` i lectura de `getProfile` del port, amb guarda per compte i per signatura de metadades. L'actor guanya `poble`. El botó presentacional no canvia. |
| B · Boina | Àtom `RellotgeViu` de Pedra Seca (`useAra` amb rellotge injectable) activat per una prop `rellotgeViu` de `PaginaApp`: la resta d'apps no canvia ni un píxel. El titular arriba pel pont de sessió com a camp filtrat `{nom, avatar, poble}`, només per a apps que declaren `permisos.titular: 'sessio'`. La boina mostra la **persona** de la sessió, no l'entitat: l'ordre parla del nom de l'usuari i els magatzems de la Gestoria no estan separats per actor (ATOM-A2). L'hora de la darrera lectura es conserva com a xip secundari. |
| C · Menú | `--sdp-primary` no existix. El substitut fidel és un token de crom nou, `--sdp-crom-grup-text` = `--sdp-primary-500` (el taronja canònic, 7,12:1 sobre la roca, AAA), aplicat a «Sistema» i als grups de la BarraApp. Els enllaços continuen blancs. Les capçaleres d'AppGridColumn no es toquen (4,11:1, ordre C4). |
| D · Escàner | Tractor nou `gestoria.escaner`, muntat dins de la closca. Proposa i mai mou ni esborra res. Classifica la carpeta, detecta duplicats, incongruències i buits, i aboca els extractes al Tauler amb un sol clic. El Tauler continua exigint la seua aprovació. |
| E · Cabina | Model pur `tauler/nucli/cabinaAvio.js` i vista `CabinaAvio.jsx`, només al Tauler. Dies de cobertura amb la mateixa base que la targeta Cobertura. Venciments des d'`impostos.js`. Gràfics amagats amb l'ull tancat (precedent de l'Històric). |
| F · Consola | Il·lustracions a les nou targetes del tauler de `/consola` (les miniatures d'Índex d'explorador i salut hi passen, per no duplicar-les). Davall de l'Índex, accés ràpid i `<pre>` de diagnòstic derivat de les mateixes funcions pures que les targetes. La Wiki incrustada no canvia. |
| F3 · Cens de skills | `skills_index.json` i els enllaços de `.claude/skills/` ja els ha refet algú a les 15:18. Falta `triggers_on` als dos SKILL.md, el resegellat i `cataleg_skills.mjs --escriu`: és governança, per a MarIA o el Mestre. |
| G · Laboratori | Destil·lació a un document de l'Escriptori pel circuit documental, i llista de trasllat. Claude no mou res. |
| H · Fitxa legal | Model privat separat, extractor al navegador amb procedència i confirmació, i cofre xifrat. Mai `public.profiles` ni metadades (coincidix amb ID-H1 de Codex). |
| I · Motors | GES-A1…A6 amb proves que passen de reproduir el defecte a exigir el resultat correcte. |

Empremtes: tornaran a «divergent» `gestoria.tauler` i `gestoria.historic` (una sola signatura en acabar); naix `gestoria.escaner`. `gestoria.factures` i `gestoria.correus` no es toquen.

### Relleu 4 · Onada 1 lliurada (16:40)

Vuit constructors en paral·lel sobre fitxers disjunts, cadascun amb les seues proves dirigides en verd:

- **A · Avatar:** `src/app/contexts/personaDeSessio.js` (nou, pur) i un efecte nou a `IdentitatContext.jsx` que llig `getProfile` del port, amb guardes per compte, per resposta tardana i per signatura de metadades. L'actor porta `poble`. 70 fitxers i 1.125 proves en verd.
- **B1 · Rellotge i pont:** àtom `RellotgeViu` (registrat al catàleg) i `useAra` amb rellotge injectable i resincronització en tornar a primer pla. `PaginaApp` guanya `rellotgeViu`; sense la prop, el DOM no canvia. Pel pont arriba un `titular` filtrat `{nom, avatar, poble}`, només a les apps que el declaren. 121 fitxers i 1.908 proves en verd.
- **C · Menú:** token `--sdp-crom-grup-text` aplicat a «Sistema» i als grups de la BarraApp, amb una prova de capes nova. 260 proves en verd.
- **F · Consola:** il·lustracions a les nou targetes del tauler, accés ràpid i `<pre>` «Diagnòstic del Mas» amb màscara de privacitat. 73 fitxers i 1.302 proves en verd.
- **I · Motors:** Codex GES-A1…A6 corregits, amb les seues reproduccions convertides en proves (`tauler/nucli/ges.codex.test.js`). Les proves de la Gestoria, els tractors i l'app de la Gestoria: 142 fitxers i 3.275 proves en verd. Detalls:
  - identificador opac de compte, amb sal de sessió;
  - fusió per identitat de moviment;
  - el mateix fitxer triat dos voltes compta una vegada (avís `FITXERS_REPETITS`);
  - retenció amb signe als abonaments;
  - «a pagar» sense compensar el 303 amb el 130 (`ivaACompensar`);
  - `diferencia === 0` per a tota parella d'alta confiança.
- **D1 · Escàner:** nucli pur `escaner/nucli/escaner.js`, que mai calcula l'empremta de bytes d'identitat, d'arxiu ni de credencials. 62 proves en verd.
- **H1 · Fitxa legal:** carril pur `finestreta/nucli/` (validadors, filtre previ pel nom, extractor que tanca en cas de dubte, fitxa amb estats, quatre formularis). Hi ha la regressió Xylella. 184 proves en verd.
- **G · Laboratori:** [[261013_1600_estudi_destil_laboratori_ia]] validat amb `document.mjs check`. Proposta: 10 entrades es conserven, 29 es destil·len i s'arxiven, 19 s'arxiven. Bloqueig mecànic: hi ha proves que encara importen fitxers del laboratori.

### Relleu 5 · Onada 2 lliurada i integració en curs (17:30)

- **E · Cabina:** model pur `tauler/nucli/cabinaAvio.js` i vista `CabinaAvio.jsx`.
  - Huit instruments; cadascun obri la seua targeta.
  - Flux mensual des del primer mes amb extractes.
  - Venciments del 303 i del 130 marcats com a orientatius.
  - Amb l'ull tancat no es pinta cap xifra ni cap gràfic.
  - Commutador de tres vistes al Tauler; Bancs i Impostos en conserven dues.
- **D · Escàner:** executor, hook i panell nous, i el tractor `gestoria.escaner` (`gestoria_escaner.md`).
  - Tanca en cas de dubte; només llig bytes de fitxers amb la mateixa mida i 4 kB d'extractes candidats.
  - Aboca els extractes al Tauler amb un clic i mostra una pista cap a la vista d'identitat.
- **H · Fitxa legal i Finestreta:** executor amb pla previ «Què llegiré i què no», hook i vista amb cofre, i el tractor `gestoria.identitat` (`gestoria_identitat.md`).
  - Desa només els valors confirmats, xifrats.
  - Còpia camp a camp i esborrany imprimible. L'app no signa ni presenta res.
- **I2 · Històric:** clau opaca de compte a `serieHistorica.js` i a `fontMoviments.js`. Canvia l'empremta de la sentinella `triturador-financer`.

En curs: dos integradors en paral·lel (closca i pont) connecten la boina, la Cabina, l'Escàner i la vista d'identitat, i actualitzen les proves de frontera i de clausura.

### Relleu 6 · Integració, suite completa i revisió adversarial (18:15)

- **Integració:** dos integradors en paral·lel.
  - **Closca:** `ShellGestoria` amb titular de sessió, rellotge, Cabina i Escàner; catàleg de 6 tractors; clausura estricta per a l'Escàner i la identitat.
  - **Pont:** `AppGestoria` amb titular a Facturació, Aprendre, Històric i Finestreta; vista nova `identitat`; proves de frontera, de privacitat i del cofre.
- **Dos defectes corregits a l'Escàner:**
  - importava `UniversalIndicatorCard`, fora del nucli 1.1.0; ara són `Boto` del nucli;
  - el selector de reserva mostrava noms de fitxers, inclosos els d'identitat; ara hi ha la prop `nomsVisibles={false}` a `CampFitxer`, opcional i sense canvi per defecte.
- **Suite completa després dels canvis** (`npx vitest run src`, 17:20–17:31): **1.012 fitxers (1 omés), 17.145 proves: 17.137 verdes, 8 omeses, 0 roges.** La línia base eren 16.509 proves amb 1 roja; ara n'hi ha 636 de noves i aquella roja ja no falla.
- **Navegador** (`localhost:3340`, sense sessió):
  - Consola: 9 il·lustracions, accés ràpid i `<pre>` d'un sol node;
  - menú: grups i «Sistema» en taronja;
  - Gestoria: boina amb el rellotge viu a totes les pàgines, Cabina, Escàner i Identitat (aquests dos demanen el seu tractor);
  - a 375 px no hi ha desbordament;
  - cap petició a Supabase des de la Gestoria.
  
  No s'ha pogut veure la sessió de Javi: el navegador ja no tenia sessió, i Claude no entra amb contrasenyes.
- **Revisió adversarial:** 6 lents i 2 escèptics independents per troballa. N'han resistit 19 (amb solapaments entre lents) i n'han caigut 7. Les supervivents s'estan corregint, cadascuna amb la seua prova de regressió:
  - Escàner: camins de fitxers d'identitat a les Alertes;
  - motors: fusió de CSV sense saldo entre fitxers;
  - Històric: identificadors de moviment de dos comptes amb el mateix sufix;
  - Cabina: text de «res a pagar» amb un model desconegut;
  - fitxa legal: forats del filtre previ i de l'extractor;
  - accessibilitat: noms accessibles i àrea tàctil.
- **Fet a saber (troballa FP-3, refutada només perquè queda fora de l'abast revisat):** els fitxers de la porta d'aprovació (`tractors/nucli/aprovacio.js`, `webauthn.js`) ja tenien canvis preparats d'abans d'este torn. Per tant, **totes** les aprovacions de tractors, també les de `gestoria.factures` i `gestoria.correus`, ja estaven abocades a «empremta divergent» independentment d'este encàrrec.

### Relleu 7 · Correccions de la revisió i tancament (18:20)

Les 19 troballes supervivents estan corregides, cadascuna amb la seua prova de regressió:

- **Escàner (PRIV-2, ORD-1, FP-1, PRIV-3):** cap nom de fitxer de la carpeta d'identitat apareix al panell. Les credencials i les carpetes d'identitat de l'arxiu es mostren per carpeta i recompte. La pista del Full només diu «esta mateixa carpeta» quan hi ha selector del sistema.
- **Motors (FIN-1, TI-3):** dos CSV diferents sense saldo ja no es fusionen; es conserven les dues files i ix l'avís `CSV_POSSIBLES_REPETITS`.
- **Històric (FIN-4, TI-1):** el primer compte d'una col·lisió conserva l'identificador de moviment de sempre, i el segon guanya un desambiguador determinista.
- **Cabina (FIN-3):** amb un model desconegut ja no s'afirma que cap dels dos surt a pagar, i la marca d'incompleta apareix amb l'ull obert.
- **Fitxa legal (ID-F1…F8, A11Y-1):**
  - els documents de SUMA amb nom opac queden en «demanar»;
  - vets nous en valencià i variants;
  - SEPE i LABORA només amb consentiment explícit;
  - l'informe de bases de cotització i la «cuenta propia» es permeten;
  - adreces que fallen tancat;
  - detector de salut en valencià;
  - noms accessibles que comencen pel rètol visible.
- **Menors (PS-1, ORD-2):** àrea tàctil de l'accés ràpid de la Consola i versió del catàleg.

Residus declarats (decisió del Mestre):

1. Dos CSV sense saldo idèntics fila a fila no es distingixen del mateix fitxer triat dues voltes: compten una vegada, amb avís d'incertesa.
2. L'identificador desambiguat de l'Històric només és estable dins d'una lectura.
3. Un document que només és identitat pel nom i viu directament a l'arxiu encara s'hi llista pel camí, per la precedència «arxiu abans que identitat».

Pendent per a la governança (MarIA o el Mestre):

- `triggers_on` de les dues skills noves, el resegellat i `cataleg_skills --escriu`. Hi ha canvis sense preparar a `.agents/manifest.yaml` i `00_INDEX_SKILLS.md`: algú ho està fent en paral·lel.
- L'esmena de `sdp-pedra-seca` §2 (el taronja com a lletra sobre la roca) i §10 (el rellotge viu de les apps).
- L'esmena d'AGENTS §12 sobre el laboratori.
- L'avís del `.env`: comprovat amb patrons de claus d'Anthropic, OpenAI i Google i de JWT, sense trobar cap testimoni real; només hi apareixen noms de variables.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Suite completa, línia base (`npx vitest run src`, 15:10) | 989 fitxers, 16.509 proves: 16.500 verdes, 8 omeses, 1 roja prèvia (`HistoricCofre.test.jsx:264`, temps esgotat) |
| Suite completa després de la integració (17:20) | 1.012 fitxers (1 omés), 17.145 proves: 17.137 verdes, 8 omeses, 0 roges |
| **Suite completa final** (17:59, després de les correccions) | **1.013 fitxers (1 omés), 17.291 proves: 17.283 verdes, 8 omeses, 0 roges** |
| `node tooling/gates/porta-olivera.mjs --informe` | Escriptori net: safata buida, cap document consumit, 6 vius declarats |
| `node tooling/gates/design_guard.mjs --arrel=src` | Ix amb 1 per una sola regla prèvia (vegeu Límits). Bona part del deute baixa: estils en línia de 17 a 4, àrees tàctils de 3 a 2, colors crus de 20 a 17 |
| `document.mjs check` del document de destil·lació | `valid: true` |
| Navegador `localhost:3340`, sense sessió | Consola: 9 il·lustracions, accés ràpid i `<pre>` d'un sol node. Menú: grups i «Sistema» en taronja. Gestoria: boina amb rellotge viu a totes les pàgines, Cabina, Escàner i Identitat demanant el seu tractor. 375 px sense desbordament. Cap petició a Supabase des de la Gestoria |
| Revisió adversarial | 6 lents, 58 agents: 19 troballes supervivents (corregides) i 7 refutades |

Lliuraments (sense commit):

- **A · Avatar:** `src/app/contexts/personaDeSessio.js` i `IdentitatContext.jsx`.
- **B · Boina:**
  - àtom i hook: `src/components/PedraSeca/atoms/RellotgeViu.jsx`, `src/hooks/useAra.js`;
  - prop nova a `PaginaApp.jsx`;
  - pont: `src/apps/plataforma/{sessioApp,fontSessio,manifestApp}.js`;
  - Gestoria: `AppGestoria.jsx`, `ShellGestoria.jsx`, `Historic.jsx`.
- **C · Menú:** `--sdp-crom-grup-text` (`tokens.css`, `layout.css`, `apps.css`).
- **D · Escàner:** `src/sections/gestoria/escaner/` i el tractor `gestoria.escaner`.
- **E · Cabina:** `tauler/CabinaAvio.jsx` i `tauler/nucli/cabinaAvio.js`.
- **F · Consola:** `src/sections/consola/{imatgesConsola,diagnosiConsola}.js` i `DiagnosiConsola.jsx`.
- **G · Laboratori:** [[261013_1600_estudi_destil_laboratori_ia]].
- **H · Fitxa legal i Finestreta:** `src/sections/gestoria/finestreta/` i el tractor `gestoria.identitat`.
- **I · Motors:** `resumTauler.js`, `impostos.js`, `concilia.js`, `c43.js`, `tractorTauler.js`, `serieHistorica.js`, `fontMoviments.js` i `tractorHistoric.js`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Signatures del Mestre:**
  - cal tornar a signar `gestoria.tauler` i `gestoria.historic`;
  - cal signar per primera vegada `gestoria.escaner` i `gestoria.identitat`;
  - cal tornar a aprovar la sentinella `triturador-financer` (canvien `c43.js`, `concilia.js` i `fontMoviments.js`).
  
  Les aprovacions de `gestoria.factures` i `gestoria.correus` ja havien de caure per canvis previs a la porta d'aprovació (`aprovacio.js`, `webauthn.js`), no per este encàrrec.
- **Sessió no vista al navegador:** el navegador integrat havia perdut la sessió quan va caure el servidor. Claude no hi entra amb contrasenya. L'avatar i el titular de Javi estan coberts per proves (perfil sintètic), no per una captura.
- **Si no ix la foto:** si la fila de `profiles` del compte no té `avatar_url`, la barra negra mostrarà les inicials («JL»), no la foto, fins que se'n puge una des de `/el-meu-perfil`. Avatar i portada són elecció del Mestre.
- **Fitxa d'identitat:**
  - Claude no ha obert ni transcrit cap document de `../_gestoria_de_poble/`;
  - la fitxa s'omple al navegador, amb confirmació camp a camp;
  - les regles de NAF, referència cadastral, IPF, CNAE i dels formularis porten «[A VERIFICAR]» i s'han de contrastar amb els models oficials;
  - no hi ha OCR: el DNI escanejat s'entra a mà;
  - l'app no signa ni presenta cap tràmit.
- **Fora del meu abast:**
  - les portes de `tooling/` que el hook no deixa executar: `tractor-crom`, `tractor-tokens`, `tractor-cataleg`, `tancament.mjs` i ESLint global (cada constructor ha verificat ESLint dins de Vitest);
  - els camins de governança: `.agents/`, `.claude/`, l'ESTAT, el LEDGER i les skills;
  - els trasllats del laboratori.
  
  ESTAT, LEDGER i tancament del torn queden per a MarIA.
- **`design_guard`:** el roig ve de `.toc-drawer:focus { outline: none; }` (`src/css/modules.css:2654`, Onada 12). La regla invoca el marcador `ALLOW_FOCUS_INVISIBLE`, que `tooling/gates/design_guard.mjs` no implementa (només coneix `ALLOW_RAW_COLOR`). És previ a este torn.
- **Fora d'encàrrec, pendent:** Codex ATOM-A1 (carrera de cobrament al TPV) i ATOM-A2…A5. El hook ha bloquejat obrir-les com a tasca separada.
- **Servidor de desenvolupament:** havia caigut; l'ha tornat a arrencar Claude amb `.claude/launch.json` (`vite-dev`, `:3340`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261013_1405_pla_implementacio_gestoria_jarvis]]
- [[261013_1405_prompt_claude_gestoria_jarvis]]
- [[261013_1510_auditoria_codex]]
- [[261013_1600_estudi_destil_laboratori_ia]]
