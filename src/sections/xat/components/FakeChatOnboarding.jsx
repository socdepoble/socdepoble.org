/**
 * FakeChatOnboarding.jsx — el Xat de mostra per a qui entra sense sessió en
 * remot: dues converses d'ajuda i, si l'amfitrió declara un poble (torn
 * 260930, T1), la comunitat d'eixe poble amb Avisos i General, perquè el
 * primer que es veja siga «Gent de la Torre» també abans d'entrar. Tot és
 * local: escriure-hi respon amb una invitació a registrar-se.
 *
 * Onada 3 (P2, incidència de producció del Mestre) · Cada fila porta la seua
 * cara, com a la llavor: sense `avatar_url` la llista queia a les inicials
 * (LT, IM, SD) a qualsevol amfitrió. La IAIA, la del padró (identitatsSeed:
 * en remot n'és l'única identitat, perquè viu al paquet); Sóc de Poble, la
 * del compte de la marca (agentsSeed, AGENTS_MAP.SOCDEPOBLE), com el nom fix
 * de la fila; la comunitat del poble, la de la seua fitxa de Pobles
 * (avatarDelPoble). Les mateixes cares a «Nova conversa» (cercaMembres). Les
 * rutes són pròpies ('/assets/…') i Avatar les resol amb la base de
 * l'amfitrió.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XatContext } from '../XatContext.jsx';
import { CONTACTES_AJUDA } from '../contactesAjuda.js';
import { agrupaComunitats } from '../missatges.js';
import { useUIActions } from '../../../app/contexts/UIContext.jsx';
import { useCoreContent } from '../../../app/contexts/CoreContentContext';
import { AGENTS_IA_SEED } from '../../../data/identitatsSeed.js';
import { AGENTS_MAP } from '../../../data/agentsSeed.js';
import usePobleAmfitrio from '../usePobleAmfitrio.js';
import { avatarDelPoble, nomDelPoble, objecteDelPoble } from '../pobleAmfitrio.js';

const AVATAR_IAIA = AGENTS_IA_SEED[0].avatar_url;
const AVATAR_SOC_DE_POBLE = AGENTS_MAP.SOCDEPOBLE.avatar_url;
/* La cara de cada entrada d'ajuda (CONTACTES_AJUDA), pel seu tipus. */
const CARA_DAJUDA = Object.freeze({ ia: AVATAR_IAIA, entitat: AVATAR_SOC_DE_POBLE });

/* Els fils de la comunitat del poble: la comunitat (sense missatges, amb la
   cara del poble si la seua fitxa en té), els Avisos (només lectura, com els
   de veritat per a qui no n'és administrador; sempre el megàfon) i el General
   (la icona de grup, com a la llavor). */
function filsDelPoble(poble, t, ara, avatar) {
  if (!poble) return [];
  const nom = nomDelPoble(poble);
  const benvinguda = t('section.xat.fake.poble1', "Benvinguts al xat de {nom}. Registra't per a parlar amb la gent del poble.").replace('{nom}', nom);
  const comuna = { comunitatId: 'fake-poble', ultimAl: ara, llegitFinsSeq: 0 };
  return [
    { id: 'fake-poble', tipus: 'comunitat', esComunitat: true, name: nom, title: nom, avatar_url: avatar, subjecte: objecteDelPoble(poble), ultimAl: ara, noLlegits: 0 },
    { ...comuna, id: 'fake-poble-avisos', tipus: 'canal', esCanal: true, potEscriure: false, name: t('section.xat.fake.avisos', 'Avisos'), title: t('section.xat.fake.avisos', 'Avisos'), noLlegits: 1, ultimSeq: 1, ultimText: benvinguda },
    { ...comuna, id: 'fake-poble-general', tipus: 'grup', esGrup: true, name: t('section.xat.fake.general', 'General'), title: t('section.xat.fake.general', 'General'), noLlegits: 0, ultimSeq: 0, ultimText: '' }
  ];
}

export default function FakeChatOnboarding({ originalContext, children }) {
  const { t } = useUIActions();
  const poble = usePobleAmfitrio();
  const { towns } = useCoreContent();
  const avatarPoble = useMemo(() => avatarDelPoble(poble, towns), [poble, towns]);
  const [ara] = useState(() => new Date().toISOString());
  const [messages, setMessages] = useState(() => ({
    'fake-iaia': [
      { id: 'm1', seq: 1, text: t('section.xat.fake.iaia1', "Hola, foraster! Sóc la IAIA MarIA, la intel·ligència d'este poble."), sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: ara },
      { id: 'm2', seq: 2, text: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!"), sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: ara }
    ],
    'fake-sdp': [
      { id: 'm3', seq: 1, text: t('section.xat.fake.sdp1', "Benvingut a Sóc de Poble. Som una xarxa de pobles connectats."), sender: 'other', author: 'Sóc de Poble', is_ai: false, creatAl: ara },
      { id: 'm4', seq: 2, text: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim."), sender: 'other', author: 'Sóc de Poble', is_ai: false, creatAl: ara }
    ]
  }));
  /* Les respostes pendents es cancel·len en desmuntar (abans quedaven vives). */
  const temporitzadors = useRef(new Set());
  useEffect(() => () => {
    temporitzadors.current.forEach(clearTimeout);
    temporitzadors.current.clear();
  }, []);

  const deLPoble = useMemo(() => filsDelPoble(poble, t, ara, avatarPoble), [poble, t, ara, avatarPoble]);

  const fakeThreads = useMemo(() => [
    ...deLPoble,
    {
      id: 'fake-iaia',
      name: 'IAIA MarIA',
      title: 'IAIA MarIA',
      avatar_url: AVATAR_IAIA,
      tipus: 'ia',
      participants: [{ id: 'ajuda:ia', nom: 'IAIA MarIA', tipus: 'ia' }],
      ultimAl: ara,
      noLlegits: 1,
      ultimSeq: 2,
      llegitFinsSeq: 0,
      ultimText: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!")
    },
    {
      id: 'fake-sdp',
      name: 'Sóc de Poble',
      title: 'Sóc de Poble',
      avatar_url: AVATAR_SOC_DE_POBLE,
      tipus: 'entitat',
      participants: [{ id: 'ajuda:entitat', nom: 'Sóc de Poble', tipus: 'entitat' }],
      ultimAl: ara,
      noLlegits: 1,
      ultimSeq: 2,
      llegitFinsSeq: 0,
      ultimText: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim.")
    }
  ], [t, ara, deLPoble]);

  const comunitats = useMemo(() => agrupaComunitats(fakeThreads), [fakeThreads]);

  const getThreadMessages = useCallback((filId) => {
    if (messages[filId]) return messages[filId];
    /* Els Avisos del poble porten la benvinguda com a primer missatge. */
    const avisos = deLPoble.find((f) => f.id === filId && f.tipus === 'canal');
    return avisos ? [{ id: `${filId}-1`, seq: 1, text: avisos.ultimText, sender: 'other', author: nomDelPoble(poble), is_ai: false, creatAl: ara }] : [];
  }, [messages, deLPoble, poble, ara]);

  /* El `seq` el porta un comptador per fil (abans es calculava sobre un
     tancament ranci i dos enviaments ràpids el repetien). */
  const seqs = useRef({});
  const missatgesRef = useRef(messages);
  missatgesRef.current = messages;
  const seguentSeq = useCallback((filId) => {
    const s = Math.max(seqs.current[filId] || 0, (missatgesRef.current[filId] || []).length) + 1;
    seqs.current[filId] = s;
    return s;
  }, []);

  /* Com el de veres (XatContext): `opcions.respostaA` és l'id del missatge
     citat, i la bombolla simulada el conserva (auditoria de Codex 2150, C6-X2). */
  const sendChatMessage = useCallback(async (fil, text, opcions = {}) => {
    const filId = fil.id;
    const respostaA = opcions?.respostaA ? String(opcions.respostaA) : null;
    const myMsg = { id: `m-${Date.now()}-${seguentSeq(filId)}`, text, respostaA, sender: 'me', author: 'Jo', creatAl: new Date().toISOString() };
    myMsg.seq = seqs.current[filId];
    setMessages((prev) => ({ ...prev, [filId]: [...(prev[filId] || []), myMsg] }));

    const temporitzador = setTimeout(() => {
      temporitzadors.current.delete(temporitzador);
      const seq = seguentSeq(filId);
      const reply = {
        id: `r-${Date.now()}-${seq}`,
        seq,
        text: t('section.xat.fake.reply', "Açò és una simulació. Registra't per a parlar amb els pobles de veritat!"),
        sender: 'other',
        author: fil.name,
        is_ai: fil.tipus === 'ia',
        creatAl: new Date().toISOString()
      };
      setMessages((prev) => ({ ...prev, [filId]: [...(prev[filId] || []), reply] }));
    }, 1000);
    temporitzadors.current.add(temporitzador);

    return [myMsg];
  }, [t, seguentSeq]);

  const fakeContext = useMemo(() => ({
    ...originalContext,
    status: 'ready',
    chatThreads: fakeThreads,
    comunitats,
    getThreadMessages,
    sendChatMessage,
    totalNoLlegits: 2,
    cercaMembres: async () => CONTACTES_AJUDA.map(({ nom, tipus }) => ({
      nom, tipus, usuari_id: `ajuda:${tipus}`, avatar_url: CARA_DAJUDA[tipus] || null, noDisponible: false
    })),
    creaFil: async (altreUsuariId) => {
      return altreUsuariId === 'ajuda:ia' ? 'fake-iaia' : 'fake-sdp';
    }
  }), [originalContext, fakeThreads, comunitats, getThreadMessages, sendChatMessage]);

  return <XatContext.Provider value={fakeContext}>{children}</XatContext.Provider>;
}
