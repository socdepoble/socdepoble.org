import { useLocation } from '../app/contexts/RouterContext';
import { useSEO } from './useSEO';

/* Títol de reserva per ruta (primer tram). Una pàgina amb useSEO propi mana
   per damunt; sense entrada ací, la ruta ix amb el títol genèric «Sóc de Poble».
   Els noms són les etiquetes de config/sections.js o el títol de la pàgina.
   /control i el seu àlies /utilitats són el Panell de Control (D3).
   /registre obri Entrar o Crear compte segons ?mode (T4): la reserva no en
   nomena cap dels dos, perquè la pestanya no contradiga la pantalla. */
const TITLES = { notes: 'Notes', xat: 'Xat', connectar: 'Connectar', registre: 'Entrar o crear compte',
  perfil: 'Perfil', admin: 'Administració', consola: 'Consola', control: 'Panell de Control', cerca: 'Cerca',
  traduccions: 'Traduccions i llengua', wikidepoble: 'Wiki de Poble', disseny: 'Disseny',
  realitat: 'Realitat', utilitats: 'Panell de Control', 'el-meu-perfil': 'El meu perfil', 'control-xat': 'Control del xat',
  gent: 'Perfil', empresa: 'Perfil', ajuntament: 'Perfil', grup: 'Perfil', fedivers: 'Nodes i Fedivers' };
export function RouteSEO() {
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean)[0];
  useSEO({ title: TITLES[section] || null, fallback: true });
  return null;
}
