/**
 * El Bar · vistes/Torns.jsx — l'historial de torns i «Desa el tancament»
 * (disseny del Bar §A.6, flux 6.4 i §A.11): la còpia de seguretat del dia,
 * en XLSX, CSV o JSON (sdp.bar.tancament.v1 i la nota sdp.bar.traspas.v1).
 * L'historial és la columna de col·leccions de l'esquelet comú, amb l'avís
 * de la sessió dins del seu marc (avis, correcció F3, 261006).
 */
import { useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import { Alerta, BarraResum, Boto, EstatBuit, Fila } from '../../../components/PedraSeca/index.js';
import { ColumnaColleccions } from '../../comu/esquelet/index.js';
import { TIPUS_MIME_CSV, TIPUS_MIME_XLSX, creaXlsx, modelACsv } from '../../../utils/fulls/index.js';
import { exportaTancament, fullTancament } from '../nucli/fullTancament.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { ContingutTraspas, TaulaResum } from './Torn.jsx';
import { desaFitxer, nomFitxer } from './desa.js';
import { euros, horaCurta } from './vestits.js';

const TIPUS_JSON = 'application/json';

/** «2/10 · 06:00». */
function dataCurta(moment) {
  const data = new Date(moment);
  return `${data.getDate()}/${data.getMonth() + 1} · ${horaCurta(moment)}`;
}

export function HistorialTorns({ params }) {
  return (
    <Preparat titol="Historial de torns" ambTorn={false} avis="estret">
      <Historial params={params} />
    </Preparat>
  );
}

function Historial({ params }) {
  const { torns } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Historial de torns" actiu={params?.torn || null}
      colleccions={torns.map((t) => ({
        id: t.id,
        nom: `${dataCurta(t.obertA)} · ${t.obertPer}`,
        comptador: t.resum?.tiquets ?? 0,
        secundari: t.estat === 'obert' ? 'Obert ara' : `${euros(t.resum.totalVendesCents)} · tancat a les ${horaCurta(t.tancatA)}`
      }))}
      hrefDe={(t) => ruta('torns', t.id)} textComptador={(n) => `${n} tiquets`}
      textos={{ buit: 'Encara no hi ha cap torn', buitText: null }} avis={<AvisDeLaColumna />} />
  );
}

/* Sense Preparat: l'avís de la sessió hi va ell mateix (l'historial del costat només el porta en estret). */
export function TriaTorn() {
  return (
    <Columna titol="Torn" avis={<AvisSessio />}>
      <EstatBuit icona={CalendarDays} titol="Tria un torn">De cada torn tancat es pot desar el tancament en XLSX, CSV o JSON.</EstatBuit>
    </Columna>
  );
}

export function DetallTorn({ params }) {
  return (
    <Preparat titol="Torn" ambTorn={false}>
      <Torn params={params} />
    </Preparat>
  );
}

function Torn({ params }) {
  const { torns, accions } = useBar();
  const { ves } = useVes();
  const [avis, setAvis] = useState(null);
  const torn = torns.find((t) => t.id === params.torn) || null;
  if (!torn) return <NoTrobat text="No hi ha cap torn amb este nom en este dispositiu." torna={{ etiqueta: 'Ves a l’historial', trams: ['torns'] }} />;
  if (torn.estat !== 'tancat') {
    return (
      <Columna titol="Torn obert">
        <EstatBuit titol="Este torn encara està obert" accio={<Boto onClick={() => ves('torn')}>Ves al torn</Boto>}>
          El tancament es pot desar quan el torn es tanca.
        </EstatBuit>
      </Columna>
    );
  }
  const desa = async (format) => {
    let ofert = false;
    if (format === 'json') {
      ofert = desaFitxer(nomFitxer('tancament', torn.id, torn.tancatA, 'json'), JSON.stringify(exportaTancament(torn), null, 2), TIPUS_JSON);
    } else if (format === 'traspas') {
      ofert = desaFitxer(nomFitxer('traspas', torn.id, torn.tancatA, 'json'), JSON.stringify(torn.traspas, null, 2), TIPUS_JSON);
    } else {
      const model = fullTancament(torn, await accions.tiquetsDelTorn(torn.id));
      ofert = format === 'xlsx'
        ? desaFitxer(nomFitxer('tancament', torn.id, torn.tancatA, 'xlsx'), creaXlsx(model), TIPUS_MIME_XLSX)
        : desaFitxer(nomFitxer(`tancament-${format}`, torn.id, torn.tancatA, 'csv'), modelACsv(model, format === 'producte' ? 'Per producte' : 'Resum'), TIPUS_MIME_CSV);
    }
    setAvis(ofert ? 'Fitxer preparat: el navegador et deixa triar on desar-lo.' : 'Este navegador no deixa desar fitxers des d’ací.');
  };
  return (
    <Columna titol={`Torn de ${torn.obertPer}`} torna={{ etiqueta: 'Torna a l’historial', trams: ['torns'] }}
      eines={<BarraResum etiqueta="Vendes" comptador={torn.resum.tiquets} textComptador={(n) => `${n} tiquets`} total={euros(torn.resum.totalVendesCents)} />}>
      <AvisOperacio />
      {avis ? <Alerta to="info" onTanca={() => setAvis(null)}>{avis}</Alerta> : null}
      <Fila gap={2}>
        <Boto varietat="primari" icona={Download} onClick={() => desa('xlsx')}>Desa el tancament (XLSX)</Boto>
        <Boto icona={Download} onClick={() => desa('resum')}>CSV del resum</Boto>
        <Boto icona={Download} onClick={() => desa('producte')}>CSV per producte</Boto>
        <Boto icona={Download} onClick={() => desa('json')}>JSON del tancament</Boto>
        <Boto icona={Download} onClick={() => desa('traspas')}>JSON del traspàs</Boto>
      </Fila>
      <TaulaResum resum={torn.resum} torn={torn} />
      <ContingutTraspas nota={torn.traspas} />
    </Columna>
  );
}
