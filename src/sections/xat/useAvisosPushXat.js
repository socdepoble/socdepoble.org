/* B8C-6 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Els avisos
   push del Xat a la interfície: «Encendre els avisos des d'un gest de la
   persona als ajustos del Xat i obrir el fil des de l'avís, tot apagat per
   defecte.» Dos hooks sobre el registre neutre (src/config/avisosPushXat.js):

     · useSincronitzaAvisosPush() · el munta ReceptorCompartit, una vegada per
       càrrega (Onada R9: pel tros diferit SincronitzaAvisosPush.jsx, només quan
       ja hi ha un adaptador; abans, el cas (i)). Fixa el servidor de la persona de la sessió (Model B: el port,
       capacitat 'avisosPush') i sincronitza sense preguntar MAI:
         (i)   sense adaptador (la bandera apagada), no fa res;
         (ii)  amb la sessió en 'comprovant', espera;
         (iii) amb la sessió 'fora', NOMÉS desvincula el servidor: una
               renovació que falla per la xarxa també és 'fora' i torna a
               'dins' tota sola (D1); desfer el push ací deixaria la persona
               sense avisos sense dir-ho (ARB-05);
         (iv)  una persona diferent de l'última d'esta càrrega: primer es
               desvincula el servidor de l'anterior (cap sincronització ni
               interruptor amb el seu àmbit) i després la baixa LOCAL, amb el
               sostre del registre (LIMIT_BAIXA_PUSH_MS): la persona nova
               activa amb el seu gest (D-B8C-7) i un unsubscribe penjat no la
               deixa sense servidor tota la càrrega (CORRECTOR ARB-P05-03);
         (v)   amb la sessió 'dins' i fora d'una eixida: el servidor de la
               persona (en remot i amb la capacitat) o cap, i sincronitza;
               sense servidor, sincronitzar fa d'interruptor i desfà;
         (vi) en tornar a la vista sincronitza. Només una lectura confirmada
              posterior al wake pot netejar el pendent (productor carregaFils).
       L'àmbit és la persona (currentUser.id), no l'actor: parlar en nom
       d'una entitat no rota cap subscripció. El canvi de llengua no torna a
       fixar res: el servidor la llig en cada desat.

     · useControlAvisosPush(t) · el contenidor del full Ajustos. Diu si
       s'oferix l'interruptor (o només la nota d'instal·lar a l'iPhone) i
       dona l'onCanvi del GEST: onCanvi(true) crida activaAvisosPush() en el
       mateix tic, sense cap espera, efecte ni import() pel camí (Safari i
       Firefox perdrien el gest i el permís no eixiria).

   Ni este fitxer ni la pàgina nomenen el worker del navegador, el pont natiu
   ni cap emmagatzematge: tot passa pel registre. */
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { desaDispositiuAvisos, retiraDispositiuAvisos, teCapacitat } from '../../data/backendPort.js';
import {
  ESTAT_AVISOS, LIMIT_BAIXA_PUSH_MS, activaAvisosPush, desactivaAvisosPush, escoltaAvisosPush, fixaServidorAvisosPush,
  instantaniaAvisosPush, sincronitzaAvisosPush
} from '../../config/avisosPushXat.js';
import { useXat } from './XatContext';

/* El motiu de l'adaptador web quan l'iPhone o l'iPad no tenen l'app a la
   pantalla d'inici (MOTIU_PUSH.IOS_SENSE_INSTALAR de src/pwa/avisosPush.js,
   amb prova de paritat): no hi ha interruptor, només la nota. */
export const MOTIU_IOS_SENSE_INSTALAR = 'ios-sense-instalar';

/* Els textos de la pàgina «Notificacions», com a parells [clau, reserva]: la
   reserva és, caràcter a caràcter, el valor valencià del diccionari. */
export const TEXTOS_AVISOS = Object.freeze({
  interruptor: ['section.xat.ajustos.avisos.interruptor', 'Avisos en este dispositiu'],
  cec: ['section.xat.ajustos.avisos.cec', 'L’avís només diu «Tens missatges nous»: mai qui t’escriu ni què et diu.'],
  denegat: ['section.xat.ajustos.avisos.denegat', 'Este navegador té blocats els avisos de Sóc de Poble. Els pots tornar a permetre als seus ajustos.'],
  denegatApp: ['section.xat.ajustos.avisos.denegatApp', 'Este dispositiu té blocats els avisos de Sóc de Poble. Els pots tornar a permetre als ajustos del sistema.'],
  ios: ['section.xat.ajustos.avisos.ios', 'A l’iPhone i a l’iPad, afig Sóc de Poble a la pantalla d’inici i obri-la des d’allí per a rebre avisos.'],
  error: ['section.xat.ajustos.avisos.error', 'No s’han pogut activar els avisos. Torna-ho a provar d’ací a una estona.'],
  senseWorker: ['section.xat.ajustos.avisos.senseWorker', 'Torna a carregar la pàgina i prova-ho de nou.'],
  noDisponible: ['section.xat.ajustos.avisos.noDisponible', 'El servidor d’este poble encara no envia avisos. Torna-ho a provar més avant.'],
  eixida: ['section.xat.ajustos.avisos.eixida', 'Quan tanques la sessió, este dispositiu deixa de rebre avisos.']
});

const RESERVA = (_clau, reserva) => reserva;
/* La marca de «ja desvinculat per a esta sessió fora». */
const FORA = 'fora';
const SENSE_NOTES = Object.freeze({ nota: null, notes: Object.freeze([]) });

/**
 * Les notes de la pàgina, pures: { nota, notes }. `nota` és la de l'estat
 * ({ text, error } o null: un sol <p role="status">); `notes` són les fixes.
 * Amb l'interruptor: la nota cega i la de l'eixida, sempre. Només amb la nota
 * d'instal·lar: eixa i prou. Sense res a oferir: cap.
 */
export function notesDelsAvisos({ oferit = false, nomesNota = false, estat = null, tipus = null } = {}, t = RESERVA) {
  const tr = typeof t === 'function' ? ([clau, reserva]) => t(clau, reserva) : ([, reserva]) => reserva;
  if (nomesNota && !oferit) return { nota: null, notes: [tr(TEXTOS_AVISOS.ios)] };
  if (!oferit) return SENSE_NOTES;
  let nota = null;
  if (estat === ESTAT_AVISOS.DENEGAT) nota = { text: tr(tipus === 'natiu' ? TEXTOS_AVISOS.denegatApp : TEXTOS_AVISOS.denegat), error: false };
  else if (estat === ESTAT_AVISOS.SENSE_SERVIDOR) nota = { text: tr(TEXTOS_AVISOS.noDisponible), error: false };
  else if (estat === ESTAT_AVISOS.SENSE_WORKER) nota = { text: tr(TEXTOS_AVISOS.senseWorker), error: true };
  else if (estat === ESTAT_AVISOS.ERROR || estat === ESTAT_AVISOS.SENSE_GEST) nota = { text: tr(TEXTOS_AVISOS.error), error: true };
  return { nota, notes: [tr(TEXTOS_AVISOS.cec), tr(TEXTOS_AVISOS.eixida)] };
}

const teCapacitatSegura = (nom) => {
  try { return teCapacitat(nom) === true; } catch { return false; }
};

/* La promesa o, passats `ms`, undefined; mai rebutja i el temporitzador es
   neteja sempre. */
function ambSostre(promesa, ms) {
  let temps;
  const sostre = new Promise((resol) => { temps = globalThis.setTimeout(resol, ms); });
  return Promise.race([Promise.resolve(promesa).catch(() => undefined), sostre])
    .finally(() => { globalThis.clearTimeout(temps); });
}

/* L'instantània del registre (un objecte congelat que només canvia quan
   canvia algun camp: cap bucle de useSyncExternalStore). */
const useInstantania = () => useSyncExternalStore(escoltaAvisosPush, instantaniaAvisosPush, instantaniaAvisosPush);

/* La persona de la sessió com a text, o null. */
function personaDe(sessio) {
  const id = sessio?.currentUser?.id;
  if (id === null || id === undefined) return null;
  const text = String(id);
  return text ? text : null;
}

/** La sincronització sense preguntar (ReceptorCompartit). Vegeu la capçalera, (i)-(vi). */
export function useSincronitzaAvisosPush() {
  const sessio = useSessioOpcional();
  const ui = useUIStateOpcional();
  const { modeDades } = useXat();
  const { disponible, ambServidor, eixint } = useInstantania();
  const estat = typeof sessio?.estat === 'string' ? sessio.estat : 'fora';
  const persona = personaDe(sessio);

  /* El que el servidor llig en cada crida (llengua i configuració) i l'estat
     de la sessió per a l'oient de la vista: refs, perquè canviar-los no ha de
     tornar a fixar el servidor ni a sincronitzar. */
  const llengua = useRef(ui?.language ?? null);
  const config = useRef(ui?.externalConfig);
  const estatViu = useRef(estat);
  useEffect(() => {
    llengua.current = ui?.language ?? null;
    config.current = ui?.externalConfig;
    estatViu.current = estat;
  });

  /* L'última persona no nul·la d'esta càrrega, i la clau del que este hook
     ha fixat ('servidor:<id>' o 'sense:<id>'). */
  const ultimaPersona = useRef(null);
  const fixat = useRef(null);
  /* La baixa local d'un canvi de persona en curs: { persona, promesa }. Si
     l'efecte es torna a executar per a la mateixa persona (desvincular canvia
     ambServidor), reprén esta promesa: una sola baixa. */
  const baixaLocal = useRef(null);

  useEffect(() => {
    if (!disponible || estat === 'comprovant') return undefined;
    if (estat !== 'dins' || persona === null) {
      /* Una sola vegada per cada 'fora' (i sempre que encara hi haja servidor
         o una eixida per tancar): desvincular és idempotent, però cada crida
         avança la generació del registre. */
      const ara = instantaniaAvisosPush();
      if (fixat.current === FORA && !ara.ambServidor && !ara.eixint) return undefined;
      fixat.current = FORA;
      fixaServidorAvisosPush(null);
      return undefined;
    }
    const previa = ultimaPersona.current;
    const canvi = previa !== null && previa !== persona;
    const ara = instantaniaAvisosPush();
    /* Mentre ix la mateixa persona, res: el registre ni l'admetria. */
    if (ara.eixint && !canvi) return undefined;
    const ambServei = modeDades === 'remote' && teCapacitatSegura('avisosPush');
    const clau = `${ambServei ? 'servidor' : 'sense'}:${persona}`;
    if (!canvi && fixat.current === clau && (!ambServei || ara.ambServidor)) return undefined;
    let viu = true;
    const fixa = () => {
      if (!viu) return;
      ultimaPersona.current = persona;
      baixaLocal.current = null;
      const servidor = ambServei
        ? {
          ambit: persona,
          /* Camp a camp: cap altra clau no arriba al port. */
          desa: (d) => desaDispositiuAvisos({
            plataforma: d?.plataforma, adreca: d?.adreca, caducaMs: d?.caducaMs ?? null, gest: d?.gest === true, llengua: llengua.current
          }, config.current),
          retira: (d) => retiraDispositiuAvisos({ plataforma: d?.plataforma, adreca: d?.adreca, usuariEsperat: persona }, config.current)
        }
        : null;
      if (!fixaServidorAvisosPush(servidor)) return;
      fixat.current = clau;
      sincronitzaAvisosPush();
    };
    if (canvi) {
      if (baixaLocal.current?.persona !== persona) {
        /* Mentre dura la baixa, ni l'interruptor ni la vista no poden parlar
           amb el servidor de qui hi havia. */
        if (ara.ambServidor || ara.eixint) {
          fixaServidorAvisosPush(null);
          fixat.current = null;
        }
        baixaLocal.current = { persona, promesa: ambSostre(desactivaAvisosPush({ local: true }), LIMIT_BAIXA_PUSH_MS) };
      }
      baixaLocal.current.promesa.then(fixa);
    } else fixa();
    return () => { viu = false; };
  }, [disponible, estat, persona, modeDades, ambServidor, eixint]);

  useEffect(() => {
    if (!disponible) return undefined;
    const doc = globalThis.document;
    if (!doc || typeof doc.addEventListener !== 'function') return undefined;
    const enTornar = () => {
      if (doc.visibilityState !== 'visible' || estatViu.current !== 'dins' || instantaniaAvisosPush().eixint) return;
      sincronitzaAvisosPush();
    };
    doc.addEventListener('visibilitychange', enTornar);
    return () => { doc.removeEventListener('visibilitychange', enTornar); };
  }, [disponible]);
}

/**
 * L'estat de la pàgina «Notificacions» i el gest: { oferit, nomesNota, actiu,
 * ocupat, estat, tipus, nota, notes, onCanvi }. S'oferix amb un adaptador
 * registrat sense motiu per a no oferir-lo, la sessió 'dins' fora d'una
 * eixida, el mode remot, la capacitat 'avisosPush' i el servidor ja fixat per
 * a la persona (sense, el gest tornaria 'sense-servidor': millor la pàgina
 * «en construcció» de sempre). `ocupat` és el pany entre gestos (el registre
 * no en serialitza dos de persones diferents): l'interruptor queda desactivat.
 */
export function useControlAvisosPush(t) {
  const inst = useInstantania();
  const sessio = useSessioOpcional();
  const { modeDades } = useXat();
  const base = inst.disponible && sessio?.estat === 'dins' && !inst.eixint && modeDades === 'remote' && teCapacitatSegura('avisosPush');
  const oferit = Boolean(base && inst.motiu === null && inst.ambServidor);
  const nomesNota = Boolean(base && !oferit && inst.motiu === MOTIU_IOS_SENSE_INSTALAR);
  /* El GEST: síncron fins al registre (cap async, cap await, cap setState previ). */
  const onCanvi = useCallback((encesa) => (encesa === true ? activaAvisosPush() : desactivaAvisosPush()), []);
  const { nota, notes } = notesDelsAvisos({ oferit, nomesNota, estat: inst.estat, tipus: inst.tipus }, t);
  return {
    oferit, nomesNota, actiu: inst.estat === ESTAT_AVISOS.ACTIU, ocupat: inst.ocupat === true,
    estat: inst.estat, tipus: inst.tipus, nota, notes, onCanvi
  };
}
