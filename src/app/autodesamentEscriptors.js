/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · REGISTRE DELS ESCRIPTORS DE L'AUTODESAMENT

   Els escriptors de la cua (src/data/autodesament/cua.js) es registren en
   importar el seu mòdul. Ací s'importen tots des d'App perquè existisquen
   des de l'arrencada: així la cua pot reprendre un esborrany pendent (una
   pestanya tancada abans que el servidor el confirmara) encara que la
   secció, que es carrega amb lazy(), no s'haja obert.

   T47b (260928) · Notes NO passa per esta cua: continua amb el seu gestor
   (src/sections/notes/GlobalSaveManager.js), que ara renova l'escriptura a
   cada tecla, reintenta, posa en quarantena les columnes absents i repren en
   carregar el Bloc. Els seus esborranys viuen a 'SdpNotesQueue' amb el CAS
   de revisió (D01); portar-los ací és una migració pròpia.
   ═══════════════════════════════════════════════════════════════════ */
import '../sections/profile/perfilEscriptor.js';
