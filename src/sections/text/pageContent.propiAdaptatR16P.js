/* P0-77 / IDEA-208 (R16-P; ordre del Mestre, 261109 20:57) · /disseny en 5 llengües (ca, es, en, eu, gl):
 *   1. Què és propi de Sóc de Poble i quins patrons hem adaptat d'altres aplicacions, i on viuen.
 *   2. La matriu de la data de cada targeta del Mur segons l'arquetip (src/sections/mur/arquetipDeData.js).
 * Llei 0 · Cada línia diu el que fa el codi: la llista viva d'El Comú (EspecimenUniversalListCard), el TPV
 * (registre.js, sdp-clon-loiverse), les negretes i els directes buits del xat (negreta.js), el desament sense
 * botó (EspecimenEstatDesament), el Lector (UniversalWorkspace, dreceres.js), els avisos del Markdown de la Wiki
 * (parseMarkdown.js) i la data de les targetes (arquetipDeData.js, TargetaDelMur.jsx, EventCard.jsx).
 * IMPORTANT · onadaR18Carbon.test.jsx llig PAGE_COPY.disseny: cap «sota demanda», «per defecte», «paquet de dades»
 * ni <code>.sdp-, en cap llengua. */

export const BLOC_DISSENY_R16P = Object.freeze({
  ca: `\n      <h3>Què és propi i què hem adaptat</h3>
      <p>El tronc és propi de <strong>Sóc de Poble</strong>: <strong>Pedra Seca</strong> (tokens, contrast i dianes tàctils), les peces universals <strong>UniversalCard</strong>, <strong>UniversalPage</strong> i <strong>UniversalWorkspace</strong>, i la <strong>barra taronja</strong> que diu qui publica. Quan una aplicació coneguda ja resol bé una tasca, n’estudiem el patró i el portem dins d’eixes peces, amb els tokens de Pedra Seca i sense copiar-ne els colors:</p>
      <ul>
        <li><strong>Bring!</strong> → la llista viva d’<strong>El Comú</strong>: una rajola per cosa, amb l’emoji o les inicials i el nom.</li>
        <li><strong>Loyverse</strong> → el <strong>TPV</strong> del Bar: el tiquet a l’esquerra i la graella de productes a la dreta.</li>
        <li><strong>WhatsApp</strong> → el <a href="/xat"><strong>Xat</strong></a>: les negretes entre asteriscs i un directe sense missatges que no ix a la llista fins al primer.</li>
        <li><strong>Google Docs</strong> → l’editor sense botó «Guardar»: tot es desa sol.</li>
        <li><strong>Feedly</strong> → el <strong>Lector</strong>: les no llegides de cada carpeta i les dreceres de teclat.</li>
        <li><strong>Obsidian</strong> → la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>: els avisos destacats dels textos en Markdown.</li>
      </ul>

      <h3>Què fa la data de cada targeta del Mur</h3>
      <p>La data no es comporta igual en totes les targetes: respon al que vol fer qui la llig.</p>
      <ul>
        <li><strong>Un acte</strong> de l’agenda: la data és un botó que porta al dia de l’acte al <a href="/calendari"><strong>Calendari</strong></a>, sense obrir la targeta. Tocar la targeta obri l’acte.</li>
        <li><strong>Un avís que caduca</strong> (busco gos, claus trobades, avís d’aigua, una fitxa d’animal perdut o trobat, una alerta municipal): la data només informa, sense clic. Les accions són <strong>Comentar</strong> i <strong>Compartir</strong>, al peu.</li>
        <li><strong>La resta de publicacions</strong> (crònica, notícia, pàgina): la data porta al mes del <a href="/calendari"><strong>Calendari</strong></a>.</li>
      </ul>\n`,
  es: `\n      <h3>Qué es propio y qué hemos adaptado</h3>
      <p>El tronco es propio de <strong>Sóc de Poble</strong>: <strong>Pedra Seca</strong> (tokens, contraste y dianas táctiles), las piezas universales <strong>UniversalCard</strong>, <strong>UniversalPage</strong> y <strong>UniversalWorkspace</strong>, y la <strong>barra naranja</strong> que dice quién publica. Cuando una aplicación conocida ya resuelve bien una tarea, estudiamos su patrón y lo llevamos dentro de esas piezas, con los tokens de Pedra Seca y sin copiar sus colores:</p>
      <ul>
        <li><strong>Bring!</strong> → la lista viva de <strong>El Comú</strong>: una baldosa por cosa, con el emoji o las iniciales y el nombre.</li>
        <li><strong>Loyverse</strong> → el <strong>TPV</strong> del Bar: el tique a la izquierda y la cuadrícula de productos a la derecha.</li>
        <li><strong>WhatsApp</strong> → el <a href="/xat"><strong>Chat</strong></a>: las negritas entre asteriscos y un directo sin mensajes que no aparece en la lista hasta el primero.</li>
        <li><strong>Google Docs</strong> → el editor sin botón «Guardar»: todo se guarda solo.</li>
        <li><strong>Feedly</strong> → el <strong>Lector</strong>: las no leídas de cada carpeta y los atajos de teclado.</li>
        <li><strong>Obsidian</strong> → la <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>: los avisos destacados de los textos en Markdown.</li>
      </ul>

      <h3>Qué hace la fecha de cada tarjeta del Muro</h3>
      <p>La fecha no se comporta igual en todas las tarjetas: responde a lo que quiere hacer quien la lee.</p>
      <ul>
        <li><strong>Un acto</strong> de la agenda: la fecha es un botón que lleva al día del acto en el <a href="/calendari"><strong>Calendario</strong></a>, sin abrir la tarjeta. Tocar la tarjeta abre el acto.</li>
        <li><strong>Un aviso que caduca</strong> (busco perro, llaves encontradas, aviso de agua, una ficha de animal perdido o encontrado, una alerta municipal): la fecha solo informa, sin clic. Las acciones son <strong>Comentar</strong> y <strong>Compartir</strong>, al pie.</li>
        <li><strong>El resto de publicaciones</strong> (crónica, noticia, página): la fecha lleva al mes del <a href="/calendari"><strong>Calendario</strong></a>.</li>
      </ul>\n`,
  en: `\n      <h3>What is our own and what we have adapted</h3>
      <p>The trunk is <strong>Sóc de Poble</strong>’s own: <strong>Pedra Seca</strong> (tokens, contrast and touch targets), the universal pieces <strong>UniversalCard</strong>, <strong>UniversalPage</strong> and <strong>UniversalWorkspace</strong>, and the <strong>orange bar</strong> that says who publishes. When a well-known app already solves a task well, we study its pattern and bring it inside those pieces, with the Pedra Seca tokens and without copying its colours:</p>
      <ul>
        <li><strong>Bring!</strong> → the live list of <strong>El Comú</strong>: one tile per item, with the emoji or the initials and the name.</li>
        <li><strong>Loyverse</strong> → the Bar’s <strong>point of sale</strong>: the ticket on the left and the product grid on the right.</li>
        <li><strong>WhatsApp</strong> → the <a href="/xat"><strong>Chat</strong></a>: bold text between asterisks, and a direct chat with no messages that stays off the list until the first one.</li>
        <li><strong>Google Docs</strong> → the editor with no “Save” button: everything saves itself.</li>
        <li><strong>Feedly</strong> → the <strong>Reader</strong>: the unread items of each folder and the keyboard shortcuts.</li>
        <li><strong>Obsidian</strong> → the <a href="/wikidepoble"><strong>Village Wiki</strong></a>: the highlighted notices of Markdown texts.</li>
      </ul>

      <h3>What the date does on each Wall card</h3>
      <p>The date does not behave the same on every card: it answers what the reader wants to do.</p>
      <ul>
        <li><strong>An event</strong> on the agenda: the date is a button that takes you to the event’s day in the <a href="/calendari"><strong>Calendar</strong></a>, without opening the card. Tapping the card opens the event.</li>
        <li><strong>A notice that expires</strong> (lost dog, keys found, water notice, a lost or found animal listing, a municipal alert): the date only informs, with no click. The actions are <strong>Comment</strong> and <strong>Share</strong>, at the foot.</li>
        <li><strong>Every other post</strong> (chronicle, news, page): the date takes you to that month in the <a href="/calendari"><strong>Calendar</strong></a>.</li>
      </ul>\n`,
  eu: `\n      <h3>Zer den gurea eta zer egokitu dugun</h3>
      <p>Enborra <strong>Sóc de Poble</strong>rena da: <strong>Pedra Seca</strong> (tokenak, kontrastea eta ukipen-eremuak), pieza unibertsalak (<strong>UniversalCard</strong>, <strong>UniversalPage</strong> eta <strong>UniversalWorkspace</strong>) eta nork argitaratzen duen esaten duen <strong>barra laranja</strong>. Aplikazio ezagun batek zeregin bat ondo ebazten duenean, haren eredua aztertu eta pieza horien barruan ekartzen dugu, Pedra Secaren tokenekin eta haren koloreak kopiatu gabe:</p>
      <ul>
        <li><strong>Bring!</strong> → <strong>El Comú</strong>ren zerrenda bizia: lauza bat gauza bakoitzeko, emojiarekin edo inizialekin eta izenarekin.</li>
        <li><strong>Loyverse</strong> → Tabernako <strong>salmenta-puntua</strong>: tiketa ezkerrean eta produktuen sareta eskuinean.</li>
        <li><strong>WhatsApp</strong> → <a href="/xat"><strong>Txata</strong></a>: izartxoen arteko letra lodia, eta mezurik gabeko txat zuzena zerrendan ez da agertzen lehen mezura arte.</li>
        <li><strong>Google Docs</strong> → «Gorde» botoirik gabeko editorea: dena bere kabuz gordetzen da.</li>
        <li><strong>Feedly</strong> → <strong>Irakurgailua</strong>: karpeta bakoitzeko irakurri gabeak eta teklatuko lasterbideak.</li>
        <li><strong>Obsidian</strong> → <a href="/wikidepoble"><strong>Herriko Wikia</strong></a>: Markdown testuetako abisu nabarmenduak.</li>
      </ul>

      <h3>Zer egiten duen Hormako txartel bakoitzeko datak</h3>
      <p>Data ez da berdin portatzen txartel guztietan: irakurleak egin nahi duenari erantzuten dio.</p>
      <ul>
        <li><strong>Agendako ekitaldi bat</strong>: data botoi bat da, eta ekitaldiaren egunera eramaten zaitu <a href="/calendari"><strong>Egutegian</strong></a>, txartela ireki gabe. Txartela ukitzean ekitaldia irekitzen da.</li>
        <li><strong>Iraungitzen den abisu bat</strong> (txakur bat bilatzen, giltzak aurkituta, ur-abisua, galdutako edo aurkitutako animalia baten fitxa, udal-alerta bat): datak informatu besterik ez du egiten, klikik gabe. Ekintzak <strong>Iruzkindu</strong> eta <strong>Partekatu</strong> dira, oinean.</li>
        <li><strong>Gainerako argitalpenak</strong> (kronika, albistea, orria): datak <a href="/calendari"><strong>Egutegiko</strong></a> hilabetera eramaten zaitu.</li>
      </ul>\n`,
  gl: `\n      <h3>Que é propio e que adaptamos</h3>
      <p>O tronco é propio de <strong>Sóc de Poble</strong>: <strong>Pedra Seca</strong> (tokens, contraste e dianas táctiles), as pezas universais <strong>UniversalCard</strong>, <strong>UniversalPage</strong> e <strong>UniversalWorkspace</strong>, e a <strong>barra laranxa</strong> que di quen publica. Cando unha aplicación coñecida xa resolve ben unha tarefa, estudamos o seu patrón e levámolo dentro desas pezas, cos tokens de Pedra Seca e sen copiar as súas cores:</p>
      <ul>
        <li><strong>Bring!</strong> → a lista viva de <strong>El Comú</strong>: unha lousa por cousa, co emoji ou as iniciais e o nome.</li>
        <li><strong>Loyverse</strong> → o <strong>TPV</strong> do Bar: o tíquet á esquerda e a grella de produtos á dereita.</li>
        <li><strong>WhatsApp</strong> → o <a href="/xat"><strong>Chat</strong></a>: as negras entre asteriscos e un directo sen mensaxes que non sae na lista ata a primeira.</li>
        <li><strong>Google Docs</strong> → o editor sen botón «Gardar»: todo se garda só.</li>
        <li><strong>Feedly</strong> → o <strong>Lector</strong>: as non lidas de cada cartafol e os atallos de teclado.</li>
        <li><strong>Obsidian</strong> → a <a href="/wikidepoble"><strong>Wiki de Poble</strong></a>: os avisos destacados dos textos en Markdown.</li>
      </ul>

      <h3>Que fai a data de cada tarxeta do Muro</h3>
      <p>A data non se comporta igual en todas as tarxetas: responde ao que quere facer quen a le.</p>
      <ul>
        <li><strong>Un acto</strong> da axenda: a data é un botón que leva ao día do acto no <a href="/calendari"><strong>Calendario</strong></a>, sen abrir a tarxeta. Tocar a tarxeta abre o acto.</li>
        <li><strong>Un aviso que caduca</strong> (busco can, chaves atopadas, aviso de auga, unha ficha de animal perdido ou atopado, unha alerta municipal): a data só informa, sen clic. As accións son <strong>Comentar</strong> e <strong>Compartir</strong>, ao pé.</li>
        <li><strong>O resto de publicacións</strong> (crónica, nova, páxina): a data leva ao mes do <a href="/calendari"><strong>Calendario</strong></a>.</li>
      </ul>\n`,
});
