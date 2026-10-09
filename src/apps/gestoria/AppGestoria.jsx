/**
 * Gestoria de Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/gestoria/*, només si el manifest la compila).
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): dins de la Wiki, la Gestoria muntava una segona closca
 * sencera al detall d'un document i el seu menú es barrejava amb el de la
 * Wiki. Ara és una app pròpia: BarraApp conté tot el menú i la ruta tria
 * el mòdul de ShellGestoria. La closca es conserva entre els seus mòduls i només
 * porta contingut central, boina personal i PaginaApp, sense rail interior.
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
 *
 * EL PONT · Este fitxer és l'ÚNIC de src/apps que importa codi de
 * src/sections/gestoria: una excepció escrita i provada a la llista blanca de
 * plataforma/fronteres.test.js, amb les importacions dinàmiques de VISTES
 * (la closca, Aprendre i, des del 261007, la Facturació) i cap altra.
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
import { useApp, lazyRoute } from '../plataforma/index.js';
import { ENTRADA_APRENDRE, ENTRADA_FACTURACIO, desviamentDeLaConsulta } from './rutes.js';

const VISTES = import.meta.env.DEV ? Object.freeze({
  tauler: lazyRoute(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx')),
  aprendre: lazyRoute(() => import('../../sections/gestoria/aprendre/Aprendre.jsx')),
  facturacio: lazyRoute(() => import('../../sections/gestoria/facturar/Facturacio.jsx')),
  historic: lazyRoute(() => import('../../sections/gestoria/historic/Historic.jsx'))
}) : null;

/* Onada 6, ordre del Mestre (261009): «Històric i IA» entra pel pont, com la
   Facturació, i porta la seua pròpia PaginaApp (la boina amb l'ull de
   privacitat). */
const ENTRADA_HISTORIC = 'historic';

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
  const { pathname, search } = useLocation();
  const desti = desviamentDeLaConsulta(search);
  if (desti) return <Navigate to={desti} replace />;
  if (!VISTES) {
    return <EstatBuit titol="La Gestoria no és en este paquet">Només es pot provar al servidor de desenvolupament.</EstatBuit>;
  }

  /* El primer tram després de /app/gestoria: RutaApps ja ha comprovat que és una entrada del manifest. */
  const entrada = pathname.slice(base.length + 1).split('/')[0];
  if (entrada === ENTRADA_APRENDRE) {
    const Aprendre = VISTES.aprendre;
    return (
      <PaginaApp title="Aprendre" subtitle="Repàs espaiat dels conceptes de la gestoria" labels={ETIQUETES_APRENDRE}
        showComment={false} showShare={false} showConnect={false}>
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
        showComment={false} showShare={false} showConnect={false}>
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
        <Historic />
      </Suspense>
    );
  }
  const Closca = VISTES.tauler;
  return (
    <Suspense fallback={<Carregant etiqueta="Carregant la Gestoria…" />}>
      <Closca modulActiu={entrada} mostrarRail={false} />
    </Suspense>
  );
}
