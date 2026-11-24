/**
 * textosPeuControl.js — IDEA-341 · Textos en les 5 llengües oficials (ca, es, en, eu, gl)
 * i resolució determinista de conversa directa per al nou peu sobri de «Filet pur i dur»
 * del Panell de Control (/control i /utilitats).
 *
 * · Fila 1: Escriure a Sóc de Poble (xat corporatiu via useXatSocDePobleResolt).
 * · Fila 2: Escriure a Javi Llinares (llavor/local -> /xat?amb=0001; remot ->
 *           loadPerfilPublic('javillinares') -> /xat?amb=<id>, amb fallback segur a
 *           /javillinares o /xat si el port no respon).
 * · Fila 3: El meu perfil, contrasenya i dades a l'aparell -> RUTA_COMPTE.
 */
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';

export const IDIOMES_PEU_CONTROL = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const TEXTOS_PEU_CONTROL = Object.freeze({
  ca: Object.freeze({
    titol: 'Tens algun dubte o vols parlar amb nosaltres?',
    subtitol: 'Tria a qui vols escriure i s’obrirà una conversa directa al Xat. Contestem persones reals.',
    socDePobleNom: 'Escriure a Sóc de Poble',
    socDePobleDetall: 'Consultes generals sobre el projecte, els pobles i el funcionament',
    javiNom: 'Escriure a Javi Llinares',
    javiDetall: 'Contacte directe amb l’impulsor del projecte',
    perfilNom: 'El meu perfil, contrasenya i dades a l’aparell',
    perfilDetall: 'Gestiona el teu compte, l’espai local de l’aparell i el Mode rural sense cobertura',
  }),
  es: Object.freeze({
    titol: '¿Tienes alguna duda o quieres hablar con nosotros?',
    subtitol: 'Elige a quién quieres escribir y se abrirá una conversación directa en el Chat. Contestamos personas reales.',
    socDePobleNom: 'Escribir a Sóc de Poble',
    socDePobleDetall: 'Consultas generales sobre el proyecto, los pueblos y el funcionamiento',
    javiNom: 'Escribir a Javi Llinares',
    javiDetall: 'Contacto directo con el impulsor del proyecto',
    perfilNom: 'Mi perfil, contraseña y datos en el dispositivo',
    perfilDetall: 'Gestiona tu cuenta, el espacio local del dispositivo y el Modo rural sin cobertura',
  }),
  en: Object.freeze({
    titol: 'Do you have a question or want to talk to us?',
    subtitol: 'Choose who you want to message to open a direct conversation in Chat. Real people reply.',
    socDePobleNom: 'Message Sóc de Poble',
    socDePobleDetall: 'General questions about the project, the villages and how it works',
    javiNom: 'Message Javi Llinares',
    javiDetall: 'Direct contact with the project founder',
    perfilNom: 'My profile, password and data on this device',
    perfilDetall: 'Manage your account, local device storage and offline Rural mode',
  }),
  eu: Object.freeze({
    titol: 'Zalantzaren bat duzu edo gurekin hitz egin nahi duzu?',
    subtitol: 'Aukeratu nori idatzi nahi diozun Txatean zuzeneko elkarrizketa irekitzeko. Benetako pertsonek erantzuten dugu.',
    socDePobleNom: 'Idatzi Sóc de Pobleri',
    socDePobleDetall: 'Proiektuari, herriei eta funtzionamenduari buruzko kontsulta orokorrak',
    javiNom: 'Idatzi Javi Llinaresi',
    javiDetall: 'Harreman zuzena proiektuaren sustatzailearekin',
    perfilNom: 'Nire profila, pasahitza eta gailuko datuak',
    perfilDetall: 'Kudeatu zure kontua, gailuko tokiko lekua eta estaldurarik gabeko Landa-modua',
  }),
  gl: Object.freeze({
    titol: 'Tes algunha dúbida ou queres falar connosco?',
    subtitol: 'Escolle a quen queres escribir e abrirase unha conversa directa no Chat. Contestamos persoas reais.',
    socDePobleNom: 'Escribir a Sóc de Poble',
    socDePobleDetall: 'Consultas xerais sobre o proxecto, os pobos e o funcionamento',
    javiNom: 'Escribir a Javi Llinares',
    javiDetall: 'Contacto directo co impulsor do proxecto',
    perfilNom: 'O meu perfil, contrasinal e datos no dispositivo',
    perfilDetall: 'Xestiona a túa conta, o espazo local do dispositivo e o Modo rural sen cobertura',
  }),
});

export function resolIdiomaPeuControl({ language = null, t = null } = {}) {
  if (typeof language === 'string' && language.trim()) {
    const base = language.trim().toLowerCase().split('-')[0];
    if (Object.hasOwn(TEXTOS_PEU_CONTROL, base)) return base;
  }
  if (typeof t === 'function') {
    const mostra = t('section.xat.ajustos.tancaSessio', 'Tanca la sessió');
    if (mostra === 'Cerrar sesión') return 'es';
    if (mostra === 'Log out') return 'en';
    if (mostra === 'Itxi saioa') return 'eu';
    if (mostra === 'Pechar sesión') return 'gl';
  }
  return 'ca';
}

export function resolTextosPeuControl(opcions = {}) {
  return TEXTOS_PEU_CONTROL[resolIdiomaPeuControl(opcions)];
}

const MODES_LOCALS = new Set(['seed', 'local']);
const MAXIM_ID = 200;
const NO_CAP_EN_CONSULTA = /[\u0000-\u001F\u007F\s]/;

const esIdDeConsulta = (id) => typeof id === 'string'
  && id.length > 0 && id.length <= MAXIM_ID && !NO_CAP_EN_CONSULTA.test(id);

export const RUTA_XAT_JAVI_LLAVOR = `/xat?amb=${encodeURIComponent(AGENTS_MAP.JAVI.id)}`;
export const RUTA_PERFIL_JAVI_FALLBACK = `/${PERSONA_PILOT.slug}`;

const PORT_PER_DEFECTE = Object.freeze({ teCapacitat, loadPerfilPublic });

export function llegixModeDadesControl(externalConfig) {
  if (!externalConfig) return 'seed';
  try {
    return normalizeBackendConfig(externalConfig).dataMode;
  } catch {
    return 'remote';
  }
}

/**
 * Resol de forma determinista el destí del clic a «Escriure a Javi Llinares»:
 * · En mode 'seed' o 'local': `/xat?amb=${AGENTS_MAP.JAVI.id}` immediatament.
 * · En mode 'remote': demana `loadPerfilPublic('javillinares', config)` si el port
 *   declara 'directori'; si retorna un id vàlid, retorna `/xat?amb=${id}`.
 *   Si el port no té capacitat, no respon o llança error, cau de forma segura a
 *   `/javillinares` (o `/xat` si la ruta no fos interna).
 */
export async function resolDestiXatJavi({
  externalConfig = null,
  port = PORT_PER_DEFECTE,
  clau = PERSONA_PILOT.slug,
} = {}) {
  const dataMode = llegixModeDadesControl(externalConfig);
  if (MODES_LOCALS.has(dataMode)) return RUTA_XAT_JAVI_LLAVOR;

  try {
    if (port.teCapacitat('directori')) {
      const perfil = await port.loadPerfilPublic(clau, externalConfig || {});
      if (esIdDeConsulta(perfil?.id)) {
        const href = `/xat?amb=${encodeURIComponent(perfil.id)}`;
        if (esRutaInterna(href)) return href;
      }
    }
  } catch {
    /* El port no ha respost: usem el fallback segur sense trencar la navegació. */
  }

  return esRutaInterna(RUTA_PERFIL_JAVI_FALLBACK) ? RUTA_PERFIL_JAVI_FALLBACK : '/xat';
}
