/* Les dues entrades d'ajuda de «Nova conversa». Els identificadors operatius
   sempre venen del port: una entrada absent no es convertix en un compte.
   Ordre del Mestre (261007) · La font és AJUDA (data/xatsPerDefecte.js), la
   mateixa de les files per defecte del xat i del xat de mostra
   (FakeChatOnboarding): un sol lloc per al nom, el tipus i la cara de «Sóc
   de Poble» i de la «IAIA MarIA». Derogada la llista pròpia CONTACTES_AJUDA,
   que en repetia el nom i el tipus. */
import { AJUDA, esLaIdentitatDAjuda } from '../../data/xatsPerDefecte.js';

/* Primer per id o per slug declarat (doctrina de T6: mai pel nom) i, si no,
   pel nom visible. El nom no es pot retirar encara: en remot el padró
   (membres_del_poble) no porta el slug i l'entitat és un uuid que el
   frontend no coneix, de manera que només el nom la reconeix. */
export function contactesDAjuda(membres) {
  return AJUDA.map(({ clau, nom, tipus }) =>
    membres.find(m => m.tipus === tipus && esLaIdentitatDAjuda(m, clau))
    || membres.find(m => m.nom === nom && m.tipus === tipus)
    || { nom, tipus, usuari_id: `ajuda:${tipus}`, noDisponible: true });
}
