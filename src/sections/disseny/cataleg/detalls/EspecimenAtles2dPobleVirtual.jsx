/**
 * EspecimenAtles2dPobleVirtual.jsx — 1. El poble virtual (Assaig a la Plaça).
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026 a /disseny?categoria=atles-2d&item=atles-2d-poble-virtual. És la pestanya
 * «El poble virtual» de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html: les rondes, els perfils
 * simulats de veïns amb selector, tots els dolors amb els cinc filtres (estat, gravetat, ronda, veí i cerca
 * lliure), les mètriques i les discrepàncies entre fonts (Llei 0).
 * Lectura pura: els filtres només canvien què es veu; res no s'escriu enlloc.
 *
 * v1.2.22 · Gauntlet R1 (L3-07) · D-ATLES-MOTOR · El text propi de la pàgina diu «perfils simulats», com el
 * Motor i la xifra de la Presentació, perquè «veus» es confonia amb l'àudio. Les conclusions i els mètodes de
 * les rondes són text de l'origen i no es reescriuen: una nota diu què volen dir les «veus» que hi apareixen.
 */
import { useMemo, useRef, useState } from 'react';
import { Boto, Camp, CampText, Fila, Pila, PillToggle, Selector, Taula } from '../../../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { ATLES } from '../dades/atles2dDades.js';
import {
  BarraApilada, GLIF_ESTAT, GRAVETATS, Llegenda, NOMS_ESTAT, NotaDatacio, ORDRE_DOLORS, PeuAtles, PindolaEstat, TextFont, compta,
  dataDeLaFotografia, plegaPerCercar
} from './atles2dComu.jsx';

const FILTRE_BUIT = Object.freeze({ estat: '', sev: '', ronda: '', perfil: '', q: '' });
const ORDRE_SEV = Object.freeze({ P0: 0, P1: 1, P2: 2, P3: 3 });
const CLASSE_SEV = Object.freeze({ P0: 'sdp-atles__sev sdp-atles__sev--p0' });

/** Els dolors que deixen passar els filtres, de més greu a menys i, dins de la gravetat, per id.
    v1.2.19 · Gauntlet R2 (L4R2-03): la cerca no distingix accents: «sessio» troba «sessió». */
function filtraDolors(dolors, filtre) {
  const q = plegaPerCercar(filtre.q);
  return dolors
    .filter((dolor) => {
      if (filtre.estat && dolor.estat !== filtre.estat) return false;
      if (filtre.sev && dolor.severitat !== filtre.sev) return false;
      if (filtre.ronda && dolor.ronda !== filtre.ronda) return false;
      if (filtre.perfil && !(dolor.perfils || []).includes(filtre.perfil)) return false;
      if (q) {
        const tot = plegaPerCercar([dolor.titol, dolor.descripcio, dolor.superficie, dolor.nota, dolor.versio_o_kit, dolor.id].join(' '));
        if (!tot.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => ((ORDRE_SEV[a.severitat] ?? 9) - (ORDRE_SEV[b.severitat] ?? 9)) || String(a.id).localeCompare(String(b.id)));
}

const movimentReduit = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function FitxaDolor({ dolor, nomsDe }) {
  const noms = (dolor.perfils || []).map(nomsDe).join(', ');
  return (
    <article className="sdp-atles__fitxa">
      <Fila gap={2}>
        <span className={CLASSE_SEV[dolor.severitat] || 'sdp-atles__sev'}>{dolor.severitat}</span>
        <PindolaEstat estat={dolor.estat} />
        <span className="sdp-atles__meta">{dolor.id} · {dolor.ronda}</span>
      </Fila>
      <h4><TextFont text={dolor.titol} /></h4>
      <p><TextFont text={dolor.descripcio} /></p>
      <dl className="sdp-atles__dl">
        {dolor.superficie ? <div><dt>On</dt><dd><code>{dolor.superficie}</code></dd></div> : null}
        {noms ? <div><dt>Qui</dt><dd>{noms}</dd></div> : null}
        {dolor.versio_o_kit ? <div><dt>Versió o kit</dt><dd><TextFont text={dolor.versio_o_kit} /></dd></div> : null}
        {dolor.nota ? <div><dt>Nota</dt><dd><TextFont text={dolor.nota} /></dd></div> : null}
        {dolor.evidencia ? <div><dt>Evidència</dt><dd className="sdp-atles__mono">{dolor.evidencia}</dd></div> : null}
      </dl>
    </article>
  );
}

export default function EspecimenAtles2dPobleVirtual() {
  const arrel = useRef(null);
  const blocDolors = useRef(null);
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const { placa, contradiccions } = ATLES;
  const [filtre, setFiltre] = useState(FILTRE_BUIT);
  const canvia = (camp, valor) => setFiltre((previ) => ({ ...previ, [camp]: valor }));

  const perId = useMemo(() => new Map(placa.perfils.map((perfil) => [perfil.id, perfil])), [placa.perfils]);
  const nomsDe = (id) => perId.get(id)?.nom || id;
  const perEstat = compta(placa.dolors, 'estat');
  const perGravetat = compta(placa.dolors, 'severitat');
  const p0 = placa.dolors.filter((dolor) => dolor.severitat === 'P0');
  const p0Resolts = p0.filter((dolor) => dolor.estat === 'resolt').length;
  const visibles = useMemo(() => filtraDolors(placa.dolors, filtre), [placa.dolors, filtre]);
  const dolorsDe = (id) => placa.dolors.filter((dolor) => (dolor.perfils || []).includes(id)).length;

  /* «Vore els seus dolors (n)» compta tots els del veí: per a ensenyar-ne n, la resta de filtres es lleva. */
  const veureDolorsDe = (id) => {
    setFiltre({ ...FILTRE_BUIT, perfil: id });
    const bloc = blocDolors.current;
    if (bloc && typeof bloc.scrollIntoView === 'function') bloc.scrollIntoView({ behavior: movimentReduit() ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div ref={arrel} className="sdp-atles">
      <section className="sdp-atles__bloc">
        <h3 id="atles-placa-resum">Què va dir el poble virtual</h3>
        <p>
          «Assaig a la Plaça» és el nostre mètode d’estudi: primer un <strong>estudi sintètic d’ús i viabilitat</strong> amb
          veïns simulats per les IA, després el <strong>contrast humà</strong> amb veïns reals. Ací hi ha totes les rondes, el
          que hi van dir els perfils simulats i com estava cada dolor el {dataDeLaFotografia()}.
        </p>
        {/* v1.2.19 · Gauntlet R2 (L4R2-04): l'estat dels dolors és el del dia de les dades, no el d'ara. */}
        <NotaDatacio />
        <div className="sdp-atles__fitxa">
          <p className="sdp-atles__etiqueta">Estat dels {placa.dolors.length} dolors</p>
          <BarraApilada recompte={perEstat} ordre={ORDRE_DOLORS} etiqueta="Dolors per estat" />
          <Llegenda recompte={perEstat} ordre={ORDRE_DOLORS} />
          <ul className="sdp-atles__llegenda" aria-label="Dolors per gravetat">
            {GRAVETATS.map((sev) => (
              <li key={sev}><span className={CLASSE_SEV[sev] || 'sdp-atles__sev'}>{sev}</span><b>{perGravetat[sev] || 0}</b></li>
            ))}
          </ul>
          <p>
            {p0Resolts === 0 ? `Cap dels ${p0.length} P0 no està resolt` : `${p0Resolts} dels ${p0.length} P0 estan resolts`}:{' '}
            {p0.map((dolor) => `${dolor.id} (${NOMS_ESTAT[dolor.estat] || dolor.estat})`).join(', ')}.
          </p>
        </div>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-placa-rondes">Les {placa.rondes.length} rondes, en ordre</h3>
        <p className="sdp-atles__suau">
          Les conclusions i els mètodes de cada ronda són el text de l’origen: quan hi diuen «veus», «veus sintètiques» o
          «veïns sintètics», volen dir els perfils simulats de veïns, no cap veu d’àudio.
        </p>
        <ol className="sdp-atles__graella">
          {placa.rondes.map((ronda) => (
            <li key={ronda.id} className="sdp-atles__fitxa">
              <div className="sdp-atles__cap">
                <span className="sdp-atles__id">{ronda.id}</span>
                <span className="sdp-atles__meta">{ronda.data}</span>
              </div>
              <h4><TextFont text={ronda.titol} /></h4>
              <p><strong>{ronda.autor_ia}</strong> · {ronda.num_perfils ? `${ronda.num_perfils} perfils simulats` : 'sense perfils simulats'}</p>
              <p><TextFont text={ronda.conclusio} /></p>
              <details>
                <summary>Mètode i carpeta</summary>
                <p><TextFont text={ronda.metode} /></p>
                <p className="sdp-atles__mono">{ronda.carpeta}</p>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="sdp-atles__bloc">
        {/* v1.2.22 · Gauntlet R2 (M4-06) · «perfils simulats de veïns», com la resta de la pàgina després de L3-07. */}
        <h3 id="atles-placa-veins">Els {placa.perfils.length} perfils simulats de veïns</h3>
        <p>
          Tria un perfil per a vore només els dolors que va trobar. Les entrades «(Fase 5)» són els mateixos noms amb una altra
          edat o un altre rol: la Fase 5 els va redefinir.
        </p>
        <ul className="sdp-atles__graella">
          {placa.perfils.map((perfil) => {
            const n = dolorsDe(perfil.id);
            return (
              <li key={perfil.id} className="sdp-atles__fitxa" aria-current={filtre.perfil === perfil.id ? 'true' : undefined}>
                <div className="sdp-atles__perfil-cap">
                  <span className="sdp-atles__inicial" aria-hidden="true">{(perfil.nom || '?').charAt(0)}</span>
                  <div>
                    <h4>{perfil.nom}{perfil.edat ? `, ${perfil.edat} anys` : ''}</h4>
                    <p className="sdp-atles__suau">{perfil.rol} · {perfil.poble}</p>
                  </div>
                </div>
                <p><TextFont text={perfil.descripcio_curta} /></p>
                {perfil.citacio ? <blockquote className="sdp-atles__cita"><TextFont text={perfil.citacio} /></blockquote> : null}
                <ul className="sdp-atles__xips" aria-label={`Rondes de ${perfil.nom}`}>
                  {(perfil.rondes || []).map((id) => <li key={id} className="sdp-atles__xip">{id}</li>)}
                </ul>
                <Boto varietat="secundari" disabled={!n} onClick={() => veureDolorsDe(perfil.id)}>
                  Vore els seus dolors ({n})
                </Boto>
              </li>
            );
          })}
        </ul>
      </section>

      <section ref={blocDolors} className="sdp-atles__bloc">
        <h3 id="atles-placa-dolors">Tots els dolors</h3>
        <div className="sdp-atles__filtres">
          <Pila gap={1}>
            <span className="sdp-atles__etiqueta" aria-hidden="true">Estat</span>
            <PillToggle etiqueta="Estat" valor={filtre.estat} onCanvi={(valor) => canvia('estat', valor)}
              opcions={[{ valor: '', text: 'Tots' }, ...ORDRE_DOLORS.map((estat) => ({ valor: estat, text: NOMS_ESTAT[estat], icona: GLIF_ESTAT[estat] }))]} />
          </Pila>
          <Pila gap={1}>
            <span className="sdp-atles__etiqueta" aria-hidden="true">Gravetat</span>
            <PillToggle etiqueta="Gravetat" valor={filtre.sev} onCanvi={(valor) => canvia('sev', valor)}
              opcions={[{ valor: '', text: 'Totes' }, ...GRAVETATS.map((sev) => ({ valor: sev, text: sev }))]} />
          </Pila>
        </div>
        <div className="sdp-atles__filtres">
          <Camp etiqueta="Ronda">
            <Selector value={filtre.ronda} onChange={(event) => canvia('ronda', event.target.value)}
              opcions={[{ valor: '', etiqueta: 'Totes' }, ...placa.rondes.map((ronda) => ({ valor: ronda.id, etiqueta: ronda.id }))]} />
          </Camp>
          <Camp etiqueta="Veí">
            <Selector value={filtre.perfil} onChange={(event) => canvia('perfil', event.target.value)}
              opcions={[{ valor: '', etiqueta: 'Tots' }, ...placa.perfils.map((perfil) => ({ valor: perfil.id, etiqueta: perfil.nom }))]} />
          </Camp>
          <Camp etiqueta="Busca">
            <CampText tipus="search" value={filtre.q} onChange={(event) => canvia('q', event.target.value)} placeholder="push, xat, Ajuntament…" />
          </Camp>
          <Boto varietat="fantasma" onClick={() => setFiltre(FILTRE_BUIT)}>Lleva els filtres</Boto>
        </div>
        <p className="sdp-atles__recompte" aria-live="polite">{visibles.length} de {placa.dolors.length} dolors</p>
        {visibles.length ? (
          <div className="sdp-atles__bloc">
            {visibles.map((dolor) => <FitxaDolor key={dolor.id} dolor={dolor} nomsDe={nomsDe} />)}
          </div>
        ) : (
          <p className="sdp-atles__fitxa">Cap dolor no casa amb estos filtres. Lleva’n algun per a tornar a vore la llista.</p>
        )}
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-placa-metriques">Mètriques de les rondes</h3>
        <Taula titol="Mètriques de les rondes">
          <thead><tr><th scope="col">Mesura</th><th scope="col">Valor</th><th scope="col">Font</th></tr></thead>
          <tbody>
            {placa.metriques.map((metrica, index) => (
              <tr key={`${index}-${metrica.nom}`}>
                <td><TextFont text={metrica.nom} /></td>
                <td><strong><TextFont text={metrica.valor} /></strong></td>
                <td className="sdp-atles__font">{metrica.font}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </section>

      <section className="sdp-atles__bloc">
        <h3 id="atles-placa-discrepancies">On no quadren les fonts</h3>
        <p>Llei 0: quan dos informes diuen coses diferents, ho deixem a la vista en lloc de triar-ne un en silenci. Són {contradiccions.length}.</p>
        <ul className="sdp-atles__graella sdp-atles__graella--ampla">
          {contradiccions.map((discrepancia, index) => (
            <li key={`${index}-${discrepancia.titol}`} className="sdp-atles__fitxa">
              <h4><TextFont text={discrepancia.titol} /></h4>
              <p><TextFont text={discrepancia.text} /></p>
            </li>
          ))}
        </ul>
      </section>

      <PeuAtles actual="atles-2d-poble-virtual" />
    </div>
  );
}
