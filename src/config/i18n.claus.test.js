/**
 * Claus del torn T1–T4 (260930) i del Calendari (ordre del Mestre, 261001):
 * cada clau té valor propi en les cinc llengües
 * de SUPPORTED_LANGUAGES, i en valencià coincidix amb el text ordenat.
 * Fa de guarda local de la paritat (LLEI_07 de tractor-pedra-seca), que el
 * hook de l'implementador no deixa executar.
 * El traductor és el real (createTranslator); el diccionari no s'exporta i el
 * recompte d'aparicions es fa sobre el text de la font.
 */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from './i18n.js';
import fontI18n from './i18n.js?raw';
import fontNotesEditor from '../sections/notes/NotesEditor.jsx?raw';
import fontDestinsControl from '../sections/control/destinsControl.js?raw';
import fontEstatError from '../sections/mur/EstatErrorDades.jsx?raw';
import fontCalendari from '../sections/calendari/CalendariSection.jsx?raw';
import fontMarcaAmfitrio from '../components/universal/MarcaAmfitrio.jsx?raw';
import fontEstatConnexio from '../components/universal/connexio/estatConnexio.js?raw';
import { TEXTOS_MULTIMEDIA } from '../sections/xat/components/VistaMultimedia.jsx';
import { AVISOS_XAT_CORPORATIU } from '../sections/control/xatCorporatiu.js';
import fontDialegTriaTargeta from '../components/universal/richText/extensions/targetes/DialegTriaTargeta.jsx?raw';
import fontTargetaIncrustada from '../components/universal/richText/extensions/targetes/TargetaIncrustadaNodeView.jsx?raw';
/* Esmena 3 del pla 261007_1645 · la portada amb carrusel (i les seues claus)
   ha passat d'ItemDetailSection a detailSectionMeta (portadaDElement). */
import fontPortada from '../sections/detail/detailSectionMeta.jsx?raw';
/* Esmena 2 del pla 261007_1645 (revisió adversarial del 261007) · l'històric
   de l'actor: els parells [clau, reserva] del hook i la fallada del component. */
import fontHistoric from '../sections/mur/usePublicacionsDeLActor.js?raw';
import fontPublicacionsActor from '../sections/mur/PublicacionsDeLActor.jsx?raw';
/* B03 (revisió del 261008) · La reserva valenciana de SDP-XAT-016 viu a
   l'adaptador del xat (MISSATGES_SDP_HUMANS), que no coneix la llengua. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirI18n = path.dirname(fileURLToPath(import.meta.url));
const fontAdaptadorXat = fs.readFileSync(path.resolve(__dirI18n, '../data/supabase/xat.js'), 'utf8');
/* Onada 6 (pla 261009_0245, ítem 5) · Els textos del panell «Gent de …» de la
   pàgina d'un poble. */
import fontTextosDelPoble from '../sections/pobles/usePublicacionsDelPoble.js?raw';
/* Onada 8 (261009) · El botó gran de la Consola i del Cervell. */
import fontSystemPages from './systemPages.js?raw';

const CLAUS = {
  'nav.panel': {
    ca: 'Panell de Control',
    es: 'Panel de control',
    en: 'Control panel',
    eu: 'Kontrol panela',
    gl: 'Panel de control'
  },
  'nav.telefonades.avis': {
    // Literal del Mestre: no es toca.
    ca: 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.',
    es: 'Este es un proyecto libre CC. Esta función está prevista para cuando podamos mantenerla económicamente.',
    en: 'This is a free CC project. This feature is planned for when we can afford to maintain it.',
    eu: 'Hau CC proiektu librea da. Funtzio hau ekonomikoki mantendu ahal izango dugunerako aurreikusita dago.',
    gl: 'Este é un proxecto libre CC. Esta función está prevista para cando poidamos mantela economicamente.'
  },
  'common.entesos': {
    ca: 'Entesos', es: 'Entendido', en: 'Got it', eu: 'Ulertuta', gl: 'Entendido'
  },
  'common.reintenta': {
    ca: 'Torna-ho a provar', es: 'Vuelve a intentarlo', en: 'Try again', eu: 'Saiatu berriro', gl: 'Téntao de novo'
  },
  'error.backendInabastable': {
    ca: 'El servidor del poble no respon ara mateix. El contingut no s’ha pogut carregar.',
    es: 'El servidor del pueblo no responde ahora mismo. No se ha podido cargar el contenido.',
    en: 'The town server is not responding right now. The content could not be loaded.',
    eu: 'Herriko zerbitzariak ez du erantzuten oraintxe. Ezin izan da edukia kargatu.',
    gl: 'O servidor da vila non responde agora mesmo. Non se puido cargar o contido.'
  },
  'error.tornaDemostracio': {
    ca: 'Tornar al mode de proves',
    es: 'Volver al modo de pruebas',
    en: 'Back to demo mode',
    eu: 'Itzuli proba modura',
    gl: 'Volver ao modo de probas'
  },
  'section.control.lead': {
    ca: 'Publica, connecta i ajusta el teu espai des d’un sol lloc.',
    es: 'Publica, conecta y ajusta tu espacio desde un solo lugar.',
    en: 'Publish, connect and adjust your space from one place.',
    eu: 'Argitaratu, konektatu eta doitu zure espazioa leku bakarretik.',
    gl: 'Publica, conecta e axusta o teu espazo dende un só lugar.'
  },
  /* Correcció de la revisió (260930) · Claus que la UI ja cridava sense cap
     entrada al diccionari (connexió editable, D4) i les noves del Panell i de
     l'estat d'error. El valor valencià és el text de reserva del codi. */
  'section.notes.connexio.titol': {
    ca: 'Element connectat',
    es: 'Elemento conectado',
    en: 'Connected item',
    eu: 'Konektatutako elementua',
    gl: 'Elemento conectado'
  },
  'section.notes.connexio.altri': {
    ca: 'una altra persona',
    es: 'otra persona',
    en: 'someone else',
    eu: 'beste pertsona bat',
    gl: 'outra persoa'
  },
  'section.notes.compartir': {
    ca: 'Compartir', es: 'Compartir', en: 'Share', eu: 'Partekatu', gl: 'Compartir'
  },
  'section.control.ajustosXat.titol': {
    ca: 'Ajustos del xat',
    es: 'Ajustes del chat',
    en: 'Chat settings',
    eu: 'Txataren ezarpenak',
    gl: 'Axustes do chat'
  },
  'section.control.ajustosXat.subtitol': {
    ca: 'Amplària de les columnes i preferències del xat',
    es: 'Anchura de las columnas y preferencias del chat',
    en: 'Column width and chat preferences',
    eu: 'Zutabeen zabalera eta txataren hobespenak',
    gl: 'Largura das columnas e preferencias do chat'
  },
  'section.control.porta.publicar': {
    ca: 'Publicar', es: 'Publicar', en: 'Publish', eu: 'Argitaratu', gl: 'Publicar'
  },
  'section.control.porta.saberMes': {
    ca: 'Saber-ne més', es: 'Saber más', en: 'Learn more', eu: 'Gehiago jakin', gl: 'Saber máis'
  },
  'error.servidor': {
    ca: 'El servidor del poble ha tornat un error. Torna-ho a provar més tard.',
    es: 'El servidor del pueblo ha devuelto un error. Vuelve a intentarlo más tarde.',
    en: 'The town server returned an error. Try again later.',
    eu: 'Herriko zerbitzariak errore bat itzuli du. Saiatu berriro geroago.',
    gl: 'O servidor da vila devolveu un erro. Téntao de novo máis tarde.'
  },
  'error.connectarBloc': {
    ca: 'No s’ha pogut obrir el teu Bloc.',
    es: 'No se ha podido abrir tu Bloc.',
    en: 'Your Notebook could not be opened.',
    eu: 'Ezin izan da zure Koadernoa ireki.',
    gl: 'Non se puido abrir o teu Caderno.'
  },
  /* D4 · Els drets de l'original a l'editor d'una connexió ({drets} literal). */
  'section.notes.drets.original': {
    ca: 'Drets de l’original: {drets}',
    es: 'Derechos del original: {drets}',
    en: 'Rights of the original: {drets}',
    eu: 'Jatorrizkoaren eskubideak: {drets}',
    gl: 'Dereitos do orixinal: {drets}'
  },
  'section.notes.drets.originalSenseDeclarar': {
    ca: 'L’original no declara drets',
    es: 'El original no declara derechos',
    en: 'The original does not declare any rights',
    eu: 'Jatorrizkoak ez du eskubiderik adierazten',
    gl: 'O orixinal non declara dereitos'
  },
  /* Ordre del Mestre, 261001 · Les tres claus que el Calendari
     (CalendariSection.jsx) ja cridava sense cap entrada al diccionari. */
  'section.calendari.title': {
    ca: 'Totes les targetes del poble',
    es: 'Todas las tarjetas del pueblo',
    en: 'Every card in the village',
    eu: 'Herriko txartel guztiak',
    gl: 'Todas as tarxetas do pobo'
  },
  'section.calendari.subtitle': {
    ca: 'Cada publicació, acte i producte, el dia de la seua data.',
    es: 'Cada publicación, evento y producto, en el día de su fecha.',
    en: 'Every post, event and product on the day of its date.',
    eu: 'Argitalpen, ekitaldi eta produktu bakoitza, bere dataren egunean.',
    gl: 'Cada publicación, evento e produto, no día da súa data.'
  },
  'section.calendari.error': {
    ca: 'No s’han pogut carregar les targetes del calendari',
    es: 'No se han podido cargar las tarjetas del calendario',
    en: 'The calendar cards could not be loaded',
    eu: 'Ezin izan dira egutegiko txartelak kargatu',
    gl: 'Non se puideron cargar as tarxetas do calendario'
  },
  /* T7-T9 (ordre del Mestre, 261001) · La franja del node (MarcaAmfitrio.jsx)
     i l'estat de connexió del Perfil (estatConnexio.js). Les d'eu i gl són
     proposta a revisar per algú que les parle. */
  'amfitrio.node': {
    ca: 'Connectat al node de {nom}',
    es: 'Conectado al nodo de {nom}',
    en: 'Connected to the {nom} node',
    eu: '{nom} nodora konektatuta',
    gl: 'Conectado ao nodo de {nom}'
  },
  'amfitrio.nodeConnectant': {
    ca: 'Connectant amb el node de {nom}…',
    es: 'Conectando con el nodo de {nom}…',
    en: 'Connecting to the {nom} node…',
    eu: '{nom} nodora konektatzen…',
    gl: 'Conectando co nodo de {nom}…'
  },
  'amfitrio.nodeSenseConnexio': {
    ca: 'Sense connexió amb el node de {nom}',
    es: 'Sin conexión con el nodo de {nom}',
    en: 'No connection to the {nom} node',
    eu: 'Ez dago konexiorik {nom} nodoarekin',
    gl: 'Sen conexión co nodo de {nom}'
  },
  'amfitrio.mesInfo': {
    ca: 'Què és un node?', es: '¿Qué es un nodo?', en: 'What is a node?', eu: 'Zer da nodo bat?', gl: 'Que é un nodo?'
  },
  'amfitrio.tanca': {
    ca: 'Tancar l’avís del node',
    es: 'Cerrar el aviso del nodo',
    en: 'Close the node notice',
    eu: 'Itxi nodoaren oharra',
    gl: 'Pechar o aviso do nodo'
  },
  'connexio.activa': {
    ca: 'Connexió activa', es: 'Conexión activa', en: 'Connection active', eu: 'Konexio aktiboa', gl: 'Conexión activa'
  },
  'connexio.connectant': {
    ca: 'Connectant…', es: 'Conectando…', en: 'Connecting…', eu: 'Konektatzen…', gl: 'Conectando…'
  },
  'connexio.sense': {
    ca: 'Sense connexió', es: 'Sin conexión', en: 'No connection', eu: 'Konexiorik gabe', gl: 'Sen conexión'
  },
  /* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · La vista
     «Contingut multimèdia» del Xat, ja operativa (VistaMultimedia.jsx). Les
     d'eu i gl són proposta a revisar per algú que les parle. */
  'section.xat.vista.multimedia.fitxers.buit': {
    ca: "Ací hi haurà les fotos i els vídeos que s'han compartit en les converses.",
    es: 'Aquí estarán las fotos y los vídeos compartidos en las conversaciones.',
    en: 'Photos and videos shared in conversations will be here.',
    eu: 'Hemen egongo dira elkarrizketetan partekatutako argazkiak eta bideoak.',
    gl: 'Aquí estarán as fotos e os vídeos compartidos nas conversas.'
  },
  'section.xat.vista.multimedia.enllacos.buit': {
    ca: "Encara no s'ha compartit cap enllaç en les converses obertes.",
    es: 'Todavía no se ha compartido ningún enlace en las conversaciones abiertas.',
    en: 'No links have been shared in the open conversations yet.',
    eu: 'Oraindik ez da estekarik partekatu irekitako elkarrizketetan.',
    gl: 'Aínda non se compartiu ningunha ligazón nas conversas abertas.'
  },
  'section.xat.vista.multimedia.documents.buit': {
    ca: "Ací hi haurà els documents que s'han compartit en les converses.",
    es: 'Aquí estarán los documentos compartidos en las conversaciones.',
    en: 'Documents shared in conversations will be here.',
    eu: 'Hemen egongo dira elkarrizketetan partekatutako dokumentuak.',
    gl: 'Aquí estarán os documentos compartidos nas conversas.'
  },
  'section.xat.vista.multimedia.adjunts': {
    ca: 'Els adjunts arriben amb la fase F1 del xat: ara només es pot enviar text.',
    es: 'Los adjuntos llegan con la fase F1 del chat: ahora solo se puede enviar texto.',
    en: 'Attachments arrive with phase F1 of the chat: for now only text can be sent.',
    eu: 'Eranskinak txataren F1 fasearekin iritsiko dira: oraingoz testua bakarrik bidal daiteke.',
    gl: 'Os anexos chegan coa fase F1 do chat: agora só se pode enviar texto.'
  },
  'section.xat.vista.multimedia.avisLocal': {
    ca: 'Només es veu el contingut de les converses obertes en esta sessió.',
    es: 'Solo se ve el contenido de las conversaciones abiertas en esta sesión.',
    en: 'Only content from the conversations opened in this session is shown.',
    eu: 'Saio honetan irekitako elkarrizketetako edukia bakarrik ikusten da.',
    gl: 'Só se ve o contido das conversas abertas nesta sesión.'
  },
  'section.xat.vista.multimedia.obri': {
    ca: 'Obri la conversa de {nom}',
    es: 'Abrir la conversación de {nom}',
    en: 'Open the conversation {nom}',
    eu: 'Ireki {nom} elkarrizketa',
    gl: 'Abrir a conversa de {nom}'
  },
  'section.xat.vista.multimedia.senseData': {
    ca: 'Sense data', es: 'Sin fecha', en: 'No date', eu: 'Datarik gabe', gl: 'Sen data'
  },
  /* 261004 · Per al front Editor (T7, «Inserir targeta» a l'UniversalEditor):
     el nom de la peça al menú d'inserció. */
  'editor.inserir.targeta': {
    ca: 'Targeta', es: 'Tarjeta', en: 'Card', eu: 'Txartela', gl: 'Tarxeta'
  },
  /* Ordre del Mestre del 261004 (prompt 261004_0515, T6) · Comentar sense xat
     on portar (AVISOS_XAT_CORPORATIU de xatCorporatiu.js). Les d'eu i gl són
     proposta a revisar per algú que les parle. */
  'section.control.xatCorporatiu.noDisponible': {
    ca: 'Xat de Sóc de Poble: encara no disponible en este servidor.',
    es: 'Chat de Sóc de Poble: todavía no disponible en este servidor.',
    en: 'Sóc de Poble chat: not available on this server yet.',
    eu: 'Sóc de Poble txata: oraindik ez dago erabilgarri zerbitzari honetan.',
    gl: 'Chat de Sóc de Poble: aínda non dispoñible neste servidor.'
  },
  'section.control.xatCorporatiu.resolent': {
    ca: 'Xat de Sóc de Poble: encara s’està buscant en este servidor.',
    es: 'Chat de Sóc de Poble: todavía se está buscando en este servidor.',
    en: 'Sóc de Poble chat: still being looked up on this server.',
    eu: 'Sóc de Poble txata: oraindik bilatzen ari da zerbitzari honetan.',
    gl: 'Chat de Sóc de Poble: aínda se está a buscar neste servidor.'
  },
  /* Ordre del Mestre del 261004 (prompt 261004_0515, T7) · El selector i les
     eines de la targeta incrustada (richText/extensions/targetes). Les d'eu i
     gl són proposta a revisar per algú que les parle. */
  'editor.targetes.tipus.publicacio': {
    ca: 'Publicació', es: 'Publicación', en: 'Post', eu: 'Argitalpena', gl: 'Publicación'
  },
  'editor.targetes.tipus.esdeveniment': {
    ca: 'Acte', es: 'Evento', en: 'Event', eu: 'Ekitaldia', gl: 'Evento'
  },
  'editor.targetes.tipus.producte': {
    ca: 'Producte', es: 'Producto', en: 'Product', eu: 'Produktua', gl: 'Produto'
  },
  'editor.targetes.tipus.poble': {
    ca: 'Poble', es: 'Pueblo', en: 'Village', eu: 'Herria', gl: 'Pobo'
  },
  'editor.targetes.tipus.pagina': {
    ca: 'Pàgina', es: 'Página', en: 'Page', eu: 'Orria', gl: 'Páxina'
  },
  'editor.targetes.dialeg.buit': {
    ca: 'Escriu el que busques: una publicació, un acte, un producte, un poble o una pàgina.',
    es: 'Escribe lo que buscas: una publicación, un evento, un producto, un pueblo o una página.',
    en: 'Type what you are looking for: a post, an event, a product, a village or a page.',
    eu: 'Idatzi bilatzen duzuna: argitalpen bat, ekitaldi bat, produktu bat, herri bat edo orri bat.',
    gl: 'Escribe o que buscas: unha publicación, un evento, un produto, un pobo ou unha páxina.'
  },
  'editor.targetes.dialeg.capResultat': {
    ca: 'Cap targeta pública coincidix amb la cerca.',
    es: 'Ninguna tarjeta pública coincide con la búsqueda.',
    en: 'No public card matches the search.',
    eu: 'Ez dago bilaketarekin bat datorren txartel publikorik.',
    gl: 'Ningunha tarxeta pública coincide coa busca.'
  },
  'editor.targetes.dialeg.titol': {
    ca: 'Inserir una targeta', es: 'Insertar una tarjeta', en: 'Insert a card', eu: 'Txertatu txartel bat', gl: 'Inserir unha tarxeta'
  },
  'editor.targetes.dialeg.descripcio': {
    ca: 'La targeta s’incrusta al text com una imatge: una sola s’alinea a un costat, dues van al centre i tres o més fan una graella.',
    es: 'La tarjeta se incrusta en el texto como una imagen: una sola se alinea a un lado, dos van al centro y tres o más forman una cuadrícula.',
    en: 'The card is embedded in the text like an image: a single one aligns to one side, two go in the centre and three or more make a grid.',
    eu: 'Txartela testuan txertatzen da irudi bat bezala: bakarra alde batera lerrokatzen da, bi erdian doaz eta hiru edo gehiagok sareta bat osatzen dute.',
    gl: 'A tarxeta incrústase no texto como unha imaxe: unha soa alíñase a un lado, dúas van ao centro e tres ou máis forman unha grella.'
  },
  'editor.targetes.dialeg.inserir': {
    ca: 'Inserir', es: 'Insertar', en: 'Insert', eu: 'Txertatu', gl: 'Inserir'
  },
  'editor.targetes.dialeg.cerca': {
    ca: 'Busca', es: 'Buscar', en: 'Search', eu: 'Bilatu', gl: 'Buscar'
  },
  'editor.targetes.dialeg.resultats': {
    ca: 'Resultats', es: 'Resultados', en: 'Results', eu: 'Emaitzak', gl: 'Resultados'
  },
  'editor.targetes.dialeg.triada': {
    ca: 'Triada', es: 'Elegida', en: 'Selected', eu: 'Hautatua', gl: 'Escollida'
  },
  'editor.targetes.eines': {
    ca: 'Eines de la targeta', es: 'Herramientas de la tarjeta', en: 'Card tools', eu: 'Txartelaren tresnak', gl: 'Ferramentas da tarxeta'
  },
  'editor.targetes.esquerra': {
    ca: 'Esquerra', es: 'Izquierda', en: 'Left', eu: 'Ezkerra', gl: 'Esquerda'
  },
  'editor.targetes.dreta': {
    ca: 'Dreta', es: 'Derecha', en: 'Right', eu: 'Eskuina', gl: 'Dereita'
  },
  'editor.targetes.lleva': {
    ca: 'Llevar la targeta', es: 'Quitar la tarjeta', en: 'Remove the card', eu: 'Kendu txartela', gl: 'Quitar a tarxeta'
  },
  /* Revisió del 261007 (M9, M2-01) · Els textos per al lector del carrusel de
     la portada (CarruselImatges, traduïts a portadaDElement de
     detailSectionMeta.jsx des de l'Esmena 3 del pla 261007_1645). Les d'eu i gl
     són proposta a revisar per algú que les parle. */
  'carrusel.imatgesDe': {
    ca: 'Imatges de {titol}', es: 'Imágenes de {titol}', en: 'Images of {titol}', eu: '{titol}: irudiak', gl: 'Imaxes de {titol}'
  },
  'carrusel.anterior': {
    ca: 'Imatge anterior', es: 'Imagen anterior', en: 'Previous image', eu: 'Aurreko irudia', gl: 'Imaxe anterior'
  },
  'carrusel.seguent': {
    ca: 'Imatge següent', es: 'Imagen siguiente', en: 'Next image', eu: 'Hurrengo irudia', gl: 'Imaxe seguinte'
  },
  'carrusel.diapositives': {
    ca: 'Diapositives', es: 'Diapositivas', en: 'Slides', eu: 'Diapositibak', gl: 'Diapositivas'
  },
  'carrusel.posicio': {
    ca: 'Imatge {n} de {total}', es: 'Imagen {n} de {total}', en: 'Image {n} of {total}', eu: '{n}. irudia, {total} guztira', gl: 'Imaxe {n} de {total}'
  },
  'carrusel.rol': {
    ca: 'carrusel', es: 'carrusel', en: 'carousel', eu: 'karrusela', gl: 'carrusel'
  },
  'carrusel.rolDiapositiva': {
    ca: 'diapositiva', es: 'diapositiva', en: 'slide', eu: 'diapositiba', gl: 'diapositiva'
  },
  /* Esmena 2 del pla 261007_1645 (revisió adversarial del 261007) · «Ja
     publicat», l'històric de l'actor (usePublicacionsDeLActor.js i
     PublicacionsDeLActor.jsx). Les d'eu i gl són proposta a revisar per algú
     que les parle. */
  'section.notes.historic.mur.titol': {
    ca: 'Ja publicat al Mur',
    es: 'Ya publicado en el Muro',
    en: 'Already published on the Wall',
    eu: 'Dagoeneko Horman argitaratuta',
    gl: 'Xa publicado no Muro'
  },
  'section.notes.historic.mur.buit': {
    ca: 'Amb esta identitat encara no hi ha res publicat al Mur.',
    es: 'Con esta identidad todavía no hay nada publicado en el Muro.',
    en: 'Nothing has been published with this identity on the Wall yet.',
    eu: 'Identitate honekin ez dago oraindik ezer argitaratuta Horman.',
    gl: 'Con esta identidade aínda non hai nada publicado no Muro.'
  },
  'section.notes.historic.mercat.titol': {
    ca: 'Ja publicat al Mercat',
    es: 'Ya publicado en el Mercado',
    en: 'Already published in the Market',
    eu: 'Dagoeneko Merkatuan argitaratuta',
    gl: 'Xa publicado no Mercado'
  },
  'section.notes.historic.mercat.buit': {
    ca: 'Amb esta identitat encara no hi ha res publicat al Mercat.',
    es: 'Con esta identidad todavía no hay nada publicado en el Mercado.',
    en: 'Nothing has been published with this identity in the Market yet.',
    eu: 'Identitate honekin ez dago oraindik ezer argitaratuta Merkatuan.',
    gl: 'Con esta identidade aínda non hai nada publicado no Mercado.'
  },
  'section.notes.historic.events.titol': {
    ca: 'Ja publicat a Esdeveniments',
    es: 'Ya publicado en Eventos',
    en: 'Already published in Events',
    eu: 'Dagoeneko Ekitaldietan argitaratuta',
    gl: 'Xa publicado en Eventos'
  },
  'section.notes.historic.events.buit': {
    ca: 'Amb esta identitat encara no hi ha res publicat a Esdeveniments.',
    es: 'Con esta identidad todavía no hay nada publicado en Eventos.',
    en: 'Nothing has been published with this identity in Events yet.',
    eu: 'Identitate honekin ez dago oraindik ezer argitaratuta Ekitaldietan.',
    gl: 'Con esta identidade aínda non hai nada publicado en Eventos.'
  },
  'section.notes.historic.carregant': {
    ca: 'Carregant les publicacions…',
    es: 'Cargando las publicaciones…',
    en: 'Loading the posts…',
    eu: 'Argitalpenak kargatzen…',
    gl: 'Cargando as publicacións…'
  },
  'section.notes.historic.error': {
    ca: 'No s’han pogut carregar les publicacions',
    es: 'No se han podido cargar las publicaciones',
    en: 'The posts could not be loaded',
    eu: 'Ezin izan dira argitalpenak kargatu',
    gl: 'Non se puideron cargar as publicacións'
  },
  'section.notes.historic.fallada': {
    ca: 'La resta de la pàgina continua com sempre.',
    es: 'El resto de la página sigue como siempre.',
    en: 'The rest of the page carries on as usual.',
    eu: 'Orriaren gainerakoak ohi bezala jarraitzen du.',
    gl: 'O resto da páxina segue coma sempre.'
  },
  /* B03 (migració 2610081543, revisió del 261008) · SDP-XAT-016: un directe
     nou amb una persona sense consentiment RGPD. El text no diu el motiu. Les
     d'eu i gl són proposta a revisar per algú que les parle. */
  'section.xat.error.noDisponible': {
    ca: 'Esta persona no està disponible al xat.',
    es: 'Esta persona no está disponible en el chat.',
    en: 'This person is not available in the chat.',
    eu: 'Pertsona hau ez dago erabilgarri txatean.',
    gl: 'Esta persoa non está dispoñible no chat.'
  },
  /* Onada 6 (xat per als beta testers, decisió 5) · Tres codis SDP més que
     arriben a la persona amb text propi (MISSATGES_SDP_HUMANS) i es diuen en
     la llengua de la interfície (errorsXat.js). Les d'eu i gl són proposta a
     revisar per algú que les parle.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
     noMembre (SDP-XAT-003, parla de TU: no constes en este poble) passa a
     dir «Mode Foraster» en les cinc llengües.
     Onada 11 (261010; prompt 261010_1730, tasca 6, D11) · en: «Outsider Mode»
     amb majúscules i «logging out», que casa amb el botó «Log out»
     (section.xat.ajustos.tancaSessio); eu: «arrotz», el terme que ja portava
     el diccionari (section.xat.fake.iaia1), en lloc de «kanpotar»; gl: «pobo»,
     el terme que domina el diccionari gl (nav.pobles, section.xat.padro…), en
     lloc de «vila». L'eu i el gl continuen sent proposta a revisar per algú
     que les parle. */
  'section.xat.error.noMembre': {
    ca: 'Estàs en Mode Foraster: el xat és per a la gent d’este poble. Prova d’eixir i tornar a entrar.',
    es: 'Estás en Modo Forastero: el chat es para la gente de este pueblo. Prueba a salir y volver a entrar.',
    en: 'You are in Outsider Mode: the chat is for the people of this town. Try logging out and back in.',
    eu: 'Arrotz moduan zaude: txata herri honetako jendearentzat da. Saiatu irten eta berriro sartzen.',
    gl: 'Estás en Modo Forasteiro: o chat é para a xente deste pobo. Proba a saír e volver entrar.'
  },
  'section.xat.error.paginaNoVisible': {
    ca: 'Esta pàgina ja no existix o no la pots vore.',
    es: 'Esta página ya no existe o no puedes verla.',
    en: 'This page no longer exists or you cannot see it.',
    eu: 'Orri hau ez dago jada edo ezin duzu ikusi.',
    gl: 'Esta páxina xa non existe ou non a podes ver.'
  },
  'section.xat.error.massaMissatges': {
    ca: 'Has enviat molts missatges en poc de temps. Espera uns segons i torna-ho a provar.',
    es: 'Has enviado muchos mensajes en poco tiempo. Espera unos segundos y vuelve a intentarlo.',
    en: 'You have sent many messages in a short time. Wait a few seconds and try again.',
    eu: 'Mezu asko bidali dituzu denbora gutxian. Itxaron segundo batzuk eta saiatu berriro.',
    gl: 'Enviaches moitas mensaxes en pouco tempo. Agarda uns segundos e téntao de novo.'
  },
  /* Onada 8 (261009) · SDP-XAT-002: cap xat privat amb tu mateix ni amb una
     entitat que representes; i la línia de «En privat» amb el nom de l'autor
     (textosComentar.js). Les d'eu i gl són proposta a revisar per algú que
     les parle. */
  'section.xat.error.ambTuMateix': {
    ca: 'No pots obrir un xat privat amb tu mateix ni amb una entitat que representes.',
    es: 'No puedes abrir un chat privado contigo mismo ni con una entidad que representas.',
    en: 'You cannot open a private chat with yourself or with an organisation you represent.',
    eu: 'Ezin duzu txat pribatu bat ireki zeure buruarekin edo ordezkatzen duzun erakunde batekin.',
    gl: 'Non podes abrir un chat privado contigo mesmo nin cunha entidade que representas.'
  },
  /* Onada 8 (261009, revisió) · SDP-XAT-004: «En privat» amb algú que no és
     d'este poble.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · El
     text passa a dir que la persona és forastera, en les cinc llengües.
     Queda DEROGADA per a esta clau la regla de l'Onada 8 «el text no diu el
     motiu»; SDP-XAT-016 (noDisponible, dalt) continua sense dir-lo. Risc
     conegut i acceptat: el mateix codi també salta per una baixa demanada,
     un id inexistent o una entitat no visible (src/data/supabase/xat.js).
     Les d'eu i gl són proposta a revisar per algú que les parle.
     Onada 11 (261010; prompt 261010_1730, tasca 6, D11) · eu: «arrotza», el
     terme que ja portava el diccionari; gl: «pobo», el que domina el
     diccionari gl. */
  'section.xat.error.noDelPoble': {
    ca: 'Esta persona és forastera en este poble.',
    es: 'Esta persona es forastera en este pueblo.',
    en: 'This person is an outsider in this town.',
    eu: 'Pertsona hau arrotza da herri honetan.',
    gl: 'Esta persoa é forasteira neste pobo.'
  },
  'section.xat.comentar.privat.detallAmb': {
    ca: 'Un xat només entre tu i {nom}',
    es: 'Un chat solo entre tú y {nom}',
    en: 'A chat just between you and {nom}',
    eu: 'Zure eta {nom}-ren arteko txat bat',
    gl: 'Un chat só entre ti e {nom}'
  },
  /* Onada 6 (prompt 261009_0230, punt 4) · «Informa d'un error» i la seua
     plantilla; tasca 12 · l'avís de la IAIA apagada (nivell d'IA 0). */
  'section.xat.informe.boto': {
    ca: "Informa d'un error",
    es: 'Informa de un error',
    en: 'Report a bug',
    eu: 'Jakinarazi akats bat',
    gl: 'Informa dun erro'
  },
  'section.xat.informe.plantilla': {
    ca: 'Què ha passat: \nOn: \nQuè esperaves: \n\n— Dades tècniques, sense dades personals —\nRuta: {ruta}\nVersió: {versio}\nNavegador: {navegador}\nPantalla: {pantalla}',
    es: 'Qué ha pasado: \nDónde: \nQué esperabas: \n\n— Datos técnicos, sin datos personales —\nRuta: {ruta}\nVersión: {versio}\nNavegador: {navegador}\nPantalla: {pantalla}',
    en: 'What happened: \nWhere: \nWhat you expected: \n\n— Technical details, no personal data —\nRoute: {ruta}\nVersion: {versio}\nBrowser: {navegador}\nScreen: {pantalla}',
    eu: 'Zer gertatu da: \nNon: \nZer espero zenuen: \n\n— Datu teknikoak, datu pertsonalik gabe —\nBidea: {ruta}\nBertsioa: {versio}\nNabigatzailea: {navegador}\nPantaila: {pantalla}',
    gl: 'Que pasou: \nOnde: \nQue esperabas: \n\n— Datos técnicos, sen datos persoais —\nRuta: {ruta}\nVersión: {versio}\nNavegador: {navegador}\nPantalla: {pantalla}'
  },
  /* Revisió 261009 · Si el xat de feedback no s'obri (SDP-XAT-003, l'entitat
     absent, la xarxa), la reserva: copiar l'informe o enviar-lo per correu
     ({correu}, l'adreça pública de l'Avís legal) amb l'assumpte. Les d'eu i
     gl són proposta a revisar per algú que les parle. */
  'section.xat.informe.reserva': {
    ca: "No s'ha pogut obrir el xat. Copia l'informe o envia'l per correu a {correu}.",
    es: 'No se ha podido abrir el chat. Copia el informe o envíalo por correo a {correu}.',
    en: 'The chat could not be opened. Copy the report or send it by email to {correu}.',
    eu: 'Ezin izan da txata ireki. Kopiatu txostena edo bidali posta elektronikoz helbide honetara: {correu}.',
    gl: 'Non se puido abrir o chat. Copia o informe ou envíao por correo a {correu}.'
  },
  'section.xat.informe.copia': {
    ca: "Copia l'informe",
    es: 'Copia el informe',
    en: 'Copy the report',
    eu: 'Kopiatu txostena',
    gl: 'Copia o informe'
  },
  'section.xat.informe.correu': {
    ca: "Envia'l per correu",
    es: 'Envíalo por correo',
    en: 'Send it by email',
    eu: 'Bidali posta elektronikoz',
    gl: 'Envíao por correo'
  },
  'section.xat.informe.assumpte': {
    ca: "Informe d'un error a Sóc de Poble",
    es: 'Informe de un error en Sóc de Poble',
    en: 'Bug report for Sóc de Poble',
    eu: 'Akats-txostena: Sóc de Poble',
    gl: 'Informe dun erro en Sóc de Poble'
  },
  'section.xat.iaia.apagada': {
    ca: "La IAIA està apagada (nivell d'IA 0). La pots tornar a encendre a «Realitat».",
    es: 'La IAIA está apagada (nivel de IA 0). Puedes volver a encenderla en «Realitat».',
    en: 'IAIA is switched off (AI level 0). You can switch her back on in «Realitat».',
    eu: 'IAIA itzalita dago (IA maila 0). «Realitat» atalean piztu dezakezu berriro.',
    gl: 'A IAIA está apagada (nivel de IA 0). Podes volver acendela en «Realitat».'
  },
  /* Onada 5 (ordre del Mestre, 261008) · El botó blau de la pàgina d'un poble
     ({gent}, l'entitat de l'H1: «Parlar amb la Gent de la Torre»). Les d'eu i
     gl són proposta a revisar per algú que les parle; en basc, el nom no porta
     el sufix de companyia (-rekin) enganxat. */
  'section.detail.pobles.parlarAmb': {
    ca: 'Parlar amb la {gent}',
    es: 'Hablar con la {gent}',
    en: 'Talk with {gent}',
    eu: 'Hitz egin {gent} komunitatearekin',
    gl: 'Falar coa {gent}'
  },
  /* Onada 6 (pla 261009_0245, ítem 5) · La barra de pestanyes de la pàgina
     d'un poble (el nom del tablist) i el panell «Gent de …» (buit, carregant
     i error). Les d'eu i gl són proposta a revisar per algú que les parle. */
  'section.detail.pobles.pestanyes': {
    ca: 'Continguts del poble',
    es: 'Contenidos del pueblo',
    en: 'Town content',
    eu: 'Herriko edukiak',
    gl: 'Contidos do pobo'
  },
  'section.detail.pobles.gent.buit': {
    ca: 'Encara no hi ha cap publicació des d’este poble.',
    es: 'Todavía no hay ninguna publicación desde este pueblo.',
    en: 'There are no posts from this town yet.',
    eu: 'Oraindik ez dago herri honetako argitalpenik.',
    gl: 'Aínda non hai ningunha publicación dende este pobo.'
  },
  'section.detail.pobles.gent.carregant': {
    ca: 'Carregant les publicacions del poble…',
    es: 'Cargando las publicaciones del pueblo…',
    en: 'Loading the town’s posts…',
    eu: 'Herriko argitalpenak kargatzen…',
    gl: 'Cargando as publicacións do pobo…'
  },
  'section.detail.pobles.gent.error': {
    ca: 'No s’han pogut carregar les publicacions del poble',
    es: 'No se han podido cargar las publicaciones del pueblo',
    en: 'The town’s posts could not be loaded',
    eu: 'Ezin izan dira herriko argitalpenak kargatu',
    gl: 'Non se puideron cargar as publicacións do pobo'
  },
  /* Onada 8 (261009; requeriments 261009_1300, punt 2) · El botó gran de la
     Consola i del Cervell, pàgines del sistema (systemPages.js). Les d'eu i
     gl són proposta a revisar per algú que les parle. */
  'section.consola.obrir': {
    ca: 'Obrir la Consola', es: 'Abrir la Consola', en: 'Open the Console', eu: 'Ireki Kontsola', gl: 'Abrir a Consola'
  },
  'section.cervell.obrir': {
    ca: 'Obrir el Cervell', es: 'Abrir el Cerebro', en: 'Open the Brain', eu: 'Ireki Garuna', gl: 'Abrir o Cerebro'
  },
  /* Pla 261014_1450 (front C) · El peu del rail amb una entitat activa i la
     línia del compositor que diu qui signa. Les d'eu i gl són proposta a
     revisar per algú que les parle. */
  'section.xat.ajustos.obriComEntitat': {
    ca: 'Tu: ajustos (actues com a {nom})',
    es: 'Tú: ajustes (actúas como {nom})',
    en: 'You: settings (acting as {nom})',
    eu: 'Zu: ezarpenak ({nom} gisa ari zara)',
    gl: 'Ti: axustes (actúas como {nom})'
  },
  'section.xat.signa.entitat': {
    ca: 'Escrius com a {nom}.',
    es: 'Escribes como {nom}.',
    en: 'You are writing as {nom}.',
    eu: '{nom} gisa idazten ari zara.',
    gl: 'Escribes como {nom}.'
  },
  'section.xat.signa.persona': {
    ca: 'Escrius com a tu: en esta conversa no parles en nom de {entitat}.',
    es: 'Escribes como tú: en esta conversación no hablas en nombre de {entitat}.',
    en: 'You are writing as yourself: in this conversation you do not speak for {entitat}.',
    eu: 'Zeure izenean idazten ari zara: elkarrizketa honetan ez zara {entitat}-(r)en izenean ari.',
    gl: 'Escribes como ti: nesta conversa non falas en nome de {entitat}.'
  }
};

/* Correcció de la revisió (260930) · Parelles on la traducció correcta és la
   mateixa paraula que en valencià (es i gl «Compartir»). La comprovació
   «≠ valencià» de baix servix per a detectar una llengua que cau al valencià
   per falta d'entrada; per a estes parelles, eixa falta la detecta igualment
   el recompte «una sola aparició per llengua», que continua obligatori, i el
   text exacte es continua comprovant. Les claus anteriors no en tenen cap.
   261004 (T7) · «Inserir» és també la forma gallega del botó i «Publicar»
   és igual en valencià, castellà i gallec. */
const IGUALS_AL_VALENCIA = Object.freeze({
  'section.notes.compartir': ['es', 'gl'],
  'section.control.porta.publicar': ['es', 'gl'],
  'editor.targetes.dialeg.inserir': ['gl'],
  /* 261007 (M9) · El nom del patró de l'APG és el mateix en castellà i en gallec. */
  'carrusel.rol': ['es', 'gl'],
  'carrusel.rolDiapositiva': ['es', 'gl']
});

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

describe('claus i18n del torn T1–T4', () => {
  test('les cinc llengües de la taula són les del selector', () => {
    for (const textos of Object.values(CLAUS)) expect(Object.keys(textos).sort()).toEqual([...LLENGUES].sort());
  });

  for (const [clau, textos] of Object.entries(CLAUS)) {
    test(`${clau}: valor propi en cada llengua i text exacte`, () => {
      const valenciana = createTranslator('ca')(clau);
      expect(valenciana).toBe(textos.ca);
      for (const codi of LLENGUES) {
        const valor = createTranslator(codi)(clau);
        expect([codi, valor === clau]).toEqual([codi, false]);
        expect([codi, valor]).toEqual([codi, textos[codi]]);
        // Una llengua sense entrada cauria en el valencià: ha de tindre la seua.
        const igualPermes = IGUALS_AL_VALENCIA[clau]?.includes(codi) ?? false;
        if (codi !== 'ca' && !igualPermes) expect([codi, valor === valenciana]).toEqual([codi, false]);
      }
    });

    test(`${clau}: una sola aparició per llengua al diccionari`, () => {
      const vegades = fontI18n.split(`'${clau}':`).length - 1;
      expect([clau, vegades]).toEqual([clau, LLENGUES.length]);
    });
  }

  /* Correcció de la revisió (260930) · El text de reserva de qui crida la
     clau és el valor valencià: si divergixen, el valencià depén de si la clau
     existix o no al diccionari. */
  const FONTS = {
    NotesEditor: fontNotesEditor, destinsControl: fontDestinsControl, EstatErrorDades: fontEstatError, CalendariSection: fontCalendari,
    MarcaAmfitrio: fontMarcaAmfitrio, estatConnexio: fontEstatConnexio
  };
  /* Ordre del Mestre, 261001 · Les tres claus del Calendari: la reserva de
     l'error ja porta l'apòstrof tipogràfic («s’han»), el mateix del
     diccionari. */
  test.each([
    ['section.notes.connexio.titol', 'NotesEditor'],
    ['section.notes.connexio.altri', 'NotesEditor'],
    ['section.notes.compartir', 'NotesEditor'],
    ['section.control.porta.publicar', 'destinsControl'],
    ['section.control.porta.saberMes', 'destinsControl'],
    ['error.servidor', 'EstatErrorDades'],
    ['section.calendari.title', 'CalendariSection'],
    ['section.calendari.subtitle', 'CalendariSection'],
    ['section.calendari.error', 'CalendariSection'],
    ['amfitrio.node', 'MarcaAmfitrio'],
    ['amfitrio.nodeConnectant', 'MarcaAmfitrio'],
    ['amfitrio.nodeSenseConnexio', 'MarcaAmfitrio'],
    ['amfitrio.mesInfo', 'MarcaAmfitrio'],
    ['amfitrio.tanca', 'MarcaAmfitrio'],
    ['connexio.activa', 'estatConnexio'],
    ['connexio.connectant', 'estatConnexio'],
    ['connexio.sense', 'estatConnexio']
  ])('%s: la reserva de %s és el valor valencià', (clau, fitxer) => {
    const font = FONTS[fitxer];
    const crida = fitxer === 'destinsControl'
      ? `['${clau}', '${CLAUS[clau].ca}']`
      : `t('${clau}', '${CLAUS[clau].ca}')`;
    expect([clau, font.includes(crida)]).toEqual([clau, true]);
  });

  /* 261004 (T5) · La reserva de VistaMultimedia viu a TEXTOS_MULTIMEDIA com
     a parells [clau, text]: el text de cada parell és el valor valencià. */
  test('les reserves de TEXTOS_MULTIMEDIA són els valors valencians', () => {
    const { buit, adjunts, avisLocal, obri, senseData } = TEXTOS_MULTIMEDIA;
    const parells = [buit.fitxers, buit.enllacos, buit.documents, adjunts, avisLocal, obri, senseData];
    expect(parells.map(([clau]) => clau).sort()).toEqual(Object.keys(CLAUS).filter((clau) => clau.startsWith('section.xat.vista.multimedia.')).sort());
    for (const [clau, reserva] of parells) expect([clau, reserva]).toEqual([clau, CLAUS[clau].ca]);
  });

  /* 261004 (T6) · La reserva de Comentar viu a AVISOS_XAT_CORPORATIU com a
     parells [clau, text]: el text de cada parell és el valor valencià. */
  test('les reserves d’AVISOS_XAT_CORPORATIU són els valors valencians', () => {
    const { noDisponible, resolent } = AVISOS_XAT_CORPORATIU;
    expect([noDisponible, resolent].map(([clau]) => clau).sort())
      .toEqual(Object.keys(CLAUS).filter((clau) => clau.startsWith('section.control.xatCorporatiu.')).sort());
    for (const [clau, reserva] of [noDisponible, resolent]) expect([clau, reserva]).toEqual([clau, CLAUS[clau].ca]);
  });

  /* 261004 (T7) · Les claus editor.targetes.* del front de la targeta
     incrustada: cada clau de la taula la crida el front amb la reserva
     valenciana, com t('clau', 'text') o com a parell ['clau', 'text']; i
     cap clau del front queda fora de la taula. */
  test('les reserves del front de targetes són els valors valencians', () => {
    const font = `${fontDialegTriaTargeta}\n${fontTargetaIncrustada}`;
    const deLaTaula = Object.keys(CLAUS).filter((clau) => clau.startsWith('editor.targetes.'));
    for (const clau of deLaTaula) {
      const reserva = CLAUS[clau].ca;
      expect([clau, font.includes(`t('${clau}', '${reserva}')`) || font.includes(`['${clau}', '${reserva}']`)]).toEqual([clau, true]);
    }
    const delFront = [...new Set([...font.matchAll(/'(editor\.targetes\.[\w.]+)'/g)].map((m) => m[1]))].sort();
    expect(delFront).toEqual([...deLaTaula].sort());
  });

  /* Revisió del 261007 (M9) · La portada (portadaDElement, Esmena 3 del pla
     261007_1645) crida cada clau del carrusel amb la reserva valenciana, i cap
     clau carrusel.* queda fora de la taula. */
  test('les reserves del carrusel de la portada són els valors valencians', () => {
    const deLaTaula = Object.keys(CLAUS).filter((clau) => clau.startsWith('carrusel.'));
    for (const clau of deLaTaula) {
      expect([clau, fontPortada.includes(`t('${clau}', '${CLAUS[clau].ca}')`)]).toEqual([clau, true]);
    }
    const delFront = [...new Set([...fontPortada.matchAll(/'(carrusel\.[\w.]+)'/g)].map((m) => m[1]))].sort();
    expect(delFront).toEqual([...deLaTaula].sort());
  });

  /* Esmena 2 del pla 261007_1645 (revisió adversarial del 261007) · L'històric
     de l'actor crida cada clau section.notes.historic.* amb la reserva
     valenciana: el hook com a parell ['clau', 'text'] i el component com a
     tradueix('clau', 'text'); i cap clau del front queda fora de la taula. */
  test('les reserves de l’històric de l’actor són els valors valencians', () => {
    const font = `${fontHistoric}\n${fontPublicacionsActor}`;
    const deLaTaula = Object.keys(CLAUS).filter((clau) => clau.startsWith('section.notes.historic.'));
    expect(deLaTaula).toHaveLength(9);
    for (const clau of deLaTaula) {
      const reserva = CLAUS[clau].ca;
      const crida = font.includes(`['${clau}', '${reserva}']`) || font.includes(`tradueix('${clau}', '${reserva}')`);
      expect([clau, crida]).toEqual([clau, true]);
    }
    const delFront = [...new Set([...font.matchAll(/'(section\.notes\.historic\.[\w.]+)'/g)].map((m) => m[1]))].sort();
    expect(delFront).toEqual([...deLaTaula].sort());
  });

  /* B03 (revisió del 261008) · El text que l'adaptador del xat posa a l'error
     SDP-XAT-016 (MISSATGES_SDP_HUMANS de src/data/supabase/xat.js) és el valor
     valencià de la clau: la interfície la tradueix pel `code` amb eixe text de
     reserva, i les dues formes no es poden desfasar. */
  test('la reserva de SDP-XAT-016 a l’adaptador del xat és el valor valencià', () => {
    const clau = 'section.xat.error.noDisponible';
    expect([clau, fontAdaptadorXat.includes(`'SDP-XAT-016': '${CLAUS[clau].ca}'`)]).toEqual([clau, true]);
  });

  /* Onada 6 (decisió 5) · Els tres codis nous: la reserva de l'adaptador és
     el valor valencià de la seua clau. */
  test.each([
    ['SDP-XAT-002', 'section.xat.error.ambTuMateix'],
    ['SDP-XAT-003', 'section.xat.error.noMembre'],
    ['SDP-XAT-004', 'section.xat.error.noDelPoble'],
    ['SDP-XAT-013', 'section.xat.error.paginaNoVisible'],
    ['SDP-XAT-429', 'section.xat.error.massaMissatges']
  ])('la reserva de %s a l’adaptador del xat és el valor valencià de %s', (codi, clau) => {
    expect([clau, fontAdaptadorXat.includes(`'${codi}': '${CLAUS[clau].ca}'`)]).toEqual([clau, true]);
  });

  /* Onada 5 (ordre del Mestre, 261008) · El botó del xat de la pàgina d'un
     poble (buildPoblesDetailSectionMeta de detailSectionMeta.jsx) crida la
     clau amb la reserva valenciana. */
  test('la reserva del botó del xat del poble és el valor valencià', () => {
    const clau = 'section.detail.pobles.parlarAmb';
    expect([clau, fontPortada.includes(`t('${clau}', '${CLAUS[clau].ca}')`)]).toEqual([clau, true]);
  });

  /* Onada 6 (pla 261009_0245, ítem 5) · Les pestanyes de la pàgina d'un poble
     (detailSectionMeta.jsx) i els textos del panell «Gent de …»
     (pobles/usePublicacionsDelPoble.js · textosDelPoble) criden cada clau amb
     la reserva valenciana; cap clau del front queda fora de la taula. */
  test('les reserves de les pestanyes del poble són els valors valencians', () => {
    const font = `${fontPortada}\n${fontTextosDelPoble}`;
    const deLaTaula = Object.keys(CLAUS).filter((clau) => clau.startsWith('section.detail.pobles.') && clau !== 'section.detail.pobles.parlarAmb');
    expect(deLaTaula).toHaveLength(4);
    for (const clau of deLaTaula) {
      const reserva = CLAUS[clau].ca;
      const crida = font.includes(`t('${clau}', '${reserva}')`) || font.includes(`tradueix('${clau}', '${reserva}')`);
      expect([clau, crida]).toEqual([clau, true]);
    }
    const delFront = [...new Set([...fontTextosDelPoble.matchAll(/'(section\.detail\.pobles\.[\w.]+)'/g)].map((m) => m[1]))].sort();
    expect(delFront.every((clau) => deLaTaula.includes(clau))).toBe(true);
  });

  /* Onada 8 (261009) · El botó «Obrir…» de la Consola i del Cervell
     (systemPages.js) crida cada clau com a parell ['clau', 'reserva'], i la
     reserva és el valor valencià. */
  test.each([['section.consola.obrir'], ['section.cervell.obrir']])('%s: la reserva de systemPages.js és el valor valencià', (clau) => {
    expect([clau, fontSystemPages.includes(`['${clau}', '${CLAUS[clau].ca}']`)]).toEqual([clau, true]);
  });

  /* T7 (261001) · amfitrio.servidor («Estàs al servidor de …») queda retirada
     de les cinc llengües: el traductor torna la clau mateixa. */
  test('amfitrio.servidor ja no existix en cap llengua', () => {
    for (const codi of LLENGUES) expect([codi, createTranslator(codi)('amfitrio.servidor')]).toEqual([codi, 'amfitrio.servidor']);
    expect(fontI18n.includes(`'amfitrio.servidor':`)).toBe(false);
  });
});
