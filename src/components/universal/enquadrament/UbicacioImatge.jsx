/**
 * UbicacioImatge — Onada 4, T3a (ADR multimèdia D5 i §3.3). La part
 * «Vull geolocalitzar aquesta imatge» del DialegEnquadrament. Presentació
 * pura: l'estat i la lectura de l'EXIF són del diàleg.
 *
 * Apagada de sèrie. Encesa: les coordenades del fitxer original (o les que
 * escriu la persona), la precisió que es desarà i el resultat ja arrodonit,
 * visible ABANS de desar. Cap servei de mapes de tercers: el mapa per a triar
 * el punt és pendent (no n'hi ha cap de propi al projecte).
 */
import { useMemo } from 'react';
import { Camp, CampText, Carregant, Casella, GrupCamps, GrupOpcions } from '../../PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../../config/moderacio.js';
import { PARELL_CASELLA_GEO, errorCoordenada, precisionsTraduides, textUbicacio } from './geolocalitzacio.js';

export const ETIQUETA_GEOLOCALITZA = PARELL_CASELLA_GEO[1];

/* P1-22 (assalt 261101) · Els textos en parells [clau, reserva]: la reserva
   és el valencià de sempre, lletra per lletra. Fora de l'app (sense
   traductor), la reserva. `desara` el fa servir també CasellaExif. */
export const TEXTOS_UBICACIO = Object.freeze({
  casella: PARELL_CASELLA_GEO,
  ajuda: Object.freeze(['editor.enquadrament.geoAjuda', 'La ubicació es desa a part, com a dada de la foto. Mai va dins de l’arxiu.']),
  llegenda: Object.freeze(['editor.enquadrament.geoLlegenda', 'Ubicació']),
  llegint: Object.freeze(['editor.enquadrament.geoLlegint', 'Llegint la ubicació de la foto…']),
  trobada: Object.freeze(['editor.enquadrament.geoTrobada', 'La foto porta esta ubicació. Revisa-la abans de desar.']),
  sense: Object.freeze(['editor.enquadrament.geoSense', 'Esta foto no porta ubicació. Escriu-la a mà (el mapa per a triar el punt encara no hi és).']),
  latitud: Object.freeze(['editor.enquadrament.latitud', 'Latitud']),
  longitud: Object.freeze(['editor.enquadrament.longitud', 'Longitud']),
  precisio: Object.freeze(['editor.enquadrament.precisio', 'Precisió']),
  dataFoto: Object.freeze(['editor.enquadrament.dataFoto', 'Data de la foto: {data}']),
  desara: Object.freeze(['editor.enquadrament.desara', 'Es desarà: {ubicacio}.']),
  res: Object.freeze(['editor.enquadrament.geoRes', 'Encara no hi ha cap ubicació per a desar.']),
});

export function UbicacioImatge({ geo, resultat, desactivat = false, onActiva, onCanvi }) {
  const t = useTraductorOpcional();
  const precisions = useMemo(() => precisionsTraduides(t), [t]);
  const quiet = desactivat || geo.llegint;
  return (
    <div>
      <Casella etiqueta={tradueix(t, TEXTOS_UBICACIO.casella)}
        ajuda={tradueix(t, TEXTOS_UBICACIO.ajuda)}
        checked={geo.actiu} disabled={desactivat} onChange={(ev) => onActiva?.(ev.target.checked)} />
      {geo.actiu ? (
        <GrupCamps llegenda={tradueix(t, TEXTOS_UBICACIO.llegenda)}>
          {geo.llegint ? <Carregant etiqueta={tradueix(t, TEXTOS_UBICACIO.llegint)} /> : (
            <p className="sdp-camp__ajuda">
              {tradueix(t, geo.trobada ? TEXTOS_UBICACIO.trobada : TEXTOS_UBICACIO.sense)}
            </p>
          )}
          <Camp etiqueta={tradueix(t, TEXTOS_UBICACIO.latitud)} error={errorCoordenada(geo.lat, 'lat', t) || undefined}>
            <CampText inputMode="decimal" autoComplete="off" value={geo.lat} disabled={quiet}
              onChange={(ev) => onCanvi?.('lat', ev.target.value)} />
          </Camp>
          <Camp etiqueta={tradueix(t, TEXTOS_UBICACIO.longitud)} error={errorCoordenada(geo.lng, 'lng', t) || undefined}>
            <CampText inputMode="decimal" autoComplete="off" value={geo.lng} disabled={quiet}
              onChange={(ev) => onCanvi?.('lng', ev.target.value)} />
          </Camp>
          <GrupOpcions llegenda={tradueix(t, TEXTOS_UBICACIO.precisio)} opcions={precisions} valor={geo.precisio} disabled={quiet}
            onCanvi={(valor) => onCanvi?.('precisio', valor)} />
          {geo.dataCaptura ? (
            <p className="sdp-camp__ajuda">{omple(tradueix(t, TEXTOS_UBICACIO.dataFoto), { data: geo.dataCaptura.replace('T', ' ') })}</p>
          ) : null}
          <p className="sdp-camp__ajuda" aria-live="polite">
            {resultat
              ? omple(tradueix(t, TEXTOS_UBICACIO.desara), { ubicacio: textUbicacio(resultat, geo.precisio, t) })
              : tradueix(t, TEXTOS_UBICACIO.res)}
          </p>
        </GrupCamps>
      ) : null}
    </div>
  );
}

export default UbicacioImatge;
