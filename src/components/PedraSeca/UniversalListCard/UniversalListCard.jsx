/**
 * UniversalListCard.jsx — Fase E (261020, tasca 2; pla 261020_2045 «El
 * Comú») · la llista viva d'«El Comú»: una sola peça, sis modes, la mateixa
 * targeta dins d'una bombolla del xat (variant 'bombolla') o a tota l'amplada
 * (variant 'plena').
 *
 *   rebost · bar_tpv · colla_cens   → rajoles tàctils de 98 × 116 px (ordre
 *                                     del Mestre, 261020) que canvien d'estat
 *                                     amb un toc i una transició de 300 ms
 *   banda_eixida · loteria_diposit · escola_educand
 *                                   → files: hi ha diners, signatures o
 *                                     notes que no caben en una rajola
 *
 * CONTRACTE
 *   llista       la forma neutra (basesComu.js); la darrera instantània del port
 *   actor        { id, nom } de la sessió: la identitat de cada toc (mai un text lliure)
 *   onMuta       (canvi) => Promise<instantània | void> · on la tasca 4 enxufa el port
 *   variant      'bombolla' | 'plena'
 *   interactiva  false dins del mode de selecció del xat: cap control, només lectura
 *   rellotge, generaId   proves i espècimens deterministes
 *
 * Presentacional: la regla de cada toc és del nucli pur (nucliComu.js) i la
 * de veres, del servidor; la peça no sap de xarxa, sessions ni emmagatzematge.
 * Una llista d'escola (dades d'un menor) només es pinta per al professorat i
 * la família. Cap element de la peça no fa scroll propi: la bombolla viu dins
 * de l'únic scroll del xat.
 */
import { useId, useMemo, useRef, useState } from 'react';
import {
  Car, Check, Clock, Coins, Copy, Download, GraduationCap, HandPlatter, Lock, Maximize2, Minus, Music, Plus, Shield, ShoppingBasket, Ticket,
  Trash2, Utensils
} from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Insignia } from '../atoms/Insignia.jsx';
import { Progres } from '../atoms/estats.jsx';
import { inicialsDe } from '../molecules/Rajola.jsx';
import { PillToggle } from '../molecules/PillToggle.jsx';
import { AfegitRapid } from '../organismes/AfegitRapid.jsx';
import { Dialeg, DialegConfirmacio } from '../organismes/Dialeg.jsx';
import { Taula } from '../organismes/Taula.jsx';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';
import { formatEuros } from '../../../utils/diners.js';
import { esGestor } from './basesComu.js';
import { columnesDe, csvDe, nomDeFitxer, taulaDe, textWhatsAppDe } from './exportaComu.js';
import { elementsFiltrats, modeDe, potVeure, validaLlista } from './nucliComu.js';
import { teLloc, placesLliures } from './modes/collaCens.js';
import { souDe } from './modes/bandaEixida.js';
import { SIGNATURES, comptesDe } from './modes/loteriaDiposit.js';
import { LLETRES, MESOS_CURS, seguimentDe } from './modes/escolaEducand.js';
import { camelDe, omple, parellComu, parellDError } from './textosComu.js';
import { useLlistaComu } from './useLlistaComu.js';

const ICONES = Object.freeze({
  rebost: ShoppingBasket, bar_tpv: Utensils, colla_cens: Shield,
  banda_eixida: Music, loteria_diposit: Ticket, escola_educand: GraduationCap
});
const TO_D_ESTAT = Object.freeze({
  falta: 'info', comprat: 'exit', demanat: 'info', servit: 'avis', cobrat: 'exit', anullat: 'neutre',
  lliure: 'neutre', agafat: 'exit', convocat: 'avis', confirmat: 'exit', baixa: 'neutre',
  en_diposit: 'avis', entregat: 'info', liquidat: 'exit', actiu: 'neutre'
});

/** Oferir un fitxer al navegador sense tocar el document de fora (Llei 06: la peça viu en un Shadow DOM). */
function ofereixFitxer(nom, contingut, tipus) {
  if (typeof URL?.createObjectURL !== 'function' || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([contingut], { type: tipus }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/* ── LA RAJOLA · 98 × 116 px, un toc ─────────────────────────────────── */

/**
 * Un botó natiu (o, sense interacció, un bloc quiet) amb la marca de dalt,
 * l'emoji o les inicials, el nom en dues línies i l'especificació. L'estat es
 * pinta des de data-estat ('actiu' | 'mig' | 'resolt' | 'quiet') i es diu amb
 * text per al lector: mai només el color.
 */
function RajolaComu({ nom, nomIcona, especificacio, emoji, marca, estatText, estat, premuda, onClick, interactiva, etiqueta }) {
  const contingut = (
    <>
      <span className="sdp-comu__rajola-marca" aria-hidden="true">{marca}</span>
      <span className="sdp-comu__rajola-icona" aria-hidden="true">{emoji || inicialsDe(nomIcona ?? nom)}</span>
      <span className="sdp-comu__rajola-nom">{nom}</span>
      <span className="sdp-comu__rajola-espec">{especificacio}</span>
      <span className="sdp-nomes-lector">{estatText}</span>
    </>
  );
  if (!interactiva || !onClick) return <span className="sdp-comu__rajola" data-estat={estat}>{contingut}</span>;
  return (
    <button type="button" className="sdp-comu__rajola" data-estat={estat} aria-pressed={premuda} aria-label={etiqueta} onClick={onClick}>
      {contingut}
    </button>
  );
}

function GraellaRajoles({ titol, children }) {
  return (
    <div className="sdp-comu__seccio">
      {titol ? <p className="sdp-comu__seccio-titol">{titol}</p> : null}
      <ul className="sdp-comu__rajoles">{children}</ul>
    </div>
  );
}

/* ── LES VISTES DE CADA MODE ─────────────────────────────────────────── */

function VistaRebost({ llista, elements, tr, fes, interactiva, anuncia }) {
  const comprats = elements.filter((e) => e.capaMode.estat === 'comprat');
  const rajola = (e) => {
    const falta = e.capaMode.estat === 'falta';
    const peticions = e.capaMode.demanatPer?.length ?? 0;
    const estatText = tr(`estat.${e.capaMode.estat}`);
    return (
      <li key={e.id}>
        <RajolaComu
          nom={e.nom} emoji={e.emoji} especificacio={e.capaMode.especificacio}
          marca={<>{peticions > 1 ? `×${peticions}` : null}{falta ? null : <Check size={14} aria-hidden="true" focusable="false" />}</>}
          estat={falta ? 'actiu' : 'resolt'} premuda={falta} estatText={tr('lector.estat', { estat: estatText })}
          etiqueta={[e.nom, e.capaMode.especificacio, estatText].filter(Boolean).join(', ')}
          interactiva={interactiva}
          onClick={() => {
            if (fes({ tipus: 'commuta', elementId: e.id }).ok) anuncia(tr(falta ? 'rebost.fet.comprat' : 'rebost.fet.falta', { nom: e.nom }));
          }}
        />
      </li>
    );
  };
  /* Una sola graella: la rajola canvia d'estat en el seu lloc i la transició de 300 ms es veu (ordre del Mestre). */
  return (
    <>
      <GraellaRajoles>{elements.map(rajola)}</GraellaRajoles>
      {comprats.length && interactiva ? (
        <div className="sdp-comu__accions">
          <Boto varietat="secundari" icona={Trash2} onClick={() => {
            const n = llista.elementsComu.filter((e) => e.capaMode.estat === 'comprat').length;
            if (fes({ tipus: 'buidaCistell' }).ok) anuncia(tr('rebost.fet.buidat', { n }));
          }}>
            {`${tr('rebost.buidaCistell')} (${llista.elementsComu.filter((e) => e.capaMode.estat === 'comprat').length})`}
          </Boto>
        </div>
      ) : null}
    </>
  );
}

/* L'estat de cada línia, també en dibuix: el color no és mai l'únic senyal. */
const ICONES_BAR = Object.freeze({ demanat: Clock, servit: HandPlatter, cobrat: Coins });

function VistaBar({ llista, elements, tr, fes, actor, interactiva }) {
  const gestor = esGestor(llista, actor);
  const SEGUENT = { demanat: 'bar.serveix', servit: 'bar.cobra' };
  return (
    <GraellaRajoles>
      {elements.map((e) => {
        const { estat, quantitat, preuCents, desti } = e.capaMode;
        const meua = e.capaMode.demanatPer?.usuariId === actor?.id;
        const total = Number.isSafeInteger(preuCents) ? formatEuros(preuCents * quantitat) : '';
        const accio = gestor && SEGUENT[estat]
          ? { text: tr(SEGUENT[estat]), fer: () => fes({ tipus: 'avanca', elementId: e.id }) }
          : (meua && estat === 'demanat' ? { text: tr('bar.mes', { nom: e.nom }), fer: () => fes({ tipus: 'quantitat', elementId: e.id, delta: 1 }) } : null);
        const estatText = tr(`estat.${estat}`);
        const IconaEstat = ICONES_BAR[estat];
        /* Sense aria-pressed: el toc no commuta res, avança el circuit o en demana una més. */
        return (
          <li key={e.id}>
            <RajolaComu
              nom={tr('bar.linia', { quantitat, nom: e.nom })} nomIcona={e.nom} emoji={e.emoji}
              especificacio={total || tr(`bar.${desti}`)}
              marca={<>{desti === 'cuina' ? tr('bar.cuina') : null}{IconaEstat ? <IconaEstat size={14} aria-hidden="true" focusable="false" /> : null}</>}
              estat={estat === 'demanat' ? 'actiu' : (estat === 'servit' ? 'mig' : 'resolt')}
              estatText={tr('lector.estat', { estat: estatText })}
              etiqueta={[tr('bar.linia', { quantitat, nom: e.nom }), total, estatText, accio?.text].filter(Boolean).join(', ')}
              interactiva={interactiva} onClick={accio?.fer}
            />
          </li>
        );
      })}
    </GraellaRajoles>
  );
}

function VistaCens({ elements, tr, fes, actor, interactiva, demanaConfirmacio, anuncia }) {
  const grups = [];
  for (const e of elements) {
    const clau = e.capaMode.faccio ?? '';
    let grup = grups.find((g) => g.clau === clau);
    if (!grup) {
      grup = { clau, elements: [] };
      grups.push(grup);
    }
    grup.elements.push(e);
  }
  const ambTitols = grups.length > 1;
  return grups.map((g) => (
    <GraellaRajoles key={g.clau || '·'} titol={ambTitols ? (g.clau || tr('cens.senseFaccio')) : null}>
      {g.elements.map((e) => {
        const meu = teLloc(e, actor?.id);
        const lliures = placesLliures(e);
        const quota = e.capaMode.quota ?? 1;
        const noms = (e.capaMode.adjudicacions ?? []).map((a) => a.nom || tr('senseNom')).join(', ');
        let especificacio = tr('estat.lliure');
        if (meu) especificacio = tr('cens.teu');
        else if (lliures === 0) especificacio = tr('cens.agafatPer', { noms });
        else if (quota > 1) especificacio = tr('cens.queden', { n: lliures, quota });
        let fer = null;
        let textAccio = '';
        if (meu) {
          textAccio = tr('cens.deixa');
          fer = () => demanaConfirmacio({ tipus: 'deixa', elementId: e.id, nom: e.nom });
        } else if (lliures > 0) {
          textAccio = tr('cens.reclama');
          fer = () => { if (fes({ tipus: 'reclama', elementId: e.id }).ok) anuncia(tr('cens.fet.reclamat', { nom: e.nom })); };
        }
        return (
          <li key={e.id}>
            <RajolaComu
              nom={e.nom} emoji={e.emoji} especificacio={especificacio}
              marca={e.capaMode.esMenut ? tr('cens.menut') : (quota > 1 ? `${quota - lliures}/${quota}` : '')}
              estat={meu ? 'actiu' : (lliures === 0 ? 'resolt' : 'quiet')}
              premuda={meu} estatText={tr('lector.estat', { estat: meu ? tr('cens.teu') : tr(lliures ? 'estat.lliure' : 'estat.agafat') })}
              etiqueta={[e.nom, e.capaMode.descripcio, especificacio, textAccio].filter(Boolean).join(', ')}
              interactiva={interactiva} onClick={fer}
            />
          </li>
        );
      })}
    </GraellaRajoles>
  ));
}

function Fila({ nom, estat, tr, meua, meta, children }) {
  return (
    <li className={meua ? 'sdp-comu__fila sdp-comu__fila--meua' : 'sdp-comu__fila'}>
      <div className="sdp-comu__fila-cap">
        <span className="sdp-comu__fila-nom">{nom}</span>
        {estat ? <Insignia to={TO_D_ESTAT[estat] ?? 'neutre'}>{tr(`estat.${camelDe(estat)}`)}</Insignia> : null}
      </div>
      {meta.length ? <p className="sdp-comu__fila-meta">{meta.filter(Boolean).join(' · ')}</p> : null}
      {children}
    </li>
  );
}

function VistaBanda({ llista, elements, tr, fes, actor, interactiva }) {
  const mode = modeDe(llista);
  const gestor = esGestor(llista, actor);
  const propis = elements.filter((e) => e.capaMode.usuariId && e.capaMode.usuariId === actor?.id);
  const ordenats = [...propis, ...elements.filter((e) => !propis.includes(e))];
  return (
    <ul className="sdp-comu__files">
      {ordenats.map((e) => {
        const c = e.capaMode;
        const sou = gestor ? souDe(e, llista.configMode) : null;
        const pot = interactiva && mode.potTocar(llista, e, actor);
        return (
          <Fila key={e.id} nom={e.nom} estat={c.assistencia} tr={tr} meua={propis.includes(e)}
            meta={[
              c.corda,
              tr(`banda.vinculacio.${c.vinculacio}`),
              c.vinculacio === 'plantilla' && c.nivell ? tr('banda.nivell', { n: c.nivell }) : '',
              c.posaCotxe ? tr('banda.places', { n: c.places }) : '',
              sou !== null ? tr('banda.economia.sou', { import: formatEuros(sou) }) : '',
              gestor && c.assistencia === 'confirmat' ? tr(c.pagament === 'pagat' ? 'banda.pagat' : 'banda.pendentPagar') : ''
            ]}>
            {pot ? (
              <div className="sdp-comu__accions" role="group" aria-label={e.nom}>
                <Boto varietat={c.assistencia === 'confirmat' ? 'secundari' : 'primari'} aria-pressed={c.assistencia === 'confirmat'}
                  onClick={() => fes({ tipus: 'confirma', elementId: e.id })}>{tr('banda.vaig')}</Boto>
                <Boto varietat="secundari" aria-pressed={c.assistencia === 'baixa'}
                  onClick={() => fes({ tipus: 'baixa', elementId: e.id })}>{tr('banda.noPuc')}</Boto>
                <Boto varietat="fantasma" icona={Car} aria-pressed={c.posaCotxe}
                  onClick={() => fes({ tipus: 'cotxe', elementId: e.id })}>{tr('banda.poseCotxe')}</Boto>
                {gestor && c.assistencia === 'confirmat' ? (
                  <Boto varietat="fantasma" aria-pressed={c.pagament === 'pagat'}
                    onClick={() => fes({ tipus: 'paga', elementId: e.id })}>{tr('banda.pagat')}</Boto>
                ) : null}
              </div>
            ) : null}
          </Fila>
        );
      })}
    </ul>
  );
}

function FormulariRetorn({ element, tr, fes }) {
  const id = useId();
  const [valor, setValor] = useState(String(element.capaMode.retornats));
  return (
    <form className="sdp-comu__retorn" onSubmit={(event) => {
      event.preventDefault();
      /* La cadena tal qual: el nucli la valida, i un camp buit és «valor-invalid», no un zero. */
      fes({ tipus: 'retorna', elementId: element.id, retornats: valor });
    }}>
      <label className="sdp-comu__etiqueta" htmlFor={id}>{tr('loteria.retornats.etiqueta', { nom: element.nom })}</label>
      <input id={id} className="sdp-control sdp-comu__camp" type="number" inputMode="numeric" min="0" max={element.capaMode.entregats}
        value={valor} onChange={(event) => setValor(event.target.value)} />
      <Boto varietat="secundari" tipus="submit">{tr('desa')}</Boto>
    </form>
  );
}

function VistaLoteria({ llista, elements, tr, fes, actor, interactiva }) {
  const mode = modeDe(llista);
  const gestor = esGestor(llista, actor);
  return (
    <ul className="sdp-comu__files">
      {elements.map((e) => {
        const c = e.capaMode;
        const comptes = comptesDe(e, llista.configMode);
        const signatures = mode.signaturesDe(e);
        const liquidant = signatures.liquidacioDepositari || signatures.liquidacioSocietat;
        const potRetornar = interactiva && !liquidant && (gestor || (c.depositariUsuariId && c.depositariUsuariId === actor?.id));
        return (
          <Fila key={e.id} nom={e.nom} estat={mode.estatDe(e)} tr={tr} meua={c.depositariUsuariId === actor?.id}
            meta={[
              tr(`loteria.${c.format}`),
              tr('loteria.entregats', { n: c.entregats }),
              tr('loteria.retornats', { n: c.retornats }),
              tr('loteria.venuts', { n: comptes.venuts }),
              tr('loteria.liquidar', { import: formatEuros(comptes.totalLiquidarCents) }),
              tr('loteria.benefici', { import: formatEuros(comptes.beneficiCents) })
            ]}>
            <div className="sdp-comu__signatures" role="group" aria-label={tr('loteria.signatures', { nom: e.nom })}>
              {SIGNATURES.map((s) => {
                const potSignar = interactiva && mode.potSignar(llista, e, actor, s);
                const etiqueta = tr(`loteria.signatura.${s}`);
                return potSignar ? (
                  <button key={s} type="button" className="sdp-comu__signatura" aria-pressed={signatures[s]}
                    onClick={() => fes({ tipus: 'signa', elementId: e.id, signatura: s })}>
                    {signatures[s] ? <Check size={16} aria-hidden="true" focusable="false" /> : null}
                    <span>{etiqueta}</span>
                  </button>
                ) : (
                  <span key={s} className="sdp-comu__signatura" data-signada={signatures[s] ? 'si' : 'no'}>
                    {signatures[s] ? <Check size={16} aria-hidden="true" focusable="false" /> : null}
                    <span>{etiqueta}</span>
                    <span className="sdp-nomes-lector">{`: ${tr(signatures[s] ? 'si' : 'no')}`}</span>
                  </span>
                );
              })}
            </div>
            {potRetornar ? <FormulariRetorn element={e} tr={tr} fes={fes} /> : null}
          </Fila>
        );
      })}
    </ul>
  );
}

/** L'evolució mensual: una línia sobre els mesos amb nota, sense semàfor (seguiment no punitiu). */
function Evolucio({ notes, etiqueta }) {
  const punts = notes.map((n, i) => (n === null ? null : { x: 4 + i * 10, y: 36 - n * 3.2 })).filter(Boolean);
  if (punts.length === 0) return null;
  return (
    <svg className="sdp-comu__evolucio" viewBox="0 0 118 40" role="img" aria-label={etiqueta} focusable="false">
      <polyline className="sdp-comu__evolucio-linia" points={punts.map((p) => `${p.x},${p.y}`).join(' ')} />
      {punts.map((p) => <circle key={p.x} className="sdp-comu__evolucio-punt" cx={p.x} cy={p.y} r="2.5" />)}
    </svg>
  );
}

function AnotaMes({ element, tr, fes }) {
  const id = useId();
  const [mes, setMes] = useState(MESOS_CURS[0]);
  const dades = element.capaMode.mesos?.find((m) => m.mes === mes) ?? { setmanes: [null, null, null, null, null], nota: null };
  const [nota, setNota] = useState('');
  const nomMes = tr(`escola.mes.${mes}`);
  return (
    <details className="sdp-comu__anota">
      <summary className="sdp-comu__anota-resum">{tr('escola.anotaResum', { nom: element.nom })}</summary>
      <div className="sdp-comu__anota-graella">
        <label className="sdp-comu__etiqueta" htmlFor={`${id}-mes`}>{tr('escola.mesEtiqueta')}</label>
        <select id={`${id}-mes`} className="sdp-control sdp-control--selector sdp-comu__camp" value={mes} onChange={(event) => { setMes(event.target.value); setNota(''); }}>
          {MESOS_CURS.map((m) => <option key={m} value={m}>{tr(`escola.mes.${m}`)}</option>)}
        </select>
        {dades.setmanes.map((valor, i) => (
          <label key={i} className="sdp-comu__etiqueta">
            {tr('escola.anota', { n: i + 1, mes: nomMes })}
            <select className="sdp-control sdp-control--selector sdp-comu__camp" value={valor ?? ''}
              onChange={(event) => fes({ tipus: 'anota', elementId: element.id, mes, setmana: i, valor: event.target.value || null })}>
              <option value="">{tr('escola.senseLletra')}</option>
              {LLETRES.map((l) => <option key={l} value={l}>{`${l} · ${tr(`escola.lletra.${l}`)}`}</option>)}
            </select>
          </label>
        ))}
        <form className="sdp-comu__retorn" onSubmit={(event) => {
          event.preventDefault();
          fes({ tipus: 'qualifica', elementId: element.id, mes, nota: nota === '' ? null : Number(nota.replace(',', '.')) });
        }}>
          <label className="sdp-comu__etiqueta" htmlFor={`${id}-nota`}>{tr('escola.nota', { mes: nomMes })}</label>
          <input id={`${id}-nota`} className="sdp-control sdp-comu__camp" type="text" inputMode="decimal"
            placeholder={dades.nota === null ? '' : String(dades.nota).replace('.', ',')} value={nota} onChange={(event) => setNota(event.target.value)} />
          <Boto varietat="secundari" tipus="submit">{tr('desa')}</Boto>
        </form>
      </div>
    </details>
  );
}

function Comenta({ element, tr, fes }) {
  const id = useId();
  const [text, setText] = useState('');
  return (
    <form className="sdp-comu__retorn" onSubmit={(event) => {
      event.preventDefault();
      if (fes({ tipus: 'comenta', elementId: element.id, text }).ok) setText('');
    }}>
      <label className="sdp-comu__etiqueta" htmlFor={id}>{tr('escola.dialeg.escriu')}</label>
      <input id={id} className="sdp-control sdp-comu__camp" type="text" value={text} maxLength={500} onChange={(event) => setText(event.target.value)} />
      <Boto varietat="secundari" tipus="submit">{tr('escola.dialeg.envia')}</Boto>
    </form>
  );
}

function VistaEscola({ llista, elements, tr, fes, actor, interactiva }) {
  const mode = modeDe(llista);
  return (
    <ul className="sdp-comu__files">
      {elements.map((e) => {
        const s = seguimentDe(e);
        const dialeg = e.capaMode.dialeg ?? [];
        const darrer = dialeg[dialeg.length - 1] ?? null;
        const notesText = s.notes.filter((n) => n !== null).map((n) => String(n).replace('.', ',')).join(', ');
        return (
          <Fila key={e.id} nom={e.nom} tr={tr} meua={false}
            meta={[
              e.capaMode.professor ? tr('escola.professor', { nom: e.capaMode.professor }) : '',
              s.mitjana === null ? tr('escola.senseNotes') : tr('escola.mitjana', { n: String(s.mitjana).replace('.', ',') })
            ]}>
            <ul className="sdp-comu__lletres">
              {LLETRES.map((l) => (
                <li key={l} className="sdp-comu__lletra">{`${tr(`escola.lletra.${l}`)}: ${s.recompte[l]}`}</li>
              ))}
            </ul>
            <Evolucio notes={s.notes} etiqueta={`${tr('escola.evolucio', { nom: e.nom })}: ${notesText}`} />
            {darrer ? (
              <p className="sdp-comu__dialeg">{`${tr(`escola.rol.${darrer.rol}`)} · ${darrer.text}`}</p>
            ) : null}
            {interactiva && mode.potAnotar(llista, e, actor) ? <AnotaMes element={e} tr={tr} fes={fes} /> : null}
            {interactiva && mode.potComentar(llista, e, actor) ? <Comenta element={e} tr={tr} fes={fes} /> : null}
          </Fila>
        );
      })}
    </ul>
  );
}

const VISTES = Object.freeze({
  rebost: VistaRebost, bar_tpv: VistaBar, colla_cens: VistaCens,
  banda_eixida: VistaBanda, loteria_diposit: VistaLoteria, escola_educand: VistaEscola
});

/* ── EL PEU DE CADA MODE · les xifres que compten ────────────────────── */

function Xifres({ linies }) {
  const netes = linies.filter(Boolean);
  if (netes.length === 0) return null;
  return <ul className="sdp-comu__resum">{netes.map((l) => <li key={l} className="sdp-comu__xifra">{l}</li>)}</ul>;
}

function ResumDelMode({ llista, resum, tr, actor }) {
  const e = (cents) => formatEuros(cents);
  switch (llista.mode) {
    case 'rebost': {
      const c = resum.comparador;
      if (!c) return null;
      return (
        <div className="sdp-comu__seccio">
          <p className="sdp-comu__seccio-titol">{tr('rebost.comparador.titol')}</p>
          <Xifres linies={[
            tr('rebost.comparador.poble', { import: e(c.pobleCents) }),
            `${tr('rebost.comparador.gran', { import: e(c.totalGranCents) })}${c.desplacamentCents ? ` (${tr('rebost.comparador.desplacament', { import: e(c.desplacamentCents) })})` : ''}`,
            c.estalviCents >= 0 ? tr('rebost.comparador.estalvi', { import: e(c.estalviCents) }) : tr('rebost.comparador.mesCar', { import: e(-c.estalviCents) }),
            c.sensePreu ? tr('rebost.comparador.sensePreu', { n: c.sensePreu }) : ''
          ]} />
        </div>
      );
    }
    case 'bar_tpv':
      return <Xifres linies={[
        tr('bar.total', { import: e(resum.totalCents) }),
        tr('bar.pendent', { import: e(resum.pendentCobrarCents) }),
        resum.perServir ? tr('bar.perServir', { n: resum.perServir, cuina: resum.perServirCuina }) : '',
        resum.sensePreu ? tr('bar.sensePreu', { n: resum.sensePreu }) : ''
      ]} />;
    case 'banda_eixida': {
      const ec = resum.economia;
      if (!esGestor(llista, actor)) return null;
      return (
        <div className="sdp-comu__seccio">
          <p className="sdp-comu__seccio-titol">{tr('banda.economia.titol')}</p>
          <Xifres linies={[
            tr('banda.economia.musics', { import: e(ec.subtotalMusicsCents) }),
            tr('banda.economia.cotxes', { import: e(ec.totalCotxesCents) }),
            tr('banda.economia.total', { import: e(ec.totalActeCents) }),
            ec.pressupostatCents !== null ? tr('banda.economia.pressupostat', { import: e(ec.pressupostatCents) }) : '',
            ec.fonsCents !== null ? tr('banda.economia.fons', { import: e(ec.fonsCents) }) : '',
            ec.sensePreu ? tr('banda.economia.sensePreu', { n: ec.sensePreu }) : ''
          ]} />
        </div>
      );
    }
    case 'loteria_diposit':
      return <Xifres linies={[
        tr('loteria.resum.total', { import: e(resum.totalLiquidarCents) }),
        tr('loteria.resum.benefici', { import: e(resum.beneficiCents) }),
        resum.decimsAReservar ? tr('loteria.resum.reservar', { n: resum.decimsAReservar }) : ''
      ]} />;
    default:
      return null;
  }
}

/** La capçalera pròpia de la banda: «Volen 45 · Anem 37 · Cotxes 12» i el que falta per corda. */
function CapcaleraBanda({ resum, tr }) {
  const capcalera = resum.volen === null
    ? tr('banda.capcaleraSenseVolen', { anem: resum.anem, cotxes: resum.cotxes })
    : tr('banda.capcalera', { volen: resum.volen, anem: resum.anem, cotxes: resum.cotxes });
  return (
    <Xifres linies={[
      capcalera,
      resum.falten.length ? tr('banda.falten', { llista: resum.falten.map((f) => `${f.falten} ${f.corda}`).join(', ') }) : ''
    ]} />
  );
}

/* ── LA VISTA ESTESA · la taula i els exportadors ────────────────────── */

/** La quantitat d'un article que falta, escrita a mà (el toc a l'especificació de Bring!, ací a la taula:
    dos objectius de 48 px no caben en una rajola de 116). */
function FormulariQuantitat({ element, tr, fes }) {
  const id = useId();
  const [valor, setValor] = useState(element.capaMode.especificacio ?? '');
  return (
    <form className="sdp-comu__retorn" onSubmit={(event) => {
      event.preventDefault();
      fes({ tipus: 'especifica', elementId: element.id, especificacio: valor });
    }}>
      <label className="sdp-nomes-lector" htmlFor={id}>{tr('rebost.especifica', { nom: element.nom })}</label>
      <input id={id} className="sdp-control sdp-comu__camp" type="text" maxLength={80} value={valor} onChange={(event) => setValor(event.target.value)} />
      <Boto varietat="secundari" tipus="submit">{tr('desa')}</Boto>
    </form>
  );
}

function AccionsDeFila({ llista, element, tr, fes, actor, demanaConfirmacio }) {
  const mode = modeDe(llista);
  const gestor = esGestor(llista, actor);
  const accions = [];
  if (llista.mode === 'rebost' && element.capaMode.estat === 'falta') {
    accions.push(<FormulariQuantitat key="quantitat" element={element} tr={tr} fes={fes} />);
  }
  if (llista.mode === 'bar_tpv' && element.capaMode.estat === 'demanat'
    && (gestor || element.capaMode.demanatPer?.usuariId === actor?.id)) {
    accions.push(
      <Boto key="menys" varietat="fantasma" icona={Minus} aria-label={tr('bar.menys', { nom: element.nom })}
        onClick={() => fes({ tipus: 'quantitat', elementId: element.id, delta: -1 })}>{''}</Boto>,
      <Boto key="mes" varietat="fantasma" icona={Plus} aria-label={tr('bar.mes', { nom: element.nom })}
        onClick={() => fes({ tipus: 'quantitat', elementId: element.id, delta: 1 })}>{''}</Boto>,
      <Boto key="anula" varietat="secundari" onClick={() => fes({ tipus: 'anula', elementId: element.id })}>{tr('bar.anula')}</Boto>
    );
  }
  if (llista.mode === 'colla_cens' && gestor) {
    for (const a of element.capaMode.adjudicacions ?? []) {
      if (a.usuariId === actor?.id) continue;
      accions.push(
        <Boto key={`allibera-${a.usuariId}`} varietat="secundari"
          onClick={() => demanaConfirmacio({ tipus: 'allibera', elementId: element.id, nom: element.nom, usuariId: a.usuariId, persona: a.nom || tr('senseNom') })}>
          {tr('cens.allibera', { persona: a.nom || tr('senseNom') })}
        </Boto>
      );
    }
  }
  if (mode.potEliminar(llista, element, actor)) {
    accions.push(
      <Boto key="elimina" varietat="fantasma" icona={Trash2} aria-label={tr('elimina', { nom: element.nom })}
        onClick={() => demanaConfirmacio({ tipus: 'elimina', elementId: element.id, nom: element.nom })}>{''}</Boto>
    );
  }
  return accions.length ? <div className="sdp-comu__accions">{accions}</div> : null;
}

/* ── LA PEÇA ─────────────────────────────────────────────────────────── */

export function UniversalListCard({
  llista: llistaEntrada, actor = null, onMuta = null, variant = 'bombolla', interactiva = true,
  rellotge = null, generaId, className
}) {
  const t = useTraductorOpcional();
  const tr = (nom, valors) => omple(tradueix(t, parellComu(nom)), valors);
  const idTitol = useId();
  const refTitol = useRef(null);
  const opcionsHook = useMemo(() => ({ actor, onMuta, rellotge, ...(generaId ? { generaId } : {}) }), [actor, onMuta, rellotge, generaId]);
  const { llista, resum, fes: fesAlNucli, error, netejaError } = useLlistaComu(llistaEntrada, opcionsHook);
  /* Si el toc fa desaparéixer el control premut (una rajola que deixa de ser botó, una fila que
     ix del filtre, «Buida el cistell»), el focus no cau al <body>: torna al títol de la llista.
     getRootNode, perquè la peça pot viure en un Shadow DOM. */
  const fes = (accio) => {
    const resultat = fesAlNucli(accio);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        const titol = refTitol.current;
        const arrel = titol?.getRootNode?.();
        const actiu = arrel?.activeElement ?? null;
        if (titol?.isConnected && (!actiu || actiu === titol.ownerDocument?.body || !actiu.isConnected)) titol.focus();
      });
    }
    return resultat;
  };
  const [filtre, setFiltre] = useState('tots');
  const [ambTaula, setAmbTaula] = useState(false);
  const [confirma, setConfirma] = useState(null);
  const [anunci, setAnunci] = useState('');
  const [avisTaula, setAvisTaula] = useState('');
  const classes = ['sdp-comu', className].filter(Boolean).join(' ');

  if (!llista || !validaLlista(llista).ok) {
    return <div className={classes} data-variant={variant} role="alert"><p className="sdp-comu__buit">{tr('error.llistaInvalida')}</p></div>;
  }
  const mode = modeDe(llista);
  const camel = camelDe(llista.mode);
  if (!potVeure(llista, actor)) {
    return (
      <section className={classes} data-mode={llista.mode} data-variant={variant} aria-label={tr(`mode.${camel}`)}>
        <p className="sdp-comu__privada"><Lock size={20} aria-hidden="true" focusable="false" /><span>{tr('escola.privada')}</span></p>
      </section>
    );
  }

  const Icona = ICONES[llista.mode];
  const Vista = VISTES[llista.mode];
  const gestor = esGestor(llista, actor);
  /* Sense actor (o en el mode de selecció del xat) la peça es llig però no es toca: cap botó que només puga fallar. */
  const potTocar = interactiva && Boolean(actor?.id);
  /* En lectura no hi ha píndoles: es veu tota la llista, no un filtre amagat. */
  const elements = elementsFiltrats(llista, interactiva ? filtre : 'tots');
  const potAfegir = potTocar && mode.potAfegir(llista, actor);
  const progres = resum?.progres;
  const suggeriments = llista.mode === 'rebost'
    ? (llista.recentsComu ?? []).map((r, i) => ({ id: `recent-${i}`, nom: r.nom }))
    : (llista.mode === 'bar_tpv' ? (llista.configMode.carta ?? []).map((a, i) => ({ id: `carta-${i}`, nom: a.nom })) : []);
  const taula = ambTaula ? taulaDe(llista, { tr, gestor }) : null;
  const ambAccionsDeFila = potTocar && llista.mode !== 'escola_educand';
  const columnaNom = taula ? Math.max(0, columnesDe(llista, { gestor }).findIndex((c) => c.clau === 'nom')) : 0;

  const confirmaAccio = () => {
    const c = confirma;
    setConfirma(null);
    if (!c) return;
    if (c.tipus === 'deixa') {
      if (fes({ tipus: 'allibera', elementId: c.elementId }).ok) setAnunci(tr('cens.fet.deixat', { nom: c.nom }));
    } else if (c.tipus === 'allibera') fes({ tipus: 'allibera', elementId: c.elementId, usuariId: c.usuariId });
    else if (c.tipus === 'elimina') fes({ tipus: 'elimina', elementId: c.elementId });
  };
  const textosConfirma = confirma?.tipus === 'deixa'
    ? { titol: tr('cens.deixa.titol', { nom: confirma.nom }), descripcio: tr('cens.deixa.descripcio'), confirma: tr('cens.deixa') }
    : confirma?.tipus === 'allibera'
      ? { titol: tr('cens.allibera.titol', { nom: confirma.nom, persona: confirma.persona }), descripcio: tr('cens.allibera.descripcio'), confirma: tr('cens.allibera.confirma') }
      : { titol: tr('elimina.titol', { nom: confirma?.nom ?? '' }), descripcio: tr('elimina.descripcio'), confirma: tr('elimina.confirma') };

  const copia = () => {
    const text = textWhatsAppDe(llista, { tr, gestor });
    const portapapers = typeof navigator === 'undefined' ? null : navigator.clipboard;
    if (!portapapers?.writeText) { setAvisTaula(tr('exporta.noCopiat')); return; }
    portapapers.writeText(text).then(() => setAvisTaula(tr('exporta.copiat')), () => setAvisTaula(tr('exporta.noCopiat')));
  };
  const descarrega = () => {
    const fitxer = nomDeFitxer(llista);
    setAvisTaula(ofereixFitxer(fitxer, csvDe(llista, { tr, gestor }), 'text/csv;charset=utf-8')
      ? tr('exporta.descarregat', { fitxer }) : tr('exporta.noDescarregat'));
  };

  return (
    <section className={classes} data-mode={llista.mode} data-variant={variant} aria-labelledby={idTitol}>
      <header className="sdp-comu__cap">
        <span className="sdp-comu__icona" aria-hidden="true"><Icona size={20} focusable="false" /></span>
        <div className="sdp-comu__titols">
          <p className="sdp-comu__mode">{tr(`mode.${camel}`)}</p>
          <p id={idTitol} ref={refTitol} className="sdp-comu__titol" tabIndex={-1}>{llista.titol}</p>
          {llista.subtitol ? <p className="sdp-comu__subtitol">{llista.subtitol}</p> : null}
        </div>
      </header>

      {progres && progres.total > 0 ? (
        <Progres className="sdp-comu__progres" etiqueta={tr(`progres.${camel}`, { fets: progres.fets, total: progres.total })}
          valor={Math.min(progres.fets, progres.total)} max={progres.total} />
      ) : null}
      {llista.mode === 'banda_eixida' ? <CapcaleraBanda resum={resum} tr={tr} /> : null}

      {interactiva && mode.filtres.length > 1 && llista.elementsComu.length > 0 ? (
        <PillToggle className="sdp-comu__filtres" etiqueta={tr('filtra')} valor={filtre} onCanvi={setFiltre}
          opcions={mode.filtres.map((f) => ({ valor: f.valor, text: tr(`filtre.${camelDe(f.valor)}`) }))} />
      ) : null}

      {potAfegir ? (
        <AfegitRapid className="sdp-comu__afegit" etiqueta={tr(`afegit.${camel}`)} ajuda={tr(`ajuda.${camel}`)}
          suggeriments={suggeriments}
          onTria={(article) => fes({ tipus: 'afegeix', entrada: { nom: article.nom } })}
          onCrea={(text) => fes({ tipus: 'afegeix', entrada: { text } })}
          textos={{
            crea: (text) => tr('afegeix.crea', { text }),
            boto: tr('afegeix'),
            trobats: (n) => (n === 1 ? tr('afegeix.trobat') : tr('afegeix.trobats', { n }))
          }} />
      ) : null}

      {llista.elementsComu.length === 0 ? <p className="sdp-comu__buit">{tr('buit')}</p> : null}
      {llista.elementsComu.length > 0 && elements.length === 0 ? <p className="sdp-comu__buit">{tr('buitFiltre')}</p> : null}
      {elements.length > 0 ? (
        <Vista llista={llista} elements={elements} tr={tr} fes={fes} actor={actor} interactiva={potTocar}
          anuncia={setAnunci} demanaConfirmacio={setConfirma} />
      ) : null}

      <ResumDelMode llista={llista} resum={resum} tr={tr} actor={actor} />

      {error ? (
        <div className="sdp-comu__error" role={interactiva ? 'alert' : undefined}>
          <p>{tradueix(t, parellDError(error))}</p>
          {interactiva ? <Boto varietat="fantasma" onClick={netejaError}>{tr('dacord')}</Boto> : null}
        </div>
      ) : null}
      <p className="sdp-nomes-lector" role="status">{anunci}</p>

      {interactiva && llista.elementsComu.length > 0 ? (
        <div className="sdp-comu__peu">
          <Boto varietat="secundari" icona={Maximize2} onClick={() => { setAvisTaula(''); setAmbTaula(true); }}>{tr('amplia')}</Boto>
        </div>
      ) : null}

      <Dialeg obert={ambTaula} onTanca={() => setAmbTaula(false)} titol={tr('taula.titol', { titol: llista.titol })} mida="g"
        accions={(
          <>
            {llista.mode !== 'escola_educand' ? <Boto varietat="secundari" icona={Copy} onClick={copia}>{tr('exporta.whatsapp')}</Boto> : null}
            <Boto varietat="secundari" icona={Download} onClick={descarrega}>{tr('exporta.csv')}</Boto>
            <Boto varietat="primari" onClick={() => setAmbTaula(false)}>{tr('tanca')}</Boto>
          </>
        )}>
        {taula ? (
          <Taula titol={tr('taula.titol', { titol: llista.titol })} densa>
            <thead>
              <tr>
                {taula.capcalera.map((c) => <th key={c} scope="col">{c}</th>)}
                {ambAccionsDeFila ? <th scope="col"><span className="sdp-nomes-lector">{tr('columna.accions')}</span></th> : null}
              </tr>
            </thead>
            <tbody>
              {taula.files.map((fila) => {
                const element = llista.elementsComu.find((e) => e.id === fila.id);
                return (
                  <tr key={fila.id}>
                    {fila.celes.map((cela, i) => (i === columnaNom ? <th key={i} scope="row">{cela}</th> : <td key={i}>{cela}</td>))}
                    {ambAccionsDeFila ? (
                      <td>
                        <AccionsDeFila llista={llista} element={element} tr={tr} fes={fes} actor={actor} demanaConfirmacio={setConfirma} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Taula>
        ) : null}
        <p role="status">{avisTaula}</p>
      </Dialeg>

      <DialegConfirmacio obert={Boolean(confirma)} onTanca={() => setConfirma(null)} onConfirma={confirmaAccio}
        titol={textosConfirma.titol} descripcio={textosConfirma.descripcio}
        etiquetaConfirma={textosConfirma.confirma} etiquetaCancela={tr('cancela')} destructiu={confirma?.tipus !== 'deixa'} />
    </section>
  );
}
