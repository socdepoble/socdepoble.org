/**
 * Resum.jsx — resum i avisos del període (/resum?des=&dies=).
 *
 *   mig      les alertes suaus (alertes.js): cada una amb «Per què veig
 *            açò?» i es pot descartar per a este període. Sempre, el peu:
 *            que no hi haja cap avís no vol dir que tot vaja bé.
 *   detall   les mesures del període (la mitjana de les jornades completes)
 * /resum/mesures és el mateix; en un mòbil hi ensenya les mesures (rutesSalut.js).
 * Cap notificació: la persona ho veu quan entra.
 */
import { useState } from 'react';
import { useLocation } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Fila, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { ETIQUETA_NIVELL, avaluaAlertes, clauDescart } from '../nucli/alertes.js';
import { METRIQUES, textDecimes } from '../nucli/diccionari.js';
import { etiquetaData, etiquetaDataLlarga } from '../nucli/hores.js';
import { metriquesPeriode } from '../nucli/metriques.js';
import { textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { Enllac112, EnllacBoto, MarcSalut, useEstret, usePeriodeTriat } from './comunes.jsx';
import { useTipusActius } from './Diari.jsx';

const TO_DE_NIVELL = Object.freeze({ urgent: 'error', 'parla-ho': 'avis', informa: 'info' });
const NOMS_DADES = Object.freeze({
  vegades: 'Vegades', observacions: 'Observacions', data: 'Dia', episodis: 'Episodis', mitjana: 'Mitjana d’abans',
  maximaDecimes: 'Temperatura més alta', motiu: 'Per', dies: 'Dies', ml: 'Begut (ml)', mitjanaMl: 'Begut de mitjana (ml)',
  jornades: 'Jornades', percent: 'Part de nit (%)', referencia: 'Referència (%)', mlPerKg: 'ml per kg', dures: 'Deposicions dures',
  preses: 'Preses', ara: 'Ara, per dia', abans: 'Abans, per dia', ambTemperatura: 'Amb temperatura alta'
});

function textValor(clau, valor) {
  if (clau === 'maximaDecimes') return `${textDecimes(valor)} °C`;
  if (Array.isArray(valor)) return valor.map((v) => (typeof v === 'string' && /^\d{4}-/.test(v) ? etiquetaData(v) : v)).join(', ');
  if (clau === 'data') return etiquetaData(valor);
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor).replace('.', ',');
}
const textDades = (dades) => Object.entries(dades || {}).map(([clau, valor]) => `${NOMS_DADES[clau] || clau}: ${textValor(clau, valor)}`).join(' · ');

export function Alertes() {
  const salut = useSalut();
  const { ruta } = useApp();
  const { search } = useLocation();
  const estret = useEstret();
  const { des, fins } = usePeriodeTriat();
  const actius = useTipusActius();
  const [obertes, setObertes] = useState(() => new Set());
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const tipusApagats = ['conducta', 'medicacio', 'deposicio'].filter((tipus) => !actius.some((t) => t.id === tipus));
  const { alertes, descartades, peu } = avaluaAlertes({
    apunts: salut.apunts, jornades: salut.jornades, persona: salut.persona, des, fins, periodes: salut.periodes,
    descartades: salut.descartades, tipusApagats, ofsetDe: salut.ofsetDe
  });
  const commuta = (id) => setObertes((abans) => {
    const nou = new Set(abans);
    if (nou.has(id)) nou.delete(id);
    else nou.add(id);
    return nou;
  });
  const descarta = (id) => salut.descartaAlerta(clauDescart(id, des, fins)).then(() => setError(null), (e) => setError(textError(e)));
  /* En un mòbil, les mesures són a la seua ruta, amb el mateix període. */
  const mesures = `${ruta('resum', 'mesures')}${search ? `?${search}` : ''}`;
  return (
    <MarcSalut titol="Avisos" columna="mig" eines={estret ? <EnllacBoto a={mesures}>Mesures del període</EnllacBoto> : null}>
      <Pila gap={4}>
        <p>{`Del ${etiquetaDataLlarga(des)} al ${etiquetaDataLlarga(fins)}.`}</p>
        {alertes.length === 0 ? <p>No hi ha cap avís en este període.</p> : null}
        {alertes.map((alerta) => (
          <Alerta key={alerta.id} to={TO_DE_NIVELL[alerta.nivell]} titol={ETIQUETA_NIVELL[alerta.nivell]} viva={false}
            accions={(
              <Fila gap={2}>
                {alerta.nivell === 'urgent' ? <Enllac112 /> : null}
                <Boto varietat="fantasma" aria-expanded={obertes.has(alerta.id)} onClick={() => commuta(alerta.id)}>Per què veig açò?</Boto>
                <Boto varietat="fantasma" disabled={salut.nomesLectura} onClick={() => descarta(alerta.id)}>Descarta-la en este període</Boto>
              </Fila>
            )}>
            <p>{alerta.text}</p>
            {obertes.has(alerta.id) ? (
              <Pila gap={1}>
                <p>{alerta.perQue}</p>
                <p>{`Criteri: ${alerta.criteri}`}</p>
                <p>{`Les teues dades: ${textDades(alerta.dades)}`}</p>
              </Pila>
            ) : null}
          </Alerta>
        ))}
        {descartades ? <p>{`${descartades} ${descartades === 1 ? 'avís descartat' : 'avisos descartats'} en este període.`}</p> : null}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <p>{peu}</p>
      </Pila>
    </MarcSalut>
  );
}

const ROTULS = Object.freeze({ indexPoliuriaNocturna: ' %', mlPerKg24h: ' ml/kg' });

export function Mesures() {
  const salut = useSalut();
  const { des, dies } = usePeriodeTriat();
  if (!salut.carregat) return null;
  const periode = metriquesPeriode(des, dies, salut.apunts, { persona: salut.persona, jornades: salut.jornades, ofsetDe: salut.ofsetDe });
  const files = METRIQUES.filter((m) => m.clau !== 'cobertura').map((m) => {
    const valor = periode.mitjana[m.clau];
    const unitat = ROTULS[m.clau] || (m.unitat === 'ml' ? ' ml' : '');
    return { clau: m.clau, etiqueta: m.etiqueta, valor: valor === null ? '—' : `${String(valor).replace('.', ',')}${unitat}`, definicio: m.definicio };
  });
  return (
    <MarcSalut titol="Mesures del període">
      <Pila gap={4}>
        <p>{`Mitjana de ${periode.completes} ${periode.completes === 1 ? 'jornada completa' : 'jornades completes'} de ${dies}.`}</p>
        <Taula titol="Mesures del període">
          <thead><tr><th scope="col">Mesura</th><th scope="col">Mitjana</th><th scope="col">Què vol dir</th></tr></thead>
          <tbody>
            {files.map((fila) => (
              <tr key={fila.clau}><th scope="row">{fila.etiqueta}</th><td>{fila.valor}</td><td>{fila.definicio}</td></tr>
            ))}
          </tbody>
        </Taula>
        <p>Són dades apuntades a casa, no un informe clínic. Porta-les al metge.</p>
      </Pila>
    </MarcSalut>
  );
}
