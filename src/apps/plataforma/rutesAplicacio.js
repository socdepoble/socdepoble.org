/**
 * Plataforma d'Apps Enxufables · rutes i paràmetres (Clàusula dels Slugs).
 *
 * On és la persona va al CAMÍ (/app/bar/taules/t-3); la consulta només porta
 * filtres. Ni el camí ni la consulta porten mai valors, noms ni text lliure:
 * només slugs, ids opacs, dates AAAA-MM-DD i UUID. Tots els validadors
 * rebutgen '..', '%2e' (i qualsevol '%'), majúscules i espais.
 *
 * Navegar d'una vista a una altra fa PUSH (arrere i avant recorren les
 * seccions); només la canonització fa replace. useSearchParams del router
 * propi fa replace per defecte: per això les apps llegixen i escriuen la
 * consulta amb useParametresConsulta, que fa push.
 */
import { useCallback, useMemo } from 'react';
import { useLocation, useRouter } from '../../app/contexts/RouterContext';

const MAX_SEGMENT = 64;

/** Slug: minúscules, xifres i guions solts ('taules', 'caixa-1'). */
export function esSlug(valor) {
  return typeof valor === 'string' && valor.length <= MAX_SEGMENT && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor);
}

/** Id opac: minúscules, xifres, '-' i '_'; comença per lletra o xifra. */
export function esIdOpac(valor) {
  return typeof valor === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(valor);
}

/** Data AAAA-MM-DD que existix al calendari (gregorià proléptic, sense zona). */
export function esData(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [any, mes, dia] = valor.split('-').map(Number);
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const data = new Date(Date.UTC(any, mes - 1, dia));
  return data.getUTCFullYear() === any && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** UUID en forma canònica (hexadecimal en minúscules). */
export function esUuid(valor) {
  return typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(valor);
}

/** Un tram qualsevol d'una ruta d'app: el que admeten tots els validadors. */
export function esSegmentSegur(valor) {
  return esIdOpac(valor);
}

export const VALIDADORS = Object.freeze({ slug: esSlug, idOpac: esIdOpac, data: esData, uuid: esUuid });

/**
 * Trams d'una ruta crua (sense descodificar) dins de /app. Torna null si
 * algun tram no és segur: una barra doble (també a l'inici, '//bar'), '..',
 * '%2e', una majúscula… Només es lleva UNA barra inicial i UNA de final
 * ('/app/bar/' no compta com a tram); qualsevol altra barra deixa un tram buit.
 */
export function tramsSegurs(cami) {
  if (typeof cami !== 'string') return null;
  const senseInici = cami.startsWith('/') ? cami.slice(1) : cami;
  if (senseInici === '') return [];
  const net = senseInici.endsWith('/') ? senseInici.slice(0, -1) : senseInici;
  const trams = net.split('/');
  return trams.every(esSegmentSegur) ? trams : null;
}

const PATRO_PARAMETRE = /^:([a-z][a-zA-Z0-9]*)$/;

/**
 * El validador declarat per a `nom`, només si és una propietat PRÒPIA de
 * `validadors`: un nom com 'constructor' o 'valueOf' no pot heretar
 * d'Object.prototype una funció que passe per validador. null si no n'hi ha.
 */
function validadorPropi(validadors, nom) {
  if (!validadors || typeof validadors !== 'object' || !Object.hasOwn(validadors, nom)) return null;
  return typeof validadors[nom] === 'function' ? validadors[nom] : null;
}

/** Un component de React (funció, classe, memo, lazy o forwardRef). */
const esComponent = (valor) => typeof valor === 'function'
  || (typeof valor === 'object' && valor !== null && '$$typeof' in valor);

/** Quina columna veu primer la persona en una closca «estreta» (ClosaAplicacio). */
export const PANELLS_ESTRET = Object.freeze(['esquerra', 'mig', 'detall']);

/* Les columnes d'una ruta de ClosaAplicacio: Mig i Detall sempre, Esquerra si n'hi ha. */
function errorsDeColumnes(ruta, on) {
  const errors = [];
  for (const columna of ['Mig', 'Detall']) {
    if (!esComponent(ruta[columna])) errors.push(`${on}: la columna ${columna} no és cap component`);
  }
  if (ruta.Esquerra !== undefined && !esComponent(ruta.Esquerra)) errors.push(`${on}: la columna Esquerra no és cap component`);
  if (ruta.estret !== undefined && !PANELLS_ESTRET.includes(ruta.estret)) {
    errors.push(`${on}: estret ha de ser ${PANELLS_ESTRET.join(', ')}`);
  }
  if (ruta.estret === 'esquerra' && ruta.Esquerra === undefined) errors.push(`${on}: estret 'esquerra' sense columna Esquerra`);
  return errors;
}

/**
 * Valida la taula de rutes internes d'una app:
 *   [{ path: 'taules', … }, { path: 'taules/:taulaId', params: { taulaId: esIdOpac } }]
 * Camins relatius, en minúscules, trams slug o ':param', sense comodins ni
 * repetits; cada paràmetre amb el seu validador i cap validador sobrant.
 * Amb `{ columnes: true }` (la taula de ClosaAplicacio), cada ruta porta a més
 * les seues columnes: Mig i Detall (components), Esquerra opcional i
 * `estret` opcional ('esquerra' | 'mig' | 'detall').
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validaRutes(rutes, { columnes = false } = {}) {
  const errors = [];
  if (!Array.isArray(rutes) || rutes.length === 0) return { ok: false, errors: ['cal una llista de rutes'] };
  const formes = new Set();
  rutes.forEach((ruta, i) => {
    const on = `rutes[${i}]`;
    if (!ruta || typeof ruta.path !== 'string' || ruta.path === '') { errors.push(`${on}: path buit`); return; }
    if (ruta.path.startsWith('/') || ruta.path.endsWith('/')) { errors.push(`${on}: el path és relatiu i sense barres als extrems`); return; }
    const trams = ruta.path.split('/');
    const parametres = [];
    for (const tram of trams) {
      const parametre = tram.match(PATRO_PARAMETRE);
      if (parametre) parametres.push(parametre[1]);
      else if (!esSlug(tram)) errors.push(`${on}: tram «${tram}» no és un slug ni un :paràmetre`);
    }
    if (new Set(parametres).size !== parametres.length) errors.push(`${on}: paràmetre repetit`);
    const validadors = ruta.params || {};
    for (const nom of parametres) {
      if (!validadorPropi(validadors, nom)) errors.push(`${on}: el paràmetre «${nom}» no té validador`);
    }
    for (const nom of Object.keys(validadors)) {
      if (!parametres.includes(nom)) errors.push(`${on}: validador sobrant «${nom}»`);
    }
    const forma = trams.map((tram) => (PATRO_PARAMETRE.test(tram) ? ':' : tram)).join('/');
    if (formes.has(forma)) errors.push(`${on}: ruta repetida «${ruta.path}»`);
    formes.add(forma);
    if (columnes) errors.push(...errorsDeColumnes(ruta, on));
  });
  return { ok: errors.length === 0, errors };
}

/**
 * La primera ruta de la taula que casa amb la `resta` (el camí dins de l'app,
 * p. ex. 'taules/t-3') i els seus paràmetres, ja validats. null si cap casa o
 * si un paràmetre no passa el seu validador.
 */
export function coincidixRuta(rutes, resta) {
  const trams = tramsSegurs(resta);
  if (!trams || !Array.isArray(rutes)) return null;
  for (const ruta of rutes) {
    const patro = ruta.path.split('/');
    if (patro.length !== trams.length) continue;
    const params = {};
    let casa = true;
    for (let i = 0; i < patro.length && casa; i += 1) {
      const parametre = patro[i].match(PATRO_PARAMETRE);
      if (parametre) {
        const validador = validadorPropi(ruta.params, parametre[1]);
        if (validador && validador(trams[i])) params[parametre[1]] = trams[i];
        else casa = false;
      } else if (patro[i] !== trams[i]) {
        casa = false;
      }
    }
    if (casa) return Object.freeze({ ruta, params: Object.freeze(params) });
  }
  return null;
}

/** El camí dins de l'app actual: '/app/bar/taules/t-3' → 'taules/t-3'. */
export function restaDeApp(pathname) {
  const trams = String(pathname || '').split('/');
  if (trams[1] !== 'app' || !trams[2]) return '';
  return trams.slice(3).join('/');
}

/** La ruta interna que casa amb la URL actual (coincidixRuta), o null. */
export function useRutaApp(rutes) {
  const { pathname } = useLocation();
  return useMemo(() => coincidixRuta(rutes, restaDeApp(pathname)), [rutes, pathname]);
}

/**
 * Paràmetres de consulta tipats. `validadors`: { nom: validador }. Només es
 * llegixen i s'escriuen els paràmetres declarats, i només amb un valor que
 * passa el seu validador; la resta de la consulta es conserva tal qual.
 * Escriure fa PUSH (opcions.replace per a una canonització).
 * @returns {[Record<string, string|null>, (canvis: object, opcions?: { replace?: boolean }) => boolean]}
 */
export function useParametresConsulta(validadors) {
  const { currentPath, searchParams, navigate } = useRouter();
  const consulta = searchParams.toString();

  const valors = useMemo(() => {
    const llegits = new URLSearchParams(consulta);
    const resultat = {};
    for (const [nom, valida] of Object.entries(validadors || {})) {
      const valor = llegits.get(nom);
      resultat[nom] = valor !== null && typeof valida === 'function' && valida(valor) ? valor : null;
    }
    return Object.freeze(resultat);
  }, [consulta, validadors]);

  const posa = useCallback((canvis, opcions = {}) => {
    if (currentPath === null || !canvis || typeof canvis !== 'object') return false;
    const nous = new URLSearchParams(consulta);
    for (const [nom, valor] of Object.entries(canvis)) {
      const valida = validadorPropi(validadors, nom);
      if (!valida) return false;
      if (valor === null || valor === undefined || valor === '') nous.delete(nom);
      else if (valida(String(valor))) nous.set(nom, String(valor));
      else return false;
    }
    const text = nous.toString();
    navigate(text ? `${currentPath}?${text}` : currentPath, { replace: opcions.replace === true });
    return true;
  }, [currentPath, consulta, navigate, validadors]);

  return [valors, posa];
}
