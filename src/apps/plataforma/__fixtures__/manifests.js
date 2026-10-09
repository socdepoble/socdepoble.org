/* Suport de proves de la Plataforma d'Apps Enxufables: manifests sintètics.
   Cap fitxer de producció l'importa (qualitat.test.js ho vigila). */
import { ESQUEMA_APP } from '../manifestApp.js';

export function ComponentDeProva() {
  return null;
}

export const carregaDeProva = () => Promise.resolve({ default: ComponentDeProva });

/** Un manifest intern mínim i vàlid; `canvis` el retoca. */
export function manifestDeProva(canvis = {}) {
  return {
    schema: ESQUEMA_APP,
    id: 'prova',
    titol: { ca: 'La Prova', es: 'La Prueba' },
    icona: 'Puzzle',
    entrades: [
      { slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' },
      { slug: 'caixa', titol: { ca: 'Caixa' }, icona: 'Receipt' }
    ],
    entradaPerDefecte: 'inici',
    permisos: { veure: 'public' },
    capacitats: [],
    nivell: 'gratuit',
    actiuPerDefecte: true,
    entorn: 'produccio',
    dadesPersonals: false,
    carrega: carregaDeProva,
    ...canvis
  };
}

/** Un manifest extern mínim i vàlid (custom element, sense carrega). */
export function manifestExternDeProva(canvis = {}) {
  const base = manifestDeProva({ id: 'reserves', titol: { ca: 'Reserves' }, element: 'sollutia-reserves' });
  delete base.carrega;
  return { ...base, ...canvis };
}

/* Una integritat sintètica amb la forma de l'SRI sha384 (64 caràcters de base64). */
export const INTEGRITAT_DE_PROVA = `sha384-${'A'.repeat(63)}B`;

/** Un manifest de mòdul (sdp.modul.v1) mínim i vàlid: cos del mateix origen i nucli ^1. */
export function manifestModulDeProva(canvis = {}) {
  const base = manifestDeProva({
    id: 'llibreta',
    titol: { ca: 'La Llibreta' },
    cos: { cami: '/moduls/llibreta/cos-Ab12Cd34.js', integrity: INTEGRITAT_DE_PROVA },
    nucli: '^1'
  });
  delete base.carrega;
  return { ...base, ...canvis };
}
