/* D-v128-2 · Cap on s'obri el menú «Opcions del missatge».
   El menú penja davall de la pestanya ⌄ de la bombolla. Amb l'últim missatge just damunt del
   compositor, davall no hi cap: la llista de missatges (overflow) el retalla i la meitat de les
   opcions queden amagades. Ordre de preferència:
   1. si davall hi cap, no es canvia res (el pintat de sempre);
   2. si damunt de la bombolla hi cap sencer, s'obri cap amunt (.sdp-xat-menu--amunt);
   3. si tampoc, puja el just perquè la vora de baix toque la franja visible (tapa la seua
      bombolla, com els menús contextuals del mòbil); si la franja és més baixa que el menú,
      comença dalt de la franja i el menú (ja té overflow-y: auto) es desplaça per dins. */

/** Decidix l'obertura amb mesures de maquetació, sense tocar el DOM.
 *  · ancoraDalt: vora de dalt del contenidor de la pestanya (la de la bombolla), en px de pantalla;
 *  · menuDalt i alcada: vora de dalt i alçada del menú obert cap avall (alçada de maquetació);
 *  · limitDalt i limitBaix: la franja visible (pantalla i contenidors que retallen);
 *  · separacio: l'aire entre el menú i la bombolla o la vora de la franja.
 *  Torna { amunt, dalt, sostre }: dalt és el top en px respecte del contenidor de la pestanya quan
 *  el menú s'ha de pujar (cas 3), i sostre l'alçada màxima en px quan no hi cap sencer. */
export function triaOberturaMenu({ ancoraDalt, menuDalt, alcada, limitDalt, limitBaix, separacio = 0 }) {
  const igual = { amunt: false, dalt: null, sostre: null };
  const xifres = [ancoraDalt, menuDalt, alcada, limitDalt, limitBaix, separacio];
  if (!xifres.every(Number.isFinite) || alcada <= 0 || limitBaix <= limitDalt) return igual;
  if (menuDalt + alcada <= limitBaix) return igual;
  if (ancoraDalt - separacio - alcada >= limitDalt) return { amunt: true, dalt: null, sostre: null };
  const franja = limitBaix - limitDalt - 2 * separacio;
  const daltPantalla = Math.max(limitDalt + separacio, limitBaix - separacio - alcada);
  return {
    amunt: false,
    dalt: Math.round(daltPantalla - ancoraDalt),
    sostre: alcada > franja ? Math.max(0, Math.floor(franja)) : null
  };
}

/** La franja vertical visible per a `node`: la pantalla retallada per cada avantpassat amb
 *  overflow-y diferent de visible (la llista de missatges, la conversa…). Travessa el shadow root
 *  de <soc-de-poble> cap a l'amfitrió. Sense finestra, null. */
export function limitsVisibles(node) {
  const vista = node?.ownerDocument?.defaultView;
  if (!vista) return null;
  let dalt = 0;
  let baix = vista.innerHeight;
  const pare = (el) => el.parentElement || el.getRootNode?.()?.host || null;
  for (let el = pare(node); el; el = pare(el)) {
    const desborda = vista.getComputedStyle(el).overflowY;
    if (!desborda || desborda === 'visible') continue;
    const caixa = el.getBoundingClientRect();
    dalt = Math.max(dalt, caixa.top);
    baix = Math.min(baix, caixa.bottom);
  }
  return { dalt, baix };
}
