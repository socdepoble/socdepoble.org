/**
 * ConnectarSection.jsx — «Connectar» qualsevol element (una casa, una faena,
 * un poble, una persona, una pàgina…) amb el MAS de qui mira (T5, T43).
 *
 *   · La connexió és una nota del Bloc que recorda d'on ve (`origen`): QUÈ és
 *     (objecte tipat, T43), secció, element, títol, qui el signa, la ruta
 *     per a tornar-hi i (D4) els drets de l'original. Naix a la carpeta
 *     triada (D1: la Safata d’Entrada per defecte), amb les categories i les
 *     etiquetes que es trien ací.
 *   · D1 (ordre del Mestre, 260930) · el verb d'esta vista és CONNECTAR.
 *     Sense sessió en remot no hi ha cap simulació: el botó porta a entrar
 *     (/registre) i torna ací; amb sessió i el Bloc carregant, el botó
 *     espera desactivat. Revisió (260930) · «cal entrar» es decidix amb el
 *     mode RESOLT (normalizeBackendConfig), un Bloc que ha fallat en carregar
 *     ho diu amb «Torna-ho a provar» (mai «Obrint el teu Bloc…» per sempre) i,
 *     mentre la font de l'original carrega, no es connecta.
 *   · D4 (excepció del Mestre, 260930; desfà T54) · Al MAS la connexió és una
 *     còpia editable (NotesDetail l'obri amb NotesEditor): es desen també el
 *     subtítol i l'entradeta de l'original resolt. «Tot el poble» es desa com
 *     a tria i el resum el deixa com a pas pendent: no ix sola. Si l'original
 *     porta els drets reservats («©»), ho diu una Alerta abans de connectar.
 *   · T54 · La mini-card resol la foto en local (detail/elementDeSeccio.js)
 *     amb sectionId + item_id: l'URL no porta cap imatge.
 *   · T43 (ordre del Mestre, 260928) · «Qui ho pot vore?» és una tria honesta
 *     (abastConnexio.js): Privada, Persones concretes i Grups (enviaments per
 *     xat, que no són permisos) i Tot el poble (compartir-la al Mur des del
 *     lector del MAS, T54: la gent registrada del poble, no Internet). La
 *     tria es desa a origen.abast i el resultat es mostra per destinatari
 *     (ResumConnexio).
 *   · T43 · D6: la connexió és sempre personal, encara que s'actue com a
 *     entitat, i es diu. D8: la vista viu dins d'una UniversalPage (H1 al seu
 *     lloc) i el seu CSS és al bloc T43 de css/modules.css; cap import de CSS.
 *   · El que arriba per URL (item_id, title, sectionId, targetUserId,
 *     autorTipus, author, objecte, ruta) ho escriu rutaConnectarObjecte
 *     (config/objecteConnectable.js), i ací no es creu res sense validar-ho.
 *   · T71 · La mini-card resol l'original amb useOriginalDeConnexio (també
 *     les pàgines de text: «L'Ànima de la IAIA» ix amb la seua foto). Quan es
 *     resol, el títol i l'autor són els de l'original, a la vista i a la
 *     memòria cau que es desa (títol i cos, per a la cerca i la caiguda del
 *     lector), mai els de l'URL (title, author). T71b · Tampoc la identitat
 *     de l'autor (targetUserId, autorTipus): o ve de l'original o no n'hi ha.
 *   · T71 · Amb `url` a la query (D10-A: o una adreça dins de `text`), el que
 *     es connecta és un contingut de FORA (contingutExtern.js): es mostra la
 *     url validada i només un clic el connecta, com una nota nova i editable
 *     a la Safata d’Entrada. Carregar la ruta no crea mai res. Una url que no
 *     és http o https no es connecta.
 *   · D4 · Els drets de l'original (origen.drets) només es prenen de
 *     l'element resolt (item.copyright), mai de l'URL.
 *   · IDEA-14 (Directiva del Mestre, 261024; auditoria Gemini G-04) · Tres
 *     camins separats, cadascun amb el seu botó: «Entre persones» (seguir i
 *     escriure a l'autor o a la persona o l'entitat d'un perfil,
 *     BlocRelacio), «Formar part» (la sol·licitud estructurada al xat de
 *     l'entitat, BlocFormarPart, i administrar-la, BlocAdministrarOrganitzacio)
 *     i «A les teues notes» (la connexió de sempre; abans «Al teu MAS», 261024
 *     correccions, Gemini G2-02). Des d'un perfil, el nom i l'id
 *     són els de la fitxa pública (useFitxaDeConnexio), mai els de l'URL.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { Check, Globe, Layers, X } from 'lucide-react';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotesData } from '../notes/NotesDataContext';
import { useXat } from '../xat/XatContext.jsx';
import { CARPETA_CONNECTATS, NOM_CARPETA_CONNECTATS, carpetesDelBloc, iconaDeCarpeta } from '../notes/carpetes.js';
import { autorDe, esRutaInterna, getSectionItemPath, objecteDe, objecteDePerfil, tipusDeSeccio, TIPUS_OBJECTE } from '../../config/navigation.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { ENTITATS_SEED, IAIA_ID, PERSONA_PILOT, aliesDeLActor, esComptePersonaPilot } from '../../data/identitatsSeed.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { esBackendInabastable } from '../../data/errorsBackend.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Boto, Camp, CampText, Carregant, Casella, Divisor, GrupCamps, GrupOpcions, UniversalCard } from '../../components/PedraSeca/index.js';
import { interlocutorDelPrivat, urlPerCompartir, useUbicacioApp } from '../../components/PedraSeca/hooks/useAccions.js';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { netejaDrets, normalitzaAbast, teDretsReservats } from '../../data/origenNota.js';
import { useOriginalDeConnexio } from '../detail/elementDeSeccio.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { categoriesBase } from '../../data/personalitzacio.js';
import { contingutExternDeParams, notaDeContingutExtern } from './contingutExtern.js';
import {
  ETIQUETA_OBJECTE, LIMIT_GRUPS, LIMIT_PERSONES, estatDelXat, grupsDeXat, missatgeDeConnexio,
  missatgeDeLError, modeAplicable, opcionsDAbast
} from './abastConnexio.js';
/* El cos que es desa a la nota: mòdul pur de connexions, el mateix que llig el lector del MAS. */
import { aHtml, contingutDeLaConnexio } from '../notes/connexions.js';
/* D4 · l'avís dels drets reservats, el mateix de l'editor i del selector de visibilitat. */
import { TEXT_DRETS_RESERVATS, TITOL_DRETS_RESERVATS } from '../notes/visibilitatNota.js';
import { useAplicaAbast } from './useAplicaAbast.js';
import { ResumConnexio } from './ResumConnexio.jsx';
/* T43b (ordre del Mestre, 260928) · administrar l'organització (?organitzacio=ID). */
import { BlocAdministrarOrganitzacio } from './organitzacio/BlocAdministrarOrganitzacio.jsx';
/* IDEA-14 (Directiva del Mestre, 261024; G-04) · els camins «Entre persones» i
   «Formar part», i la fitxa de confiança d'un perfil o d'una organització. */
import { BlocRelacio } from './BlocRelacio.jsx';
import { BlocFormarPart } from './organitzacio/BlocFormarPart.jsx';
import { useFitxaDeConnexio } from './useFitxaDeConnexio.js';

const SUGGESTED_TAGS = ['Història local', 'Interessant', 'Patrimoni', 'Gent del Poble', 'Debat'];
/* Les mateixes categories de sèrie que el Bloc (NotesSection): Onada 11
   (261010; prompt 261010_1730, tasca 2) · la còpia local s'ha unificat amb
   classificacioBloc.js i, dins del component, passa per categoriesBase amb la
   taxonomia del poble (sense personalització, la mateixa llista). */
const TIPUS_DE_PERFIL = new Set(['persona', 'entitat', 'grup', 'ia']);

/** El que la nota recordarà de l'element connectat. */
export function origenDeLaConnexio(params) {
  const sectionId = params.get('sectionId') || '';
  const itemId = params.get('item_id') || '';
  const titol = params.get('title') || itemId || 'element-desconegut';
  const autorTipus = params.get('autorTipus') || '';
  /* T43 · la ruta ve escrita (pàgines, perfils) o es deduïx de la secció; en
     els dos casos només si és interna i segura. */
  const demanada = params.get('ruta') || '';
  const deduida = sectionId && itemId ? getSectionItemPath(sectionId, itemId) : '';
  const ruta = esRutaInterna(demanada) ? demanada : (esRutaInterna(deduida) ? deduida : '');
  /* T43 · QUÈ és: el tipus declarat si és de la llista tancada; si no, el de
     la secció; un perfil sense tipus pren el de l'autor; sense res, 'pagina'. */
  const declarat = params.get('objecte');
  const objecte = TIPUS_OBJECTE.includes(declarat) ? declarat
    : tipusDeSeccio(sectionId) || (sectionId === 'perfil' && TIPUS_DE_PERFIL.has(autorTipus) ? autorTipus : 'pagina');
  return {
    tipus: 'connexio',
    sectionId,
    itemId: itemId || titol,
    titol,
    autorId: params.get('targetUserId') || '',
    autorNom: params.get('author') || '',
    autorTipus,
    ruta,
    objecte
  };
}

/** Afig un valor net a una llista sense repetir-lo. */
const ambValor = (llista, valor) => {
  const net = String(valor || '').trim();
  return !net || llista.includes(net) ? llista : [...llista, net];
};

/** T71 · Qui mira /connectar: amb `url` a la query (D10-A: o una adreça
 * dins de `text`), un contingut de fora; si no, un element de Sóc de Poble.
 * Components distints: canviar de l'un a l'altre (la query canvia) remunta
 * la vista sencera. */
export default function ConnectarSection() {
  const [params] = useSearchParams();
  const deFora = useMemo(() => contingutExternDeParams(params) !== null, [params]);
  return deFora ? <ConnectarContingutExtern params={params} /> : <ConnectarElementIntern />;
}

/** D1 · On es va per a entrar sense sessió: /registre, i tornar a esta mateixa consulta de /connectar. */
const rutaPerAEntrar = (params) => rutaDEntrada({ mode: 'entrar', tornar: `/connectar?${params.toString()}` });

/* Revisió de D1 (260930) · El mode de dades RESOLT (normalizeBackendConfig:
   té en compte l'elecció remota desada), no el `dataMode` cru del paquet:
   un paquet 'seed' que ja ha passat al servidor necessita entrar. */
const modeResolt = (config) => normalizeBackendConfig(config || {}).dataMode;

/* Revisió de D1 (260930) · El Bloc que no s'ha pogut carregar no «s'obri»:
   ho diu el text que tria el codi neutral (el mateix criteri que
   EstatErrorDades del Mur), mai el missatge de l'adaptador. */
function textDelBlocFallat(error, t) {
  if (esBackendInabastable(error)) {
    return t('error.backendInabastable', 'El servidor del poble no respon ara mateix. El contingut no s’ha pogut carregar.');
  }
  if (Number(error?.status) >= 400) {
    return t('error.servidor', 'El servidor del poble ha tornat un error. Torna-ho a provar més tard.');
  }
  return t('error.xarxa', 'Revisa la connexió i torna-ho a provar.');
}

/** L'avís del Bloc fallat, amb «Torna-ho a provar» (refresh de useNotesData). Composició d'Alerta i Boto. */
function avisDelBlocFallat({ error, onReintenta, t }) {
  return (
    <Alerta to="error" titol={t('error.connectarBloc', 'No s’ha pogut obrir el teu Bloc.')}
      accions={<Boto onClick={() => onReintenta?.()}>{t('common.reintenta', 'Torna-ho a provar')}</Boto>}>
      {textDelBlocFallat(error, t)}
    </Alerta>
  );
}

/** El que la nota recordarà quan l'original es resol: el títol i l'autor de
 * l'original, no els de l'URL. Sense original, l'origen tal com ve. Una
 * pàgina de text no declara autor (la seua barra signa amb el de sèrie):
 * l'origen no en guarda cap.
 * T71b · L'autoria no es mescla: el nom, l'id i el tipus de l'autor són tots
 * de l'original (`item`, el mateix criteri que rutaDePerfilDAutor: entitat
 * o persona) o cap. Mai el targetUserId ni l'autorTipus de l'URL.
 * D4 (ordre del Mestre, 260930) · Els drets són els de l'element original
 * resolt (item.copyright, nets): mai de l'URL ni el text de sèrie que la
 * pàgina de detall pinta quan l'element no en porta. */
export function origenAmbOriginal(origen, targeta, item = null) {
  if (!targeta) return origen;
  const autor = autorDe(item);
  const drets = netejaDrets(item?.copyright);
  return {
    ...origen,
    titol: targeta.titol || origen.titol,
    autorNom: targeta.autor?.propi ? targeta.autor.nom : '',
    autorId: autor?.id || '',
    autorTipus: autor?.tipus || '',
    ...(drets ? { drets } : {})
  };
}

/** Els ids amb què signa qui mira: el de la sessió, l'actor i les identitats
 * que representa, amb els àlies del MAS (aliesDeLActor).
 * Gauntlet 261022_0225 (CA-2) · El compte de la persona pilot porta també els
 * seus àlies quan la sessió ho acredita (esComptePersonaPilot, mai pel nom; la
 * mateixa regla de useCercaGlobal). Compta en 'local', on aliesDeLActor no en
 * dona cap a una persona (només en 'seed'), i per a l'id que torna directeAmb
 * ('0001'): el Mac Mini signat amb 'javillinares' és seu i no s'hi ofereix cap
 * xat. En remot el Mac Mini no té xat per a ningú (esIdDeLaLlavor). */
export function idsDeQuiConnecta({ currentUser = null, actor = null, identitats = [], dataMode = 'remote' } = {}) {
  const propis = new Set(currentUser?.id ? [String(currentUser.id)] : []);
  for (const identitat of [actor, ...(Array.isArray(identitats) ? identitats : [])]) {
    if (identitat?.id != null) aliesDeLActor(identitat, { dataMode }).forEach((id) => propis.add(String(id)));
  }
  if (esComptePersonaPilot(currentUser)) PERSONA_PILOT.alies.forEach((id) => propis.add(id));
  return propis;
}

/* Gauntlet 261022_0225 (CA-1) · En remot, un id de la llavor (un àlies de la
   persona pilot, una entitat del padró) no és l'id de cap persona ni entitat
   del servidor (W4-09): crea_fil_directe no hi pot obrir cap xat. El format
   de l'id és cosa del proveïdor (W4-10): ací no se'n comprova cap.
   Revisió (CN-R2) · Sense mirar el tipus declarat: un àlies de l'entitat
   pilot signat com a persona ('soc-de-poble_official' sense author_entity_id)
   o la IAIA (en remot, el seu xat és el públic de /iaia) tampoc no en tenen. */
const IDS_DE_LA_LLAVOR = new Set([
  ...PERSONA_PILOT.alies,
  ...ENTITATS_SEED.flatMap((entitat) => [entitat.id, entitat.slug, ...entitat.alies]),
  IAIA_ID
].map(String));
const esIdDeLaLlavor = ({ id }) => IDS_DE_LA_LLAVOR.has(String(id));

/** Només una autoria resolta pot obrir el contacte humà; mai la query.
 * Gauntlet 261022_0225 (CA-1) · Amb qui obri el xat i com, o null si no es
 * pot obrir: { interlocutor, nom }. És la via «En privat» (useAccions), sense
 * cap còpia: el descriptor de l'element (objecteDe) i interlocutorDelPrivat,
 * amb el `xat` de useXatSocDePoble.
 *  · L'entitat pilot (la marca `projecte`) no porta interlocutor: el clic
 *    obri el xat de Sóc de Poble que resol el port (ProveidorXatSocDePoble),
 *    i només es mostra si hi ha enllaç o encara es pot resoldre.
 *  · En remot, un autor amb un id de la llavor no té xat (esIdDeLaLlavor).
 *  · En llavor, l'id del padró que torna directeAmb (el Mac Mini, '0001'); un
 *    autor que el xat local no pot obrir no té botó.
 *  · `nom` és el de l'element resolt (objecteDe), mai el de l'URL.
 * IDEA-14 (Directiva del Mestre, 261024) · També { tipus, id, deFitxa,
 * seguiment }: `seguiment` és a qui se seguiria ({ tipus: 'persona' |
 * 'entitat', id }, el de l'interlocutor si n'hi ha) o null si des d'ací no es
 * pot (en remot, un id de la llavor). Les guardes són les de contacteDe. */
export function autorPerConnectar(item, { seccio = '', ...opcions } = {}) {
  const autor = autorDe(item);
  if (!autor || !['persona', 'entitat'].includes(autor.tipus)) return null;
  const objecte = objecteDe(item, seccio);
  const nom = objecte?.autor?.nom.trim() || '';
  return contacteDe({ ...autor, nom, projecte: objecte?.autor?.projecte === true }, objecte, opcions);
}

/** IDEA-14 (Directiva del Mestre, 261024; G-04) · El contacte humà d'un
 * PERFIL (/gent/:id, /empresa/:id, /grup/:id → Connectar): la fitxa pública
 * de confiança (useFitxaDeConnexio), mai la query. El descriptor és el
 * d'objecteDePerfil (porta la marca `projecte` del pilot) i les guardes, les
 * mateixes de l'autor (contacteDe): ni qui mira ni una entitat que
 * representa, cap id de la llavor en remot i el pilot pel xat de Sóc de
 * Poble. Una IA no és cap persona (té el seu «Parla amb…»): cap contacte. */
export function perfilPerConnectar(perfil, opcions = {}) {
  const objecte = objecteDePerfil(perfil);
  if (!objecte || !['persona', 'entitat', 'grup'].includes(objecte.tipus)) return null;
  const qui = { tipus: objecte.tipus, id: objecte.id, nom: objecte.titol.trim(), projecte: objecte.projecte === true };
  const contacte = contacteDe(qui, objecte, opcions);
  return contacte ? { ...contacte, deFitxa: true } : null;
}

/* Les guardes del contacte humà, una sola còpia per a l'autor i per al perfil
   (CA-1, CA-2, CN-R2): `qui` és { tipus, id, nom, projecte } i `objecte`, el
   descriptor d'on es trau l'interlocutor (interlocutorDelPrivat). */
function contacteDe(qui, objecte, { currentUser = null, actor = null, identitats = [], dataMode = 'remote', xat = null } = {}) {
  const id = String(qui?.id ?? '');
  if (!id.trim() || id.length > 200 || /[\s\u0000-\u001f\u007f]/.test(id)) return null;
  const propis = idsDeQuiConnecta({ currentUser, actor, identitats, dataMode });
  const esDeQuiMira = (candidat) => propis.has(String(candidat ?? '')) || xat?.esDeQuiMira?.(candidat) === true;
  if (esDeQuiMira(id)) return null;
  const nom = qui.nom || '';
  if (!nom) return null;
  const tipusDeSeguiment = qui.tipus === 'persona' ? 'persona' : 'entitat';
  const base = { nom, tipus: qui.tipus, id, deFitxa: false };
  if (qui.projecte) {
    if (!xat?.href && typeof xat?.resol !== 'function') return null;
    const seguible = dataMode !== 'remote' || !esIdDeLaLlavor({ id });
    return { ...base, interlocutor: null, seguiment: seguible ? { tipus: tipusDeSeguiment, id } : null };
  }
  if (dataMode === 'remote' && esIdDeLaLlavor({ id })) return null;
  const interlocutor = interlocutorDelPrivat(objecte, { directeAmb: xat?.directeAmb, esDeQuiMira });
  return interlocutor ? { ...base, interlocutor, seguiment: { tipus: tipusDeSeguiment, id: interlocutor.id } } : null;
}

const TIPUS_DE_FITXA = new Set(['persona', 'entitat', 'grup']);

/** IDEA-14 · Quines fitxes de confiança cal demanar per a esta consulta: la
 * del perfil (?sectionId=perfil amb objecte persona, entitat o grup) i la de
 * l'organització (?organitzacio=ID), si no és la mateixa. La query només
 * diu QUINA fitxa: el nom i l'id són els que torna loadPerfilPublic. En
 * remot i sense sessió, la fitxa d'una altra persona no es pot llegir
 * (perfil_public): ni es demana. */
export function fitxesDeLaConnexio(params, { teSessio = false, dataMode = 'remote' } = {}) {
  const sectionId = params.get('sectionId') || '';
  const itemId = (params.get('item_id') || '').trim();
  const objecte = params.get('objecte') || '';
  const orgId = (params.get('organitzacio') || '').trim();
  const personaIlegible = objecte === 'persona' && !teSessio && dataMode === 'remote';
  const perfil = sectionId === 'perfil' && itemId && TIPUS_DE_FITXA.has(objecte) && !personaIlegible
    ? { id: itemId, tipus: objecte } : null;
  const mateixa = Boolean(perfil) && perfil.tipus !== 'persona' && perfil.id === orgId;
  return { perfil, organitzacio: orgId && !mateixa ? { id: orgId, tipus: 'entitat' } : null, orgId };
}

function ConnectarElementIntern() {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const router = useUbicacioApp();
  const [params] = useSearchParams();
  const origenDeLURL = useMemo(() => origenDeLaConnexio(params), [params]);
  const id = useId();
  /* T54 · la foto de la mini-card: l'element original resolt en local amb
     sectionId + item_id sobre les dades dels proveïdors, mai des de l'URL.
     T71 · també les pàgines de text (paginaDeText.js), i quan l'original es
     resol en manen el títol i l'autor. */
  const { targeta: original, item: itemOriginal, estat: estatOriginal } = useOriginalDeConnexio(origenDeLURL);
  const origen = useMemo(
    () => origenAmbOriginal(origenDeLURL, original, itemOriginal),
    [origenDeLURL, original, itemOriginal]
  );
  const contextTitle = origen.titol;
  const imatgeOriginal = original?.imatge || '';
  const autorVisible = original ? original.autor.nom : origen.autorNom;

  const { currentUser } = useSession();
  const { actor, identitats } = useIdentitat();
  const { noteFolders, notes, creaNota, canCreate, config, status: estatBloc, error: errorBloc, refresh: recarregaBloc } = useNotesData();
  const { chatThreads, cercaMembres, status: statusXat, avis: avisXat } = useXat();
  const { aplica } = useAplicaAbast();

  const isGuest = !currentUser;
  const teSessio = Boolean(currentUser);
  const dataMode = useMemo(() => modeResolt(config), [config]);
  /* Gauntlet 261022_0225 (CA-1) · El xat amb l'autor és el de «En privat»:
     el mateix destí (autorPerConnectar) i el mateix clic (useComentaEnPrivat,
     ara dins de BlocRelacio).
     IDEA-14 (Directiva del Mestre, 261024; G-04) · Des d'un perfil, el
     contacte és el de la seua fitxa pública de confiança (perfilPerConnectar),
     i amb ?organitzacio, la de l'organització per a «Formar part». */
  const xatSocDePoble = useXatSocDePoble();
  const opcionsDelContacte = { currentUser, actor, identitats, dataMode, xat: xatSocDePoble };
  const peticions = useMemo(() => fitxesDeLaConnexio(params, { teSessio, dataMode }), [params, teSessio, dataMode]);
  const fitxaDelPerfil = useFitxaDeConnexio(peticions.perfil, { config });
  const fitxaDeLaOrganitzacio = useFitxaDeConnexio(peticions.organitzacio, { config });
  const contacte = autorPerConnectar(itemOriginal, { seccio: origenDeLURL.sectionId, ...opcionsDelContacte })
    ?? perfilPerConnectar(fitxaDelPerfil.perfil, opcionsDelContacte);
  /* En remot sense sessió, la fitxa d'una altra persona no es llig: el camí es mostra sense nom i porta a entrar. */
  const personaSenseNom = !contacte && !teSessio && dataMode === 'remote' && origenDeLURL.sectionId === 'perfil'
    && origenDeLURL.objecte === 'persona' && Boolean((params.get('item_id') || '').trim());
  const orgId = peticions.orgId;
  const fitxaOrg = !orgId ? null : (peticions.organitzacio ? fitxaDeLaOrganitzacio : fitxaDelPerfil);
  const contacteOrg = !orgId ? null
    : (peticions.organitzacio ? perfilPerConnectar(fitxaDeLaOrganitzacio.perfil, opcionsDelContacte) : (contacte?.deFitxa ? contacte : null));
  const ambRelacio = Boolean(contacte) || personaSenseNom;
  const ambCamins = ambRelacio || Boolean(orgId);
  /* D1 (ordre del Mestre, 260930) · Sense sessió, en seed i local el Bloc és
     del dispositiu: es connecta igual. En remot cal entrar (calEntrar): cap
     simulació. Amb el Bloc encara carregant (canCreate exigix 'ready'), el
     botó espera desactivat (blocCarregant), sense cap toast.
     Revisió (260930) · Si el Bloc ha fallat en carregar (status 'error'), no
     «s'obri» res: blocFallat mostra el motiu i «Torna-ho a provar». */
  const calEntrar = !teSessio && dataMode === 'remote';
  const potConnectar = !calEntrar && Boolean(canCreate);
  const blocFallat = !calEntrar && !potConnectar && estatBloc === 'error';
  const blocCarregant = !calEntrar && !potConnectar && !blocFallat;
  /* Revisió de D4 (260930) · Mentre la font de l'original encara carrega, es
     connectaria sense els seus drets, subtítol ni entradeta: s'espera. Sense
     original només es connecta quan no hi és ('absent') o la font ha fallat ('error'). */
  const esperantOriginal = !calEntrar && estatOriginal === 'carregant';
  /* D4 · l'original porta els drets reservats (només si s'ha resolt, mai de l'URL). */
  const dretsReservats = teDretsReservats(origen);

  /* D6 · la connexió és sempre de la persona, encara que actue com a entitat. */
  const persona = (identitats || []).find((identitat) => identitat.tipus === 'persona')?.nom
    || (actor?.tipus === 'persona' ? actor.nom : null);
  const actuaComEntitat = actor?.tipus === 'entitat' && actor?.nom;

  const grups = useMemo(() => grupsDeXat(chatThreads), [chatThreads]);
  /* Una llista buida mentre el xat carrega (o si ha fallat) no vol dir «cap grup». */
  const xat = estatDelXat({ status: statusXat, avis: avisXat, fils: chatThreads });
  const opcions = useMemo(() => opcionsDAbast({ dataMode, teSessio, grups, xat }), [dataMode, teSessio, grups, xat]);
  const [modeTriat, setModeTriat] = useState('privada');
  const mode = modeAplicable(modeTriat, opcions);

  const [persones, setPersones] = useState([]);
  const [grupsTriats, setGrupsTriats] = useState([]);
  const [cerca, setCerca] = useState('');
  const [padro, setPadro] = useState({ estat: 'inactiu', membres: [], error: null });

  const [selectedFolder, setSelectedFolder] = useState(CARPETA_CONNECTATS);
  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriaInput, setCategoriaInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [resum, setResum] = useState(null);
  const resumRef = useRef(null);

  const displayFolders = carpetesDelBloc(noteFolders);
  /* Onada 11 · Les categories de sèrie, ampliades per la taxonomia del poble si n'hi ha. */
  const { personalitzacio } = useCoreContent();
  const categoriesDeSerie = categoriesBase(personalitzacio?.taxonomia?.payload);
  const categoriesDisponibles = useMemo(() => {
    const totes = new Set(categoriesDeSerie);
    for (const nota of notes || []) for (const categoria of nota?.categories || []) if (categoria) totes.add(String(categoria));
    return [...totes].sort((a, b) => a.localeCompare(b));
  }, [notes, categoriesDeSerie]);

  /* El padró del poble només es consulta mentre «Persones concretes» és la
     tria, amb un xicotet retard mentre s'escriu (com el xat). */
  useEffect(() => {
    if (mode !== 'persones') return undefined;
    let viu = true;
    const espera = setTimeout(() => {
      setPadro((previ) => ({ ...previ, estat: 'carregant', error: null }));
      Promise.resolve()
        .then(() => cercaMembres(cerca.trim() || null))
        .then((llista) => { if (viu) setPadro({ estat: 'llest', membres: Array.isArray(llista) ? llista : [], error: null }); })
        .catch((e) => { if (viu) setPadro({ estat: 'error', membres: [], error: e?.message || 'No s’ha pogut obrir el padró del poble.' }); });
    }, cerca ? 250 : 0);
    return () => { viu = false; clearTimeout(espera); };
  }, [mode, cerca, cercaMembres]);

  /* El resum rep el focus en aparéixer: és el que ha passat de veres. */
  useEffect(() => {
    if (resum) resumRef.current?.focus();
  }, [resum]);

  /* Correcció C16 (260928) · Llevar una persona o una etiqueta desmunta el
     botó premut, i una suggerida triada es mou a l'altra llista: el focus no
     pot caure al <body> (WCAG 2.4.3). Cada acció diu on ha d'anar (índex de
     la mateixa llista) i ací es resol quan el DOM ja és el nou. */
  const [focusDesti, setFocusDesti] = useState(null);
  const panellPersonesRef = useRef(null);
  const personesTriadesRef = useRef(null);
  const etiquetesRef = useRef(null);
  const etiquetaLliureRef = useRef(null);
  useEffect(() => {
    if (!focusDesti) return;
    const { llista, index, reserva } = focusDesti;
    const botons = (ref, selector) => [...(ref.current?.querySelectorAll(selector) || [])];
    let desti = null;
    if (llista === 'persones') {
      desti = botons(personesTriadesRef, 'button')[index] || panellPersonesRef.current?.querySelector('input');
    } else if (llista === 'etiquetes') {
      desti = botons(etiquetesRef, '.sdp-connectar__pindola--triada')[index] || etiquetaLliureRef.current?.querySelector('input');
    } else if (llista === 'suggerides') {
      desti = botons(etiquetesRef, '.sdp-connectar__pindola:not(.sdp-connectar__pindola--triada)')[index]
        || botons(etiquetesRef, '.sdp-connectar__pindola--triada')[reserva];
    }
    desti?.focus();
    setFocusDesti(null);
  }, [focusDesti]);

  const commutaPersona = (membre) => {
    const clau = String(membre.usuari_id);
    setPersones((actuals) => {
      if (actuals.some((p) => p.id === clau)) return actuals.filter((p) => p.id !== clau);
      if (actuals.length >= LIMIT_PERSONES) return actuals;
      return [...actuals, { id: clau, nom: String(membre.nom || clau), filId: membre.fil_id || null }];
    });
  };
  const llevaPersona = (clau) => {
    setFocusDesti({ llista: 'persones', index: persones.findIndex((p) => p.id === clau) });
    setPersones((actuals) => actuals.filter((p) => p.id !== clau));
  };
  const commutaGrup = (clau) => setGrupsTriats((actuals) => {
    if (actuals.includes(clau)) return actuals.filter((g) => g !== clau);
    return actuals.length >= LIMIT_GRUPS ? actuals : [...actuals, clau];
  });

  /* T43 (ordre del Mestre, 260928) · Només es buida el camp quan l'etiqueta
     ve d'ell: triar una suggerida no esborra el que s'estava escrivint. */
  const addTag = (tag, { buidaCamp = true } = {}) => {
    setCustomTags((actuals) => ambValor(actuals, tag));
    if (buidaCamp) setTagInput('');
  };
  const removeTag = (tag) => {
    setFocusDesti({ llista: 'etiquetes', index: customTags.indexOf(tag) });
    setCustomTags((actuals) => actuals.filter((x) => x !== tag));
  };
  const suggerides = SUGGESTED_TAGS.filter((tag) => !customTags.includes(tag));
  /* La suggerida ix de la seua llista: el focus va a la següent o, si era
     l'última, a la píndola nova (va al final de les triades). */
  const triaSuggerida = (tag) => {
    setFocusDesti({ llista: 'suggerides', index: suggerides.indexOf(tag), reserva: customTags.length });
    addTag(tag, { buidaCamp: false });
  };
  const commutaCategoria = (categoria) => setCategories((actuals) => (
    actuals.includes(categoria) ? actuals.filter((c) => c !== categoria) : [...actuals, categoria]
  ));
  const addCategoria = (categoria) => { setCategories((actuals) => ambValor(actuals, categoria)); setCategoriaInput(''); };

  const grupsDeLaTria = grups.filter((grup) => grupsTriats.includes(grup.id));
  const tria = { mode, persones: mode === 'persones' ? persones : [], grups: mode === 'grups' ? grupsDeLaTria : [] };
  const faltenDestins = (mode === 'persones' && persones.length === 0) || (mode === 'grups' && grupsDeLaTria.length === 0);
  const nomCarpeta = displayFolders.find((folder) => folder.id === selectedFolder)?.name || NOM_CARPETA_CONNECTATS;

  const handleConnect = async () => {
    /* D1 · Sense sessió en remot, a entrar; en tornar, esta mateixa consulta. */
    if (calEntrar) {
      navigate(rutaPerAEntrar(params));
      return;
    }
    if (!potConnectar || esperantOriginal || !selectedFolder || isSaving || faltenDestins) return;
    setError(null);
    setIsSaving(true);
    try {
      const origenDesat = { ...origen, abast: normalitzaAbast(tria) };
      const nota = await creaNota({
        title: aHtml(contextTitle),
        /* D4 · còpia editable: el subtítol i l'entradeta de l'original resolt
           (mai de l'URL), escapats com a HTML del document. */
        ...(original?.subtitol ? { subtitle: aHtml(original.subtitol) } : {}),
        ...(original?.entradilla ? { lead: aHtml(original.entradilla) } : {}),
        content: contingutDeLaConnexio(origen),
        folderId: selectedFolder,
        tags: customTags,
        categories,
        origen: origenDesat
      });
      const rutaNota = nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes';
      if (mode === 'privada') {
        /* D1 · el toast diu la carpeta triada, no sempre la Safata. */
        showToast(t('section.connectar.connectada', 'Element connectat a les teues notes: el trobaràs a «{carpeta}».').replace('{carpeta}', () => nomCarpeta), 'success');
        /* T54 · replace: «arrere» des de la nota torna a l'original, no a este formulari ja fet. */
        navigate(rutaNota, { replace: true });
        return;
      }
      const missatge = missatgeDeConnexio(origen, origen.ruta ? urlPerCompartir(origen.ruta, router) : '');
      const { resultats } = await aplica({ nota, origen: origenDesat, abast: tria, missatge });
      setResum({
        ruta: rutaNota,
        /* 261024 correccions (directiva del Mestre 15:05, Gemini G2-02) · cap «MAS» a la interfície. */
        resultats: [{ clau: 'mas', nom: 'Les teues notes', estat: 'fet', detall: `Connectada a «${nomCarpeta}».` }, ...resultats]
      });
    } catch (err) {
      setError(missatgeDeLError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const n = mode === 'persones' ? persones.length : grupsDeLaTria.length;
  const etiquetaConnectar = calEntrar ? 'Entra per a connectar'
    : blocCarregant ? 'Obrint el teu Bloc…'
      : esperantOriginal ? 'Carregant l’original…'
        : mode === 'persones' ? `Connectar i enviar a ${n} ${n === 1 ? 'persona' : 'persones'}`
          : mode === 'grups' ? `Connectar i enviar a ${n} ${n === 1 ? 'grup' : 'grups'}`
            : `${t('section.connectar.connect', 'Connectar a')} «${nomCarpeta}»`;
  /* D1 · Sense sessió en remot, a entrar; en tornar, esta mateixa consulta. */
  const entra = () => navigate(rutaPerAEntrar(params));

  return (
    <UniversalPage
      chrome="system"
      title="Connectar"
      subtitle={t('section.connectar.where', 'On vols connectar-ho?')}
      lead={/* IDEA-14 · Amb més d'un camí, l'entradeta diu que són accions distintes.
             261024 correccions (R3-05) · i diu el mateix que «Qui ho pot vore?»: en
             privat no avisa ningú; a persones o grups de xat els arriba l'enllaç.
             P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · «connectar
             amb algú», no «seguir»: a Sóc de Poble no se seguix, es connecta. */ ambCamins
        ? t('section.connectar.leadCamins', 'Cada camí té el seu botó: connectar amb algú o escriure-li no et fa membre de res. Si guardes l’element a les teues notes en privat, no avisa ningú; si tries persones o grups de xat, els enviarem l’enllaç.')
        : t('section.connectar.lead', 'Tria on arriba (per defecte, a la Safata d’Entrada), qui ho pot vore i com ho trobaràs després.')}
      onConnect={false}
    >
      <div className="sdp-connectar">
        {/* D1 · sense promeses: en seed i local no hi ha cap traspàs al compte en
            entrar, i les carpetes no es poden crear. */}
        {isGuest && (
          <Alerta to="avis" titol="Mode Foraster actiu">
            {calEntrar
              ? 'Per a connectar cal entrar al teu compte.'
              : 'Sense sessió, el que connectes es queda només en este dispositiu.'}
          </Alerta>
        )}

        <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
          <p className="sdp-connectar__tipus">{ETIQUETA_OBJECTE[origen.objecte] || 'Element'}</p>
          {/* T54 · mini-card de lectura: foto i títol, sense peu ni data
              clicable. Sense foto (perfil, pàgina o element que no és ací), la
              icona de capes ocupa el lloc de la icona del títol perquè la
              targeta no quede en una línia de text nua. */}
          <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
            <UniversalCard
              title={contextTitle}
              imageUrl={imatgeOriginal || undefined}
              imageAlt=""
              icon={imatgeOriginal ? undefined : <Layers size={32} aria-hidden="true" focusable="false" />}
              hasFooter={false}
              onDateTime={false}
              showDateTime={false}
            />
          </div>
          {autorVisible ? <p className="sdp-connectar__autor">{`De ${autorVisible}`}</p> : null}
          {persona ? <p className="sdp-connectar__identitat">{`Es connecta a ${persona}.`}</p> : null}
          {actuaComEntitat ? (
            <p className="sdp-connectar__identitat">{`Actues com a ${actor.nom}, però les connexions són personals.`}</p>
          ) : null}
          {/* D4 (ordre del Mestre, 260930) · els drets de l'original resolt,
              amb les mateixes claus que l'avís de l'editor (NotesEditor). */}
          {dretsReservats ? (
            <Alerta to="avis" titol={t('section.notes.drets.titol', TITOL_DRETS_RESERVATS)}>
              {t('section.notes.drets.text', TEXT_DRETS_RESERVATS)}
            </Alerta>
          ) : null}
        </section>
        {/* IDEA-14 (Directiva del Mestre, 261024; auditoria Gemini G-04) · Tres
            camins, cadascun amb el seu botó: «Entre persones» (seguir i
            escriure a l'autor o al perfil), «Formar part» (la sol·licitud al
            xat de l'entitat i, a banda, administrar-la) i «A les teues notes»
            (la còpia al Bloc, el botó gran del peu, l'únic primari, D1). Els dos
            primers només hi són quan toca. */}
        {ambRelacio ? (
          <>
            <Divisor />
            <div className="sdp-connectar__cami" role="group" aria-labelledby={`${id}-cami-relacio`}>
              <div className="sdp-connectar__cami-cap">
                <p id={`${id}-cami-relacio`} className="sdp-connectar__tipus">{t('section.connectar.camins.relacio', 'Entre persones')}</p>
              </div>
              <BlocRelacio contacte={contacte} deFitxa={contacte?.deFitxa === true} calEntrar={calEntrar} onEntra={entra}
                dataMode={dataMode} config={config} />
            </div>
          </>
        ) : null}
        {orgId ? (
          <>
            <Divisor />
            <div className="sdp-connectar__cami" role="group" aria-labelledby={`${id}-cami-formar-part`}>
              <div className="sdp-connectar__cami-cap">
                <p id={`${id}-cami-formar-part`} className="sdp-connectar__tipus">{t('section.connectar.camins.formarPart', 'Formar part')}</p>
              </div>
              <BlocFormarPart orgId={orgId} contacte={contacteOrg} nom={fitxaOrg?.perfil?.nom || null}
                carregant={fitxaOrg?.estat === 'carregant'} onEntra={entra} />
              {/* T43b-3 · el nom de l'organització no ve de l'URL (title): el resol el bloc d'una font de confiança. */}
              <BlocAdministrarOrganitzacio orgId={orgId} config={config} />
            </div>
          </>
        ) : null}
        {ambCamins ? (
          <>
            <Divisor />
            <div className="sdp-connectar__cami-cap">
              {/* 261024 correccions (G2-02 i R3-05) · «A les teues notes», i l'ajuda diu el
                  que fan les opcions de davall: només la privada no avisa ningú. */}
              <p className="sdp-connectar__tipus">{t('section.connectar.camins.mas', 'A les teues notes')}</p>
              <p className="sdp-connectar__ajuda">
                {t('section.connectar.mas.ajuda', 'Una còpia al teu Bloc per a llegir-la després, que no et fa membre de res. Tu tries qui ho pot vore: en privat no avisa ningú; a persones o grups de xat els enviarem l’enllaç per xat, i a tot el poble la compartiràs tu al Mur.')}
              </p>
            </div>
          </>
        ) : null}

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-privacitat`}>
          <h3 id={`${id}-privacitat`} className="sdp-connectar__titol-seccio">Privacitat de la connexió</h3>
          <GrupOpcions
            llegenda="Qui ho pot vore?"
            nom={`${id}-abast`}
            aspecte="targetes"
            textTriada="Triada"
            opcions={opcions}
            valor={mode}
            onCanvi={setModeTriat}
            disabled={isSaving || Boolean(resum)}
          />

          {mode === 'persones' ? (
            <div ref={panellPersonesRef} className="sdp-connectar__panell">
              <Camp etiqueta="Cerca al padró del poble" ajuda={`Tria fins a ${LIMIT_PERSONES} persones. Només reben l’enllaç: la connexió continua sent teua.`}>
                <CampText value={cerca} onChange={(e) => setCerca(e.target.value)} autoComplete="off" />
              </Camp>
              {padro.estat === 'carregant' ? <Carregant etiqueta="Buscant al padró…" /> : null}
              {padro.error ? <Alerta to="error">{padro.error}</Alerta> : null}
              {padro.estat === 'llest' && padro.membres.length === 0 ? (
                <p className="sdp-connectar__ajuda">Ningú del padró coincidix amb la cerca.</p>
              ) : null}
              {padro.membres.length > 0 ? (
                <ul className="sdp-connectar__pindoles" aria-label="Gent del padró">
                  {padro.membres.map((membre) => {
                    const clau = String(membre.usuari_id);
                    const triada = persones.some((p) => p.id === clau);
                    return (
                      <li key={clau}>
                        <button type="button" className="sdp-connectar__pindola" aria-pressed={triada}
                          disabled={!triada && persones.length >= LIMIT_PERSONES}
                          onClick={() => commutaPersona(membre)}>
                          {membre.tipus === 'entitat' ? `${membre.nom} · entitat` : membre.nom}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <p className="sdp-connectar__ajuda" aria-live="polite">{`${persones.length} de ${LIMIT_PERSONES} persones triades.`}</p>
              {persones.length > 0 ? (
                <ul ref={personesTriadesRef} className="sdp-connectar__pindoles" aria-label="Persones triades">
                  {persones.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                        aria-label={`Lleva ${p.nom} de la llista`} onClick={() => llevaPersona(p.id)}>
                        {p.nom}<X size={16} aria-hidden="true" focusable="false" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {mode === 'grups' ? (
            <div className="sdp-connectar__panell">
              <GrupCamps llegenda={`Grups de xat on ja eres (fins a ${LIMIT_GRUPS})`}>
                {grups.map((grup) => {
                  const triat = grupsTriats.includes(grup.id);
                  return (
                    <Casella key={grup.id} etiqueta={grup.nom} checked={triat}
                      disabled={!triat && grupsTriats.length >= LIMIT_GRUPS}
                      onChange={() => commutaGrup(grup.id)} />
                  );
                })}
              </GrupCamps>
            </div>
          ) : null}

          {/* Des del MAS es compartix al Mur. Connectar no la publica: es diu
              quin és el pas. */}
          {mode === 'poble' ? (
            <Alerta to="info" titol="Compartir al Mur, un pas més">
              La tria queda amb la connexió, però el Mur no la rep sola: obri-la a les teues notes i prem «Compartir al Mur». El Mur el llig la gent registrada del poble, no Internet.
            </Alerta>
          ) : null}
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-caixa`}>
          <h3 id={`${id}-caixa`} className="sdp-connectar__titol-seccio">On arriba</h3>
          <p className="sdp-connectar__ajuda">
            {`Per defecte, tota connexió arriba a «${NOM_CARPETA_CONNECTATS}»; des d’allí la podràs moure a qualsevol carpeta del teu Bloc.`}
          </p>
          <div className="sdp-connectar__carpetes">
            {displayFolders.map((folder) => {
              const Icon = iconaDeCarpeta(folder.id);
              const isSelected = selectedFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolder(folder.id)}
                  className="sdp-connectar__carpeta"
                  aria-pressed={isSelected}
                >
                  <Icon size={32} className="sdp-connectar__carpeta-icona" aria-hidden="true" />
                  <span className="sdp-connectar__carpeta-nom">{folder.name}</span>
                  {/* Correcció C18 (260928) · La triada es llig sense color (la
                      vora taronja no arriba al 3:1). Sempre hi és, perquè triar
                      no moga la graella, i només es veu en la triada (CSS, des
                      d'aria-pressed, que ja diu l'estat: aria-hidden). */}
                  <span className="sdp-insignia sdp-insignia--exit sdp-connectar__carpeta-insignia" aria-hidden="true">
                    <Check size={16} aria-hidden="true" focusable="false" />Triada
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-categories`}>
          <h3 id={`${id}-categories`} className="sdp-connectar__titol-seccio">Categories</h3>
          <p className="sdp-connectar__ajuda">Opcional: la connexió també apareixerà en estes categories del teu Bloc.</p>
          <ul className="sdp-connectar__pindoles" aria-label="Categories del teu Bloc">
            {[...new Set([...categoriesDisponibles, ...categories])].map((categoria) => (
              <li key={categoria}>
                <button type="button" className="sdp-connectar__pindola" aria-pressed={categories.includes(categoria)}
                  onClick={() => commutaCategoria(categoria)}>
                  {categoria}
                </button>
              </li>
            ))}
          </ul>
          <div className="sdp-connectar__entrada">
            <Camp etiqueta="Categoria nova">
              <CampText value={categoriaInput} onChange={(e) => setCategoriaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategoria(categoriaInput); } }} />
            </Camp>
            <Boto onClick={() => addCategoria(categoriaInput)} disabled={!categoriaInput.trim()}>Afegir categoria</Boto>
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-context`}>
          <h3 id={`${id}-context`} className="sdp-connectar__titol-seccio">Assistent de context</h3>
          <p className="sdp-connectar__ajuda">
            La IAIA et suggereix estes etiquetes en base al sistema de Poble. Afig tu les que vullgues per trobar-ho ràpid.
          </p>
          <ul ref={etiquetesRef} className="sdp-connectar__pindoles" aria-label="Etiquetes">
            {suggerides.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => triaSuggerida(tag)} className="sdp-connectar__pindola">{tag}</button>
              </li>
            ))}
            {customTags.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => removeTag(tag)} className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                  aria-label={`Lleva l’etiqueta ${tag}`}>
                  {tag}<X size={16} aria-hidden="true" focusable="false" />
                </button>
              </li>
            ))}
          </ul>
          <div ref={etiquetaLliureRef} className="sdp-connectar__entrada">
            <Camp etiqueta="Etiqueta lliure">
              <CampText value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
            </Camp>
            <Boto onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Afegir</Boto>
          </div>
        </section>

        <div className="sdp-connectar__peu">
          {blocFallat && !resum ? avisDelBlocFallat({ error: errorBloc, onReintenta: recarregaBloc, t }) : null}
          {error ? <Alerta to="error" titol="No s’ha pogut connectar">{error}</Alerta> : null}
          {resum ? (
            <div ref={resumRef} tabIndex={-1} className="sdp-connectar__resum">
              <ResumConnexio
                resultats={resum.resultats}
                accions={(
                  <Boto varietat="primari" onClick={() => navigate(resum.ruta, { replace: true })}>
                    Obrir la connexió a les teues notes
                  </Boto>
                )}
              />
            </div>
          ) : (
            <>
              <Boto varietat="primari" mida="gran" ple onClick={handleConnect} carregant={isSaving}
                disabled={!calEntrar && (!potConnectar || esperantOriginal || !selectedFolder || faltenDestins)}>
                {etiquetaConnectar}
              </Boto>
              <p className="sdp-connectar__nota">
                {mode === 'persones' || mode === 'grups'
                  ? (faltenDestins
                    ? (mode === 'persones' ? 'Tria almenys una persona del padró.' : 'Tria almenys un grup.')
                    : 'L’enviament per xat no es pot desfer.')
                  : 'A les teues notes la llegiràs i la podràs editar com una nota teua.'}
              </p>
            </>
          )}
        </div>
      </div>
    </UniversalPage>
  );
}

/**
 * T71 · Un contingut de FORA (una web) arriba amb `url` (D10-A: o dins de
 * `text`). Es mostra validat (contingutExtern.js) i només el connecta un
 * clic, com una nota nova i editable a la Safata d’Entrada. Carregar la ruta
 * no crea res. La imatge de l'altra web ni es copia ni es carrega (cap
 * hotlink): la targeta porta una icona, i la url es mostra com a text, no
 * com a enllaç.
 */
function ConnectarContingutExtern({ params }) {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const { creaNota, canCreate, config, status: estatBloc, error: errorBloc, refresh: recarregaBloc } = useNotesData();
  const id = useId();
  const contingut = useMemo(() => contingutExternDeParams(params), [params]);
  const valor = contingut?.ok ? contingut.valor : null;
  const motius = contingut && !contingut.ok ? Object.values(contingut.errors) : [];
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  /* D1 · Com l'element intern: sense sessió, en seed i local es connecta al
     dispositiu; en remot (el mode resolt) cal entrar. Amb el Bloc carregant,
     el botó espera; si el Bloc ha fallat, es diu i es pot tornar a provar. */
  const dataMode = useMemo(() => modeResolt(config), [config]);
  const calEntrar = !currentUser && dataMode === 'remote';
  const potConnectar = !calEntrar && Boolean(canCreate);
  const blocFallat = !calEntrar && !potConnectar && estatBloc === 'error';
  const blocCarregant = !calEntrar && !potConnectar && !blocFallat;

  const connecta = async () => {
    if (calEntrar) {
      navigate(rutaPerAEntrar(params));
      return;
    }
    if (!valor || isSaving || !potConnectar) return;
    setError(null);
    const entrada = notaDeContingutExtern(valor);
    if (!entrada) return;
    setIsSaving(true);
    try {
      const nota = await creaNota(entrada);
      showToast(`Connectat a «${NOM_CARPETA_CONNECTATS}». És una nota teua: la pots editar.`, 'success');
      navigate(nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes', { replace: true });
    } catch (err) {
      setError(missatgeDeLError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const etiquetaConnectar = calEntrar ? 'Entra per a connectar'
    : blocCarregant ? 'Obrint el teu Bloc…'
      : `${t('section.connectar.connect', 'Connectar a')} «${NOM_CARPETA_CONNECTATS}»`;

  return (
    <UniversalPage
      chrome="system"
      title="Connectar"
      subtitle={t('section.connectar.where', 'On vols connectar-ho?')}
      lead="Un enllaç de fora de Sóc de Poble arriba com una nota teua, que podràs editar."
      onConnect={false}
    >
      <div className="sdp-connectar">
        {!currentUser ? (
          <Alerta to="avis" titol="Mode Foraster actiu">
            {calEntrar
              ? 'Per a connectar cal entrar al teu compte.'
              : 'Sense sessió, l’enllaç es queda només en este dispositiu.'}
          </Alerta>
        ) : null}

        <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
          <p className="sdp-connectar__tipus">Enllaç de fora de Sóc de Poble</p>
          {valor ? (
            <>
              <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
                <UniversalCard
                  title={valor.titol}
                  subtitle={valor.subtitol || undefined}
                  body={valor.entradilla || undefined}
                  icon={<Globe size={32} aria-hidden="true" focusable="false" />}
                  hasFooter={false}
                  onDateTime={false}
                  showDateTime={false}
                />
              </div>
              <p className="sdp-connectar__autor">{`De ${valor.lloc}`}</p>
              <p className="sdp-connectar__identitat">{valor.url}</p>
            </>
          ) : (
            <p id={`${id}-objecte`} className="sdp-connectar__autor">Este enllaç no es pot connectar.</p>
          )}
        </section>

        {motius.length ? (
          <Alerta to="error" titol="Este enllaç no es pot connectar">{motius.join(' ')}</Alerta>
        ) : null}

        <div className="sdp-connectar__peu">
          {blocFallat && valor ? avisDelBlocFallat({ error: errorBloc, onReintenta: recarregaBloc, t }) : null}
          {error ? <Alerta to="error" titol="L’enllaç no s’ha connectat">{error}</Alerta> : null}
          {valor ? (
            <>
              <Boto varietat="primari" mida="gran" ple onClick={connecta} carregant={isSaving} disabled={!calEntrar && !potConnectar}>
                {etiquetaConnectar}
              </Boto>
              <p className="sdp-connectar__nota">
                {`Arriba com una nota nova a «${NOM_CARPETA_CONNECTATS}», que podràs editar. La imatge de l’altra web no es copia.`}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </UniversalPage>
  );
}
