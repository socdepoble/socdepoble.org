/**
 * EspecimenAtles2dPresentacio.jsx — Atles 2D de Sóc de Poble · Presentació i marc comú.
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026 a /disseny?categoria=atles-2d&item=atles-2d-presentacio. És l'obertura comuna
 * de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html: l'avís de la congelació d'Orkut, les quatre
 * xifres globals, les targetes que porten a les quatre pàgines d'estudi i totes les fonts.
 * Lectura pura: cap mecànica social ni cap escriptura.
 *
 * v1.2.22 · Gauntlet R1 (L3-07) · D-ATLES-MOTOR · L'obertura diu «perfils simulats», com la xifra global i el
 * Motor: els perfils de l'Assaig a la Plaça no són veus d'àudio.
 */
import { useRef } from 'react';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { ATLES, ORIGEN_ATLES } from '../dades/atles2dDades.js';
import {
  GRAVETATS, IDS_PAGINES_ATLES, Llegenda, NotaDatacio, ORDRE_DOLORS, ORDRE_MAPA, PindolaEstat, TargetaPagina, TextFont, Xifra,
  celles, compta, dataDeLesDades, esCorregida, nota, xifresGlobals
} from './atles2dComu.jsx';

const NOMS_FONT = Object.freeze({
  placa: 'El poble virtual',
  matriu: 'El mapa de les 5 entitats',
  xarxes: 'Les xarxes del món',
  mercat: 'El motor d’estudis'
});

/** El detall curt de cada targeta, recomptat de les dades. */
function detallsDeLesPagines() {
  const { placa, xarxes, entitats, mercat } = ATLES;
  const notes = xarxes.map((xarxa) => xarxa.afinitat_sdp_sobre_10).filter(Number.isFinite);
  const totes = celles(entitats);
  return {
    'atles-2d-poble-virtual': `${placa.rondes.length} rondes · ${placa.perfils.length} veïns · ${placa.dolors.length} dolors · ${ATLES.contradiccions.length} discrepàncies`,
    'atles-2d-xarxes-mon': `${xarxes.length} fitxes · afinitat de ${nota(Math.min(...notes))} a ${nota(Math.max(...notes))} · ${(placa.orkut?.mecaniques || []).length} peces d’Orkut`,
    'atles-2d-mapa-entitats': `${entitats.entitats.length} entitats · ${totes.length} cel·les · ${totes.filter(esCorregida).length} corregides · ${(entitats.rutes_reals || []).length} rutes reals`,
    'atles-2d-motor-estudis': `2 fases · ${(mercat.flux_ux_en_4_passos || []).length} passos · ${(mercat.principis_etics_innegociables || []).length} principis · cap línia a src/`
  };
}

export default function EspecimenAtles2dPresentacio() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const { meta, placa } = ATLES;
  const detalls = detallsDeLesPagines();
  const gravetats = compta(placa.dolors, 'severitat');
  const perEstat = compta(placa.dolors, 'estat');
  const perCella = compta(celles(ATLES.entitats), 'estat');
  return (
    <div ref={arrel} className="sdp-atles">
      <section className="sdp-atles__bloc">
        <h3 id="atles-presentacio-obertura">Quatre vistes per a decidir abans de picar codi</h3>
        {/* v1.2.19 · Gauntlet R2 (L4R2-04): la data i la versió de les dades, a la vista i en passat. */}
        <NotaDatacio meta={meta} />
        <p>
          Què ens van dir els perfils simulats de veïns d’«Assaig a la Plaça», què fan les xarxes per a pobles del món, en quin
          estat real tenim les cinc pàgines d’entitat i com podria Sóc de Poble oferir estudis de mercat a qui en necessite.
          Cada vista és una pàgina d’este catàleg, amb els seus filtres.
        </p>
        <p className="sdp-atles__avis" role="note">
          <span aria-hidden="true">⏸</span>
          <span>
            <strong>Orkut continua congelat al codi.</strong> Cap proposta d’este atles no està implementada al producte:
            són pàgines d’estudi i de planificació, sense cap mecànica social nova. Les dades del mapa es van comprovar
            contra el codi de la {meta.versio_codi.split(' ')[0]}.
          </span>
        </p>
        <ul className="sdp-atles__xifres" aria-label="Les quatre xifres de l’Atles">
          {xifresGlobals().map(({ id, n, t, d }) => <Xifra key={id} n={n} t={t} d={d} />)}
        </ul>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-presentacio-pagines">Les quatre pàgines d’estudi</h3>
        <p>Cada targeta obri la seua pàgina dins de Disseny. L’enllaç és de veres: també s’obri en una pestanya nova.</p>
        <ul className="sdp-atles__graella sdp-atles__graella--ampla">
          {IDS_PAGINES_ATLES.slice(1).map((id) => <li key={id}><TargetaPagina id={id} detall={detalls[id]} /></li>)}
        </ul>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-presentacio-estats">Com es lligen els estats</h3>
        <p>Cada estat porta un glif i un nom, a més del color: es llig igual en clar, en fosc, al sol i en blanc i negre.</p>
        <h4>Els dolors del poble virtual</h4>
        <Llegenda recompte={perEstat} ordre={ORDRE_DOLORS} />
        <ul className="sdp-atles__llegenda" aria-label="Dolors per gravetat">
          {GRAVETATS.map((sev) => (
            <li key={sev}><span className={sev === 'P0' ? 'sdp-atles__sev sdp-atles__sev--p0' : 'sdp-atles__sev'}>{sev}</span><b>{gravetats[sev] || 0}</b></li>
          ))}
        </ul>
        <h4>Les cel·les del mapa de les entitats</h4>
        <Llegenda recompte={perCella} ordre={ORDRE_MAPA} />
        <p className="sdp-atles__suau">
          Una cel·la <PindolaEstat estat="a_mitges" /> té una part feta al codi i una part que falta; la nota de cada cel·la
          diu quina, amb l’evidència <code>fitxer:línia</code>.
        </p>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-presentacio-fonts">D’on ixen les dades</h3>
        <ul className="sdp-atles__peu">
          {Object.entries(meta.fonts || {}).map(([clau, text]) => (
            <li key={clau}><strong>{NOMS_FONT[clau] || clau}:</strong> <TextFont text={text} /></li>
          ))}
        </ul>
        <dl className="sdp-atles__dl">
          <div><dt>Fitxer d’origen</dt><dd className="sdp-atles__mono">{ORIGEN_ATLES.fitxer}</dd></div>
          <div><dt>SHA-256</dt><dd className="sdp-atles__mono">{ORIGEN_ATLES.sha256}</dd></div>
          <div><dt>Generat</dt><dd>{dataDeLesDades()} ({ORIGEN_ATLES.bytes.toLocaleString('ca-ES')} B)</dd></div>
          <div><dt>Maqueta</dt><dd className="sdp-atles__mono">{ORIGEN_ATLES.carpeta}{ORIGEN_ATLES.maqueta}</dd></div>
          <div><dt>Matrius</dt><dd>Verificada: <code>atles_2d_matriu_verificada.json</code>. Original de Gemini: <code>MATRIU_2D_ENTITATS_I_XARXES.json</code>.</dd></div>
          <div><dt>Idees</dt><dd>{(meta.idees || []).join(' · ')}</dd></div>
        </dl>
        <details>
          <summary>Les {placa.fonts_llegides.length} fonts llegides per a la vista del poble virtual</summary>
          <ol className="sdp-atles__peu">
            {placa.fonts_llegides.map((font, index) => <li key={`${index}-${font}`} className="sdp-atles__mono">{font}</li>)}
          </ol>
        </details>
        <p className="sdp-atles__suau">
          El detall de les rondes és a <code>atles_2d_placa_assaig.json</code>. Les rutes del disc es mostren relatives a
          «Som de Poble» i les del codi, relatives al repositori: cap pàgina pública no publica el directori de ningú.
        </p>
      </section>
    </div>
  );
}
