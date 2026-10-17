/* Les dues entrades d'ajuda de «Nova conversa». Els identificadors operatius
   sempre venen del port: una entrada absent no es convertix en un compte.
   Ordre del Mestre (261007) · La font és AJUDA (data/xatsPerDefecte.js), la
   mateixa de les files per defecte del xat i del xat de mostra
   (FakeChatOnboarding): un sol lloc per al nom, el tipus i la cara de «Sóc
   de Poble» i de la «IAIA MarIA». Derogada la llista pròpia CONTACTES_AJUDA,
   que en repetia el nom i el tipus.
   Gauntlet 261016_1530 (Bloc 3.6.1; relleu F59) · Revisat: «Sóc de Poble» es
   queda ací. L'ordre retira la fila directa SINTÈTICA de la llista («Si més
   endavant es genera un xat privat persona-empresa, ja apareixerà»): triar
   l'entitat a «Nova conversa» és eixa via explícita, i el directe que naix
   és de veres. La llista ja no en porta cap per defecte. */
import { AJUDA, AJUDA_PER_CLAU, esLaIdentitatDAjuda } from '../../data/xatsPerDefecte.js';

/* Primer per id o per slug declarat (doctrina de T6: mai pel nom) i, si no,
   pel nom visible. El nom no es pot retirar encara: en remot el padró
   (membres_del_poble) no porta el slug i l'entitat és un uuid que el
   frontend no coneix, de manera que només el nom la reconeix.
   Onada 6 (tasca 12) · La IAIA que no és al padró porta igualment la seua
   cara (CaraXat la pinta retallada), i amb `senseIAIA` (el nivell d'IA a 0)
   no hi és. «Sóc de Poble» no canvia. */
export function contactesDAjuda(membres, { senseIAIA = false } = {}) {
  return AJUDA.filter(({ clau }) => !(senseIAIA && clau === 'iaia')).map(({ clau, nom, tipus, avatar }) =>
    membres.find(m => m.tipus === tipus && esLaIdentitatDAjuda(m, clau))
    || membres.find(m => m.nom === nom && m.tipus === tipus)
    || { nom, tipus, usuari_id: `ajuda:${tipus}`, noDisponible: true, ...(clau === 'iaia' ? { avatar_url: avatar } : {}) });
}

/** Onada 6 (tasca 12) · Cert si `membre` (una fila del padró) és la IAIA: per id o, com contactesDAjuda, pel nom del seu tipus. */
export function esContacteDeLaIAIA(membre) {
  if (!membre) return false;
  const { nom, tipus } = AJUDA_PER_CLAU.iaia;
  return esLaIdentitatDAjuda(membre, 'iaia') || (membre.tipus === tipus && membre.nom === nom);
}

/** El padró sense la IAIA; la mateixa referència si no hi era. */
export function senseContacteDeLaIAIA(membres) {
  if (!Array.isArray(membres) || !membres.some(esContacteDeLaIAIA)) return membres;
  return membres.filter((membre) => !esContacteDeLaIAIA(membre));
}
