/**
 * El Bar · vistes/Torns.jsx — l'historial de torns i «Desa el tancament»
 * (disseny del Bar §A.6, flux 6.4 i §A.11).
 */
import { useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import { Alerta, BarraResum, Boto, EstatBuit, Fila } from '../../../components/PedraSeca/index.js';
import { ColumnaColleccions } from '../../comu/esquelet/index.js';
import { TIPUS_MIME_CSV, TIPUS_MIME_XLSX, creaXlsx, modelACsv } from '../../../utils/fulls/index.js';
import { exportaTancament, fullTancament } from '../nucli/fullTancament.js';
import { esZona, registreDeVendes } from '../nucli/vendes.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useIdiomaBar, useVes } from './punt.js';
import { ContingutTraspas, TaulaResum } from './Torn.jsx';
import { desaFitxer, nomFitxer, zonaDelDispositiu } from './desa.js';
import { euros, horaCurta } from './vestits.js';

const TIPUS_JSON = 'application/json';

function dataCurta(moment) {
  const data = new Date(moment);
  return `${data.getDate()}/${data.getMonth() + 1} · ${horaCurta(moment)}`;
}

export function HistorialTorns({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.historialTorns} ambTorn={false} avis="estret">
      <Historial params={params} idioma={idioma} />
    </Preparat>
  );
}

function Historial({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { torns } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol={tx.historialTorns} actiu={params?.torn || null}
      colleccions={torns.map((t) => ({
        id: t.id,
        nom: `${dataCurta(t.obertA)} · ${t.obertPer}`,
        comptador: t.resum?.tiquets ?? 0,
        secundari: t.estat === 'obert' ? tx.obertAra : tx.tancatALes(euros(t.resum.totalVendesCents), horaCurta(t.tancatA))
      }))}
      hrefDe={(t) => ruta('torns', t.id)} textComptador={(n) => tx.nTiquets(n)}
      textos={{ buit: tx.capTornEncara, buitText: null }} avis={<AvisDeLaColumna />} />
  );
}

export function TriaTorn() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Columna titol={tx.tornTitol} avis={<AvisSessio />}>
      <EstatBuit icona={CalendarDays} titol={tx.triaUnTorn}>{tx.triaTornText}</EstatBuit>
    </Columna>
  );
}

export function DetallTorn({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tornTitol} ambTorn={false}>
      <Torn params={params} idioma={idioma} />
    </Preparat>
  );
}

function Torn({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { torns, accions, establiment, carta } = useBar();
  const { ves } = useVes();
  const [avis, setAvis] = useState(null);
  const desaVendes = async (torn) => {
    const delBar = esZona(establiment?.zona);
    const zona = delBar ? establiment.zona : zonaDelDispositiu();
    if (!zona) return tx.senseZonaHoraria;
    let tiquets;
    try {
      tiquets = await accions.tiquetsDelTorn(torn.id);
    } catch {
      return tx.errorLlegirTiquetsTorn;
    }
    try {
      const registre = registreDeVendes(tiquets, { titular: null, establiment: establiment.slug, zona });
      const ofert = desaFitxer(nomFitxer('vendes', torn.id, torn.tancatA, 'json'), JSON.stringify(registre, null, 2), TIPUS_JSON);
      if (!ofert) return tx.navegadorNoDeixaDesar;
      return delBar
        ? tx.fitxerVendesZonaBar(registre.vendes.length, zona)
        : tx.fitxerVendesZonaCaixa(registre.vendes.length, zona);
    } catch (error) {
      if (error?.codi === 'REGISTRE_INVALID' && Array.isArray(error.detalls) && error.detalls.length) {
        return tx.errorRegistreInvalid(error.detalls.length, error.detalls[0].missatge);
      }
      if (error?.codi === 'ZONA') return tx.errorZonaInvalida(zona);
      return tx.errorRegistreInesperat;
    }
  };
  const torn = torns.find((t) => t.id === params.torn) || null;
  if (!torn) return <NoTrobat text={tx.noHiHaTornNom} torna={{ etiqueta: tx.vesAHistorial, trams: ['torns'] }} />;
  if (torn.estat !== 'tancat') {
    return (
      <Columna titol={tx.tornObertTitol}>
        <EstatBuit titol={tx.esteTornObert} accio={<Boto onClick={() => ves('torn')}>{tx.vesAlTorn}</Boto>}>
          {tx.tancamentEsDesaQuanTanca}
        </EstatBuit>
      </Columna>
    );
  }
  const desa = async (format) => {
    if (format === 'vendes') {
      setAvis(await desaVendes(torn));
      return;
    }
    let ofert = false;
    let senseConsum = false;
    let tiquets = [];
    if (format === 'xlsx' || format === 'resum' || format === 'producte') {
      try {
        tiquets = await accions.tiquetsDelTorn(torn.id);
      } catch {
        setAvis(tx.errorPrepararLlegir);
        return;
      }
    }
    try {
      if (format === 'json') {
        ofert = desaFitxer(nomFitxer('tancament', torn.id, torn.tancatA, 'json'), JSON.stringify(exportaTancament(torn), null, 2), TIPUS_JSON);
      } else if (format === 'traspas') {
        ofert = desaFitxer(nomFitxer('traspas', torn.id, torn.tancatA, 'json'), JSON.stringify(torn.traspas, null, 2), TIPUS_JSON);
      } else if (format === 'xlsx') {
        let model;
        try {
          model = fullTancament(torn, tiquets, { carta });
        } catch {
          model = fullTancament(torn, tiquets);
          senseConsum = true;
        }
        ofert = desaFitxer(nomFitxer('tancament', torn.id, torn.tancatA, 'xlsx'), creaXlsx(model), TIPUS_MIME_XLSX);
      } else {
        const model = fullTancament(torn, tiquets);
        ofert = desaFitxer(nomFitxer(`tancament-${format}`, torn.id, torn.tancatA, 'csv'), modelACsv(model, format === 'producte' ? 'Per producte' : 'Resum'), TIPUS_MIME_CSV);
      }
    } catch {
      setAvis(tx.errorPrepararFallat);
      return;
    }
    if (!ofert) setAvis(tx.navegadorNoDeixaDesar);
    else if (senseConsum) setAvis(tx.fitxerSenseConsum);
    else setAvis(tx.fitxerPreparat);
  };
  return (
    <Columna titol={tx.tornDe(torn.obertPer)} torna={{ etiqueta: tx.tornaAHistorial, trams: ['torns'] }}
      eines={<BarraResum etiqueta={tx.vendesEtiqueta} comptador={torn.resum.tiquets} textComptador={(n) => tx.nTiquets(n)} total={euros(torn.resum.totalVendesCents)} />}>
      <AvisOperacio />
      {avis ? <Alerta to="info" onTanca={() => setAvis(null)}>{avis}</Alerta> : null}
      <Fila gap={2}>
        <Boto varietat="primari" icona={Download} onClick={() => desa('xlsx')}>{tx.desaTancamentXlsx}</Boto>
        <Boto icona={Download} onClick={() => desa('resum')}>{tx.csvResum}</Boto>
        <Boto icona={Download} onClick={() => desa('producte')}>{tx.csvProducte}</Boto>
        <Boto icona={Download} onClick={() => desa('json')}>{tx.jsonTancament}</Boto>
        <Boto icona={Download} onClick={() => desa('traspas')}>{tx.jsonTraspas}</Boto>
        <Boto icona={Download} onClick={() => desa('vendes')}>{tx.vendesGestoriaJson}</Boto>
      </Fila>
      <TaulaResum resum={torn.resum} torn={torn} />
      <ContingutTraspas nota={torn.traspas} />
    </Columna>
  );
}
