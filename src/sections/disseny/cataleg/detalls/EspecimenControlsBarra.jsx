import { useState } from 'react';
import { Especimen, useLlenguaDisseny } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { TEXTOS_CONTROLS_BARRA } from '../i18nControlsBarra.js';
import {
  ActionControl, IconButton, DateTimeControl, SelectorDataHora, BotoComentar, MenuComentar, UniversalCard,
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, PinIcon, IaiaIcon
} from '../../../../components/PedraSeca/index.js';
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · el rellotge viu no és a la façana:
   l'importa PaginaApp, i ací per la seua ruta (porta del catàleg, C2). */
import { RellotgeViu } from '../../../../components/PedraSeca/atoms/RellotgeViu.jsx';
import { BarraBlava } from '../../../../components/universal/barres/BarraBlava.jsx';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { BotoVisibilitat } from '../../../../components/universal/barres/BotoVisibilitat.jsx';
import { IconaEstatDesament } from '../../../../components/universal/EstatDesament.jsx';
import { MenuTraduir } from '../../../../components/universal/traduccio/MenuTraduir.jsx';
import { AvisTraduccio } from '../../../../components/universal/traduccio/TraduccioPagina.jsx';
import { usePastillaCalendari } from '../../../../components/universal/barres/pastillaCalendari.js';
import { LLENGUES_TRADUCCIO } from '../../../../data/traductor.js';
/* Fase D (261020, tasca 2; pla 261020_1300) · «Més opcions» (⋮) de la boina, per la seua ruta:
   no és a la façana (C2 llig l'import des de components/PedraSeca/). */
import { BotoModeracio, MenuModeracio } from '../../../../components/PedraSeca/organismes/Moderacio.jsx';

const res = () => {};

/* Ordre del Mestre, 261001 (tasca 4 i carril A) · La pastilla de la barra
   en lectura, amb hora i clicable com a les pàgines: porta al Calendari en
   el mes de la data (abril de 2026, /calendari?mes=2026-04), amb el router
   de veres. */
const DATA_LECTURA = { time: '11:00', date: '25/04/26', dateTime: '2026-04-25T11:00:00' };

const BLAVA = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
  comentarXat: 'comu',
};
const AUTORIA = {
  authorName: 'Sóc de Poble',
  authorLocation: 'La Torre de les Maçanes',
  authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
};

const CO_PUBLICADORS_VIUS = Object.freeze([
  Object.freeze({
    actor_id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a',
    slug_ruta: '/socdepoble',
    nom: 'Sóc de Poble',
    avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
    poble_nom: 'La Torre de les Maçanes',
    rol_publicacio: 'principal',
  }),
  Object.freeze({
    actor_id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391',
    slug_ruta: '/empresa/olidelatorre',
    nom: 'Oli de La Torre',
    avatar_url: '/assets/uploads/brain/oli_de_la_torre_logo.webp',
    poble_nom: 'La Torre de les Maçanes',
    rol_publicacio: 'copublicador',
  }),
]);

function ParagrafBlavaEstreta({ llengua }) {
  if (llengua === 'es') {
    return <p>La misma barra en una <strong>columna de 28rem</strong>: <strong>CONNECTAR pasa a «+»</strong> y el <strong>trío central</strong> permanece centrado respecto a la barra.</p>;
  }
  if (llengua === 'en') {
    return <p>The same bar inside a <strong>28rem column</strong>: <strong>CONNECTAR collapses to “+”</strong> while the <strong>action trio</strong> remains centered in the bar.</p>;
  }
  if (llengua === 'eu') {
    return <p>Barra bera <strong>28rem-eko zutabean</strong>: <strong>CONNECTAR «+» ikurrera</strong> igarotzen da eta <strong>erdiko hirukoteak</strong> zentratuta jarraitzen du.</p>;
  }
  if (llengua === 'gl') {
    return <p>A mesma barra nunha <strong>columna de 28rem</strong>: <strong>CONNECTAR pasa a «+»</strong> e o <strong>trío central</strong> continúa centrado na barra.</p>;
  }
  return <p>La mateixa barra en una <strong>columna de 28rem</strong>: <strong>CONNECTAR passa a «+»</strong> i el <strong>trio continua centrat</strong> a la barra.</p>;
}

function ParagrafTraduir({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        En cada página, <strong>Traducir abre este menú</strong> justo debajo de la barra, centrado como el trío. La <strong>lista cerrada</strong> reúne Castellà, Gallec, Basc, Anglés, Francés y Alemany y, con la página traducida, <strong>«Original (valencià)»</strong>. Se cierra al elegir, al pulsar fuera o con <strong>Escape</strong>, devolviendo el foco al botón; los enlaces, negritas y cursivas viajan como <strong>marcas locales seguras</strong> y <strong>nunca entra HTML del proveedor</strong>.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        On every page, <strong>Translate opens this menu</strong> right below the bar, centered with the trio. The <strong>closed list</strong> offers Castellà, Gallec, Basc, Anglés, Francés and Alemany plus <strong>“Original (valencià)”</strong> once translated. It closes on selection, outside click or <strong>Escape</strong>, returning focus to Translate; links, bold and italics travel as <strong>local placeholders</strong> so <strong>provider HTML never enters the DOM</strong>.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        Orri bakoitzean, <strong>Itzuli botoiak menu hau irekitzen du</strong> barraren azpian, hirukotearekin lerrokatuta. <strong>Zerrenda itxiak</strong> Castellà, Gallec, Basc, Anglés, Francés eta Alemany biltzen ditu eta, itzulita dagoenean, <strong>«Original (valencià)»</strong>. Aukeratzean, kanpoan klik egitean edo <strong>Escape</strong> sakatzean ixten da; estekak, lodiak eta etzanak <strong>tokiko marka seguru</strong> gisa doaz eta <strong>hornitzailearen HTMLrik ez da inoiz sartzen</strong>.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        En cada páxina, <strong>Traducir abre este menú</strong> xusto debaixo da barra, centrado coma o trío. A <strong>lista pechada</strong> reúne Castellà, Gallec, Basc, Anglés, Francés e Alemany e, coa páxina traducida, <strong>«Original (valencià)»</strong>. Péchase ao escoller, ao premer fóra ou con <strong>Escape</strong>, devolvendo o foco a Traducir; as ligazóns, grosas e cursivas viaxan como <strong>marcas locais seguras</strong> e <strong>nunca entra HTML do provedor</strong>.
      </p>
    );
  }
  /* Gauntlet 261030 (cicle 2, especimen-menu-traduir-text-fals) · El text nomena les sis
     llengües del menú (LLENGUES_TRADUCCIO, amb el gallec i el basc) i diu la veritat de l'HTML. */
  return (
    <p>
      A la pàgina, <strong>Traduir obri este menú</strong> just davall de la barra, centrat com el trio. La <strong>llista és tancada</strong>: Castellà, Gallec, Basc, Anglés, Francés i Alemany i, amb la pàgina ja traduïda, <strong>«Original (valencià)»</strong>. Es tanca en triar, en clicar fora o amb <strong>Escape</strong>, i el focus torna a Traduir; «Veure l’original», a l’avís, també el torna a Traduir. Es traduïx el text: els enllaços, les negretes i les cursives van com a <strong>marques locals</strong> i tornen amb les de l’original; <strong>mai no entra HTML del proveïdor</strong>. El títol i els blocs de lectura es tornen a pintar com a elements, amb el seu lang (un bloc que torna sense traduir, amb el de l’original). Ací, obert i quiet (la mostra no furta el focus), amb la pàgina en castellà.
    </p>
  );
}

function ParagrafComentar({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        No hay hilo de comentarios estático bajo ninguna publicación: <strong>el debate es un chat vivo</strong>. <strong>Comentar</strong> es el mismo botón en la barra azul y en el pie de la tarjeta, y despliega este menú con <strong>foco inicial, Escape y flechas</strong>. <strong>«En privado»</strong> abre una conversación directa con la autora o con Sóc de Poble; <strong>«En público»</strong> lleva al chat abierto del elemento, quedando enfocable y desactivada con explicación cuando aún no existe.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        There is no static comment thread below posts: <strong>discussion happens in live chat</strong>. <strong>Comment</strong> is the exact same button on the blue bar and on the card footer, opening this menu with <strong>initial focus, Escape and arrow keys</strong>. <strong>“In private”</strong> opens a direct chat with the author or Sóc de Poble; <strong>“In public”</strong> opens the item’s public room, staying focusable and disabled with a clear reason when unavailable.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        Ez dago iruzkin-hari estatikorik argitalpenen azpian: <strong>eztabaida zuzeneko txata da</strong>. <strong>Iruzkindu</strong> botoi bera da barra urdinean eta txartelaren oinean, eta menu hau irekitzen du <strong>hasierako fokuarekin, Escape teklarekin eta geziekin</strong>. <strong>«Pribatuan»</strong> aukerak egilearekin edo Sóc de Poblerekin elkarrizketa zuzena irekitzen du; <strong>«Publikoan»</strong> aukerak elementuaren txat irekira darama.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        Non hai fío estático de comentarios baixo ningunha publicación: <strong>o debate é un chat vivo</strong>. <strong>Comentar</strong> é o mesmo botón na barra azul e no pé da tarxeta, e abre este menú con <strong>foco inicial, Escape e frechas</strong>. <strong>«En privado»</strong> leva ao chat directo coa autora ou con Sóc de Poble; <strong>«En público»</strong> abre o chat público do elemento, quedando enfocable e desactivada con explicación cando aínda non existe.
      </p>
    );
  }
  return (
    <p>
      Ordre del Mestre (261007): no hi ha fil de comentaris davall de cap publicació, <strong>el debat és un xat</strong>. <strong>Comentar és el mateix botó</strong> a la barra blava i al peu de la targeta, i obri este menú just després del botó, amb el comportament del de Traduir (<strong>focus a la primera fila, Escape, clic fora, fletxes</strong>). <strong>«En privat»</strong> porta al xat només entre la persona i l’autor de l’element, encara que no el conega, i la línia en diu el nom (Onada 8); amb Sóc de Poble, sense autor o amb una publicació pròpia, al xat amb Sóc de Poble. <strong>«En públic»</strong>, al xat obert de l’element, amb el seu títol com a nom. Sense xat públic, la fila es queda <strong>enfocable però desactivada</strong> i diu per què. Com a les apps de missatgeria, dues files grans amb icona i una línia que diu on porta; com a molt 300px d’ample. Ací, obert i quiet: amb la via pública i sense, i amb una autora.
    </p>
  );
}

function ParagrafBotoComentarSol({ llengua }) {
  if (llengua === 'es') return <p>El <strong>botón por separado</strong>: cerrado, anuncia que <strong>abre un menú</strong> (<code>aria-haspopup</code>, <code>aria-expanded</code>).</p>;
  if (llengua === 'en') return <p><strong>Standalone button</strong>: when closed, it announces <strong>menu popup state</strong> (<code>aria-haspopup</code>, <code>aria-expanded</code>).</p>;
  if (llengua === 'eu') return <p><strong>Botoia bakarka</strong>: itxita dagoenean, <strong>menu bat irekitzen duela</strong> iragartzen du (<code>aria-haspopup</code>, <code>aria-expanded</code>).</p>;
  if (llengua === 'gl') return <p>O <strong>botón por separado</strong>: pechado, anuncia que <strong>abre un menú</strong> (<code>aria-haspopup</code>, <code>aria-expanded</code>).</p>;
  return <p>El <strong>botó, a soles</strong>: tancat, només diu que <strong>obri un menú</strong> (aria-haspopup, aria-expanded).</p>;
}

function ParagrafModeracio({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        Todo contenido vecinal puede <strong>denunciarse</strong> y cualquier persona con sesión puede <strong>bloquear a otra</strong>. El botón <strong>⋮</strong> se sitúa al final de la capucha de la tarjeta y en la barra naranja detrás de la fecha: <strong>«Denuncia el contenido»</strong> abre el diálogo de motivo y <strong>«Bloquea»</strong> pide confirmación, sin aparecer nunca sobre contenido propio, de <strong>Sóc de Poble</strong> ni de la IAIA.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        Every community post can be <strong>reported</strong> and signed-in members can <strong>block another account</strong>. The <strong>⋮</strong> trigger sits last on the card hood and after the date pill on the orange bar: <strong>“Report content”</strong> opens the reason dialog while <strong>“Block”</strong> asks for confirmation, never appearing on your own items, <strong>Sóc de Poble</strong> or IAIA.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        Komunitateko eduki oro <strong>salatu daiteke</strong> eta saioa hasitako edonork <strong>beste pertsona bat blokea dezake</strong>. <strong>⋮</strong> botoia txartelaren txanoaren amaieran eta barra laranjan dataren atzean doa: <strong>«Salatu edukia»</strong> aukerak arrazoiaren elkarrizketa irekitzen du eta <strong>«Blokeatu»</strong> aukerak berrespena eskatzen du, inoiz ez eduki propioan, <strong>Sóc de Poblerenean</strong> edo IAIArenean.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        Todo contido veciñal pode <strong>denunciarse</strong> e calquera persoa con sesión pode <strong>bloquear outra conta</strong>. O botón <strong>⋮</strong> vai ao final da caparuza da tarxeta e na barra laranxa detrás da data: <strong>«Denuncia o contido»</strong> abre o diálogo de motivo e <strong>«Bloquea»</strong> pide confirmación, sen aparecer nunca no contido propio, no de <strong>Sóc de Poble</strong> nin no da IAIA.
      </p>
    );
  }
  return (
    <p>
      Fase D (261020, tasca 2; pla 261020_1300): les botigues d’aplicacions demanen que tot el que publica la gent es puga <strong>denunciar</strong> i que qualsevol persona en puga <strong>bloquejar una altra</strong>. El <strong>⋮</strong> va l’últim a la caputxa de la targeta i a la barra taronja d’una pàgina, darrere de la data, i obri este menú davall seu, apegat a la dreta, amb el comportament del de Comentar. <strong>«Denuncia el contingut»</strong> obri el diàleg del motiu; <strong>«Bloqueja»</strong> i el nom de l’autor només ix si qui mira pot bloquejar, i demana confirmació. Mai al contingut propi, al de <strong>Sóc de Poble</strong> ni al de la IAIA. Ací, obert i quiet: només denunciar, i denunciar i bloquejar.
    </p>
  );
}

function ParagrafModeracioBarra({ llengua }) {
  if (llengua === 'es') return <p>El <strong>⋮ en la barra naranja</strong>, detrás de la pastilla: cerrado, anuncia apertura de <strong>menú accesible</strong>.</p>;
  if (llengua === 'en') return <p>The <strong>⋮ on the orange bar</strong>, right after the date pill: when closed, it announces an <strong>accessible menu</strong>.</p>;
  if (llengua === 'eu') return <p><strong>⋮ botoia barra laranjan</strong>, pilularen atzean: itxita dagoenean, <strong>menu irisgarria</strong> iragartzen du.</p>;
  if (llengua === 'gl') return <p>O <strong>⋮ na barra laranxa</strong>, detrás da pílula: pechado, anuncia apertura de <strong>menú accesible</strong>.</p>;
  return <p>El <strong>⋮ a la barra taronja</strong>, darrere de la pastilla: tancat, només diu que <strong>obri un menú</strong>.</p>;
}

function ParagrafTaronjaLectura({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        <strong>Tres columnas</strong>: en el centro, solo el <strong>emoticono elegido</strong> (sin él, la celda queda vacía y la fecha permanece a la derecha). La fecha muestra la <strong>creación o la última modificación</strong> si es posterior, y la <strong>pastilla clicable</strong> abre el <strong>Calendario en ese mes</strong> con todas las tarjetas del periodo.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        <strong>Three columns</strong>: the center holds only the <strong>chosen emoji</strong> (if empty, the date stays pinned right). The timestamp reflects <strong>creation or newer modification</strong>, and the <strong>clickable pill</strong> opens the <strong>Calendar for that month</strong> with every card from that period.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        <strong>Hiru zutabe</strong>: erdian, <strong>aukeratutako emotikonoa</strong> bakarrik (hutsik badago, datak eskuinean jarraitzen du). Datak <strong>sorrera edo azken aldaketa</strong> erakusten du, eta <strong>pilula klikagarriak</strong> <strong>hilabete horretako Egutegia</strong> irekitzen du.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        <strong>Tres columnas</strong>: no centro, só a <strong>emoticona escollida</strong> (sen ela, a cela queda baleira e a data segue á dereita). A data mostra a <strong>creación ou a última modificación</strong> posterior, e a <strong>pílula clicable</strong> abre o <strong>Calendario nese mes</strong>.
      </p>
    );
  }
  return (
    <p>
      <strong>Tres columnes</strong>. Al centre, només l’<strong>emoticona triada</strong>; sense, la cel·la queda buida i la data continua a la dreta. La data és la de <strong>creació, o la de l’última modificació</strong> si és posterior, amb l’hora si la font en té. La <strong>pastilla és un botó</strong>: porta al <strong>Calendari en el mes de la data</strong>, amb totes les targetes d’eixe mes.
    </p>
  );
}

function ParagrafTaronjaCopub({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        Cuando <strong>dos o más cuentas registradas</strong> en el padrón firman conjuntamente una página o catálogo —como <strong>Sóc de Poble</strong> y <strong>Oli de La Torre</strong>—, el avatar se compone en <strong>mosaico cuadrangular ortogonal</strong> y cada co-publicador conserva su <strong>enlace táctil individual</strong> (&ge; 48 px) hacia su ficha.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        When <strong>two or more registered accounts</strong> co-sign a page or catalog —such as <strong>Sóc de Poble</strong> and <strong>Oli de La Torre</strong>—, the avatar forms an <strong>orthogonal square mosaic</strong> and each co-publisher keeps an <strong>individual tactile link</strong> (&ge; 48 px) to its profile.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        Erroldan <strong>erregistratutako bi kontuk edo gehiagok</strong> orri edo katalogo bat batera sinatzean —hala nola <strong>Sóc de Poblek</strong> eta <strong>Oli de La Torrek</strong>—, abatarra <strong>mosaiko karratu ortogonalean</strong> osatzen da eta kopublikatzaile bakoitzak bere <strong>ukimen-esteka propioa</strong> (&ge; 48 px) gordetzen du.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        Cando <strong>dúas ou máis contas rexistradas</strong> no padrón asinan conxuntamente unha páxina ou catálogo —como <strong>Sóc de Poble</strong> e <strong>Oli de La Torre</strong>—, o avatar componse nun <strong>mosaico cuadrangular ortogonal</strong> e cada copublicador conserva a súa <strong>ligazón táctil individual</strong> (&ge; 48 px) cara á ficha.
      </p>
    );
  }
  return (
    <p>
      Quan <strong>dos o més comptes registrats</strong> signen conjuntament una pàgina o un catàleg —com <strong>Sóc de Poble</strong> i <strong>Oli de La Torre</strong>—, l’avatar es compon com un <strong>mosaic quadrangular ortogonal</strong> i cada co-publicador conserva el seu <strong>enllaç tàctil individual</strong> cap a la fitxa.
    </p>
  );
}

function ParagrafTaronjaEdicio({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        Con <code>onObriEmoticona</code> activo (como en el Perfil), el centro muestra el <strong>botón de pluma blanca</strong>; en el <strong>Bloc de Notas</strong> la barra va sin pluma central y el catálogo de emojis se abre como subvista a columna completa (<strong>PaginaEmojis</strong>, sin ventana modal). A la derecha, el editor monta la <strong>nube de autoguardado</strong> hacia <strong>el servidor de Sóc de Poble</strong>, la <strong>visibilidad</strong> (candado o globo) y la <strong>pastilla de fecha</strong>; ningún pin: el pin «Ancorar» vive en la capucha de la UniversalCard.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        With <code>onObriEmoticona</code> active (as in Profile editing), the center renders the <strong>white feather button</strong>; in the <strong>Notebook</strong> the bar omits the central feather and opens the emoji catalog as a full-column subview (<strong>PaginaEmojis</strong>, no floating modal). On the right, the editor shell mounts the <strong>autosave cloud</strong> syncing with <strong>the Sóc de Poble server</strong>, <strong>visibility</strong> (padlock or globe) and the <strong>date pill</strong>; no pin here: “Pin” lives on the UniversalCard hood.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        <code>onObriEmoticona</code> aktibo dagoenean (Profilean bezala), erdiak <strong>luma zuriko botoia</strong> erakusten du; <strong>Koadernoan</strong> barra luma zentralik gabe doa eta emojien katalogoa zutabe osoko azpibista gisa irekitzen da (<strong>PaginaEmojis</strong>, modal flotatzailerik gabe). Eskuinean, editoreak <strong>autogordetzearen hodeia</strong> (<strong>Sóc de Pobleren zerbitzarirantz</strong>), <strong>ikusgarritasuna</strong> eta <strong>data-pilula</strong> jartzen ditu; «Ainguratu» pina UniversalCard txanoan bizi da.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        Con <code>onObriEmoticona</code> activo (como no Perfil), o centro mostra o <strong>botón da pluma branca</strong>; no <strong>Caderno de Notas</strong> a barra vai sen pluma central e o catálogo de emojis ábrese como subvista a columna completa (<strong>PaginaEmojis</strong>, sen modal flotante). Á dereita, o editor monta a <strong>nube de autogardado</strong> cara a <strong>o servidor de Sóc de Poble</strong>, a <strong>visibilidade</strong> (cadeado ou globo) e a <strong>pílula de data</strong>; ningún pin: «Ancorar» vive na caparuza da UniversalCard.
      </p>
    );
  }
  return (
    <p>
      Al centre, el <strong>botó d’emoticona</strong> quan l’editor li passa obridor (com al Perfil; al Bloc de Notes els emojis del cos s’obrin en la subvista de columna completa <strong>PaginaEmojis</strong>): la ploma blanca vol dir «tria l’emoticona». A la dreta, el que hi posa la closca de l’editor (<strong>UniversalEditorShell</strong>): el <strong>núvol dels canvis pendents</strong> cap a <strong>el servidor de Sóc de Poble</strong>, la <strong>visibilitat</strong> (cadenat o bola del món) i la <strong>pastilla de data</strong>: sense data triada, la d’ara; en triar un dia al calendari, el triat. Totes les icones són blanques dins del cercle de vel fosc. Cap pin: el pin «Ancorar» viu a la caputxa de la UniversalCard (showPin), als avisos del Mur.
    </p>
  );
}

function ParagrafPeuTargeta({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        <strong>IconButton</strong> construye el círculo transparente de la barra azul y del <strong>pie de la UniversalCard</strong>; <strong>ActionControl</strong> forma la pastilla <strong>CONNECTAR</strong> con sus dos spans y el pin «Ancorar» (<code>btn-icon-orange</code>). <strong>DateTimeControl</strong> pinta un <code>&lt;button&gt;</code> clicable hacia el Calendario cuando recibe <code>onClick</code>, o un <code>&lt;time&gt;</code> estático en instantáneas de solo lectura.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        <strong>IconButton</strong> builds the transparent circle on both the blue bar and the <strong>UniversalCard footer</strong>; <strong>ActionControl</strong> powers the <strong>CONNECTAR</strong> pill with its dual spans and the “Pin” button (<code>btn-icon-orange</code>). <strong>DateTimeControl</strong> renders a clickable <code>&lt;button&gt;</code> opening the Calendar when given <code>onClick</code>, or a static <code>&lt;time&gt;</code> on read-only snapshots.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        <strong>IconButton</strong> atomoak barra urdineko eta <strong>UniversalCard oineko</strong> zirkulu gardena egiten du; <strong>ActionControl</strong> atomoak <strong>CONNECTAR</strong> pilula eta «Ainguratu» pina (<code>btn-icon-orange</code>) osatzen ditu. <strong>DateTimeControl</strong> atomoak Egutegira daraman <code>&lt;button&gt;</code> klikagarria edo <code>&lt;time&gt;</code> finkoa marrazten du.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        <strong>IconButton</strong> constrúe o círculo transparente da barra azul e do <strong>pé da UniversalCard</strong>; <strong>ActionControl</strong> forma a pílula <strong>CONNECTAR</strong> cos seus dous spans e o pin «Ancorar» (<code>btn-icon-orange</code>). <strong>DateTimeControl</strong> pinta un <code>&lt;button&gt;</code> clicable cara ao Calendario cando recibe <code>onClick</code>, ou un <code>&lt;time&gt;</code> estático en só lectura.
      </p>
    );
  }
  return (
    <p>
      <strong>IconButton</strong> fa el cercle transparent de la barra blava i del <strong>peu de la targeta</strong>; <strong>ActionControl</strong> és el botó de base: ací, la pastilla <strong>CONNECTAR</strong> amb els seus dos spans, i a la caputxa de la UniversalCard, el pin «Ancorar» (btn-icon-orange). <strong>DateTimeControl</strong> és la pastilla de data: amb onClick és un botó (en lectura, la UniversalPage i la UniversalCard hi posen el clic que obri el Calendari en el mes de la data); sense onClick, un &lt;time&gt; que no es clica (l’editor sense calendari i les targetes amb onDateTime={'{false}'}).
    </p>
  );
}

function ParagrafRellotge({ llengua }) {
  if (llengua === 'es') {
    return (
      <p>
        En herramientas de gestión como la <strong>Gestoría</strong>, la barra naranja muestra siempre la <strong>fecha y hora actuales</strong> en el extremo derecho mediante <strong>RellotgeViu</strong>. Es una excepción explícita montada solo por <code>PaginaApp</code> con el formato único de barras (<code>hh:mm</code> y <code>dd/mm/aa</code>), <strong>sin clic y sin anunciarse</strong> cada minuto.
      </p>
    );
  }
  if (llengua === 'en') {
    return (
      <p>
        In management micro-apps such as <strong>Gestoria</strong>, the orange bar pins the <strong>live date and time</strong> at the far right via <strong>RellotgeViu</strong>. It is an explicit opt-in mounted only by <code>PaginaApp</code> using the standard bar format (<code>hh:mm</code> and <code>dd/mm/yy</code>), <strong>non-clickable and silent</strong> across minute ticks.
      </p>
    );
  }
  if (llengua === 'eu') {
    return (
      <p>
        <strong>Gestoria</strong> bezalako kudeaketa-aplikazioetan, barra laranjak <strong>uneko data eta ordua</strong> erakusten ditu beti eskuinaldean <strong>RellotgeViu</strong> bidez. <code>PaginaApp</code> piezak soilik muntatzen duen salbuespen ordenatua da (<code>hh:mm</code> eta <code>dd/mm/aa</code>), <strong>klikik gabe eta minutuero iragarri gabe</strong>.
      </p>
    );
  }
  if (llengua === 'gl') {
    return (
      <p>
        En ferramentas de xestión como a <strong>Xestoría</strong>, a barra laranxa amosa sempre a <strong>data e hora actuais</strong> no extremo dereito mediante <strong>RellotgeViu</strong>. É unha excepción explícita montada só por <code>PaginaApp</code> co formato único das barras (<code>hh:mm</code> e <code>dd/mm/aa</code>), <strong>sen clic e sen anunciarse</strong> a cada minuto.
      </p>
    );
  }
  return (
    <p>
      Ordre del Mestre (13-10-2026): a la <strong>Gestoria</strong>, la barra taronja porta SEMPRE la <strong>data i l’hora d’ara</strong> a l’extrem dret, darrere de les seues accions. És una <strong>excepció ordenada</strong> a la regla de la pastilla, que és la data del document: PageFrame no s’inventa mai l’hora d’ara, i el rellotge només el posa <strong>PaginaApp</strong> quan la pàgina el demana (rellotgeViu). És la pastilla de sempre, amb el format únic de les barres (hh:mm i dd/mm/aa), <strong>sense clic i sense anunciar-se</strong> a cada minut.
    </p>
  );
}

function ParagrafIcones({ llengua }) {
  if (llengua === 'es') return <p><strong>SVG propios</strong> de Sóc de Poble en <code>atoms/icones.jsx</code>; el resto de iconos del sistema proceden de <strong>lucide-react</strong>.</p>;
  if (llengua === 'en') return <p><strong>House SVG icons</strong> defined in <code>atoms/icones.jsx</code>; all remaining system icons come from <strong>lucide-react</strong>.</p>;
  if (llengua === 'eu') return <p>Sóc de Pobleren <strong>SVG propioak</strong> <code>atoms/icones.jsx</code> fitxategian; gainerako ikonoak <strong>lucide-react</strong> liburutegikoak dira.</p>;
  if (llengua === 'gl') return <p><strong>SVG propios</strong> de Sóc de Poble en <code>atoms/icones.jsx</code>; o resto de iconas do sistema proceden de <strong>lucide-react</strong>.</p>;
  return <p><strong>SVG de la casa</strong> a <code>atoms/icones.jsx</code>; la resta d’icones del sistema són de <strong>lucide-react</strong>.</p>;
}

/**
 * Onada R32.12 (pla 261118_1937, Lot 01) · Controls de barra, arquitectura viva i 5 llengües.
 * Els botons que viuen damunt de les barres de color. Dues formes i prou:
 * cercle (icona) i pastilla (text). La pell és una sola família a
 * components.css («CONTROLS DE BARRA»); els àtoms són a atoms/controls.jsx.
 */
export default function EspecimenControlsBarra() {
  const [dataTriada, setDataTriada] = useState(null);
  const llengua = useLlenguaDisseny();
  const tx = TEXTOS_CONTROLS_BARRA[llengua];
  const alCalendari = usePastillaCalendari(DATA_LECTURA);
  const bn = tx.arquitecturaBarraNegra;
  const bb = tx.arquitecturaBarraBlava;
  const bt = tx.arquitecturaBarraTaronja;
  const pt = tx.arquitecturaPeuTargeta;

  return (
    <>
    <Llinatge id="barres" />

    <section className="sdp-especimen__caixa sdp-especimen__mostra" aria-labelledby="controls-barra-arquitectura">
      <h3 id="controls-barra-arquitectura">{tx.arquitecturaTitol}</h3>
      <p>
        {bn.a}<strong>{bn.b1}</strong>{bn.c}<code>{bn.code1}</code>{bn.d}<strong>{bn.b2}</strong>{bn.e}<code>{bn.code2}</code>{bn.f}<code>{bn.code3}</code>{bn.g}<strong>{bn.b3}</strong>{bn.h}<code>{bn.code4}</code>{bn.i}<strong>{bn.b4}</strong>{bn.j}<strong>{bn.b5}</strong>{bn.k}<code>{bn.code5}</code>{bn.l}<strong>{bn.b6}</strong>{bn.m}<code>{bn.code6}</code>{bn.n}<strong>{bn.b7}</strong>{bn.o}<strong>{bn.b8}</strong>{bn.p}
      </p>
      <p>
        {bb.a}<strong>{bb.b1}</strong>{bb.c}<code>{bb.code1}</code>{bb.d}<strong>{bb.b2}</strong>{bb.e}<strong>{bb.b3}</strong>{bb.f}<strong>{bb.b4}</strong>{bb.g}<strong>{bb.b5}</strong>{bb.h}<strong>{bb.b6}</strong>{bb.i}<strong>{bb.b7}</strong>{bb.j}<strong>{bb.b8}</strong>{bb.k}
      </p>
      <p>
        {bt.a}<strong>{bt.b1}</strong>{bt.c}<code>{bt.code1}</code>{bt.d}<strong>{bt.b2}</strong>{bt.e}<strong>{bt.b3}</strong>{bt.f}<strong>{bt.b4}</strong>{bt.g}<strong>{bt.b5}</strong>{bt.h}<strong>{bt.b6}</strong>{bt.i}<strong>{bt.b7}</strong>{bt.j}<strong>{bt.b8}</strong>{bt.k}<code>{bt.code2}</code>{bt.l}<strong>{bt.b9}</strong>{bt.m}
      </p>
      <p>
        {pt.a}<strong>{pt.b1}</strong>{pt.c}<code>{pt.code1}</code>{pt.d}<strong>{pt.b2}</strong>{pt.e}<code>{pt.code2}</code>{pt.f}<code>{pt.code3}</code>{pt.g}<strong>{pt.b3}</strong>{pt.h}<strong>{pt.b4}</strong>{pt.i}<strong>{pt.b5}</strong>{pt.j}
      </p>
    </section>

    <Especimen id="controls-barra" nom={tx.nom} fitxer="src/components/universal/barres/ · universal/EmoticonaBarra.jsx · universal/classificacio/PaginaEmojis.jsx · PedraSeca/atoms/controls.jsx · atoms/RellotgeViu.jsx · atoms/icones.jsx · PedraSeca/organismes/Comentar.jsx · PedraSeca/organismes/Moderacio.jsx"
      descripcio={tx.descripcio}
      contracte={tx.contracte}
      a11y={tx.a11y}
      fes={tx.fes}
      noFacis={tx.noFacis}>

      <h4>{tx.h4Blava}</h4>
      <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
        <BarraBlava {...BLAVA} />
      </div>
      <ParagrafBlavaEstreta llengua={llengua} />
      <div className="sdp-especimen__barres sdp-especimen__barres--contenidor sdp-especimen__barres--estreta">
        <BarraBlava {...BLAVA} />
      </div>

      <h4>{tx.h4Traduir}</h4>
      <ParagrafTraduir llengua={llengua} />
      <div className="sdp-especimen__fila">
        <MenuTraduir opcions={LLENGUES_TRADUCCIO} actual="ES" onTria={res} onTanca={res} mostra />
      </div>
      <AvisTraduccio llengua="ES" onOriginal={res} />
      <AvisTraduccio carregant="FR" />

      <h4>{tx.h4Comentar}</h4>
      <ParagrafComentar llengua={llengua} />
      <div className="sdp-especimen__fila">
        <MenuComentar ambPublic onTria={res} onTanca={res} mostra />
        <MenuComentar onTria={res} onTanca={res} mostra />
        <MenuComentar ambPublic privatAmb="Maria" onTria={res} onTanca={res} mostra />
      </div>
      <ParagrafBotoComentarSol llengua={llengua} />
      <div className="sdp-especimen__fila">
        <BotoComentar label="Comentar l’espècimen (menú)" comentarXat="comu" onComment={res} />
      </div>

      <h4>{tx.h4Moderacio}</h4>
      <ParagrafModeracio llengua={llengua} />
      <div className="sdp-especimen__fila">
        <MenuModeracio onTria={res} onTanca={res} mostra />
        <MenuModeracio potBloquejar nomAutor="Pepa" onTria={res} onTanca={res} mostra />
      </div>
      <ParagrafModeracioBarra llengua={llengua} />
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} etiqueta="Autoria i data (espècimen, amb «Més opcions»)" {...DATA_LECTURA}
          onDateTime={alCalendari.onClick} etiquetaData={alCalendari.etiqueta}
          accioModeracio={<BotoModeracio titol="Fira de tardor" nomAutor="Pepa" potBloquejar onTria={res} />} />
      </div>

      <h4>{tx.h4TaronjaLectura}</h4>
      <ParagrafTaronjaLectura llengua={llengua} />
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} emoticona="🍅" etiqueta="Autoria i data (espècimen, lectura)"
          {...DATA_LECTURA} onDateTime={alCalendari.onClick} etiquetaData={alCalendari.etiqueta} />
      </div>

      <h4>{tx.h4TaronjaCopub}</h4>
      <ParagrafTaronjaCopub llengua={llengua} />
      <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
        <BarraTaronja
          publicadorsRegistrats={CO_PUBLICADORS_VIUS}
          etiqueta="Co-publicació registrada (espècimen, lectura)"
          {...DATA_LECTURA}
          onDateTime={alCalendari.onClick}
          etiquetaData={alCalendari.etiqueta}
        />
      </div>

      <h4>{tx.h4TaronjaEdicio}</h4>
      <ParagrafTaronjaEdicio llengua={llengua} />
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} onObriEmoticona={res} etiqueta="Autoria i data (espècimen, edició)"
          barActions={(
            <>
              <IconaEstatDesament estat="pendent" />
              <BotoVisibilitat etiqueta="Privat: canviar la visibilitat" onObri={res} />
              <SelectorDataHora valor={dataTriada} onTria={setDataTriada} />
            </>
          )} />
      </div>

      <h4>{tx.h4PeuTargeta}</h4>
      <ParagrafPeuTargeta llengua={llengua} />
      <div className="sdp-especimen__targetes">
        <UniversalCard
          variant="pla"
          imatgePrivada
          headingLevel="h5"
          authorName="Oli de La Torre"
          authorLocation="La Torre de les Maçanes"
          authorAvatar=""
          authorHref="/empresa/olidelatorre"
          emoticona="🫒"
          title={tx.targetaMostraTitol}
          subtitle={tx.targetaMostraSubtitol}
          date="25/04/26"
          time="11:00"
          dateTime="2026-04-25T11:00:00"
          onDateTime={false}
          showTranslate
          onTranslate={res}
          onComment={res}
          onShare={res}
          onConnect={res}
        />
      </div>
      <div className="sdp-especimen__fila">
        <IconButton label="Comentar l’espècimen" onClick={res}><CommentIcon className="icon" /></IconButton>
        <IconButton label="Compartir l’espècimen (presentation)" presentation><ShareIcon className="icon" /></IconButton>
        <ActionControl className="btn-connectar sp-card-connect" label="Connectar amb l’espècimen" onClick={res}>
          <span className="sp-card-connect-text">Connectar</span>
          <span className="sp-card-connect-plus" aria-hidden="true">+</span>
        </ActionControl>
      </div>
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} etiqueta="Autoria i data (espècimen, pastilla de només lectura)"
          barActions={<DateTimeControl time="11:00" date="25/04/26" dateTime="2026-04-25T11:00:00" />} />
      </div>

      <h4>{tx.h4Rellotge}</h4>
      <ParagrafRellotge llengua={llengua} />
      <div className="sdp-especimen__barres">
        <BarraTaronja {...AUTORIA} etiqueta="Autoria i rellotge viu (espècimen, apps)" barActions={<RellotgeViu />} />
      </div>

      <h4>{tx.h4Icones}</h4>
      <ParagrafIcones llengua={llengua} />
      <div className="sdp-especimen__fila sdp-especimen__icones">
        <span title="IaiaIcon"><IaiaIcon className="icon" /></span>
        <span title="BackIcon"><BackIcon className="icon" /></span>
        <span title="ForwardIcon"><ForwardIcon className="icon" /></span>
        <span title="IndexIcon"><IndexIcon className="icon" /></span>
        <span title="TranslateIcon"><TranslateIcon className="icon" /></span>
        <span title="CommentIcon"><CommentIcon className="icon" /></span>
        <span title="ShareIcon"><ShareIcon className="icon" /></span>
        <span title="PinIcon"><PinIcon className="icon" /></span>
      </div>
    </Especimen>
    </>
  );
}
