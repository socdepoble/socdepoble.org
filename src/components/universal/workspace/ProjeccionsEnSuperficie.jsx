import { useMemo } from 'react';
import { UniversalCard } from '../../PedraSeca/index.js';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useProjeccionsCataleg } from '../../../hooks/useProjeccionsCataleg.js';
import { useTextCanonicCataleg } from '../../../hooks/useTextCanonicCataleg.js';
import { objecteDeProjeccioCataleg } from '../../../data/fitxesCanoniquesCataleg.js';
import { perDestiCataleg, projeccioCatalegDe, rutaDeFitxaCataleg } from '../../../data/projeccionsCataleg.js';
import { useUIActionsOpcional } from '../../../app/contexts/UIContext.jsx';
import { useModeracio } from '../../PedraSeca/hooks/moderacioDePoble.js';
import { filtraElementsBloquejats } from '../../../config/moderacio.js';
import { textosCatalegWorkspace } from './textosCatalegWorkspace.js';

const TEXTOS = {
  ca: ['Referències publicades', 'Pendent de sincronitzar', 'No s’han pogut carregar les referències publicades. Torna-ho a provar més tard.'],
  es: ['Referencias publicadas', 'Pendiente de sincronizar', 'No se han podido cargar las referencias publicadas. Inténtalo más tarde.'],
  en: ['Published references', 'Waiting to synchronize', 'Published references could not be loaded. Try again later.'],
  eu: ['Argitaratutako erreferentziak', 'Sinkronizatzeko zain', 'Ezin izan dira argitaratutako erreferentziak kargatu. Saiatu geroago.'],
  gl: ['Referencias publicadas', 'Pendente de sincronizar', 'Non se puideron cargar as referencias publicadas. Téntao máis tarde.']
};

/** Actual destination collection, sharing the persisted reference reader.
 * PRODUCCIO-01 (R15b) · Només llig: no agafa el bloqueig d'escriptura.
 * PRIVADESA-01 (R15b) · Com el Mur moderat (MurContext): sense el que has
 * bloquejat, amb el text canònic de l'Herbari, el Banc de llavors i Què dinem?
 * i amb la via de denúncia i bloqueig a cada referència d'una altra persona. */
export default function ProjeccionsEnSuperficie({ desti }) {
  const publicacio = useProjeccionsCataleg({ escriptura: false });
  const ui = useUIActionsOpcional(), t = TEXTOS[ui?.language] || TEXTOS.ca;
  const { autoriaReferencia } = textosCatalegWorkspace(ui?.language);
  const esBloquejat = useModeracio()?.esElementBloquejat ?? null;
  const navega = useNavigate();
  const files = useMemo(() => filtraElementsBloquejats(perDestiCataleg(publicacio.projeccions, desti, { ownerId: publicacio.ownerId }), esBloquejat),
    [publicacio.projeccions, publicacio.ownerId, desti, esBloquejat]);
  const rows = useTextCanonicCataleg(files, ui?.language);
  const lecturaFallida = publicacio.error && publicacio.error.desatLocal !== true;
  if (!rows.length && !lecturaFallida) return null;
  return <section aria-label={t[0]}><h2>{t[0]}</h2>
    {lecturaFallida ? <p role="status">{t[2]}</p> : null}
    {rows.length ? <div className="sdp-card-grid">{rows.map(item => {
      const row = projeccioCatalegDe(item);
      /* PRODNM-02 · Sense l'app de la font en este build, la targeta no porta enlloc. */
      const ruta = rutaDeFitxaCataleg(row.font);
      const objecte = objecteDeProjeccioCataleg(item, publicacio.ownerId, autoriaReferencia);
      return <UniversalCard key={item.id} title={row.font.title} subtitle={row.font.subtitle}
        body={row.font.lead} headingLevel="h3" hasFooter={false} showShare={false}
        labels={row.pendent ? [t[1]] : []} {...(objecte ? { objecte, ambModeracio: true, className: 'sdp-referencia-cataleg' } : null)}
        onMainClick={ruta ? () => navega(ruta) : undefined} />;
    })}</div> : null}
  </section>;
}
