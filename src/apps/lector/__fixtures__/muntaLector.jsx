/* Suport de proves del Lector de notícies: l'app registrada dins de la
   plataforma de veres, amb la llavor sintètica, un «ara» fix i el magatzem
   sobre el navegador fals de P2. Cap fitxer de producció l'importa. */
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppLector from '../AppLector.jsx';
import { creaFontNoticies } from '../fontNoticies.js';
import { creaAdaptadorLlavor } from '../llavor/fontLlavor.js';
import { creaMagatzemLector } from '../magatzem.js';
import manifestLector from '../manifest.js';
import { msDeData } from '../nucli/index.js';

export const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
export const ARA = msDeData('2026-10-03T10:30:00Z');

/* Els magatzems oberts, per a tancar-los després de cada prova. */
export const tancats = [];

export function prepara({ adaptador = null, sensebase = false } = {}) {
  const idb = creaIdbFals();
  const magatzem = sensebase
    ? creaMagatzemLector({ idb: null, navegador: {}, Canal: null })
    : creaMagatzemLector({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  tancats.push(magatzem);
  const font = creaFontNoticies(adaptador || creaAdaptadorLlavor({ ara: ARA }));
  const App = () => <AppLector magatzem={magatzem} font={font} ara={() => ARA} />;
  const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] });
  return { idb, magatzem, font, registre };
}

export function munta(url, entorn = prepara()) {
  muntaPlataforma(url, { registre: entorn.registre, entorn: ENTORN });
  return entorn;
}
