/**
 * El Bar · vistes/Taules.jsx — el plànol de sala (disseny del Bar §A.6,
 * flux 2) fet amb la columna de catàleg de l'ESQUELET COMÚ: les zones són
 * les categories i les taules, els articles (lliure, o oberta amb el total).
 * Tocar una taula porta a /app/bar/taules/<taula>: la seua comanda.
 */
import { LayoutGrid } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg } from '../../comu/esquelet/index.js';
import { useInterruptorsApp } from '../../plataforma/index.js';
import { totals } from '../nucli/comanda.js';
import { taulesEnOrdre } from '../nucli/sala.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { Columna, Preparat } from './comu.jsx';
import { useVes } from './punt.js';
import { euros } from './vestits.js';

/** Les taules com a articles de l'esquelet. */
function taulesVestides(sala, comandes) {
  return taulesEnOrdre(sala).map((taula) => {
    const obertes = comandes.filter((c) => c.origen.tipus === 'taula' && c.origen.taulaId === taula.id);
    const total = obertes.reduce((suma, c) => suma + totals(c).totalCents, 0);
    return {
      id: taula.id,
      nom: taula.nom,
      categoriaId: taula.zonaId,
      secundari: `${taula.places} places`,
      valor: obertes.length ? euros(total) : 'Lliure',
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
  return (
    <Preparat titol="Sala">
      <Planol />
    </Preparat>
  );
}

function Planol() {
  const { sala, comandes } = useBar();
  const { ves } = useVes();
  const actives = useTaulesActives();
  if (!actives) {
    return (
      <Columna titol="Sala">
        <EstatBuit icona={LayoutGrid} titol="Les taules estan apagades">Es poden encendre als ajustos del dispositiu.</EstatBuit>
      </Columna>
    );
  }
  return (
    <ColumnaCataleg
      titol="Sala"
      categories={sala.zones.map((z, ordre) => ({ id: z.id, nom: z.nom, ordre, visible: true }))}
      articles={taulesVestides(sala, comandes)}
      textosEstat={{ 'en-colleccio': 'Oberta' }}
      textArticles={(n) => `${n} ${n === 1 ? 'taula' : 'taules'}`}
      onTria={(taula) => ves('taules', taula.id)}
      textos={{ buit: 'Encara no hi ha cap taula', buitText: 'Les taules es definixen als ajustos de la sala.', categoria: 'Zona', totes: 'Totes' }}
    />
  );
}
