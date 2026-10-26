/* Ordre del Mestre (261026, prompt 261026_1615, tasca 3) · L'adaptador dels
   avisos natius del xat sobre @capacitor/local-notifications 8.3.1 (exacte,
   aprovat pel Mestre en xat el 261026). És l'ÚNIC fitxer que el nomena, i
   només per un import() dinàmic: el connector es carrega la primera vegada que
   cal (llegir el permís, avisar o escoltar els tocs), mai a la web.
   Avisos al moment, cap programat: per això l'App lleva l'alarma exacta, el
   wake lock i l'arrencada del manifest d'Android. A Android, el canal «xat»
   porta importància alta (so, vibració i bàner); el sistema hi aplica el que
   haja triat la persona. Contracte: config/avisosNatius.js.
   Compte: el connector és un Proxy de Capacitor que respon a qualsevol nom,
   també a `then`. Una promesa que es resol AMB ell no es resol mai (verificat
   el 261026 amb el nucli 8.5.3 del pont). Per això ací mai no es torna el
   connector d'una funció async: es guarda el mòdul i s'hi crida a dins. */
const PLATAFORMES = new Set(['android']);
export const CANAL_XAT = 'xat';
/* Android: IMPORTANCE_HIGH i VISIBILITY_PRIVATE (a la pantalla de bloqueig, sense el text). */
const IMPORTANCIA_ALTA = 4;
const VISIBILITAT_PRIVADA = 0;

const carregaPerDefecte = () => import('@capacitor/local-notifications');

/**
 * L'adaptador per a registraAvisosNatius, o null fora de l'App.
 * Revisió 261026 · Només Android: a iOS el WebView es congela en segon pla i
 * cap sondeig no hi arriba, de manera que demanar el permís seria prometre el
 * que no passarà. iOS esperarà el push (APNs).
 * @param {{ plataforma: string, canal?: (() => { nom: string, descripcio: string })|{ nom: string, descripcio: string },
 *   carregaConnector?: () => Promise<{ LocalNotifications: object }> }} opcions
 *   `canal` es llig en crear el canal, amb el diccionari ja carregat.
 */
export function creaAvisosNatius({ plataforma, canal = {}, carregaConnector = carregaPerDefecte } = {}) {
  if (!PLATAFORMES.has(plataforma)) return null;
  let modul = null;
  let canalCreat = null;
  /* Crida `fes(connector)` i en torna el resultat (mai el connector). Un intent
     de càrrega fallit no queda guardat: el següent ho torna a provar. */
  const amb = async (fes) => {
    if (!modul) {
      modul = Promise.resolve().then(carregaConnector);
      modul.catch(() => { modul = null; });
    }
    const { LocalNotifications } = await modul;
    return fes(LocalNotifications);
  };
  const asseguraCanal = () => {
    if (plataforma !== 'android') return Promise.resolve();
    const textos = (typeof canal === 'function' ? canal() : canal) || {};
    canalCreat ??= amb((ln) => ln.createChannel({
      id: CANAL_XAT,
      name: textos.nom || 'Missatges del xat',
      description: textos.descripcio || 'Avisos dels missatges nous de Sóc de Poble',
      importance: IMPORTANCIA_ALTA,
      visibility: VISIBILITAT_PRIVADA,
      vibration: true,
      lights: true
    })).catch((e) => { canalCreat = null; throw e; });
    return canalCreat;
  };
  return {
    plataforma,
    estatPermis: () => amb((ln) => ln.checkPermissions()).then((estat) => estat?.display),
    demanaPermis: () => amb((ln) => ln.requestPermissions()).then((estat) => estat?.display),
    async avisa({ id, titol, cos, filId, vigent = null }) {
      await asseguraCanal();
      /* El canal pot tardar: si mentrestant la persona ha tornat a l'App (i la
         barra s'ha netejat), este avís ja no ha d'eixir (Codex C1615-09). */
      if (vigent && !vigent()) return;
      await amb((ln) => ln.schedule({
        notifications: [{
          id,
          title: titol,
          body: cos,
          /* Revisió 261026 · Al moment, sense alarma: el connector tracta tot
             avís com a exacte per defecte i, sense SCHEDULE_EXACT_ALARM (que
             l'App lleva), obria «Alarmes i recordatoris» en lloc d'avisar. */
          isExactNotification: false,
          channelId: CANAL_XAT,
          group: CANAL_XAT,
          threadIdentifier: filId || CANAL_XAT,
          autoCancel: true,
          extra: { filId }
        }]
      }));
    },
    /* En tornar a l'App, els avisos ja vistos fora sobren a la barra. */
    netejaAvisos: () => amb((ln) => ln.removeAllDeliveredNotifications()),
    escoltaToc(fn) {
      amb((ln) => ln.addListener('localNotificationActionPerformed', (accio) => {
        const filId = accio?.notification?.extra?.filId;
        if (typeof filId === 'string' && filId) fn({ filId });
      })).catch(() => {});
    }
  };
}
