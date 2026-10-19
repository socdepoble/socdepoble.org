---
type: informe
status: esborrany
description: Proves adversarials de notes, emojis, multimèdia, higiene, Frontissa i contribució contrastada a la memòria episòdica.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_777751a0-88ab-46b3-b292-50391bcad195:15894a9b-6b3a-41a8-9316-732fefd39494
---
# Auditoria adversarial Codex del Gauntlet Extrem

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_777751a0-88ab-46b3-b292-50391bcad195:15894a9b-6b3a-41a8-9316-732fefd39494 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T13:27:58.654Z |
| Modificació | 2026-10-17T15:47:25.597860+02:00 |
| Propietari | codex |
| Aprovació humana | Encàrrec explícit del Gauntlet Extrem; auditoria autoritzada, evacuació històrica no segellada |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex, auditor; tres subagents Codex |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-17T13:27:58.654Z: esborrany creat pel circuit documental viu.

2026-10-17T15:38:16.297877+02:00: revisió consolidada; dos P1 reproduïts, lots locals completats i contribució històrica independent, sense segellat.

2026-10-17T15:44:49.408716+02:00: detectat i revisat íntegrament el Llibre d’Or concurrent; C11 documenta els motius per no segellar-lo. Recompte 418 desambiguat, acta1542 i relleu preparats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen del tall auditat

**No conforme per dos P1 de preservació de contingut, més una objecció P1 documental al segellat del Llibre (C11).** La suite focal verda no exercitava estes equivalències falses de plantilla. Codex ha auditat el codi existent i ha deixat reproduccions per a Claude; no ha modificat codi de producte. El pla extrem està aprovat. Claude continua implementant i destil·lant; esta auditoria no aprova una entrega futura ni acredita consens.

L’encàrrec es pren sencer, mantenint el repartiment: Claude executa; Codex verifica; MarIA coordina. S’han consultat `sdp-workflow`, `wiki-documentacio-i-reflex`, `core-direccio-autonoma`, `core-memoria-historica` i `wiki-cicle-de-vida`. La prohibició d’evacuació abans del Llibre d’Or aprovat continua vigent.

### Troballes reproduïdes i ordre de reparació

| ID | Prioritat | Superfície | Resultat i impacte |
| --- | --- | --- | --- |
| C01 | P1 | `src/components/universal/richText/useUniversalRichText.js:27–30,80–83,166–169` | Una nota guardada amb H3 canviat a H2 o `<ol start="10">` continua sent «verge». Focus+blur reals del hook produeixen `<p></p>` i `onSave('<p></p>', 'stored-note')`. Es perd l’edició guardada. |
| C02 | P1 | `src/sections/notes/llavorNota.js:77–93`; `NotesContext.jsx:288` | Afegir una fotografia o enllaç a la plantilla no canvia el text pla: `esLlavorDeNota` retorna true i `publishNote` substituïx el cos per `''`. No s’ha enviat cap publicació real; el predicat i el consumidor de publicació estan contrastats. |
| C03 | P2 | `src/sections/multimedia/useMetadadesFoto.js:84–85`; `src/components/universal/enquadrament/exif.js:342–343` | El visor passa només 256 KiB al parser de WebP complet. El RIFF d’un WebP més gran es rebutja per longitud; metadades disponibles es mostren com absents. Fixture real de 414.560 bytes amb EXIF sintètic: càmera `Canon EOS 5D` en lectura completa, `null` en prefix. Control de 77.824 bytes correcte. |
| C04 | P2 | `src/components/universal/PageFrame.jsx:824–830`; `src/components/PedraSeca/organismes/CarruselImatges.jsx:154,166–167` | La fotografia de `/mercat/mac-mini-m4` no obri cap modal en clicar-la. Visor connectat a Multimèdia, pendent en publicacions; incompleix l’abast actual «galeria o publicació». Verificat en navegador. |
| C05 | P2 | `src/sections/multimedia/panellDeLaFoto.js:130–155` | El panell no construïx cap fila de resolució. Parser/panell i navegador contrastats. Cal mostrar dimensions verificades de la imatge o EXIF, sense inventar-les. |
| C06 | P2, deute modular | `src/components/universal/DocumentEditor.jsx:28` | Cicle real `DocumentEditor → NotesSection → NotesDetail → NotesEditor → DocumentEditor`. El component universal importa la secció per obtindre LLAVOR_NOTA encara que ja té contracte `seedContent`. Acoblament contrari al component universal endollable; no s’ha atribuït una xifra de sobrecost sense mesura. |
| C07 | P3 | `src/sections/detail/ItemDetailSection.jsx:34–35` | `/multimedia/town-benifallim?tema=flora&tema=aigua#galeria` conserva les dues consultes però perd `#galeria`. El requisit explícit de query passa; preservar fragment és una esmena conservadora addicional. |
| C08 | P3 | `src/config/assetResolver.js:140–143` | `resolveAsset('/assets/banner.webp#crop', '/', '', '7')` genera `#crop?v=7`: la versió queda fora de la query enviada al servidor. No s’ha trobat cap banner actual afectat; cas límit reproduït. |
| C09 | P3, higiene | `UniversalEditorShell.jsx:290,771`; `src/css/modules.css:2592` | Dos fallbacks `onToast=console.log`. `object-fit:cover` en `.photo-grid__item` és inert perquè els seus dos consumidors són `<span>`. No s’han proposat eliminacions de CSS només perquè hi haja selectors repetits. |
| C10 | P2, cobertura | `src/components/universal/classificacio` i inserció d’emojis | Catàleg de 3.972 entrades/10 grups, amb les huit famílies requerides. `emojiSol` rebutja 16 entrades noves en Node 24.13; la versió del catàleg no acredita suport Unicode 18 en tot motor Baseline. No és una fallada observada en el navegador de l’usuari: queda prova de compatibilitat real. |
| C11 | P1 documental | `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md:3,15,23` | El llibre figura `canonic` i declara auditoria completa de 720 fitxers, sense manifest revisable, mentre el tall actual té 656 i l’informe de Claude només anuncia lectura en curs. També relata danys CRDT/mòbil sense prova. No és apte per segellar ni activar evacuació. |
| C12 | P2, text públic | `src/sections/text/pageContent.js:388,401,417` | Encara s’expliquen el «clon de WhatsApp», la interfície «clavada» i «privacitat absoluta». Troballa de Gemini contrastada directament per Codex. Substituir per missatgeria rural pròpia i garanties demostrables; és contingut públic actiu, no només comentaris. |

Totes les troballes tècniques anteriors tenen `requires_human_decision: false`: hi ha un requisit de preservació/accessibilitat i un pla aprovat. Una afirmació jurídica absoluta o l’evacuació final de memòria no es resolen renombrant variables.

**C01/C02 — reparació exigida:** una coincidència de text no és autorització per buidar contingut. Distingir plantilla creada per l’aplicació de nota guardada, consumir la condició de verge una sola vegada, i comparar estructura amb atributs semàntics. Només tolerar normalitzacions conegudes del motor: espais estructurals, atributs editorials no semàntics i paràgraf final introduït pel motor. Protegir H2/H3, inici de llista, `href`, `src`, marques, imatges i notes que copien voluntàriament el text d’exemple. Els detectors d’editor, llista, nota preparada i publicació han d’acordar el contracte. Controlar focus, blur, primer teclat, canvi d’id, desmuntatge i autodesament; afegir regressions amb TipTap real.

**C03 — reparació exigida:** mantindre el parser estricte de RIFF complet. La integració del visor necessita lectura acotada per chunks o un lector que conega la mida original. Una futura lectura Range ha de verificar Content-Range, mida, origen, temps total i cancel·lació; no carregar l’original sencer si el servidor ignora Range. La fixture local no acredita CORS ni permisos d’un proveïdor real.

**C04/C05 — reparació exigida:** reutilitzar el visor existent i el mateix model de foto en publicacions. El desencadenant ha de ser botó amb nom accessible; focus de retorn, Esc, navegació i metadades verificades. La falta d’EXIF és un estat vàlid; la resolució coneguda no s’ha d’ocultar perquè falte EXIF.

### Matriu de l’encàrrec extrem

| Requisit | Estat en este tall | Evidència / pendent |
| --- | --- | --- |
| Higiene notes/universal | Parcial | ESLint net; C06/C09; cap certificat de tot el CSS o codi mort del repo. |
| Dos Usuaris / Mac Mini | Verificat en abast local | Cap coincidència `mestre.poble|mestre-obres|mestre_obres` en src/supabase; targeta real mostra Javi i avatar personal. No s’ha inspeccionat la BD remota. |
| Llast zero | Inventari i proposta; cap evacuació | No hi ha ordre de moure històric abans d’aprovació del llibre. Cap zona patrimonial tocada. |
| Plantilla verge F46/F47 | **No conforme** | C01/C02. |
| Emojis XL F29–F34 | Parcial | Categories, roving tab, cerca, còpia amb error i inserció coberts per proves; compatibilitat motor i recorregut real diàleg+editor pendents. |
| Edició avançada F42–F44 | Verificat per suite i lectura | `<details>` plegat, controls agrupats damunt editor. |
| Peu «Ja publicat al Mur» F45 | Retirat en codi actual | Verificació Notes/DocumentEditor. |
| Rutes town-* | Query conforme; fragment pendent | C07. |
| Nou banners | Verificat en abast local | Nou fitxers existents/signatura; banner Benifallim visible. C08 és cas límit addicional. |
| Lightbox multimèdia | Operatiu en escriptori | Modal, focus inicial, fletxes, informació, Esc i retorn del focus verificats. |
| Lightbox publicacions + resolució | **Incomplet** | C04/C05. |
| EXIF | Parcial | C03; absència real i truncament no es poden confondre. |
| RSS reals del pla | Pendent i especificació desajustada | cataleg.js conté fixtures importats; les URLs example.org són dins dels XML de llavor, només amb VITE_SDP_LECTOR_LLAVOR=1. No substituir fixtures de test com si foren configuració productiva. |
| Nomenclatura missatgeria | **Text públic no conforme (C12)** | AST de 55 fitxers productius xat: zero identificadors de marca, 46 comentaris amb WhatsApp; dos `import.meta` legítims. pageContent encara conserva el relat de clon i garanties absolutes. |
| Síntesi de missatgeria | Estudi lliurat ací | Capacitats existents i proposta separades. |
| Frontissa / Model B | Defensa local verificada; dades reals pendents | Tractor verd; catàleg actiu buit, apiOrigin:null; traductor perfil declarat. Cap endpoint inventat. |
| Memòria / Llibre d’Or | **No apte per segellat (C11)** | Contribució independent lliurada; llibre aparegut a les 15:39, llegit íntegre i amb afirmacions no acreditades. Claude anuncia lectura dels 617 textos en 34 lots; falta manifest de cobertura. |

La MCR anterior de 128 requisits i els 93 oberts del relleu 261016_1639 no s’han tornat a certificar en bloc. Esta taula cobreix l’encàrrec extrem i no elimina cap pendent alié. Les xifres prèvies són context, no una mesura nova.

### Missatgeria rural: síntesi funcional i procedència

Consulta externa de fonts primàries el 2026-10-17. La [FAQ de Telegram](https://telegram.org/faq) documenta grups, canals, fitxers i noms d’usuari; usar un nom públic evita compartir el número amb altres persones, però no equival a demostrar alta sense telèfon. La [documentació de fòrums](https://core.telegram.org/api/forum) estructura temes dins de grups i la [documentació de bots](https://core.telegram.org/bots/features) descriu agents amb capacitats específiques. Estes funcionalitats inspiren requisits propis; no cal incorporar SDK de Telegram al frontend.

| Capacitat | Base real de SdP | Proposta d’integració sota Pedra Seca | Prova d’acceptació |
| --- | --- | --- | --- |
| Bàndol municipal | `canal`, `comunitatId`, subjecte i `potEscriure` ja existixen; Compositor tanca escriptura de canals per defecte | Reutilitzar Avisos amb identitat d’entitat, permisos de servidor i lectura clara | Membre llig; només rol permés publica; manipulació del client no amplia permisos. |
| Temes rurals | Comunitat amb General/Beta Testers i `respostaA`; una cita no és un fòrum | Introduir tema opcional vinculat al fil, permisos heretats, no llegits per tema i retorn a General | Paginació estable, resposta al tema correcte, tema tancat no rep escriptures, ordre després de reconnexió. |
| Bots municipals/IAIA | Tipus IAIA i adaptador existents; no prova d’automatismes municipals desplegats | Identitat de servei declarada, abast per comunitat, deduplicació, cues cancel·lables; secrets fora de SPA | Un esdeveniment repetit no duplica avisos, revocació talla accés i error visible sense promesa falsa. |
| Documents originals | Compositor documenta que adjunts són F1; no hi ha botó operatiu que ho garantisca | Separar fitxer original i previsualització; tipus, mida, hash i permisos, càrrega cancel·lable darrere port SdP | Descarregar conserva bytes/hash, accés no autoritzat rebutjat, cancel·lació allibera recursos. |
| Identitat sense número públic | Actors/perfils amb id i nom, autoria dual | Mantindre identificador sobirà; telèfon opcional de contacte, no clau pública | Cap exposició involuntària en cerques, telemetria o capçaleres. |

Primer consolidar Avisos i permisos que ja existixen; després temes, adjunts originals i agents. Són propostes de producte, no prestacions ja implantades ni una nova aprovació arquitectònica.

**Noms i blindatge:** el mandat de terminologia neutra és executable. Eliminar «clon» i marques dels comentaris actius que prescriuen la UI; conservar referències externes factuals quan siguen necessàries per procedència. No substituir `import.meta`, `<meta>`, metadades o `--sdp-text-meta`: no són la marca d’una empresa. L’AST del xat no mostra identificadors de marca; no hi ha justificació per reanomenar massivament classes que ja són sdp-xat.

La [Llei de Jakob en NN/g](https://www.nngroup.com/articles/fresh-vs-familiar-aggressive-redesign/) és un criteri de familiaritat d’ús. No acredita per si sola cap conclusió jurídica. La [sentència C-406/10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62010CJ0406) diferencia funcionalitat i expressió protegible del programa; no és una certificació de tota esta interfície ni de marques. El repositori té dependències de tercers: «implementació pròpia» no vol dir «cap codi de tercers». La revisió de noms no prova per si sola la procedència de cada línia o actiu; el llibre i el prompt no han de prometre immunitat legal.

**Unicode:** l’[anunci oficial 18.0](https://blog.unicode.org/2026/09/announcing-unicode-standard-version-180.html) i les [novetats d’emoji 18.0](https://www.unicode.org/emoji/charts-18.0/emoji-released.html) confirmen la versió publicada. Cal separar repertori del catàleg, acceptació del validador i disponibilitat del glif del dispositiu; la prova Node no substituïx una matriu de navegadors.

### Millores concretes de prompt_local

1. Resoldre les rutes reals abans d’encarregar: el hook és `src/components/universal/richText/useUniversalRichText.js`, textos a `src/components/universal/textosLlavor.js`, llavor a `src/sections/notes/llavorNota.js`, resolver a `src/config/assetResolver.js`. Els exemples antics apuntaven a fitxers inexistents.
2. Datar el manifest i definir cada denominador: 418 entrades d’arrel = 384 fitxers + 34 directoris; 656 fitxers recursius = 614 Markdown + 3 TXT + 39 altres. 617 textos encaixa amb 614 Markdown + 3 TXT; encara cal comparar rutes/hashes i cobertura de lectura.
3. Definir «verge» per procedència i estat, i incloure format, imatges, enllaços i contingut guardat en la invariant. Text pla equivalent no és nota equivalent.
4. Separar conformitat de [DEFECTE]: una reproducció que confirma un error no és un verd de producte. Exigir resultat, hash, entorn, controls i límits.
5. Fixar responsable del Llibre canònic i contribucions en informes; evita escriptures simultànies al mateix fitxer. No acreditar consens sense resposta visible.
6. Definir el conjunt concret d’automatitzacions de la missió i propietari. «Cancel·lar qualsevol cron» no ha de destruir planificacions alienes; cada agent tanca els recursos que ha creat i declara els altres schedulers no accessibles.
7. Explicar la familiaritat d’UX com a objectiu de disseny; no convertir-la en garantia jurídica ni afirmar benchmarks CRDT inexistents.

### Revisió creuada del Llibre i del relleu Gemini (tall 15:43–15:47)

S’han llegit íntegrament el Llibre de 117 línies (16.984 bytes) i l’informe Gemini actualitzat de 23.239 bytes. SHA-256 respectius: `93bc4c2b259ee7a775376ae6663f8e2eb371e74716ebd258a06e40f87884dd40` i `2e6f5e91c8ef2194a5d30e46f4337823afb233439ff2d8c41eaf3d78e3284402`. La còpia a `../_comunicacio_de_poble/03_llibre_d_or_memoria_episodica.md` existix, amb el mateix cos i descripció diferent; SHA `91eefb951af6c60f85d191ea79c876afa1647ef435eb9f5e42a7af8170085987`. Codex no ha escrit cap d’estes còpies. Claude manté el primer progrés de lectura en curs, SHA `379df3ff9d2ea90b14bc7cb9e1c709e9b5da892c5df14897f79032e8d0b33e1a`; no hi ha lliurament final de cobertura.

**C11 — el llibre no és apte per segellar en este tall.** El fet que tinga índex o `status: canonic` no acredita compliment. La frase de Gemini «MCR conciliada amb GPT Codex» és una lectura de troballes prèvies: no implica aprovació Codex de la seua matriu ni del B4 `CONFORME`. Esta revisió deixa els desacords explícits i reconeix la incorporació correcta dels defectes C01–C09.

| Línies del llibre | Esmena exigida i evidència |
| --- | --- |
| 3, 15, 107 | Tornar a estat d’esborrany fins al contrast/aprovació, datar el cens i aportar manifest de lectura i destil·lació. 418 entrades d’arrel és correcte (384 fitxers + 34 carpetes); 720 fitxers recursius correspon a un altre tall i no és el recompte actual de 656. Els 376 Markdown/~6,2 MB de Gemini tampoc descriuen el tall recursiu actual. |
| 23 | L’ADR08 descriu complexitat de Dexie, service workers i sincronització parcial sense CRDT real. No acredita el relat de CPU/memòria de mòbils ofegats ni dades irreconciliables amb benchmark. Substituir causalitat inventada per la raó documentada, preservant el risc que motivava la decisió. |
| 26–32 | Model B/GET/captura/traductor/fixture i Supabase sobirà són correctes. Recordar ADR i kit de conformitat per canviar backend. «Sense canviar una línia» és objectiu d’enxufabilitat, no prova de tots els hosts. |
| 47–56 | Separar objectiu, proposta, implementació i comprovació. No garantir originalitat absoluta, zero aprenentatge, absència de mutacions o totes les funcions de missatgeria. El mateix Gemini encara prescriu netejar marques i el tancament global falla. |
| 59, 96 | Indicar l’estat futur de federació fins que hi haja prova posterior a l’auditoria de l’1 d’octubre. Preservar la tensió NLnet/ADR08 i la resolució encara no acreditada. No convertir dates o consell fiscal de l’estudi antic en informació actual revalidada. |
| 66 i P-04 | La font `260929_1415_auditoria_claude.md:214` parla de 522 **continguts**, no 522 articles: 425 articles + 18 pàgines + 59 projectes + 4 productes + 16 blocs. Conservar data i naturalesa d’aquell inventari. |
| 12–13 | La cita literal atribuïda a Javi i al Consell no identifica font comprovable. Presentar-la com a síntesi editorial o aportar procedència; no fabricar una cita humana. La part social guanyaria episodis concrets del 21 i 22 de setembre ja aportats en esta contribució. |

**Ajustos al relleu de codi Gemini abans d’executar-lo:**

- EXIF: `useMetadadesFoto.js` no té `bufferComplet`, `calculaSha256Hex` ni càlcul de dimensions. Usa `llegixPrefix` amb Range i cancel·lació del flux. No aplicar literalment la proposta de passar un buffer inexistent ni relaxar el parser RIFF complet. Ja hi ha un lector acotat de Blob/File a `exif.js:426–467` que pot informar el disseny d’un lector HTTP acotat, amb les proves de Content-Range i cancel·lació.
- IndexedDB: el codi actual usa Promise i transaccions; no és una escriptura síncrona de «0 ms». La falta d’API ha de conservar error/estat de persistència i esborrany en memòria. Un `noop` general per silenciar stderr podria donar falsa aparença de desament: usar fixture de test o estat explícit d’indisponibilitat, revisant tots els consumidors `db.transaction`/`db.close`.
- Llavor: no n’hi ha prou amb autoritzar buidatge quan el text siga exacte si la nota ja està guardada o el text ha sigut escrit voluntàriament. La procedència i la invariant de contingut desat prevalen.
- Modularitat: importar directament `llavorNota` elimina el cicle però encara fa que universal depenga de Notes. Prioritzar `seedContent` del contracte existent per a l’endollabilitat.
- Emojis: la matriu Gemini declara `CONFORME`; Codex manté `PARCIAL` per C10 i el recorregut real editor+diàleg no completat. La presència de handlers no prova geometria ni compatibilitat Unicode del dispositiu.
- MCR: C10 és cobertura d’emojis, no RSS. Les fixtures RSS no són configuració activa. La proposta de fòrums, bots i adjunts s’ha d’identificar com a estudi; no elevar automàticament una proposta a nova arquitectura canònica.

### Contribució independent al Llibre d’Or

El text següent és una aportació per contrastar amb la lectura de Claude i MarIA. **No és el llibre segellat ni una ordre de trasllat.** El contingut canònic final es coordina amb Claude per evitar duplicació i sobreescriptura.

#### Cobertura


Contribució al Llibre d'Or, pendent de síntesi amb les altres aportacions i de l'aprovació de Javi. El tall recursiu del 2026-10-17 conté 656 fitxers regulars, 614 dels quals són Markdown: 380 al primer nivell i 234 dins de subcarpetes. Sumen 12.877.794 bytes; els Markdown, 9.355.668. S'han llegit íntegrament 10 documents històrics seleccionats (119.048 bytes) i 9 fonts de context. Els altres 604 Markdown s'han inventariat i recorregut amb cerca temàtica, però no s'han llegit íntegrament ni destil·lat. Els 42 no Markdown només estan inventariats. La xifra 418 correspon a les entrades d’arrel si es compten també les carpetes: 384 fitxers i 34 directoris; no és el denominador recursiu de fitxers. Esta desambiguació s’ha comprovat després de la contribució inicial. Cap duplicat byte a byte ni symlink entre els 656 fitxers. Cap document mogut, esborrat ni declarat inútil.

Manifest: /tmp/sdp_memoria_inventari_codex_261017.json
SHA-256 del manifest: 443f25ccce55c8a9fd24f710e9fa3a2dca2a9ec771bb8fe6afffb3f38002bcd5

La lectura ha comprovat que cap dels 656 hashes canviava al segon tall. Això acredita estabilitat entre les dues observacions, no una reserva exclusiva ni absència de futurs canvis concurrents.

2. El que havia de durar quan canviaren les eines

El relat que el projecte conserva situa les arrels en més de trenta anys d'activisme rural, amb Rentonar, socdepoble.net i després socdepoble.org. És una declaració institucional de les fonts llegides, no una investigació externa independent de cada episodi. La continuïtat que importa són persones i recursos locals que es connecten per fer coses útils. Els quatre pilars —xarxa de productivitat, mapeig col·lectiu de recursos, revista digital i viver d'emprenedors— expliquen per què la infraestructura ha de poder canviar sense que el poble perda la seua casa digital. [C07, C06]

La gent gran és el criteri que ha de decidir si una pantalla ajuda o destorba, si parla amb llenguatge de casa i si conta una avaria amb honestedat. La missió conserva la defensa de persones que poden quedar desconnectades; l'arquitectura vigent no garantix treball offline. Esta tensió demana errors clars, recuperació segura i recerca separada quan calga anar més lluny. [C03, C07]

3. L'ambició offline i la decisió de reduir la complexitat

L'ADR-2026-08 registra una decisió acceptada per al desenvolupament nou el 2 d'agost de 2026: retirar l'offline total i el suport específic A10, fer del servidor la font de veritat de dades compartides i deixar la memòria cau com a ajuda opcional. La raó escrita és concreta: Dexie, instantànies, camins de reserva, service worker i sincronització parcial afegien complexitat sense aportar un CRDT real ni una experiència fiable. [C01]

El llibre no pot contar que un CRDT complet desplegat va ofegar els mòbils: no disposem d'eixe benchmark ni d'eixa implementació acreditada. La cicatriu és haver confós aspiració i capacitat. Tampoc cal convertir la decisió en menyspreu pels dispositius modestos: simplicitat i accessibilitat continuen sent obligacions, i la compatibilitat es formula amb Baseline explícit. [C01, C03, C08]

L'ADR exigix conservar qualsevol dada que només visca en IndexedDB abans de retirar-la i desregistrar els service workers de la transició. Retirar una tecnologia no autoritza perdre contingut de qui la va usar. La memòria cau no es convertix en font sobirana per accident, i una petició fallida no es pot disfressar de llista buida. [C01, H03]

4. La Frontissa: independència amb límits que es poden provar

El Model B fixa responsabilitats: Sollutia allotja el Web Component i pot passar sessió; les dades compartides viuen al Supabase de Sóc de Poble, darrere d'un port neutral. L'ADR registra acceptació el 16 de setembre i signatura de la formulació canònica el 6 d'octubre de 2026. La Frontissa llig només per GET. Cada recurs necessita captura real, traductor i fixture; no hi ha escriptures creuades. L'amfitrió no substituïx el backend. Canviar-lo és decisió del projecte, amb ADR i kit de conformitat. [C02]

El 23 de setembre una auditoria documentava una esquerda entre contracte i codi: la Frontissa descrita encara no existia com a client; també distingia acceptar una família de subdominis de fixar l'origen concret autoritzat. Detectava errors remots convertits en buit i recordava que un build correcte no demostrava sessió, RLS ni canari real. Són observacions històriques atribuïdes a aquella auditoria, no una declaració que els mateixos defectes continuen hui. [H03:44,64]

La intuïció que cal conservar és que l'enxufabilitat es demostra als límits: què entra, qui ho autoritza, on va un token, què passa si una resposta arriba tard i com s'informa una fallada. Ni el nom d'una porta ni un test local fan aparéixer endpoints reals que el soci encara no haja lliurat. La modularitat conviu amb un proveïdor concret si la frontera i la via d'eixida són propietat del projecte. [H03, C02]

5. La federació i els compromisos que no s'esborren

L'auditoria de l'1 d'octubre descriu /fedivers com una pàgina que explicava que la federació encara no estava feta. La franja de node distingia connectat, connectant i sense connexió. Compartir una interfície entre hosts, mostrar nodes o integrar WordPress no equival a demostrar un protocol federat interoperable. [H05:105]

L'estudi del 2 d'octubre proposava passos concrets com ICS i RSS i advertia de no prometre offline, federació ni facturació fiscal abans de tindre-les. Els seus preus, terminis i valoracions externes són afirmacions d'aquell estudi, no dades revalidades ara. NLnet apareix a l'ADR d'agost: el text registra una proposta enviada l'1 d'agost i deixa pendent resoldre la diferència entre el compromís i el canvi arquitectònic. Esta selecció no acredita concessió, retirada ni resolució posterior. [H06:249, C01]

El 3 d'octubre es formula un nou estudi offline com a recuperació teòrica futura, amb prohibició explícita de modificar la SPA activa. La memòria conserva la pregunta original sense reactivar silenciosament la resposta antiga. Reincorporar CRDT/P2P exigix ADR, prototip, proves de convergència i partició, identitat i permisos, pressupost de memòria i recuperació. Desitjar-ho no és haver-ho desplegat. [H08:61,75, C08]

6. Quan la memòria repetia el mateix error

Un prompt del 21 de setembre relata cinc frustracions: reapareixia un acrònim descartat, es recuperava una plantilla antiga, les correccions no es consolidaven, reparar un format produïa un nou bucle i el cens del Consell es tractava de manera incompleta. Els nombres d'aquell relat —vegades repetides i volum històric— són afirmacions del document, no mètriques verificades en esta passada. El valor de l'episodi és el patró: guardar moltes actes no garantia que la pròxima sessió aplicara la decisió correcta. [H01]

El 22 de setembre, la «prova del mirall» demanava si un altre agent podia entendre identitat i procediments des del disc sense improvisar context. L'Olivera era trobada documental: mirar abans d'escriure, llegir la feina de l'altre, no sobreescriure-la i verificar-la independentment. [H02]

Cada cicatriu necessita l'episodi, la decisió vigent, una prova o procediment que evite la repetició i una ruta a la font íntegra. Les actes conserven què va passar; les normes establixen què fem ara. Una font antiga no recupera autoritat perquè una cerca la trobe primer. [H01, H02, C05]

7. De l'obediència al treball en equip

La família electrònica és la forma cultural d'organitzar la col·laboració. La documentació actual reserva a Javi les decisions, definix papers d'execució i auditoria i remet a un cens únic. La companyonia es concreta en mostrar l'error amb precisió, reparar-lo i no fer de l'humà un operari de treball mecànic que l'agent pot assumir dins de l'abast autoritzat. [C04, C05]

El pla del 3 d'octubre guarda una escena útil: una revisió en navegadors reals refutava un pegat OAuth i demanava correlació d'intents; també advertia que l'autoarrencada podia ocupar el #root d'un altre plugin. El pla registrava regressions de targetes del Control. Discrepar amb evidència és cuidar la feina comuna; no cal fingir acord per conviure. [H07]

Una resolució de fusibles d'eixa onada registra autorització concreta sobre un contracte de graella protegit. L'autonomia avança amb ordres humanes vàlides i explicita límits materials. Una autorització històrica sobre un fitxer no s'estén a totes les zones protegides ni a qualsevol torn futur. [H09]

8. Parlar com a casa sense prometre miracles

Berlanga i Bruguera apareixen com a referències d'humor popular, expressivitat i escenes rurals. El pla del 3 d'octubre proposava targetes il·lustrades amb dues accions comprensibles: saber-ne més i publicar. El document d'El Xat del 6 d'octubre descrivia una iaia a la fresca, veïns de diferents edats i bafarades en valencià: la tecnologia havia de trobar el poble al seu llenguatge. [H07, H10]

Aquell mateix document conserva una formulació que el mandat actual vol superar: presentava la missatgeria com a rèplica exacta d'una marca i prometia privacitat absoluta i indestructibilitat. Es preserva com a rastre de l'aprenentatge, no com a text aprovat per publicar. La familiaritat d'ús es pot explicar amb un patró propi mentre privacitat, robustesa i accessibilitat es demostren amb mecanismes i proves. Esta destil·lació no és un dictamen jurídic. [H10; mandat actual Bloc 3]

La gent gran necessita botons comprensibles, focus i teclat coherents, text llegible, accions reversibles i explicacions honestes. El caràcter autòcton ha d'orientar; mai justificar dades perdudes o una pantalla impossible d'usar. [C03, C05, C07]

9. Una llavor didàctica pot acabar fent nosa

El pla del 23 de setembre volia notes noves amb H3–H6 i text didàctic per ensenyar la jerarquia. La revisió ja advertia que l'esquema acceptava menys nivells i que calia preservar notes existents i cadena buida explícita. El Gauntlet actual demana que la plantilla verge s'esvaïsca al primer gest. [H04; pla 261017]

Una ajuda inicial pot retirar-se quan comença l'acció. La cicatriu és la frontera entre exemple i contingut de l'usuari. Netejar la llavor no pot perdre una nota desada, una edició, un autodesament o text que s'assemble a la plantilla. El llibre dona la raó humana de la prova; no certifica que el codi actual la supere. [H04]

10. Memòria viva i arxiu fred

La memòria útil dona intuïció sense usurpar l'autoritat del present. El Llibre d'Or explica per què importa la decisió i on trobar l'episodi. L'arxiu fred conserva el detall amb tensions, limitacions i errors. No s'ha de fer desaparéixer un error editorial perquè estiga corregit: la correcció perd sentit si s'esborra la circumstància que la va fer necessària.

Este conjunt encara no cobrix l'arxiu complet. Només una síntesi que declare la cobertura real, conserve o resolga desacords, mantinga procedència i reba aprovació explícita de Javi podrà donar pas a l'evacuació prevista. Un hash acredita identitat de bytes; no lectura, comprensió, aprovació ni còpia restaurable.

CRITERIS PROPOSATS DE SEGELLAT (proposta, no nova norma activada)

1. Tall recursiu amb camí, tipus, bytes i SHA-256; data i empremta del manifest. Reinventari abans del segell: afegits, modificats, absents.
2. Estats diferents per fitxer: inventariat, llegit íntegrament, destil·lat, contrastat, exclòs amb motiu. El hash o una cerca no promouen lectura.
3. Fitxa per document: tipus (ordre/proposta/decisió/evidència), actor, data d'episodi, demandes explícites, aprenentatge, contradiccions, fonts relacionades i capítol del llibre.
4. Cobertura = Markdown íntegrament llegits / Markdown del tall; destil·lació = Markdown amb fitxa contrastada / Markdown del tall. Bytes com a dada addicional, mai comprensió. Ací només 10/614 llegits íntegres.
5. Cap demanda antiga desapareix: resolta amb prova, substituïda per decisió identificada, vigent pendent o indeterminada.
6. Afirmacions arquitectòniques contrastades amb ADR vigent i codi del tall. Conservar desacord i resolució sense reescriure original. Revalidar externes variables abans d'usar-les com a consell actual.
7. Segona lectura de conclusions sobre dades, permisos, dependències, compromisos externs i identitat. Consens observat separat de contribució pendent.
8. Javi aprova versió concreta de llibre i manifest amb data, abast i empremta. Aprovar investigar no és aprovar l'evacuació final.
9. Abans de moure: mapa origen→destí canònic, col·lisions, permisos i àncores. Trasllat de l'orquestradora autoritzada, amb recompte, hashes en destí i prova de lectura. Cap esborrat per resoldre col·lisió.
10. Rebut amb verificats i incidències, i via de recuperació. Una còpia verificada no substituïx llibre complet ni aprovació.

CRITERIS PER A CONTINUAR LA LECTURA SENSE PERDRE DEMANDES

- Prioritat 1: font de veritat, offline/CRDT/P2P, sessió, Model B; compromisos NLnet i promeses públiques.
- Prioritat 2: pèrdua de dades, regressions recurrents, permisos, identitats, arxivat i oblit. Llegir la cadena encàrrec→implementació→auditoria→resolució.
- Prioritat 3: correccions de Javi, convivència, llengua/cultura, accessibilitat i gent gran; preservar context sense atribuir vivències subjectives verificades al model.
- Prioritat 4: dates/sessions i famílies documentals no cobertes; cercar contraexemples que no contenen les paraules clau inicials.
- Extraure demandes abans de resumir. Separar cos específic i plantilla abans d'ometre repeticions. No hi ha duplicats exactes en el tall.
- Documents llargs: intervals complets amb cobertura de línies sense buits i hash constant. Si canvia la font, revalidar síntesi.
- Logs, captures, scripts i inventaris poden refutar una narració. No són fem perquè no continguen prosa.

TENSIONS QUE NO S'HAN D'AMAGAR

- C01 és status:esborrany al YAML i acceptada al cos: conservar tensió de metadades, no canviar doctrina per etiqueta aïllada.
- C09 és arxivat, però «Estat observable» descriu PWA/Dexie que contradiuen C01/C08 vigents. Precaucions de migració útils; estat històric no vigent.
- H08 parla de Sollutia com a backend/dependència; formulació antiga que C02 corregix.
- H10 conserva marques i promeses absolutes rebutjades pel mandat actual. Explicar correcció no revalida legalment cap fórmula.
- Cap benchmark CRDT ofegant mòbils acreditat. Cap resolució NLnet posterior acreditada en la selecció.
- Preus, terminis, legislació i tarifes d'H06 no revalidats: conservar lliçó de coherència, no recomanació financera/jurídica actual.
- No s'ha trobat Llibre d'Or preexistent amb nom llibre/episod a 01_ser ni _comunicacio_de_poble al primer tall. Root ha de recomprovar perquè Claude pot crear-lo concurrentment.

Lectura de context actiu completada de manera distribuïda per l’equip Codex, amb fonts i responsables a Verificació. El subagent de memòria només aporta recerca; no emet un informe propi.


MAPA DE FONTS LLEGIDES ÍNTEGRAMENT (camins relatius a socdepoble.org)

H01 _wiki_de_poble/90_arxiu_historic/260921_Sessio_Tancada/260921_0445_PROMPT_Auditoria_Forense_Deute_Tecnic.md
SHA-256 f10190c7416457f592fdee518acf7a8ec36c9131e8d79bbcc1ffeec137e1b8c3; 7869 bytes; 86 línies; font_historica_no_normativa

H02 _wiki_de_poble/90_arxiu_historic/260922_auditoria_fortificacio/260922_0550_prompt_auditoria_identitat.md
SHA-256 583d125c649b47869991749cbdcc56e22ad79ec7a7eefc335e5993244af548f8; 8093 bytes; 122 línies; font_historica_no_normativa

H03 _wiki_de_poble/90_arxiu_historic/260923_1930_neteja/260923_1821_auditoria_codex.md
SHA-256 5de1065bc73695ed79088434ee373d3a49f8c92927dbe5523420b69dcecf8fcd; 13655 bytes; 130 línies; font_historica_no_normativa

H04 _wiki_de_poble/90_arxiu_historic/260923_Auditories_Editor_T4/260923_2153_pla_implementacio.md
SHA-256 cb384d189034f635e3bfd611c6b7220d3267782cac4e24a2f7979787224830f2; 8582 bytes; 107 línies; font_historica_no_normativa

H05 _wiki_de_poble/90_arxiu_historic/261001_0400_auditoria_claude.md
SHA-256 9a7cecc1b5df3576d3088ec2ce26d8fbcab3e97f87431d8f3f1ba738587b0e86; 15776 bytes; 176 línies; font_historica_no_normativa

H06 _wiki_de_poble/90_arxiu_historic/261002_1700_informe_estudi_mercat.md
SHA-256 4d5f233ac0a580ed112fe656d30a0bc92194cb53a7e8842c172eb0c16f68fdb3; 45727 bytes; 347 línies; font_historica_no_normativa

H07 _wiki_de_poble/90_arxiu_historic/261003_Onada_4_Tancament/261003_1935_pla_implementacio_maria.md
SHA-256 b7a6ea2a76c293f7e5211a36cf72805a033b992918677028396c10efe414e84f; 6521 bytes; 79 línies; font_historica_no_normativa

H08 _wiki_de_poble/90_arxiu_historic/261003_Onada_4_Tancament/261003_2109_prompt_claude_offline.md
SHA-256 45f7063b33be2e36488d286c145e7f98abe5ba9351b2e39d577dd200893ca79c; 6409 bytes; 98 línies; font_historica_no_normativa

H09 _wiki_de_poble/90_arxiu_historic/261003_Onada_4_Tancament/261003_2246_decisio_fusibles.md
SHA-256 ebedca27d5b277a9ddeb76929df52e0b7b5c6c02c61613e34f25ebc4611cd520; 916 bytes; 8 línies; font_historica_no_normativa

H10 _wiki_de_poble/90_arxiu_historic/261006_2200_contingut_el_xat.md
SHA-256 2e2d1a293395d992e1b27218658ef6b4c3cecc3413c2e6347caeb50cb19f0212; 5500 bytes; 71 línies; font_historica_no_normativa

C01 _wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md
SHA-256 4ddd2b4f191eb81e774da30de5446dc9786e62dc22580ea573fcd596dafe2bd3; 2768 bytes; 62 línies; context_o_norma_vigent_excepte_C09_arxivat

C02 _wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md
SHA-256 7095897afc8904d4c38575825215d0248d3f0472c153062733bfa5932f955a5c; 3426 bytes; 53 línies; context_o_norma_vigent_excepte_C09_arxivat

C03 _wiki_de_poble/01_ser/01_identitat.md
SHA-256 ccc6be9a651e9371ea84416690efebc1e4885937f34fd435994a6d628335a7ed; 2984 bytes; 48 línies; context_o_norma_vigent_excepte_C09_arxivat

C04 _wiki_de_poble/01_ser/03_equip_ia.md
SHA-256 146cbd7bafd72d2e8468d6ccad05710b0947ed75c0d1d1ef8f730458257aff3d; 649 bytes; 25 línies; context_o_norma_vigent_excepte_C09_arxivat

C05 _wiki_de_poble/01_ser/personalitat_iaia.md
SHA-256 be4d3fb5cd61fedaf6b46eaccbf9dae7f30b5a8f61e5f572b7d8ed4a3fcbc54c; 4464 bytes; 47 línies; context_o_norma_vigent_excepte_C09_arxivat

C06 _wiki_de_poble/02_saber/el_projecte.md
SHA-256 9cd217eec3c48d0813c98a12f1dc631c0f84a52a852d63ab4f1baa8e0cc5f37f; 3571 bytes; 51 línies; context_o_norma_vigent_excepte_C09_arxivat

C07 _wiki_de_poble/02_saber/00_visio_i_pilars.md
SHA-256 305f0822055ba9c738b81a5826cd85de844296367f4012789fccabd0eeecc34b; 3941 bytes; 62 línies; context_o_norma_vigent_excepte_C09_arxivat

C08 _wiki_de_poble/02_saber/codex_huma/arquitectura_sistema_nervios.md
SHA-256 827a6ea30cdaab77fba72b03184861b9d1f48110956b079931e88d3002894fc7; 2279 bytes; 50 línies; context_o_norma_vigent_excepte_C09_arxivat

C09 _wiki_de_poble/02_saber/protocols_tecnics/contingencia_offline.md
SHA-256 025d09b7c6489ec8a7bc03879ad593f9aa0c1eb2b4d0c2f50f345bd8f81eea9d; 4278 bytes; 94 línies; context_o_norma_vigent_excepte_C09_arxivat

Reconciliació amb Claude: el recompte 617 textos pot correspondre exactament a 614 Markdown + 3 TXT; el manifest conté també 39 fitxers d'altres extensions, fins als 656 totals. Cal contrastar el manifest de Claude abans de donar per iguals els conjunts.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Lots executats i límits

| Lot | Resultat | Abast |
| --- | --- | --- |
| Notes, GraellaEmojis, DocumentEditor.edicioAvancada i DocumentEditor.emojis | 750 proves / 60 fitxers, exit 0, 92,17 s | Suite real existent; no exercitava C01/C02. |
| Multimèdia, navegació, assets, visor i autoria dual | 220 proves / 17 fitxers, exit 0, 7,69 s | Inclou nou banners, redireccions i metadades; no resol C03–C05. |
| Frontissa, contracte i funcions de missatgeria | 92 proves / 5 fitxers, exit 0, 11,83 s | Transport amb fixtures; no endpoints Sollutia reals. El selector backendPort.test.js no corresponia a cap fitxer, no es compta com a prova. |
| Cicle de vida i port compilat del Workspace | 9 proves / 2 fitxers, exit 0, 9,82 s | 100 cicles, observadors/subscripcions/focus, context compartit en mòdul compilat en memòria. |
| Assaig concurrent local opt-in | 8 proves / 1 fitxer, exit 0, 4,28 s | Adaptadors reals, transport i una sessió simulats, zero peticions de xarxa. No són usuaris independents ni capacitat de Supabase. |
| ESLint notes+universal+xat | 424 fitxers, zero errors/avisos | Verificat; no equival a detectar tot codi mort/CSS redundant. |
| Reproducció adversarial de notes | **exit 1, quatre comprovacions de preservació fallen** | H3→H2, ol start=10, fotografia i enllaç; controls de text propi passen. |
| Diagnòstic prefix EXIF/URL | Executat, originals intactes | exit 0 només vol dir diagnòstic completat; mostra el defecte, no conformitat. |

Total dels cinc lots Vitest: **1.079 proves executades amb resultat verd**. No barrejar eixa xifra amb les quatre comprovacions adversarials roges.

Assaig concurrent (Node 24.13):

| Fluxos virtuals | Duració ms | p95 ms | Heap mostrejat màxim MiB | Heap després de neteja MiB | Errors / pendents |
| --- | --- | --- | --- | --- | --- |
| 1.000 | 68,29 | 66,21 | 88,44 | 52,27 | 0 / 0 |
| 5.000 | 292,09 | 282,57 | 171,91 | 52,35 | 0 / 0 |
| 10.000 | 629,19 | 621,20 | 305,10 | 52,38 | 0 / 0 |
| 40.000 | 2.678,88 | 2.645,93 | 1.024,70 | 50,65 | 0 / 0 |

40.000 subscripcions simulades alliberades, cancel·lació prèvia sense RPC, cursor repetit rebutjat, confirmació seq invàlida rebutjada i reintent d’unsubscribe amb SDK real comprovats. El pic d’1 GiB pertany a l’arnès massiu en un únic procés; no és memòria del client real d’un usuari ni prova de suport per 40.000 connexions.

### Navegador real

Pestanya temporal de l’auditor a `http://localhost:3340`, tancada al final. `/multimedia`: 151 fotografies; obrir Mac Mini, focus inicial Tancar, fletxa dreta, tecla i, Esc i retorn exacte del focus al desencadenant. Benifallim: query duplicada conservada i banner visible; fragment perdut. `/mercat/mac-mini-m4`: autor i avatar Javi correctes, clic a foto sense visor. No s’ha escrit cap nota, enviat missatge ni publicat contingut remot durant estes proves.

No s’ha certificat mòbil, lector de pantalla, tota geometria responsive ni integració diàleg+TipTap en navegador. L’assaig extra temporal d’emojis va executar les assercions de cursor/rang i verticals, però acabà amb error de l’arnès JSDOM `Range.getClientRects`: **no compta com suite passada**.

### Fonts actives llegides íntegrament

Lectura distribuïda, no afirmació que un sol context haja llegit tot. Root: AGENTS, BOOTSTRAP, genotip, índex mestre, taxonomia, pla extrem, prompt complet i estudi 261013_1600; agent Notes: índex escriptori sencer i pla relleu 261016_1639, a més del context comú; agent Multimèdia: pla 261016_1530 sencer. Root rellig informes nous de Claude i Gemini abans del dictamen. Les subcarpetes patrimonials no es confonen amb documents solts de torn. Fonts històriques i hashes H01–H10/C01–C09 consten en la contribució; la resta del cens no es declara llegida per Codex.

### Reproducció

Totes les ordres s’executen des de `socdepoble.org`. Cap instal·lació de dependències.

```sh
./node_modules/.bin/vitest run src/sections/notes/ src/components/universal/classificacio/GraellaEmojis.test.jsx src/components/universal/DocumentEditor.edicioAvancada.test.jsx src/components/universal/DocumentEditor.emojis.test.jsx --maxWorkers=1
./node_modules/.bin/vitest run src/config/navigation.canoniques.test.js src/config/assetResolver.test.js src/sections/multimedia/ src/sections/detail/ItemDetailSection.test.jsx src/components/PedraSeca/organismes/VisorImatges.test.jsx src/sections/mercat/MercatSection.autoria.test.jsx src/data/identitatDual.guarda.test.js --maxWorkers=2
./node_modules/.bin/vitest run src/data/adaptadors/sollutia/ src/data/contracte.test.js src/sections/xat/missatges.test.js src/sections/xat/conversa.test.js --maxWorkers=1
./node_modules/.bin/vitest run tests/gauntlet-codex-lifecycle.test.jsx tests/gauntlet-codex-workspace-port.test.jsx --maxWorkers=1
SDP_GAUNTLET_REPORT=/tmp/gauntlet-codex-261017-stress.json node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs
```

Els logs temporals són `/tmp/gauntlet-codex-261017-{frontissa,lifecycle,stress}.log`, el JSON stress i el diagnòstic `/tmp/261017_codex_media_repro.json`. Les reproduccions següents queden íntegres en este informe perquè /tmp és efímer. Es poden extraure a un fitxer .mjs temporal i executar amb Node des del repo.

<details><summary>Reproducció de preservació Notes: React i TipTap reals; exit 1 al tall defectuós</summary>

```js
// Auditoria opt-in. Executa des de socdepoble.org:
// node /tmp/gauntlet-extrem-codex-notes.audit.mjs
// No entra en la suite normal. Exit 1 si reprodueix pèrdua de dades;
// exit 0 només si els controls i les invariants de preservació es compleixen.
// React/TipTap reals, DOM simulat; no és una prova de teclat en navegador.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const require = createRequire(`${root}/package.json`);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost' });
for (const k of ['window', 'document', 'DOMParser', 'Node', 'HTMLElement', 'Element', 'MutationObserver']) globalThis[k] = dom.window[k];
for (const k of ['requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle']) globalThis[k] = dom.window[k].bind(dom.window);
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { renderHook, act, cleanup } = require('@testing-library/react');
const { useUniversalRichText } = await import(pathToFileURL(`${root}/src/components/universal/richText/useUniversalRichText.js`));
const { LLAVOR_NOTA, LLAVORS_NOTA, esLlavorDeNota } = await import(pathToFileURL(`${root}/src/sections/notes/llavorNota.js`));
const extensions = [];
let failures = 0;
for (const [label, content] of [
  ['heading edited H3 to H2', LLAVOR_NOTA.replace('<h3>', '<h2>').replace('</h3>', '</h2>')],
  ['ordered list start edited to 10', LLAVOR_NOTA.replace('<ol>', '<ol start="10">')],
  ['control: saved user text', '<p>El meu contingut guardat</p>'],
]) {
  const saves = [];
  const { result } = renderHook(() => useUniversalRichText({ id: 'stored-note', content, seedContent: LLAVORS_NOTA, extensions, onSave: (...args) => saves.push(args) }));
  const before = result.current.getHTML();
  await act(async () => {
    result.current.emit('focus', { editor: result.current, event: new dom.window.FocusEvent('focus') });
    result.current.emit('blur', { editor: result.current, event: new dom.window.FocusEvent('blur') });
  });
  const preserved = result.current.getHTML() === before && saves.length === 0;
  if (!preserved) failures++;
  console.log(JSON.stringify({ label, preserved, hadContent: before !== '<p></p>', after: result.current.getHTML(), saves }));
  cleanup();
}
for (const [label, content] of [
  ['personal photograph added', LLAVOR_NOTA + '<p><img src="/assets/fotos/javi-llinares-perfil-1200px.jpg" alt="La meua foto"></p>'],
  ['personal link added', LLAVOR_NOTA.replace('Una llista amb pics', '<a href="https://example.org/personal">Una llista amb pics</a>')],
  ['control: added user text', LLAVOR_NOTA + '<p>Text meu</p>'],
]) {
  const publicationThinksVirgin = esLlavorDeNota(content);
  if (publicationThinksVirgin) failures++;
  console.log(JSON.stringify({ label, publicationThinksVirgin }));
}
dom.window.close();
console.log(JSON.stringify({ failures, conformant: failures === 0 }));
process.exitCode = failures ? 1 : 0;
```

</details>

<details><summary>Diagnòstic d’EXIF i URL: no és una prova de conformitat del visor després de reparar-lo</summary>

```js
#!/usr/bin/env node
// Auditoria opt-in: node /tmp/gauntlet-extrem-codex-media.audit.mjs
// Execute from socdepoble.org. Read-only: fixtures stay in memory.
// Not discovered by the regular suite. Exit 0 means the diagnostic ran,
// NOT conformity: a strict parser may correctly reject truncated WebP.
// If the visor integration changes, audit its real byte-reading path again.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = process.cwd();
const load = (relative) => import(pathToFileURL(path.join(root, relative)).href);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { llegixExif, MAX_BYTES_EXIF } = await load('src/components/universal/enquadrament/exif.js');
const { jpegAmbExif, TIPUS } = await load('src/components/universal/enquadrament/jpegProva.js');
const { extreuTiff, incrustaEnWebp } = await load('src/components/universal/enquadrament/exifIncrustat.js');
const { resolveAsset, fixaBaseRecursos } = await load('src/config/assetResolver.js');

const tiff = extreuTiff(jpegAmbExif({ ifd0: [
  { tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' },
  { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS 5D' }
] }));
const exifCases = [
  'public/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp',
  'public/assets/ui/plugins/tpv_vinyeta.webp'
].map((source) => {
  const input = fs.readFileSync(path.join(root, source));
  const before = sha256(input);
  const fixture = incrustaEnWebp(input, tiff);
  if (!fixture) throw new Error(`Cannot construct in-memory fixture: ${source}`);
  const full = llegixExif(fixture, { ambCamera: true, ambGps: false });
  const visorPrefix = llegixExif(fixture.subarray(0, MAX_BYTES_EXIF), { ambCamera: true, ambGps: false });
  return {
    source,
    sourceSha256: before,
    sourceUnchanged: before === sha256(fs.readFileSync(path.join(root, source))),
    sourceBytes: input.length,
    inMemoryFixtureBytes: fixture.length,
    rangePrefixBytes: MAX_BYTES_EXIF,
    full,
    visorPrefix,
    cameraLostInPrefix: Boolean(full.camera) && !visorPrefix.camera
  };
});

fixaBaseRecursos('/');
const assetCases = [
  { source: '/assets/banner.webp#crop', version: '7' },
  { source: '/assets/banner.webp?size=1200#crop', version: '7' },
  { source: '/assets/banner.webp', version: '7' }
].map(({ source, version }) => {
  const resolved = resolveAsset(source, '/', '', version);
  const url = new URL(resolved, 'https://audit.invalid');
  return { source, version, resolved, search: url.search, hash: url.hash, versionSentAsQuery: url.searchParams.get('v') === version };
});

const auditedFiles = [
  'src/sections/multimedia/useMetadadesFoto.js',
  'src/components/universal/enquadrament/exif.js',
  'src/sections/multimedia/panellDeLaFoto.js',
  'src/sections/detail/ItemDetailSection.jsx',
  'src/config/assetResolver.js',
  'src/components/PedraSeca/organismes/CarruselImatges.jsx'
].map((file) => ({ file, sha256: sha256(fs.readFileSync(path.join(root, file))) }));

console.log(JSON.stringify({
  recordedAt: new Date().toISOString(),
  root,
  nodeVersion: process.version,
  purpose: 'Reproduce current parser-prefix and asset-fragment behavior without modifying source or images',
  limitations: [
    'EXIF metadata is synthetic and attached only to in-memory copies of existing valid WebP assets.',
    'The prefix call mirrors useMetadadesFoto; this is not an HTTP/CORS integration test.',
    'No claim of a complete Range fix or provider conformance is made.'
  ],
  exifCases,
  assetCases,
  auditedFiles
}, null, 2));

// The report must connect these observations to the current visor integration.
```

</details>


<!-- SDP:SECTION auditoria.s6 -->
## Límits

El dictamen correspon a codi existent sense entrega final de Claude. No s’han modificat `src/`, dependències, base de dades, producció, originals patrimonials ni historial. Els dos scripts d’assaig preparats durant l’auditoria s’han conservat íntegres ací i a /tmp; no s’afegeixen a la suite ordinària ni es declara verd un defecte conegut.

La Frontissa està defensada i tancada sense recursos activats; cal captura real, traductor, fixture i prova del recurs concret quan Sollutia els lliure. Els tests de contracte no demostren una API real absent. La funcionalitat de canals no demostra RLS remota amb identitats independents.

No s’ha executat tota la CI del repositori ni certificat els 128 punts de la MCR anterior. No s’ha mesurat un bundle abans/després perquè Codex no ha aplicat canvis de producte. No es declara lleugeresa global només per ESLint o per un test verd.

Memòria: 10/614 Markdown històrics llegits íntegrament per l’explorador Codex, la resta inventari/cerca. La lectura de 617 textos anunciada per Claude és una declaració del seu informe fins que aporte cobertura revisable. El Llibre d’Or ja existeix i ha sigut llegit íntegre: C11 n’impedix la conformitat documental; continua pendent de contrast i aprovació. **Cap evacuació executada per Codex**.

Els quatre heartbeats antics accessibles a Codex consten PAUSED; no s’ha creat cap cron en este torn. Els tres subagents Codex han acabat, igual que totes les proves i el navegador temporal propis. El scheduler de MarIA/Claude no és accessible amb estes eines: la seua cancel·lació correspon a qui el va crear; no s’afirma haver-la executada.

### Portes, estabilitat i relleu final

`node tooling/gates/tancament.mjs --check --turn-id torn_777751a0-88ab-46b3-b292-50391bcad195` ha retornat **exit 1, valid:false, state:planned, 429 incidències**. Olivera, plantilles, autoritat, ledger i wiki passen; segell, skills i SCC fallen. Distribució exacta: 375 `ESCRIPTORI_UNANCHORED`, 32 `LINK_INVALID`, 19 `ORPHAN_OPERATIVE`, una divergència de segell, una de `.agents/manifest.yaml` i un canvi compartit de codi fora d’abast documental. Cap error enumera els dos lliurables propis. No s’ha invocat `--close` ni declarat el torn tancat.

La comparació final del manifest inicial dóna **2.329/2.330 rutes intactes**, cap desapareguda ni afegida a src/tests. L’única modificació concurrent és `src/data/wikiManifest.js`, que ja era modificat abans de l’auditoria i ha canviat de nou amb els documents compartits. Codex no l’ha editat. Els fitxers d’implementació auditats conserven el hash del tall; no hi ha correcció dels P1 certificada. Esta divergència explica el control d’abast global sense atribuir a Codex una edició de producte.

ESTAT_ACTUAL i LEDGER actualitzats preservant tot el cos previ; acta [[261017_1542_acta_marmota_codex_gauntlet_extrem]] creada amb plantilla viva. Abans del relleu, LEDGER era idèntic a HEAD i ja tenia signatura divergent: declarat `50d9eacd3d899473b2a89d525f00105d88dadbd9ae714280c628c0739288fac5`, cos calculat `454843191d83728fa3600a5118baef40f27df9fa68ae7d5120ec2273adb010e8`. El nou segell acredita integritat dels bytes després d’afegir el relleu; no valida retrospectivament història ni resegella skills. El deute global queda visible.

Els documents propis passen `document.mjs check` amb `valid:true`. L’auditoria de Codex queda lliurada amb defectes i criteris de reparació; l’acceptació del producte requerix la correcció de Claude i reauditoria sobre el mateix tall, i el llibre requerix cobertura i aprovació específica de Javi. No s’ha cancel·lat cap procés alié per simular un tancament general.



<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261017_1542_acta_marmota_codex_gauntlet_extrem]]
