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
import { esZona, registreDeVendes } from '../nucli/vendes.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { ContingutTraspas, TaulaResum } from './Torn.jsx';
import { desaFitxer, nomFitxer, zonaDelDispositiu } from './desa.js';
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
  const { torns, accions, establiment, carta } = useBar();
  const { ves } = useVes();
  const [avis, setAvis] = useState(null);
  /* Onada 12 (261011; ordres 261011_0130, punt 6: el lligam TPV → Gestoria) · Les vendes del
     torn en el contracte neutre sdp.vendes.v1 (nucli/vendes.js, que fins ara no cridava cap
     pantalla): el fitxer que la Gestoria pot llegir, també des d'un altre dispositiu. Cap regla
     d'impostos ací (Principi 4): el total per tipus d'IVA, i la base i la quota les fa la
     Gestoria. El titular va a null: el tria la Gestoria. La zona, la de l'establiment si el Bar
     la guarda; si no, la d'esta caixa, i l'avís la diu. */
  const desaVendes = async (torn) => {
    /* Correcció del refutador (261011, T6) · Cap pantalla escriu encara `establiment.zona` (és
       decisió del Mestre): hui val sempre la d'esta caixa, i l'avís ho diu sense embuts, perquè
       una caixa amb una altra hora posaria les vendes de la nit al dia que no toca. */
    const delBar = esZona(establiment?.zona);
    const zona = delBar ? establiment.zona : zonaDelDispositiu();
    if (!zona) return 'Este navegador no diu la zona horària: no es pot datar les vendes.';
    let tiquets;
    try {
      tiquets = await accions.tiquetsDelTorn(torn.id);
    } catch {
      return 'No s’han pogut llegir els tiquets d’este torn: no s’ha fet cap fitxer. Torna-ho a provar.';
    }
    try {
      const registre = registreDeVendes(tiquets, { titular: null, establiment: establiment.slug, zona });
      const ofert = desaFitxer(nomFitxer('vendes', torn.id, torn.tancatA, 'json'), JSON.stringify(registre, null, 2), TIPUS_JSON);
      const quantes = `${registre.vendes.length} ${registre.vendes.length === 1 ? 'venda' : 'vendes'}`;
      const deQui = delBar
        ? `de la zona del bar (${zona})`
        : `de la zona d’ESTA CAIXA (${zona}), perquè el bar encara no té zona pròpia: si la caixa no és a l’hora del bar, les dates poden ballar`;
      return ofert
        ? `Fitxer preparat: ${quantes}, amb el dia i l’hora ${deQui}. El navegador et deixa triar on desar-lo.`
        : 'Este navegador no deixa desar fitxers des d’ací.';
    } catch (error) {
      /* Correcció del refutador (261011, T5) · Cada causa, el seu text. El detall és el del
         contracte (utils/vendes): diu el camp, mai cap valor de negoci. */
      if (error?.codi === 'REGISTRE_INVALID' && Array.isArray(error.detalls) && error.detalls.length) {
        const n = error.detalls.length;
        return `El registre de vendes d’este torn no passa la validació del contracte (${n} ${n === 1 ? 'problema' : 'problemes'}): ${error.detalls[0].missatge} No s’ha fet cap fitxer.`;
      }
      if (error?.codi === 'ZONA') return `La zona horària «${zona}» no val per a datar les vendes: no s’ha fet cap fitxer.`;
      return 'No s’ha pogut fer el registre de vendes d’este torn per un error inesperat: no s’ha fet cap fitxer.';
    }
  };
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
    if (format === 'vendes') {
      setAvis(await desaVendes(torn));
      return;
    }
    /* Correcció del refutador (261011, T3) · És la còpia del dia: cap excepció pot deixar el botó
       mut. La carta només es passa per a l'XLSX (els dos CSV no porten la fulla del consum) i, si
       el càlcul del consum falla (la carta no valida escandalls ni ingredients), l'XLSX ix amb
       les quatre fulles de sempre i l'avís ho diu. */
    let ofert = false;
    let senseConsum = false;
    /* Cada causa, el seu text (correcció del refutador, 261011, H): llegir els tiquets del disc
       és una cosa i fer el fitxer (el full, l'XLSX, el CSV, el JSON), una altra. */
    let tiquets = [];
    if (format === 'xlsx' || format === 'resum' || format === 'producte') {
      try {
        tiquets = await accions.tiquetsDelTorn(torn.id);
      } catch {
        setAvis('No s’ha pogut preparar el fitxer: les dades d’este torn no s’han pogut llegir. Torna-ho a provar.');
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
          /* Onada 12 (261011) · Amb la carta, l'XLSX porta també «Consum d'ingredients» (nucli/consum.js). */
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
      setAvis('No s’ha pogut fer el fitxer: les dades del torn s’han llegit, però ha fallat en preparar-lo. Prova un altre format i desa una còpia des d’Ajustos › Dispositiu.');
      return;
    }
    if (!ofert) setAvis('Este navegador no deixa desar fitxers des d’ací.');
    else if (senseConsum) setAvis('Fitxer preparat sense la fulla «Consum d’ingredients»: no s’ha pogut calcular amb la carta d’ara. El navegador et deixa triar on desar-lo.');
    else setAvis('Fitxer preparat: el navegador et deixa triar on desar-lo.');
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
        <Boto icona={Download} onClick={() => desa('vendes')}>Vendes per a la Gestoria (JSON)</Boto>
      </Fila>
      <TaulaResum resum={torn.resum} torn={torn} />
      <ContingutTraspas nota={torn.traspas} />
    </Columna>
  );
}
