/**
 * PasLlegat.jsx — pas 2 de la Facturació: les factures fetes abans amb una altra eina.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; buit G4 del mapa de la Gestoria). Decisió del Mestre del 261004:
 * el programa obri una sèrie NOVA el dia del pas i les sèries de l'eina
 * d'abans queden tancades. Ací la persona hi posa els números d'aquelles
 * factures (escrits o d'un fitxer de text), en veu el resum abans de desar-lo
 * (sembraLlegat) i el desa al perfil fiscal. Una empresa sense eina d'abans
 * ho diu amb un botó: el llegat buit també s'ha de declarar.
 * Troballa F4 de la revisió (ordre del Mestre, 261007): quan ja hi ha factures
 * emeses, el llegat només s'amplia. «No en tinc» desapareix, i un llegat nou
 * que perdria alguna sèrie declarada (o números) ho diu abans de desar; el
 * magatzem del perfil ho torna a comprovar (PERFIL_FIXAT).
 * Prompt 261014_1605, front G1 · PODER 5: desat el llegat, el resum va
 * recollit dins d'un desplegable (una línia: titolDelLlegat) perquè la
 * Factura nova quede a dalt; l'avís de l'última acció en queda fora.
 */
import { useMemo, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { AreaText, Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { sembraLlegat } from '../facturacio/llegat.js';
import { seriesQueEsPerden } from '../facturacio/magatzemPerfil.js';
import { numerosDelText, resumDelLlegat, titolDelLlegat } from './nucli/formulari.js';
import { AvisDeZona, ErrorsDelFormulari, llegixText } from './peces.jsx';

/* Els números no reconeguts que es mostren; la resta es compten. */
const MAX_NO_RECONEGUTS = 5;

function NoReconeguts({ llista }) {
  if (!llista.length) return null;
  const vistos = llista.slice(0, MAX_NO_RECONEGUTS).map((n) => `«${n}»`).join(', ');
  const resta = llista.length > MAX_NO_RECONEGUTS ? ` i ${llista.length - MAX_NO_RECONEGUTS} més` : '';
  return (
    <p className="sdp-gestoria-panell__nota">
      {`${llista.length === 1 ? 'Un text no té' : `${llista.length} textos no tenen`} la forma d’un número de l’eina d’abans i no compten: ${vistos}${resta}.`}
    </p>
  );
}

function ResumLlegat({ llegat }) {
  const linies = resumDelLlegat(llegat);
  return linies.length
    ? <ul className="sdp-gestoria-panell__avisos">{linies.map((linia) => <li key={linia}>{linia}</li>)}</ul>
    : <p>No hi havia factures d’abans: el programa comença de zero.</p>;
}

export function PasLlegat({ f }) {
  const [obert, setObert] = useState(() => !f.llegat);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState([]);
  const previ = useMemo(() => {
    try {
      return { llegat: sembraLlegat(numerosDelText(text)), error: null };
    } catch (error) {
      return { llegat: null, error };
    }
  }, [text]);
  const quants = numerosDelText(text).length;
  /* Amb factures emeses, les sèries del llegat vigent que el nou perdria (F4). */
  const perdudes = f.perfilFixat && quants && previ.llegat ? seriesQueEsPerden(f.llegat, previ.llegat) : [];

  async function carrega(event) {
    const fitxer = event.target.files?.[0];
    if (!fitxer) return;
    try {
      setText(await llegixText(fitxer));
      setErrors([]);
    } catch {
      setErrors(['No s’ha pogut llegir el fitxer: torna a triar-lo.']);
    }
  }

  async function desa(llegat) {
    const r = await f.desaLlegat(llegat);
    if (r.ok) setObert(false);
  }

  const reobri = () => {
    setText('');
    setErrors([]);
    setObert(true);
  };

  if (!f.config) return <p>Primer cal desar les dades de l’empresa (pas 1).</p>;

  if (f.llegat && !obert) {
    return (
      <>
        <details className="sdp-gestoria-panell__documents">
          <summary>{titolDelLlegat(f.llegat)}</summary>
          <div className="sdp-gestoria-panell__bloc">
            <ResumLlegat llegat={f.llegat} />
            <NoReconeguts llista={f.llegat.noReconeguts} />
            <div className="sdp-gestoria-panell__accions">
              <Boto varietat="secundari" onClick={reobri}>Torna a carregar les factures d’abans</Boto>
            </div>
          </div>
        </details>
        <AvisDeZona avis={f.avis} zona="llegat" onTanca={f.tancaAvis} />
      </>
    );
  }

  return (
    <div className="sdp-gestoria-panell__bloc">
      <p>
        Si abans facturaves amb un altre programa, posa ací els números d’aquelles factures. El programa no
        els continua: obri una sèrie nova i deixa tancades les d’abans, perquè cap número no es puga confondre.
      </p>
      {f.perfilFixat ? (
        <p className="sdp-gestoria-panell__nota">
          Ja has emés factures amb este programa: ara només pots afegir-hi factures d’abans. Torna a posar-hi
          totes les que ja havies declarat, i les que falten.
        </p>
      ) : null}
      <Camp etiqueta="Números de les factures d’abans" ajuda="Un per línia, tal com eixien a les factures (per exemple «F26 0001»).">
        <AreaText files={6} value={text} spellCheck={false} onChange={(event) => setText(event.target.value)} />
      </Camp>
      <Camp etiqueta="O carrega’ls d’un fitxer de text (opcional)" ajuda="Un fitxer .txt o .csv amb els números.">
        <CampText tipus="file" accept=".txt,.csv,text/plain,text/csv" textBoto="Tria el fitxer" onChange={carrega} />
      </Camp>
      {quants && previ.llegat ? (
        <>
          <p>{`Has posat ${quants === 1 ? 'un número' : `${quants} números`}. Quedaran així:`}</p>
          <ResumLlegat llegat={previ.llegat} />
          <NoReconeguts llista={previ.llegat.noReconeguts} />
        </>
      ) : null}
      <ErrorsDelFormulari titol="No s’han pogut llegir les factures d’abans" errors={previ.error ? [previ.error.message, ...errors] : errors} />
      <ErrorsDelFormulari titol="Així es perdrien factures d’abans ja declarades" errors={perdudes} />
      <AvisDeZona avis={f.avis} zona="llegat" onTanca={f.tancaAvis} />
      <div className="sdp-gestoria-panell__accions">
        <Boto varietat="primari" disabled={!quants || !previ.llegat || perdudes.length > 0} carregant={f.ocupat === 'llegat'}
          onClick={() => desa(previ.llegat)}>
          Desa les factures d’abans
        </Boto>
        {f.perfilFixat ? null : (
          <Boto varietat="secundari" disabled={f.ocupat === 'llegat'} onClick={() => desa(sembraLlegat([]))}>
            No en tinc: comence de zero
          </Boto>
        )}
        {f.llegat ? <Boto varietat="secundari" onClick={() => setObert(false)}>Deixa-ho com estava</Boto> : null}
      </div>
    </div>
  );
}
