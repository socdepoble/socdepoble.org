/**
 * Lector de notícies · la columna ESQUERRA: les carpetes (com la navegació
 * de Feedly). «Hui», «Per a després» i les categories del poble, cada una
 * amb el comptador de no llegides (de desades, a «Per a després»).
 *
 * Cada carpeta és un enllaç de veres. En estret, una categoria porta primer a
 * les seues fonts (/noticies/<cat>/fonts); «Hui» i «Per a després», directes
 * a les notícies. Cap classe pròpia: MarcColumna, AppGridColumn i
 * TargetesColleccions de Pedra Seca.
 *
 * Quan la columna és un panell superposat (en mitjana, i en estret si s'ha
 * obert damunt d'una altra columna), les eines porten «Torna», que el tanca
 * sense navegar: el patró de salut/vistes/comunes.jsx. En estret a
 * /noticies les carpetes SÓN la pàgina: no hi ha res a què tornar.
 */
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Boto, MarcColumna } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { CARPETES_FIXES, DESPRES, HUI, comptadorsCarpetes } from '../nucli/index.js';
import { AvisLector, NavTargetes } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { NOM_CARPETA_FIXA, NOTICIES, TRAM_FONTS, useSeleccio } from './navegacio.js';

const textNoLlegides = (n) => (n > 0 ? 'sense llegir' : 'tot llegit');

export function ColumnaCarpetes({ params }) {
  const { lector, noticies, ara, ruta } = useVistaLector();
  const { mida, tancaPanells } = useClosaAplicacio();
  const { carpeta } = useSeleccio(params);
  const comptes = comptadorsCarpetes({ ...noticies, estat: lector.estat, ara });
  const n = (id) => comptes.get(id) || 0;
  const carpetes = [
    { id: HUI, nom: NOM_CARPETA_FIXA[HUI], comptador: n(HUI), secundari: textNoLlegides(n(HUI)) },
    { id: DESPRES, nom: NOM_CARPETA_FIXA[DESPRES], comptador: n(DESPRES), secundari: n(DESPRES) === 1 ? 'desada' : 'desades' },
    ...noticies.categories.map((categoria) => ({
      id: categoria.id, nom: categoria.nom, comptador: n(categoria.id), secundari: textNoLlegides(n(categoria.id))
    }))
  ];
  const camiDe = (element) => (mida === 'estret' && !CARPETES_FIXES.includes(element.id)
    ? ruta(NOTICIES, element.id, TRAM_FONTS)
    : ruta(NOTICIES, element.id));
  const superposada = mida === 'mitja' || (mida === 'estret' && Boolean(params?.carpeta));
  const eines = superposada ? <Boto varietat="secundari" onClick={tancaPanells}>Torna</Boto> : null;
  return (
    <MarcColumna capcalera={<AppGridColumn titol="Carpetes" />} eines={eines} peu={<AvisLector />} etiqueta="Carpetes">
      <NavTargetes elements={carpetes} etiqueta="Carpetes" actiu={carpeta} camiDe={camiDe} />
    </MarcColumna>
  );
}
