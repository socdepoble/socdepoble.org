/**
 * PanellTractors.jsx — la porta d'aprovació de tractors, a la vista del Mestre.
 *
 * Contingut sense pàgina ni h1: l'embolcall (la Wiki, només en
 * desenvolupament) hi posa la UniversalPage. Per a cada tractor: l'estat, què
 * fa, què llig i què escriu, l'empremta, les fonts, la fitxa sencera i
 * l'historial. Aprovar obri DialegAprovacio; revocar és immediat; oblidar-ho
 * tot demana confirmació. Les proves injecten magatzem, subtle, tractors,
 * entorn i rellotge (vegeu useTractors).
 */
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
import { useTractors } from './useTractors.js';

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

function EmpremtaCurta({ curta }) {
  const [copiat, setCopiat] = useState(false);
  return (
    <code 
      className="sdp-tractors-panell__curta"
      title="Copia l'empremta al porta-retalls"
      style={{ cursor: 'pointer', display: 'inline-block', padding: '0.4rem 0.8rem', background: 'var(--sdp-fons)', border: '1px solid var(--sdp-vora)', borderRadius: 'var(--sdp-radi-m)', userSelect: 'all' }}
      onClick={() => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(curta).catch(() => {});
          setCopiat(true);
          setTimeout(() => setCopiat(false), 1500);
        }
      }}
    >
      {copiat ? 'Copiat!' : curta}
    </code>
  );
}

/* La fitxa penja de l'h3 del tractor: els seus títols baixen dos esglaons
   («#» ix com a h4). Les tanques de codi no es toquen. */
export function rebaixaTitols(md, salts = 2) {
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

export default function PanellTractors({ magatzem, subtle, tractors: cataleg, entorn, rellotge }) {
  const {
    carregant, error, tractors, persistent, webauthn, aprova, revoca, exporta, oblidaTot
  } = useTractors({ magatzem, subtle, tractors: cataleg, entorn, rellotge });
  const [triatId, setTriatId] = useState(null);
  const [aprovant, setAprovant] = useState(false);
  const [obertures, setObertures] = useState(0);
  const [revocant, setRevocant] = useState(false);
  const [oblidant, setOblidant] = useState(false);
  const [esborrant, setEsborrant] = useState(false);
  const [avis, setAvis] = useState('');
  const [errorAccio, setErrorAccio] = useState(null);
  const arrel = useRef(null);
  const urlExportat = useRef(null);
  const idTitol = useId();
  const idNom = useId();
  const idEmpremta = useId();
  const idHistorial = useId();

  /* L'URL de la darrera exportació viu fins a la següent o fins que el panell
     se'n va: revocar-la de seguida talla la descàrrega en alguns Safari. */
  useEffect(() => () => {
    if (urlExportat.current) URL.revokeObjectURL(urlExportat.current);
  }, []);

  const triat = tractors.find((t) => t.id === triatId) ?? tractors[0] ?? null;
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
    <section ref={arrel} className="sdp-tractors-panell" aria-labelledby={idTitol}>
      <h2 id={idTitol} className="sdp-tractors-panell__titol">Porta d’aprovació de tractors</h2>
      <p>
        Un tractor és un automatisme que processa dades. Cap s’executa si no n’has aprovat la versió exacta:
        l’empremta cobrix el manifest, la fitxa i cada línia de les fonts llistades, que són el codi del tractor,
        el de la seua interfície i el d’esta porta. Els components comuns de l’app (botons, diàlegs, navegació)
        no hi entren. Si en canvia una línia, torna a «pendent».
      </p>
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
              <h3 id={idNom} className="sdp-tractors-panell__nom">{m.nom}</h3>
              <Insignia to={insignia(triat).to}>{insignia(triat).text}</Insignia>
            </div>
            <p>{m.descripcio}</p>
            <p className="sdp-tractors-panell__motiu">{motiuLlegible(triat)}</p>

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
              <h4 id={idEmpremta} className="sdp-tractors-panell__subtitol">Empremta d’esta versió</h4>
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

            <div className="sdp-tractors-panell__accions">
              <Boto varietat="primari" onClick={obriAprovacio} disabled={!triat.empremta}>Aprova esta versió</Boto>
              <Boto varietat="secundari" onClick={revocaTriat} carregant={revocant}
                disabled={triat.registre?.decisio !== 'aprovat'}>
                Revoca
              </Boto>
            </div>

            <section aria-labelledby={idHistorial}>
              <h4 id={idHistorial} className="sdp-tractors-panell__subtitol">Historial d’aprovacions</h4>
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
        <Boto varietat="secundari" onClick={exportaRegistre}>Exporta el registre</Boto>
        <Boto varietat="perill" onClick={() => setOblidant(true)}>Oblida les aprovacions d’este navegador</Boto>
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
