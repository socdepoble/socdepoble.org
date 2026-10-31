/**
 * enquadramentsAvatar.js — Els noms de la variant `enquadrament` d'Avatar.
 *
 * Una dada, no un component: viu fora d'Avatar.jsx perquè el catàleg
 * (tractor-cataleg, C1) llig com a component tot export en majúscula d'un .jsx
 * de PedraSeca, i perquè un .jsx que exporta valors no és frontera de Fast
 * Refresh (P1-71). Avatar.jsx encara exporta toDeLlavor, una funció pura.
 *
 * Els enquadraments que té el full d'estils (modules.css,
 * .sdp-avatar--enquadrat-*): 'iaia', la cara de la IAIA a «Festa del Poble».
 */
export const ENQUADRAMENTS_AVATAR = Object.freeze(['iaia']);
