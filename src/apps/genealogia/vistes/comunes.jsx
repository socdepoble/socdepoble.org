/**
 * comunes.jsx — peces de l'Arbre Genealògic que fan servir totes les vistes.
 *
 *   useIdioma / useT      la llengua de la closca (useClosaAplicacio().idioma) i el traductor
 *   MarcGenealogia        el marc d'una columna (MarcColumna + AppGridColumn), com MarcSalut
 *   PanellArbres          la columna de l'esquerra: els arbres d'este dispositiu
 *   EtiquetaEstat         [CONFIRMAT] [APROXIMAT] [FALTA CONFIRMAR] [CONTRADICCIÓ] amb text, no només color
 *   LlegendaEstats        què vol dir cada estat
 *   CampData              una data amb les 4 precisions i un selector de dècada
 *   CasellaVius           la casella d'incloure persones vives, desmarcada per defecte
 *   BotoCopia             copia un text amb navigator.clipboard (l'app no envia res)
 *   CarregaPrivada        un clic: el meu arbre privat (.json o .ged), llegit i desat en este dispositiu
 *   EnllacBoto, useNavegaGenealogia, useEstret
 * Cap classe pròpia, cap style i cap full CSS: la geometria és de Pedra Seca.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  Accions, Alerta, Boto, Camp, CampFitxer, CampText, Casella, DialegConfirmacio, GrupCamps, GrupOpcions, Insignia, MarcColumna, Pila, Selector
} from '../../../components/PedraSeca/index.js';
import { useApp, useClosaAplicacio } from '../../plataforma/index.js';
import { llegeixFitxerArbre, lligTextFitxerArbre } from '../gedcom/index.js';
import { ESTATS, ETIQUETES_ESTAT, MIDA_MAXIMA_IMPORTACIO, PRECISIONS, useGenealogia } from '../nucli/index.js';
import { llenguaDe, t, textCodiLectura, textError } from '../textos.js';

/* El to de la insígnia de cada estat: el text la fa llegible sense color. */
const TO_ESTAT = Object.freeze({ confirmat: 'exit', aproximat: 'info', 'falta-confirmar': 'avis', contradiccio: 'error' });

/** La llengua de la closca; fora de les cinc, 'ca'. Una app no llig UIContext. */
export function useIdioma() {
  return llenguaDe(useClosaAplicacio().idioma);
}

/** El traductor de la llengua de la closca: tx('clau', { valor }). */
export function useT() {
  const idioma = useIdioma();
  return useCallback((clau, valors) => t(idioma, clau, valors), [idioma]);
}

/** Navegar dins de l'app (push): navega(['arbre', id]). */
export function useNavegaGenealogia() {
  const navigate = useNavigate();
  const { ruta } = useApp();
  return useCallback((trams, opcions) => navigate(ruta(...[].concat(trams)), opcions), [navigate, ruta]);
}

/** Si la closca ensenya una sola columna (un mòbil). */
export function useEstret() {
  return useClosaAplicacio().mida === 'estret';
}

/** Un enllaç de l'app amb forma de botó (secundari). */
export function EnllacBoto({ a, children }) {
  return <Link to={a} className="sdp-boto sdp-boto--secundari">{children}</Link>;
}

const NOU_ID = () => globalThis.crypto.randomUUID();

/**
 * P0-114b (ordre del Mestre, 261111): el meu arbre privat amb UN clic. La
 * persona tria un .json (llavor privada o còpia de l'app) o un .ged; el
 * format es detecta pel contingut, el fitxer es llig en este dispositiu
 * i l'arbre es desa com a arbre NOU al magatzem local
 * (IndexedDB «sdp-genealogia»). No hi ha xarxa: el fitxer no ix d'ací. El
 * nom del fitxer (pot portar cognoms) no es pinta enlloc.
 */
export function CarregaPrivada() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const navega = useNavegaGenealogia();
  const [missatge, setMissatge] = useState(null);
  const [lectura, setLectura] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const enCurs = useRef(false);
  const generacio = useRef(0);
  useEffect(() => () => { generacio.current += 1; }, []);
  if (!g.carregat || !g.avisAcceptat) return null;

  const tria = async (event) => {
    if (enCurs.current || g.nomesLectura) return;
    const token = ++generacio.current;
    const [fitxer] = event.target.files || [];
    setMissatge(null);
    setLectura(null);
    if (!fitxer) return;
    /* El límit es mira abans de llegir: un fitxer massa gran no entra mai a la memòria. */
    if (!(fitxer.size <= MIDA_MAXIMA_IMPORTACIO)) {
      setMissatge({ to: 'error', text: tx('importa.massaGran') });
      return;
    }
    enCurs.current = true;
    setOcupat(true);
    try {
      const text = await lligTextFitxerArbre(fitxer);
      if (token !== generacio.current) return;
      const resultat = llegeixFitxerArbre(text, { nouId: NOU_ID, ara: new Date().toISOString(), anyActual: g.anyActual, titol: tx('privada.titolArbre') });
      const codis = [...(resultat.errors || []), ...(resultat.avisos || [])];
      setLectura(codis.length ? { codis, json: resultat.format !== 'gedcom' } : null);
      if (!resultat.ok || !resultat.complet) {
        setMissatge({ to: 'error', text: tx('privada.noValid') });
        return;
      }
      await g.importa(resultat.complet, { mode: 'nou' });
      if (token !== generacio.current) return;
      setMissatge({ to: 'exit', text: tx('privada.fet', { persones: resultat.complet.persones.length, relacions: resultat.complet.relacions.length }) });
      navega(['arbre']);
    } catch (error) {
      if (token === generacio.current) setMissatge({ to: 'error', text: textError(error, idioma) });
    } finally {
      enCurs.current = false;
      if (token === generacio.current) setOcupat(false);
    }
  };

  return (
    <Pila gap={2}>
      <p>{tx('privada.explica')}</p>
      <Camp etiqueta={tx('privada.fitxer')}>
        <CampFitxer accept=".json,.ged" textBoto={tx('privada.boto')} nomsVisibles={false} onChange={tria} disabled={g.nomesLectura || ocupat} />
      </Camp>
      {lectura ? (
        <Alerta to="avis" viva={false} titol={tx('importa.avisos')}>
          {lectura.codis.slice(0, 50).map((codi, i) => (
            <p key={`${i}-${String(codi)}`}>{textCodiLectura(codi, idioma, { json: lectura.json })}</p>
          ))}
        </Alerta>
      ) : null}
      {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
    </Pila>
  );
}

/* El peu de les columnes en estret i en mitjana: el panell dels arbres hi queda amagat. */
function PeuGenealogia() {
  const { obriPanell } = useClosaAplicacio();
  const tx = useT();
  return (
    <Accions>
      <Boto varietat="fantasma" data-obri-columna="esquerra" aria-controls="app-grid-sidebar" onClick={() => obriPanell('esquerra')}>
        {tx('col.esquerra')}
      </Boto>
    </Accions>
  );
}

/**
 * El marc d'una columna. `columna`: 'esquerra', 'mig' o 'detall'. El peu va on
 * es veu sense el panell de l'esquerra: en estret, a la columna visible; en
 * mitjana, a la del mig. En ample, el panell ja es veu.
 */
export function MarcGenealogia({ titol, eines = null, columna = 'detall', children }) {
  const { mida } = useClosaAplicacio();
  const ambPeu = columna !== 'esquerra' && (mida === 'estret' || (mida === 'mitja' && columna === 'mig'));
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={eines} peu={ambPeu ? <PeuGenealogia /> : null} etiqueta={titol}>
      {children}
    </MarcColumna>
  );
}

/** [CONFIRMAT] [APROXIMAT] [FALTA CONFIRMAR] [CONTRADICCIÓ]: sempre amb el text de l'estat. */
export function EtiquetaEstat({ estat }) {
  const net = ESTATS.includes(estat) ? estat : 'falta-confirmar';
  return <Insignia to={TO_ESTAT[net]}>{ETIQUETES_ESTAT[net]}</Insignia>;
}

/** Els quatre estats, cadascun amb la seua explicació. */
export function LlegendaEstats() {
  const tx = useT();
  return (
    <GrupCamps llegenda={tx('llegenda')}>
      {ESTATS.map((estat) => (
        <p key={estat}><EtiquetaEstat estat={estat} />{' '}{tx(`estat.${estat}`)}</p>
      ))}
    </GrupCamps>
  );
}

/* ── Data amb 4 precisions ───────────────────────────────────────────────── */

const DECADES = Object.freeze(Array.from({ length: 22 }, (_, i) => String(1800 + i * 10)));

/* La forma canònica (la de llegeixData) ↔ { precisio, any, decada }. Sense regex amb quantificadors niats. */
function desfesData(valor) {
  const text = typeof valor === 'string' ? valor.trim() : '';
  if (text === '' || text === '?') return { precisio: 'desconeguda', any: '', decada: '' };
  if (/^\d{4}s$/.test(text)) return { precisio: 'aproximada', any: '', decada: text.slice(0, 4) };
  if (text.startsWith('~')) return { precisio: 'aproximada', any: text.slice(1), decada: '' };
  if (text.endsWith('?')) return { precisio: 'estimada', any: text.slice(0, -1), decada: '' };
  return { precisio: 'exacta', any: text, decada: '' };
}

function fesData({ precisio, any, decada }) {
  if (decada) return `${decada}s`;
  const net = String(any || '').trim();
  if (precisio === 'desconeguda' || net === '') return '';
  if (precisio === 'aproximada') return `~${net}`;
  if (precisio === 'estimada') return `${net}?`;
  return net;
}

/**
 * Una data amb les quatre precisions (exacta 1908, aproximada ~1908, estimada
 * 1908?, desconeguda) i un selector de dècada (1930s, que el nucli desa com a
 * aproximada). `valor` i `onCanvi` porten la forma canònica de llegeixData; la
 * validació la fa el nucli.
 */
export function CampData({ etiqueta, valor, onCanvi, error, desactivat = false }) {
  const tx = useT();
  const [local, setLocal] = useState(() => desfesData(valor));
  const [dataGedcom] = useState(() => /^(ABT|CAL|EST|BEF|AFT|BET|FROM|TO) /.test(valor));
  if (dataGedcom) {
    return <Camp etiqueta={etiqueta} error={error}>
      <CampText maxLength={64} value={valor} disabled={desactivat} onChange={(event) => onCanvi(event.target.value)} />
    </Camp>;
  }
  const actual = fesData(local) === (typeof valor === 'string' ? valor.trim() : '') ? local : desfesData(valor);
  const canvia = (nou) => {
    setLocal(nou);
    onCanvi(fesData(nou));
  };
  return (
    <GrupCamps llegenda={etiqueta}>
      <GrupOpcions llegenda={tx('data.precisio')} valor={actual.decada ? 'aproximada' : actual.precisio} disabled={desactivat}
        opcions={PRECISIONS.map((precisio) => ({ valor: precisio, etiqueta: tx(`precisio.${precisio}`) }))}
        onCanvi={(precisio) => canvia({ precisio, any: precisio === 'desconeguda' ? '' : actual.any, decada: '' })} />
      {actual.precisio !== 'desconeguda' || actual.decada ? (
        <Camp etiqueta={tx('data.any')} error={error}>
          <CampText inputMode="numeric" maxLength={10} value={actual.any} disabled={desactivat || Boolean(actual.decada)}
            onChange={(event) => canvia({ precisio: actual.precisio === 'desconeguda' ? 'exacta' : actual.precisio, any: event.target.value, decada: '' })} />
        </Camp>
      ) : null}
      <Camp etiqueta={tx('data.decada')}>
        <Selector value={actual.decada} disabled={desactivat}
          opcions={[{ valor: '', etiqueta: tx('data.senseDecada') }, ...DECADES.map((decada) => ({ valor: decada, etiqueta: tx('data.decadaValor', { decada }) }))]}
          onChange={(event) => canvia({ precisio: event.target.value ? 'aproximada' : 'exacta', any: '', decada: event.target.value })} />
      </Camp>
      {error && actual.precisio === 'desconeguda' && !actual.decada ? <Alerta to="error" viva={false}>{error}</Alerta> : null}
    </GrupCamps>
  );
}

/** «Inclou persones vives (només si tens el seu consentiment)», desmarcada per defecte. */
export function CasellaVius({ marcada, onCanvi }) {
  const tx = useT();
  return <Casella etiqueta={tx('vius.casella')} ajuda={tx('vius.ajuda')} checked={marcada} onChange={(event) => onCanvi(event.target.checked)} />;
}

/**
 * Copia `text` al porta-retalls. És l'única eixida dels prompts i de les
 * consultes, i la fa la persona: l'app no envia res a cap servei.
 */
export function BotoCopia({ text, etiqueta }) {
  const tx = useT();
  const [estat, setEstat] = useState(null);
  const copia = async () => {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('sense porta-retalls');
      await globalThis.navigator.clipboard.writeText(String(text));
      setEstat('copiat');
    } catch {
      setEstat('noCopiat');
    }
  };
  return (
    <Pila gap={2}>
      <Accions>
        <Boto varietat="primari" disabled={!text} onClick={copia}>{etiqueta || tx('boto.copia')}</Boto>
      </Accions>
      {estat ? <Alerta to={estat === 'copiat' ? 'exit' : 'avis'}>{tx(`boto.${estat}`)}</Alerta> : null}
    </Pila>
  );
}

/* La columna de l'esquerra: igual a totes les rutes, i per això no es desmunta. */
export function PanellArbres() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const navega = useNavegaGenealogia();
  const { mida, tancaPanells } = useClosaAplicacio();
  const [titol, setTitol] = useState('');
  const [esborrant, setEsborrant] = useState(null);
  const [error, setError] = useState(null);
  if (!g.carregat) return null;
  const arbreId = g.complet?.arbre?.id || '';
  const opcions = g.arbres.map((arbre) => ({ valor: arbre.id, etiqueta: arbre.titol || tx('panell.titolPerDefecte') }));
  const crea = async (event) => {
    event.preventDefault();
    try {
      await g.creaArbre({ titol: titol.trim() || tx('panell.titolPerDefecte') });
      setTitol('');
      setError(null);
      navega(['entrevista']);
    } catch (e) {
      setError(textError(e, idioma));
    }
  };
  const tria = (id) => g.triaArbre(id).then(() => setError(null), (e) => setError(textError(e, idioma)));
  const esborra = async () => {
    const esperat = esborrant;
    setEsborrant(null);
    if (!esperat) return;
    try {
      await g.esborraArbre(esperat.arbre.id, { esperat });
      setError(null);
    } catch (e) {
      setError(textError(e, idioma));
    }
  };
  return (
    <MarcGenealogia titol={tx('col.esquerra')} columna="esquerra">
      <Pila gap={4}>
        {opcions.length ? (
          <Camp etiqueta={tx('panell.actiu')}>
            <Selector value={arbreId} disabled={g.nomesLectura} onChange={(event) => tria(event.target.value)}
              opcions={arbreId ? opcions : [{ valor: '', etiqueta: '—' }, ...opcions]} />
          </Camp>
        ) : <p>{tx('panell.cap')}</p>}
        {g.complet ? <p>{tx('panell.recompte', { persones: g.complet.persones.length, relacions: g.complet.relacions.length })}</p> : null}
        <CarregaPrivada />
        <form onSubmit={crea} noValidate aria-label={tx('panell.crea')}>
          <Pila gap={2}>
            <Camp etiqueta={tx('panell.nou')}>
              <CampText maxLength={80} autoComplete="off" value={titol} disabled={g.nomesLectura} onChange={(event) => setTitol(event.target.value)} />
            </Camp>
            <Accions>
              <Boto varietat={opcions.length ? 'secundari' : 'primari'} tipus="submit" disabled={g.nomesLectura}>{tx('panell.crea')}</Boto>
            </Accions>
          </Pila>
        </form>
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {g.persistent ? (
          <Alerta to="info" viva={false} titol={tx('panell.persistent.titol')}>{tx('panell.persistent.text')}</Alerta>
        ) : (
          <Alerta to="avis" titol={tx('panell.memoria.titol')}>{tx('panell.memoria.text')}</Alerta>
        )}
        {g.nomesLectura ? <Alerta to="avis" titol={tx('panell.lectura.titol')}>{tx('panell.lectura.text')}</Alerta> : null}
        {g.complet && g.complet.persones.length > 0 ? (
          <Alerta to="info" viva={false} titol={tx('panell.copia.titol')}
            accions={<EnllacBoto a={ruta('intercanvi')}>{tx('panell.copia.boto')}</EnllacBoto>}>
            {tx('panell.copia.text')}
          </Alerta>
        ) : null}
        {arbreId ? (
          <Accions>
            <Boto varietat="perill" disabled={g.nomesLectura} onClick={() => setEsborrant(g.complet)}>{tx('panell.esborra')}</Boto>
          </Accions>
        ) : null}
        {/* En estret i en mitjana el panell tapa la resta: la tornada és ací. */}
        {mida !== 'ample' ? <Accions><Boto varietat="secundari" onClick={tancaPanells}>{tx('boto.torna')}</Boto></Accions> : null}
      </Pila>
      <DialegConfirmacio obert={Boolean(esborrant)} destructiu titol={tx('panell.esborra.titol')} etiquetaConfirma={tx('panell.esborra')}
        etiquetaCancela={tx('boto.cancela')} descripcio={tx('panell.esborra.text')} onTanca={() => setEsborrant(null)} onConfirma={esborra} />
    </MarcGenealogia>
  );
}
