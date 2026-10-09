/**
 * VistaAgenda.jsx — l'agenda d'un període a l'estil Google Calendar: una
 * llista agrupada per dia.
 *
 * Fase visual (prompt 261001_0445) · La captura de la vista Agenda del
 * Mestre: només els dies que tenen actes; a l'esquerra de cada dia, el número
 * gran i «oct., dj.» en xicotet (hui, el número en el cercle d'acció des de
 * l'Onada 6); a la
 * dreta, una fila per acte amb el punt del color de la seua font
 * (classeDeFont), l'hora en una columna fixa («Tot el dia» o «HH:MM–HH:MM»,
 * xifres tabulars) i el títol. Un separador fi entre dies i, dins del grup de
 * hui, la línia d'«ara» entre l'últim acte que ja ha començat i el primer que
 * encara no. Les ocurrències surten de la mateixa regla que la resta de vistes
 * (ocurrenciesDeLaLlista): la llista i la graella no poden discrepar.
 *
 * Un acte que travessa diversos dies ix a cada dia que toca, amb el criteri
 * de VistaSetmana (separaFranja): el que dura almenys un dia de paret (de
 * data, o amb hora fins a la mateixa hora de l'endemà o més enllà) diu «Tot
 * el dia» a cada dia, com la seua barra de la franja; el més curt diu les
 * seues hores reals (un ball de 22:00 a 02:00 diu «22:00–02:00» els dos dies,
 * com els seus blocs de la graella).
 *
 * En un contenidor estret la columna de la data passa damunt de les files
 * (flex-wrap al full): és la mateixa llista, d'una sola columna, sense cap
 * media query.
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   desde / fins · Date: el rang semiobert [desde, fins), en dies locals (la
 *     pàgina hi posa el mes, des de hui si és el mes en curs).
 *   avui · Date (marca hui); ara · Date fixa per a la línia (espècimens i
 *     proves); sense, el rellotge (useAra), només si hui és a la llista.
 *   buit · el text sense cap acte en el rang.
 *   nivellTitol · el nivell de l'encapçalament de cada dia (3 per defecte).
 *   titol · nom de la regió; locale; className.
 *
 * Cada dia és un encapçalament amb la data llarga per al lector (la curta es
 * veu, aria-hidden) i una llista ordenada que s'hi referix (aria-labelledby).
 *
 * ENLLAÇ DE L'ESDEVENIMENT (Onada 6, prompt 261009_0230, punt 1; pla de
 * l'Onada 5, tasca 16) · rutaDeLEsdeveniment · (esd) => string | null i
 * LinkComponent (per defecte 'a'), com a VistaMes: amb ruta, el títol de la
 * fila és un enllaç a la pàgina de la publicació (.sdp-cal-enllac) i el seu
 * ::after cobrix la fila. L'Agenda no tria cap dia: en pantalla tàctil
 * (@media (pointer: coarse)) cada fila creix fins a --sdp-touch i el toc és
 * de l'enllaç, com a Google; amb ratolí, la fila de sempre. Sense
 * rutaDeLEsdeveniment, les files no són interactives (els enllaços viuen a
 * les targetes de davall) i el DOM és el de sempre.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { Fragment, useId, useMemo } from 'react';
import { DIES_CURTS, horaDe } from '../../../utils/calendari.js';
import { classeDeFont, ocurrenciaCobrix, ocurrenciesDeLaLlista, separaFranja } from '../../../utils/disposicioCalendari.js';
import { clauDeData, diaDeLaSetmana, sumaDies } from '../../../utils/periodes.js';
import { useAra } from '../../../hooks/useAra.js';
// Onada 6 · L'enllaç d'un esdeveniment, el mateix de les tres vistes.
import { EnllacDeLEsdeveniment } from './VistaMes.jsx';

const TOT_EL_DIA = 'Tot el dia';
const NIVELLS = Object.freeze([2, 3, 4, 5, 6]);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dataDelPeriode = (data, locale) => data.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
/* «oct., dj.»: el mes curt de la llengua i el dia curt de la resta de vistes (DIES_CURTS). */
const dataCurta = (data, locale) => `${data.toLocaleDateString(locale, { month: 'short' })}, ${DIES_CURTS[diaDeLaSetmana(data)]}`;

const compara = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
/* L'ordre d'un dia: primer el que dura tot el dia, després per l'hora
   d'inici, el títol (en català) i, per acabar, la clau de l'ocurrència. */
const ordenaFiles = (a, b) => (b.totElDia - a.totElDia)
  || a.inici - b.inici
  || a.titol.localeCompare(b.titol, 'ca')
  || compara(a.clau, b.clau);

/* Una fila del dia: «Tot el dia» si l'acte va a la franja de VistaSetmana
   (de data, o de 24 h de paret o més, que és també tot acte que cobrix el dia
   sencer); si no, les seues hores reals, o l'hora sola si no té durada. Un
   acte de 25 h que comença a les 22:00 no pot dir «22:00–23:00» dos dies. */
function filaDelDia(oc) {
  const totElDia = separaFranja(oc) === 'franja';
  const inici = horaDe(new Date(oc.inici));
  const hora = oc.fi === oc.inici ? inici : `${inici}–${horaDe(new Date(oc.fi))}`;
  return { clau: oc.clau, esd: oc.esd, titol: oc.esd.titol, inici: oc.inici, totElDia, hora: totElDia ? TOT_EL_DIA : hora };
}

/* Els dies del rang que tenen algun acte: [{ clau, data, files }]. */
function diesAmbActes(ocurrencies, desde, fins) {
  const dies = [];
  for (let dia = sumaDies(desde, 0); dia < fins; dia = sumaDies(dia, 1)) {
    const clau = clauDeData(dia);
    const files = ocurrencies.filter((oc) => ocurrenciaCobrix(oc, clau)).map(filaDelDia).sort(ordenaFiles);
    if (files.length) dies.push({ clau, data: dia, files });
  }
  return dies;
}

/* On va la línia d'«ara» dins del dia: davant del primer acte amb hora que
   encara no ha començat (els de tot el dia i els que ja corren, damunt). */
function posicioDeLaLinia(files, instant) {
  const i = files.findIndex((fila) => !fila.totElDia && fila.inici > instant);
  return i < 0 ? files.length : i;
}

const LiniaAra = () => <li className="sdp-cal-agenda__ara" aria-hidden="true" />;

export function VistaAgenda({
  esdeveniments, desde, fins, avui = new Date(), ara = null, buit = 'Cap acte en este període.',
  nivellTitol = 3, titol, locale, className, rutaDeLEsdeveniment, LinkComponent = 'a'
}) {
  const idBase = useId();
  // Números primitius per a les dependències: un Date nou a cada pintada no recalcula res.
  const [tDesde, tFins] = [desde.getTime(), fins.getTime()];
  const { ocurrencies, retallat } = useMemo(
    () => ocurrenciesDeLaLlista(esdeveniments, new Date(tDesde), new Date(tFins)),
    [esdeveniments, tDesde, tFins]
  );
  const dies = useMemo(() => diesAmbActes(ocurrencies, new Date(tDesde), new Date(tFins)), [ocurrencies, tDesde, tFins]);
  const hui = clauDeData(avui);
  const araViu = useAra({ actiu: ara == null && dies.some((dia) => dia.clau === hui) });
  const instant = ara ?? araViu;
  const diaAra = instant instanceof Date && !Number.isNaN(instant.getTime()) ? clauDeData(instant) : null;
  const Titol = `h${NIVELLS.includes(nivellTitol) ? nivellTitol : 3}`;
  const classe = ['sdp-cal-agenda', className].filter(Boolean).join(' ');
  const nom = titol ?? `Agenda del ${dataDelPeriode(new Date(tDesde), locale)} al ${dataDelPeriode(sumaDies(new Date(tFins), -1), locale)}`;

  return (
    <section className={classe} aria-label={nom}>
      {dies.length ? (
        <ol className="sdp-cal-agenda__dies">
          {dies.map(({ clau, data, files }) => {
            const esHui = clau === hui;
            const idDia = `${idBase}-${clau}`;
            const linia = clau === diaAra ? posicioDeLaLinia(files, instant.getTime()) : -1;
            return (
              <li key={clau} className="sdp-cal-agenda__dia" aria-current={esHui ? 'date' : undefined}>
                <Titol className="sdp-cal-agenda__cap" id={idDia}>
                  <span className="sdp-cal-agenda__numero" aria-hidden="true">{data.getDate()}</span>
                  <span className="sdp-cal-agenda__data" aria-hidden="true">{dataCurta(data, locale)}</span>
                  <span className="sdp-sr-only">{`${dataLlarga(data, locale)}${esHui ? ' (hui)' : ''}`}</span>
                </Titol>
                <ol className="sdp-cal-agenda__actes" aria-labelledby={idDia}>
                  {files.map((fila, i) => {
                    const ruta = rutaDeLEsdeveniment?.(fila.esd) ?? null;
                    return (
                      <Fragment key={fila.clau}>
                        {i === linia ? <LiniaAra /> : null}
                        <li className={`sdp-cal-agenda__acte ${classeDeFont(fila.esd)}${ruta ? ' sdp-cal-agenda__acte--enllac' : ''}`}>
                          <span className="sdp-cal-agenda__punt" aria-hidden="true" />
                          <span className="sdp-cal-agenda__hora">{fila.hora}</span>{' '}
                          <span className="sdp-cal-agenda__titol">
                            {ruta ? <EnllacDeLEsdeveniment ruta={ruta} LinkComponent={LinkComponent}>{fila.titol}</EnllacDeLEsdeveniment> : fila.titol}
                          </span>
                        </li>
                      </Fragment>
                    );
                  })}
                  {linia === files.length ? <LiniaAra /> : null}
                </ol>
              </li>
            );
          })}
        </ol>
      ) : <p className="sdp-cal-agenda__buit">{buit}</p>}
      {retallat ? <p>Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.</p> : null}
    </section>
  );
}
