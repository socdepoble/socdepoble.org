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
import { useId, useState } from 'react';
import { useLocation } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Fila, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import {
  alertaSalutTraduida, etiquetaDataLlargaSalut, etiquetaDataSalut, etiquetaNivellSalut,
  metriquesSalutTraduites, nomDadaAlertaSalut, peuAlertesSalut, textErrorSalut, valorMotiuFebreSalut
} from '../i18nSalut.js';
import { avaluaAlertes, clauDescart } from '../nucli/alertes.js';
import { textDecimes } from '../nucli/diccionari.js';
import { metriquesPeriode } from '../nucli/metriques.js';
import { useSalut } from '../useSalut.jsx';
import { Enllac112, EnllacBoto, MarcSalut, useEstret, usePeriodeTriat, useTextosSalut } from './comunes.jsx';
import { useTipusActius } from './Diari.jsx';

const TO_DE_NIVELL = Object.freeze({ urgent: 'error', 'parla-ho': 'avis', informa: 'info' });
const NOMS_DADES = Object.freeze({
  vegades: 'Vegades', observacions: 'Observacions', data: 'Dia', episodis: 'Episodis', mitjana: 'Mitjana d’abans',
  maximaDecimes: 'Temperatura més alta', motiu: 'Per', dies: 'Dies', ml: 'Begut (ml)', mitjanaMl: 'Begut de mitjana (ml)',
  jornades: 'Jornades', percent: 'Part de nit (%)', referencia: 'Referència (%)', mlPerKg: 'ml per kg', dures: 'Deposicions dures',
  preses: 'Preses', ara: 'Ara, per dia', abans: 'Abans, per dia', ambTemperatura: 'Amb temperatura alta'
});

function textValor(clau, valor, tx, idioma) {
  if (clau === 'maximaDecimes') return `${textDecimes(valor)} °C`;
  if (clau === 'motiu' && typeof valor === 'string') return valorMotiuFebreSalut(valor, idioma);
  if (Array.isArray(valor)) return valor.map((v) => (typeof v === 'string' && /^\d{4}-/.test(v) ? etiquetaDataSalut(v, idioma) : v)).join(', ');
  if (clau === 'data') return etiquetaDataSalut(valor, idioma);
  if (typeof valor === 'boolean') return valor ? tx.si : tx.no;
  return String(valor).replace('.', ',');
}
const textDades = (dades, tx, idioma) => Object.entries(dades || {})
  .map(([clau, valor]) => `${nomDadaAlertaSalut(clau, idioma) || NOMS_DADES[clau] || clau}: ${textValor(clau, valor, tx, idioma)}`).join(' · ');

export function Alertes() {
  const salut = useSalut();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const { search } = useLocation();
  const estret = useEstret();
  const { des, fins } = usePeriodeTriat();
  const actius = useTipusActius();
  const idBaseAlertes = useId();
  const [obertes, setObertes] = useState(() => new Set());
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const tipusApagats = ['conducta', 'medicacio', 'deposicio'].filter((tipus) => !actius.some((t) => t.id === tipus));
  const { alertes, descartades } = avaluaAlertes({
    apunts: salut.apunts, jornades: salut.jornades, persona: salut.persona, des, fins, periodes: salut.periodes,
    descartades: salut.descartades, tipusApagats, ofsetDe: salut.ofsetDe
  });
  const commuta = (id) => setObertes((abans) => {
    const nou = new Set(abans);
    if (nou.has(id)) nou.delete(id);
    else nou.add(id);
    return nou;
  });
  const descarta = (id) => salut.descartaAlerta(clauDescart(id, des, fins)).then(() => setError(null), (e) => setError(textErrorSalut(e, idioma)));
  /* En un mòbil, les mesures són a la seua ruta, amb el mateix període. */
  const mesures = `${ruta('resum', 'mesures')}${search ? `?${search}` : ''}`;
  return (
    <MarcSalut titol={tx.avisos} columna="mig" eines={estret ? <EnllacBoto a={mesures}>{tx.mesuresDelPeriode}</EnllacBoto> : null}>
      <Pila gap={4}>
        <p>{tx.delAl(etiquetaDataLlargaSalut(des, idioma), etiquetaDataLlargaSalut(fins, idioma))}</p>
        {alertes.length === 0 ? <p>{tx.capAvisPeriode}</p> : null}
        {alertes.map((alertaCrua) => {
          const alerta = alertaSalutTraduida(alertaCrua, idioma);
          const esOberta = obertes.has(alerta.id);
          const idPerQue = `${idBaseAlertes}-perque-${alerta.id}`;
          return (
            <Alerta key={alerta.id} to={TO_DE_NIVELL[alerta.nivell]} titol={etiquetaNivellSalut(alerta.nivell, idioma)} viva={false}
              accions={(
                <Fila gap={2}>
                  {alerta.nivell === 'urgent' ? <Enllac112 /> : null}
                  <Boto
                    varietat="fantasma"
                    aria-expanded={esOberta}
                    aria-controls={esOberta ? idPerQue : undefined}
                    onClick={() => commuta(alerta.id)}
                  >
                    {tx.perQueVeigAco}
                  </Boto>
                  <Boto varietat="fantasma" disabled={salut.nomesLectura} onClick={() => descarta(alerta.id)}>{tx.descartaEnPeriode}</Boto>
                </Fila>
              )}>
              <p>{alerta.text}</p>
              {esOberta ? (
                <Pila id={idPerQue} gap={1}>
                  <p>{alerta.perQue}</p>
                  <p>{tx.criteriPrefix(alerta.criteri)}</p>
                  <p>{tx.lesTeuesDadesPrefix(textDades(alerta.dades, tx, idioma))}</p>
                </Pila>
              ) : null}
            </Alerta>
          );
        })}
        {descartades ? <p>{tx.avisosDescartats(descartades)}</p> : null}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <p>{peuAlertesSalut(idioma)}</p>
      </Pila>
    </MarcSalut>
  );
}

const ROTULS = Object.freeze({ indexPoliuriaNocturna: ' %', mlPerKg24h: ' ml/kg' });

export function Mesures() {
  const salut = useSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const { des, dies } = usePeriodeTriat();
  if (!salut.carregat) return null;
  const periode = metriquesPeriode(des, dies, salut.apunts, { persona: salut.persona, jornades: salut.jornades, ofsetDe: salut.ofsetDe });
  const files = metriquesSalutTraduites(idioma).filter((m) => m.clau !== 'cobertura').map((m) => {
    const valor = periode.mitjana[m.clau];
    const unitat = ROTULS[m.clau] || (m.unitat === 'ml' ? ' ml' : '');
    return { clau: m.clau, etiqueta: m.etiqueta, valor: valor === null ? '—' : `${String(valor).replace('.', ',')}${unitat}`, definicio: m.definicio };
  });
  return (
    <MarcSalut titol={tx.mesuresDelPeriode}>
      <Pila gap={4}>
        <p>{tx.mitjanaJornadesCompletes(periode.completes, dies)}</p>
        <Taula titol={tx.mesuresDelPeriode}>
          <thead><tr><th scope="col">{tx.mesura}</th><th scope="col">{tx.mitjana}</th><th scope="col">{tx.queVolDir}</th></tr></thead>
          <tbody>
            {files.map((fila) => (
              <tr key={fila.clau}><th scope="row">{fila.etiqueta}</th><td>{fila.valor}</td><td>{fila.definicio}</td></tr>
            ))}
          </tbody>
        </Taula>
        <p>{tx.notaDadesCasa}</p>
      </Pila>
    </MarcSalut>
  );
}
