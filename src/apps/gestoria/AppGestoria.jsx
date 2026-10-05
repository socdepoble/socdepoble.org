/**
 * Gestoria de Poble · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/gestoria/*, només si el manifest la compila).
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): dins de la Wiki, la Gestoria muntava una segona closca
 * sencera al detall d'un document i el seu menú es barrejava amb el de la
 * Wiki. Ara és una app pròpia: BarraApp conté tot el menú i la ruta tria
 * el mòdul de ShellGestoria. La closca es conserva entre mòduls i només
 * porta contingut central, boina personal i PaginaApp, sense rail interior.
 *   · /app/gestoria/aprendre · Aprendre, el repàs espaiat, dins d'una
 *     PaginaApp (la porta de pàgina permesa a les apps).
 *
 * EL PONT · Este fitxer és l'ÚNIC de src/apps que importa codi de
 * src/sections/gestoria: una excepció escrita i provada a la llista blanca de
 * plataforma/fronteres.test.js, amb les dues importacions dinàmiques de
 * VISTES i cap altra. VISTES és null fora de desenvolupament: Vite reemplaça
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
import { ENTRADA_APRENDRE, desviamentDeLaConsulta } from './rutes.js';

const VISTES = import.meta.env.DEV ? Object.freeze({
  tauler: lazyRoute(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx')),
  aprendre: lazyRoute(() => import('../../sections/gestoria/aprendre/Aprendre.jsx'))
}) : null;

const ETIQUETES_APRENDRE = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'Aprendre', className: 'sdp-badge-category' })
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
  const Closca = VISTES.tauler;
  return (
    <Suspense fallback={<Carregant etiqueta="Carregant la Gestoria…" />}>
      <Closca modulActiu={entrada} mostrarRail={false} />
    </Suspense>
  );
}
