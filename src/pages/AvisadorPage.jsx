/* Onada R32.12 · T1 (ordre del Mestre, 261118 19:33, captures 261118_1933_avisador_batec_de_vida_captura1/2) ·
   Redisseny Pedra Seca de /page/avisador:
   · fora la banda beta (parlava de Veri*Factu en una eina que no factura) i l'entradilla al seu lloc
     arquitectònic: `lead` de PageFrame, sota «Batec de Vida»;
   · «Com funciona i límits de seguretat» en <h3> + paràgrafs amb negretes d'escaneig (Llei 35), el 112
     clicable (tel:112) i vincles al Xat i a Dispositius;
   · «Horari de l'avís» en una fila de tres camps alineats (una columna en mòbil) i la nota dels 12 hores
     davall de la fila, no dins del tercer camp;
   · «Persones de confiança» amb comptador, la bafarada del missatge a tota l'amplària i targetes de
     contacte seleccionables (diana >= 48px);
   · «Còpia de l'horari» al final de tot, plegada en un <details> amb botons normals.
   El CSS viu en un full diferit (src/css/diferit-avisador.css, useFullDiferit): 0 B a l'arrencada del
   connector de WordPress. */
import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../app/contexts/RouterContext.jsx';
import { useSessioOpcional } from '../app/contexts/SessionContext.jsx';
import { PageFrame } from '../components/universal/PageFrame.jsx';
import { Avatar } from '../components/PedraSeca/atoms/Avatar.jsx';
import { Boto } from '../components/PedraSeca/atoms/Boto.jsx';
import { Camp, CampText, Casella, Selector } from '../components/PedraSeca/organismes/formulari.jsx';
import { useFullDiferit } from '../config/fullDiferit.js';
import cssAvisador from '../css/diferit-avisador.css?inline';
import { useModeracio } from '../components/PedraSeca/hooks/moderacioDePoble.js';
import { tradueix, useTraductorOpcional } from '../components/PedraSeca/hooks/useTraductorOpcional.js';
import { rutaDEntrada } from '../config/rutaEntrada.js';
import { useXat } from '../sections/xat/XatContext.jsx';
import {
  activaAvisador, AJUSTOS_AVISADOR, clauConfiguracioAvisador, esDescansValid, esDirecteDeConfianca, estatAvisador,
  exportaHorariAvisador, HORES_AVISADOR, importaHorariAvisador, MAX_BYTES_AJUSTOS_AVISADOR, MISSATGE_AVISADOR
} from '../services/avisador.js';
import { ambBloqueigPreferenciesAvisador, desaAvisador, escoltaAvisador, llegixAvisador } from '../services/avisadorPreferencies.js';
import { omple, TEXTOS_AVISADOR as TX } from './textosAvisador.js';

/* Els enllaços que la pàgina posa dins dels textos rics (textosAvisador.js). */
const ENLLACOS_GUIA = Object.freeze({
  telefon112: () => <a href="tel:112">112</a>,
  enllacXat: (tx) => <Link to="/xat">{tx(TX.enllacXat)}</Link>,
  enllacDispositius: (tx) => <Link to="/dispositius">{tx(TX.enllacDispositius)}</Link>,
});

/**
 * Pinta un text ric ja traduït amb només dos marques: `**…**` → <strong> i `{nom}` → l'enllaç
 * d'ENLLACOS_GUIA. No interpreta cap HTML: tot el que no és marca es pinta com a text pla, i un
 * marcador desconegut o una negreta sense tancar es queden tal qual (Llei 0: res no desapareix).
 */
export function textRic(plantilla, tx) {
  const nodes = [];
  const peces = String(plantilla).split(/(\*\*[^*]+\*\*|\{\w+\})/g);
  peces.forEach((peca, i) => {
    if (!peca) return;
    const negreta = /^\*\*([^*]+)\*\*$/.exec(peca);
    if (negreta) {
      nodes.push(<strong key={i}>{textRic(negreta[1], tx)}</strong>);
      return;
    }
    const marcador = /^\{(\w+)\}$/.exec(peca);
    const enllac = marcador && Object.hasOwn(ENLLACOS_GUIA, marcador[1]) ? ENLLACOS_GUIA[marcador[1]] : null;
    nodes.push(<Fragment key={i}>{enllac ? enllac(tx) : peca}</Fragment>);
  });
  return nodes;
}

function contactesDelXat(xat, moderacio) {
  const contactes = new Map();
  for (const fil of xat.chatThreads) {
    if (esDirecteDeConfianca(fil, xat.joId) && !moderacio?.esPersonaBloquejada?.(fil.altres[0].id)) {
      contactes.set(fil.altres[0].id, fil);
    }
  }
  return [...contactes.values()];
}

function FormulariAvisador({ clau, xat }) {
  const [desat, setDesat] = useState(() => estatAvisador(llegixAvisador(clau)));
  const [ajustos, setAjustos] = useState(() => desat ?? AJUSTOS_AVISADOR);
  const [seleccio, setSeleccio] = useState(() => desat?.personesConfiansa.map((p) => p.personaId) ?? []);
  // Qui ja l'havia activat en este dispositiu ja havia confirmat les limitacions.
  const [llegit, setLlegit] = useState(() => Boolean(desat));
  const [error, setError] = useState('');
  const [desant, setDesant] = useState(false);
  const [estatCopia, setEstatCopia] = useState('');
  const [errorCopia, setErrorCopia] = useState('');
  const grupPersones = useRef(null);
  const baseConfiguracio = useRef(clauConfiguracioAvisador(desat));
  const rondaCopia = useRef(0);
  const moderacio = useModeracio();
  const t = useTraductorOpcional();
  const tx = (parell) => tradueix(t, parell);
  const idForm = useId();
  const context = useRef(null);
  useLayoutEffect(() => {
    context.current = { clau, scope: xat.scopeKey };
    return () => { context.current = null; };
  }, [clau, xat.scopeKey]);
  const contactes = contactesDelXat(xat, moderacio);
  const filDe = new Map(contactes.map((fil) => [fil.altres[0].id, fil]));
  const sincronitza = (estat) => {
    baseConfiguracio.current = clauConfiguracioAvisador(estat);
    setDesat(estat);
    setAjustos(estat ?? AJUSTOS_AVISADOR);
    setSeleccio(estat?.personesConfiansa.map((p) => p.personaId) ?? []);
  };
  useEffect(() => escoltaAvisador(clau, () => setDesat(estatAvisador(llegixAvisador(clau)))), [clau]);

  function actualitza(camp, valor) {
    setAjustos((previs) => ({ ...previs, [camp]: valor }));
    setError('');
  }
  function tria(id, marcat) {
    setSeleccio((prev) => marcat ? (prev.length < 3 ? [...prev, id] : prev) : prev.filter((p) => p !== id));
    setError('');
  }
  async function desa(event) {
    event.preventDefault();
    if (!llegit) return;
    if (!esDescansValid(ajustos.horaIniciNit, ajustos.horaFiNit)) {
      setError(`${tx(TX.errorDescans)} ${tx(TX.descansMaxim)}`);
      return;
    }
    const nou = activaAvisador(ajustos, seleccio.map((id) => filDe.get(id)), xat.joId);
    if (!nou || nou.personesConfiansa.length !== seleccio.length) {
      setError(tx(TX.errorPersones));
      return;
    }
    const ambit = context.current;
    const previ = baseConfiguracio.current;
    setDesant(true);
    setError('');
    try {
      if (moderacio?.asseguraNormes && !await moderacio.asseguraNormes()) {
        setError(tx(TX.errorNormes));
        return;
      }
      await ambBloqueigPreferenciesAvisador(clau, () => {
        if (context.current !== ambit) return;
        const actual = estatAvisador(llegixAvisador(clau));
        if (clauConfiguracioAvisador(actual) !== previ) {
          sincronitza(actual);
          setError(tx(TX.errorCanviConcurrent));
          return;
        }
        const configurat = { ...nou, ultimBatec: Date.now() };
        if (desaAvisador(clau, configurat)) sincronitza(configurat);
        else setError(tx(TX.errorDesaDispositiu));
      });
    } catch {
      setError(tx(TX.errorDesa));
    } finally {
      setDesant(false);
    }
  }
  async function desactiva() {
    const ambit = context.current;
    try {
      await ambBloqueigPreferenciesAvisador(clau, () => {
        if (context.current !== ambit) return;
        if (desaAvisador(clau, null)) {
          sincronitza(null);
          setError('');
        } else setError(tx(TX.errorDesactiva));
      });
    } catch {
      setError(tx(TX.errorDesactiva));
    }
  }

  function descarregaHorari() {
    setErrorCopia('');
    setEstatCopia('');
    const text = exportaHorariAvisador(ajustos);
    if (!text) {
      setErrorCopia(tx(TX.errorCopiaHorari));
      return;
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const enllac = document.createElement('a');
      enllac.href = url;
      enllac.download = 'avisador-horari.json';
      enllac.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setErrorCopia(tx(TX.errorCopiaHorari));
    }
  }

  async function triaHorari(event) {
    const fitxer = event.target.files?.[0];
    event.target.value = '';
    if (!fitxer) return;
    const ambit = context.current;
    const ronda = ++rondaCopia.current;
    setEstatCopia('');
    setErrorCopia('');
    let horari = null;
    try {
      if (fitxer.size <= MAX_BYTES_AJUSTOS_AVISADOR) horari = importaHorariAvisador(await fitxer.text());
    } catch { /* El fitxer no s'ha pogut llegir. */ }
    if (context.current !== ambit || ronda !== rondaCopia.current) return;
    if (horari) {
      setAjustos(horari);
      setError('');
      setEstatCopia(tx(TX.horariCarregat));
    } else setErrorCopia(tx(TX.errorCopiaHorari));
  }

  const enviats = desat?.personesConfiansa.filter((persona) => persona.estat === 'enviat').length ?? 0;
  const fallits = desat?.personesConfiansa.filter((persona) => persona.estat === 'fallit').length ?? 0;
  const estatDe = new Map((desat?.personesConfiansa ?? []).map((persona) => [persona.personaId, persona.estat]));
  const textEstat = (id) => {
    const estat = estatDe.get(id);
    if (estat === 'enviat') return tx(TX.estatEnviat);
    if (estat === 'fallit') return tx(TX.estatFallit);
    return '';
  };
  const noDisponibles = seleccio.filter((id) => !filDe.has(id));
  return (
    <form onSubmit={desa} className="sdp-avisador__formulari">
      <section className="sdp-avisador__seccio" aria-labelledby={`${idForm}-horari`}>
        <h3 id={`${idForm}-horari`}>{tx(TX.llegendaHorari)}</h3>
        <div className="sdp-avisador__horari">
          <Camp etiqueta={tx(TX.horesSenseActivitat)}>
            <Selector
              opcions={HORES_AVISADOR.map((hores) => ({ valor: hores, etiqueta: `${hores} h` }))}
              value={ajustos.horesImmobilitat}
              onChange={(event) => actualitza('horesImmobilitat', Number(event.target.value))}
            />
          </Camp>
          {/* Revisió adversarial (A11Y-02) · La nota dels 12 hores viu davall de la fila, però els dos camps
              del descans la continuen anunciant (aria-describedby). */}
          <Camp etiqueta={tx(TX.iniciDescans)} obligatori>
            <CampText tipus="time" value={ajustos.horaIniciNit} aria-describedby={`${idForm}-nota`}
              onChange={(event) => actualitza('horaIniciNit', event.target.value)} />
          </Camp>
          <Camp etiqueta={tx(TX.fiDescans)} obligatori>
            <CampText tipus="time" value={ajustos.horaFiNit} aria-describedby={`${idForm}-nota`}
              onChange={(event) => actualitza('horaFiNit', event.target.value)} />
          </Camp>
        </div>
        <p className="sdp-avisador__nota" id={`${idForm}-nota`}>{tx(TX.descansMaxim)}</p>
      </section>

      <section className="sdp-avisador__seccio" aria-labelledby={`${idForm}-persones`}>
        <div className="sdp-avisador__cap">
          <h3 id={`${idForm}-persones`}>{tx(TX.llegendaPersones)}</h3>
          <p className="sdp-avisador__comptador" id={`${idForm}-comptador`} aria-live="polite">
            {omple(tx(TX.comptadorPersones), { seleccionades: seleccio.length })}
          </p>
        </div>
        <p>{tx(TX.triaPersones)}</p>
        <p className="sdp-avisador__rebran">{tx(TX.rebran)}</p>
        {/* El missatge que s'envia és sempre en valencià (A11Y-01: lang per al lector de pantalla). */}
        <blockquote className="sdp-avisador__bafarada" lang="ca">{MISSATGE_AVISADOR}</blockquote>
        {contactes.length === 0
          ? <p><Link to="/xat">{tx(TX.obriConversa)}</Link>{` ${tx(TX.obriConversaResta)}`}</p>
          : null}
        {contactes.length || noDisponibles.length ? (
          <div className="sdp-avisador__persones" role="group" ref={grupPersones} tabIndex={-1}
            aria-labelledby={`${idForm}-persones`} aria-describedby={`${idForm}-comptador`}>
            {contactes.map((fil) => {
              const { id, nom, avatar } = fil.altres[0];
              const marcat = seleccio.includes(id);
              return (
                <TargetaPersona key={id} nom={nom || fil.title || tx(TX.contacteXat)}
                  avatar={avatar || fil.avatar_url || null} marcat={marcat}
                  desactivat={!marcat && seleccio.length === 3} estat={marcat ? textEstat(id) : ''}
                  onCanvi={(valor) => tria(id, valor)} />
              );
            })}
            {/* Revisió adversarial (A11Y-05) · Un contacte que ja no està disponible només es pot desmarcar: abans
                que la targeta desaparega, el focus passa al grup; i, si n'hi ha més d'un, porten número. */}
            {noDisponibles.map((id, ordre) => (
              <TargetaPersona key={id}
                nom={noDisponibles.length > 1 ? `${tx(TX.contacteNoDisponible)} ${ordre + 1}` : tx(TX.contacteNoDisponible)}
                avatar={null} marcat estat={textEstat(id)}
                onCanvi={() => { grupPersones.current?.focus(); tria(id, false); }} />
            ))}
          </div>
        ) : null}
      </section>

      <Casella etiqueta={tx(TX.llegit)}
        checked={llegit} required onChange={(event) => { setLlegit(event.target.checked); setError(''); }} />
      <div className="sdp-accions">
        <Boto tipus="submit" varietat="primari" carregant={desant}
          disabled={!llegit || xat.status !== 'ready' || !xat.llistaFresca || seleccio.length === 0}>
          {desat ? tx(TX.guarda) : tx(TX.activa)}
        </Boto>
        {desat ? <Boto onClick={desactiva} disabled={desant}>{tx(TX.desactiva)}</Boto> : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <p role="status" className="sdp-avisador__batec">
        {desat ? tx(TX.activat) : tx(TX.desactivat)}
        {enviats ? ` ${omple(tx(TX.confirmats), { enviats, total: desat.personesConfiansa.length })}` : ''}
        {fallits ? ` ${tx(TX.pendents)}` : ''}
      </p>

      <details className="sdp-avisador__copia">
        <summary className="sdp-avisador__copia-titol">{tx(TX.copiaHorari)}</summary>
        <p>{textRic(tx(TX.copiaExplicacio), tx)}</p>
        <div className="sdp-avisador__copia-accions">
          <Boto onClick={descarregaHorari}>{tx(TX.descarregaHorari)}</Boto>
          {/* Arnés CDP (T1-01) · Dos botons normals en una sola fila centrada: el de triar fitxer diu ell mateix
              «Importa un horari (.json)» i l'etiqueta del Camp (la mateixa) queda per al lector. Com que l'etiqueta és
              un element, CampFitxer no repetix el text a l'aria-label del botó. */}
          <Camp etiqueta={<span>{tx(TX.importaHorari)}</span>} className="sdp-avisador__importa">
            <CampText tipus="file" textBoto={tx(TX.importaHorari)} accept=".json,application/json"
              onChange={triaHorari} disabled={desant} />
          </Camp>
        </div>
        {/* Revisió adversarial (A11Y-06/07) · Les dos regions de la còpia hi són sempre: només en canvia el text. */}
        <p role="status" className="sdp-avisador__copia-estat">{estatCopia}</p>
        <p role="alert" className="sdp-avisador__copia-estat">{errorCopia}</p>
      </details>
    </form>
  );
}

/**
 * Una persona de confiança: tota la targeta és l'etiqueta de la casella (diana >= 48px). El nom
 * accessible és només el nom; l'estat de l'enviament el descriu (aria-describedby).
 */
function TargetaPersona({ nom, avatar, marcat, desactivat = false, estat, onCanvi }) {
  const id = useId();
  let classe = 'sdp-avisador__persona';
  if (marcat) classe = 'sdp-avisador__persona sdp-avisador__persona--triada';
  else if (desactivat) classe = 'sdp-avisador__persona sdp-avisador__persona--desactivada';
  return (
    <div className={classe}>
      <input type="checkbox" id={id} className="sdp-avisador__casella" checked={marcat}
        disabled={desactivat} aria-describedby={estat ? `${id}-estat` : undefined}
        onChange={(event) => onCanvi(event.target.checked)} />
      <label htmlFor={id} className="sdp-avisador__persona-cos">
        <Avatar nom={nom} src={avatar} mida="sm" alt="" titol="" />
        <span className="sdp-avisador__nom">{nom}</span>
      </label>
      {estat ? <p className="sdp-avisador__estat" id={`${id}-estat`}>{estat}</p> : null}
    </div>
  );
}

export default function AvisadorPage() {
  const xat = useXat();
  const sessio = useSessioOpcional();
  const t = useTraductorOpcional();
  const tx = (parell) => tradueix(t, parell);
  const arrelRef = useRef(null);
  const idGuia = useId();
  useFullDiferit(arrelRef, 'avisador', cssAvisador);
  return (
    <PageFrame title={tx(TX.titol)} subtitle={tx(TX.subtitol)} lead={tx(TX.intro)} showConnect={false} showComment={false}>
      <section className="sdp-avisador" ref={arrelRef} aria-labelledby={`${idGuia}-guia`}>
        <h3 id={`${idGuia}-guia`}>{tx(TX.guiaTitol)}</h3>
        <p>{textRic(tx(TX.guiaSessio), tx)}</p>
        <p>{textRic(tx(TX.guiaArribada), tx)}</p>
        <p>{textRic(tx(TX.guiaConfianca), tx)}</p>
        <p className="sdp-avisador__emergencia">{textRic(tx(TX.guiaEmergencia), tx)}</p>
      </section>
      {xat.avisadorClau ? <FormulariAvisador key={xat.avisadorClau} clau={xat.avisadorClau} xat={xat} /> : null}
      {!xat.avisadorClau && sessio?.estat === 'comprovant' ? <p role="status">{tx(TX.comprovant)}</p> : null}
      {!xat.avisadorClau && sessio?.estat !== 'comprovant' && !sessio?.currentUser
        ? <p><Link to={rutaDEntrada({ mode: 'entrar', tornar: '/page/avisador' })}>{tx(TX.entra)}</Link>{` ${tx(TX.entraResta)}`}</p>
        : null}
      {!xat.avisadorClau && sessio?.estat === 'dins' && sessio.currentUser
        ? <p>{tx(TX.triaIdentitat)}</p>
        : null}
    </PageFrame>
  );
}
