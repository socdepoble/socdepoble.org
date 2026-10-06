/**
 * Esquelet comú de catàleg i col·lecció · la columna de les COL·LECCIONS:
 * els tiquets oberts del TPV («Barra», «Taula 3») i les llistes de La
 * Compra, com a targetes amb comptador (TargetesColleccions).
 *
 * `hrefDe(colleccio)` torna el camí dins de l'app (useApp().ruta(...)): cada
 * targeta és un enllaç de veres i el clic normal navega amb push.
 *
 * Correcció F3 (261006) · `avis` (opcional): un avís de l'app dins del marc
 * (MarcColumna), primer fill del cos, davall de la capçalera, que no baixa.
 * Sense, el de sempre.
 */
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { useNavigate, useRouter } from '../../../app/contexts/RouterContext';
import { EstatBuit, MarcColumna, TargetesColleccions } from '../../../components/PedraSeca/index.js';

const TEXTOS_COLLECCIONS = Object.freeze({
  buit: 'Encara no n’hi ha cap',
  buitText: 'Crea’n una amb el botó de davall.'
});

export function ColumnaColleccions({
  titol = 'Col·leccions', colleccions = [], actiu = null, hrefDe, onTria, onCrea, textCrea, textComptador, textos, avis = null
}) {
  const t = { ...TEXTOS_COLLECCIONS, ...textos };
  const navigate = useNavigate();
  const { basename = '' } = useRouter();
  const cami = typeof hrefDe === 'function' ? hrefDe : null;
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} avis={avis} etiqueta={titol}>
      <TargetesColleccions
        colleccions={colleccions}
        etiqueta={titol}
        actiu={actiu}
        hrefDe={cami ? (colleccio) => basename + cami(colleccio) : undefined}
        onTria={cami ? (colleccio) => navigate(cami(colleccio)) : onTria}
        onCrea={onCrea}
        textCrea={textCrea}
        textComptador={textComptador}
        buit={<EstatBuit titol={t.buit}>{onCrea ? t.buitText : null}</EstatBuit>}
      />
    </MarcColumna>
  );
}
