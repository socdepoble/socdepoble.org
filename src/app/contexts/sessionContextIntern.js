/* P1-71 / §T-06 · Estat intern de la sessió fora del cicle de Fast Refresh.
   Sense dependències del projecte: quan Vite reavalua NotesContext.jsx,
   GlobalSaveManager.js, SessionContext.jsx o sessionService.js durant HMR,
   totes les instàncies comparteixen el mateix estat resolt ('dins' o 'fora')
   i el mateix registre d'oients i propietaris, evitant que l'aplicació quede
   encallada en «Comprovant la sessió…». */

export const EMPTY_SESSION_CONFIG = Object.freeze({});

export const ESTAT_SESSIO = Object.freeze({
  COMPROVANT: 'comprovant',
  DINS: 'dins',
  FORA: 'fora',
});

export const estatSessioIntern = {
  generacio: 0,
  roleRequest: 0,
  configRequest: 0,
  temporitzador: null,
  renovacio: null,
  intents: 0,
  recuperacioGastada: false,
  epoch: null,
  currentConfig: EMPTY_SESSION_CONFIG,
  configKey: '',
  owners: new Map(),
  defaultOwner: Symbol('sessio'),
  listeners: new Set(),
  oientsFinestraArmats: false,
  sincronitzaActual: null,
  alDespertarActual: null,
  tornaAProvarActual: null,
  enStorageActual: null,
  estatActual: {
    usuari: null,
    estat: ESTAT_SESSIO.COMPROVANT,
    rol: null,
    generacio: 0,
    nivell: null,
  },
};
