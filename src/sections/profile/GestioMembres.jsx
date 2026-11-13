import { useEffect, useMemo, useRef, useState } from 'react';
import { Boto, Camp, CampText, Casella, DialegConfirmacio, GrupCamps, Selector, Taula } from '../../components/PedraSeca';
import { AvatarResolt } from '../../components/universal/identitat/AvatarResolt.jsx';
import { PARELLS_ROL, parellDeRol } from '../../components/universal/identitat/rols.js';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIActionsOpcional } from '../../app/contexts/UIContext';
import { omple } from '../../config/moderacio.js';
/* IDEA-22, punt 2 (pla 261025_0200) · La tria de la propietària (capacitat 'consentimentTitular'). */
import { estatTitularPublic, marcaTitularPublic, teCapacitat } from '../../data/backendPort.js';
import { MINIM_CERCA, accionsSobre, clauDeMembre, ordenaMembres, parellDeTipus, potTransferirPropietat } from './membresModel.js';
import { QuiSegueixOrganitzacio } from './Seguidors.jsx';

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008, grup C) · GESTIÓ DELS MEMBRES

   La pinta «El compte» d'una organització (DetallAjust, acció 'membres')
   per a qui l'administra: la llista de membres (persones i organitzacions),
   l'alta directa (sense invitació), el canvi de rol i la baixa. Només peces
   de Pedra Seca. Què s'oferix ho decidix membresModel.js; el que es pot fer
   de veres, el port (el servidor torna a dir-ho).

   `accions` ve del context del Perfil: { usuariId, llistaMembres,
   desaMembre, llevaMembre, cercaCandidats, transfereixPropietat? }.
   IDEA-24 (marató 261101_2143, B4) · `transfereixPropietat` és opcional
   (capacitat 'transferenciaPropietat'): la propietària d'un grup o d'una
   empresa cedix la propietat a una persona membre, amb confirmació.
   ═══════════════════════════════════════════════════════════════════ */

/* La cerca de candidats espera que la persona pare d'escriure. */
export const ESPERA_CERCA = 300;

/* Els rols que es poden triar en l'alta; l'etiqueta es traduïx en pintar (PARELLS_ROL). */
const ROLS_D_ALTA = Object.freeze(['member', 'admin']);

/* T5a · P1-22 (assalt 261101) · Els textos de la gestió, en parells [clau
   i18n, reserva] com TEXTOS_PRIVACITAT: cada reserva és el text de sempre,
   lletra per lletra, i el valor valencià del diccionari. Frases senceres amb
   buits d'omple() ({nom}, {org}, {n}, {consulta}), mai trossos cosits. */
const textMembres = (nom, reserva) => Object.freeze([`section.perfil.membres.${nom}`, reserva]);
export const TEXTOS_MEMBRES = Object.freeze({
  errorLlista: textMembres('errorLlista', 'No s’ha pogut llegir la llista de membres.'),
  errorCerca: textMembres('errorCerca', 'No s’ha pogut cercar a la gent del municipi.'),
  opcioEscriu: textMembres('opcio.escriu', 'Primer escriu un nom…'),
  opcioCercant: textMembres('opcio.cercant', 'Cercant…'),
  opcioTria: textMembres('opcio.tria', 'Tria un resultat…'),
  opcioCap: textMembres('opcio.cap', 'Cap resultat'),
  senseNom: textMembres('senseNom', 'Sense nom'),
  afegit: textMembres('afegit', '{nom} ja és membre de {org}.'),
  errorAfegeix: textMembres('errorAfegeix', 'No s’ha pogut afegir el membre.'),
  ascendit: textMembres('ascendit', '{nom} ja administra {org}.'),
  descendit: textMembres('descendit', '{nom} ja no administra {org}.'),
  errorRol: textMembres('errorRol', 'No s’ha pogut canviar el rol.'),
  llevat: textMembres('llevat', '{nom} ja no és membre de {org}.'),
  errorLleva: textMembres('errorLleva', 'No s’ha pogut llevar el membre.'),
  carregant: textMembres('carregant', 'Carregant els membres…'),
  taula: textMembres('taula', 'Membres de {org}'),
  colMembre: textMembres('col.membre', 'Membre'),
  colTipus: textMembres('col.tipus', 'Tipus'),
  colRol: textMembres('col.rol', 'Rol'),
  colAccions: textMembres('col.accions', 'Accions'),
  tu: textMembres('tu', '(tu)'),
  nomenaAdmin: textMembres('nomenaAdmin', 'Nomenar administradora'),
  tornaMembre: textMembres('tornaMembre', 'Tornar a membre'),
  lleva: textMembres('lleva', 'Llevar'),
  buit: textMembres('buit', 'Encara no hi ha cap membre.'),
  afegirLlegenda: textMembres('afegirLlegenda', 'Afegir un membre'),
  cercaAjuda: textMembres('cercaAjuda', 'Persones del municipi o organitzacions que també administres. Escriu almenys {n} lletres.'),
  quiAfegir: textMembres('quiAfegir', 'Qui vols afegir'),
  afegir: textMembres('afegir', 'Afegir'),
  dialegTitol: textMembres('dialegTitol', 'Llevar {nom} de {org}?'),
  dialegTitolSenseNom: textMembres('dialegTitolSenseNom', 'Llevar este membre de {org}?'),
  dialegTitolBuit: textMembres('dialegTitolBuit', 'Llevar un membre'),
  dialegDescripcio: textMembres('dialegDescripcio', 'Deixarà de ser-ne membre. Es pot tornar a afegir quan calga.'),
  /* P1-15 · El recompte de la cerca, per al lector de pantalla (el selector canvia en silenci). */
  anunciResultats: textMembres('anunciResultats', '{n} resultats per a «{consulta}».'),
  anunciUnResultat: textMembres('anunciUnResultat', 'Un resultat per a «{consulta}».'),
  anunciCapResultat: textMembres('anunciCapResultat', 'Cap resultat per a «{consulta}».'),
  /* IDEA-24 (marató 261101_2143, B4) · Transferir la propietat. */
  transfereix: textMembres('transfereix', 'Transferir la propietat'),
  transferit: textMembres('transferit', '{nom} ja és la propietària de {org}. Tu continues com a administradora.'),
  errorTransfereix: textMembres('errorTransfereix', 'No s’ha pogut transferir la propietat.'),
  dialegTransfereixTitol: textMembres('dialegTransfereixTitol', 'Transferir la propietat de {org} a {nom}?'),
  dialegTransfereixTitolBuit: textMembres('dialegTransfereixTitolBuit', 'Transferir la propietat'),
  dialegTransfereixDescripcio: textMembres('dialegTransfereixDescripcio', '{nom} en serà la propietària i tu passaràs a administradora: continuaràs gestionant la fitxa i els membres, però ja no podràs nomenar ni llevar administradores. Només {nom} et podrà tornar la propietat.'),
  /* Claus comunes: el camp de cerca i el botó de tornar de la confirmació (abans, «Cancel·lar» en totes les llengües). */
  cerca: Object.freeze(['common.search', 'Cerca']),
  cancela: Object.freeze(['common.cancela', 'Cancel·lar']),
});

/* T11-02 (Gemini, Tall 11; marató 261101_2143) · Els errors del port, pel seu
   `code` i en la llengua de la interfície. Cada reserva és la frase valenciana
   de MISSATGES_MEMBRES_ORGANITZACIO (contracte.js), lletra per lletra, i la de
   NO-DISPONIBLE, la de l'adaptador i PerfilContext. Un error sense codi conegut
   (la xarxa, el text cru d'un proveïdor) diu el genèric de l'acció: mai el seu
   `message` (doctrina d'errorsBackend.js: la vista decidix pel codi). */
const textErrorMembre = (codi, reserva) => Object.freeze([`section.perfil.membres.error.${codi}`, reserva]);
export const ERRORS_MEMBRES = Object.freeze({
  'SDP-ORGMEM-000': textErrorMembre('orgmem000', 'Cal iniciar sessió.'),
  'SDP-ORGMEM-001': textErrorMembre('orgmem001', 'El tipus de membre o el rol no és vàlid.'),
  'SDP-ORGMEM-002': textErrorMembre('orgmem002', 'Només qui administra l’organització en veu i en gestiona els membres.'),
  'SDP-ORGMEM-003': textErrorMembre('orgmem003', 'Esta persona no és del municipi de l’organització o ha demanat la baixa.'),
  'SDP-ORGMEM-004': textErrorMembre('orgmem004', 'No pots canviar el teu propi rol.'),
  'SDP-ORGMEM-005': textErrorMembre('orgmem005', 'La propietària no es canvia ni es lleva.'),
  'SDP-ORGMEM-006': textErrorMembre('orgmem006', 'Només la propietària nomena, degrada o lleva administradores.'),
  'SDP-ORGMEM-007': textErrorMembre('orgmem007', 'Una organització no pot ser membre d’ella mateixa ni d’una d’un altre poble.'),
  'SDP-ORGMEM-008': textErrorMembre('orgmem008', 'Per a afegir una organització com a membre, cal que també l’administres.'),
  'NO-DISPONIBLE': textErrorMembre('noDisponible', 'El servidor d’este poble encara no gestiona els membres de les organitzacions.'),
});

/* L'error del port, traduït pel seu codi; sense cap codi propi, el genèric. */
const textDError = (error, generic, t) => {
  const codi = typeof error?.code === 'string' ? error.code : '';
  return Object.hasOwn(ERRORS_MEMBRES, codi) ? tradueix(t, ERRORS_MEMBRES[codi]) : generic;
};
const esCancel = (error) => error?.name === 'AbortError';

/* IDEA-24 (marató 261101_2143, B4) · Per a la transferència, tres codis volen
   frase pròpia: la de NO-DISPONIBLE de dalt mentiria (els membres sí que es
   gestionen; el que falta és la RPC, i la reserva és la frase de l'adaptador
   remot), la de 006 parla de nomenar i la de 003 no diu que la destinatària
   ha de ser membre (2610311500). La resta de codis, ERRORS_MEMBRES. */
export const ERRORS_TRANSFERENCIA = Object.freeze({
  'SDP-ORGMEM-003': textErrorMembre('transfereixOrgmem003', 'Només es pot transferir a una persona que siga membre de l’organització i del seu poble i que no haja demanat la baixa.'),
  'SDP-ORGMEM-006': textErrorMembre('transfereixOrgmem006', 'Només la propietària pot transferir la propietat.'),
  'NO-DISPONIBLE': textErrorMembre('transfereixNoDisponible', 'El servidor d’este poble encara no sap transferir la propietat de les organitzacions.'),
});
const textDErrorTransferencia = (error, generic, t) => {
  const codi = typeof error?.code === 'string' ? error.code : '';
  return Object.hasOwn(ERRORS_TRANSFERENCIA, codi) ? tradueix(t, ERRORS_TRANSFERENCIA[codi]) : textDError(error, generic, t);
};

/* ═══════════════════════════════════════════════════════════════════
   IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
   261025_0200) · MOSTRAR-SE COM A TITULAR A CONNECTAR

   Qui connecta amb una entitat a /connectar pot connectar també amb la seua
   persona titular, però NOMÉS si ella ho ha triat: el servidor no diu mai
   qui administra una entitat, i un perfil públic no és cap permís. La
   casella només la veu la propietària (rol 'owner'; el servidor ho torna a
   dir, SDP-TIT-001), i cap administradora no la pot marcar per ella. Diu
   abans del clic que cal el perfil públic. Sense la capacitat
   'consentimentTitular', o amb un servidor sense la migració 2610250300
   (NO-DISPONIBLE), no pinta res. Els textos, per t() (cinc diccionaris):
   fora de l'App (les proves soltes), la reserva valenciana.
   ═══════════════════════════════════════════════════════════════════ */
const teConsentimentTitular = () => {
  try { return teCapacitat('consentimentTitular') === true; } catch { return false; }
};
const traduccioDeReserva = (_clau, reserva) => reserva;
/* Un servidor que no la sap fer, o que diu que no n'ets la propietària: la casella no hi és. */
const SENSE_CASELLA = new Set(['NO-DISPONIBLE', 'SDP-TIT-001']);

export function TriaTitular({ orgId, nomOrg }) {
  const t = useUIActionsOpcional()?.t || traduccioDeReserva;
  const disponible = teConsentimentTitular() && Boolean(orgId);
  const [estat, setEstat] = useState({ orgId: null, carregant: true, valor: false, error: null });
  const [desant, setDesant] = useState(false);
  /* El valor que s'està desant: la casella el mostra de seguida (si no, la
     controlada tornaria a l'anterior fins que contestara el servidor). */
  const [pendent, setPendent] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  /* P1-15 del Llibre (auditoria Port Neutral 261025, PN-03) · El component no
     es remunta en canviar d'entitat (no porta key), i la resposta tardana
     d'una tria d'A s'escrivia a l'estat de B: la casella de B es desmarcava,
     deia «Ja no et mostrem com a titular d'A» i es quedava «desant».
     Consens Gauntlet 2120 (C2120-01) · Descartar eixa resposta no bastava:
     A→B→A amb l'escriptura d'A encara en vol deixava la casella d'A al revés
     del servidor (la lectura en tornar arribava abans que l'escriptura, i la
     confirmació ja no escrivia). Ara les escriptures en vol es guarden per
     entitat, una com a molt per a cadascuna: en tornar a A, A continua
     «desant» amb el valor que s'està desant, i la confirmació la reconcilia
     amb el valor del servidor. Només escriu l'entitat que es veu: mai B. */
  const orgVisible = useRef(null);
  const enVol = useRef(new Map());
  // Escriptures confirmades per entitat: una lectura que va començar abans no les desfà.
  const confirmades = useRef(new Map());

  useEffect(() => {
    if (!disponible) return undefined;
    const control = new AbortController();
    orgVisible.current = orgId;
    const enCurs = enVol.current.get(orgId);
    const confirmadesEnLlegir = confirmades.current.get(orgId) ?? 0;
    setEstat({ orgId, carregant: true, valor: false, error: null });
    setMissatge(enCurs ? enCurs.missatge : null);
    setDesant(Boolean(enCurs));
    setPendent(enCurs ? enCurs.valor : null);
    Promise.resolve()
      .then(() => estatTitularPublic(orgId, { signal: control.signal }))
      .then((resposta) => {
        if (control.signal.aborted) return;
        const valor = resposta?.titularPublic === true;
        setEstat((previ) => {
          if (previ.orgId !== orgId) return previ;
          // Una escriptura d'esta entitat ha confirmat després de començar la lectura: mana ella.
          if ((confirmades.current.get(orgId) ?? 0) !== confirmadesEnLlegir) return { ...previ, carregant: false };
          return { orgId, carregant: false, valor, error: null };
        });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat((previ) => {
          if (previ.orgId !== orgId) return previ;
          // Com en l'èxit: si una escriptura d'esta entitat ha confirmat mentrestant, mana ella.
          if ((confirmades.current.get(orgId) ?? 0) !== confirmadesEnLlegir) return { ...previ, carregant: false };
          return { orgId, carregant: false, valor: false, error: { code: error?.code ?? null } };
        });
      });
    return () => control.abort();
  }, [disponible, orgId]);

  if (!disponible || estat.orgId !== orgId || SENSE_CASELLA.has(estat.error?.code)) return null;

  async function canvia(e) {
    const nou = e.target.checked === true;
    const orgDeLaTria = orgId;
    if (desant || enVol.current.has(orgDeLaTria)) return;
    const operacio = { valor: nou, missatge: { tipus: 'desant', text: t('section.perfil.titular.desant', 'Desant la tria…') } };
    enVol.current.set(orgDeLaTria, operacio);
    // Només pinta qui encara es veu i és l'entitat d'esta tria (en tornar-hi, també).
    const visible = () => viu.current && orgVisible.current === orgDeLaTria;
    setDesant(true);
    setPendent(nou);
    setMissatge(operacio.missatge);
    try {
      const resposta = await marcaTitularPublic(orgDeLaTria, nou, {});
      const valor = resposta?.titularPublic === true;
      confirmades.current.set(orgDeLaTria, (confirmades.current.get(orgDeLaTria) ?? 0) + 1);
      if (!visible()) return;
      /* P1-15 (P3, Codex 2230) · La confirmació mana sobre la lectura en vol
         (A→B→A): la casella no ha d'esperar-la desactivada. */
      setEstat((previ) => (previ.orgId === orgDeLaTria ? { ...previ, carregant: false, valor, error: null } : previ));
      setMissatge({
        tipus: 'exit',
        text: omple(valor
          ? t('section.perfil.titular.desat', 'Desat: et mostrarem com a titular de {nom} a Connectar mentre el teu perfil i l’entitat siguen públics.')
          : t('section.perfil.titular.llevat', 'Ja no et mostrem com a titular de {nom}.'), { nom: nomOrg })
      });
    } catch (error) {
      if (visible() && !esCancel(error)) setMissatge({ tipus: 'error', text: t('section.perfil.titular.error', 'No s’ha pogut desar la tria. Torna-ho a provar.') });
    } finally {
      if (enVol.current.get(orgDeLaTria) === operacio) enVol.current.delete(orgDeLaTria);
      if (visible()) {
        setDesant(false);
        setPendent(null);
      }
    }
  }

  /* Revisió del torn 261025_0200 · La casella no es desactiva mentre desa:
     la que té el focus el perdria. canvia() ja ignora un segon toc, i com
     que és controlada, el valor torna al que diu el servidor. */
  return (
    <div aria-busy={desant || undefined}>
      <Casella
        etiqueta={omple(t('section.perfil.titular.etiqueta', 'Mostra’m com a titular de {nom} a Connectar'), { nom: nomOrg })}
        ajuda={omple(t('section.perfil.titular.ajuda', 'Qui connecte amb {nom} també podrà connectar amb tu, a la mateixa pantalla. Només es veu mentre el teu perfil i l’entitat siguen públics; ho pots llevar quan vulgues, i ningú més no ho pot triar per tu.'), { nom: nomOrg })}
        checked={desant && pendent !== null ? pendent : estat.valor} disabled={estat.carregant || Boolean(estat.error)} onChange={canvia} />
      {estat.error ? (
        <p className="sdp-camp__error" role="alert">{t('section.perfil.titular.errorLectura', 'No s’ha pogut llegir si et mostrem com a titular.')}</p>
      ) : null}
      {missatge ? (
        <p className={{ exit: 'sdp-text-exit', desant: 'sdp-camp__ajuda' }[missatge.tipus] ?? 'sdp-camp__error'} role={missatge.tipus === 'error' ? 'alert' : 'status'}>
          {missatge.text}
        </p>
      ) : null}
    </div>
  );
}

export function GestioMembres({ organitzacio, accions }) {
  const t = useUIActionsOpcional()?.t || traduccioDeReserva;
  /* Els efectes de lectura i de cerca no es tornen a llançar si canvia la
     llengua: el traductor, d'un ref (com membresRef, baix). */
  const tRef = useRef(t);
  tRef.current = t;
  const orgId = organitzacio?.id;
  const nomOrg = organitzacio?.nom || '';
  const { usuariId = null, llistaMembres, desaMembre, llevaMembre, cercaCandidats, transfereixPropietat = null } = accions || {};
  /* IDEA-24 (marató 261101_2143, B4) · Les entitats que esta persona acaba de
     cedir. Mentre la fitxa encara diga 'owner' (arriba tard, o cap context no
     l'actualitza), el seu rol ja és 'admin' (fallada tancada); quan la fitxa
     diu una altra cosa, la marca s'allibera (efecte de baix) i mana la fitxa. */
  const rolDeLaFitxa = organitzacio?.dades?.role;
  const kind = organitzacio?.dades?.kind;
  const [cedides, setCedides] = useState(() => new Set());
  const rolMeu = orgId != null && rolDeLaFitxa === 'owner' && cedides.has(String(orgId)) ? 'admin' : rolDeLaFitxa;
  const propietaria = rolMeu === 'owner';

  const [estat, setEstat] = useState({ carregant: true, membres: [], error: null });
  const [missatge, setMissatge] = useState(null);
  const [ocupat, setOcupat] = useState(null);
  const [text, setText] = useState('');
  /* `per`: la consulta a la qual responen els candidats (P1-15: l'anunci no diu el recompte d'una consulta vella). */
  const [cerca, setCerca] = useState({ cercant: false, candidats: [], per: null });
  const [triat, setTriat] = useState('');
  const [rolNou, setRolNou] = useState('member');
  const [aLlevar, setALlevar] = useState(null);
  /* IDEA-24 · La persona a qui es vol cedir la propietat (la confirmació) i
     si el servidor encara no la sap transferir (NO-DISPONIBLE: no s'oferix més). */
  const [aTransferir, setATransferir] = useState(null);
  const [senseTransferencia, setSenseTransferencia] = useState(false);

  /* Guarda de doble enviament (síncrona: dos clics al mateix tic) i de
     desmuntatge (una resposta tardana no escriu en un component mort). */
  const ocupatRef = useRef(false);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  /* P1-15 (Claude 1705) · El component no es remunta en canviar d'entitat
     (DetallAjust no li posa key). Cada operació porta el seu testimoni: una
     resposta tardana d'A, quan ja es veu B, no escriu ni la llista ni l'avís
     de B, ni el deixa «Treballant…». `orgDeLaConfirmacio` és l'entitat on es
     va obrir la confirmació de «Llevar». */
  const opActual = useRef(null);
  const orgDeLaConfirmacio = useRef(null);
  /* IDEA-24 · L'entitat on es va obrir la confirmació de la transferència (P1-15). */
  const orgDeLaTransferencia = useRef(null);
  const membresRef = useRef(estat.membres);
  membresRef.current = estat.membres;

  /* Correcció 261008 · DESPRÉS DE TANCAR LA CONFIRMACIÓ de «Llevar».
     Dialeg tanca el <dialog> modal en el seu efecte (el del fill), i este, el
     del pare, s'executa després en el mateix commit. Per això:
     · el missatge (èxit o error) es pinta quan la pàgina ja no és inert: dins
       del mateix commit naixeria en una regió inert i el lector no l'anunciaria;
     · després d'una baixa, el botó que obria la confirmació se n'ha anat amb la
       fila i el <dialog> no hi pot tornar el focus: va a la llista (la regió de
       Taula, enfocable). Si ha fallat, el <dialog> el torna al botó de la fila. */
  const arrel = useRef(null);
  const despresDeTancar = useRef(null);
  useEffect(() => {
    const pendent = despresDeTancar.current;
    /* IDEA-24 · També la confirmació de la transferència: el missatge, quan ja s'ha tancat. */
    if (!pendent || aLlevar || aTransferir) return;
    despresDeTancar.current = null;
    if (pendent.missatge) setMissatge(pendent.missatge);
    if (pendent.focusALaLlista) {
      const desti = arrel.current?.querySelector('[role="region"]') || arrel.current?.querySelector('input[type="search"]');
      desti?.focus?.();
    }
  }, [aLlevar, aTransferir]);

  /* IDEA-24 · La fitxa ja no diu 'owner' en esta entitat: la marca de cedida
     sobra i s'allibera. Si més tard torna a dir 'owner' (li han tornat la
     propietat i s'ha rellegit), mana la fitxa. */
  useEffect(() => {
    if (orgId == null || rolDeLaFitxa === 'owner') return;
    setCedides((previ) => {
      if (!previ.has(String(orgId))) return previ;
      const sense = new Set(previ);
      sense.delete(String(orgId));
      return sense;
    });
  }, [orgId, rolDeLaFitxa]);

  /* ── La llista: es llig en obrir-se i quan canvia l'organització ── */
  useEffect(() => {
    const control = new AbortController();
    setEstat({ carregant: true, membres: [], error: null });
    /* Una altra organització: res de l'alta ni dels avisos de l'anterior es queda. */
    setText('');
    setTriat('');
    setRolNou('member');
    setMissatge(null);
    Promise.resolve()
      .then(() => llistaMembres(orgId, { signal: control.signal }))
      .then((llista) => {
        if (!control.signal.aborted) setEstat({ carregant: false, membres: ordenaMembres(llista), error: null });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat({ carregant: false, membres: [], error: textDError(error, tradueix(tRef.current, TEXTOS_MEMBRES.errorLlista), tRef.current) });
      });
    return () => control.abort();
  }, [orgId, llistaMembres]);

  /* P1-15 · Una altra entitat: l'operació en vol de l'anterior deixa de ser
     vigent (no escriurà res), el formulari queda lliure i la confirmació
     oberta es tanca (si no, «Llevar» llevaria a B un membre d'A). Només amb
     orgId: una llista rellegida de la mateixa entitat no talla l'operació. */
  useEffect(() => {
    opActual.current = null;
    ocupatRef.current = false;
    orgDeLaConfirmacio.current = null;
    /* IDEA-24 · I la de la transferència: mai la propietat d'A cedida des de B. */
    orgDeLaTransferencia.current = null;
    despresDeTancar.current = null;
    setOcupat(null);
    setALlevar(null);
    setATransferir(null);
  }, [orgId]);

  /* ── La cerca de candidats, amb espera ── */
  const consulta = text.trim();
  useEffect(() => {
    if (consulta.length < MINIM_CERCA) {
      setCerca({ cercant: false, candidats: [], per: null });
      return undefined;
    }
    const control = new AbortController();
    setCerca((previ) => ({ ...previ, cercant: true }));
    const rellotge = setTimeout(() => {
      Promise.resolve()
        .then(() => cercaCandidats(orgId, consulta, { signal: control.signal, membres: membresRef.current }))
        .then((candidats) => {
          if (!control.signal.aborted) setCerca({ cercant: false, candidats: Array.isArray(candidats) ? candidats : [], per: consulta });
        })
        .catch((error) => {
          if (control.signal.aborted || esCancel(error)) return;
          // Sense recompte: l'error ja s'anuncia (role=alert).
          setCerca({ cercant: false, candidats: [], per: null });
          setMissatge({ tipus: 'error', text: textDError(error, tradueix(tRef.current, TEXTOS_MEMBRES.errorCerca), tRef.current) });
        });
    }, ESPERA_CERCA);
    return () => { clearTimeout(rellotge); control.abort(); };
  }, [consulta, orgId, cercaCandidats]);

  /* Qui ja és membre no s'oferix (tampoc el que s'acaba d'afegir). */
  const candidats = useMemo(() => {
    const ja = new Set(estat.membres.map(clauDeMembre));
    return cerca.candidats.filter((candidat) => !ja.has(clauDeMembre(candidat)));
  }, [cerca.candidats, estat.membres]);
  const candidat = candidats.find((c) => clauDeMembre(c) === triat) || null;
  /* Només la propietària nomena administradores, i una organització sempre és membre. */
  const potTriarRol = propietaria && candidat?.tipus !== 'organitzacio';

  /* L'etiqueta traduïda d'un tipus i d'un rol (un rol desconegut es pinta com a membre, com abans). */
  const etiquetaTipus = (tipus) => {
    const parell = parellDeTipus(tipus);
    return parell ? tradueix(t, parell) : '';
  };
  const etiquetaRol = (rol) => tradueix(t, parellDeRol(rol) ?? PARELLS_ROL.member);
  const senseNom = tradueix(t, TEXTOS_MEMBRES.senseNom);

  const opcionsCandidat = [
    {
      valor: '',
      etiqueta: tradueix(t, consulta.length < MINIM_CERCA ? TEXTOS_MEMBRES.opcioEscriu
        : cerca.cercant ? TEXTOS_MEMBRES.opcioCercant
          : candidats.length ? TEXTOS_MEMBRES.opcioTria : TEXTOS_MEMBRES.opcioCap),
    },
    ...candidats.map((c) => ({ valor: clauDeMembre(c), etiqueta: `${c.nom || senseNom} · ${etiquetaTipus(c.tipus)}` })),
  ];
  const opcionsRol = ROLS_D_ALTA.map((valor) => ({ valor, etiqueta: etiquetaRol(valor) }));

  /* P1-15 (assalt 261101) · El selector de candidats canvia en silenci: el
     recompte s'anuncia en una regió viva sense rol (role=status ja és l'avís
     d'èxit, i n'hi ha d'haver un de sol). Res mentre es cerca ni per a una
     consulta que ja no és la del camp. */
  const anunciCerca = cerca.cercant || cerca.per === null || cerca.per !== consulta ? ''
    : omple(tradueix(t, candidats.length === 0 ? TEXTOS_MEMBRES.anunciCapResultat
      : candidats.length === 1 ? TEXTOS_MEMBRES.anunciUnResultat : TEXTOS_MEMBRES.anunciResultats),
    { n: candidats.length, consulta });

  /* Una operació a la vegada: la guarda, el missatge i el «Treballant…».
     `feina` rep `vigent()`: cert mentre el component viu i l'operació no ha
     quedat enrere per un canvi d'entitat (P1-15). Només l'operació vigent
     allibera la guarda: la d'A no allibera la que B haja començat després. */
  async function opera(clau, feina, textError) {
    if (ocupatRef.current) return;
    const op = {};
    opActual.current = op;
    const vigent = () => viu.current && opActual.current === op;
    ocupatRef.current = true;
    setOcupat(clau);
    setMissatge(null);
    try {
      const exit = await feina(vigent);
      if (vigent() && exit) setMissatge({ tipus: 'exit', text: exit });
    } catch (error) {
      if (vigent() && !esCancel(error)) setMissatge({ tipus: 'error', text: textDError(error, textError, tRef.current) });
    } finally {
      if (opActual.current === op) {
        opActual.current = null;
        ocupatRef.current = false;
        if (viu.current) setOcupat(null);
      }
    }
  }

  const posaMembre = (desat) => setEstat((previ) => ({
    ...previ,
    membres: ordenaMembres([...previ.membres.filter((m) => clauDeMembre(m) !== clauDeMembre(desat)), desat]),
  }));

  function afegeix(e) {
    e?.preventDefault?.();
    if (!candidat) return undefined;
    const dades = { tipus: candidat.tipus, id: candidat.id, rol: potTriarRol ? rolNou : 'member' };
    return opera('afegeix', async (vigent) => {
      const desat = await desaMembre(orgId, dades);
      if (!vigent()) return null;
      posaMembre(desat);
      setTriat('');
      setText('');
      setRolNou('member');
      return omple(tradueix(t, TEXTOS_MEMBRES.afegit), { nom: desat?.nom || candidat.nom, org: nomOrg });
    }, tradueix(t, TEXTOS_MEMBRES.errorAfegeix));
  }

  function canviaRol(membre, rol) {
    return opera(`rol:${clauDeMembre(membre)}`, async (vigent) => {
      const desat = await desaMembre(orgId, { tipus: membre.tipus, id: membre.id, rol });
      if (!vigent()) return null;
      posaMembre(desat);
      return omple(tradueix(t, rol === 'admin' ? TEXTOS_MEMBRES.ascendit : TEXTOS_MEMBRES.descendit), { nom: membre.nom, org: nomOrg });
    }, tradueix(t, TEXTOS_MEMBRES.errorRol));
  }

  /* Correcció 261008 · La confirmació es tanca sempre, també si falla (com
     «Eixir» a DetallAjust): el missatge es pinta fora del <dialog> modal, i
     amb ell obert l'error quedaria inert i amagat darrere. El missatge i el
     focus els posa l'efecte «després de tancar» (dalt), no opera(). */
  function obriLleva(membre) {
    orgDeLaConfirmacio.current = orgId;
    setALlevar(membre);
  }

  function confirmaLleva() {
    const membre = aLlevar;
    if (!membre) return undefined;
    /* P1-15 · La baixa és de l'entitat on es va obrir la confirmació: si ja
       se'n veu una altra, no es lleva res (mai un membre d'A a B). */
    const orgDeLaBaixa = orgDeLaConfirmacio.current;
    if (orgDeLaBaixa !== orgId) {
      setALlevar(null);
      return undefined;
    }
    return opera('lleva', async (vigent) => {
      try {
        await llevaMembre(orgDeLaBaixa, { tipus: membre.tipus, id: membre.id });
        if (!vigent()) return null;
        setEstat((previ) => ({ ...previ, membres: previ.membres.filter((m) => clauDeMembre(m) !== clauDeMembre(membre)) }));
        despresDeTancar.current = {
          missatge: { tipus: 'exit', text: omple(tradueix(t, TEXTOS_MEMBRES.llevat), { nom: membre.nom, org: nomOrg }) },
          focusALaLlista: true,
        };
      } catch (error) {
        if (esCancel(error)) throw error;
        if (vigent()) despresDeTancar.current = { missatge: { tipus: 'error', text: textDError(error, tradueix(tRef.current, TEXTOS_MEMBRES.errorLleva), tRef.current) } };
      } finally {
        /* Una baixa d'A que torna tard no tanca la confirmació que B haja obert. */
        if (vigent()) setALlevar(null);
      }
      return null;
    }, tradueix(t, TEXTOS_MEMBRES.errorLleva));
  }

  const tancaLleva = () => { if (!ocupatRef.current) setALlevar(null); };

  /* IDEA-24 (marató 261101_2143, B4) · TRANSFERIR LA PROPIETAT. Només la
     propietària d'un grup o d'una empresa, sobre una altra persona membre
     (membresModel.js), amb el port que en sap i un servidor que no ha dit
     NO-DISPONIBLE. La confirmació és destructiva (el focus a «Cancel·lar») i
     diu què canvia abans del clic. La cessió és de l'entitat on es va obrir
     (P1-15) i el missatge es pinta després de tancar-la, com la baixa.
     Confirmada pel port, la llista canvia els dos rols i esta persona deixa
     d'oferir el que ara és de la propietària. */
  const potTransferir = (membre) => typeof transfereixPropietat === 'function' && !senseTransferencia
    && potTransferirPropietat(membre, { rolMeu, jo: usuariId, kind });

  function obriTransfereix(membre) {
    orgDeLaTransferencia.current = orgId;
    setATransferir(membre);
  }

  function confirmaTransfereix() {
    const membre = aTransferir;
    if (!membre) return undefined;
    const orgDeLaCessio = orgDeLaTransferencia.current;
    if (orgDeLaCessio !== orgId || typeof transfereixPropietat !== 'function') {
      setATransferir(null);
      return undefined;
    }
    return opera('transfereix', async (vigent) => {
      try {
        await transfereixPropietat(orgDeLaCessio, { tipus: membre.tipus, id: membre.id });
        /* Ja és cedida al servidor: encara que ara es veja una altra entitat, esta no la torna a oferir. */
        if (viu.current) setCedides((previ) => new Set(previ).add(String(orgDeLaCessio)));
        if (!vigent()) return null;
        setEstat((previ) => ({
          ...previ,
          membres: ordenaMembres(previ.membres.map((m) => {
            if (clauDeMembre(m) === clauDeMembre(membre)) return { ...m, rol: 'owner' };
            if (m.tipus === 'persona' && usuariId != null && String(m.id) === String(usuariId)) return { ...m, rol: 'admin' };
            return m;
          })),
        }));
        despresDeTancar.current = {
          missatge: { tipus: 'exit', text: omple(tradueix(t, TEXTOS_MEMBRES.transferit), { nom: membre.nom || senseNom, org: nomOrg }) },
          focusALaLlista: true,
        };
      } catch (error) {
        if (esCancel(error)) throw error;
        /* Un servidor sense la RPC: ja no s'oferix en cap entitat (és cosa del servidor). */
        if (error?.code === 'NO-DISPONIBLE' && viu.current) setSenseTransferencia(true);
        if (vigent()) {
          despresDeTancar.current = {
            missatge: { tipus: 'error', text: textDErrorTransferencia(error, tradueix(tRef.current, TEXTOS_MEMBRES.errorTransfereix), tRef.current) },
          };
        }
      } finally {
        /* Una cessió d'A que torna tard no tanca la confirmació que B haja obert. */
        if (vigent()) setATransferir(null);
      }
      return null;
    }, tradueix(t, TEXTOS_MEMBRES.errorTransfereix));
  }

  const tancaTransfereix = () => { if (!ocupatRef.current) setATransferir(null); };

  /* Correcció 261008 · L'alta només s'oferix amb la llista llegida: si el
     servidor ja ha dit que no (NO-DISPONIBLE, SDP-ORGMEM-002…), el formulari
     prometria el que fallarà; i mentre es llig, la cerca no sabria qui ja hi és. */
  const llistaLlegida = !estat.carregant && !estat.error;

  return (
    <div ref={arrel}>
      {missatge ? (
        <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'} role={missatge.tipus === 'exit' ? 'status' : 'alert'}>
          {missatge.text}
        </p>
      ) : null}

      {estat.carregant ? (
        <p className="sdp-buit" role="status">{tradueix(t, TEXTOS_MEMBRES.carregant)}</p>
      ) : estat.error ? (
        <p className="sdp-camp__error" role="alert">{estat.error}</p>
      ) : estat.membres.length ? (
        <Taula titol={omple(tradueix(t, TEXTOS_MEMBRES.taula), { org: nomOrg })}>
          <thead>
            <tr>
              <th scope="col">{tradueix(t, TEXTOS_MEMBRES.colMembre)}</th>
              <th scope="col">{tradueix(t, TEXTOS_MEMBRES.colTipus)}</th>
              <th scope="col">{tradueix(t, TEXTOS_MEMBRES.colRol)}</th>
              <th scope="col">{tradueix(t, TEXTOS_MEMBRES.colAccions)}</th>
            </tr>
          </thead>
          <tbody>
            {estat.membres.map((membre) => {
              const clau = clauDeMembre(membre);
              const sobre = accionsSobre(membre, { rolMeu, jo: usuariId });
              const esJo = membre.tipus === 'persona' && usuariId != null && String(membre.id) === String(usuariId);
              /* IDEA-24 · «Transferir la propietat», entre el canvi de rol i «Llevar». */
              const cedible = potTransferir(membre);
              return (
                <tr key={clau}>
                  <td>
                    <AvatarResolt nom={membre.nom} src={membre.avatar || null} mida="sm" llavor={membre.id} alt="" titol="" />
                    {' '}{membre.nom || senseNom}{esJo ? ` ${tradueix(t, TEXTOS_MEMBRES.tu)}` : ''}
                  </td>
                  <td>{etiquetaTipus(membre.tipus)}</td>
                  <td>{etiquetaRol(membre.rol)}</td>
                  <td>
                    {sobre.rol || sobre.lleva || cedible ? (
                      <div className="sdp-alerta__accions">
                        {sobre.rol ? (
                          <Boto varietat="secundari" onClick={() => canviaRol(membre, sobre.rol)}
                            disabled={Boolean(ocupat)} carregant={ocupat === `rol:${clau}`}
                            aria-label={`${tradueix(t, sobre.rol === 'admin' ? TEXTOS_MEMBRES.nomenaAdmin : TEXTOS_MEMBRES.tornaMembre)}: ${membre.nom}`}>
                            {tradueix(t, sobre.rol === 'admin' ? TEXTOS_MEMBRES.nomenaAdmin : TEXTOS_MEMBRES.tornaMembre)}
                          </Boto>
                        ) : null}
                        {cedible ? (
                          <Boto varietat="secundari" onClick={() => obriTransfereix(membre)} disabled={Boolean(ocupat)}
                            aria-label={`${tradueix(t, TEXTOS_MEMBRES.transfereix)}: ${membre.nom || senseNom}`}>
                            {tradueix(t, TEXTOS_MEMBRES.transfereix)}
                          </Boto>
                        ) : null}
                        {sobre.lleva ? (
                          <Boto varietat="perill" onClick={() => obriLleva(membre)} disabled={Boolean(ocupat)}
                            aria-label={`${tradueix(t, TEXTOS_MEMBRES.lleva)}: ${membre.nom}`}>
                            {tradueix(t, TEXTOS_MEMBRES.lleva)}
                          </Boto>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Taula>
      ) : (
        <p className="sdp-buit">{tradueix(t, TEXTOS_MEMBRES.buit)}</p>
      )}

      {llistaLlegida ? (
        <form onSubmit={afegeix} noValidate>
          <GrupCamps llegenda={tradueix(t, TEXTOS_MEMBRES.afegirLlegenda)}>
            <Camp etiqueta={tradueix(t, TEXTOS_MEMBRES.cerca)}
              ajuda={omple(tradueix(t, TEXTOS_MEMBRES.cercaAjuda), { n: MINIM_CERCA })}>
              <CampText tipus="search" value={text} onChange={(e) => { setText(e.target.value); setTriat(''); }}
                autoComplete="off" maxLength={80} />
            </Camp>
            <Camp etiqueta={tradueix(t, TEXTOS_MEMBRES.quiAfegir)}>
              <Selector value={triat} onChange={(e) => setTriat(e.target.value)} opcions={opcionsCandidat}
                disabled={!candidats.length} />
            </Camp>
            {/* P1-15 · El recompte dels candidats (fora de la vista: .sdp-nomes-lector és absolut i no suma gap). */}
            <p className="sdp-nomes-lector" aria-live="polite">{anunciCerca}</p>
            {potTriarRol ? (
              <Camp etiqueta={tradueix(t, TEXTOS_MEMBRES.colRol)}>
                <Selector value={rolNou} onChange={(e) => setRolNou(e.target.value)} opcions={opcionsRol} />
              </Camp>
            ) : null}
            <div className="sdp-alerta__accions">
              <Boto varietat="primari" tipus="submit" disabled={!candidat || Boolean(ocupat)} carregant={ocupat === 'afegeix'}>
                {tradueix(t, TEXTOS_MEMBRES.afegir)}
              </Boto>
            </div>
          </GrupCamps>
        </form>
      ) : null}

      {/* IDEA-22, punt 2 · Només la propietària tria si es mostra com a titular a Connectar. */}
      {propietaria ? <TriaTitular orgId={orgId} nomOrg={nomOrg} /> : null}

      {/* T6b (IDEA-14; decisió del Mestre, 261024) · El veïnat connectat amb l'organització (P1-11, abans «Qui seguix»):
          la constància per a qui l'administra. Sense la capacitat
          'seguiments', res. */}
      <QuiSegueixOrganitzacio orgId={orgId} nom={nomOrg} />

      <DialegConfirmacio
        obert={Boolean(aLlevar)}
        onTanca={tancaLleva}
        onConfirma={confirmaLleva}
        titol={aLlevar
          ? omple(tradueix(t, aLlevar.nom ? TEXTOS_MEMBRES.dialegTitol : TEXTOS_MEMBRES.dialegTitolSenseNom), { nom: aLlevar.nom, org: nomOrg })
          : tradueix(t, TEXTOS_MEMBRES.dialegTitolBuit)}
        descripcio={tradueix(t, TEXTOS_MEMBRES.dialegDescripcio)}
        etiquetaConfirma={tradueix(t, TEXTOS_MEMBRES.lleva)}
        etiquetaCancela={tradueix(t, TEXTOS_MEMBRES.cancela)}
        destructiu
        carregant={ocupat === 'lleva'}
      />

      {/* IDEA-24 · La confirmació de la transferència, destructiva: el focus inicial a «Cancel·lar». */}
      <DialegConfirmacio
        obert={Boolean(aTransferir)}
        onTanca={tancaTransfereix}
        onConfirma={confirmaTransfereix}
        titol={aTransferir
          ? omple(tradueix(t, TEXTOS_MEMBRES.dialegTransfereixTitol), { nom: aTransferir.nom || senseNom, org: nomOrg })
          : tradueix(t, TEXTOS_MEMBRES.dialegTransfereixTitolBuit)}
        descripcio={omple(tradueix(t, TEXTOS_MEMBRES.dialegTransfereixDescripcio), { nom: aTransferir?.nom || senseNom })}
        etiquetaConfirma={tradueix(t, TEXTOS_MEMBRES.transfereix)}
        etiquetaCancela={tradueix(t, TEXTOS_MEMBRES.cancela)}
        destructiu
        carregant={ocupat === 'transfereix'}
      />
    </div>
  );
}

export default GestioMembres;
