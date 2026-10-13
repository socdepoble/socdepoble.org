/**
 * ShellGestoria.jsx — la closca de la Gestoria de Poble: la boina personal i
 * la pàgina del mòdul triat.
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA; aprovat al xat). Des de
 * l'ordre del Mestre del mateix 261004 («contaminació crítica de
 * rutes/estats entre Gestoria i Wiki») la munta la seua app, /app/gestoria
 * (src/apps/gestoria), només en desenvolupament; mai la Wiki ni /gestoria:
 *  · LA NAVEGACIÓ NO ÉS SEUA · la closca no dibuixa cap barra lateral ni cap
 *    menú: els mòduls són entrades de la BarraApp global (el manifest de
 *    l'app, amb grups), i la ruta tria el mòdul (`modulActiu`). Ordre de
 *    MarIA 261012_2145, acatada pel Mestre: revoca el «rail intern» del
 *    261012, que duplicava la barra i perdia les capacitats de la plataforma.
 *    El que encara no existix ho diu la seua pàgina: «en obres», amb el perquè.
 *  · LA BOINA PERSONAL (principi 2) · tota pàgina de la closca és una
 *    PaginaApp amb la barra taronja (regla d'or 2), però la boina ja no diu
 *    «Sóc de Poble»: diu la identitat privada del titular (només el nom i la
 *    població), enllaçada a la seua pàgina; un sol ull de privacitat
 *    (aria-pressed) i la data i l'hora de la darrera lectura dels extractes.
 *    Sense identitat, «Titular sense configurar», mai una autora fingida.
 *    Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405,
 *    front B), sobre el principi 2 del 261004 i la petició 261012_2148: amb
 *    sessió, la boina és la PERSONA de la sessió (`titular`,
 *    el { nom, avatar, poble } de useSessioApp().titular que passa el pont),
 *    amb el seu avatar i enllaçada al seu perfil (/el-meu-perfil). A
 *    l'extrem dret de la barra hi ha SEMPRE la data i l'hora vives
 *    (PaginaApp amb rellotgeViu: l'últim fill de .bar-actions) a totes les
 *    pàgines de la closca, també les «en obres», i a la de cada targeta. La
 *    darrera lectura es queda com un xip secundari a l'esquerra del rellotge
 *    (.sdp-gestoria-boina__lectura), amb el dia només si no és d'avui; la
 *    pastilla de document de PaginaApp ja no la porta: la data de la barra
 *    és el rellotge.
 *  · EL TITULAR (petició del Mestre via MarIA, 261012_2148) · dues portes
 *    que es diuen pel seu nom i no es barregen: «Configura el titular»
 *    (local: el nom i la població en la memòria d'esta pàgina, que «Oblida
 *    les dades» esborra; no és cap compte) i «Entra al compte» (el compte de
 *    veres, `hrefEntrada` de l'amfitrió, que en entrar torna al Tauler). La
 *    identitat que es configura ací mana sobre la del fitxer de l'empresa,
 *    perquè és l'acte més recent de la persona.
 *    Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405,
 *    front B), que deixa sense efecte la petició 261012_2148 quan hi ha
 *    sessió: la persona de la sessió mana sobre el titular local i sobre el
 *    fitxer de l'empresa, i no hi ha ni «Configura el titular» ni «Titular
 *    d’esta pàgina». Sense sessió, les dues portes de sempre.
 *  · EL FULL TRIMESTRAL · ContenidorGestoria, que passa a la closca (onFactures) la proposta analitzada perquè Impostos i el Tauler parlen del mateix trimestre que el full (ordre del Mestre, 261012); tocar-lo torna a «pendent» els tractors de factures i correu, i la closca el del Tauler.
 *  · LES TARGETES · cada targeta del Tauler obri la seua pàgina pròpia dins
 *    de la closca (PaginaTargeta). Les xifres es mostren amb l'ull: el de la
 *    boina les mostra o les amaga totes; el de cada targeta, la seua.
 *  · LA CAPÇALERA DE CONTEXT (Panell ERP, 261012) · el trimestre de les
 *    estimacions el tria la persona (‹ › i Hui) i mana: si el Full no en té
 *    factures, les targetes ho diuen. Quan el Full analitza un trimestre nou,
 *    o s'obliden les dades, el selector torna a seguir el Full o el dia d'avui.
 *  · LA VISTA COMPRIMIDA · el commutador de Tauler.jsx, que val per al
 *    Tauler, els Bancs i els Impostos i es conserva entre mòduls.
 *    Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405,
 *    front E), sobre la del 261012: el Tauler té també la Cabina d’Avió
 *    (CabinaAvio.jsx, amb VISTES_TAULER); els Bancs i els Impostos es queden
 *    amb Targetes | Vista comprimida (VISTES_PANELL) i, amb la Cabina triada,
 *    hi veuen la comprimida (vistaDelModul). La vista triada es conserva: en
 *    tornar al Tauler, la Cabina.
 *  · L'ESCÀNER LOCAL (ordre del Mestre, 13-10-2026, pla 261013_1405, front
 *    D) · Derogat EN PART el precedent dels 261007 i 261009 (AppGestoria.jsx:
 *    les pantalles noves entren «pel pont i no per la closca», perquè tocar
 *    esta closca torna a «pendent» el tractor gestoria.tauler). L'Escàner ha
 *    d'abocar els extractes al Tauler i la seua radiografia ha de sobreviure
 *    als canvis de mòdul: només es pot fer ací, amb el mateix useTauler. El
 *    mòdul 'escaner' és PanellEscaner, amb el seu tractor propi
 *    ('gestoria.escaner'); useEscaner es munta al costat de useTauler i en
 *    fa servir la porta (cap segona passada d'empremtes). «Oblida les dades»
 *    també oblida la carpeta. La pista de la identitat legal porta a
 *    «Identitat i Finestreta», una vista del pont (`hrefIdentitat`). El
 *    Mestre torna a signar el Tauler.
 * En l'app, la ruta pública tria el mòdul; cap dada ni import va a la URL.
 * La targeta oberta viu en l'estat de la pàgina. L'Índex de la barra blava sí
 * que hi escriu el títol de la secció que tria la persona (?seccio=): per
 * això cap títol ni subtítol de les pàgines i targetes de la closca porta
 * dades (nucli/targetesTauler.js, «Compte 1, 2…»), i el diàleg del titular
 * només existix mentre està obert.
 * La mateixa instància conserva useTauler i useEscaner entre els mòduls.
 *
 * Proves: el magatzem, subtle, el catàleg, l'entorn, el rellotge, inflate,
 * avui i descarrega s'injecten i passen també a ContenidorGestoria (i el
 * rellotge, al rellotge viu de la barra); `titular` (opcional) és la persona
 * de la sessió, si n'hi ha; `hrefIdentitat` (opcional), la ruta de la vista
 * «Identitat i Finestreta».
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { DateTimeControl } from '../../../components/PedraSeca/atoms/controls.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Dialeg } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import ContenidorGestoria, { CONSULTA_TRACTORS } from '../ContenidorGestoria.jsx';
import { PanellEscaner } from '../escaner/PanellEscaner.jsx';
import { useEscaner } from '../escaner/useEscaner.js';
import { trimestreDeData } from '../impostos/nucli/impostos.js';
import { CabinaAvio } from './CabinaAvio.jsx';
import { dadesDelTauler, trimestreVei } from './nucli/targetesTauler.js';
import {
  ContextTrimestre, ModulEnObres, PaginaTargeta, PortaTauler, VISTES_PANELL, VISTES_TAULER, VistaBancs, VistaImpostos, VistaTauler,
  vistaDelModul
} from './Tauler.jsx';
import { UllPrivacitat } from './TargetaTauler.jsx';
import { useTauler } from './useTauler.js';

/** La pàgina del titular: la seua (el perfil de qui fa servir la Gestoria). */
export const RUTA_TITULAR = '/el-meu-perfil';
/** El nom de la boina mentre no hi ha cap identitat. */
export const TITULAR_SENSE_CONFIGURAR = 'Titular sense configurar';

/**
 * Les pàgines dels mòduls de la closca: el títol i el subtítol de cadascuna.
 * `enObres`: encara no existix, i `explica` diu per què i quan. Els noms i les
 * icones de la navegació viuen al manifest de l'app (la BarraApp).
 */
export const MODULS_GESTORIA = Object.freeze([
  { id: 'tauler', titol: 'Tauler Central', subtitol: 'Gestoria de Poble' },
  {
    id: 'facturacio', titol: 'Facturació', subtitol: 'Factures, rectificatives i pressupostos', enObres: true,
    explica: 'L’emissió de factures sobre el llibre Veri*Factu encara no té pantalla: ara només n’hi ha el nucli. És el pas 2 del pla de la Gestoria.'
  },
  {
    id: 'contactes', titol: 'Contactes', subtitol: 'Clients i proveïdors', enObres: true,
    explica: 'La llibreta de clients i proveïdors encara no existix. Mentrestant, els proveïdors habituals els aprén el full trimestral.'
  },
  {
    id: 'burocracia', titol: 'Burocràcia', subtitol: 'Models, cotitzacions i notificacions', enObres: true,
    explica: 'El calendari d’obligacions i els avisos de terminis tenen el model pur, però encara no tenen pantalla. És el pas 4 del pla de la Gestoria.'
  },
  { id: 'bancs', titol: 'Bancs i Tresoreria', subtitol: 'Estat de comptes reals i conciliació' },
  { id: 'impostos', titol: 'Impostos', subtitol: 'Estimacions del 303 i del 130' },
  { id: 'full', titol: 'Full trimestral', subtitol: 'El full de factures del trimestre per a la gestoria' },
  {
    id: 'informes', titol: 'Informes', subtitol: 'Els models i els fulls ja lliurats', enObres: true,
    explica: 'L’històric dels models presentats i dels fulls lliurats, per a contrastar-hi les estimacions, encara no existix.'
  },
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): l'Escàner Local ja existix (PanellEscaner) i deixa
     d'estar en obres. Llig la carpeta arrel sencera, proposa i mai mou ni esborra res; «quan es pot llençar» (el
     pas 7 del pla, documents/plaNeteja.js) queda per a una fase posterior. */
  { id: 'escaner', titol: 'Escàner Local', subtitol: 'Tota la carpeta d’un colp: bancs, factures, duplicats i buits' }
]);

/* Les etiquetes de les pàgines de la closca (la capçalera de la captura del Mestre). */
const ETIQUETES_PANELL = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'PANELL INTERN', className: 'sdp-badge-category' })
]);
const ETIQUETA_EN_OBRES = Object.freeze({ text: 'En obres', className: 'sdp-badge-tag' });
const EN_OBRES = 'Este mòdul de la Gestoria encara no existix: ací es diu què hi haurà i en quin pas del pla arriba.';

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * La pastilla de la boina: l'instant de la darrera lectura, en hora local,
 * amb el format únic de les barres (hh:mm i dd/mm/aa). null sense lectura.
 * @param {number|null} ms
 * @returns {{ time: string, date: string, dateTime: string }|null}
 */
export function pastillaDeSincronitzacio(ms) {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const dia = `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
  const hora = `${dosXifres(d.getHours())}:${dosXifres(d.getMinutes())}`;
  return { time: hora, date: dia, dateTime: `${d.getFullYear()}-${dosXifres(d.getMonth() + 1)}-${dosXifres(d.getDate())}T${hora}` };
}

/**
 * La boina personal: la identitat que se sap o, si no, l'estat honest.
 * @param {{ nom?: string, poble?: string, avatar?: string|null, href?: string|null }|null} identitat
 * @returns {{ nom: string, poble: string, avatar: string|null, href: string, configurat: boolean }}
 */
export function titularDe(identitat) {
  const nom = typeof identitat?.nom === 'string' ? identitat.nom.trim() : '';
  return {
    nom: nom || TITULAR_SENSE_CONFIGURAR,
    poble: typeof identitat?.poble === 'string' ? identitat.poble : '',
    avatar: identitat?.avatar ?? null,
    href: identitat?.href || RUTA_TITULAR,
    configurat: Boolean(nom)
  };
}

/**
 * El titular que la persona escriu al diàleg: el nom (obligatori) i la
 * població, nets. null si no hi ha nom.
 * @param {{ nom?: unknown, poble?: unknown }} camps
 * @returns {{ nom: string, poble: string }|null}
 */
export function titularLocalDe({ nom, poble } = {}) {
  const net = (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '');
  const nomNet = net(nom);
  return nomNet ? { nom: nomNet, poble: net(poble) } : null;
}

/* El dia d'avui, { a, m, d }, per al trimestre de les estimacions. */
function diaDe(data) {
  return data instanceof Date && !Number.isNaN(data.getTime())
    ? { a: data.getFullYear(), m: data.getMonth() + 1, d: data.getDate() }
    : null;
}

const mateixDia = (x, y) => Boolean(x && y && x.a === y.a && x.m === y.m && x.d === y.d);

/**
 * El xip de la darrera lectura, a l'esquerra del rellotge viu de la barra
 * (ordre del Mestre, 13-10-2026, pla 261013_1405, front B): l'hora i, només
 * si la lectura no és del dia d'avui (`hui`), també el dia, perquè la barra
 * no diga dues vegades la mateixa data i quede ample per a l'autoria en un
 * telèfon. El nom accessible i el dateTime la diuen sencera. null sense
 * lectura.
 * @param {number|null} ms l'instant de la lectura
 * @param {{ a: number, m: number, d: number }|null} hui el dia d'avui de la closca
 * @returns {{ time: string, date: string, dateTime: string, etiqueta: string }|null}
 */
export function pastillaDeLectura(ms, hui) {
  const pastilla = pastillaDeSincronitzacio(ms);
  if (!pastilla) return null;
  return {
    ...pastilla,
    date: mateixDia(diaDe(new Date(ms)), hui) ? '' : pastilla.date,
    etiqueta: `Dades llegides a les ${pastilla.time} del ${pastilla.date}`
  };
}

/**
 * Les dues portes del titular, al Tauler mentre la boina diu «Titular sense
 * configurar». El títol és un paràgraf (Alerta): l'Índex no el recull.
 */
function PortesDelTitular({ hrefEntrada, onConfigura, onEntra }) {
  return (
    <Alerta to="info" titol="Qui porta esta gestoria?" viva={false}
      accions={(
        <>
          <Boto varietat="primari" onClick={onConfigura}>Configura el titular</Boto>
          {hrefEntrada ? <Boto varietat="secundari" onClick={onEntra}>Entra al compte</Boto> : null}
        </>
      )}>
      {hrefEntrada
        ? 'Pots dir ací el nom i la població (només en este ordinador i mentre la Gestoria està oberta) o entrar al teu compte, que en acabar et torna al Tauler.'
        : 'Pots dir ací el nom i la població: només en este ordinador i mentre la Gestoria està oberta.'}
    </Alerta>
  );
}

/**
 * Després de desar-lo, el titular escrit ací es pot canviar o oblidar sense
 * dependre de cap lectura del banc ni del tractor (GES-06, auditoria de Codex
 * 261012_2022): «Oblida les dades» només hi és quan hi ha una lectura.
 */
function TitularDEstaPagina({ onCanvia, onOblida }) {
  return (
    <Alerta to="info" titol="Titular d’esta pàgina" viva={false}
      accions={(
        <>
          <Boto varietat="secundari" onClick={onCanvia}>Canvia el titular</Boto>
          <Boto varietat="secundari" onClick={onOblida}>Oblida el titular</Boto>
        </>
      )}>
      Només viu en la memòria d’esta pàgina: no és cap compte i no ix d’este ordinador.
    </Alerta>
  );
}

/**
 * @param {object} p
 * @param {string|null} [p.hrefEntrada] l'entrada al compte de l'amfitrió, que torna al Tauler (sense sessió); null amb
 *   sessió o sense amfitrió
 * @param {{ nom: string, avatar: string|null, poble: string }|null} [p.titular] la persona de la sessió (el pont:
 *   useSessioApp().titular), o null sense sessió
 * @param {string|null} [p.hrefIdentitat] la ruta de la vista «Identitat i Finestreta» del pont, o null
 */
export default function ShellGestoria({
  magatzem, subtle, tractors, entorn, rellotge, inflate, avui, descarrega, titular: titularPropi = null,
  modulActiu, hrefEntrada = null, hrefIdentitat = null
}) {
  const navigate = useNavigate();
  const tauler = useTauler({ magatzem, subtle, tractors, entorn, rellotge });
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): l'Escàner, al costat del Tauler i amb la seua porta. */
  const escaner = useEscaner({ porta: tauler.porta, magatzem, subtle, tractors, entorn, rellotge, avui });
  const modul = modulActiu ?? 'tauler';
  const [oberta, setOberta] = useState(null);
  const [visible, setVisible] = useState(false);
  const [avis, setAvis] = useState(null);
  /* El que el Full trimestral ha passat (onFactures): { any, t, factures, historial } o null. */
  const [full, setFull] = useState(null);
  /* El trimestre que ha triat la persona a la capçalera de context, o null: el del Full o el d'avui. */
  const [periodeTriat, setPeriodeTriat] = useState(null);
  const [vista, setVista] = useState('targetes');
  /* El titular que la persona ha escrit al diàleg (només en memòria), i si el diàleg és obert. */
  const [titularLocal, setTitularLocal] = useState(null);
  const [configurant, setConfigurant] = useState(false);
  const llegixHui = useCallback(
    () => diaDe(typeof avui === 'function' ? avui() : new Date(typeof rellotge === 'function' ? rellotge() : Date.now())),
    [avui, rellotge]
  );
  const [hui, setHui] = useState(llegixHui);
  const refTitol = useRef(null);
  const navegat = useRef(false);
  const modulAnterior = useRef(modul);
  const periodeDelFull = useRef(null);
  const enfocaTitol = useRef(false);
  const idFormTitular = useId();

  /* El dia d'avui es torna a llegir quan la pestanya torna a primer pla: una
     closca oberta de la nit al matí no pot dir que encara és ahir (el rellotge
     del termini i «Hui»). Només canvia l'estat si el dia ha canviat. */
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const refresca = () => {
      if (document.visibilityState !== 'visible') return;
      const nou = llegixHui();
      setHui((abans) => (mateixDia(abans, nou) ? abans : nou));
    };
    document.addEventListener('visibilitychange', refresca);
    return () => document.removeEventListener('visibilitychange', refresca);
  }, [llegixHui]);

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el rellotge viu
     de la barra canvia de dia a mitjanit, i el dia de la closca (el trimestre,
     el termini, «Hui» i el xip de la lectura) el seguix sense esperar que la
     pestanya torne a primer pla: un sol setTimeout fins a la mitjanit següent
     del rellotge (l'injectat o el del dispositiu), que es torna a armar amb el
     dia nou. */
  useEffect(() => {
    const ara = typeof rellotge === 'function' ? rellotge() : Date.now();
    if (!Number.isFinite(ara)) return undefined;
    const d = new Date(ara);
    const mitjanit = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const temporitzador = setTimeout(() => {
      const nou = llegixHui();
      setHui((abans) => (mateixDia(abans, nou) ? abans : nou));
    }, Math.max(1000, mitjanit - ara + 1000));
    return () => clearTimeout(temporitzador);
  }, [hui, llegixHui, rellotge]);

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): amb sessió, la
     persona de la sessió mana i porta al seu perfil. Sense, el titular escrit
     ací, el del fitxer de l'empresa o cap; i, sense un href propi, el nom de
     la boina porta a l'entrada que dona l'amfitrió (sense sessió) o al perfil. */
  const deLaSessio = titularPropi ? { ...titularPropi, href: titularPropi.href || RUTA_TITULAR } : null;
  const identitat = deLaSessio ?? titularLocal ?? tauler.lectura?.identitat ?? null;
  const titular = titularDe({ ...identitat, href: identitat?.href || hrefEntrada || undefined });
  const pastilla = pastillaDeSincronitzacio(tauler.llegit);
  const lectura = pastillaDeLectura(tauler.llegit, hui);
  /* Les xifres es tornen a calcular quan arriba (o s'oblida) una lectura, quan
     el Full trimestral passa (o retira) les seues factures o quan la persona
     tria un altre trimestre, i no a cada pintada. */
  const dades = useMemo(() => dadesDelTauler({
    lectura: tauler.lectura,
    factures: full ? [...full.factures, ...full.historial] : [],
    periode: periodeTriat ?? (full ? { any: full.any, t: full.t } : null),
    avui: hui
  }), [tauler.lectura, full, periodeTriat, hui]);

  /* Quan el Full analitza un trimestre nou, l'acte més recent de la persona és eixe: el selector torna a seguir-lo. */
  useEffect(() => {
    const abans = periodeDelFull.current;
    periodeDelFull.current = full ? `${full.any}-${full.t}` : null;
    if (full && periodeDelFull.current !== abans) setPeriodeTriat(null);
  }, [full]);

  /* Després d'una navegació de la persona (un mòdul, una targeta, Tornar), el focus va a l'H1 de la pàgina nova. */
  useEffect(() => {
    if (modulAnterior.current !== modul) {
      modulAnterior.current = modul;
      setOberta(null);
      setAvis(null);
      setConfigurant(false);
      navegat.current = false;
      refTitol.current?.focus();
      return;
    }
    if (!navegat.current) return;
    navegat.current = false;
    refTitol.current?.focus();
  }, [modul, oberta]);

  /* En desar el titular, el diàleg i el botó que l'havia obert ja no hi són: el focus va a l'H1. */
  useEffect(() => {
    if (!enfocaTitol.current) return;
    enfocaTitol.current = false;
    refTitol.current?.focus();
  }, [titularLocal]);

  const obreTractors = useCallback(() => navigate(CONSULTA_TRACTORS), [navigate]);
  /* «Oblida les dades» buida la lectura i torna a tancar l'ull de la boina: la
     lectura següent no es pinta mai amb les xifres al DOM d'entrada (ordre del
     Mestre, 261004). Els ulls de cada targeta els tanca la `generacio`. També
     s'oblida el titular escrit ací i, per l'ordre del Mestre del 13-10-2026
     (pla 261013_1405, front D), la carpeta de l'Escàner i la seua radiografia. */
  const oblida = () => {
    setVisible(false);
    setFull(null);
    setPeriodeTriat(null);
    setTitularLocal(null);
    tauler.oblida();
    escaner.oblida();
  };
  const desaTitular = (event) => {
    event.preventDefault();
    const camps = new FormData(event.currentTarget);
    const nou = titularLocalDe({ nom: camps.get('nom'), poble: camps.get('poble') });
    if (!nou) return;
    enfocaTitol.current = true;
    setConfigurant(false);
    setTitularLocal(nou);
  };
  /* El botó que s'ha premut se'n va amb el titular: el focus també va a l'H1. */
  const oblidaTitular = () => {
    enfocaTitol.current = true;
    setTitularLocal(null);
  };
  const periodeActual = Number.isInteger(dades.iva.t) ? { any: dades.iva.any, t: dades.iva.t } : null;
  const mouPeriode = (pas) => {
    const nou = trimestreVei(periodeActual, pas);
    if (nou) setPeriodeTriat(nou);
  };
  const ambPeriode = {
    onAnterior: () => mouPeriode(-1),
    onSeguent: () => mouPeriode(1),
    onHui: () => {
      const nou = llegixHui();
      setHui((abans) => (mateixDia(abans, nou) ? abans : nou));
      setPeriodeTriat(trimestreDeData(nou));
    }
  };
  const obriTargeta = (id) => {
    navegat.current = true;
    setOberta({ modul, id });
  };
  const tornaAlModul = () => {
    navegat.current = true;
    setOberta(null);
  };

  /* La boina: l'ull i el xip de la darrera lectura. El rellotge viu l'afig PaginaApp darrere, a l'extrem dret. */
  const accionsBoina = (
    <span className="sdp-gestoria-boina">
      <UllPrivacitat visible={visible} onCommuta={() => setVisible((abans) => !abans)} etiqueta="Mostra les xifres" />
      {lectura ? (
        <span className="sdp-gestoria-boina__lectura">
          <DateTimeControl time={lectura.time} date={lectura.date} dateTime={lectura.dateTime} label={lectura.etiqueta} />
        </span>
      ) : null}
    </span>
  );
  /* Les targetes dels Bancs i dels Impostos pinten la vista que el seu commutador oferix (la Cabina és del Tauler). */
  const vistaPanell = vistaDelModul(vista, VISTES_PANELL);
  const comuns = { titular, pastilla, visible, generacio: tauler.generacio, vista: vistaPanell, onObri: obriTargeta,
    onAvis: (text) => setAvis({ modul, text }) };
  const actual = MODULS_GESTORIA.find((m) => m.id === modul) ?? MODULS_GESTORIA[0];
  /* No es pinta ni un detall ni un avís del mòdul anterior, tampoc abans
     que l'efecte de navegació els buide. La lectura financera es conserva. */
  const targeta = oberta?.modul === modul ? dades.targetes.find((t) => t.id === oberta.id) ?? null : null;
  const avisActual = avis?.modul === modul ? avis.text : '';
  const porta = <PortaTauler tauler={tauler} onObreTractors={obreTractors} onOblida={oblida} />;
  const contextTauler = (
    <ContextTrimestre dades={dades} visible={visible} vista={vista} onCanviaVista={setVista} vistes={VISTES_TAULER} periode={ambPeriode} />
  );
  const context = <ContextTrimestre dades={dades} visible={visible} vista={vista} onCanviaVista={setVista} periode={ambPeriode} />;
  /* La pista de l'Escàner cap a «Identitat i Finestreta»: només si el pont en dona la ruta. */
  const obreIdentitat = hrefIdentitat ? () => navigate(hrefIdentitat) : undefined;
  const portesDelTitular = titular.configurat ? null : (
    <PortesDelTitular hrefEntrada={hrefEntrada} onConfigura={() => setConfigurant(true)} onEntra={() => navigate(hrefEntrada)} />
  );
  const titularDEstaPagina = !titularPropi && titularLocal
    ? <TitularDEstaPagina onCanvia={() => setConfigurant(true)} onOblida={oblidaTitular} />
    : null;

  const contingut = {
    tauler: (
      <>
        {portesDelTitular}{titularDEstaPagina}{contextTauler}{porta}
        {vista === 'cabina' ? <CabinaAvio dades={dades} visible={visible} onObri={obriTargeta} /> : <VistaTauler dades={dades} comuns={comuns} />}
      </>
    ),
    bancs: <>
      <ContextTrimestre dades={dades} visible={visible} vista={vista} onCanviaVista={setVista} />
      {porta}<VistaBancs dades={dades} comuns={comuns} />
    </>,
    impostos: <>{context}<VistaImpostos dades={dades} comuns={comuns} /></>,
    full: (
      <ContenidorGestoria magatzem={magatzem} subtle={subtle} tractors={tractors} entorn={entorn} rellotge={rellotge}
        inflate={inflate} avui={avui} descarrega={descarrega} onFactures={setFull} />
    ),
    escaner: (
      <PanellEscaner escaner={escaner} tauler={tauler} dades={dades} visible={visible} onObreTractors={obreTractors}
        onObreIdentitat={obreIdentitat} />
    )
  }[actual.id] ?? <ModulEnObres modul={actual} />;

  const salutacio = 'Ací tens la realitat de la teua empresa, calculada en este ordinador amb els extractes que tries.';

  return (
    <div className="sdp-gestoria-closca">
      <div className="sdp-gestoria-closca__pagina">
        {targeta ? (
          <PaginaTargeta targeta={targeta} titular={titular} visible={visible}
            barActions={accionsBoina} rellotgeViu rellotge={rellotge} onTorna={tornaAlModul} refTitol={refTitol} />
        ) : (
          <PaginaApp title={actual.titol} subtitle={actual.subtitol}
            lead={actual.id === 'tauler' ? (titular.configurat ? `Hola, ${titular.nom}! ${salutacio}` : salutacio) : actual.enObres ? EN_OBRES : undefined}
            author={titular} barActions={accionsBoina} rellotgeViu rellotge={rellotge}
            labels={actual.enObres ? [...ETIQUETES_PANELL, ETIQUETA_EN_OBRES] : ETIQUETES_PANELL}
            refTitol={refTitol} showComment={false} showShare={false} showConnect={false}>
            {avisActual ? <Alerta to="info" onTanca={() => setAvis(null)}>{avisActual}</Alerta> : null}
            {contingut}
          </PaginaApp>
        )}
      </div>
      {/* Només mentre és obert: el seu encapçalament no ha d'arribar mai a l'Índex de la pàgina. */}
      {configurant ? (
        <Dialeg obert onTanca={() => setConfigurant(false)} titol="Configura el titular" mida="s"
          accions={(
            <>
              <Boto varietat="secundari" onClick={() => setConfigurant(false)}>Cancel·la</Boto>
              <Boto varietat="primari" tipus="submit" form={idFormTitular}>Desa</Boto>
            </>
          )}>
          <form id={idFormTitular} className="sdp-gestoria-titular" onSubmit={desaTitular}>
            <Camp etiqueta="Nom" obligatori>
              <CampText name="nom" autoComplete="name" defaultValue={titularLocal?.nom ?? ''} />
            </Camp>
            <Camp etiqueta="Població" ajuda="Opcional.">
              <CampText name="poble" autoComplete="address-level2" defaultValue={titularLocal?.poble ?? ''} />
            </Camp>
            <p className="sdp-gestoria-titular__nota">
              Només es guarda en la memòria d’esta pàgina: no ix d’este ordinador, no és cap compte i «Oblida el titular» o «Oblida les dades» l’esborren.
            </p>
          </form>
        </Dialeg>
      ) : null}
    </div>
  );
}
