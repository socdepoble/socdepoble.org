/**
 * Lector de notícies · peces que fan servir diverses vistes. Cap classe
 * pròpia: tot és de Pedra Seca.
 *
 *   MarcaTotLlegit   «Marca-ho tot com a llegit» per a les notícies que es
 *                    veuen: el ✓ de la capçalera de la llista de Feedly (amb
 *                    una cerca, els resultats, i el text ho diu)
 *   AvisLector       el disc: només en memòria, una altra pestanya o un error
 *   AvisFonts        T5 (261024) · alguna de les fonts que se seguixen no ha
 *                    respost (però no totes: llavors és FontsSenseResposta.jsx)
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Les notícies són l'espai de
 * treball del Bloc (Noticies.jsx): l'obridor de la columna de les carpetes
 * (ObridorCarpetes) i les targetes de navegació de les carpetes i de les fonts
 * se'n van amb les columnes del 261004. L'arbre de l'espai porta els seus
 * obridors, i MarcaTotLlegit rep la llista que es veu (els ids), també la de
 * «Totes», que el nucli no té com a carpeta.
 * Ordre del Mestre (261024, 15:05) · «Sense targetes deformades»: NavTargetes
 * (les UniversalCard amb boina de «Les que seguixes») se'n va amb la pàgina de
 * fonts. Cap UniversalCard al Lector: les fonts són a l'arbre.
 */
import { CheckCheck } from 'lucide-react';
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { textosLector } from '../i18nLector.js';
import { seguix } from '../nucli/index.js';
import { useVistaLector } from './context.js';

/**
 * `ids`: les notícies que es veuen. Es marquen les que encara no s'han llegit.
 * `filtrat` (F2, 261016): si els ids són els resultats d'una cerca; el text ho diu («Marca com a
 * llegits els 3 resultats»). Sense, «Marca-ho tot com a llegit», el de sempre.
 */
export function MarcaTotLlegit({ ids, filtrat = false }) {
  const { lector, idioma = 'ca' } = useVistaLector();
  const tx = textosLector(idioma);
  const llegits = new Set(lector.estat.llegits);
  const llista = Array.isArray(ids) ? ids : [];
  const pendents = llista.filter((id) => !llegits.has(id));
  return (
    <Boto varietat="secundari" icona={CheckCheck} disabled={pendents.length === 0} onClick={() => lector.accions.marcaLlegits(pendents)}>
      {filtrat ? tx.textDelsResultats(llista.length) : tx.marcaTotLlegit}
    </Boto>
  );
}

export function AvisLector() {
  const { lector, idioma = 'ca' } = useVistaLector();
  const tx = textosLector(idioma);
  if (lector.mode === 'lectora') {
    return <Alerta to="avis" titol={tx.nomesMirarTitol}>{tx.nomesMirarLector}</Alerta>;
  }
  if (lector.error) {
    return <Alerta to="error" titol={tx.noShaPogutGuardarTitol}>{tx.noShaPogutGuardarText}</Alerta>;
  }
  if (!lector.persistent) {
    return <Alerta to="avis" titol={tx.nomesMemoriaTitol}>{tx.nomesMemoriaText}</Alerta>;
  }
  return null;
}

/* Interfície amb el servei (261024) · Ni una adreça que el servei no llig (no s'hi ha demanat res:
   correcció R5-08) ni una font teua mentre el servei no les llig no «han deixat de respondre». */
const NO_SON_SILENCIS = new Set(['adreca', 'personals-off']);

/**
 * T5 (P1-07, 261024) · Alguna de les fonts que se seguixen no ha respost a l'última ronda, i la
 * resta sí: les seues notícies es veuen, i ací es diu quines falten i es pot tornar a provar.
 * Quan no ha respost cap, no es pinta: el detall és FontsSenseResposta.jsx.
 * 261024 (Lector) · Les adreces vetades es diuen a part, amb el que de veres ha passat; les fonts
 * teues pendents, ni ací: l'arbre les marca «pendent».
 */
export function AvisFonts() {
  const { lector, noticies, idioma = 'ca' } = useVistaLector();
  const tx = textosLector(idioma);
  if (noticies.estat !== 'llest' || !noticies.caigudes?.length) return null;
  const motius = new Map(noticies.caigudes.map((caiguda) => [caiguda.fontId, caiguda.motiu]));
  const seguides = noticies.fonts.filter((font) => seguix(lector.estat, font.id));
  const caigudes = seguides.filter((font) => motius.has(font.id));
  if (caigudes.length === 0 || caigudes.length === seguides.length) return null;
  const callades = caigudes.filter((font) => !NO_SON_SILENCIS.has(motius.get(font.id)));
  const vetades = caigudes.filter((font) => motius.get(font.id) === 'adreca');
  if (callades.length === 0 && vetades.length === 0) return null;
  const frases = [
    callades.length ? tx.avisFontsCalladesText(callades.map((font) => font.nom)) : null,
    vetades.length ? tx.avisFontsVetadesText(vetades.map((font) => font.nom)) : null
  ].filter(Boolean);
  return (
    <Alerta to="avis" titol={callades.length ? tx.avisFontsCalladesTitol : tx.avisAdrecesVetadesTitol}
      accions={callades.length ? <Boto varietat="secundari" onClick={noticies.rellegix}>{tx.tornaHoAProvar}</Boto> : null}>
      {frases.join(' ')}
    </Alerta>
  );
}
