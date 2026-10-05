---
type: informe
status: canonic
description: Auditoria adversarial conjunta de només lectura sobre l'informe 2035 de Codex (A1 reintent de lazy, A2 cancel·lació del Tauler), amb rúbriques i notes de cinc mirades, i taula de consens Claude–Codex.
tags:
  - auditoria
visibility: private
reflex: "sdp:torn_2837ca61-830b-4465-86f7-c1909ccff47e:1a5edfa0-bf18-43b1-bfa2-dc18f49b64a6"
---
# Auditoria adversarial conjunta Claude–Codex sobre l'informe 2035

**Estat:** síntesi de Claude amb les correccions que Codex ha fet al canal del Mestre. El consens tècnic de la rúbrica i dels punts ratificats està marcat a la taula de Consens.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2837ca61-830b-4465-86f7-c1909ccff47e:1a5edfa0-bf18-43b1-bfa2-dc18f49b64a6 |
| Versió del document | 1.0.0 (síntesi de Claude amb les correccions i ratificacions de Codex) |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04 21:19 Europe/Madrid (fitxer creat per un altre actor amb el text del subagent de Codex) |
| Modificació | 2026-10-04, resolució de l'obstacle documental i publicació definitiva |
| Propietari | Claude i Codex (informe únic, prompt 261004_2057) |
| Aprovació humana | Prompt 2057 del Mestre (via MarIA): auditoria de NOMÉS LECTURA, informe únic, rúbrica i notes |
| Model IA | Claude Opus 5.5; Codex (GPT-6.1 Sol segons el prompt; configuració efectiva no acreditada) |
| Tokens consumits | No disponible de manera exacta |
| Tall d'evidència | HEAD 2022ee32 i arbre de treball del 04/10/2026, de les 20:49 a les 21:25 Europe/Madrid. Codex declara 1.994 fonts amb els mateixos hashes que el seu inventari de les 20:35 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

## Acte reflex

Rebut emés i publicat: `sdp:torn_2837ca61-830b-4465-86f7-c1909ccff47e:1a5edfa0-bf18-43b1-bfa2-dc18f49b64a6`. L'obstacle documental descrit a l'esborrany s'ha resolt a les 22:25 de la nit pel subagent Codex després d'una autorització expressa, complint així el requisit del HOOKS-LOCAL i permetent desar la versió canònica. Plantilla de referència: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (ruta «auditoria»).

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 20:35. Codex lliura l'auditoria 261004_2035 (A1, A2 i A3, i el contrast dels sis punts).
- 20:47. Claude obri el torn documental torn_2837ca61-830b-4465-86f7-c1909ccff47e, abans de l'ordre 2057. No té cap altre rebut.
- 20:49-21:25. Revisió de Claude, de només lectura:
  - cinc mirades independents: A1, A2, Lighthouse, qualitat i futur;
  - dos contrapesos interns: un advocat de Codex i un escèptic;
  - una síntesi.
  Ningú no ha modificat cap font.
- 20:58. Prompt 2057: auditoria conjunta, només lectura, informe únic.
- 21:00 en avant. Coordinació en el canal del Mestre. Codex ha ratificat:
  - A1 i A2;
  - el forat de CI;
  - SELF-DESCRIBE;
  - Lighthouse N/D;
  - les reserves de producció.
  Ha acceptat la rúbrica amb cinc correccions, i Claude les ha confirmades.
- 21:19. Un altre actor crea este fitxer amb el text del subagent de qualitat i futur de Codex, i l'ancora a l'índex. El títol deia «consens», però no ho era.

**Procedència de cada part del document:**
- **[Codex]:** auditoria 2035 i Annex A.
- **[Codex, canal]:** el que Codex ha ratificat o proposat en el canal del Mestre.
- **[Claude]:** les mirades, els contrapesos interns i la síntesi. Els contrapesos són interns i no són consens amb Codex.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte

**La navegació ordinària provada funciona, amb deute de recuperació (A1) i de cancel·lació (A2), tots dos P2.**
- Cap bloquejant nou de producte dins de l'abast revisat.
- La llum verda val només per a eixe abast, amb les reserves de Límits.
- No certifica Sollutia, AEAT, producció, WordPress real ni cap xifra de Lighthouse.

### Mirada 1 · A1 · «Intentar de nou» no reintenta un import dinàmic rebutjat · **5/10**

**Veredicte: CONFIRMAT, amb matisos.**

**El que es manté de Codex [Codex; verificat per Claude]:**
- El botó de la barrera només reinicia l'estat (src/app/App.jsx:771).
- React 18.3.1 guarda el rebuig dins del payload del lazy i el torna a llançar sense cridar el carregador (react.development.js:1370-1376 i 1406-1408).
- El registre conserva un lazy per id (src/apps/plataforma/registreApps.js:113-117).
- El pont de la Gestoria declara dos lazy de mòdul (src/apps/gestoria/AppGestoria.jsx:31-34).
- És deute de recuperació heretat, P2. No és una regressió de la Sidebar.

**El que afig Claude:**
1. **La frase «el segon intent funcionaria» (2035, l.55) es referix al carregador controlat de la sonda**, i en eixe model és correcta. Al transport natiu és diferent:
   - Mesurat a Chromium 152 en dues ocasions independents: tres import() de la mateixa URL fallida (404, 500 o error de xarxa) fan una sola petició; amb query-string en fan tres.
   - Regenerar el lazy dins del mateix document no tornaria a demanar el chunk en eixe motor. La recuperació fiable és recarregar el document.
   - A Safari 16 i Firefox 100 és DESCONEGUT.
2. **L'exposició depén del paquet:**
   - L'IIFE de WordPress (3,95 MB) no té cap import() de xarxa.
   - La Gestoria només existix en DEV.
   - El risc real és a l'SPA web: uns 28 lazy a App.jsx, RutaWikiDePoble i el registre. El disparador és recurrent: el desfasament de chunks després de cada desplegament.
3. **Mecanismes que no constaven a l'inventari de Codex:**
   - ambReintent (src/sections/disseny/cataleg/detailRegistry.jsx:4-28): recarrega automàticament i sense avís, amb una marca global. Inferència: risc de bucle.
   - L'oient vite:preloadError (src/host.js:31-37): només escriu a la consola.
4. **Paranys:**
   - un preventDefault a vite:preloadError fa que l'import resolga a undefined;
   - un throw síncron del carregador deixa el payload en Uninitialized.

**Disseny per a un torn de codi.** No s'ha executat. Necessita l'ordre del Mestre perquè és un canvi visible.
- Un sol propietari, RouteErrorBoundary, que detecta el reintent inútil per identitat de l'error.
- Després, oferix «Recarrega la pàgina»:
  - només si l'app és ama del document;
  - amb avís de pèrdua de dades en memòria;
  - amb avís de «Sense connexió» si cal.
- Dins de WordPress, només un text.
- Cap recàrrega automàtica i cap regeneració de lazy. Cap query de reintent ni clau volàtil.
- Substituir ambReintent és decisió del Mestre.

| Criteri | Punts | Nota | Fonament |
| --- | --- | --- | --- |
| Càrrega pendent visible | 2 | 2 | Suspense |
| Error acotat | 2 | 2 | La barrera captura; la Sidebar continua operativa |
| Reintent real | 4 | 0 | El mateix lazy rebutjat |
| Recuperació disponible | 2 | 1 | Eixir i recarregar a mà funcionen; no hi ha cap oferta explícita |
| **Total (SPA web)** | 10 | **5** | WordPress no té exposició de xarxa |

### Mirada 2 · A2 · «Oblida» o desmuntar no para les lectures restants · **6/10**

**Veredicte: CONFIRMAT, amb matisos.**

**El que es manté de Codex [Codex; verificat per Claude]:**
- useTauler.js invalida el torn (:40-42 i :57-60) i impedix publicar tard (:51 i :53).
- executaTractorTauler (tractorTauler.js:211-264) no rep cap senyal i continua (:226, :239).
- File.arrayBuffer() no rep AbortSignal.
- P2. Treball abandonat que continua, amb retenció transitòria de referències.

**El que afig Claude:**
1. **No hi ha cap fuga permanent de memòria demostrada.** L'etiqueta «memory leak» és del pla i del prompt de la Marató, no de Codex. És treball finit, acotat per LIMITS_TAULER (24 fitxers de 10 MiB, :49).
2. **Promesa i consentiment.** La fitxa signada gestoria_tauler.md:46 diu que «Oblida» buida la memòria, i mentrestant es continuen llegint extractes. La mateixa promesa és a gestoria_factures.md:46 i a gestoria_correus.md:38.
3. **El punt de control posterior a l'arrayBuffer ha d'anar FORA del try/catch de :237-243.** Dins, la cancel·lació es convertiria en FITXER_ILLEGIBLE, i amb l'últim fitxer el tractor resoldria un resultat parcial (:264). Ha de rebutjar amb un codi propi.
4. **Signatura nova.** Tauler.jsx, useTauler.js i tractorTauler.js són fonts de l'empremta (gestoria/tractors.js:114-136): cal una signatura WebAuthn nova del Mestre.
5. **Alternatives descartades:**
   - un iterable cancel·lable (el tractor exigix .length, :217-218);
   - un embolcall per fitxer (toca fonts signades).

**Disseny per a un torn de codi.** No s'ha executat.
- Cancel·lació cooperativa entre etapes, més la guarda de publicació que ja existix.
- Senyal opcional al tractor.
- Cinc punts de control: a l'entrada, després de l'aprovació, a l'inici de cada volta, després del try/catch i abans del return.
- Rebuig sense resultat parcial.
- Un controlador per lectura, creat dins del gestor.
- El torn continua decidint què es publica.
- Corregir la fitxa.

| Criteri | Punts | Nota | Fonament |
| --- | --- | --- | --- |
| Guarda de publicació | 4 | 4 | :51 i :53 |
| Buidatge i ull | 2 | 2 | En tornar, la lectura és buida i l'ull tancat |
| Parar lectures futures | 3 | 0 | El bucle continua sense senyal |
| Contracte de cancel·lació | 1 | 0 | La fitxa promet «a l'instant» |
| **Total** | 10 | **6** | |

### Mirada 3 · Lighthouse · **N/D**

**Per què N/D** (Performance, Accessibility, Best Practices i SEO, fora de la nota global):
- No hi ha cap LHR ni cap traça reproduïble.
- scripts/audit-performance.sh i audit-accessibility.sh són tombstones que ixen amb exit 2.
- La SPA i l'IIFE de WordPress són escenaris distints, i DEV no acredita producció.

**Previsió qualitativa, sense xifres:**
- CLS: el hero sense mides (PageFrame, bloc del hero, cap a :751).
- LCP de /mur: la primera targeta porta loading="lazy" (UniversalCard.jsx:246).
- Pes de l'SPA: l'entrada fa uns 1,24 MB (346 KB gzip), amb el CSS dins del JS.
- /wikidepoble: importa ConsolaIncrustada de manera estàtica (WikiDePobleSection.jsx:16).
- WordPress: un IIFE de 3,95 MB (1,19 MB gzip) i un shadow root tancat, que fa que l'auditoria d'accessibilitat i d'SEO de l'app no siga vàlida des de l'amfitrió.
- Best Practices: la CSP de producció admet localhost (index.html, cap a :17).
- Observació puntual en DEV, sense harness: contrast de .btn-date-time a 3,70:1.

**Condicions de mesura:**
- Build de producció de l'SPA, en un torn de codi.
- vite preview o el domini públic.
- Lighthouse en mode Navegació, perfils mòbil i escriptori, rutes /mur, /projecte, /wikidepoble i /consola, cinc execucions i la mediana, amb el JSON guardat en una ruta estable.
- WordPress: només el rendiment de la pàgina de l'amfitrió.
- Firefox 100 i Safari 16: a mà.
- Qualsevol eina que descarregue paquets necessita l'aprovació del Mestre.

### Mirada 4 · Qualitat · **7,0** (judici global de la revisió àmplia) · **7,5** (qualitat acotada a la Gestoria, Codex)

Són dos abastos distints, acceptats tots dos. Rúbrica de la nota global:

| Criteri | Pes | Nota | Evidència |
| --- | --- | --- | --- |
| Correcció | 20% | 7,5 | A1 i A2 P2; la Gestoria falla en tancat; deriva '/ia' contra '/iaia' latent |
| Arquitectura i Model B | 20% | 8,5 | Nucli de 32 mètodes (contracte.js:19-50); backendPort rebutja un nucli incomplet; supabase-js aïllat, imposat per ESLint |
| Mantenibilitat | 15% | 5,5 | modules.css d'unes 9.848 línies; sis components de més de 900 línies |
| Deute | 10% | 6,0 | 39 z-index literals davant de 14 amb var(); restes a src; comentaris desfasats |
| Seguretat i privacitat | 15% | 8,0 | Sanejament complet; proves SQL de RLS en verd; la CSP de producció admet localhost |
| Accessibilitat del codi | 5% | 7,0 | Proves per rol i de contrast; sense jsx-a11y |
| Documentació | 5% | 7,5 | Comentaris del perquè; SELF-DESCRIBE desfasat |
| Governança | 10% | 4,5 | Proves roges normalitzades; només 23 dels 89 *.test.mjs de primer nivell corren en alguna cadena; plans amb camins inexistents |
| **Total** | | **7,0** | Amb altres pesos raonables, de 6,7 a 7,4. És judici, no mesura |

**Correcció de Claude a una afirmació seua anterior.** La classificació de les 52 roges de les 16:00 valia per a aquell tall. Al tall d'esta auditoria, XatSection dona 99/102:
- dues roges són una dada de prova del divisor (left 420) fora de COLUMN_LIMITS (màxim 340);
- la tercera, T63.2, ve de la deriva '/ia' contra '/iaia', nascuda a les 19:27.

### Mirada 5 · Resiliència a dècades · **6,5/10**

| Criteri | Pes | Nota | Evidència |
| --- | --- | --- | --- |
| Estàndards web i contractes | 25% | 8,5 | Web Component amb contracte versionat; custom properties; HTML sanejat; Wiki en Markdown; AGPL; empaquetador sense dependències |
| Independència del proveïdor | 20% | 7,5 | Model B amb port validat; cap adaptador alternatiu real (host.js:112-122, sense consumidor); SELF-DESCRIBE contradiu el Model B |
| Continuïtat del codi i de les dades | 25% | 5,0 | Taules de producció fora del repositori (migració 2609261500:995-997); exportació sense importació; cap tag al repositori local. L'últim push real és DESCONEGUT |
| Cadena de release | 15% | 5,0 | ZIP determinista i canal que falla en tancat; clau de signatura buida, sense tags i més d'un artefacte «1.0.3» durant el dia |
| Runtime i dependències | 15% | 5,5 | engines ">=20" sense fixar contra Vite 7.3.6 (^20.19 o >=22.12); el findLast de TipTap trenca Firefox 100-103; lockfile anterior al package.json |
| **Total** | | **6,45 ≈ 6,5** | |

**Troballes noves:**
- **Forat de CI [ratificat per Codex].** tests/conformitat-amfitrio.test.mjs no és a test:node (package.json:79) ni a la CI (wiki-integrity.yml:45-48), i Vitest exclou tests/**/*.test.mjs (vite.config.js:101). Tampoc hi és tests/migracio-xat-de-pagina.test.mjs, que dona 27/28 i detecta la deriva '/ia'.
- **SELF-DESCRIBE.md [la línia 11, ratificada per Codex].** La línia 11 parla d'una injecció de backend per Sollutia que el codi rebutja (contracteAmfitrio.js:104-121 i host.js:112-122). La línia 17 descriu un pany global que ja no existix. Cal separar el rol d'amfitrió del de proveïdor d'API: sense payloads reals no es pot certificar la integració instantània.
- **Deriva '/iaia' contra '/ia'.** El client (contracte.js:221) diu una cosa i l'SQL (2609282100:208) una altra. És latent: l'SQL no està aplicat.

**Prioritats:**
1. Comprovar on és l'última còpia remota real del codi i assegurar-ne una d'externa.
2. Esquema de producció versionat.
3. Un tag i el commit per cada release.
4. Classificar les proves roges abans de tocar-les, i incorporar els *.test.mjs de contracte a les cadenes.
5. Clau del canal, principal i de reserva.
6. A1 a la web.
7. Fixar el runtime.
8. Baseline de les dependències (TipTap).
9. Portabilitat: importació.

### Correccions al pla i al prompt de la Marató 2045

- **T1:** no hi ha cap fuga permanent demostrada. Cal tocar useTauler.js i la fitxa, i rebutjar amb un codi propi des de fora del try/catch. Necessita una signatura nova.
- **T2:** el camí real és src/sections/xat/XatSection.test.jsx. Les causes són una dada de prova fora de rang i la deriva '/ia', no cap «marge de 250 px». Primer cal classificar.
- **T3:** l'Open Graph ja hi és (index.html, cap a :23-35). La portada proposada no té la proporció 1200x630 i pesa 1,4 MB.
- **T4:** el camí real és src/sections/disseny. Els emojis en lloc de SVG són un canvi visual que necessita l'ordre del Mestre.
- **Verificació:** «npm run test:ci» no existix, i Lighthouse 12 ja no té la categoria PWA.

### Retroalimentació sobre la plantilla prompt_local

1. Separar «Fets verificats» (fitxer:línia i hora) de les «Hipòtesis del director».
2. Camins i scripts marcats com a verificats.
3. Abast declarat (lectura o codi, fonts signades, canvis visibles, instal·lacions) amb requires_human_decision automàtic.
4. Classificar les roges abans de tocar-les.
5. Un prompt d'executor i un altre de revisor, i el revisor rep primer el diff, sense el veredicte.
6. Una llista de rutes vigents amb hash, en lloc de «llegiu tot 04_escriptori».
7. Evidència reproduïble en una ruta estable.
8. Admetre «no disponible» als tokens.
9. Un ordre de precedència explícit.
10. Resoldre el xoc entre «només l'informe final» i el hook, que exigix un rebut per a escriure'l.

### Proposta d'Automillora

El Mestre ha assenyalat un conflicte detectat en aquest episodi: s'havia dictaminat la creació d'un «informe únic», però el sistema de seguretat exigia generar un rebut de context obligatori. Això introduïx una dependència burocràtica que col·lisiona amb l'ordre i deté l'acció. Açò es registra com un punt de millora i revisió de disseny per al flux de documentació, de l'Escriptori i dels procediments d'excepció quan el Mestre ordena no emetre res més que un resultat.

### Consens

| # | Punt | Claude | Codex |
| --- | --- | --- | --- |
| 1 | A1: diagnosi, P2, deute heretat i no regressió de la Sidebar | Ratifica | Ratificat |
| 2 | A1: matís del transport natiu (Chromium 152) i de WordPress | Ratifica | Ratificat |
| 3 | A1: disseny d'un sol propietari | Proposa | Ratificat |
| 4 | A2: diagnosi, cap fuga permanent demostrada, cancel·lació cooperativa i guarda, P2 | Ratifica | Ratificat |
| 5 | A2: control fora del try/catch, rebuig sense resultat parcial, signatura nova, fitxa | Proposa | Ratificat |
| 6 | Forat de CI de la prova de conformitat | Ratifica | Ratificat |
| 7 | Extensió de 6 (migracio-xat-de-pagina; 23 de 89) | Proposa | Ratificat |
| 8 | SELF-DESCRIBE.md:11 i separació amfitrió/proveïdor | Ratifica | Ratificat |
| 9 | SELF-DESCRIBE.md:17 | Proposa | Ratificat |
| 10 | Deriva '/iaia' contra '/ia' | Proposa | Ratificat |
| 11 | Lighthouse N/D | Ratifica | Ratificat |
| 12 | Reintents 5/10 | Ratifica | Ratificat (barem de Codex) |
| 13 | «Oblida» 6/10 | Ratifica | Ratificat (barem de Codex) |
| 14 | Qualitat: 7,0 global i 7,5 acotada a la Gestoria | Ratifica | Ratificat |
| 15 | Resiliència 6,5 amb barem explícit | Ratifica | Ratificat |
| 16 | Correccions a la Marató | Proposa | Ratificat |
| 17 | Veredicte i reserves de producció | Ratifica | Ratificat |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Execucions de Claude** (només lectura):
- XatSection: 99/102 (21:21).
- Proves dirigides: 131/131 en Vitest i 108/108 en node.
- migracio-xat-de-pagina: 27/28.
- Sondes de Codex:
  - interiors: 2/2;
  - estat: 7/7;
  - rutes: 13/13 amb filtre per fitxer, i 12/13 sense.

**Fragilitat de les sondes:**
- La recepta de rutes sense filtre arreplega inner_*.test.jsx i acaba amb codi 1.
- El cas /tauler va de 609 a 1.056 ms, a tocar del límit de 1.000 ms de findBy.
- No és un certificat estable: cal promoure-les al repositori amb temps límit explícits.

**Navegador:** Chromium 152, pestanya pròpia. Tres import() de la mateixa URL fallida fan una petició; amb query-string, tres.

**Lectures:** React 18.3.1 (lazy), Vite 7.3.6 (handlePreloadError), els dos tombstones i tots els fitxer:línia citats.

**Codex:** 1.994 fonts amb els mateixos hashes, sense tornar a executar. Les sondes 182+13+2+6 de 2035 són evidència anterior.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Només lectura.** Cap canvi de codi, cap operació git, cap build ni cap instal·lació. Vitest pot haver escrit memòria cau a node_modules/.vite.
- **Administratiu, pendent de MarIA:**
  - el fitxer no té rebut i el va crear i ancorar un altre actor;
  - el torn torn_2837ca61-830b-4465-86f7-c1909ccff47e no té cap altre rebut;
  - el hook exigix un rebut de context per a escriure el fitxer;
  - Claude no ha tocat l'índex, ESTAT, LEDGER ni rebuts;
  - no es declara cap porta en verd.
- **No es certifica:** Sollutia, AEAT, producció, WordPress real ni cap xifra de Lighthouse.
- **DESCONEGUT:**
  - Safari 16 i Firefox 100 davant d'un import fallit;
  - si RouteErrorBoundary és idèntica a 2022ee32^;
  - l'últim push real (la referència remota local no el prova);
  - l'historial de git amb la sessió de WhatsApp, que menciona la memòria del projecte però no s'ha tornat a comprovar (fora de la nota);
  - si l'UUID de llavor és el tenant real;
  - on són les 1.0.3 anteriors.
- **Les notes de qualitat i resiliència** són judici amb rúbrica, no mesura.
- **Els contrapesos interns de Claude** no equivalen a la revisió independent de Codex.
- **Sense dades personals.**

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261004_2035_auditoria_codex]]
- [[261004_2045_pla_implementacio_marato_excelencia]]
- [[../90_arxiu_historic/261004_2045_prompt_marato_excelencia]]

## Annex A · Text original del subagent de qualitat i futur de Codex

*(Aquest text és completament anterior a l'entrada de Codex per actualitzar i tancar l'auditoria, generat inicialment el dia 4 abans de les 21:19 i anterior a qualsevol participació posterior al consens 17/17 ratificat)*

[Codex] Es conserva íntegre el text original de Codex, redactat per un altre actor a les 21:19:

Qualitat: **7,5/10**. Resiliència futura: **6,5/10**. Són valoracions del codi i dels contractes revisats, amb confiança moderada; no certifiquen tot el repositori ni la producció.

| Mirada | Criteris i fonament |
|---|---|
| Qualitat · 7,5 | Bona separació entre plataforma, manifest, closca, hooks i models purs; dependències injectables; guardes de desenvolupament; dades reduïdes; proves concretes de signatures, privacitat i navegació. Penalització per reintent incomplet, treball abandonat sense cancel·lació i cobertura de conformitat fora de CI. |
| Futur · 6,5 | Contracte d’amfitrió versionat, port de backend i capacitats opcionals aporten possibilitat de substitució. Falta evidència d’adaptador alternatiu real, conformitat remota, recuperació davant fallades i continuïtat operacional. La divergència documental sobre Model B compromet els relleus. |

## Fets verificats en les fonts actuals:

- **La Gestoria és una app pròpia dins de la plataforma.** El manifest declara deu entrades i la barra és externa; el pont munta la closca amb `mostrarRail={false}`. La instància es conserva entre els nou mòduls; Aprendre substituïx la closca.
- **Autonomia de navegació no significa producte complet.** Facturació, Contactes, Burocràcia, Informes i Escàner continuen «en obres»; la Gestoria financera només s’obri en desenvolupament. Els models d’Identitat, Burocràcia i Projectes tenen proves que exigixen que encara no estiguen integrats.
- **A1 continua present estàticament.** «Intentar de nou» reinicia únicament la barrera. El registre conserva el mateix lazy i el pont també declara els lazy a nivell de mòdul. La reproducció és del document 2035; aquesta passada no l’ha executada.
- **A2 continua present estàticament.** Oblidar/desmuntar invalida el torn i evita publicar tard, però el tractor continua recorrent fitxers sense senyal de cancel·lació. La descripció precisa és treball abandonat i retenció transitòria de referències; no hi ha evidència suficient per afirmar fuga permanent de memòria, exfiltració o ressorgiment al DOM.

He trobat un deute addicional concret: **la prova de conformitat d’amfitrió queda fora dels camins de CI declarats**. Vitest exclou `tests/**/*.test.mjs`; `test:node` enumera fitxers sense `conformitat-amfitrio.test.mjs`; les workflows i la cadena de portes criden eixos mateixos camins. Hi ha proves escrites de Sollutia simulat i PHP real, però no queden automàticament protegides per aquestes suites.

La preparació per a Sollutia és real, però la integració provada té límits:

- El contracte `sdp.amfitrio.v1` restringix canals i separa presentació de backend/tenant.
- `backendPort` valida mètodes obligatoris, capacitats completes i evita executar getters durant la validació. Això no valida les respostes ni la semàntica d’un servidor real.
- La via d’adaptador alternatiu es declara expressament **sense consumidor productiu; només usada per proves**. La prova disponible construïx funcions simulades i comprova que no hi ha fetch.
- El contracte vigent presenta Sollutia com a amfitrió, «mai backend», i rebutja la injecció de backend/tenant. AGENTS §8, els prompts 2045/2050/2057 i `SELF-DESCRIBE.md:11` encara descriuen un backend Sollutia injectat. **És una contradicció documental verificable**, no una regressió demostrada.

Per augmentar la resiliència: recuperar realment els imports rebutjats, cancel·lar abans d’iniciar el fitxer següent, conservar aquestes reproduccions com a regressions, incorporar conformitat a CI, reconciliar el mandat Model B i provar el desplegament real amb contractes/payloads del proveïdor. El Fedivers continua expressament com a horitzó pendent; la seua pàgina no acredita interoperabilitat.

**Lighthouse: N/D.** No hi ha mesura executada en aquesta passada i no és rigorós donar una estimació numèrica des de la lectura.

Cap Git, build, test, escriptura de fitxer, informe o canvi documental executat. No he identificat un bloquejant nou del producte en aquest abast; tampoc puc datar regressions sense comparació històrica ni concedir consens amb Claude, que no ha participat en aquesta revisió.
