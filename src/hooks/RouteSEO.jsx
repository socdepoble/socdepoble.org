import { useLocation } from '../app/contexts/RouterContext';
import { useSEO } from './useSEO';

/* Títol de reserva per ruta (primer tram). Una pàgina amb useSEO propi mana
   per damunt; sense entrada ací, la ruta ix amb el títol genèric «Sóc de Poble».
   Els noms són les etiquetes de config/sections.js o el títol de la pàgina. */
const TITLES = { notes: 'Notes', xat: 'Xat', connectar: 'Connectar', registre: 'Crear compte',
  perfil: 'Perfil', admin: 'Administració', consola: 'Consola', control: 'Control', cerca: 'Cerca',
  traduccions: 'Traduccions i llengua', wikidepoble: 'Wiki de Poble', disseny: 'Disseny',
  realitat: 'Realitat', utilitats: 'Control', 'el-meu-perfil': 'El meu perfil', 'control-xat': 'Control del xat',
  gent: 'Perfil', empresa: 'Perfil', ajuntament: 'Perfil', grup: 'Perfil' };
export function RouteSEO() {
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean)[0];
  useSEO({ title: TITLES[section] || null, fallback: true });
  return null;
}
