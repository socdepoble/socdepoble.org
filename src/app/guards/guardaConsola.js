// src/app/guards/guardaConsola.js
/**
 * Decidix si /consola/* passa per la barrera de superadmin.
 *
 * La Consola no parla amb Supabase: llig /__iaia/consola.json i
 * /__iaia/mapa.json, que només servix el middleware de desenvolupament
 * (tooling/vite/consola-iaia.mjs, `apply: 'serve'` i només des de localhost).
 * A `vite serve` no hi ha cap backend que puga donar el rol superadmin, i la
 * guarda deixava el Mestre fora per sempre. En qualsevol build (web o plugin
 * de WordPress) DEV és false i la barrera de client es manté com abans.
 *
 * Rep el valor en lloc de llegir import.meta.env: així les dues branques es
 * proven (a vitest DEV sempre és true). Només un true literal obri; qualsevol
 * altra cosa tanca.
 *
 * @param {unknown} dev  import.meta.env.DEV de qui crida.
 * @returns {boolean} true si cal RequireAuth rol="superadmin".
 */
export function consolaDemanaSessio(dev) {
  return dev !== true;
}
