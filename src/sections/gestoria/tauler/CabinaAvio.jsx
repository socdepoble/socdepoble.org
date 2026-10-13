/**
 * CabinaAvio.jsx — la Cabina d'Avió del Tauler de la Gestoria.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front E; prompt de Claude,
 * tasca 5): la tercera vista del Tauler, «Targetes | Cabina d’Avió | Vista
 * comprimida», un panell d'alta densitat d'instruments per a decidir (a la
 * manera d'un ERP, amb el Trellat de la casa). El model és dades.cabina
 * (nucli/cabinaAvio.js, dins de dadesDelTauler): ací només es pinta.
 *   · ELS INSTRUMENTS · una graella de dades (dl): la caixa real, la despesa
 *     mensual mitjana, els dies de cobertura, el 303, el 130, el que surt a
 *     pagar a Hisenda, la liquiditat davant de Hisenda i els dies de cobertura
 *     un colp pagat. El nom de cada instrument és el botó que obri la pàgina
 *     de la seua targeta (onObri), com una fila de la vista comprimida.
 *   · EL FLUX DE CAIXA PER MES · dos Histogrames de Pedra Seca (entrades i
 *     eixides, amb el mateix sostre) i la Taula densa de cada mes, amb el net,
 *     que és l'únic que pot ser negatiu i el gràfic no sap pintar.
 *   · ELS VENCIMENTS · una Alerta per finestra de presentació del 303 i del
 *     130, amb la nota que els terminis són orientatius.
 * Privacitat (ordre del Mestre, 261004): cap xifra es pinta fins que la
 * persona obri l'ull de la boina (`visible`), sense cap ull per instrument.
 * Amb l'ull tancat no hi ha cap Histograma (l'alçada de les barres també és
 * una xifra, com a l'Històric del 261009), un perquè que diu el signe d'una
 * xifra (`privat`) s'amaga com ella i l'avís d'estimació incompleta tampoc es
 * pinta. Les dates (la de referència i els venciments) es veuen sempre.
 * Cap encapçalament porta dades: l'Índex n'escriu el text a la URL (?seccio=).
 * La munta la closca (ShellGestoria), mai Tauler.jsx: en fa servir les peces.
 */
import { useId } from 'react';
import { EyeOff, FileSearch } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Histograma } from '../../../components/PedraSeca/organismes/Histograma.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { nomMes } from '../nucli/dates.js';
import { formatImport } from '../nucli/diners.js';
import { MONEDA_TAULER } from './nucli/resumTauler.js';
import { AvisosComptes, Xifra, XifraDeFila } from './Tauler.jsx';

const enter = (x) => Number.isSafeInteger(x);
const IMPORT = (valor) => (enter(valor) ? { tipus: 'import', valor, moneda: MONEDA_TAULER } : null);
const nomDelMes = (m) => `${nomMes(m.mes, 'ca', { majuscula: true })} ${m.any}`;
const COBERTURA = Object.freeze({ completa: 'Mes sencer', parcial: 'Part del mes', cap: 'Sense extractes' });

/* El valor d'un instrument: amb l'ull tancat, amagat si té xifra o si el seu perquè és privat. */
function Instrument({ instrument, visible, onObri }) {
  const amagat = !visible && (Boolean(instrument.xifra) || instrument.privat);
  const ambValor = amagat || Boolean(instrument.xifra);
  return (
    <div className="sdp-gestoria-cabina__instrument">
      <dt>
        <button type="button" className="sdp-gestoria-comprimida__obri" onClick={() => onObri?.(instrument.targeta)}>{instrument.titol}</button>
      </dt>
      <dd className={ambValor ? 'sdp-gestoria-cabina__valor' : 'sdp-gestoria-cabina__motiu'}>
        {amagat ? <Xifra xifra={{ tipus: instrument.tipus }} visible={false} /> : <XifraDeFila targeta={instrument} visible={visible} />}
      </dd>
      <dd className="sdp-gestoria-cabina__nota">{instrument.explica}</dd>
      {visible && instrument.avis ? <dd className="sdp-gestoria-cabina__avis">{instrument.avis}</dd> : null}
    </div>
  );
}

/* Els dos gràfics del flux: només amb l'ull obert, i només els mesos amb moviments (un mes sense no és cap zero). */
function GrafiquesFlux({ mesos, maxim, visible }) {
  const ambXifres = mesos.filter((m) => enter(m.entrades) && enter(m.eixides));
  if (!ambXifres.length) {
    return <EstatBuit icona={FileSearch} titol="Encara no hi ha cap mes amb moviments en euros" />;
  }
  if (!visible) {
    return (
      <EstatBuit icona={EyeOff} titol="Gràfics amagats">
        Prem l’ull de la boina per a veure’ls: l’alçada de les barres diu les xifres.
      </EstatBuit>
    );
  }
  const barres = (camp) => ambXifres.map((m) => ({
    id: m.clau,
    etiqueta: nomDelMes(m),
    valor: m[camp],
    marca: m.mes === 1 ? String(m.any) : nomMes(m.mes).slice(0, 3)
  }));
  const format = (valor) => formatImport(Math.round(valor));
  return (
    <div className="sdp-gestoria-cabina__grafics">
      <Histograma titol="Entrades per mes" barres={barres('entrades')} maxim={maxim ?? undefined} valors={false} formatValor={format}
        className="sdp-gestoria-cabina__entrades" />
      <Histograma titol="Eixides per mes" barres={barres('eixides')} maxim={maxim ?? undefined} valors={false} formatValor={format}
        className="sdp-gestoria-cabina__eixides" />
    </div>
  );
}

/* Una cel·la d'import del flux: sense extractes, «Sense dades»; cobert i sense moviments, el perquè; si no, la xifra. */
function CellaFlux({ mes, valor, visible }) {
  const xifra = IMPORT(valor);
  if (xifra || mes.cobertura === 'cap') {
    return <td className={xifra ? 'sdp-num' : 'sdp-gestoria-comprimida__motiu'}><Xifra xifra={xifra} visible={visible} /></td>;
  }
  return <td className="sdp-gestoria-comprimida__motiu"><span className="sdp-gestoria-comprimida__sense">Sense moviments</span></td>;
}

/* La Taula de cada mes, amb el net: el que el gràfic no pinta (un net negatiu) també hi és. */
function TaulaFlux({ mesos, visible }) {
  return (
    <Taula titol="Taula · Flux de caixa per mes" densa className="sdp-gestoria-comprimida">
      <thead>
        <tr>
          <th scope="col">Mes</th><th scope="col">Cobertura</th><th scope="col">Entrades</th><th scope="col">Eixides</th><th scope="col">Net</th>
        </tr>
      </thead>
      <tbody>
        {mesos.map((m) => (
          <tr key={m.clau}>
            <th scope="row">{nomDelMes(m)}</th>
            <td>{COBERTURA[m.cobertura]}</td>
            <CellaFlux mes={m} valor={m.entrades} visible={visible} />
            <CellaFlux mes={m} valor={m.eixides} visible={visible} />
            <CellaFlux mes={m} valor={m.net} visible={visible} />
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/**
 * La Cabina d'Avió.
 * @param {{ dades: object, visible?: boolean, onObri?: (idTargeta: string) => void }} p `dades`: les de
 *   dadesDelTauler (amb `cabina` i `avisos`); `visible`: l'ull de la boina; `onObri`: obri la pàgina d'una targeta
 */
export function CabinaAvio({ dades, visible = false, onObri }) {
  const id = useId();
  const { cabina } = dades;
  return (
    <section className="sdp-gestoria-cabina" aria-labelledby={`${id}-cabina`}>
      <h2 id={`${id}-cabina`} className="sdp-gestoria-tauler__titol">Cabina d’Avió</h2>
      <AvisosComptes avisos={dades.avisos ?? []} />
      <p className="sdp-gestoria-cabina__nota">{cabina.referencia}</p>
      {cabina.avisFrescor ? <Alerta to="avis" viva={false} titol="Extractes antics">{cabina.avisFrescor}</Alerta> : null}

      <section className="sdp-gestoria-cabina__bloc" aria-labelledby={`${id}-instruments`}>
        <h3 id={`${id}-instruments`} className="sdp-gestoria-cabina__seccio">Instruments</h3>
        <dl className="sdp-gestoria-cabina__instruments">
          {cabina.instruments.map((instrument) => (
            <Instrument key={instrument.id} instrument={instrument} visible={visible} onObri={onObri} />
          ))}
        </dl>
        {cabina.notes.map((nota) => <p key={nota} className="sdp-gestoria-cabina__nota">{nota}</p>)}
      </section>

      <section className="sdp-gestoria-cabina__bloc" aria-labelledby={`${id}-flux`}>
        <h3 id={`${id}-flux`} className="sdp-gestoria-cabina__seccio">Flux de caixa per mes</h3>
        <p className="sdp-gestoria-cabina__nota">{cabina.notaFlux}</p>
        <GrafiquesFlux mesos={cabina.mesos} maxim={cabina.maxim} visible={visible} />
        {cabina.mesos.length ? <TaulaFlux mesos={cabina.mesos} visible={visible} /> : null}
      </section>

      <section className="sdp-gestoria-cabina__bloc" aria-labelledby={`${id}-venciments`}>
        <h3 id={`${id}-venciments`} className="sdp-gestoria-cabina__seccio">Venciments</h3>
        {cabina.venciments.length ? (
          <div className="sdp-gestoria-cabina__venciments">
            {cabina.venciments.map((v) => (
              <Alerta key={v.clau} to={v.fase === 'oberta' ? 'avis' : 'info'} viva={false} titol={v.titol}>{v.text}</Alerta>
            ))}
          </div>
        ) : (
          <p className="sdp-gestoria-cabina__nota">Sense el dia d’avui no es poden dir els venciments.</p>
        )}
        <p className="sdp-gestoria-cabina__nota">{cabina.notaTerminis}</p>
      </section>
    </section>
  );
}
