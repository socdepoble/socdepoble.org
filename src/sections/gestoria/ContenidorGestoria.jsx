/**
 * ContenidorGestoria.jsx — la Gestoria endollada a la porta d'aprovació de
 * tractors. Viu a la Wiki només en desenvolupament (WikiDePobleSection); no
 * té cap ruta pròpia a App.jsx (decisió D3).
 *
 * Connecta useTractors() (l'estat i l'empremta curta dels dos tractors, per
 * al pas 1) i contextAprovacio (l'aprovació vigent, que PanellGestoria demana
 * just abans de cada acció i no memoritza) amb PanellGestoria. «Obri el
 * panell de Tractors» porta a l'ítem de la Wiki on s'aproven, amb el router
 * propi: la consulta es resol sobre la ruta de l'app, com la resta de la Wiki.
 *
 * Proves: el magatzem, subtle, el catàleg, l'entorn i el rellotge s'injecten
 * com a PanellTractors (useTractors) i arriben també a contextAprovacio, i
 * inflate, avui i descarrega passen a PanellGestoria. Sense res, els de
 * veres: el magatzem compartit de la pàgina i el catàleg de registreTractors.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { contextAprovacio, useTractors } from '../tractors/useTractors.js';
import PanellGestoria, { estatTractorsDe } from './PanellGestoria.jsx';

/* L'ítem de la Wiki on s'aproven els tractors (WikiDePobleSection, modulsLocalsActius). */
export const CONSULTA_TRACTORS = '?categoria=tractors_cat&item=tractors_aprovacio';

export default function ContenidorGestoria({
  magatzem, subtle, tractors, entorn, rellotge, inflate, avui, descarrega, onFactures
}) {
  const navigate = useNavigate();
  const porta = useTractors({ magatzem, subtle, tractors, entorn, rellotge });
  const estatTractors = useMemo(() => estatTractorsDe(porta.tractors), [porta.tractors]);

  /* Cada crida llig l'aprovació d'ara mateix: revocar-la al panell de Tractors para l'acció següent. */
  const obteAprovacio = useCallback(
    (id) => contextAprovacio(id, { magatzem, subtle, tractors, entorn, rellotge }),
    [magatzem, subtle, tractors, entorn, rellotge]
  );
  const obreTractors = useCallback(() => navigate(CONSULTA_TRACTORS), [navigate]);

  if (porta.carregant) return <Carregant etiqueta="Llegint les aprovacions dels tractors…" />;
  return (
    <>
      {porta.error ? (
        <Alerta to="error" titol="No s’han pogut llegir les aprovacions dels tractors">
          {`${porta.error} Sense elles, la Gestoria no llig cap factura.`}
        </Alerta>
      ) : null}
      <PanellGestoria
        obteAprovacio={obteAprovacio}
        estatTractors={estatTractors}
        onObreTractors={obreTractors}
        subtle={subtle}
        inflate={inflate}
        entorn={entorn}
        avui={avui}
        descarrega={descarrega}
        onFactures={onFactures}
      />
    </>
  );
}
