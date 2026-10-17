import React from 'react';
import { CalendarDays, MapPin, UserRound, MessageCircle } from 'lucide-react';
import { renderRichText, renderPostContent } from './detailRichText.jsx';
import { getFirstImage } from './detailHelpers.jsx';
import { Aplec2023Article } from '../mur/articles/Aplec2023Article.jsx';
import { resolRecursPropi, resolRecursosDeHtml, resolveAsset } from '../../config/assetResolver.js';
import { autorDe, objecteDe, rutaDePerfilPublicDAutor, rutaXatDePagina } from '../../config/navigation.js';
import { signaturaDeQuiSigna } from '../../data/identitatsSeed.js';
import { imatgesDeProducte } from '../mercat/imatgesDeProducte.js';
import { nomDeLaGent } from '../pobles/nomsDelPoble.js';
import { esFontImatgePropia, sanitizeHtml } from '../../utils/sanitize.js';
import { MARCA_GRUP } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
/* Esmena 3 del pla 261007_1645 · Pel camí directe, mai per la façana de
   PedraSeca: este mòdul el llegixen elementDeSeccio.js, el diàleg Connectar i
   el lector del MAS, i la façana hi arrossegaria la biblioteca sencera. */
import { CarruselImatges } from '../../components/PedraSeca/organismes/CarruselImatges.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
/* Gauntlet 261017 (C04) · El visor de les fotos d'una publicació del Mur
   (portadaDElement, més avall).
   Revisió del Gauntlet 261017 (R3, pes) · D'ací només ve el disparador: la
   meitat del visor (VisorDeLArxiu, l'EXIF, VisorImatges i el cens) la porta
   VisorDePublicacio en diferit, en obrir-lo. Este mòdul el llig
   elementDeSeccio i, per ell, /xat, Notes i cada pàgina de text. */
import { VisorDePublicacio } from './VisorDePublicacio.jsx';
/* Onada 6 (pàgina del poble) · Les pestanyes i el Carregant, també pel camí
   directe. El panell de la gent del poble (les seues targetes) arrossega les
   targetes del Mur i la façana: es carrega en diferit (lazyRoute), només quan
   es pinta la pàgina d'un poble. La clau i el naixement del poble
   (clauDelPoble.js) i el xat (xatDelPoble.js) no porten cap targeta. */
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Pestanyes } from '../../components/PedraSeca/organismes/Pestanyes.jsx';
import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { poblesAmbNaixement } from '../pobles/clauDelPoble.js';
import { objecteDelPobleXat } from '../pobles/xatDelPoble.js';

const PublicacionsDelPoble = lazyRoute(() => import('../pobles/PublicacionsDelPoble.jsx'));

/* T5 · Les imatges del cos (variacions del Mercat, Multimèdia) es resolen en
   pintar-les: incrustat, un '/assets/…' penja del paquet. Sense base, el de
   sempre. getImage no es toca: acaba a heroImage i PageFrame ja la resol. */

/* Ordre del Mestre (261007) · Les fotos d'un producte (la primera és la
   principal, mai el logotip de qui ven) viuen a mercat/imatgesDeProducte.js,
   un mòdul pur que també lligen les targetes del Mercat i del Mur. */
export { imatgesDeProducte };

/* Esmena 3 del pla 261007_1645 (ordre del Mestre, 261007: «El component
   original renderitzava el carrusel de fotos i les variacions sense perdre
   la localització de l'element; això s'ha de recuperar») · La portada i
   l'avatar de capçalera d'un element, una sola peça per a les dues lectures:
   la pàgina de la ruta (ItemDetailSection) i el lector del MAS
   (notes/PublicacioDetall.jsx). Abans vivien dins d'ItemDetailSection i el
   lector, sense elles, pintava el logotip de qui ven com a portada. El codi
   és el d'allà, literal: el DOM del detall no canvia (Llei del Píxel), fora
   de les imatges de tercers de les seccions del Mur (Decisió 3 del Mestre,
   261007, més avall). */

/* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT). Per a evitar el rastreig d'IPs dels usuaris per
   part de tercers, només es permetran imatges allotjades localment o pujades
   al nostre servidor.» El MODE ESTRICTE del detall és esFontImatgePropia de
   utils/sanitize.js (el mateix origen, el nostre servidor de mitjans,
   data:image i sdp-media://; cap servidor de tercers, tampoc els avatars de
   Google, Facebook o GitHub), sobre el valor que arriba i sobre el resolt
   (resolveAsset), que és el que demanaria la pàgina.
   Revisió adversarial del 261007 · És una regla del Mur: només les seccions
   que el Mur llig (section_submissions 'mur', 'mercat' i 'events', loadMur de
   data/supabase/content.js). Les metas no porten id i es reconeixen per la
   seua llista (listPath); el lector del MAS en té l'id. Pobles i Multimèdia
   queden com abans (Llei del Píxel) fins que el Mestre diga si també hi van.
   Relleu 261007 (peça «imatges-detall») · La regla vivia a elementDeSeccio.js
   (imatgePropiaDelDetall), que només la passava a la portada i a l'avatar de
   la barra taronja. El mateix detall continuava demanant a tercers l'avatar
   redó de davant de l'H1, el carrusel, les variacions del Mercat, og:image i
   el lector del MAS: a la mateixa pàgina conviuen la silueta de la barra i la
   foto de Google de l'H1. Ara la regla és d'ací, una sola vegada, i la lligen
   tots; el cos HTML hi passa per cosAmbImatgesPropies, més avall.
   elementDeSeccio.js ja importava este mòdul: cap cicle nou. */
const LLISTA_DE_SECCIO_DEL_MUR = new Map([['mur', '/mur'], ['mercat', '/mercat'], ['events', '/calendari']]);
const LLISTES_DEL_MUR = new Set(LLISTA_DE_SECCIO_DEL_MUR.values());

/** Si `seccio` és del Mur: la meta d'un detall (per la seua llista, listPath)
 *  o l'id d'una secció ('mur', 'mercat', 'events'). Un Map, no un objecte: un
 *  id com «constructor» no casa amb res. */
export function esSeccioDelMur(seccio) {
  return LLISTES_DEL_MUR.has(typeof seccio === 'string' ? LLISTA_DE_SECCIO_DEL_MUR.get(seccio) : seccio?.listPath);
}

/** Decisió 3 (261007) · Una imatge pròpia abans i després de resoldre-la. */
export function esImatgePropiaDelDetall(src) {
  return esFontImatgePropia(src) && esFontImatgePropia(resolveAsset(src));
}

/** Decisió 3 (261007) · El valor d'una imatge del detall: intacte si es pot
 *  demanar (també fora del Mur, i un valor buit tal qual); null si és d'una
 *  secció del Mur i no és propi. Null, no undefined: PageFrame no hi posa el
 *  logotip de Sóc de Poble (signaria amb la marca la publicació d'un veí). */
export function imatgePropiaDelDetall(seccio, valor) {
  if (!valor || !esSeccioDelMur(seccio)) return valor;
  return esImatgePropiaDelDetall(valor) ? valor : null;
}

/* Decisió 3 (261007) · Relleu 261007 (peça «imatges-detall», punt g) · El
   cos HTML d'una publicació, d'un producte o d'un acte del Mur. El sanejador
   de sempre (esFontImatgeSegura) admet a les <img> els avatars dels
   proveïdors d'entrada (Google, Facebook, GitHub): són servidors de tercers.
   Abans que renderRichText (detailRichText.jsx) el pinte pel camí de sempre,
   el cos passa una vegada pel MODE ESTRICTE del sanejador
   (sanitizeHtml(html, { imatgesPropies: true })), amb els src ja resolts
   (resolRecursosDeHtml): és el que demanaria la pàgina. Una <img> de fora
   perd el src, com qualsevol imatge de fora de sempre. El sanejador és
   idempotent (formaDelGrup.js: sanitizeHtml(getHTML()) === getHTML()), i la
   segona passada de renderRichText no canvia res del que ja hi ha passat.
   Revisió adversarial del 261008 · També les targetes incrustades al cos
   (MARCA_GRUP de formaDelGrup.js): quan l'original no es resol, la targeta
   pinta la instantània desada (data-imatge), i el seu filtre admet els
   avatars OAuth. La mateixa passada estricta li lleva una imatge que no és
   pròpia (el ganxo de sanitize.js) i la targeta es pinta sense imatge. Si
   l'original es resol, ja hi mana paginaDElement, filtrada.
   Un text sense cap <img> ni cap grup de targetes, o que renderRichText no
   llig com a HTML (la seua mateixa detecció), torna intacte: el mateix camí,
   byte a byte (Llei del Píxel). Només el criden les metas del Mur, el Mercat
   i l'agenda, i el lector del MAS per a eixes seccions: Pobles, Multimèdia i
   Notes, com abans. */
const ES_HTML = /<[a-z][\s\S]*>/i;
const PORTA_IMATGE = /<img\b/i;

/** Decisió 3 (261007) · El cos del Mur sense cap imatge de tercers: ni una
 *  <img> ni la instantània d'una targeta incrustada. */
export function cosAmbImatgesPropies(text) {
  const raw = String(text || '').trim();
  if (!ES_HTML.test(raw) || !(PORTA_IMATGE.test(raw) || raw.includes(MARCA_GRUP))) return text;
  return sanitizeHtml(resolRecursosDeHtml(raw), { imatgesPropies: true });
}

/**
 * Ordre del Mestre (261007) · Un element amb més d'una foto (els productes
 * del Mercat, getImages) porta a la portada un carrusel: la ranura
 * topBarData.heroComponent de PageFrame, en lloc de la imatge sola. La
 * primera diapositiva és la mateixa portada (getImage): no es pinta dues
 * vegades (pla 261006_1140). Els src es resolen com els resol PageFrame per a
 * la portada. La clau és l'element: un altre producte comença per la seua
 * primera foto. Amb una foto o cap, null: cap prop nova, la portada de sempre
 * (Llei del Píxel).
 * Revisió del 261007 (M9) · Els textos del carrusel, traduïts ací: la peça
 * és presentacional i porta la reserva en valencià. Cada foto porta el nom
 * del producte d'alt: les dades no en porten cap de propi per foto, i cada
 * diapositiva ja diu «Imatge X de N».
 * `pagina` són les props de paginaDElement (elementDeSeccio.js): el títol i
 * l'alt de la portada.
 * Decisió 3 (261007) · Al Mur, només les fotos pròpies (esImatgePropiaDelDetall,
 * crua i resolta): una de fora no es demana. Si en queda una o cap, sense
 * carrusel; la portada sola ja la filtra paginaDElement.
 * Revisió adversarial del 261008 · Si la PRIMERA foto és de fora, les dues
 * lectures no coincidixen: amb dues o més pròpies, el carrusel comença per la
 * primera pròpia, però heroImage (i og:image) és null; amb una o cap de
 * pròpia, el detall queda sense portada, encara que eixa una siga pròpia.
 * És la regla literal de l'encàrrec; pregunta oberta al Mestre.
 * Gauntlet 261017 (C04 de Codex: «La fotografia de /mercat/mac-mini-m4 no
 * obri cap modal en clicar-la»; requisit: «Obertura modal a pantalla
 * completa en fer clic a qualsevol imatge d'una galeria o publicació») · Al
 * Mur (publicacions, productes i actes), les fotos de la portada obrin el
 * visor de l'Arxiu visual sense eixir de la pàgina (VisorDePublicacio.jsx):
 * el carrusel, amb onObri (cada foto és un botó); la portada sola, la mateixa
 * imatge dins d'un botó. Visualment igual, llevat del cursor de lupa. Fora
 * del Mur, com abans.
 * Revisió del Gauntlet 261017 (M2) · Una portada pujada (sdp-media://, que
 * només resol el port) ja no es queda sense visor: VisorDePublicacio la
 * resol pel port com ImatgeDePortada de PageFrame i, mentre no la té, no pinta
 * res (la portada buida de sempre). El lector del MAS (PublicacioDetall)
 * també la munta, per a les publicacions i els actes. Les imatges del cos
 * (el text enriquit) encara no obrin el visor.
 */
const SECCIO_DE_LA_LLISTA = new Map([...LLISTA_DE_SECCIO_DEL_MUR].map(([seccio, llista]) => [llista, seccio]));

/* Les dades declarades de la publicació per al panell del visor
   (VisorDePublicacio.jsx · fotosDeLaPublicacio): mai cap d'inventada. */
const dadesDeLaPublicacio = (section, item, pagina) => ({
  titol: String(pagina.title ?? ''),
  autor: pagina.authorName ?? null,
  drets: item.copyright ?? null,
  poble: item.town_name || item.population || null,
  article: { sectionId: SECCIO_DE_LA_LLISTA.get(section.listPath), id: item.id }
});

export function portadaDElement(section, item, pagina, t) {
  const totes = typeof section.getImages === 'function' ? section.getImages(item) : [];
  const delMur = esSeccioDelMur(section);
  const fotos = Array.isArray(totes) && delMur ? totes.filter(esImatgePropiaDelDetall) : totes;
  const ambVisor = delMur && item?.id != null && String(item.id) !== '';
  const clau = String(item.id ?? '');
  const obri = t('section.multimedia.visor.obri', 'Veure la imatge a pantalla completa');
  if (!Array.isArray(fotos) || fotos.length < 2) {
    const portada = pagina?.heroImage;
    if (!ambVisor || typeof portada !== 'string' || portada.trim() === '') return null;
    return {
      topBarData: {
        heroComponent: (
          <VisorDePublicacio key={clau} fotos={[portada]} dades={dadesDeLaPublicacio(section, item, pagina)}
            etiquetaObri={obri} alt={pagina.heroAlt || ''} />
        )
      }
    };
  }
  const imatges = fotos.map((src) => ({ src: resolveAsset(src), alt: pagina.heroAlt || '' }));
  const etiqueta = t('carrusel.imatgesDe', 'Imatges de {titol}').replace('{titol}', () => String(pagina.title ?? ''));
  const etiquetes = {
    anterior: t('carrusel.anterior', 'Imatge anterior'),
    seguent: t('carrusel.seguent', 'Imatge següent'),
    diapositives: t('carrusel.diapositives', 'Diapositives'),
    posicio: t('carrusel.posicio', 'Imatge {n} de {total}'),
    carrusel: t('carrusel.rol', 'carrusel'),
    diapositiva: t('carrusel.rolDiapositiva', 'diapositiva')
  };
  return {
    topBarData: {
      heroComponent: ambVisor ? (
        <VisorDePublicacio key={clau} fotos={fotos} dades={dadesDeLaPublicacio(section, item, pagina)}>
          {(onObri) => <CarruselImatges imatges={imatges} etiqueta={etiqueta} etiquetes={{ ...etiquetes, obri }} onObri={onObri} />}
        </VisorDePublicacio>
      ) : (
        <CarruselImatges key={clau} imatges={imatges} etiqueta={etiqueta} etiquetes={etiquetes} />
      )
    }
  };
}

/**
 * Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Qui
 * signa decidix la capçalera. Una persona (o la IA), reconeguda per
 * identificador (autorDe), porta el seu avatar redó davant de l'H1, mai el
 * logotip de Sóc de Poble. L'entitat del projecte el porta perquè la seua
 * boina va al seu perfil (esRutaDelProjecte; PageFrame, via d).
 * Correcció dels verificadors (ordre del Mestre, 261004) · L'avatar de
 * capçalera és només el de la identitat de qui signa (author_avatar, T3 de
 * 261001), mai l'avatar_url de l'element: eixe camp no és l'autoria i al
 * Mercat porta la marca de Sóc de Poble (marketSeed.js). Sense author_avatar,
 * null: el bloc del títol comença per l'H1. La boina continua amb el seu avatar.
 * `nom` és el de qui signa, per a l'alt.
 * Decisió 3 (261007) · `seccio`, la meta del detall o l'id de la secció: al
 * Mur, un avatar que no és propi (el de Google d'una persona que entra amb
 * Google, o qualsevol servidor de fora) no es demana. null, com sense
 * author_avatar: l'H1 es pinta sol, i la barra taronja de la mateixa pàgina
 * ja hi pinta la silueta (paginaDElement). Sense `seccio`, cap filtre nou.
 * Gauntlet 261016 (Bloc -1; ordre del Mestre: «sempre la seua foto personal
 * de perfil») · La persona pilot porta SEMPRE la seua foto i el seu nom
 * (identitatsSeed.js · signaturaDeQuiSigna), també quan l'element no porta
 * author_avatar: la fila de supabase/seed.sql del Mac Mini (sense
 * author_avatar) deixava la capçalera de /mercat/mac-mini-m4 sense avatar en
 * remot i en el node local. Qualsevol altra persona, la regla de dalt.
 */
export function avatarAutorDElement(item, nom, seccio) {
  const signatura = signaturaDeQuiSigna(item, {
    nom,
    avatar: typeof item.author_avatar === 'string' ? item.author_avatar : ''
  });
  const avatarDeLaIdentitat = signatura.avatar;
  const src = imatgePropiaDelDetall(seccio, avatarDeLaIdentitat);
  return autorDe(item)?.tipus === 'persona' && src
    ? { src, alt: signatura.nom ? `Avatar de ${signatura.nom}` : 'Avatar de qui signa' }
    : null;
}

/* Relleu 261007 · Verificació final de la peça «imatges-detall» · La
   referència opaca d'una pujada pròpia (sdp-media://, storage.js). El mode
   estricte l'admet, però a les variacions del Mercat no la resol ningú i
   pintaria una imatge trencada: s'exclou per la forma, sense resoldre res
   contra l'origen de la finestra. */
const REFERENCIA_OPACA = /^sdp-media:/i;

export function buildMercatDetailSectionMeta({ marketItems = [], t }) {
  return {
    title: t('section.detail.mercat.title', 'Mercat'),
    label: t('section.detail.mercat.label', 'Producte'),
    listPath: '/mercat',
    getAuthorHref: rutaDePerfilPublicDAutor,
    items: marketItems,
    getTitle: (item) => item.title || t('section.detail.mercat.itemTitle', 'Producte'),
    getSubtitle: (item) => item.subtitle || item.description || item.summary || '',
    /* Ordre del Mestre (261007) · La portada és la primera foto del producte
       (imatgesDeProducte), mai el logotip de qui ven. Abans,
       imageSrc || … || avatar_url: la marca de Sóc de Poble guanyava a la
       xica de la samarreta. Sense cap foto, cap portada. */
    getImage: (item) => imatgesDeProducte(item)[0] || null,
    /* Ordre del Mestre (261007) · Totes les fotos: amb més d'una, la portada
       del detall és un carrusel (portadaDElement, d'este mòdul, que munten
       ItemDetailSection i el lector del MAS). */
    getImages: imatgesDeProducte,
    renderBody: (item) => (
      <>
        {item.description && (
          <div >
            {/* Decisió 3 (261007) · El Mercat és del Mur: cap <img> de tercers al cos. */}
            {renderRichText(cosAmbImatgesPropies(item.description))}
          </div>
        )}
        {Array.isArray(item.variations) && item.variations.length > 0 ? (
          <div className="stack-grid ">
            {item.variations.map((variation) => (
              <div key={variation.name} className="note-card stack-grid">
                {/* Decisió 3 (261007) · El Mercat és del Mur: la foto d'una
                    variació, només si és pròpia; una de fora no es demana i
                    la variació es pinta com sense foto. La pròpia, com abans.
                    Revisió adversarial del 261008 · Un sdp-media:// cru passa
                    el mode estricte, però ací no el resol ningú i pintaria una
                    imatge trencada. Ara que el mapejador conserva eixa forma,
                    la variació es pinta com sense foto.
                    Relleu 261007 · Verificació final · S'exclou per la forma
                    (REFERENCIA_OPACA), no amb isSafeAsset: isSafeAsset resol un
                    camí '/…' contra l'origen de la finestra i només admet
                    http(s), i a l'app nativa (capacitor://localhost) la foto
                    PRÒPIA de la variació desapareixia (la Samarreta de la
                    llavor). Un valor que no és text, com sense foto. */}
                {typeof variation.image === 'string' && !REFERENCIA_OPACA.test(variation.image.trim()) && esImatgePropiaDelDetall(variation.image) && (
                  <img 
                    src={resolRecursPropi(variation.image)}
                    alt={variation.name} 
                    
                    width={120}
                  />
                )}
                <h3>
                  {variation.name}
                </h3>
                <p className="card__text ">
                  {variation.description}
                </p>
                <p className="detail-seller">
                  VENEDOR: {item.seller || 'SÓC DE POBLE'}
                </p>
                <div className="sp-card-price">
                  {variation.price}
                </div>
                <button className="btn btn-secondary sdp-boto--ple">
                  Afegeix al cabàs
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </>
    )
  };
}

/* Onada 5 (ordre del Mestre, 261008) · El xat de la gent d'un poble: el
   mateix fil que obri «Comentar · En públic» i el botó gran de la seua
   targeta (rutaXatDePagina sobre el descriptor del poble). Onada 8 · La
   caputxa ja no hi porta: porta a la fitxa del poble.
   Onada 6 (pla 261009_0245, ítem 4: «El fil de xat específic també es dirà
   'Gent de la Torre'») · El descriptor és el d'objecteDelPobleXat
   (pobles/xatDelPoble.js), el mateix de la targeta de /pobles: el fil porta el
   nom de la gent, no el del poble. */
const rutaXatDelPoble = (item) => rutaXatDePagina(objecteDelPobleXat(item));

/* Revisió adversarial de l'Onada 6 · Si el tros diferit del panell no es pot
   descarregar (una connexió rural que cau), lazyRoute llança LazyRouteError.
   El SlotErrorBoundary el deixa passar a propòsit (la recuperació d'un import
   és de la barrera de la ruta, RouteErrorBoundary: recarregar), i sense esta
   barrera la pàgina sencera del poble (capçalera, botó blau i pestanya)
   quedava substituïda per l'error de la ruta. El panell és un complement de
   la pàgina: esta barrera només es queda la fallada de l'import dins de la
   pestanya, amb l'Alerta d'error de Pedra Seca. Sense botó de reintent: un
   import fallit continua fallit a la memòria cau de React i del navegador, i
   un «Torna-ho a provar» seria fals; recarregar és cosa de qui navega.
   Qualsevol altre error puja com sempre (el de les targetes ja el recull el
   SlotErrorBoundary del panell, PublicacionsDelPoble.jsx). */
export class BarreraDelPanellDelPoble extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(anteriors) {
    if (this.state.error && anteriors.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!esErrorLazy(error)) throw error;
    return this.props.fallback;
  }
}

/* Onada 6 (pla 261009_0245, ítem 5; prompt 261009_0230, punt 6) · La barra
   de pestanyes centrada de la pàgina d'un poble, davall del botó blau. La
   primera, «Gent de …» (l'H1), amb totes les targetes publicades des del
   poble (Mur, Agenda i Mercat), casades per dades: cap nom de poble al codi.
   El panell es carrega en diferit; mentre arriba, el Carregant de Pedra Seca,
   i si no arriba, l'avís dins de la pestanya (BarreraDelPanellDelPoble). */
function PestanyesDelPoble({ poble, gent, t }) {
  return (
    <Pestanyes
      centrades
      etiqueta={t('section.detail.pobles.pestanyes', 'Continguts del poble')}
      pestanyes={[{
        id: 'gent',
        etiqueta: gent,
        contingut: (
          <BarreraDelPanellDelPoble
            resetKey={String(poble?.id ?? '')}
            fallback={(
              <Alerta to="error" titol={t('section.detail.pobles.gent.error', 'No s’han pogut carregar les publicacions del poble')}>
                {t('section.notes.historic.fallada', 'La resta de la pàgina continua com sempre.')}
              </Alerta>
            )}
          >
            <React.Suspense fallback={<Carregant etiqueta={t('section.detail.pobles.gent.carregant', 'Carregant les publicacions del poble…')} />}>
              <PublicacionsDelPoble poble={poble} />
            </React.Suspense>
          </BarreraDelPanellDelPoble>
        )
      }]}
    />
  );
}

export function buildPoblesDetailSectionMeta({ towns = [], t, publicacions = null }) {
  /* Onada 5 (F5, fase 3) · L'H1 és l'`author` de la fitxa i, si no en porta,
     la regla única de nomsDelPoble.js (la de la targeta i la barra taronja:
     «Gent d'Orxeta», amb l'elisió). Sense nom de poble, el de sempre. */
  const getTitle = (item) => item.author || nomDeLaGent(item.title || item.name)
    || `Gent de ${t('section.detail.pobles.itemTitle', 'Poble')}`;
  /* Onada 5 (ordre del Mestre, 261008: «Parlar amb la Gent de la Torre») ·
     El verb del botó blau nomena l'entitat de l'H1 quan és «Gent …»; si no,
     el de la porta d'El Xat. */
  const verbDelXat = (item) => {
    const gent = String(getTitle(item) || '').trim();
    return gent.startsWith('Gent ')
      ? t('section.detail.pobles.parlarAmb', 'Parlar amb la {gent}').replace('{gent}', () => gent)
      : t('section.xat.anarAlXat', 'Anar al xat');
  };
  return {
    title: t('section.detail.pobles.title', 'Pobles'),
    label: t('section.detail.pobles.label', 'Poble'),
    listPath: '/pobles',
    /* Onada 5 · L'autoria de la barra taronja portava al xat de la gent del
       poble. Derogat per l'Onada 8 (261009): «un clic a QUALSEVOL boina
       taronja porta SEMPRE al perfil públic», mai al xat. La boina d'un poble
       porta a la seua fitxa (/pobles/<id>), la mateixa de la caputxa de la
       targeta: ací s'enllaça a si mateixa. És la ruta del seu descriptor
       (objecteDe, validada; sense id, cap enllaç). El xat continua al botó
       blau i a «Comentar · En públic». */
    getAuthorHref: (item) => objecteDe(item, 'pobles')?.ruta || null,
    /* Onada 6 (pla 261009_0245, ítem 4) · El xat que obri «Comentar» a la
       pàgina del poble (ItemDetailSection · objecteXat): el de la gent. */
    getObjecteXat: objecteDelPobleXat,
    /* Onada 6 (requisit 15 de l'Onada 5) · Amb les publicacions del Mur, cada
       fitxa porta el seu naixement a created_at (clauDelPoble.js ·
       poblesAmbNaixement: només les publicacions que declaren el poble amb
       poble_id el poden avançar): la barra taronja de la pàgina i el lector
       del MAS diuen la mateixa data que la pastilla de /pobles. Sense, les
       fitxes tal qual. */
    items: publicacions ? poblesAmbNaixement(towns, publicacions) : towns,
    getTitle,
    getSubtitle: (item) => item.title || item.name || '',
    getImage: (item) => item.image_url || null,
    /* Onada 5 (ordre del Mestre, 261008) · Davall de l'entradilla (el text de
       la Viquipèdia, que paginaDElement passa a lead), el botó blau gros cap
       al xat: PortaDePagina, la porta d'«Anar al xat» d'El Xat. La província
       i la comarca ja són etiquetes de la capçalera (paginaDElement): ací no
       es repetixen (sdp-universal-page §4).
       Onada 6 · Davall, la barra de pestanyes (PestanyesDelPoble), només a la
       pàgina del poble ({ detall: true }, ItemDetailSection): el lector de
       connexions del MAS (ConnexioDetall) crida renderBody(item) i no la
       pinta. */
    renderBody: (item, { detall = false } = {}) => (
      <>
        <div className="sdp-pagina-accio">
          <PortaDePagina porta={{ id: 'xat-del-poble', verb: verbDelXat(item), desti: rutaXatDelPoble(item), varietat: 'primari' }} />
        </div>
        <div className="badge-row">
          <span className="pill">{item.population || item.type || t('section.detail.pobles.itemTitle', 'Poble')}</span>
          <span className="pill"><MapPin size={14} /> {item.town_name || item.title || ''}</span>
        </div>
        {detall ? <PestanyesDelPoble poble={item} gent={getTitle(item)} t={t} /> : null}
      </>
    )
  };
}

export function buildNotesDetailSectionMeta({ notes = [], t }) {
  return {
    title: t('section.detail.notes.title', 'Notes'),
    label: t('section.detail.notes.label', 'Nota'),
    listPath: '/notes',
    items: notes,
    getTitle: (item) => item.title || t('section.detail.notes.itemTitle', 'Nota'),
    getSubtitle: (item) => item.body || item.content || '',
    getImage: () => null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill">{item.folderId || t('section.detail.notes.folderFallback', 'General')}</span>
          <span className="pill">{item.updatedAt || ''}</span>
        </div>
        {renderRichText(item.body || item.content)}
      </>
    )
  };
}

export function buildMurDetailSectionMeta({ feedPosts = [], t }) {
  return {
    title: t('section.detail.mur.title', 'Mur'),
    label: t('section.detail.mur.label', 'Publicació'),
    listPath: '/mur',
    items: feedPosts,
    getTitle: (item) => item.title || t('section.detail.mur.itemTitle', 'Publicació'),
    getSubtitle: (item) => item.post_subtitle || item.description || '',
    getImage: (item) => item.imageSrc || getFirstImage(item.image_url || item.image) || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill"><UserRound size={14} /> {item.author || t('section.detail.mur.author', 'Sóc de Poble')}</span>
          <span className="pill"><MapPin size={14} /> {item.town_name || t('section.detail.mur.town', 'La Torre de les Maçanes')}</span>
          <span className="pill"><MessageCircle size={14} /> {item.comments || 0}</span>
          <span className="pill">{item.likes || 0} {t('section.mur.likes', "m'agrada")}</span>
        </div>
        {/* Decisió 3 (261007) · Cap <img> de tercers al cos de la publicació. */}
        {renderPostContent(cosAmbImatgesPropies(item.content || item.summary))}
        {Array.isArray(item.tags) && item.tags.length > 0 ? (
          <div className="badge-row detail-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        ) : null}
      </>
    )
  };
}

/* Sense una acció de supressió pel port, el detall no oferix un botó que
   només simula la destrucció amb alert(), tampoc a una administradora. */
export function buildMultimediaDetailSectionMeta({ mediaItems = [], t }) {
  return {
    title: t('section.detail.multimedia.title', 'Multimèdia'),
    label: t('section.detail.multimedia.label', 'Element'),
    listPath: '/multimedia',
    items: mediaItems,
    getTitle: (item) => item.title || t('section.detail.multimedia.itemTitle', 'Element multimèdia'),
    getSubtitle: (item) => item.subtitle || item.tag || item.kind || '',
    getImage: (item) => item.src || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill">{item.tag || t('section.detail.multimedia.mediaType', 'Media')}</span>
          <span className="pill">{item.kind || t('section.detail.multimedia.imageType', 'Imatge')}</span>
          {item.source ? <span className="pill"><UserRound size={14} /> {item.source}</span> : null}
          {item.created_at ? <span className="pill">{String(item.created_at).slice(0, 10)}</span> : null}
        </div>
        {renderRichText(item.description || item.content)}
        {item.src ? (
          <div className="media-frame media-frame--contain detail-hero__media detail-media">
            <img src={resolRecursPropi(item.src)} alt={item.title} decoding="async" />
          </div>
        ) : null}

      </>
    )
  };
}

export function buildEventsDetailSectionMeta({ events = [], t }) {
  return {
    title: t('section.detail.events.title', 'Events'),
    label: t('section.detail.events.label', 'Agenda'),
    /* Auditoria 261007 (B) · La llista viva dels actes és /calendari
       (config/sections.js, ruta d'App.jsx). /events no té ruta d'un sol tram
       i el «Torna» d'un acte no trobat (ItemDetailSection) queia a la 404. */
    listPath: '/calendari',
    items: events,
    getTitle: (item) => item.title || t('section.detail.events.itemTitle', 'Acte'),
    getSubtitle: (item) => item.subtitle || '',
    getImage: (item) => item.image_url || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill"><CalendarDays size={14} /> {item.date || ''}</span>
          <span className="pill">{item.type || t('section.detail.events.typeFallback', 'Agenda')}</span>
          <span className="pill"><UserRound size={14} /> {item.author_name || t('section.detail.events.organisation', 'Organització')}</span>
          {item.file ? <span className="pill">{item.file}</span> : null}
        </div>
        
        {/* Decisió 3 (261007) · L'agenda és del Mur: cap <img> de tercers al cos. */}
        {item.id === 'aplec-2023' ? (
          <Aplec2023Article />
        ) : (
          renderRichText(cosAmbImatgesPropies(item.description || item.content))
        )}
      </>
    )
  };
}

export function buildDetailSectionMeta({ events, feedPosts, marketItems, mediaItems, notes, towns, t, rol }) {
  return {
    mur: buildMurDetailSectionMeta({ feedPosts, t }),
    mercat: buildMercatDetailSectionMeta({ marketItems, t }),
    events: buildEventsDetailSectionMeta({ events, t }),
    /* Onada 6 · Les publicacions del Mur, per al naixement de cada poble. */
    pobles: buildPoblesDetailSectionMeta({ towns, t, publicacions: { feedPosts, marketItems, events } }),
    multimedia: buildMultimediaDetailSectionMeta({ mediaItems, t, rol }),
    notes: buildNotesDetailSectionMeta({ notes, t })
  };
}
