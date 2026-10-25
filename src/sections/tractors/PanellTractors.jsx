/**
 * PanellTractors.jsx — la porta d'aprovació de tractors, a la vista del Mestre.
 *
 * Contingut sense pàgina ni h1: l'embolcall (la Wiki, només en
 * desenvolupament) hi posa la UniversalPage. Per a cada tractor: l'estat, què
 * fa, què llig i què escriu, l'empremta, les fonts, la fitxa sencera i
 * l'historial. Aprovar obri DialegAprovacio; revocar és immediat; oblidar-ho
 * tot demana confirmació. Les proves injecten magatzem, subtle, tractors,
 * entorn i rellotge (vegeu useTractors).
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1930, front 2) · Al servidor de
 * desenvolupament, i només allí (literal import.meta.env.DEV: fora de DEV el
 * botó no arriba al paquet), «Aprovar tots els pendents (DEV)» aprova en bloc
 * pel camí de sempre. És aprovació tècnica: no substituïx la revisió reflexiva.
 */
import { Copy } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../components/PedraSeca/organismes/Dialeg.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { parseMarkdown } from '../wiki-de-poble/parseMarkdown.js';
import DialegAprovacio, { textError } from './DialegAprovacio.jsx';
import { empremtaCurta } from './nucli/empremta.js';
import { esAprovableEnBloc, useTractors } from './useTractors.js';

/* L'estat mai no es diu només amb el color: la insígnia porta el text. */
const INSIGNIA = Object.freeze({
  pendent: { to: 'avis', text: 'Pendent' },
  aprovat: { to: 'exit', text: 'Aprovat' },
  caducat: { to: 'avis', text: 'Caducat' },
  revocat: { to: 'error', text: 'Revocat' },
  'empremta-divergent': { to: 'avis', text: 'Versió canviada' },
  incomplet: { to: 'neutre', text: 'Incomplet' },
  error: { to: 'error', text: 'Sense empremta' }
});

const NIVELLS = Object.freeze({
  confirmacio: 'Confirmació escrita de l’empremta curta',
  signatura: 'Signatura amb Touch ID o clau de pas'
});

let formatData = null;
function dataLlegible(iso) {
  try {
    formatData ||= new Intl.DateTimeFormat('ca-ES', { dateStyle: 'long', timeStyle: 'short' });
    return formatData.format(new Date(iso));
  } catch {
    return String(iso);
  }
}

/* El motiu del nucli parla amb codis i dates ISO; ací, amb paraules i dates llegibles. */
function motiuLlegible(t) {
  const r = t.registre;
  if (t.estat === 'aprovat' && r) return `Aprovat el ${dataLlegible(r.data)} (${(NIVELLS[r.nivell] ?? r.nivell).toLowerCase()}).`;
  if (t.estat === 'revocat' && r) return `Aprovació revocada el ${dataLlegible(r.data)}: no s’executa fins que el tornes a aprovar.`;
  if (t.estat === 'caducat' && r?.caduca) return `L’aprovació va caducar el ${dataLlegible(r.caduca)}: cal tornar-la a aprovar.`;
  return t.motiu;
}

function curtaDe(empremta) {
  try {
    return empremtaCurta(empremta);
  } catch {
    return '';
  }
}

/* L'empremta curta sempre a la vista i, al costat, el botó per a copiar-la (un botó de veres: teclat i àrea
   tàctil). Sense porta-retalls, o si el navegador el denega, el botó ho diu i l'empremta es copia a mà. */
function EmpremtaCurta({ curta }) {
  const [copia, setCopia] = useState('');
  const temporitzador = useRef(null);
  useEffect(() => () => clearTimeout(temporitzador.current), []);
  const avisa = (estat) => {
    setCopia(estat);
    clearTimeout(temporitzador.current);
    temporitzador.current = setTimeout(() => setCopia(''), 1500);
  };
  async function copiaCurta() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('sense porta-retalls');
      await navigator.clipboard.writeText(curta);
      avisa('copiada');
    } catch {
      avisa('fallida');
    }
  }
  const etiqueta = { copiada: 'Copiada', fallida: 'No s’ha pogut copiar: copia-la a mà' }[copia] ?? 'Copia l’empremta curta';
  return (
    <>
      <code className="sdp-tractors-panell__curta">{curta}</code>
      <Boto varietat="fantasma" icona={Copy} onClick={copiaCurta}>{etiqueta}</Boto>
    </>
  );
}

/* La fitxa penja de l'h4 del tractor (IDEA-27, 261025: la porta és l'h3 de la
   pàgina i cada tractor, un h4 dins d'ella): els seus títols baixen tres
   esglaons («#» ix com a h5). Les tanques de codi no es toquen. */
export function rebaixaTitols(md, salts = 3) {
  let dinsCodi = false;
  return String(md ?? '').split('\n').map((linia) => {
    if (/^[ \t]*(`{3,}|~{3,})/.test(linia)) {
      dinsCodi = !dinsCodi;
      return linia;
    }
    const titol = dinsCodi ? null : /^(#{1,6}) /.exec(linia);
    return titol ? '#'.repeat(Math.min(titol[1].length + salts, 6)) + linia.slice(titol[1].length) : linia;
  }).join('\n');
}

function Llista({ elements }) {
  return <ul>{elements.map((element) => <li key={element}>{element}</li>)}</ul>;
}

/* El resum de l'aprovació en bloc, amb l'estat ja refrescat: si una aprovació
   desada no deixa el tractor «Aprovat» (un registre vell amb data futura
   continua manant), compta amb els errors. Els omesos es compten per motiu,
   perquè demanen coses diferents. SENSE_WEBAUTHN: Touch ID només hi és en
   context segur, i des d'una IP de la xarxa local s'ometen tots els de
   signatura (sense esquema: la porta de privacitat no admet cap URL al carril).
   SERIE_ATURADA: només ix amb WebAuthn present, quan una signatura no s'ha
   completat; la resta no s'ha provat, i n'hi ha prou amb tornar a clicar. */
function resumEnBloc({ aprovats, fallits, omesos, files }) {
  const queda = (id) => files.some((f) => f.id === id && f.estat === 'aprovat');
  const ometen = (motiu) => omesos.filter((o) => o.motiu === motiu).length;
  const n = aprovats.filter(({ id }) => queda(id)).length;
  const m = ometen('SENSE_WEBAUTHN');
  const a = ometen('SERIE_ATURADA');
  const k = aprovats.length + fallits.length - n;
  return `Aprovació en bloc (DEV): ${n} ${n === 1 ? 'aprovat' : 'aprovats'}, ${m} sense signar`
    + `${m ? ' (cal Touch ID a localhost:3340)' : ''}, ${k} amb error`
    + `${a ? `, ${a} sense provar (la sèrie s’ha aturat: torna a clicar per a continuar)` : ''}.`;
}

/* En un lot, el text de SIGNATURA_INVALIDA del diàleg («No s’ha aprovat res»)
   no és cert: els anteriors de la sèrie sí que s'han aprovat. Ací es diu què
   ha passat amb este tractor; la resta, al resum. */
const TITOL_EN_BLOC = Object.freeze({
  SIGNATURA_INVALIDA: 'La signatura no s’ha completat o no és vàlida: este tractor no s’ha aprovat i la sèrie s’ha aturat ací.'
});

export default function PanellTractors({ magatzem, subtle, tractors: cataleg, entorn, rellotge }) {
  const porta = useTractors({ magatzem, subtle, tractors: cataleg, entorn, rellotge });
  const {
    carregant, error, tractors, persistent, webauthn, aprova, revoca, exporta, oblidaTot
  } = porta;
  const [triatId, setTriatId] = useState(null);
  const [aprovant, setAprovant] = useState(false);
  const [obertures, setObertures] = useState(0);
  const [revocant, setRevocant] = useState(false);
  const [aprovantTots, setAprovantTots] = useState(false);
  const [oblidant, setOblidant] = useState(false);
  const [esborrant, setEsborrant] = useState(false);
  const [avis, setAvis] = useState('');
  const [errorAccio, setErrorAccio] = useState(null);
  const arrel = useRef(null);
  const titolPorta = useRef(null);
  const blocTots = useRef(null);
  const tornaFocus = useRef(false);
  const urlExportat = useRef(null);
  const idBloc = useId();
  const idPorta = useId();
  const idNom = useId();
  const idEmpremta = useId();
  const idHistorial = useId();

  /* L'URL de la darrera exportació viu fins a la següent o fins que el panell
     se'n va: revocar-la de seguida talla la descàrrega en alguns Safari. */
  useEffect(() => () => {
    if (urlExportat.current) URL.revokeObjectURL(urlExportat.current);
  }, []);

  /* Mentre treballa, el botó de l'aprovació en bloc està desactivat i el focus
     cau al document. En acabar torna al botó o, si ja no queda cap pendent, al
     títol de la porta. Si la persona l'ha dut a un altre lloc, no es toca. */
  useEffect(() => {
    if (aprovantTots || !tornaFocus.current) return;
    tornaFocus.current = false;
    const boto = blocTots.current?.querySelector('button');
    const actiu = arrel.current?.ownerDocument.activeElement;
    if (actiu && actiu !== actiu.ownerDocument.body && actiu !== boto) return;
    (boto && !boto.disabled ? boto : titolPorta.current)?.focus();
  }, [aprovantTots]);

  const triat = tractors.find((t) => t.id === triatId) ?? tractors[0] ?? null;
  const pendents = tractors.filter(esAprovableEnBloc).length;
  const m = triat?.manifest;
  const insignia = (t) => INSIGNIA[t.estat] ?? INSIGNIA.pendent;

  function obriAprovacio() {
    setErrorAccio(null);
    setObertures((n) => n + 1);
    setAprovant(true);
  }

  async function aprovaTriat({ nivell, confirmacio }) {
    const { id, empremta, curta, manifest } = triat;
    await aprova(id, { nivell, confirmacio, empremta });
    setAprovant(false);
    setAvis(`Aprovat: ${manifest.nom}, versió ${manifest.versio} (${curta}).`);
  }

  /* Només hi arriba el botó de DEV. Una fallada es diu amb el nom del tractor;
     la resta, al resum. */
  async function aprovaTots() {
    setErrorAccio(null);
    setAvis('');
    setAprovantTots(true);
    try {
      const resultat = await porta.aprovaTotsPendents();
      setAvis(resumEnBloc(resultat));
      const [primer] = resultat.fallits;
      if (primer) {
        const { titol, detall } = textError(primer.error);
        const nom = tractors.find((t) => t.id === primer.id)?.manifest.nom ?? primer.id;
        setErrorAccio({ titol: `${nom}: ${TITOL_EN_BLOC[primer.error?.codi] ?? titol}`, detall });
      }
    } catch (e) {
      setErrorAccio(textError(e));
    } finally {
      tornaFocus.current = true;
      setAprovantTots(false);
    }
  }

  async function revocaTriat() {
    const { id, manifest } = triat;
    setErrorAccio(null);
    setRevocant(true);
    try {
      await revoca(id);
      setAvis(`Aprovació revocada: ${manifest.nom} ja no s’executa.`);
    } catch (e) {
      setErrorAccio(textError(e));
    } finally {
      setRevocant(false);
    }
  }

  /* Descàrrega amb un enllaç temporal: claus públiques i registres, cap dada personal. */
  async function exportaRegistre() {
    setErrorAccio(null);
    try {
      const text = await exporta();
      if (!text) {
        setAvis('No hi ha cap registre que exportar.');
        return;
      }
      if (typeof URL.createObjectURL !== 'function') throw new Error('Este navegador no pot descarregar fitxers generats.');
      const url = URL.createObjectURL(new Blob([text], { type: 'application/x-ndjson' }));
      if (urlExportat.current) URL.revokeObjectURL(urlExportat.current);
      urlExportat.current = url;
      const enllac = arrel.current.ownerDocument.createElement('a');
      enllac.href = url;
      enllac.download = `registre_aprovacions_tractors_${new Date().toISOString().slice(0, 10)}.jsonl`;
      enllac.hidden = true;
      arrel.current.append(enllac);
      enllac.click();
      enllac.remove();
      setAvis('Registre exportat: aprovacions i claus públiques, sense cap dada personal.');
    } catch (e) {
      setErrorAccio(textError(e));
    }
  }

  async function oblida() {
    setEsborrant(true);
    setErrorAccio(null);
    try {
      await oblidaTot();
      setAvis('Aprovacions oblidades: tots els tractors tornen a «pendent».');
    } catch (e) {
      setErrorAccio(textError(e));
    } finally {
      setEsborrant(false);
      setOblidant(false);
    }
  }

  return (
    <section ref={arrel} className="sdp-tractors-panell" aria-labelledby={idPorta}>
      {/* IDEA-27 (ordre del Mestre, àudio de 01:54 del 261025) · H3, paràgraf de
          cos que explica i, després, el botó. L'entradilla («Els components
          comuns…») és de la pàgina (WikiDePobleSection.jsx), davall de l'H2. */}
      <h3 id={idPorta} ref={titolPorta} tabIndex={-1} className="sdp-tractors-panell__titol">Porta d’aprovació de tractors</h3>
      {import.meta.env.DEV ? (
        <>
          <p id={idBloc}>
            {pendents ? `${pendents} ${pendents === 1 ? 'pendent' : 'pendents'} d’aprovar. ` : 'Cap tractor pendent. '}
            Aprovació tècnica del servidor de desenvolupament: no substituïx la lectura de la fitxa ni la revisió
            reflexiva. La primera aprovació després d’un canvi a la porta mateixa es fa d’una en una.
          </p>
          {/* La classe canònica d'Accions (composicio), sense el component: este
              arbre compila com a mòdul contra el nucli 1.3.0, que no l'exposa
              (guardesDelModul.test.js). */}
          <div ref={blocTots} className="sdp-accions">
            <Boto varietat="secundari" onClick={aprovaTots} carregant={aprovantTots}
              disabled={carregant || !pendents} aria-describedby={idBloc}>
              Aprovar tots els pendents (DEV)
            </Boto>
          </div>
        </>
      ) : null}
      {persistent ? null : (
        <Alerta to="avis" viva={false} titol="Este navegador no pot guardar les aprovacions">
          IndexedDB no hi és o no es deixa obrir (passa en algunes finestres privades): les aprovacions només
          duren fins que recarregues la pàgina.
        </Alerta>
      )}
      {error ? <Alerta to="error">{error}</Alerta> : null}
      {errorAccio ? <Alerta to="error" titol={errorAccio.titol}>{errorAccio.detall || null}</Alerta> : null}
      <p role="status">{avis}</p>

      {carregant ? <Carregant etiqueta="Calculant les empremtes…" /> : null}
      {!carregant && !triat ? <p>No hi ha cap tractor registrat.</p> : null}

      {!carregant && triat ? (
        <div className="sdp-tractors-panell__cos">
          <ul className="sdp-tractors-panell__llista" aria-label="Tractors">
            {tractors.map((t) => (
              <li key={t.id}>
                <button type="button" className="sdp-tractors-panell__tria"
                  aria-current={t.id === triat.id ? 'true' : undefined} onClick={() => setTriatId(t.id)}>
                  <span className="sdp-tractors-panell__tria-nom">{t.manifest.nom}</span>
                  <Insignia to={insignia(t).to}>{insignia(t).text}</Insignia>
                </button>
              </li>
            ))}
          </ul>

          <article className="sdp-tractors-panell__detall" aria-labelledby={idNom}>
            <div className="sdp-tractors-panell__cap">
              <h4 id={idNom} className="sdp-tractors-panell__nom">{m.nom}</h4>
              <Insignia to={insignia(triat).to}>{insignia(triat).text}</Insignia>
            </div>
            <p>{m.descripcio}</p>
            <p>{motiuLlegible(triat)}</p>

            {triat.estat === 'incomplet' ? (
              <Alerta to="avis" viva={false} titol="Versió incompleta">
                <p>Encara falten fitxers declarats. Mentre falten, no es pot aprovar ni executar:</p>
                <ul>{triat.fontsAbsents.map((ruta) => <li key={ruta}><code>{ruta}</code></li>)}</ul>
              </Alerta>
            ) : null}

            <dl className="sdp-tractors-panell__dades">
              <div><dt>Identificador</dt><dd><code>{m.id}</code></dd></div>
              <div><dt>Versió</dt><dd>{m.versio}</dd></div>
              <div><dt>Què llig</dt><dd><Llista elements={m.llig} /></dd></div>
              <div><dt>Què escriu</dt><dd><Llista elements={m.escriu} /></dd></div>
              <div><dt>Xarxa</dt><dd>{m.xarxa === 'cap' ? 'Cap: no es connecta enlloc' : m.xarxa}</dd></div>
              <div><dt>Dades personals</dt><dd>{m.dadesPersonals ? 'Sí, en tracta' : 'No en tracta'}</dd></div>
              <div><dt>Nivell mínim</dt><dd>{NIVELLS[m.nivellMinim] ?? m.nivellMinim}</dd></div>
              <div>
                <dt>Caducitat</dt>
                <dd>
                  {m.caducitatDies === null ? 'No caduca' : `${m.caducitatDies} dies des de l’aprovació`}
                  {triat.estat === 'aprovat' && triat.registre?.caduca
                    ? ` · caduca el ${dataLlegible(triat.registre.caduca)}` : ''}
                </dd>
              </div>
            </dl>

            <section className="sdp-tractors-panell__empremta" aria-labelledby={idEmpremta}>
              <h5 id={idEmpremta} className="sdp-tractors-panell__subtitol">Empremta d’esta versió</h5>
              {triat.empremta ? (
                <>
                  <EmpremtaCurta curta={triat.curta} />
                  <code className="sdp-tractors-panell__completa">{triat.empremta}</code>
                </>
              ) : <p>Sense empremta: no es pot aprovar.</p>}
            </section>

            <details className="sdp-tractors-panell__fonts">
              <summary>Fonts que cobrix l’empremta ({m.fonts.length})</summary>
              <ul>
                {m.fonts.map((ruta) => {
                  const font = triat.fonts.find((f) => f.ruta === ruta);
                  return (
                    <li key={ruta}>
                      {font ? (
                        <details>
                          <summary><code>{ruta}</code></summary>
                          <pre className="sdp-tractors-panell__codi"><code>{font.contingut}</code></pre>
                        </details>
                      ) : <><code>{ruta}</code> <Insignia to="avis">Absent</Insignia></>}
                    </li>
                  );
                })}
              </ul>
            </details>

            <section className="sdp-tractors-panell__fitxa" aria-label="Fitxa explicativa">
              {triat.fitxa
                ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(rebaixaTitols(triat.fitxa))) }} />
                : <p>Falta la fitxa explicativa: <code>{m.fitxa}</code>.</p>}
            </section>

            <div className="sdp-accions">
              <Boto varietat="primari" onClick={obriAprovacio} disabled={!triat.empremta || aprovantTots}>Aprova esta versió</Boto>
              <Boto varietat="secundari" onClick={revocaTriat} carregant={revocant}
                disabled={triat.registre?.decisio !== 'aprovat' || aprovantTots}>
                Revoca
              </Boto>
            </div>

            <section aria-labelledby={idHistorial}>
              <h5 id={idHistorial} className="sdp-tractors-panell__subtitol">Historial d’aprovacions</h5>
              {triat.registres.length ? (
                <ol className="sdp-tractors-panell__historial">
                  {[...triat.registres].reverse().map((r) => (
                    <li key={r.nonce}>
                      <time dateTime={r.data}>{dataLlegible(r.data)}</time>
                      {` · ${r.decisio === 'aprovat' ? 'Aprovat' : 'Revocat'} · ${NIVELLS[r.nivell] ?? r.nivell} · versió ${r.versio} · `}
                      <code>{curtaDe(r.empremta)}</code>
                    </li>
                  ))}
                </ol>
              ) : <p>Encara no hi ha cap registre.</p>}
            </section>
          </article>
        </div>
      ) : null}

      <div className="sdp-tractors-panell__peu">
        <p>
          {persistent
            ? 'Les aprovacions es guarden només en este navegador: empremtes, dates i claus públiques, cap dada personal.'
            : 'Les aprovacions no es guarden enlloc.'}
        </p>
        <div className="sdp-accions">
          <Boto varietat="secundari" onClick={exportaRegistre}>Exporta el registre</Boto>
          <Boto varietat="perill" onClick={() => setOblidant(true)}>Oblida les aprovacions d’este navegador</Boto>
        </div>
      </div>

      {triat ? (
        <DialegAprovacio key={obertures} obert={aprovant} manifest={m} empremta={triat.empremta} webauthn={webauthn}
          onTanca={() => setAprovant(false)} onAprova={aprovaTriat} />
      ) : null}
      <DialegConfirmacio
        obert={oblidant}
        destructiu
        carregant={esborrant}
        titol="Vols oblidar les aprovacions d’este navegador?"
        descripcio="S’esborraran les aprovacions i les claus de signatura d’este navegador. Tots els tractors tornaran a «pendent» i no s’executaran fins que els tornes a aprovar. Si en vols una còpia, exporta abans el registre."
        etiquetaConfirma="Sí, oblida-les"
        onTanca={() => { if (!esborrant) setOblidant(false); }}
        onConfirma={oblida}
      />
    </section>
  );
}
