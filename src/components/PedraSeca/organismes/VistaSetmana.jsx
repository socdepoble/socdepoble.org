/**
 * VistaSetmana.jsx — la setmana de calendari a l'estil Google Calendar.
 *
 * T10 (ordre del Mestre, 261001) · Set dies de dilluns a diumenge: dalt, la
 * capçalera de cada dia; davall, la franja de tot el dia (barres per carrils)
 * i la graella d'hores amb cada acte posicionat pel seu minut d'inici i de fi,
 * en columnes quan se solapen (utils/disposicioCalendari.js). La línia d'«ara»
 * només ix la setmana de hui i baixa cada minut (useAra).
 *
 * Fase visual (prompt 261001_0445) · La pintura de les captures del Mestre
 * (setmana clara i fosca, vista dia), amb tokens de Pedra Seca: capçalera amb
 * l'abreviatura xicoteta i el número gran (hui, en el cercle d'acció des de
 * l'Onada 6; el triat, amb el fons i la vora d'acció), etiquetes HH:00 centrades sobre la línia de cada hora
 * en punt (la primera no es rotula), barres i blocs amb el color de la seua
 * font (classeDeFont) i vora d'inici, i la línia d'«ara» amb un punt. Un bloc
 * de menys de 50 minuts visibles (formaDelBloc; 54 en densitat compacta) és
 * una sola línia «HH:MM Títol»; els altres diuen el títol (fins a tres línies)
 * i l'interval, que mai es parteix. Un acte massa tardà per a fer l'alçada
 * mínima abans de mitjanit es pinta pujat (encaixaFinalDelDia), amb l'hora
 * real. El rang d'hores és dinàmic (rangHorari): de les 7 a les 22, estés fins
 * on hi haja actes o la línia d'«ara». Sense scroll propi: la graella creix
 * dins del visor.
 *
 * MODES. Decidix l'amplada del CONTENIDOR, no la del viewport
 * (useAmpladaContenidor, en em del node: dins d'un amfitrió el rem és alié).
 * Per davall de 41,5em, la TIRA del mòbil: set botons de dia enganxosos dalt i
 * la graella d'un sol dia (diaDeLaTira: el triat si és d'esta setmana, si no
 * hui, si no el dilluns); el dia mostrat està premut i tornar-lo a tocar no el
 * lleva. A partir d'ací, les set columnes. Amb amplada desconeguda (jsdom),
 * set columnes: el mode de sempre.
 *
 * DENSITAT. 'responsiva' (per defecte) i 'normal' pinten l'hora de 3rem.
 * 'compacta' la fa més baixa i lleva farciment, però només amb un punter fi
 * (ratolí): en pantalla tàctil es queda com la normal. La forma dels blocs
 * seguix els llindars de la densitat (formaDelBloc).
 *
 * Posicionament sense `style` en JSX: cada bloc escriu les seues propietats
 * (--cal-inici, --cal-fi, --cal-col, --cal-cols,
 * --cal-amplada; a la franja, les línies de graella --cal-col-inici,
 * --cal-col-fi i --cal-carril; a la graella, --cal-hora-inicial i
 * --cal-hores) des d'una ref (usePropietatsCss), i el bloc
 * SDP:calendari-vistes de modules.css les llig amb calc().
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   dilluns · Date de qualsevol dia de la setmana que es pinta.
 *   diaTriat / onTriaDia · 'AAAA-MM-DD' | null / (clau) => void. Amb
 *     onTriaDia, cada capçalera és un botó amb aria-pressed i un nom amb la
 *     data llarga, el recompte i els títols; sense, és quieta (en la tira, on
 *     no es podria canviar de dia, els botons porten el dia ells mateixos).
 *     Amb dia triable, clicar la columna d'un dia fora de l'enllaç d'un
 *     esdeveniment (o tocar-hi un bloc, en tàctil) també el tria, i una barra
 *     de la franja tria el seu primer dia: és el quadre del dia del Mes. El
 *     dia triat no es lleva així. És una drecera del punter: al teclat, la
 *     capçalera.
 *   densitat · 'responsiva' | 'normal' | 'compacta' ('responsiva').
 *   recompte · (n) => text del nom del dia («1 esdeveniment»).
 *   minimMinuts · l'alçada mínima d'un acte sense fi (30 per defecte).
 *   avui · Date (marca hui); ara · Date fixa per a la línia (espècimens i
 *     proves); sense, el rellotge.
 *   titol · nom de la regió; locale; className.
 *
 * Cada dia és una llista ordenada amb el nom del dia, i cada bloc diu l'hora i
 * el títol (en este ordre per al lector, encara que a la vista el títol vaja
 * primer).
 *
 * ENLLAÇ DE L'ESDEVENIMENT (Onada 6, prompt 261009_0230, punt 1; pla de
 * l'Onada 5, tasca 16) · rutaDeLEsdeveniment · (esd) => string | null i
 * LinkComponent (per defecte 'a'), com a VistaMes: amb ruta, el títol de cada
 * bloc i de cada barra de la franja és un enllaç a la pàgina de la publicació
 * (.sdp-cal-enllac), el seu ::after cobrix la peça i el full només el fa
 * clicable amb ratolí (@media (pointer: fine)): en tàctil el toc passa a la
 * columna o a la barra, que trien el dia. Fora de la capa aria-hidden del
 * mes, el teclat hi arriba. Sense rutaDeLEsdeveniment, els blocs no porten
 * enllaç (els enllaços viuen a les targetes de davall) i el DOM és el de
 * sempre.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { DIES_CURTS, DIES_LLARGS, dosDigits, horaDe } from '../../../utils/calendari.js';
import {
  classeDeFont, diaDeLaTira, disposaSetmana, encaixaFinalDelDia, formaDelBloc, ocurrenciesDeLaLlista, posicioAra, rangHorari
} from '../../../utils/disposicioCalendari.js';
import { clauDeData, diesDeLaSetmana, rangDeLaSetmana } from '../../../utils/periodes.js';
import { esEstret, useAmpladaContenidor } from '../../../hooks/useAmpladaContenidor.js';
import { useAra } from '../../../hooks/useAra.js';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
// Onada 6 · L'enllaç d'un esdeveniment, el mateix de les tres vistes.
import { EnllacDeLEsdeveniment } from './VistaMes.jsx';

/* Per davall d'esta amplada (en em del contenidor) no caben set columnes de
   5,5em més el marge de les hores: la tira d'un dia. */
const LLINDAR_TIRA_EM = 41.5;
const recompteEsdeveniments = (n) => (n === 1 ? '1 esdeveniment' : `${n} esdeveniments`);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* Un bloc de la graella. L'hora que es llig és la real, no la visible:
   «10:00–11:30», o «10:00» si no té durada; un acte que passa de mitjanit diu
   les dos hores. Un bloc curt només mostra l'inici, i la fi queda per al
   lector (sdp-sr-only): el text sencer és el mateix en totes les formes. */
function BlocSetmana({ disposat, densitat, ruta = null, LinkComponent }) {
  const ref = useRef(null);
  const { segment, columna, columnes, amplada, iniciVisualMin, fiVisualMin } = disposat;
  usePropietatsCss(ref, {
    '--cal-inici': iniciVisualMin, '--cal-fi': fiVisualMin,
    '--cal-col': columna, '--cal-cols': columnes, '--cal-amplada': amplada
  });
  const { ocurrencia } = segment;
  const forma = formaDelBloc(fiVisualMin - iniciVisualMin, { densitat });
  const fi = ocurrencia.fi === ocurrencia.inici ? '' : `–${horaDe(new Date(ocurrencia.fi))}`;
  const classe = [
    'sdp-cal-setmana__bloc', forma !== 'llarg' && `sdp-cal-setmana__bloc--${forma}`, classeDeFont(ocurrencia.esd)
  ].filter(Boolean).join(' ');
  return (
    <li ref={ref} className={classe}>
      <span className="sdp-cal-setmana__quan">
        {horaDe(new Date(ocurrencia.inici))}
        {fi && forma === 'curt' ? <span className="sdp-sr-only">{fi}</span> : fi}
      </span>{' '}
      <span className="sdp-cal-setmana__titol">
        {ruta ? <EnllacDeLEsdeveniment ruta={ruta} LinkComponent={LinkComponent}>{ocurrencia.esd.titol}</EnllacDeLEsdeveniment> : ocurrencia.esd.titol}
      </span>
    </li>
  );
}

/* Una barra de la franja de tot el dia: les línies de graella són 1-based.
   onClick · tocar-la tria el seu primer dia de la setmana (vegeu
   triaDesDeLaGraella). */
function BarraDeLaFranja({ peca, ruta = null, LinkComponent, onClick }) {
  const ref = useRef(null);
  usePropietatsCss(ref, { '--cal-col-inici': peca.colInici + 1, '--cal-col-fi': peca.colFi + 1, '--cal-carril': peca.carril + 1 });
  const { esd } = peca.segment.ocurrencia;
  const classe = [
    'sdp-cal-barra', classeDeFont(esd), peca.continuaAbans && 'sdp-cal-barra--abans', peca.continuaDespres && 'sdp-cal-barra--despres',
    ruta && 'sdp-cal-barra--enllac'
  ].filter(Boolean).join(' ');
  return (
    <li ref={ref} className={classe} onClick={onClick}>
      {ruta ? <EnllacDeLEsdeveniment ruta={ruta} LinkComponent={LinkComponent}>{esd.titol}</EnllacDeLEsdeveniment> : esd.titol}
    </li>
  );
}

function LiniaAra({ minut }) {
  const ref = useRef(null);
  usePropietatsCss(ref, { '--cal-minut': minut });
  return <div ref={ref} className="sdp-cal-setmana__ara" aria-hidden="true" />;
}

export function VistaSetmana({
  esdeveniments, dilluns, avui = new Date(), ara = null, diaTriat = null, onTriaDia,
  recompte = recompteEsdeveniments, minimMinuts = 30, densitat = 'responsiva', titol, locale, className,
  rutaDeLEsdeveniment, LinkComponent = 'a'
}) {
  const rutaDe = (esd) => rutaDeLEsdeveniment?.(esd) ?? null;
  const idFranja = useId();
  const arrel = useRef(null);
  const graella = useRef(null);
  const tira = esEstret(useAmpladaContenidor(arrel), LLINDAR_TIRA_EM);
  // Sense onTriaDia, la tira porta el dia ella mateixa: amb un sol dia a la
  // vista, els altres sis han de continuar sent abastables.
  const [diaPropi, setDiaPropi] = useState(null);
  const triat = onTriaDia ? diaTriat : diaPropi;

  const instant = dilluns.getTime();
  const dies = useMemo(() => diesDeLaSetmana(new Date(instant)), [instant]);
  const { ocurrencies, retallat } = useMemo(() => {
    const { desde, fins } = rangDeLaSetmana(new Date(instant));
    return ocurrenciesDeLaLlista(esdeveniments, desde, fins);
  }, [esdeveniments, instant]);
  const disposicio = useMemo(() => disposaSetmana(ocurrencies, dies, { minimMinuts }), [ocurrencies, dies, minimMinuts]);
  // Cada dia, amb els actes del final encaixats abans de la mitjanit (iniciVisualMin).
  const perDia = useMemo(
    () => new Map([...disposicio.perDia].map(([clau, disposats]) => [clau, encaixaFinalDelDia(disposats, { minimMinuts })])),
    [disposicio, minimMinuts]
  );
  const hui = clauDeData(avui);
  const araViu = useAra({ actiu: ara == null && dies.some((dia) => dia.clau === hui) });
  const posicio = posicioAra(ara ?? araViu, dies);
  const minutAra = posicio?.minut ?? null;

  /* El rang d'hores és el de TOTA la setmana, també en la tira: canviar de
     dia no fa botar l'alçada de la graella. */
  const { horaInicial, horaFinal } = useMemo(
    () => rangHorari(perDia, { minuts: minutAra == null ? [] : [minutAra] }),
    [perDia, minutAra]
  );
  usePropietatsCss(graella, { '--cal-hora-inicial': horaInicial, '--cal-hores': horaFinal - horaInicial });
  const hores = Array.from({ length: horaFinal - horaInicial }, (_, i) => horaInicial + i);

  /* La tira pinta un sol dia; la seua franja es disposa a part (una columna,
     amb les barres obertes pel costat on l'acte continua). */
  const clauTira = tira ? diaDeLaTira(dies, triat, hui) : null;
  const diesGraella = useMemo(() => (clauTira ? dies.filter((dia) => dia.clau === clauTira) : dies), [dies, clauTira]);
  const franja = useMemo(
    () => (clauTira ? disposaSetmana(ocurrencies, diesGraella, { minimMinuts }).franja : disposicio.franja),
    [clauTira, ocurrencies, diesGraella, minimMinuts, disposicio]
  );

  const triable = Boolean(onTriaDia) || tira;
  const tria = (clau) => {
    if (clau === clauTira && clau === triat) return; // a la tira, el dia mostrat no es lleva
    if (onTriaDia) onTriaDia(clau);
    else setDiaPropi(clau);
  };
  /* Onada 6 (revisió del front calendari) · El quadre del dia de la setmana és
     la seua columna: clicar-la fora de l'enllaç d'un esdeveniment, o tocar un
     bloc o una barra en pantalla tàctil (on l'enllaç no rep el toc: les peces
     no arriben a --sdp-touch), tria el dia, com el quadre del Mes, i les
     targetes de davall obrin la publicació. Una barra tria el seu primer dia
     de la setmana. El dia que ja està triat no es lleva (això és cosa de la
     capçalera); el clic a l'enllaç és de l'enllaç. */
  const triaDesDeLaGraella = (event, clau) => {
    if (!clau || clau === triat || event.target.closest?.('a')) return;
    tria(clau);
  };
  const clicDelDia = (clau) => (triable ? (event) => triaDesDeLaGraella(event, clau) : undefined);
  const classe = [
    'sdp-cal-setmana', tira && 'sdp-cal-setmana--tira', densitat === 'compacta' && 'sdp-cal-setmana--compacta', className
  ].filter(Boolean).join(' ');

  return (
    <section ref={arrel} className={classe} aria-label={titol ?? `Setmana del ${dataLlarga(dies[0].data, locale)}`}>
      <ol className="sdp-cal-setmana__capcal">
        {dies.map((dia, i) => {
          const delDia = disposicio.delDia[i];
          const contingut = (
            <>
              <abbr className="sdp-cal-dia__nom" title={DIES_LLARGS[i]}>{DIES_CURTS[i]}</abbr>
              <span className="sdp-cal-dia__numero">{dia.data.getDate()}</span>
              {/* A la tira no es veuen els altres dies: un punt diu quins tenen actes. */}
              {tira ? <span className={delDia.length ? 'sdp-cal-dia__punt sdp-cal-dia__punt--ple' : 'sdp-cal-dia__punt'} aria-hidden="true" /> : null}
            </>
          );
          return (
            <li key={dia.clau} className="sdp-cal-setmana__cap">
              {triable ? (
                <button type="button" className="sdp-cal-dia" aria-pressed={tira ? dia.clau === clauTira : triat === dia.clau}
                  aria-current={dia.clau === hui ? 'date' : undefined}
                  aria-label={`${dataLlarga(dia.data, locale)} · ${recompte(delDia.length)}${delDia.length ? `: ${delDia.map((esd) => esd.titol).join(', ')}` : ''}`}
                  onClick={() => tria(dia.clau)}>
                  {contingut}
                </button>
              ) : <span className="sdp-cal-dia" aria-current={dia.clau === hui ? 'date' : undefined}>{contingut}</span>}
            </li>
          );
        })}
      </ol>

      <div className="sdp-cal-setmana__franja">
        <p className="sdp-cal-setmana__etiqueta" id={idFranja}>Tot el dia</p>
        <ol className="sdp-cal-setmana__barres" aria-labelledby={idFranja}>
          {franja.peces.map((peca) => (
            <BarraDeLaFranja key={`${peca.segment.ocurrencia.clau}·${peca.colInici}`} peca={peca}
              ruta={rutaDe(peca.segment.ocurrencia.esd)} LinkComponent={LinkComponent} onClick={clicDelDia(diesGraella[peca.colInici]?.clau)} />
          ))}
        </ol>
      </div>

      <div ref={graella} className="sdp-cal-setmana__graella">
        <ol className="sdp-cal-setmana__hores" aria-hidden="true">
          {hores.map((hora, i) => (
            <li key={hora} className="sdp-cal-setmana__hora">
              {i > 0 ? <span className="sdp-cal-setmana__rotul">{`${dosDigits(hora)}:00`}</span> : null}
            </li>
          ))}
        </ol>
        {diesGraella.map((dia) => (
          <div key={dia.clau} className="sdp-cal-setmana__columna" onClick={clicDelDia(dia.clau)}>
            <ol className="sdp-cal-setmana__blocs" aria-label={dataLlarga(dia.data, locale)}>
              {perDia.get(dia.clau).map((disposat) => (
                <BlocSetmana key={disposat.segment.ocurrencia.clau} disposat={disposat} densitat={densitat}
                  ruta={rutaDe(disposat.segment.ocurrencia.esd)} LinkComponent={LinkComponent} />
              ))}
            </ol>
            {posicio?.clau === dia.clau ? <LiniaAra minut={posicio.minut} /> : null}
          </div>
        ))}
      </div>
      {retallat ? <p className="sdp-cal-setmana__avis">Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.</p> : null}
    </section>
  );
}
