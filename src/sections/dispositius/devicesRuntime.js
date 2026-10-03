const DEVICE_PROFILE_KEY = 'socdepoble-device-profile-v1';
const DEVICE_INSTANCE_KEY = 'socdepoble-device-instance-v1';
const DEVICE_CHAT_KEY_PREFIX = 'socdepoble-device-chat-v1';
const DEVICE_CONNECTIONS_KEY_PREFIX = 'socdepoble-device-connections-v1';
const DEVICE_SELECTED_PEER_KEY_PREFIX = 'socdepoble-device-selected-peer-v1';
const CHANNEL_NAME = 'socdepoble-device-bridge-v1';

const getProfileKey = (tenantId) => `${DEVICE_PROFILE_KEY}-${tenantId}`;
const getInstanceKey = (tenantId) => `${DEVICE_INSTANCE_KEY}-${tenantId}`;
const getChatKey = (tenantId, deviceId) => `${DEVICE_CHAT_KEY_PREFIX}-${tenantId}::${deviceId}`;
const getConnKey = (tenantId, deviceId) => `${DEVICE_CONNECTIONS_KEY_PREFIX}-${tenantId}::${deviceId}`;
const getPeerKey = (tenantId, deviceId) => `${DEVICE_SELECTED_PEER_KEY_PREFIX}-${tenantId}::${deviceId}`;

export const PRESENCE_HEARTBEAT_MS = 5000;
export const PRESENCE_STALE_MS = 16000;

import { delVal, getEfimer, getVal, setEfimer, setVal } from '../../config/storage.js';

const randomToken = () => Math.random().toString(36).slice(2, 10);

/* Quan va nàixer este document (la pestanya carregada). Una pestanya duplicada
   és un document nou; la navegació interna de l'SPA (anar a /mur i tornar) no
   el canvia, encara que el pont es refaça. */
const NAIXEMENT_DOCUMENT = typeof performance !== 'undefined' && performance.timeOrigin > 0
  ? performance.timeOrigin
  : Date.now();

const createDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `device-${Date.now()}-${randomToken()}`;
};

/* P5 (Mestre, 261003) · El nom suggerit diu el tipus d'aparell i, només si
   hi ha una persona amb sessió, de qui és. Sense persona (el Foraster), «de
   l’usuari»: cap nom propi de reserva, ni al codi ni gravat al navegador. */
const agentUsuariActual = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '');

export function nomPerDefecte(nomPersona = null, agentUsuari = agentUsuariActual()) {
  const tipus = /Mobi|Android/i.test(agentUsuari || '') ? 'Mòbil' : 'Ordinador';
  return `${tipus} de ${nomPersona || 'l’usuari'}`;
}

/* Els perfils d'abans no porten la marca `nomAutomatic`. Es tracten com a
   automàtics els noms amb la forma que els generava la versió anterior
   («Portal XXXX» i «Ordinador|Mòbil de …»), com ja feia la migració de
   «Portal ». Un nom desat amb «Guardar» porta la marca a false i no es toca. */
const NOM_AUTOMATIC_LLEGAT = /^(?:Portal [A-Z0-9]{1,4}|(?:Ordinador|Mòbil) de .+)$/;

/** El perfil amb el nom automàtic refet per a la persona d'ara (o el mateix objecte si no canvia). */
export function ambNomSuggerit(profile, nomPersona = null) {
  if (!profile.nomAutomatic) return profile;
  const name = nomPerDefecte(nomPersona);
  return name === profile.name ? profile : { ...profile, name };
}

/* L'id és de la INSTÀNCIA (la pestanya), no del navegador. A localStorage el
   compartien totes les pestanyes del mateix origen, i el filtre «és meu» del
   pont descartava l'altra: dues pestanyes no es podien vore mai. A la capa
   efímera sobreviu a la recàrrega i mor amb la pestanya. */
export function idDeInstancia(tenantId, { renova = false } = {}) {
  const desat = renova ? null : getEfimer(getInstanceKey(tenantId), null);
  if (typeof desat === 'string' && desat) return desat;
  const id = createDeviceId();
  setEfimer(getInstanceKey(tenantId), id);
  return id;
}

export function loadDeviceProfile(tenantId, nomPersona = null) {
  const stored = getVal(getProfileKey(tenantId), null) || {};

  /* Perfil d'abans: portava l'id compartit, i d'ell penjaven xats, connexions
     i peer triat (només hi podia haver converses amb els simulats). Es
     netegen una vegada; el perfil es torna a desar sense id (i, si el nom
     era automàtic, sense nom). */
  if (stored.id) {
    delVal(getChatKey(tenantId, stored.id));
    delVal(getConnKey(tenantId, stored.id));
    delVal(getPeerKey(tenantId, stored.id));
  }

  const nomAutomatic = !stored.name || (typeof stored.nomAutomatic === 'boolean'
    ? stored.nomAutomatic
    : NOM_AUTOMATIC_LLEGAT.test(stored.name));

  const profile = ambNomSuggerit({
    id: idDeInstancia(tenantId),
    name: stored.name || '',
    nomAutomatic,
    kind: stored.kind || 'portal',
    isVisible: stored.isVisible === true,
    createdAt: stored.createdAt || Date.now()
  }, nomPersona);

  saveDeviceProfile(tenantId, profile);
  return profile;
}

/* A localStorage només les preferències del navegador; l'id és de la pestanya.
   El nom automàtic no es desa: amb sessió porta el nom de la persona, i en un
   ordinador compartit del poble sobreviuria a l'eixida (T47). Es calcula en
   cada càrrega; només es guarda el nom que la persona tria amb «Guardar». */
export function saveDeviceProfile(tenantId, profile) {
  const nomAutomatic = profile.nomAutomatic === true;
  setVal(getProfileKey(tenantId), {
    ...(nomAutomatic ? {} : { name: profile.name }),
    nomAutomatic,
    kind: profile.kind,
    isVisible: profile.isVisible === true,
    createdAt: profile.createdAt
  });
}

/* Xats, connexions i peer triat són de la instància: viuen on viu el seu id. */
export function loadDeviceChats(tenantId, deviceId) {
  return getEfimer(getChatKey(tenantId, deviceId), {});
}

export function saveDeviceChats(tenantId, deviceId, chats) {
  setEfimer(getChatKey(tenantId, deviceId), chats);
}

export function loadDeviceConnections(tenantId, deviceId) {
  return getEfimer(getConnKey(tenantId, deviceId), {});
}

export function saveDeviceConnections(tenantId, deviceId, connections) {
  setEfimer(getConnKey(tenantId, deviceId), connections);
}

export function loadSelectedPeer(tenantId, deviceId) {
  return getEfimer(getPeerKey(tenantId, deviceId), '');
}

export function saveSelectedPeer(tenantId, deviceId, peerId) {
  setEfimer(getPeerKey(tenantId, deviceId), peerId);
}

export function createChatMessage({ sender, text, author }) {
  return {
    id: `msg-${Date.now()}-${randomToken()}`,
    sender,
    text,
    author,
    sentAt: Date.now()
  };
}

export function createDeviceBridge(tenantId, selfDevice, handlers, { naixement = NAIXEMENT_DOCUMENT } = {}) {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }

  const channel = new BroadcastChannel(`${CHANNEL_NAME}::${tenantId}`);

  /* Una pestanya duplicada hereta la capa efímera i, amb ella, l'id. Cada pont
     porta una marca: quan va nàixer el seu document, quan va nàixer ell i un
     testimoni. Si arriba un missatge amb el meu id i una altra marca, conserva
     l'id el DOCUMENT més antic (l'original, encara que haja refet el pont en
     tornar a la secció); el més nou se'l canvia (onDuplicate, una sola vegada)
     i el més antic li ho avisa. Dins d'un mateix document, el pont més antic. */
  const marca = { naixement, nascut: Date.now(), pont: randomToken() };
  let viu = true;
  let duplicatAvisat = false;

  /* Un BroadcastChannel tancat llança en publicar: després de destroy() no s'envia res. */
  const post = (payload) => {
    if (!viu) return;
    channel.postMessage({
      ...payload,
      ...marca,
      sentAt: Date.now()
    });
  };

  /* Un pont d'una versió anterior no porta `naixement`: es desempata pel pont. */
  const socPosterior = (altre) => {
    if (typeof altre.naixement === 'number' && altre.naixement !== marca.naixement) return marca.naixement > altre.naixement;
    if (altre.nascut !== marca.nascut) return marca.nascut > altre.nascut;
    return marca.pont > altre.pont;
  };

  const resolDuplicat = (altre) => {
    if (!socPosterior(altre)) {
      post({ type: 'presence:duplicate', fromId: selfDevice.id });
      return;
    }
    if (duplicatAvisat) return;
    duplicatAvisat = true;
    handlers.onDuplicate?.();
  };

  const announcePresence = () => {
    if (!selfDevice.isVisible) return; // Mode privat, no anunciem

    post({
      type: 'presence:announce',
      device: {
        id: selfDevice.id,
        name: selfDevice.name,
        kind: selfDevice.kind,
        lastSeen: Date.now()
      }
    });
  };

  const onMessage = (event) => {
    const payload = event.data;
    if (!viu || !payload || typeof payload !== 'object') return;

    const delMeuId = (payload.device?.id && payload.device.id === selfDevice.id)
      || (payload.fromId && payload.fromId === selfDevice.id);
    if (delMeuId) {
      if (payload.pont && payload.pont !== marca.pont) resolDuplicat(payload);
      return;
    }

    switch (payload.type) {
      case 'presence:request':
        announcePresence();
        break;
      case 'presence:announce':
        handlers.onPresence?.(payload.device);
        break;
      case 'connect:request':
        if (payload.toId === selfDevice.id) {
          handlers.onConnectRequest?.(payload.fromId);
        }
        break;
      case 'connect:accept':
        if (payload.toId === selfDevice.id) {
          handlers.onConnectAccept?.(payload.fromId);
        }
        break;
      case 'connect:decline':
        if (payload.toId === selfDevice.id) {
          handlers.onConnectDecline?.(payload.fromId);
        }
        break;
      case 'message:send':
        if (payload.toId === selfDevice.id) {
          handlers.onMessage?.(payload.fromId, payload.message);
        }
        break;
      case 'connect:disconnect':
        if (payload.toId === selfDevice.id) {
          handlers.onDisconnect?.(payload.fromId);
        }
        break;
      default:
        break;
    }
  };

  channel.addEventListener('message', onMessage);

  const heartbeat = window.setInterval(() => {
    announcePresence();
  }, PRESENCE_HEARTBEAT_MS);

  post({ type: 'presence:request', fromId: selfDevice.id });
  announcePresence();

  return {
    announcePresence,
    requestPresence() {
      post({ type: 'presence:request', fromId: selfDevice.id });
    },
    requestConnection(targetId) {
      post({ type: 'connect:request', fromId: selfDevice.id, toId: targetId });
    },
    acceptConnection(targetId) {
      post({ type: 'connect:accept', fromId: selfDevice.id, toId: targetId });
    },
    declineConnection(targetId) {
      post({ type: 'connect:decline', fromId: selfDevice.id, toId: targetId });
    },
    sendMessage(targetId, message) {
      post({ type: 'message:send', fromId: selfDevice.id, toId: targetId, message });
    },
    disconnectConnection(targetId) {
      post({ type: 'connect:disconnect', fromId: selfDevice.id, toId: targetId });
    },
    destroy() {
      if (!viu) return;
      viu = false;
      window.clearInterval(heartbeat);
      channel.removeEventListener('message', onMessage);
      channel.close();
    }
  };
}
