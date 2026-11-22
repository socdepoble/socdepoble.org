/**
 * EspecimenAtles2dXarxesMon.jsx — 2. Xarxes del món (Orkut, 10 referents i Nextdoor com a antimodel).
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026 a /disseny?categoria=atles-2d&item=atles-2d-xarxes-mon. És la pestanya
 * «Xarxes del món» de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html: el gràfic d'afinitat
 * (0–10), el cercador i l'ordenació, les fitxes completes («Adoptem en sala neta» / «Rebutgem»,
 * Nextdoor com a anti-model) i la taula d'Orkut peça per peça.
 * Congelació d'Orkut: és estudi. Cap mecànica d'Orkut entra al producte des d'esta pàgina.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camp, CampText, Insignia, Selector, Taula } from '../../../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import { usePropietatsCss } from '../../../../hooks/usePropietatsCss.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { ATLES } from '../dades/atles2dDades.js';
import { PeuAtles, TextFont, nota, plegaPerCercar, textDeCerca } from './atles2dComu.jsx';

/* Sota 5 sobre 10, la fitxa és un anti-model (Nextdoor); la d'Orkut porta el blau fort. */
const LLINDAR_ANTI = 5;
const esAnti = (xarxa) => xarxa.afinitat_sdp_sobre_10 < LLINDAR_ANTI;
const esOrkut = (xarxa) => String(xarxa.id).startsWith('orkut');
const CLASSE_BARRA = Object.freeze({
  normal: 'sdp-atles__grafic-barra',
  orkut: 'sdp-atles__grafic-barra sdp-atles__grafic-barra--orkut',
  anti: 'sdp-atles__grafic-barra sdp-atles__grafic-barra--anti'
});
const DECISIO = Object.freeze({
  si: { to: 'exit', glif: '●', text: 'Adoptem' },
  adaptat: { to: 'avis', glif: '◐', text: 'Adaptem' },
  no: { to: 'error', glif: '○', text: 'No adoptem' }
});
const ORDRES = Object.freeze([{ valor: 'afinitat', etiqueta: 'Per afinitat' }, { valor: 'nom', etiqueta: 'Per nom' }]);

/* v1.2.19 · Gauntlet R2 (L4R2-07) · La llengua de cada eslògan (WCAG 3.1.2, la llengua de les parts), perquè
   VoiceOver no llija l'anglés, el francés o l'alemany amb la veu catalana del document. Les dades no la diuen:
   l'he deduïda llegint els 12 eslògans un per un, i totes són segures (frases senceres, no noms propis). Una
   xarxa nova sense entrada ací no porta lang i hereta el català. La dada no es toca. */
const LLENGUA_ESLOGAN = Object.freeze({
  front_porch_forum: 'en', panneau_pocket: 'fr', intramuros: 'fr', nebenan_de: 'de', eagora: 'es',
  bandomovil_linea_verde: 'es', karrot_oss: 'en', karrot_danggeun: 'en', hylo: 'en', fedivers_hometown_bonfire: 'en',
  orkut_arqueologia: 'es', nextdoor_antimodel: 'en'
});
/* Nebenan porta la traducció catalana entre parèntesis al final: només el tros original canvia de llengua. */
const AMB_TRADUCCIO = new Set(['nebenan_de']);

/** L'eslògan entre cometes, amb la llengua al tros que no és en valencià. */
function Eslogan({ xarxa }) {
  const text = String(xarxa.eslogan_posicionament || '').trim();
  const lang = LLENGUA_ESLOGAN[xarxa.id];
  const obri = AMB_TRADUCCIO.has(xarxa.id) && text.endsWith(')') ? text.lastIndexOf(' (') : -1;
  const original = obri > 0 ? text.slice(0, obri) : text;
  const traduccio = obri > 0 ? text.slice(obri) : null;
  return (
    <p className="sdp-atles__eslogan">
      «{lang ? <span lang={lang}>{original}</span> : original}{traduccio}»
    </p>
  );
}

const perAfinitat = (a, b) => b.afinitat_sdp_sobre_10 - a.afinitat_sdp_sobre_10;
const perNom = (a, b) => a.nom.localeCompare(b.nom, 'ca');
const movimentReduit = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function FilaGrafic({ xarxa, triada, onTria }) {
  const pista = useRef(null);
  usePropietatsCss(pista, { '--atles-fraccio': Math.max(0, Math.min(10, xarxa.afinitat_sdp_sobre_10)) / 10 });
  const classe = esAnti(xarxa) ? CLASSE_BARRA.anti : esOrkut(xarxa) ? CLASSE_BARRA.orkut : CLASSE_BARRA.normal;
  return (
    <li>
      <button type="button" className="sdp-atles__grafic-fila" aria-pressed={triada ? 'true' : 'false'} onClick={() => onTria(xarxa.id)}>
        <span className="sdp-atles__grafic-nom">{xarxa.nom}</span>
        <span ref={pista} className="sdp-atles__grafic-pista" aria-hidden="true"><span className={classe} /></span>
        <span className="sdp-atles__grafic-valor">{nota(xarxa.afinitat_sdp_sobre_10)}<span className="sdp-sr-only"> sobre 10: obri la fitxa</span></span>
      </button>
    </li>
  );
}

function FitxaXarxa({ xarxa, triada, refFitxa }) {
  const camps = [
    ['Mecànica estrella', xarxa.mecanica_estrella],
    ['Com entra la gent', xarxa.model_captacio],
    ['Com es paga', xarxa.model_negoci],
    ['Identitat', xarxa.identitat_i_verificacio],
    ['Moderació', xarxa.moderacio],
    ['Tecnologia observable', xarxa.stack_observable],
    ['Riscos i fracassos', xarxa.fracassos_o_riscos]
  ].filter(([, text]) => text);
  return (
    <li>
      <article ref={refFitxa} className="sdp-atles__fitxa" tabIndex={-1} aria-current={triada ? 'true' : undefined}
        aria-labelledby={`atles-xarxa-${xarxa.id}`}>
        <div className="sdp-atles__cap">
          <div>
            {esAnti(xarxa) ? <span className="sdp-atles__anti">Anti-model</span> : null}
            <h4 id={`atles-xarxa-${xarxa.id}`}>{xarxa.nom}</h4>
            <p className="sdp-atles__suau">{String(xarxa.pais_origen || '').trim()} · {xarxa.categoria}</p>
          </div>
          <span className="sdp-atles__nota">{nota(xarxa.afinitat_sdp_sobre_10)}<span className="sdp-atles__meta"> / 10</span></span>
        </div>
        {xarxa.eslogan_posicionament ? <Eslogan xarxa={xarxa} /> : null}
        <dl className="sdp-atles__dl">
          {camps.map(([etiqueta, text]) => <div key={etiqueta}><dt>{etiqueta}</dt><dd><TextFont text={text} /></dd></div>)}
        </dl>
        <p className="sdp-atles__etiqueta">Adoptem en sala neta</p>
        <ul className="sdp-atles__llista-si">
          {(xarxa.que_adoptar_clean_room || []).map((text, index) => <li key={index}><TextFont text={text} /></li>)}
        </ul>
        <p className="sdp-atles__etiqueta">Rebutgem</p>
        <ul className="sdp-atles__llista-no">
          {(xarxa.que_rebutjar_frontalment || []).map((text, index) => <li key={index}><TextFont text={text} /></li>)}
        </ul>
        {xarxa.url_referencia ? (
          <p className="sdp-atles__mono">
            <a href={xarxa.url_referencia} target="_blank" rel="noopener noreferrer">
              {xarxa.url_referencia.replace(/^https?:\/\//, '')}<span className="sdp-sr-only"> (s’obri en una pestanya nova)</span>
            </a>
          </p>
        ) : null}
      </article>
    </li>
  );
}

export default function EspecimenAtles2dXarxesMon() {
  const arrel = useRef(null);
  const fitxes = useRef(new Map());
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const { xarxes, placa } = ATLES;
  const orkut = placa.orkut || {};
  const [cerca, setCerca] = useState('');
  const [ordre, setOrdre] = useState('afinitat');
  const [triada, setTriada] = useState(null);
  const [salt, setSalt] = useState(0);

  const ordenades = useMemo(() => [...xarxes].sort(perAfinitat), [xarxes]);
  const visibles = useMemo(() => {
    const q = plegaPerCercar(cerca); /* v1.2.19 · Gauntlet R2 (L4R2-03): sense distingir accents. */
    return xarxes
      .filter((xarxa) => !q || textDeCerca(xarxa).includes(q))
      .sort(ordre === 'nom' ? perNom : perAfinitat);
  }, [xarxes, cerca, ordre]);

  /* Un clic al gràfic porta a la fitxa: es pinta sense filtre, s'hi desplaça i rep el focus. */
  useEffect(() => {
    if (!salt || !triada) return;
    const fitxa = fitxes.current.get(triada);
    if (!fitxa) return;
    if (typeof fitxa.scrollIntoView === 'function') fitxa.scrollIntoView({ behavior: movimentReduit() ? 'auto' : 'smooth', block: 'center' });
    fitxa.focus({ preventScroll: true });
  }, [salt, triada]);

  const tria = (id) => {
    setTriada(id);
    setCerca('');
    setSalt((n) => n + 1);
  };
  const refDe = (id) => (node) => {
    if (node) fitxes.current.set(id, node);
    else fitxes.current.delete(id);
  };

  return (
    <div ref={arrel} className="sdp-atles">
      <section className="sdp-atles__bloc">
        <h3 id="atles-xarxes-grafic">Què ens ensenyen les xarxes per a pobles</h3>
        <p>
          {xarxes.length} plataformes estudiades per Gemini, puntuades per la seua afinitat amb Sóc de Poble (sobre 10). Cada
          fitxa diu què adoptem en sala neta i què rebutgem de pla. Nextdoor hi és com a anti-model.
        </p>
        <div className="sdp-atles__fitxa">
          <p className="sdp-atles__etiqueta" id="atles-xarxes-afinitat">Afinitat amb Sóc de Poble (0–10)</p>
          <ol className="sdp-atles__grafic" aria-labelledby="atles-xarxes-afinitat">
            {ordenades.map((xarxa) => <FilaGrafic key={xarxa.id} xarxa={xarxa} triada={xarxa.id === triada} onTria={tria} />)}
          </ol>
          <div className="sdp-atles__grafic-eix" aria-hidden="true">
            <span>{[0, 2, 4, 6, 8, 10].map((n) => <span key={n}>{n}</span>)}</span>
          </div>
        </div>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-xarxes-fitxes">Les {xarxes.length} fitxes</h3>
        <div className="sdp-atles__filtres">
          <Camp etiqueta="Busca">
            <CampText tipus="search" value={cerca} onChange={(event) => setCerca(event.target.value)} placeholder="moderació, butlletí, cooperativa…" />
          </Camp>
          <Camp etiqueta="Ordena">
            <Selector value={ordre} onChange={(event) => setOrdre(event.target.value)} opcions={ORDRES} />
          </Camp>
        </div>
        <p className="sdp-atles__recompte" aria-live="polite">{visibles.length} de {xarxes.length} xarxes</p>
        {visibles.length ? (
          <ul className="sdp-atles__graella sdp-atles__graella--ampla">
            {visibles.map((xarxa) => <FitxaXarxa key={xarxa.id} xarxa={xarxa} triada={xarxa.id === triada} refFitxa={refDe(xarxa.id)} />)}
          </ul>
        ) : (
          <p className="sdp-atles__fitxa">Cap xarxa no diu això. Prova una altra paraula.</p>
        )}
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-xarxes-orkut">Orkut, peça per peça</h3>
        <p><TextFont text={orkut.resum} /></p>
        <Taula titol="Orkut, peça per peça" className="sdp-atles__taula-ampla">
          <thead>
            <tr><th scope="col">Mecànica</th><th scope="col">Què era</th><th scope="col">Lliçó per a Sóc de Poble</th><th scope="col">Risc tòxic</th><th scope="col">Decisió</th></tr>
          </thead>
          <tbody>
            {(orkut.mecaniques || []).map((mecanica, index) => {
              const decisio = DECISIO[mecanica.adoptar] || { to: 'neutre', glif: '·', text: mecanica.adoptar };
              return (
                <tr key={`${index}-${mecanica.nom}`}>
                  <th scope="row"><TextFont text={mecanica.nom} /></th>
                  <td><TextFont text={mecanica.que_era} /></td>
                  <td><TextFont text={mecanica['lliço_per_sdp'] ?? mecanica.llico_per_sdp} /></td>
                  <td><TextFont text={mecanica.risc_toxic} /></td>
                  <td><Insignia to={decisio.to}><span aria-hidden="true">{decisio.glif}</span>{decisio.text}</Insignia></td>
                </tr>
              );
            })}
          </tbody>
        </Taula>
        <p className="sdp-atles__mono">{orkut.carpeta}</p>
      </section>

      <PeuAtles actual="atles-2d-xarxes-mon" />
    </div>
  );
}
