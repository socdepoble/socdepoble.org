import { useLocation } from '../app/contexts/RouterContext';
import { useSEO } from './useSEO';

const TITLES = { notes: 'Notes', xat: 'Xat', connectar: 'Connectar', registre: 'Crear compte',
  perfil: 'Perfil', admin: 'Administració', consola: 'Consola', control: 'Control', cerca: 'Cerca' };
export function RouteSEO() {
  const { pathname } = useLocation();
  const section = pathname.split('/').filter(Boolean)[0];
  useSEO({ title: TITLES[section] || null, fallback: true });
  return null;
}
