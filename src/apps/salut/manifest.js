/**
 * Salut · Cuidant dels Nostres · manifest sdp.app.v1 (lot SALUT, T5).
 *
 * Un quadern domèstic per a apuntar com orina, beu, fa de ventre, dorm i com
 * està la persona que cuidem, i per a ensenyar-ho al metge en un full clar.
 * No és un producte sanitari: no diagnostica, no recomana i no envia res.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'salut' (la ruta és /app/salut, no es declara);
 *   · dadesPersonals 'salut': la plataforma només l'obri si l'App és l'ama
 *     del document (sense iframe ni __SDP_EMBEDDED__), la telemetria la compta
 *     com a /app/* i el títol de la pestanya mai porta dates ni noms;
 *   · `carrega` darrere del literal de compilació EXACTE de baix
 *     (VITE_SDP_APP_SALUT): sense la variable, el build de producció no la porta;
 *   · el component és l'export per defecte d'AppSalut.jsx.
 * Les entrades són les de la barra lateral (§B.9); el primer tram de cada
 * ruta de rutesSalut.js n'és una. Els interruptors amaguen els apunts que la
 * família no vol fer servir: la persona només els pot apagar.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'salut',
  titol: { ca: 'Salut · Cuidant dels Nostres', es: 'Salud · Cuidando de los Nuestros' },
  icona: 'HeartHandshake',
  grups: [
    { id: 'apuntar', titol: { ca: 'Apuntar', es: 'Anotar' } },
    { id: 'mirar', titol: { ca: 'Mirar', es: 'Mirar' } },
    { id: 'saber', titol: { ca: 'Saber', es: 'Saber' } },
    { id: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes' } }
  ],
  entrades: [
    { slug: 'diari', titol: { ca: 'Avui', es: 'Hoy' }, icona: 'NotebookPen', grup: 'apuntar' },
    { slug: 'dies', titol: { ca: 'Dies i períodes', es: 'Días y periodos' }, icona: 'CalendarDays', grup: 'apuntar' },
    { slug: 'full', titol: { ca: 'Full per al metge', es: 'Hoja para el médico' }, icona: 'ClipboardList', grup: 'mirar' },
    { slug: 'resum', titol: { ca: 'Resum i avisos', es: 'Resumen y avisos' }, icona: 'ChartColumn', grup: 'mirar' },
    { slug: 'agitacio', titol: { ca: 'Agitació', es: 'Agitación' }, icona: 'Activity', grup: 'mirar' },
    { slug: 'guia', titol: { ca: 'Guia del diari', es: 'Guía del diario' }, icona: 'BookOpen', grup: 'saber' },
    { slug: 'diccionari', titol: { ca: 'Diccionari', es: 'Diccionario' }, icona: 'Boxes', grup: 'saber' },
    { slug: 'persona', titol: { ca: 'Persona', es: 'Persona' }, icona: 'Users', grup: 'ajustos' },
    { slug: 'copia', titol: { ca: 'Còpia i esborrat', es: 'Copia y borrado' }, icona: 'Package', grup: 'ajustos' },
    { slug: 'avis', titol: { ca: 'Avís i privacitat', es: 'Aviso y privacidad' }, icona: 'FileText', grup: 'ajustos' }
  ],
  entradaPerDefecte: 'diari',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: 'salut',
  interruptors: [
    { id: 'agitacio', titol: { ca: 'Agitació i conducta', es: 'Agitación y conducta' } },
    { id: 'medicacio', titol: { ca: 'Medicació', es: 'Medicación' } },
    { id: 'deposicions', titol: { ca: 'Deposicions', es: 'Deposiciones' } }
  ],
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_SALUT === '1' ? () => import('./AppSalut.jsx') : null
};
