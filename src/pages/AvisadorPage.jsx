import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../app/contexts/RouterContext.jsx';
import { useSessioOpcional } from '../app/contexts/SessionContext.jsx';
import { PageFrame } from '../components/universal/PageFrame.jsx';
import { Boto } from '../components/PedraSeca/atoms/Boto.jsx';
import { Camp, CampText, Casella, GrupCamps, Selector } from '../components/PedraSeca/organismes/formulari.jsx';
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
  const baseConfiguracio = useRef(clauConfiguracioAvisador(desat));
  const rondaCopia = useRef(0);
  const moderacio = useModeracio();
  const t = useTraductorOpcional();
  const tx = (parell) => tradueix(t, parell);
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
    const text = exportaHorariAvisador(ajustos);
    if (!text) {
      setError(tx(TX.errorCopiaHorari));
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
      setError(tx(TX.errorCopiaHorari));
    }
  }

  async function triaHorari(event) {
    const fitxer = event.target.files?.[0];
    event.target.value = '';
    if (!fitxer) return;
    const ambit = context.current;
    const ronda = ++rondaCopia.current;
    setEstatCopia('');
    let horari = null;
    try {
      if (fitxer.size <= MAX_BYTES_AJUSTOS_AVISADOR) horari = importaHorariAvisador(await fitxer.text());
    } catch { /* El fitxer no s'ha pogut llegir. */ }
    if (context.current !== ambit || ronda !== rondaCopia.current) return;
    if (horari) {
      setAjustos(horari);
      setError('');
      setEstatCopia(tx(TX.horariCarregat));
    } else setError(tx(TX.errorCopiaHorari));
  }

  const enviats = desat?.personesConfiansa.filter((persona) => persona.estat === 'enviat').length ?? 0;
  const fallits = desat?.personesConfiansa.filter((persona) => persona.estat === 'fallit').length ?? 0;
  return (
    <form onSubmit={desa}>
      <GrupCamps llegenda={tx(TX.llegendaHorari)}>
        <Camp etiqueta={tx(TX.horesSenseActivitat)}>
          <Selector
            opcions={HORES_AVISADOR.map((hores) => ({ valor: hores, etiqueta: `${hores} h` }))}
            value={ajustos.horesImmobilitat}
            onChange={(event) => actualitza('horesImmobilitat', Number(event.target.value))}
          />
        </Camp>
        <Camp etiqueta={tx(TX.iniciDescans)} obligatori>
          <CampText tipus="time" value={ajustos.horaIniciNit} onChange={(event) => actualitza('horaIniciNit', event.target.value)} />
        </Camp>
        <Camp etiqueta={tx(TX.fiDescans)} ajuda={tx(TX.descansMaxim)} obligatori>
          <CampText tipus="time" value={ajustos.horaFiNit} onChange={(event) => actualitza('horaFiNit', event.target.value)} />
        </Camp>
      </GrupCamps>
      <GrupCamps llegenda={tx(TX.copiaHorari)}>
        <Boto onClick={descarregaHorari}>{tx(TX.descarregaHorari)}</Boto>
        <Camp etiqueta={tx(TX.importaHorari)}>
          <CampText tipus="file" accept=".json,application/json" onChange={triaHorari} disabled={desant} />
        </Camp>
        {estatCopia ? <p role="status">{estatCopia}</p> : null}
      </GrupCamps>
      <GrupCamps llegenda={tx(TX.llegendaPersones)}>
        <p>{tx(TX.triaPersones)}</p>
        <p>{tx(TX.rebran)}</p>
        <blockquote>{MISSATGE_AVISADOR}</blockquote>
        {contactes.length === 0
          ? <p><Link to="/xat">{tx(TX.obriConversa)}</Link>{` ${tx(TX.obriConversaResta)}`}</p>
          : null}
        {contactes.map((fil) => {
          const { id, nom } = fil.altres[0];
          const marcat = seleccio.includes(id);
          return (
            <Casella key={id} etiqueta={nom || fil.title || tx(TX.contacteXat)}
              checked={marcat} disabled={!marcat && seleccio.length === 3}
              onChange={(event) => tria(id, event.target.checked)} />
          );
        })}
        {seleccio.filter((id) => !filDe.has(id)).map((id) => (
          <Casella key={id} etiqueta={tx(TX.contacteNoDisponible)} checked onChange={() => tria(id, false)} />
        ))}
      </GrupCamps>
      <Casella etiqueta={tx(TX.llegit)}
        checked={llegit} required onChange={(event) => { setLlegit(event.target.checked); setError(''); }} />
      <div className="sdp-alerta__accions">
        <Boto tipus="submit" varietat="primari" carregant={desant}
          disabled={!llegit || xat.status !== 'ready' || !xat.llistaFresca || seleccio.length === 0}>
          {desat ? tx(TX.guarda) : tx(TX.activa)}
        </Boto>
        {desat ? <Boto onClick={desactiva} disabled={desant}>{tx(TX.desactiva)}</Boto> : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <p role="status">
        {desat ? tx(TX.activat) : tx(TX.desactivat)}
        {enviats ? ` ${omple(tx(TX.confirmats), { enviats, total: desat.personesConfiansa.length })}` : ''}
        {fallits ? ` ${tx(TX.pendents)}` : ''}
      </p>
    </form>
  );
}

export default function AvisadorPage() {
  const xat = useXat();
  const sessio = useSessioOpcional();
  const t = useTraductorOpcional();
  const tx = (parell) => tradueix(t, parell);
  return (
    <PageFrame title={tx(TX.titol)} subtitle={tx(TX.subtitol)} showConnect={false} showComment={false}>
      <p>{tx(TX.intro)}</p>
      <p>{tx(TX.limitacions)}</p>
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
