/** Adaptador pur de la llista de botiga de poble (compatible amb llistes antigues desades). */
import { CODIS_IDIOMA_NEVERA, textosVistaNevera } from './i18nNevera.js';

/* v1.2.19 · Gauntlet R1 (L3-02) · El nom amb què es crea la llista de botiga és
   canònic i no depén de la llengua; es tradueix només en pintar-lo
   (nomLlistaVisible). El conjunt accepta també les cinc traduccions de
   botigaDePoble, el nom de les llistes creades fora del valencià fins ara. */
export const NOM_LLISTA_BOTIGA = 'Botiga de poble';
const clauNomLlista = (nom) => nom.trim().toLocaleLowerCase('ca');
const NOMS_LLISTA_BOTIGA = new Set([
  'botiga de poble', 'catàleg de botiga', 'mercadona',
  ...CODIS_IDIOMA_NEVERA.map((codi) => clauNomLlista(textosVistaNevera(codi).botigaDePoble))
]);
const esNomLlistaBotiga = (nom) => typeof nom === 'string' && NOMS_LLISTA_BOTIGA.has(clauNomLlista(nom));

export const esLlistaMercadona = (llista) => esNomLlistaBotiga(llista?.nom);

export const nomLlistaVisible = (nom, idioma = 'ca') => (
  esNomLlistaBotiga(nom) ? textosVistaNevera(idioma).botigaDePoble : nom
);

const preuText = (valor) => (valor === 0 ? 0 : valor).toFixed(2).replace('.', ',');

export function ambPreusMercadona(articles, productes) {
  if (!Array.isArray(articles)) return [];
  const perId = new Map((Array.isArray(productes) ? productes : []).filter((p) => p?.id).map((p) => [p.id, p]));
  return articles.map((article) => {
    const producte = article ? perId.get(article.id) : null;
    if (!producte || !Number.isFinite(producte.preuEnvas) || !Number.isFinite(producte.preuUnitari)) return article;
    return {
      ...article,
      valor: `${preuText(producte.preuEnvas)} € · ${preuText(producte.preuUnitari)} €/${producte.unitatPreuUnitari}`
    };
  });
}
