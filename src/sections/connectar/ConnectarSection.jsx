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
 *     lector del MAS, T54; D1 Opció A, 261112: qualsevol persona). La
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
 *     l'entitat, BlocFormarPart) i «A les teues notes» (la connexió de
 *     sempre; abans «Al teu MAS», 261024 correccions, Gemini G2-02). Des d'un
 *     perfil, el nom i l'id són els de la fitxa pública (useFitxaDeConnexio),
 *     mai els de l'URL.
 *   · IDEA-22 (pla 261025_0045, T5; Directiva del Mestre, àudios 00:53-00:55)
 *     · DEROGAT «Actues com a …, però les connexions són personals» (D6): qui
 *     administra una empresa, una entitat o un grup tria, al camí de la
 *     relació, «Connectar com a» (la persona o eixa organització) sense
 *     canviar l'actor de la sessió, i el seguiment és de l'actor triat
 *     (BlocRelacio → useSeguiment, `com`): B2B rural, empresa amb empresa. La
 *     còpia «A les teues notes» continua sent del teu Bloc. Administrar
 *     l'organització (membres i rols) ja no viu ací: és del Perfil, «Membres
 *     i connexions» (BlocAdministrarOrganitzacio ja no es munta).
 *   · C0200-06 (auditoria Codex 261025_0200) · Les regles de 2610250100, també
 *     a la vista: el destí que és de qui mira (ella o una entitat que
 *     administra) es pot connectar com a una ALTRA identitat seua (entitat A →
 *     entitat B, entitat → la persona que l'administra), mai com a persona ni
 *     com a ell mateix; i mai s'hi oferix el xat (cap directe amb tu mateixa).
 *   · IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
 *     261025_0200) · Amb una entitat, la seua persona titular, al mateix grup
 *     «Connexió directa», només si ella ho ha triat i té el perfil públic
 *     (useTitularDeConnexio, 2610250300). Mai qui ha publicat un element.
 *   · P1-22 (assalt 261101, T5b) · Tot el text visible passa per t() amb la
 *     reserva valenciana lletra per lletra (també els mòduls purs, amb `t`
 *     opcional). Les etiquetes suggerides i el missatge del xat ixen en la
 *     llengua de qui connecta. El nom de la carpeta (Notes) i el cos desat de
 *     la nota (DES_DE, «Font:») no es traduïxen ací.
 *   · P1-15 (assalt 261101, T5b) · Els resultats del padró s'anuncien en una
 *     regió viva (sense rol: l'únic status és el del resum) i les carpetes
 *     són un grup amb el nom de «On arriba».
 *   · FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · /connectar a
 *     tota l'amplària, en una graella de targetes (modeDeConnectar.js). En el
 *     PERFIL d'una persona, una entitat o un grup amb relació ('social'), el
 *     primer que es veu és CONNECTAR: la targeta de la connexió directa
 *     (fitxa compacta i «Connectar com a» a l'esquerra; l'avís i el primari
 *     gran de BlocRelacio a la dreta) i, davall, la d'incloure la persona en
 *     una entitat teua (BlocIncloureEnEntitat) o la de formar-ne part amb un
 *     rol (BlocFormarPart), sense columna lateral (revisió 261104, RA-01: el
 *     primari dins de la pantalla a 1280×800). En un ELEMENT ('element'),
 *     l'objecte i les notes, obertes i primàries, i la relació i formar part a
 *     la lateral. FEDI-26 (ordre directa del Mestre, 01:31 CET; Regla 1;
 *     correcció connectar-03, 261104) · DEROGAT «Guardar a les teues notes»
 *     plegat en 'social': connectar amb una persona, una entitat o un grup és
 *     una connexió social i no porta mai al Bloc (cap nota amb el nom del
 *     perfil). Les notes només es munten en 'element'. DEROGAT de D1
 *     «l'únic primari és el del MAS»: un primari per vista, connectar en un
 *     perfil i guardar en un element. El logotip de la capçalera manté els
 *     600px de .page-title-logo (IDEA-93, 261105: derogada l'excepció de 260px).
 *     El contingut de FORA no canvia de
 *     .sdp-connectar cap avall (la guarda de Notes, PrevisualitzacioExtern).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { Check, Globe, Layers, NotebookPen, X } from 'lucide-react';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotesData } from '../notes/NotesDataContext';
import { useXat } from '../xat/XatContext.jsx';
import { CARPETA_CONNECTATS, NOM_CARPETA_CONNECTATS, carpetesDelBloc, iconaDeCarpeta, nomDeCarpeta } from '../notes/carpetes.js';
import { autorDe, esRutaInterna, getSectionItemPath, objecteDe, objecteDePerfil, tipusDeSeccio, TIPUS_OBJECTE } from '../../config/navigation.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { CLAUS_FUNDACIONALS, ENTITATS_SEED, IAIA_ID, PERSONA_PILOT, aliesDeLActor, esComptePersonaPilot } from '../../data/identitatsSeed.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { esBackendInabastable } from '../../data/errorsBackend.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Boto, Camp, CampText, Carregant, Casella, GrupCamps, GrupOpcions, UniversalCard } from '../../components/PedraSeca/index.js';
import { AvatarResolt } from '../../components/universal/identitat/AvatarResolt.jsx';
import { interlocutorDelPrivat, urlPerCompartir, useUbicacioApp } from '../../components/PedraSeca/hooks/useAccions.js';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { netejaDrets, normalitzaAbast, teDretsReservats } from '../../data/origenNota.js';
import { useOriginalDeConnexio } from '../detail/elementDeSeccio.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { categoriesBase } from '../../data/personalitzacio.js';
import { contingutExternDeParams, notaDeContingutExtern } from './contingutExtern.js';
import {
  LIMIT_GRUPS, LIMIT_PERSONES, estatDelXat, etiquetaObjecte, grupsDeXat, missatgeDeConnexio,
  missatgeDeLError, modeAplicable, opcionsDAbast
} from './abastConnexio.js';
/* El cos que es desa a la nota: mòdul pur de connexions, el mateix que llig el lector del MAS. */
import { aHtml, contingutDeLaConnexio } from '../notes/connexions.js';
/* D4 · l'avís dels drets reservats, el mateix de l'editor i del selector de visibilitat. */
import { TEXT_DRETS_RESERVATS, TITOL_DRETS_RESERVATS } from '../notes/visibilitatNota.js';
import { useAplicaAbast } from './useAplicaAbast.js';
import { ResumConnexio } from './ResumConnexio.jsx';
/* IDEA-22 (T5) · «Connectar com a»: les píndoles de tria única del Mercat (radiogroup), no una peça nova. */
import { SelectorDeVariacions } from '../mercat/SelectorDeVariacions.jsx';
import { esRolQueMana } from '../../components/universal/identitat/rols.js';
import { omple } from '../../config/moderacio.js';
/* IDEA-14 (Directiva del Mestre, 261024; G-04) · els camins «Entre persones» i
   «Formar part», i la fitxa de confiança d'un perfil o d'una organització. */
import { BlocRelacio } from './BlocRelacio.jsx';
import { BlocFormarPart } from './organitzacio/BlocFormarPart.jsx';
import { useFitxaDeConnexio } from './useFitxaDeConnexio.js';
/* IDEA-22 (punt 2) · La titular que ha triat mostrar-se (capacitat 'titularPublic'). */
import { useTitularDeConnexio } from './useTitularDeConnexio.js';
import { teSeguiments } from './useSeguiment.js';
/* FEDI-22 (ordre del Mestre, 261103) · La disposició de la vista i la targeta d'incloure en una entitat teua. */
import { disposicioDeLaVista, entitatsPerIncloure, esPerfilSocial } from './modeDeConnectar.js';
import { BlocIncloureEnEntitat } from './organitzacio/BlocIncloureEnEntitat.jsx';
import { teMembresOrganitzacio } from './organitzacio/useIncloureEnEntitat.js';

/* P1-22 · Parells [clau, reserva]: l'etiqueta es desa en la llengua de qui connecta. */
const SUGGESTED_TAGS = Object.freeze([
  Object.freeze(['section.connectar.suggerida.historia', 'Història local']),
  Object.freeze(['section.connectar.suggerida.interessant', 'Interessant']),
  Object.freeze(['section.connectar.suggerida.patrimoni', 'Patrimoni']),
  Object.freeze(['section.connectar.suggerida.gent', 'Gent del Poble']),
  Object.freeze(['section.connectar.suggerida.debat', 'Debat'])
]);
/* Les mateixes categories de sèrie que el Bloc (NotesSection): Onada 11
   (261010; prompt 261010_1730, tasca 2) · la còpia local s'ha unificat amb
   classificacioBloc.js i, dins del component, passa per categoriesBase amb la
   taxonomia del poble (sense personalització, la mateixa llista). */
const TIPUS_DE_PERFIL = new Set(['persona', 'entitat', 'grup', 'ia']);
/* PS-11 (auditoria Pedra Seca 261025) · L'identificador de reserva d'un element
   que arriba sense títol ni item_id: l'itemId i el títol que la nota recorda,
   com sempre. És una dada, no el text de la targeta. */
export const ELEMENT_DESCONEGUT = 'element-desconegut';

/** El que la nota recordarà de l'element connectat. */
export function origenDeLaConnexio(params) {
  const sectionId = params.get('sectionId') || '';
  const itemId = params.get('item_id') || '';
  const titol = params.get('title') || itemId || ELEMENT_DESCONEGUT;
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

/* IDEA-22 (pla 261025_0045, T5) · El valor de la píndola de la persona: cap id d'organització. */
export const COM_PERSONA = '__persona';
const ETIQUETA_DE_KIND = Object.freeze({
  company: ['section.connectar.com.empresa', '{nom} (empresa)'],
  entity: ['section.connectar.com.entitat', '{nom} (entitat)'],
  group: ['section.connectar.com.grup', '{nom} (grup)']
});

/**
 * IDEA-22 (pla 261025_0045, T5) · Els barrets amb què qui mira es pot
 * connectar: la persona i les organitzacions que ADMINISTRA (owner o admin;
 * un membre no hi parla en nom de ningú). Opcions per a SelectorDeVariacions
 * ({ valor, etiqueta, nom }). Sense cap organització que administre, cap
 * opció: no hi ha res a triar i no es pinta cap selector. Pura.
 */
export function actorsPerConnectar(identitats = [], t = (_clau, reserva) => reserva) {
  const llista = Array.isArray(identitats) ? identitats : [];
  const persona = llista.find((identitat) => identitat?.tipus === 'persona' && identitat.id != null && identitat.nom);
  const organitzacions = llista.filter((identitat) => identitat?.tipus === 'entitat' && identitat.id != null
    && identitat.nom && esRolQueMana(identitat.rol));
  if (!persona || !organitzacions.length) return [];
  return [
    { valor: COM_PERSONA, etiqueta: omple(t('section.connectar.com.persona', '{nom} (persona)'), { nom: persona.nom }), nom: persona.nom },
    ...organitzacions.map((org) => ({
      valor: String(org.id),
      etiqueta: omple(t(...(ETIQUETA_DE_KIND[org.kind] || ETIQUETA_DE_KIND.entity)), { nom: org.nom }),
      nom: org.nom
    }))
  ];
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

/**
 * C0200-06 (auditoria Codex 261025_0200) · QUINA de les identitats de qui
 * mira és un destí, amb les mateixes fonts que idsDeQuiConnecta:
 * { tipus: 'entitat', id } (una organització que administra; `identitats`
 * només en porta d'owner o admin, IdentitatContext · potSignarPer, i `id` és
 * el seu, no l'àlies), { tipus: 'persona' } (ella: la sessió, la persona i els
 * seus àlies, el compte pilot acreditat), { tipus: 'desconeguda' } si només el
 * xat la diu seua, o null si no és seua. Pura.
 */
export function identitatPropiaDe(idDesti, { currentUser = null, actor = null, identitats = [], dataMode = 'remote', xat = null } = {}) {
  const id = String(idDesti ?? '');
  if (!id) return null;
  const totes = [actor, ...(Array.isArray(identitats) ? identitats : [])].filter((identitat) => identitat?.id != null);
  const entitat = totes.find((identitat) => identitat.tipus === 'entitat' && aliesDeLActor(identitat, { dataMode }).has(id));
  if (entitat) return { tipus: 'entitat', id: String(entitat.id) };
  if ((currentUser?.id != null && String(currentUser.id) === id)
    || totes.some((identitat) => identitat.tipus !== 'entitat' && aliesDeLActor(identitat, { dataMode }).has(id))
    || (esComptePersonaPilot(currentUser) && PERSONA_PILOT.alies.includes(id))) return { tipus: 'persona' };
  return xat?.esDeQuiMira?.(id) === true ? { tipus: 'desconeguda' } : null;
}

/**
 * C0200-06 · Amb quins barrets de «Connectar com a» (actorsPerConnectar) es
 * pot connectar amb un destí, com les regles de public.segueix
 * (2610250100): un destí que no és de qui mira, amb tots (la llista buida
 * vol dir la persona, sense selector). Un destí seu (identitatPropiaDe), mai
 * com a persona (persona → ella mateixa o → entitat que administra:
 * SDP-SEG-003) ni com a ell mateix (entitat → ella mateixa); sí com a una
 * ALTRA entitat que administra (A → B, i entitat → la persona que
 * l'administra). Una identitat desconeguda, cap. Una llista buida per a un
 * destí seu vol dir: cap relació. Pura.
 */
export function actorsPerAlDesti(actors = [], propia = null) {
  const llista = Array.isArray(actors) ? actors : [];
  if (!propia) return llista;
  if (propia.tipus !== 'persona' && propia.tipus !== 'entitat') return [];
  const ella = propia.tipus === 'entitat' ? String(propia.id ?? '') : null;
  return llista.filter((opcio) => opcio.valor !== COM_PERSONA && opcio.valor !== ella);
}

/* Gauntlet 261022_0225 (CA-1) · En remot, un id de la llavor (un àlies de la
   persona pilot, una entitat fundacional del padró) no és l'id de cap persona ni entitat
   del servidor (W4-09): crea_fil_directe no hi pot obrir cap xat. El format
   de l'id és cosa del proveïdor (W4-10): ací no se'n comprova cap.
   Revisió (CN-R2) · Sense mirar el tipus declarat: un àlies de l'entitat
   pilot signat com a persona ('soc-de-poble_official' sense author_entity_id)
   o la IAIA (en remot, el seu xat és el públic de /iaia) tampoc no en tenen. */
const UUID_REAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDS_DE_LA_LLAVOR = new Set([
  ...PERSONA_PILOT.alies,
  /* R2C2X-02 · La resta del padró pot declarar UUID reals del directori:
     Oli de La Torre conserva el contacte i no rep tracte fundacional.
     FEDI-26 · Els àlies amb UUID real del servidor (Sóc de Poble i El Rentonar)
     tampoc no són ids ficticis de la llavor i conserven la connexió en remot. */
  ...ENTITATS_SEED.filter((entitat) => CLAUS_FUNDACIONALS.includes(entitat.slug))
    .flatMap((entitat) => [entitat.id, entitat.slug, ...entitat.alies])
    .filter((id) => !UUID_REAL.test(String(id))),
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
 * mateixes de l'autor (contacteDe): qui mira o una entitat que representa,
 * sense xat i amb `propia` (C0200-06), cap id de la llavor en remot i el
 * pilot pel xat de Sóc de Poble. Una IA no és cap persona (té el seu «Parla
 * amb…»): cap contacte. */
export function perfilPerConnectar(perfil, opcions = {}) {
  const objecte = objecteDePerfil(perfil);
  if (!objecte || !['persona', 'entitat', 'grup'].includes(objecte.tipus)) return null;
  const qui = { tipus: objecte.tipus, id: objecte.id, nom: objecte.titol.trim(), projecte: objecte.projecte === true };
  const contacte = contacteDe(qui, objecte, opcions);
  return contacte ? { ...contacte, deFitxa: true } : null;
}

/* Les guardes del contacte humà, una sola còpia per a l'autor i per al perfil
   (CA-1, CA-2, CN-R2): `qui` és { tipus, id, nom, projecte } i `objecte`, el
   descriptor d'on es trau l'interlocutor (interlocutorDelPrivat).
   C0200-06 (auditoria Codex 261025_0200) · Abans un destí de qui mira (ella
   o una entitat que administra) no tenia cap contacte, i A → B o entitat →
   la persona que l'administra no es podien fer. Ara en té un amb `propia`
   (identitatPropiaDe), sense interlocutor i sense xat: mai un directe amb tu
   mateixa. Qui hi pot connectar ho decidix actorsPerAlDesti. */
function contacteDe(qui, objecte, opcions = {}) {
  const { currentUser = null, actor = null, identitats = [], dataMode = 'remote', xat = null } = opcions;
  const id = String(qui?.id ?? '');
  if (!id.trim() || id.length > 200 || /[\s\u0000-\u001f\u007f]/.test(id)) return null;
  const propis = idsDeQuiConnecta({ currentUser, actor, identitats, dataMode });
  const esDeQuiMira = (candidat) => propis.has(String(candidat ?? '')) || xat?.esDeQuiMira?.(candidat) === true;
  const nom = qui.nom || '';
  if (!nom) return null;
  const tipusDeSeguiment = qui.tipus === 'persona' ? 'persona' : 'entitat';
  const base = { nom, tipus: qui.tipus, id, deFitxa: false };
  if (esDeQuiMira(id)) {
    const propia = identitatPropiaDe(id, opcions);
    /* Una identitat que no casa amb el tipus del destí, o que no se sap quina és: res, com abans. */
    if (!propia || propia.tipus !== tipusDeSeguiment) return null;
    if (dataMode === 'remote' && esIdDeLaLlavor({ id })) return null;
    return { ...base, interlocutor: null, propia, seguiment: { tipus: tipusDeSeguiment, id: propia.tipus === 'entitat' ? propia.id : id } };
  }
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
  /* PS-11 · Sense títol a l'URL ni original resolt, la targeta no ensenya
     l'identificador de reserva: una etiqueta llegible. La nota es desa igual. */
  const titolDeLaTargeta = contextTitle === ELEMENT_DESCONEGUT && !params.get('title')
    ? t('section.connectar.senseTitol', 'Element sense títol') : contextTitle;
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
  /* P1-15 (auditoria Port Neutral 261025) · La fitxa i la titular depenen de
     qui mira: la persona entra a la clau de cada lectura. */
  const usuariId = currentUser?.id ?? null;
  const fitxaDelPerfil = useFitxaDeConnexio(peticions.perfil, { config, usuariId });
  const fitxaDeLaOrganitzacio = useFitxaDeConnexio(peticions.organitzacio, { config, usuariId });
  /* IDEA-22 (T5) · Els barrets amb què qui mira es pot connectar. */
  const actorsConnectar = useMemo(() => actorsPerConnectar(identitats, t), [identitats, t]);
  const contacteDelDesti = autorPerConnectar(itemOriginal, { seccio: origenDeLURL.sectionId, ...opcionsDelContacte })
    ?? perfilPerConnectar(fitxaDelPerfil.perfil, opcionsDelContacte);
  /* C0200-06 (auditoria Codex 261025_0200) · Un destí de qui mira (ella o una
     entitat que administra) només es connecta com a una ALTRA identitat seua;
     si no en té cap, o si el node no sap connectar (no hi ha xat amb tu
     mateixa), no hi ha relació, com abans. */
  const actorsDelDesti = actorsPerAlDesti(actorsConnectar, contacteDelDesti?.propia ?? null);
  const contacte = contacteDelDesti?.propia && (!actorsDelDesti.length || !teSeguiments()) ? null : contacteDelDesti;
  /* En remot sense sessió, la fitxa d'una altra persona no es llig: el camí es mostra sense nom i porta a entrar. */
  const personaSenseNom = !contacte && !teSessio && dataMode === 'remote' && origenDeLURL.sectionId === 'perfil'
    && origenDeLURL.objecte === 'persona' && Boolean((params.get('item_id') || '').trim());
  const orgId = peticions.orgId;
  const fitxaOrg = !orgId ? null : (peticions.organitzacio ? fitxaDeLaOrganitzacio : fitxaDelPerfil);
  /* C0200-06 · «Formar part» d'una organització que administres no hi té res a demanar: cap contacte. */
  const senseLaPropia = (candidat) => (candidat?.propia ? null : candidat);
  const contacteOrg = !orgId ? null
    : senseLaPropia(peticions.organitzacio ? perfilPerConnectar(fitxaDeLaOrganitzacio.perfil, opcionsDelContacte) : (contacte?.deFitxa ? contacte : null));
  /* IDEA-22 (punt 2 de la Directiva; pla 261025_0200) · La persona titular
     d'una entitat que no és de qui mira, NOMÉS si ella ho ha triat i té el
     perfil públic (titular_public, 2610250300): el servidor no diu mai qui
     administra una entitat. Passa per les guardes de sempre: si qui mira n'és
     la titular, res. Sense la capacitat, sense sessió o amagada, ni rastre. */
  const titularDe = contacte && !contacte.propia && ['entitat', 'grup'].includes(contacte.tipus) ? contacte.seguiment?.id ?? null : null;
  const titular = useTitularDeConnexio(titularDe, { config, teSessio, usuariId });
  const contacteTitular = titular.titular
    ? senseLaPropia(perfilPerConnectar({ tipus: 'persona', id: titular.titular.id, nom: titular.titular.nom }, opcionsDelContacte))
    : null;
  const ambRelacio = Boolean(contacte) || personaSenseNom;
  const ambCamins = ambRelacio || Boolean(orgId);
  /* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · 'social' (un
     perfil amb relació, o amb la fitxa encara carregant) o 'element'. C1 ·
     sense dependre d'orgId: un perfil sense relació torna a 'element'. Un
     primari per vista: el de la relació en 'social'; el de les notes en
     'element'. */
  const esPerfil = esPerfilSocial(origenDeLURL);
  const carregantFitxa = esPerfil && fitxaDelPerfil.estat === 'carregant' && !contacte;
  const social = disposicioDeLaVista({ esPerfil, ambRelacio, carregantFitxa }) === 'social';
  const notesPrimari = !social;
  /* «Guardar a les teues notes» és un <details>, obert en 'element' (FEDI-26: en
     'social' no es munta), i s'obri si la vista passa a 'element' (la fitxa arriba sense relació).
     Ronda 7 (GLOBAL-03) · L'obertura es fa en el mateix render que canvia la
     vista (estat derivat del valor anterior), no en un efecte: cap commit pinta
     la vista 'element' amb les notes plegades. */
  const [notesObertes, setNotesObertes] = useState(() => !esPerfil || notesPrimari);
  const [notesPrimariAbans, setNotesPrimariAbans] = useState(notesPrimari);
  if (notesPrimari !== notesPrimariAbans) {
    setNotesPrimariAbans(notesPrimari);
    if (notesPrimari) setNotesObertes(true);
  }
  /* FEDI-22 · Targeta 2 d'una PERSONA: incloure-la en una entitat que administres
     (C2: la mateixa font que «Connectar com a»), amb la capacitat de membres. */
  const entitatsIncloure = useMemo(() => entitatsPerIncloure(actorsConnectar, identitats), [actorsConnectar, identitats]);
  const ambIncloure = social && teSessio && origenDeLURL.objecte === 'persona' && Boolean(contacte) && !contacte.propia
    && contacte.seguiment?.tipus === 'persona' && entitatsIncloure.length > 0 && teMembresOrganitzacio();
  /* FEDI-26 (Regla 1; correcció connectar-03, 261104) · DEROGAT FEDI-22 (C11), la
     nota d'un perfil amb el nom de la fitxa: en 'social' no hi ha notes. */
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

  /* D6 · la còpia de la connexió (A les teues notes) és sempre del Bloc de la persona.
     IDEA-22 (T5) · La relació, en canvi, pot ser d'una organització que administres. */
  const persona = (identitats || []).find((identitat) => identitat.tipus === 'persona')?.nom
    || (actor?.tipus === 'persona' ? actor.nom : null);
  /* IDEA-22 (T5) · «Connectar com a»: d'entrada, l'actor de la sessió si és una
     organització que administres; si no, la persona. Triar-ne un altre NO canvia
     l'actor global (estat d'esta vista).
     C0200-06 · Només els barrets legítims per a este destí (actorsPerAlDesti):
     per a un destí teu, la primera entitat que pot, mai la persona. */
  const potComPersona = !actorsDelDesti.length || actorsDelDesti.some((opcio) => opcio.valor === COM_PERSONA);
  const comPerDefecte = actor?.tipus === 'entitat' && actorsDelDesti.some((opcio) => opcio.valor === String(actor.id))
    ? String(actor.id) : (potComPersona ? COM_PERSONA : actorsDelDesti[0].valor);
  const [comTriat, setComTriat] = useState(null);
  const comValor = comTriat !== null && actorsDelDesti.some((opcio) => opcio.valor === comTriat) ? comTriat : comPerDefecte;
  const comEntitat = comValor === COM_PERSONA ? null : actorsDelDesti.find((opcio) => opcio.valor === comValor) || null;
  /* C0200-02 · El nom de la persona: el xat («Escriu-li») és seu, encara que es connecte com a entitat. */
  const nomPersona = actorsConnectar.find((opcio) => opcio.valor === COM_PERSONA)?.nom || '';

  const grups = useMemo(() => grupsDeXat(chatThreads, t), [chatThreads, t]);
  /* Una llista buida mentre el xat carrega (o si ha fallat) no vol dir «cap grup». */
  const xat = estatDelXat({ status: statusXat, avis: avisXat, fils: chatThreads });
  const opcions = useMemo(() => opcionsDAbast({ dataMode, teSessio, grups, xat, t }), [dataMode, teSessio, grups, xat, t]);
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
        /* P1-22 · Sense missatge, el text de reserva es tria en pintar (t): l'efecte no depén de la llengua. */
        .catch((e) => { if (viu) setPadro({ estat: 'error', membres: [], error: e?.message || '' }); });
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
  const etiquetesSuggerides = useMemo(() => SUGGESTED_TAGS.map(([clau, reserva]) => t(clau, reserva)), [t]);
  const suggerides = etiquetesSuggerides.filter((tag) => !customTags.includes(tag));
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
  const nomCarpeta = nomDeCarpeta(displayFolders.find((folder) => folder.id === selectedFolder), t) || NOM_CARPETA_CONNECTATS;

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
        title: aHtml(origen.titol),
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
      /* P1-22 · El missatge ix en la llengua de qui connecta. */
      const missatge = missatgeDeConnexio(origen, origen.ruta ? urlPerCompartir(origen.ruta, router) : '', t);
      const { resultats } = await aplica({ nota, origen: origenDesat, abast: tria, missatge });
      setResum({
        ruta: rutaNota,
        /* 261024 correccions (directiva del Mestre 15:05, Gemini G2-02) · cap «MAS» a la interfície. */
        resultats: [{
          clau: 'mas', nom: t('section.connectar.resum.notes', 'Les teues notes'), estat: 'fet',
          detall: omple(t('section.connectar.resum.connectada', 'Connectada a «{carpeta}».'), { carpeta: nomCarpeta })
        }, ...resultats]
      });
    } catch (err) {
      setError(missatgeDeLError(err, t));
    } finally {
      setIsSaving(false);
    }
  };

  /* P1-22 · Parells explícits per al singular i el plural (cap clau dinàmica). */
  const n = mode === 'persones' ? persones.length : grupsDeLaTria.length;
  const etiquetaConnectar = calEntrar ? t('section.connectar.boto.entra', 'Entra per a connectar')
    : blocCarregant ? t('section.connectar.boto.obrintBloc', 'Obrint el teu Bloc…')
      : esperantOriginal ? t('section.connectar.boto.carregantOriginal', 'Carregant l’original…')
        : mode === 'persones' ? omple(n === 1
          ? t('section.connectar.boto.enviaPersona', 'Connectar i enviar a {n} persona')
          : t('section.connectar.boto.enviaPersones', 'Connectar i enviar a {n} persones'), { n })
          : mode === 'grups' ? omple(n === 1
            ? t('section.connectar.boto.enviaGrup', 'Connectar i enviar a {n} grup')
            : t('section.connectar.boto.enviaGrups', 'Connectar i enviar a {n} grups'), { n })
            : `${t('section.connectar.connect', 'Connectar a')} «${nomCarpeta}»`;
  /* D1 · Sense sessió en remot, a entrar; en tornar, esta mateixa consulta. */
  const entra = () => navigate(rutaPerAEntrar(params));

  /* FEDI-22 · Les peces de la graella. */
  const idRelacio = `${id}-cami-relacio`;
  /* La fitxa compacta (C7): només en 'social' i amb el contacte de la fitxa de confiança, mai l'URL. */
  const perfilDeLaFitxa = social && contacte?.deFitxa ? fitxaDelPerfil.perfil : null;
  const pobleDeLaFitxa = typeof perfilDeLaFitxa?.poble === 'string' ? perfilDeLaFitxa.poble.trim() : '';
  const tipusDeLaFitxa = etiquetaObjecte(origenDeLURL.objecte, t);
  /* FEDI-22 · Qui (la fitxa compacta) i amb quin barret: en 'social' van junts a
     la columna de l'esquerra de T1, i la relació (l'avís i el primari) a la de la
     dreta (RA-01, revisió 261104: el primari dins de la pantalla a 1280×800). */
  const fitxaCompacta = perfilDeLaFitxa ? (
    <div className="sdp-connectar__fitxa">
      <AvatarResolt mida="lg" alt="" nom={perfilDeLaFitxa.nom} llavor={perfilDeLaFitxa.id} src={perfilDeLaFitxa.avatar || null} />
      <div className="sdp-connectar__fitxa-text">
        <p className="sdp-connectar__fitxa-nom">{String(perfilDeLaFitxa.nom).trim()}</p>
        <p className="sdp-connectar__ajuda">{pobleDeLaFitxa
          ? omple(t('section.connectar.fitxa.meta', '{tipus} · {poble}'), { tipus: tipusDeLaFitxa, poble: pobleDeLaFitxa })
          : tipusDeLaFitxa}</p>
      </div>
    </div>
  ) : null;
  /* IDEA-22 (T5) · Amb quin barret et connectes, només si administres alguna organització.
     C0200-06 · Les opcions, només les legítimes per a este destí (per a un de teu, també una sola). */
  const selectorCom = actorsConnectar.length > 1 && !calEntrar ? (
    <SelectorDeVariacions llegenda={t('section.connectar.com.llegenda', 'Connectar com a')}
      opcions={actorsDelDesti} valor={comValor} onCanvi={setComTriat} />
  ) : null;
  const relacio = (
    <>
      {/* FEDI-22 · En 'social', el primari gran de la vista és el d'esta relació. */}
      <BlocRelacio contacte={contacte} deFitxa={contacte?.deFitxa === true} calEntrar={calEntrar} onEntra={entra}
        dataMode={dataMode} config={config} com={comEntitat?.valor ?? null} nomCom={comEntitat?.nom ?? ''} nomPersona={nomPersona}
        principal={social} />
      {/* IDEA-22 (punt 2) · La titular que ho ha triat, al mateix grup i amb el mateix barret:
          cap capçalera de camí nova ni cap botó primari. */}
      {contacteTitular ? (
        <>
          <p>{omple(t('section.connectar.titular.intro', '{nom} és titular de {entitat} i ha triat que es veja ací.'), { nom: contacteTitular.nom, entitat: contacte.nom })}</p>
          <BlocRelacio contacte={contacteTitular} deFitxa calEntrar={calEntrar} onEntra={entra}
            dataMode={dataMode} config={config} com={comEntitat?.valor ?? null} nomCom={comEntitat?.nom ?? ''} nomPersona={nomPersona} />
        </>
      ) : null}
    </>
  );
  /* Dues columnes dins de T1 només si hi ha qui i barret a l'esquerra (si no, una sola). */
  const ambQui = Boolean(fitxaCompacta) || Boolean(selectorCom);
  const targetaDirecta = ambRelacio || carregantFitxa ? (
    <section className={social ? 'sdp-connectar__targeta sdp-connectar__targeta--directa' : 'sdp-connectar__targeta'}
      role="group" aria-labelledby={idRelacio} aria-busy={carregantFitxa ? 'true' : undefined}>
      <p id={idRelacio} className="sdp-connectar__tipus">{t('section.connectar.camins.relacio', 'Connexió directa')}</p>
      {/* Mentre arriba la fitxa, un esquelet de text (sense status): la graella no salta. */}
      {carregantFitxa ? (
        <p className="sdp-connectar__ajuda">{t('section.connectar.fitxa.carregant', 'Carregant la fitxa…')}</p>
      ) : social ? (
        <div className={ambQui ? 'sdp-connectar__directa sdp-connectar__directa--dues' : 'sdp-connectar__directa'}>
          {ambQui ? (
            <div className="sdp-connectar__qui">
              {fitxaCompacta}
              {selectorCom}
            </div>
          ) : null}
          <div className="sdp-connectar__relacio">{relacio}</div>
        </div>
      ) : (
        <>
          {selectorCom}
          {relacio}
        </>
      )}
    </section>
  ) : null;
  /* FEDI-22 · Targeta 2 d'una persona: incloure-la en una entitat teua amb el seu rol.
     RA-03 (revisió 261104) · El rètol diu el que fa: «Incloure en la teua entitat», no
     «Formar part». RA-05 · El poble de la fitxa de confiança, per a avisar abans del clic. */
  const targetaIncloure = ambIncloure ? (
    <section className="sdp-connectar__targeta" role="group" aria-labelledby={`${id}-cami-incloure`}>
      <p id={`${id}-cami-incloure`} className="sdp-connectar__tipus">{t('section.connectar.camins.incloure', 'Incloure en la teua entitat')}</p>
      <BlocIncloureEnEntitat entitats={entitatsIncloure} persona={{ id: contacte.seguiment.id, nom: contacte.nom, poble: pobleDeLaFitxa }}
        config={config} usuariId={usuariId} />
    </section>
  ) : null;
  /* IDEA-22 (T5) · Administrar l'organització ja no viu ací: és del Perfil («Membres i connexions»). */
  const targetaFormarPart = orgId ? (
    <section className="sdp-connectar__targeta" role="group" aria-labelledby={`${id}-cami-formar-part`}>
      <p id={`${id}-cami-formar-part`} className="sdp-connectar__tipus">{t('section.connectar.camins.formarPart', 'Formar part')}</p>
      <BlocFormarPart orgId={orgId} contacte={contacteOrg} config={config} nom={fitxaOrg?.perfil?.nom || null}
        tipusOrg={fitxaOrg?.perfil?.tipus || 'entitat'} carregant={fitxaOrg?.estat === 'carregant'} onEntra={entra} />
    </section>
  ) : null;
  /* FEDI-22 · Targeta 3 · «Guardar a les teues notes»: la connexió de sempre (una
     còpia al Bloc), amb el seu estat, les refs C16, l'ordre i els textos.
     FEDI-26 (Regla 1; correcció connectar-03, 261104) · Només d'un element: mai
     en la vista 'social' d'un perfil. */
  const notesDelBloc = (
    <details className="sdp-connectar__notes" open={notesObertes} onToggle={(e) => setNotesObertes(e.currentTarget.open)}>
      <summary className="sdp-connectar__notes-resum">
        <span className="sdp-connectar__notes-icona" aria-hidden="true"><NotebookPen size={24} aria-hidden="true" focusable="false" /></span>
        <span className="sdp-connectar__notes-rotul">
          <span className="sdp-connectar__notes-titol">{t('section.connectar.notes.titol', 'Guardar a les teues notes')}</span>
          <span className="sdp-connectar__ajuda">{t('section.connectar.notes.subtitol', 'Una còpia al teu Bloc. En privat, no avisa ningú.')}</span>
        </span>
      </summary>
      <div className="sdp-connectar__notes-cos">
        {/* 261024 correccions (G2-02 i R3-05) · L'ajuda diu el que fan les opcions de davall: només la privada no avisa ningú.
            FEDI-26 (261104) · Les notes només es munten en 'element': cap branca d'açò depén ja de 'social'. */}
        {ambCamins ? (
          <p className="sdp-connectar__ajuda">
            {t('section.connectar.mas.ajuda', 'Una còpia al teu Bloc per a llegir-la després, que no et fa membre de res. Tu tries qui ho pot vore: en privat no avisa ningú; a persones o grups de xat els enviarem l’enllaç per xat, i a tot el poble la compartiràs tu al Mur.')}
          </p>
        ) : null}

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-privacitat`}>
          <h3 id={`${id}-privacitat`} className="sdp-connectar__titol-seccio">{t('section.connectar.privacy', 'Privacitat de la connexió')}</h3>
          <GrupOpcions
            llegenda={t('section.connectar.abast.llegenda', 'Qui ho pot vore?')}
            nom={`${id}-abast`}
            aspecte="targetes"
            textTriada={t('section.connectar.triada', 'Triada')}
            opcions={opcions}
            valor={mode}
            onCanvi={setModeTriat}
            disabled={isSaving || Boolean(resum)}
          />

          {mode === 'persones' ? (
            <div ref={panellPersonesRef} className="sdp-connectar__panell">
              <Camp etiqueta={t('section.connectar.padro.cerca', 'Cerca al padró del poble')}
                ajuda={omple(t('section.connectar.padro.ajuda', 'Tria fins a {n} persones. Només reben l’enllaç: la connexió continua sent teua.'), { n: LIMIT_PERSONES })}>
                <CampText value={cerca} onChange={(e) => setCerca(e.target.value)} autoComplete="off" />
              </Camp>
              {padro.estat === 'carregant' ? <Carregant etiqueta={t('section.connectar.padro.buscant', 'Buscant al padró…')} /> : null}
              {/* P1-15 (assalt 261101, T5b) · El resultat de cada cerca s'anuncia: la regió
                  hi és des que s'obri el panell i es buida mentre busca, i així es torna
                  a dir encara que el nombre no canvie. Sense rol (l'únic status és el del
                  resum) i amb un text distint del visible. */}
              <p className="sdp-nomes-lector" aria-live="polite">
                {padro.estat === 'llest' ? omple(t('section.connectar.padro.resultats', 'Resultats al padró: {n}.'), { n: padro.membres.length }) : ''}
              </p>
              {padro.estat === 'error' ? <Alerta to="error">{padro.error || t('section.connectar.padro.error', 'No s’ha pogut obrir el padró del poble.')}</Alerta> : null}
              {padro.estat === 'llest' && padro.membres.length === 0 ? (
                <p className="sdp-connectar__ajuda">{t('section.connectar.padro.cap', 'Ningú del padró coincidix amb la cerca.')}</p>
              ) : null}
              {padro.membres.length > 0 ? (
                <ul className="sdp-connectar__pindoles" aria-label={t('section.connectar.padro.gent', 'Gent del padró')}>
                  {padro.membres.map((membre) => {
                    const clau = String(membre.usuari_id);
                    const triada = persones.some((p) => p.id === clau);
                    return (
                      <li key={clau}>
                        <button type="button" className="sdp-connectar__pindola" aria-pressed={triada}
                          disabled={!triada && persones.length >= LIMIT_PERSONES}
                          onClick={() => commutaPersona(membre)}>
                          {membre.tipus === 'entitat' ? omple(t('section.connectar.padro.entitat', '{nom} · entitat'), { nom: membre.nom }) : membre.nom}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <p className="sdp-connectar__ajuda" aria-live="polite">
                {omple(t('section.connectar.padro.triades', '{n} de {limit} persones triades.'), { n: persones.length, limit: LIMIT_PERSONES })}
              </p>
              {persones.length > 0 ? (
                <ul ref={personesTriadesRef} className="sdp-connectar__pindoles" aria-label={t('section.connectar.padro.triadesLlista', 'Persones triades')}>
                  {persones.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                        aria-label={omple(t('section.connectar.padro.lleva', 'Lleva {nom} de la llista'), { nom: p.nom })} onClick={() => llevaPersona(p.id)}>
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
              <GrupCamps llegenda={omple(t('section.connectar.grups.llegenda', 'Grups de xat on ja eres (fins a {n})'), { n: LIMIT_GRUPS })}>
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
            <Alerta to="info" titol={t('section.connectar.poble.titol', 'Compartir al Mur, un pas més')}>
              {t('section.connectar.poble.text', 'La tria queda amb la connexió, però el Mur no la rep sola: obri-la a les teues notes i prem «Compartir al Mur». El Mur el pot llegir qualsevol persona, també sense compte.')}
            </Alerta>
          ) : null}
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-caixa`}>
          <h3 id={`${id}-caixa`} className="sdp-connectar__titol-seccio">{t('section.connectar.carpeta.titol', 'On arriba')}</h3>
          <p className="sdp-connectar__ajuda">
            {omple(t('section.connectar.carpeta.ajuda', 'Per defecte, tota connexió arriba a «{carpeta}»; des d’allí la podràs moure a qualsevol carpeta del teu Bloc.'), { carpeta: NOM_CARPETA_CONNECTATS })}
          </p>
          {/* P1-15 (assalt 261101, T5b) · Les carpetes són una sola tria: un grup amb nom. */}
          <div className="sdp-connectar__carpetes" role="group" aria-labelledby={`${id}-caixa`}>
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
                  <span className="sdp-connectar__carpeta-nom">{nomDeCarpeta(folder, t)}</span>
                  {/* Correcció C18 (260928) · La triada es llig sense color (la
                      vora taronja no arriba al 3:1). Sempre hi és, perquè triar
                      no moga la graella, i només es veu en la triada (CSS, des
                      d'aria-pressed, que ja diu l'estat: aria-hidden). */}
                  <span className="sdp-insignia sdp-insignia--exit sdp-connectar__carpeta-insignia" aria-hidden="true">
                    <Check size={16} aria-hidden="true" focusable="false" />{t('section.connectar.triada', 'Triada')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-categories`}>
          <h3 id={`${id}-categories`} className="sdp-connectar__titol-seccio">{t('common.categories', 'Categories')}</h3>
          <p className="sdp-connectar__ajuda">{t('section.connectar.categories.ajuda', 'Opcional: la connexió també apareixerà en estes categories del teu Bloc.')}</p>
          <ul className="sdp-connectar__pindoles" aria-label={t('section.connectar.categories.llista', 'Categories del teu Bloc')}>
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
            <Camp etiqueta={t('section.connectar.categories.nova', 'Categoria nova')}>
              <CampText value={categoriaInput} onChange={(e) => setCategoriaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategoria(categoriaInput); } }} />
            </Camp>
            <Boto onClick={() => addCategoria(categoriaInput)} disabled={!categoriaInput.trim()}>{t('section.connectar.categories.afegir', 'Afegir categoria')}</Boto>
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-context`}>
          <h3 id={`${id}-context`} className="sdp-connectar__titol-seccio">{t('section.connectar.etiquetes.titol', 'Assistent de context')}</h3>
          <p className="sdp-connectar__ajuda">
            {t('section.connectar.etiquetes.ajuda', 'La IAIA et suggereix estes etiquetes en base al sistema de Poble. Afig tu les que vullgues per trobar-ho ràpid.')}
          </p>
          <ul ref={etiquetesRef} className="sdp-connectar__pindoles" aria-label={t('section.connectar.etiquetes.llista', 'Etiquetes')}>
            {suggerides.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => triaSuggerida(tag)} className="sdp-connectar__pindola">{tag}</button>
              </li>
            ))}
            {customTags.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => removeTag(tag)} className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                  aria-label={omple(t('section.connectar.etiquetes.lleva', 'Lleva l’etiqueta {nom}'), { nom: tag })}>
                  {tag}<X size={16} aria-hidden="true" focusable="false" />
                </button>
              </li>
            ))}
          </ul>
          <div ref={etiquetaLliureRef} className="sdp-connectar__entrada">
            <Camp etiqueta={t('section.connectar.etiquetes.lliure', 'Etiqueta lliure')}>
              <CampText value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
            </Camp>
            <Boto onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>{t('section.connectar.add', 'Afegir')}</Boto>
          </div>
        </section>

        <div className="sdp-connectar__peu">
          {blocFallat && !resum ? avisDelBlocFallat({ error: errorBloc, onReintenta: recarregaBloc, t }) : null}
          {error ? <Alerta to="error" titol={t('section.connectar.error.titol', 'No s’ha pogut connectar')}>{error}</Alerta> : null}
          {resum ? (
            <div ref={resumRef} tabIndex={-1} className="sdp-connectar__resum">
              <ResumConnexio
                resultats={resum.resultats}
                accions={(
                  <Boto varietat="primari" onClick={() => navigate(resum.ruta, { replace: true })}>
                    {t('section.connectar.resum.obri', 'Obrir la connexió a les teues notes')}
                  </Boto>
                )}
              />
            </div>
          ) : (
            <>
              {/* FEDI-22 · Primari en 'element' (guardar és l'acció). FEDI-26 (261104) · En 'social' les notes no es munten. */}
              <Boto varietat="primari" mida="gran" ple onClick={handleConnect} carregant={isSaving}
                disabled={!calEntrar && (!potConnectar || esperantOriginal || !selectedFolder || faltenDestins)}>
                {etiquetaConnectar}
              </Boto>
              <p className="sdp-connectar__nota">
                {mode === 'persones' || mode === 'grups'
                  ? (faltenDestins
                    ? (mode === 'persones'
                      ? t('section.connectar.nota.faltaPersona', 'Tria almenys una persona del padró.')
                      : t('section.connectar.nota.faltaGrup', 'Tria almenys un grup.'))
                    : t('section.connectar.nota.irreversible', 'L’enviament per xat no es pot desfer.'))
                  : t('section.connectar.nota.privada', 'A les teues notes la llegiràs i la podràs editar com una nota teua.')}
              </p>
            </>
          )}
        </div>
      </div>
    </details>
  );
  /* RA-01 (revisió 261104) · En 'social' no hi ha columna lateral: T1 no perd
     els 24rem d'una columna gairebé buida. La lateral és només d'un element.
     FEDI-26 (correcció connectar-03, 261104) · i davall de les targetes ja no
     hi van les notes plegades. */
  const ambLateral = !social && (Boolean(targetaDirecta) || Boolean(targetaFormarPart));

  return (
    <UniversalPage
      /* Decisions 261030 §7 · Les carpetes i les notes del teu Bloc: Traduir no envia res fora. */
      traduccio={false}
      chrome="system"
      /* GLOBAL-04 · El contenidor amb nom de la pàgina (modules.css); el logotip, a 600px (IDEA-93). */
      className="sdp-connectar-pagina"
      title={t('section.connectar.kicker', 'Connectar')}
      subtitle={social
        ? t('section.connectar.subtitolSocial', 'Connecta’t i escriu-li')
        : t('section.connectar.where', 'On vols connectar-ho?')}
      lead={/* IDEA-14 · Amb més d'un camí, l'entradeta diu que són accions distintes.
             261024 correccions (R3-05) · i diu el mateix que «Qui ho pot vore?»: en
             privat no avisa ningú; a persones o grups de xat els arriba l'enllaç.
             P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · «connectar
             amb algú», no «seguir»: a Sóc de Poble no se seguix, es connecta.
             FEDI-22 (C5) · En 'social', l'entradeta només parla d'entitats a qui en administra.
             RA-01 (revisió 261104) · i és d'una línia. */ social
        ? (actorsConnectar.length > 1 && !calEntrar
          ? t('section.connectar.leadSocialCom', 'Com a tu o en nom d’una entitat que administres.')
          : t('section.connectar.leadSocial', 'Connectar-te no et fa membre de res.'))
        : ambCamins
          ? t('section.connectar.leadCamins', 'Cada camí té el seu botó: connectar amb algú o escriure-li no et fa membre de res. Si guardes l’element a les teues notes en privat, no avisa ningú; si tries persones o grups de xat, els enviarem l’enllaç.')
          : t('section.connectar.lead', 'Tria on arriba (per defecte, a la Safata d’Entrada), qui ho pot vore i com ho trobaràs després.')}
      onConnect={false}
    >
      <div className={['sdp-connectar', 'sdp-connectar--graella', ambLateral && 'sdp-connectar--amb-lateral'].filter(Boolean).join(' ')}>
        {/* D1 · sense promeses: en seed i local no hi ha cap traspàs al compte en
            entrar, i les carpetes no es poden crear. */}
        {isGuest && (
          <Alerta to="avis" titol={t('section.connectar.foraster.titol', 'Mode Foraster actiu')}>
            {calEntrar
              ? t('section.connectar.foraster.calEntrar', 'Per a connectar cal entrar al teu compte.')
              : t('section.connectar.foraster.local', 'Sense sessió, el que connectes es queda només en este dispositiu.')}
          </Alerta>
        )}

        {/* FEDI-22 (ordre del Mestre, 261103) · IDEA-14 continua: cada camí té el
            seu botó. En 'social', la connexió directa i formar part a la graella
            de targetes, sense notes (FEDI-26, Regla 1; correcció connectar-03,
            261104); en 'element', l'objecte i les notes a la principal, i la
            relació i formar part a la lateral. */}
        {social ? (
          <div className="sdp-connectar__principal sdp-connectar__principal--targetes">
            {targetaDirecta}
            {targetaIncloure}
            {targetaFormarPart}
          </div>
        ) : (
          <div className="sdp-connectar__principal">
          <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
            <p className="sdp-connectar__tipus">{etiquetaObjecte(origen.objecte, t)}</p>
            {/* T54 · mini-card de lectura: foto i títol, sense peu ni data
                clicable. Sense foto (perfil, pàgina o element que no és ací), la
                icona de capes ocupa el lloc de la icona del títol perquè la
                targeta no quede en una línia de text nua. */}
            <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
              <UniversalCard
                title={titolDeLaTargeta}
                imageUrl={imatgeOriginal || undefined}
                imageAlt=""
                icon={imatgeOriginal ? undefined : <Layers size={32} aria-hidden="true" focusable="false" />}
                hasFooter={false}
                onDateTime={false}
                showDateTime={false}
              />
            </div>
            {autorVisible ? <p className="sdp-connectar__autor">{omple(t('section.connectar.de', 'De {nom}'), { nom: autorVisible })}</p> : null}
            {persona ? <p className="sdp-connectar__identitat">{omple(t('section.connectar.esConnectaA', 'Es connecta a {nom}.'), { nom: persona })}</p> : null}
            {/* D4 (ordre del Mestre, 260930) · els drets de l'original resolt,
                amb les mateixes claus que l'avís de l'editor (NotesEditor). */}
            {dretsReservats ? (
              <Alerta to="avis" titol={t('section.notes.drets.titol', TITOL_DRETS_RESERVATS)}>
                {t('section.notes.drets.text', TEXT_DRETS_RESERVATS)}
              </Alerta>
            ) : null}
          </section>
            {notesDelBloc}
          </div>
        )}
        {ambLateral ? (
          <div className="sdp-connectar__lateral">
            {targetaDirecta}
            {targetaFormarPart}
          </div>
        ) : null}
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
  /* P1-22 · Els motius, en la llengua de qui mira. */
  const contingut = useMemo(() => contingutExternDeParams(params, t), [params, t]);
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
      showToast(omple(t('section.connectar.extern.connectat', 'Connectat a «{carpeta}». És una nota teua: la pots editar.'), { carpeta: NOM_CARPETA_CONNECTATS }), 'success');
      navigate(nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes', { replace: true });
    } catch (err) {
      setError(missatgeDeLError(err, t));
    } finally {
      setIsSaving(false);
    }
  };

  const etiquetaConnectar = calEntrar ? t('section.connectar.boto.entra', 'Entra per a connectar')
    : blocCarregant ? t('section.connectar.boto.obrintBloc', 'Obrint el teu Bloc…')
      : `${t('section.connectar.connect', 'Connectar a')} «${NOM_CARPETA_CONNECTATS}»`;

  return (
    <UniversalPage
      traduccio={false}
      chrome="system"
      /* GLOBAL-04 · El contenidor amb nom de la pàgina; de .sdp-connectar cap avall, la vista de sempre (PrevisualitzacioExtern). */
      className="sdp-connectar-pagina"
      title={t('section.connectar.kicker', 'Connectar')}
      subtitle={t('section.connectar.where', 'On vols connectar-ho?')}
      lead={t('section.connectar.extern.lead', 'Un enllaç de fora de Sóc de Poble arriba com una nota teua, que podràs editar.')}
      onConnect={false}
    >
      <div className="sdp-connectar">
        {!currentUser ? (
          <Alerta to="avis" titol={t('section.connectar.foraster.titol', 'Mode Foraster actiu')}>
            {calEntrar
              ? t('section.connectar.foraster.calEntrar', 'Per a connectar cal entrar al teu compte.')
              : t('section.connectar.foraster.localEnllac', 'Sense sessió, l’enllaç es queda només en este dispositiu.')}
          </Alerta>
        ) : null}

        <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
          <p className="sdp-connectar__tipus">{t('section.connectar.extern.tipus', 'Enllaç de fora de Sóc de Poble')}</p>
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
              {/* P1-22 · Una web no és cap autora: «De» vol dir d'on ve (clau pròpia). */}
              <p className="sdp-connectar__autor">{omple(t('section.connectar.extern.de', 'De {lloc}'), { lloc: valor.lloc })}</p>
              <p className="sdp-connectar__identitat">{valor.url}</p>
            </>
          ) : (
            <p id={`${id}-objecte`} className="sdp-connectar__autor">{t('section.connectar.extern.noEsPot', 'Este enllaç no es pot connectar.')}</p>
          )}
        </section>

        {motius.length ? (
          <Alerta to="error" titol={t('section.connectar.extern.noEsPotTitol', 'Este enllaç no es pot connectar')}>{motius.join(' ')}</Alerta>
        ) : null}

        <div className="sdp-connectar__peu">
          {blocFallat && valor ? avisDelBlocFallat({ error: errorBloc, onReintenta: recarregaBloc, t }) : null}
          {error ? <Alerta to="error" titol={t('section.connectar.extern.errorTitol', 'L’enllaç no s’ha connectat')}>{error}</Alerta> : null}
          {valor ? (
            <>
              <Boto varietat="primari" mida="gran" ple onClick={connecta} carregant={isSaving} disabled={!calEntrar && !potConnectar}>
                {etiquetaConnectar}
              </Boto>
              <p className="sdp-connectar__nota">
                {omple(t('section.connectar.extern.arriba', 'Arriba com una nota nova a «{carpeta}», que podràs editar. La imatge de l’altra web no es copia.'), { carpeta: NOM_CARPETA_CONNECTATS })}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </UniversalPage>
  );
}
