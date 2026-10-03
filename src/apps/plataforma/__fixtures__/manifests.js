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
