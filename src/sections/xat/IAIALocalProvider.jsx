/**
 * IAIA al navegador, també amb sessió remota. El grup públic de /iaia
 * continua al port: parlar amb l'assistent no publica cap pregunta allí.
 * La memòria pertany al muntatge del Xat i al seu àmbit estable (persona,
 * actor i backend); una renovació del JWT no la buida.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTranslator } from '../../config/i18n.js';
import { XatContext, useXat } from './XatContext.jsx';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { IAIA_ID, BENVINGUDA_IAIA, RESPOSTA_IAIA } from '../../data/identitatsSeed.js';
import { respostaDeLaIAIA } from '../../data/iaiaLocal.js';
import { ID_FIL_LOCAL_IAIA } from './useObriXatPerDefecte.js';

export const MAXIM_MISSATGES_IAIA_LOCAL = 100;
const esLocal = (id) => id === ID_FIL_LOCAL_IAIA;
const noFaRes = () => {};

export default function IAIALocalProvider({ children, respostaIAIA = respostaDeLaIAIA, t = createTranslator('ca') }) {
  const original = useXat();
  const nomPublic = t('section.xat.iaia.local.grupPublic');
  const [missatges, posaMissatges] = useState(() => [{
    id: 'iaia-local:benvinguda', sender: 'other', author: AJUDA_PER_CLAU.iaia.nom,
    usuariId: IAIA_ID, is_ai: true, text: BENVINGUDA_IAIA, creatAl: new Date().toISOString()
  }]);
  const seguent = useRef(0);
  const muntat = useRef(true);
  const originalRef = useRef(original);
  originalRef.current = original;
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; }; }, []);
  const fil = useMemo(() => ({
    id: ID_FIL_LOCAL_IAIA, tipus: 'iaia', name: AJUDA_PER_CLAU.iaia.nom, title: AJUDA_PER_CLAU.iaia.nom,
    avatar_url: AJUDA_PER_CLAU.iaia.avatar, filLocalIAIA: true, potEscriure: true,
    noLlegits: 0, ultimSeq: 0, llegitFinsSeq: 0, participants: [], altres: [],
    ultimText: missatges.length > 1 ? missatges.at(-1)?.text ?? null : null, ultimAl: missatges.length > 1 ? missatges.at(-1)?.creatAl ?? null : null
  }), [missatges]);
  const sendChatMessage = useCallback(async (desti, text, opcions) => {
    if (!esLocal(desti?.id)) return originalRef.current.sendChatMessage(desti, text, opcions);
    if (!muntat.current || originalRef.current.iaiaApagada) return [];
    const valor = String(text ?? '').trim();
    if (!valor) return [];
    const id = `iaia-local:p${++seguent.current}`;
    const pregunta = { id, sender: 'me', author: originalRef.current.joNom || 'Jo', text: valor,
      respostaA: opcions?.respostaA ?? null, creatAl: new Date().toISOString() };
    posaMissatges((previs) => [...previs, pregunta].slice(-MAXIM_MISSATGES_IAIA_LOCAL));
    // Cada resposta s'ancora a la seua pregunta; una consulta lenta no frena
    // les altres i mai no respon a una altra persona després de desmuntar.
    Promise.resolve().then(() => respostaIAIA(valor)).catch(() => null).then((trobada) => {
      if (!muntat.current || originalRef.current.iaiaApagada) return;
      const resposta = { id: `${id}:resposta`, sender: 'other', author: AJUDA_PER_CLAU.iaia.nom,
        usuariId: IAIA_ID, is_ai: true, text: typeof trobada === 'string' && trobada.trim() ? trobada : RESPOSTA_IAIA,
        creatAl: new Date().toISOString() };
      posaMissatges((previs) => {
        const posicio = previs.findIndex((m) => m.id === id);
        if (posicio < 0) return previs;
        return [...previs.slice(0, posicio + 1), resposta, ...previs.slice(posicio + 1)].slice(-MAXIM_MISSATGES_IAIA_LOCAL);
      });
    });
    return [pregunta];
  }, [respostaIAIA]);
  const value = useMemo(() => ({
    ...original,
    // Les fallades del servidor continuen visibles sense tapar l'ajuda local.
    avis: null,
    avisLlista: original.avis || original.avisLlista || null,
    chatThreads: [
      ...(original.chatThreads || []).filter((f) => f.perDefecte !== 'iaia').map((f) =>
        f.subjecte?.tipus === 'pagina' && ['/iaia', '/ia'].includes(f.subjecte.id) ? { ...f, name: nomPublic, title: nomPublic } : f),
      ...(original.iaiaApagada ? [] : [fil])
    ],
    getThreadMessages: (id) => esLocal(id) ? (!muntat.current || original.iaiaApagada ? [] : missatges) : original.getThreadMessages(id),
    sendChatMessage,
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
  }), [original, fil, missatges, sendChatMessage, nomPublic]);
  return <XatContext.Provider value={value}>{children}</XatContext.Provider>;
}
