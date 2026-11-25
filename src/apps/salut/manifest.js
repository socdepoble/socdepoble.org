/**
 * Salut · Cuidant dels Nostres · manifest sdp.app.v1 (lot SALUT, T5).
 *
 * Onada R32.10 · Camp declaratiu `avisBeta: 'general'` i internacionalització
 * completa del manifest en les 5 llengües oficials (ca, es, en, eu, gl).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'salut',
  titol: {
    ca: 'Salut · Cuidant dels Nostres',
    es: 'Salud · Cuidando de los Nuestros',
    en: 'Health · Caring for Our Loved Ones',
    eu: 'Osasuna · Gureak Zaintzen',
    gl: 'Saúde · Coidando dos Nosos'
  },
  icona: 'HeartHandshake',
  grups: [
    { id: 'apuntar', titol: { ca: 'Apuntar', es: 'Anotar', en: 'Log', eu: 'Apuntatu', gl: 'Anotar' } },
    { id: 'mirar', titol: { ca: 'Mirar', es: 'Mirar', en: 'Review', eu: 'Begiratu', gl: 'Mirar' } },
    { id: 'saber', titol: { ca: 'Saber', es: 'Saber', en: 'Learn', eu: 'Jakin', gl: 'Saber' } },
    { id: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes', en: 'Settings', eu: 'Ezarpenak', gl: 'Axustes' } }
  ],
  entrades: [
    { slug: 'diari', titol: { ca: 'Avui', es: 'Hoy', en: 'Today', eu: 'Gaur', gl: 'Hoxe' }, icona: 'NotebookPen', grup: 'apuntar' },
    { slug: 'dies', titol: { ca: 'Dies i períodes', es: 'Días y periodos', en: 'Days and periods', eu: 'Egunak eta aldiak', gl: 'Días e períodos' }, icona: 'CalendarDays', grup: 'apuntar' },
    { slug: 'full', titol: { ca: 'Full per al metge', es: 'Hoja para el médico', en: 'Doctor summary sheet', eu: 'Medikuarentzako orria', gl: 'Folla para o médico' }, icona: 'ClipboardList', grup: 'mirar' },
    { slug: 'resum', titol: { ca: 'Resum i avisos', es: 'Resumen y avisos', en: 'Summary and notices', eu: 'Laburpena eta oharrak', gl: 'Resumo e avisos' }, icona: 'ChartColumn', grup: 'mirar' },
    { slug: 'agitacio', titol: { ca: 'Agitació', es: 'Agitación', en: 'Agitation', eu: 'Agitazioa', gl: 'Axitación' }, icona: 'Activity', grup: 'mirar' },
    { slug: 'guia', titol: { ca: 'Guia del diari', es: 'Guía del diario', en: 'Diary guide', eu: 'Egunkariaren gida', gl: 'Guía do diario' }, icona: 'BookOpen', grup: 'saber' },
    { slug: 'diccionari', titol: { ca: 'Diccionari', es: 'Diccionario', en: 'Glossary', eu: 'Hiztegia', gl: 'Dicionario' }, icona: 'Boxes', grup: 'saber' },
    { slug: 'persona', titol: { ca: 'Persona', es: 'Persona', en: 'Person', eu: 'Pertsona', gl: 'Persoa' }, icona: 'Users', grup: 'ajustos' },
    { slug: 'copia', titol: { ca: 'Còpia i esborrat', es: 'Copia y borrado', en: 'Backup and erase', eu: 'Kopia eta ezabaketa', gl: 'Copia e borrado' }, icona: 'Package', grup: 'ajustos' },
    { slug: 'avis', titol: { ca: 'Avís i privacitat', es: 'Aviso y privacidad', en: 'Notice and privacy', eu: 'Oharra eta pribatutasuna', gl: 'Aviso e privacidade' }, icona: 'FileText', grup: 'ajustos' }
  ],
  entradaPerDefecte: 'diari',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: 'salut',
  avisBeta: 'general',
  interruptors: [
    { id: 'agitacio', actiuPerDefecte: true, titol: { ca: 'Agitació i conducta', es: 'Agitación y conducta', en: 'Agitation and behaviour', eu: 'Agitazioa eta jokabidea', gl: 'Axitación e conduta' } },
    { id: 'medicacio', actiuPerDefecte: true, titol: { ca: 'Medicació', es: 'Medicación', en: 'Medication', eu: 'Medikazioa', gl: 'Medicación' } },
    { id: 'deposicions', actiuPerDefecte: true, titol: { ca: 'Deposicions', es: 'Deposiciones', en: 'Bowel movements', eu: 'Kaka-egiteak', gl: 'Deposicións' } }
  ],
  carrega: import.meta.env.VITE_SDP_APP_SALUT !== '0' ? () => import('./AppSalut.jsx') : null
};
