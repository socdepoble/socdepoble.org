/**
 * copiesSeguretatSocDePobleContent.js · Onada R25 · Contingut editorial i
 * didàctic canònic en 5 llengües de la publicació del Mur
 * «El Farcellet Digital de Sóc de Poble» (/mur/copies-de-seguretat-soc-de-poble
 * i àlies /page/copies-de-seguretat-soc-de-poble).
 *
 * Lleis editorials estrictes verificades:
 *   · Marca i sintagma: SEMPRE «de poble» / «Sóc de Poble» i verb «utilitza»
 *     (zero «del poble», zero «dels pobles», zero «usa/usen», zero «sobirà»).
 *   · Zero taules de prosa (261030): tot el comparatiu WhatsApp vs Sóc de Poble
 *     i les 4 capes van en jerarquia editorial vertical (H3/H4/p/ul/blockquote)
 *     amb 6–8 paraules clau en negreta per paràgraf per a escaneig ràpid.
 *   · Zero duplicitat d'imatge Hero (261010): la portada és l'escena de la
 *     plaça («Còpia segura vs 15 GB plens») i la figura interior és una segona
 *     vinyeta diferent («Calaix de casa i les 3 claus de confiança»).
 *   · Llei 0 d'Honestedat Radical: distingeix nítidament què ja funciona hui en
 *     producció i quines peces de les 4 capes s'obrin en l'arquitectura portàtil.
 *   · Onada R26 (decisió del Mestre del 14-11-2026): l'article és el disseny i el
 *     simulador interactiu d'una arquitectura de còpies en curs de cablejat. El que
 *     encara no està connectat (restaurar una còpia .sdpbackup dins de l'app, el
 *     farcellet complet de notes, publicacions, perfil i fotos, E2EE apagat, pont
 *     QR, Tauleta Espill, carpeta externa) va en futur i marcat com a disseny en
 *     les 5 llengües; en present només el que funciona hui.
 *   · Onada R28 (Lot C3, verificació X2): la còpia del xat ja té pantalla. A Xat ›
 *     Ajustos › Xats › «Còpia de seguretat» (PaginaCopiaSeguretatXat.jsx) es pot
 *     desar una còpia xifrada de les converses carregades en este dispositiu i
 *     comprovar-ne una; restaurar-la dins de l'app encara no es pot i els
 *     adjunts (fotos, àudios, vídeos) no hi van. Les 5 llengües ho diuen així.
 */

export const COPIES_SEGURETAT_SOC_DE_POBLE_ID = 'copies-de-seguretat-soc-de-poble';
export const COPIES_SEGURETAT_SOC_DE_POBLE_RUTA = `/mur/${COPIES_SEGURETAT_SOC_DE_POBLE_ID}`;

export const IMATGE_HERO_COPIES_SEGURETAT = '/assets/mur/copies_seguretat_farcellet_hero.webp';
export const IMATGE_INTERIOR_QUATRE_CAPES = '/assets/mur/copies_seguretat_quatre_capes.webp';

const atributHtml = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function grupTargetaDescarregues(langReserva = null) {
  const titol = 'Descarrega Sóc de Poble';
  const subtitol = 'Aplicació mòbil i d’escriptori per a iPhone, iPad, Android i navegador web';
  const entradilla = 'Instal·la Sóc de Poble al mòbil, a la tauleta de casa o a l’ordinador per tindre el xat, el bloc de notes, el mur i les eines de gestió sempre sincronitzats i a mà.';
  const imatge = '/assets/nano_cards/mur_nano_card.webp';
  const langAttr = langReserva ? ` lang="${atributHtml(langReserva)}"` : '';
  return [
    '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">',
    `<div data-sdp-targeta="pagina:descarregues" class="sdp-targeta" data-ruta="/page/descarregues"${langAttr}`,
    ` data-titol="${atributHtml(titol)}" data-subtitol="${atributHtml(subtitol)}"`,
    ` data-entradilla="${atributHtml(entradilla)}" data-imatge="${atributHtml(imatge)}"`,
    ' data-autor="Sóc de Poble" data-autor-ruta="/projecte">',
    `<a href="/page/descarregues" rel="noopener noreferrer nofollow">${atributHtml(titol)}</a>`,
    '</div></div>',
  ].join('');
}

function figuraInteriorQuatreCapes(peu, alt) {
  return [
    '<div class="aplec-2023__figura">',
    `<img src="${atributHtml(IMATGE_INTERIOR_QUATRE_CAPES)}" alt="${atributHtml(alt)}" width="1600" height="1600" loading="lazy" decoding="async" />`,
    `<p class="aplec-2023__peu">${atributHtml(peu)}</p>`,
    '</div>',
  ].join('');
}

export const GRUP_TARGETA_DESCARREGUES_CA = grupTargetaDescarregues(null);
export const GRUP_TARGETA_DESCARREGUES_TRADUIT = grupTargetaDescarregues('ca');

export const COPIES_SEGURETAT_SOC_DE_POBLE_HTML = [
  '<h3>1. El malson de sempre quan canvies de mòbil (o per què WhatsApp ens fa patir tant)</h3>',
  '<p>A quasi totes les cases de les nostres comarques s’ha viscut la mateixa escena: <strong>algú canvia de telèfon mòbil, li cau l’aparell a l’aigua o li’l furten un dimarts a la vesprada</strong> i, en encendre el telèfon nou, descobrix amb un nus a l’estómac que <strong>ha perdut els últims dies, setmanes o mesos de converses i fotografies de WhatsApp</strong>. No passa perquè la gent siga descuidada; passa perquè el sistema clàssic d’eixes aplicacions està pensat d’una manera confusa, fràgil i lligada a peatges comercials.</p>',
  '<p>Si mirem amb trellat <strong>què falla en les còpies de seguretat de WhatsApp</strong>, entendrem de seguida per què tanta gent gran i tantes famílies acaben perdent records irrepetibles:</p>',
  '<ul>',
  '<li><strong>Tot es fia a una còpia nocturna que falla en silenci:</strong> WhatsApp guarda la vida principal dins de l’aparell i sol fer una còpia gran de matinada. Si el telèfon es trenca a les set de la vesprada —o si portava setmanes sense copiar perquè faltava Wi-Fi o bateria—, <strong>tots els missatges i àudios des de l’última còpia desapareixen per sempre</strong>.</li>',
  '<li><strong>La trampa dels 15 GB compartits de Google:</strong> en Android, la còpia puja al mateix espai gratuït de <strong>15 GB de Google Drive</strong> on conviuen el teu correu de Gmail i totes les teues fotos. Quan els vídeos dels grups omplen eixe poal, <strong>la còpia de seguretat es deté sense que t’adones i fins i tot el correu electrònic pot deixar de rebre missatges</strong> fins que pagues una quota mensual.</li>',
  '<li><strong>Presó entre marques i menús amagats:</strong> si passes d’un telèfon Android (que copia a Google) a un iPhone (que copia a iCloud, on gratis només donen 5 GB), <strong>traslladar l’historial complet es convertix en una gimcana tècnica</strong> on moltíssima gent acaba rendint-se i començant de zero.</li>',
  '<li><strong>Impossible guardar un arxiu sencer a la teua tauleta o memòria USB:</strong> tampoc no et deixen polsar un botó clar per descarregar <strong>un sol arxiu amb tot fins al dia de hui</strong>, guardar-lo tranquil·lament a la tauleta de casa o en un llapis de memòria i restaurar-lo d’un sol toc al mòbil nou.</li>',
  '</ul>',

  '<h3>2. En Sóc de Poble no volem salvar només el xat: dissenyem un sol farcellet per a tota la teua vida digital</h3>',
  GRUP_TARGETA_DESCARREGUES_CA,
  '<p>Quan vam començar a dissenyar la memòria de <strong>Sóc de Poble</strong>, vam tindre clar que <strong>protegir només el xat es quedava curt</strong>. Ací no vens únicament a enviar missatges ràpids: ací escrius idees i llistes al teu <a href="/notes"><strong>Bloc de Notes</strong></a>, compartixes cròniques, esdeveniments o productes al <a href="/mur"><strong>Mur</strong></a> i al <a href="/mercat"><strong>Mercat</strong></a>, puges <strong>les teues pròpies fotografies i gravacions de veu</strong> i teixixes connexions amb veïnes, associacions i comerços a través del teu <a href="/el-meu-perfil"><strong>Perfil</strong></a>.</p>',
  '<p>Per això estem construint una idea ben nostra: el <strong>Farcellet Digital de Sóc de Poble (arxiu <code>.sdpbackup</code>)</strong>. Igual que abans s’embolicava en un mocador de quatre puntes tot allò de valor per mudar-se de casa sense deixar-se res arrere, <strong>quan estiga connectat</strong>, el sistema et permetrà triar amb total llibertat si vols fer una <strong>còpia ràpida només del Xat</strong> o una <strong>còpia completa de tot el teu Sóc de Poble</strong>. El farcellet podrà portar:</p>',
  '<ul>',
  '<li><strong>Totes les teues converses del <a href="/xat">Xat</a>:</strong> missatges de text, fils amb veïns i entitats, cites i notes de veu.</li>',
  '<li><strong>Tot el teu <a href="/notes">Bloc de Notes</a> privat:</strong> apunts personals, receptes de família, esborranys a mitges, llistes i documents maquetats amb imatges.</li>',
  '<li><strong>Tot el que has publicat al sistema:</strong> les teues cròniques del Mur, anuncis del Mercat, actes del calendari, fitxes d’associacions i aportacions culturals.</li>',
  '<li><strong>Les teues pròpies fotografies, àudios i documents:</strong> els arxius originals que has compartit o guardat, ben ordenats per data i sense perdre qualitat.</li>',
  '<li><strong>El teu perfil i mapa de connexions:</strong> la teua identitat, pobles vinculats, preferències d’idioma i veu de lectura de la IAIA.</li>',
  '</ul>',

  '<h3>3. Les 4 capes que estem cablejant perquè mai es perda res (sense arruïnar la comunitat ni omplir-te el correu)</h3>',
  '<p>Ací ve la pregunta del milió que qualsevol persona amb sentit comú es fa: <strong>si som milers de persones guardant gigues i gigues de fotos i vídeos, on es guarda tot això si et furten el mòbil pel carrer i qui paga eixos discos durs?</strong> Si un projecte gratuït i sense publicitat pagara terabytes infinits al núvol comercial per guardar vídeos repetits de tot el món, faria fallida en quatre dies. La resposta que estem construint combina enginyeria moderna amb l’economia de la <strong>pedra seca</strong> en <strong>quatre capes pensades per a protegir-se les unes a les altres</strong>. <strong>Una part ja funciona hui i una altra encara és disseny</strong>: al punt 4 ho detallem peça a peça.</p>',
  figuraInteriorQuatreCapes(
    'Disseny de les quatre capes de custòdia de Sóc de Poble: sincronització al segon amb cercle de tres claus d’amistat, arxiu .sdpbackup per a tauleta o USB, pont directe entre dos mòbils i el calaix bessó automàtic a la tauleta o ordinador de casa.',
    'Vinyeta d’estil còmic mediterrani en un pati assolellat d’alqueria amb tres veïns alçant claus de ferro forjat, dos mòbils passant-se records cap a una tauleta dins d’un calaix de fusta amb el rètol Calaix de casa i un robotet amb bombeta segellant un farcellet'
  ),

  '<h4>Capa 1 · Els textos, les notes i les publicacions ja se sincronitzen al segon (no a les 3 de la matinada)</h4>',
  '<p>El <strong>text escrit ocupa poquíssim espai</strong>: deu anys sencers de converses de xat, blocs de notes i articles ocupen molt menys espai que les fotos i els vídeos. Per això, hui mateix en Sóc de Poble <strong>cada missatge enviat, cada nota escrita i cada publicació queda guardada a l’instant al servidor</strong>. Si el mòbil et cau a la séquia a les 18:45 i tenies connexió, quan obres el telèfon nou i entres al teu compte <strong>tens fins al missatge i la nota de les 18:44:59 sense perdre ni una coma</strong>.</p>',
  '<p>Per al xat privat estem preparant el <strong>xifratge d’extrem a extrem</strong> (on ni tan sols el servidor podrà llegir què parles), <strong>encara apagat a l’aplicació</strong>. Quan l’activem, la clau que obri els teus missatges es protegirà de dues maneres senzilles: amb un <strong>PIN o frase de recuperació teua</strong> (un paquet xifrat minúscul de només <code>241 bytes</code>) i amb el nostre <strong>Cercle de Confiança de 3 amistats</strong>, on tres persones de la teua màxima confiança et podran ajudar a recuperar l’accés si algun dia oblides la contrasenya.</p>',

  '<h4>Capa 2 · L’arxiu d’un sol clic (<code>.sdpbackup</code>) per a tauleta, ordinador o llapis USB-C (la primera peça, la del xat, ja hi és; la resta, en disseny)</h4>',
  '<p>Quan estiga cablejat del tot, podràs entrar als ajustos del teu compte o del xat i polsar <strong>«Descarregar còpia de seguretat fins a hui»</strong> (o triar <strong>«fins al dia X»</strong>, o <strong>«només el que s’ha afegit des de l’última còpia»</strong>). El sistema empaquetarà un <strong>únic arxiu <code>.sdpbackup</code> xifrat amb contrasenya</strong> que podràs enviar per AirDrop o cable a la teua tauleta, desar a l’ordinador o guardar en un <strong>llapis de memòria USB-C de butxaca</strong>. <strong>La primera peça ja funciona, només per al xat:</strong> al <a href="/xat"><strong>Xat</strong></a>, a <strong>Ajustos › Xats › «Còpia de seguretat»</strong>, pots <strong>desar una còpia xifrada amb contrasenya</strong> de les converses que este dispositiu ha carregat i <strong>comprovar</strong> que una còpia s’obri amb la seua contrasenya. <strong>Restaurar-la dins de l’aplicació encara no és possible</strong>, les <strong>fotos, els àudios i els vídeos no hi van</strong>, i la part de les notes, les publicacions i el perfil encara és disseny.</p>',
  '<p>Quan estrenes mòbil nou —tant si passes d’Android a iPhone com a l’inrevés—, podràs obrir Sóc de Poble, tocar <strong>«Restaurar des d’arxiu»</strong> i seleccionar eixe únic fitxer, i el sistema <strong>comprovarà matemàticament abans d’importar que l’arxiu està sencer i sense cap foto trencada</strong>.</p>',

  '<h4>Capa 3 · El Pont Màgic per QR entre dos mòbils i la «Tauleta Espill de Casa» a cost zero (en disseny)</h4>',
  '<p>La idea és que, quan canvies de mòbil tenint encara el vell a la mà, <strong>ni tan sols calga descarregar ni moure arxius manualment</strong>: mostraràs un <strong>codi QR temporal</strong> a la pantalla del telèfon nou, l’apuntaràs amb la càmera del vell i <strong>les fotos, els àudios, les notes i els xats passaran d’un aparell a l’altre pel Wi-Fi de ta casa</strong>, sense pujar a cap núvol extern i sense gastar tarifa de dades.</p>',
  '<p>Però, <strong>i si et furten el mòbil pel carrer o es rebenta la pantalla i ja no el pots encendre?</strong> Per a això pensem la peça més pràctica de totes: <strong>vincular la tauleta de casa o l’ordinador familiar com a «Calaix Espill Automàtic»</strong>. La idea és que cada nit, mentre el mòbil es carrega al Wi-Fi de casa, <strong>passe silenciosament una còpia xifrada de les fotos i àudios nous a la tauleta o a l’ordinador del saló</strong>, de manera que, si l’endemà et quedes sense mòbil al carrer, <strong>tota la teua memòria fins a la nit d’abans t’espere sana i estàlvia a la tauleta de casa</strong>, sense pagar ni un cèntim de lloguer mensual a cap multinacional.</p>',

  '<h4>Capa 4 · I si visc a soles, només tinc un mòbil i no tinc tauleta ni ordinador? (en disseny)</h4>',
  '<p>Cap veïna ni veí no pot quedar desprotegit per viure a soles amb un únic telèfon. Per a eixe cas preveiem dues eixides netes i honestes: primer, <strong>guardar la còpia ja xifrada des del teu propi telèfon en la carpeta externa que tu tries</strong> (iCloud, un compte secundari, un disc municipal compatible amb <strong>Nextcloud</strong> o amb el projecte europeu <strong>Fediversity</strong> o el teu propi espai, <strong>sense bloquejar per obligació el correu principal</strong>); i segon, la possibilitat d’activar una <strong>bústia cooperativa europea sense càrrecs per descàrrega</strong> per cèntims al mes per a qui necessite desar desenes de gigues de vídeo fora de casa.</p>',

  '<h3>4. En quin punt estem hui mateix (Llei 0 d’honestedat i transparència)</h3>',
  '<p>Com fem en cada racó de <strong>Sóc de Poble</strong>, distingim amb total claredat <strong>què tens operatiu hui mateix a l’aplicació</strong> i <strong>què encara és disseny en curs de cablejat</strong>:</p>',
  '<ul>',
  '<li><strong>Ja operatiu hui:</strong> la <strong>sincronització immediata al servidor</strong> de les teues publicacions, notes i missatges; l’<strong>exportació de totes les dades del teu compte</strong> en un fitxer (<code>socdepoble.exportacio.v1</code>) des d’<a href="/el-meu-perfil"><strong>El meu perfil</strong></a>, com mana el dret europeu de portabilitat; i, al <a href="/xat"><strong>Xat</strong></a>, a <strong>Ajustos › Xats › «Còpia de seguretat»</strong>, la <strong>còpia <code>.sdpbackup</code> xifrada</strong> de les converses que este dispositiu ha carregat, que pots <strong>desar</strong> i <strong>comprovar</strong> (sense fotos, àudios ni vídeos). Dins de l’app del mòbil, si el sistema no oferix el full de compartir, la pàgina ho diu i des d’allí no es pot desar l’arxiu.</li>',
  '<li><strong>En disseny i en curs de cablejat, encara no disponible a l’aplicació:</strong> el <strong>xifratge d’extrem a extrem del xat</strong> amb el sobre de <code>241 bytes</code> i el cercle de recuperació entre persones de confiança (motors escrits i provats, apagats fins a la cerimònia d’activació); <strong>restaurar una còpia <code>.sdpbackup</code> dins de l’aplicació</strong> i el <strong>farcellet complet</strong> amb notes, publicacions, perfil, fotos i àudios; el <strong>traspàs per codi QR</strong> pel Wi-Fi de casa; la <strong>Tauleta Espill de Casa</strong>; i la <strong>carpeta externa o bústia cooperativa</strong>.</li>',
  '<li><strong>El simulador d’ací baix és una maqueta didàctica:</strong> no fa cap còpia ni envia cap dada; servix per a vore com funcionarà el farcellet quan estiga connectat i com s’adaptarà a la teua manera de viure.</li>',
  '</ul>',
  '<blockquote><strong>La regla d’or de Sóc de Poble:</strong> les teues converses, els teus quaderns, les teues receptes i les teues fotos són teues. Sempre has de poder <strong>traure-ho tot fora en un sol clic</strong>, entendre on està guardat i canviar de telèfon amb la mateixa tranquil·litat amb què canvies de llibreta.</blockquote>',
].join('\n');

export const COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS = Object.freeze({
  ca: Object.freeze({
    title: 'El Farcellet Digital de Sóc de Poble: així dissenyem les còpies de seguretat del xat i de tot el sistema perquè mai perdes cap record',
    subtitle: 'Per què a WhatsApp es perden missatges quan canvies o et furten el mòbil i com volem resoldre-ho en 4 capes per a converses, notes, publicacions i fotos',
    entradilla: 'Canviar de telèfon, que caiga a l’aigua o que s’omplen els 15 GB gratuïts de Google no pot significar perdre anys de converses, receptes apuntades ni fotografies familiars. T’expliquem amb paraules planes el disseny del sistema de còpies de seguretat que estem cablejant a Sóc de Poble —des del xat fins als teus blocs de notes, tot el que has publicat i les teues pròpies fotos— i què funciona ja hui.',
    html: COPIES_SEGURETAT_SOC_DE_POBLE_HTML,
  }),
  es: Object.freeze({
    title: 'El Hatillo Digital de Sóc de Poble: así diseñamos las copias de seguridad del chat y de todo el sistema para no perder ningún recuerdo',
    subtitle: 'Por qué en WhatsApp se pierden mensajes al cambiar o perder el móvil y cómo queremos resolverlo en 4 capas para conversaciones, notas, publicaciones y fotos',
    entradilla: 'Cambiar de teléfono, que se caiga al agua o que se llenen los 15 GB gratuitos de Google no puede significar perder años de conversaciones, recetas apuntadas ni fotografías familiares. Te explicamos de forma clara el diseño del sistema de copias de seguridad que estamos conectando en Sóc de Poble —desde el chat hasta tus blocs de notas, todo lo que has publicado y tus propias fotos— y qué funciona ya hoy.',
    html: [
      '<h3>1. La pesadilla habitual al cambiar de móvil (y por qué WhatsApp da tantos disgustos)</h3>',
      '<p>En casi todas las familias se ha vivido la misma escena: <strong>alguien cambia de teléfono, se le rompe la pantalla o se lo roban por la tarde</strong> y, al encender el móvil nuevo, descubre que <strong>ha perdido las últimas semanas o meses de conversaciones y fotos de WhatsApp</strong>. Ocurre por cuatro fallos de diseño muy claros:</p>',
      '<ul>',
      '<li><strong>Dependencia de una copia de madrugada que falla sin avisar:</strong> si el teléfono se rompe a las siete de la tarde, todo lo hablado desde la última copia nocturna desaparece.</li>',
      '<li><strong>El embudo de los 15 GB compartidos de Google Drive:</strong> los vídeos de WhatsApp compiten por el mismo espacio gratuito que tu correo Gmail y tus fotos; cuando se llena, <strong>la copia se detiene e incluso puede bloquearse la recepción de correos</strong>.</li>',
      '<li><strong>Barreras al pasar entre Android y iPhone:</strong> Google Drive e iCloud (con solo 5 GB gratis) no se hablan entre sí de forma sencilla.</li>',
      '<li><strong>Falta de un archivo portátil de un clic:</strong> no ofrecen un único paquete con todo hasta el día elegido para guardarlo fácilmente en una tableta o memoria USB-C.</li>',
      '</ul>',

      '<h3>2. No solo el chat: un único hatillo para todo tu Sóc de Poble</h3>',
      GRUP_TARGETA_DESCARREGUES_TRADUIT,
      '<p>En <strong>Sóc de Poble</strong> estamos construyendo un único archivo <code>.sdpbackup</code> con el que, <strong>cuando esté conectado</strong>, podrás elegir hacer copia <strong>solo del <a href="/xat">Chat</a></strong> o <strong>del sistema completo</strong>: tus conversaciones y audios, todos tus cuadernos del <a href="/notes"><strong>Bloc de Notas</strong></a>, todo lo que has publicado en el <a href="/mur"><strong>Muro</strong></a> y el <a href="/mercat"><strong>Mercado</strong></a>, <strong>tus propias fotografías</strong> y tu <a href="/el-meu-perfil"><strong>Perfil</strong></a>.</p>',

      '<h3>3. Las 4 capas de custodia que estamos diseñando, sin cuotas abusivas</h3>',
      figuraInteriorQuatreCapes(
        'Diseño de las cuatro capas de custodia de Sóc de Poble: sincronización instantánea con círculo de tres llaves de confianza, archivo .sdpbackup para tableta o USB, puente directo entre dos móviles y el cajón espejo automático en la tableta u ordenador de casa.',
        'Viñeta cómica mediterránea en un patio soleado con tres vecinos alzando llaves de hierro forjado, dos móviles transfiriendo recuerdos hacia una tableta en un cajón de madera y un pequeño robot sellando un hatillo'
      ),
      '<ul>',
      '<li><strong>Capa 1 · Textos, notas y publicaciones al segundo (ya activa):</strong> el texto ocupa muy poco y <strong>ya se guarda al instante en el servidor</strong>, no a las 3:00 de la madrugada. El <strong>cifrado de extremo a extremo del chat</strong>, con un sobre de <code>241 bytes</code> para tu clave y recuperación social entre 3 personas de confianza, está preparado pero <strong>todavía apagado</strong>.</li>',
      '<li><strong>Capa 2 · Archivo <code>.sdpbackup</code> hasta el día X (la primera pieza, la del chat, ya está; el resto, en diseño):</strong> se podrá descargar en un clic, completo o incremental, para guardarlo en tu tableta, ordenador o memoria USB-C, con verificación matemática de integridad antes de restaurar. <strong>La primera pieza ya funciona, solo para el chat:</strong> en el <a href="/xat"><strong>Chat</strong></a>, en <strong>Ajustes › Chats › «Copia de seguridad»</strong>, puedes <strong>guardar una copia cifrada con contraseña</strong> de las conversaciones que este dispositivo ha cargado y <strong>comprobar</strong> que una copia se abre con su contraseña. <strong>Restaurarla dentro de la aplicación todavía no es posible</strong>, las <strong>fotos, los audios y los vídeos no se incluyen</strong>, y la parte de notas, publicaciones y perfil sigue en diseño.</li>',
      '<li><strong>Capa 3 · Puente QR de móvil a móvil y «Tableta Espejo en Casa» a coste 0 € (en diseño):</strong> traspaso directo por Wi-Fi local entre Android y iPhone mediante código QR y copia nocturna automática hacia la tableta u ordenador de casa mientras cargas el móvil.</li>',
      '<li><strong>Capa 4 · Carpeta cifrada propia o bóveda cooperativa europea (en diseño):</strong> pensada para quien vive solo con un único teléfono sin tableta, sin saturar su correo principal.</li>',
      '</ul>',

      '<h3>4. Qué funciona hoy y qué estamos conectando (Ley 0 de honestidad)</h3>',
      '<p>Hoy ya funcionan en producción la <strong>sincronización inmediata de notas, publicaciones y mensajes</strong> y la <strong>exportación completa de tu cuenta</strong> en un archivo (<code>socdepoble.exportacio.v1</code>) desde <a href="/el-meu-perfil"><strong>Mi perfil</strong></a>. En el <a href="/xat"><strong>Chat</strong></a>, en <strong>Ajustes › Chats › «Copia de seguridad»</strong>, ya puedes <strong>guardar una copia <code>.sdpbackup</code> cifrada</strong> de las conversaciones que este dispositivo ha cargado y <strong>comprobar</strong> una copia (sin fotos, audios ni vídeos). Dentro de la app del móvil, si el sistema no ofrece la hoja de compartir, la página lo dice y desde allí no se puede guardar el archivo. El cifrado de extremo a extremo del chat, <strong>restaurar una copia <code>.sdpbackup</code> dentro de la aplicación</strong> y el hatillo completo con notas, publicaciones, perfil y fotos, el puente QR, la <em>Tableta Espejo</em> y la carpeta externa <strong>son todavía un diseño en curso de conexión</strong> y no están disponibles en la aplicación. <strong>El simulador inferior es una maqueta didáctica</strong>: no hace ninguna copia real ni envía datos.</p>',
    ].join('\n'),
  }),
  en: Object.freeze({
    title: 'The Digital Bundle of Sóc de Poble: how we are designing backups for your chat and your entire system so you never lose a memory',
    subtitle: 'Why WhatsApp loses messages when you switch or lose your phone—and the 4-layer custody we are building for chats, notebooks, posts, and photos',
    entradilla: 'Switching phones, dropping yours in water, or hitting Google’s 15 GB free ceiling should never erase years of conversations, family recipes, or photos. Here is a plain-language guide to the backup design we are wiring into Sóc de Poble, from your chat to your whole digital life, and to what already works today.',
    html: [
      '<h3>1. Why traditional WhatsApp backups fail ordinary people</h3>',
      '<p>Millions of people lose recent messages when switching or losing a phone because <strong>monolithic 3:00 AM backups miss daytime chats</strong>, <strong>video groups choke Google’s shared 15 GB Gmail quota</strong> (or Apple’s 5 GB iCloud tier), moving between Android and iPhone remains painful, and there is no simple one-file archive for a home tablet or USB-C drive.</p>',

      '<h3>2. Beyond chat: one bundle for your entire Sóc de Poble life</h3>',
      GRUP_TARGETA_DESCARREGUES_TRADUIT,
      '<p>We are building the <strong>Digital Bundle (<code>.sdpbackup</code>)</strong>. <strong>Once it is connected</strong>, you will choose whether to save <strong>Chat only</strong> or <strong>your full Sóc de Poble account</strong>: <a href="/xat"><strong>Chat</strong></a> history and voice notes, private <a href="/notes"><strong>Notebooks</strong></a>, everything you published on the <a href="/mur"><strong>Wall</strong></a> and <a href="/mercat"><strong>Market</strong></a>, <strong>your own photos</strong>, and your <a href="/el-meu-perfil"><strong>Profile</strong></a>.</p>',

      '<h3>3. Four custody layers we are designing, with zero cloud lock-in</h3>',
      figuraInteriorQuatreCapes(
        'Design of the four custody layers in Sóc de Poble: instant text sync with a 3-friend recovery circle, one-click .sdpbackup archive, direct QR phone-to-phone Wi-Fi bridge, and an automatic Home Mirror Tablet.',
        'Sunny Mediterranean comic illustration showing three neighbours holding forged iron keys, two phones beaming notebooks and photos into a tablet drawer, and a small lightbulb robot sealing a cloth bundle'
      ),
      '<ul>',
      '<li><strong>Layer 1 · Per-second text sync (live today):</strong> notes, posts, and messages are <strong>already saved to the server instantly</strong>. <strong>End-to-end chat encryption</strong>, with a tiny <code>241-byte</code> key envelope and trusted 3-friend recovery, is built but <strong>not switched on yet</strong>.</li>',
      '<li><strong>Layer 2 · Portable <code>.sdpbackup</code> archive (“up to day X”; the first piece, for chat, is here; the rest is in design):</strong> a full or incremental file for tablets, computers, or USB-C drives, verified with SHA-256 before restoring. <strong>The first piece already works, for chat only:</strong> in <a href="/xat"><strong>Chat</strong></a>, under <strong>Settings › Chats › “Chat backup”</strong>, you can <strong>save a password-encrypted backup</strong> of the conversations this device has loaded and <strong>check</strong> that a backup opens with its password. <strong>Restoring it inside the app is not possible yet</strong>, <strong>photos, voice notes, and videos are not included</strong>, and notes, posts, and profile are still at the design stage.</li>',
      '<li><strong>Layer 3 · QR Wi-Fi phone-to-phone bridge & Home Mirror Tablet (€0 cloud cost, in design):</strong> you will be able to move your data directly between Android and iPhone over home Wi-Fi, or let your home tablet mirror new photos every night while your phone charges.</li>',
      '<li><strong>Layer 4 · Bring-your-own encrypted folder or European cooperative vault (in design):</strong> off-site protection for single-device neighbours without clogging Gmail.</li>',
      '</ul>',

      '<h3>4. Radical honesty on current status (Law 0)</h3>',
      '<p>Live today in production: <strong>instant sync of posts, notes, and messages</strong> and a <strong>full account export</strong> (<code>socdepoble.exportacio.v1</code>) from <a href="/el-meu-perfil"><strong>My profile</strong></a>. In <a href="/xat"><strong>Chat</strong></a>, under <strong>Settings › Chats › “Chat backup”</strong>, you can already <strong>save an encrypted <code>.sdpbackup</code> backup</strong> of the conversations this device has loaded and <strong>check</strong> a backup (without photos, voice notes, or videos). Inside the mobile app, if the system offers no share sheet, the page says so and the file cannot be saved from there. End-to-end chat encryption, <strong>restoring a <code>.sdpbackup</code> backup inside the app</strong> and the full bundle with notes, posts, profile, and photos, the QR bridge, the Home Mirror Tablet, and the external folder <strong>are still a design being wired in</strong> and are not available in the app. <strong>The simulator below is a teaching mock-up</strong>: it makes no real backup and sends no data.</p>',
    ].join('\n'),
  }),
  eu: Object.freeze({
    title: 'Sóc de Pobleren Fardeltxo Digitala: txataren eta sistema osoaren segurtasun-kopiak nola diseinatzen ari garen, oroitzapenik inoiz ez galtzeko',
    subtitle: 'Zergatik galtzen diren mezuak WhatsAppen mugikorra aldatzean eta nola babestu nahi ditugun txatak, oharrak, argitalpenak eta argazkiak 4 geruzatan',
    entradilla: 'Mugikorra aldatzeak, uretara erortzeak edo Googleren doako 15 GBak betetzeak ezin du urteetako elkarrizketak, errezetak eta argazkiak galtzea ekarri. Hona hemen Sóc de Poblen konektatzen ari garen segurtasun-kopien sistemaren diseinua, eta gaur dagoeneko zer dabilen.',
    html: [
      '<h3>1. Zergatik huts egiten duten WhatsAppen kopiek</h3>',
      '<p>Gaueko 3:00etako kopia bakarrak eguneko mezuak galtzen ditu mugikorra arratsaldean apurtzen bada, <strong>Googleren 15 GB partekatuak</strong> betetzean Gmail bera ere blokeatu daiteke, Android eta iPhone arteko aldaketa neketsua da eta ez dago tabletan edo USB-C memorian gordetzeko fitxategi bakar errazik.</p>',

      '<h3>2. Txata baino gehiago: zure Sóc de Poble osoa pakete bakarrean</h3>',
      GRUP_TARGETA_DESCARREGUES_TRADUIT,
      '<p><strong><code>.sdpbackup</code> fardeltxo digitala</strong> eraikitzen ari gara. <strong>Konektatuta dagoenean</strong>, zuk aukeratuko duzu <a href="/xat"><strong>Txata</strong></a> bakarrik ala <strong>sistema osoa</strong> gorde: elkarrizketak, <a href="/notes"><strong>Koadernoa</strong></a>, <a href="/mur"><strong>Horman</strong></a> argitaratutako guztia, <strong>zure argazkiak</strong> eta <a href="/el-meu-perfil"><strong>Profila</strong></a>.</p>',

      '<h3>3. Diseinatzen ari garen lau babes-geruzak eta 0 Legearen gardentasuna</h3>',
      figuraInteriorQuatreCapes(
        'Sóc de Pobleren lau babes-geruzen diseinua: berehalako sinkronizazioa hiru lagunen giltzekin, .sdpbackup fitxategi eramangarria, QR zubia bi mugikorren artean eta etxeko tableta ispilua.',
        'Patio eguzkitsu batean kokatutako komiki-bineta mediterraneoa, hiru auzokide burnizko giltzekin, bi mugikor eta etxeko tableta erakusten dituena'
      ),
      '<p><strong>1. geruza (gaur dabil):</strong> testuen, oharren eta argitalpenen berehalako sinkronizazioa zerbitzarian. Txataren <strong>muturretik muturrerako zifratzea</strong>, <code>241 byte</code>ko gako-gutunazalarekin eta konfiantzazko 3 lagunen berreskurapenarekin, prest dago, baina <strong>oraindik itzalita</strong>. <strong>2. geruza (lehen pieza, txatarena, badago; gainerakoa diseinuan):</strong> klik bakarreko <code>.sdpbackup</code> fitxategia tabletarako edo USB-Crako. Lehen pieza dagoeneko badabil, txaterako bakarrik: <a href="/xat"><strong>Txatean</strong></a>, <strong>Ezarpenak › Txatak › «Babeskopia»</strong> atalean, gailu honek kargatu dituen elkarrizketen <strong>pasahitzarekin zifratutako kopia gorde</strong> dezakezu eta kopia bat bere pasahitzarekin irekitzen dela <strong>egiaztatu</strong>. Mugikorreko aplikazioan, sistemak partekatzeko orririk eskaintzen ez badu, orriak hala esaten du eta ezin da fitxategia handik gorde. <strong>Oraindik ezin da aplikazioaren barruan leheneratu</strong>, <strong>argazkiak, audioak eta bideoak ez dira sartzen</strong>, eta oharrak, argitalpenak eta profila diseinuan daude oraindik. <strong>3. geruza (diseinuan):</strong> Wi-Fi bidezko QR zubia Android eta iPhone artean eta <strong>etxeko tableta ispilu automatikoa 0 €-an</strong>. <strong>4. geruza (diseinuan):</strong> kanpoko karpeta zifratua gailu bakarra dutenentzat. Gaur bertan berehalako sinkronizazioa eta kontu-esportazio osoa (<code>socdepoble.exportacio.v1</code>) daude martxan, <a href="/el-meu-perfil"><strong>Profila</strong></a> ataletik, eta Txatean txataren <code>.sdpbackup</code> kopia zifratua ere (gorde eta egiaztatu daiteke; leheneratu, ez oraindik). <strong>Beheko simulatzailea maketa didaktiko bat da</strong>: ez du benetako kopiarik egiten, ezta daturik bidaltzen ere.</p>',
    ].join('\n'),
  }),
  gl: Object.freeze({
    title: 'O Fardelo Dixital de Sóc de Poble: así deseñamos as copias de seguridade do chat e de todo o sistema para non perder ningunha lembranza',
    subtitle: 'Por que en WhatsApp se perden mensaxes ao cambiar ou perder o móbil e como queremos resolvelo en 4 capas para conversas, notas, publicacións e fotos',
    entradilla: 'Cambiar de teléfono, que caia á auga ou que se enchan os 15 GB gratuítos de Google non pode significar perder anos de conversas, receitas anotadas nin fotografías familiares. Explicámosche con palabras claras o deseño das copias de seguridade que estamos a conectar en Sóc de Poble e o que xa funciona hoxe.',
    html: [
      '<h3>1. Por que fallan as copias tradicionais de WhatsApp</h3>',
      '<p>As copias nocturnas das 3:00 deixan fóra as mensaxes do día se o teléfono rompe pola tarde, os vídeos acaban esgotando os <strong>15 GB compartidos de Google Drive e Gmail</strong>, pasar entre Android e iPhone segue a ser complexo e non existe un arquivo único listo para gardar nunha tableta ou chave USB-C.</p>',

      '<h3>2. Non só o chat: copia completa de todo o teu Sóc de Poble</h3>',
      GRUP_TARGETA_DESCARREGUES_TRADUIT,
      '<p>Estamos a construír o noso <strong>Fardelo Dixital (<code>.sdpbackup</code>)</strong>. <strong>Cando estea conectado</strong>, poderás escoller se gardar só o <a href="/xat"><strong>Chat</strong></a> ou <strong>todo o sistema</strong>: conversas e audios, todos os cadernos do <a href="/notes"><strong>Bloc de Notas</strong></a>, todo o publicado no <a href="/mur"><strong>Muro</strong></a> e no <a href="/mercat"><strong>Mercado</strong></a>, <strong>as túas propias fotografías</strong> e o teu <a href="/el-meu-perfil"><strong>Perfil</strong></a>.</p>',

      '<h3>3. As catro capas de custodia que estamos a deseñar e transparencia total (Lei 0)</h3>',
      figuraInteriorQuatreCapes(
        'Deseño das catro capas de custodia de Sóc de Poble: sincronización ao segundo con círculo de tres chaves amigas, arquivo .sdpbackup para tableta ou USB, ponte QR entre dous móbiles e a tableta espello na casa.',
        'Viñeta cómica mediterránea ao sol cun grupo de veciños erguendo chaves de ferro, dous móbiles pasando notas e fotos a unha tableta e un robot pequeno selando un fardelo'
      ),
      '<p><strong>Capa 1 (xa activa):</strong> textos, notas e publicacións <strong>gárdanse ao segundo no servidor</strong>. O <strong>cifrado de extremo a extremo do chat</strong>, cun sobre de <code>241 bytes</code> para a túa chave e un círculo de 3 amizades, está preparado pero <strong>aínda apagado</strong>. <strong>Capa 2 (a primeira peza, a do chat, xa está; o resto, en deseño):</strong> arquivo <code>.sdpbackup</code> («ata o día X» ou incremental) para tableta, ordenador ou USB-C con verificación SHA-256 antes de restaurar. A primeira peza xa funciona, só para o chat: no <a href="/xat"><strong>Chat</strong></a>, en <strong>Axustes › Chats › «Copia de seguridade»</strong>, podes <strong>gardar unha copia cifrada con contrasinal</strong> das conversas que este dispositivo cargou e <strong>comprobar</strong> que unha copia se abre co seu contrasinal. Dentro da aplicación do móbil, se o sistema non ofrece a folla de compartir, a páxina dio e non se pode gardar o ficheiro desde alí. <strong>Aínda non é posible restaurala dentro da aplicación</strong>, <strong>as fotos, os audios e os vídeos non se inclúen</strong>, e as notas, as publicacións e o perfil seguen en deseño. <strong>Capa 3 (en deseño):</strong> ponte QR directa por Wi-Fi entre Android e iPhone e <strong>«Tableta Espello na Casa» a custo 0 €</strong> cada noite mentres cargas o móbil. <strong>Capa 4 (en deseño):</strong> carpeta cifrada propia ou bóveda cooperativa europea para quen vive só cun único móbil. Hoxe xa funcionan en produción a sincronización inmediata e a exportación completa da conta (<code>socdepoble.exportacio.v1</code>) desde o teu <a href="/el-meu-perfil"><strong>Perfil</strong></a>. No Chat xa podes gardar e comprobar a copia <code>.sdpbackup</code> cifrada das conversas cargadas neste dispositivo, sen fotos, audios nin vídeos e aínda sen restauración dentro da aplicación. <strong>O simulador de abaixo é unha maqueta didáctica</strong>: non fai ningunha copia real nin envía datos.</p>',
    ].join('\n'),
  }),
});

export const COPIES_SEGURETAT_SOC_DE_POBLE_COPY = COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS;

export const COPIES_SEGURETAT_SOC_DE_POBLE_POST = Object.freeze({
  id: COPIES_SEGURETAT_SOC_DE_POBLE_ID,
  slug: COPIES_SEGURETAT_SOC_DE_POBLE_ID,
  type: 'post',
  title: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.title,
  subtitle: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.subtitle,
  post_subtitle: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.subtitle,
  description: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.entradilla,
  lead: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.entradilla,
  entradilla: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca.entradilla,
  image_url: IMATGE_HERO_COPIES_SEGURETAT,
  image_alt: 'Vinyeta d’estil còmic mediterrani en una plaça assolellada de poble on a l’esquerra un veí perd el mòbil dins del safareig sota un núvol encadenat de 15 GB plens, mentre a la dreta sota l’olivera la iaia entrega una còpia segura amb tauleta, llapis USB i robotets portant quaderns i fotos',
  content: COPIES_SEGURETAT_SOC_DE_POBLE_HTML,
  translations: COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS,
  created_at: '2026-11-14T17:35:00+01:00',
  important: true,
  author_entity_id: 'socdepoble',
  author: 'Sóc de Poble',
  author_name: 'Sóc de Poble',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_location: 'La Torre de les Maçanes',
  town: 'La Torre de les Maçanes',
  town_name: 'La Torre de les Maçanes',
  poble_id: 'la-torre-de-les-macanes',
  categoria_tematica_id: 'tecnologia-lliure',
  category: '💻 Tecnologia i Disseny',
  tags: ['Projecte Sóc de Poble', 'Documentació', 'Node 0'],
  labels: [
    { text: '💻 Tecnologia i Disseny', className: 'sdp-badge-category' },
    { text: 'Projecte Sóc de Poble', className: 'sdp-badge-tag' },
    { text: 'Documentació', className: 'sdp-badge-tag' },
    { text: 'Node 0', className: 'sdp-badge-tag' },
  ],
  copyright: 'Text i simulador didàctic: Sóc de Poble (CC BY-SA 4.0)',
});
