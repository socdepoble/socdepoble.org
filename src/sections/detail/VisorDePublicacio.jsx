/**
 * VisorDePublicacio.jsx — les fotos d'una publicació del Mur (una publicació,
 * un producte o un acte), al visor de l'Arxiu visual sense eixir de la pàgina.
 *
 * Gauntlet 261017 (C04 de Codex: «La fotografia de /mercat/mac-mini-m4 no obri
 * cap modal en clicar-la […] reutilitzar el visor existent i el mateix model
 * de foto en publicacions. El desencadenant ha de ser botó amb nom
 * accessible; focus de retorn, Esc, navegació i metadades verificades») · La
 * portada de la Pàgina Universal (topBarData.heroComponent de PageFrame), que
 * munta portadaDElement (detailSectionMeta.jsx):
 *   · Amb més d'una foto, el carrusel de sempre (CarruselImatges, que
 *     portadaDElement passa com a funció: children(obri)) amb onObri, i cada
 *     foto és un botó.
 *   · Amb una, la imatge de sempre dins d'un botó (.sdp-visor__obridor,
 *     components.css): el mateix <img> que pinta ImatgeDePortada de PageFrame.
 *     Revisió del Gauntlet 261017 (M2) · També la d'una pujada (sdp-media://,
 *     la forma de tota foto pujada, mitjaOpac.js), que abans es quedava sense
 *     visor: es resol pel port com a ImatgeDePortada (useResolvedAssetState,
 *     la forma canònica i la URL resolta que passa isSafeAsset). Mentre es
 *     resol, o si no es pot (sense la capacitat 'mitjans'), res, com
 *     ImatgeDePortada: cap botó buit ni cap petició. Al visor, el model porta
 *     la referència (src) i la URL del port (srcDelPort): la foto es pinta
 *     amb la del port i useMetadadesFoto no en llig l'EXIF (no llig mai una
 *     sdp-media://): cap petició més a una mitja privada.
 *   · El visor és VisorDeLArxiu, el de /multimedia: VisorImatges (Esc, fletxes,
 *     zoom i el focus que torna al botó premut) i el panell de
 *     panellDeLaFoto.js amb les dades de la publicació (títol, autoria, drets i
 *     poble declarats, «Publicat a» sense enllaç a la mateixa pàgina), la
 *     resolució de la foto pintada i l'EXIF de les fotos pròpies
 *     (useMetadadesFoto). El cens de public/assets (useCensImatges: l'origen i
 *     les fotos de persones, sense GPS) es carrega en obrir-lo.
 *   · Es munta en obrir-lo per primera vegada, en un portal fora de
 *     .hero-image (la regla .hero-image img de layout.css estiraria la foto
 *     del visor a tota l'amplada): encastat, a la .sdp-root de la instància; a
 *     la SPA, al <body>, com l'Índex de PageFrame. Abans, cap node ni cap
 *     petició de més.
 *   · Sense ?foto= a l'URL: l'estat és d'esta pàgina, i Arrere ix de la
 *     publicació com abans.
 *   · Revisió del Gauntlet 261017 (R3, pes) · El visor arriba en diferit.
 *     detailSectionMeta.jsx importa este mòdul, i per ell elementDeSeccio,
 *     TextSection, /xat, Notes i cada pàgina de text: abans hi viatjaven
 *     VisorDeLArxiu, useMetadadesFoto (la lectura Range de l'EXIF), exif.js,
 *     VisorImatges i el cens (uns 11 KB gz), que només servixen després d'un
 *     clic. Ara ací només hi ha el disparador (el botó i la imatge de sempre,
 *     el mateix DOM); la meitat del visor la porta un import() en obrir-lo
 *     per primera vegada (lazyRoute + Suspense, sense res a la vista mentre
 *     arriba). El punter que entra al botó o el focus que hi arriba la
 *     precarreguen. Sense xarxa (el tros no es pot descarregar), el visor es
 *     dona per tancat: la pàgina continua i el focus es queda al disparador
 *     (BarreraDelVisor), mai l'error de la ruta. Revisió del Gauntlet 261017
 *     (R3, reintent) · El gest següent el torna a demanar (vegeu
 *     carregaElVisor, amb el límit del navegador).
 *   · T4 (pla 261024_1315, P1-06; auditoria Gemini 261024, G-02) · La foto de
 *     la portada és la candidata a LCP de la fitxa: porta fetchpriority="high"
 *     (mai loading="lazy"), com la portada d'una pàgina de text (PageFrame,
 *     heroFetchPriority).
 *
 * CosAmbVisor · T4 (pla 261024_1315, P1-06; auditoria Gemini 261024, G-01:
 * «les dues fotografies del cos del mateix article […] fer-hi clic no obri
 * cap visor») · Les fotos del cos d'un detall (el text enriquit de
 * renderRichText, els trossos de CosAmbTargetes i l'article de l'Aplec) obrin
 * el mateix visor, en diferit i amb el mateix tros que la portada:
 *   · Cap node nou: l'embolcall és el contenidor que el detall ja tenia
 *     (div.content-wrapper d'ItemDetailSection) o, al lector del MAS, un que
 *     no pinta cap caixa (.sdp-visor-cos, display: contents). El cos no
 *     canvia byte a byte (detailRichText.test.jsx): les marques s'escriuen
 *     després de pintar, al DOM, i un MutationObserver (només childList i els
 *     atributs que decidixen, mai els que escriu) les torna a posar quan React
 *     reescriu l'HTML; un 'load' en captura, quan una foto diu la seua mida.
 *   · Una foto del cos (esImatgeDelCos): dins de .detail-content, pròpia
 *     (esFontImatgePropia: cap petició nova a tercers, Decisió 3), amb src i
 *     mai opaca (sdp-media://), ni bloquejada, ni amagada (aria-hidden,
 *     role=presentation; correccions del 261024, R4-06: també dins d'un pare
 *     del contenidor amb aria-hidden="true", hidden o inert, que l'observador
 *     també mira), ni dins d'un enllaç, un botó, una targeta
 *     incrustada (.sdp-targetes) o la foto de la variant (.sdp-compra__foto),
 *     ni marcada data-sdp-sense-visor, ni una icona (menys de 48 px de costat,
 *     declarats o reals).
 *   · La marca (data-sdp-ampliable, tabindex 0, role=button,
 *     aria-haspopup=dialog i un aria-label que porta l'alt, perquè el nom del
 *     botó en substituïx l'alt): Intro l'obri en prémer i Espai en alçar-se
 *     (com un botó: obrir-lo en prémer deixaria que l'alçada de l'Espai
 *     clicara «Tancar», que ja té el focus), sense tecles modificadores.
 *   · La galeria són les fotos del cos, en el seu ordre, amb les dades de la
 *     publicació (fotosDeLaPublicacio); la portada continua sent la seua.
 * Dins de sections/: Pedra Seca (components/) no importa mai d'ací.
 */
import { Component, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveAsset } from '../../config/assetResolver.js';
import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { useResolvedAssetState } from '../../hooks/useResolvedAsset.js';
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';

const textNet = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null);

/** Les fotos d'una publicació amb el model de foto de l'Arxiu (mediaContent.js):
 *  { src, title, autor, copyright?, nomPoble?, article }. L'autoria és la
 *  declarada (null: no consta, mai inventada) i els drets, només si la
 *  publicació en declara. Cap id: el xat i Connectar són els de la pàgina. */
export function fotosDeLaPublicacio(fotos, { titol = '', autor = null, drets = null, poble = null, article = null } = {}) {
  if (!Array.isArray(fotos)) return [];
  const comuns = {
    title: textNet(titol) || '',
    autor: textNet(autor),
    ...(textNet(drets) ? { copyright: textNet(drets) } : {}),
    ...(textNet(poble) ? { nomPoble: textNet(poble) } : {}),
    ...(article && article.id != null ? { article } : {})
  };
  return fotos.filter((src) => typeof src === 'string' && src.trim() !== '').map((src) => ({ src, ...comuns }));
}

/* On es pinta el visor: encastat, a l'arrel de l'app (.sdp-root, la caixa que
   reserva l'amfitrió); a la SPA, al <body> (PageFrame, destiDeLIndex). */
function capaDelVisor(node) {
  if (node?.getRootNode?.().host?.localName === 'soc-de-poble') return node.closest('.sdp-root') || node.getRootNode();
  return node?.ownerDocument?.body || (typeof document === 'undefined' ? null : document.body);
}

/* Revisió del Gauntlet 261017 (R3) · La meitat del visor, en un sol import()
   per als dos mòduls: el de l'Arxiu visual i el cens. La promesa es guarda
   (la precàrrega i el clic en fan una) i, si falla, s'oblida: una precàrrega
   sense xarxa no condemna el primer clic, que torna a demanar el tros.
   Revisió del Gauntlet 261017 (R3, reintent) · Derogat «Si falla el del
   clic, falla com qualsevol lazyRoute (React el guarda rebutjat)». Un sol
   React.lazy per a tot el document guardava per sempre la promesa rebutjada:
   després d'un clic sense xarxa, cap altre clic no tornava a demanar el tros.
   Ara una fallada oblida la promesa I el component diferit (visorDiferit), i
   el gest següent en fa uns de nous: si el tros arriba, el visor s'obri.
   Límit del navegador, mesurat (Chromium 151): el mapa de mòduls del
   document també guarda la fallada d'un import() o d'un modulepreload, i un
   import() nou de la mateixa URL falla sense cap petició. Allà, el reintent
   torna a fallar en silenci (la barrera tanca com sempre, el focus al
   disparador) fins que es recarrega la pàgina: recarregar continua sent cosa
   de qui navega (lazyRoute.js, host.js). */
let promesaDelVisor = null;
let visorDiferit = null;
function carregaElVisor() {
  promesaDelVisor ??= Promise.all([import('../multimedia/VisorDeLArxiu.jsx'), import('../multimedia/useCensImatges.js')])
    .then(([{ VisorDeLArxiu }, { useCensImatges }]) => ({
      default: function VisorAmbCens(props) {
        const { cens } = useCensImatges();
        return <VisorDeLArxiu {...props} cens={cens} />;
      }
    }))
    .catch((error) => {
      promesaDelVisor = null;
      visorDiferit = null;
      throw error;
    });
  return promesaDelVisor;
}
/* El component diferit es fa en obrir-lo (cap import() abans d'un gest) i es
   conserva mentre no falle. */
const elVisorDiferit = () => (visorDiferit ??= lazyRoute(carregaElVisor));
const precarregaElVisor = () => { carregaElVisor().catch(() => {}); };

/* Sense xarxa, el tros del visor no arriba (LazyRouteError): no es pinta res i
   el visor es dona per tancat (onFalla), amb el focus al disparador, on ja
   era. Qualsevol altre error puja com sempre. */
class BarreraDelVisor extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (esErrorLazy(error)) this.props.onFalla?.();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!esErrorLazy(error)) throw error;
    return null;
  }
}

/* Revisió del Gauntlet 261017 (M2) · La regla d'ImatgeDePortada (PageFrame):
   una referència opaca, en la forma canònica que reconeix el port; la URL que
   torna, només si ja no és opaca i és segura. Sense referència, ''. */
const refDelPort = (src) => (esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '');
const urlDelPort = (url) => (!esMitjaOpac(url) && isSafeAsset(url) ? url : '');

export function VisorDePublicacio({ fotos, dades, etiquetaObri, alt = '', children }) {
  const [visor, setVisor] = useState({ capa: null, obert: false, index: 0 });
  /* IDEA-20 (revisió adversarial 261024, lent multiformat) · La portada sola
     d'una publicació va per la ranura heroComponent de PageFrame, on no hi
     arriba hero-image--vertical: la mateixa detecció (naturalWidth i
     naturalHeight en carregar, lligada al src) marca el botó d'una portada
     vertical, i components.css la limita en alçada. Quadrades i apaïsades,
     com abans. */
  const [carregada, setCarregada] = useState(null);
  const delModel = useMemo(() => fotosDeLaPublicacio(fotos, dades), [fotos, dades]);
  /* La portada sola, si és una pujada: el port la resol (el carrusel no en
     demana res: ref buida, cap petició). */
  const ref = typeof children === 'function' ? '' : refDelPort(delModel[0]?.src);
  const { url } = useResolvedAssetState(ref);
  const delPort = ref ? urlDelPort(url) : '';
  const llista = useMemo(() => (delPort ? [{ ...delModel[0], srcDelPort: delPort }, ...delModel.slice(1)] : delModel), [delModel, delPort]);

  /* Safari no enfoca un botó en clicar-lo: s'enfoca ací, abans d'obrir, i el
     Dialeg hi torna el focus en tancar. */
  const obri = useCallback((index, boto) => {
    boto?.focus?.({ preventScroll: true });
    setVisor((previ) => ({ capa: previ.capa || capaDelVisor(boto), obert: true, index }));
  }, []);
  const tanca = useCallback(() => setVisor((previ) => ({ ...previ, obert: false })), []);
  const canvia = useCallback((index) => setVisor((previ) => ({ ...previ, index })), []);
  /* El tros no ha arribat: fora el portal (i la barrera), com abans d'obrir. */
  const falla = useCallback(() => setVisor((previ) => ({ ...previ, capa: null, obert: false })), []);

  /* Una pujada que encara no ha resolt el port (o que no pot): res, com
     ImatgeDePortada. */
  const font = ref ? delPort : resolveAsset(llista[0]?.src || '');
  /* Revisió del Gauntlet 261017 (R3, reintent) · El d'esta obertura: un de
     nou després d'una fallada. */
  const VisorAmbCens = visor.capa ? elVisorDiferit() : null;
  /* Correccions del 261024 (R4-03) · El segon clic d'un doble clic (detail 2)
     no torna a obrir, com a CosAmbVisor; Intro i Espai (detail 0), sempre. */
  const vertical = Boolean(carregada && carregada.src === font && carregada.vertical);
  const onCarrega = (ev) => {
    const { naturalWidth: amplada, naturalHeight: alcada } = ev.currentTarget;
    if (amplada > 0 && alcada > 0) setCarregada({ src: font, vertical: alcada > amplada });
  };
  const disparador = typeof children === 'function' ? children(obri) : ref && !font ? null : (
    <button type="button" className={vertical ? 'sdp-visor__obridor sdp-visor__obridor--vertical' : 'sdp-visor__obridor'}
      aria-haspopup="dialog" aria-label={etiquetaObri}
      onPointerEnter={precarregaElVisor} onFocus={precarregaElVisor}
      onClick={(event) => { if (event.detail <= 1) obri(0, event.currentTarget); }}>
      <img alt={alt} src={font} fetchpriority="high" onLoad={onCarrega} />
    </button>
  );

  return (
    <>
      {disparador}
      {visor.capa ? createPortal(
        <BarreraDelVisor onFalla={falla}>
          <Suspense fallback={null}>
            <VisorAmbCens llista={llista} index={visor.obert ? visor.index : -1} onTanca={tanca} onCanvi={canvia} />
          </Suspense>
        </BarreraDelVisor>,
        visor.capa
      ) : null}
    </>
  );
}

/* ── CosAmbVisor: les fotos del cos (vegeu la capçalera) ─────────────────── */

/** La marca que porta una foto del cos que obri el visor (components.css, bloc VISOR D'IMATGES). */
export const MARCA_AMPLIABLE = 'data-sdp-ampliable';
const FORA_DEL_VISOR = '.sdp-targetes, a, button, .sdp-compra__foto, [data-sdp-sense-visor]';
/* Correccions del 261024 (R4-06) · Amagada, ella o un pare dins del
   contenidor: un botó enfocable en un subarbre que el lector no veu
   (axe aria-hidden-focus). Només dins del contenidor: modalLocal.js posa
   inert i aria-hidden a l'App sencera mentre un modal és obert (el visor
   encastat mateix) i AppGridShell, a una columna plegada; comptar-los
   desmarcaria les fotos, i ningú no les tornaria a marcar en llevar-los. */
const AMAGADA = '[aria-hidden="true"], [hidden], [inert]';
/* Una icona o un emoji en imatge: menys d'açò de costat. */
const COSTAT_D_ICONA = 48;
const SELECTOR_AMPLIABLE = `img[${MARCA_AMPLIABLE}]`;
/* Els atributs que decidixen si una foto és del visor: l'observador els mira
   (mai els que escriu la marca, o es tornaria a cridar sense fi). */
const ATRIBUTS_QUE_DECIDIXEN = ['src', 'alt', 'width', 'height', 'aria-hidden', 'hidden', 'inert', 'data-sdp-bloquejada', 'data-sdp-sense-visor'];

/* El costat que es veu: el declarat (width i height) o, sense, el real. */
function midaDe(img) {
  const amplada = Number.parseInt(img.getAttribute('width'), 10);
  const alcada = Number.parseInt(img.getAttribute('height'), 10);
  if (amplada > 0 && alcada > 0) return [amplada, alcada];
  return [img.naturalWidth || 0, img.naturalHeight || 0];
}

/** Si `img` és una foto del cos que obri el visor (dins de `contenidor`). */
export function esImatgeDelCos(img, contenidor) {
  if (!img || img.tagName !== 'IMG' || typeof contenidor?.contains !== 'function' || !contenidor.contains(img)) return false;
  if (!img.closest('.detail-content') || img.closest(FORA_DEL_VISOR)) return false;
  if (img.hasAttribute('data-sdp-bloquejada')) return false;
  const amagada = img.closest(AMAGADA);
  if (amagada && contenidor.contains(amagada)) return false;
  if (/^(?:presentation|none)$/i.test((img.getAttribute('role') || '').trim())) return false;
  const src = (img.getAttribute('src') || '').trim();
  if (!src || esMitjaOpac(src) || !esFontImatgePropia(src)) return false;
  const [amplada, alcada] = midaDe(img);
  return !(amplada > 0 && alcada > 0 && amplada < COSTAT_D_ICONA && alcada < COSTAT_D_ICONA);
}

/** Les fotos del cos que obrin el visor, en l'ordre del document. */
export function imatgesDelCos(contenidor) {
  return contenidor?.querySelectorAll ? [...contenidor.querySelectorAll('.detail-content img')].filter((img) => esImatgeDelCos(img, contenidor)) : [];
}

/* Les fotos que ha marcat CosAmbVisor (un data-sdp-ampliable que ja venia
   a l'HTML no compta: el sanejador deixa els data-*) i l'aria-label que ja
   portaven (també els aria-*), que torna quan perden la marca. */
const marcades = new WeakSet();
const etiquetesDAutor = new WeakMap();

function marcaLa(img, etiqueta) {
  if (!marcades.has(img)) {
    marcades.add(img);
    if (img.hasAttribute('aria-label')) etiquetesDAutor.set(img, img.getAttribute('aria-label'));
    img.setAttribute(MARCA_AMPLIABLE, '');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
  }
  if (img.getAttribute('aria-label') !== etiqueta) img.setAttribute('aria-label', etiqueta);
}

function desmarcaLa(img) {
  const propia = marcades.has(img);
  marcades.delete(img);
  img.removeAttribute(MARCA_AMPLIABLE);
  if (!propia) return;
  for (const nom of ['tabindex', 'role', 'aria-haspopup', 'aria-label']) img.removeAttribute(nom);
  if (etiquetesDAutor.has(img)) {
    img.setAttribute('aria-label', etiquetesDAutor.get(img));
    etiquetesDAutor.delete(img);
  }
}

/* Idempotent: marca les fotos del cos i desmarca les que ja no ho són. El nom
   accessible porta l'alt; sense alt, l'etiqueta de la portada. */
function marcaImatgesDelCos(contenidor, { etiquetaObri, etiquetaObriFoto }) {
  for (const img of contenidor.querySelectorAll('img')) {
    if (esImatgeDelCos(img, contenidor)) {
      const alt = (img.getAttribute('alt') || '').trim();
      marcaLa(img, alt && etiquetaObriFoto ? etiquetaObriFoto.replace('{alt}', () => alt) : etiquetaObri);
    } else if (marcades.has(img) || img.hasAttribute(MARCA_AMPLIABLE)) {
      desmarcaLa(img);
    }
  }
}

const ampliableDe = (node) => (typeof node?.closest === 'function' ? node.closest(SELECTOR_AMPLIABLE) : null);
/* La publicació del cos: el visor que s'havia obert en una altra (Arrere amb
   el visor obert) es dona per tancat, com el de la portada (key={clau}). */
const clauDelCos = (dades) => `${dades?.article?.sectionId ?? ''}|${dades?.article?.id ?? ''}`;
const senseModificadores = (event) => !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);

/**
 * El cos d'un detall amb les seues fotos al visor. `dades` (les de la
 * publicació, fotosDeLaPublicacio) l'activa; sense, només pinta el
 * contenidor amb `className`, com abans. `ometFiles` passa al visor.
 */
export function CosAmbVisor({ className, dades = null, etiquetaObri = '', etiquetaObriFoto = '', ometFiles, children }) {
  const ref = useRef(null);
  const espai = useRef(null);
  const [visor, setVisor] = useState({ capa: null, obert: false, index: 0, llista: [], clau: '' });
  const actiu = Boolean(dades);
  /* Un ajust durant el pintat (com el «darrer» d'ItemDetailSection): una
     altra publicació, o cap, tanca el visor de l'anterior, també si s'hi torna. */
  const obert = visor.obert && actiu && visor.clau === clauDelCos(dades);
  if (visor.obert && !obert) setVisor((previ) => ({ ...previ, obert: false }));

  useLayoutEffect(() => {
    const node = ref.current;
    if (!actiu || !node) return undefined;
    const etiquetes = { etiquetaObri, etiquetaObriFoto };
    const marca = () => marcaImatgesDelCos(node, etiquetes);
    marca();
    const observador = typeof MutationObserver === 'function' ? new MutationObserver(marca) : null;
    observador?.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ATRIBUTS_QUE_DECIDIXEN });
    node.addEventListener('load', marca, true);
    return () => {
      observador?.disconnect();
      node.removeEventListener('load', marca, true);
      for (const img of node.querySelectorAll(SELECTOR_AMPLIABLE)) desmarcaLa(img);
    };
  }, [actiu, etiquetaObri, etiquetaObriFoto]);

  /* Com obri de VisorDePublicacio: el focus a la foto abans d'obrir, i el
     Dialeg l'hi torna en tancar. Una foto que ja no és del visor, res. */
  const obriDe = (img) => {
    const imatges = imatgesDelCos(ref.current);
    const index = imatges.indexOf(img);
    if (index < 0) return false;
    img.focus?.({ preventScroll: true });
    const llista = fotosDeLaPublicacio(imatges.map((foto) => foto.getAttribute('src')), dades);
    const clau = clauDelCos(dades);
    setVisor((previ) => ({ capa: previ.capa || capaDelVisor(img), obert: true, index, llista, clau }));
    return true;
  };

  /* El segon clic d'un doble clic no torna a obrir (el primer ja ho ha fet, o
     ha tancat el visor des del fons). */
  const enClic = (event) => {
    if (!actiu || event.defaultPrevented || event.button !== 0 || event.detail > 1) return;
    const img = ampliableDe(event.target);
    if (img && obriDe(img)) event.preventDefault();
  };
  const enPremerTecla = (event) => {
    espai.current = null;
    if (!actiu || event.defaultPrevented || !senseModificadores(event) || !event.target?.matches?.(SELECTOR_AMPLIABLE)) return;
    if (event.key === 'Enter' && !event.repeat) {
      if (obriDe(event.target)) event.preventDefault();
    } else if (event.key === ' ') {
      event.preventDefault();
      espai.current = event.target;
    }
  };
  const enAlcarTecla = (event) => {
    const premuda = espai.current;
    espai.current = null;
    if (!actiu || event.key !== ' ' || !premuda || event.target !== premuda) return;
    event.preventDefault();
    obriDe(premuda);
  };
  const enApropar = (event) => {
    if (actiu && ampliableDe(event.target)) precarregaElVisor();
  };

  const tanca = useCallback(() => setVisor((previ) => ({ ...previ, obert: false })), []);
  const canvia = useCallback((index) => setVisor((previ) => ({ ...previ, index })), []);
  const falla = useCallback(() => setVisor((previ) => ({ ...previ, capa: null, obert: false })), []);
  const VisorAmbCens = visor.capa ? elVisorDiferit() : null;

  return (
    <>
      <div ref={ref} className={className} onClick={enClic} onKeyDown={enPremerTecla} onKeyUp={enAlcarTecla}
        onPointerOver={enApropar} onFocus={enApropar}>
        {children}
      </div>
      {visor.capa ? createPortal(
        <BarreraDelVisor onFalla={falla}>
          <Suspense fallback={null}>
            <VisorAmbCens llista={visor.llista} index={obert ? visor.index : -1} onTanca={tanca} onCanvi={canvia}
              ometFiles={ometFiles} />
          </Suspense>
        </BarreraDelVisor>,
        visor.capa
      ) : null}
    </>
  );
}
