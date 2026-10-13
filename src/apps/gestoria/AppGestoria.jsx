/**
 * Gestoria de Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/gestoria/*, només si el manifest la compila).
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): dins de la Wiki, la Gestoria muntava una segona closca
 * sencera al detall d'un document i el seu menú es barrejava amb el de la
 * Wiki. Ara és una app pròpia: la ruta tria el mòdul de ShellGestoria. La
 * closca es conserva entre els seus mòduls i porta contingut central, boina
 * personal i PaginaApp.
 *   · La navegació és només la BarraApp global, amb els grups del manifest
 *     (ordre de MarIA 261012_2145, acatada pel Mestre, que revoca el «rail
 *     intern» del Panell ERP): la closca no pinta cap menú i rep només el
 *     mòdul de la ruta.
 *   · El titular (petició 261012_2148) · sense sessió, la closca rep
 *     `hrefEntrada`: l'entrada al compte del pont de sessió (useSessioApp),
 *     amb la tornada al Tauler, perquè en entrar s'hi aterre (rutaEntrada.js,
 *     aterratgeDespresDEntrar). «El pont no passa cap dada de la persona»
 *     (261012_2148): Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla
 *     261013_1405, front B: «la boina taronja de TOTES les pàgines de la
 *     Gestoria porta el titular real autenticat, amb el seu avatar, i mai
 *     Sóc de Poble amb el logotip a la Facturació»). Amb sessió, el pont passa
 *     `titular` (useSessioApp().titular: { nom, avatar, poble } i res més,
 *     perquè el manifest declara permisos.titular 'sessio') a la closca, a
 *     l'Històric i a la Finestreta, i signa amb ell les PaginaApp d'Aprendre
 *     i de la Facturació (enllaçat al perfil). Sense sessió, la boina diu
 *     «Titular sense configurar», amb l'entrada al compte que torna al Tauler.
 *     Totes les pàgines del pont porten el rellotge viu (rellotgeViu) a
 *     l'extrem dret de la barra taronja.
 *   · /app/gestoria/aprendre · Aprendre, el repàs espaiat, dins d'una
 *     PaginaApp (la porta de pàgina permesa a les apps).
 *   · /app/gestoria/facturacio · ordre del Mestre, 261007 («tindre la
 *     facturació operativa inclús sense xarxa»): la pantalla de Facturació
 *     (sections/gestoria/facturar), també dins d'una PaginaApp. Arriba pel
 *     pont i no per la closca: ShellGestoria és font del tractor
 *     gestoria.tauler, i tocar-la en tornaria l'aprovació a «pendent».
 *     Com Aprendre, anar-hi desmunta la closca (la lectura dels bancs, que
 *     viu en memòria, s'ha de tornar a fer en tornar al Tauler).
 *   · /app/gestoria/historic · Onada 6, ordre del Mestre (261009): l'històric
 *     del banc, la despesa en IA, les simulacions i el llibre per a la
 *     gestora (sections/gestoria/historic), amb el seu tractor propi
 *     ('gestoria.historic'). També pel pont i amb la seua PaginaApp.
 *   · /app/gestoria/identitat · ordre del Mestre, 13-10-2026 (pla
 *     261013_1405, front H): «Identitat i Finestreta», la fitxa d'identitat
 *     privada (darrere del cofre, com l'Històric) i els tràmits preparats per
 *     a copiar (sections/gestoria/finestreta), amb el seu tractor propi
 *     ('gestoria.identitat') i la seua PaginaApp. També pel pont. La closca
 *     en rep només la ruta (`hrefIdentitat`): l'Escàner hi envia la persona.
 *
 * EL PONT · Este fitxer és l'ÚNIC de src/apps que importa codi de
 * src/sections/gestoria: una excepció escrita i provada a la llista blanca de
 * plataforma/fronteres.test.js, amb les importacions dinàmiques de VISTES
 * (la closca, Aprendre, des del 261007 la Facturació, des del 261009
 * l'Històric i des del 13-10-2026 la Finestreta) i cap altra.
 * VISTES és null fora de desenvolupament: Vite reemplaça
 * el literal i en trau les importacions del build, també si algú compilara
 * l'app en producció (gestoria/privacitat.test.js ho compila). El codi de la
 * Gestoria el continua vigilant la seua guarda de privacitat.
 *
 * LA PORTA DELS TRACTORS · rutes.js: la consulta que la demana es porta a la
 * Wiki, on viu, sempre a la mateixa ruta fixa.
 */
import { Suspense } from 'react';
import { Navigate, useLocation } from '../../app/contexts/RouterContext';
import { Carregant, EstatBuit, PaginaApp } from '../../components/PedraSeca/index.js';
import { useApp, useSessioApp, lazyRoute } from '../plataforma/index.js';
import { ENTRADA_APRENDRE, ENTRADA_FACTURACIO, ENTRADA_IDENTITAT, desviamentDeLaConsulta } from './rutes.js';

const VISTES = import.meta.env.DEV ? Object.freeze({
  tauler: lazyRoute(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx')),
  aprendre: lazyRoute(() => import('../../sections/gestoria/aprendre/Aprendre.jsx')),
  facturacio: lazyRoute(() => import('../../sections/gestoria/facturar/Facturacio.jsx')),
  historic: lazyRoute(() => import('../../sections/gestoria/historic/Historic.jsx')),
  identitat: lazyRoute(() => import('../../sections/gestoria/finestreta/Finestreta.jsx'))
}) : null;

/* Onada 6, ordre del Mestre (261009): «Històric i IA» entra pel pont, com la
   Facturació, i porta la seua pròpia PaginaApp (la boina amb l'ull de
   privacitat). */
const ENTRADA_HISTORIC = 'historic';

/*
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · La boina de les
 * pàgines que pinta el pont (Aprendre i la Facturació). El pont no pot
 * importar res de la Gestoria fora de VISTES: estes dues constants són les
 * mateixes de la closca (ShellGestoria.jsx, RUTA_TITULAR i
 * TITULAR_SENSE_CONFIGURAR), i AppGestoria.test.jsx ho comprova.
 */
/** La pàgina del titular amb sessió: el seu perfil. */
export const RUTA_TITULAR = '/el-meu-perfil';
/** El nom de la boina sense sessió: l'estat honest, mai una autora fingida. */
export const TITULAR_SENSE_CONFIGURAR = 'Titular sense configurar';

/**
 * L'autor de les PaginaApp del pont: el titular de la sessió, enllaçat al
 * seu perfil; sense, l'estat honest amb l'entrada al compte.
 * @param {{ nom: string, avatar: string|null, poble: string }|null} titular el de useSessioApp
 * @param {string} entrada la ruta d'entrada al compte (entradaAlTauler)
 * @returns {{ nom: string, avatar: string|null, poble: string, href: string }}
 */
export function autorDelPont(titular, entrada) {
  return titular
    ? { ...titular, href: RUTA_TITULAR }
    : { nom: TITULAR_SENSE_CONFIGURAR, poble: '', avatar: null, href: entrada };
}

/**
 * L'entrada al compte del pont de sessió, amb la tornada canviada pel Tauler:
 * entre des del mòdul que entre, la persona aterra al Tauler (petició del
 * Mestre via MarIA, 261012_2148). La resta de la consulta no es toca.
 * @param {string} rutaEntrada la de useSessioApp (/registre?mode=entrar&tornar=…)
 * @param {string} tauler la ruta del Tauler de l'app
 * @returns {string}
 */
export function entradaAlTauler(rutaEntrada, tauler) {
  const [cami, consulta = ''] = String(rutaEntrada).split('?');
  const params = new URLSearchParams(consulta);
  params.set('tornar', tauler);
  return `${cami}?${params.toString()}`;
}

const ETIQUETES_APRENDRE = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'Aprendre', className: 'sdp-badge-category' })
]);
const ETIQUETES_FACTURACIO = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'Facturació', className: 'sdp-badge-category' })
]);

export default function AppGestoria() {
  const { base } = useApp();
  const sessio = useSessioApp();
  const { pathname, search } = useLocation();
  const desti = desviamentDeLaConsulta(search);
  if (desti) return <Navigate to={desti} replace />;
  if (!VISTES) {
    return <EstatBuit titol="La Gestoria no és en este paquet">Només es pot provar al servidor de desenvolupament.</EstatBuit>;
  }

  /* El primer tram després de /app/gestoria: RutaApps ja ha comprovat que és una entrada del manifest. */
  const entrada = pathname.slice(base.length + 1).split('/')[0];
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el titular de la
     sessió (null sense sessió). Amb titular, la boina enllaça al perfil i no
     a l'entrada al compte. */
  const titular = sessio.titular ?? null;
  const entradaAlCompte = entradaAlTauler(sessio.rutaEntrada, `${base}/tauler`);
  const autor = autorDelPont(titular, entradaAlCompte);
  if (entrada === ENTRADA_APRENDRE) {
    const Aprendre = VISTES.aprendre;
    return (
      <PaginaApp title="Aprendre" subtitle="Repàs espaiat dels conceptes de la gestoria" labels={ETIQUETES_APRENDRE}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <Suspense fallback={<Carregant etiqueta="Carregant Aprendre…" />}>
          <Aprendre />
        </Suspense>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_FACTURACIO) {
    const Facturacio = VISTES.facturacio;
    return (
      <PaginaApp title="Facturació" subtitle="Factures i llibre Veri*Factu, també sense connexió" labels={ETIQUETES_FACTURACIO}
        author={autor} rellotgeViu showComment={false} showShare={false} showConnect={false}>
        <Suspense fallback={<Carregant etiqueta="Carregant la Facturació…" />}>
          <Facturacio />
        </Suspense>
      </PaginaApp>
    );
  }
  if (entrada === ENTRADA_HISTORIC) {
    const Historic = VISTES.historic;
    return (
      <Suspense fallback={<Carregant etiqueta="Carregant l’Històric…" />}>
        <Historic titular={titular} />
      </Suspense>
    );
  }
  if (entrada === ENTRADA_IDENTITAT) {
    const Finestreta = VISTES.identitat;
    return (
      <Suspense fallback={<Carregant etiqueta="Carregant Identitat i Finestreta…" />}>
        <Finestreta titular={titular} />
      </Suspense>
    );
  }
  const Closca = VISTES.tauler;
  return (
    <Suspense fallback={<Carregant etiqueta="Carregant la Gestoria…" />}>
      <Closca modulActiu={entrada} hrefEntrada={sessio.teSessio || titular ? null : entradaAlCompte}
        titular={titular} hrefIdentitat={`${base}/${ENTRADA_IDENTITAT}`} />
    </Suspense>
  );
}
