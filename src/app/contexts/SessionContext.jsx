// src/app/contexts/SessionContext.jsx
import { useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
/* P1-71 (Gauntlet 261029) · L'objecte de context viu a objectesDeContext.js,
   que no importa res del projecte: una instància nova d'este mòdul (HMR) no
   en crea cap de nou. */
import { SessionContext } from './objectesDeContext.js';
import { EMPTY_SESSION_CONFIG, ESTAT_SESSIO } from './sessionContextIntern.js';
import { teCapacitat, logout, loginWithGoogle, loginWithPassword, registerWithPassword, listMyOrganizations, comprovaServidor, demanaRecuperacioContrasenya, definixContrasenyaNova, entraAmbTokenDeProveidor, getCurrentUser } from '../../data/backendPort.js';
import { getSessionState, subscribeSession, setSessionConfig, renovaAra } from '../../data/sessionService.js';
import { CLAU_USUARI, capturaSessio } from '../../data/identitat.js';
import {
  escoltaRecuperacioPendent, estatEnllacDeRecuperacio, oblidaEnllacDeRecuperacio, oblidaRecuperacioPendent, recuperacioPendentPer
} from '../../data/recuperacioPendent.js';
import { eixDeLaSessio, oblidaSessio, preparaEixida as preparaEixidaNucli, reprenSessio } from '../../data/autodesament/sessio.js';
import { enviaNotesDeLUsuari, oblidaNotesDeLUsuari, pendentsNotesDe } from '../../sections/notes/GlobalSaveManager.js';
import { entraComAPilot } from '../../data/sessioPilot.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { oblidaXatEnEixir } from '../../data/xifratXatEixida.js';
import {
  NOM_BD_ARXIUS_LOCALS, configuraMarcaOblitCarpetesLocals, creaCarregadorOblitCarpetesLocals, esOblitCarpetaPendent,
  marcaOblitCarpetaPendent
} from '../../sections/multimedia/marcaOblitCarpetesLocals.js';
import { registraEixidaDeVeres } from '../../data/expulsioAmfitrio.js';
import { delVal, getEfimer, getVal, setVal } from '../../config/storage.js';
import {
  baixaAvisosPushEnEixir, baixaLocalAvisosPushEnEntrar, oblidaAvisosPushEnEixir, reprenAvisosPushTrasEixidaFallida
} from '../../config/avisosPushXat.js';

const EMPTY_CONFIG = EMPTY_SESSION_CONFIG;

/* Pla 261029_1605 (Sessió; IDEA-54/55) · Un ordinador compartit del poble: les
   carpetes locals recordades del Gestor d'arxius (handles a la base del
   navegador) són del perfil, no de la persona. Eixir de veres les oblida totes,
   com els esborranys de Notes: després de tancar i només si ha anat bé. No
   rep cap argument (sessio.js passa usuariId i la biblioteca el prendria per
   opcions). */
/* Onada R30.2 · Oxigen del paquet d'arrencada: la biblioteca d'IndexedDB de
   carpetes locals (bibliotecaCarpetesLocals.js) es carrega sota demanda amb
   import() i es precarrega després del primer pintat quan hi ha sessió viva,
   igual que sessionsIAIALocals.js. Una càrrega fallida s'oblida i la següent
   ho torna a provar.
   Onada R32.2 (lot_05 i lot_02 de Codex R32) · El carregador viu al mòdul
   lleuger (creaCarregadorOblitCarpetesLocals). L'oblit de l'eixida hi posa la
   marca d'oblit pendent ABANS d'esperar el tros, no només quan el tros falla:
   una pestanya que es tanca mentre el tros arriba ja deixa la marca
   persistent, i la biblioteca, quan arribe, no llista res de l'anterior fins
   que un clear() va bé. La precàrrega continua sense marcar res. */
const carregadorOblitCarpetesLocals = creaCarregadorOblitCarpetesLocals(
  () => import('../../sections/multimedia/bibliotecaCarpetesLocals.js')
);
const carregaOblitDeCarpetesLocals = () => carregadorOblitCarpetesLocals.carrega();
/* Onada R32 (Gauntlet final, QA-R2-04 i QA-A01b) · Des de R30.2 l'oblit de
   l'eixida pot rebutjar: el tros de la biblioteca pot no arribar (una xarxa
   rural que cau en la precàrrega i en eixir, o un desplegament que deixa en
   404 el tros vell). sessio.js s'empassaria el rebuig i l'eixida acabaria bé
   sense oblidar res ni deixar cap marca, i la persona següent veuria les
   carpetes de qui ha eixit. Davant de qualsevol rebuig d'esta crida (el del
   tros o un d'inesperat de la biblioteca), i només ací, a l'eixida de veres
   (la precàrrega fallida no marca res: no bloqueja el Gestor de qui és dins):
     · la marca d'oblit pendent, que el carregador ja ha posat abans
       d'esperar (R32.2), es torna a posar des del mòdul lleuger, que ja és a
       l'entrada i no importa res; és la persistent de QA-R2-04 (més avall), i
       quan el tros arribe la biblioteca torna a provar el clear() abans de
       llistar res;
     · l'avís de l'oblit, que fa la biblioteca, ix pel mateix canal cap a les
       altres pestanyes: un Gestor muntat en una germana es buida igual que
       amb l'oblit bo. En esta, sense el tros, no n'hi ha cap de muntat.
   Torna la forma de la biblioteca ({ ok:false, codi:'OBLIT_CARPETES_PENDENT' }),
   encara que l'eixida no la llig. Ni la marca ni l'avís no llancen. */
/* El canal és CANAL_OBLIT de bibliotecaCarpetesLocals.js, que no s'importa
   perquè és del tros diferit. SessionContext.carpetesLocals.trosNoArriba
   .seguretat.test.jsx el fixa amb l'escoltador real de la biblioteca: si el
   nom canvia allà, la prova cau. */
const CANAL_OBLIT_CARPETES = 'sdp-arxius-locals-oblit';
const avisaOblitDeCarpetesAAltresPestanyes = () => {
  try {
    const canal = new BroadcastChannel(CANAL_OBLIT_CARPETES);
    canal.postMessage({ origen: 'eixida-sense-tros' });
    canal.close();
  } catch {
    /* sense BroadcastChannel: només hi ha esta pestanya */
  }
};
const oblidaCarpetesLocalsEnEixir = () => carregadorOblitCarpetesLocals.oblidaTotesLesCarpetesLocals()
  .catch(() => {
    marcaOblitCarpetaPendent(NOM_BD_ARXIUS_LOCALS, true);
    avisaOblitDeCarpetesAAltresPestanyes();
    return { ok: false, codi: 'OBLIT_CARPETES_PENDENT' };
  });

/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · L'oblit
   dels títols locals de la IAIA es demana sota demanda: el registre
   (sections/xat/sessionsIAIALocals.js) i el seu magatzem d'IndexedDB
   (utils/magatzemLocal.js) ja no viatgen a l'arrencada del paquet per una sola
   funció de l'eixida. La funció és la mateixa i va al mateix lloc de
   DESPRES_DE_TANCAR: sessio.js l'espera (Promise.all) i un rebuig, també el
   d'un tros que no arriba, no talla mai l'eixida. Perquè una eixida sense xarxa
   (un ordinador compartit del poble) no deixe els títols de qui ix, el tros es
   precarrega després del primer pintat quan hi ha una persona dins
   (SessionProvider); una càrrega fallida s'oblida i la següent ho torna a provar. */
let oblitDeTitolsIAIA = null;
const carregaOblitDeTitolsIAIA = () => {
  oblitDeTitolsIAIA ??= import('../../sections/xat/sessionsIAIALocals.js').catch((error) => {
    oblitDeTitolsIAIA = null;
    throw error;
  });
  return oblitDeTitolsIAIA;
};
/* Onada R32.2 (ARBITRATGE-EGM-03, Peixos del Node 0) · Quan el tros no
   arribava en eixir, l'oblit rebutjava abans de posar cap marca: sessio.js
   només ho avisava a la consola i els títols de qui ix es quedaven a
   l'IndexedDB d'un ordinador compartit, sense cap reintent. Ara, ABANS de cap
   espera i sense llançar:
     · es posa la marca d'oblit pendent del mateix registre (el
       PREFIX_OBLIT_PENDENT de sessionsIAIALocals.js, la que oblidaPersona posa
       i lleva): lligEstat i desaPrimerTitol ja la respecten i tornen a provar
       l'oblit abans de llegir o d'escriure res d'eixa persona;
     · la persona entra a una llista curta de la capa de preferències (només
       identificadors, com eixa marca) perquè la pròxima arrencada ho torne a
       provar després del primer pintat, siga qui siga qui entre
       (reprenOblitsPendents, més avall). La llista guarda les últimes
       MAXIM_TITOLS_IAIA_PER_REINTENTAR persones; la marca del registre de les
       que en isquen continua posada.
   L'oblit bo d'ací lleva totes dues; el que el registre acaba pel seu compte
   només lleva la marca, i la persona ix de la llista en la pròxima arrencada
   sense tornar a oblidar res (reprenOblitsPendents). El rebuig continua arribant a sessio.js, que
   l'avisa, i no talla l'eixida. SessionContext.oblitsPendents.seguretat
   .test.jsx fixa el prefix amb el registre real: si el nom canvia allà, la
   prova cau. */
const PREFIX_OBLIT_TITOLS_IAIA = 'iaia-titols-oblit-pendent:';
const CLAU_TITOLS_IAIA_PER_REINTENTAR = 'iaia-titols-oblit-reintent';
const MAXIM_TITOLS_IAIA_PER_REINTENTAR = 16;
const titolsIAIAPerReintentar = () => {
  const llista = getVal(CLAU_TITOLS_IAIA_PER_REINTENTAR, []);
  return Array.isArray(llista) ? [...new Set(llista.filter((id) => typeof id === 'string' && id !== ''))] : [];
};
const anotaTitolsIAIAPerReintentar = (persona) => {
  setVal(PREFIX_OBLIT_TITOLS_IAIA + persona, true);
  const llista = [...titolsIAIAPerReintentar().filter((id) => id !== persona), persona];
  setVal(CLAU_TITOLS_IAIA_PER_REINTENTAR, llista.slice(-MAXIM_TITOLS_IAIA_PER_REINTENTAR));
};
const llevaTitolsIAIAPerReintentar = (persona) => {
  const resta = titolsIAIAPerReintentar().filter((id) => id !== persona);
  if (resta.length) setVal(CLAU_TITOLS_IAIA_PER_REINTENTAR, resta);
  else delVal(CLAU_TITOLS_IAIA_PER_REINTENTAR);
};
const oblidaTitolsIAIADePersona = (usuariId) => {
  const persona = String(usuariId);
  if (persona !== '') anotaTitolsIAIAPerReintentar(persona);
  return carregaOblitDeTitolsIAIA()
    .then((modul) => modul.oblidaTitolsIAIADePersona(persona))
    .then(() => { llevaTitolsIAIAPerReintentar(persona); });
};

/* QA-R2-04 (Codex, Ronda 2) · Si l'oblit no ha pogut buidar la base
   ({ ok:false, codi:'OBLIT_CARPETES_PENDENT' }), la biblioteca el deixa
   pendent: cap muntatge del Gestor obri sol (ni llista) una carpeta de qui ha
   eixit fins que un reintent el confirma. La marca de memòria es perdria en
   recarregar o en una pestanya nova; esta, a la capa de preferències de
   src/config/storage.js (un booleà, cap dada de ningú), la conserva fins al
   reintent bo, també després de tancar el navegador: amb un permís
   persistent, la carpeta s'obriria sola en tornar. Es registra en carregar
   el mòdul: l'eixida sempre passa per ací i el Gestor l'importa abans de
   muntar-se. La marca viu al mòdul lleuger (marcaOblitCarpetesLocals.js),
   que és l'únic que importa la biblioteca. */
const CLAU_OBLIT_CARPETES_PENDENT = 'arxius-locals-oblit-pendent';
configuraMarcaOblitCarpetesLocals({
  llig: () => getVal(CLAU_OBLIT_CARPETES_PENDENT, false) === true,
  desa: () => setVal(CLAU_OBLIT_CARPETES_PENDENT, true),
  esborra: () => delVal(CLAU_OBLIT_CARPETES_PENDENT)
});

/* Onada R32.2 (ARBITRATGE-EGM-03) · La pròxima arrencada torna a provar els
   oblits que una eixida no va poder acabar: una sola vegada per càrrega del
   mòdul, després del primer pintat (SessionProvider) i amb qui siga dins o
   sense ningú. Primer els títols IAIA de cada persona de la llista, un rere
   l'altre; després les carpetes locals, si la seua marca continua posada (la
   biblioteca també ho tornaria a provar abans de llistar res, però així les
   dades de qui va eixir no esperen que algú òbriga el Gestor). Sense res
   pendent, cap import(). Una fallada deixa les marques per a la pròxima, no
   tomba res i ho diu a la consola (sense cap identificador de persona); no hi
   ha avís a les altres pestanyes, que no han vist cap eixida.
   Onada R32.2 (Peixos sobre EGM-03) · La font de veritat de cada persona és
   la marca del registre, no la llista: el registre real (lligEstat →
   oblidaPersona) pot acabar l'oblit pel seu compte quan la persona torna a
   entrar i obri la IAIA, i només lleva la seua marca. Una persona de la
   llista sense marca ja té l'oblit confirmat i ix de la llista sense tornar a
   oblidar res: si no, la recàrrega següent esborraria els títols NOUS de la
   seua sessió viva. Es mira en el moment de cada intent, dins de la cadena. */
const avisaOblitPendent = (que, motiu) => {
  console.warn(`[sessio] L'oblit pendent ${que} no s'ha pogut acabar: es tornarà a provar en la pròxima arrencada.`,
    motiu?.message || motiu?.codi || motiu);
};
const titolsIAIAEncaraPendents = (persona) => getVal(PREFIX_OBLIT_TITOLS_IAIA + persona, false) === true;
let oblitsPendentsRepresos = false;
const reprenOblitsPendents = () => {
  if (oblitsPendentsRepresos) return;
  oblitsPendentsRepresos = true;
  const persones = titolsIAIAPerReintentar();
  persones.reduce(
    (cadena, persona) => cadena.then(() => {
      if (!titolsIAIAEncaraPendents(persona)) {
        llevaTitolsIAIAPerReintentar(persona);
        return undefined;
      }
      return oblidaTitolsIAIADePersona(persona)
        .catch((error) => avisaOblitPendent('dels títols de la IAIA', error));
    }),
    Promise.resolve()
  );
  if (esOblitCarpetaPendent(NOM_BD_ARXIUS_LOCALS)) {
    carregadorOblitCarpetesLocals.oblidaTotesLesCarpetesLocals().then(
      (resultat) => { if (resultat?.ok !== true) avisaOblitPendent('de les carpetes locals', resultat); },
      (error) => avisaOblitPendent('de les carpetes locals', error)
    );
  }
};

/* T47 (correcció de la revisió C02, 260928) · Els gestors d'esborranys que no
   són la cua del nucli entren a l'eixida des d'ací (src/data no importa de
   src/sections). Notes ('SdpNotesQueue'): envia amb la sessió encara vàlida,
   oblida només si tancar ha anat bé i diu el que queda per a l'avís (C01). */
const ABANS_DE_TANCAR = Object.freeze([enviaNotesDeLUsuari]);
const DESPRES_DE_TANCAR = Object.freeze([oblidaNotesDeLUsuari, oblidaCarpetesLocalsEnEixir, oblidaTitolsIAIADePersona]);
const PENDENTS_DE = Object.freeze([pendentsNotesDe]);

/* P1-12 pas 17 (disseny §8.5, D-09) · L'oblit del xat xifrat entra a l'eixida
   com Notes: després de tancar i només si ha anat bé, en paral·lel amb
   oblidaNotesDeLUsuari i darrere d'ella en la llista (bases distintes:
   'SdpNotesQueue' i la del xat). Porta en una clausura la config de l'eixida,
   perquè sessio.js només passa usuariId i la clauIdentitat de qui ix s'ha de
   calcular amb ella: quan arriba ací, la interfície ja pot haver buidat
   l'àmbit del xat. oblidaXatEnEixir no rebutja mai (una fallada és l'estat
   OBLIT_FALLIT, que XatContext mostra). Bandera apagada: la mateixa llista de
   sempre, sense cap crida nova. La bandera es llig en cridar (l'enllaç ESM és
   viu: una prova la pot canviar amb un getter), i SENSE try: Rollup plega la
   constant i, apagada, l'oblit del xat i el magatzem de claus no viatgen al tros
   d'entrada (Gauntlet c1, SessionContext.e2eeApagat.produccio.test.js). Qui
   simula config/xifratXat.js hi ha de posar la bandera (importOriginal). */
const xatXifratActiu = () => E2EE_ACTIU_PER_DEFECTE === true;
const despresDeTancarAmb = (config, opcionsXat = {}) => (xatXifratActiu()
  ? Object.freeze([...DESPRES_DE_TANCAR, (usuariId) => oblidaXatEnEixir({ ...opcionsXat, config, usuariId })])
  : DESPRES_DE_TANCAR);

/* T2 i T4 (ordre del Mestre, 260930) · La capacitat opcional 'salut' del port,
   tal qual. Es resol en cridar-la, no en muntar: un port sense la capacitat
   (o una prova que el simula sense ella) no fa caure el proveïdor. Qui la usa
   pregunta abans teCapacitat('salut'). */
const comprovaServidorDelPort = (...args) => comprovaServidor(...args);
/* R (Onada 3, 261003) · La capacitat opcional 'recuperacioContrasenya', igual:
   es resol en cridar-la i qui la usa pregunta abans teCapacitat.
   Correcció de la revisió · La recuperació en curs (data/recuperacioPendent.js:
   la marca i, des de R2, l'enllaç que espera «Desa») l'esborra ací, igual per
   a tots els backends: la contrasenya nova desada, eixir o una entrada
   explícita. Una entrada explícita només es pot fer des del formulari: la
   recuperació d'abans ja no és de ningú que estiga dins. */
const demanaRecuperacioDelPort = (...args) => demanaRecuperacioContrasenya(...args);
const definixContrasenyaDelPort = async (...args) => {
  const resultat = await definixContrasenyaNova(...args);
  oblidaRecuperacioPendent();
  return resultat;
};
/* B8C-1 (marató 261101_2143; B8-CLIENT §2.4, ARB-05) · Una entrada explícita
   pot ser d'una altra persona en el mateix aparell: baixa LOCAL dels avisos
   push que hi haja (sense retirada, encara no hi ha sessió). No s'espera ni
   pot tallar l'entrada: té el seu propi límit i no rebutja. Qui torna a entrar
   a mà torna a encendre els avisos amb el seu gest; una sessió que es recupera
   sola no passa per ací i els conserva. */
const baixaLocalPushEnEntrar = () => {
  try { Promise.resolve(baixaLocalAvisosPushEnEntrar()).catch(() => {}); } catch { /* l'entrada no depén dels avisos */ }
};
const ambEntradaExplicita = (entra) => (...args) => {
  oblidaRecuperacioPendent();
  baixaLocalPushEnEntrar();
  return entra(...args);
};
const loginWithPasswordDelPort = ambEntradaExplicita((...args) => loginWithPassword(...args));
const loginWithGoogleDelPort = ambEntradaExplicita((...args) => loginWithGoogle(...args));
const registerWithPasswordDelPort = ambEntradaExplicita((...args) => registerWithPassword(...args));
/* Fase D (261020, tasca 1) · La capacitat opcional 'entradaAmbToken' (Apple i
   Google des del full natiu): una entrada explícita més, resolta en cridar-la
   com 'salut' (un port, o una prova, sense ella no fa caure el proveïdor). */
const entraAmbTokenDelPort = ambEntradaExplicita((...args) => entraAmbTokenDeProveidor(...args));
/* Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local
   (data/sessioPilot.js): només en desenvolupament i en mode de proves, sense
   cap petició. No és del port: la sessió de prova és del nucli, per a tots els
   backends igual. És una entrada explícita com les altres i també oblida la
   recuperació en curs. */
const entraComAPilotDelNucli = ambEntradaExplicita((...args) => entraComAPilot(...args));
/* Eixir de veres (no buidar només la pestanya) també l'oblida, quan ha anat bé. */
const iOblidaRecuperacio = (promesa) => Promise.resolve(promesa).then((resultat) => {
  oblidaRecuperacioPendent();
  return resultat;
});

/* La capacitat del port, sense fer caure el proveïdor si el port no la sap dir. */
const teCapacitatSegura = (nom) => {
  try { return teCapacitat(nom) === true; } catch { return false; }
};

/* QA-A01a (Gauntlet 261029_1858) · L'eixida de veres, una sola font: «Tancar
   sessió», «Eixir del poble», la baixa (amb el seu `tanca`) i l'expulsió de
   l'amfitrió (host.js expulsaSessio, per data/expulsioAmfitrio.js) passen per
   ací. Primer l'intent final, després `tanca` i, només si ha anat bé,
   DESPRES_DE_TANCAR (Notes, carpetes locals i, amb E2EE, el xat).
   B8C-1 (marató 261101_2143; B8-CLIENT §2.4) · Els avisos push d'este aparell
   se'n van amb la sessió: primer la baixa (amb la sessió encara vàlida, per a
   retirar l'aparell al servidor) i, si tancar ha anat bé, l'oblit local. Mai
   bloqueja l'eixida: la baixa té el seu propi límit i l'intent final, el seu.
   NO va a ABANS_DE_TANCAR: preparaEixida (l'avís previ, que no tanca res)
   també la crida, i la persona encara pot fer «Cancel·la». Si `tanca` llança,
   la persona continua dins: el registre torna a admetre el seu servidor (el
   push ja és apagat i el pot tornar a encendre, D-B8C-8). Les funcions no
   reben res: sessio.js els passaria usuariId i el registre el prendria per
   opcions. */
const baixaPushEnEixir = () => baixaAvisosPushEnEixir();
const oblitPushEnEixir = () => oblidaAvisosPushEnEixir();
/* Onada R32.2 (lot_02 de Codex i Peixos) · L'intent final de sincronitzar
   espera xarxa (fins a LIMIT_EIXIDA_MS) i, mentrestant, la sessió de la
   pestanya pot canviar: capturaSessio() ho detecta (canvia generacioEntrada).
   La guarda només ha de protegir una sessió NOVA, no callar l'oblit de qui ix:
     · la pestanya s'ha buidat i no hi ha ningú (una renovació que rep 400/401
       fa tancaPestanya; reconciliaAmbRegistre quan una altra pestanya canvia
       de compte; un segon clic a «Tancar sessió»): no hi ha cap sessió nova a
       revocar, i l'eixida continua com sempre, amb `tanca` (idempotent sobre
       una pestanya buida: sense JWT no revoca res i el registre d'un altre
       compte es queda) i tots els oblits de DESPRES_DE_TANCAR;
     · hi ha una entrada nova (una altra persona, o l'amfitrió que injecta la
       sessió de qui ve just després d'expulsar): no es crida `tanca` (ni el
       logout ni la baixa tocarien la sessió nova). Si qui ha entrat NO és qui
       ix, abans de rebutjar s'obliden igualment, en este dispositiu, les
       dades locals de qui ix (la cua i Notes del seu àmbit, les carpetes
       locals del perfil, els seus títols de la IAIA i, amb E2EE, el seu xat,
       que conserva l'àmbit fixat d'un altre). Si és la mateixa persona, les
       seues dades són de qui és dins i es queden.
   El discriminador és l'actor cru de la pestanya, el mateix que compara
   capturaSessio(), no getCurrentUser() (que exigix un JWT no caducat). */
const actorDeLaPestanya = () => getEfimer(CLAU_USUARI, null)?.id ?? null;
const oblitLocalSegur = (funcio, ...args) => {
  try {
    return Promise.resolve(funcio(...args)).catch((error) => {
      console.warn('[sessio] Oblit local de qui ix:', error?.message || error);
    });
  } catch (error) {
    console.warn('[sessio] Oblit local de qui ix:', error?.message || error);
    return Promise.resolve();
  }
};
const oblidaLocalDeQuiIx = async ({ config, usuariId, opcionsXat }) => {
  await oblitLocalSegur(oblidaSessio, config, usuariId);
  await Promise.all(despresDeTancarAmb(config, opcionsXat).map((funcio) => oblitLocalSegur(funcio, usuariId)));
};
function eixidaDeVeres({ config, usuariId, tanca, opcionsXat }) {
  const current = capturaSessio();
  let tancada = false;
  const tancaIAnota = async () => {
    try {
      current();
    } catch (error) {
      const actor = actorDeLaPestanya();
      if (actor != null) {
        if (usuariId != null && String(actor) !== String(usuariId)) {
          await oblidaLocalDeQuiIx({ config, usuariId, opcionsXat });
        }
        throw error;
      }
    }
    const resultat = await tanca();
    tancada = true;
    return resultat;
  };
  return iOblidaRecuperacio(eixDeLaSessio({
    config, usuariId, tanca: tancaIAnota,
    abansDeTancar: [...ABANS_DE_TANCAR, baixaPushEnEixir],
    despresDeTancar: [...despresDeTancarAmb(config, opcionsXat), oblitPushEnEixir],
  })).catch((error) => {
    if (!tancada) reprenAvisosPushTrasEixidaFallida();
    throw error;
  });
}

/* QA-A01a · Sense cap proveïdor muntat (l'element tret de la pàgina de
   l'amfitrió), l'expulsió fa la mateixa eixida amb la config del paquet (el
   backend i el tenant són de la capa del paquet, Model B) i la persona que
   tinga la sessió desada ara. Cada SessionProvider muntat la tapa amb la seua. */
const usuariDeLaSessioDesada = () => {
  try {
    const usuari = getCurrentUser();
    if (usuari?.id != null) return usuari.id;
  } catch { /* port sense arrencar o simulat: l'estat del servei */ }
  try { return getSessionState()?.usuari?.id ?? null; } catch { return null; }
};
registraEixidaDeVeres(() => eixidaDeVeres({
  config: EMPTY_CONFIG, usuariId: usuariDeLaSessioDesada(), tanca: () => logout(EMPTY_CONFIG)
}));

/** 'comprovant' → encara no se sap. 'dins' / 'fora' → resolt. */
export const ESTAT = ESTAT_SESSIO;

export function SessionProvider({ children, config = EMPTY_CONFIG }) {
  const owner = useRef(Symbol('SessionProvider'));
  const [estatComplet, setEstatComplet] = useState(getSessionState());
  
  useEffect(() => {
    const release = setSessionConfig(config, owner.current);
    const unsubscribe = subscribeSession(setEstatComplet);
    return () => { unsubscribe(); release(); };
  }, [config]);

  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · `nivell` és el claim `aal`
     del JWT ('aal1' | 'aal2' | null, sessionService). */
  const { usuari, estat, rol, generacio, nivell = null } = estatComplet;
  const usuariId = usuari?.id ?? null;

  /* R · correcció de la revisió · La sessió d'un enllaç de recuperació encara
     ha de definir la contrasenya nova. Es llig a cada pintat (síncron i xicotet)
     i es torna a pintar quan la marca canvia, ací o en una altra pestanya. Sense
     la capacitat no hi ha pantalla on definir-la: no compta. */
  const [, setVersioRecuperacio] = useState(0);
  useEffect(() => escoltaRecuperacioPendent(() => setVersioRecuperacio((v) => v + 1)), []);
  const potRecuperar = teCapacitatSegura('recuperacioContrasenya');
  const recuperacioPendent = usuariId != null && potRecuperar && recuperacioPendentPer(usuariId);
  /* R2 (decisió del Mestre, 261003) · L'enllaç del correu espera «Desa» sense
     sessió: 'pendent' (en la memòria d'este document) o 'perdut' (la pestanya
     s'ha recarregat i cal tornar a obrir l'enllaç). Amb sessió o sense. */
  const enllacDeRecuperacio = potRecuperar ? estatEnllacDeRecuperacio() : null;

  /* T47 (ordre del Mestre, 260928) · En cada entrada de sessió (i en arrencar
     amb una de viva), la cua d'autodesament torna a enviar el que esta
     persona havia deixat pendent en este backend. */
  useEffect(() => {
    if (estat === 'dins' && usuariId != null) reprenSessio(config, usuariId);
  }, [config, estat, usuariId]);

  /* Onada R24 · wp_trinquet · Amb una persona dins, l'oblit dels seus títols de
     la IAIA ja és a la memòria quan isca (carregaOblitDeTitolsIAIA): després del
     primer pintat, mai abans. Onada R30.2 · També el de les carpetes locals.
     Onada R32 · Una precàrrega fallida no posa cap marca d'oblit: només
     l'eixida de veres (oblidaCarpetesLocalsEnEixir). */
  useEffect(() => {
    if (estat === 'dins' && usuariId != null) {
      carregaOblitDeTitolsIAIA().catch(() => {});
      carregaOblitDeCarpetesLocals().catch(() => {});
    }
  }, [estat, usuariId]);

  /* Onada R32.2 (ARBITRATGE-EGM-03) · Els oblits que una eixida anterior no
     va poder acabar es tornen a provar després del primer pintat. */
  useEffect(() => { reprenOblitsPendents(); }, []);

  const backendFuncs = useMemo(() => ({
    teCapacitat,
    loginWithGoogle: loginWithGoogleDelPort,
    loginWithPassword: loginWithPasswordDelPort,
    registerWithPassword: registerWithPasswordDelPort,
    entraComAPilot: entraComAPilotDelNucli,
    listMyOrganizations,
    comprovaServidor: comprovaServidorDelPort,
    demanaRecuperacioContrasenya: demanaRecuperacioDelPort,
    definixContrasenyaNova: definixContrasenyaDelPort,
    entraAmbTokenDeProveidor: entraAmbTokenDelPort,
    /* R2 · «Torna a entrar» i «Demana un enllaç nou» des de la pantalla. */
    oblidaEnllacDeRecuperacio
  }), []);

  /* La revocació pertany a l'adaptador. Sense configuració explícita, o quan
     el botó passa l'esdeveniment del clic, usem la del proveïdor actual. */
  const configDeCrida = useCallback(
    (configCrida) => (configCrida && typeof configCrida === 'object' && !('preventDefault' in configCrida)
      ? configCrida : config),
    [config]
  );

  /* T47 (correcció de la revisió, 260928) · Tota eixida de veres passa per
     eixDeLaSessio: primer un intent final (curt) d'enviar el que esta persona
     té pendent amb la sessió encara vàlida, després `tanca` i, si ha anat bé,
     els seus esborranys s'obliden d'este dispositiu (un ordinador compartit
     del poble). `eixAmb` és per a qui tanca la sessió d'una altra manera (la
     baixa la tanca dins de l'adaptador). */
  const eixAmb = useCallback(
    (tanca, configCrida) => {
      const configEixida = configDeCrida(configCrida);
      /* P1-12 pas 17 (D-09) · La baixa no conserva res del xat xifrat, tampoc a l'app. */
      return eixidaDeVeres({ config: configEixida, usuariId, tanca, opcionsXat: { mantenSessio: false } });
    },
    [configDeCrida, usuariId]
  );

  const tancaSessio = useCallback(
    (configCrida, opcions) => {
      const configEixida = configDeCrida(configCrida);
      /* Buidar només la pestanya ('pestanya': renovació fallida) no és eixir:
         els esborranys es conserven i es tornen a enviar en tornar. */
      if (opcions?.abast === 'pestanya') return logout(configEixida, opcions);
      return eixidaDeVeres({ config: configEixida, usuariId, tanca: () => logout(configEixida, opcions) });
    },
    [configDeCrida, usuariId]
  );

  /* QA-A01a (Gauntlet 261029_1858) · L'amfitrió que expulsa la sessió
     (host.js expulsaSessio) passa per esta mateixa eixida de veres, amb la
     config d'este proveïdor: abans cridava el logout de l'adaptador
     directament i les carpetes locals, els esborranys de Notes i el xat xifrat
     es quedaven en un ordinador compartit. */
  useEffect(() => registraEixidaDeVeres(() => tancaSessio()), [tancaSessio]);

  /* T47 (correcció de la revisió C01, 260928) · Abans de «Confirmar eixida» o
     «Eixir del poble»: l'intent final i el que el servidor encara NO té. No
     tanca ni oblida res; qui pregunta ho diu a la persona i ella decidix. */
  const preparaEixida = useCallback(
    (configCrida) => preparaEixidaNucli({
      config: configDeCrida(configCrida), usuariId, abansDeTancar: ABANS_DE_TANCAR, pendentsDe: PENDENTS_DE,
    }),
    [configDeCrida, usuariId]
  );

  const value = useMemo(
    () => {
      const estatEfectiu = (estat === 'dins' && rol === 'desconegut') ? 'comprovant' : estat;
      const esSuperadmin = rol === 'superadmin';
      /* Onada 11 (261010) · private.es_superadmin() exigix aal2 (migració
         2610061448): un superadmin sense el segon factor confirmat en esta
         sessió no pot desar res al Tauler, i la interfície ho ha de dir abans
         que el servidor torne 42501. */
      return {
        currentUser: usuari, estat: estatEfectiu, rol, esSuperadmin, renovaAra, generacio,
        nivell, calSegonFactor: esSuperadmin && nivell !== 'aal2',
        recuperacioPendent, enllacDeRecuperacio, ...backendFuncs, logout: tancaSessio, eixAmb, preparaEixida
      };
    },
    [usuari, estat, rol, generacio, nivell, recuperacioPendent, enllacDeRecuperacio, backendFuncs, tancaSessio, eixAmb, preparaEixida]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ha de ser usat dins de SessionProvider');
  return ctx;
}

/** T47 · La sessió si n'hi ha proveïdor, o null (una peça muntada sola: proves, catàleg). */
export function useSessioOpcional() {
  return useContext(SessionContext);
}
