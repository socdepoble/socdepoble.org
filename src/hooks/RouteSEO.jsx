import { useLocation } from '../app/contexts/RouterContext';
import { RUTA_FITXA_IAIA, RUTES_CANONIQUES } from '../config/navigation.js';
import { clauSocialDeRuta } from '../config/rutaSocial.js';
import { useSEO } from './useSEO';

/* Títol de reserva per ruta (primer tram). Una pàgina amb useSEO propi mana
   per damunt; sense entrada ací, la ruta ix amb el títol genèric «Sóc de Poble».
   Els noms són les etiquetes de config/sections.js o el títol de la pàgina.
   /control i el seu àlies /utilitats són el Panell de Control (D3).
   /registre obri Entrar o Crear compte segons ?mode (T4): la reserva no en
   nomena cap dels dos, perquè la pestanya no contradiga la pantalla.
   /app (Plataforma d'Apps Enxufables, 261002): «Apps» i mai indexable; dins
   d'una app, RutaApps posa el títol de l'app, també sense indexar.
   Gauntlet 261016 (Bloc 3.5.1) · Les tres rutes canòniques netes
   (/javillinares, /socdepoble i /rentonar) obrin la mateixa fitxa que /gent,
   /empresa i /grup: la mateixa reserva, «Perfil», amb el primer tram llegit
   de RUTES_CANONIQUES (navigation.js), mai escrit ací.
   Gauntlet 261016_1530 (Bloc 3.6.3) · /iaia és ara la fitxa de la IAIA
   MarIA (RUTA_FITXA_IAIA): la mateixa reserva, «Perfil». El manifest, a
   /anima, posa el seu títol (TextSection), com abans a /iaia. */
const TITLES = { notes: 'Notes', xat: 'Xat', connectar: 'Connectar', registre: 'Entrar o crear compte',
  perfil: 'Perfil', admin: 'Administració', consola: 'Consola', control: 'Panell de Control', cerca: 'Cerca',
  traduccions: 'Traduccions i llengua', wikidepoble: 'Wiki de Poble', disseny: 'Disseny',
  realitat: 'Realitat', utilitats: 'Panell de Control', 'el-meu-perfil': 'El meu perfil', 'control-xat': 'Control del xat',
  gent: 'Perfil', empresa: 'Perfil', ajuntament: 'Perfil', grup: 'Perfil', fedivers: 'Nodes i Fedivers', app: 'Apps',
  ...Object.fromEntries([...Object.values(RUTES_CANONIQUES), RUTA_FITXA_IAIA].map((ruta) => [ruta.slice(1), 'Perfil'])) };
const SENSE_INDEX = new Set(['app']);
/* Pla 261028_1526 (P1-61, Fase 2) · Un document de la Wiki (/wikidepoble?item=
   o la seua forma de camí) té clau pròpia (rutaSocial.js), i la reserva no
   l'afirma: sense indexar, i per tant sense canonical ni og:url, fins que
   WikiDetail el valida (seoWiki.js). Abans, mentre arribava el tros de la
   Wiki, el canonical d'un id privat o inexistent quedava com a indexable. */
export function RouteSEO() {
  const { pathname, search } = useLocation();
  const section = pathname.split('/').filter(Boolean)[0];
  const esDocument = Boolean(pathname) && clauSocialDeRuta(pathname, search).includes('?item=');
  useSEO({ title: TITLES[section] || null, fallback: true, index: !SENSE_INDEX.has(section) && !esDocument });
  return null;
}
