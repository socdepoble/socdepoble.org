import { Link } from '../../app/contexts/RouterContext';

const URL_APERTIUM = 'https://www.apertium.org/';
const URL_MYMEMORY = 'https://mymemory.translated.net/';
const URL_TRANSLATED = 'https://translated.com/';
const URL_WORDPRESS = 'https://wordpress.org/';
const RUTA_CONTROLS_BARRA = '/disseny?categoria=fonaments&item=fonaments-controls-barra';

function EnllacExtern({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const CONTINGUT_PER_LLENGUA = {
  ca: {
    paginesIntro: (
      <>
        Traduïx <strong>la pàgina que llegixes sense eixir-ne</strong>: amb{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>,{' '}
        <strong>programari lliure</strong>, i, per al <strong>basc i l’alemany</strong>, amb{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>.
      </>
    ),
    peuFiguraBarraBlava: (
      <>
        Mostra de la <strong>Barra Blava</strong> de la pàgina: prement la icona central{' '}
        <strong>Traduir</strong> s’obri el menú amb les sis llengües disponibles i l’opció{' '}
        <strong>Original (valencià)</strong>.
      </>
    ),
    paginesBarraComportament: (
      <>
        Quan prems <strong>Traduir</strong>, el menú es desplega just davall de la barra, es tanca amb{' '}
        <strong>Escape</strong> o clicant fora, i <strong>conserva els enllaços i les negretes</strong>{' '}
        de l’article sense deixar entrar cap codi extern; un avís superior permet tornar a{' '}
        <strong>Veure l’original</strong> en qualsevol moment. Pots consultar l’anatomia completa de totes
        les barres i botons a{' '}
        <Link to={RUTA_CONTROLS_BARRA}><strong>Controls de barra (Catàleg de Disseny)</strong></Link>.
      </>
    ),
    paginesMotors: (
      <>
        El <strong>botó Traduir de la Barra Blava</strong> traduïx la pàgina{' '}
        <strong>al castellà, al gallec, al basc, a l’anglés, al francés i a l’alemany</strong>. Per al{' '}
        <strong>castellà, el gallec, l’anglés i el francés</strong> ho fa amb{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>, un{' '}
        <strong>traductor de programari lliure</strong>. Per al <strong>basc i l’alemany</strong>, que
        Apertium no oferix des del valencià, ho fa amb{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>, el servei de
        l’empresa italiana <EnllacExtern href={URL_TRANSLATED}><strong>Translated</strong></EnllacExtern>,
        que <strong>no diu quin motor automàtic</strong> fa servir.
      </>
    ),
    paginesPrivacitat: (
      <>
        <strong>Només quan tries una llengua</strong>, el text de la pàgina ix cap al traductor: a{' '}
        <strong>socdepoble.org</strong>, des del teu navegador directament al servei, que{' '}
        <strong>veu la teua adreça IP</strong>; en un lloc amb <strong>servidor propi</strong>, com{' '}
        <EnllacExtern href={URL_WORDPRESS}><strong>WordPress</strong></EnllacExtern>, a través d’eixe
        servidor, que pot tindre configurat un altre proveïdor.{' '}
        <strong>MyMemory pot guardar els textos</strong> que rep i <strong>registrar l’adreça IP</strong>,
        i el basc i l’alemany tenen un <strong>límit diari de traduccions</strong>. Per això{' '}
        <strong>només es traduïx el text de les pàgines públiques</strong>,{' '}
        <strong>mai els teus missatges ni les teues notes</strong> (més detall a{' '}
        <Link to="/legal"><strong>Legal i privacitat</strong></Link>). On no hi ha traducció, el botó ho diu.
      </>
    ),
    targetesIntro: (
      <>
        Com funciona la <strong>traducció del contingut</strong> creat pels usuaris en{' '}
        <strong>altres pobles</strong>.
      </>
    ),
    peuFiguraTargeta: (
      <>
        Mostra del <strong>peu blau de cada Targeta Universal</strong>: la primera icona de l’esquerra
        és el botó <strong>Traduir</strong> d’aquella publicació.
      </>
    ),
    motorCos: (
      <>
        A part de l’<strong>idioma base de la interfície</strong>, les <strong>Targetes</strong> (
        <Link to="/mur"><strong>Mur</strong></Link>, <Link to="/xat"><strong>Xats</strong></Link>,{' '}
        <Link to="/mercat"><strong>Mercat</strong></Link> i{' '}
        <Link to="/calendari"><strong>Esdeveniments</strong></Link>) comptaran amb un{' '}
        <strong>motor de traducció automàtica</strong>. Et permetrà <strong>llegir a l’instant</strong>{' '}
        el que escriuen usuaris d’<strong>altres pobles de l’estat</strong> (per exemple, si algú publica
        en <strong>euskara</strong> o en <strong>gallec</strong>) traduint-ho a la teua{' '}
        <strong>llengua de preferència</strong>.
      </>
    ),
    usCos: (
      <>
        Busca la <strong>icona de traducció</strong> dins de les publicacions de les targetes: servirà
        per a <strong>traduir només aquell missatge o publicació específica</strong>. Mentre la{' '}
        <strong>traducció de targetes no estiga connectada</strong>, el botó porta a aquesta pàgina.
      </>
    ),
    notaCos: (
      <>
        Les <strong>traduccions automàtiques</strong> poden contindre{' '}
        <strong>xicotets errors d’interpretació</strong> quan es tracta d’
        <strong>expressions molt locals</strong> o <strong>frases fetes de cada territori</strong>.
      </>
    )
  },

  es: {
    paginesIntro: (
      <>
        Traduce <strong>la página que estás leyendo sin salir de ella</strong>: con{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>,{' '}
        <strong>software libre</strong>, y, para el <strong>euskera y el alemán</strong>, con{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>.
      </>
    ),
    peuFiguraBarraBlava: (
      <>
        Muestra de la <strong>barra azul</strong> de la página: al pulsar el icono central{' '}
        <strong>Traducir</strong> se despliega el menú con las seis lenguas disponibles y la opción{' '}
        <strong>Original (valenciano)</strong>.
      </>
    ),
    paginesBarraComportament: (
      <>
        Al pulsar <strong>Traducir</strong>, el menú se abre justo debajo de la barra, se cierra con{' '}
        <strong>Escape</strong> o haciendo clic fuera, y <strong>conserva los enlaces y las negritas</strong>{' '}
        del artículo sin admitir código externo; un aviso superior permite volver a{' '}
        <strong>Ver el original</strong> en cualquier momento. Puedes consultar la anatomía completa de
        todas las barras y botones en{' '}
        <Link to={RUTA_CONTROLS_BARRA}><strong>Controles de barra (Catálogo de Diseño)</strong></Link>.
      </>
    ),
    paginesMotors: (
      <>
        El <strong>botón «Traduir» de la barra azul</strong> traduce la página{' '}
        <strong>al castellano, al gallego, al euskera, al inglés, al francés y al alemán</strong>. Para el{' '}
        <strong>castellano, el gallego, el inglés y el francés</strong> lo hace con{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>, un{' '}
        <strong>traductor de software libre</strong>. Para el <strong>euskera y el alemán</strong>, que
        Apertium no ofrece desde el valenciano, lo hace con{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>, el servicio de la
        empresa italiana <EnllacExtern href={URL_TRANSLATED}><strong>Translated</strong></EnllacExtern>,
        que <strong>no dice qué motor automático</strong> utiliza.
      </>
    ),
    paginesPrivacitat: (
      <>
        <strong>Solo cuando eliges una lengua</strong>, el texto de la página sale hacia el traductor: en{' '}
        <strong>socdepoble.org</strong>, desde tu navegador directamente al servicio, que{' '}
        <strong>ve tu dirección IP</strong>; en un sitio con <strong>servidor propio</strong>, como{' '}
        <EnllacExtern href={URL_WORDPRESS}><strong>WordPress</strong></EnllacExtern>, a través de ese
        servidor, que puede tener configurado otro proveedor.{' '}
        <strong>MyMemory puede guardar los textos</strong> que recibe y <strong>registrar la dirección IP</strong>,
        y el euskera y el alemán tienen un <strong>límite diario de traducciones</strong>. Por eso{' '}
        <strong>solo se traduce el texto de las páginas públicas</strong>,{' '}
        <strong>nunca tus mensajes ni tus notas</strong> (más detalle en{' '}
        <Link to="/legal"><strong>Aviso legal y privacidad</strong></Link>). Donde no hay traducción, el botón lo indica.
      </>
    ),
    targetesIntro: (
      <>
        Cómo funciona la <strong>traducción del contenido</strong> creado por los usuarios de{' '}
        <strong>otros pueblos</strong>.
      </>
    ),
    peuFiguraTargeta: (
      <>
        Muestra del <strong>pie azul de cada Tarjeta Universal</strong>: el primer icono de la izquierda
        es el botón <strong>Traducir</strong> de esa publicación.
      </>
    ),
    motorCos: (
      <>
        Además del <strong>idioma base de la interfaz</strong>, las <strong>Tarjetas</strong> (
        <Link to="/mur"><strong>Muro</strong></Link>, <Link to="/xat"><strong>Chats</strong></Link>,{' '}
        <Link to="/mercat"><strong>Mercado</strong></Link> y{' '}
        <Link to="/calendari"><strong>Eventos</strong></Link>) contarán con un{' '}
        <strong>motor de traducción automática</strong>. Te permitirá <strong>leer al instante</strong> lo
        que escriben usuarios de <strong>otros pueblos del estado</strong> (por ejemplo, si alguien publica
        en <strong>euskera</strong> o en <strong>gallego</strong>) traduciéndolo a tu{' '}
        <strong>lengua de preferencia</strong>.
      </>
    ),
    usCos: (
      <>
        Busca el <strong>icono de traducción</strong> dentro de las publicaciones de las tarjetas: servirá
        para <strong>traducir solo ese mensaje o publicación concreta</strong>. Mientras la{' '}
        <strong>traducción de tarjetas no esté conectada</strong>, el botón lleva a esta página.
      </>
    ),
    notaCos: (
      <>
        Las <strong>traducciones automáticas</strong> pueden contener{' '}
        <strong>pequeños errores de interpretación</strong> cuando se trata de{' '}
        <strong>expresiones muy locales</strong> o <strong>frases hechas de cada territorio</strong>.
      </>
    )
  },

  en: {
    paginesIntro: (
      <>
        Translate <strong>the page you are reading without leaving it</strong>: with{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>,{' '}
        <strong>free software</strong>, and, for <strong>Basque and German</strong>, with{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>.
      </>
    ),
    peuFiguraBarraBlava: (
      <>
        Live sample of the page’s <strong>blue bar</strong>: pressing the central{' '}
        <strong>Translate</strong> icon opens the menu with the six available languages and{' '}
        <strong>Original (Valencian)</strong>.
      </>
    ),
    paginesBarraComportament: (
      <>
        When you press <strong>Translate</strong>, the menu drops down right below the bar, closes with{' '}
        <strong>Escape</strong> or an outside click, and <strong>preserves links and bold text</strong>{' '}
        without accepting external markup; a top notice lets you return to{' '}
        <strong>View original</strong> anytime. Explore the full anatomy of every bar and button under{' '}
        <Link to={RUTA_CONTROLS_BARRA}><strong>Bar controls (Design Catalogue)</strong></Link>.
      </>
    ),
    paginesMotors: (
      <>
        The <strong>«Traduir» button on the blue bar</strong> translates the page into{' '}
        <strong>Spanish, Galician, Basque, English, French and German</strong>. For{' '}
        <strong>Spanish, Galician, English and French</strong> it uses{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>, a{' '}
        <strong>free-software translator</strong>. For <strong>Basque and German</strong>, which Apertium
        does not offer from Valencian, it uses{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>, a service of the
        Italian company <EnllacExtern href={URL_TRANSLATED}><strong>Translated</strong></EnllacExtern>,
        which <strong>does not say which machine translation engine</strong> it uses.
      </>
    ),
    paginesPrivacitat: (
      <>
        <strong>Only when you choose a language</strong> does the page text go to the translator: on{' '}
        <strong>socdepoble.org</strong>, straight from your browser to the service, which{' '}
        <strong>sees your IP address</strong>; on a site with its <strong>own server</strong>, such as{' '}
        <EnllacExtern href={URL_WORDPRESS}><strong>WordPress</strong></EnllacExtern>, through that server,
        which may have another provider set up. <strong>MyMemory may store the texts</strong> it receives
        and <strong>log the IP address</strong>, and Basque and German have a{' '}
        <strong>daily translation limit</strong>. That is why{' '}
        <strong>only the text of public pages is translated</strong>,{' '}
        <strong>never your messages or your notes</strong> (full details under{' '}
        <Link to="/legal"><strong>Legal and privacy</strong></Link>). Where there is no translation, the button says so.
      </>
    ),
    targetesIntro: (
      <>
        How <strong>content written by people</strong> in <strong>other villages</strong> gets translated.
      </>
    ),
    peuFiguraTargeta: (
      <>
        Live sample of the <strong>blue footer on every Universal Card</strong>: the first icon on the
        left is the <strong>Translate</strong> button for that post.
      </>
    ),
    motorCos: (
      <>
        Besides the <strong>base interface language</strong>, <strong>Cards</strong> (
        <Link to="/mur"><strong>Wall</strong></Link>, <Link to="/xat"><strong>Chats</strong></Link>,{' '}
        <Link to="/mercat"><strong>Market</strong></Link> and{' '}
        <Link to="/calendari"><strong>Events</strong></Link>) will have a{' '}
        <strong>machine translation engine</strong>. It will let you <strong>read at once</strong> what
        people from <strong>other villages across the state</strong> write (for example, if someone posts
        in <strong>Basque</strong> or <strong>Galician</strong>), translated into your{' '}
        <strong>preferred language</strong>.
      </>
    ),
    usCos: (
      <>
        Look for the <strong>translate icon</strong> inside card posts: it will{' '}
        <strong>translate just that message or post</strong>. Until{' '}
        <strong>card translation is connected</strong>, the button brings you to this page.
      </>
    ),
    notaCos: (
      <>
        <strong>Machine translations</strong> may contain <strong>small misreadings</strong> when dealing
        with <strong>very local expressions</strong> or <strong>idioms from each area</strong>.
      </>
    )
  },

  eu: {
    paginesIntro: (
      <>
        <strong>Irakurtzen ari zaren orria itzultzen du, handik irten gabe</strong>:{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>{' '}
        <strong>software librearekin</strong> eta, <strong>euskararako eta alemanerako</strong>,{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern> zerbitzuarekin.
      </>
    ),
    peuFiguraBarraBlava: (
      <>
        Orriaren <strong>barra urdinaren</strong> erakusgarria: erdiko <strong>Itzuli</strong> ikonoa
        sakatzean sei hizkuntzen menua eta <strong>Jatorrizkoa (valentziera)</strong> aukera zabaltzen dira.
      </>
    ),
    paginesBarraComportament: (
      <>
        <strong>Itzuli</strong> sakatzean, menua barraren azpian irekitzen da, <strong>Escape</strong>{' '}
        teklarekin edo kanpoan klik eginda ixten da, eta artikuluaren{' '}
        <strong>estekak eta letra lodiak mantentzen ditu</strong> kanpoko koderik onartu gabe; goiko oharrak{' '}
        <strong>Ikusi jatorrizkoa</strong> berreskuratzeko aukera ematen du edonoiz. Barren eta botoien
        anatomia osoa ikus dezakezu{' '}
        <Link to={RUTA_CONTROLS_BARRA}><strong>Barra-kontrolak (Diseinu Katalogoa)</strong></Link> atalean.
      </>
    ),
    paginesMotors: (
      <>
        <strong>Barra urdineko «Traduir» botoiak</strong> orria{' '}
        <strong>gaztelaniara, galegora, euskarara, ingelesera, frantsesera eta alemanera</strong> itzultzen
        du. <strong>Gaztelaniarako, galegorako, ingeleserako eta frantseserako</strong>{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern> erabiltzen du,{' '}
        <strong>software libreko itzultzailea</strong>. <strong>Euskararako eta alemanerako</strong>,
        Apertiumek valentzieratik eskaintzen ez dituenez,{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern> erabiltzen du,{' '}
        <EnllacExtern href={URL_TRANSLATED}><strong>Translated</strong></EnllacExtern> enpresa
        italiarraren zerbitzua; <strong>ez du esaten zein itzulpen automatikoko motor</strong> erabiltzen duen.
      </>
    ),
    paginesPrivacitat: (
      <>
        <strong>Hizkuntza bat aukeratzen duzunean bakarrik</strong> bidaltzen da orriaren testua
        itzultzailera: <strong>socdepoble.org</strong>-en, zure nabigatzailetik zuzenean zerbitzura, eta
        zerbitzuak <strong>zure IP helbidea ikusten du</strong>; <strong>zerbitzari propioa</strong> duen
        gune batean, <EnllacExtern href={URL_WORDPRESS}><strong>WordPress</strong></EnllacExtern>en
        adibidez, zerbitzari horren bidez, eta hark beste hornitzaile bat konfiguratuta izan dezake.{' '}
        <strong>MyMemoryk jasotzen dituen testuak gorde ditzake</strong> eta{' '}
        <strong>IP helbidea erregistratu</strong>, eta euskarak eta alemanak{' '}
        <strong>eguneko itzulpen-muga</strong> dute. Horregatik,{' '}
        <strong>orri publikoen testua bakarrik itzultzen da</strong>,{' '}
        <strong>inoiz ez zure mezuak edo oharrak</strong> (xehetasun gehiago{' '}
        <Link to="/legal"><strong>Lege-oharra eta pribatutasuna</strong></Link> orrian). Itzulpenik ez
        dagoenean, botoiak hala adierazten du.
      </>
    ),
    targetesIntro: (
      <>
        Nola itzultzen den <strong>beste herrietako erabiltzaileek</strong> sortutako{' '}
        <strong>edukia</strong>.
      </>
    ),
    peuFiguraTargeta: (
      <>
        <strong>Txartel Unibertsal bakoitzaren oin urdinaren</strong> erakusgarria: ezkerreko lehen
        ikonoa argitalpen horren <strong>Itzuli</strong> botoia da.
      </>
    ),
    motorCos: (
      <>
        <strong>Interfazearen oinarrizko hizkuntzaz</strong> gain, <strong>Txartelek</strong> (
        <Link to="/mur"><strong>Horma</strong></Link>, <Link to="/xat"><strong>Txatak</strong></Link>,{' '}
        <Link to="/mercat"><strong>Merkatua</strong></Link> eta{' '}
        <Link to="/calendari"><strong>Ekitaldiak</strong></Link>){' '}
        <strong>itzulpen automatikoko motor bat</strong> izango dute.{' '}
        <strong>Estatuko beste herrietako</strong> erabiltzaileek idazten dutena{' '}
        <strong>berehala irakurtzeko</strong> aukera emango dizu (adibidez, norbaitek{' '}
        <strong>euskaraz</strong> edo <strong>galegoz</strong> argitaratzen badu), zure{' '}
        <strong>hizkuntza hobetsira</strong> itzulita.
      </>
    ),
    usCos: (
      <>
        Bilatu <strong>itzulpen-ikonoa</strong> txartelen argitalpenetan:{' '}
        <strong>mezu edo argitalpen hori bakarrik itzultzeko</strong> balioko du.{' '}
        <strong>Txartelen itzulpena konektatuta ez dagoen bitartean</strong>, botoiak orri honetara
        eramaten zaitu.
      </>
    ),
    notaCos: (
      <>
        <strong>Itzulpen automatikoek</strong> <strong>interpretazio-akats txikiak</strong> izan ditzakete{' '}
        <strong>oso tokiko esamoldeetan</strong> edo <strong>lurralde bakoitzeko esaera finkoetan</strong>.
      </>
    )
  },

  gl: {
    paginesIntro: (
      <>
        Traduce <strong>a páxina que estás a ler sen saír dela</strong>: con{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>,{' '}
        <strong>software libre</strong>, e, para o <strong>éuscaro e o alemán</strong>, con{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>.
      </>
    ),
    peuFiguraBarraBlava: (
      <>
        Mostra da <strong>barra azul</strong> da páxina: ao premer a icona central{' '}
        <strong>Traducir</strong> ábrese o menú coas seis linguas dispoñibles e a opción{' '}
        <strong>Orixinal (valenciano)</strong>.
      </>
    ),
    paginesBarraComportament: (
      <>
        Ao premer <strong>Traducir</strong>, o menú desprégase xusto debaixo da barra, péchase con{' '}
        <strong>Escape</strong> ou premendo fóra, e <strong>conserva as ligazóns e as negras</strong> do
        artigo sen admitir código externo; un aviso superior permite volver a{' '}
        <strong>Ver o orixinal</strong> en calquera momento. Podes consultar a anatomía completa de todas
        as barras e botóns en{' '}
        <Link to={RUTA_CONTROLS_BARRA}><strong>Controis de barra (Catálogo de Deseño)</strong></Link>.
      </>
    ),
    paginesMotors: (
      <>
        O <strong>botón «Traduir» da barra azul</strong> traduce a páxina{' '}
        <strong>ao castelán, ao galego, ao éuscaro, ao inglés, ao francés e ao alemán</strong>. Para o{' '}
        <strong>castelán, o galego, o inglés e o francés</strong> faino con{' '}
        <EnllacExtern href={URL_APERTIUM}><strong>Apertium</strong></EnllacExtern>, un{' '}
        <strong>tradutor de software libre</strong>. Para o <strong>éuscaro e o alemán</strong>, que
        Apertium non ofrece desde o valenciano, faino con{' '}
        <EnllacExtern href={URL_MYMEMORY}><strong>MyMemory</strong></EnllacExtern>, o servizo da empresa
        italiana <EnllacExtern href={URL_TRANSLATED}><strong>Translated</strong></EnllacExtern>, que{' '}
        <strong>non di que motor automático</strong> emprega.
      </>
    ),
    paginesPrivacitat: (
      <>
        <strong>Só cando escolles unha lingua</strong>, o texto da páxina sae cara ao tradutor: en{' '}
        <strong>socdepoble.org</strong>, desde o teu navegador directamente ao servizo, que{' '}
        <strong>ve o teu enderezo IP</strong>; nun sitio con <strong>servidor propio</strong>, como{' '}
        <EnllacExtern href={URL_WORDPRESS}><strong>WordPress</strong></EnllacExtern>, a través dese
        servidor, que pode ter configurado outro provedor.{' '}
        <strong>MyMemory pode gardar os textos</strong> que recibe e <strong>rexistrar o enderezo IP</strong>,
        e o éuscaro e o alemán teñen un <strong>límite diario de traducións</strong>. Por iso{' '}
        <strong>só se traduce o texto das páxinas públicas</strong>,{' '}
        <strong>nunca as túas mensaxes nin as túas notas</strong> (máis detalle en{' '}
        <Link to="/legal"><strong>Aviso legal e privacidade</strong></Link>). Onde non hai tradución, o botón indícao.
      </>
    ),
    targetesIntro: (
      <>
        Como funciona a <strong>tradución do contido</strong> creado polos usuarios{' '}
        <strong>doutras vilas</strong>.
      </>
    ),
    peuFiguraTargeta: (
      <>
        Mostra do <strong>pé azul de cada Tarxeta Universal</strong>: a primeira icona da esquerda é o
        botón <strong>Traducir</strong> desa publicación.
      </>
    ),
    motorCos: (
      <>
        Ademais do <strong>idioma base da interface</strong>, as <strong>Tarxetas</strong> (
        <Link to="/mur"><strong>Muro</strong></Link>, <Link to="/xat"><strong>Chats</strong></Link>,{' '}
        <Link to="/mercat"><strong>Mercado</strong></Link> e{' '}
        <Link to="/calendari"><strong>Eventos</strong></Link>) contarán cun{' '}
        <strong>motor de tradución automática</strong>. Permitirache <strong>ler ao instante</strong> o
        que escriben usuarios <strong>doutras vilas do estado</strong> (por exemplo, se alguén publica en{' '}
        <strong>éuscaro</strong> ou en <strong>galego</strong>) traducíndoo á túa{' '}
        <strong>lingua de preferencia</strong>.
      </>
    ),
    usCos: (
      <>
        Busca a <strong>icona de tradución</strong> dentro das publicacións das tarxetas: servirá para{' '}
        <strong>traducir só esa mensaxe ou publicación concreta</strong>. Mentres a{' '}
        <strong>tradución de tarxetas non estea conectada</strong>, o botón leva a esta páxina.
      </>
    ),
    notaCos: (
      <>
        As <strong>traducións automáticas</strong> poden conter{' '}
        <strong>pequenos erros de interpretación</strong> cando se trata de{' '}
        <strong>expresións moi locais</strong> ou <strong>frases feitas de cada territorio</strong>.
      </>
    )
  }
};

export function obteContingutDidacticTraduccions(language) {
  return CONTINGUT_PER_LLENGUA[language] ?? CONTINGUT_PER_LLENGUA.ca;
}
