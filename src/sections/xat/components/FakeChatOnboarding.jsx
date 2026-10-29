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
 *
 * Ordre del Mestre (261007) · El nom i la cara de les dues entrades d'ajuda
 * venen d'AJUDA (data/xatsPerDefecte.js), la font única que també fan servir
 * les files per defecte del xat en remot i «Nova conversa». Són els mateixos
 * valors d'abans (el padró per a la IAIA, el compte de la marca per a Sóc de
 * Poble): la pantalla no canvia.
 *
 * Onada 6 (tasca 12) · Amb el nivell d'IA a 0 (`iaiaApagada` del xat de
 * veres) la IAIA tampoc no és al xat de mostra: ni la seua conversa, ni el
 * seu no llegit, ni a «Nova conversa». La seua cara la retalla CaraXat.
 *
 * Gauntlet 261016 (prompt, Bloc 3.6; pla, Onada 1.2) · Ordre del Mestre: els
 * quatre actors, sempre, també per a qui no s'ha registrat.
 *   · «Gent de la Torre»: sense poble declarat, el de la llavor
 *     (pobleDelXat, POBLE_PER_DEFECTE), amb Avisos i General com sempre.
 *   · «Javi Llinares» (fake-javi), amb la seua foto (CONTACTE_HUMA): només el
 *     missatge automàtic de l'ordre, literal (MISSATGE_AUTOMATIC_DE_JAVI), i
 *     de només lectura: ni compositor ni cap resposta simulada en nom seu.
 *     Va darrere de les altres: les files de sempre no es mouen.
 *
 * Auditoria adversarial 261016 · El fil i la bombolla de Javi viuen ara a
 * data/xatsPerDefecte.js (filDeMostraDeJavi, missatgesDeMostraDeJavi), la
 * mateixa peça que rep el convidat de la llavor i del local (XatContext): la
 * pantalla d'ací no canvia. I creaFil (l'efecte ?amb= de XatSection: la via
 * «En privat» d'una targeta seua, «Escriu-li al xat») porta Javi, per id o
 * àlies del padró pilot, al seu xat de només lectura; abans acabava al xat de
 * mostra de l'entitat Sóc de Poble, amb compositor i resposta simulada.
 *
 * Gauntlet 261016_1530 (prompt, Bloc 3.6.1; relleu F57-F59) · Ordre del
 * Mestre: «PROHIBIT duplicar Sóc de Poble». Derogat el directe de mostra amb
 * l'entitat (el 'fake-sdp' amb avatar redó i «Registra't per a descobrir…»):
 * ara 'fake-sdp' és la COMUNITAT de Sóc de Poble, amb Avisos (la benvinguda
 * de sempre, sense llegir), General i Beta Testers, com la de la llavor
 * (xatSeed.js). Els quatre actors van en l'ordre de l'ordre (la comunitat de
 * Sóc de Poble, Javi, Gent de la Torre i la IAIA): els posa la llista
 * (actorsDelXat.js), com al xat de veres. «Nova conversa» amb Sóc de Poble
 * porta a la fitxa d'eixa comunitat (XatSection: /xat/<comunitat>).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XatContext } from '../XatContext.jsx';
import { agrupaComunitats } from '../missatges.js';
import { useUIActions } from '../../../app/contexts/UIContext.jsx';
import { useCoreContent } from '../../../app/contexts/CoreContentContext';
import {
  AJUDA, AJUDA_PER_CLAU, ID_FIL_DE_MOSTRA_DE_JAVI, esLaPersonaDeContacte, filDeMostraDeJavi, missatgesDeMostraDeJavi
} from '../../../data/xatsPerDefecte.js';
import usePobleAmfitrio from '../usePobleAmfitrio.js';
import { avatarDelPoble, nomDelPoble, objecteDelPoble, pobleDelXat } from '../pobleAmfitrio.js';
import { BENVINGUDA_IAIA, ENTITAT_PILOT_ID } from '../../../data/identitatsSeed.js';
import { RUTA_DE_SOC_DE_POBLE } from '../actorsDelXat.js';

const IAIA = AJUDA_PER_CLAU.iaia;
const SOC_DE_POBLE = AJUDA_PER_CLAU.socdepoble;

/* Gauntlet 261016_1530 (Bloc 3.6.1) · La comunitat de mostra de Sóc de Poble:
   l'id de sempre ('fake-sdp'), ara d'una comunitat. El subjecte és l'entitat
   pilot pel seu id de la llavor (actorsDelXat.js la reconeix i la posa la
   primera) i la seua ruta, la canònica. El nom del canal de proves és el
   literal de l'ordre (prompt 261016_1530, Bloc 3.6.1: «Beta Testers»), el
   mateix de la llavor (xatSeed.js), un nom propi que no es traduïx. */
const ID_COMUNITAT_SDP = 'fake-sdp';
const NOM_BETA_TESTERS = 'Beta Testers';

function filsDeSocDePoble(t, ara) {
  const subjecte = { tipus: 'entitat', id: ENTITAT_PILOT_ID, ruta: RUTA_DE_SOC_DE_POBLE, titol: SOC_DE_POBLE.nom };
  const comuna = { comunitatId: ID_COMUNITAT_SDP, subjecte, ultimAl: ara, llegitFinsSeq: 0 };
  return [
    { id: ID_COMUNITAT_SDP, tipus: 'comunitat', esComunitat: true, name: SOC_DE_POBLE.nom, title: SOC_DE_POBLE.nom, avatar_url: SOC_DE_POBLE.avatar, subjecte, ultimAl: ara, noLlegits: 0 },
    { ...comuna, id: `${ID_COMUNITAT_SDP}-avisos`, tipus: 'canal', esCanal: true, potEscriure: false, name: t('section.xat.fake.avisos', 'Avisos'), title: t('section.xat.fake.avisos', 'Avisos'), noLlegits: 1, ultimSeq: 2,
      ultimText: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim.") },
    { ...comuna, id: `${ID_COMUNITAT_SDP}-general`, tipus: 'grup', esGrup: true, name: t('section.xat.fake.general', 'General'), title: t('section.xat.fake.general', 'General'), noLlegits: 0, ultimSeq: 0, ultimText: '' },
    { ...comuna, id: `${ID_COMUNITAT_SDP}-beta`, tipus: 'grup', esGrup: true, name: NOM_BETA_TESTERS, title: NOM_BETA_TESTERS, noLlegits: 0, ultimSeq: 0, ultimText: '' }
  ];
}

/* Els fils de la comunitat del poble: la comunitat (sense missatges, amb la
   cara del poble si la seua fitxa en té), els Avisos (només lectura, com els
   de veritat per a qui no n'és administrador; sempre el megàfon) i el General
   (la icona de grup, com a la llavor).
   Onada 6 (integració Xat i Pobles) · `nom` és nomDelPoble(poble, towns):
   amb les fitxes i sense nom declarat per l'amfitrió, la comunitat es diu com
   la gent del poble, com el xat de veres. El títol del subjecte és el mateix
   que posaria objecteDelPoble(poble, towns). Arriba com a text (memoritzat a
   FakeChatOnboarding) perquè unes fitxes noves amb el mateix nom no refacen
   els fils de mostra. */
function filsDelPoble(poble, t, ara, avatar, nom) {
  if (!poble) return [];
  const benvinguda = t('section.xat.fake.poble1', "Benvinguts al xat de {nom}. Registra't per a parlar amb la gent del poble.").replace('{nom}', nom);
  const comuna = { comunitatId: 'fake-poble', ultimAl: ara, llegitFinsSeq: 0 };
  return [
    { id: 'fake-poble', tipus: 'comunitat', esComunitat: true, name: nom, title: nom, avatar_url: avatar, subjecte: { ...objecteDelPoble(poble), titol: nom }, ultimAl: ara, noLlegits: 0 },
    { ...comuna, id: 'fake-poble-avisos', tipus: 'canal', esCanal: true, potEscriure: false, name: t('section.xat.fake.avisos', 'Avisos'), title: t('section.xat.fake.avisos', 'Avisos'), noLlegits: 1, ultimSeq: 1, ultimText: benvinguda },
    { ...comuna, id: 'fake-poble-general', tipus: 'grup', esGrup: true, name: t('section.xat.fake.general', 'General'), title: t('section.xat.fake.general', 'General'), noLlegits: 0, ultimSeq: 0, ultimText: '' }
  ];
}

export default function FakeChatOnboarding({ originalContext, children }) {
  const { t } = useUIActions();
  const poble = pobleDelXat(usePobleAmfitrio());
  const { towns } = useCoreContent();
  const avatarPoble = useMemo(() => avatarDelPoble(poble, towns), [poble, towns]);
  const [ara] = useState(() => new Date().toISOString());
  const [messages, setMessages] = useState(() => ({
    'fake-iaia': [
      /* Gauntlet 261022_0225 (crítica Claude) · La salutació del Mestre, en
         la llengua de la interfície com la bombolla de davall. */
      { id: 'm1', seq: 1, text: t('section.xat.iaia.salutacio', BENVINGUDA_IAIA), sender: 'other', author: IAIA.nom, is_ai: true, creatAl: ara },
      { id: 'm2', seq: 2, text: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!"), sender: 'other', author: IAIA.nom, is_ai: true, creatAl: ara }
    ],
    /* Gauntlet 261016_1530 · La benvinguda de sempre, ara als Avisos de la comunitat. */
    [`${ID_COMUNITAT_SDP}-avisos`]: [
      { id: 'm3', seq: 1, text: t('section.xat.fake.sdp1', "Benvingut a Sóc de Poble. Som una xarxa de pobles connectats."), sender: 'other', author: SOC_DE_POBLE.nom, is_ai: false, creatAl: ara },
      { id: 'm4', seq: 2, text: t('section.xat.fake.sdp2', "Registra't per a descobrir tot el que oferim."), sender: 'other', author: SOC_DE_POBLE.nom, is_ai: false, creatAl: ara }
    ],
    /* Gauntlet 261016 (Bloc 3.6.1) · El literal de l'ordre, sense traduir:
       és el text que el Mestre ha fixat. Cap altre missatge en nom seu. */
    [ID_FIL_DE_MOSTRA_DE_JAVI]: missatgesDeMostraDeJavi(ara)
  }));
  /* Les respostes pendents es cancel·len en desmuntar (abans quedaven vives). */
  const temporitzadors = useRef(new Set());
  useEffect(() => () => {
    temporitzadors.current.forEach(clearTimeout);
    temporitzadors.current.clear();
  }, []);

  const nomPoble = useMemo(() => (poble ? nomDelPoble(poble, towns) : ''), [poble, towns]);
  const deLPoble = useMemo(() => filsDelPoble(poble, t, ara, avatarPoble, nomPoble), [poble, t, ara, avatarPoble, nomPoble]);
  const iaiaApagada = Boolean(originalContext?.iaiaApagada);

  const fakeThreads = useMemo(() => [
    /* Gauntlet 261016_1530 (Bloc 3.6.1) · La comunitat de Sóc de Poble, al lloc del directe derogat. */
    ...filsDeSocDePoble(t, ara),
    ...deLPoble,
    ...(iaiaApagada ? [] : [{
      id: 'fake-iaia',
      name: IAIA.nom,
      title: IAIA.nom,
      avatar_url: IAIA.avatar,
      tipus: IAIA.tipus,
      participants: [{ id: `ajuda:${IAIA.tipus}`, nom: IAIA.nom, tipus: IAIA.tipus }],
      ultimAl: ara,
      noLlegits: 1,
      ultimSeq: 2,
      llegitFinsSeq: 0,
      ultimText: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!")
    }]),
    /* Gauntlet 261016 (Bloc 3.6.1) · Javi Llinares: el missatge automàtic ja
       llegit (els no llegits de la mostra no canvien) i de només lectura. L'avís
       del compositor és la invitació de sempre de la mostra. */
    filDeMostraDeJavi({ ultimAl: ara, avis: t('section.xat.fake.iaia2', "Si t'agrada el que veus, registra't per a entrar al xat de veritat!") })
  ], [t, ara, deLPoble, iaiaApagada]);

  const comunitats = useMemo(() => agrupaComunitats(fakeThreads), [fakeThreads]);

  const getThreadMessages = useCallback((filId) => {
    if (messages[filId]) return messages[filId];
    /* Els Avisos del poble porten la benvinguda com a primer missatge. */
    const avisos = deLPoble.find((f) => f.id === filId && f.tipus === 'canal');
    return avisos ? [{ id: `${filId}-1`, seq: 1, text: avisos.ultimText, sender: 'other', author: nomPoble, is_ai: false, creatAl: ara }] : [];
  }, [messages, deLPoble, nomPoble, ara]);

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
    /* Gauntlet 261016 (Bloc 3.6.1) · Com el de veres (XatContext): a un fil de
       només lectura no s'envia res. El de Javi, a més, no respon mai sol. */
    if (fil?.potEscriure === false) return [];
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
        /* P1-52 (Fita 16 del Llibre Mestre, 261029) · Literal del Mestre, pla i sense pompositat; la clau el porta en les cinc llengües. */
        text: t('section.xat.fake.reply', 'Açò és una simulació. Si vols guardar la conversa, has de registrar-te, i ja està.'),
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
    /* Els no llegits de les dues entrades d'ajuda: un cadascuna (des del
       261016_1530, el de Sóc de Poble és als Avisos de la seua comunitat). */
    totalNoLlegits: iaiaApagada ? 1 : 2,
    cercaMembres: async () => AJUDA.filter(({ clau }) => !(iaiaApagada && clau === 'iaia')).map(({ nom, tipus, avatar }) => ({
      nom, tipus, usuari_id: `ajuda:${tipus}`, avatar_url: avatar || null, noDisponible: false
    })),
    creaFil: async (altreUsuariId) => {
      if (altreUsuariId === 'ajuda:ia' && !iaiaApagada) return 'fake-iaia';
      /* Auditoria adversarial 261016 · Javi, per id o àlies (mai pel nom): el
         seu xat de només lectura, no el de l'entitat. */
      if (esLaPersonaDeContacte({ id: altreUsuariId })) return ID_FIL_DE_MOSTRA_DE_JAVI;
      /* Gauntlet 261016_1530 · La comunitat de Sóc de Poble (XatSection n'obri la fitxa): cap directe de mostra. */
      return ID_COMUNITAT_SDP;
    },
    esFilAmagat: (filId) => iaiaApagada && filId === 'fake-iaia'
  }), [originalContext, fakeThreads, comunitats, getThreadMessages, sendChatMessage, iaiaApagada]);

  return <XatContext.Provider value={fakeContext}>{children}</XatContext.Provider>;
}
