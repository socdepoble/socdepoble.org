/**
 * EspecimenAtles2dMotorEstudis.jsx — 4. Motor d'estudis de mercat (Proposta funcional).
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026 a /disseny?categoria=atles-2d&item=atles-2d-motor-estudis. És la pestanya
 * «Motor d'estudis» de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html: la Fase 1 simulada i la
 * Fase 2 de contrast humà real, el recorregut en quatre passos, els principis ètics, el fonament tècnic que
 * ja existix, les preguntes per al Mestre i la maqueta mòbil (un exemple inventat, i ho diu).
 * És una proposta per a decidir: no hi ha cap línia d'este motor al producte, i esta pàgina no en munta cap.
 */
import { useRef } from 'react';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { ATLES } from '../dades/atles2dDades.js';
import { PeuAtles, TextFont } from './atles2dComu.jsx';

const SUBTITOLS_RESERVA = Object.freeze(['Assaig a la Plaça · Estudi sintètic d’ús i viabilitat', 'Assaig a la Plaça · Contrast humà']);
/* Les preguntes de la maqueta: les decidix el Mestre, no les dades. */
const PREGUNTES_MESTRE = Object.freeze([
  'Qui pot llançar un estudi: qualsevol veí, o només empreses, grups i ajuntaments verificats?',
  'Com es recompensa el contrast humà: voluntari, bons de comerç KM 0 o totes dues coses?',
  'Quin mínim de veïns reals fa falta perquè un informe diga «llum verda»?',
  'Els resultats són privats de qui encarrega l’estudi o es poden publicar al poble?',
  'On s’executen les veus sintètiques: només al Node 0, o també amb un servei extern sense retenció?'
]);

export default function EspecimenAtles2dMotorEstudis() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const { mercat, placa } = ATLES;
  const subtitols = ATLES.mercat_subtitols || SUBTITOLS_RESERVA;
  const encaix = mercat.encaix_arquitectonic_pedra_seca || {};
  /* v1.2.19 · Gauntlet R2 (L4R2-08): el rètol i la xifra diuen el mateix conjunt de rondes, recomptat de la dada.
     Abans el rètol en nomenava cinc a mà («#01–#04 i la Fase 5») i la xifra en comptava sis: la sisena és l'arnés
     v2, que no té veus. Ara es diuen totes, separant les que tenen veus de les que no. */
  const rondes = placa.rondes || [];
  const ambVeus = rondes.filter((ronda) => ronda.num_perfils > 0);
  const senseVeus = rondes.filter((ronda) => !(ronda.num_perfils > 0));
  const llista = (grup) => new Intl.ListFormat('ca', { type: 'conjunction' }).format(grup.map((ronda) => ronda.id));
  return (
    <div ref={arrel} className="sdp-atles">
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-visio">Sóc de Poble com a motor d’estudis de mercat</h3>
        <p className="sdp-atles__proposta" role="note">
          <span aria-hidden="true">✎</span>
          <span>
            <strong>Proposta per a decidir.</strong> No hi ha cap línia d’este motor a <code>src/</code>; la maquinària que ja
            tenim és d’estudi intern.
          </span>
        </p>
        <p><TextFont text={mercat.visio} /></p>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-fases">Dues fases que no es barregen</h3>
        <p>La regla de més pes és la Llei 0: una persona sempre ha de saber si està llegint opinions simulades o respostes de veïns reals.</p>
        <ul className="sdp-atles__graella sdp-atles__graella--ampla">
          <li className="sdp-atles__fitxa sdp-atles__fase--sintetica">
            <p className="sdp-atles__etiqueta">Fase 1 · simulada</p>
            <h4>{subtitols[0]}</h4>
            <p>
              Un panell de 8 a 12 perfils sintètics del món rural avalua la proposta en un minut: preu percebut, frens per a la
              gent gran, si el missatge s’entén en tres segons i dubtes de logística. Torna un semàfor inicial i tres millores.
            </p>
            <p className="sdp-atles__suau">Vora puntejada: es veu que no és gent real.</p>
          </li>
          <li className="sdp-atles__fitxa sdp-atles__fase--humana">
            <p className="sdp-atles__etiqueta">Fase 2 · real</p>
            <h4>{subtitols[1]}</h4>
            <p>
              De 10 a 25 veïns verificats del poble o la comarca, apuntats voluntàriament, contesten quatre preguntes tancades i
              un consell obert des del mòbil, sense comentaris públics.
            </p>
            <p className="sdp-atles__suau">Vora sòlida: respostes de persones.</p>
          </li>
        </ul>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-passos">El recorregut, pas a pas</h3>
        <ol className="sdp-atles__passos">
          {(mercat.flux_ux_en_4_passos || []).map((pas) => (
            <li key={pas.pas ?? pas.titol} className="sdp-atles__fitxa">
              <h4><TextFont text={pas.titol} /></h4>
              <p><TextFont text={pas.descripcio} /></p>
            </li>
          ))}
        </ol>
      </section>

      {/* v1.2.21 · IDEA-319 (ordre del Mestre del 22-11-2026 a les 14:12, captura 261122_1412) · Sense
          .sdp-atles__dos-col: les cinc seccions (principis, encaix, fonament, preguntes i maqueta) fluïxen una davall
          de l'altra a tota l'amplada útil, i la maqueta mòbil queda centrada davall del seu encapçalament. */}
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-principis">Principis que no es negocien</h3>
        <ul>
          {(mercat.principis_etics_innegociables || []).map((text, index) => <li key={index}><TextFont text={text} /></li>)}
        </ul>
      </section>
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-encaix">On encaixaria</h3>
        <dl className="sdp-atles__dl">
          <div><dt>Ubicació</dt><dd><TextFont text={encaix.ubicacio_natural} /></dd></div>
          <div><dt>Dades</dt><dd><TextFont text={encaix.port_de_dades} /></dd></div>
        </dl>
      </section>
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-fonament">Què tenim ja com a fonament</h3>
        <dl className="sdp-atles__dl">
          <div>
            <dt>Arnés v2 (Gemini R32.28)</dt>
            <dd>
              Sonda de geometria amb Chrome, extracció semàntica del DOM i generador del protocol de contrast humà de cinc
              minuts, a <code>_investigacio_ia_de_poble/261121_r32_28_gemini_senior_c2_iaia_i_assaig_placa_v2/assaig_a_la_placa_v2/</code>.
              És eina de laboratori, no producte.
            </dd>
          </div>
          <div>
            <dt>Resumidor del Node 0 (Codex R32.25, a la v1.2.17)</dt>
            <dd><code>tooling/placa/resumDomNode0.mjs</code> resumix una pantalla perquè les veus sintètiques la lligen sense CSS ni dades personals.</dd>
          </div>
          <div>
            <dt>Les rondes de l’Assaig a la Plaça, de {rondes[0]?.id} a {rondes[rondes.length - 1]?.id}</dt>
            <dd>
              {rondes.length} rondes: {ambVeus.length} amb veus ({llista(ambVeus)})
              {senseVeus.length ? ` i ${senseVeus.length} sense cap veu (${llista(senseVeus)})` : null}. En total,{' '}
              {placa.perfils.length} veus i {placa.dolors.length} dolors, que són la prova que el mètode troba coses reals.
            </dd>
          </div>
        </dl>
      </section>
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-preguntes">Preguntes per al Mestre</h3>
        <ul>{PREGUNTES_MESTRE.map((text) => <li key={text}>{text}</li>)}</ul>
      </section>
      <section className="sdp-atles__bloc">
        <h3 id="atles-motor-maqueta">Maqueta mòbil</h3>
        <p className="sdp-atles__etiqueta">Exemple inventat</p>
        <div className="sdp-atles__mobil" role="img" aria-label="Maqueta d’un informe d’estudi de mercat al mòbil, amb dades d’exemple inventades: cistella setmanal de verdura, Fase 1 amb 10 perfils simulats i Fase 2 amb 14 veïns verificats.">
          <div className="sdp-atles__mobil-barra" aria-hidden="true"><span>Sóc de Poble</span><span>Assaig a la Plaça</span></div>
          <div className="sdp-atles__mobil-cos" aria-hidden="true">
            <span className="sdp-atles__mobil-marca">Exemple per a la maqueta · no són dades reals</span>
            <div className="sdp-atles__mobil-targeta">
              <p className="sdp-atles__mobil-titol">Cistella setmanal de verdura</p>
              <div className="sdp-atles__mobil-fila"><span>Cooperativa de l’horta · La Torre de les Maçanes</span></div>
              <div className="sdp-atles__mobil-fila"><span>Preu proposat</span><b>15 € / setmana</b></div>
            </div>
            <div className="sdp-atles__mobil-targeta sdp-atles__mobil-targeta--sint">
              <p className="sdp-atles__mobil-titol">Fase 1 · Estudi sintètic</p>
              <div className="sdp-atles__mobil-fila">
                <span>10 perfils simulats</span>
                <span className="sdp-atles__semafor"><span className="sdp-atles__llum" /><span className="sdp-atles__llum sdp-atles__llum--verd" /><span className="sdp-atles__llum" /></span>
              </div>
              <div className="sdp-atles__mobil-fila"><span>Millora 1</span><b>Repartiment el dissabte</b></div>
              <div className="sdp-atles__mobil-fila"><span>Millora 2</span><b>Pagament en efectiu</b></div>
              <div className="sdp-atles__mobil-fila"><span>Millora 3</span><b>Mitja cistella per a una persona</b></div>
            </div>
            <div className="sdp-atles__mobil-targeta">
              <p className="sdp-atles__mobil-titol">Fase 2 · Contrast humà</p>
              <div className="sdp-atles__mobil-fila"><span>Veïns verificats</span><b>14</b></div>
              <div className="sdp-atles__mobil-fila"><span>La comprarien</span><b>9 de 14</b></div>
              <div className="sdp-atles__mobil-fila"><span>Preu just</span><b>12–15 €</b></div>
              <div className="sdp-atles__mobil-fila"><span>Objecció real</span><b>«Si falla una setmana, què?»</b></div>
            </div>
            <span className="sdp-atles__mobil-boto">Publica la pre-reserva al Mercat</span>
          </div>
        </div>
      </section>

      <PeuAtles actual="atles-2d-motor-estudis" />
    </div>
  );
}
