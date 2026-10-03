/**
 * Esquelet comú de catàleg i col·lecció · la columna de la COL·LECCIÓ en curs:
 * el tiquet del TPV i la llista de la compra.
 *
 *   capçalera  AppGridColumn; en pantalla estreta, un botó que torna al
 *              catàleg (o l'obri, si la col·lecció va primer)
 *   eines      BarraResum en forma de capçalera: comptador, total i l'acció
 *              principal (Cobra, Fet)
 *   cos        LiniesColleccio («quantitat × nom»), o les rajoles de
 *              GraellaArticles amb forma="rajoles" (La Compra a l'estil
 *              Bring: tocar una rajola la marca). En rajoles, una línia
 *              pendent diu aria-pressed; una de 'fet' o 'anullat' porta el
 *              text d'estat (textosLinies: «Fet», «Anul·lat», «Comprat»…) a
 *              la línia de davall, visible i al nom accessible
 *   peu        un node de l'app, si en vol (p. ex. el teclat de cobrar)
 * Presentacional: les línies arriben ja calculades i els gestos tornen a l'app.
 */
import { ArrowLeft, Plus } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  BarraResum, EstatBuit, GraellaArticles, LiniesColleccio, MarcColumna, TEXTOS_ESTAT_LINIA, estatLinia
} from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { useVistesEsquelet } from './vistes.js';

const TEXTOS_COLLECCIO = Object.freeze({
  buit: 'Encara no hi ha res',
  buitText: 'Toca un article del catàleg per a afegir-lo.',
  tornaCataleg: 'Torna al catàleg',
  obriCataleg: 'Afig des del catàleg',
  enColleccio: 'Pendent'
});

/* Una línia vestida d'article, per a pintar la col·lecció en rajoles. Pendent
   (estatLinia 'normal', també un estat desconegut) és «a la col·lecció»; fet
   i anul·lat no ho són, i el seu text va a la línia de davall: mai només pel
   color ni només per aria-pressed. */
const comArticle = (linia, textosEstat) => {
  const estat = estatLinia(linia);
  const textEstat = estat === 'normal' ? null : textosEstat[estat];
  return {
    id: linia.id,
    nom: linia.nom,
    categoriaId: null,
    secundari: [linia.detall, textEstat].filter((text) => typeof text === 'string' && text !== '').join(' · ') || undefined,
    valor: linia.valor,
    estat: estat === 'normal' ? 'en-colleccio' : 'normal',
    insignia: Number.isSafeInteger(linia.quantitat) && linia.quantitat > 1 ? String(linia.quantitat) : undefined
  };
};

export function ColumnaColleccio({
  titol = 'Col·lecció', linies = [], forma = 'linies', resum = null,
  onTria, onEdita, onResta, onSuma, onLleva, textosLinies, peu = null, primer, tram, textos
}) {
  const t = { ...TEXTOS_COLLECCIO, ...textos };
  const { mida } = useClosaAplicacio();
  const vistes = useVistesEsquelet({ primer, tram });
  const llista = Array.isArray(linies) ? linies.filter((linia) => linia && typeof linia.id === 'string') : [];
  const perId = new Map(llista.map((linia) => [linia.id, linia]));
  const buit = <EstatBuit titol={t.buit}>{t.buitText}</EstatBuit>;

  const startActions = mida === 'estret' ? [{
    id: 'ves-al-cataleg',
    icona: vistes.primer === 'cataleg' ? ArrowLeft : Plus,
    etiqueta: vistes.primer === 'cataleg' ? t.tornaCataleg : t.obriCataleg,
    onAcciona: vistes.cataleg.vesA
  }] : [];

  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} startActions={startActions} />}
      eines={resum ? <BarraResum {...resum} forma="capcalera" /> : null} peu={peu} etiqueta={titol}>
      {forma === 'rajoles' ? (
        <GraellaArticles
          articles={llista.map((linia) => comArticle(linia, { ...TEXTOS_ESTAT_LINIA, ...textosLinies }))}
          etiqueta={titol}
          commutable
          textos={{ 'en-colleccio': t.enColleccio }}
          onTria={onTria ? (article) => onTria(perId.get(article.id)) : undefined}
          onAccioSecundaria={onEdita ? (article) => onEdita(perId.get(article.id)) : undefined}
          buit={buit}
        />
      ) : (
        <LiniesColleccio linies={llista} etiqueta={titol} onTria={onTria} onEdita={onEdita} onResta={onResta}
          onSuma={onSuma} onLleva={onLleva} textos={textosLinies} buit={buit} />
      )}
    </MarcColumna>
  );
}
