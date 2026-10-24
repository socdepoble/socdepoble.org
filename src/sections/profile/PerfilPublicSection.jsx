/**
 * PerfilPublicSection.jsx — la pàgina pública d'una persona, una entitat o
 * un agent IA (Lògica d'Usuari, T4).
 *
 *   · Rutes: /gent/:id, /empresa/:id, /grup/:id, /ajuntament/:id i
 *     /perfil/:id. El prefix és orientatiu; qui mana és l'identificador (id o
 *     slug), que es resol amb la capacitat 'directori' del port
 *     (loadPerfilPublic). Sense la capacitat, cau al catàleg d'agents del
 *     contingut base.
 *   · Mateixa anatomia que la fitxa editable (perfilCamps): H1 = nom, H2 =
 *     bio o descripció o rol, entradilla = lema, cos = presentació.
 *   · Una IA es diu: etiqueta i avís visibles, sempre.
 *   · Accions honestes: «Escriu-li» obri el xat amb eixa identitat (?amb=id)
 *     (fora de la fitxa del paquet de la persona pilot: on va la seua fila
 *     del Xat, Gauntlet 261022_0225, P4b-3)
 *     i «Edita la fitxa» només si la fitxa és de qui mira. Per a la IAIA,
 *     «Parla amb la IAIA» va on va la seua fila de la llista del Xat
 *     (rutaDelXatDeLaIAIA, sections/xat/useObriXatPerDefecte.js).
 *   · T43 (ordre del Mestre, 260928) · Una organització que la persona
 *     administra (pertinença owner/admin d'IdentitatContext) també porta
 *     «Edita la fitxa» (obri el Perfil a la seua fitxa, sense canviar
 *     d'identitat) i, si no és l'actor actiu, «Actua com a {Org}». El correu
 *     de l'organització només ix si l'ha fet públic, amb un mailto validat.
 */
import { useEffect, useState } from 'react';
import { Bot, MessageCircle, PencilLine, UserCheck } from 'lucide-react';
import { useNavigate, useParams } from '../../app/contexts/RouterContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { esRolQueMana } from '../../components/universal/identitat/rols.js';
import { enllacMailto } from './contacteOrganitzacio.js';
import { rutaFitxaOrganitzacio } from './perfilModel.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import { ProveidorSincronitzacioTargetes } from '../detail/SincronitzacioTargetes.jsx';
/* Gauntlet 261016 (Bloc 3) · El tipus de perfil d'un agent del catàleg, de la
   seua font única a la capa de dades (abans, la còpia del directori): un
   personatge ANIMAL és una IA. */
import { AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { origenPublic } from '../../config/origenPublic.js';
/* T43 (ordre del Mestre, 260928) · Connectar una fitxa pública porta el seu
   descriptor i, per a una entitat o un grup, `organitzacio=ID`. La funció viu
   a config/navigation.js: el directori (ProfileSection) fa el mateix camí. */
import {
  objecteDePerfil, registraEntitatDelProjecte, rutaCanonicaDePerfil, rutaConnectarPerfil, rutaDAutoria
} from '../../config/navigation.js';
import { DEFAULT_AUTHOR, esRutaDelProjecte } from '../../components/universal/UniversalUtils';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';
import { resolveAsset } from '../../config/assetResolver.js';
import {
  ENTITAT_PILOT_SLUG, PERSONA_PILOT, POBLE_FUNDACIONAL, agentIASeed, clauFundacional, entitatSeed, esIAIA,
  fundacionalDeLaClau
} from '../../data/identitatsSeed.js';
/* Onada 11 (261010; refutació del front C, D12) · El destí del xat de la IAIA
   és el mateix que el de la seua fila de la llista i el del botó de /iaia. */
import { rutaDelXatDeJavi, rutaDelXatDeLaIAIA } from '../xat/useObriXatPerDefecte.js';
import { ID_FIL_DE_MOSTRA_DE_JAVI, esLaPersonaDeContacte } from '../../data/xatsPerDefecte.js';
import { useXat } from '../xat/XatContext';
import SelectorRealitat from '../realitat/SelectorRealitat.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
/* T6b (IDEA-14; decisió del Mestre, 261024) · «Gent que et seguix», a la fitxa pròpia d'una persona. */
import { GentQueEtSegueix } from './Seguidors.jsx';

/* Gauntlet 261016 (Bloc 3; regressió de la Fase 1, T1 «Dignitat de persona»)
   · Només una entitat, un grup o una IA porten la píndola del seu tipus. Una
   persona no es categoritza: no n'hi ha cap per a ella (abans, «Persona»). */
const ETIQUETA = Object.freeze({ entitat: 'Entitat', grup: 'Grup', ia: 'Intel·ligència artificial' });

const atributHtml = (valor) => String(valor ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Ordre del Mestre (261021, pla 261021_0015 §8.2: «Incrustació bidireccional
 * de targetes») · A /iaia, la targeta viva de «L'Ànima de la IAIA» (/anima),
 * amb el mecanisme de targetes incrustades de sempre (data-sdp-targetes,
 * lliçó 261007 de sdp-universal-page): una targeta sola, a la dreta, dins del
 * flux de la presentació, just després del seu H3. Les dades són les de la
 * pàgina (PAGE_COPY.anima), mai una còpia. El text de la IAIA (decisió del
 * Mestre del 261010) no canvia: la targeta s'hi afig en pintar-lo. El sentit
 * contrari (la targeta de la IAIA dins de /anima) toca un contingut
 * estructural de la frontissa i espera l'aprovació del Mestre.
 */
export function presentacioAmbLaTargetaDeLAnima(html) {
  const anima = PAGE_COPY.anima;
  const text = String(html || '');
  if (!anima || !text) return text;
  const targeta = '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">'
    + `<div data-sdp-targeta="pagina:anima" class="sdp-targeta" data-ruta="/anima" data-titol="${atributHtml(anima.title)}"`
    + ` data-subtitol="${atributHtml(anima.subtitle)}" data-entradilla="${atributHtml(anima.lead)}"`
    + ` data-imatge="${atributHtml(anima.image)}" data-autor="IAIA MarIA" data-autor-ruta="/iaia">`
    + `<a href="/anima" rel="noopener noreferrer nofollow">${atributHtml(anima.title)}</a></div></div>`;
  const fiDelTitol = text.indexOf('</h3>');
  return fiDelTitol === -1 ? `${text}${targeta}` : `${text.slice(0, fiDelTitol + 5)}${targeta}${text.slice(fiDelTitol + 5)}`;
}

/** El mateix DTO que loadPerfilPublic, però des del catàleg d'agents del paquet. */
export function perfilDelCataleg(agent) {
  if (!agent) return null;
  const tipus = tipusDAgent(agent);
  return {
    tipus, id: agent.id, slug: null, nom: agent.name, avatar: agent.avatar_url || '', hero: '', lema: agent.lema || '',
    bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '', esIA: tipus === 'ia',
    publicat: true, propietari: false, copyright: '', emoticona: ''
  };
}

/**
 * Onada 11 (261010; prompt 261010_1730, tasca 6, D12) · El mateix DTO que
 * loadPerfilPublic, des del padró d'IA del paquet (AGENTS_IA_SEED,
 * identitatsSeed.js: hui, la IAIA MarIA), amb la seua presentació sencera
 * (com publicDAgent de data/localPerfils.js). Sense `creat` ni `modificat`:
 * cap data inventada (T51), i la barra taronja no pinta cap pastilla.
 * `propietari` és sempre false: fora de la llavor no hi ha cap rol que mane
 * sobre ella.
 */
export function perfilDeLaIADelPaquet(agent) {
  if (!agent) return null;
  return {
    tipus: 'ia', id: agent.id, slug: agent.slug || null, nom: agent.name, avatar: agent.avatar_url || '',
    hero: agent.hero_url || '', lema: agent.lema || '', bio: agent.role || '',
    presentacioHtml: agent.presentacio_html || agent.short_bio || '', poble: agent.town_name || '',
    esIA: true, publicat: true, propietari: false, copyright: agent.copyright || '', emoticona: '',
    /* Ordre del Mestre (261021, pla 261021_0015 §8.1) · La pastilla de data i
       hora de la barra taronja: les dates que declara la fila de l'agent
       (AGENTS_IA_SEED). Sense dates, cap pastilla (T51: cap data inventada). */
    creat: agent.created_at || undefined, modificat: agent.updated_at || undefined
  };
}

/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C; pla aprovat, Onada 1
 * punt 5: «perfilDeLaPersonaPilot com a fallback per a qualsevol àlies de la
 * persona pilot») · La fitxa de la persona pilot que el paquet ja publica: la
 * del catàleg (AGENTS_MAP.JAVI, la mateixa que localPerfils.js dona sense
 * sessió). Ningú no n'és propietari: fora de la llavor cap rol hi mana.
 */
export const perfilDeLaPersonaPilot = () => perfilDelCataleg(AGENTS_MAP.JAVI);

/**
 * Revisió adversarial del Gauntlet 261016 (encàrrec C) · La fitxa del paquet
 * d'una de les tres identitats del Mestre per la clau que es demana, o null.
 * La clau es reconeix per un identificador que declara la llavor
 * (identitatsSeed.js · fundacionalDeLaClau: id, àlies, slug declarat o id
 * remot declarat), mai pel nom ni pel slug que torne el servidor. Les dades són
 * les que el paquet ja publica: la persona pilot, la del catàleg; una entitat,
 * la del padró (ENTITATS_SEED), amb la forma del DTO de localPerfils.js. Sense
 * propietari, sense correu i sense dates (T51: cap data inventada).
 */
export function perfilFundacionalDelPaquet(clau) {
  const fundacional = fundacionalDeLaClau(clau);
  if (!fundacional) return null;
  if (fundacional === PERSONA_PILOT.slug) return perfilDeLaPersonaPilot();
  const entitat = entitatSeed(fundacional);
  if (!entitat) return null;
  return {
    tipus: entitat.kind === 'group' ? 'grup' : 'entitat', id: entitat.id, slug: entitat.slug, nom: entitat.name,
    avatar: entitat.logo_url || '', hero: entitat.hero_url || '', lema: entitat.lema || '', bio: entitat.description || '',
    presentacioHtml: entitat.presentacio_html || '', poble: entitat.town_name || '', esIA: false,
    publicat: entitat.visibility === 'public', propietari: false, copyright: entitat.copyright || '', correu: '', emoticona: ''
  };
}

/**
 * Gauntlet 261022_0225 (Tasca 1: «Erradicació del Spinner Infinit») · La
 * reserva local d'una clau, la que la càrrega ja posa quan el servidor no dona
 * res: la IA del paquet (D12) o una de les tres identitats del Mestre (els
 * àlies de la persona pilot inclosos), o null. És el que es pinta si el host i
 * la xarxa no han respost en TERMINI_DEL_PERFIL_MS.
 */
export function perfilDeReservaLocal(clau) {
  return perfilDeLaIADelPaquet(agentIASeed(clau)) || perfilFundacionalDelPaquet(clau);
}

/* Gauntlet 261022_0225 (Tasca 1) · El termini estricte de la càrrega, l'espera
   del host inclosa: passat, la càrrega s'avorta (cap petició tardana) i es
   pinta la reserva local o l'avís amb «Torna-ho a provar». */
export const TERMINI_DEL_PERFIL_MS = 3000;
/* Revisió del Gauntlet 261022_0225 (REV-PERF-2) · «Torna-ho a provar» de la
   mateixa clau té el temps d'una petició (els 12 s de runtime.js): amb els
   3 s de la primera, en una línia lenta fallaria sempre igual. Una clau nova
   torna a tindre els 3 s. */
export const TERMINI_DEL_REINTENT_MS = 12000;

let hostPromise;
function hostReady({ signal } = {}) {
  hostPromise ||= import('../../host.js').catch((error) => { hostPromise = null; throw error; });
  return hostPromise.then((host) => host.quanLlest({ signal }));
}

/* Valor per defecte estable: un `[]` nou a cada render entraria als deps de
   l'efecte de càrrega i el faria girar sense parar (troballa de la refutació). */
const AGENTS_BUITS = Object.freeze([]);

/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «socdepoble.org/javillinares»)
   · La URL canònica d'una de les tres identitats del Mestre: la seua ruta neta
   (rutaCanonicaDePerfil) a l'origen canònic del build, el mateix que fa servir
   useSEO.js (VITE_CANONICAL_URL o, si no, el de la pàgina). És l'adreça que el
   Mestre nomena, a l'arrel del domini: no depén d'on estiga muntada l'app.
   Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · L'origen ve
   d'origenPublic.js: dins de l'app nativa, socdepoble.org. */
function urlCanonica(ruta) {
  return `${origenPublic()}${ruta}`;
}

/**
 * `id` (Gauntlet 261016, Bloc 3.5.1): l'identificador fix d'una ruta canònica
 * (/javillinares, /socdepoble, /rentonar; App.jsx), que no porta cap
 * paràmetre. Sense, el de la ruta (/gent/:agentId i les germanes).
 */
export default function PerfilPublicSection({ agents = AGENTS_BUITS, id = null }) {
  const { agentId: idDeLaRuta } = useParams();
  const agentId = id ?? idDeLaRuta;
  const { t } = useUIActions();
  const { externalConfig } = useUIState();
  const navigate = useNavigate();
  const [estat, setEstat] = useState({ id: null, status: 'loading', perfil: null });
  /* Gauntlet 261022_0225 (Tasca 1) · «Torna-ho a provar» de l'avís: cada clic
     torna a llançar la càrrega (REV-PERF-2: amb la clau, per al seu termini). */
  const [intent, setIntent] = useState({ clau: null, n: 0 });
  /* Auditoria de seguretat 261019 (F6) · La fitxa del projecte oberta per id
     (/empresa/<uuid>) ja no es registra sola (vegeu la càrrega, davall): la
     reconeix la resolució de l'app, pel slug i dins del poble actiu, i esta
     subscripció la torna a pintar quan l'id arriba, com la boina del Mur
     (TargetaDelMur) i el lector del MAS (PublicacioDetall). */
  useEntitatDelProjecte();

  /* Gauntlet 261022_0225 (T9-1) · App.jsx passa un `agents` nou cada vegada
     que el contingut base canvia d'estat, i la fitxa es tornava a carregar
     sencera (una segona consulta i «Carregant el perfil…» enmig). El catàleg
     només el llig un node sense la capacitat de directori i fora del remot:
     només llavors entra als deps de la càrrega. */
  const agentsDelCataleg = !teCapacitat('directori') && normalizeBackendConfig(externalConfig).dataMode !== 'remote'
    ? agents
    : AGENTS_BUITS;

  useEffect(() => {
    let viu = true;
    const clau = String(agentId || '');
    /* Gauntlet 261022_0225 (Tasca 1) · La càrrega es pot cancel·lar: en
       desmuntar o en canviar de clau, l'espera del host i la consulta
       s'avorten, i el termini es lleva. */
    const controlador = new AbortController();
    /* T9-1 · La mateixa clau ja pintada es revalida sense buidar la pantalla. */
    setEstat((previ) => (previ.id === clau && previ.status === 'ready' ? previ : { id: clau, status: 'loading', perfil: null }));
    /* Gauntlet 261022_0225 (Tasca 1) · Si en TERMINI_DEL_PERFIL_MS el host i
       la consulta no han acabat, la càrrega s'avorta (un host que ignore el
       senyal ja no encetarà cap consulta) i es pinta la reserva local o
       l'avís amb «Torna-ho a provar». Mai «Carregant el perfil…» per sempre. */
    let vencut = false;
    const reintent = intent.clau === clau;
    const terminiMs = reintent ? TERMINI_DEL_REINTENT_MS : TERMINI_DEL_PERFIL_MS;
    const termini = setTimeout(() => {
      if (!viu) return;
      vencut = true;
      controlador.abort();
      const reserva = perfilDeReservaLocal(clau);
      if (reserva && clau === ENTITAT_PILOT_SLUG) registraEntitatDelProjecte(reserva);
      setEstat((previ) => {
        if (previ.id === clau && previ.status === 'ready') return previ;
        return reserva ? { id: clau, status: 'ready', perfil: reserva } : { id: clau, status: 'senseResposta', perfil: null };
      });
    }, terminiMs);
    (async () => {
      let perfil = null;
      let fallada = false;
      /* Gauntlet 261022_0225 (T9-1) · Primer el host i després la capacitat: al
         primer pintat el port encara pot no estar segellat, i abans era la
         segona càrrega (la de l'`agents` nou) la que arribava a preguntar. */
      try {
        await hostReady({ signal: controlador.signal });
        if (!viu || vencut) return;
        if (teCapacitat('directori')) {
          /* REV-PERF-2 · La primera, el pressupost de l'adaptador (els mateixos 3 s). */
          perfil = await loadPerfilPublic(clau, { ...(externalConfig || {}), signal: controlador.signal, ...(reintent ? { terminiMs } : {}) });
        }
      } catch (error) {
        if (!viu || vencut) return;
        if (error?.name !== 'AbortError') console.warn('[PerfilPublic] No s’ha pogut llegir el perfil:', error?.message);
        fallada = true;
      }
      if (!viu || vencut) return;
      // Una resposta buida del servidor és autoritativa (fora de la IA del
      // paquet, D12, i de les tres identitats del Mestre, més avall). El
      // catàleg només suplix un node demostratiu que no implementa el port de
      // directori.
      if (!teCapacitat('directori') && normalizeBackendConfig(externalConfig).dataMode !== 'remote') {
        perfil = perfilDelCataleg(agentsDelCataleg.find((agent) => String(agent.id) === clau));
      }
      /* Onada 11 (261010; prompt 261010_1730, tasca 6, D12) · Una IA del
         paquet (AGENTS_IA_SEED: hui, la IAIA MarIA) no viu a cap taula: en
         remot el servidor no la coneix (supabase/perfils.js) i loadPerfilPublic
         torna null, mentre que el Xat ja la pinta del paquet
         (data/xatsPerDefecte.js, FakeChatOnboarding.jsx) i la seua fila porta
         ací. La pàgina cau al paquet per a ella, també en remot, pel seu id o
         pel seu slug declarat (agentIASeed). Per a una persona o una entitat,
         la resposta buida del servidor continua manant: cap identitat del
         paquet suplix una d'inexistent al servidor (fora de les tres del
         Mestre, davall). Amb la capacitat de directori en llavor i en local el
         port ja la torna, i ací no es passa. */
      if (!perfil) perfil = perfilDeLaIADelPaquet(agentIASeed(clau));
      /* Revisió adversarial del Gauntlet 261016 (encàrrec C; pla aprovat,
         Onada 1 punt 5, «Paritat total entre local i producció»; prompt, Bloc
         3.5.1, les rutes canòniques dels beta-testers) · EXCEPCIÓ A D12,
         revocable per Direcció Tècnica: en remot el servidor no resol cap
         persona per àlies (supabase/perfils.js només en busca per UUID, i
         perfil_public exigix sessió), i /javillinares, /gent/0001 i
         /gent/javi-llinares donaven «Perfil no trobat», amb sessió i sense.
         Per a les tres identitats que controla el Mestre (Javi Llinares, Sóc
         de Poble i Rentonar), i NOMÉS per a elles, la fitxa cau al paquet
         (perfilFundacionalDelPaquet) quan el servidor no la dona: la clau
         demanada s'hi reconeix per un identificador declarat a la llavor,
         mai pel nom ni per un slug que qualsevol organització podria
         registrar. Si el servidor dona la fitxa, mana el servidor. Una clau de
         la persona només la pot resoldre una PERSONA: una organització que
         haja pres el slug «javillinares» (o '0001', 'javi'…) no es queda la
         fitxa del Mestre. Per a tota altra persona o entitat, D12 es manté. */
      const delPaquet = perfilFundacionalDelPaquet(clau);
      if (delPaquet && (!perfil || (delPaquet.tipus === 'persona' && perfil.tipus !== 'persona'))) perfil = delPaquet;
      clearTimeout(termini);
      /* Gauntlet 261022_0225 (Tasca 1) · Una fallada (el host que no
         arrenca, la consulta que es talla) no és «Perfil no trobat»: sense
         reserva, l'avís amb «Torna-ho a provar». Una fitxa ja pintada de la
         mateixa clau es queda. */
      if (!perfil && fallada) {
        setEstat((previ) => (previ.id === clau && previ.status === 'ready' ? previ : { id: clau, status: 'senseResposta', perfil: null }));
        return;
      }
      /* Revisió dels verificadors (front «logo», 261004) · En remot, l'id de
         l'entitat del projecte és el del servidor (un UUID) i només el
         registrava la resolució de l'app (useEntitatDelProjecte). Si esta
         fitxa arribava abans, o si eixa resolució havia fallat i esperava,
         rutaDAutoria no la reconeixia i el bloc del títol pintava l'avatar
         quadrat en lloc del logotip rectangular. La fitxa registra ella
         mateixa el perfil que ha llegit, abans de pintar-lo: és
         idempotent i reconeix el projecte pel slug declarat, mai pel nom. Un
         perfil del catàleg no porta slug i no hi fa res.
         Auditoria de seguretat 261019 (F6) · Només quan la fitxa s'ha demanat
         pel slug declarat: eixa cerca, l'adaptador la limita al poble actiu
         (supabase/perfils.js), com la resolució de l'app
         (resolEntitatDelProjecte). Una fitxa demanada per id travessa pobles,
         i el slug només és únic dins d'un poble: una empresa d'un altre poble
         amb el slug «socdepoble», oberta per /empresa/<uuid>, es registrava
         com el projecte i se'n duia la marca i la identitat oficial. Per id,
         el projecte el registra la resolució de l'app. */
      if (clau === ENTITAT_PILOT_SLUG) registraEntitatDelProjecte(perfil);
      setEstat({ id: clau, status: 'ready', perfil });
    })();
    return () => {
      viu = false;
      clearTimeout(termini);
      controlador.abort();
    };
  }, [agentId, agentsDelCataleg, externalConfig, intent]);

  const perfil = estat.status === 'ready' ? estat.perfil : null;
  const carregant = estat.status === 'loading';
  const senseResposta = estat.status === 'senseResposta';

  /* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre) · La fitxa d'una de les
     tres identitats del Mestre declara la seua URL canònica neta, s'obriga
     per la ruta canònica o per una d'abans (/gent/0001, /empresa/socdepoble,
     /grup/rentonar…): un sol perfil, una sola adreça per al SEO. La resta de
     fitxes, la URL de sempre (useSEO, sense `canonical`).
     Gauntlet 261016_1530 (Bloc 3.6.3) · La fitxa de la IAIA MarIA (pel seu
     id, mai pel nom) declara /iaia, s'obriga per /iaia, /perfil/<id> o
     /perfil/iaia-maria (rutaCanonicaDePerfil). */
  const rutaCanonica = rutaCanonicaDePerfil(perfil);

  /* Gauntlet 261022_0225 (T9-4) · Mentre carrega, el títol del document diu
     que carrega, no «Perfil no trobat», i no s'indexa; el de l'avís, l'avís. */
  const titolSenseFitxa = carregant
    ? t('section.perfil.public.carregant', 'Carregant el perfil…')
    : senseResposta
      ? t('section.perfil.public.senseResposta', 'No s’ha pogut carregar el perfil')
      : t('section.perfil.public.noTrobat', 'Perfil no trobat');
  useSEO({
    title: perfil ? perfil.nom : titolSenseFitxa,
    description: perfil ? (perfil.lema || perfil.bio || '') : '',
    /* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · La imatge SEO
       és la portada (sdp-universal-page §1.B); sense portada, l'avatar. */
    image: perfil?.hero || perfil?.avatar || null,
    type: perfil?.tipus === 'persona' ? 'Person' : 'Organization',
    index: Boolean(perfil?.publicat),
    ...(rutaCanonica ? { canonical: urlCanonica(rutaCanonica) } : {})
  });

  /* T63.2 · Mentre carrega o si no el troba, encara no sabem qui és (el prefix
     de la ruta és orientatiu i l'id pot ser un slug): cap xat, ni el comú de la
     ruta. Comentar es queda i el clic avisa (objecte={null}, useAccions). */
  if (carregant) {
    return (
      <UniversalPage chrome="system" showLogos={true} title={t('section.perfil.public.carregant', 'Carregant el perfil…')} objecte={null}>
        <p className="sdp-buit" role="status" aria-live="polite">{t('section.perfil.public.carregant', 'Carregant el perfil…')}</p>
      </UniversalPage>
    );
  }

  /* Gauntlet 261022_0225 (Tasca 1) · El servidor no ha respost a temps (o ha
     fallat) i la clau no té reserva local: un avís clar, «Torna-ho a provar»
     i el camí de sempre cap al directori. La navegació no queda bloquejada. */
  if (senseResposta) {
    return (
      <UniversalPage
        chrome="system"
        showLogos={true}
        title={titolSenseFitxa}
        lead={t('section.perfil.public.senseRespostaText', 'El servidor del poble no respon ara mateix. Pots tornar-ho a provar o continuar navegant.')}
        objecte={null}
      >
        {/* Revisió del Gauntlet 261022_0225 (REV-PERF-9) · El «Carregant…» era
            una regió viva i desapareix: un lector de pantalla també sap que
            la càrrega ha fallat. Cap canvi visual. */}
        <p className="sdp-nomes-lector" role="alert">{titolSenseFitxa}</p>
        <div className="sdp-alerta__accions">
          <Boto varietat="primari" onClick={() => setIntent((previ) => ({ clau: String(agentId || ''), n: previ.n + 1 }))}>{t('common.reintenta', 'Torna-ho a provar')}</Boto>
          <Boto varietat="secundari" onClick={() => navigate('/perfil')}>{t('section.perfil.public.directori', 'Torna al directori')}</Boto>
        </div>
      </UniversalPage>
    );
  }

  if (!perfil) {
    /* Poliment T45 · En remot la fitxa d'una altra persona encara no es pot
       llegir (falta la RPC perfil_public, supabase/perfils.js): dir només
       «és privada» seria fals per a qui la té pública. */
    const remot = normalizeBackendConfig(externalConfig).dataMode === 'remote';
    return (
      <UniversalPage
        chrome="system"
        showLogos={true}
        title={t('section.perfil.public.noTrobat', 'Perfil no trobat')}
        lead={remot
          ? t('section.perfil.public.noTrobatTextRemot', 'Ningú del poble té este identificador, o la seua fitxa és privada. Les fitxes d’altres persones encara no es poden obrir en este servidor.')
          : t('section.perfil.public.noTrobatText', 'Ningú del poble té este identificador, o la seua fitxa és privada.')}
        labels={[{ text: 'Error', className: 'sdp-badge-system' }]}
        objecte={null}
      >
        <div className="sdp-alerta__accions">
          <Boto varietat="secundari" onClick={() => navigate('/perfil')}>{t('section.perfil.public.directori', 'Torna al directori')}</Boto>
        </div>
      </UniversalPage>
    );
  }

  return <FitxaPublica perfil={perfil} />;
}

/**
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 7: «Perfil ciutadà:
 * reutilitza el mateix component atòmic») · «La pàgina» d'un agent IA al
 * Perfil (perfilModel.js, vista 'pagina'): la seua FitxaPublica, amb el DTO
 * del padró (perfilDeLaIADelPaquet) des de la fila de l'agent. Qui la veu ací
 * l'administra: és la seua fitxa («La teua fitxa», sense «Més opcions») i
 * «Edita la fitxa» no cal, «La fitxa» és l'apartat del costat. PerfilShell la
 * carrega a demanda (lazy): el Perfil no arrossega la fitxa pública si no
 * s'obri.
 */
export function PaginaDeLAgent({ identitat }) {
  const agent = identitat?.dades;
  if (!agent) return null;
  return <FitxaPublica perfil={{ ...perfilDeLaIADelPaquet(agent), propietari: true }} ambEdita={false} chrome="context" />;
}

/**
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 7: «Pàgina Única
 * Atòmica») · La fitxa pública ja carregada: la pinta /iaia (i qualsevol
 * fitxa de /gent, /empresa, /perfil…) i també el Perfil (/el-meu-perfil,
 * apartat «La pàgina» d'un agent IA), el mateix component i no una còpia. La
 * càrrega, l'error i el SEO són de la ruta (PerfilPublicSection): el Perfil no
 * canvia el títol del document.
 *   · Per a la IAIA MarIA, al peu de la presentació, el Selector de Realitat
 *     (sections/realitat/SelectorRealitat.jsx): qui la coneix tria, en el
 *     mateix lloc, quanta IA l'acompanya. /realitat redirigix ací.
 *   · `ambEdita` false lleva «Edita la fitxa»: al Perfil, «La fitxa» és
 *     l'apartat del costat.
 *   · `chrome` és el de la UniversalPage: 'full' a la ruta, 'context' dins
 *     del Workspace del Perfil (com «Les vistes»).
 */
export function FitxaPublica({ perfil, ambEdita = true, chrome = 'full' }) {
  const { t } = useUIActions();
  /* T6b · `locale`: la data de «Gent que et seguix», en la llengua de la fitxa. */
  const { externalConfig, locale } = useUIState();
  const navigate = useNavigate();
  const { memberships = [], actor, setActor } = useIdentitat();
  /* Onada 11 (261010; refutació del front C, D12) · En remot, el directe
     /xat?amb=<id> amb la IAIA no s'obri: el servidor no coneix el seu UUID
     (crea_fil_directe falla i el Xat avisa) i, sense sessió, el fil de mostra
     que obri és el de Sóc de Poble, no el seu. El botó va on va la seua fila
     (rutaDelXatDeLaIAIA). `senseSessio` és el de useXat() (fora del
     proveïdor, el BUIT: false); el mode de dades es llig de la configuració,
     com a la càrrega de la ruta, i no de useXat(), que fora del proveïdor diu
     'remote' també en llavor. */
  const { senseSessio } = useXat();
  const modeDades = normalizeBackendConfig(externalConfig).dataMode;

  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · La pàgina
     d'una entitat porta dalt el seu logotip. L'entitat del projecte es
     reconeix per l'identificador (rutaDAutoria torna la seua ruta,
     esRutaDelProjecte; des de l'Onada 8, el seu perfil; l'id remot
     el registra la resolució de l'app, pel slug i dins del poble actiu, i la
     càrrega d'esta fitxa quan es demana pel slug: auditoria de seguretat
     261019, F6), mai pel nom: el seu logotip
     rectangular, clar i fosc. Una altra entitat, el seu logo_url (l'avatar
     del perfil) resolt ací, que pot ser un sdp-media://: una sola imatge per
     als dos temes. Un grup no en porta (com abans).
     Correcció final (ordre del Mestre, 261004) · Només un sdp-media:// passa
     pel port (useResolvedAsset); un camí o una URL es resolen en el mateix
     render (resolveAsset). Abans tot passava pel hook, que torna '' en el
     primer render: el logotip entrava un commit més tard i la fitxa saltava
     fins a 600px. FitxaPublica no té eixides primerenques: el hook es crida
     sempre. */
  const esEntitat = perfil?.tipus === 'entitat';
  const esElProjecte = esEntitat && esRutaDelProjecte(rutaDAutoria({ tipus: perfil.tipus, id: perfil.id }));
  const logoCru = esEntitat && !esElProjecte && typeof perfil.avatar === 'string' ? perfil.avatar.trim() : '';
  const logoDelPort = useResolvedAsset(logoCru.startsWith('sdp-media://') ? logoCru : '');
  const logoPropi = logoCru.startsWith('sdp-media://') ? logoDelPort : (logoCru ? resolveAsset(logoCru) : '');
  /* Ordre del Mestre (261022): les persones ja porten avatar a la barra
     taronja. Només els altres agents IA el conserven davant de l'H1. */
  const esAgentIA = perfil?.tipus === 'ia';

  /* Gauntlet 261016 (Bloc 3; regressió de la Fase 1, T1 «Dignitat de persona»)
     · Una persona no és una obra ni es categoritza: la seua fitxa pública no
     porta la píndola del tipus ni els drets d'autor (ni el desat ni el «© Nom»
     de reserva), com la seua targeta (UniversalCard) i la seua fitxa editable
     (perfilCamps.js · fitxaDeLectura). Mana el tipus de l'objecte representat,
     el del descriptor (objecteDePerfil), que també fa persona d'un tipus
     desconegut; sense descriptor, el del DTO. Es queden el poble i «La teua
     fitxa». L'entitat, el grup i la IA no canvien. */
  const objecte = objecteDePerfil(perfil);
  const etiquetaDelTipus = ETIQUETA[objecte?.tipus || perfil.tipus] || null;
  const esPersona = !etiquetaDelTipus;
  /* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar
     entitats sense poble») · El poble que porta la fitxa; si no en porta cap
     i és una de les tres identitats del Mestre (clauFundacional: per id o per
     slug declarat, mai pel nom), el seu, La Torre de les Maçanes
     (POBLE_FUNDACIONAL). En llavor i en local les tres ja el porten; en remot
     una fila sense poble no el perd a la pantalla. Cap altra fitxa s'inventa
     cap poble: el poble desat sempre mana.
     Revisió adversarial del Gauntlet 261016 (encàrrec C) · En remot, només
     una fila amb l'id del servidor que declara la llavor
     (IDS_REMOTS_FUNDACIONALS): un homònim d'un altre poble, amb el mateix
     slug, ja no rep La Torre de les Maçanes. */
  const poble = perfil.poble || (clauFundacional(perfil) ? POBLE_FUNDACIONAL : '');
  const etiquetes = [
    ...(etiquetaDelTipus ? [{ text: etiquetaDelTipus, className: perfil.esIA ? 'sdp-badge-accent' : 'sdp-badge-system' }] : []),
    ...(poble ? [{ text: poble, className: 'sdp-badge-category' }] : []),
    ...(perfil.propietari ? [{ text: t('section.perfil.public.teua', 'La teua fitxa'), className: 'sdp-badge-tag' }] : [])
  ];

  /* T43 · La pertinença de qui mira (per id o per slug). En remot, el
     directori no diu `propietari` per a una organització: la pertinença sí. */
  const esOrganitzacio = perfil.tipus === 'entitat' || perfil.tipus === 'grup';
  const membership = esOrganitzacio
    ? memberships.find((m) => String(m.id) === String(perfil.id) || (perfil.slug && m.slug === perfil.slug)) || null
    : null;
  const administra = Boolean(membership) && esRolQueMana(membership.role);
  const actuaComEsta = administra && actor?.tipus === 'entitat' && String(actor.id) === String(membership.id);
  /* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · «Edita la fitxa»
     d'una IA obri el Perfil a la seua fitxa (l'agent del grup AGENTS IA,
     seleccioInicialDePerfil), no a la de la persona. */
  const rutaEdita = administra
    ? rutaFitxaOrganitzacio(membership.id)
    : (perfil.esIA ? rutaFitxaOrganitzacio(perfil.id) : '/el-meu-perfil');
  const correuPublic = esOrganitzacio ? String(perfil.correu || '').trim() : '';
  const mailto = correuPublic ? enllacMailto(correuPublic) : null;
  /* Gauntlet 261016 (Bloc 3) · L'avís i el botó d'una IA porten el seu nom:
     abans deien «La IAIA MarIA» i «Parla amb la IAIA» per a qualsevol IA (un
     personatge del catàleg, com El Gall o Nano Banana). Per a la IAIA, pel seu
     id o pel seu slug declarat (agentIASeed), mai pel nom, els textos de
     sempre. Només ella respon amb frases fetes (la seua resposta fixa,
     localXat.js · RESPOSTA_IAIA): l'avís d'una altra IA no ho promet.
     Ordre del Mestre (261021, pla §8.1) · I ha de ser una IA: ara també decidix
     el logotip oficial, i una persona o una entitat que prenguera el slug
     «iaia-maria» no se l'ha de quedar (com navigation.js · esLaFitxaDeLaIAIA). */
  const esLaIAIA = Boolean(perfil.esIA) && (esIAIA(perfil.id) || esIAIA(agentIASeed(perfil.slug)?.id));
  /* Ordre del Mestre (261021, pla 261021_0015 §8.1: «Capçalera canònica del
     Mas») · A /iaia, la cara de la IAIA no es repetix davall de la barra
     taronja com a cercle de 300px: ja hi viu, a la mateixa barra. Damunt de
     l'H1 porta el logotip oficial rectangular de Sóc de Poble
     (DEFAULT_AUTHOR.logo), com totes les pàgines del Mas. La resta de fitxes
     (els altres agents del catàleg) seguixen amb el seu avatar redó
     (sdp-pedra-seca §11), i el d'una IA no és cap botó («clics honestos»). */
  const logoDeLaFitxa = (esElProjecte || esLaIAIA)
    ? DEFAULT_AUTHOR.logo
    : (logoPropi ? { clar: logoPropi, alt: `Logotip de ${perfil.nom}` } : null);
  const avatarDeLaFitxa = esAgentIA && !esLaIAIA && perfil.avatar ? {
    src: perfil.avatar,
    alt: `Avatar de ${perfil.nom}`
  } : null;
  /* El directe de sempre per a tothom; per a la IAIA, la conversa de la seua
     fila en cada mode de dades (en llavor i en local, el mateix directe).
     Gauntlet 261022_0225 (P4b-3) · La fitxa del paquet de la persona pilot
     (id d'un àlies seu: '0001', mai un UUID del servidor) va on va la seua fila
     del Xat: en llavor i en local, el directe del padró (rutaDelXatDeJavi); en
     remot sense sessió, el seu xat de només lectura. En remot amb sessió el
     servidor no en coneix el compte (crea_fil_directe rebutja '0001') i el
     botó no es pinta: cap clic que acabe en error. */
  const esLaPilotDelPaquet = perfil.tipus === 'persona' && esLaPersonaDeContacte(perfil);
  const rutaDelXat = esIAIA(perfil.id)
    ? rutaDelXatDeLaIAIA(modeDades, senseSessio)
    : esLaPilotDelPaquet
      ? (senseSessio ? `/xat/${ID_FIL_DE_MOSTRA_DE_JAVI}` : rutaDelXatDeJavi(modeDades))
      : `/xat?amb=${encodeURIComponent(perfil.id)}`;
  const avisDIA = esLaIAIA
    ? t('section.perfil.public.iaText', 'La IAIA MarIA és una màquina de Sóc de Poble, en proves. Respon amb frases fetes i no substituïx cap persona del poble.')
    : `${perfil.nom} és una màquina de Sóc de Poble, en proves. No substituïx cap persona del poble.`;
  const parlaAmbLaIA = esLaIAIA ? t('section.perfil.public.parlaIA', 'Parla amb la IAIA') : `Parla amb ${perfil.nom}`;
  /* Revisió del Gauntlet 261022_0225 (REV-PERF-7) · Sense cap botó (la fitxa
     del paquet de la persona pilot en remot amb sessió, P4b-3), la fila no es
     pinta: el seu marge deixava un forat davall de l'entradilla. */
  const ambAccions = Boolean(rutaDelXat) || (ambEdita && (perfil.propietari || administra)) || (administra && !actuaComEsta);

  return (
    <UniversalPage
      chrome={chrome}
      layout="contained"
      title={perfil.nom}
      subtitle={perfil.bio || undefined}
      lead={perfil.lema || undefined}
      heroImage={perfil.hero || undefined}
      heroAlt={perfil.hero ? perfil.nom : ''}
      /* Derogat el showLogos={false} (ordre del Mestre, 261004): una entitat
         porta el seu logotip; una persona o la IA, el seu avatar redó. */
      logoEntitat={logoDeLaFitxa}
      avatarAutor={avatarDeLaFitxa}
      labels={etiquetes}
      copyright={esPersona ? undefined : (perfil.copyright || `© ${perfil.nom}`)}
      /* T51 · la data real de la fitxa: `creat` i `modificat` del PerfilPublic
         (created_at i updated_at de la fila, que supabase/perfils.js i
         localPerfils.js ja passen). Sense ells no hi ha pastilla: mai la d'ara. */
      {...dataHoraDeBarra({ creat: perfil.creat, modificat: perfil.modificat })}
      /* T66 · L'espai central de la barra taronja, en lectura: l'emoticona
         triada (DTO PerfilPublic.emoticona) o la cel·la buida. Mai la ploma.
         Onada 8 (261009) · «Un clic a QUALSEVOL boina taronja porta SEMPRE al
         perfil públic»: la boina de la fitxa porta a la fitxa mateixa, per la
         seua ruta canònica (rutaDAutoria: el pilot, a /empresa/socdepoble).
         Abans no era cap enllaç.
         Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua
         com a Sóc de Poble, la barra taronja ha de carregar automàticament
         l'autoria oficial», el PNG verd, «evitant en qualsevol cas la silueta
         negra») · La fitxa del pilot (esElProjecte, el mateix que hi fixa el
         logotip de damunt de l'H1) porta el PNG verd oficial, com l'editor,
         «Les vistes» i «El compte» (avatarDeLaBarraDeFitxa, fitxaDePerfil.js).
         El nom, el poble i l'enllaç no canvien. */
      topBarData={{
        authorName: perfil.nom,
        authorAvatar: esElProjecte ? DEFAULT_AUTHOR.avatarUrl : (perfil.avatar || ''),
        authorLocation: poble, emoticona: perfil.emoticona || '',
        authorHref: rutaDAutoria({ tipus: perfil.tipus, id: perfil.id })
      }}
      onConnect={rutaConnectarPerfil(perfil) ? () => navigate(rutaConnectarPerfil(perfil)) : false}
      /* Fase D (261020, tasca 2; crítica 261020, 6) · Des de 2610181800 els
         perfils són públics per defecte: nom, avatar i presentació són
         contingut de la gent, i Google Play demana poder-los denunciar i
         bloquejar. «Més opcions» a la barra taronja, mai a la fitxa pròpia
         (ni a la del pilot, la IAIA o una entitat que representes:
         objectiuDeTargeta). */
      ambModeracio={!perfil.propietari}
      /* T63.2 (doctrina del Mestre, 260928) · Comentar d'una persona o d'una IA
         és el missatge directe de sempre (/xat?amb=); d'una entitat o d'un
         grup, el xat comú de la seua pàgina (la Comunitat). «Escriu-li al xat»
         continua sent el directe per a tothom (llevat de la fitxa del paquet
         de la persona pilot, P4b-3). */
      objecte={objecte}
    >
      {/* Ordre del Mestre (261021) · Botó centrat amb respiració sota el lema, seguit de l'avís */}
      {ambAccions ? (
        <div className="sdp-alerta__accions sdp-alerta__accions--centrades">
          {rutaDelXat ? (
            <Boto varietat="primari" icona={perfil.esIA ? Bot : MessageCircle} onClick={() => navigate(rutaDelXat)}>
              {perfil.esIA ? parlaAmbLaIA : t('section.perfil.public.escriu', 'Escriu-li al xat')}
            </Boto>
          ) : null}
          {ambEdita && (perfil.propietari || administra) ? (
            <Boto varietat="secundari" icona={PencilLine} onClick={() => navigate(rutaEdita)}>
              {t('section.perfil.public.edita', 'Edita la fitxa')}
            </Boto>
          ) : null}
          {administra && !actuaComEsta ? (
            <Boto varietat="secundari" icona={UserCheck} onClick={() => setActor?.('entitat', membership.id)}>
              {`Actua com a ${perfil.nom}`}
            </Boto>
          ) : null}
        </div>
      ) : null}
      {perfil.esIA ? (
        <Alerta to="avis" titol={t('section.perfil.public.iaTitol', 'Este perfil és una intel·ligència artificial')}>
          {avisDIA}
        </Alerta>
      ) : null}
      {actuaComEsta ? <p role="status">{`Ara actues com a ${perfil.nom}.`}</p> : null}
      {mailto ? (
        <p>
          {'Correu: '}
          <a href={mailto}>{correuPublic}</a>
        </p>
      ) : null}
      {/* Ordre del Mestre (261007, «cards de veritat») · Les targetes
          incrustades de la presentació, sincronitzades amb el seu original. */}
      {perfil.presentacioHtml ? (
        <ProveidorSincronitzacioTargetes>
          {renderRichText(esLaIAIA ? presentacioAmbLaTargetaDeLAnima(perfil.presentacioHtml) : perfil.presentacioHtml)}
        </ProveidorSincronitzacioTargetes>
      ) : null}
      {/* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · Al peu de la
          presentació de la IAIA, el Selector de Realitat dels 4 nivells: fora
          de l'article de la presentació i sense cap regió viva. */}
      {esLaIAIA ? <SelectorRealitat /> : null}
      {/* T6b (IDEA-14; decisió del Mestre, 261024) · Qui és seguit ho sap: a
          la fitxa pròpia d'una persona, qui la seguix (quiEmSegueix), al peu.
          Mai a la d'una altra persona, ni a la d'una entitat, un grup o una IA
          (qui seguix una entitat ho veu qui l'administra, a «El compte»).
          Sense la capacitat 'seguiments', res. */}
      {esPersona && perfil.propietari ? <GentQueEtSegueix config={externalConfig} t={t} locale={locale} /> : null}
    </UniversalPage>
  );
}
