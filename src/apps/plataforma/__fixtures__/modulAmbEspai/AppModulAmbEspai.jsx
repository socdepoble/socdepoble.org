/* Suport de proves: l'app que modulDeBuild.test.jsx compila com a mòdul per
   a provar la porta 'workspace' del nucli 1.2.0 (261016). Pren l'espai de
   treball per la seua façana, la mateixa que importa el Lector des del
   Gauntlet 261016 (vistes/Noticies.jsx, només UniversalWorkspace), i fa
   servir els dos noms de la porta: amb un model, munta l'espai sencer amb la
   targeta per defecte a cada fila; sense, pinta la targeta d'un element, que
   la prova compara amb la de la pàgina. És l'única que importa DefaultItemCard
   per la porta (guardesDelModul.test.js, §6). */
import { DefaultItemCard, UniversalWorkspace } from '../../../../components/universal/workspace/index.js';

const ELEMENT = Object.freeze({ id: 'pou-del-raval', title: 'Pou del Raval', subtitle: 'Notícia de prova' });
const triaRes = () => {};

export default function AppModulAmbEspai({ model = null }) {
  if (model) return <UniversalWorkspace model={model} renderItem={(fila) => <DefaultItemCard {...fila} />} />;
  return <DefaultItemCard item={ELEMENT} active={false} onSelect={triaRes} />;
}
