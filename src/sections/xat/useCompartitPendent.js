/* 261026 (prompt 261026_1615, tasca 2) · El lot del menú «Compartir» del
   dispositiu (config/compartirNatiu.js), viu per a React. Sense router ni
   context: el llig «Envia a…» (XatSection) i el compositor (ControlsAdjunt). */
import { useSyncExternalStore } from 'react';
import { compartitPendent, subscriuCompartit } from '../../config/compartirNatiu.js';

export default function useCompartitPendent() {
  return useSyncExternalStore(subscriuCompartit, compartitPendent, compartitPendent);
}
