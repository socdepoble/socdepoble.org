import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getCurrentUser, listMyOrganizations, updateOrganization, updateProfile,
  updateUserPassword, getProfile, teCapacitat, uploadToStorage,
  listMyAgents, updateAgent,
  llegeixContacteOrganitzacio, desaContacteOrganitzacio,
} from '../../data/backendPort.js';
import { creaOrganitzacio as creaOrganitzacioAlServei } from '../../data/organizations.js';

import { useSession } from '../../app/contexts/SessionContext.jsx';
import { backendScope } from '../../config/backendConfig.js';
import { capturaSessio, entradaSessio } from '../../data/identitat.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { normalitzaContacte } from '../../data/correuOrganitzacio.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { esRolQueMana, etiquetaDeRol } from '../../components/universal/identitat/rols.js';
import { ERROR_CORREU_INVALID, SENSE_CAPACITAT_CORREU, textAjudaCorreu, validaCorreu } from './contacteOrganitzacio.js';

const PerfilContext = createContext(null);

/* La capacitat 'agents' és nova al port: un backend (o un mock de proves) que
   no la declare no ha de fer caure el perfil ni en llegir-ne el nom. */
function agentsDelPort() {
  try { return typeof listMyAgents === 'function' ? listMyAgents : null; } catch { return null; }
}

/* T43 (ordre del Mestre, 260928) · El correu de l'organització és una
   capacitat opcional ('contacteOrganitzacio'): sense ella, cap crida, i
   «El compte» ho diu. Mateix blindatge que els agents. */
function contacteDelPort() {
  try {
    if (!teCapacitat('contacteOrganitzacio')) return null;
    return typeof llegeixContacteOrganitzacio === 'function' && typeof desaContacteOrganitzacio === 'function'
      ? { llegeix: llegeixContacteOrganitzacio, desa: desaContacteOrganitzacio }
      : null;
  } catch { return null; }
}

/* L'estat del correu d'una organització quan la lectura falla. Un esquema
   absent (NO-DISPONIBLE) es diu amb el motiu de l'adaptador, mai l'error cru. */
function contacteFallat(error) {
  if (error?.code === 'NO-DISPONIBLE') return { estat: 'no-disponible', motiu: error.message };
  if (error?.code === 'SDP-ORGMAIL-001') return { estat: 'no-disponible', motiu: 'Només qui administra aquesta organització pot vore el seu correu.' };
  return { estat: 'error', motiu: 'No s’ha pogut llegir el correu de l’organització. Torna-ho a provar més tard.' };
}

export function usePerfil() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil fora de PerfilProvider');
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════════
   CATÀLEG D'AJUSTOS

   Cada fila declara si està oberta i, si no ho està, per què. La
   interfície no pot prometre res que el contracte del servidor no
   complisca: un botó que fa `permission denied` en silenci és pitjor
   que una fila desactivada amb el motiu escrit.

   `tipus` diu QUIN giny pinta DetallAjust ('text' | 'area' |
   'password' | 'imatge' | 'boolean' | 'accio'). La UI mai més
   endevina per l'id: afegir un ajust nou no requereix tocar DetallAjust.

   `pendent` (només accions) = el backend encara no la té: es pinta
   desactivada i honesta, mai prometuda.

   `lloc` diu on viu l'ajust: 'fitxa' (el pinta l'Editor Universal de
   PerfilEditor) o 'compte' (formularis de DetallCompte).
   ═══════════════════════════════════════════════════════════════════ */

export function ajustosPersona(perfil = {}) {
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'full_name', tipus: 'text', valor: perfil.full_name || '', obert: true },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: perfil.avatar_url || '', obert: true },
    { id: 'correu', lloc: 'compte', titol: 'Correu electrònic', tipus: 'text', valor: perfil.email || '', obert: false,
      motiu: 'El correu identifica el compte. Es canvia des d’Accedir.' },
    /* Amb una baixa en curs el servidor té el perfil congelat (política
       «profiles sense baixa»), com la fitxa: cap desat arribaria. */
    { id: 'privacitat', lloc: 'compte', titol: 'Estat del perfil', camp: 'is_public', tipus: 'boolean',
      casella: 'Perfil públic',
      valor: Boolean(perfil.is_public), obert: !perfil.baixa_demanada_at,
      motiu: perfil.baixa_demanada_at
        ? 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».'
        : 'Tria si vols ser visible a la gent del poble o mantindre el compte privat.' },
    { id: 'contrasenya', lloc: 'compte', titol: 'Contrasenya', tipus: 'password', valor: '******', obert: true },
    { id: 'sessio', lloc: 'compte', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true },
  ];
}

/**
 * T43 (ordre del Mestre, 260928) · Els dos ajustos del correu opcional de
 * l'organització. El VALOR només arriba a qui l'administra i només quan el
 * servidor l'ha llegit: DetallAjust pinta el valor d'un ajust tancat, i un
 * membre no l'ha de vore mai (RGPD, minimització).
 */
function ajustosCorreu(mana, contacte) {
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  const llest = mana && contacte?.estat === 'llest';
  const motiu = !mana ? tancat
    : contacte?.estat === 'carregant' || !contacte ? 'Carregant el correu de l’organització…'
      : contacte.motiu || SENSE_CAPACITAT_CORREU;
  const correu = llest ? contacte.correu || '' : '';
  return [
    { id: 'correu', lloc: 'compte', titol: 'Correu de l’organització', tipus: 'correu', valor: correu,
      obert: llest, motiu, ajuda: llest ? textAjudaCorreu(contacte.perDefecte) : undefined },
    { id: 'correu-public', lloc: 'compte', titol: 'Correu a la fitxa pública', tipus: 'boolean',
      casella: 'Mostrar el correu a la fitxa pública',
      valor: llest ? Boolean(contacte.public) : false,
      obert: llest && Boolean(correu),
      motiu: llest ? 'Primer desa un correu de l’organització.' : motiu,
      ajuda: llest
        ? 'Si el mostres, qualsevol que obri la fitxa el podrà llegir. Per a parlar amb l’organització sempre queda el xat.'
        : undefined },
  ];
}

export function ajustosOrganitzacio(org = {}, contacte = org.contacte) {
  const mana = esRolQueMana(org.role);
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'name', tipus: 'text', valor: org.name || '', obert: mana, motiu: tancat },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto / Logotip', camp: 'logo_url', tipus: 'imatge', valor: org.logo_url || '', obert: mana, motiu: tancat },
    { id: 'lema', lloc: 'fitxa', titol: 'Lema', camp: 'lema', tipus: 'text', valor: org.lema || '', obert: mana, motiu: tancat },
    { id: 'descripcio', lloc: 'fitxa', titol: 'Descripció', camp: 'description', tipus: 'area', valor: org.description || '', obert: mana, motiu: tancat },
    ...ajustosCorreu(mana, contacte),
    { id: 'membres', lloc: 'compte', titol: 'Membres', tipus: 'accio', accio: 'membres', pendent: true, obert: mana, motiu: tancat },
    { id: 'identificador', lloc: 'compte', titol: 'Identificador', tipus: 'text', valor: org.slug || '', obert: false,
      motiu: 'L’identificador és permanent: hi ha enllaços publicats que hi apunten.' },
    /* Pendent fins a I7: hui la ruta pública no troba cap organització real. */
    { id: 'fitxa', lloc: 'compte', titol: 'Fitxa pública', tipus: 'accio', accio: 'obrir-fitxa', pendent: true,
      valor: `/${org.kind === 'group' ? 'grup' : 'empresa'}/${org.slug}`, obert: true },
    { id: 'eixir', lloc: 'compte', titol: 'Eixir de l’organització', tipus: 'accio', accio: 'eixir', pendent: true,
      obert: org.role !== 'owner',
      motiu: 'Qui és propietari no pot eixir-se’n: primer ha de traspassar la propietat.' },
  ];
}

/**
 * `onCanviOrganitzacions` s'avisa quan es crea o es modifica una
 * organització: PerfilShell hi passa el refresh d'IdentitatContext perquè
 * el selector d'identitat no quede desfasat fins a recarregar.
 */
export function PerfilProvider({ children, config = {}, onCanviOrganitzacions }) {
  /* L'àmbit és l'ENTRADA, no la generació del servei: la renovació horària del JWT
     mou la generació però és la mateixa sessió, i desmuntar ací perdria el que
     s'estava escrivint a la fitxa. useSession fa que es torne a calcular. */
  const { currentUser } = useSession();
  const scope = JSON.stringify([currentUser?.id, entradaSessio(), backendScope(config), config.auth?.issuer]);
  return (
    <PerfilScope key={scope} config={config} usuariId={currentUser?.id ?? null} usuariSessio={currentUser ?? null} onCanviOrganitzacions={onCanviOrganitzacions}>
      {children}
    </PerfilScope>
  );
}

/* T47 · La clau d'una fila confirmada per la cua: la persona és una sola
   (l'editor li diu 'jo'); una organització o un agent, pel seu id. */
const clauConfirmada = (entitat, id) => (entitat === ENTITATS_FITXA.persona ? entitat : `${entitat}\u0000${String(id)}`);
const ambConfirmades = (confirmades, entitat, fila) => {
  const canvis = fila ? confirmades.get(clauConfirmada(entitat, fila.id)) : null;
  return canvis ? { ...fila, ...canvis } : fila;
};

function PerfilScope({ children, config, usuariId, usuariSessio, onCanviOrganitzacions }) {
  /* capturaSessio: eixir, tornar a entrar o canviar de compte avorten; renovar, no. */
  const [owner] = useState(capturaSessio);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const assertCurrent = useCallback(() => {
    if (!mounted.current) throw new DOMException('La sessió del perfil ha canviat.', 'AbortError');
    owner();
  }, [owner]);
  /* T47 (ordre del Mestre, 260928) · L'àmbit dels esborranys de la fitxa:
     backend + la persona de la sessió de React, la mateixa id que la clau de
     PerfilProvider (que el remunta si canvia la sessió o el backend). No es
     llig del port: amb el JWT caducat mentre es renova, getCurrentUser() diu
     null i els esborranys anirien a un àmbit que cap sessió no té. */
  const [ambit] = useState(() => ambitDe(config, usuariId));
  const [usuari, setUsuari] = useState(null);
  const [dadesPerfil, setDadesPerfil] = useState(null);
  const [organitzacions, setOrganitzacions] = useState([]);
  /* Lògica d'Usuari (T4): els agents IA que la persona administra (la IAIA). */
  const [agents, setAgents] = useState([]);
  /* T43 (ordre del Mestre, 260928) · El correu de cada organització que la
     persona administra: { [orgId]: { estat, correu, public, perDefecte, motiu } }.
     Viu a banda de les identitats: la fitxa (l'editor) no canvia quan arriba. */
  const [contactes, setContactes] = useState({});
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState(null);

  /* `config` canvia d'identitat a cada render del pare. El patró del
     "ref actual" ens deixa usar-la dins dels callbacks sense fer-los
     inestables. */
  const configRef = useRef(config);
  configRef.current = config;
  const avisaRef = useRef(onCanviOrganitzacions);
  avisaRef.current = onCanviOrganitzacions;
  /* T47 (correcció de la revisió, 260928) · Amb el JWT caducat en muntar, el
     port diu «ningú» fins que la renovació aterra: la persona de la sessió de
     React (la mateixa id, la clau del PerfilProvider) és la reserva, i «El
     compte» mostra el correu sense esperar la pròxima lectura. */
  const usuariSessioRef = useRef(usuariSessio);
  usuariSessioRef.current = usuariSessio;
  const avisaOrganitzacions = useCallback(() => {
    try { avisaRef.current?.(); } catch (e) { console.warn('[PerfilContext] Avís d’organitzacions:', e); }
  }, []);

  /* `recarrega` torna a llegir perfil i organitzacions sense tornar a la
     pantalla de càrrega (p. ex. després de cancel·lar una baixa, quan el
     servidor ha restaurat el perfil). */
  const [versioDades, setVersioDades] = useState(0);
  const recarrega = useCallback(() => setVersioDades((v) => v + 1), []);

  /* T47 (ordre del Mestre, 260928) · Les columnes que la cua confirma MENTRE
     es llig el perfil. La lectura pot ser d'abans del PATCH: aplicada tal
     qual, trepitjaria el que el servidor ja té, i l'esborrany ja s'ha oblidat
     perquè està confirmat (l'editor naixeria amb el valor vell: «l'entradilla
     s'ha esborrat»). Es fusionen damunt de la lectura. null fora de càrrega. */
  const confirmadesRef = useRef(null);

  // Cada scope té estat propi: el pare el desmunta en canviar sessió o backend.
  useEffect(() => {
    let viu = true;
    const confirmades = new Map();
    confirmadesRef.current = confirmades;
    const tancaCaptura = () => { if (confirmadesRef.current === confirmades) confirmadesRef.current = null; };
    setUsuari(getCurrentUser() ?? usuariSessioRef.current ?? null);

    /* Els agents són una capacitat opcional: sense ella, cap crida i cap grup.
       Una fallada seua no tomba el perfil (llista buida i avís a la consola). */
    const llistaAgentsDelPort = agentsDelPort();
    const agentsPromesa = llistaAgentsDelPort && teCapacitat('agents')
      ? Promise.resolve().then(() => llistaAgentsDelPort(configRef.current)).catch((e) => {
        console.warn('[PerfilContext] Agents IA no disponibles:', e?.message);
        return [];
      })
      : Promise.resolve([]);
    /* T47 · Els esborranys d'este dispositiu es carreguen en la mateixa espera
       que el perfil: l'editor no es pinta fins que els té, i així cap
       esborrany arriba tard damunt d'un camp que ja s'està escrivint (A2). */
    Promise.all([
      listMyOrganizations(configRef.current),
      getProfile(configRef.current),
      agentsPromesa,
      cuaDesament.hidrata(),
    ])
      .then(([orgs, perfil, llistaAgents]) => {
        if (!viu) return;
        assertCurrent();
        tancaCaptura();
        setOrganitzacions(Array.isArray(orgs) ? orgs.map((o) => ambConfirmades(confirmades, ENTITATS_FITXA.organitzacio, o)) : []);
        setAgents(Array.isArray(llistaAgents) ? llistaAgents.map((a) => ambConfirmades(confirmades, ENTITATS_FITXA.agent, a)) : []);
        setDadesPerfil(ambConfirmades(confirmades, ENTITATS_FITXA.persona, perfil));
        setError(null);
        /* El que va quedar pendent (una eixida sense xarxa, una pestanya
           tancada) torna a eixir ara, amb la sessió d'esta persona. */
        if (ambit) {
          cuaDesament.recordaContext(ambit, configRef.current);
          cuaDesament.repren(ambit);
        }
      })
      .catch((e) => {
        tancaCaptura();
        if (viu) setError(e?.message || "No s'han pogut carregar les dades del perfil.");
      })
      .finally(() => {
        if (viu) setCarregant(false);
      });

    return () => { viu = false; tancaCaptura(); };
  }, [assertCurrent, versioDades, ambit]);

  /* T43 · Les organitzacions que la persona administra, com a clau estable:
     només quan canvien es torna a llegir el correu. Un membre no el llig mai. */
  const orgsQueMana = useMemo(
    () => organitzacions.filter((o) => esRolQueMana(o.role)).map((o) => String(o.id)).join('\u0000'),
    [organitzacions],
  );
  useEffect(() => {
    const ids = orgsQueMana ? orgsQueMana.split('\u0000') : [];
    /* T43b-4 · Si ja no n'administra cap, el correu d'abans no es guarda (RGPD). */
    if (!ids.length) {
      setContactes((previ) => (Object.keys(previ).length ? {} : previ));
      return undefined;
    }
    const port = contacteDelPort();
    if (!port) {
      setContactes(Object.fromEntries(ids.map((id) => [id, { estat: 'no-disponible', motiu: SENSE_CAPACITAT_CORREU }])));
      return undefined;
    }
    let viu = true;
    setContactes((previ) => Object.fromEntries(ids.map((id) => [id, previ[id] || { estat: 'carregant' }])));
    for (const id of ids) {
      Promise.resolve()
        .then(() => port.llegeix(id, configRef.current))
        .then((contacte) => {
          if (!viu) return;
          assertCurrent();
          setContactes((previ) => ({ ...previ, [id]: { estat: 'llest', ...normalitzaContacte(contacte) } }));
        })
        .catch((e) => {
          if (!viu || e?.name === 'AbortError') return;
          setContactes((previ) => ({ ...previ, [id]: contacteFallat(e) }));
        });
    }
    return () => { viu = false; };
  }, [orgsQueMana, versioDades, assertCurrent]);

  /* La fila de `profiles` no porta el correu: el pren de la sessió perquè
     «El compte» el puga mostrar. */
  const dadesPersona = useMemo(() => (
    dadesPerfil && !dadesPerfil.email && usuari?.email ? { ...dadesPerfil, email: usuari.email } : dadesPerfil
  ), [dadesPerfil, usuari]);

  const identitats = useMemo(() => ([
    {
      id: 'jo',
      mena: 'persona',
      nom: dadesPerfil?.full_name || usuari?.user_metadata?.name || usuari?.user_metadata?.full_name || 'El meu compte',
      avatar: dadesPerfil?.avatar_url || usuari?.user_metadata?.avatar_url,
      rol: 'Persona',
      dades: dadesPersona,
    },
    ...organitzacions.map((o) => ({
      id: o.id,
      mena: o.kind === 'group' ? 'grup' : 'empresa',
      nom: o.name,
      avatar: o.logo_url,
      rol: etiquetaDeRol(o.role) || 'Membre',
      dades: o,
    })),
    ...agents.map((a) => ({
      id: a.id,
      mena: 'agent',
      nom: a.name,
      avatar: a.avatar_url,
      rol: 'Agent IA',
      dades: a,
    })),
  ]), [usuari, organitzacions, agents, dadesPerfil, dadesPersona]);

  /* ⚰️ ELIMINAT (auditoria): identitatId, ajustId, triaIdentitat,
     triaAjust, identitat, ajustos i ajust. Era el sistema de navegació
     paral·lel que la plantilla ja havia substituït però seguia viu i
     descrivint-se com a vigent — i va fer que guardarAjust escriguera
     a la identitat equivocada. La selecció viu al Manager; este context
     només dóna DADES i ACCIONS. */

  /* T47 (ordre del Mestre, 260928) · Una escriptura confirmada fusiona NOMÉS
     les columnes que ha escrit, mai la fila sencera que torna el servidor:
     la resposta tardana d'un desat (el PATCH de l'H2 espera el PUT de
     GoTrue) portava el lema d'abans i tornava enrere l'entradilla ja desada. */
  const aplicaColumnes = useCallback((entitat, id, canvis) => {
    /* Mentre es llig el perfil, la confirmació també s'anota per a fusionar-la
       damunt de la lectura (confirmadesRef). Sense fila encara, no se n'inventa
       cap de parcial: l'estat buit es queda buit. */
    const captura = confirmadesRef.current;
    if (captura) {
      const clau = clauConfirmada(entitat, id);
      captura.set(clau, { ...captura.get(clau), ...canvis });
    }
    if (entitat === ENTITATS_FITXA.persona) {
      setDadesPerfil((prev) => (prev ? { ...prev, ...canvis } : prev));
      setUsuari((prev) => (prev ? {
        ...prev,
        user_metadata: {
          ...(prev.user_metadata || {}),
          ...canvis,
          name: Object.hasOwn(canvis, 'full_name') ? canvis.full_name : prev.user_metadata?.name,
        },
      } : prev));
    } else if (entitat === ENTITATS_FITXA.agent) {
      setAgents((prev) => prev.map((a) => (String(a.id) === String(id) ? { ...a, ...canvis } : a)));
    } else {
      setOrganitzacions((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, ...canvis } : o)));
      avisaOrganitzacions();
    }
  }, [avisaOrganitzacions]);

  /* T47 · El que confirma la cua d'autodesament (encara que l'editor ja no
     hi siga) arriba ací, i la fitxa el veu en tornar a obrir-se. */
  useEffect(() => {
    if (!ambit) return undefined;
    return cuaDesament.quanConfirma((confirmat) => {
      if (confirmat.ambit === ambit) aplicaColumnes(confirmat.entitat, confirmat.id, confirmat.canvis);
    });
  }, [ambit, aplicaColumnes]);

  const guardarCampPerfil = useCallback(async (camp, valor, identitatObjectiuId) => {
    assertCurrent();
    if (identitatObjectiuId == null) {
      throw new Error('guardarCampPerfil: falta la identitat objectiu (tercer paràmetre, OBLIGATORI).');
    }
    const objectiu = identitats.find((item) => item.id === identitatObjectiuId);
    if (!objectiu) {
      throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);
    }

    if (objectiu.mena === 'persona') {
      await updateProfile({ [camp]: valor }, configRef.current);
      assertCurrent();
      aplicaColumnes(ENTITATS_FITXA.persona, objectiu.id, { [camp]: valor });
    } else if (objectiu.mena === 'agent') {
      await updateAgent(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      aplicaColumnes(ENTITATS_FITXA.agent, objectiu.id, { [camp]: valor });
    } else {
      await updateOrganization(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      aplicaColumnes(ENTITATS_FITXA.organitzacio, objectiu.id, { [camp]: valor });
    }
  }, [identitats, assertCurrent, aplicaColumnes]);

  /* Signatura TRENCADORA a propòsit: guardarAjust(identitat, ajust, valor). */
  const guardarAjust = useCallback(async (identitatObjectiuId, ajustId, valor) => {
    assertCurrent();
    const objectiu = identitats.find((i) => i.id === identitatObjectiuId);
    if (!objectiu) throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);

    if (objectiu.mena === 'agent') throw new Error('Un agent IA només té fitxa: s’edita des de «La fitxa».');
    const contacte = objectiu.mena === 'persona' ? null : contactes[String(objectiu.id)];
    const cataleg =
      objectiu.mena === 'persona'
        ? ajustosPersona(objectiu.dades || {})
        : ajustosOrganitzacio(objectiu.dades || {}, contacte);
    const ajust = cataleg.find((a) => a.id === ajustId);
    if (!ajust) throw new Error(`Ajust desconegut: ${String(ajustId)}`);
    if (!ajust.obert) throw new Error(ajust.motiu || 'Aquest ajust no es pot modificar.');
    if (ajust.tipus === 'accio') throw new Error("Les accions s'executen: no es desen.");

    if (objectiu.mena === 'persona' && ajust.id === 'contrasenya') {
      await updateUserPassword(valor, configRef.current);
      assertCurrent();
      return;
    }
    /* T43 · El correu de l'organització no és una columna de la fitxa: es
       desa amb la capacitat 'contacteOrganitzacio', correu i «públic» junts.
       Sense correu no hi ha res a publicar. */
    if (objectiu.mena !== 'persona' && (ajust.id === 'correu' || ajust.id === 'correu-public')) {
      const port = contacteDelPort();
      if (!port) throw new Error(SENSE_CAPACITAT_CORREU);
      const correu = ajust.id === 'correu' ? String(valor ?? '').trim() : contacte?.correu || '';
      if (correu && !validaCorreu(correu)) throw new Error(ERROR_CORREU_INVALID);
      const esPublic = (ajust.id === 'correu-public' ? Boolean(valor) : Boolean(contacte?.public)) && Boolean(correu);
      const desat = await port.desa(objectiu.id, { correu, public: esPublic }, configRef.current);
      assertCurrent();
      setContactes((previ) => ({ ...previ, [String(objectiu.id)]: { estat: 'llest', ...normalitzaContacte(desat) } }));
      return;
    }
    if (!ajust.camp) {
      throw new Error(`L'ajust "${ajust.id}" no té camp associat al catàleg.`);
    }
    await guardarCampPerfil(ajust.camp, valor, objectiu.id);
  }, [identitats, contactes, guardarCampPerfil, assertCurrent]);

  const creaOrganitzacio = useCallback(async (dades) => {
    assertCurrent();
    const creada = await creaOrganitzacioAlServei(dades, configRef.current, organitzacions);
    assertCurrent();
    /* El servidor pot tornar l'entitat existent en un reintent. Conservem
       el seu rol i una sola fila, sense convertir qui administra en propietari. */
    const anterior = organitzacions.find((org) => org.id === creada.id);
    const nova = { ...anterior, ...creada, role: creada.role || anterior?.role || 'owner' };
    setOrganitzacions((prev) => prev.some((org) => org.id === nova.id)
      ? prev.map((org) => org.id === nova.id ? { ...org, ...nova } : org)
      : [...prev, nova]);
    avisaOrganitzacions();
    return nova;
  }, [assertCurrent, avisaOrganitzacions, organitzacions]);

  const pujaMitja = useCallback(async (fitxer, carpeta = 'avatars') => {
    assertCurrent();
    if (!teCapacitat('mitjans')) return null;
    const res = await uploadToStorage(fitxer, { carpeta }, configRef.current);
    assertCurrent();
    return res.url;
  }, [assertCurrent]);

  /* Valor memoitzat + callbacks estables: els consumidors (i els
     useCallback que en depenguin) només es mouen quan canvien DADES,
     no quan canvia la identitat d'una funció. */
  /* T47 · On deixa l'editor els esborranys de la fitxa: l'àmbit i la
     configuració amb què la cua els enviarà (només en memòria). */
  const autodesament = useMemo(() => (ambit ? { ambit, context: config } : null), [ambit, config]);

  const valor = useMemo(() => ({
    usuari, identitats, contactes, carregant, error, autodesament,
    guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega,
  }), [usuari, identitats, contactes, carregant, error, autodesament, guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega]);

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
