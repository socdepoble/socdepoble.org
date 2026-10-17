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
 * Dins de sections/: Pedra Seca (components/) no importa mai d'ací.
 */
import { Component, Suspense, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveAsset } from '../../config/assetResolver.js';
import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { useResolvedAssetState } from '../../hooks/useResolvedAsset.js';
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';

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
  const disparador = typeof children === 'function' ? children(obri) : ref && !font ? null : (
    <button type="button" className="sdp-visor__obridor" aria-haspopup="dialog" aria-label={etiquetaObri}
      onPointerEnter={precarregaElVisor} onFocus={precarregaElVisor} onClick={(event) => obri(0, event.currentTarget)}>
      <img alt={alt} src={font} />
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
