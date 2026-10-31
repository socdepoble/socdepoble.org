/* Gauntlet Loop 261029 (cicle 1, P1-71) · Els objectes de context dels
   proveïdors que embolcallen el Mas, en un mòdul que només importa React.

   Per què a part. A cada edició, Vite marca amb una marca de temps nova tots
   els ascendents del fitxer editat. Per imports, SessionContext.jsx,
   IdentitatContext.jsx i CoreContentContext.jsx són ascendents de quasi tota
   l'App (→ backendPort.js → host.js → PedraSecaEmbed.jsx → App.jsx): la
   frontera de React Refresh que es tornava a importar en portava una
   instància nova, amb un createContext nou. React Refresh posava el proveïdor
   nou a l'arbre muntat, i els consumidors que no s'havien tornat a executar
   (ProveidorModeracio, useScopedResource) llegien el context vell: «useSession
   ha de ser usat dins de SessionProvider» a l'ErrorBoundary de l'arrel, i el
   Mas sencer caigut fins a recarregar. Bastava afegir un comentari a
   GraellaAlbumLocal.jsx amb /multimedia obert.

   Este mòdul no importa res del projecte: cap edició de l'App el marca, i
   totes les instàncies d'un .jsx de context fan servir el mateix objecte.
   UIContext i RouterContext no són ascendents de l'App, però també
   embolcallen el Mas sencer. Hi són pel mateix motiu: en una càrrega nova
   amb l'arbre canviant, dos importadors poden demanar el mateix .jsx amb dues
   marques de temps (el pet «useUIState ha de ser usat dins de UIProvider» a
   AppShell).

   Només l'importa el .jsx de cada context, que hi conserva el proveïdor i els
   ganxos: cap API pública no canvia, i els dobles de les proves tampoc. La
   porta és objectesDeContext.test.jsx. En producció no hi ha HMR, i res no
   canvia. */
import { createContext } from 'react';

export const SessionContext = createContext(null);
export const IdentitatContext = createContext(null);
export const CoreContentContext = createContext(null);
export const UIContext = createContext(null);
export const UIActionsContext = createContext(null);
export const RouterContext = createContext();
export const RouterPrefixContext = createContext('');
export const RouteParamsContext = createContext({});
