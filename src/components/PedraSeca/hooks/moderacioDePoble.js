/**
 * moderacioDePoble.js — Fase D (261020, tasca 2; pla 261020_1300 · App Store
 * 1.2 i Google Play UGC) · La moderació del poble (denunciar, bloquejar i les
 * normes de convivència) es resol UNA sola vegada per a tota l'app: ho fa
 * ProveidorModeracio (app/contexts/ModeracioContext.jsx), muntat una vegada a
 * App.jsx, i ací només hi ha el context i la seua lectura, com
 * xatSocDePoble.js. Esta peça no importa res de sections/ ni de data/: la
 * llegixen useAccions (Pedra Seca), MurContext, XatContext i la interfície.
 *
 * El valor (memoritzat; l'estat dels diàlegs en queda fora, perquè obrir-ne
 * un no torne a pintar cap targeta):
 *  · disponible · cert si el backend té la capacitat 'moderacio'. Sense ella,
 *    cap targeta ni bombolla no pinta «Més opcions».
 *  · potBloquejar · disponible i se sap qui mira (sessió, o el convidat en
 *    llavor i en local): un visitant del remot només denuncia.
 *  · estatBloquejos · 'carregant' | 'llest' | 'error'; codiErrorBloquejos, el
 *    `code` de CODI_MODERACIO de l'error (o null).
 *  · bloquejats · Bloqueig[] ({ tipus, id, nom, creatAl }), del més nou al
 *    més vell, amb la capa optimista de la sessió.
 *  · esPersonaBloquejada(id) · esElementBloquejat(item) · estables mentre el
 *    conjunt no canvia (una renovació del JWT no els canvia la identitat).
 *  · objectiuDeTargeta(objecte) · objectiuDeMissatge(m, fil) ·
 *    objectiuDeContrapart(fil) · l'Objectiu (config/moderacio.js) o null.
 *  · demanaDenuncia(objectiu, obridor?) · demanaBloqueig(objectiu, obridor?) ·
 *    obrin el diàleg; `obridor` és l'element que rep el focus en tancar-lo.
 *  · desbloqueja(autor) → Promise · desbloqueja { tipus, id, nom? }; si
 *    falla, rebutja amb el `code` (i la llista torna a com era).
 *  · normesPendents · cert si cal acceptar les normes abans de publicar.
 *  · asseguraNormes() → Promise<boolean> · true si ja estan acceptades (o la
 *    porta no s'aplica: llavor, local, sense sessió); si no, obri el diàleg i
 *    resol amb la tria. Estable: es pot posar a les dependències d'un memo.
 *    asseguraNormes({ rebutjades: true }) (integració 261024, Codex C-02): el
 *    servidor ha rebutjat per les normes (SDP-MOD-428); s'oblida el record i
 *    es torna a preguntar (false si la porta no s'aplica). Qui l'ha rebut
 *    reintenta UNA sola vegada.
 *
 * Sense proveïdor (una peça muntada sola, un espècimen del catàleg, una
 * prova) useModeracio torna null: cap targeta, bombolla ni editor no canvia.
 */
import { createContext, useContext } from 'react';

/** null sense proveïdor. */
export const ModeracioContext = createContext(null);

/** El valor de ProveidorModeracio, o null sense proveïdor. */
export function useModeracio() {
  return useContext(ModeracioContext);
}
