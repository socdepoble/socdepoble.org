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
 */
import { useMemo, useState } from 'react';
import { Link, useLocation } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { VisorImatges } from '../../components/PedraSeca/organismes/VisorImatges.jsx';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { esFotoDePersona } from './origenImatges.js';
import { filesDelPanell, pobleDe } from './panellDeLaFoto.js';
import { useMetadadesFoto } from './useMetadadesFoto.js';

const CAP = Object.freeze([]);

const nomNet = (valor) => (typeof valor === 'string' ? valor.trim().toLowerCase() : '');

export function VisorDeLArxiu({ llista = CAP, index = -1, cens = null, onTanca, onCanvi }) {
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
    src: typeof mitja?.srcDelPort === 'string' && mitja.srcDelPort ? mitja.srcDelPort
      : typeof mitja?.src === 'string' && mitja.src ? resolRecursPropi(mitja.src) : '',
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

  const nomDelPoble = (slug) => towns.find((town) => String(town?.id) === slug)?.title || null;
  const metadades = filesDelPanell(item, {
    exif, estatExif: estat, mides: midesObert?.valor || null, estatMides, persona, cens, nomDelPoble, t
  }).map((fila) => (fila.ruta && fila.ruta !== pathname ? { ...fila, valor: <Link to={fila.ruta}>{fila.valor}</Link> } : fila));

  return (
    <VisorImatges obert={Boolean(item)} imatges={imatges} index={item ? index : 0} onCanvi={onCanvi} onTanca={onTanca}
      titol={t('section.multimedia.visor.titol', 'Visor d’imatges')} etiquetes={etiquetes} metadades={metadades}
      onCarrega={enCarregar} />
  );
}
