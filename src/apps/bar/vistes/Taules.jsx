/**
 * El Bar · vistes/Taules.jsx — el plànol de sala (disseny del Bar §A.6,
 * flux 2) fet amb la columna de catàleg de l'ESQUELET COMÚ: les zones són
 * les categories i les taules, els articles (lliure, o oberta amb el total).
 * Tocar una taula porta a /app/bar/taules/<taula>: la seua comanda.
 * L'avís de la sessió va dins del marc del plànol (avis, correcció F3, 261006).
 *
 * Onada R32.5 · Internacionalització en les 5 llengües oficials (ca, es, en, eu, gl).
 */
import { LayoutGrid } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg } from '../../comu/esquelet/index.js';
import { useApp, useInterruptorsApp } from '../../plataforma/index.js';
import { totals } from '../nucli/comanda.js';
import { taulesEnOrdre } from '../nucli/sala.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisDeLaColumna, Columna, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { euros } from './vestits.js';

/** Les taules com a articles de l'esquelet. */
function taulesVestides(sala, comandes, tx) {
  return taulesEnOrdre(sala).map((taula) => {
    const obertes = comandes.filter((c) => c.origen.tipus === 'taula' && c.origen.taulaId === taula.id);
    const total = obertes.reduce((suma, c) => suma + totals(c).totalCents, 0);
    return {
      id: taula.id,
      nom: taula.nom,
      categoriaId: taula.zonaId,
      secundari: `${taula.places} ${tx.places}`,
      valor: obertes.length ? euros(total) : tx.lliure,
      estat: obertes.length ? 'en-colleccio' : 'normal',
      ...(obertes.length > 1 ? { insignia: String(obertes.length) } : {})
    };
  });
}

/** Les taules estan apagades (interruptor de l'app): ho diu, mai una pantalla buida. */
function useTaulesActives() {
  return useInterruptorsApp().actiu('taules');
}

export function PlanolSala() {
  const { idioma = 'ca' } = useApp();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.sala}>
      <Planol tx={tx} />
    </Preparat>
  );
}

function Planol({ tx }) {
  const { sala, comandes } = useBar();
  const { ves } = useVes();
  const actives = useTaulesActives();
  if (!actives) {
    return (
      <Columna titol={tx.sala}>
        <EstatBuit icona={LayoutGrid} titol={tx.taulesApagadesTitol}>{tx.taulesApagadesText}</EstatBuit>
      </Columna>
    );
  }
  return (
    <ColumnaCataleg
      titol={tx.sala}
      categories={sala.zones.map((z, ordre) => ({ id: z.id, nom: z.nom, ordre, visible: true }))}
      articles={taulesVestides(sala, comandes, tx)}
      textosEstat={{ 'en-colleccio': tx.oberta }}
      textArticles={(n) => `${n} ${n === 1 ? tx.taulaSingular : tx.taulaPlural}`}
      onTria={(taula) => ves('taules', taula.id)}
      textos={{ buit: tx.capTaulaTitol, buitText: tx.capTaulaText, categoria: tx.zona, totes: tx.totes }}
      avis={<AvisDeLaColumna />}
    />
  );
}
