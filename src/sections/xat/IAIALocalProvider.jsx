/**
 * IAIA al navegador, també amb sessió remota. El grup públic de /iaia
 * continua al port: parlar amb l'assistent no publica cap pregunta allí.
 * Cada sessió conserva al navegador només el títol. Els missatges viuen
 * en el muntatge del Xat, aïllats per persona, actor i backend.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTranslator } from '../../config/i18n.js';
import { XatContext, useXat } from './XatContext.jsx';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { IAIA_ID, BENVINGUDA_IAIA, RESPOSTA_IAIA } from '../../data/identitatsSeed.js';
import { respostaDeLaIAIA } from '../../data/iaiaLocal.js';
import { ID_FIL_LOCAL_IAIA } from './useObriXatPerDefecte.js';
import { esContacteDeLaIAIA } from './contactesAjuda.js';
import { generaId } from './missatges.js';
import { creaRegistreSessionsIAIA, titolDeLaPrimeraPregunta } from './sessionsIAIALocals.js';

export const MAXIM_MISSATGES_IAIA_LOCAL = 100;
const PREFIX_SESSIO = `${ID_FIL_LOCAL_IAIA}-`;
const esLocal = (id) => id === ID_FIL_LOCAL_IAIA || typeof id === 'string' && id.startsWith(PREFIX_SESSIO);
const CAP = Object.freeze([]);
const noFaRes = () => {};
/* xat-flux-05 (T7a, 261104) · La IAIA al padró de «Nova conversa»: el remot
   (membres_del_poble) no porta cap contacte de tipus 'ia', i contactesDAjuda
   la pintava «No disponible» mentre el seu xat local era a la llista. Amb el
   fil local, obriConversaAmb hi navega sense crear res al servidor; el
   precedent és el padró del xat de mostra (FakeChatOnboarding). */
const CONTACTE_IAIA_LOCAL = Object.freeze({
  usuari_id: IAIA_ID, nom: AJUDA_PER_CLAU.iaia.nom, tipus: 'ia', avatar_url: AJUDA_PER_CLAU.iaia.avatar, fil_id: ID_FIL_LOCAL_IAIA
});

export default function IAIALocalProvider(props) {
  const original = useXat();
  return <IAIALocalProviderAmbit key={original.joId ? original.ambitEstable : 'sense-sessio'} {...props} original={original} />;
}

function IAIALocalProviderAmbit({ children, original, respostaIAIA = respostaDeLaIAIA, t = createTranslator('ca'), filPerDefecte = true }) {
  const ambit = original.joId ? original.ambitEstable : null;
  const nomPublic = t('section.xat.iaia.local.grupPublic');
  const [registre] = useState(creaRegistreSessionsIAIA);
  const escriptures = useRef(new Map());
  const subscripcio = useRef(null);
  const [sessionsDesades, posaSessionsDesades] = useState(CAP);
  const [ambitLlegit, posaAmbitLlegit] = useState(null);
  const [sessionsNoves, posaSessionsNoves] = useState(CAP);
  const esborrany = useRef(null);
  const primersTitols = useRef(new Map());
  const [historial, posaHistorial] = useState({});
  const [benvinguda] = useState(() => [{
    id: 'iaia-local:benvinguda', sender: 'other', author: AJUDA_PER_CLAU.iaia.nom,
    usuariId: IAIA_ID, is_ai: true, text: BENVINGUDA_IAIA, creatAl: new Date().toISOString()
  }]);
  const seguent = useRef(0);
  const epoch = useRef(0), controls = useRef(new Map());
  const muntat = useRef(true);
  const originalRef = useRef(original);
  originalRef.current = original;
  const idsLocals = useRef(new Set());
  const oblidades = useRef(new Set());
  const oblitsEnCurs = useRef(new Map());
  const generacioLlegida = useRef(null);
  const lectura = useRef(0);
  const avorta = useCallback(() => { epoch.current++; for (const c of controls.current.keys()) c.abort(); controls.current.clear(); }, []);
  const netejaFils = useCallback((ids) => {
    const llevats = new Set(ids);
    for (const id of llevats) {
      oblidades.current.add(id);
      idsLocals.current.delete(id);
      primersTitols.current.delete(id);
      if (esborrany.current === id) esborrany.current = null;
    }
    for (const [control, id] of controls.current) if (llevats.has(id)) { control.abort(); controls.current.delete(control); }
    posaSessionsNoves(previs => previs.filter(id => !llevats.has(id)));
    posaSessionsDesades(previs => previs.filter(({ id }) => !llevats.has(id)));
    posaHistorial(previ => Object.fromEntries(Object.entries(previ).filter(([id]) => !llevats.has(id))));
  }, []);
  const refresca = useCallback(async () => {
    if (!ambit) return;
    const torn = ++lectura.current;
    const estat = await registre.lligEstat(ambit);
    if (!muntat.current || torn !== lectura.current) return;
    if (generacioLlegida.current !== null && generacioLlegida.current !== estat.generacio) {
      avorta();
      netejaFils([...idsLocals.current].filter(id => id !== ID_FIL_LOCAL_IAIA));
      posaHistorial({});
    }
    generacioLlegida.current = estat.generacio;
    if (estat.oblidades.some(id => !oblidades.current.has(id))) netejaFils(estat.oblidades);
    posaSessionsDesades(estat.sessions.filter(({ id }) => !oblidades.current.has(id)));
    posaAmbitLlegit(ambit);
  }, [ambit, registre, avorta, netejaFils]);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; avorta(); }; }, [avorta]);
  useEffect(() => {
    if (!ambit || original.iaiaApagada) return undefined;
    const torn = {};
    const escripturesPendents = escriptures.current;
    subscripcio.current = torn;
    const deslliga = registre.subscriu((avis) => { if (avis.tipus === 'canvi') void refresca().catch(noFaRes); });
    void refresca().catch(noFaRes).finally(() => { if (muntat.current) posaAmbitLlegit(ambit); });
    return () => {
      deslliga();
      // Una primera pregunta acceptada pot tindre el títol encara en la cua.
      void Promise.allSettled(escripturesPendents.values()).then(() => {
        if (subscripcio.current === torn) registre.tanca();
      });
    };
  }, [ambit, original.iaiaApagada, registre, refresca]);
  useEffect(() => { if (original.iaiaApagada) avorta(); }, [original.iaiaApagada, avorta]);

  const oblidaSessioIAIA = useCallback((id) => {
    if (!muntat.current || !idsLocals.current.has(id) || id === ID_FIL_LOCAL_IAIA) return Promise.resolve(false);
    if (oblitsEnCurs.current.has(id)) return oblitsEnCurs.current.get(id);
    const operacio = (async () => {
      if (ambit) await registre.oblidaSessio(ambit, id);
      if (muntat.current) netejaFils([id]);
      return true;
    })().finally(() => { oblitsEnCurs.current.delete(id); });
    oblitsEnCurs.current.set(id, operacio);
    return operacio;
  }, [ambit, registre, netejaFils]);

  const novaSessioIAIA = useCallback(() => {
    if (!muntat.current || originalRef.current.iaiaApagada) return null;
    if (esborrany.current) return esborrany.current;
    const id = PREFIX_SESSIO + generaId();
    esborrany.current = id;
    posaSessionsNoves((previs) => [id, ...previs].slice(0, 50));
    return id;
  }, []);
  const fils = useMemo(() => {
    const titols = new Map(sessionsDesades.map(({ id, titol }) => [id, titol]));
    const ids = new Set([...sessionsNoves, ...titols.keys()].filter(id => !oblidades.current.has(id)));
    if (filPerDefecte) ids.add(ID_FIL_LOCAL_IAIA);
    return [...ids].map((id) => {
      const titol = (titols.has(id) ? titols.get(id) : primersTitols.current.get(id)) || AJUDA_PER_CLAU.iaia.nom;
      const ultim = historial[id]?.at(-1);
      return {
        id, tipus: 'iaia', name: titol, title: titol, avatar_url: AJUDA_PER_CLAU.iaia.avatar,
        filLocalIAIA: true, sessioLocalIAIA: id !== ID_FIL_LOCAL_IAIA, potEscriure: true, noLlegits: 0, ultimSeq: 0, llegitFinsSeq: 0,
        participants: [], altres: [], ultimText: ultim?.text ?? null, ultimAl: ultim?.creatAl ?? null
      };
    });
  }, [sessionsDesades, sessionsNoves, historial, filPerDefecte]);
  idsLocals.current = new Set(fils.map(({ id }) => id));

  const sendChatMessage = useCallback(async (desti, text, opcions) => {
    const filId = desti?.id;
    if (!esLocal(filId)) return originalRef.current.sendChatMessage(desti, text, opcions);
    if (!muntat.current || originalRef.current.iaiaApagada || !idsLocals.current.has(filId)) return [];
    const valor = String(text ?? '').trim();
    if (!valor) return [];
    const ticket = epoch.current;
    const invalid = () => !muntat.current || ticket !== epoch.current || originalRef.current.iaiaApagada
      || !idsLocals.current.has(filId) || oblidades.current.has(filId) || oblitsEnCurs.current.has(filId);
    if (ambit) await refresca();
    if (invalid()) return [];
    let desament = escriptures.current.get(filId);
    if (filId !== ID_FIL_LOCAL_IAIA && !desament && !primersTitols.current.has(filId)) {
      const titol = titolDeLaPrimeraPregunta(valor);
      if (ambit) {
        desament = registre.desaPrimerTitol(ambit, filId, titol).then(() => {
          if (!invalid()) primersTitols.current.set(filId, titol);
        }).finally(() => { escriptures.current.delete(filId); });
        escriptures.current.set(filId, desament);
      } else {
        primersTitols.current.set(filId, titol);
      }
    }
    // En recarregar, la ruta del fil es resol des del registre de títols.
    // Els missatges del mateix fil esperen la transacció abans de fer-se visibles.
    if (desament) {
      try { await desament; } catch (error) {
        if (['SESSIO_IAIA_OBLIDADA', 'OBLIT_IAIA_ACTUALITZAT'].includes(error?.codi)) {
          if (muntat.current) { netejaFils([filId]); await refresca(); }
          return [];
        }
        throw error;
      }
      if (ambit) await refresca();
      if (invalid()) return [];
    }
    if (esborrany.current === filId) esborrany.current = null;
    const id = `iaia-local:p${++seguent.current}`;
    const pregunta = { id, sender: 'me', author: originalRef.current.joNom || 'Jo', text: valor,
      respostaA: opcions?.respostaA ?? null, creatAl: new Date().toISOString() };
    posaHistorial((previ) => ({
      ...previ, [filId]: [...(previ[filId] ?? benvinguda), pregunta].slice(-MAXIM_MISSATGES_IAIA_LOCAL)
    }));
    // Cada resposta s'ancora a la seua pregunta; una consulta lenta no frena
    // les altres i mai no respon a una altra persona després de desmuntar.
    const control = new AbortController(); controls.current.set(control, filId);
    Promise.resolve().then(() => control.signal.aborted ? null : respostaIAIA(valor, { signal: control.signal })).catch(() => null).then((trobada) => {
      controls.current.delete(control);
      if (control.signal.aborted || ticket !== epoch.current || !muntat.current || originalRef.current.iaiaApagada) return;
      const resposta = { id: `${id}:resposta`, sender: 'other', author: AJUDA_PER_CLAU.iaia.nom,
        usuariId: IAIA_ID, is_ai: true, text: typeof trobada === 'string' && trobada.trim() ? trobada : RESPOSTA_IAIA,
        creatAl: new Date().toISOString() };
      posaHistorial((previ) => {
        const missatges = previ[filId] ?? CAP;
        const posicio = missatges.findIndex((m) => m.id === id);
        if (posicio < 0) return previ;
        const ambResposta = [...missatges.slice(0, posicio + 1), resposta, ...missatges.slice(posicio + 1)];
        return { ...previ, [filId]: ambResposta.slice(-MAXIM_MISSATGES_IAIA_LOCAL) };
      });
    });
    return [pregunta];
  }, [ambit, benvinguda, registre, respostaIAIA, refresca, netejaFils]);
  /* xat-flux-05 · Estable (fora del useMemo del valor, que canvia a cada
     missatge): el diàleg i la cerca del Xat tornen a demanar el padró quan
     canvia la funció. Sense try/catch: l'error del port arriba al diàleg. */
  const cercaOriginal = original.cercaMembres;
  const iaiaApagada = Boolean(original.iaiaApagada);
  const cercaMembres = useCallback(async (...args) => {
    const llista = await cercaOriginal(...args);
    const membres = Array.isArray(llista) ? llista : [];
    if (iaiaApagada || membres.some(esContacteDeLaIAIA)) return llista;
    return [...membres, CONTACTE_IAIA_LOCAL];
  }, [cercaOriginal, iaiaApagada]);
  const value = useMemo(() => ({
    ...original,
    // Les fallades del servidor continuen visibles sense tapar l'ajuda local.
    ...(filPerDefecte ? { avis: null, avisLlista: original.avis || original.avisLlista || null } : null),
    chatThreads: [
      ...(filPerDefecte
        ? (original.chatThreads || []).filter((f) => f.perDefecte !== 'iaia').map((f) =>
          f.subjecte?.tipus === 'pagina' && ['/iaia', '/ia'].includes(f.subjecte.id) ? { ...f, name: nomPublic, title: nomPublic } : f)
        : original.chatThreads || []),
      ...(original.iaiaApagada ? [] : fils)
    ],
    getThreadMessages: (id) => esLocal(id)
      ? (muntat.current && !original.iaiaApagada && idsLocals.current.has(id) ? historial[id] ?? benvinguda : CAP)
      : original.getThreadMessages(id),
    novaSessioIAIA,
    oblidaSessioIAIA,
    sessioIAIAOblidada: (id) => oblidades.current.has(id),
    esperaSessioIAIA: (id) => esLocal(id) && Boolean(ambit) && ambitLlegit !== ambit,
    sendChatMessage,
    cercaMembres: filPerDefecte && typeof cercaOriginal === 'function' ? cercaMembres : cercaOriginal,
    obriFil: (id) => original.obriFil?.(esLocal(id) ? null : id),
    filCarregat: (id) => esLocal(id) || (original.filCarregat?.(id) ?? true),
    avisFil: (id) => esLocal(id) ? null : original.avisFil?.(id),
    llegintFil: (id) => esLocal(id) ? false : original.llegintFil?.(id),
    hiHaMesAntics: (id) => esLocal(id) ? false : original.hiHaMesAntics?.(id),
    carregantAntics: (id) => esLocal(id) ? false : original.carregantAntics?.(id),
    esperaAntics: (id) => esLocal(id) ? null : original.esperaAntics?.(id),
    marcaVist: (id, seq) => esLocal(id) ? undefined : original.marcaVist?.(id, seq),
    marcaLlegides: (ids) => original.marcaLlegides?.(ids.filter((id) => !esLocal(id))) ?? [],
    potSilenciarFil: (f) => esLocal(f?.id ?? f) ? false : original.potSilenciarFil?.(f),
    esFilAmagat: (id) => esLocal(id) ? Boolean(original.iaiaApagada) : original.esFilAmagat?.(id),
    recarregaFil: (id) => esLocal(id) ? noFaRes() : original.recarregaFil?.(id)
  }), [original, fils, historial, benvinguda, filPerDefecte, novaSessioIAIA, oblidaSessioIAIA, ambit, ambitLlegit, sendChatMessage, nomPublic, cercaOriginal, cercaMembres]);
  return <XatContext.Provider value={value}>{children}</XatContext.Provider>;
}
