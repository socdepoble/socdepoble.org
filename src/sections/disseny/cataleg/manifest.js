
/* `icon`: emoji de la categoria (NavGlyph). Amb la columna plegada, el rail
   només ensenya el glif: cada categoria de Disseny s'ha de reconéixer per ell. */
export const CATALOG_CATEGORIES = [
  { id: 'fonaments', label: 'Fonaments', order: 10, icon: '🧱' },
  { id: 'estructura', label: 'Estructura', order: 20, icon: '📐' },
  { id: 'formularis', label: 'Formularis', order: 30, icon: '📝' },
  { id: 'superposicions', label: 'Superposicions', order: 40, icon: '🗂️' },
  { id: 'retroalimentacio', label: 'Retroalimentació', order: 50, icon: '🔔' },
  { id: 'navegacio', label: 'Navegació', order: 60, icon: '🧭' },
  { id: 'inventari', label: 'Inventari', order: 70, icon: '📦' },
  { id: 'emoticones', label: 'Emojis XL', order: 80, icon: '🌻' }
];

/* Ordre del Mestre (261007) · «Substitueix el maó genèric (🧱) per emojis
   distints i amb sentit semàntic per a cada espècimen». Cada espècimen porta
   el seu emoji propi (`icon`): la fitxa de la llista el pinta XL (ItemMedia)
   i el rail plegat, al seu glif. Abans tots heretaven el de la categoria.
   Per categoria i per slug, sense repetits dins d'una categoria; les
   categories conserven el seu (CATALOG_CATEGORIES). Tots són emojis RGI de
   Unicode 13 o anteriors, que es veuen a Safari 16 (manifest.icones.test.js
   ho comprova, i que cap espècimen no se'n queda sense). */
export const ICONES_ESPECIMENS = Object.freeze({
  fonaments: Object.freeze({
    panell: '🎛️', contracte: '📜', color: '🎨', tipografia: '🔤', espaiat: '📏',
    universalcard: '🃏', 'targeta-viva': '✍️', 'controls-barra': '🔘', 'emoticona-barra': '😀',
    avatar: '👤', botonera: '🔗', taula: '🧮', indicador: '📈',
    xat: '💬', 'xat-llista': '📇', 'xat-cerca': '🔎', 'xat-comunitats': '🏘️',
    'cerca-filtres': '🎚️', 'tasques-fitxers': '✅', 'media-externa': '🎬', utilitats: '🧰',
    identitat: '🎭', 'linia-del-temps': '🕰️', histograma: '📊',
    articles: '🏷️', colleccio: '🛍️', 'imatge-apaisada': '🌄', 'graella-targetes': '🎴',
    'icones-alergens': '🥜', 'carrusel-imatges': '🎠',
    /* Esmena 2 del pla 261007_1645 · el que l'actor ja té publicat. */
    'publicacions-actor': '📚'
  }),
  estructura: Object.freeze({
    arbre: '🌳', shell: '🐚', page: '📄', gestor: '🏛️', universalworkspace: '🖥️',
    columnes: '📰', divisor: '↔️', composicio: '🧩', 'barra-eines': '🛠️',
    'marc-columna': '🖼️', 'esquelet-bar': '🍺', 'esquelet-compra': '🛒', 'pagina-app': '📱',
    'universal-tpv': '🏪'
  }),
  formularis: Object.freeze({
    boto: '🆗', camp: '✏️', opcions: '☑️', pindola: '💊', cerca: '🔍',
    'formulari-complex': '📋', calendari: '📅', 'drets-autor': '©️', classificacio: '🔖',
    rajola: '🀄', 'teclat-numeric': '🔢', 'afegit-rapid': '➕'
  }),
  navegacio: Object.freeze({
    pestanyes: '📑', molla: '🍞', paginacio: '⏭️', acordio: '🪗', 'nav-mobil': '📲',
    'xat-rail': '🛤️', 'seccions-categoria': '↕️',
    /* Ordre del Mestre (261012, vespre) · el botó de damunt de «Pobles». */
    'tornar-dalt': '🔝'
  }),
  retroalimentacio: Object.freeze({
    alerta: '⚠️', insignia: '📛', buit: '📭', carrega: '⏳', progres: '🔋',
    'estat-desament': '☁️', 'resum-connexio': '👀', connexio: '🟢'
  }),
  superposicions: Object.freeze({
    dialeg: '🪟', confirmacio: '❓', calaix: '🗄️', 'pantalla-completa': '📺', pista: '💡',
    menu: '🍽️', 'xat-nova-conversa': '🆕', 'xat-ajustos': '⚙️', visibilitat: '🌍',
    toast: '📣', enquadrament: '✂️', impressio: '🖨️', 'detall-article': '🔬',
    /* Onada 0.3 (Gauntlet 261016) · el visor de fotos de l'Arxiu visual. */
    'visor-imatges': '📸'
  }),
  inventari: Object.freeze({ global: '🗃️' }),
  emoticones: Object.freeze({ xl: '🌻' })
});

/* Un espècimen del catàleg. L'id és `categoria-slug` i el carregador,
   `categoria/slug` (detailRegistry.jsx; allLoaders.test.jsx comprova que els
   dos conjunts coincidixen). Etiquetes: el nivell atòmic primer (atom,
   molecula, organisme, plantilla) i després el tema.
   `lead` és la fitxa editorial: l'entradilla de la pàgina. Sense lead,
   DesignSection diu honestament «En curs» (editorial.test.js ho fixa per al
   Contracte i per a la Closca, que encara no en tenen).
   `icon` ix d'ICONES_ESPECIMENS (ordre del Mestre, 261007); sense entrada,
   cap (la fitxa hereta el de la categoria, i la prova ho denuncia). */
const propia = (mapa, clau) => (mapa && Object.prototype.hasOwnProperty.call(mapa, clau) ? mapa[clau] : null);
const especimen = (categoria, slug, title, subtitle, tags, lead, cerca = '') => {
  const icon = propia(propia(ICONES_ESPECIMENS, categoria), slug);
  return {
    id: `${categoria}-${slug}`,
    categoryIds: [categoria],
    kind: 'component-doc',
    title,
    subtitle,
    tags,
    ...(lead ? { lead } : {}),
    ...(icon ? { icon } : {}),
    searchText: `${title} ${subtitle} ${tags.join(' ')} ${cerca}`.trim().toLowerCase(),
    detailKey: `${categoria}/${slug}`,
    status: 'viu'
  };
};

/* Fonaments: les lleis del sistema i les peces que no són formularis ni
   navegació. L'ordre és el de lectura: contracte → color → tipografia →
   espaiat → targeta mestra → controls → àtoms → maquetes heretades. */
const FONAMENTS = [
  especimen('fonaments', 'panell', 'Panell de Disseny', 'Ajustos del mode Bancal, ombres i lletra', ['sistema', 'ajustos', 'bancal'],
    'Sistema de control viu. Gestió del contrast (Mode Bancal), la intensitat de les ombres universals i la tipografia (Noto Sans), amb botons per modelar l\'arquitectura de pedra seca des de dins del propi sistema. Disposa de restabliment i exemples aplicats al moment.',
    'panell disseny ajustos contrast bancal ombra lletra restablir human'),
  especimen('fonaments', 'contracte', 'Contracte de Pedra Seca', 'Lleis, arquitectura universal i pàgines de sistema', ['llei', 'arquitectura', 'sistema']),
  especimen('fonaments', 'color', 'Identitat cromàtica', 'Paleta OKLCH, contrast i escala Pedra', ['token', 'color', 'contrast'],
    'La paleta de Sóc de Poble en OKLCH: tokens semàntics per a fons, text i accents, amb el contrast comprovat en clar i en fosc. Cap component pinta amb un color cru.'),
  especimen('fonaments', 'tipografia', 'Estudi tipogràfic', 'Noto Sans, nivells de títol i ritme vertical', ['token', 'tipografia', 'ritme'],
    'Una sola família, Noto Sans, amb nivells de títol fixos i ritme vertical de lectura. Pensada per a llegir al sol i per a la gent gran.'),
  especimen('fonaments', 'espaiat', 'Espaiat i graella', 'Escala 4/8, mètriques del layout i radis', ['token', 'espaiat', 'graella'],
    'L’escala 4/8 de marges, coixins i separacions, i les mètriques amb nom del layout: alçades de barra, amplades de columna i radis. Cap número solt.'),
  especimen('fonaments', 'universalcard', 'UniversalCard', 'PedraSeca/organismes/UniversalCard.jsx', ['organisme', 'targeta', 'contingut'],
    'La targeta mestra: tota publicació hereta la mateixa anatomia. És una versió reduïda de PageFrame (capçalera taronja d’autoria, mitjà quadrat, cos i peu blau d’accions) amb codi propi: un canvi a les barres no hi arriba sol.',
    /* P5 · Onada 4 (261003) · la targeta de doble acció del Panell de Control (PortesTargeta),
       amb l'ESMENA 261003 22:34: la targeta estàndard amb la boina de socdepoble. */
    'targeta plana pla emoticona ancorar pin avis portes porta doble accio publicar saber mes control obres socdepoble xat'),
  /* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · la targeta del document que s'escriu.
     Bloc 3.4 del Gauntlet (261016) · Sense l'aside de la dreta de l'editor ni el seu xip: cap editor els munta. */
  especimen('fonaments', 'targeta-viva', 'Targeta viva', 'TargetaViva · BotoTargetaViva (T50)', ['organisme', 'targeta', 'editor'],
    'La targeta del document mentre s’escriu, amb la mateixa anatomia que tindrà publicada: la fitxa activa de la llista i, al Perfil, també en línia a l’apartat «Les vistes». Cap editor la munta al costat: l’aside de la dreta i el xip «Vista targeta» s’han retirat. Els botons no fan res: ho diu un avís.',
    'previsualitzacio vista targeta xip aside llista dreta notes perfil vistes'),
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · s'hi afig RellotgeViu, la data i
     l'hora d'ara, vives, a la dreta de la barra taronja de les apps que la demanen. */
  especimen('fonaments', 'controls-barra', 'Controls de barra', 'BarraBlava · BarraTaronja · IconButton · ActionControl · DateTimeControl · RellotgeViu', ['atom', 'barra', 'icona'],
    'Les dues barres de color de PageFrame, ja components propis (BarraBlava i BarraTaronja), i els àtoms que les omplin. La capçalera i el peu de la UniversalCard fan servir els mateixos àtoms.',
    'pin ancorar data hora pastilla rellotge viu ara minut'),
  /* T51 (ordre del Mestre, 260928) · l'espai central de la barra taronja. */
  especimen('fonaments', 'emoticona-barra', 'Emoticona de la barra', 'EmoticonaBarra · l’espai central de la barra taronja (T51)', ['molecula', 'barra', 'emoticona'],
    'Al centre de la barra taronja. En edició, el botó que obri el diàleg d’emoticona: la ploma blanca mentre no n’hi ha cap. En lectura, només l’emoticona triada; sense, la cel·la queda buida.',
    'ploma emoji emoticona triar centre'),
  especimen('fonaments', 'avatar', 'Avatar', 'PedraSeca/atoms/Avatar.jsx', ['atom', 'persona'],
    'La cara d’una persona o d’una entitat, en mides tancades i sempre quadrada. Sense foto, les inicials.'),
  especimen('fonaments', 'botonera', 'Botonera', 'PedraSeca/molecules/Botonera.jsx', ['molecula', 'navegacio', 'pindola'],
    'Menú de navegació amb forma de píndoles i enllaços de veres (aria-current): obrir en una pestanya nova funciona.'),
  especimen('fonaments', 'taula', 'Taula', 'PedraSeca/organismes/Taula.jsx', ['organisme', 'dades'],
    'Taula de dades nativa dins d’una regió desplaçable amb nom, que es pot recórrer amb el teclat.'),
  especimen('fonaments', 'indicador', 'Indicadors i estadístiques', 'UniversalIndicatorCard i targetes d’estadística', ['organisme', 'dades', 'maqueta'],
    'La targeta indicadora marca un estat o un filtre actiu. Davall, les targetes d’estadística encara són la maqueta heretada.'),
  especimen('fonaments', 'xat', 'Xat i missatgeria', 'Fila de conversa, bombolles, marques d’estat, capçalera i compositor', ['xat', 'conversa', 'bombolla'],
    'Les peces del Xat tal com es munten sobre AppGridShell: fila de conversa, bombolles, marques d’estat, la capçalera de la conversa (també d’una pàgina i dels Avisos) i el compositor.',
    'capcalera sobre participants avisos megafon xat public pagina'),
  /* Onada 3B (Pedra Seca §9) · les peces noves del Xat, cadascuna amb el seu espècimen. */
  especimen('fonaments', 'xat-llista', 'Xat · llista de converses', 'MenuLlista · BarraSeleccio · FilaConversa · FilaComunitat', ['organisme', 'xat', 'llista'],
    'La columna de llista calcada de WhatsApp Desktop: el «…» amb «Seleccionar xats», la barra de la selecció i les files de grup, de comunitat i de canal.',
    'seleccionar xats casella comunitat canal avisos grup megafon'),
  especimen('fonaments', 'xat-cerca', 'Xat · cerca global', 'FiltresCerca · ResultatsCercaXat · la fitxa del filtre', ['organisme', 'xat', 'cerca'],
    'La cerca del Xat: la llista vertical de filtres, la fitxa del filtre dins del camp i els resultats en tres grups, amb els estats buits que diuen la veritat.',
    'filtres fotos enllacos resultats persones missatges'),
  especimen('fonaments', 'xat-comunitats', 'Xat · comunitats', 'FitxaComunitat · VistaComunitats', ['organisme', 'xat', 'comunitat'],
    'Les comunitats: la fitxa a la columna de llista i la vista «Comunitats» de la columna central, amb els Avisos primer, els grups i «Veure-ho tot».',
    'comunitat fitxa avisos grups veure tot'),
  /* Des de T45 l'espècimen de cerca pinta components reals: ja no és maqueta. */
  especimen('fonaments', 'cerca-filtres', 'Cerca i filtratge', 'Cercador, filtres i resultats', ['organisme', 'cerca', 'filtre'],
    'Els patrons de cerca amb components reals: UniversalSearch al gestor, la cerca amb filtres dins d’un formulari, els filtres per tipus (PillToggle) i la llista de ResultatCerca.'),
  especimen('fonaments', 'tasques-fitxers', 'Tasques i fitxers', 'Checklists, pujades i descàrregues', ['maqueta', 'fitxers'],
    'Llistes de comprovació, zona per a arrossegar fitxers i targeta de descàrrega amb nom, format i pes.'),
  especimen('fonaments', 'media-externa', 'Media externa', 'Vídeo, mapa i àudio incrustats', ['maqueta', 'media'],
    'Vídeo, mapa i àudio de tercers dins d’un contenidor de proporció fixa, amb peu de foto i alternativa en text.'),
  especimen('fonaments', 'utilitats', 'Utilitats i peus', 'Pistes, llistes, divisors, classes i composició', ['maqueta', 'utilitat'],
    'Les peces menudes de la pàgina: pistes, llistes editorials, divisors, classes utilitàries i peus.'),
  /* T43 (ordre del Mestre, 260928) · identitat activa a la barra negra i administrar organitzacions. */
  especimen('fonaments', 'identitat', 'Identitat activa', 'BotoIdentitatActiva · CalaixIdentitats · TargetaAdministrar (T43)', ['organisme', 'identitat', 'organitzacio'],
    'La barra negra diu sempre amb qui actues: una persona, o una entitat amb el seu logo o les seues inicials. El calaix «Amb qui actues?» deixa canviar d’identitat.',
    'avatar barra negra calaix amb qui actues administrar entitat'),
  /* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · els apunts amb hora i les barres de CSS. */
  especimen('fonaments', 'linia-del-temps', 'Línia del temps', 'PedraSeca/organismes/LiniaDelTemps.jsx', ['organisme', 'dades', 'temps'],
    'Apunts en vertical amb l’hora a l’esquerra i una marca sobre l’eix. Cada apunt és un enllaç (la tria viu a la URL), un botó o text quiet.',
    'linia temps apunts hora jornada torn diari historial'),
  especimen('fonaments', 'histograma', 'Histograma', 'PedraSeca/organismes/Histograma.jsx', ['organisme', 'dades', 'grafic'],
    'Barres verticals fetes només amb CSS: l’alçada és una classe de nivell de 0 a 10, sense style= ni llibreries de gràfics. El lector de pantalla llig el valor sencer de cada barra.',
    'histograma barres grafic hores setmana nivell')
];

/* Estructura: primer l'arbre (qui és el pare de qui), després la closca
   d'App.jsx i les plantilles que penjen d'ella. */
const ESTRUCTURA = [
  especimen('estructura', 'arbre', 'Arbre universal', 'Qui és el pare de qui: closca, gestor, pàgina, targeta i editor', ['plantilla', 'arquitectura'],
    'El mapa de les peces universals. La closca d’App.jsx conté el gestor (UniversalWorkspace → AppGridShell) i la pàgina (UniversalPage → PageFrame). L’editor instancia PageFrame amb ranures i n’hereta els canvis; la targeta n’és una versió reduïda i no n’hereta res. Cada espècimen diu d’on penja.',
    'pare fill jerarquia llinatge munta versio instancia'),
  /* Sense subtítol, etiquetes ni lead: editorial.test.js hi fixa «En curs». */
  especimen('estructura', 'shell', 'Closca (Shell)', '', [], null, 'app.jsx barra negra barra lateral main navegacio mobil'),
  especimen('estructura', 'page', 'Page', 'UniversalPage → PageFrame, el pare universal de pàgina', ['plantilla', 'pagina'],
    'L’anatomia de tota pàgina: barra blava de navegació, imatge, barra taronja d’autoria, capçalera amb el títol i article. UniversalPage l’adapta a la ruta; PageFrame és el pare que la pinta.'),
  especimen('estructura', 'gestor', 'Gestor', 'AppGridShell · graella de tres columnes', ['plantilla', 'columnes'],
    'La graella de tres columnes: mesura el seu contenidor i passa d’ample a mitjà i a estret. UniversalWorkspace l’omple; AppGridColumn en fa les capçaleres i AppGridResizer, els separadors.'),
  especimen('estructura', 'universalworkspace', 'UniversalWorkspace', 'Espai de treball de tres columnes', ['plantilla', 'espai', 'columnes'],
    'El pare dels gestors (Notes, Disseny, la Wiki, Perfil i Admin): rep dades i funcions de pintat i munta AppGridShell amb navegació, llistat i detall. No sap res de cap domini. El Xat no en penja: munta AppGridShell directament.',
    'universal workspace'),
  especimen('estructura', 'columnes', 'Columnes', 'AppGridColumn · capçaleres de columna', ['plantilla', 'columnes', 'capcalera'],
    'La capçalera única de cada columna d’AppGridShell, en les seues variants: oberta, replegable sencera, amb el grup plegable i carril plegat.'),
  especimen('estructura', 'divisor', 'Divisor', 'Divisor (PedraSeca) · AppGridResizer (layout)', ['atom', 'separador'],
    'Dues peces que compartien nom: el Divisor, àtom de Pedra Seca que separa blocs, i AppGridResizer, la vora arrossegable entre columnes d’AppGridShell, que es mou també amb el teclat.',
    'splitter redimensionador'),
  especimen('estructura', 'composicio', 'Composició', 'Pila · Fila · Graella · Costat · Centre · Superficie', ['plantilla', 'contenidor'],
    'Els contenidors de maquetació de Pedra Seca: apilar, posar en fila, graella fluida, barra lateral amb contingut, amplada de lectura i superfície. Els espais són sempre de l’escala --sdp-space-N.',
    'stack row grid sidebar center surface'),
  especimen('estructura', 'barra-eines', 'Barra d’eines de l’editor', 'UniversalToolbar · no és la barra blava', ['organisme', 'editor'],
    'La barra d’eines de l’editor: format del text, Borrar i Publicar. És muda: només rep l’estat i les accions. Per davall de 500px d’ample, el format es plega darrere de «Aa».',
    'toolbar format negreta cursiva titol publicar borrar')
];

const FORMULARIS = [
  especimen('formularis', 'boto', 'Boto', 'PedraSeca/atoms/Boto.jsx', ['atom', 'accio'],
    'L’única manera de fer un botó: cinc varietats de pes visual, dues mides i estat «Treballant…». Un sol primari per vista.'),
  especimen('formularis', 'camp', 'Camp', 'PedraSeca/organismes/formulari.jsx', ['organisme', 'formulari'],
    'El contenidor de camp: etiqueta, ajuda i error. El control de dins (CampText, AreaText o Selector) hereta l’id i els atributs d’accessibilitat.'),
  especimen('formularis', 'opcions', 'Opcions', 'Casella · GrupOpcions · Interruptor · GrupCamps', ['organisme', 'formulari'],
    'Decidir (Casella), triar una opció (GrupOpcions), activar al moment (Interruptor) i agrupar camps amb llegenda (GrupCamps).'),
  especimen('formularis', 'pindola', 'Pindola', 'PedraSeca/molecules/PillToggle.jsx', ['molecula', 'vista'],
    'Selector de píndola: diverses opcions i una d’activa. Canvia la vista d’un contingut; no filtra dades.'),
  especimen('formularis', 'cerca', 'Cerca', 'PedraSeca/organismes/UniversalSearch.jsx', ['organisme', 'cerca'],
    'El cercador de llista del gestor. Deute: no admet etiqueta visible ni Camp.'),
  especimen('formularis', 'formulari-complex', 'Formulari Complex', 'Validació amb resum d’errors', ['organisme', 'formulari'],
    'La referència de validació: en enviar, un resum d’errors a dalt i cada error al costat del seu camp.'),
  /* T40 (ordre del Mestre, 260928) · el mes compartit Consola–editor i la pastilla de data.
     T6-T8 (260930) · i el mes amb esdeveniments de l'Agenda del Mur i de la Consola.
     T10 (261001) · i l'esquelet de les vistes Setmana i Mes a l'estil Google Calendar.
     Fase visual (prompt 261001_0445) · i les vistes Agenda i Any. */
  especimen('formularis', 'calendari', 'Calendari', 'NavegacioMes · GraellaMes · CalendariEsdeveniments · SelectorDataHora · VistaSetmana · VistaMes · VistaAgenda · VistaAny · NavegacioPeriode (T40, T6-T8, T10)', ['organisme', 'calendari', 'data'],
    'El mes compartit de tota l’app: CalendariEsdeveniments el pinta gran, amb les tasques de la Consola (un sol model d’esdeveniment, compatible amb iCalendar i Google Calendar), i l’editor el pinta xicotet dins de la finestra de la barra taronja per a triar el dia i l’hora de publicació. Davall, les vistes a l’estil Google Calendar (Setmana, Dues setmanes, Mes, Any i Agenda), les de /calendari i, des de l’Onada 6, també les de la pestanya Calendari del Mur: sense ?vista=, la vista Mes, i amb ratolí cada esdeveniment porta a la seua publicació.',
    'mes hora publicacio consola barra taronja pastilla selector agenda mur esdeveniment acte ics google setmana vista graella solapament carril any dues setmanes llista'),
  /* T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa dins de l'editor. */
  especimen('formularis', 'drets-autor', 'Drets d’autor', 'CopyrightPage · BotoDretsAutor (T39)', ['organisme', 'llicencia', 'copyright', 'editor'],
    'Els drets d’autor a pantalla completa dins de l’editor: cada llicència explicada amb un exemple de poble. Res no canvia fins a «Desar autoria».',
    'drets autor creative commons cc0 herencia perfil pantalla completa'),
  /* T52 (ordre del Mestre, 260928) · la botonera de davall del títol i els seus diàlegs. */
  especimen('formularis', 'classificacio', 'Classificació', 'BotoneraClassificacio · DialegCarpeta · DialegValors · DialegEmoticona', ['organisme', 'editor', 'classificacio'],
    'La botonera de davall del títol en edició: Carpetes, Categories, Etiquetes i Emoticona. Cada botó obri el seu diàleg; la botonera no guarda estat i qui la munta decidix què s’obri.',
    'carpeta categoria etiqueta emoticona emoji ploma'),
  /* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · la graella tàctil i el teclat d'imports. */
  especimen('formularis', 'rajola', 'Rajola', 'PedraSeca/molecules/Rajola.jsx', ['molecula', 'accio', 'graella'],
    'Botó quadrat (1:1) amb imatge o marcador, títol i línia secundària: la peça de les graelles tàctils, com els productes d’un bar o les categories.',
    'rajola tile producte categoria graella quadrat tactil caixa'),
  especimen('formularis', 'teclat-numeric', 'Teclat numèric', 'PedraSeca/organismes/TeclatNumeric.jsx', ['organisme', 'formulari', 'import'],
    'Teclat tàctil per a imports i quantitats que torna sempre enters: cèntims en mode import, unitats en mode quantitat. Mai coma flotant.',
    'teclat numeric import quantitat centims caixa efectiu arqueig')
];

const NAVEGACIO = [
  especimen('navegacio', 'pestanyes', 'Pestanyes', 'PedraSeca/organismes/Pestanyes.jsx', ['organisme'],
    'Vistes germanes d’un mateix objecte (un poble: general, fotos, història), amb pestanyes que reben el focus.'),
  especimen('navegacio', 'molla', 'Molla', 'PedraSeca/organismes/navegacio.jsx', ['organisme'],
    'El camí des de l’arrel fins a la pàgina actual. Obligatòria a partir del segon nivell de profunditat.'),
  especimen('navegacio', 'paginacio', 'Paginacio', 'PedraSeca/organismes/navegacio.jsx', ['organisme'],
    'Llistes llargues servides per pàgines, amb botons que diuen «Anterior» i «Següent». Mai scroll infinit.'),
  especimen('navegacio', 'acordio', 'Acordio', 'PedraSeca/organismes/Accordion.jsx', ['organisme'],
    'Contingut plegable per a preguntes freqüents i ajustos llargs.'),
  especimen('navegacio', 'nav-mobil', 'Nav Mobil', 'App.jsx · nav.mobile-nav', ['plantilla', 'mobil'],
    'Fins a 1023px d’ample, la barra inferior fixa amb cinc caselles: Xat, Mur, el Panell de Control com a botó central, Mercat i Pobles, en pistes d’ample igual. La barra lateral passa a calaix. Acompanya el scroll: baixant s’amaga, pujant torna.'),
  /* Ordre del Mestre (261012, vespre) · el botó «Tornar a dalt», damunt de «Pobles» (Pedra Seca §9). */
  especimen('navegacio', 'tornar-dalt', 'Tornar a dalt', 'PedraSeca/atoms/BotoTornarADalt.jsx', ['atom', 'mobil', 'scroll'],
    'Botó redó i suau que porta a dalt el que s’està llegint. En compacte la closca el pinta damunt de «Pobles» quan el visor ha baixat més d’una pantalla i les barres es veuen.',
    'tornar dalt pujar amunt scroll inici fletxa boto flotant pobles'),
  /* Onada 3B (Pedra Seca §9) · el rail del Xat i les vistes que obri. */
  especimen('navegacio', 'xat-rail', 'Xat · rail i vistes', 'RailXat · VistaEnConstruccio', ['organisme', 'xat', 'rail'],
    'El menú de l’esquerra del Xat, calcat del de WhatsApp per a Mac, desplegat i plegat, amb les seccions «Més» i «Comunitats» i el peu amb l’avatar propi; i les vistes que encara no fan res i ho diuen.',
    'menu xats novetats comunitats telefonades multimedia destacats tu perfil en construccio marcador')
];

const RETROALIMENTACIO = [
  especimen('retroalimentacio', 'alerta', 'Alerta', 'PedraSeca/molecules/Alerta.jsx', ['molecula'],
    'Missatge en línia que es queda fins que es resol.'),
  especimen('retroalimentacio', 'insignia', 'Insignia', 'PedraSeca/atoms/Insignia.jsx', ['atom'],
    'Dues famílies en una peça: la taxonomia per a classificar i l’estat per a informar.'),
  especimen('retroalimentacio', 'buit', 'Buit', 'PedraSeca/atoms/estats.jsx', ['atom'],
    'Una llista o una secció sense contingut: explica per què i oferix l’acció que ho arregla.'),
  especimen('retroalimentacio', 'carrega', 'Carrega', 'PedraSeca/atoms/estats.jsx', ['atom'],
    'Carregant per a esperes curtes; Esquelet quan ja se sap la forma del que ve.'),
  especimen('retroalimentacio', 'progres', 'Progres', 'PedraSeca/atoms/estats.jsx', ['atom'],
    'El progrés d’una tasca llarga amb l’element natiu. Sense valor és indeterminat: no s’inventen percentatges.'),
  especimen('retroalimentacio', 'estat-desament', 'EstatDesament', 'L’estat de l’autodesament (T47)', ['organisme', 'editor'],
    'L’editor no té botó «Guardar»: tot es desa sol. La barra taronja diu si hi ha canvis que el servidor encara no té, avisa si alguna cosa falla i, quan el servidor ho confirma, ho diu amb un check que es queda fins al canvi següent.',
    'estat desament núvol pujar pendent autodesament desat esborrany check confirmat'),
  /* T43 (ordre del Mestre, 260928) · visibilitat d'una connexió i resum per destinatari. */
  especimen('retroalimentacio', 'resum-connexio', 'ResumConnexio', 'Qui ho pot vore i què s’ha fet (T43)', ['organisme', 'connectar'],
    'El resum de Connectar per a cada destinatari: qui ho pot vore i què s’ha fet.',
    'connexio visibilitat privada persones grups poble xat'),
  /* T7-T9 (ordre del Mestre, 261001) · el pilot de connexió amb el node i la llista de nodes del Perfil. */
  especimen('retroalimentacio', 'connexio', 'Connexió i nodes', 'PilotConnexio · LlistaNodes', ['atom', 'connexio', 'node'],
    'El pilot diu l’estat de la connexió amb el node: verd i ple quan l’App ha carregat el contingut del servidor, groc en anell mentre es connecta o sense connexió. La llista diu on estàs i qui guarda les dades.',
    'pilot connexio node nodes fedivers amfitrio verd groc')
];

const SUPERPOSICIONS = [
  especimen('superposicions', 'dialeg', 'Dialeg', 'PedraSeca/organismes/Dialeg.jsx', ['organisme'],
    'El pare de totes les superposicions: una modal sobre l’element natiu, amb vel, trampa de focus i Escape. En mòbil es convertix en full inferior.'),
  especimen('superposicions', 'confirmacio', 'Confirmacio', 'PedraSeca/organismes/Dialeg.jsx', ['organisme'],
    'Confirmació d’una acció. Si és destructiva, el focus comença a «Cancel·lar» i el vel no tanca.'),
  especimen('superposicions', 'calaix', 'Calaix', 'Dialeg amb costat', ['organisme'],
    'Panell lateral per a filtres, índex o detalls secundaris, amb el mateix contracte que Dialeg.'),
  /* Ordre del Mestre, 261001 · el Calendari a pantalla completa. */
  especimen('superposicions', 'pantalla-completa', 'Pantalla completa', 'PedraSeca/organismes/PantallaCompleta.jsx', ['organisme'],
    'Un bloc de la pàgina a tota la caixa de l’App, sense la barra lateral ni les de dalt: el Dialeg de mida completa, amb una franja que només porta «Eixir». Escape també ix, i el focus torna al botó que l’ha obert.',
    'pantalla completa maximitzar eixir calendari agenda'),
  /* Onada 0.3 (Gauntlet 261016) · el visor de fotos de l'Arxiu visual (/multimedia). */
  especimen('superposicions', 'visor-imatges', 'Visor d’imatges', 'PedraSeca/organismes/VisorImatges.jsx', ['organisme', 'imatge', 'multimedia'],
    'Les fotos a pantalla completa sobre el fons fosc del crom, a l’estil de Google Fotos: anterior i següent amb la volta, zoom fluid (roda, doble clic, botons, tecles i pessic) i un panell plegable amb la data i l’hora, el GPS, la càmera, l’autor, el poble, els drets i on s’ha publicat la foto. Sense eixir de la galeria.',
    'visor lightbox galeria fotos imatges zoom exif gps camera drets arxiu visual multimedia google fotos pantalla completa'),
  especimen('superposicions', 'pista', 'Pista', 'PedraSeca/molecules/Pista.jsx', ['molecula'],
    'Ajuda que es toca: substituïx els títols emergents, que no existixen en pantalla tàctil.'),
  especimen('superposicions', 'menu', 'Menu', 'PedraSeca/molecules/Dropdown.jsx', ['molecula'],
    'Menú contextual. Deute: l’amplada mínima arriba com a estil en línia i el focus no es mou amb fletxes.'),
  /* Onada 3B (Pedra Seca §9) · el diàleg «Nova conversa» del Xat. */
  especimen('superposicions', 'xat-nova-conversa', 'Xat · Nova conversa', 'DialegNovaConversa', ['organisme', 'xat', 'dialeg'],
    'El diàleg del «+» del Xat: el cercador, «Nou grup» i «Nova comunitat» amb el panell honest, els contactes freqüents i la gent del poble per lletres.',
    'nova conversa padro contactes frequents nou grup nova comunitat tu mateix'),
  /* Torn 260930 (T1) · el full «Ajustos» del Xat, calcat del de WhatsApp Desktop. */
  especimen('superposicions', 'xat-ajustos', 'Xat · Ajustos', 'FullAjustos · CosAjustos (T1)', ['organisme', 'xat', 'dialeg'],
    'El full que obri «Tu» al peu del rail del Xat: un modal centrat de mida fixa amb una pila de pàgines dins del mateix marc, calcat del d’«Ajustes» de WhatsApp Desktop. Només hi ha el que el Xat ja té; la resta diu que està en construcció.',
    'ajustos tu perfil compte privacitat aparenca tema llengua amplaria columnes preferits destacats ajuda en construccio'),
  /* T41 (ordre del Mestre, 260928) · pública o privada, amb avís. */
  especimen('superposicions', 'visibilitat', 'Selector de visibilitat', 'Pública o privada, amb avís (T41)', ['superposicio', 'visibilitat', 'publicar'],
    'La bola del món de la barra taronja i PUBLICAR obrin esta finestra, que explica les dues eixides i demana confirmació.',
    'publica privada candau bola del mon fitxa nota mur'),
  especimen('superposicions', 'toast', 'Toast', 'useToast · AvisadorEfimer', ['organisme'],
    'Confirmació que no demana cap acció. Si cal actuar, és una Alerta en línia o un Dialeg.'),
  /* T46 (ordre del Mestre, 260928) · re-enquadrar la capçalera, quadrat de sèrie.
     Onada 4 · T3 · també l'avatar de l'ajust d'imatge, només en quadrat; les
     imatges de la fitxa del Perfil, per la finestra senzilla (retallador, 261008). */
  especimen('superposicions', 'enquadrament', 'Enquadrament', 'Re-enquadrar una foto, quadrat de sèrie (T46)', ['superposicio', 'imatge', 'retall'],
    'Re-enquadrar la foto de capçalera abans de desar-la: quadrat de sèrie i la part important dins del marc. L’avatar de l’ajust d’imatge hi passa sempre, només en quadrat; les imatges de la fitxa del Perfil (avatar en cercle, logotip i capçalera), per la finestra senzilla.',
    'enquadrar retallar foto crop quadrat capcalera hero miniatura dialeg avatar perfil retallador'),
  /* T52 (ordre del Mestre, 260928) · la vista A4 de l'editor. */
  especimen('superposicions', 'impressio', 'Impressió', 'DocumentPrintPreview · A4 i PDF', ['organisme', 'editor'],
    'La vista A4 del document, amb portada o sense, preparada al dispositiu per a imprimir o desar com a PDF. Al Bloc de Notes viu davall del títol de l’editor, al costat dels drets d’autor; al Perfil, a l’apartat «Les vistes», fora de l’editor.',
    'imprimir pdf portada paper vistes perfil')
];

export const CATALOG_ITEMS = [
  ...FONAMENTS,
  /* La 🌻 que portava a mà ara ix d'ICONES_ESPECIMENS, com la de la resta. */
  especimen('emoticones', 'xl', 'Emojis XL', 'Emoticones del poble per famílies', ['emoticona', 'cataleg', 'accessibilitat'],
    'Un directori d’emoticones grans amb el seu nom: natura, eines, persones, documents i vida al poble. Cada família es pot desplegar amb el teclat.',
    'emoji emojis emoticones natura rural eines persones documents'),
  especimen('inventari', 'global', 'Inventari Global', 'Taula de components', ['inventari', 'llista'],
    'Tots els components registrats al catàleg, on viuen i en quin estat estan. La porta del catàleg falla si un component de PedraSeca/ no hi és.',
    'components'),
  ...ESTRUCTURA,
  ...FORMULARIS,
  ...NAVEGACIO,
  ...RETROALIMENTACIO,
  ...SUPERPOSICIONS
];

/* Ordre del Mestre (261002, sinergies T4/T8) · l'ESQUELET COMÚ de catàleg i col·lecció: les
   peces de Pedra Seca i els dos vestits (bar i compra) de les mateixes columnes. Van en un
   bloc a part perquè cada pàgina les pinte darrere de les seues. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'articles', 'Articles: graella i llista', 'GraellaArticles · LlistaArticles', ['organisme', 'cataleg', 'graella'],
    'La mateixa dada en rajoles 1:1 o en files, per seccions de categoria. És el catàleg del TPV del bar i de La Compra: cada app vist els articles amb la seua intel·ligència i l’esquelet els pinta igual.',
    'graella llista rajola producte article categoria cataleg tpv compra bring loyverse'),
  especimen('navegacio', 'seccions-categoria', 'Seccions de categoria', 'SeccionsCategoria · SelectorCategoria · OrdenaCategories', ['organisme', 'categoria', 'ordre'],
    'Les categories d’un catàleg: seccions plegables, el filtre amb pastilles o desplegable i l’ordre de la persona amb botons amunt i avall, sense arrossegar.',
    'categoria seccio plegar filtre pastilles ordenar amunt avall visibilitat ull passadis'),
  especimen('fonaments', 'colleccio', 'Col·lecció en curs', 'LiniesColleccio · BarraResum · TargetesColleccions', ['organisme', 'colleccio', 'tiquet'],
    'El tiquet del TPV i la llista de la compra amb les mateixes peces: les línies, la barra de resum i les col·leccions com a targetes.',
    'tiquet comanda llista compra linia quantitat total cobra fet tiquets oberts'),
  especimen('formularis', 'afegit-rapid', 'Afegit ràpid', 'PedraSeca/organismes/AfegitRapid.jsx', ['organisme', 'formulari', 'cerca'],
    'El «Necessite…» de La Compra i el «Busca…» del TPV: suggeriments del catàleg sense accents ni majúscules, i crear un article nou.',
    'necessite busca suggeriments combobox afegir crear article'),
  especimen('superposicions', 'detall-article', 'Detall d’article', 'PedraSeca/organismes/DetallArticle.jsx', ['organisme', 'dialeg', 'variant'],
    'Variants, quantitat amb el teclat numèric i una nota (o l’especificació de la compra) en un Dialeg, amb un esborrany que torna a començar a cada obertura. Amb un grup obligatori, el diàleg menut: un toc tria i tanca.',
    'detall variant quantitat nota especificacio modificador dialeg grup obligatori tria directa'),
  especimen('estructura', 'marc-columna', 'Marc de columna', 'PedraSeca/organismes/MarcColumna.jsx', ['plantilla', 'columnes'],
    'Capçalera i eines fixes, el cos que fa scroll i un peu fix: el marc de cada columna de l’esquelet.',
    'marc columna capcalera eines peu scroll'),
  especimen('estructura', 'esquelet-bar', 'Esquelet · vestit de bar', 'src/apps/comu/esquelet · «La Parròquia»', ['plantilla', 'esquelet', 'tpv'],
    'El TPV del bar sobre l’esquelet comú: catàleg de productes, comanda en curs i tiquets oberts. Les mateixes columnes que La Compra, amb una altra intel·ligència de dades.',
    'esquelet bar tpv caixa comanda cobra parroquia loyverse sinergies'),
  especimen('estructura', 'esquelet-compra', 'Esquelet · vestit de compra', 'src/apps/comu/esquelet · «La Nevera de Casa»', ['plantilla', 'esquelet', 'compra'],
    'La Compra sobre el mateix esquelet que el TPV: articles de casa, la llista en curs i les llistes. En el mòbil, la llista va primer i en rajoles.',
    'esquelet compra llista nevera bring pendent comprat necessite sinergies')
);

/* Ordre del Mestre (261003, tancament del Lector RSS) · l'EXCEPCIÓ a la regla 1:1 de Pedra Seca
   (§8): la imatge apaïsada 16:9 de les targetes del Lector de notícies, i només d'elles. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'imatge-apaisada', 'Imatge apaïsada 16:9', 'Variant panoràmica de GraellaArticles i LlistaArticles · excepció del Lector', ['organisme', 'imatge', 'excepcio'],
    'L’única excepció a l’1:1 de les peces de Pedra Seca (§8; els fulls pecesApps.css i catalegColleccio.css), autoritzada pel Mestre el 261003 i limitada a les targetes del Lector de notícies: la imatge i el marcador ocupen un marc 16:9. Cap altra app la pot fer servir.',
    'apaisada 16:9 lector noticies rss targeta revista miniatura excepcio')
);

/* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes»; D-A del xat de les
   06:38) · front «nucli»: la graella de les targetes de les llistes de les apps i la porta
   permesa de la Pàgina Universal per a les apps. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'graella-targetes', 'Graella de targetes', 'PedraSeca/organismes/GraellaTargetes.jsx', ['organisme', 'targeta', 'graella'],
    'No és cap targeta: posa les UniversalCard d’una llista en la graella de sempre o en columna i, amb categories, les agrupa en seccions. Amb ella, Notícies i la Nevera deixen les targetes pròpies.',
    'graella llista targetes seccions categories noticies nevera apps universalcard'),
  especimen('estructura', 'pagina-app', 'Pàgina de les apps', 'PedraSeca/organismes/PaginaApp.jsx', ['plantilla', 'pagina', 'apps'],
    'El detall d’un element d’una app amb l’anatomia de la Pàgina Universal: doble barra, portada, bloc del títol i article. Munta PageFrame sense traductor ni telemetria, i amb les imatges privades.',
    'pagina app detall noticies nevera lector traduir telemetria privada pageframe rellotge')
);

/* Ordre del Mestre, 261006 (prompt 261006_1215 i skill sdp-clon-loiverse) · el TPV universal:
   l'estructura de Loyverse amb la pell de Pedra Seca, una sola peça per al Bar i el Rebost. */
CATALOG_ITEMS.push(
  especimen('estructura', 'universal-tpv', 'TPV universal', 'PedraSeca/organismes/UniversalTPV.jsx', ['organisme', 'tpv', 'cataleg'],
    'L’estructura de Loyverse amb la pell de Pedra Seca: el tiquet a l’esquerra, la graella de productes a la dreta i la barra d’accions partida al peu. La mateixa peça cobra al Bar («Cobra») i omple la Llista de la Compra o el Rebost («Afig a la llista»); en una amplada estreta, una sola columna amb pestanyes.',
    'tpv caixa tiquet cobra bar rebost llista compra loyverse graella productes categories tiquets oberts variants')
);

/* Ordre del Mestre, 261006 («deixa previst en el component de la targeta de producte l'espai i el
   codi per a renderitzar aquestes xicotetes icones d'al·lèrgens») · les icones dels 14 al·lèrgens,
   amb els dibuixos del Mestre, per al TPV i la Carta Digital. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'icones-alergens', 'Icones d’al·lèrgens', 'PedraSeca/molecules/IconesAlergens.jsx', ['molecula', 'alergens', 'carta'],
    'Les xicotetes icones dels 14 al·lèrgens del Reglament, amb els dibuixos del Mestre: una fila d’imatges quadrades i un sol nom per al lector («Al·lèrgens: gluten, llet»). Viatgen dins del paquet, sense xarxa. El TPV les pinta a la cantonada de la rajola i la Carta Digital, dins del cos de la targeta.',
    'alergens al·lergens gluten crustacis ous peix cacauets soja llet fruits closca api mostassa sesam sulfits tramussos molluscs carta digital tpv icones reglament')
);

/* Ordre del Mestre, 261007 («Implementa un carrusel a la imatge principal d'aquesta pàgina
   universal perquè l'usuari puga passar les fotos») · la portada dels productes amb més d'una foto. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'carrusel-imatges', 'Carrusel d’imatges', 'PedraSeca/organismes/CarruselImatges.jsx', ['organisme', 'imatge', 'portada'],
    'Les fotos d’un element a la portada de la Pàgina Universal: es passen amb el dit, amb els botons dels costats o amb les fletxes del teclat, i el comptador diu on s’és. La primera foto és la portada, no es pinta dues vegades. Amb una sola foto, la portada de sempre.',
    'carrusel carousel galeria fotos imatges portada hero passar diapositiva scroll snap producte mercat samarreta')
);

/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de llistar elements de
   la categoria per a l'avatar actiu ha d'estar disponible per tot el sistema») · el que l'actor
   actiu ja té publicat, amb la targeta canònica de cada secció, i la ranura peuDePagina de
   PageFrame on va al Bloc de Notes. Pedra Seca §9: l'espècimen abans d'endollar-lo. */
CATALOG_ITEMS.push(
  especimen('fonaments', 'publicacions-actor', 'Publicacions de l’actor', 'PublicacionsDeLActor · TargetaDelMercat · la ranura peuDePagina', ['organisme', 'targeta', 'historic'],
    'El que la persona, o l’entitat amb què actua, ja té publicat en una secció (Mur, Mercat o Esdeveniments), amb la targeta de sempre de cada secció dins de la graella. Al Bloc de Notes va davall de l’editor, dins del mateix scroll i fora de l’Índex de la nota.',
    'historic ja publicat actor avatar identitat entitat socdepoble samarreta aplec mur mercat esdeveniments notes peu pagina ranura graella targeta')
);

/* T52 (ordre del Mestre, 260928: «que quede clar quin és l'element universal
   pare que controla els altres») · L'ARBRE UNIVERSAL.
   `pare` és la peça universal que governa el node i `relacio` diu com (esmena
   D2 de la revisió de T52a: no tots els fills hereten del pare):
     · 'munta' (per defecte): el pare munta el fill. Decidix on i quan
       apareix, però l'anatomia del fill és seua.
     · 'instancia': el fill munta el pare amb ranures o dades fixes i
       n'hereta qualsevol canvi (l'editor pinta una UniversalPage; la targeta
       viva pinta una UniversalCard).
     · 'versio': el fill és una versió reduïda del pare, amb codi propi. No
       n'hereta res: un canvi s'ha de fer als dos (la targeta i PageFrame).
   `muntadaPer` (text) matisa 'munta' quan el pare no munta el fill pel seu
   compte: una secció el passa com a fill del pare, que el pinta on van els
   fills (dins de l'article de PageFrame), i és la secció qui decidix quan
   apareix (ResumConnexio, ConnectarSection).
   `item` és l'espècimen del catàleg (null: encara no en té). `usa` són les
   peces transversals de què depén. `consumidors` diu qui més la munta a l'app
   quan el pare no és l'únic (text, no nodes; mai el pare). Els transversals (pare null)
   servixen a totes les branques. EspecimenArbreUniversal el pinta sencer i
   cada espècimen en pinta el seu llinatge (cataleg/Llinatge.jsx). */
export const RELACIONS = Object.freeze(['munta', 'instancia', 'versio']);

export const ARBRE_UNIVERSAL = Object.freeze([
  { id: 'closca', nom: 'Closca (App.jsx)', fitxer: 'src/app/App.jsx', pare: null, item: 'estructura-shell',
    rol: 'Barra lateral, barra negra, main i navegació mòbil. No hi ha cap UniversalShell: és el JSX d’App.jsx.' },
  { id: 'nav-mobil', nom: 'Navegació mòbil', fitxer: 'src/app/App.jsx', pare: 'closca', item: 'navegacio-nav-mobil',
    rol: 'nav.mobile-nav, fins a 1023px d’ample.' },
  /* Ordre del Mestre (261012, vespre) · el botó de damunt de «Pobles». */
  { id: 'tornar-dalt', nom: 'Tornar a dalt', fitxer: 'src/components/PedraSeca/atoms/BotoTornarADalt.jsx', pare: 'closca', item: 'navegacio-tornar-dalt',
    rol: 'El botó redó de damunt de «Pobles», fins a 1023px d’ample: el pinta la closca (TornarADalt) quan useBarresAmbScroll diu que el visor ha baixat més d’una pantalla amb les barres a la vista.' },
  { id: 'identitat', nom: 'Identitat activa', fitxer: 'src/components/universal/identitat/', pare: 'closca', item: 'fonaments-identitat',
    rol: 'El botó de la barra negra i el calaix «Amb qui actues?».', usa: ['dialeg'] },
  /* Esmena D1 de la revisió de T52a · el Xat no és un UniversalWorkspace:
     ClosCaXat munta AppGridShell i AppGridColumn pel seu compte. */
  { id: 'workspace', nom: 'UniversalWorkspace', fitxer: 'src/components/universal/workspace/UniversalWorkspace.jsx', pare: 'closca', item: 'estructura-universalworkspace',
    rol: 'Pare dels gestors: navegació, llistat i detall. No sap res de cap domini.',
    consumidors: ['Notes (NotesSection)', 'Disseny (DesignSection)', 'la Wiki (WikiDePobleSection)', 'Perfil (PerfilShell)', 'Admin (AdminSection)'] },
  { id: 'appgrid', nom: 'AppGridShell', fitxer: 'src/components/layout/AppGridShell.jsx', pare: 'workspace', item: 'estructura-gestor',
    rol: 'La graella de tres columnes (ample, mitjà, estret). El Xat no passa per UniversalWorkspace: la munta directament.',
    consumidors: ['el Xat (ClosCaXat)', 'Admin (AdminSection)'] },
  { id: 'columna', nom: 'AppGridColumn', fitxer: 'src/components/layout/AppGridColumn.jsx', pare: 'workspace', item: 'estructura-columnes',
    rol: 'La capçalera de cada columna. AppGridShell no la importa: la munta qui omple les columnes.',
    consumidors: ['el Xat (ClosCaXat, XatSection, XatControlSection)', 'Admin (AdminSection)'] },
  { id: 'resizer', nom: 'AppGridResizer', fitxer: 'src/components/layout/AppGridResizer.jsx', pare: 'appgrid', item: 'estructura-divisor',
    rol: 'La vora arrossegable entre columnes: AppGridShell la posa entre cada parella.' },
  { id: 'page', nom: 'UniversalPage → PageFrame', fitxer: 'src/components/universal/PageFrame.jsx', pare: 'closca', item: 'estructura-page',
    rol: 'Pare universal de pàgina: a soles dins de main, o a la columna dreta del gestor (renderDetail).' },
  { id: 'barres', nom: 'BarraBlava i BarraTaronja', fitxer: 'src/components/universal/barres/', pare: 'page', item: 'fonaments-controls-barra',
    rol: 'header.bar-blue i section.bar-orange: components propis que PageFrame munta (T51), fets amb IconButton, ActionControl i DateTimeControl.' },
  { id: 'emoticona-barra', nom: 'EmoticonaBarra', fitxer: 'src/components/universal/EmoticonaBarra.jsx', pare: 'barres', item: 'fonaments-emoticona-barra',
    rol: 'L’espai central de la barra taronja: en edició, el botó d’emoticona (la ploma blanca mentre no n’hi ha cap); en lectura, l’emoticona triada o res.',
    consumidors: ['UniversalCard (la caputxa, només amb emoticona triada)'] },
  { id: 'card', nom: 'UniversalCard', fitxer: 'src/components/PedraSeca/organismes/UniversalCard.jsx', pare: 'page', relacio: 'versio', item: 'fonaments-universalcard',
    rol: 'Capçalera ≈ barra taronja, mitjà 1:1, cos i peu ≈ barra blava sense navegació. No importa PageFrame ni les barres: fa servir els mateixos àtoms.',
    consumidors: [
      'el Mur (MurSection)', 'el Mercat (MercatSection)', 'Pobles (PoblesSection)', 'Connectar (ConnectarSection, la previsualització)',
      'EventCard (el Mur)', 'SectionItemCard (ProfileSection)', 'la Consola (TargetaConsola i TargetaResum)',
      'l’acollida (OnboardingSteps)', 'Control (ControlSection)', 'Traduccions (TranslationsSection)'
    ] },
  { id: 'targeta-viva', nom: 'TargetaViva', fitxer: 'src/components/universal/TargetaViva.jsx', pare: 'card', relacio: 'instancia', item: 'fonaments-targeta-viva',
    rol: 'La UniversalCard (variant pla) del document que s’escriu: la fitxa activa del llistat i la targeta en línia de «Les vistes». El diàleg del xip «Vista targeta» només el munta el catàleg.',
    consumidors: ['NotaFitxa (Notes)', 'PerfilShell (Perfil)', 'DetallVistes (Perfil, «Les vistes»)'] },
  { id: 'editor', nom: 'DocumentEditor → UniversalEditorShell', fitxer: 'src/components/universal/DocumentEditor.jsx', pare: 'page', relacio: 'instancia', item: null,
    rol: 'PageFrame en edició: la closca de l’editor pinta una UniversalPage amb ranures.' },
  { id: 'barra-eines', nom: 'UniversalToolbar', fitxer: 'src/components/universal/UniversalToolbar.jsx', pare: 'editor', item: 'estructura-barra-eines',
    rol: 'La barra d’eines de l’editor (UniversalRichTextToolbar li passa les dades). No és la barra blava.' },
  { id: 'estat-desament', nom: 'EstatDesament', fitxer: 'src/components/universal/EstatDesament.jsx', pare: 'editor', item: 'retroalimentacio-estat-desament',
    rol: 'L’estat de l’autodesament, a la barra taronja.' },
  { id: 'calendari', nom: 'SelectorDataHora', fitxer: 'src/components/PedraSeca/organismes/SelectorDataHora.jsx', pare: 'editor', item: 'formularis-calendari',
    rol: 'La data de publicació, a la barra taronja.', usa: ['dialeg'] },
  { id: 'visibilitat', nom: 'SelectorVisibilitat', fitxer: 'src/components/universal/SelectorVisibilitat.jsx', pare: 'editor', item: 'superposicions-visibilitat',
    rol: 'Pública o privada: la bola del món i PUBLICAR.', usa: ['dialeg', 'boto'] },
  { id: 'classificacio', nom: 'BotoneraClassificacio', fitxer: 'src/components/universal/classificacio/', pare: 'editor', item: 'formularis-classificacio',
    rol: 'Carpetes, Categories, Etiquetes i Emoticona, davall del títol.', usa: ['dialeg', 'boto'] },
  { id: 'drets', nom: 'BotoDretsAutor → CopyrightPage', fitxer: 'src/components/universal/drets/CopyrightPage.jsx', pare: 'editor', item: 'formularis-drets-autor',
    rol: 'Els drets d’autor, a pantalla completa dins de la columna.', usa: ['boto'] },
  { id: 'impressio', nom: 'DocumentPrintPreview', fitxer: 'src/components/universal/DocumentPrintPreview.jsx', pare: 'editor', item: 'superposicions-impressio',
    rol: 'La vista A4 i el PDF, al costat dels drets d’autor (Bloc de Notes).', usa: ['dialeg'],
    consumidors: ['DetallVistes (Perfil, «Les vistes»)'] },
  { id: 'enquadrament', nom: 'DialegEnquadrament', fitxer: 'src/components/universal/enquadrament/DialegEnquadrament.jsx', pare: 'editor', item: 'superposicions-enquadrament',
    /* Onada 4 (retallador senzill, 261008) · DialegCapcaleraAvatar ja no es
       munta: les tres imatges de la fitxa passen per useImatgeDeFitxa. */
    rol: 'Re-enquadrar la foto de capçalera; al Perfil, les imatges de la fitxa (finestra senzilla) i l’avatar de l’ajust d’imatge (només en quadrat).', usa: ['dialeg', 'boto'],
    consumidors: ['el Perfil (useImatgeDeFitxa: capçalera, avatar i logotip)', 'DetallAjust (useEnquadramentAvatar)'] },
  { id: 'resum-connexio', nom: 'ResumConnexio', fitxer: 'src/sections/connectar/ResumConnexio.jsx', pare: 'page', item: 'retroalimentacio-resum-connexio',
    muntadaPer: 'ConnectarSection',
    rol: 'El resum de Connectar per a cada destinatari, dins de l’article de la pàgina de Connectar, quan la connexió ja s’ha guardat.' },
  { id: 'dialeg', nom: 'Dialeg', fitxer: 'src/components/PedraSeca/organismes/Dialeg.jsx', pare: null, item: 'superposicions-dialeg',
    rol: 'Pare de totes les superposicions: modals, calaixos i la finestra de la barra.' },
  { id: 'boto', nom: 'Boto', fitxer: 'src/components/PedraSeca/atoms/Boto.jsx', pare: null, item: 'formularis-boto',
    rol: 'L’únic botó de text de Pedra Seca.' },
  { id: 'composicio', nom: 'Composició', fitxer: 'src/components/PedraSeca/composicio/index.jsx', pare: null, item: 'estructura-composicio',
    rol: 'Pila, Fila, Graella, Costat, Centre i Superficie.' }
]);

const PER_ID = new Map(ARBRE_UNIVERSAL.map((node) => [node.id, node]));

export const nodeUniversal = (id) => PER_ID.get(id) || null;

/** La relació amb el pare ('munta' si el node no en diu cap). */
export const relacioDe = (node) => (node && RELACIONS.includes(node.relacio) ? node.relacio : 'munta');

/* Una etiqueta curta per a l'arbre sencer: només les relacions que no són
   «munta», perquè són les que canvien què passa quan es toca el pare. */
const ETIQUETES_RELACIO = Object.freeze({
  instancia: 'instància: n’hereta qualsevol canvi',
  versio: 'versió reduïda: no n’hereta res',
});
export const etiquetaRelacio = (node) => ETIQUETES_RELACIO[relacioDe(node)] || null;

/** Què passa amb la peça quan es toca el seu pare; null sense pare. */
export function explicaRelacio(id) {
  const node = nodeUniversal(id);
  const pare = node?.pare ? nodeUniversal(node.pare) : null;
  if (!pare) return null;
  const relacio = relacioDe(node);
  if (relacio === 'versio') {
    return `És una versió reduïda de ${pare.nom}, amb codi propi: no n’hereta res. Un canvi a ${pare.nom} no hi arriba sol; cal fer-lo a tots dos.`;
  }
  if (relacio === 'instancia') {
    return `Instancia ${pare.nom}: n’hereta qualsevol canvi.`;
  }
  if (node.muntadaPer) {
    return `${node.muntadaPer} la passa com a fill de ${pare.nom}: ${pare.nom} la pinta on van els fills, dins de l’article, i ${node.muntadaPer} decidix quan apareix. L’anatomia és seua.`;
  }
  return `${pare.nom} la munta: decidix on i quan apareix, però no en canvia l’anatomia.`;
}

/* L'arrel de l'arbre: l'única peça sense pare que no és transversal. */
export const ARREL_UNIVERSAL = 'closca';

/* Del més alt al node: [closca, …, node]. Un cicle o un pare desconegut
   tallen la cadena (no penja mai). */
export function cadenaUniversal(id) {
  const cadena = [];
  const vistos = new Set();
  let node = nodeUniversal(id);
  while (node && !vistos.has(node.id)) {
    vistos.add(node.id);
    cadena.unshift(node);
    node = node.pare ? nodeUniversal(node.pare) : null;
  }
  return cadena;
}

export const fillsUniversals = (id) => ARBRE_UNIVERSAL.filter((node) => node.pare === id);

/* Transversal: sense pare i fora de l'arrel. */
export const esTransversal = (node) => Boolean(node) && node.pare === null && node.id !== ARREL_UNIVERSAL;

/* Qui fa servir una peça transversal. */
export const usuarisUniversals = (id) => ARBRE_UNIVERSAL.filter((node) => (node.usa || []).includes(id));

/* L'adreça de l'espècimen dins de /disseny (la selecció viu a la URL). */
export function rutaEspecimen(itemId) {
  const item = CATALOG_ITEMS.find((i) => i.id === itemId);
  if (!item) return null;
  return `/disseny?${new URLSearchParams({ categoria: item.categoryIds[0], item: item.id })}`;
}
