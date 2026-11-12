/**
 * UniversalCard.jsx — la targeta mestra. L'única peça de ui/ que toca el router.
 *
 * Mateix DOM i mateixes classes que a UniversalElements.jsx. Correccions 260910:
 *
 *  1 · TRADUIR. `showTranslate`/`onTranslate` es calculaven i el peu no els
 *      rebia: nou crides demanaven el botó i no eixia mai, i si era l'única
 *      acció quedava un `.sp-card-actions` buit. Ara es pinta, el primer.
 *  2 · NOMS ACCESSIBLES. «Connectar amb …» anava en `aria-label`, que
 *      ActionControl no llig: es perdia. Ara va per `label`. Comentar,
 *      Compartir i Traduir porten el títol: deu botons iguals en una llista
 *      no es distingixen amb un lector de pantalla.
 *  3 · CONTENIDORS BUITS. Un avatar insegur sense autor ni lloc deixava un
 *      capçal amb un <span> buit; `onDateTime` sense data deixava un
 *      `.sp-card-meta` buit. Ara la visibilitat es calcula sobre el que es pinta.
 *  4 · COMPARTIR. clipboard sense await avisava «copiat» encara que fallara;
 *      sense clipboard (http) petava; alert() bloquejava; tancar el menú
 *      natiu es registrava com a error.
 *  5 · DATA. toISOString() passava a UTC i restava un dia a les dates locals.
 *  6 · `headingLevel` es pintava com a etiqueta sense filtre: ara h2–h6.
 *  7 · `labels: null` (columna buida de Supabase) tombava la targeta.
 *
 * Poliment editorial 260925: el títol i el subtítol visibles, quan són text,
 * es pinten sense punt final (els suspensius es queden). Els noms accessibles
 * de les accions conserven el títol tal com arriba.
 *
 * Ordre del Mestre, 261001 (tasca 4, «la Boina Taronja») · La pastilla de la
 * boina, en lectura, porta al Calendari global en el mes que pinta
 * (/calendari?mes=AAAA-MM, barres/pastillaCalendari.js), no al filtre del
 * Mur, i el seu nom accessible diu l'hora, el dia i on porta, en l'ordre en
 * què es lligen. La data es llig amb el lector únic d'editorial.js: la còpia
 * local (diaDeLaTargeta) s'ha retirat.
 *
 * Base de recursos (T5, 261001) · imageUrl i avatarUrl es resolen amb
 * resolRecursPropi() abans del filtre: incrustat en un amfitrió, un
 * '/assets/…' (l'avatar de Pobles, el directori de perfils) penja de la
 * carpeta del paquet. Un valor ja resolt (Mercat, Mur, Agenda) passa intacte
 * i, sense base, tot és el valor de sempre (Llei del Píxel).
 *
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003) · La prop `portes` (PortesTargeta.jsx): com a
 * màxim dues portes. Amb portes no hi ha enllaç estirat (el peu, vegeu P6).
 * ESMENA 261003 22:34 (directrius 2234 i 2245 del Mestre) · La targeta amb
 * portes és la UniversalCard estàndard, no una variant compacta: boina
 * d'autoria, imatge, títol, subtítol i entradilla visibles, i les dues portes
 * al final del cos. La variant «vinyeta» (títol per a lector, reserva 1:1 i
 * el clic a la il·lustració, D3) s'ha retirat: només són interactius l'autor,
 * la data i les portes. Sense `portes`, el DOM de sempre, byte a byte
 * (UniversalCard.vinyeta.test.jsx).
 * W4-07 · L'autor amb una ruta de l'app passa per la frontera de les portes
 * (esRutaDeLaPorta), que no depén del protocol de la finestra: a l'app nativa
 * (capacitor://localhost) isSafeUrl el deixava sense enllaç. Una adreça
 * absoluta continua passant per isSafeUrl, com sempre.
 *
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre, «la
 * regressió de l'UniversalCard») ·
 *  · PREU AL QUADRAT. `price` ja no pinta la píndola: va al quadrat de 128 px,
 *    el mateix de les dates (SquareBadge), com `squareBadge={{ type: 'price' }}`.
 *    Mana squareBadge, després el preu i després calendarBadge. Un preu llarg
 *    («1.250,00 €») baixa de lletra per trams (data-mida, midaDelPreu) i cap
 *    sencer al quadrat. La píndola .sp-card-price continua al detall
 *    (detailSectionMeta i la barra de PageFrame, .sp-card-price--en-linia).
 *  · PEU AMB PORTES. Les portes ja no amaguen el peu blau: la targeta amb
 *    portes és una pàgina de veres, amb boina dalt i peu baix, com al Mur.
 *    L'única variació és el cos: dues portes en lloc de l'enllaç de tota la
 *    targeta. Per això, amb portes, `mainHref` no fa cap overlay però continua
 *    sent la pàgina de Comentar i Compartir (useAccions), la mateixa de
 *    «Saber-ne més».
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · Les
 * llistes de les apps (Notícies, la Nevera) passen a UniversalCard. Cinc
 * props OPCIONALS per a fer-ho sense perdre res del que ja feien; sense
 * elles, el DOM de sempre, byte a byte (UniversalCard.vinyeta.test.jsx):
 *  · `imatgePrivada` · la imatge i l'avatar passen pel filtre de les peces de
 *    les apps (fontSegura de marca.jsx, esFontImatgeSegura: el mateix origen,
 *    el nostre servidor de mitjans o un avatar dels proveïdors d'entrada) i es
 *    demanen sense referent (referrerPolicy="no-referrer"). Una imatge que no
 *    hi passa no es pinta.
 *    Decisió 3 del Mestre (261007) · Ja no és només de les apps: la porten
 *    també les targetes del Mur, dels actes i del Mercat (TargetaDelMur,
 *    EventCard, TargetaDelMercat), que abans de passar-li la imatge i l'avatar
 *    hi apliquen el MODE ESTRICTE (fontImatgePropia de utils/sanitize.js: cap
 *    servidor de tercers, tampoc els avatars de Google, Facebook o GitHub).
 *    La prop no canvia.
 *  · `idElement` · data-element a l'element principal: la llista hi torna el
 *    focus quan es tanca el detall.
 *  · `premuda` · aria-pressed a l'element principal quan és un botó
 *    (onMainClick): la targeta commutable de la Nevera.
 *  · `onAccioSecundaria` · la pulsació llarga, el clic dret i Maj+F10 (o la
 *    tecla de menú) sobre l'element principal (pulsacioLlarga.js, el mateix
 *    camí de les rajoles). Rep l'element que l'ha disparada. El clic que ve
 *    després d'una pulsació llarga no fa l'acció principal.
 *  · `descripcioAccessible` (text; regressió de la Nevera) · el que la rajola
 *    deia al lector de pantalla i l'element principal, que només porta el
 *    títol, ja no deia: l'estat i l'especificació («S’ha acabat», «sense
 *    lactosa»). Amb ella, aria-describedby a l'element principal apunta a un
 *    span .sdp-nomes-lector amb eixe text (id de useId), dins de l'element:
 *    els fills de l'article no canvien. Sense element principal no hi ha qui
 *    la diga: res.
 * La variant 16:9 del Lector NO entra ací: qualitat.panoramica.test.js limita
 * l'excepció a agrupacio.jsx, al Lector i al seu espècimen. IDEA-42 (B7h) ·
 * La forma 16:9 amb punt focal d'una publicació del Mur (`formaMitja`) és una
 * altra excepció del Mestre, amb classe pròpia (vegeu MitjaEnquadrada).
 * W4-07 · rutaDAutorSegura ja és la compartida d'UniversalUtils (la de la
 * barra taronja de les pàgines és la mateixa).
 *
 * Ordre del Mestre (261007) · EL COPYRIGHT ÉS UN ENLLAÇ. El text de
 * `copyright` (siga quin siga: «CC BY-NC-SA 4.0…», «© Pepet»…) porta SEMPRE a
 * la pàgina «Drets d'autor» (RUTA_DRETS_AUTOR, /page/drets-autor), amb el
 * Link del router, el mateix de l'autor i de les etiquetes (EnllacDrets;
 * sense router llegible, un <a> amb la mateixa ruta). El paràgraf
 * .sp-card-copyright es queda (el seu lloc i el seu aire); l'enllaç va dins,
 * amb la classe .sp-card-copyright__enllac (components.css: blau d'acció,
 * subratllat només en passar el ratolí). Com la ranura `accio`, és un germà
 * del vel enllaç de la targeta, no un fill, i puja damunt seu
 * (.sp-card-copyright, z-index 2): el clic és seu i no obri la targeta.
 * Directiva de Dignitat Humana (pla 261015_1900) · L'única excepció: la
 * targeta que representa una PERSONA (`objecte.tipus === 'persona'`) no
 * porta drets ni categories (`labels`). Una obra signada per una persona sí.
 *
 * Ordre del Mestre (261007) · «COMENTARIS = XAT» · Comentar del peu és el
 * MATEIX botó que el de la barra blava (BotoComentar, barres/BarraBlava.jsx):
 * obri el menú de les dues vies, «En privat» (el xat privat amb l'autor
 * de l'element, Onada 8; sense autor, amb Sóc de Poble) i «En públic» (el
 * xat públic de l'element, pel seu `objecte`), i useAccions fa la triada. Sense xat públic, la fila pública es queda
 * desactivada i diu per què. Un onComment propi (les previsualitzacions que
 * avisen) mana i no hi ha menú. Tancat, el botó només guanya
 * aria-haspopup i aria-expanded: cap píxel canvia. El menú penja del peu i
 * s'obri cap amunt (components.css).
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
 * 21:20): la referència opaca d'una pujada ('sdp-media://') es resol pel port
 * amb useResolvedAsset abans de passar per fontSegura; mentre es resol, o si
 * no es pot, la silueta honesta, mai la referència crua. Derogat EN PART la
 * base de recursos de T5 (261001: imageUrl i avatarUrl van directament a
 * resolRecursPropi() i al filtre) i XAT-02 (ordre del Mestre, 261014, pla
 * 261014_0210: una referència opaca és una font absent i qui pinta hi posa el
 * seu substitut): una imageUrl o una avatarUrl opaca es demana abans al port,
 * i el filtre (fontSegura amb imatgePrivada; sense, resolRecursPropi i
 * isSafeAsset) rep la URL que torna, amb imatgePrivada i sense. Si el port
 * torna encara la referència o res, el filtre la descarta com fins ara. La
 * resta de fonts no passen pel port i fan el camí de sempre (Llei del Píxel).
 * Sense la capacitat 'mitjans' el port no es crida: la silueta, com abans. El
 * preu, conegut: tota app que pinte una targeta amb una referència opaca
 * crida el port (auditoria 261014_2035, T2). Sense filtre privat, la guarda
 * !esMitjaOpac de fontDeLaTargeta no canvia cap targeta que pintava una
 * imatge de veres: isSafeAsset ja rebutjava l'esquema sdp-media: (no és http
 * ni https) en qualsevol caixa i amb espais o tabuladors davant. L'única
 * diferència és una referència amb un espai que no és ASCII davant (U+00A0):
 * el navegador la prenia per un camí relatiu i isSafeAsset la deixava passar,
 * una imatge trencada demanada al mateix origen; ara va al port o no es pinta.
 * Revisió adversarial, 14-10-2026 · La referència es demana al port amb
 * l'esquema en minúscules i sense espais (refDelPort, el mateix que a
 * PaginaApp): useResolvedAsset només reconeix 'sdp-media://' escrit així, i
 * un 'SDP-MEDIA://…' anava al resolutor de camins, tornava '/SDP-MEDIA://…' i
 * el filtre el deixava passar com un camí del mateix origen.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link } from '../../../app/contexts/RouterContext';
import { useUIState } from '../../../app/contexts/UIContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { resolRecursPropi } from '../../../config/assetResolver.js';
import { esPrivat } from '../../../config/objecteConnectable.js';
import { RUTA_DRETS_AUTOR } from '../../../config/systemPages.js';
import {
  CODI_TRADUCCIO, LLENGUES_TRADUCCIO, creaTraductor, llenguaDeTraduccio, sanejaDestinsDeclarats, tradueixTot
} from '../../../data/traductor.js';
import { carregaTraductorLliure } from '../../../data/traductorDelLloc.js';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { posicioDeRetall } from '../../universal/enquadrament/enquadrament.js';
import { ambClassesDelMarc, useEnquadramentDeImatge } from '../../../hooks/useEnquadramentDeImatge.js';
import { posicioEnCaixa, separaEnquadrament } from '../../../utils/enquadramentUrl.js';
import { MenuTraduir } from '../../universal/traduccio/MenuTraduir.jsx';
import { allowsMachineTranslation } from '../../universal/traduccio/translationMode.js';
import { esMitjaOpac } from '../../../utils/mitjaOpac.js';
import { fontVideoPropia } from '../../../utils/sanitize.js';
import { isSafeAsset, isSafeUrl, rutaDAutorSegura } from '../../universal/UniversalUtils';
import { llevaPuntFinal } from '../../universal/editorial.js';
import { EmoticonaBarra } from '../../universal/EmoticonaBarra.jsx';
import { usePastillaCalendari } from '../../universal/barres/pastillaCalendari.js';
import { SquareBadge } from './SquareBadge.jsx';
import { TEXTOS_PEU_TARGETA } from '../../universal/barres/textosBarres.js';
import { BotoComentar } from './Comentar.jsx';
import { BotoModeracio } from './Moderacio.jsx';
import { emoticonaDeBarra } from '../../../utils/emoji.js';
import { ActionControl, IconButton, DateTimeControl } from '../atoms/controls.jsx';
import { PinIcon, TranslateIcon, ShareIcon } from '../atoms/icones.jsx';
import { useAccions, useUbicacioApp } from '../hooks/useAccions.js';
import { PARELLS_AVIS_TRADUCCIO, parellDError, traduccioDePaginesDisponible } from '../hooks/useTraduccioPagina.js';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';
import { PortesTargeta, normalitzaPortes } from './PortesTargeta.jsx';
import { fontSegura } from './marca.jsx';
import { usePulsacioLlarga } from './pulsacioLlarga.js';

function useEstatUIOpcional() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

function useToastOpcional() {
  try {
    return useToast();
  } catch {
    return null;
  }
}

const TITOLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const PARELL_SENSE_TRADUCCIO = Object.freeze([
  'pagina.senseTraduccio',
  'Esta pàgina no es traduïx: el que mostra no s’envia al servei de traducció.'
]);

/* Ordre del Mestre, 261004 · `imatgePrivada`: el filtre de les peces de les
   apps, el mateix (fontSegura de marca.jsx: resolRecursPropi i
   esFontImatgeSegura). Sense, el de sempre (T5: resolRecursPropi i isSafeAsset). */
const fontDeLaTargeta = (valor, privada) => {
  if (privada) return fontSegura(valor);
  const font = resolRecursPropi(valor);
  return font && !esMitjaOpac(font) && isSafeAsset(font) ? font : null;
};

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4) · El que es
   demana al port: només una referència opaca, sense espais i amb l'esquema
   en minúscules (vegeu la capçalera). Qualsevol altra font, '': el ganxo no
   fa res. */
const refDelPort = (src) => (esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '');

/* L'atribut que només es pinta amb la prop: sense, cap atribut nou. */
const SENSE_REFERENT = Object.freeze({ referrerPolicy: 'no-referrer' });

/* T51 (ordre del Mestre, 260928) · `centre` és l'espai central de la caputxa
   (EmoticonaBarra en lectura): només hi és amb una emoticona triada, i
   llavors la caputxa passa a la graella de tres columnes de la barra
   taronja. Sense, el DOM i el flex de sempre. */
/* Fase D (261020, tasca 2) · `accioModeracio`: el ⋮ «Més opcions»
   (Moderacio.jsx), l'últim, a la vora dreta, després de la pastilla. Null,
   el DOM de sempre. */
function CardHeader({ autor, autorHref, centre, pin, dataHora, headerAction, accioModeracio = null }) {
  return (
    <header className={centre ? 'sp-card-header sp-card-header--amb-emoticona' : 'sp-card-header'}>
      {autor && (autorHref ? (
        <Link className="sp-card-author-link" to={autorHref}>{autor}</Link>
      ) : (
        <span className="sp-card-author-block">{autor}</span>
      ))}
      {centre}
      {(pin || headerAction || dataHora || accioModeracio) && (
        <div className="sp-card-meta">
          {pin}
          {headerAction}
          {dataHora}
          {accioModeracio}
        </div>
      )}
    </header>
  );
}

export { SquareBadge, midaDelPreu } from './SquareBadge.jsx';

function Etiqueta({ label }) {
  const text = typeof label === 'string' ? label : label.text;
  const classe = typeof label === 'string' ? 'sdp-badge-tag' : label.className || 'sdp-badge-tag';
  const href = typeof label === 'string' ? null : label.href;
  const segur = href && isSafeUrl(href) ? href : null;
  return (
    <li className={`sp-card-label ${classe}`} lang={typeof label === 'string' ? undefined : label.lang}>
      {!segur ? text : segur.startsWith('http') ? (
        <a href={segur} target="_blank" rel="noopener noreferrer" className="sp-card-label">{text}</a>
      ) : (
        <Link to={segur} className="sp-card-label">{text}</Link>
      )}
    </li>
  );
}

function LlistaEtiquetes({ etiquetes }) {
  /* T7 · P1-22 (261101) · El nom de la llista, en la llengua de la interfície;
     fora de l'app o en valencià, «Categories» com sempre. */
  const t = useTraductorOpcional();
  return (
    <ul className="sp-card-labels" aria-label={tradueix(t, ['common.categories', 'Categories'])}>
      {etiquetes.map((label, index) => (
        <Etiqueta key={`${typeof label === 'string' ? label : label.text}-${index}`} label={label} />
      ))}
    </ul>
  );
}

/* Ordre del Mestre (261007) · L'enllaç del copyright: SEMPRE a la pàgina
   «Drets d'autor». Amb router, el Link de l'app (el de l'autor i de les
   etiquetes: href amb la base i navegació del router); sense, un <a> amb la
   mateixa ruta, que l'interceptor d'App.jsx passa al router. El DOM és el
   mateix en tots dos casos. El router llegible, o null, és el de
   useUbicacioApp (useAccions.js, revisió del 261007: abans, una còpia ací):
   una peça pintada fora de RouterProvider, o una prova amb un mock que només
   porta useNavigate, no tomben la targeta. */
function EnllacDrets({ children }) {
  const router = useUbicacioApp();
  if (!router) return <a href={RUTA_DRETS_AUTOR} className="sp-card-copyright__enllac">{children}</a>;
  return <Link to={RUTA_DRETS_AUTOR} className="sp-card-copyright__enllac">{children}</Link>;
}

/* `portes` (P5) · Les portes de la targeta de doble acció, al final del cos.
   Sense, res: el DOM de sempre.
   P6 · El preu va al quadrat (SquareBadge), mai a la píndola: un sol
   indicador, i mana squareBadge, després el preu i després la data. La classe
   has-price es conserva per a qui la mire.
   Ordre del Mestre (261007) · `accio`: la ranura de l'acció gran (vegeu la
   prop a UniversalCard). Amb ella, el seu contenidor ocupa el lloc de les
   etiquetes, que no es pinten. Onada 8 (261009) · Amb `etiquetesAmbAccio`,
   les etiquetes es queden al seu lloc i el botó va just després. */
/* IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9c; excepció a la
   Pedra Seca §8 validada per la directiva IDEA-42 del Mestre, com la de la
   capçalera del 261024) · La forma 16:9 del mitjà de la targeta, amb el punt
   focal que tria l'autor (posicioMitja = { cx, cy, zoom }, l'estat del diàleg
   d'enquadrament). La posició CSS depén de la proporció de la foto, que només
   se sap en carregar-la: posicioDeRetall la calcula llavors i
   usePropietatsCss l'escriu des d'una ref (--targeta-mitja-x, -y i -zoom;
   cap atribut style). Fins que carrega, o sense punt, la foto va centrada
   (components.css). Un punt que no és de números finits no hi arriba mai.
   El load es confirma amb flushSync, dins de la mateixa tasca: mesurat al Mur
   (Chrome), la foto mandrosa que entra a la vista ja té mida abans que una
   actualització diferida escriga les propietats, i es podia pintar un
   fotograma centrada. */
const FORMA_MITJA_16_9 = '16:9';

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   Una foto sense punt focal de la targeta però amb el seu marc (#sdp-crop=, la
   capçalera de l'autor) es pinta en 16:9 com es veia el seu retall:
   posicioEnCaixa amb la caixa 16:9 i el cover centrat d'esta classe. El punt
   focal de la targeta (IDEA-42) continua manant. */
const RATIO_MITJA_16_9 = 16 / 9;

function MitjaEnquadrada({ imatge, imageAlt, privada, posicio }) {
  const ref = useRef(null);
  const { base, enquadrament } = separaEnquadrament(imatge);
  const font = enquadrament ? base : imatge;
  const [carregada, setCarregada] = useState(null);
  const ratio = carregada && carregada.src === font ? carregada.ratio : null;
  const punt = posicioDeRetall(posicio, ratio) ?? (enquadrament ? posicioEnCaixa(enquadrament, ratio, RATIO_MITJA_16_9) : null);
  usePropietatsCss(ref, punt ? { '--targeta-mitja-x': `${punt.x}%`, '--targeta-mitja-y': `${punt.y}%`, '--targeta-mitja-zoom': punt.zoom } : {});
  const onCarrega = (ev) => {
    const { naturalWidth: amplada, naturalHeight: alcada } = ev.currentTarget;
    if (amplada > 0 && alcada > 0) flushSync(() => setCarregada({ src: font, ratio: amplada / alcada }));
  };
  return (
    <div className="sp-card-media-container sp-card-media-container--16-9">
      <img ref={ref} className="sp-card-media" src={font} alt={imageAlt} loading="lazy" decoding="async" onLoad={onCarrega} {...(privada ? SENSE_REFERENT : null)} />
    </div>
  );
}

/* P0-80 / IDEA-211 · El mitjà quadrat de sempre, amb el marc de la foto
   (#sdp-crop=) si en porta: useEnquadramentDeImatge mesura la caixa i en llig
   l'ancoratge (dalt, a la Targeta Universal) en carregar, i pinta el que la
   targeta ensenyava del retall d'abans. Sense fragment, el DOM de sempre. */
function MitjaDeLaTargeta({ imatge, imageAlt, privada }) {
  const pintor = useEnquadramentDeImatge(imatge, { caixa: 'mesura' });
  return (
    <div className="sp-card-media-container">
      <img ref={pintor.ref} className={ambClassesDelMarc('sp-card-media', pintor.className)} src={pintor.src} alt={imageAlt} loading="lazy" decoding="async"
        onLoad={pintor.onLoad} {...(privada ? SENSE_REFERENT : null)} />
    </div>
  );
}

function CardBody({ imatge, imageAlt, video, calendarBadge, squareBadge, price, icon, title, TitleTag, subtitle, body, etiquetes, copyright, portes = null, privada = false, accio = null, etiquetesAmbAccio = false, formaMitja, posicioMitja, langTitle, langSubtitle, langBody }) {
  const activeBadge = squareBadge || (price ? { type: 'price', value: price } : null) || calendarBadge;
  return (
    <>
      {video ? (
        <div className="sp-card-media-container sp-card-media-container--video">
          <video
            className="sp-card-media sp-card-media--video"
            src={video}
            poster={imatge || undefined}
            controls
            playsInline
            preload="metadata"
          />
        </div>
      ) : imatge && formaMitja === FORMA_MITJA_16_9 ? (
        <MitjaEnquadrada imatge={imatge} imageAlt={imageAlt} privada={privada} posicio={posicioMitja} />
      ) : imatge && (
        <MitjaDeLaTargeta imatge={imatge} imageAlt={imageAlt} privada={privada} />
      )}
      <div
        className={[
          'sp-card-body',
          price && 'has-price',
          activeBadge && 'has-calendar-badge',
          (price || activeBadge) && 'has-aside'
        ].filter(Boolean).join(' ')}
      >
        {activeBadge && <SquareBadge badge={activeBadge} />}
        {title && icon ? (
          <div className="sp-card-heading-with-icon">
            <span className="sp-card-title-icon">{icon}</span>
            <TitleTag className="sp-card-title" lang={langTitle || undefined}>{title}</TitleTag>
          </div>
        ) : title ? (
          <TitleTag className="sp-card-title" lang={langTitle || undefined}>{title}</TitleTag>
        ) : null}
        {subtitle && <h4 className="sp-card-subtitle" lang={langSubtitle || undefined}>{subtitle}</h4>}
        {body && (typeof body === 'string'
          ? <p className="sp-card-text" lang={langBody || undefined}>{body}</p>
          : <div className="sp-card-text" lang={langBody || undefined}>{body}</div>)}
        {(!accio || etiquetesAmbAccio) && etiquetes.length > 0 && <LlistaEtiquetes etiquetes={etiquetes} />}
        {accio ? <div className="sp-card-accio">{accio}</div> : null}
        {copyright && (
          <p className="sp-card-copyright">
            <EnllacDrets>{copyright}</EnllacDrets>
          </p>
        )}
        {portes}
      </div>
    </>
  );
}

function CardFooter({ accions, connectar }) {
  return (
    <footer className="sp-card-footer">
      {accions.length > 0 && <div className="sp-card-actions">{accions}</div>}
      {connectar}
    </footer>
  );
}

export function UniversalCard({
  variant = 'default',
  className,
  icon,
  /* T51 · El camp CRU d'emoticona del document (mai el model de vista de la
     llista, que porta la 🪶 per defecte): el centre de la caputxa, en lectura. */
  emoticona = '',
  title,
  headingLevel = 'h3',
  subtitle,
  body,
  location,
  time,
  date,
  dateTime,
  author,
  authorHref,
  avatarUrl,
  avatarAlt = '',
  imageUrl,
  imageAlt = '',
  videoUrl,
  price,
  labels = [],
  mainHref,
  onMainClick,
  /* T63.2 (doctrina del Mestre, 260928) · el descriptor tipat de l'element
     (objecteDe, objecteDePerfil…): diu quin és el xat PÚBLIC del menú de
     Comentar (ordre del Mestre, 261007: «En privat» i «En públic»); una nota
     no en té i Comentar no es pinta (useAccions). Sense objecte, el xat de la
     'pagina' del detall (mainHref), mai el de la llista; sense detall, cap
     xat públic: «En públic» queda desactivada i diu per què. */
  objecte,
  copyright,
  calendarBadge = null,
  squareBadge = null,
  isAvis = false,
  hasFooter,
  showPin,
  showDateTime,
  showTranslate,
  showComment,
  showShare,
  showConnect,
  headerAction,
  /* Fase D (261020, tasca 2; pla 261020_1300) · `ambModeracio`: la targeta
     oferix «Més opcions» (denunciar i bloquejar) a la caputxa, si l'app té
     el proveïdor i el backend la capacitat (useAccions). Opt-in: sense la
     prop, el DOM de sempre, byte a byte. */
  ambModeracio = false,
  onPin,
  onDateTime,
  onTranslate,
  onComment,
  onShare,
  onConnect,
  connectLabel = 'Connectar',
  telemetria, // { mode: 'previsualitzacio' }: com es compta el Connectar (useAccions)
  /* Correcció D5 (revisió de T50) · `actual`: la targeta és l'element triat
     d'una llista (la fitxa activa del Bloc de Notes o del Perfil). L'estat va
     on va el focus, a l'element principal (l'enllaç o el botó de tota la
     targeta), com a la fitxa compacta: aria-current="true". Sense element
     principal, a l'article. Sense la prop, el DOM de sempre. */
  actual = false,
  /* P5 · Com a màxim dues portes [{ id, verb, nom, desti, varietat }]
     (PortesTargeta.jsx), al final del cos de la targeta de sempre. */
  portes,
  /* Ordre del Mestre, 261004 (capçalera) · Les quatre opcionals de les
     llistes de les apps. Sense elles, el DOM de sempre. */
  imatgePrivada = false,
  idElement,
  premuda,
  onAccioSecundaria,
  /* Ordre del Mestre, 261004 (regressió de la Nevera) · la descripció
     accessible de l'element principal. Sense, el DOM de sempre. */
  descripcioAccessible,
  /* Ordre del Mestre (261007) · `accio`: una ranura genèrica per a l'acció
     gran de la targeta, un node React (la targeta d'El Xat hi posa la
     PortaDePagina «Anar al xat»: la pell de Boto, primària i gran). La peça
     no en sap res: si n'hi ha, va al lloc de les etiquetes i les etiquetes
     no es pinten. L'enllaç de tota la targeta (sp-card-link-overlay) es
     queda: un clic a qualsevol altra part obri la pàgina (mainHref). El
     contenidor .sp-card-accio puja damunt del vel (components.css), i el
     botó és un germà del vel, no un fill: el seu clic no arriba a l'enllaç
     de la targeta, i amb el teclat és una parada pròpia, després del vel.
     Sense la prop, el DOM de sempre. */
  accio = null,
  /* Onada 8 (261009; requeriments, punt 4: «s'ha d'afegir un botó gran …
     dins de la mateixa targeta») · `etiquetesAmbAccio`: amb `accio`, les
     etiquetes també es pinten, al seu lloc, i el botó va just després. La
     targeta d'un poble hi afig «Anar al xat» sense perdre la seua
     classificació ni l'enllaç a la Viquipèdia (Llei del Píxel). Sense la prop,
     la ranura ocupa el lloc de les etiquetes, com a la targeta d'El Xat. */
  etiquetesAmbAccio = false,
  /* IDEA-42 (B7h) · `formaMitja` ('16:9') i `posicioMitja` ({ cx, cy, zoom },
     ja coaccionat per qui pinta: mapejadorSeccions · portadaDeLaPublicacio):
     el mitjà en 16:9 amb el punt focal de l'autor (MitjaEnquadrada, dalt).
     Sense `formaMitja` o amb un altre valor, el DOM de sempre, byte a byte. */
  formaMitja,
  posicioMitja,
  traduccio: ambTraduccio,
  /* G1-N02 (Gauntlet de l'arbre R9) · `llenguaContingut`: la llengua del títol, el subtítol i el cos quan no és
     la de la pàgina (una targeta del Mur, en valencià, dins d'una pàgina traduïda). Va a eixos tres i al nom de
     l'enllaç de tota la targeta, que és el títol; mai al peu, que és de la interfície. Una traducció de la
     targeta mana sobre ella. Sense la prop, el DOM de sempre. */
  llenguaContingut,
  /* R51 (V2-01) · `translate`: només 'no' arriba a l'article (l'atribut
     estàndard). El Traduir de la pàgina (blocsTraduibles, que ja exclou
     [translate="no"]) i el del navegador deixen la targeta en l'original.
     Qualsevol altre valor, o sense la prop, el DOM de sempre. */
  translate,
  /* R51 (P0-46) · `modeTraduccio`: el translation_mode de l'element que pinta la targeta. Defensa en
     profunditat: amb un mode protegit ('curated_5_langs', 'none' o invàlid; translationMode.js ·
     allowsMachineTranslation) la targeta no oferix Traduir encara que qui la pinta el demane, i el motor
     (tradueixTot) el rep i el refusa. Sense la prop, el DOM de sempre. */
  modeTraduccio,
  dataTestId
}) {
  const idDescripcio = useId();
  const safeMainHref = mainHref && isSafeUrl(mainHref) ? mainHref : null;
  const safeAuthorHref = rutaDAutorSegura(authorHref);
  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4) · Els dos
     ganxos es criden sempre, en el mateix ordre: sense referència opaca reben
     '' i no fan res. */
  const imatgeDelPort = useResolvedAsset(refDelPort(imageUrl));
  const avatarDelPort = useResolvedAsset(refDelPort(avatarUrl));
  const safeImageUrl = fontDeLaTargeta(esMitjaOpac(imageUrl) ? imatgeDelPort : imageUrl, imatgePrivada);
  const safeAvatarUrl = fontDeLaTargeta(esMitjaOpac(avatarUrl) ? avatarDelPort : avatarUrl, imatgePrivada);
  const safeVideoUrl = typeof videoUrl === 'string' && videoUrl.trim() ? fontVideoPropia(resolRecursPropi(videoUrl)) : null;
  const TitleTag = TITOLS.has(headingLevel) ? headingLevel : 'h3';
  /* Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · La targeta
     d'una PERSONA (el descriptor de l'element, objecteDePerfil: tipus
     'persona') no porta drets d'autor ni categories: una persona no és una
     obra ni es categoritza. El poble, si el consumidor el dona, va a
     l'autoria (location), que la guarda no toca.
     Mana el tipus de l'OBJECTE representat, mai el de l'autor: una nota o un
     article signats per una persona continuen amb els seus drets i etiquetes
     (l'ordre del 261007, l'enllaç del copyright a totes les targetes, val per
     a tota obra). */
  const esPersona = objecte?.tipus === 'persona';
  const etiquetes = !esPersona && Array.isArray(labels) ? labels.filter(Boolean) : [];
  const drets = esPersona ? undefined : copyright;
  /* Gauntlet 2 · 261101 (G2-T7-02; resta de P1-22) · Els botons del peu
     («Traduir <títol>», «Comentar <títol>», «Compartir <títol>», «Ancorar
     <títol>») es diuen en la llengua de la interfície, amb una frase sencera
     (TEXTOS_PEU_TARGETA); sense títol, el verb sol. Fora de l'app o en
     valencià, el nom de sempre. */
  const t = useTraductorOpcional();
  const ambTitol = (accio) => {
    const { sol, ambTitol: frase } = TEXTOS_PEU_TARGETA[accio];
    return title ? tradueix(t, frase).replace('{titol}', () => String(title)) : tradueix(t, sol);
  };

  const alCalendari = usePastillaCalendari({ time, date, dateTime });

  /* Ordre del Mestre, 261004 · L'acció secundària (pulsacioLlarga.js). El
     hook es crida sempre; sense onAccioSecundaria no torna cap gestor. */
  const pulsacio = usePulsacioLlarga(typeof onAccioSecundaria === 'function'
    ? (_objecte, element) => onAccioSecundaria(element)
    : null);
  const traduccioAutomatica = allowsMachineTranslation({ translation_mode: modeTraduccio });

  const {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible,
    comentarXat,
    comentarPrivatAmb,
    moderacio
  } = useAccions({
    title,
    mainHref: safeMainHref,
    objecte,
    onConnect,
    onTranslate,
    onComment,
    onShare,
    showConnect,
    showTranslate: traduccioAutomatica ? showTranslate : false,
    showComment,
    showShare,
    hasFooter,
    telemetria: { ...telemetria, origen: 'targeta' },
    ambModeracio
  });

  /* Ordre del Mestre, 261001 (tasca 4) · Sense onDateTime propi, la pastilla
     porta al Calendari en el seu mes i ho diu al nom accessible. Un
     onDateTime propi (la previsualització que avisa) mana i conserva el nom
     de sempre; onDateTime={false}, un <time> sense clic. */
  const pastillaPropia = onDateTime === false || Boolean(onDateTime);
  const handleDateTime = onDateTime === false ? undefined : (onDateTime || alCalendari.onClick);
  const nomPastilla = pastillaPropia ? undefined : alCalendari.etiqueta;

  /* Visibilitat calculada sobre el que de veritat es pinta (correcció 3). */
  const teAutor = Boolean(author || safeAvatarUrl || location);
  const pinVisible = showPin ?? Boolean(onPin);
  const dataVisible = Boolean(time || date) && (showDateTime ?? true);

  const autor = teAutor && (
    <span className="sp-card-author">
      {safeAvatarUrl ? (
        <img alt={avatarAlt} className="sp-card-avatar" src={safeAvatarUrl} width="48" height="48" {...(imatgePrivada ? SENSE_REFERENT : null)} />
      ) : (
        <span className="sp-card-avatar sp-card-avatar--fallback">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        </span>
      )}
      {(author || location) && (
        <span className="sp-card-author-info">
          {author && <span className="sp-card-author-name">{author}</span>}
          {location && <span className="sp-card-author-location">{location}</span>}
        </span>
      )}
    </span>
  );

  const pin = pinVisible && (
    <ActionControl className="btn-icon-orange" label={ambTitol('ancorar')} onClick={onPin}>
      <PinIcon className="icon" />
    </ActionControl>
  );

  const dataHora = dataVisible && (
    <DateTimeControl time={time} date={date} dateTime={dateTime} label={nomPastilla} onClick={handleDateTime} />
  );

  /* T51 · La targeta és sempre lectura: només l'emoticona triada, mai la ploma. */
  const centre = emoticonaDeBarra({ mode: 'lectura', icon: emoticona }).mostra === 'glif'
    && <EmoticonaBarra emoticona={emoticona} />;

  /* FEDI-11 (ordre del Mestre, 261103) · Traducció instantània a les targetes:
     quan el Traductor de Poble o el transport lliure d'Apertium està actiu i la
     targeta no porta un onTranslate propi, el clic a Traduir obri el menú
     flotant MenuTraduir (com a les pàgines) i traduïx al vol title, subtitle i
     body en el mateix lloc, amb opció de tornar a «Original (valencià)». Sense
     servei (entorns de prova sense fixaTraductorLliure ni traductorUrl), es
     conserva la navegació a /traduccions i el DOM tancat byte a byte. */
  const ui = useEstatUIOpcional();
  const toast = useToastOpcional();
  const urlTraductor = typeof ui?.externalConfig?.traductorUrl === 'string' ? ui.externalConfig.traductorUrl : '';
  const servidorTraductor = useMemo(() => creaTraductor({ url: urlTraductor }), [urlTraductor]);
  const destinsCrus = ui?.externalConfig?.traductorLlengues;
  const clauDestins = Array.isArray(destinsCrus) ? destinsCrus.join(' ') : (typeof destinsCrus === 'string' ? destinsCrus : '');
  const destinsDelServei = useMemo(
    () => (servidorTraductor.disponible ? sanejaDestinsDeclarats(clauDestins) ?? null : null),
    [servidorTraductor, clauDestins]
  );
  const esTargetaDApp = idElement != null
    || typeof premuda === 'boolean'
    || typeof onAccioSecundaria === 'function'
    || telemetria?.comptar === false;
  const esObjecteNoPublic = esPrivat(objecte)
    || Boolean(objecte && Object.hasOwn(objecte, 'visibility') && objecte.visibility !== 'public');
  const bloquejadaPerPrivacitat = ambTraduccio === false
    || !traduccioAutomatica
    || esObjecteNoPublic
    || (esTargetaDApp && ambTraduccio !== true);
  const traduccioDisponible = !onTranslate && !bloquejadaPerPrivacitat && traduccioDePaginesDisponible(urlTraductor);
  const botoTraduirRef = useRef(null);
  const [menuTraduirObert, setMenuTraduirObert] = useState(false);
  const [traduccioCard, setTraduccioCard] = useState(null);
  const vidaTraduccioRef = useRef({ peticio: 0, control: null });

  const textCosCard = typeof body === 'string'
    ? body
    : (typeof body?.props?.children === 'string' ? body.props.children : '');

  const clauContingutCard = JSON.stringify([
    typeof title === 'string' ? title : '',
    typeof subtitle === 'string' ? subtitle : '',
    textCosCard
  ]);

  useEffect(() => {
    const vida = vidaTraduccioRef.current;
    setTraduccioCard((abans) => (abans && abans.clau === clauContingutCard ? abans : null));
    setMenuTraduirObert(false);
    return () => {
      vida.peticio += 1;
      vida.control?.abort();
      vida.control = null;
    };
  }, [clauContingutCard]);

  const traduccioVigent = traduccioCard?.clau === clauContingutCard ? traduccioCard : null;

  const avisaTraduccio = useCallback((parell) => {
    toast?.showToast?.(tradueix(t, parell));
  }, [toast, t]);

  const triaLlenguaCard = useCallback(async (codi) => {
    setMenuTraduirObert(false);
    if (codi && codi === traduccioVigent?.llengua) return;
    if (codi != null && destinsDelServei && llenguaDeTraduccio(codi) && !destinsDelServei.includes(codi)) {
      avisaTraduccio(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    const vida = vidaTraduccioRef.current;
    vida.peticio += 1;
    vida.control?.abort();
    vida.control = null;
    if (codi == null) {
      setTraduccioCard(null);
      return;
    }
    if (!llenguaDeTraduccio(codi)) return;
    if (!traduccioDisponible) {
      avisaTraduccio(PARELLS_AVIS_TRADUCCIO.senseTraductor);
      return;
    }
    let motor = servidorTraductor;
    if (!servidorTraductor.disponible) {
      const torn = vida.peticio;
      try {
        motor = (await carregaTraductorLliure())?.creaTraductorApertium?.() ?? null;
      } catch {
        motor = null;
      }
      if (torn !== vida.peticio) return;
      if (!motor?.disponible) {
        avisaTraduccio(PARELLS_AVIS_TRADUCCIO.senseConnexio);
        return;
      }
    }
    const camps = [];
    if (typeof title === 'string' && title.trim()) camps.push(['title', title.trim()]);
    if (typeof subtitle === 'string' && subtitle.trim()) camps.push(['subtitle', subtitle.trim()]);
    if (textCosCard.trim()) camps.push(['body', textCosCard.trim()]);
    if (!camps.length) {
      avisaTraduccio(PARELLS_AVIS_TRADUCCIO.senseText);
      return;
    }
    const id = vida.peticio;
    const control = typeof AbortController === 'function' ? new AbortController() : null;
    vida.control = control;
    try {
      const originals = new Set();
      const traduccions = await tradueixTot(motor, camps.map(([, valor]) => valor), codi, {
        signal: control?.signal,
        enOriginal: (index) => originals.add(index),
        translation_mode: modeTraduccio
      });
      if (id !== vida.peticio) return;
      vida.control = null;
      const seg = { clau: clauContingutCard, llengua: codi };
      camps.forEach(([camp], index) => {
        if (traduccions[index] && !originals.has(index)) seg[camp] = traduccions[index];
      });
      setTraduccioCard(seg);
    } catch (error) {
      if (id !== vida.peticio || error?.codi === CODI_TRADUCCIO.CANCELLADA) return;
      vida.control = null;
      avisaTraduccio(parellDError(error));
    }
  }, [avisaTraduccio, clauContingutCard, destinsDelServei, modeTraduccio, servidorTraductor, subtitle, textCosCard, title, traduccioDisponible, traduccioVigent?.llengua]);

  const onClicTraduir = !onTranslate && bloquejadaPerPrivacitat
    ? () => avisaTraduccio(PARELL_SENSE_TRADUCCIO)
    : traduccioDisponible
      ? () => setMenuTraduirObert((obert) => !obert)
      : handleTranslate;
  const langTraduccio = llenguaDeTraduccio(traduccioVigent?.llengua)?.lang;

  const accions = [
    traduirVisible && (
      <IconButton key="traduir" label={ambTitol('traduir')} onClick={onClicTraduir} refBoto={botoTraduirRef}
        ariaHaspopup={menuTraduirObert ? 'menu' : undefined}
        ariaExpanded={menuTraduirObert ? true : undefined}>
        <TranslateIcon className="icon" />
      </IconButton>
    ),
    traduirVisible && traduccioDisponible && menuTraduirObert && (
      <MenuTraduir key="menu-traduir" opcions={LLENGUES_TRADUCCIO} actual={traduccioVigent?.llengua ?? null}
        onTria={triaLlenguaCard} onTanca={() => setMenuTraduirObert(false)} botoRef={botoTraduirRef} />
    ),
    /* Ordre del Mestre (261007) · el menú de les dues vies, el de la barra.
       Onada 8 (261009) · «En privat» diu amb qui (l'autor, comentarPrivatAmb). */
    comentarVisible && (
      <BotoComentar key="comentar" label={ambTitol('comentar')} comentarXat={comentarXat} privatAmb={comentarPrivatAmb} onComment={handleComment} />
    ),
    compartirVisible && (
      <IconButton key="compartir" label={ambTitol('compartir')} onClick={handleShare}>
        <ShareIcon className="icon" />
      </IconButton>
    )
  ].filter(Boolean);

  /* «Connectar amb …» només té sentit amb Connectar: qualsevol altre verb
     («Obrir», «Veure detall», «Sol·licitar plaça») porta el títol darrere
     de dos punts. */
  const titolText = typeof title === 'string' ? title : '';
  /* Fase D (261020, tasca 2) · El ⋮ porta el títol al nom accessible, com
     Comentar i Compartir. */
  const accioModeracio = moderacio ? (
    <BotoModeracio titol={titolText} nomAutor={moderacio.objectiu.autor?.nom} tipusObjectiu={moderacio.objectiu.tipus}
      potBloquejar={moderacio.potBloquejar} onTria={moderacio.onTria} />
  ) : null;
  const esConnectar = String(connectLabel).toLocaleLowerCase('ca') === 'connectar';
  const nomConnectar = !titolText ? connectLabel
    : esConnectar ? `${connectLabel} amb ${titolText}` : `${connectLabel}: ${titolText}`;

  const connectar = connectarVisible && (
    <ActionControl
      className="btn-connectar sp-card-connect"
      label={nomConnectar}
      onClick={handleConnect}
    >
      <span className="sp-card-connect-text">{connectLabel}</span>
      <span className="sp-card-connect-plus" aria-hidden="true">+</span>
    </ActionControl>
  );

  const peuVisible = hasFooter !== false && (accions.length > 0 || Boolean(connectar));

  const cardClasses = [
    'sp-card',
    isAvis && 'sp-card--avis',
    variant !== 'default' && `sp-card--${variant}`,
    className
  ].filter(Boolean).join(' ');

  /* P5 (PRD §5.1) · Amb portes, la targeta sencera no és cap enllaç: un
     tercer objectiu (l'overlay) faria car un toc fallat i el lector
     anunciaria un control que només es diu com el títol.
     P6 · `mainHref` sí que compta: és la pàgina de Comentar i Compartir del
     peu. onMainClick, en canvi, no fa res i en DEV ho avisa. */
  const portesNetes = normalitzaPortes(portes);
  const ambPortes = portesNetes.length > 0;
  if (ambPortes && onMainClick && import.meta.env.DEV) {
    console.warn('[UniversalCard] Amb `portes` no es pinta l’enllaç de tota la targeta: onMainClick no fa res (mainHref només és la pàgina del peu).');
  }

  const ariaActual = actual ? 'true' : undefined;
  const ambPrincipal = !ambPortes && Boolean(safeMainHref || onMainClick);

  /* Ordre del Mestre, 261004 · El que les opcionals afigen a l'element
     principal (l'enllaç o el botó de tota la targeta). Sense elles, res: ni
     un atribut ni un gestor nou. */
  const secundaria = pulsacio(null);
  const ambSecundaria = typeof onAccioSecundaria === 'function';
  const descripcio = ambPrincipal && typeof descripcioAccessible === 'string' ? descripcioAccessible.trim() : '';
  /* Dins de l'element principal: l'anatomia de l'article no canvia i, amb el
     nom per aria-label, el lector no la llig dues vegades. */
  const textDescripcio = descripcio ? <span id={idDescripcio} className="sdp-nomes-lector">{descripcio}</span> : null;
  const extresPrincipal = {
    ...(idElement != null && idElement !== '' ? { 'data-element': String(idElement) } : null),
    ...(descripcio ? { 'aria-describedby': idDescripcio } : null),
    ...(llenguaContingut && title && !descripcio ? { lang: llenguaContingut } : null),
    /* Com les rajoles (GraellaArticles): el lector anuncia la drecera. */
    ...(ambSecundaria ? { 'aria-keyshortcuts': 'Shift+F10' } : null),
    ...secundaria.handlers
  };
  /* El clic que és la cua d'una pulsació llarga no fa l'acció principal. Un
     Link navega després del seu onClick: es para abans, en la captura. */
  const clicDelBoto = ambSecundaria && onMainClick
    ? (event) => { if (!secundaria.consumeix()) onMainClick(event); }
    : onMainClick;
  const capturaDelEnllac = ambSecundaria
    ? { onClickCapture: (event) => { if (secundaria.consumeix()) { event.preventDefault(); event.stopPropagation(); } } }
    : null;
  const ariaPremuda = typeof premuda === 'boolean' ? { 'aria-pressed': premuda ? 'true' : 'false' } : null;

  return (
    <article className={cardClasses} data-testid={dataTestId || undefined} aria-current={ambPrincipal ? undefined : ariaActual} translate={translate === 'no' ? 'no' : undefined}>
      {(autor || centre || pin || headerAction || dataHora || accioModeracio) && (
        <CardHeader autor={autor} autorHref={safeAuthorHref} centre={centre} pin={pin} dataHora={dataHora} headerAction={headerAction}
          accioModeracio={accioModeracio} />
      )}

      {ambPortes ? null : safeMainHref ? (
        <Link className="sp-card-link-overlay" to={safeMainHref} onClick={onMainClick} aria-label={title || 'Obrir detall'} aria-current={ariaActual} {...extresPrincipal} {...capturaDelEnllac}>
          {textDescripcio}
        </Link>
      ) : onMainClick ? (
        <button type="button" className="sp-card-link-overlay" onClick={clicDelBoto} aria-label={title || 'Obrir detall'} aria-current={ariaActual} {...ariaPremuda} {...extresPrincipal}>
          {textDescripcio}
        </button>
      ) : null}

      <CardBody
        imatge={safeImageUrl}
        imageAlt={imageAlt}
        video={safeVideoUrl}
        calendarBadge={calendarBadge}
        squareBadge={squareBadge}
        price={price}
        icon={icon}
        title={llevaPuntFinal(traduccioVigent?.title ?? title)}
        TitleTag={TitleTag}
        subtitle={llevaPuntFinal(traduccioVigent?.subtitle ?? subtitle)}
        body={traduccioVigent?.body ?? body}
        etiquetes={etiquetes}
        copyright={drets}
        portes={ambPortes ? <PortesTargeta portes={portesNetes} /> : null}
        privada={imatgePrivada}
        accio={accio}
        etiquetesAmbAccio={etiquetesAmbAccio === true}
        formaMitja={formaMitja}
        posicioMitja={posicioMitja}
        langTitle={traduccioVigent?.title ? langTraduccio : llenguaContingut}
        langSubtitle={traduccioVigent?.subtitle ? langTraduccio : llenguaContingut}
        langBody={traduccioVigent?.body ? langTraduccio : llenguaContingut}
      />

      {/* P6 (directriu 2325, confirmació 2) · El peu es pinta amb portes o sense. */}
      {peuVisible && <CardFooter accions={accions} connectar={connectar} />}
    </article>
  );
}
