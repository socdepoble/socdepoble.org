import { flushSync } from 'react-dom';

/* PS-01 (B7, marató 261101_2143) · La fosa entre vistes (View Transitions,
   modules.css «La Pedra Lliscant») la fa el router: RouterProvider.navigate amb
   { transicio: true }, i els Link/NavLink amb la prop `transicio`.
   El navegador fa la foto nova quan el callback torna. React 18 pinta
   l'actualització en una tasca posterior, i sense flushSync la foto nova era la
   vista vella: la fosa anava de la vella a ella mateixa i el canvi arribava de
   colp. Sense API o amb moviment reduït, s'actualitza i prou.
   Una transició tallada per una altra rebutja `ready` (InvalidStateError): és
   esperat i no ix a la consola. Els errors d'actualitzar continuen eixint per
   `finished` i `updateCallbackDone`.
   Límit conegut: amb una ruta mandrosa encara no baixada, la foto nova és el
   Suspense de reserva («Carregant»), no la vista vella. */
export function ambTransicioDeVista(actualitza, { doc = globalThis.document, finestra = globalThis.window } = {}) {
  const reduit = finestra?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  if (typeof doc?.startViewTransition !== 'function' || reduit) {
    actualitza();
    return null;
  }
  const transicio = doc.startViewTransition(() => { flushSync(actualitza); });
  transicio?.ready?.catch?.(() => {});
  return transicio;
}
