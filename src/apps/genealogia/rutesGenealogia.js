/**
 * rutesGenealogia.js — la taula de rutes de l'Arbre Genealògic per a
 * ClosaAplicacio (l'esquelet comú de tres columnes de la plataforma):
 *   esquerra  PanellArbres, igual a totes (els arbres d'este dispositiu)
 *   mig       la llista o el progrés
 *   detall    el que s'ha triat
 * Paths relatius a /app/genealogia; el primer tram és una entrada del manifest.
 * Els paràmetres només són UUID (crypto.randomUUID) i ids coneguts del
 * catàleg d'arxius i de plantilles: mai noms, cognoms ni pobles.
 * `estret`: quina columna es veu primer en un mòbil.
 */
import { esUuid } from '../plataforma/index.js';
import { esArxiu, esPlantilla } from './arxius/index.js';
import { PanellArbres } from './vistes/comunes.jsx';
import { ProgresEntrevista, PreguntaEntrevista } from './vistes/Entrevista.jsx';
import { FitxaPersona, Inspector, LlistaAhnentafel } from './vistes/Arbre.jsx';
import { Colaterals, EditorPersona, LlistaPersones } from './vistes/Persones.jsx';
import { FitxaArxiu, GeneradorPrompt, LlistaArxius, LlistaPlantilles } from './vistes/Arxius.jsx';
import { AvisGenealogia, Exporta, Importa, MenuIntercanvi } from './vistes/Intercanvi.jsx';

const E = PanellArbres;

export const RUTES_GENEALOGIA = Object.freeze([
  { path: 'entrevista', Esquerra: E, Mig: ProgresEntrevista, Detall: PreguntaEntrevista, estret: 'detall' },
  { path: 'arbre', Esquerra: E, Mig: LlistaAhnentafel, Detall: Inspector },
  { path: 'arbre/inspector', Esquerra: E, Mig: LlistaAhnentafel, Detall: Inspector, estret: 'detall' },
  { path: 'arbre/:persona', params: { persona: esUuid }, Esquerra: E, Mig: LlistaAhnentafel, Detall: FitxaPersona, estret: 'detall' },
  { path: 'persones', Esquerra: E, Mig: LlistaPersones, Detall: EditorPersona },
  { path: 'persones/nova', Esquerra: E, Mig: LlistaPersones, Detall: EditorPersona, estret: 'detall' },
  { path: 'persones/:persona', params: { persona: esUuid }, Esquerra: E, Mig: LlistaPersones, Detall: EditorPersona, estret: 'detall' },
  { path: 'fan', Esquerra: E, Mig: LlistaPersones, Detall: Colaterals },
  { path: 'fan/:persona', params: { persona: esUuid }, Esquerra: E, Mig: LlistaPersones, Detall: Colaterals, estret: 'detall' },
  { path: 'arxius', Esquerra: E, Mig: LlistaArxius, Detall: FitxaArxiu },
  { path: 'arxius/:arxiu', params: { arxiu: esArxiu }, Esquerra: E, Mig: LlistaArxius, Detall: FitxaArxiu, estret: 'detall' },
  { path: 'prompts', Esquerra: E, Mig: LlistaPlantilles, Detall: GeneradorPrompt },
  { path: 'prompts/:plantilla', params: { plantilla: esPlantilla }, Esquerra: E, Mig: LlistaPlantilles, Detall: GeneradorPrompt, estret: 'detall' },
  { path: 'intercanvi', Esquerra: E, Mig: MenuIntercanvi, Detall: Exporta },
  { path: 'intercanvi/importa', Esquerra: E, Mig: MenuIntercanvi, Detall: Importa, estret: 'detall' },
  { path: 'avis', Esquerra: E, Mig: MenuIntercanvi, Detall: AvisGenealogia, estret: 'detall' }
]);
