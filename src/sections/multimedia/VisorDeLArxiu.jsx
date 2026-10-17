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
 */
import { useMemo } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { VisorImatges } from '../../components/PedraSeca/index.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { esFotoDePersona } from './origenImatges.js';
import { filesDelPanell } from './panellDeLaFoto.js';
import { useMetadadesFoto } from './useMetadadesFoto.js';

const CAP = Object.freeze([]);

export function VisorDeLArxiu({ llista = CAP, index = -1, cens = null, onTanca, onCanvi }) {
  const { t } = useUIActions();
  const { towns = CAP } = useCoreContent();
  const item = index >= 0 && index < llista.length ? llista[index] : null;
  const persona = item ? esFotoDePersona(item, cens) : false;
  const { estat, exif } = useMetadadesFoto(item?.src || null, { persona });

  const imatges = useMemo(() => llista.map((mitja) => ({
    src: typeof mitja?.src === 'string' && mitja.src ? resolRecursPropi(mitja.src) : '',
    alt: mitja?.title || mitja?.tag || '',
    titol: mitja?.title || ''
  })), [llista]);

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
  const metadades = filesDelPanell(item, { exif, estatExif: estat, persona, cens, nomDelPoble, t })
    .map((fila) => (fila.ruta ? { ...fila, valor: <Link to={fila.ruta}>{fila.valor}</Link> } : fila));

  return (
    <VisorImatges obert={Boolean(item)} imatges={imatges} index={item ? index : 0} onCanvi={onCanvi} onTanca={onTanca}
      titol={t('section.multimedia.visor.titol', 'Visor d’imatges')} etiquetes={etiquetes} metadades={metadades} />
  );
}
