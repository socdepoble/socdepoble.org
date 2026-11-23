/**
 * Finestreta.jsx — la vista «Identitat i Finestreta» de la Gestoria
 * (/app/gestoria/identitat): la Fitxa d'identitat privada i la
 * Finestreta única.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): «extraure les
 * dades legals de 01_Identitat_Legal i tindre tots els camps preparats per a
 * omplir el tràmit». Auditoria Codex 261013_1510 §2.1: cap dada legal a
 * public.profiles, a cap metadata ni a la xarxa; preparar, omplir, signar i
 * presentar són operacions separades, i esta pàgina NOMÉS prepara: no signa
 * ni presenta res. Arriba pel pont de l'app (src/apps/gestoria/AppGestoria.jsx),
 * com l'Històric: ShellGestoria és font del tractor del Tauler i no es toca.
 * L'avatar i la portada són d'elecció exclusiva de la persona: ací no se'n
 * canvia cap.
 *
 * La pàgina (PaginaApp, amb la boina personal, el rellotge viu i l'ull):
 *   · LA PORTA del tractor 'gestoria.identitat': sense la signatura del
 *     Mestre, «Cal aprovar el tractor» i res més (ni el selector, ni la
 *     fitxa, ni la Finestreta: tot és codi del tractor). Onada R24
 *     (CODEX-R24-12) · Fora de DEV no hi ha panell de Tractors: l'acció de
 *     l'avís és AccioAprovacio (tractors/AprovacioEnLinia.jsx), que aprova
 *     ací, en este navegador. La pàgina porta la insígnia «En proves · Beta
 *     oberta» (insigniaBetaOberta.js, A-gestoria-tpv-apps-1).
 *   · TRIA LA CARPETA arrel de la Gestoria (el selector del sistema, dins del
 *     clic; si no n'hi ha, un <input webkitdirectory>).
 *   · «QUÈ LLEGIRÉ I QUÈ NO»: cada paper de 01_Identitat_Legal i de
 *     03_Burocracia/SUMA amb la decisió i el perquè, abans d'obrir-ne cap. Els
 *     de nom opac només es lligen si la persona els marca, d'un en un o tots
 *     de colp; marcar no és llegir: només «Llig…» obri cap paper.
 *   · LES PROPOSTES, agrupades per titular, amb el paper d'on ixen i la
 *     confiança: Confirma, Rebutja o Corregix (a mà). A «D’on ix» (Front 6,
 *     ordre del Mestre del 14-10-2026, pla 261013_1930: «Fitxa + obrir el
 *     PDF»), cada paper és un <details>: la ruta i, a dins, el tipus, la data
 *     del nom, la regla i l'empremta curta; i dos passos per a consultar-lo:
 *     «Comprova el paper» (el torna a llegir i en comprova l'empremta) i
 *     «Obri’l en una pestanya» (dins del clic), tots dos amb l'ull obert.
 *   · LA TEUA FITXA: els valors confirmats, que es desen xifrats al cofre.
 *   · LA FINESTRETA: una pestanya per formulari, cada camp amb «Copia» i un
 *     esborrany per a imprimir. Tots són «A verificar contra el model vigent».
 * CAP VALOR es pinta fins que la persona prem l'ull de la boina: ni a les
 * propostes, ni a la fitxa, ni als formularis. Una lectura nova i «Oblida»
 * tornen a tancar l'ull. Els títols no porten mai cap dada (l'Índex de la
 * pàgina els escriu a l'adreça): els noms dels fitxers van a les cel·les.
 *
 * EL COFRE (com l'Històric): l'export per defecte, el que munta la ruta, posa
 * TOTA la vista darrere de PortaCofre (cofre/PortaCofre.jsx). La fitxa es
 * desa xifrada a la col·lecció 'identitat' de l'únic cofre de l'app
 * (persistenciaDelCofre), només amb els valors confirmats; en bloquejar-se,
 * useFinestreta ho buida tot; en eixir d'esta vista, el cofre es bloqueja.
 * VistaFinestreta és la vista sense la porta: només per a les proves, que hi
 * injecten la persistència; la ruta munta sempre la porta.
 * Proves: el cofre, el magatzem, subtle, el catàleg, l'entorn, el rellotge,
 * inflate, la persistència (VistaFinestreta), copia, imprimix i obriPaper
 * s'injecten.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check, Copy, ExternalLink, Eye, EyeOff, FileCheck, FileSearch, FolderOpen, ListChecks, ListX, PenLine, Printer, X
} from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant, EstatBuit, Progres } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText, Casella, Selector } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import { Pestanyes } from '../../../components/PedraSeca/organismes/Pestanyes.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { AccioAprovacio, RevocaAprovacio, onSAprova } from '../../tractors/AprovacioEnLinia.jsx';
import { cofreDeLaGestoria, persistenciaDelCofre } from '../cofre/cofre.js';
import PortaCofre from '../cofre/PortaCofre.jsx';
import { tg, tf, tga } from '../i18nGestoria.js';
import { ETIQUETA_BETA_OBERTA, etiquetaBetaOberta } from '../insigniaBetaOberta.js';
import { formatImport } from '../nucli/diners.js';
import { TRACTOR_IDENTITAT } from '../tractors.js';
import { MOTIUS } from './nucli/filtreDocuments.js';
import { FORMULARIS, VERIFICAR, omplixFormulari } from './nucli/formularisFinestreta.js';
import { LIMITS_IDENTITAT } from './nucli/tractorIdentitat.js';
import { CAMPS_IDENTITAT } from './nucli/validadorsIdentitat.js';
import { SENSE_CARPETA_PAPER, clauConfianca, clauPaper, useFinestreta } from './useFinestreta.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitGestoria from '../../../css/diferit-gestoria.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'gestoria', cssDiferitGestoria); };

/* La consulta que obri la porta dels Tractors (la mateixa que CONSULTA_TRACTORS de ContenidorGestoria.jsx). */
export const CONSULTA_TRACTORS_IDENTITAT = '?categoria=tractors_cat&item=tractors_aprovacio';
/* Sense la persona de la sessió, la boina diu la veritat: cap autora fingida (com l'Històric). */
export const TITULAR_FINESTRETA = Object.freeze({ nom: 'Titular sense configurar', poble: '', avatar: null, href: '/el-meu-perfil' });
/** La col·lecció del cofre on es desa, xifrada, la Fitxa d'identitat (només els valors confirmats). */
export const COLLECCIO_IDENTITAT = 'identitat';
/** El que diu la pàgina de la signatura i la presentació. */
export const AVIS_SENSE_SIGNAR = 'Esta pàgina no signa ni presenta cap tràmit: et prepara els camps perquè els copies tu a la seu electrònica de l’organisme, o per a imprimir-ne un esborrany.';

/** El nom de cada camp de la fitxa, en valencià. */
export const ETIQUETES_CAMPS = Object.freeze({
  'identificacio.nif': 'NIF o NIE',
  'identificacio.nom': 'Nom',
  'identificacio.cognom1': 'Primer cognom',
  'identificacio.cognom2': 'Segon cognom',
  'identificacio.dataNaixement': 'Data de naixement',
  'domicili.tipusVia': 'Tipus de via',
  'domicili.via': 'Nom de la via',
  'domicili.numero': 'Número',
  'domicili.complement': 'Pis, porta o escala',
  'domicili.codiPostal': 'Codi postal',
  'domicili.municipi': 'Municipi',
  'domicili.codiIne': 'Codi INE del municipi',
  'domicili.provincia': 'Província',
  'domicili.pais': 'País',
  'contacte.telefon': 'Telèfon',
  'contacte.correu': 'Correu electrònic',
  'contacte.mitjaNotificacio': 'Mitjà de notificació (electronica o postal)',
  'seguretatSocial.naf': 'Número d’afiliació a la Seguretat Social',
  'seguretatSocial.regim': 'Règim de la Seguretat Social',
  'seguretatSocial.dataAlta': 'Data d’alta',
  'seguretatSocial.dataEfectes': 'Data d’efectes',
  'seguretatSocial.baseCotitzacio': 'Base de cotització',
  'seguretatSocial.mutua': 'Mútua',
  'activitat.cnae': 'CNAE',
  'activitat.descripcio': 'Descripció de l’activitat',
  'activitat.epigrafIae': 'Epígraf de l’IAE',
  'activitat.dataAltaCensal': 'Data d’alta censal',
  'activitat.domicili': 'Domicili de l’activitat',
  'entitat.nif': 'NIF de l’entitat',
  'entitat.denominacio': 'Denominació',
  'entitat.domiciliSocial': 'Domicili social',
  'registre.organisme': 'Registre',
  'registre.numeroInscripcio': 'Número d’inscripció',
  'registre.seccio': 'Secció del registre',
  'registre.dataInscripcio': 'Data d’inscripció',
  'tribut.concepte': 'Concepte del tribut',
  'tribut.referenciaSuma': 'Referència de SUMA',
  'tribut.referenciaCadastral': 'Referència cadastral',
  'tribut.adreca': 'Adreça de l’objecte tributari',
  'tribut.municipi': 'Municipi de l’objecte tributari',
  'representacio.carrec': 'Càrrec',
  'representacio.tipus': 'Tipus de representació',
  'representacio.vigentDes': 'Vigent des de',
  'representacio.vigentFins': 'Vigent fins a'
});

/** El nom de cada tipus de paper (TIPUS_DOCUMENT_IDENTITAT del filtre), en valencià: el que diu «D’on ix». */
export const ETIQUETES_TIPUS_PAPER = Object.freeze({
  'vida-laboral': 'Vida laboral',
  'resolucio-afiliacio': 'Resolució d’afiliació a la Seguretat Social',
  reta: 'Resolució del RETA',
  'informe-bases': 'Informe de bases de cotització',
  suma: 'Rebut o notificació de SUMA',
  'kit-digital': 'Sol·licitud del Kit Digital',
  'registre-associacions': 'Alta al registre d’associacions',
  estatuts: 'Estatuts de l’associació',
  'certificat-representacio': 'Certificat de representació',
  desconegut: 'Paper de tipus desconegut (nom opac)'
});

const ETIQUETES = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'Identitat i Finestreta', className: 'sdp-badge-category' }),
  ETIQUETA_BETA_OBERTA
]);
const ESTATS_TRACTOR = Object.freeze({
  pendent: 'encara no està aprovat',
  caducat: 'té l’aprovació caducada',
  revocat: 'té l’aprovació revocada',
  'empremta-divergent': 'ha canviat des que el vas aprovar',
  incomplet: 'no té tots els fitxers declarats',
  error: 'no s’ha pogut comprovar'
});
const DECISIONS = Object.freeze({
  llegir: Object.freeze({ to: 'exit', text: 'Es llegirà' }),
  demanar: Object.freeze({ to: 'avis', text: 'Només si el marques' }),
  ometre: Object.freeze({ to: 'neutre', text: 'No s’obrirà' })
});
const CONFIANCES = Object.freeze({
  alta: Object.freeze({ to: 'exit', text: 'Confiança alta' }),
  mitjana: Object.freeze({ to: 'info', text: 'Confiança mitjana' }),
  baixa: Object.freeze({ to: 'avis', text: 'Confiança baixa' })
});
const ESTATS_FORMULARI = Object.freeze({
  llest: Object.freeze({ to: 'exit', text: 'Llest' }),
  falta: Object.freeze({ to: 'neutre', text: 'Falta a la fitxa' }),
  'sense-confirmar': Object.freeze({ to: 'avis', text: 'Sense confirmar' }),
  'tipus-incompatible': Object.freeze({ to: 'error', text: 'No quadra amb el camp' })
});
const ROLS = Object.freeze({ persona: 'Persona', activitat: 'Activitat', entitat: 'Entitat' });
const ORDRE_CAMPS = Object.keys(CAMPS_IDENTITAT);
const OPCIONS_A_MA = Object.freeze([
  Object.freeze({ valor: '', etiqueta: 'Tria el camp' }),
  ...ORDRE_CAMPS.filter((camp) => Object.prototype.hasOwnProperty.call(ROLS, CAMPS_IDENTITAT[camp].rol))
    .map((camp) => Object.freeze({ valor: camp, etiqueta: `${ROLS[CAMPS_IDENTITAT[camp].rol]} · ${ETIQUETES_CAMPS[camp] ?? camp}` }))
]);
const dosXifres = (n) => String(n).padStart(2, '0');

/* El dia d'avui, «aaaa-mm-dd», del rellotge de la pàgina (la data dels formularis); R32.32: blindatge contra Invalid Date. */
export function avuiDe(rellotge) {
  const brut = typeof rellotge === 'function' ? rellotge() : Date.now();
  const d = new Date(brut);
  const segur = Number.isNaN(d.getTime()) ? new Date(Date.now()) : d;
  return `${segur.getFullYear()}-${dosXifres(segur.getMonth() + 1)}-${dosXifres(segur.getDate())}`;
}

/** L'autoria de la boina: la persona de la sessió (sempre amb la seua pàgina) o la veritat, sense configurar. */
export function autorDe(titular, idioma = 'ca') {
  if (!titular || typeof titular.nom !== 'string' || titular.nom.trim() === '') {
    return idioma === 'ca' ? TITULAR_FINESTRETA : { ...TITULAR_FINESTRETA, nom: tg(idioma, TITULAR_FINESTRETA.nom) };
  }
  return { nom: titular.nom, poble: typeof titular.poble === 'string' ? titular.poble : '', avatar: titular.avatar ?? null, href: '/el-meu-perfil' };
}

/** El valor d'un camp de la fitxa, en text: els imports en euros i les dates en dd/mm/aaaa. */
export function valorEnText(camp, valor) {
  const tipus = CAMPS_IDENTITAT[camp]?.tipus;
  if (tipus === 'import') return formatImport(valor);
  if (tipus === 'data' && typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}`;
  return String(valor);
}

/* El dia d'un moment ISO (el de la confirmació), dd/mm/aaaa a l'hora d'este ordinador. */
function diaDe(moment) {
  const d = new Date(moment);
  return Number.isNaN(d.getTime()) ? '—' : `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* La data d'un paper (dataDocument, «aaaa-mm-dd», treta del prefix del nom) en dd/mm/aaaa, o null. */
const dataDelPaper = (iso) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : null);

/* Els predeterminats de «Copia» (el porta-retalls, cridat dins del clic) i de l'esborrany (imprimir la
   pàgina); les proves els injecten. Cap dels dos ix d'este ordinador: el porta-retalls i la impressora són
   de la persona. */
function copiaPerDefecte(text) {
  return navigator.clipboard.writeText(text);
}
function imprimixPerDefecte() {
  window.print();
}
/* El predeterminat d'«Obri’l en una pestanya» (Front 6, ordre del Mestre del 14-10-2026, pla 261013_1930): la URL
   blob: local d'un paper ja comprovat, en una pestanya nova d'este navegador, sense opener ni referrer. Es crida
   dins del clic, sense cap espera pel mig (si no, el navegador el pren per una finestra emergent). Res ix d'este
   ordinador. La porta de privacitat (privacitat.test.js) el permet només ací i a l'enviament. */
function obriPaperPerDefecte(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/* L'ull de privacitat de la boina: un sol control, amb aria-pressed (premut = els valors es veuen). La mateixa
   pell i el mateix comportament que UllPrivacitat del Tauler (classe sdp-gestoria-ull), sense importar-lo: la
   fitxa d'identitat no penja del codi del banc ni del seu tractor. */
function UllDades({ visible, onCommuta, idioma = 'ca' }) {
  const Icona = visible ? Eye : EyeOff;
  const etiq = tg(idioma, 'Mostra les dades');
  return (
    <button ref={adoptaEstilsDiferits} type="button" className="sdp-gestoria-ull" aria-pressed={visible ? 'true' : 'false'}
      aria-label={etiq} title={etiq} onClick={onCommuta}>
      <Icona size={20} aria-hidden="true" focusable="false" />
    </button>
  );
}

/* Un valor: amagat fins que la persona prem l'ull (no és al DOM). */
function Valor({ text, visible, idioma = 'ca' }) {
  if (visible) return <span ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__valor">{text}</span>;
  return (
    <span ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__amagat">
      <EyeOff size={16} aria-hidden="true" focusable="false" />
      {tg(idioma, 'Valor amagat')}
    </span>
  );
}

/* Un paper de «D’on ix» (Front 6, ordre del Mestre del 14-10-2026, pla 261013_1930: «Fitxa + obrir el PDF», per a
   resoldre els camps en conflicte). La ruta al <summary>, dins de la cel·la i mai en un títol; a dins, el que la font
   ja portava: el tipus, la data del nom, la regla i l'empremta curta (cap valor de la persona). Per a consultar-lo,
   dos passos: «Comprova el paper» el torna a llegir en este ordinador i en comprova l'empremta (asíncron); «Obri’l en
   una pestanya» crida obriPaper DINS del clic, sense esperar res. Tots dos, només amb l'ull obert (com l'esborrany
   per imprimir) i amb una carpeta viva. El motiu d'un error es veu al costat del botó i s'anuncia, sense cap ruta.
   En comprovar-lo, el focus passa a «Obri’l…» (Boto no reenvia cap ref: es busca dins del grup). */
function PaperDOrigen({ font, h, visible, obriPaper, onAnuncia, idioma = 'ca' }) {
  const accions = useRef(null);
  const enCurs = useRef(false);
  const idMotiu = useId();
  const [comprovant, setComprovant] = useState(false);
  const [motiu, setMotiu] = useState('');
  const [enfoca, setEnfoca] = useState(null);
  useEffect(() => {
    if (!enfoca) return;
    accions.current?.querySelector(`[data-accio="${enfoca}"]:not(:disabled)`)?.focus();
    setEnfoca(null);
  }, [enfoca]);
  const url = h.papersComprovats.get(clauPaper(font)) ?? null;
  const tancat = !visible || !h.potObrirPaper;
  const data = dataDelPaper(font.dataDocument);
  const comprova = async () => {
    if (enCurs.current) return;
    enCurs.current = true;
    setComprovant(true);
    setMotiu('');
    const resultat = await h.preparaPaper(font);
    enCurs.current = false;
    setComprovant(false);
    if (resultat.url) {
      setEnfoca('obri');
      onAnuncia('Paper comprovat: és el que es va llegir. Ja el pots obrir en una pestanya.');
    } else {
      setMotiu(resultat.motiu);
      onAnuncia(`No s’ha pogut comprovar el paper. ${resultat.motiu}`);
    }
  };
  /* Síncron: entre el clic i obriPaper no hi ha cap espera. */
  const obri = () => {
    if (!url) return;
    try {
      obriPaper(url);
      onAnuncia('Paper obert en una pestanya nova. No es tanca quan bloqueges el cofre ni amb «Oblida»: tanca-la tu.');
    } catch {
      const no = 'Este navegador no ha deixat obrir la pestanya: torna-ho a provar.';
      setMotiu(no);
      onAnuncia(no);
    }
  };
  return (
    <details ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__paper">
      <summary>{font.ruta}</summary>
      <dl className="sdp-gestoria-finestreta__dades-paper">
        <dt>Paper</dt>
        <dd>{ETIQUETES_TIPUS_PAPER[font.tipusDocument] ?? ETIQUETES_TIPUS_PAPER.desconegut}</dd>
        {data ? (
          <>
            <dt ref={adoptaEstilsDiferits}>Data del paper</dt>
            <dd>{data}</dd>
          </>
        ) : null}
        <dt>Regla que l’ha trobat</dt>
        <dd>{font.regla}</dd>
        <dt>Empremta</dt>
        <dd className="sdp-gestoria-finestreta__empremta">{String(font.sha256).slice(0, 8)}</dd>
      </dl>
      {h.teCarpeta ? (
        <div className="sdp-gestoria-finestreta__accions" ref={accions}>
          {/* Revisió adversarial 13-10-2026, troballa A11Y-1: el nom accessible comença pel text que es veu (WCAG 2.5.3). */}
          <Boto varietat="secundari" icona={FileCheck} data-accio="comprova" disabled={tancat} aria-label={tga(idioma, 'comprovaPaperAria', font.ruta)}
            aria-describedby={motiu ? idMotiu : undefined} onClick={comprova}>
            {tga(idioma, 'comprovaPaper')}
          </Boto>
          <Boto varietat="fantasma" icona={ExternalLink} data-accio="obri" disabled={tancat || !url} aria-label={tga(idioma, 'obriPestanyaAria', font.ruta)}
            onClick={obri}>
            {tga(idioma, 'obriPestanya')}
          </Boto>
          {comprovant ? <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">Comprovant el paper…</p> : null}
          {motiu ? <p ref={adoptaEstilsDiferits} id={idMotiu} className="sdp-gestoria-finestreta__nota">{motiu}</p> : null}
          {visible ? null : <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">Obri l’ull de la barra per a comprovar-lo i obrir-lo.</p>}
        </div>
      ) : (
        <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">{SENSE_CARPETA_PAPER}</p>
      )}
    </details>
  );
}

/* D'on ix un valor: «Entrat a mà» o els papers, cadascun amb el seu <details> (PaperDOrigen). `paper` porta el que
   cal per a obrir-los: el hook, l'ull, obriPaper i l'anunci. */
function Origens({ fonts, paper }) {
  return (
    <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__fonts">
      {(fonts ?? []).map((font, i) => (
        <li ref={adoptaEstilsDiferits} key={`${font.ruta ?? 'a-ma'}-${i}`}>{font.tipus === 'manual' ? 'Entrat a mà' : <PaperDOrigen font={font} {...paper} />}</li>
      ))}
    </ul>
  );
}

/* Una secció amb el seu títol (h3): cap títol porta dades. */
function Seccio({ titol, ajuda, idioma = 'ca', children }) {
  const id = useId();
  return (
    <section ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__seccio" aria-labelledby={id}>
      <h3 id={id} className="sdp-gestoria-finestreta__titol">{tg(idioma, titol)}</h3>
      {ajuda ? <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">{tg(idioma, ajuda)}</p> : null}
      {children}
    </section>
  );
}

/* Els titulars, els tributs i les representacions de la fitxa, amb un nom sense dades. */
function portadorsDe(fitxa) {
  return [
    ...fitxa.titulars.map((t) => ({ id: t.id, nom: t.alies, camps: t.camps })),
    ...fitxa.tributs.map((t, i) => ({ id: t.id, nom: `Objecte tributari ${i + 1}`, camps: t.camps })),
    ...fitxa.representacions.map((r, i) => ({ id: r.id, nom: `Representació ${i + 1}`, camps: r.camps }))
  ];
}
const campsOrdenats = (camps, filtre) => Object.entries(camps ?? {}).filter(([, valor]) => filtre(valor))
  .sort(([a], [b]) => ORDRE_CAMPS.indexOf(a) - ORDRE_CAMPS.indexOf(b));

/* La porta del tractor. */
function PortaIdentitat({ h, onObreTractors, idioma = 'ca' }) {
  if (h.porta.carregant) return <Carregant etiqueta={tg(idioma, 'Llegint les aprovacions dels tractors…')} />;
  /* Aprovat: fora de DEV, «Revoca l’aprovació» (en DEV, res: es revoca al panell). */
  if (h.aprovat) return <RevocaAprovacio porta={h.porta} id={TRACTOR_IDENTITAT.id} idioma={idioma} />;
  const estat = tg(idioma, ESTATS_TRACTOR[h.fila?.estat] ?? ESTATS_TRACTOR.pendent);
  return (
    <Alerta to="avis" titol={tg(idioma, 'Cal aprovar el tractor')}
      accions={<AccioAprovacio porta={h.porta} id={TRACTOR_IDENTITAT.id} onObreTractors={onObreTractors} idioma={idioma} />}>
      {tf(idioma, 'portaIdentitat', estat, onSAprova(idioma))}
      {h.porta.error ? ` ${h.porta.error}` : ''}
    </Alerta>
  );
}

/* Pas 1: la carpeta arrel de la Gestoria. */
function SeccioCarpeta({ h, onOblida, idioma = 'ca' }) {
  const ocupat = Boolean(h.ocupat) || !h.fitxaLlegida;
  return (
    <Seccio titol="Tria la carpeta" ajuda="La carpeta arrel de la Gestoria, la que conté 01_Identitat_Legal i 03_Burocracia. Abans d’obrir cap paper, et diré quins llegiré i quins no." idioma={idioma}>
      <Alerta to="info" viva={false} titol={tg(idioma, 'Els papers no ixen d’este ordinador')}>
        {tg(idioma, 'Es lligen en la memòria d’esta pàgina i se’n descarten els bytes i el text en acabar: només queden les propostes, que no es desen fins que les confirmes. Mai s’obrin els de salut, banc, credencials, renda, herència, el model 145 ni les imatges.')}
      </Alerta>
      {h.potTriarCarpeta ? (
        <div ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__accions">
          <Boto varietat={h.teCarpeta ? 'secundari' : 'primari'} icona={FolderOpen} onClick={() => h.triaCarpeta()} disabled={ocupat}
            carregant={h.ocupat === 'carpeta'}>
            {tg(idioma, h.teCarpeta ? 'Tria una altra carpeta' : 'Tria la carpeta arrel de la Gestoria')}
          </Boto>
        </div>
      ) : (
        <Camp etiqueta={tg(idioma, 'Tria la carpeta arrel de la Gestoria')}
          ajuda={tg(idioma, 'Este navegador no obri el selector de carpetes: tria-la amb este botó. Res es puja enlloc.')}>
          {/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): la carpeta arrel porta la identitat legal; la
              línia d'estat del selector només en diu el recompte. Els noms van només a la taula «Què llegiré i què no». */}
          <CampText tipus="file" webkitdirectory="" multiple nomsVisibles={false} disabled={ocupat}
            onChange={(event) => h.usaFitxers(Array.from(event.target.files ?? []))} />
        </Camp>
      )}
      {h.teCarpeta ? (
        <div ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__accions">
          <p className="sdp-gestoria-finestreta__nota">{h.nomCarpeta ? `Carpeta triada: «${h.nomCarpeta}».` : 'Carpeta triada.'}</p>
          <Boto varietat="secundari" onClick={onOblida}>{tg(idioma, 'Oblida la carpeta')}</Boto>
        </div>
      ) : null}
      {h.ocupat === 'planificant' ? <Carregant etiqueta={tg(idioma, 'Mirant els noms dels papers…')} /> : null}
      {h.error ? <Alerta to="error" titol={tg(idioma, 'No s’ha pogut continuar')}>{h.error}</Alerta> : null}
    </Seccio>
  );
}

/* Pas 2: «Què llegiré i què no», abans de llegir res. Els de nom opac es marquen d'un en un (la casella «Llig-lo»)
   o tots de colp; marcar no és llegir: només «Llig…» obri cap paper, i els que no s'obriran no tenen casella. Els
   anuncis només porten recomptes: el nom de cada paper només és a la taula (ordre del Mestre, pla 261013_1405,
   front D). */
function SeccioPla({ h, onAnuncia, idioma = 'ca' }) {
  const grup = useRef(null);
  const idLimit = useId();
  /* El botó clicat queda desactivat i el focus cauria al body: el rep el germà (Boto no reenvia cap ref). */
  const [enfoca, setEnfoca] = useState(null);
  useEffect(() => {
    if (!enfoca) return;
    grup.current?.querySelector(`[data-accio="${enfoca}"]:not(:disabled)`)?.focus();
    setEnfoca(null);
  }, [enfoca]);
  const decisions = h.pla.decisions;
  const fora = decisions.filter((d) => d.motiu === 'fora-dabast');
  const dins = decisions.filter((d) => d.motiu !== 'fora-dabast');
  const compte = (que) => dins.filter((d) => d.decisio === que).length;
  const marcats = new Set(h.marcats);
  const opacs = dins.filter((d) => d.decisio === 'demanar');
  const pendents = opacs.filter((d) => !marcats.has(d.ruta)).length;
  const marcatsOpacs = opacs.length - pendents;
  const aLlegir = compte('llegir') + marcatsOpacs;
  const ocupat = Boolean(h.ocupat);
  /* Més papers dels que el tractor llig de colp (LIMITS_IDENTITAT): «Llig…» acabaria en error. Si els permesos sols
     ja hi passen, desmarcar no basta. */
  const avisLimit = (n) => `Com a molt ${LIMITS_IDENTITAT.fitxers} papers de colp: n’hi ha ${n} per llegir. ${
    compte('llegir') > LIMITS_IDENTITAT.fitxers ? 'Tria una carpeta més concreta.' : 'Desmarca’n algun.'}`;
  const marcaTots = () => {
    const despres = compte('llegir') + opacs.length;
    h.marcaTotsDemanar();
    setEnfoca('desmarca');
    onAnuncia(`${pendents === 1 ? 'Marcat 1 paper' : `Marcats ${pendents} papers`} de nom opac: encara no se n’ha llegit cap.${
      despres > LIMITS_IDENTITAT.fitxers ? ` ${avisLimit(despres)}` : ''}`);
  };
  const desmarcaTots = () => {
    h.desmarcaTotsDemanar();
    setEnfoca('marca');
    onAnuncia('Desmarcats tots els papers de nom opac.');
  };
  return (
    <Seccio titol="Què llegiré i què no" ajuda="Decidit només pel nom de cada paper i per la seua carpeta, sense obrir-ne cap.">
      <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">
        {`${compte('llegir')} es llegiran · ${compte('demanar')} només si els marques · ${compte('ometre')} no s’obriran · ${fora.length} fora de 01_Identitat_Legal i de 03_Burocracia/SUMA.`}
      </p>
      {h.pla.avisos.length ? (
        <Alerta to="avis" titol="La carpeta no s’ha pogut mirar sencera">
          <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__avisos">{h.pla.avisos.map((a, i) => <li ref={adoptaEstilsDiferits} key={`${a.codi}-${i}`}>{a.missatge}</li>)}</ul>
        </Alerta>
      ) : null}
      {/* Fora de la regió desplaçable de la taula: en mòbil es veu encara que la taula llisque. El nom de cada botó és
          el seu text (A11Y-1, WCAG 2.5.3). */}
      {opacs.length ? (
        <div role="group" aria-label={tga(idioma, 'papersNomOpacAria')} className="sdp-gestoria-finestreta__accions" ref={grup}>
          <Boto varietat="secundari" icona={ListChecks} data-accio="marca" disabled={pendents === 0 || ocupat} onClick={marcaTots}>
            {`Marca tots els pendents (${pendents})`}
          </Boto>
          <Boto varietat="fantasma" icona={ListX} data-accio="desmarca" disabled={marcatsOpacs === 0 || ocupat} onClick={desmarcaTots}>
            Desmarca tots
          </Boto>
        </div>
      ) : null}
      {dins.length ? (
        <Taula titol="Els papers de la carpeta i la decisió" densa>
          <thead ref={adoptaEstilsDiferits}>
            <tr><th scope="col">Paper</th><th scope="col">Decisió</th><th scope="col">Per què</th><th scope="col">El llig?</th></tr>
          </thead>
          <tbody>
            {dins.map((d) => {
              const decisio = DECISIONS[d.decisio] ?? DECISIONS.ometre;
              return (
                <tr ref={adoptaEstilsDiferits} key={d.ruta}>
                  <th scope="row" className="sdp-gestoria-finestreta__ruta">{d.ruta}</th>
                  <td><Insignia to={decisio.to}>{decisio.text}</Insignia></td>
                  <td>{MOTIUS[d.motiu] ?? '—'}</td>
                  <td>
                    {/* Revisió adversarial 13-10-2026, troballa A11Y-1: el nom accessible comença pel text que es veu (WCAG 2.5.3). */}
                    {d.decisio === 'demanar' ? (
                      <Casella etiqueta={tga(idioma, 'lligLo')} aria-label={tga(idioma, 'lligLoAria', d.ruta)} checked={marcats.has(d.ruta)} disabled={ocupat}
                        onChange={() => h.commutaMarcat(d.ruta)} />
                    ) : (d.decisio === 'llegir' ? tg(idioma, 'Sí') : tg(idioma, 'No'))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Taula>
      ) : (
        <Alerta to="avis" titol="Cap paper per a la Fitxa">
          Cap fitxer és dins de 01_Identitat_Legal ni de 03_Burocracia/SUMA: tria la carpeta arrel de la Gestoria, la que les conté.
        </Alerta>
      )}
      <div className="sdp-gestoria-finestreta__accions">
        <Boto varietat="primari" icona={FileSearch} onClick={() => h.llig()} disabled={aLlegir === 0 || ocupat}
          carregant={h.ocupat === 'llegint'} aria-describedby={aLlegir > LIMITS_IDENTITAT.fitxers ? idLimit : undefined}>
          {`Llig ${aLlegir === 1 ? 'el paper' : `els ${aLlegir} papers`}`}
        </Boto>
        {aLlegir > LIMITS_IDENTITAT.fitxers ? <p ref={adoptaEstilsDiferits} id={idLimit} className="sdp-gestoria-finestreta__nota">{avisLimit(aLlegir)}</p> : null}
      </div>
      {h.ocupat === 'llegint' && h.progres?.total > 0 ? (
        <Progres etiqueta="Llegint els papers" valor={h.progres.fet} max={h.progres.total} />
      ) : null}
    </Seccio>
  );
}

/* El resultat de la lectura: quants papers i els que no han donat res. */
function ResumLectura({ lectura }) {
  return (
    <>
      <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">
        {`${lectura.llegits.length === 1 ? 'S’ha llegit 1 paper' : `S’han llegit ${lectura.llegits.length} papers`}: ${lectura.propostes === 1 ? '1 proposta' : `${lectura.propostes} propostes`}. Els bytes i el text ja s’han descartat.`}
      </p>
      {lectura.avisos.length ? (
        <Alerta to="avis" titol="Hi ha papers que no han donat res">
          <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__avisos">
            {lectura.avisos.map((a, i) => <li ref={adoptaEstilsDiferits} key={`${a.codi}-${i}`}>{a.ruta ? `${a.ruta}: ${a.missatge}` : a.missatge}</li>)}
          </ul>
        </Alerta>
      ) : null}
    </>
  );
}

/* Un valor entrat a mà, dins de la fila d'un camp. onDesa(text) torna null o el motiu. */
function FormulariCorreccio({ etiqueta, onDesa, onCancela }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const desa = (event) => {
    event.preventDefault();
    const motiu = onDesa(text);
    if (motiu) setError(motiu);
  };
  return (
    <form ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__correccio" onSubmit={desa}>
      <Camp etiqueta={`Valor correcte: ${etiqueta}`} ajuda="Queda confirmat, amb la font «Entrat a mà»." error={error || undefined}>
        <CampText value={text} spellCheck={false} autoComplete="off" onChange={(event) => setText(event.target.value)} maxLength={200} />
      </Camp>
      <Boto tipus="submit" varietat="secundari" icona={PenLine}>Desa’l a mà</Boto>
      <Boto varietat="fantasma" onClick={onCancela}>Cancel·la</Boto>
    </form>
  );
}

/* Pas 3: les propostes per revisar, agrupades per titular; a «D’on ix», els papers per a consultar (Front 6). */
function SeccioPropostes({ h, visible, obriPaper, onAnuncia, idioma = 'ca' }) {
  const [corregint, setCorregint] = useState(null);
  const paper = { h, visible, obriPaper, onAnuncia, idioma };
  const grups = portadorsDe(h.fitxa)
    .map((p) => ({ ...p, files: campsOrdenats(p.camps, (v) => v.estat !== 'confirmat') }))
    .filter((p) => p.files.length);
  if (!grups.length) return null;
  const fet = (motiu, missatge) => {
    if (motiu) onAnuncia(motiu);
    else {
      onAnuncia(missatge);
      setCorregint(null);
    }
  };
  return (
    <Seccio titol="Propostes per revisar" ajuda="Cap proposta entra a la fitxa sola: la confirmes, la rebutges o l’entres a mà. Quan dos papers diuen coses diferents, tries tu.">
      {grups.map((g) => (
        <Taula key={g.id} titol={`Propostes · ${g.nom}`} densa>
          <thead ref={adoptaEstilsDiferits}>
            <tr><th scope="col">Camp</th><th scope="col">Valor</th><th scope="col">D’on ix</th><th scope="col">Confiança</th><th scope="col">Què fas</th></tr>
          </thead>
          <tbody>
            {g.files.flatMap(([camp, valor]) => {
              const etiqueta = idioma === 'ca' ? (ETIQUETES_CAMPS[camp] ?? camp) : tg(idioma, ETIQUETES_CAMPS[camp] ?? camp);
              const candidates = [{ valor: valor.valor, fonts: valor.fonts }, ...valor.alternatives];
              const conflicte = candidates.length > 1;
              const clau = `${g.id}|${camp}`;
              const files = candidates.map((c, i) => {
                const confianca = CONFIANCES[h.confiances.get(clauConfianca(camp, c.valor))] ?? null;
                const nom = conflicte ? tga(idioma, 'campOpcio', etiqueta, i + 1) : etiqueta;
                return (
                  <tr ref={adoptaEstilsDiferits} key={`${clau}-${i}`}>
                    <th scope="row">
                      {etiqueta}
                      {conflicte ? <Insignia to="avis">{`En conflicte · opció ${i + 1}`}</Insignia> : null}
                    </th>
                    <td><Valor text={valorEnText(camp, c.valor)} visible={visible} idioma={idioma} /></td>
                    <td><Origens fonts={c.fonts} paper={paper} /></td>
                    <td>{confianca ? <Insignia to={confianca.to}>{confianca.text}</Insignia> : '—'}</td>
                    <td>
                      <div className="sdp-gestoria-finestreta__accions">
                        <Boto varietat="secundari" icona={Check} aria-label={`${tg(idioma, 'Confirma')} ${nom}`}
                          onClick={() => fet(h.confirma({ titular: g.id, camp, valor: c.valor }), `Confirmat: ${etiqueta}.`)}>{tg(idioma, 'Confirma')}</Boto>
                        <Boto varietat="fantasma" icona={X} aria-label={`${tg(idioma, 'Rebutja')} ${nom}`}
                          onClick={() => fet(h.rebutja({ titular: g.id, camp, valor: c.valor }), `Rebutjat: ${etiqueta}.`)}>{tg(idioma, 'Rebutja')}</Boto>
                        {i === 0 ? (
                          <Boto varietat="fantasma" icona={PenLine} aria-label={`${tg(idioma, 'Corregix')} ${etiqueta}`} onClick={() => setCorregint(clau)}>{tg(idioma, 'Corregix')}</Boto>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              });
              if (corregint === clau) {
                files.push(
                  <tr ref={adoptaEstilsDiferits} key={`${clau}-correccio`}>
                    <td colSpan={5}>
                      <FormulariCorreccio etiqueta={etiqueta} onCancela={() => setCorregint(null)}
                        onDesa={(text) => {
                          const motiu = h.entraAMa({ titular: g.id, camp, text });
                          if (!motiu) fet(null, `Entrat a mà: ${etiqueta}.`);
                          return motiu;
                        }} />
                    </td>
                  </tr>
                );
              }
              return files;
            })}
          </tbody>
        </Taula>
      ))}
    </Seccio>
  );
}

/* Un valor a mà per a un camp que cap paper proposa (el contacte, per exemple). */
function FormulariAMa({ h, onAnuncia, idioma = 'ca' }) {
  const [camp, setCamp] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const afig = (event) => {
    event.preventDefault();
    if (!camp) {
      setError('Tria primer el camp.');
      return;
    }
    const motiu = h.entraAMa({ camp, text });
    if (motiu) setError(motiu);
    else {
      onAnuncia(`Entrat a mà: ${ETIQUETES_CAMPS[camp] ?? camp}.`);
      setError('');
      setText('');
    }
  };
  const opcionsLoc = idioma === 'ca'
    ? OPCIONS_A_MA
    : [
      { valor: '', etiqueta: tg(idioma, 'Tria el camp') },
      ...ORDRE_CAMPS.filter((c) => Object.prototype.hasOwnProperty.call(ROLS, CAMPS_IDENTITAT[c].rol))
        .map((c) => ({ valor: c, etiqueta: `${tg(idioma, ROLS[CAMPS_IDENTITAT[c].rol])} · ${tg(idioma, ETIQUETES_CAMPS[c] ?? c)}` }))
    ];
  return (
    <form ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__a-ma" onSubmit={afig}>
      <Camp etiqueta={tg(idioma, 'Camp que vols entrar a mà')}>
        <Selector opcions={opcionsLoc} value={camp} onChange={(event) => { setCamp(event.target.value); setError(''); }} />
      </Camp>
      <Camp etiqueta={tg(idioma, 'Valor')} ajuda={tg(idioma, 'Un import, en euros (1.234,56); una data, dd/mm/aaaa.')} error={error || undefined}>
        <CampText value={text} spellCheck={false} autoComplete="off" onChange={(event) => setText(event.target.value)} maxLength={200} />
      </Camp>
      <Boto tipus="submit" varietat="secundari" icona={PenLine}>{tg(idioma, 'Afig-lo a la fitxa')}</Boto>
    </form>
  );
}

/* Pas 4: la teua fitxa, només els valors confirmats (els que es desen xifrats); «D’on ix», com a les propostes. */
function SeccioFitxa({ h, visible, obriPaper, onAnuncia, idioma = 'ca' }) {
  const [corregint, setCorregint] = useState(null);
  const paper = { h, visible, obriPaper, onAnuncia, idioma };
  const grups = portadorsDe(h.fitxa)
    .map((p) => ({ ...p, files: campsOrdenats(p.camps, (v) => v.estat === 'confirmat') }))
    .filter((p) => p.files.length);
  const fet = (motiu, missatge) => {
    if (motiu) onAnuncia(motiu);
    else {
      onAnuncia(missatge);
      setCorregint(null);
    }
  };
  return (
    <Seccio titol="La teua fitxa" ajuda="Només els valors que has confirmat o entrat a mà. Es desen xifrats al cofre d’este navegador, amb el paper d’on ixen." idioma={idioma}>
      {!h.desaBlocat && h.errorPersistencia ? <Alerta to="avis" titol="El cofre">{h.errorPersistencia}</Alerta> : null}
      {grups.length ? grups.map((g) => (
        <Taula key={g.id} titol={`${tg(idioma, 'La teua fitxa')} · ${g.nom}`} densa>
          <thead ref={adoptaEstilsDiferits}>
            <tr><th scope="col">Camp</th><th scope="col">{tg(idioma, 'Valor')}</th><th scope="col">{tg(idioma, 'D’on ix')}</th><th scope="col">Confirmat</th><th scope="col">Què fas</th></tr>
          </thead>
          <tbody>
            {g.files.flatMap(([camp, valor]) => {
              const etiqueta = tg(idioma, ETIQUETES_CAMPS[camp] ?? camp);
              const clau = `${g.id}|${camp}`;
              const files = [(
                <tr ref={adoptaEstilsDiferits} key={clau}>
                  <th scope="row">{etiqueta}</th>
                  <td><Valor text={valorEnText(camp, valor.valor)} visible={visible} idioma={idioma} /></td>
                  <td><Origens fonts={valor.fonts} paper={paper} /></td>
                  <td>{diaDe(valor.confirmat)}</td>
                  <td>
                    <div className="sdp-gestoria-finestreta__accions">
                      <Boto varietat="fantasma" icona={PenLine} aria-label={`${tg(idioma, 'Corregix')} ${etiqueta}`} onClick={() => setCorregint(clau)}>{tg(idioma, 'Corregix')}</Boto>
                      <Boto varietat="fantasma" icona={X} aria-label={`${tg(idioma, 'Lleva')} ${etiqueta}`}
                        onClick={() => fet(h.rebutja({ titular: g.id, camp }), `Llevat de la fitxa: ${etiqueta}.`)}>{tg(idioma, 'Lleva')}</Boto>
                    </div>
                  </td>
                </tr>
              )];
              valor.alternatives.forEach((alternativa, i) => {
                files.push(
                  <tr ref={adoptaEstilsDiferits} key={`${clau}-alt-${i}`}>
                    <th scope="row"><Insignia to="avis">{`Un paper diu una altra cosa · ${etiqueta}`}</Insignia></th>
                    <td><Valor text={valorEnText(camp, alternativa.valor)} visible={visible} idioma={idioma} /></td>
                    <td><Origens fonts={alternativa.fonts} paper={paper} /></td>
                    <td>—</td>
                    <td>
                      {/* Revisió adversarial 13-10-2026, troballa A11Y-1: el nom accessible comença pel text que es veu (WCAG 2.5.3). */}
                      <div className="sdp-gestoria-finestreta__accions">
                        <Boto varietat="secundari" icona={Check} aria-label={tga(idioma, 'confirmaEsteAria', etiqueta)}
                          onClick={() => fet(h.confirma({ titular: g.id, camp, valor: alternativa.valor }), `Confirmat el valor nou: ${etiqueta}.`)}>{tga(idioma, 'confirmaEste')}</Boto>
                        <Boto varietat="fantasma" icona={X} aria-label={tga(idioma, 'rebutjaLAria', etiqueta)}
                          onClick={() => fet(h.rebutja({ titular: g.id, camp, valor: alternativa.valor }), `Rebutjat el valor nou: ${etiqueta}.`)}>{tga(idioma, 'rebutjaL')}</Boto>
                      </div>
                    </td>
                  </tr>
                );
              });
              if (corregint === clau) {
                files.push(
                  <tr ref={adoptaEstilsDiferits} key={`${clau}-correccio`}>
                    <td colSpan={5}>
                      <FormulariCorreccio etiqueta={etiqueta} onCancela={() => setCorregint(null)}
                        onDesa={(text) => {
                          const motiu = h.entraAMa({ titular: g.id, camp, text });
                          if (!motiu) fet(null, `Entrat a mà: ${etiqueta}.`);
                          return motiu;
                        }} />
                    </td>
                  </tr>
                );
              }
              return files;
            })}
          </tbody>
        </Taula>
      )) : (
        <p ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__nota">{tg(idioma, 'Encara no hi ha cap valor confirmat.')}</p>
      )}
      <FormulariAMa h={h} onAnuncia={onAnuncia} idioma={idioma} />
    </Seccio>
  );
}

/* Un formulari de la Finestreta: els camps, el seu estat, «Copia» i l'esborrany per imprimir. */
function PanellFormulari({ form, fitxa, opcions, visible, onCopia, onImprimix, idioma = 'ca' }) {
  const omplert = useMemo(() => omplixFormulari(form, fitxa, opcions), [form, fitxa, opcions]);
  return (
    <div ref={adoptaEstilsDiferits} className="sdp-gestoria-finestreta__formulari">
      <p className="sdp-gestoria-finestreta__nota">{`${form.font.norma}. ${form.font.consulta}.`}</p>
      <p className="sdp-gestoria-finestreta__nota"><Insignia to="avis">{tg(idioma, VERIFICAR)}</Insignia></p>
      <p className="sdp-gestoria-finestreta__nota">
        {omplert.falten
          ? `Falten ${omplert.falten === 1 ? '1 camp' : `${omplert.falten} camps`} que la fitxa podria omplir; ${omplert.aMa === 1 ? '1 l’escrius' : `${omplert.aMa} els escrius`} tu.`
          : `Tots els camps que pot omplir la fitxa estan llestos; ${omplert.aMa === 1 ? '1 l’escrius' : `${omplert.aMa} els escrius`} tu.`}
      </p>
      <Taula titol={`Camps · ${form.nom}`} densa>
        <thead>
          <tr><th scope="col">Camp</th><th scope="col">{tg(idioma, 'Valor')}</th><th scope="col">{tg(idioma, 'Estat')}</th><th scope="col">{tg(idioma, 'Copia')}</th></tr>
        </thead>
        <tbody>
          {omplert.camps.map((c) => {
            const estat = c.perLaPersona ? { to: 'info', text: 'L’escrius tu' } : (ESTATS_FORMULARI[c.estat] ?? ESTATS_FORMULARI.falta);
            return (
              <tr ref={adoptaEstilsDiferits} key={c.id}>
                <th scope="row">{c.obligatori ? c.etiqueta : `${c.etiqueta} (opcional)`}</th>
                <td>{c.estat === 'llest' && !c.perLaPersona ? <Valor text={String(c.valor)} visible={visible} idioma={idioma} /> : '—'}</td>
                <td><Insignia to={estat.to}>{tg(idioma, estat.text)}</Insignia></td>
                <td>
                  {c.estat === 'llest' && !c.perLaPersona ? (
                    <Boto varietat="fantasma" icona={Copy} aria-label={`${tg(idioma, 'Copia')} «${c.etiqueta}»`} onClick={() => onCopia(c)}>{tg(idioma, 'Copia')}</Boto>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Taula>
      <div className="sdp-gestoria-finestreta__accions">
        <Boto varietat="secundari" icona={Printer} disabled={!visible} onClick={onImprimix}>{tg(idioma, 'Esborrany per imprimir')}</Boto>
        <p className="sdp-gestoria-finestreta__nota">
          {tg(idioma, visible ? 'Imprimix esta pàgina: és un esborrany per a copiar, no el model de l’organisme.' : 'Obri l’ull de la barra perquè l’esborrany porte els valors.')}
        </p>
      </div>
    </div>
  );
}

/* Pas 5: la Finestreta, una pestanya per formulari. */
function SeccioFinestreta({ h, visible, avui, copia, imprimix, onAnuncia, idioma = 'ca' }) {
  const [tribut, setTribut] = useState('');
  const [representacio, setRepresentacio] = useState('');
  const tributs = h.fitxa.tributs;
  const representacions = h.fitxa.representacions;
  const triatTribut = tributs.some((t) => t.id === tribut) ? tribut : (tributs[0]?.id ?? '');
  const triadaRepresentacio = representacions.some((r) => r.id === representacio) ? representacio : (representacions[0]?.id ?? '');
  /* La representació només omple el formulari de la representació d'una entitat: als altres, la persona
     actua per a ella mateixa i els camps del representant queden buits (mai el seu propi NIF com a representant). */
  const opcions = useMemo(() => ({ avui, ...(triatTribut ? { tribut: triatTribut } : {}) }), [avui, triatTribut]);
  const opcionsRepresentacio = useMemo(() => ({ ...opcions, ...(triadaRepresentacio ? { representacio: triadaRepresentacio } : {}) }),
    [opcions, triadaRepresentacio]);
  const copiaCamp = (c) => {
    const avisa = (ok) => onAnuncia(ok ? `Copiat: ${c.etiqueta}.` : `No s’ha pogut copiar «${c.etiqueta}»: obri l’ull, selecciona’l i copia’l a mà.`);
    try {
      Promise.resolve(copia(String(c.valor))).then(() => avisa(true), () => avisa(false));
    } catch {
      avisa(false);
    }
  };
  const imprimixFormulari = () => {
    try {
      imprimix();
    } catch {
      onAnuncia('Este navegador no deixa imprimir des d’ací: fes-ho des del seu menú.');
    }
  };
  return (
    <Seccio titol="Finestreta" ajuda="Els formularis s’omplin NOMÉS amb els valors confirmats de la teua fitxa, cadascun validat amb el tipus del camp: un NIF no entra mai en un camp de nom." idioma={idioma}>
      <Alerta to="avis" viva={false} titol={tg(idioma, 'L’app no signa ni presenta res')}>
        {idioma === 'ca'
          ? `${AVIS_SENSE_SIGNAR} Cada formulari és «${VERIFICAR}»: comprova’l a la seu de l’organisme abans de copiar-hi res. La signatura, l’exposició, la sol·licitud i l’IBAN els escrius sempre tu.`
          : `${tg(idioma, AVIS_SENSE_SIGNAR)} (${tg(idioma, VERIFICAR)}).`}
      </Alerta>
      {tributs.length > 1 ? (
        <Camp etiqueta="Objecte tributari dels formularis">
          <Selector opcions={tributs.map((t, i) => ({ valor: t.id, etiqueta: `Objecte tributari ${i + 1}` }))} value={triatTribut}
            onChange={(event) => setTribut(event.target.value)} />
        </Camp>
      ) : null}
      {representacions.length > 1 ? (
        <Camp etiqueta="Representació del formulari de l’entitat">
          <Selector opcions={representacions.map((r, i) => ({ valor: r.id, etiqueta: `Representació ${i + 1}` }))} value={triadaRepresentacio}
            onChange={(event) => setRepresentacio(event.target.value)} />
        </Camp>
      ) : null}
      <Pestanyes etiqueta={tg(idioma, 'Formularis de la Finestreta')} pestanyes={FORMULARIS.map((form) => ({
        id: form.id,
        etiqueta: form.nom,
        contingut: (
          <PanellFormulari form={form} fitxa={h.fitxa} opcions={form.id === 'representacio-entitat' ? opcionsRepresentacio : opcions} visible={visible}
            onCopia={copiaCamp} onImprimix={imprimixFormulari} idioma={idioma} />
        )
      }))} />
    </Seccio>
  );
}

export function VistaFinestreta({
  titular = null, magatzem, subtle, tractors, entorn, rellotge, inflate, persistencia, copia = copiaPerDefecte, imprimix = imprimixPerDefecte,
  obriPaper = obriPaperPerDefecte, porta = null, idioma = 'ca'
}) {
  const navigate = useNavigate();
  const h = useFinestreta({ magatzem, subtle, tractors, entorn, rellotge, inflate, persistencia });
  const [visible, setVisible] = useState(false);
  const [anunci, setAnunci] = useState('');
  const autor = autorDe(titular, idioma);
  const avui = avuiDe(rellotge);

  /* Una lectura nova, un oblit o el bloqueig del cofre tornen a tancar l'ull. */
  useEffect(() => {
    setVisible(false);
  }, [h.generacio]);
  useEffect(() => {
    if (h.lectura && !h.ocupat) setAnunci('Lectura completada: revisa les propostes.');
  }, [h.lectura, h.ocupat]);

  const oblida = () => {
    setAnunci(h.ocupat ? 'Lectura cancel·lada. La carpeta i les propostes s’han oblidat.' : 'La carpeta i les propostes s’han oblidat; la fitxa confirmada es queda.');
    setVisible(false);
    h.oblida();
  };
  /* Amb el cofre bloquejat no hi ha res a mostrar: la boina va sense l'ull. */
  const boina = h.persistenciaBloquejada ? null : (
    <span ref={adoptaEstilsDiferits} className="sdp-gestoria-boina">
      <UllDades visible={visible} onCommuta={() => setVisible((abans) => !abans)} idioma={idioma} />
    </span>
  );

  const contingut = (
    <>
      <PortaIdentitat h={h} onObreTractors={() => navigate(CONSULTA_TRACTORS_IDENTITAT)} idioma={idioma} />
      {h.desaBlocat && h.errorPersistencia ? <Alerta to="error" titol="La fitxa desada">{h.errorPersistencia}</Alerta> : null}
      {!h.fitxaLlegida ? <Carregant etiqueta={tg(idioma, 'Obrint la teua fitxa…')} /> : null}
      {h.aprovat ? <SeccioCarpeta h={h} onOblida={oblida} idioma={idioma} /> : null}
      {h.aprovat && h.pla ? <SeccioPla h={h} onAnuncia={setAnunci} idioma={idioma} /> : null}
      {h.aprovat && h.lectura ? <ResumLectura lectura={h.lectura} /> : null}
      {/* La fitxa i la Finestreta també són codi del tractor: sense la seua aprovació, no es pinten. */}
      {h.aprovat ? <SeccioPropostes h={h} visible={visible} obriPaper={obriPaper} onAnuncia={setAnunci} idioma={idioma} /> : null}
      {h.aprovat && h.fitxaLlegida ? <SeccioFitxa h={h} visible={visible} obriPaper={obriPaper} onAnuncia={setAnunci} idioma={idioma} /> : null}
      {h.aprovat && h.fitxaLlegida ? (
        <SeccioFinestreta h={h} visible={visible} avui={avui} copia={copia} imprimix={imprimix} onAnuncia={setAnunci} idioma={idioma} />
      ) : null}
      {h.aprovat && !h.teCarpeta && !h.lectura && h.fitxaLlegida && !h.porta.carregant ? (
        <EstatBuit icona={FolderOpen} titol={tg(idioma, 'Encara no has triat cap carpeta')}>
          {tg(idioma, 'Tria la carpeta arrel de la Gestoria: primer et diré quins papers llegiré i quins no, i només després els llegiré.')}
        </EstatBuit>
      ) : null}
    </>
  );

  const etiquetesLoc = idioma === 'ca'
    ? ETIQUETES
    : [
      { text: tg(idioma, 'GESTORIA'), className: 'sdp-badge-system' },
      { text: tg(idioma, 'Identitat i Finestreta'), className: 'sdp-badge-category' },
      etiquetaBetaOberta(idioma)
    ];

  return (
    <PaginaApp title={tg(idioma, 'Identitat i Finestreta')} subtitle={tg(idioma, 'La teua fitxa legal, privada, i els tràmits preparats per a copiar')}
      lead={tg(idioma, 'Els teus papers d’identitat, llegits en este ordinador: confirmes cada dada, es desa xifrada al cofre i la Finestreta te-la prepara per a copiar-la als tràmits. No signa ni presenta res.')}
      author={autor} barActions={boina} labels={etiquetesLoc} rellotgeViu rellotge={rellotge}
      showComment={false} showShare={false} showConnect={false}>
      <p ref={adoptaEstilsDiferits} role="status" aria-live="polite" className="sdp-nomes-lector">{anunci}</p>
      {typeof porta === 'function' ? porta(contingut) : contingut}
    </PaginaApp>
  );
}

export default function Finestreta({ cofre: cofreDeFora = null, descarrega, ...props }) {
  const [cofre] = useState(() => cofreDeFora ?? cofreDeLaGestoria());
  const persistencia = useMemo(() => persistenciaDelCofre(cofre, COLLECCIO_IDENTITAT), [cofre]);
  useEffect(() => () => cofre.bloqueja('eixida'), [cofre]);
  const { rellotge, idioma = 'ca' } = props;
  const porta = useCallback((contingut) => (
    <PortaCofre cofre={cofre} descarrega={descarrega} rellotge={rellotge} idioma={idioma}>{() => contingut}</PortaCofre>
  ), [cofre, descarrega, rellotge, idioma]);
  return <VistaFinestreta {...props} persistencia={persistencia} porta={porta} />;
}
