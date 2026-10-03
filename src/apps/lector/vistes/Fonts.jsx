/**
 * Lector de notícies · la columna del MIG: les fonts de la carpeta (com les
 * fonts d'una carpeta de Feedly). «Totes les fonts» i cada font seguida, amb
 * el comptador; i, a les eines, «Marca-ho tot com a llegit» per a la carpeta
 * o la font que es veu (MarcaTotLlegit, la mateixa peça que el detall porta
 * en estret). Cap classe pròpia.
 */
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { EstatBuit, MarcColumna } from '../../../components/PedraSeca/index.js';
import { DESPRES, comptadorsFonts, fontsDeCarpeta } from '../nucli/index.js';
import { MarcaTotLlegit, NavTargetes, ObridorCarpetes } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { NOTICIES, TOTES, useSeleccio } from './navegacio.js';

const textDe = (carpeta, n) => {
  if (carpeta === DESPRES) return n === 1 ? 'desada' : 'desades';
  return n > 0 ? 'sense llegir' : 'tot llegit';
};

export function ColumnaFonts({ params }) {
  const { lector, noticies, ara, ruta } = useVistaLector();
  const { carpeta, fontId, nomCarpeta } = useSeleccio(params);
  const dades = { ...noticies, estat: lector.estat, carpeta, ara };
  const fonts = fontsDeCarpeta(dades) || [];
  const { total, perFont } = comptadorsFonts(dades);
  const elements = [
    { id: TOTES, nom: 'Totes les fonts', comptador: total, secundari: textDe(carpeta, total) },
    ...fonts.map((font) => {
      const n = perFont.get(font.id) || 0;
      return { id: font.id, nom: font.nom, comptador: n, secundari: textDe(carpeta, n), imatge: font.imatge || undefined };
    })
  ];
  const titol = nomCarpeta ? `Fonts · ${nomCarpeta}` : 'Fonts';
  const eines = (
    <>
      <ObridorCarpetes />
      <MarcaTotLlegit carpeta={carpeta} fontId={fontId} />
    </>
  );
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={eines} etiqueta={titol}>
      <NavTargetes
        elements={elements}
        etiqueta={titol}
        actiu={fontId || TOTES}
        camiDe={(element) => (element.id === TOTES ? ruta(NOTICIES, carpeta) : ruta(NOTICIES, carpeta, element.id))}
        buit={<EstatBuit titol="Cap font">No en seguixes cap d’esta carpeta.</EstatBuit>}
      />
    </MarcColumna>
  );
}
