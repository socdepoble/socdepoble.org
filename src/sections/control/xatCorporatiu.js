/**
 * xatCorporatiu.js — W4-09 (auditoria de Codex 261003_1950, «la boina
 * corporativa usa l'id de llavor en remot») · El xat corporatiu de «Sóc de
 * Poble», el missatge directe de l'entitat (/xat?amb=<id>, com «Escriu-li al
 * xat» de la seua fitxa).
 *
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · Derogat per l'ordre
 * del Mestre del 261004 (prompt 261004_0515): este xat ja no és l'enllaç de
 * la boina, que porta SEMPRE a la pàgina de l'autor (destinsControl.
 * AUTORIA_SOCDEPOBLE; Onada 8, 261009: el perfil de l'entitat,
 * /empresa/socdepoble, ja no /projecte). Era on portava Comentar del peu de les
 * targetes del Panell: la skill sdp-universal-page diu que Comentar és el
 * missatge directe a l'autor. Mentre no hi ha xat on portar, Comentar ho diu
 * (avisDelXatCorporatiu) i el Panell conserva l'Alerta. Des de l'ordre del
 * 261007 (més avall), és la via «En privat» del menú de Comentar.
 *
 *  · LLAVOR ('seed' o 'local'): l'id del padró ('socdepoble',
 *    XAT_SOCDEPOBLE_DE_LLAVOR), que resol el xat local. Cap crida.
 *  · REMOT: l'id del padró no és l'id de cap entitat del servidor (allí és
 *    el del proveïdor, un UUID a Supabase). L'entitat es resol ABANS de fer
 *    l'enllaç, pel port del backend (loadPerfilPublic, capacitat
 *    'directori'), amb el slug declarat del pilot (ENTITAT_PILOT_SLUG,
 *    identitatsSeed.js). Ordre del Mestre (261007) · Eixe slug és
 *    'socdepoble', el mateix text que l'id del padró: al port es demana el
 *    slug, i l'enllaç porta l'id que torna el port, siga quin siga el seu
 *    format; no el construïx amb l'id de la llavor.
 *    W4-10 (auditoria de Codex) · El format és cosa del proveïdor: ací només
 *    es comprova que el port ha resolt una entitat amb un id que cap en una
 *    consulta d'URL (esIdDeConsulta) i que l'enllaç, codificat, és una ruta
 *    que la targeta seguix (esRutaInterna). Que crea_fil_directe de Supabase vol un
 *    UUID ho comprova el seu adaptador (data/supabase/xat.js), que rebutja la
 *    resta amb un error clar abans de cap crida. Sense la capacitat, sense
 *    entitat o amb error: cap enllaç i el Panell ho diu. Mentre es resol,
 *    tampoc (T6: Comentar ho diu amb l'avís de `resolent`).
 *  · Canvi de backend (backendScope: proveïdor, endpoint, tenant i mode): es
 *    torna a resoldre i la resposta vella es descarta (la resolució porta
 *    l'abast per al qual es va demanar).
 *  · Fora de l'app (sense UIProvider: l'espècimen del catàleg muntat sol) no
 *    hi ha backend: el xat de la llavor, com en mode seed.
 *
 * Model B: cap import de Supabase, només el port. El slug de l'entitat de
 * suport del desplegament l'ha de confirmar el proveïdor (Sollutia).
 *
 * Ordre del Mestre (261007) · «COMENTARIS = XAT» · Este missatge directe és
 * la via «En privat» del menú de Comentar de TOTES les targetes i de TOTES les
 * barres (useAccions): un xat privat només entre la persona i Sóc de Poble.
 * Es resol UNA sola vegada per a tota l'app, i només quan algú el tria:
 * ProveidorXatSocDePoble, muntat una vegada a App.jsx, ho posa al context de
 * Pedra Seca (PedraSeca/hooks/xatSocDePoble.js), que llig useAccions. I
 * l'arrencada no en fa cap de més: l'entitat pilot ja la resol una vegada
 * AppDataLoader (useEntitatDelProjecte, App.entitatDelProjecte.test.jsx), i
 * este xat no es demana fins al primer «En privat» (o fins que s'obri el
 * Panell, que el demana per a l'Alerta: useXatSocDePobleResolt). Derogat el
 * gestor de llista de la proposta P3 del mateix dia
 * (useComentaAlXatCorporatiu): a les pàgines de text i a les targetes de
 * sistema del Mur i del Calendari saltava la via pública.
 * Correcció C2 · Derogats també useXatCorporatiu (un efecte per instància:
 * el Panell feia la seua pròpia consulta, una segona per a la mateixa
 * entitat) i comentarAlXatCorporatiu (el Comentar propi del Panell, que
 * saltava la via pública). Les targetes del Panell porten el menú de totes,
 * i l'Alerta llig la resolució única del proveïdor.
 * Correcció C10 (revisió R2) · Una sola font per a l'enllaç de la llavor:
 * XAT_SOCDEPOBLE_DE_LLAVOR (xatSocDePoble.js), i XAT_DE_LLAVOR en deriva.
 * destinsControl.XAT_SOCDEPOBLE, la segona font, s'ha retirat.
 */
import { createElement, useCallback, useMemo, useRef, useState } from 'react';
import { useUIState } from '../../app/contexts/UIContext';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
/* El traductor de la interfície, o null fora de l'app (o amb una prova que
   simula UIContext sense esta exportació): aleshores, la reserva en
   valencià. La còpia única de Pedra Seca (revisió del 261007). */
import { useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { ESPERA_DESPRES_DE_FALLADA_MS } from '../../config/navigation.js';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT, aliesDeLActor } from '../../data/identitatsSeed.js';

const MODES_LOCALS = new Set(['seed', 'local']);

/* Onada 8 (261009) · El padró del xat de la llavor: amb qui pot obrir un
   directe «En privat» quan no hi ha servidor. localXat.creaFilDirecte rebutja
   la resta («Esta persona no és del poble»). Són els usuariId de
   XAT_SEED_MEMBRES (data/xatSeed.js): la persona pilot, l'entitat pilot i la
   IAIA. No s'importa xatSeed, que porta les converses de mostra (com
   PERSONES_SEED de localPerfils.js): xatCorporatiu.test.jsx vigila que diguen
   el mateix. */
const ID_PERSONA_PILOT = AGENTS_MAP.JAVI.id;
const PADRO_DEL_XAT_DE_LLAVOR = Object.freeze([ID_PERSONA_PILOT, ENTITAT_PILOT_ID, IAIA_ID]);

/**
 * Onada 8 (261009) · L'id amb què el xat de la llavor obri el directe amb un
 * interlocutor ({ tipus, id }), o null si no el pot obrir: aleshores «En
 * privat» va al xat amb Sóc de Poble, com abans de l'Onada 8, i no a un error.
 * Una persona que signa amb un àlies de la persona pilot (el Mac Mini de
 * 'javillinares': PERSONA_PILOT.alies) és el seu usuariId del padró. En remot
 * no es fa servir: qui decidix és crea_fil_directe.
 */
export function directeDeLlavor(interlocutor) {
  const id = String(interlocutor?.id ?? '');
  const delPadro = interlocutor?.tipus === 'persona' && PERSONA_PILOT.alies.includes(id) ? ID_PERSONA_PILOT : id;
  return PADRO_DEL_XAT_DE_LLAVOR.includes(delPadro) ? delPadro : null;
}
/* El mateix límit que l'id d'un subjecte de xat (contracte.js). */
const MAXIM_ID = 200;
const NO_CAP_EN_CONSULTA = /[\u0000-\u001F\u007F\s]/;

/**
 * Cert si `id` és l'id d'una entitat que pot anar a /xat?amb=: una cadena no
 * buida, de fins a 200 caràcters, sense espais ni caràcters de control (la
 * resta la codifica rutaXatCorporatiu). Cap regla de format de cap proveïdor:
 * «42», «wp:organization:42» i un UUID hi caben igual (W4-10).
 */
const esIdDeConsulta = (id) => typeof id === 'string'
  && id.length > 0 && id.length <= MAXIM_ID && !NO_CAP_EN_CONSULTA.test(id);

/** estat: 'llavor' | 'remot' (enllaç) · 'resolent' | 'absent' | 'error' (sense enllaç).
    C10 · L'enllaç de la llavor és el de XAT_SOCDEPOBLE_DE_LLAVOR, no un de propi. */
export const XAT_DE_LLAVOR = Object.freeze({ estat: 'llavor', href: XAT_SOCDEPOBLE_DE_LLAVOR.href });
const RESOLENT = Object.freeze({ estat: 'resolent', href: null });
const ABSENT = Object.freeze({ estat: 'absent', href: null });

/** El port per defecte: només les dues peces que calen (Model B). */
const PORT = Object.freeze({ teCapacitat, loadPerfilPublic });

/* Com PerfilPublicSection: el backend és a punt quan l'amfitrió ha arrencat.
   Amb un senyal a la configuració (config.signal), qui la crida pot deixar
   d'esperar. */
const hostLlest = ({ signal } = {}) => import('../../host.js').then((host) => host.quanLlest({ signal }));

/** La ruta del xat corporatiu amb l'id que ha tornat el port, codificat. */
export const rutaXatCorporatiu = (id) => `/xat?amb=${encodeURIComponent(id)}`;

/* T6 (261004) · Els avisos quan Comentar no té xat on portar, en parells
   [clau i18n, reserva en valencià]. `noDisponible` és també el text de
   l'Alerta del Panell, el de sempre. */
export const AVISOS_XAT_CORPORATIU = Object.freeze({
  noDisponible: Object.freeze(['section.control.xatCorporatiu.noDisponible', 'Xat de Sóc de Poble: encara no disponible en este servidor.']),
  resolent: Object.freeze(['section.control.xatCorporatiu.resolent', 'Xat de Sóc de Poble: encara s’està buscant en este servidor.'])
});

/**
 * L'avís de «En privat» per a un { estat, href } del xat: null si hi ha xat
 * on portar; mentre es resol, `resolent`; sense entitat o amb error,
 * `noDisponible`.
 */
export function avisDelXatCorporatiu(xat) {
  if (xat?.href) return null;
  return xat?.estat === 'resolent' ? AVISOS_XAT_CORPORATIU.resolent : AVISOS_XAT_CORPORATIU.noDisponible;
}

/**
 * Resol on porta l'autor. Pur respecte de React: el port, l'espera de
 * l'amfitrió i la clau s'injecten (les proves no toquen la xarxa).
 * Rebutja si el port falla; qui la crida decidix què es veu.
 */
export async function resolXatCorporatiu({
  dataMode, config = {}, port = PORT, llest = hostLlest, clau = ENTITAT_PILOT_SLUG
} = {}) {
  if (MODES_LOCALS.has(dataMode)) return XAT_DE_LLAVOR;
  await llest({ signal: config.signal });
  if (!port.teCapacitat('directori')) return ABSENT;
  const perfil = await port.loadPerfilPublic(clau, config);
  if (perfil?.tipus !== 'entitat' || !esIdDeConsulta(perfil.id)) return ABSENT;
  /* Revisió de W4-10 · «remot» només amb una ruta que la targeta seguix
     (esRutaDeLaPorta d'UniversalCard, W4-07: esRutaInterna, 300 caràcters com
     a molt). Un id curt però ple de caràcters codificats (é → %C3%A9) no hi
     cap: cap enllaç i el Panell ho diu, en lloc d'un autor sense enllaç i
     sense avís. */
  const href = rutaXatCorporatiu(perfil.id);
  return esRutaInterna(href) ? Object.freeze({ estat: 'remot', href }) : ABSENT;
}

/* El mode i l'abast del backend; una configuració invàlida (tenant o
   endpoint) no té abast: cap crida. */
function llegixBackend(config) {
  try {
    return { dataMode: normalizeBackendConfig(config || {}).dataMode, abast: backendScope(config || {}) };
  } catch {
    return { dataMode: 'remote', abast: null };
  }
}

/* L'estat de la interfície, o null fora de l'app (sense UIProvider: un
   espècimen del catàleg muntat sol, una prova). La forma `return useUIState()`
   dins d'un try és la que rules-of-hooks accepta (com useUbicacioApp). */
function useEstatDeLApp() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

/* Onada 8 (261009) · Qui mira, o null fora de l'app (sense IdentitatProvider)
   o amb una prova que simula IdentitatContext sense esta exportació: el mock
   llança en llegir-la, i això passa dins del try (el patró de
   useEstatDeLApp). */
function useIdentitatDeLApp() {
  try {
    return useIdentitatOpcional();
  } catch {
    return null;
  }
}

/* Onada 8 (261009) · Els identificadors amb què pot signar qui mira: l'actor
   actiu, la persona i les organitzacions on mana (les `identitats`
   d'IdentitatContext, les mateixes amb què pot publicar), cadascuna amb els
   àlies de la llavor (aliesDeLActor, la regla del MAS). «En privat» sobre una
   publicació d'un d'ells va al xat amb Sóc de Poble: el servidor no obri cap
   xat amb tu mateix ni amb una entitat que representes (SDP-XAT-002). */
function idsDeQuiMira(identitat, dataMode) {
  const ids = new Set();
  const actor = identitat?.actor;
  const identitats = Array.isArray(identitat?.identitats) ? identitat.identitats : [];
  for (const qui of [actor, ...identitats]) {
    if (qui?.id != null) aliesDeLActor(qui, { dataMode }).forEach((id) => ids.add(id));
  }
  return ids;
}

/* En remot, abans que ningú no haja triat «En privat»: encara no s'ha demanat. */
const PENDENT = Object.freeze({ estat: 'pendent', href: null });
/* Els estats en què el clic encara pot portar al xat: es demana (o es torna a
   demanar, després d'un error). Un «absent» que ha tornat el port també
   (revisió del 261007, M4-01): vegeu ProveidorXatSocDePoble. */
const PER_RESOLDRE = new Set(['pendent', 'resolent', 'error']);

/* L'avís d'un { estat, href }, traduït: mentre no s'ha resolt (pendent o
   resolent), que encara es busca; sense entitat o amb error, que no està
   disponible; amb xat, cap. */
function avisTraduit({ estat, href }, t) {
  const avis = estat === 'pendent' ? AVISOS_XAT_CORPORATIU.resolent : avisDelXatCorporatiu({ estat, href });
  if (!avis) return null;
  return typeof t === 'function' ? t(...avis) : avis[1];
}

/**
 * Ordre del Mestre (261007) · «Comentaris = xat» · El proveïdor del xat
 * privat amb Sóc de Poble, la via «En privat» de totes les targetes i barres
 * (useAccions la llig del context XatSocDePobleContext). Es munta UNA vegada,
 * a App.jsx, dins de l'UIProvider, i resol l'entitat UNA vegada per abast de
 * backend, i només quan cal:
 *  · LLAVOR ('seed' o 'local', o fora de l'app): el xat de la llavor, sense
 *    cap crida.
 *  · REMOT: res a l'arrencada ('pendent'). El primer «En privat» crida
 *    `resol()`, que demana l'entitat pel port (resolXatCorporatiu); els clics
 *    que arriben mentre es resol fan servir la mateixa promesa, i el resultat
 *    val per a tota l'app fins que l'abast canvia. Un error es torna a provar
 *    al clic següent.
 *    Revisió del 261007 (M4-01) · Una entitat absent que ha dit el PORT també
 *    es torna a provar, però passada ESPERA_DESPRES_DE_FALLADA_MS (la de
 *    navigation.js · resolEntitatDelProjecte, ordre del Mestre del 261004:
 *    un null del port és una fallada): loadPerfilPublic convertix un tall de
 *    xarxa en null, i abans un tall en el primer «En privat» deixava la via
 *    privada morta tota la sessió. Durant l'espera, `resol` torna la mateixa
 *    resposta sense cridar el port; després, el clic següent la torna a
 *    demanar. Una configuració sense abast continua sense res a demanar.
 * El valor és { estat, href, avis, resol }: avis ja traduït (el que Comentar
 * diu quan encara no pot portar al xat) i resol només quan encara hi ha res
 * a demanar; torna una promesa de { estat, href, avis, darrera }. Sense este
 * proveïdor, useXatSocDePoble dona el xat de la llavor.
 * Correcció C6 · `darrera` diu, quan arriba la resposta, si esta demanda és
 * encara l'última de tota l'app: si dos «En privat» arriben mentre es resol,
 * només el segon hi navega (useAccions).
 * Qui en vol l'estat sense esperar cap clic (l'Alerta del Panell) fa servir
 * useXatSocDePobleResolt (PedraSeca/hooks/xatSocDePoble.js): demana ESTA
 * mateixa resolució en muntar, no una de pròpia.
 * Onada 8 (261009) · «En privat» obri el xat amb l'autor, i este és el xat
 * de quan l'autor és qui mira (useAccions): el valor hi afig esDeQuiMira(id)
 * quan coneix la identitat de l'app (idsDeQuiMira). Sense, cap camp nou.
 * En LLAVOR hi afig també directeAmb (directeDeLlavor): el xat local només
 * obri directes amb el seu padró, i la resta d'autors van a este xat.
 */
export function ProveidorXatSocDePoble({ children }) {
  const app = useEstatDeLApp();
  const externalConfig = app?.externalConfig;
  const { dataMode, abast } = llegixBackend(externalConfig);
  const identitat = useIdentitatDeLApp();
  const quiMira = useMemo(() => idsDeQuiMira(identitat, dataMode), [identitat, dataMode]);
  const local = app === null || MODES_LOCALS.has(dataMode);
  const configRef = useRef(externalConfig);
  configRef.current = externalConfig;
  const t = useTraductorOpcional();
  const [resolt, setResolt] = useState(null);
  /* La resolució en curs (o acabada bé) i el seu abast: una per a tota l'app. */
  const enCurs = useRef({ abast: null, promesa: null });
  /* C6 · El compte de les demandes de tota l'app: l'última és la que mana. */
  const demandes = useRef(0);

  let xat = PENDENT;
  if (local) xat = XAT_DE_LLAVOR;
  else if (!abast) xat = ABSENT;
  else if (resolt?.abast === abast) xat = resolt;
  const { estat, href } = xat;

  const resol = useCallback(() => {
    const { abast: abastEnCurs, promesa: anterior, fallada } = enCurs.current;
    /* M4-01 · Un «absent» del port val fins que passa l'espera. */
    const caducada = typeof fallada === 'number' && Date.now() - fallada >= ESPERA_DESPRES_DE_FALLADA_MS;
    if (abastEnCurs === abast && anterior && !caducada) return anterior;
    setResolt({ abast, ...RESOLENT });
    const promesa = resolXatCorporatiu({ dataMode, config: configRef.current || {} })
      .catch(() => ({ estat: 'error', href: null }))
      .then((resultat) => {
        if (enCurs.current.promesa === promesa) {
          setResolt({ abast, estat: resultat.estat, href: resultat.href });
          if (resultat.estat === 'error') enCurs.current = { abast: null, promesa: null };
          else if (resultat.estat === 'absent') enCurs.current = { abast, promesa, fallada: Date.now() };
        }
        return resultat;
      });
    enCurs.current = { abast, promesa };
    return promesa;
  }, [abast, dataMode]);

  /* M4-01 · L'«absent» que ha tornat el port (no el d'una configuració sense
     abast) es pot tornar a demanar: `resol` sap si l'espera ha passat. */
  const absentDelPort = estat === 'absent' && xat === resolt;
  const valor = useMemo(() => Object.freeze({
    estat,
    href,
    avis: avisTraduit({ estat, href }, t),
    resol: local || !(PER_RESOLDRE.has(estat) || absentDelPort)
      ? null
      : () => {
        demandes.current += 1;
        const demanda = demandes.current;
        return resol().then((resultat) => ({
          ...resultat, avis: avisTraduit(resultat, t), darrera: demanda === demandes.current
        }));
      },
    ...(quiMira.size ? { esDeQuiMira: (id) => quiMira.has(String(id ?? '')) } : null),
    ...(local ? { directeAmb: directeDeLlavor } : null)
  }), [absentDelPort, estat, href, local, quiMira, resol, t]);
  return createElement(XatSocDePobleContext.Provider, { value: valor }, children);
}
