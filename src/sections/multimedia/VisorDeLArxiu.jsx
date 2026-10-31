/**
 * VisorDeLArxiu.jsx — el visor de l'Arxiu visual (/multimedia): l'organisme
 * VisorImatges de Pedra Seca amb les dades de cada foto.
 *
 * Onada 0.3 (Gauntlet 261016, M04-M06) · La peça de Pedra Seca no llig cap
 * context: ací es traduïxen els textos (i18n, cinc llengües), es resolen els
 * src (resolRecursPropi: dins d'un amfitrió, el paquet), es llig l'EXIF de la
 * foto oberta (useMetadadesFoto, només d'imatges pròpies i sense el GPS d'una
 * persona) i es fan les files del panell (panellDeLaFoto.js), amb els
 * enllaços interns al poble i a l'article on s'ha publicat la foto. Cap salt
 * a una pàgina externa: els enllaços són de l'app (Link).
 * L'estat (quina foto, obert o tancat) és de MultimediaSection, a ?foto=<id>.
 *
 * Gauntlet 261017 (C04 i C05 de Codex) · També el munten les publicacions del
 * Mur (detail/VisorDePublicacio.jsx), amb el mateix model de foto.
 *   · Resolució · les mides reals de la foto pintada (onCarrega de
 *     VisorImatges), guardades amb el seu src: una mida que arriba tard d'una
 *     altra foto no es pinta mai a la que es veu.
 *   · Cap fila enllaça a la pàgina on ja s'és («Publicat a» dins de la
 *     mateixa publicació): és text.
 *   · El poble d'una publicació ve pel nom (nomPoble): si és al cens de
 *     pobles, porta l'enllaç a la seua pàgina, com el de l'Arxiu.
 *   · VisorImatges, pel camí directe de l'organisme: les publicacions no
 *     arrosseguen el barril de Pedra Seca (Esmena 3 del pla 261007_1645).
 *
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · També el munta
 * «Multimèdia» del Perfil (profile/DetallMultimedia.jsx), amb tres props
 * OPCIONALS; sense elles, el visor de sempre, fila per fila:
 *   · filesInicials · files { clau, etiqueta, valor } de més, DAVANT de les del
 *     panell (les accions del Perfil: «Posa com a avatar», «Posa com a
 *     capçalera», «Elimina»);
 *   · ometFiles · les claus de les files del panell que no hi van (el poble i
 *     «Publicat a» d'una foto que no és de cap article ni de cap poble);
 *   · infoInicial · el panell, desplegat en obrir-lo (VisorImatges).
 * I, per a qualsevol qui el munta (auditoria Codex 2030, §4.1: «no imprimir
 * mai l'esquema opac en un img») · una referència opaca (sdp-media://) sense
 * la URL del port (srcDelPort) no es pinta mai crua: la foto es queda sense
 * src i el visor ho diu, fins que el port la resol. Correcció F2 de la
 * revisió · Tampoc un srcDelPort que encara és opac (el port que no la sap
 * resoldre la torna tal qual, storage.js): la garantia és per a tots.
 *
 * Ordre del Mestre (30-10-2026, B3) · «Enllaç de la imatge»: la URL completa
 * del fitxer i, davall, el botó d'un sol clic «Copiar l’enllaç de la imatge»
 * (navigator.clipboard.writeText). La confirmació, «Enllaç copiat», en una
 * regió role="status" que hi és sempre (buida fins al clic), al costat del
 * botó; si el navegador no deixa copiar (cap porta-retalls fora d'un context
 * segur, o el permís negat), el missatge ho diu i demana copiar-la a mà: la
 * URL és text seleccionable just damunt. Cap execCommand. La URL ix
 * d'enllacPublicDe (panellDeLaFoto.js) amb l'origen de la pàgina
 * (origenDeLaPagina: a l'app nativa, l'origen públic) i resolRecursPropi
 * (dins d'un amfitrió, el paquet; una foto que ja arriba resolta porta el
 * mateix enllaç que la crua), i no és cap enllaç navegable (cap salt fora
 * de l'app). Privacitat: d'un arxiu local, d'una referència opaca
 * del port (ni la seua URL signada) o d'un altre origen, cap URL ni cap botó;
 * la fila diu «No té cap enllaç públic d’este lloc». Canviar de foto buida
 * l'avís.
 * Ordre del Mestre (30-10-2026, prompt 2208, T4.2; QA-T3-UX-01) · Eixe text és
 * NOMÉS de l'Arxiu: la prop OPCIONAL `avisSenseEnllac`, que hi posa
 * MultimediaSection. Sense (les publicacions del Mur i els detalls, el Perfil
 * i qualsevol altre qui el munta), una foto sense enllaç públic no porta la
 * fila; amb un enllaç públic, la fila i el botó, com sempre.
 * Gauntlet 261030 (f4b) · B3-FOCUS-FLETXA · El bloc de l'enllaç no porta
 * `key`: el mateix botó passa de foto en foto i, amb el focus a «Copiar
 * l’enllaç», les fletxes continuen passant fotos (on abans el botó es
 * remuntava i el focus queia al <body>). L'avís va amb la URL que s'ha
 * copiat: canviar de foto el buida, i el d'una còpia que acaba tard d'una
 * altra foto no es pinta mai. B3-RESERVA-SENSE-TECLAT · Si no es pot copiar,
 * la URL queda seleccionada i el focus, al botó: Ctrl+C (⌘C) la copia des
 * del teclat, sense haver d'arribar a un text que no rep el focus. Canviar
 * de foto se'n porta la selecció, com l'avís.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { Link, useLocation } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Fila, Pila } from '../../components/PedraSeca/composicio/index.jsx';
import { VisorImatges } from '../../components/PedraSeca/organismes/VisorImatges.jsx';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { origenDeLaPagina } from '../../config/origenPublic.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { esFotoDePersona } from './origenImatges.js';
import { filesDelPanell, pobleDe } from './panellDeLaFoto.js';
import { useMetadadesFoto } from './useMetadadesFoto.js';

const CAP = Object.freeze([]);

const nomNet = (valor) => (typeof valor === 'string' ? valor.trim().toLowerCase() : '');

/* L'origen de la pàgina, o null si no se sap (cap finestra): sense origen, cap enllaç. */
function origenSegur() {
  try {
    return origenDeLaPagina();
  } catch {
    return null;
  }
}

/* B3-RESERVA-SENSE-TECLAT · Selecciona el text del node (la URL), sense moure
   el focus. Si el navegador no ho deixa, el missatge ho diu igual. */
function seleccionaElText(node) {
  try {
    const seleccio = node?.ownerDocument?.defaultView?.getSelection?.();
    if (!seleccio) return;
    const rang = node.ownerDocument.createRange();
    rang.selectNodeContents(node);
    seleccio.removeAllRanges();
    seleccio.addRange(rang);
  } catch { /* sense selecció */ }
}

/* La selecció que encara és dins del node, fora (canviar de foto o tancar el visor). */
function desseleccionaElText(node) {
  try {
    const seleccio = node?.ownerDocument?.defaultView?.getSelection?.();
    if (seleccio?.rangeCount && node.contains(seleccio.anchorNode)) seleccio.removeAllRanges();
  } catch { /* res a desfer */ }
}

const AVIS_BUIT = Object.freeze({ text: '', fallada: false });

/* B3 · La URL (text seleccionable, sense traduir), el botó i l'avís. Sense
   `key` (B3-FOCUS-FLETXA): l'avís porta la URL que s'ha copiat i, si no és
   la de la foto que es veu, es buida en el mateix pintat (l'estat d'un pintat
   anterior, el patró de React): en canviar de foto i quan una còpia d'una
   altra foto acaba tard. */
function EnllacCopiable({ url, textos }) {
  const [avis, setAvis] = useState(() => ({ url, ...AVIS_BUIT }));
  const refUrl = useRef(null);
  if (avis.url !== url) setAvis({ url, ...AVIS_BUIT });
  useEffect(() => {
    if (avis.fallada) seleccionaElText(refUrl.current);
  }, [avis]);
  /* Com l'avís, la selecció de la reserva és de la foto que es veia: se'n va en canviar-ne. */
  useEffect(() => {
    const node = refUrl.current;
    return () => desseleccionaElText(node);
  }, [url]);
  const copia = async () => {
    const copiada = url;
    setAvis({ url: copiada, ...AVIS_BUIT });
    let copiat = false;
    try {
      const porta = typeof navigator === 'undefined' ? null : navigator.clipboard;
      if (typeof porta?.writeText !== 'function') throw new Error('sense porta-retalls');
      await porta.writeText(copiada);
      copiat = true;
    } catch { /* ho diu l'avís */ }
    /* Si la foto ja és una altra, el pintat següent el buida (avis.url !== url). */
    setAvis({ url: copiada, text: copiat ? textos.copiat : textos.noCopiat, fallada: !copiat });
  };
  return (
    <Pila gap={2}>
      <span ref={refUrl} translate="no">{url}</span>
      <Fila gap={2}>
        <Boto varietat="secundari" icona={Copy} onClick={copia}>{textos.copia}</Boto>
        <span role="status">{avis.url === url ? avis.text : ''}</span>
      </Fila>
    </Pila>
  );
}

export function VisorDeLArxiu({
  llista = CAP, index = -1, cens = null, onTanca, onCanvi, filesInicials = CAP, ometFiles = CAP, infoInicial = false,
  avisSenseEnllac = false
}) {
  const { t } = useUIActions();
  const { towns = CAP } = useCoreContent();
  const { pathname } = useLocation();
  const [mides, setMides] = useState(null);
  const deLaLlista = index >= 0 && index < llista.length ? llista[index] : null;
  /* El poble que una publicació diu pel nom: el seu slug, si és al cens. */
  const slugDelNom = deLaLlista && !pobleDe(deLaLlista) && nomNet(deLaLlista.nomPoble)
    ? towns.find((town) => nomNet(town?.title) === nomNet(deLaLlista.nomPoble))?.id
    : null;
  const item = slugDelNom != null ? { ...deLaLlista, poble: String(slugDelNom) } : deLaLlista;
  const persona = item ? esFotoDePersona(item, cens) : false;
  const { estat, exif } = useMetadadesFoto(item?.src || null, { persona });

  /* Revisió del Gauntlet 261017 (M2) · Una foto pujada d'una publicació
     (sdp-media://) porta la URL que n'ha tornat el port (srcDelPort,
     detail/VisorDePublicacio.jsx): es pinta amb eixa. L'EXIF es demana pel
     src, la referència, i useMetadadesFoto no en llig mai cap: cap petició més
     a una mitja privada. */
  const imatges = useMemo(() => llista.map((mitja) => ({
    src: typeof mitja?.srcDelPort === 'string' && mitja.srcDelPort && !esMitjaOpac(mitja.srcDelPort) ? mitja.srcDelPort
      : typeof mitja?.src === 'string' && mitja.src && !esMitjaOpac(mitja.src) ? resolRecursPropi(mitja.src) : '',
    alt: mitja?.title || mitja?.tag || '',
    titol: mitja?.title || ''
  })), [llista]);

  /* Les mides de la foto que es veu, només si són del seu src; mentre no
     arriben, «Llegint…». */
  const srcObert = item ? imatges[index]?.src || '' : '';
  const midesObert = srcObert && mides?.src === srcObert ? mides : null;
  const estatMides = !srcObert ? 'sense' : !midesObert ? 'llegint' : midesObert.valor ? 'llest' : 'sense';
  const enCarregar = (i, valor) => setMides({ src: imatges[i]?.src || '', valor });

  const etiquetes = useMemo(() => ({
    tanca: t('section.multimedia.visor.tanca', 'Tancar el visor'),
    anterior: t('section.multimedia.visor.anterior', 'Imatge anterior'),
    seguent: t('section.multimedia.visor.seguent', 'Imatge següent'),
    ampliar: t('section.multimedia.visor.ampliar', 'Ampliar'),
    reduir: t('section.multimedia.visor.reduir', 'Reduir'),
    info: t('section.multimedia.visor.info', 'Informació de la imatge'),
    posicio: t('section.multimedia.visor.posicio', 'Imatge {n} de {total}'),
    error: t('section.multimedia.visor.error', 'No s’ha pogut carregar la imatge.'),
    senseImatge: t('section.multimedia.visor.senseImatge', 'Esta entrada no porta cap imatge.')
  }), [t]);
  const textosEnllac = useMemo(() => ({
    copia: t('section.multimedia.visor.copiaEnllac', 'Copiar l’enllaç de la imatge'),
    copiat: t('section.multimedia.visor.enllacCopiat', 'Enllaç copiat'),
    noCopiat: t('section.multimedia.visor.enllacNoCopiat', 'No s’ha pogut copiar: selecciona l’enllaç i copia’l a mà.')
  }), [t]);

  const nomDelPoble = (slug) => towns.find((town) => String(town?.id) === slug)?.title || null;
  const omeses = Array.isArray(ometFiles) ? ometFiles : CAP;
  const pintaFila = (fila) => {
    if (fila.enllac) return { ...fila, valor: <EnllacCopiable url={fila.enllac} textos={textosEnllac} /> };
    return fila.ruta && fila.ruta !== pathname ? { ...fila, valor: <Link to={fila.ruta}>{fila.valor}</Link> } : fila;
  };
  const metadades = [
    ...(item && Array.isArray(filesInicials) ? filesInicials : CAP),
    ...filesDelPanell(item, {
      exif, estatExif: estat, mides: midesObert?.valor || null, estatMides, persona, cens, nomDelPoble, t,
      origenPagina: item ? origenSegur() : null, resol: resolRecursPropi, avisSenseEnllac: avisSenseEnllac === true
    }).filter((fila) => !omeses.includes(fila.clau)).map(pintaFila)
  ];

  return (
    <VisorImatges obert={Boolean(item)} imatges={imatges} index={item ? index : 0} onCanvi={onCanvi} onTanca={onTanca}
      titol={t('section.multimedia.visor.titol', 'Visor d’imatges')} etiquetes={etiquetes} metadades={metadades}
      infoInicial={infoInicial} onCarrega={enCarregar} />
  );
}
