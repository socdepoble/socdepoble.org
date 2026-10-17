---
type: informe
status: esborrany
description: Matriu de conformitat íntegra, CI, estrés local, rescat històric i deute traslladat amb evidència reproduïble.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_39ba1739-5710-4d97-bf64-fb78d35c591e:93249787-bb6e-474c-8027-296f77066185
---
# Auditoria adversarial Codex del Gauntlet diürn

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_39ba1739-5710-4d97-bf64-fb78d35c591e:93249787-bb6e-474c-8027-296f77066185 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-16T14:31:53.754Z |
| Modificació | 2026-10-16T15:02:56.740108+00:00 |
| Propietari | agent-local |
| Aprovació humana | Encàrrec explícit del prompt 261016_1530; cap aprovació global del producte |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex; tres subauditors Codex, sense suplantar Claude/Gemini |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-16T14:31:53.754Z: esborrany creat pel circuit documental viu.

2026-10-16T15:04:06.289774+00:00: Auditoria consolidada:128 requisits,35 segellats locals,52 parcials,41 pendents;93 oberts traslladats. CI completa exit1; portes de tancament amb deute global declarat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen i balanç transparent

**Sense aprovació global.** 128 requisits: 35 segellats dins de l’abast explícit, 52 parcials i 41 pendents. **93 requisits passen al pla de continuïtat**. Les 31 idees rescatades són un registre addicional de conciliació, no funcionalitats promeses ni aprovacions noves.

**Demanat:** revisar íntegrament el pla1530, executar CI i estrés1000–40000, caçar regressions/fuites, contrastar els fronts d’identitat, xat, notes, RSS, imatges, WordPress, economia i ModelB; rescatar la memòria històrica i traslladar cada pendent.

**Fet per Codex:** auditoria de codi i navegador, probes adversarials sense xarxa, CI i diagnòstic del cofre, simulació de càrrega, inventaris, MCR traçable, informe de rescat del lot llegit i pla de continuïtat. El treball de producció preexistent es distingeix del verificat ara; no s’atribueix a aquesta auditoria.

**Traslladat:** tots els IDs oberts, responsables i criteris figuren a [[261016_1639_pla_implementacio_relleu_codex_gauntlet]]. Cap fila desapareix per passar a una altra tanda. El rescat conserva la cua exacta i els originals; no es declara lectura exhaustiva del corpus.

El segell d’una fila és mecànic i local llevat que diga explícitament una comprovació pública. No certifica aprovació humana, desplegament, dades remotes, ni promeses universals de zero fuites. La denominació dels estats respecta el prompt.

### MCR completa del tall

| ID · origen | Requeriment | Estat | Evidència i límit |
|---|---|---|---|
| F01 · §0.4/B-1 | Erradicar `Mestre Poble` i `mestre-obres` de codi, proves, llavors i BD | [PARCIAL] | Cerca literal a `src`, `tests`, `supabase`, `tooling` sense coincidències operatives (exclòs manifest Wiki generat). No s'ha consultat la BD de producció; no es pot certificar el «100% del sistema». |
| F02 · §0.4/B-1 | Mac Mini signat per Javi amb foto personal | [PARCIAL] | `src/sections/mercat/marketSeed.js:3` declara seller/author_name Javi, author_id javillinares i jpg personal (línies 9–17); seed SQL concorda. Pendent comprovar targeta, Mur i detall reals amb dades remotes. La comprovació DOM i captura de /mercat a localhost:3340 confirma Javi, poble i la foto personal. Encara falta el conjunt de dades remot. |
| F03 · §0.4/B-1 | Mac Mini única publicació de Javi; totes les altres de Sóc de Poble | [PARCIAL] | La segona publicació de mercat és Sóc de Poble (`src/sections/mercat/marketSeed.js:29`). No es pot extrapolar de dos registres locals a totes les publicacions de la BD. |
| F04 · O1.1 | Persona sense copyright/categories | [FET I SEGELLAT] | `src/sections/profile/PerfilEditor.jsx:821` passa `ambDrets:false`; `src/components/PedraSeca/organismes/UniversalCard.jsx:499` anul·la labels/copyright si objecte.tipus=persona. Suite real PerfilShell.targetaViva passada, incloent dignitat de persona. |
| F05 · O1.2 | Eliminar quarta columna/aside del perfil | [FET I SEGELLAT] | Eliminada capacitat redundant de DocumentEditor (`src/components/universal/DocumentEditor.jsx:109`); PerfilShell.targetaViva i DocumentEditor passades, comprovació DOM sense aside ni xip. |
| F06 · O1.3 | Emojis 👁️ 🔐 🛡️ 🌐 en apartats | [FET I SEGELLAT] | `src/sections/profile/perfilModel.js:32` defineix els quatre glifs; perfilModel.icones i PerfilShell.targetaViva passades. |
| F07 · O1.4 | Xat net tipus WhatsApp, adaptat a mòbil i escriptori | [PARCIAL] | Hi ha ClosCaXat i components específics, però no s'ha observat el renderitzat ni responsive en navegador; no s'ha certificat absència de buits/mapes. |
| F08 · O1.4 | Dissociació persona/organització al xat | [PARCIAL] | XatContext té àmbit/gestió d'actor, i xatsPerDefecte diferencia entitat/persona; el contacte humà remot encara no es pot obrir (F21). Pendent QA de canvi d'identitat amb sessió real. |
| F09 · O1.5 | Àlies `javi-llinares` i fallback pilot | [FET I SEGELLAT] | `src/data/identitatsSeed.js:98` inclou àlies; `src/sections/profile/PerfilPublicSection.jsx:102` fallback i línia 221 aplicació restringida. Suite fundacionals.remot passada. Acredita fallback local simulat, no paritat total amb una sessió real. |
| F10 · B3.1 | Selector llicència de notes a El compte | [PARCIAL] | Implementat com ajust `drets-notes`, tipus llicencia a `src/sections/profile/PerfilContext.jsx:149`, consumit per DetallCompte. No s'ha fet prova focal del desat/lectura remots d'aquest selector; pendent comprovar herència a nova nota en producció. |
| F11 · B3.2 | ANIMAL classificats com IA, fitxa preservada | [FET I SEGELLAT] | `src/data/agentsSeed.js:459` mapa ANIMAL→ia; ProfileSection.poble passada comprova els quatre animals i conserva type d'origen ANIMAL. |
| F12 · B3.3 | Poble visible a directori de persones | [FET I SEGELLAT] | `src/sections/profile/ProfileSection.jsx:19` `boinaDelPoble`, consumit a línia 74; ProfileSection.poble passada. Sense poble a la dada no l'inventa. |
| F13 · B3.4 | Retirar maquinària interna de l'aside d'usuari | [FET I SEGELLAT] | En l'abast de l'aside redundant de DocumentEditor, eliminat: test DocumentEditor verifica DOM i CSS de retirada. Cap aside trobat a PerfilEditor/PerfilShell/App. Altres pantalles fora d'aquest abast necessiten observació visual. |
| F14 · O1.1.1/B3.5.1 | Rutes netes /javillinares /socdepoble /rentonar | [FET I SEGELLAT] | `src/config/navigation.js:74` ruta canònica fundacional; `src/sections/profile/PerfilPublicSection.jsx:281` canonical SEO. Suites fundacionals.remot i imatges passades per a les identitats simulades. |
| F15 · O1.1.1/B3.5.1 | Un perfil real per identitat; fusionar duplicats remots | [PARCIAL] | `src/data/identitatsSeed.js:201` té les tres llistes d'UUID remots buides. El fallback evita 404, però no fusiona ni identifica la fila remota del Mestre. No s'ha verificat el cens de BD. |
| F16 · O1.1.2/B3.5.2 | Entitats fundacionals sempre amb poble | [PARCIAL] | ENTITATS_SEED té town_name POBLE_FUNDACIONAL. `src/sections/profile/PerfilPublicSection.jsx:340` només reposa poble si clauFundacional reconeguda; amb UUID remots no declarats (F15), una fila remota sense poble continua buida. |
| F17 · O1.1.2/B3.5.2 | Poble obligatori en crear qualsevol entitat | [PARCIAL] | `src/sections/profile/DialegNovaOrganitzacio.jsx:52` valida poble abans d'enviar; línia 113 camp obligatori i domini pobleDOrganitzacio. Implementació trobada; falta prova focal de servidor i sanejament de files existents. |
| F18 · O1.1.3/B3.5.3 | Emetre SQL UPDATE propi de profiles i resoldre 403 | [PARCIAL] | Migració `supabase/migrations/2610160250_perfil_update_propi.sql:128` crea policy own UPDATE amb controls. El lliurable SQL existeix; no s'ha executat ni acreditat aplicació a producció. |
| F19 · O1.1.4/B3.5.4 | Mateixa font avatar/hero a targeta i editor | [FET I SEGELLAT] | `src/sections/profile/PerfilShell.jsx:76` llig mateix esborrany; PerfilEditor:480 llig avatarDeLaFitxa; PerfilShell.avatarFontUnica i targetaViva passades, inclòs avatar rebutjat per 403. Falta QA visual per declarar aparença impecable. |
| F20 · O1.1.5/B3.5.5 | OpenGraph WhatsApp complet, imatge oficial correcta | [PARCIAL] | index.html:25–33 porta títol/descripció/imatge oficial/dimensions; useSEO.js:16 usa oficial. El pare verifica HTTP públic; cap afirmació de WhatsApp renderitzat des d'aquest subauditor. GET públic amb crawler: socdepoble.org retorna HTML7009B sense OG; la URL PNG retorna eixe mateix HTML, SHA idèntic. gentdelatorre.net sense og:image ni og:description. seo.json. Cap prova real del client WhatsApp. |
| F21 · O1.2.1/B3.6.1 | Quatre actors inicials visibles i operatius | [PARCIAL] | `src/data/xatsPerDefecte.js:73` afegeix tres contactes i Gent de la Torre ve del poble; suite actorsPermanents passada. `src/sections/xat/useObriXatPerDefecte.js:100` retorna null per Javi remot i línia 136 mostra avís, sense xat. La visibilitat també s'adapta al gestor i nivell IA=0, de manera que «sempre quatre» no és literal. |
| F22 · O1.2.1/B3.6.1 | Missatge automàtic literal a anònim que obri Javi | [FET I SEGELLAT] | `src/data/xatsPerDefecte.js:76` literal, :111 fil només lectura i :130 missatge; actorsPermanents passada cobreix remot i local anònims. |
| F23 · O1.2.5/B3.6.5 | Reparar obertura IAIA en seed/local | [FET I SEGELLAT] | `src/sections/xat/useObriXatPerDefecte.js:90` envia seed/local a directe IAIA; `src/data/supabase/xat.js:504` injecta actors també local; actorsPermanents passada. Navegador local: clicar IAIA obri conversa amb missatge inicial i compositor. No s’ha enviat cap missatge. |
| F24 · O1.2.5/B3.6.5 | Config/registre Supabase local equivalent a producció; resposta fluida | [PARCIAL] | No s'ha verificat 127.0.0.1:54321 ni registre real. LocalXat respon amb RESPOSTA_IAIA fixa (`src/data/localXat.js:348`), declarada a `src/data/identitatsSeed.js:172`. Reparar navegació no acredita equivalència del motor amb producció. GET local sense credencials /auth/v1/health: curl52/resposta buida, HTTP000. No acredita registre aplicat ni absència de seed. |
| F25 · O1.2.6/B3.6.6 | Intel·ligència local de redacció, DCVB, cultura, botànica | [NO FET / PENDENT] | El camí local inspeccionat retorna una sola frase fixa, sense RAG/recuperació cultural ni generació de redacció. Requeriment condicionat a marge, que s'ha de traslladar. |
| F26 · O1.3.2/B3.7.1 | Apartat 19 distingix node matriu de WordPress | [NO FET / PENDENT] | `src/sections/text/legalContent.js:161` encara «19. No fem servir galetes»; :162 declaració absoluta sense matís d'amfitrió. No declara política pròpia de gentdelatorre.net. |
| F27 · O1.3.2/B3.7.1 | Obligació governança dels nodes de declarar mètriques | [NO FET / PENDENT] | No apareix a l'apartat 19; només declaració absoluta de l'aplicació. |
| F28 · O1.3.3/B3.7.2 | Infraestructura de mètriques sobiranes agregades sense dades personals | [PARCIAL] | telemetria.js té Umami opcional, DNT/GPC, límit memòria de 20, queries descartades. **P2 reproduït:** `src/data/telemetria.js:113` preserva el primer segment i envia `/javillinares` íntegre, identificador de persona, contradient contracte del fitxer. Artefacte results.json; fetch simulat, cap xarxa real. No es pot acreditar desplegament d'Umami sobirà. |
| F29 · O1.4.2/B3.8.1 | Accés Emojis XL entre NOTES i plegat | [NO FET / PENDENT] | `src/sections/notes/NotesSection.jsx:634` munta UniversalWorkspace sense cap acció/catàleg emoji a header; no hi ha integració amb Emojis XL. Confirmat en DOM de /notes: només NOTES i plegat, sense botó XL. |
| F30 · O1.4.2/B3.8.1 | DialegEmoticona substituït per graella Unicode18 accessible | [NO FET / PENDENT] | `src/components/universal/classificacio/DialegEmoticona.jsx:19` encara ajuda de teclat OS; :46 CampText per escriure/enganxar emoji, sense import de catàleg ni graella. Confirmat en navegador: diàleg d’emoticona encara amb instrucció de drecera OS. |
| F31 · O1.4.3/B3.8.2 | Clic al catàleg assigna icona activa i actualitza rail/barra | [PARCIAL] | Hi ha desat manual d'icon a NotesEditor:317 i diàleg :595; manca selector XL d'un clic. No confondre suport preexistent d'icon amb integració demanada. |
| F32 · O1.4.3/B3.8.2 | Inserció al cursor TipTap o còpia amb toast | [NO FET / PENDENT] | No hi ha canal de NotesSection/DialegEmoticona cap al cursor TipTap o Clipboard del catàleg XL. |
| F33 · O1.4.4 | Components Pedra Seca i cap dependència nova | [PARCIAL] | Diàleg antic usa Dialeg/Boto/Camp; manca implementació del selector per poder auditar el compliment de la nova peça. |
| F34 · B3.8.3 | Suite notes+emojis específica | [NO FET / PENDENT] | Hi ha NotesContext.emoticona i EspecimenEmojisXL de components preexistents, però no integració que provar de selector/inserció/assignació XL. |
| F35 · O1.5.2/B3.9.1 | Signatura persona/pilot correcta, poble i foto de la identitat activa | [PARCIAL] | NotesEditor:365 usa signaturaDeNota; `src/sections/notes/autoriaNota.js:148` llig `agent.location`, però AGENTS_MAP.JAVI porta town_name; amb actorId='0001' seleccionat del catàleg cau al poble FORASTER. Persona sense match continua llegint user_metadata i no actor.avatar/poble. Revisió estàtica, no prova visual. |
| F36 · O1.5.2/B3.9.1 | Cap selector arbitrari d'avatar en notes | [FET I SEGELLAT] | NotesEditor passa autoria resolta (:472–477), sense control per canviar avatar. El carregador de logotip (:826 d'UniversalEditorShell) és del document, atribut diferent. |
| F37 · O1.5.3/B3.9.2 | Barra blava amb accions passives o avís de preview | [FET I SEGELLAT] | `src/components/universal/UniversalEditorShell.jsx:450` força accionsInoperatives i :433 mostra toast pedagògic. DocumentEditor suite passada. Confirmat en navegador: controls de comentar/compartir de preview deshabilitats. |
| F38 · O1.5.3/B3.9.2 | Barra taronja immediata sota blava, sense caixa de capçalera entremig | [NO FET / PENDENT] | `src/components/universal/UniversalEditorShell.jsx:454` manté heroComponent; :832 crea carregador en capçalera. No s'ha mogut a desplegable. |
| F39 · O1.5.3/B3.9.2 | Eliminar ploma/botó central de barra taronja | [NO FET / PENDENT] | `src/sections/notes/NotesEditor.jsx:466` i :467 encara envien emoticona/onObriEmoticona, consumits a UniversalEditorShell:465–466. |
| F40 · O1.5.3/B3.9.2 | Placeholder H1 exacte «Nota sense títol» com targeta | [NO FET / PENDENT] | `src/components/universal/textosLlavor.js:10` manté «Sense títol», consumit com placeholder a UniversalEditorShell:473. notaPreparada:34 diu «Nota sense títol», divergència explícita. |
| F41 · O1.5.3/B3.9.2 | Subtítol i entradella immediats, mateixos textos guia | [PARCIAL] | UniversalEditorShell:478–497 crea camps en seqüència amb textos canònics. Encara hi ha logo/imatge/classificació en composició de pàgina; no s'ha certificat seqüència visual neta. |
| F42 · O1.5.3/B3.9.3 | Desplegable Edició avançada just sobre TipTap | [NO FET / PENDENT] | No apareix implementació d'«Edició avançada» en NotesEditor/DocumentEditor/UniversalEditorShell. posicioEines='davall-entradilla' (NotesEditor:479) mou barra, però no crea desplegable. |
| F43 · O1.5.3/B3.9.3 | Agrupar capçalera, logotip, carpeta, categories, etiquetes, emoji, drets, PDF/portada | [NO FET / PENDENT] | Càrregues continuen a topBarData (:826–838 UniversalEditorShell); classificació+drets+PDF a DocumentEditor:487–494 sense col·lapsable. |
| F44 · O1.5.3/B3.9.3 | Controls plegats permeten flux net; configurat apareix al lloc real | [NO FET / PENDENT] | Sense desplegable, no hi ha estat plegat/obert ni la nova col·locació exigida. |
| F45 · O1.5.4/B3.9.4 | Eliminar peu «Ja publicat al Mur» | [NO FET / PENDENT] | `src/sections/notes/NotesEditor.jsx:385` activa historic; :388 crea PublicacionsDeLActor; :511 l'injecta al peu. NotesEditor.peuDePagina passa perquè exigeix el comportament antic que ara s'ha de retirar. |
| F46 · O1.5.4/B3.9.4 | Template verge H3/H4, paràgrafs i llistes | [PARCIAL] | `src/sections/notes/NotesSection.jsx:134` inclou H3/H4/H5/H6 i paràgrafs, cap `<ul>`/llista. S'injecta a notaPreparada. |
| F47 · O1.5.4/B3.9.4 | Template s'esvaeix al primer clic/pulsació | [NO FET / PENDENT] | **P2 reproduït amb TipTap real**: `src/components/universal/richText/useUniversalRichText.js:70` compara getHTML()===seedContent; getHTML normalitza els salts. Seed=335 caràcters, HTML=328, igualtat false. El cos no es buida en focus i s'edita sobre l'exemple. Script i JSON adjunts. La regex de blancs suggerida per Gemini també dona false; normalitzar amb el mateix esquema TipTap dona igualtat HTML/JSON true. results.json conserva reproducció. |
| F48 · O1.6.2/B3.10.1 | Scroll down oculta dues barres en compacte | [PARCIAL] | useBarresAmbScroll i CSS existeixen, suite useBarresAmbScroll passada. `src/css/layout.css:1049` canvia top de blava/taronja, no transform. No s'ha fet prova visual a gentdelatorre.net ni comprovació de tot el viewport. |
| F49 · O1.6.2/B3.10.1 | Scroll up reapareix immediatament | [PARCIAL] | `src/hooks/useBarresAmbScroll.js:103` exigeix acumulat negatiu >= llindar (--sdp-space-6), no qualsevol lleuger moviment. Tests del contracte existent passats, sense validar UX de immediatesa. |
| F50 · O1.6.1/B3.10.1 | Activació mòbil/tauleta i finestres de poca alçada | [PARCIAL] | `src/app/App.jsx:253` defineix isCompact únicament amb amplària; :391 actiu=isCompact&&!immersiu. Una finestra ampla i baixa no l'activa. |
| F51 · O1.6.2/B3.10.2 | Transformacions i CLS=0 mesurat | [NO FET / PENDENT] | Blava/taronja animen top (layout.css:1039–1055), només nav inferior usa transform. No s'ha mesurat CLS en navegador. No es pot declarar 0 a partir de jsdom. |
| F52 · O4/B4.2 | ResizeObserver AppGridShell alliberat | [FET I SEGELLAT] | `src/components/layout/AppGridShell.jsx:244` observa i :247 disconnect. gauntlet-codex-lifecycle passada: 100 cicles StrictMode, 0 observadors i subscriptors després de cada unmount. |
| F53 · O4/B4.2 | RAF focus UniversalWorkspace cancel·lat sense curses | [FET I SEGELLAT] | `src/components/universal/workspace/UniversalWorkspace.jsx:400` guarda una petició; neteja :409, comprova vigència :416/:432, conserva focus interior :424. Tests 0/1 frames, nova navegació i shadow root tancat passats. |
| F54 · O4/B4.2 | Subscripcions de carpetes alliberades | [FET I SEGELLAT] | UniversalWorkspace:480 usa useSyncExternalStore; test lifecycle compta Set de subscripcions, 0 a cada desmuntatge. |
| F55 · O4/B4.2 | Resolució asíncrona no injecta resultat obsolet | [FET I SEGELLAT] | `src/components/universal/workspace/WorkspaceContext.jsx:273` AbortController, :288 rebutja resultats avortats, :313 abort en neteja; test de canvi A→B/desmuntatge passat. |
| F56 · O4/B4.1–2 | Garantia sessions prolongades/heap i 1.000–40.000 usuaris | [PARCIAL] | La prova de 100 cicles compta recursos concrets, no mesura heap, render real, CPU, xarxa ni servidor. Root executa l'estrés; aquest subauditor no ha executat suite global ni concurrència massiva. |
| F57 · O1.2.1/B3.6.1 | Ordre estricte Comunitat Sóc → Javi → Gent de la Torre → IAIA | [NO FET / PENDENT] | `src/sections/xat/XatSection.jsx:738` ordena per fixat/activitat i :746 crida anteposaPoble. `src/sections/xat/pobleAmfitrio.js:168` força poble al primer lloc. Reproducció pura: helper transforma ordre Comunitat/Javi/IAIA en **Gent/Comunitat/Javi/IAIA**. No existeix prioritat canònica nova. |
| F58 · O1.2.1/B3.6.1 | Comunitat Sóc permanent amb Avisos, General i Beta Testers | [PARCIAL] | `src/data/xatSeed.js:171` té comunitat i :174–176 els tres canals (verificat en runtime). Però només al seed; `src/sections/xat/components/FakeChatOnboarding.jsx:110` crea comunitat del poble, IAIA, DM Sóc i Javi, cap Comunitat Sóc ni els seus canals en visita anònima. Nom del seed és «Sóc de Poble», no «Comunitat Sóc de Poble». |
| F59 · O1.2.1/B3.6.1 | Eliminar DM Sóc sintètic; conservar només DM explícit futur | [NO FET / PENDENT] | `src/data/xatsPerDefecte.js:73` conserva Sóc als actors sintètics. :258 afegeix DM quan no troba directe real; la comunitat amb subjecte no compta. Runtime amb comunitat seed produeix també `sdp-per-defecte:socdepoble` tipus directe. FakeChatOnboarding:125 també manté `fake-sdp`. |
| F60 · O1.2.2/B3.6.2 | Capçalera Javi → /javillinares | [NO FET / PENDENT] | `src/sections/xat/components/CapcaleraConversa.jsx:96` necessita altres[0] o subjecte per enllaçar. filDeMostraDeJavi té participants, però ni altres ni subjecte: confirmat runtime, cap enllaç. En directe real, rutaDePerfil persona 0001 retorna `/gent/0001`, no la ruta neta exigida. |
| F61 · O1.2.2/B3.6.2 | Capçalera Sóc → /socdepoble | [NO FET / PENDENT] | `src/config/navigation.js:55` retorna `/empresa/socdepoble`; seed subjecte usa aquesta ruta (`src/data/xatSeed.js:91`). FakeChatOnboarding:125–138 tampoc defineix altres/subjecte. No hi ha redirecció de la capçalera a /socdepoble. |
| F62 · O1.2.2/B3.6.2 | Capçalera Gent → /pobles/la-torre-de-les-macanes | [FET I SEGELLAT] | `src/sections/xat/components/FakeChatOnboarding.jsx:74` usa subjecte del poble, creat per objecteDelPoble; `src/sections/xat/components/CapcaleraConversa.jsx:100` enllaça rutaSubjecte a :138. El camí existent és el canònic del poble. Segell mecànic de ruta, sense observació visual. |
| F63 · O1.2.2/B3.6.2 | Capçalera IAIA → fitxa de la IAIA | [PARCIAL] | Directe seed amb contrapart ia pot anar a /perfil/ID, però fake-iaia no té altres/subjecte (FakeChatOnboarding:112–123), per tant capçalera inactiva. Fil de pàgina remot apunta /iaia, que encara és el manifest (F64–F65). |
| F64 · O1.2.3/B3.6.3 | Manifest L'Ànima passa a /anima i menú Sistema corregit | [NO FET / PENDENT] | `src/config/navigation.js:20` encara anima:'/iaia'; `src/config/sections.js:43` menú L'ànima path '/iaia'; `src/app/App.jsx:980` route iaia munta TextRoute pageKey anima. Runtime resolvePageSlugPath('anima')='/iaia'. |
| F65 · O1.2.3/B3.6.3 | /iaia o /perfil/iaia reservat a fitxa i accés des de xat/cercador | [NO FET / PENDENT] | /iaia manté manifest. Ruta genèrica /perfil/:agentId sí existeix (App:960), però navegació i menú no estan desambiguats; el fil remot continua amb subjecte /iaia editorial. Cal separar article, perfil, xat i referències del cercador de forma coherent. |
| F66 · O1.2.4/B3.6.4 | Entrada pilot local immediata sense backend disponible | [NO FET / PENDENT] | **Reproducció local amb xarxa bloquejada:** loginWithPassword(dataMode:'local') i ('seed') rebutgen tots dos amb code `mode-local`, fetchCalls=0. `src/data/supabase/auth.js:443` aplica exigeixModeRemot(:152). Hi ha botó «Forçar entrada local (Mock)» a `src/sections/onboarding/OnboardingSection.jsx:399`, però només posa simulaLocal=true: desbloqueja formulari (:481) i no injecta sessió; acaba en el mateix rebuig. La sonda automàtica continua depenent de /auth/v1/health. No és un mecanisme d'entrada operatiu. |
| I01 · Blocs 0–4; fila explícita | Bloc 0: estudiar Feedly amb REA | [PARCIAL] | Estudi previ amb navegador integrat documentat a `90_arxiu_historic/261016_0022_auditoria_claude.md:115`; REA constava denegat a `:219`. Execució REA i comparativa reproduïble: **no acreditades en aquesta tanda**. No declarar feina prèvia inexistent. |
| I02 · Blocs 0–4; fila explícita | Lector sobre UniversalWorkspace | [FET I SEGELLAT] | Composició explícita a `src/apps/lector/vistes/Noticies.jsx:379`, amb arbre/selecció/detall sobre el component canònic. Segell limitat a estructura de codi local. |
| I03 · Blocs 0–4; fila explícita | Retirar notícies fictícies de la pantalla ordinària | [FET I SEGELLAT] | `src/apps/lector/AppLector.jsx:77` activa llavor només amb `VITE_SDP_LECTOR_LLAVOR=1`; sense port mostra buit a `:169–179`. Les fixtures sintètiques continuen al repositori, deliberadament. |
| I04 · Blocs 0–4; fila explícita | Fonts RSS reals Emowe/Mitjana/Hernández/etc. | [NO FET / PENDENT] | `AppLector.jsx:82` només crea port de llavor; `:171` accepta font injectada o llavor. No existeix composició de producció amb aquestes fonts. L'informe històric `261016_0022_auditoria_claude.md:116` ja declarava aquest pendent. |
| I05 · Blocs 0–4; fila explícita | Bookmarklet amb tria Bloc/Lector | [PARCIAL] | `src/sections/notes/modeDesa.js:185` accepta `desti=lector`, però `AppLector.jsx:98–100` exporta destinació `null` sense llavor. La tria no s'ofereix per defecte. |
| I06 · Blocs 0–4; fila explícita | Desar article directament al Lector | [NO FET / PENDENT] | `src/sections/notes/SnippetCurador.jsx:95–116`: el destí desa una font RSS personal pendent del connector, no un article capturat. |
| I07 · Blocs 0–4; fila explícita | Hidratar títol, subtítol, entradeta, URL i OG | [PARCIAL] | `modeDesa.js:151` captura URL, `document.title` i selecció fins a 256 caràcters. No captura subtítol ni `og:image`; entradeta només si hi ha selecció. |
| I08 · Blocs 0–4; fila explícita | Bloc 0.5: Consola separada del Control | [FET I SEGELLAT] | `src/sections/consola/ConsolaSection.jsx:38` i `:204`: tauler propi amb pàgines, diagnosi i mètriques. Segell d'existència/composició local. |
| I09 · Blocs 0–4; fila explícita | Matriu de requeriments en viu | [NO FET / PENDENT] | Consola actual amb pols, mapa, inventari i diagnosi; no localitzat model ni vista MCR de tasques amb FET/PARCIAL/PENDENT. |
| I10 · Blocs 0–4; fila explícita | Balanç demanat/executat i trasllat automàtic | [NO FET / PENDENT] | Cap implementació localitzada a `src/sections/consola/` o `tooling/vite/consola-iaia.mjs`. |
| I11 · Blocs 0–4; fila explícita | Botons validar/refutar tasques | [NO FET / PENDENT] | No hi ha flux de certificació humana de requeriments. Middleware actual GET local, `tooling/vite/consola-iaia.mjs:116–150`. |
| I12 · Blocs 0–4; fila explícita | Resums executius/diagnosi accessibles | [PARCIAL] | Existeix `DiagnosiConsola.jsx`; les fonts només viuen al servidor DEV local. `ConsolaSection.jsx:74–81`, `useFontDev.js:38–40`. No substitueix encara el canal humà-màquina demanat. |
| I13 · Blocs 0–4; fila explícita | Bloc 1: regla 1200² WebP <80 KB universal | [PARCIAL] | Cadena de pujada i tractor amb mides/pressupost. Recursos actius encara JPEG: RSS 480²/176642 B, Gestoria 480²/175623 B, Rebost 480²/163482 B, Salut 480²/160244 B. `registrePlugins.js:150–164` usa `.jpg` per defecte. |
| I14 · Blocs 0–4; fila explícita | Capçalera i targeta mateix recurs | [PARCIAL] | Plugins comparteixen camp `imatge`; no s'ha provat universalment tot el corpus ni totes les dades remotes. |
| I15 · Blocs 0–4; fila explícita | Avatar 400² WebP universal | [PARCIAL] | `useEnquadramentImatge.jsx:79–82` imposa 400² a nova pujada. El retrat canònic existent `public/assets/fotos/javi-llinares-perfil-1200px.jpg` continua JPEG 1200²/256046 B. El pla mateix exigeix aquesta ruta JPEG a `:57`: cal harmonitzar aquesta exigència específica amb la migració general, no canviar-la cegament. |
| I16 · Blocs 0–4; fila explícita | WebP estricte a tots els navegadors | [PARCIAL] | `src/utils/pujadaImatge.js:215–218` recodifica a JPEG quan el navegador no produeix WebP. Fallback explícit, però no compleix literalment sempre `.webp`. |
| I17 · Blocs 0–4; fila explícita | Social Share 1200×630 PNG | [FET I SEGELLAT] | Pillow confirma `public/assets/system/ui/og-socdepoble-1200x630.png`: 1200×630, PNG, 530885 B. Només acredita recurs local, no WhatsApp desplegat. |
| I18 · Blocs 0–4; fila explícita | Preservació EXIF per defecte i opt-out | [PARCIAL] | Tractor supera prova sintètica independent de GPS, data, fus, càmera, MakerNote i orientació. La casella d'opt-out (`DialegEnquadrament.jsx:449–451`) està expressament autoritzada pel pla vigent `:70–73`; **no és per si mateixa un incompliment**. La cadena UI normalitza orientació, omet IFD1 i MakerNote que conté JPEG (`exifIncrustat.js:19–50`); no s'ha certificat integritat per qualsevol càmera/format o totes les vies d'ingestió. L'informe històric `261016_0022_auditoria_claude.md:223` identifica imatges enganxades com a via que conserva neteja. |
| I19 · Blocs 0–4; fila explícita | Tractor `convertir_a_webp.mjs` | [FET I SEGELLAT] | Auditoria adversarial 10/10: JPEG original/quadrat/avatar, PNG/TIFF, EXIF massa gran, pressupost 1 KB, frontera estricta 80000 B, fallada encoder, entrada invàlida, conservació del destí i neteja temporal. SHA abans/després igual. |
| I20 · Blocs 0–4; fila explícita | Tractor per migrar catàleg i connectar ingestió | [PARCIAL] | El CLI existeix i converteix fitxers explícits. No s'ha completat la migració de tot `public/assets/` (mostres JPEG anteriors) ni acreditat una canonada universal d'ingestió que el cride. |
| I21 · Blocs 0–4; fila explícita | Nova vinyeta TPV integrada | [FET I SEGELLAT] | `registrePlugins.js:304–314` usa WebP. Inspecció visual feta: cambrer al Bar Casino; Pillow: 1200², 77746 B. No constitueix dictamen jurídic sobre semblances. |
| I22 · Blocs 0–4; fila explícita | Bloc 2: fallback WordPress literal | [FET I SEGELLAT] | `wordpress-plugin/includes/marcatge.php:295`: `Carregant el mur...`. `tests/enxufe-plugin.test.mjs`: 18/18 verds, inclòs literal i guarda de `wptexturize`; la prova d'aquesta tanda és Node/inspecció de font, no execució PHP desplegada. |
| I23 · Blocs 0–4; fila explícita | FCP immediat i absència de salts | [PARCIAL] | Literal existent; sense mesura real de FCP/CLS mòbil en aquesta subauditoria. |
| I24 · Blocs 0–4; fila explícita | Onada 3: TPV estructura Loyverse | [PARCIAL] | `src/apps/bar/vistes/Tpv.jsx:4–6`, `:190–228`: UniversalTPV, tiquet, catàleg, categories, cobrar i tiquets oberts. Comparació REA i homologació visual: no acreditades en aquesta tanda. |
| I25 · Blocs 0–4; fila explícita | Mode Bar i Mode Rebost | [PARCIAL] | Bar implementat i consum d'ingredients (`nucli/consum.js`), però no localitzat selector/flux explícit Mode Rebost dins del TPV. |
| I26 · Blocs 0–4; fila explícita | Torn, tiquets, categories, al·lèrgens | [PARCIAL] | `nucli/torn.js:32`, `nucli/tiquet.js:1`, `nucli/cataleg.js:18–34`, `Tpv.jsx:215–225`. Funcionalitat extensa local; manca validació operativa tàctil i desplegament. Bar és DEV i desactivat per defecte (`manifest.js:65–68`). |
| I27 · Blocs 0–4; fila explícita | Gestoria: llibre i tresoreria | [PARCIAL] | `src/sections/gestoria/facturar/LlibreFactures.jsx:40–117`; `tauler/nucli/resumTauler.js` calcula saldos/conciliació/tresoreria. App només desenvolupament (`src/apps/gestoria/manifest.js:79–82`). |
| I28 · Blocs 0–4; fila explícita | Gestoria: fidelitat ergonòmica Holded/FacturaDirecta/Odoo/GnuCash | [PARCIAL] | Hi ha Gestoria implementada; comparativa ergonòmica/reproducció REA: no acreditada en aquesta tanda. Aquesta etiqueta evita confondre manca d'evidència de l'auditor amb prova d'absència de feina prèvia. |
| I29 · Blocs 0–4; fila explícita | Model B: port neutral i Frontissa GET acotada | [FET I SEGELLAT] | `src/data/backendPort.js:8–56`; `creaFrontissa.js:11–105`: origen permès, catàleg, GET, omit credentials, redirects error, límits bytes/temps, DTO i neteja. `tractor-frontissa.mjs` verd sense xarxa. |
| I30 · Blocs 0–4; fila explícita | Connexió efectiva amb Sollutia | [NO FET / PENDENT] | `src/data/adaptadors/sollutia/client.js:4–7`: `apiOrigin:null`, orígens buits i recursos buits. Rebutja recursos, correctament tancat fins a captures reals. |
| I31 · Blocs 0–4; fila explícita | Bloc 4: simulació local 1000–40000 | [FET I SEGELLAT] | Harness actual: 8/8, zero intents fetch de xarxa, resultats a continuació. |
| I32 · Blocs 0–4; fila explícita | Capacitat real 40000 usuaris concurrents | [NO FET / PENDENT] | No s'ha exercitat backend, sockets reals, RLS, DB, sessions independents ni infraestructura Sollutia/Supabase. |
| I33 · Blocs 0–4; fila explícita | Zero leaks, immunitat i zero regressions | [PARCIAL] | Proves locals positives de neteja/cancel·lació/errors; no permeten garantia universal ni substitueixen suite global. |
| I34 · Blocs 0–4; fila explícita | Reserves d'imatges de pobles | [NO FET / PENDENT] | `src/config/assetResolver.js:9-19,178-187`: 9 rutes úniques `/assets/img/…` inexistents; els 9 mateixos basenames existeixen en `public/assets/uploads/brain/`. L'afirmació sobre `nano_banner_*` és un error de nom: no n'hi ha cap al resolver ni al fons públic. C7 històric a `.../261011_0230_onada12_claude/AUTOCURACIO_I_MODS.txt:380-383` ja descrivia correctament el canvi de prefix. |
| I35 · Blocs 0–4; fila explícita | Cronologia de Multimèdia | [PARCIAL] | La vista existeix (`MultimediaSection.jsx:44-45,75-105`), però `loadMultimedia` només demana `[['mediaItems','multimedia']]` (`src/data/supabase/content.js:259-260`). `loadSections` retorna exclusivament eixes claus en seed/local/remot (`:150-153,180-184`); mai calcula grups. `MultimediaContext.jsx:43` transmet els grups si arriben i cau a `[]`: no els esborra. `MultimediaSection.jsx:76` mapeja eixe buit sense estat explicatiu. El contracte només exigix `mediaItems` (`conformitat/kit.js:179-182`) i la prova de vista injecta grups (`MultimediaSection.test.jsx:13,25`), de manera que no acredita la cadena real. |
| I36 · Blocs 0–4; fila explícita | Publicació de les vinyetes Habitatge/Treball | [FET I SEGELLAT] | Ja són a `public/assets/ui/plugins/`, byte a byte iguals a `01_produccio/Targetes_Davinci_Llestes/`; ús a `src/sections/text/pageContent.js:371,381` i Treball també `src/sections/consola/imatgesConsola.js:63`. Per tant no són inèdites pendents de copiar. |
| M01 · §0.3.1 | Arbre assets separat en sistema, pobles, usuaris, entitats i contingut | [NO FET / PENDENT] | Inventari real de public/assets: cap de les cinc carpetes literals existeix. Hi ha events, fotos, img, nano_cards, notes, pages, system, towns, ui i uploads. Vegeu assets.json. |
| M02 · §0.3.1 | Canvi d'actor assigna cada recurs al calaix correcte | [PARCIAL] | Hi ha separació parcial uploads/poble, empresa i ajuntament; no s'ha acreditat el flux persona→entitat amb permisos i l'arbre nou. |
| M03 · §0.3.2 | Multimèdia reflecteix tot el cens real de 100–200 fotos | [PARCIAL] | MEDIA_ITEMS dona 26 elements i 26 URLs úniques; navegador TOTS (26). Inventari de disc: 202 rasters, inclosos originals i recursos no publicables automàticament. |
| M04 · §0.3.2 | Clic en foto obri visor modal natiu amb fons fosc | [NO FET / PENDENT] | MultimediaSection.jsx:57,88 enllaça al detall. Navegador: clic Benifallim navega a /multimedia/town-benifallim. |
| M05 · §0.3.2 | Visor amb anterior/següent i zoom fluid | [NO FET / PENDENT] | No s'ha localitzat el visor ni aquests controls en src/sections/multimedia. |
| M06 · §0.3.2 | Panell EXIF: data/hora, GPS, càmera, autor, poble i drets | [NO FET / PENDENT] | No hi ha panell de visor. La vista town-benifallim mostra metadades genèriques d'Element, no EXIF de la foto. |
| M07 · §0.3.2 | Eliminar /multimedia/town-* i portar al poble canònic | [NO FET / PENDENT] | Reproduït al navegador: /multimedia/town-benifallim es conserva; no redirigix a /pobles/benifallim. |
| M08 · §0.3.3 | Mapa fotogràfic llig GPS i temps EXIF | [NO FET / PENDENT] | La referència plantilla-mapa.html es conserva al laboratori; no s'ha localitzat integració operativa a Multimèdia/Territori. |
| M09 · §0.3.3 | Mapa agrupa/desagrupa segons zoom | [NO FET / PENDENT] | No s'ha localitzat la integració de clustering fotogràfic al producte viu. |
| M10 · §0.3.3 | Mapa amb cronologia lateral per dies, etapes i temes | [NO FET / PENDENT] | Hi ha cronologia simple de galeria, no la composició mapa/cronologia exigida. |
| M11 · §0.3.3 | Mapa processa fotos al dispositiu sense enviar-les a tercers | [NO FET / PENDENT] | No hi ha implementació integrada per certificar. Conservar un HTML de referència no acredita privacitat efectiva. |
| G01 · Regla d'or 1 | MCR granular de tot el pla i prompt | [FET I SEGELLAT] | Matriu present en aquest informe i mcr.json, amb IDs estables, tres estats exactes i evidència limitada per fila. |
| G02 · Regla d'or 2 | Balanç demanat, fet i traslladat sense perdre pendents | [FET I SEGELLAT] | Pla 261016_1639 generat amb totes les files no segellades; comprovació d'igualtat del conjunt d'IDs. És trasllat documental, no la funció web encara absent. |
| G03 · §0.6 | Cens exhaustiu d'històric, producció i laboratori | [FET I SEGELLAT] | 1497 fitxers inventariats: 720 històric, 297 producció, 480 laboratori. 418 són entrades del primer nivell històric. CSV/JSON amb estat per fitxer. |
| G04 · §0.6 | Lectura profunda i contrast exhaustiu de tot el corpus | [PARCIAL] | 51 lectures semàntiques íntegres, 2 equivalents verificats, 1 article extret complet, 1 auditoria parcial i 4 buits addicionals. Cua1166 textos (1164 pendents + parcial + HTML envoltant),271 binaris sense inspecció i3 exclusions BIOS/bundle. Processar1223 textos no és llegir-los semànticament. |
| G05 · §0.6 | Informe extens de rescat amb idees i codi ja existent | [PARCIAL] | Annex íntegre de31 idees,8 coincidències exactes amb codi viu i58 candidats de mateix nom. Extens en el lot revisat; cobertura global encara parcial. |
| G06 · Verificació 1 | Perfil: suite i comprovació visual de tres columnes | [PARCIAL] | Suites focals de perfil passades dins de 155 proves; /mercat observat amb Javi/foto. Falta QA autenticada de /el-meu-perfil en mides i modes requerits. |
| G07 · Verificació 2 | Xat: suite i adaptació responsive | [PARCIAL] | Actors permanents passa i IAIA s'obri al navegador local. Manca matriu de mòbil/tauleta/escriptori, sessió remota i noves capçaleres. |
| G08 · Verificació 3 | Lector rep dades reals | [NO FET / PENDENT] | Port real no connectat; només font injectada/llavor explícita. URLs escrites no equivalen a articles descarregats i persistits. |
| G09 · Verificació 4 | Tractor WebP supera prova adversarial | [FET I SEGELLAT] | 10/10 de l'auditoria WebP, originals intactes i contrast amb Pillow; abast de formats/metadades explicitat. |
| G10 · Verificació 5 | Porta Olivera en codi 0 | [FET I SEGELLAT] | Porta inicial codi 0; rebuts finals es registren a Verificació. Documents nous ancorats pel productor canònic. |
| G11 · Verificació 5 | npm run test:ci complet i verd | [PARCIAL] | CI final exit1: Node947 pass/0 fail/1skip/3TODO; Vitest18385 pass/1fail/89skip,1061 fitxers pass/1fail/6skip,1758,98s. Únic timeout HistoricCofre5000ms.2745/2745 fonts inicials intactes; diagnòstic ampliat5160ms no equival a verd oficial. |
| G12 · Tancament BIOS | ESTAT, Acta Marmota i porta de tancament | [PARCIAL] | ESTAT i LEDGER actualitzats preservant historial; Acta valida. Tancament valid:false/planned,457 incidències:455 graf global i2 divergències skills/manifest. Cap error referit als tres documents Codex o al seu directori d’evidència; no s’han resegellat skills. |
| G13 · Olivera i autonomia | Lectura creuada dels documents actius i coordinació de rols | [FET I SEGELLAT] | Llegits tots els documents actius del primer nivell, pla/prompt ampliats i Gemini relleu2; Claude encara plantilla sense resultats al tall. Relleus Codex1–7, refutacions contrastades amb codi i probes; hashes d’entrada preservats. Cap producció tocada per Codex. |
| G14 · Model B | Enxufabilitat desacoblada i font de veritat Supabase | [PARCIAL] | Port neutral i Frontissa GET acotada passen localment; endpoints Sollutia absents. No s'ha demostrat intercanvi complet amb amfitrió/sessió reals. |
| G15 · Higiene | Recursos propis recollits i crons finalitzats | [FET I SEGELLAT] | CI/focals i tres subagents acabats; tab temporal tancat; cap cron creat. Quatre automatitzacions del projecte reverificades PAUSED. Cap procés alié interromput. |

### Evidència de navegador i desplegament

Navegador integrat real, servidor existent localhost:3340, sense publicar dades ni enviar missatges: /mercat confirma Javi, poble i foto; /notes confirma diàleg OS sense XL i controls dispersos; /multimedia mostra26 i manté /multimedia/town-benifallim; /xat obri IAIA amb missatge/compositor i conserva DM Sóc redundant. No és una sessió remota autenticada ni una certificació responsive completa.

GET públic amb User-Agent de crawler: [socdepoble.org](https://socdepoble.org/) HTTP200 text/html7009B, sense metadades OG; la [URL OG oficial](https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png) retorna el mateix HTML/SHA, no PNG. [Gent de la Torre](https://gentdelatorre.net/) té OGtitle però no og:image ni og:description. Detall i hashes a `261016_1632_auditoria_codex_evidencies/seo.json`. No s’ha fet una prova del client WhatsApp ni un desplegament.

### Estrés i infraestructura: rebuts i límits



| Workflows | Duració ms | p95 ms | Peticions simulades | 503 injectats | Errors finals | Heap pic MiB | Heap després clear+GC MiB |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1000 | 101,11 | 96,42 | 10020 | 10 | 0 | 88,38 | 52,15 |
| 5000 | 385,45 | 381,58 | 50100 | 50 | 0 | 171,77 | 52,22 |
| 10000 | 805,38 | 795,39 | 100200 | 100 | 0 | 305,08 | 52,25 |
| 40000 | 2952,64 | 2902,09 | 400800 | 400 | 0 | 880,26 | 52,29 |

A 40000: RSS 1079,02 MiB; màxim 158800 operacions simulades pendents simultàniament; pendents finals 0. A tots els nivells, 0 errors finals i 0 intents de xarxa. Neteja de 40000 subscripcions, cancel·lació prèvia, rebuig de cursors que no avancen, rebuig d'ACK invàlid i recuperació de `removeChannel` amb l'SDK instal·lat: totes passen. Execució completa: 8 proves, 4,97 segons, Node v24.13.0, JSDOM i un únic worker.

Límits decisius: un event loop i una sessió fixture; sis notes i tres publicacions reutilitzades; reintent 503 manual del test (`tests/gauntlet-codex-concurrency.stress.mjs:177`); idempotència implementada amb Map del simulador (`:106–111`). No prova recuperació automàtica UI, idempotència Postgres ni capacitat backend. El màxim de peticions pendents és del simulador, no sockets ni connexions DB. Heap estable després de GC en quatre tandes és evidència favorable, no prova d'absència de fuites prolongades. No hi ha llindar de memòria en l'assert del harness. Els hashes dels sis fitxers font/SDK del report continuaven coincidint al final de la subauditoria.

## Conversor, Frontissa i WordPress

`tests/gauntlet-codex-webp.audit.mjs`: 10 proves sintètiques passen. Contrast independent amb Pillow i extractor RIFF del test: GPS, data/hora, fus, càmera, MakerNote, orientació normalitzada, mida 1200²/400², pressupost decimal estricte, camins amb espais, conservació de font/destí davant errors i neteja de temporals. No s'han convertit fotos reals ni editat actius del repositori. Hash del conversor sense canvis abans/després.

`tooling/gates/tractor-frontissa.mjs`: passa; transport observat local i `fetch` global bloquejat. Verifica entrada tancada, GET sense credencials, origen, consulta, payload i DTO. No valida endpoints remots, perquè el catàleg de producció és buit.

`tests/enxufe-plugin.test.mjs`: 18/18, 0 omeses, duració 1217,40 ms. Inclou literal WordPress i control de traducció/texturització per inspecció de font; no mesura FCP/CLS ni acredita release desplegada.

Comandes ja executades, sense repetir-les en el suport documental:

```sh
SDP_GAUNTLET_REPORT=/tmp/sdp-infra-agent-stress.json node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs
SDP_WEBP_AUDIT_REPORT=/tmp/sdp-infra-agent-webp.json node tests/gauntlet-codex-webp.audit.mjs
node tooling/gates/tractor-frontissa.mjs
node --test tests/enxufe-plugin.test.mjs
```

Rebuts temporals: `/tmp/sdp-infra-agent-stress.json` i `/tmp/sdp-infra-agent-webp.json`. Aquest fragment és suport per integrar al lliurable canònic, no un altre informe del repositori.

Prioritat de trasllat: RSS real i captura d'articles; MCR/certificació/balanç de Consola; migració dels recursos JPEG i resolució explícita del fallback JPEG; connectar recursos Sollutia amb captures; prova de càrrega real separada i autoritzada.



### Rescat de memòria: informe del lot contrastat

# Rescat històric — aportació de Codex a l’auditoria Gauntlet

Tall: 2026-10-16. Treball només de lectura sobre les tres zones; cap execució de codi històric, cap trasllat, eliminació o modificació de fitxers protegits. Este document és material de treball temporal per a l'orquestrador; no substituïx el document d'auditoria que ha de nàixer pel protocol viu.

## Dictamen i balanç de cobertura

**[PARCIAL] El gran rescat no es pot certificar exhaustiu. L'inventari sí que és exhaustiu; la lectura semàntica no.**

El nombre «418» del pla és correcte com a **entrades de primer nivell de l'arxiu**, però incorrecte quan el prompt les anomena 418 fitxers. El recompte recursiu és 720. El mandat complet inclou 1.497 fitxers, no 418.

| Zona | Entrades al primer nivell | Fitxers recursius | Bytes |
|---|---:|---:|---:|
| `_wiki_de_poble/90_arxiu_historic/` | 418 | 720 | 27.990.199 |
| `_wiki_de_poble/04_escriptori/01_produccio/` | 27 | 297 | 225.752.976 |
| `_wiki_de_poble/04_escriptori/02_investigacio_ia/` | 60 | 480 | 14.499.531 |
| Total | 505 | 1.497 | 268.242.706 |

Cobertura real:

- Inventari, grandària, categoria, estat de lectura i, quan s'ha processat, empremta SHA-256: 1.497/1.497 fitxers. És una instantània del directori; no és garantia que un altre actor no el canvie després.
- Processament mecànic de text UTF-8: 1.223 fitxers, 48.853.465 bytes. Inclou codi, HTML brut, JSON, fragments de fitxer, SVG i un EPS textual de 12,5 MB. **Decodificar bytes i extreure títols no equival a llegir-los semànticament.**
- Lectura semàntica íntegra: **51 fitxers**: 30 Markdown del laboratori (30/30), 10 fonts de producció (5 Markdown inclòs un buit, el generador de sitemap, el CSV complet AyudaWP i 3 enllaços `.webloc`) i 11 documents històrics. La llista exacta és `lectura_integra.txt`. Els `.webloc` s’han llegit com a metadades d’enllaç; no s’han visitat les destinacions.
- Un article amb **cos textual extret i llegit complet**: `article-ayudawp.md`, 11.647 caràcters extrets de l’element `<article>`; la captura d’HTML envoltant no està auditada. Es registra separat de la lectura íntegra del fitxer.
- Dues fonts amb equivalència verificada: el TXT AyudaWP és idèntic al CSV complet després de normalitzar els separadors de secció i els blancs; el CSV curt és un subconjunt exacte normalitzat (la portada). No es compten com a lectures directes noves.
- Lectura parcial: un fitxer, l’auditoria d’arqueologia de 2026-10-10, seccions de rescat 132–193 i cerca estructural.
- Quatre documents històrics addicionals buits, comprovats com a buits. Junt amb el Markdown buit de producció, hi ha cinc fitxers de zero bytes.
- 1.164 textos pendents de lectura semàntica, més l’auditoria parcial i l’HTML envoltant de l’article extret: la cua exacta té 1.166 entrades. El lot pendent inclou 37 vectors textuals no revisats visualment.
- 271 binaris o formats no inspeccionats: imatges, PDFs, documents, fulls de càlcul, ZIP, Affinity, payloads b64 i formats associats. No s'han obert, renderitzat ni OCRitzat. Que consten a l'inventari no certifica el seu contingut.
- 3 exclusions explícites: `90_arxiu_historic/260922_0320_BUNDLE_null.md` i les dues còpies `AGENTS.md.txt` del laboratori `261006_0300_ledger_claude/t4_model_b/nous/`. No s'han mostrat ni interpretat còpies antigues del BIOS. El bundle, que podria contenir-les, queda exclòs completament. L'inventari de JSON/patch és mecànic i no promociona el contingut incrustat a instruccions.
- Cap test executat en este subfront de lectura. La presència de proves al codi no acredita que passen hui; correspon a la verificació del front principal.

Demanat: rescat exhaustiu amb contrast i memòria viva. Fet: cens complet, triatge, 51 lectures completes, 2 equivalències, 1 article extret, 1 lectura parcial, coincidències de codi i un conjunt concret d'idees rescatades amb evidència. Traslladat: lectura semàntica de la cua, inspecció visual/documental dels binaris, classificació final de totes les idees i conciliació del registre canònic. **No es proposa cap esborrat a partir d'esta cobertura parcial.**

## Fets que canvien la interpretació del magatzem

### 1. La memòria de producte continua partida entre dos registres

`_wiki_de_poble/02_saber/00_full_de_ruta.md` té buides les seccions En producció, Collita tancada, Sementeres vives i Retirades. Només conserva explícitament la Bàscula de Cooperativa, descartada per ara. S'ha llegit íntegre.

Això ja ho denunciava `90_arxiu_historic/261010_1741_auditoria_claude.md:132`. Hui continua passant. El text públic de `src/sections/text/pageContent.js:153` conserva un catàleg extens de llavors; hi ha idees com Rúper Rató, ràdio TTS, Espill del Temps, Atles del Trellat, Cibermajors i pont WhatsApp. El text usa estats «Fet» o «Beta» històrics que **no són prova d'implementació**. Alguns elements antics estan comentats en HTML; no s'han de confondre amb elements visibles. Altres idees offline continuen descrites com a beta/futur, mentre la Wiki diu que eixa arquitectura queda retirada.

Acció recomanada per al pla següent: un registre viu únic, amb identificador per idea, font original, estat contrastat, ruta del codi, prova i decisió de vigència. Reconstruir-lo des del text públic i els originals, conservant les idees retirades com a història. No copiar cegament els estats ni els terminis de 2026-Q1/Q2.

### 2. Una proposta antiga no equival a una necessitat encara pendent

El brainstorming superadmin de `261009_2005_brainstorming_panell_superadmin.md` deia que no hi havia cap MFA al client i que això bloquejava el panell. Hui hi ha `src/sections/admin/SegonFactor.jsx`, `FacetaTaxonomia.jsx` i `FacetaEstil.jsx`; les facetes criden `adminDesaPersonalitzacio` i `adminHistorialPersonalitzacio`, amb restauració de versions. L'absència de MFA d'aquell informe està superada. Falta provar el desplegament i el flux real, però no cal tornar a dissenyar els tres components.

La lliçó Xylella tampoc s'ha perdut sencera: `src/sections/gestoria/finestreta/nucli/formularisFinestreta.js:10` documenta i implementa el tipatge del camp destinatari, ompli només valors confirmats i marca `tipus-incompatible` o `sense-confirmar`. `validadorsIdentitat.js:280` rebutja xifres en noms, explicitant la regressió DNI→nom. La Finestreta té quatre formularis declaratius; això no acredita el formulari específic oficial de Xylella ni una presentació administrativa automàtica.

El Rebost també ha evolucionat: `src/apps/nevera/nucli/recomanador.js` és un recomanador pur, determinista i explicable; `receptes.js` porta 14 receptes. La visió de 2026-10-02 imaginava una IA que suggeria sopars. Ja hi ha una peça útil amb el mateix objectiu sense necessitat d'un model gran. El model admet caducitats, però el mateix codi advertix que el Rebost actual no en guarda ni tampoc quantitats: cal provar la integració abans de donar per fet el flux complet.

### 3. Hi ha codi de laboratori ja adoptat; tornar-lo a aplicar seria arriscat

La comparació mecànica per basename i SHA-256 ha trobat **66 parelles candidates** amb codi viu: 8 són idèntiques byte a byte i 58 tenen el mateix nom però contingut diferent. Les 58 no poden classificar-se com a adoptades ni descartades sense diff semàntic.

Les 8 coincidències exactes són:

1. `260924_1410_tractors_claude/taxonomia.json` = `tooling/wiki/taxonomia.json`.
2. `261002_1510_tractor_fatiga_claude/nous/tooling/gates/fatiga-hook.mjs` = el fitxer viu homònim.
3. `261006_0055_olivera_ancores_opus/nous/tests/cognitive-preflight.test.mjs` = el test viu.
4. La mateixa carpeta, `tests/porta-olivera-diagnosi.test.mjs` = el test viu.
5. `261006_0300_ledger_claude/t1_ledger/nous/tests/fonts-vigilancia.test.mjs` = el test viu.
6. La mateixa carpeta, `tests/mapa-consola.test.mjs` = el test viu.
7. La mateixa carpeta, `tooling/brain/fonts-vigilancia.mjs` = el productor viu.
8. `261009_0400_higiene_claude/nous/tooling/higiene/cron_higiene.mjs` = el fitxer viu.

Les rutes històriques d'esta llista són relatives a `04_escriptori/02_investigacio_ia/`. L'evidència completa és `coincidencies_codi_viu.csv`. Una coincidència d'empremta prova igualtat del contingut, no que el codi s'execute en producció. També hi ha **26 duplicats exactes excedents en 22 grups dins del corpus**. L'empremta no autoritza eliminar originals.

### 4. Hi ha artefactes buits i còpies crues amb aparença de document acabat

`01_produccio/checklist-limpieza-wp-ayudawp.md` té zero bytes; conviu amb TXT, CSV i XLSX no buits. `article-ayudawp.md` té 402.404 bytes però comença amb una captura d'HTML completa del lloc d'AyudaWP: CSS, metadades, recursos externs i després el contingut. No és un article Markdown net. El cos complet s’ha extret sense executar JavaScript i s’ha llegit; la font HTML envoltant continua pendent. L’article i el CSV complet descriuen una plantilla de 77 comprovacions en huit fases, amb estat, data, notes i evidència abans/després. Són una referència de seguiment operatiu, no evidència que este projecte estiga infectat. Les afirmacions jurídiques, percentatges i promeses de tercers del material no s’han verificat i no es promocionen a criteris normatius.

L'arxiu conserva altres quatre Markdown de zero bytes (rutes exactes a l'inventari), incloent els dos fitxers de consola de `260929_2346` i el pla de `260930_0040`. No es pot rescatar una decisió d'un nom sense cos.

El generador de sitemap de producció és una peça històrica d'1.357 bytes que escriu automàticament quan s'executa. El seu `../../` des de `01_produccio/` resoldria `_wiki_de_poble/`, no l'arrel del repo. No s'ha executat. Ja existeixen `public/sitemap.xml` i el productor SEO `tooling/gates/build-seo-manifest.mjs`; no té sentit adoptar-lo sense revisar la cadena actual.

## Memòria útil rescatada i estat contrastat

En la taula, `01_produccio/` i `02_investigacio_ia/` són relatius a `_wiki_de_poble/04_escriptori/`; `90_arxiu_historic/` és relatiu a `_wiki_de_poble/`. Els noms abreujats de fonts fan referència als fitxers únics del manifest. Els destins de codi abreujats es resolen en el mapa següent; cap estat de «peça existent» implica prova en producció.

| ID | Idea i valor humà | Font històrica llegida | Contrast viu / estat | Pròxima acció concreta |
|---|---|---|---|---|
| R01 | Accions del Manifest 2022: cotxe compartit, acompanyament, bancals, eines, compres, avisos, oficis i animalets | `01_produccio/260911_0645_propostes_manifest_panell_control.md` | `destinsControl.js:150` i `:156` tenen Vehicle i Animalets; la llista inclou Mur, Mercat, Calendari, Mapa, Treball i Habitatge. No hi ha correspondència directa demostrada per a totes les accions del Manifest. **PARCIAL** | Mapar cada necessitat a un flux complet: oferta/demanda, dades mínimes, publicació i contacte. No donar una card per servei implementat. |
| R02 | Capturar des del navegador preservant jerarquia i decidir després si publicar | `01_produccio/260911_0012_agenda_futur_extensio_chrome.md`; `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | `SnippetCurador.jsx`, `modeDesa.js` i `contingutExtern.js` resolen URL, títol, subtítol, entradilla i destí Notes/Lector. El lector queda pendent del connector. No s'ha localitzat un paquet de navegador dins del codi cercat. **PARCIAL** | Provar des d'una web externa fins a la nota; identificar paquet real, extracció de cos H1/H2/H3 i permisos. |
| R03 | Classes de targetes d'acció i informatives coherents | `01_produccio/260911_0006_tasques_ui_standardization.md` | Hi ha `src/components/PedraSeca/organismes/UniversalCard.jsx` i proves `UniversalCard.accio.test.jsx`; la ruta antiga `components/ui/` ja no és l'autoritat. **BASE EXISTENT** | Auditar les variants actuals i els punts que encara creen cards pròpies, sense tornar al disseny de setembre. |
| R04 | Contracte compartit de graella amb accions de capçalera | `01_produccio/contracte_graella.md` | `AppGridShell.jsx` i `AppGridColumn.jsx` existixen; `startActions`, `endActions` i `replegaTotaCapcalera` estan al component viu. **PEÇA EXISTENT** | Usar el contracte viu com a referència dels editors i evitar variants locals. |
| R05 | Pont WhatsApp per evitar aïllar el veí del seu entorn | `90_arxiu_historic/260927_1400_idea_pont_whatsapp.md` | `bot/arrels.mjs:47-49` encara apunta a tres fitxers absents: antic Genotip, `.agents/identity/PROFILE.md`, `bot/persona/IAIA_MARIA.md`. No s'ha arrencat el bot ni inspeccionat sessions. **NO OPERATIU ACREDITAT** | Decidir producte i transport, reparar només després del contracte. Les promeses i tarifes de WhatsApp del text antic no estan verificades. |
| R06 | Xat d'entrada que mostra persones/actors i ajuda a entendre el producte | `260929_1210_brainstorming_onboarding_fake_chat.md` | El mandat actual de quatre actors i resposta identificada com automàtica substituïx el llenguatge antic d'«il·lusió» i «cebo». **REFORMULADA** | Validar els quatre actors i la transparència; no importar converses falses com si foren reals. |
| R07 | Mapa visual d'agents: fluxos, calendari, skills, entrades/eixides, agents i actors | Els 13 Markdown de `02_investigacio_ia/001 NEXUS/` | El codi viu té `src/sections/consola/mapa/`, `FluxosMapa`, `CalendariMapa`, `InventariMapa`, `EntradesEixides`, `AgentsAtomics` i `ActorsMapa`. `mapaContent.js:20` retorna absència fora de DEV. **BASE ADAPTADA, NOMÉS DEV** | Reutilitzar el mapa existent per al govern visual. No instal·lar ni executar el Python/instal·ladors històrics. |
| R08 | Panell superadmin de taxonomia i estil amb historial i segon factor | `261009_2005_brainstorming_panell_superadmin.md` | `SegonFactor`, `FacetaTaxonomia`, `FacetaEstil`, crides al port i restauració de versions presents. **PEÇA EXISTENT** | Provar MFA, permisos del servidor, conflicte de versió i persistència remota; no reobrir el diagnòstic antic d'absència total. |
| R09 | Aplicacions modulars que fallen de manera aïllada | `261003_Onada_4_Tancament/261003_2320_directriu_arquitectura_plugins.md` | `src/apps/plataforma/registreApps.js` valida manifests, té apps internes i registre extern; `index.js` exposa API de plataforma. **PEÇA EXISTENT** | Provar una app invàlida i una fallada del mòdul; l'objectiu de milers de plugins és visió, no càrrega certificada. |
| R10 | Amagar portada en eines recurrents per guanyar espai | Mateixa directriu de plugins | No s'ha acreditat l'interruptor de preferència comú en la cerca feta. **PENDENT DE VERIFICAR** | Localitzar el control actual o afegir-lo al contracte de plataforma només si continua vigent. |
| R11 | Receptes basades en ingredients disponibles | `261002_0310_visio_arquitectonica_expansio.md`; `90_arxiu_historic/261011_0130_ordres_nit_directora.md` | Receptari de 14 plats i recomanador determinista en `src/apps/nevera/nucli/`. **PEÇA EXISTENT** | Provar flux compra→rebost→recepta; quantitats/caducitats no estan acreditades en l'estat real del rebost. |
| R12 | Cures quotidianes privades, diaris i horaris | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | App `salut` registrada i nucli local existent. No s'ha trobat connector AEMPS en la cerca acotada. **PARCIAL** | Separar registre de cures ja existent d'interpretació clínica de medicaments, que seguix sent recerca. |
| R13 | TPV connectat amb escandalls i compra al proveïdor | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | App `bar` registrada i CSV real de La Parròquia a `src/apps/bar/llavors/la-parroquia-loyverse.csv`. **BASE EXISTENT** | Verificar els fluxos reals de caixa/tiquet/inventari amb el front principal; no confondre captures Loyverse amb implementació. |
| R14 | Reserva de taula amb calendari del propietari | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | No s'ha acreditat integració amb Google Workspace en esta lectura. **IDEA PENDENT** | Definir què es reserva, confirmació i disponibilitat; no assumir que una subscripció externa garantix el flux tècnic. |
| R15 | Infraestructura compartida per a oli, torró i productors locals | `90_arxiu_historic/261002_0310_visio_arquitectonica_expansio.md` | Mercat i Gestoria són bases reutilitzables, però l'oferta comercial/omnicanal no s'ha validat. **IDEA DE PRODUCTE** | Validar un cas de productor concret i el procés complet, sense crear un segon ERP. |
| R16 | Mapatge burocràtic que no confon NIF amb nom | `261012_1322_relat_historic_xylella.md` | `formularisFinestreta.js:10`, `validadorsIdentitat.js:280`, fitxa d'identitat i esquemes purs. **PEÇA EXISTENT** | Executar proves de regressió i comprovar model oficial concret; els quatre formularis actuals no inclouen una presentació Xylella automàtica. |
| R17 | Partida doble amb comptes, balanços i separació llar/empresa | `261012_1715_gnucash_arrel.md` | Hi ha facturació, registre, conciliació, simulació fiscal i llibre XLSX. No s'ha acreditat un llibre major de partida doble complet. **PARCIAL / MODEL COMPTABLE PENDENT** | Fer inventari de motor comptable i reconciliar invariants de deure/haver abans d'anomenar-lo GnuCash propi. |
| R18 | Gestoria amb context fiscal, escenaris i gràfics útils | `261012_1915_arquitectura_visual_erp.md` | Manifest Gestoria amb facetes i `impostos/nucli/simulacio.js`; les xifres porten `[NO VERIFICAT]` i cobertura completa/parcial/cap. **PEÇA EXISTENT** | Verificar UI i dades; la simulació no és una declaració fiscal presentada. |
| R19 | RSS d'investigació que convertix novetats en propostes de skills | `261012_1825_workflow_rss_skills.md` | Hi ha app lector i `wiki-busca-skills`; no s'ha acreditat la cadena RSS→anàlisi→proposta→revisió. El mateix text la deixa estacionada. **IDEA PENDENT** | Dissenyar un flux que crea propostes revisables, sense instal·lació automàtica de codi extern. No s'ha creat cap cron en esta auditoria. |
| R20 | Tres lents de manteniment: duplicitat, creixement i seguretat/rendiment | `261012_1815_skills_antislop_thermos.md` | No existixen les rutes exactes `porta-antislop.mjs` ni `core-thermos-manteniment/SKILL.md`. Hi ha moltes portes actuals: absència del nom no prova absència de cobertura. **PROPOSTA NO CONCILIADA** | Mapar les tres lents a portes ja existents; evitar crear comprovacions duplicades. |
| R21 | Automatitzar friccions repetides entre humà i agents | `261002_1650_carboni_silici_fluxos.md`; `261002_1655_tractor_fluxos.md` | La skill proposada `core-fluxos-automillora` no està en la ruta exacta. **PATRÓ RESCATABLE** | Guardar entrada, eixida, criteri d'èxit i desencadenant de cada flux útil, en lloc de copiar les ordres antigues. |
| R22 | Feedback immediat i moviment interrompible | `261004_0045_skills_kowalski_impeccable.md`; `261011_0246_teoria_kowalski_apple_design.md` | Són referències de disseny, no prova que les regles estiguen implementades. **CRITERI PER VERIFICAR** | Auditar components concrets, teclat i moviment reduït; no imposar springs o noves dependències per nom d'autor. |
| R23 | Humor rural visual amb text llegible i sense pseudotext | `261010_2200_tractor_ortografia_valenciana.md` | Necessitat de qualitat recuperada; el nom del fitxer d'ortografia no descriu tot el contingut visual. **CRITERI VIU A CONTRASTAR** | Comparar amb la skill visual actual i conservar els exemples útils; cap generació d'imatges feta ací. |
| R24 | Àrea de clic de tota la capçalera i navegació amb fletxes | `260927_1230_deute_accessibilitat_fletxes.md`; `260927_1645_deute_usabilitat_botons.md` | `AppGridColumn.jsx:115` té `replegaTotaCapcalera`; no s'ha acreditat cobertura general de fletxes. **PARCIAL** | Auditar focus, teclat i excepcions (Carpetes/Notes) en les instàncies reals. |
| R25 | Mapa patrimonial de fotos, arbres i cronologies | Pla actual + arqueologia `261010_1741`, fragment de rescat | Fitxer Emowe de referència inventariat; imatge `public/assets/img/pi-pla-verd.jpg` encara existix. Hi ha geolocalització en enquadrament. No s'ha acreditat mapa/visor integrat. **PARCIAL** | Rescatar fitxa patrimonial amb coordenades/font verificades i provar ingestió EXIF→mapa; no executar HTML històric. |
| R26 | Mesures del client: LCP, DOM i complexitat dels fitxers | `261010_1845_noves_ordres_fable.md`; arqueologia 261010 | Les dues idees es van salvar explícitament. La cerca no acredita les targetes `nodes-del-dom` / `fitxers-dins-del-sostre`; sí existix infraestructura de mètriques. **PENDENT** | Contracte de mètrica reproduïble i productor real, diferenciant N/A de zero. No restaurar els tretze llindars antics derogats. |
| R27 | Càrrega documental mesurada en la Consola | Fragment de rescat de 261010 | `consolaContent.js:103` i `consolaPagines.js:257` consumixen `termometria.artefactesActius`; `recullConsola()` no la produïx i `comptaArtefactes()` existix en `termometre_context.mjs:446`. **BUIT D'INTEGRACIÓ REVALIDAT** | Connectar font i mètrica amb abast clar, sense inferir-la del nombre d'arxius o inventar tokens. |
| R28 | Escoltar el Mur i disposar d'un mode de lectura de contrast extrem | Fragment de rescat de 261010 + roadmap públic | No s'ha localitzat `speechSynthesis` al codi viu cercat ni selector de contrast al Perfil; sí existeix base de tokens/accessibilitat. **IDEES PENDENTS** | Un cas petit i verificable: llegir una publicació i un control d'aparença accessible. |
| R29 | Caçador de butlletins, cronista i coneixement agrícola | Arqueologia 261010 + roadmap públic | Hi ha lector RSS; no s'ha acreditat cap lector DOGV/BOE ni RAG agrícola connectat. **IDEES PENDENTS** | Una font real amb procedència, dates i revisió; distingir ingestió de generació i interpretació. |
| R30 | Vigilància d'integritat que caduca i alertes deduplicades | `02_investigacio_ia/vigilante/SECURITY.md` | Document de referència d'un plugin tercer; 70 fitxers del plugin inventariats, codi no auditat ni executat. **PATRÓ DE REFERÈNCIA** | Inspiració: una comprovació antiga deixa de ser verda i un canvi d'estat dispara l'avís. No afirmar que Vigilante està instal·lat a cap node. |
| R31 | Matriu de comprovacions amb estat, data, nota i prova abans/després | `01_produccio/article-ayudawp.md` (cos extret); `checklist-limpieza-wp-ayudawp-complet.csv` | La Consola i les portes aporten una base de seguiment; no s’ha acreditat que tinguen una matriu completa amb aplicabilitat, responsable i verificació posterior. **PATRÓ TRANSFERIBLE** | Adaptar el seguiment al MCR: cada comprovació indica si aplica, què s’ha observat, prova, data i responsable. Les 77 regles WordPress no s’importen com a requisits d’una app React. |

## Recursos que necessiten una decisió editorial, no adopció automàtica

**Dossier Qwen.** `261002_1705_sobirania_tecnologica_qwen.md` s'ha llegit complet. Fa afirmacions molt concretes de benchmarks, models, latències, costos i sobirania «100%» sense aportar un protocol reproduïble ni fonts enllaçades que les sostenen dins del fitxer. Defén un canvi a offline total, incompatible amb l'autoritat actual de Model B/online-first. El valor rescatable és el cas d'ús (privacitat, processament local, adequar cost/capacitat), no els números ni la proposta de compra de maquinari. Queda com a recerca no validada.

**Promeses de plugins vistes en vídeos.** Ponytail, OmniRoute, Graphify, prompts.chat, Pace i altres apareixen en notes de setembre/octubre. S'ha llegit el que el dossier diu, però no s'ha verificat l'existència actual, llicència, especificacions ni percentatges de rendiment. Es conserva la necessitat (reduir relectura, mapa de dependències, ruta de models, qualitat visual); no es recomana instal·lar res per estes notes.

**NEXUS.** Els agents i skills inclosos porten «EJEMPLO». No s'han tractat com a configuració efectiva ni tasques programades del projecte. No s'ha executat l'instal·lador ni creat cap calendari.

**Codi de tercers i dades gràfiques.** Les captures de WhatsApp/Loyverse, els SVG d'al·lèrgens, documents PDF/DOC/XLSX, Affinity, ZIP i el plugin Vigilante són patrimoni de referència, no una funcionalitat del producte. Continuen protegits. Els noms de carpeta com `ES_POT_BORRAR` no són autorització d'esborrat.

## Priorització de la continuació

1. Restaurar coherència de memòria: registre únic de llavors amb prova viva. És el mecanisme que evita repetir el mateix rescat cada setmana.
2. Tancar el rescat per lots amb identificadors de font i cobertura exacta, començant pels 609 Markdown històrics pendents i l’auditoria parcial (11 llegits, 4 buits i 1 bundle exclòs completen els 626 Markdown del cens), els informes de laboratori TXT i els candidats de codi diferent. El recompte precís s'ha de prendre de la cua, perquè hi ha fitxers buits que no requerixen lectura.
3. Convertir les 31 idees rescatades en tres estats visibles: ja existeix i cal verificar; base existent i falta integrar; idea futura. El camp «evidència» ha de distingir codi, test executat, captura visual i desplegament.
4. Inspeccionar binaris per famílies amb eines adequades: fonts visuals del TPV/xat, documentació de cures, fulls i PDFs, paquets. Registrar cada format no llegit.
5. Fer diff semàntic dels 58 candidats amb codi viu del mateix nom. Un patch antic no s'aplica sobre l'arbre actual sense reconciliació.
6. Només després de la lectura i de decidir vigència, proposar eventual consolidació/arxiu. Esta tanda no proporciona base per eliminar documents del Mestre.

## Fitxers temporals lliurats

- `inventari.csv` i `inventari.json`: cens de tots els fitxers, estat de lectura, categories i empremtes.
- `resum_inventari.json`: comptatges reproduïbles.
- `lectura_integra.txt` i `llegits_lot1..7.json`: llista de lectura semàntica real.
- `manifest_lectura_semantica.json` (còpia Markdown temporal no duplicada): evidència específica de lectura directa, equivalència i parcialitat; la llista de pendents roman al cens complet.
- `article-ayudawp_extret.txt`: cos de l’article llegit, sense executar la pàgina.
- `cua_lectura_pendent.csv`: treball que encara falta, sense ocultació.
- `titols_i_capitols.json`: índex mecànic dels Markdown (ajuda per a triar lots; no acredita comprensió).
- `coincidencies_codi_viu.csv`: 8 igualtats exactes i 58 coincidències de nom amb contingut diferent.
- `roadmap_public_actual.txt`: extracció de text del valor de `PAGE_COPY.roadmap`, incloent text que estava dins de comentaris HTML; no usar-la com a còpia exacta del que veu un visitant.

Originals temporals de treball a `/tmp/gauntlet-codex-rescat/`. L'orquestrador pot incorporar les dades al document canònic amb el circuit documental viu. La categoria MCR del rescat ha de continuar **PARCIAL** fins que es complete i certifique la cua restant.

## Trasllat operatiu de requisits rescatats

Els responsables següents són **rols proposats per al pla**, no persones que hagen acceptat un encàrrec. El director humà resol vigència i producte; l’orquestrador assigna la implementació. Les prioritats no autoritzen cap canvi per elles mateixes. P1 correspon a coherència o integració revalidada; P2 a comprovació de peces existents; P3 a llavors futures. Una cerca sense coincidències és evidència acotada, no prova universal d’absència.

| ID | Prioritat | Responsable proposat | Criteri d’acceptació del trasllat |
|---|---|---|---|
| R01 | P2 | Producte comunitari | Les huit famílies del Manifest tenen estat i ruta de flux o una llavor pendent amb decisió explícita. |
| R02 | P2 | Captura/Notes/Lector | Una captura externa conserva títol, subtítol, cos i procedència; la nota privada precedix la publicació voluntària. |
| R03 | P2 | Pedra Seca/UI | Cada variant de card té contracte comú i es pot activar amb teclat. |
| R04 | P2 | Pedra Seca/Graella | Una capçalera real resol les accions laterals i el plegament sense duplicar l’acció interior. |
| R05 | P1 | IAIA/Ports amb decisió de Producte | Les tres referències absents tenen substitució canònica o el bot queda declarat retirat; cap promesa d’operativitat sense prova. |
| R06 | P2 | Acollida/Xat | La prova dels quatre actors evidencia autoria i automatització; cap simulació es presenta com a conversa real. |
| R07 | P2 | Consola | Les sis vistes del mapa tenen fonts actuals i l’abast DEV és visible al registre. |
| R08 | P2 | Administració/Seguretat | Lectura, edició i restauració es proven amb MFA i permisos reals; un usuari sense permís és rebutjat. |
| R09 | P2 | Plataforma d’apps | Un manifest invàlid i un mòdul que falla no impedixen obrir la resta d’aplicacions. |
| R10 | P3 | Plataforma/Producte | Existència o absència de la preferència documentada; si s’aprova, persisteix i no amaga controls essencials. |
| R11 | P2 | Rebost | Una cistella real produeix una recepta explicable; les limitacions de quantitat/caducitat són visibles. |
| R12 | P3 | Cures/Producte | Es delimita el registre de cures i quines fonts externes falten; cap atribució clínica sense font validada. |
| R13 | P2 | TPV/Gestoria | Un tiquet de prova travessa caixa, inventari i registre sense duplicació i amb font de dades identificada. |
| R14 | P3 | Reserves/Producte | Model mínim de disponibilitat, confirmació i cancel·lació aprovat abans d’integrar cap calendari extern. |
| R15 | P3 | Productors/Mercat | Un productor real té oferta, contacte/comanda i seguiment sense duplicar Gestoria. |
| R16 | P2 | Finestreta | Regressió DNI→nom coberta i formulari oficial concret contrastat; cap camp no confirmat s’ompli silenciosament. |
| R17 | P3 | Gestoria/Comptabilitat | Inventari del model i prova d’assentaments quadrats; separació de llars i activitats documentada. |
| R18 | P2 | Gestoria/Impostos | Les dades incompletes mostren absència o parcialitat; tota estimació conserva la marca de verificació i font. |
| R19 | P3 | Recerca/Skills | Una entrada RSS produeix proposta revisable amb font; l’aprovació precedix qualsevol instal·lació. |
| R20 | P2 | Manteniment/Portes | Cada lent té porta existent, buit concret o decisió de no aplicar; no apareixen dues portes equivalents. |
| R21 | P3 | Orquestració | Un flux recurrent té entrada, eixida, desencadenant i prova d’èxit, amb supervisió definida. |
| R22 | P2 | UI/Accessibilitat | Un component real respon immediatament, interromp l’animació i respecta moviment reduït. |
| R23 | P3 | Edició visual | Una mostra validada manté català llegible i supera la revisió ortogràfica i visual prevista. |
| R24 | P2 | UI/Accessibilitat | Es verifica navegació per fletxes, focus i clic complet en les instàncies triades, incloses excepcions. |
| R25 | P3 | Patrimoni/Mapa | Una fitxa amb font, fotografia i coordenada es mostra al mapa; EXIF absent no inventa ubicació. |
| R26 | P2 | Observabilitat | Cada mètrica té unitat, productor, instant de captura i cas absent; els llindars derogats no reapareixen. |
| R27 | P1 | Consola/Termometria | `recullConsola()` retorna la càrrega documental amb abast declarat i la targeta diferencia absència de zero. |
| R28 | P3 | Accessibilitat/Producte | Una publicació es pot escoltar i el mode de contrast es prova amb teclat sense perdre llegibilitat. |
| R29 | P3 | Lector/Coneixement | Una font de butlletí conserva procedència i data; ingestió, síntesi i revisió queden diferenciades. |
| R30 | P3 | Observabilitat | Una comprovació expirada deixa de ser verda i un canvi repetit no genera alertes duplicades. |
| R31 | P1 | Orquestració/MCR | Cada requisit té aplicabilitat, responsable, estat, evidència, data i deute pendent; les fonts de referència no es confonen amb comprovacions executades. |

## Deute que ha de quedar visible en el següent pla

- **D01 — Lectura pendent:** 1.164 textos, una auditoria parcial i l’HTML envoltant d’un article. Responsable proposat: arxivística assistida. Acceptació: cada fitxer passa a llegit/duplicat verificat/exclòs motivat amb registre; no es compten títols ni hashes com a lectura.
- **D02 — Binaris:** 271 fitxers/recursos no llegits. Responsable proposat: revisió documental i visual. Acceptació: cada família té extracció/renderització adequada, límits declarats i inventari de pàgines/imatges realment examinades.
- **D03 — Codi divergent:** 58 parelles de mateix nom i hash diferent. Responsable proposat: manteniment del mòdul viu. Acceptació: diff semàntic amb decisió adoptat parcialment/superat/útil pendent; mai executar ni aplicar el patch antic per defecte.
- **D04 — Memòria única:** roadmap canònic buit en quatre seccions i text públic amb estats històrics. Responsable proposat: Producte + Wiki. Acceptació: cada idea recuperada té origen, destí, estat acreditat i decisió, incloses les retirades.
- **D05 — Certificació:** esta aportació no executa tests, navegació ni desplegaments. Responsable proposat: front principal de verificació. Acceptació: cada afirmació de conducta remet a una prova actual executada, sense heretar el «Fet» d’una nota antiga.

L’objectiu original de rescat exhaustiu continua obert. Este lliurament tanca el cens i el lot semàntic declarat; preserva la resta com a treball real pendent.

## Mapa de rutes vives abreujades

- `destinsControl.js` → `src/sections/control/destinsControl.js`.
- `SnippetCurador.jsx` → `src/sections/notes/SnippetCurador.jsx`.
- `modeDesa.js` → `src/sections/notes/modeDesa.js`.
- `contingutExtern.js` → `src/sections/connectar/contingutExtern.js`.
- `AppGridShell.jsx` i `AppGridColumn.jsx` → `src/components/layout/`.
- `UniversalCard.accio.test.jsx` → `src/components/PedraSeca/organismes/UniversalCard.accio.test.jsx`.
- `SegonFactor.jsx`, `FacetaTaxonomia.jsx` i `FacetaEstil.jsx` → `src/sections/admin/`.
- `mapaContent.js` i les sis vistes del mapa → `src/sections/consola/mapa/`.
- `consolaContent.js` i `consolaPagines.js` → `src/sections/consola/`.
- `recullConsola()` → `tooling/vite/consola-iaia.mjs`.
- `comptaArtefactes()` → `tooling/brain/termometre_context.mjs`.
- `formularisFinestreta.js` i `validadorsIdentitat.js` → `src/sections/gestoria/finestreta/nucli/`.
- `registreApps.js` i API de plataforma → `src/apps/plataforma/`.

Les rutes i els hashes del cens són evidència de la instantània. S’ha verificat la suma de tots els estats (1.497), la llista de 51 lectures directes i la cua de 1.166 entrades; esta comprovació documental no és un test del producte.


Còpia durable dels JSON, CSV i TXT d’evidència: `261016_1632_auditoria_codex_evidencies/rescat/`; tots ancorats a l’índex. El relat íntegre queda incorporat ací i no es duplica en un altre Markdown.


### Coordinació i relleus conservats

### Relleu 1 · Auditoria en curs · 2026-10-16 16:34 Europe/Madrid

**Claude: Codex executa la CI global (maxWorkers=2) i audita; cap fitxer de producte modificat.** Les observacions inicials no són un dictamen final.

- Onada 1.4: `DialegEmoticona.jsx:19` encara demana la drecera del sistema operatiu; `NotesSection.jsx:634–660` no exposa el catàleg XL a NOTES.
- Onada 1.5: `NotesEditor.jsx:385–391,511` conserva `PublicacionsDeLActor`; no s'ha localitzat «Edició avançada».
- Lector: `AppLector.jsx:91–115,189–199` depén de font injectada o llavor explícita; sense connector real, queda buit. Connectar fonts no equival a tindre URLs guardades.
- Rescat: 418 són entrades del primer nivell d'històric, però 720 fitxers recursius; producció 297, laboratori 480, total 1.497. Inventari i contrast en curs, sense moure originals.
- Estrés local en curs amb xarxa bloquejada: no acreditarà capacitat real de Supabase/Sollutia.

S'integraran la MCR completa, reproduccions i deute amb responsable. Cap aprovació global.

### Relleu 2 · Bloquejos reproduïts per a l'executor · 2026-10-16 16:36 Europe/Madrid

- **P1 SEO públic:** GET amb `facebookexternalhit/1.1`: `https://socdepoble.org/` retorna HTTP 200, 7.009 B, zero OG; `https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png` retorna el mateix HTML (mateix SHA-256), no PNG. `https://gentdelatorre.net/` té títol però ni `og:image` ni `og:description`. Requereix resoldre desplegament/hosting i SEO de l'amfitrió abans del compartit. No es declara prova real de WhatsApp.
- **P2 plantilla que no desapareix:** `useUniversalRichText.js:70` compara `getHTML() === seedContent`. TipTap normalitza els salts: llavor 335 caràcters, HTML 328; comparació falsa. Afegir prova amb TipTap real i normalització, sense esborrar mai contingut real.
- **P2 telemetria amb identificador:** `rutaTapada('/javillinares')` envia `/javillinares` íntegre; `seccioActual()` també el pot enviar com dada. Contradiu la promesa sense identificadors de persona. Proposta: taxonomia de rutes conegudes i categoria `/perfil/*` per perfils/altres rutes, tant visita com esdeveniment.
- **P2 legal:** apartat 19 continua absolut, sense explicar WordPress/analítica pròpia.
- **Multimèdia:** llavor 26 recursos/26 URLs úniques, no 100–200; clic a `MultimediaSection.jsx:57` navega al detall. No s'ha localitzat visor natiu ni mapa amb agrupació GPS.
- **Node CI:** 947 passades, 0 fallades, 1 omitida i 3 TODO diagnòstics; Vitest encara en curs. Els TODO amb asserció fallida no són un codi de CI roig.
- **Estrés:** 8/8, 40.000 fluxos en 2.952,64 ms, p95 2.902,09 ms; heap pic 880,26 MiB, després GC 52,29 MiB; zero errors/pendents/xarxa. És transport simulat en un event loop, no usuaris reals.

### Relleu 3 · Navegador local i CI · 2026-10-16 16:38 Europe/Madrid

- Navegador real `http://localhost:3340/mercat`: targeta `mac-mini-m4` amb Javi Llinares, poble i retrat `/assets/fotos/javi-llinares-perfil-1200px.jpg`; verificació DOM i captura visual.
- `/notes`: diàleg «Emoticona del document» confirmat amb text de drecera OS; cap graella XL. Barra amb capçalera i controls dispersos encara visibles.
- `/multimedia`: TOTS (26); Benifallim navega a `/multimedia/town-benifallim`, conserva eixa ruta i mostra metadades genèriques «Element / town-benifallim»; no hi ha redirecció canònica ni visor modal.
- `/xat`: els quatre actors presents; IAIA s'obri amb compositor i missatge inicial. Açò és el mode local/llavor visible, no equivalència de Supabase local amb producció. GET `/auth/v1/health` al port 54321 retorna resposta buida (curl 52, HTTP 000), sense credencials.
- CI en curs: `HistoricCofre.seguretat.test.jsx` ha esgotat 5.000 ms. Reexecució aïllada en marxa junt amb les dues proves base reclamades. No s'atribueix encara a bug funcional.

### Relleu 4 · CI focal roja · 2026-10-16 16:39 Europe/Madrid

`paginaDeText.test.js` i `PublicacioDetall.imatgesPropies.test.jsx` passen: **48/48** en la repetició focal. La prova que ara falla és `src/sections/gestoria/historic/HistoricCofre.seguretat.test.jsx:115`, timeout de 5.000 ms, reproduït dues vegades: CI global 5.025 ms i focal 6.599 ms. Cap asserció de fuga demostrada: és un timeout. No augmente el llindar per donar verd artificial. Cal perfilar el recorregut (desxifrat, import/export XLSX, autobloqueig) i distingir lentitud de penjada abans de tocar la prova. Registre focal `/tmp/gauntlet-codex-focals-ci.log`.

### Relleu 5 · Contrast adversarial de la direcció · 2026-10-16 16:44 Europe/Madrid

Gemini: rebut el relleu 1. Els segells globals de Quadrat/EXIF, xat i autohide excedeixen l'evidència: 202 rasters inventariats, 173 JPEG i només 2 WebP; 95 extensions PNG són JPEG; el fallback de pujada encara genera JPEG. Autohide usa `top`, té llindar de 24 px a la pujada i no hi ha mesura de CLS. El navegador mostra encara la fila directa sintètica Sóc junt a Comunitat. Mantinc aquests requisits globals `[PARCIAL]`. La simulació de 40.000 fluxos no és càrrega real del backend i el timeout del cofre s'ha reproduït dues vegades, encara sense prova que siga intermitent.

El pla/prompt canònics han incorporat en calent capçaleres de xat navegables, separació `/iaia`–`/anima` i accés local sense dependència de Supabase; s'auditen i s'incorporaran a la MCR/trasllat. La política SQL està preparada, no aplicada; no s'ha acreditat que falten credencials humanes, només que aquesta auditoria no ha operat producció. No cal atribuir automàticament cada pendent al Mestre.

Per a Claude: normalitzar la llavor TipTap ha de comparar la representació canònica del document; una regex de blancs pot conservar espais entre etiquetes que l'editor elimina. La reproducció real ha de passar abans de segellar. No identificar automàticament un anònim remot com a Javi: el pilot només correspon al mode local explícit.

### Relleu 6 · Causa acotada del timeout del cofre · 2026-10-16 16:46 Europe/Madrid

Un únic diagnòstic amb instrumentació Vite en memòria (cap fitxer de producció ni prova oficial canviat) completa totes les assercions en **5.160 ms**, amb pressupost diagnòstic de 30 s. La prova oficial continua roja a 5.000 ms. Fites des de test-start: cofre creat 26 ms; render 111; obert 397; CSV 595; mostrar xifres 1.748; afegir regla 4.402; regla desada 4.449; preparar llibre 4.966; diàleg 5.043; autobloqueig 5.111; reobrir 5.144; final 5.160. Dominen afegir regla (~2.654 ms) i mostrar xifres (~904 ms), no PBKDF2/desxifrat. Imports 31,78 s són fora del pressupost del test. No és prova de fuga ni de deadlock; sí prova que el recorregut complet excedeix el pressupost en aquest entorn compartit. Claude: perfilar eixes interaccions i establir criteri de latència sostenible abans de canviar el pressupost. Registre `/tmp/sdp-cofre-diagnosi/run-in-memory.log`; hash del test original intacte.

### Relleu 7 · Refutacions de proposta i traçabilitat · 2026-10-16 16:55 Europe/Madrid

- Gemini: la regex `replace(/\s+/g, ' ').trim()` no arregla la plantilla TipTap: conserva set espais entre blocs i la comparació continua falsa. El mateix esquema TipTap normalitza HTML/JSON correctament. Reproducció a `frontend/results.json`; cal provar també que no s’esborre text real.
- Les nou reserves d’`assetResolver.js` tenen prefix `/assets/img/` incorrecte, però no es diuen `nano_banner_*`; els noms reals figuren a la fila I34. Els nou pobles visibles actuals tenen fitxers vàlids: el defecte és latent en activar reserva.
- Cronologia buida: `loadMultimedia` només demana `mediaItems`, sense derivar grups; el Context no els elimina. Reparar només `mediaContent.js` no cobreix el mode remot. Fila I35.
- Habitatge i Treball ja tenen còpia pública, hash idèntic i referències. No són il·lustracions inèdites. Comunitat/Eficiència no s’han localitzat en les rutes afirmades; primer cal evidència, no ordres de copiar fitxers suposats.
- Revisió independent del relleu: igualtat exacta dels IDs oberts, F57–F66 presents. S’han corregit els orígens F23–F25 després de la renumeració, s’han fet les probes transportables i s’ha preservat l’evidència textual durable. Documents i dades de suport ancorats.

### Relleu 8 · Governança i reproduccions transportables · 2026-10-16 16:59 Europe/Madrid

Tancament després d’omplir l’acta i registrar ESTAT/LEDGER: `valid:false`, estat `planned`,457 incidències:455 del graf global i2 de skills/manifest. Olivera, plantilles, autoritat, LEDGER i Wiki passen; segell, catàleg de skills i SCC fallen. Cap error fa referència als documents/evidència propis. El segell compara tres diferències preexistents: `00_INDEX_SKILLS.md`, nova `core-gauntlet-loop/SKILL.md` i `core-temps-termodinamic/SKILL.md`; no s’han resegellat.

El LEDGER previ coincidia amb HEAD però tenia hash divergent. L’entrada nova conserva íntegrament el cos i explicita hash declarat/calculat anterior; la nova signatura acredita bytes, no avala afirmacions antigues. La porta de signatura ara passa. Cap modificació de regles ni de manifest.

Les dues probes lliurades admeten arrel de projecte i directori d’eixida; creen l’eixida si falta. Reexecució de portabilitat en una carpeta temporal nova: exit0 totes dues, mateixos defectes reproduïts i zero fetch en l’entrada local. Exemple des de l’arrel: `node _wiki_de_poble/04_escriptori/261016_1632_auditoria_codex_evidencies/frontend/new-requirements.mjs "$PWD" /tmp/gauntlet-recheck`. No cal conservar l’antic /tmp.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tall final de proves: 2026-10-16 17:01 Europe/Madrid. HEAD inicial `7a1828ca779ef74284846c9e5a4122cd23945689`; **2745/2745 hashes de font inicials continuen iguals**. No hi ha canvis de producte de Codex. Les versions del pla/prompt i dels informes creuats queden a `entrades.json`.

| Comprovació | Resultat d’aquesta tanda | Abast i rebut |
|---|---|---|
| `npm run test:ci` | **exit1 · Node0 / Vitest1** | Etapes reals finals; les línies de CI dins dels tests del runner són fixtures i no el resultat final. `ci-global.log` |
| Node primary | 951 totals:947 passen,0 fallen,1 skip,3 TODO | Els tres TODO amb diagnòstic d’asserció no fan fallar Node. El corredor primary no equival a totes les suites de laboratori/sessió. |
| Vitest complet del corredor | 1061 fitxers passen,1 falla,6 omesos;18385 proves passen,1 falla,89 omeses | 1758,98s. Únic error: `HistoricCofre.seguretat.test.jsx:115`, timeout5000ms. |
| Regressions base reclamades | `paginaDeText` + `PublicacioDetall.imatgesPropies`:48/48 | Focal junt amb cofre, exit1 pel cofre; `ci-focal.log`. |
| Frontend/perfil/cicle de vida | 10 fitxers,155 proves passades | 100 cicles amb zero recursos instrumentats residuals; `frontend/verification.json`. |
| Estrés local | 8/8; nivells1000/5000/10000/40000 | Xarxa bloquejada.40k en2952,64ms, p952902,09ms, heap pic880,26MiB i desprésGC52,29MiB. `estres.json`. |
| WebP | 10/10 | Mostres sintètiques, formats/EXIF/pressupost/errors; `webp.json`. No migració massiva. |
| WordPress | 18/18 | Node, literal de fallback i inspecció de font. No FCP/CLS remot. |
| Frontissa / RLS | exit0 / exit0 sobre45SQL | Frontissa sense xarxa; RLS és anàlisi mecànica de SQL, no aplicació/consulta de BD. |
| Diagnòstic del cofre | Assertions completes en5160,12ms amb pressupost diagnòstic30s | Test oficial no modificat; hash intacte. No substitueix la fallada real a5000ms. `cofre-temps.json`. |
| Probes transportables | exit0 totes dues, defectes reproduïts | TipTap/telemetria i xat/accés local amb dades fabricades; zero HTTP real. Root i output parametritzables. |
| Documents propis | auditoria, pla i acta validen | `document.mjs check`, seccions i metadades completes. |
| Porta Olivera | exit0 | Safata buida, documents vius i suport ancorats. Sediment de l’índex advertit, no arxivat per Codex. |
| Tancament mecànic | **valid:false · planned · 457 incidències** | 455 del graf global i2 de skills/manifest. Olivera/plantilles/autoritat/ledger/wiki passen; segell/skills/SCC fallen. Cap error dels fitxers propis. `tancament.json`. |

Les bateries se solapen: **no se sumen** per fabricar un total. Tampoc se sumen els resultats declarats per Claude/Gemini sense comprovació pròpia. Aquesta auditoria no acredita estabilitat universal, capacitat real de40000 usuaris ni absència de fuites prolongades.

Documents actius del primer nivell llegits: índex, estudi de destil131600, pla i prompt1530 (incloses ampliacions de xat/accés), auditoria Claude1631, Gemini1633 i els tres lliurables Codex. A l’últim contrast Claude continua plantilla; Gemini conserva el relleu2. Les discrepàncies i la contraprova de la regex estan escrites als relleus. No es declara consens ni correcció aplicada sense evidència.

Recursos propis: CI i focals acabats; tres subauditors acabats; pestanya de navegador temporal tancada. Cap cron creat per Codex. Les quatre automatitzacions de projecte inspeccionades continuen PAUSED. Cap procés alié aturat, cap desplegament ni migració remota. Els diagnòstics de `/tmp` tenen rebuts durables ancorats a l’Escriptori.

La signatura del LEDGER anterior era divergent però coincidia byte a byte amb HEAD; el relleu preserva tot el cos, registra els dos hashes i signa el nou contingut. No s’han resegellat les tres diferències de skills ni modificat el catàleg per fer passar la porta. La porta continua roja i el deute queda traslladat a G12.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Codi i documents compartits amb altres IAs. Els hashes i rebuts acoten el tall; una modificació posterior necessita reauditoria. Cap canvi de producció, desplegament, migració remota, missatge extern ni càrrega contra serveis reals per Codex. Original de l’usuari ja present al prompt canònic; originals històrics intactes.

La lectura mecànica de fitxers no és comprensió: l’annex declara el lot llegit, equivalents, extraccions, binaris i exclusions. Les idees antigues són dades històriques, mai ordres noves; no s’adopten promeses de costos, models, fiscalitat ni cobertura de tercers sense validació.

Dos intents de diagnòstic extern del cofre fallaren abans d’executar tests per resolució Vite; s’aplicà Fusible i una via diferent d’instrumentació en memòria funcionà. Una sonda SSR d’autoria fallà per entorn DOM/WS i no acredita cap bug. Cua de treball i limitacions es preserven al pla; no s’han relaxat llindars oficials per obtenir verd.

Cap cron creat per Codex; la neteja de sessions pròpies i el tancament documental consten a Verificació. No s’han interromput recursos aliens.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261016_1530_pla_implementacio_gauntlet_autonom]]
- [[261016_1530_prompt_gauntlet_claude_codex_gemini]]
- [[261016_1639_pla_implementacio_relleu_codex_gauntlet]]
- [[261016_1645_acta_marmota_codex_gauntlet_diurn]]
- [MCR estructurada](261016_1632_auditoria_codex_evidencies/mcr.json)
- [Trasllat estructurat](261016_1632_auditoria_codex_evidencies/trasllat.json)
- [Cens de rescat](261016_1632_auditoria_codex_evidencies/rescat/inventari.csv)
- [Cua de lectura pendent](261016_1632_auditoria_codex_evidencies/rescat/cua_lectura_pendent.csv)
- [Cens raster](261016_1632_auditoria_codex_evidencies/assets.json)

