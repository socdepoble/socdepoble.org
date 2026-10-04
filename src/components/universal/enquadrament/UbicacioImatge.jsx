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
import { Camp, CampText, Carregant, Casella, GrupCamps, GrupOpcions } from '../../PedraSeca/index.js';
import { PRECISIONS, errorCoordenada, textUbicacio } from './geolocalitzacio.js';

export const ETIQUETA_GEOLOCALITZA = 'Vull geolocalitzar aquesta imatge';

export function UbicacioImatge({ geo, resultat, desactivat = false, onActiva, onCanvi }) {
  const quiet = desactivat || geo.llegint;
  return (
    <div>
      <Casella etiqueta={ETIQUETA_GEOLOCALITZA}
        ajuda="La ubicació es desa a part, com a dada de la foto. Mai va dins de l’arxiu."
        checked={geo.actiu} disabled={desactivat} onChange={(ev) => onActiva?.(ev.target.checked)} />
      {geo.actiu ? (
        <GrupCamps llegenda="Ubicació">
          {geo.llegint ? <Carregant etiqueta="Llegint la ubicació de la foto…" /> : (
            <p className="sdp-camp__ajuda">
              {geo.trobada
                ? 'La foto porta esta ubicació. Revisa-la abans de desar.'
                : 'Esta foto no porta ubicació. Escriu-la a mà (el mapa per a triar el punt encara no hi és).'}
            </p>
          )}
          <Camp etiqueta="Latitud" error={errorCoordenada(geo.lat, 'lat') || undefined}>
            <CampText inputMode="decimal" autoComplete="off" value={geo.lat} disabled={quiet}
              onChange={(ev) => onCanvi?.('lat', ev.target.value)} />
          </Camp>
          <Camp etiqueta="Longitud" error={errorCoordenada(geo.lng, 'lng') || undefined}>
            <CampText inputMode="decimal" autoComplete="off" value={geo.lng} disabled={quiet}
              onChange={(ev) => onCanvi?.('lng', ev.target.value)} />
          </Camp>
          <GrupOpcions llegenda="Precisió" opcions={PRECISIONS} valor={geo.precisio} disabled={quiet}
            onCanvi={(valor) => onCanvi?.('precisio', valor)} />
          {geo.dataCaptura ? <p className="sdp-camp__ajuda">Data de la foto: {geo.dataCaptura.replace('T', ' ')}</p> : null}
          <p className="sdp-camp__ajuda" aria-live="polite">
            {resultat ? `Es desarà: ${textUbicacio(resultat, geo.precisio)}.` : 'Encara no hi ha cap ubicació per a desar.'}
          </p>
        </GrupCamps>
      ) : null}
    </div>
  );
}

export default UbicacioImatge;
