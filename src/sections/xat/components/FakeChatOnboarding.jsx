import React, { useMemo, useState, useCallback } from 'react';
import { XatContext } from '../XatContext.jsx';
import { CONTACTES_AJUDA } from '../contactesAjuda.js';
import { useUIActions } from '../../../app/contexts/UIContext.jsx';

export default function FakeChatOnboarding({ originalContext, children }) {
  const { t } = useUIActions();
  const [messages, setMessages] = useState({
    'fake-iaia': [
      { id: 'm1', seq: 1, text: t('section.xat.fake.iaia1', "Hola, foraster! Sóc la IAIA MarIA, la intel·ligència d'este poble."), sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: new Date().toISOString() },
      { id: 'm2', seq: 2, text: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!"), sender: 'other', author: 'IAIA MarIA', is_ai: true, creatAl: new Date().toISOString() }
    ],
    'fake-sdp': [
      { id: 'm3', seq: 1, text: t('section.xat.fake.sdp1', "Benvingut a Sóc de Poble. Som una xarxa de pobles connectats."), sender: 'other', author: 'Sóc de Poble', is_ai: false, creatAl: new Date().toISOString() },
      { id: 'm4', seq: 2, text: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim."), sender: 'other', author: 'Sóc de Poble', is_ai: false, creatAl: new Date().toISOString() }
    ]
  });

  const fakeThreads = useMemo(() => [
    {
      id: 'fake-iaia',
      name: 'IAIA MarIA',
      title: 'IAIA MarIA',
      tipus: 'ia',
      participants: [{ id: 'ajuda:ia', nom: 'IAIA MarIA', tipus: 'ia' }],
      ultimAl: new Date().toISOString(),
      noLlegits: 1,
      ultimSeq: 2,
      llegitFinsSeq: 0,
      ultimText: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!")
    },
    {
      id: 'fake-sdp',
      name: 'Sóc de Poble',
      title: 'Sóc de Poble',
      tipus: 'entitat',
      participants: [{ id: 'ajuda:entitat', nom: 'Sóc de Poble', tipus: 'entitat' }],
      ultimAl: new Date().toISOString(),
      noLlegits: 1,
      ultimSeq: 2,
      llegitFinsSeq: 0,
      ultimText: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim.")
    }
  ], [t]);

  const getThreadMessages = useCallback((filId) => {
    return messages[filId] || [];
  }, [messages]);

  const sendChatMessage = useCallback(async (fil, text) => {
    const filId = fil.id;
    const msgId = `m-${Date.now()}`;
    const myMsg = { id: msgId, seq: messages[filId].length + 1, text, sender: 'me', author: 'Jo', creatAl: new Date().toISOString() };
    
    setMessages(prev => ({
      ...prev,
      [filId]: [...(prev[filId] || []), myMsg]
    }));
    
    setTimeout(() => {
      const reply = {
        id: `r-${Date.now()}`,
        seq: messages[filId].length + 2,
        text: t('section.xat.fake.reply', "Açò és una simulació. Registra't per a parlar amb els pobles de veritat!"),
        sender: 'other',
        author: fil.name,
        is_ai: fil.tipus === 'ia',
        creatAl: new Date().toISOString()
      };
      setMessages(prev => ({
        ...prev,
        [filId]: [...(prev[filId] || []), reply]
      }));
    }, 1000);
    
    return [myMsg];
  }, [messages, t]);

  const fakeContext = useMemo(() => ({
    ...originalContext,
    status: 'ready',
    chatThreads: fakeThreads,
    getThreadMessages,
    sendChatMessage,
    totalNoLlegits: 2,
    cercaMembres: async () => CONTACTES_AJUDA.map(({ nom, tipus }) => ({ nom, tipus, usuari_id: `ajuda:${tipus}`, noDisponible: false })),
    creaFil: async (altreUsuariId) => {
      return altreUsuariId === 'ajuda:ia' ? 'fake-iaia' : 'fake-sdp';
    }
  }), [originalContext, fakeThreads, getThreadMessages, sendChatMessage]);

  return <XatContext.Provider value={fakeContext}>{children}</XatContext.Provider>;
}
