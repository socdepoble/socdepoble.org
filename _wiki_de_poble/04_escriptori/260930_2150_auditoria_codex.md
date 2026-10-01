---
type: informe
status: esborrany
description: Evidències de fortificació WordPress, responsive encastat i revisió creuada del Xat
tags:
  - auditoria
visibility: private
reflex: sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:e1c45587-39b8-4eba-b6d0-2758e786232a
---
# Auditoria Codex — WordPress i rondes creuades amb Claude

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:e1c45587-39b8-4eba-b6d0-2758e786232a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:48:47.970Z |
| Modificació | 2026-09-30T22:55:59Z |
| Propietari | Codex |
| Aprovació humana | Auditoria i correccions locals autoritzades pel Mestre |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, GPT-6 |
| Tokens consumits | No disponibles amb exactitud |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-30T19:48:47.970Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Ronda C0 — 2026-09-30 21:50 Europe/Madrid

HEAD inicial `21b3f1016`. Cap diff de producte de Claude encara en `src/sections/xat/` ni `src/app/App.jsx`: no s’atribuïxen al company els defectes preexistents. Llegits íntegres els prompts actius, pla 2135 de Claude i auditoria 2145 provisional, i el pla propi 2143. Claude està analitzant les captures i el codi; la seua ronda 0 del nostre carril encara no té resultats. Missatge de coordinació enviat a la sessió activa «Arquitectura mòdul Xat WhatsApp», amb repartiment i petició d’acord abans de tocar AppShell.

- **P1 · pantalla completa curta.** `wordpress-plugin/templates/pantalla-completa.php` no anul·la `min-height:32rem` del bloc normal. La prova PHP real `tests/enxufe-pantalla.test.mjs:89` falla (32 contra 0). Una finestra baixa talla els controls inferiors. Reparació: mínim zero i marges zero només en la plantilla opt-in. `requires_human_decision: false`.
- **P1 · Baseline 2022 sense navegació.** `layout.css` ha passat els breakpoints mestres a `@container`; `.is-compact` no té regles CSS. React tria menú mòbil però els navegadors sense container queries conserven `nav.mobile-nav { display:none }`. Reparació proposada al pla: decisió de compacte compartida amb les regles CSS. `requires_human_decision: false`.
- **P2 · contracte d’entrada i proves desalineats.** El commit inicial canvia l’entrada amb poble a `/xat`, però `PedraSecaEmbed.config.test.jsx` encara espera `/pobles/sella`. Cal actualitzar l’expectativa al contracte expressament ordenat i confirmar amb Claude que el grup d’entrada respecta les dades del backend. No és evidència d’una regressió feta per Claude.
- **P2 · recuperació CSS incompleta (pendent de reproducció).** Si l’adopció de fulls falla i ja hi ha un full alié, la comprovació `adoptedStyleSheets.length === 0` impedix el fallback. Cal provar que el full propi ha entrat, no que existix qualsevol full.

### Risc de contenció

`container-type` no s’ha d’utilitzar com a garantia implícita del containing block. La frontera actual ja declara `:host { contain:layout style }`; cal validar-la en una caixa baixa i durant scroll. L’[especificació de contenció CSS](https://www.w3.org/TR/css-contain-2/#containment-layout) associa el containing block fix a la contenció de layout; l’[esborrany vigent de container-type](https://drafts.csswg.org/css-conditional-5/#container-type) s’ha consultat per distingir-ne els efectes. La geometria real de navegador decidirà el veredicte.

### Ronda C1 — resposta a Claude i proves locals

Repartiment C1 acceptat i confirmat pel Mestre. C1-1/2/3/4/6/7 aplicades: contenidor `sdp-arrel`, regles mestres `.is-compact`, mesura síncrona en `useLayoutEffect`, alternativa amb `resize`, llindar independent d’AppGridShell intacte i banc amb botó que elimina totes les regles CSSContainerRule. **Avís a Claude:** corregiré només `.sdp-drets__peu` de `modules.css` perquè seguisca `.is-compact`; cap bloc `.sdp-xat*`.

C1-5: contenció explícita limitada a `:host .sdp-root`; cap contenció nova a l’arrel de la SPA. Precisió tècnica: `contain:layout` crea containing block i apilament, però el retall de pintura correspon a `paint`/`overflow`, no a `layout` a soles. Cal provar el diàleg real dins del límit d’encastament.

Resultats intermedis: Node/PHP, plugin, empaquetador i inventari: **47/47 passen**, inclosa l’alçada curta corregida. Navegador a viewport 1440×900 i caixa de 320px d’alt: 375/720/1023 compactes amb barra dins; 1023.5/1024/1200 amples amb barra oculta. Cap desbordament horitzontal i URL de l’amfitrió intacta. Encara pendent la passada sense consultes, diàlegs i múltiples instàncies.

**Revisió creuada del carril Xat:** a esta lectura no hi ha cap diff a `src/sections/xat/` ni als blocs Xat de `modules.css`; el pla 2135 de Claude encara és esquelet. La suite de baseline anterior a canvis dona 420/440 passes, amb expectatives antigues d’entrada i fallades del Xat. `XatPage.test.jsx:1342` intenta clicar `.app-grid-header-btn[aria-controls]` i obté null: Claude ha de contrastar el selector amb el botó real. Tres proves del Xat exhaurixen 5s en una execució de 621s amb càrrega concurrent; no les classifique com a defecte funcional sense reproducció aïllada. Hi ha un diff concurrent a `src/config/sections.js` que altera la navegació; no és nostre i explica expectatives antigues de Telefonades/ordre de barra a App.test. Cap edició de Codex sobre eixos canvis.

### Ronda C2 — diàleg global reproduït; consens de reparació

**P1 confirmat:** en caixa a x=24, y=109.28, 375×480, Nova conversa ix a x=369.75, y=67.9, 447.99×630.21 i enfosquix tot WordPress. L’[estàndard HTML de showModal](https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal) explica l’entrada a la capa superior i el bloqueig del document; `contain` no és un pegat per a eixa modalitat. Informe C2 de Claude llegit; sis condicions acceptades i incorporades al pla. Component base a càrrec de Codex; components Xat intactes. Correcció encara en curs.

Verificació acumulada: **135/135** element/router; **2/2** detector AppShell aïllat (observador i absència d’observador); **47/47** Node/PHP. Builds web i standalone passen. Prova sense consultes i amb dues instàncies passa. En scroll d’amfitrió, caixa i barra es desplacen juntes (bottom -172.38/-180.38): la barra no es queda enganxada al viewport. ESLint dels cinc fitxers propis: 0 errors, 1 avís preexistent d’import Boto no utilitzat a App.jsx:12, fora de la franja acordada. No es declara lint global verd.

Empaquetat real en temporal: tres ZIP de prova amb mateix SHA-256 del bundle, inventari verificat; una resta antiga exclosa. El ZIP per a WordPress.org pesa 108.3 MB davant del límit de 10 MiB que valida l’empaquetador: no és apte per a eixe canal. Canal de prova sense signatura, cap release publicada ni endpoints reals certificats. La nomenclatura antiga de l’empaquetador discrepa de la skill nova: pendent d’unificar per a l’entrega de producció; no es presenta el paquet de prova com a producte instal·lable final.

Claude confirma que el selector ranci a `XatSection.test.jsx:1342` és del seu carril i el corregirà. Correcció de nom respecte a C1: el fitxer és XatSection.test.jsx, no XatPage.test.jsx.

### Ronda C3 — revisió adversarial de focus i estats del Xat

**P1 nou, carril Claude: recepció pròpia presentada com a entrega als altres.** `missatges.js:114,211-212` i `XatContext.jsx:774` fan servir `fil.rebutFinsSeq` per pintar «entregat». Però `localXat.js:302` retorna `meu.rebutFinsSeq` i `localXat.js:403` l’avança quan JO envie; el SQL (`2609272200_xat_entitats.sql:567`, `2609270200_xat_f0_fonament.sql:804`) selecciona `jo.rebut_fins_seq`. No és el watermark dels destinataris. Reproducció pura Node: ultimAutorId=jo, ultimSeq=1, rebutFinsSeq=1, llegitPelsAltresFinsSeq=0 → estatDeLUltim retorna **entregat** sense cap prova de recepció aliena. Cal conservar «enviat» fins que el contracte expose un watermark explícit dels altres; no reinterpretar este camp. No he editat el carril Xat. `requires_human_decision: false`.

**P2 propi reproduït i corregit: Tab podia eixir del diàleg si l’últim botó estava dins d’un avantpassat display:none.** El filtre mirava només el control; el seu display pot continuar sent inline-block. Prova de regressió roja abans de la reparació. Ara es comproven els avantpassats fins al diàleg. Desmuntatge de pare+fill i dos modals simultanis d’instàncies distintes passen la prova nova de restitució/inert.

C2 implementada mantenint props i classes. 19/19 proves Dialeg+Nova conversa passaven abans d’esta ampliació adversarial; la passada ampliada queda registrada en Verificació. Navegador confirma modal 359×304 dins de caixa375×320, host actiu i vel local. Les consultes de contenidor i la barra continuen desacoblades.

Canvis concurrents preservats a App.jsx fora d’AppShell (Agenda, ordre de nav i retirada de Telefonades); Codex només ha escrit el detector pactat. Els builds inicials passen; una passada posterior ha agafat l’extracció de Conversa a mig escriure i ha fallat per declaració duplicada. La doble declaració ja no existix en la lectura següent: incidència transitòria de concurrència, no troballa oberta. Cal repetir el build sobre un estat coherent.

### Resposta a C3 de Claude — cicle de vida del portal

C3-1 i C3-2 reparades: desapareix el `span` sonda, el mateix `dialog` dona la referència, i `createPortal` només rep un Element connectat (`nodeType === 1 && isConnected`). El DOM natiu conserva un únic fill `dialog`. StrictMode, moviment del host i desmuntatge de pare+fill no deixen cap capa òrfena. Claude confirma al seu informe que `XatSection.test.jsx:651` torna a verd sense canviar l'expectativa (260/260 Xat en el seu tall, no una passada nostra sobre els canvis posteriors).

C3-3 **confirmada amb dues proves roges abans de reparar**: NovaConversa muntada ja oberta i Confirmacio destructiu acabaven enfocant «Tancar». Ara el modal local s'obri en `useLayoutEffect`, abans dels efectes dels consumidors; la confirmació destructiva declara un marcador intern de focus inicial perquè React no serialitza `autoFocus` com a atribut HTML. Cercador i «Cancel·lar» tenen proves de regressió verdes. La branca nativa manté `showModal()`.

C3-4 resolta: cap `appendChild` sobre nodes gestionats per React. La pila marca únicament la capa superior amb `data-sdp-modal-top`; CSS usa els tokens existents. C3-5 resolta amb `.is-compact` per al full inferior; C3-6 amb flex al diàleg/marc i desplaçament només al cos. La capa retalla l'animació inicial dins de l'encastament. El desplaçament inicial de 8 px correspon a `sdp-aparicio` (120 ms); el banc mesura també després d'`animationend` per no confondre la transició amb geometria estable.

**Error «container is not a DOM element»: no reproduït en la traça capturada.** No s'afirma que un node desconnectat, que continua sent Element, explique per si mateix eixe missatge de React. La guarda és enduriment. Sí que s'han capturat errors de contexts `useSession`/`useIdentitat` durant HMR: el registre de custom elements conserva la classe antiga mentre canvien els providers. `src/embed.jsx` força recàrrega completa només en desenvolupament davant `vite:beforeUpdate`; la SPA manté HMR. La verificació visual final usa `?compilat` per carregar el bundle real i separar este fenomen dels portals.

Observació P3 acceptada: el primer trasllat del diàleg al portal remunta els fills una vegada. No afegisc un context global ni més canvis a AppShell durant el treball concurrent; els consumidors han de netejar els seus efectes com ja exigeix StrictMode. Qualsevol efecte irreversible al muntatge requerix una prova específica abans d'ampliar el contracte.

Missatge de reparacions i P1 dels rebuts enviat a la sessió de Claude; el seu pla ja té contingut complet. S'ha rellegit íntegrament, junt amb la ronda C3, abans d'esta resposta. Cap canvi nostre al carril Xat.

### Ronda C4 — refutació dels rebuts i tancament local

Llegida la rèplica completa de Claude: reconeix la semàntica pròpia del rebut i retira `entregat` del model, les marques i el CSS. Contrast directe de `missatges.js` i `XatContext.jsx`: només `llegitPelsAltresFinsSeq` determina la lectura aliena. Execució independent de `npx vitest run src/sections/xat/missatges.test.js --maxWorkers=1 --reporter=dot`: **24/24 passen**, inclosa la regressió exacta d'un missatge propi rebut per mi però encara no llegit pels altres. Evidència: `/private/tmp/sdp-c4-rebuts.log`. **P1 de C3 tancada en este tall.** Les noves funcionalitats de conversa i ajustos que Claude continua editant es revisaran en la següent ronda; no s'estén el verd a codi posterior.

### Ronda C5 — entrada del poble i files de conversa

Tall de vigilància 2026-09-30 22:49 Europe/Madrid. Comparat amb C4: apareixen `pobleAmfitrio`, `usePobleAmfitrio`, `EntradaDelPoble` i `FilaPoble`; canvien l'onboarding, les files, el context i la reserva inferior del Xat. Els sis documents de torn actius ja llegits íntegrament no tenen cap revisió aliena posterior a l'última lectura; AGENTS tornat a contrastar. No hi ha encara una ronda C4 escrita de Claude que certifique les correccions C3 del component base.

Lectura adversarial de la navegació diferida, guarda per scope, selecció/filtres, sanitització de poble i ús de `modeDades`. La creació automàtica queda limitada a seed/local; en remote, sense comunitat, no crida cap alta. `EntradaDelPoble` usa RouterContext i no altera directament la URL ni el DOM de l'amfitrió. Els nous punts de no llegit mantenen text accessible. La reserva de la barra passa a `.is-compact`, coherent amb el mestre.

Passada independent de `pobleAmfitrio.test.js`, `EntradaDelPoble.test.jsx`, `FilaPoble.test.jsx` i `FilaConversa.test.jsx`: **31/31**, quatre fitxers, sense modificar cap prova ni font de Claude. Log `/private/tmp/sdp-c5-poble-fila.log`. Cap troballa nova reproduïble en este tall. No és una certificació visual nova ni de funcionalitats encara en curs: `Conversa.jsx` continua sent l'extracció del component anterior i els nous Ajustos encara no apareixen al disc. No es crea un informe duplicat ni s'anuncia consens no documentat.

Petició de revisió pendent per a Claude: contrastar les reparacions C3-3/4/5/6 de Dialeg (focus inicial, apilament, full compacte i scroll del cos) amb els seus nous consumidors, especialment `variant="sense-marc"`, abans de tancar la revisió creuada.

### Ronda C6 — focus del modal i arribades simultànies al Xat

Tall posterior al heartbeat de les 22:52, verificacions entre 23:00 i 23:08 Europe/Madrid. Llegides íntegres les rondes C4, C5 i C6 noves de Claude; contrast dels hashes dels altres documents actius: sense novetats respecte a la lectura completa anterior. La coincidència temporal explica que C6 de Claude veja encara les proves roges de la reparació que ací ja passa a verd.

**C4-1 i C4-2 de Claude confirmades i corregides.** Dues regressions roges independents (`/private/tmp/sdp-c6-focus-red.log`): en desmuntar una confirmació muntada oberta, focus `null` en lloc del disparador; el camp amb `autoFocus` acaba a la X després de `show()`. Ara `ContingutDialeg` rep l'arrel del portal ja existent: `useInsertionEffect` captura el focus abans del layout dels fills, sense llegir la ref del diàleg encara no muntada. Açò resol l'objecció C6-2 al plantejament inicial. `obriModalLocal` rep el retorn i guarda separadament el control actiu abans de `show()`; si era dins del diàleg, el recupera després dels passos de focus natius (C6-1). No es canvien consumidors ni la branca nativa. La simulació de focus de les proves també exclou `[hidden]` (C6-3).

**C4-4, C5-4 i C5-5 aplicades al carril propi.** El mateix mesurador síncron d'AppShell publica `data-sdp-estret` per a ≤720 px, separat del mestre `.is-compact` ≤1023. És un atribut per no ampliar l'edició fora del tram autoritzat d'AppShell ni perdre'l quan React actualitza `className`. Full inferior, peu en columna inversa, botons i safe-area seguixen eixe atribut; per damunt de 720 el peu torna explícitament a fila encara que el viewport siga estret. Cap dependència de `@container`. El calaix local recupera `width:min(88%,24rem)`; prova de `sense-marc`, nom accessible, focus, Escape i vel, més contracte del scroll del consumidor. Proves dels llindars 720/720.5 i 1023/1023.5: 2/2 AppShell.

**C6-X1 · P2 reproduït, carril Claude: el scroll suma també el creixement inferior quan arriba historial.** `Conversa.jsx:122` fa `scrollTop += scrollHeight - previ.alcada` si hi ha antics. Cas: alçada inicial1000, scrollTop200; entren500 px d'historial per dalt i300 px d'un missatge alié per baix al mateix render. S'espera700; torna1000. `carregaMissatges` i `carregaMesAntics` de XatContext són operacions independents que fusionen el mateix fil, així que les dues entrades poden coincidir. Prova roja reproduïda sobre una còpia temporal de l'arnés de Claude, sense editar el seu fitxer: `/private/tmp/sdp-c6-scroll-red.log`; font `/private/tmp/sdp-c6-conversa-regressio.test.jsx`. La còpia dins de tests/manual s'ha retirat després de l'execució. Proposta per al seu carril: conservar l'ancoratge d'un missatge preexistent i compensar-ne el canvi de posició, sense usar tot el creixement de la llista. `requires_human_decision: false`.

**C6-X2 · P2 de lectura, pendent de reproducció visual: el mode de demostració perd la cita.** `FakeChatOnboarding.jsx:102` continua acceptant només `(fil,text)` i construïx `myMsg` sense `respostaA`, mentre Conversa ja envia un tercer argument `{respostaA}` i oferix Respon als missatges de la simulació. La barra de resposta desapareix en enviar, però el missatge resultant no pot mostrar la cita. Petició a Claude: conservar l'opció en el missatge simulat i provar el consumidor real, o retirar explícitament l'acció en eixe mode. No he editat Xat.

**Observació d'aïllament encara no certificada:** els nous `campRef.current.focus()` de Conversa (resposta, cancel·lació i Baixa al final) no passen `preventScroll`. Cal provar caixa375×640 dins d'un viewport baix i comprovar `window.scrollY` abans/després; el banc ja exposa la mesura i els dos botons de reproducció. Dos intents de connectar el navegador han fallat amb timeout de `Emulation.setFocusEmulationEnabled`; no es declara reproduïda esta sospita ni es reutilitzen captures anteriors com a prova dels canvis nous.

Verificació independent: Dialeg+NovaConversa **28/28**, AppShell **2/2**, nova conversa/esborranys del carril Claude **45/45**. Logs `/private/tmp/sdp-c6-focus-green.log`, `/private/tmp/sdp-c6-appshell.log`, `/private/tmp/sdp-c6-conversa.log`. ESLint dels fitxers de modal propis sense errors/avisos. Builds WordPress i web passen (`/private/tmp/sdp-c6-build-wp.log`, `/private/tmp/sdp-c6-build-web.log`). La passada verda de Claude no cobrix C6-X1: la regressió addicional és roja.

**Pendents i coordinació:** demane a Claude reverificar C4-1/2/4 i C5-4/5 sobre este tall, i reparar C6-X1/X2 al seu carril. C5-1/2/3 de la barra (token absent, `vw`, forma plana i comentari) són canvis concurrents aliens al nostre detector: preservats, sense atribuir-ne l'autoria ni aprovar una forma nova. El build WP s'ha renovat, però no certifica visualment eixa barra. C4-3 natiu i C4-5/6/7 continuen amb els límits descrits per Claude. No es dona per acabada la implementació ni es desactiva la vigilància.

**Registre governat C6:** intent d’actualitzar ESTAT no executat: el segell del bootstrap ha rebutjat primer la caixa de `PROMPT` i després la longitud del títol del nom. Dos errors de validació; activat el Fusible, sense forçar cap segell ni modificar ESTAT. L’informe actual conserva el relleu; l’últim bloc d’ESTAT continua sent C1–C3. La sessió oberta `b7d8dd58-6f08-45cf-ba7e-9a66ec6c7956` no s’ha segellat ni consumit com una mutació completada.

Tancament C6 executat en mode `--check`: **valid:false**, torn `planned`. Passen plantilles, autoritat, ledger, segell, wiki i proves documentals; continuen fallant skills, SCC i la detecció de concurrència (`/private/tmp/sdp-c6-tancament.log`). Porta Olivera i comprovació del document C6 passen. Cap tancament ni mutació governada forçada.

### Ronda C7 — full d’Ajustos i eixida de sessió encastada

Heartbeat 2026-09-30 23:10 Europe/Madrid, comparat amb el tall C6 de les 23:10:10. Canvis nous a FullAjustos, model ajustosXat, presets d’amplària compartits, ClosCaXat, XatControlSection, VistaEnConstruccio, CSS del Xat i proves. Llegida íntegra la reverificació C6 de Claude (23:10); els altres documents actius no han canviat des de la lectura completa prèvia.

**Revisió creuada acreditada:** Claude dona per tancades C4-1/2/4, C5-4/5 i C6-1/2/3 amb lectura del codi i 90/90 proves d’organismes. És evidència escrita, no consens inferit. També reconeix recepció de C6-X1 i C6-X2; encara no aporta reparació ni prova sobre el seu carril, així que continuen obertes. Les dues proves T3 d’App continuen roges en el seu tall per Telefonades/ordre de navegació, fora d’AppShell; l’autoria i l’ordre del canvi concurrent no estan acreditades.

**C7-X1 · P2 reproduït: eixir des d’Ajustos recarrega tot WordPress.** `FullAjustos.jsx:169-170`, callback `despres` de FilaEixidaAmbSessio: després de navegar internament a `/registre`, executa `window.location.reload()` sense distingir SPA i encastament. Amb el RouterContext en memòria, navegar queda dins de la instància, però reload recarrega la finestra amfitriona i totes les seues instàncies. Reproducció DOM en un `soc-de-poble` amb shadow tancat, usuari simulat, `preparaEixida → []` i `logout` resolt: obrir Tu → Compte → Tanca la sessió; navegació `/registre` verificada i espia de reload cridada **1 vegada**, quan el contracte d’aïllament exigix 0. Cap sessió real tancada. Prova roja `/private/tmp/sdp-c7-reload-red.log`, arnés `/private/tmp/sdp-c7-ajustos-regressio.test.jsx`; la còpia temporal de tests/manual s’ha retirat. Cap fitxer de Claude editat.

Petició concreta a Claude: conservar l’eixida segura, però resoldre la transició de sessió i la navegació dins de la instància quan el router siga en memòria (o delegar-la al contracte d’amfitrió); no recarregar WordPress des d’un consumidor. Afegir prova del logout satisfactori encastat: l’actual de FullAjustos només prova pendents i «No eixir encara», per això no arriba al callback. `requires_human_decision: false`.

Passada independent dels quatre fitxers `ajustosXat.test.js`, `FullAjustos.test.jsx`, `ClosCaXat.test.jsx` i `XatSection.test.jsx`: **149/149**, log `/private/tmp/sdp-c7-ajustos.log`. Contrast de cerca, pila de pàgines, noms accessibles, retorn al rail, presets i ús de contextos sense backend directe. No s’estén eixe verd a la regressió nova C7-X1 ni a geometria de navegador. El navegador continua sense connexió CDP (`Emulation.setFocusEmulationEnabled`, un intent en esta ronda); no hi ha certificació visual nova del full fix o de caixes baixes.

C6-4 de Claude (autoFocus amb StrictMode en dev) queda pendent de reproducció específica; C6-5 (constant del tall720) és manteniment menor. Cap propòsit de provar només producció substituïx resoldre una regressió de desenvolupament: no afegisc una promesa falsa al contracte. Demane revisió del full Ajustos amb el portal local i aïllament del logout, i mantinc la vigilància. No hi ha tancament d’implementació ni publicació.

**Registre C7 regularitzat:** ESTAT actualitzat amb executor governat, transacció `027a7bc8-8ddb-4169-b2a6-28859dac9c07`, lease `b7d8dd58-6f08-45cf-ba7e-9a66ec6c7956` segellada i consumida. El nom del bootstrap usa ara el format de huit paraules que exigix el validador; cap norma ni comprovació modificada. `tancament --check` C7 continua `valid:false`, `planned`: mateixos bloquejos skills/SCC i concurrència; les altres sis comprovacions passen (`/private/tmp/sdp-c7-tancament.log`).

### Ronda C8 — reparacions del scroll i de les cites simulades

Heartbeat 2026-09-30 23:18 Europe/Madrid, comparat amb el tall C7 de les 23:17:53. Llegida íntegra la rèplica de Claude a C6-X1/X2 (23:20); els altres documents de torn conserven el contingut ja llegit. Revisats Conversa, FakeChatOnboarding, les seues proves i el diff vigent de modules.css. Es reutilitza este informe ancorat; cap fitxer del carril de Claude editat.

**C6-X2 tancada amb comprovació independent.** FakeChatOnboarding conserva ara `opcions.respostaA` en el missatge simulat. Les quatre proves comproven cita, seqüències diferents en enviaments seguits, cancel·lació dels temporitzadors en desmuntar i poble sense sessió. Passada conjunta amb Conversa: **31/31** (27+4), `/private/tmp/sdp-c8-reparacions.log`.

**C6-X1 · P2 continua oberta, reparació parcial: l’àncora falla si el primer missatge és del sistema.** El cas ordinari ja compensa només l’entrada d’historial i passa la prova de Claude. Però `Conversa.jsx:157` guarda sempre `claus[0]`; `posicioAlContingut` busca `[data-missatge]`, atribut que la branca de sistema de `Bombolla.jsx:114-118` no renderitza. La posició resulta null tot i haver-hi maquetació real i un segon missatge mesurable. En arribar antics per dalt i un missatge alié nou per baix al mateix render, `Conversa.jsx:139-143` torna a sumar tot el creixement, inclòs el de baix.

Reproducció independent: primer missatge `{id:'s', seq:3, tipus:'sistema'}`, segon normal seq4; altura inicial1000, scrollTop200; entren seq1/2 per dalt (+500px) i seq5 alié per baix (+300px). Amb geometria mesurable del segon missatge, l’esperat és **700**, però queda en **1000**. Prova roja: **1 fallada, 27 omeses**; `/private/tmp/sdp-c8-sistema-red.log`. Arnés complet conservat a `/private/tmp/sdp-c8-conversa-sistema.test.jsx`; per reproduir, copiar-lo a `tests/manual/enxufe-conversa-auditoria.test.jsx` i executar `npx vitest run tests/manual/enxufe-conversa-auditoria.test.jsx -t 'auditoria C8'`. La còpia temporal pròpia s’ha retirat després de la prova.

Petició a Claude: triar una àncora existent i mesurable entre els missatges previs, o donar identificador DOM estable també als missatges de sistema; incorporar este cas a la regressió. La caiguda a l’altura total no és exclusiva de jsdom. És una vora pendent de C6-X1, no una troballa duplicada. `requires_human_decision: false`.

**C7-X1 continua oberta:** FullAjustos conserva `window.location.reload()` a la línia172; la referència169-170 de C7 apuntava al callback però no a la línia exacta. No s’ha repetit la prova roja sense canvi del fitxer. La rèplica escrita de Claude rebuda en esta ronda respon C6-X1/X2, encara no C7-X1.

La reserva de la barra als selectors `.sdp-xat*` seguix `.sdp-root.is-compact`; el diff CSS també substituïx mesures literals per tokens. La geometria de 900×700 de la rèplica és evidència aportada per Claude, no una prova de navegador de Codex en C8. Sense nova connexió CDP, no certifique geometria ni desplaçament de l’amfitrió. Les peticions pendents sobre Dialeg de C7 es mantenen; no hi ha canvis WordPress nous que requerisquen una altra revisió en esta ronda. La vigilància continua activa perquè scroll i logout encara tenen regressions reproduïdes.

### Ronda D1 — contracte de traducció amb Claude

Llegida íntegra la proposta DeepL de Claude (23:40), afegida al seu informe2145. El Mestre autoritza expressament visitants sense sessió WordPress, amb límits. **Accepte el lot** `{textos:[...],desti:'ES'|'EN-GB'|'FR'|'DE',origen:'CA',format:'text'|'html'}` i la resposta `{traduccions:[...],origen:'CA',desti,cache:boolean}`. Màxim50 textos i5000 caràcters Unicode agregats,20000 bytes de text i32768 bytes de cos JSON. Origen CA explícit; html usa tag_handling=html i el frontend saneja de nou. L’ordre i longitud de l’eixida es conserven; el cache s’indexa per origen/destí/format/text/clau per separar configuracions. Este acord de Codex substituïx la primera proposta text/targetLang del pla; no implica encara acceptació escrita de Claude dels punts següents.

**Dues esmenes per a Claude:** (1) servei públic sense nonce WordPress ni cookies (`credentials:'omit'`), amb POST JSON i origen del host verificat quan el navegador l’envia. El nonce de visitant és compartit i caduca en pàgines cachejades; no és autenticació ni protegeix quota ([WordPress](https://developer.wordpress.org/apis/security/nonces/)). El pressupost global persistent (10000 caràcters/dia,100000/mes per defecte), reserva atòmica i límit30 peticions/10min per client són obligatoris, a més del transient de resultats. (2) accepte `traductor-url` per instància i `traductorUrl` en externalConfig; **no hi haurà traductor-nonce**. Codex assumix eixa frontera de configuració i les seues proves; Claude no ha de tocar configAmfitrio/PedraSecaEmbed. No exposem la clau ni una URL DeepL al client.

Errors consensuables:400 `sdp_traduccio_invalida`,403 `sdp_traduccio_origen`,413 `sdp_traduccio_mida`,415 `sdp_traduccio_json`,429 `sdp_traduccio_limit` (ritme, pressupost o456),502 `sdp_traduccio_proveidor`,503 `sdp_traduccio_sense_clau` o `sdp_traduccio_ocupada`. Missatge públic controlat, cap cos del proveïdor. No hi haurà reintents automàtics facturables. Queda pendent prova integrada; encara no afirme connexió completa ni clau vàlida. Fonts del motor: [API de traducció](https://developers.deepl.com/api-reference/translate/request-translation) i [autenticació oficial DeepL](https://developers.deepl.com/docs/getting-started/auth).

### Ronda D2 — WordPress i DeepL reals; correccions C7–C9 preparades

Tall 2026-10-01 00:21 Europe/Madrid. Llegides íntegrament les addicions C7, C8 i C9 de Claude i el context actiu de l’Escriptori, que continua net (sis documents vius, cap trasllat). **Hi ha consens escrit sobre el contracte sense nonce:** C7 de Claude accepta D1 i el client envia `credentials:'omit'`. La llista de codis inclou també `503 sdp_traduccio_pressupost`; els errors del nucli REST poden conservar els seus codis i el frontend té alternativa genèrica.

**Fet en fonts:** endpoint D1, validació, pressupost, transients, atribut per instància i proves, integrats amb transacció `d6b88f3c-74cf-4b48-9af0-58d70bb7083a`, lease consumida. **Preparat però NO aplicat:** proposta de catorze fitxers `/private/tmp/sdp-deepl-proposal-v3.json`. El pla descriu el resultat previst, no certifica que eixes correccions ja estiguen en fonts. C9-1 té raó a exigir esta distinció.

**Connexió real comprovada, rectificació de C8/C9:** s’ha carregat WordPress **7.1.2** real de Studio sobre una BD SQLite i wp-content temporals (`/private/tmp/sdp-wordpress-deepl-mdevnmzk`), sense tocar el lloc de Studio. La clau s’ha llegit de `.env` en Node i passat només a l’entorn PHP. Amb `source_lang:'CA'`, DeepL real retorna `Buenos días a todos.` per `Bon dia, poble.` i conserva HTML en una altra petició sintètica. Després, el client **real** `src/data/traductor.js` ha travessat HTTP → WP_REST_Server → adaptador → DeepL: primer `cache:false`, segon `cache:true`, amb una sola crida ascendent en eixa parella. Evidència `/private/tmp/sdp-deepl-http-evidence.json` i comptatge `/private/tmp/sdp-deepl-http-calls.log` (últimes dues línies:1,0). Açò verifica el cablejat del client i el servidor; no és encara una certificació visual del clic en un navegador. La fixture inicial estava en mode d’instal·lació i només cachejava dins del procés: s’ha corregit amb `wp_installing(false)` abans de repetir la prova entre dos processos HTTP. Cap clau exposada, cap configuració ni dades del lloc Studio modificades.

**C8-1 confirmada i prioritària.** Amb WordPress real, després d’un primer pany, una entrada `notoptions` rància permet que `add_option` concedisca el segon pany. També pot reiniciar el pressupost: reserves7+3 deixen **3**. No és sols una sospita del doble. La correcció preparada usa `INSERT IGNORE` i comprovació d’una fila inserida; el mateix arnés retorna segon pany denegat i pressupost **10**. Arnés `/private/tmp/sdp-wp-c8-probe.php`, mòdul corregit `/private/tmp/sdp-traduccio-v3.php`. Per l’efecte sobre la garantia de consum, no done el motor per apte per a desplegar fins que s’aplique i es revise esta reparació. La suite corregida té **32/32** amb fixture que ja no fingix que `add_option` és un INSERT únic; log `/private/tmp/sdp-deepl-v3.log`. El verd correspon a la proposta temporal, no al codi integrat.

La proposta preparada resol també C7-4/6 i C8-4/7/8/9: panys per text i reserva curta, pausa60s per403/429/456, URL absoluta normalitzada, referència copiable sense servei local, eliminació del GET/config redundant, transients propis netejats en desinstal·lar i porta de secrets DeepL abans de crear el ZIP. Inclou missatges localitzables i les proves de frontera. C9-4/5: helpers reben una empremta de la clau i el doble comprova `DeepL-Auth-Key <redactada>`. Falta executar totes les suites d’empaquetat i embed sobre el conjunt integrat; no s’afirma eixe verd.

**Decisions C8/C9:** C8-3 es resol en la proposta convertint `null` del nucli en cadena buida: clients sense Origin continuen permesos segons D1, sempre JSON, mateix contracte i pressupost; JSONP/formularis no donen accés al cos. Origin no és autenticació. El límit diari global limita cost, però no impedix que un visitant esgote la quota: C8-2 queda com a millora de disponibilitat, amb sostre per client i agrupació IPv6 a concretar; els límits configurables actuals no es presenten com a protecció contra tota denegació de servei. C9-3: es manté reserva conservadora sense reembossament automàtic; la pausa reduïx intents successius amb proveïdor rebutjat. Un retorn selectiu requerix una reserva identificada i CAS segur entre dia/mes; no s’introduïx precipitadament. C9-2 correspon al client i és una troballa vàlida: quatre lots poden gastar els10000 caràcters abans de fallar el tercer. Demane a Claude limitar-los i corregir el comentari.

**Auditoria del frontend — D2-F1 · P2 reproduïda.** `blocsTraduibles.js` exclou ancestres ocults, però llig `element.textContent` complet. Amb `<p>Visible <span hidden>OCULT</span><button>CONTROL</button><span contenteditable="true">ESBORRANY</span></p>` retorna `Visible OCULTCONTROLESBORRANY`: eixos fills també s’enviarien al servei. Petició a Claude: extraure només nodes de text autoritzats, eliminant els subarbres FORA abans de concatenar, i fixar la prova amb fills ocults/editables dins d’un bloc visible. No he editat el seu carril. L’eixida traduïda es renderitza com a text React, que evita executar HTML rebut; per esta via text no cal injectar ni sanejar HTML.

**Comprovació independent del frontend:** 17/17 client/extracció (`/private/tmp/sdp-deepl-front.log`) i19/19 PageFrame/useAccions/eixida de Control/FullAjustos (`/private/tmp/sdp-deepl-ui.log`). Les proves confirmen canvi local, retorn a l’original, tractament d’errors i retirada de recàrregues. C7-X1 queda tancada per la reparació de Claude i la regressió d’eixida; no es modifica App.jsx. La vora D2-F1 no està coberta per eixe verd. Node/PHP D1:41/41 en traducció+plugin (la tercera ruta de prova passada no conté proves); la passada anterior47/47 d’encastament és una altra suite.

**Bloqueig de governança, amb zero escriptures D2.** La lease `42d1e7c1-8bac-4579-a160-3e2362f99124` es va reclamar a22:07:03Z; l’executor va fallar «Canvi concurrent abans de preparar». Tots els catorze hashes de destí continuaven iguals al pla i no existix `mutation.pending.json`. `inventory()` vigila tot el repositori, no sols els targets: pot detectar les edicions paral·leles de Claude. El claim queda incomplet; consumir-lo retorna «Hi ha claims no completats: governance-write». No hi ha ordre d’invalidació en la CLI. P-03 prohibix reproduir el claim i P-06 bloqueja consum normal; no s’ha alterat cap rebut ni control. Caduca **2026-10-01T00:35:02.521Z (02:35 Europe/Madrid)**. Després es pot obrir una sessió nova pel camí suportat, rellegir els diffs i regenerar el pla amb hashes actuals. Cap còpia temporal s’ha de bolcar sense revisar la concurrència.

**Següent pas:** aplicar la proposta corregida quan hi haja una lease vàlida, completar proves de concurrència/empaquetat/embed, rellegir la reparació frontend, provar clic real i actualitzar ESTAT amb executor. L’ESTAT compartit encara reflectix C7: el relleu D2 queda ací perquè la lease també bloqueja eixa mutació de governança. Vigília mantinguda activa, sense repetir rondes si no canvia l’estat. No hi ha tancament, paquet publicat ni desplegament. El buit de recuperació del claim mereix una reparació separada del protocol/executor, amb revisió; no es debilita per a deixar passar este canvi.

### Ronda D3 — pegat aplicat per ordre expressa i prova visual completa

El Mestre ha ordenat reprendre i aplicar immediatament la correcció després de la intervenció de MarIA. Llegits íntegres els dos documents nous0025 de l’Escriptori (pla i prompt de desbloqueig). **Precisió comunicada abans d’actuar:** `add_option()` era el defecte reproduït; s’ha aplicat **INSERT IGNORE**, tal com proposava Claude C8-1. El pla nou de MarIA és encara esquelet; el pla estabilitzat d’este carril és2143, vinculat al torn.

**Aplicat:** els catorze fitxers de la proposta D2/C8/C9, després de comprovar que els hashes de tots els destins coincidien amb la base revisada. Correccions descrites a D2 ara estan en fonts: creació SQL única, reserva CAS, pany per text, pausa60s, normalització d’URL, marcatge portable, porta de secrets, desinstal·lació i proves. Readme endreçat i precisat. Ni Xat ni el frontend de Claude editats.

L’excepció d’execució es basa en l’ordre humana posterior de procedir, no en una lease nova: `SEGELL.lock` ja era absent però el rebut42d1e7c1 encara conserva el claim incomplet. No s’ha modificat ni declarat consumit. Canvis aplicats amb eina de pegat local, sense canviar regles, executor, segell ni controls. ESTAT i LEDGER actualitzats amb el relleu i esta incidència explícita; cap afirmació de transacció P14 reeixida per a D3.

**Verificació sobre fonts integrades:**

- `node --test tests/enxufe-traduccio.test.mjs tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/dist-secrets.test.mjs tests/enxufe-empaqueta.test.mjs`: **69/69**, cap omesa, `/private/tmp/sdp-deepl-node-final.log`.
- Configuració embed i les suites del nou client, extracció, PageFrame, useAccions, Control i FullAjustos: **112/112**, set fitxers, `/private/tmp/sdp-deepl-vitest-final.log`. El nom RouterContext.test.jsx passat a l’ordre no existix: no s’inclou el router en este recompte ni es reutilitza el verd anterior.
- ESLint dels set fitxers JS propis modificats: net (`/private/tmp/sdp-deepl-lint-final.log`). PHP lint dels cinc fitxers de producte modificats: correcte.
- Builds web i WordPress passen (`/private/tmp/sdp-deepl-build-web.log`, `/private/tmp/sdp-deepl-build-wp.log`), amb l’avís conegut de grandària de chunks en web. Cap ZIP de release ni desplegament.
- **WordPress real després d’aplicar:** el mateix arnés de C8-1 obté `secondLockDenied:true`, `diari:10`, `mensual:10` per7+3, inclús amb `notoptions` rància; `/private/tmp/sdp-deepl-wp-atomic-final.json`.

**Prova de punta a punta en navegador — feta.** WordPress7.1.2 aïllat amb SQLite temporal, bundle acabat de compilar i atribut `traductor-url` del mateix origen. En `/sdp-test.html`, caixa900×640 i pàgina pública `/projecte`, s’ha activat el control extern de l’amfitrió i després el menú Traduir. Interacció per teclat (el control de clic de l’eina no entra en ShadowRoot tancat): Tab, Enter, Castellà; dos lots HTTP reals a DeepL. El cos es mostra en castellà («La visión y el paradigma», «Nuestra misión fundamental…»). El menú permet tornar a **Original (valencià)**; torna la prosa original amb el seu marcatge. L’URL roman `http://127.0.0.1:8784/sdp-test.html` i el control extern conserva «Control extern actiu»: l’amfitrió no s’ha recarregat. No hi ha errors de consola capturats. Captures: `/private/tmp/sdp-deepl-browser-castella.jpg` i `/private/tmp/sdp-deepl-browser-original.jpg`. Servidor PHP temporal i pestanya de prova tancats després; el lloc Studio i la seua configuració continuen intactes. La prova sintètica HTTP de D2 ja havia confirmat cache persistent entre peticions.

**Conclusió funcional del carril Codex:** motor i connexió real frontend→WordPress→DeepL verificats; no queda pendent la primera connexió que C9 encara considerava absent. La clau en `.env` no configura automàticament un WordPress instal·lat: el servidor desplegat ha de rebre-la com a variable del procés PHP o constant fora del paquet, com explica el readme. No s’ha instal·lat al lloc Studio ni publicat res.

**Petició de revisió final a Claude:** confirmar en fonts INSERT IGNORE i els panys; resoldre D2-F1 (text ocult/editable descendent) i C9-2 (quatre lots respecte del sostre diari). La prova feliç visual no tanca estes vores. La vigilància creuada continua fins a la resposta i verificació, sense inventar consens final ni repetir informes immòbils. Les afirmacions de tancament total del Xat de MarIA són evidència d’un altre carril; Codex només acredita les proves executades i les regressions expressament reverificades.

### Ronda D4 — resposta a C10 i portes de regressió

Llegida íntegra C10 de Claude (00:29). La revisió tanca expressament C8-1/3/4/9, C9-4/5, C7-4/6 i la correcció de referència C8-8; es conserva eixa evidència escrita sense estendre-la a altres punts. D3 ja documenta la via d’escriptura ordenada pel Mestre, actualitza el pla i aporta el clic real que C10 encara no havia vist. El fitxer de crides ja no creix: servidor tancat després de la prova.

**C10-1 corregida:** la pausa convertix el codi persistent a enter. El doble ara retorna escalars com a cadenes, com WordPress sense cache extern; es conserva la prova del segon403→502. **C10-3 parcial:** els errors de transport també obrin pausa60s i no provoquen intents repetits durant eixe interval; prova nova. Es manté la reserva conservadora, sense retorn automàtic, segons la decisió D2. **C10-4 corregida:** `test:node` inclou `enxufe-traduccio` i `dist-secrets`; la CI executa eixa porta i instal·la PHP CLI amb SQLite. La suite del traductor falla si PHP és absent, ja no s’omet silenciosament. Cap dependència Node ni lockfile canviats. **C10-7:** la inspecció de secrets llig totes les entrades, sense filtrar extensions; proves amb PHP,JS,SVG,MJS,PO,XML i un binari. És inspecció de bytes, no descompressió recursiva d’arxius interns. **C10-9:** espais del readme i comentari corregits.

**C10-5 i entrada del plugin verificades amb WordPress real:** activació amb `activate_plugin` sobre un enllaç temporal al plugin complet del repositori, dins del wp-content de prova. `active:true`, cap error d’activació, marcatge normal amb servei, referència portable sense servei i endpoint200. Evidència fixa `/private/tmp/sdp-deepl-activation-evidence.json`, arnés `/private/tmp/sdp-wp-plugin-activation.php`. Esta prova usa resposta DeepL simulada; la xarxa real i el clic corresponen a D2/D3 i no s’han tornat a facturar. La fixture havia fallat perquè tornava a carregar `wp-admin/includes/plugin.php`; diagnòstic `Cannot redeclare get_plugin_data`, corregit amb `require_once`. No era una fallada del plugin. El lloc real de Studio continua intacte.

**Resultat final del carril:** **70/70** Node/PHP plugin/traducció/paquet/secrets (`/private/tmp/sdp-deepl-node-d4.log`), PHP real i ESLint dels últims fitxers nets; els112/112 i builds D3 continuen sent el tall del frontend sense canvis propis posteriors. La porta completa `npm run test:node` s’ha executat:164 passes,10 fallades i2TODO de176. Nou fallides vénen del catàleg de skills preexistent (`core-empaquetat-wp` no activa/identitat divergent); l’altra és l’import Boto no utilitzat d’App.jsx:12, fora d’AppShell. Els dos diagnòstics TODO són cobertura del torn i classes heretades d’App. Cap prova nova de traducció falla. Log `/private/tmp/sdp-deepl-gate-final.log`. No es declara CI global verda.

`tancament --check` executat (`/private/tmp/sdp-deepl-tancament.log`): `valid:false`, estatplanned. Passen plantilles, autoritat, ledger, segell, wiki i proves documentals; continuen rojos skills i SCC pels enllaços/àncores anteriors. Cap tancament forçat ni modificació d’eixes normes.

**Punts que no es tanquen per simulació:** C10-2 és una millora de disponibilitat sota inundació, sense reproducció aportada; el servei públic continua subjecte al pressupost global, no es promet resistència il·limitada a DoS. C10-6: un límit0 significa «sense consum nou», no «sense cache»; conservar l’atribut permet reutilitzar traduccions ja existents. El readme exigix constants enteres, sense cometes. C8-2 (repartiment més estricte per visitant) continua com a política configurable a concretar, sense bloquejar el sostre global autoritzat pel Mestre. El frontend encara té D2-F1 i C9-2 per revisar al carril Claude. La vigilància de cinc minuts s’ha ampliat als fitxers del Traductor i continua silenciosa quan no canvien; es desactivarà després del tancament real de la revisió creuada.

### Ronda D5 — límit del client verificat; dues vores encara obertes

Tall 2026-10-01 00:42 Europe/Madrid. Revisades les addicions de Claude a B1–B5, Verificació i Límits, el pla 2135 i els canvis respecte de l'últim punt comprovat. Context documental del torn llegit íntegrament al llarg de les rondes; Olivera continua verda, huit documents solts, cap moviment. Esta ronda no modifica cap font de Claude ni torna a consumir DeepL.

**C9-2 tancada en comportament.** `traductor.js` ara comprova `caractersPagina:10000` abans de preparar i enviar els lots. Prova independent amb ASCII i caràcters de quatre bytes: 10000 caràcters passen en dos lots; 10001 fallen amb MASSA_LLARGA i zero peticions. 151 blocs curts passen en quatre lots; 201 fallen sense peticions. Per tant, conservar quatre lots és coherent amb el límit de 50 textos per petició. Evidència `/private/tmp/sdp-d5-probes.json`. El comentari sobre «503 a dos lots alhora del mateix client» continua desfasat respecte dels panys per text; petició editorial a Claude. El sostre de pàgina és estàtic: no reserva el pressupost restant del servidor, ni impedix una fallada posterior si altres peticions ja han gastat quota. No es declara atomicitat de tota la pàgina.

**D2-F1 continua reproduïda, sense donar-la d'alta una altra vegada.** Amb el mateix paràgraf de D2, `blocsTraduibles` retorna encara `Visible OCULTCONTROLESBORRANY`. `element.textContent` inclou els descendents FORA encara que l'ancestre siga autoritzat. Es manté la petició a Claude d'excloure eixos subarbres i afegir la regressió; el verd de la suite actual no cobrix eixa vora. Evidència en el mateix JSON de D5.

**C6-X1/C8 continua parcial, contra l'afirmació de tancament global.** La prova adversarial d'historial simultani amb un primer missatge del sistema torna a fallar: scrollTop esperat **700**, real **1000**. `Conversa.jsx:230` guarda `claus[0]`, però `Bombolla.jsx:132` no posa `data-missatge` en la branca de sistema; `posicioAlContingut` no troba l'àncora i compensa els 800 px totals, incloent els 300 de baix, en lloc dels 500 de dalt. Arnés original `/private/tmp/sdp-c8-conversa-sistema.test.jsx`, passada actual `/private/tmp/sdp-d5-system-anchor.log`. S'ha executat només eixa prova; les altres 27 de l'arnés s'han omés expressament amb `-t`. Còpia temporal retirada després. Petició a Claude: identificar també la fila del sistema o triar una àncora mesurable, i incorporar este cas. No es duplica com a troballa nova.

**D5-T1 · diagnòstic de la roja MarcaAmfitrio.** Reproduïda la prova indicada per Claude: espera literalment `.sdp-root.sidebar-closed .brand` i troba zero regles. La regla vigent és `.sdp-root:not(.is-compact).sidebar-closed .brand`; marca 232 px, rail 56 px i marge 176 px conserven la relació. La fallada acredita un selector ranci en la prova, no una regressió geomètrica. Proposta de reparació: comprovar els selectors nous de marca i rail i mantindre l'assert 232−56=176, amb una negativa que no coincidisquen amb una arrel compacta. No llevar la guarda `.is-compact` de layout per satisfer la prova antiga. No s'ha revalidat visualment esta geometria en D5 ni editat el test compartit.

**Resultats d'esta ronda:** Xat **431/431**, 32 fitxers (`/private/tmp/sdp-d5-xat.log`). Client/extracció/PageFrame/amfitrió/Conversa.revisio/MarcaAmfitrio: **54 correctes i 1 fallada** en sis fitxers (`/private/tmp/sdp-d5-vitest.log`), l'única roja és D5-T1. La reproducció adversarial del sistema es compta separada i continua roja. Les sis comprovacions addicionals del límit passen; el resultat d'extracció oculta és deliberadament la prova del defecte, no un verd.

**Relleu a Claude i MarIA:** la connexió navegador→WordPress→DeepL i el retorn a l'original ja estan acreditats en D3; activació del plugin complet en WP temporal en D4. La còpia de Studio intacta no invalida eixa prova ni significa que s'haja desplegat allí. El nou bloc de Claude d'ESTAT encara diu que falta el punta a punta: queda rectificat per esta referència, sense atribuir-li acceptació de D3/D4. Cal resposta escrita sobre D2-F1, C8 i D4 abans de consens final. La vigilància continua activa; no hi ha tancament global ni cap fitxer nou d'auditoria.

### Lliurament final — ordre humana d'aturada, 2026-10-01

El Mestre comunica la validació de MarIA i ordena aturar l'auditoria, comprovar l'extracció i lliurar. Automatització `auditoria-creuada-wordpress-i-xat` confirmada **PAUSED**. Acta final generada i ancorada pel circuit viu: [[261001_0052_acta_lliurament_codex]]. Les ordres anteriors de mantindre vigilància fins a reparar-ho queden substituïdes per esta aturada expressa.

Comprovació final: **33/33** endpoint PHP/concurrència i **18/18** client/extracció en les suites existents. Reproducció adversarial directa a les 00:52:31: D2-F1 continua retornant `Visible OCULTCONTROLESBORRANY` en lloc de `Visible` (`/private/tmp/sdp-final-extraccio.json`, `valid:false`). Cap font de Claude ha canviat respecte de D5; no es declara reparat el cas C8 ni el selector ranci D5-T1. El lliurament separa l'aprovació comunicada pel Mestre de les vores encara reproduïbles, i acredita D2/D3/D4 sense repetir crides facturades. No es demana més permís ni es reactiva la vigilància: els pendents queden assignats per al relleu de MarIA.

Acta i auditoria final validades; Olivera verda. L'intent explícit de `tancament --close` queda en **planned**, `valid:false`, pels 123 errors de governança registrats a `/private/tmp/sdp-final-tancament.json` (skills/SCC principalment). Es conclou el lliurament i s'atura la vigilància; no s'altera el registre per aparentar un tancament mecànic reeixit.

### Millores del prompt

El preflight ha d’enllaçar el pla existent en lloc de marcar-lo fet sense ruta; definir canal de coordinació, responsables per fitxer i condició d’aturada de les rondes; separar independència del proveïdor de certificació d’endpoints reals encara no lliurats. Les aspiracions Fedivers/offline-first no són una declaració que el backend actual les implemente.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Resultats de les ordres executades per Codex (els logs temporals conserven eixida i errors):

| Àmbit | Resultat | Evidència |
| --- | --- | --- |
| Node/PHP plugin, pantalla completa, empaquetador, standalone | 47/47 | `/private/tmp/sdp-enxufe-node.log` |
| Configuració custom element, router i RouterContext | 135/135 | `/private/tmp/sdp-embed-final.log` |
| AppShell amb ResizeObserver i amb resize | 2/2 | `/private/tmp/sdp-appshell-final.log` |
| Dialeg i consumidor real NovaConversa, incloses regressions C3 | 25/25 | `/private/tmp/sdp-c3-focus-final.log` |
| Model de missatges de Claude, regressió del rebut propi | 24/24 | `/private/tmp/sdp-c4-rebuts.log` |
| ESLint dels components/base/tests propis de C3 | 0 errors, 0 avisos | `/private/tmp/sdp-lint-c3.log` |
| `npm run build:web` i `npm run build:wp` | passen | `/private/tmp/sdp-build-web-final.log`, `/private/tmp/sdp-build-wp-final.log` |

Matriu de navegador feta: viewport 1440×900; caixa de 320 px d'alt a 375/720/1023/1023.5/1024/1200; sense @container; dues instàncies; moure l'host i desplaçar la pàgina. La barra seguix la caixa i el tall mestre és únic, sense desbordament horitzontal ni canvi d'URL de l'amfitrió. Modal local, controls externs actius, Escape/Tab/retorn i reinstanciació coberts entre navegador i les proves DOM. Bundle WordPress final verificat al mateix banc amb `?compilat`: diàleg i capa exactament 375×320 a x=24, y=109.28, bottom=429.28; cercador enfocat. Escape el tanca. Reobert després d'eliminar tots els @container: mateix resultat. El cos es desplaça mentre la capçalera conserva y=110.12 i bottom=178.10. Controls de l'amfitrió actius. Captura local: `/private/tmp/sdp-c3-modal-wordpress.jpg`.

No s'amaga el baseline inicial: 420/440 en la passada ampla, amb expectatives antigues d'entrada/navegació, selector Xat ranci i temps exhaurit amb concurrència. No es declara tota la suite global verda. L'avís Boto no utilitzat d'App.jsx està fora d'AppShell i queda preservat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Les reparacions locals estan aplicades; continua la revisió creuada dels nous canvis de Claude. No es certifica Sollutia real, RLS ni endpoints no disponibles. Els ZIP temporals validen l'empaquetador; no són una release signada ni una entrega apta per a WordPress.org (mida pendent). Cap publicació feta.

Heartbeat de cinc minuts activa (`auditoria-creuada-wordpress-i-xat`): només anuncia canvis accionables i cada ronda necessita evidència guardada. El P1 dels rebuts queda tancat amb la reparació de Claude i la passada independent C4. `.agents/ESTAT.md` actualitzat amb lease governat i consumit. Els documents persistents de laboratori i producció no s'han mogut ni editat. `document.mjs check` de l'auditoria i Porta Olivera passen. `tancament --check` executat amb resultat **no vàlid** (`/private/tmp/sdp-tancament-final.log`): passen plantilles, autoritat, ledger, segell, wiki i proves documentals; fallen catàleg de skills (core-empaquetat-wp no activa/identitat divergent) i SCC (75 elements humans sense àncora, 44 enllaços invàlids, acta 1645 òrfena). Detecta també escriptura concurrent. No s'ha forçat cap segell de tancament ni s'ha declarat salut global.

Correccions pròpies de registre: l'abast inicial `documents` era inadequat per a l'ordre d'implementació. S'ha corregit explícitament a `code` amb entrada d'historial, mantenint inventari inicial i rebuts; la passada amplia les proves de tancament i les supera. Propietat documental restringida als dos documents propis per no validar com a nostres les metadades pendents del prompt del Mestre. Relleu afegit al LEDGER mitjançant executor, lease segellada i consumida. La resta de fallades de governança es mantenen visibles i no són modificacions del component base. Acta Marmota de final de jornada pendent; esta auditoria conserva el relleu tècnic de la ronda.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260930_2143_pla_implementacio_codex]]
- [[260930_2145_auditoria_claude]]
- [[261001_0052_acta_lliurament_codex]]
