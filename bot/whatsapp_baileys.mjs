import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import makeWASocket, {
  BufferJSON,
  areJidsSameUser,
  downloadMediaMessage,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  makeCacheableSignalKeyStore,
  normalizeMessageContent,
  fetchLatestBaileysVersion,
} from 'baileys';
import {
  AttemptLedger,
  BoundedKeyedQueue,
  OutboundBlockedError,
  OutboundGate,
  PersistentMessageStore,
  ProcessLock,
  QueueFullError,
  ReconnectPolicy,
  ReplyLedger,
  SerializedWriter,
  TtlCache,
  disconnectCode,
  hashId,
  redactJid,
  sleep,
  withTimeout,
} from './guardrails.mjs';

const DEFAULTS = Object.freeze({
  audioConcurrency: 2,
  maxPending: 100,
  maxPerChat: 10,
  maxAudioBytes: 12 * 1024 * 1024,
  maxAudioSeconds: 15 * 60,
  maxImageBytes: 8 * 1024 * 1024,
  imageDownloadTimeoutMs: 30_000,
  audioDownloadTimeoutMs: 60_000,
  processTimeoutMs: 300_000,
  replyTtlMs: 10 * 60_000,
  shutdownTimeoutMs: 30_000,
  socketEndTimeoutMs: 5_000,
  groupMetadataTtlMs: 10 * 60_000,
  messageCacheTtlMs: 24 * 60 * 60_000,
  allowAllGroups: false,
  allowedGroupJids: [],
  allowAllDirects: false,
  allowedDirectJids: [],
  groupPrefix: /^(?:iaia|mar[íi]a)[,:]?\s+/iu,
  perMinute: 8,
  perDay: 250,
  globalGapMs: 3_000,
  directGapMs: 4_000,
  groupGapMs: 12_000,
  jitterMs: 700,
});

const AUDIO_MIME = new Set([
  'audio/aac',
  'audio/amr',
  'audio/3gpp',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/opus',
  'audio/x-m4a',
]);

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const TRANSIENT_MEDIA_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function noop() {}

function makeSilentLogger() {
  const logger = {
    level: 'silent',
    child: () => logger,
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
  };
  return logger;
}

function requireFunction(value, label) {
  if (typeof value !== 'function') throw new TypeError(`${label} ha de ser una funció`);
  return value;
}

function validateAdapterConfig(config) {
  const positiveIntegers = [
    'audioConcurrency',
    'maxPending',
    'maxPerChat',
    'maxAudioBytes',
    'maxAudioSeconds',
    'maxImageBytes',
    'imageDownloadTimeoutMs',
    'audioDownloadTimeoutMs',
    'processTimeoutMs',
    'replyTtlMs',
    'shutdownTimeoutMs',
    'socketEndTimeoutMs',
    'groupMetadataTtlMs',
    'messageCacheTtlMs',
  ];
  for (const name of positiveIntegers) {
    if (!Number.isInteger(config[name]) || config[name] < 1) {
      throw new TypeError(`${name} ha de ser un enter positiu`);
    }
  }
  if (!Array.isArray(config.allowedGroupJids)) {
    throw new TypeError('allowedGroupJids ha de ser un array');
  }
  if (!Array.isArray(config.allowedDirectJids)) {
    throw new TypeError('allowedDirectJids ha de ser un array');
  }
  if (!(config.groupPrefix instanceof RegExp)) {
    throw new TypeError('groupPrefix ha de ser una RegExp');
  }
  if (
    config.replyTtlMs <=
    Math.max(config.processTimeoutMs, config.audioDownloadTimeoutMs) + 60_000
  ) {
    throw new TypeError('replyTtlMs ha de deixar almenys 60 s de marge per a recuperació');
  }
}

function errorSummary(error) {
  const message = String(error?.message || error || 'error')
    .replace(/[\w.:+-]+@(lid|s\.whatsapp\.net|g\.us|broadcast|newsletter)/giu, '<jid>')
    .slice(0, 300);
  return { errorMessage: message, errorCode: error?.code || disconnectCode(error) };
}

function baseMimeType(value, fallback = 'application/octet-stream') {
  return String(value || fallback).split(';', 1)[0].trim().toLowerCase();
}

function numeric(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : Infinity;
  if (typeof value === 'bigint') {
    return value > BigInt(Number.MAX_SAFE_INTEGER) ? Infinity : Number(value);
  }
  if (typeof value.toNumber === 'function') return numeric(value.toNumber());
  const converted = Number(value.toString?.() ?? value);
  return Number.isFinite(converted) ? converted : Infinity;
}

function messageTimeMs(message) {
  const value = numeric(message?.messageTimestamp);
  if (!value) return Date.now();
  return value > 10_000_000_000 ? value : value * 1_000;
}

function safeSameUser(first, second) {
  if (!first || !second) return false;
  try {
    return areJidsSameUser(first, second);
  } catch {
    return first === second;
  }
}

function eventIdOf(message) {
  // Els àlies PN/LID poden aparéixer o canviar entre dos upserts del mateix
  // missatge. L'id de WhatsApp és prou entròpic i evita que eixe canvi trenque
  // la deduplicació.
  return String(message.key?.id || '');
}

function addressingOf(message) {
  const key = message.key || {};
  const chatJid = key.remoteJid;
  if (!chatJid) throw Object.assign(new Error('Missatge sense remoteJid'), { code: 'MISSING_JID' });
  const group = isJidGroup(chatJid);
  const candidates = group
    ? [key.participant, key.participantAlt]
    : [key.remoteJid, key.remoteJidAlt];
  const aliases = [...new Set(candidates.filter(Boolean))];
  const senderJid = aliases.find((jid) => String(jid).endsWith('@lid')) || aliases[0];
  const senderAltJid = aliases.find((jid) => jid !== senderJid) || null;
  return {
    chatJid,
    senderJid,
    senderAltJid,
    senderAliases: aliases,
    queueKey: group ? chatJid : senderJid || chatJid,
    isGroup: group,
    isLid: String(senderJid || '').endsWith('@lid'),
  };
}

/**
 * Desembolica ephemeral/view-once i, provisionalment, associatedChildMessage
 * (el segon cas continua obert upstream). Manté intacta la key LID del WAMessage.
 */
export function unwrapIncomingContent(rawContent) {
  let current = rawContent;
  let usedAssociatedChild = false;
  for (let depth = 0; current && depth < 6; depth += 1) {
    const normalized = normalizeMessageContent(current) || current;
    const nested =
      normalized.associatedChildMessage?.message || normalized.associatedChildMessage || null;
    if (!nested || nested === current) {
      return { content: normalized, usedAssociatedChild };
    }
    usedAssociatedChild = true;
    current = nested;
  }
  throw Object.assign(new Error('Massa capes de missatge encapsulat'), {
    code: 'MESSAGE_NESTING_LIMIT',
  });
}

function contentNode(content) {
  return (
    content?.audioMessage ||
    content?.extendedTextMessage ||
    content?.imageMessage ||
    content?.videoMessage ||
    content?.documentMessage ||
    null
  );
}

function textOf(content) {
  return String(
    content?.conversation ||
      content?.extendedTextMessage?.text ||
      content?.imageMessage?.caption ||
      content?.videoMessage?.caption ||
      content?.documentMessage?.caption ||
      '',
  ).trim();
}

function contextOf(content) {
  return contentNode(content)?.contextInfo || null;
}

function isTransientMediaError(error) {
  const code = error?.code || error?.cause?.code;
  const status = Number(
    error?.output?.statusCode || error?.cause?.output?.statusCode || error?.statusCode,
  );
  const msg = String(error?.message || '').toLowerCase();
  return (
    TRANSIENT_MEDIA_CODES.has(code) ||
    code === 'AUDIO_TIMEOUT' ||
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    status === 408 ||
    status >= 500 ||
    msg.includes('bad mac')
  );
}

async function consumeAudioStream(stream, expectedSha, maxBytes) {
  const chunks = [];
  const sha = createHash('sha256');
  let total = 0;
  try {
    for await (const rawChunk of stream) {
      const chunk = Buffer.from(rawChunk);
      total += chunk.length;
      if (total > maxBytes) {
        throw Object.assign(new Error('Àudio massa gran'), { code: 'AUDIO_TOO_LARGE' });
      }
      sha.update(chunk);
      chunks.push(chunk);
    }
  } catch (error) {
    stream.destroy?.(error);
    throw error;
  }
  if (total === 0) throw Object.assign(new Error('Àudio buit'), { code: 'EMPTY_AUDIO' });

  const actual = sha.digest();
  const expected = expectedSha ? Buffer.from(expectedSha) : null;
  if (
    expected?.length &&
    (expected.length !== actual.length || !timingSafeEqual(expected, actual))
  ) {
    throw Object.assign(new Error('Checksum de l’àudio incorrecte'), {
      code: 'AUDIO_HASH_MISMATCH',
    });
  }
  return Buffer.concat(chunks, total);
}

async function consumeImageStream(stream, expectedSha, maxBytes) {
  const chunks = [];
  const sha = createHash('sha256');
  let total = 0;
  try {
    for await (const rawChunk of stream) {
      const chunk = Buffer.from(rawChunk);
      total += chunk.length;
      if (total > maxBytes) {
        throw Object.assign(new Error('Imatge massa gran'), { code: 'IMAGE_TOO_LARGE' });
      }
      sha.update(chunk);
      chunks.push(chunk);
    }
  } catch (error) {
    stream.destroy?.(error);
    throw error;
  }
  if (total === 0) throw Object.assign(new Error('Imatge buida'), { code: 'EMPTY_IMAGE' });

  const actual = sha.digest();
  const expected = expectedSha ? Buffer.from(expectedSha) : null;
  if (
    expected?.length &&
    (expected.length !== actual.length || !timingSafeEqual(expected, actual))
  ) {
    throw Object.assign(new Error('Checksum de la imatge incorrecte'), {
      code: 'IMAGE_HASH_MISMATCH',
    });
  }
  return Buffer.concat(chunks, total);
}

function mediaWatchdogError() {
  return Object.assign(new Error('Watchdog de mèdia excedit'), {
    code: 'MEDIA_WATCHDOG_TIMEOUT',
  });
}

async function withinMediaBudget(work, timeoutMs, onTimeout = noop) {
  if (timeoutMs <= 0) throw mediaWatchdogError();
  let timer;
  const operation = Promise.resolve().then(work);
  const watchdog = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = mediaWatchdogError();
      // Rebutgem primer perquè l'error visible siga sempre el del watchdog,
      // encara que abort/destroy facen fallar l'operació al mateix tick.
      reject(error);
      try {
        onTimeout(error);
      } catch {
        // El timeout original continua sent l'error autoritatiu.
      }
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation, watchdog]);
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadAudioSafe({
  getSocket,
  message,
  content,
  usedAssociatedChild,
  logger,
  maxBytes,
  maxSeconds,
  timeoutMs,
}) {
  const audio = content?.audioMessage;
  if (!audio) return null;

  const mimeType = baseMimeType(audio.mimetype, 'audio/ogg');
  if (!AUDIO_MIME.has(mimeType)) {
    throw Object.assign(new Error(`MIME d’àudio no admés: ${mimeType}`), {
      code: 'AUDIO_MIME_REJECTED',
    });
  }
  if (numeric(audio.fileLength) > maxBytes) {
    throw Object.assign(new Error('Àudio massa gran segons metadades'), {
      code: 'AUDIO_TOO_LARGE',
    });
  }
  if (numeric(audio.seconds) > maxSeconds) {
    throw Object.assign(new Error('Àudio massa llarg'), { code: 'AUDIO_TOO_LONG' });
  }

  // Si és associatedChildMessage, canviem només .message; preservem tota la key
  // original (remoteJid/participant i els camps Alt de LID).
  let downloadTarget = usedAssociatedChild ? { ...message, message: content } : message;
  const deadline = Date.now() + timeoutMs;
  const remaining = () => deadline - Date.now();
  let explicitReuploadUsed = false;
  let transientRetryUsed = false;
  while (true) {
    const socket = getSocket();
    if (!socket) {
      throw Object.assign(new Error('Socket no disponible per a descarregar àudio'), {
        code: 'NOT_CONNECTED',
      });
    }
    const controller = new AbortController();
    let stream;
    try {
      const bytes = await withinMediaBudget(
        async () => {
          stream = await downloadMediaMessage(
            downloadTarget,
            'stream',
            { options: { signal: controller.signal } },
            {
              logger,
              reuploadRequest: async (expiredMessage) => {
                const current = getSocket();
                if (!current) {
                  throw Object.assign(new Error('Socket desconnectat'), {
                    code: 'NOT_CONNECTED',
                  });
                }
                return current.updateMediaMessage(expiredMessage);
              },
            },
          );
          return consumeAudioStream(stream, audio.fileSha256, maxBytes);
        },
        remaining(),
        (error) => {
          controller.abort(error);
          stream?.destroy?.(error);
        },
      );
      return {
        bytes,
        mimeType,
        isVoiceNote: Boolean(audio.ptt),
        seconds: numeric(audio.seconds) || null,
      };
    } catch (error) {
      const status = Number(error?.output?.statusCode || error?.statusCode);
      // Workaround rc13: el helper comprova error.status, però Boom exposa
      // output.statusCode. Fem un únic reupload explícit per 404/410.
      if (!explicitReuploadUsed && (status === 404 || status === 410)) {
        const current = getSocket();
        if (!current) throw error;
        downloadTarget = await withinMediaBudget(
          () => current.updateMediaMessage(downloadTarget),
          remaining(),
        );
        explicitReuploadUsed = true;
        continue;
      }
      if (transientRetryUsed || !isTransientMediaError(error)) throw error;
      transientRetryUsed = true;
      const delayMs = 800 + randomInt(0, 701);
      if (remaining() <= delayMs) throw mediaWatchdogError();
      await sleep(delayMs);
    }
  }
}

export async function downloadImageSafe({
  getSocket,
  message,
  content,
  usedAssociatedChild,
  logger,
  maxBytes,
  timeoutMs,
}) {
  const image = content?.imageMessage;
  if (!image) return null;

  const mimeType = baseMimeType(image.mimetype, 'image/jpeg');
  if (!IMAGE_MIME.has(mimeType)) {
    throw Object.assign(new Error(`MIME d’imatge no admés: ${mimeType}`), {
      code: 'IMAGE_MIME_REJECTED',
    });
  }
  if (numeric(image.fileLength) > maxBytes) {
    throw Object.assign(new Error('Imatge massa gran segons metadades'), {
      code: 'IMAGE_TOO_LARGE',
    });
  }

  let downloadTarget = usedAssociatedChild ? { ...message, message: content } : message;
  const deadline = Date.now() + timeoutMs;
  const remaining = () => deadline - Date.now();
  let explicitReuploadUsed = false;
  let transientRetryUsed = false;
  while (true) {
    const socket = getSocket();
    if (!socket) {
      throw Object.assign(new Error('Socket no disponible per a descarregar imatge'), {
        code: 'NOT_CONNECTED',
      });
    }
    const controller = new AbortController();
    let stream;
    try {
      const bytes = await withinMediaBudget(
        async () => {
          stream = await downloadMediaMessage(
            downloadTarget,
            'stream',
            { options: { signal: controller.signal } },
            {
              logger,
              reuploadRequest: async (expiredMessage) => {
                const current = getSocket();
                if (!current) {
                  throw Object.assign(new Error('Socket desconnectat'), {
                    code: 'NOT_CONNECTED',
                  });
                }
                return current.updateMediaMessage(expiredMessage);
              },
            },
          );
          return consumeImageStream(stream, image.fileSha256, maxBytes);
        },
        remaining(),
        (error) => {
          controller.abort(error);
          stream?.destroy?.(error);
        },
      );
      return {
        bytes,
        mimeType,
      };
    } catch (error) {
      const status = Number(error?.output?.statusCode || error?.statusCode);
      if (!explicitReuploadUsed && (status === 404 || status === 410)) {
        const current = getSocket();
        if (!current) throw error;
        downloadTarget = await withinMediaBudget(
          () => current.updateMediaMessage(downloadTarget),
          remaining(),
        );
        explicitReuploadUsed = true;
        continue;
      }
      if (transientRetryUsed || !isTransientMediaError(error)) throw error;
      transientRetryUsed = true;
      const delayMs = 800 + randomInt(0, 701);
      if (remaining() <= delayMs) throw mediaWatchdogError();
      await sleep(delayMs);
    }
  }
}

function normaliseReply(reply) {
  if (reply == null) return null;
  if (typeof reply === 'string') return { text: reply };
  if (typeof reply !== 'object') throw new TypeError('handleInbound ha retornat un tipus invàlid');
  return {
    text:
      typeof reply.text === 'string'
        ? reply.text
        : typeof reply.answer === 'string'
          ? reply.answer
          : '',
    audio: reply.audio || null,
    image: reply.image || null,
  };
}

function truncateCodePoints(value, limit = 3_500) {
  const points = Array.from(String(value || '').trim());
  if (points.length <= limit) return points.join('');
  return `${points.slice(0, limit - 1).join('').trimEnd()}…`;
}

async function fulfillsBefore(promise, timeoutMs) {
  if (timeoutMs <= 0) return false;
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(promise).then(
        () => true,
        () => false,
      ),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function buildOutgoingContent(reply, config) {
  if (reply.audio) {
    const bytes = Buffer.from(reply.audio.bytes || reply.audio.buffer || []);
    const mimeType = baseMimeType(reply.audio.mimeType || reply.audio.mimetype, 'audio/ogg');
    if (!AUDIO_MIME.has(mimeType)) throw new TypeError(`MIME d’àudio d’eixida invàlid: ${mimeType}`);
    if (!bytes.length || bytes.length > config.maxAudioBytes) {
      throw new RangeError('Àudio d’eixida buit o massa gran');
    }
    return { audio: bytes, mimetype: mimeType, ptt: Boolean(reply.audio.ptt) };
  }
  if (reply.image) {
    const bytes = Buffer.from(reply.image.bytes || reply.image.buffer || []);
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
      throw new RangeError('Imatge d’eixida buida o massa gran');
    }
    return {
      image: bytes,
      mimetype: baseMimeType(reply.image.mimeType || reply.image.mimetype, 'image/jpeg'),
      caption: truncateCodePoints(reply.text, 900),
    };
  }
  const text = truncateCodePoints(reply.text);
  return text ? { text } : null;
}

export class HardenedBaileysAdapter {
  #socket = null;
  #version = [2, 3000, 1043857760]; // default fallback
  #generation = 0;
  #lastClosedGeneration = 0;
  #connectPromise = null;
  #reconnectTimer = null;
  #stableTimer = null;
  #stopping = false;
  #connected = false;
  #halted = false;
  #allowOutbound = true;
  #limitsConfirmedGeneration = 0;
  #stopPromise = null;
  #credsError = null;
  #unsafeSocketClose = false;
  #socketEndPromises = new WeakMap();
  #groupFetches = new Map();
  #groupVersions = new Map();

  constructor({
    authState,
    saveCreds,
    handleInbound,
    dataDir = join(process.cwd(), '.baileys-runtime'),
    logger,
    onQr = noop,
    onReady = noop,
    onFatal = (error) => console.error('[WHATSAPP] Aturat:', error.message),
    onLimitState = noop,
    onLidMapping = noop,
    config = {},
    socketFactory = makeWASocket,
    reconnectPolicy = new ReconnectPolicy(),
  }) {
    if (!authState?.creds || !authState?.keys) {
      throw new TypeError('authState ha de contindre creds i keys');
    }
    this.authState = authState;
    this.saveCreds = requireFunction(saveCreds, 'saveCreds');
    this.handleInbound = requireFunction(handleInbound, 'handleInbound');
    this.onQr = requireFunction(onQr, 'onQr');
    this.onReady = requireFunction(onReady, 'onReady');
    this.onFatal = requireFunction(onFatal, 'onFatal');
    this.onLimitState = requireFunction(onLimitState, 'onLimitState');
    this.onLidMapping = requireFunction(onLidMapping, 'onLidMapping');
    this.socketFactory = requireFunction(socketFactory, 'socketFactory');
    this.logger = logger || makeSilentLogger();
    if (typeof this.logger.child !== 'function') {
      throw new TypeError('logger ha de ser compatible amb pino i tindre child()');
    }
    this.dataDir = dataDir;
    this.config = { ...DEFAULTS, ...config };
    validateAdapterConfig(this.config);
    this.allowedGroups = new Set(this.config.allowedGroupJids);
    this.allowedDirects = new Set(this.config.allowedDirectJids);

    this.replyLedger = new ReplyLedger(join(dataDir, 'inbound-ledger'), {
      recoveryMs:
        Math.max(this.config.processTimeoutMs, this.config.audioDownloadTimeoutMs) + 60_000,
    });
    this.attemptLedger = new AttemptLedger(join(dataDir, 'outbound-attempts.jsonl'));
    this.instanceLock = new ProcessLock(join(dataDir, 'owner.lock'));
    this.inboundQueue = new BoundedKeyedQueue({
      concurrency: this.config.audioConcurrency,
      maxPending: this.config.maxPending,
      maxPerKey: this.config.maxPerChat,
    });
    this.credsWriter = new SerializedWriter();
    this.retryCache = new TtlCache({ ttlMs: 60 * 60_000, maxEntries: 10_000 });
    this.messageStore = new PersistentMessageStore(join(dataDir, 'message-cache'), {
      ttlMs: this.config.messageCacheTtlMs,
      replacer: BufferJSON.replacer,
      reviver: BufferJSON.reviver,
    });
    this.groupCache = new TtlCache({
      ttlMs: this.config.groupMetadataTtlMs,
      maxEntries: 1_000,
    });
    this.reconnectPolicy = reconnectPolicy;
    if (
      typeof this.reconnectPolicy?.decision !== 'function' ||
      typeof this.reconnectPolicy?.opened !== 'function'
    ) {
      throw new TypeError('reconnectPolicy ha d’implementar decision() i opened()');
    }
    this.outbound = new OutboundGate({
      attemptLedger: this.attemptLedger,
      isConnected: () => this.#connected && this.#allowOutbound && !this.#halted,
      perMinute: this.config.perMinute,
      perDay: this.config.perDay,
      globalGapMs: this.config.globalGapMs,
      directGapMs: this.config.directGapMs,
      groupGapMs: this.config.groupGapMs,
      jitterMs: this.config.jitterMs,
    });
    this.outbound.pauseOutbound('startup-limits');
  }

  get status() {
    return {
      connected: this.#connected,
      halted: this.#halted,
      stopping: this.#stopping,
      pending: this.inboundQueue.pending,
      blocksNewChats: this.outbound.blocksNewChats,
      outboundPaused: this.outbound.outboundPaused,
    };
  }

  #notify(label, callback, value) {
    try {
      void Promise.resolve(callback(value)).catch((error) => {
        this.logger.warn(errorSummary(error), `Callback ${label} rebutjat`);
      });
    } catch (error) {
      this.logger.warn(errorSummary(error), `Callback ${label} fallit`);
    }
  }

  #endSocket(socket) {
    if (!socket) return Promise.resolve();
    let ending = this.#socketEndPromises.get(socket);
    if (!ending) {
      // Una sola invocació per socket. end() pot marcar-se com a tancat abans
      // que el WebSocket haja acabat; una segona crida no prova que la primera
      // haja finalitzat.
      ending = Promise.resolve().then(() => socket.end(undefined));
      this.#socketEndPromises.set(socket, ending);
    }
    return ending;
  }

  async start() {
    await this.instanceLock.acquire();
    try {
      await Promise.all([
        this.replyLedger.init(),
        this.attemptLedger.init(),
        this.messageStore.init(),
      ]);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: this.#version }));
      this.#version = version;
      await this.#openSocket();
      return this;
    } catch (error) {
      await this.instanceLock.release().catch(() => undefined);
      throw error;
    }
  }

  #socketOptions(socketRef) {
    return {
      version: this.#version,
      auth: {
        creds: this.authState.creds,
        keys: makeCacheableSignalKeyStore(this.authState.keys, this.logger),
      },
      logger: this.logger,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      emitOwnEvents: false,
      generateHighQualityLinkPreview: false,
      enableRecentMessageCache: true,
      enableAutoSessionRecreation: true,
      msgRetryCounterCache: this.retryCache,
      getMessage: async (key) => this.#getCachedMessage(key),
      cachedGroupMetadata: async (jid) => this.#cachedGroupMetadata(jid, socketRef()),
      shouldIgnoreJid: (jid) =>
        isJidStatusBroadcast(jid) || isJidNewsletter(jid) || isJidBroadcast(jid),
      connectTimeoutMs: 30_000,
      defaultQueryTimeoutMs: 60_000,
    };
  }

  async #openSocket() {
    if (this.#stopping || this.#halted) return;
    if (this.#connectPromise) return this.#connectPromise;
    this.#connectPromise = (async () => {
      // Invalida primer els events de la socket vella: end() també pot emetre
      // connection.close i no ha de programar una segona reconnexió.
      const generation = ++this.#generation;
      const old = this.#socket;
      this.#socket = null;
      this.#connected = false;
      this.outbound.pauseOutbound('startup-limits');
      this.#groupFetches.clear();
      if (old) {
        const ended = await fulfillsBefore(
          this.#endSocket(old),
          Math.min(this.config.socketEndTimeoutMs, this.config.shutdownTimeoutMs),
        );
        if (!ended) {
          this.#unsafeSocketClose = true;
          this.#fatal(
            Object.assign(new Error('La socket anterior no s’ha pogut tancar'), {
              code: 'SOCKET_END_FAILED',
            }),
            'Reconnexió cancel·lada',
          );
          return;
        }
      }
      if (this.#stopping || this.#halted || generation !== this.#generation) return;

      let socket;
      socket = this.socketFactory(this.#socketOptions(() => socket));
      this.#socket = socket;
      this.#bindSocket(socket, generation);
    })().finally(() => {
      this.#connectPromise = null;
    });
    return this.#connectPromise;
  }

  #bindSocket(socket, generation) {
    socket.ev.process(async (events) => {
      // creds.update d'una socket acabada continua sent valuós. saveCreds
      // serialitza l'estat compartit actual, així que es processa abans del
      // filtre de generació.
      if (events['creds.update']) {
        void this.credsWriter.request(this.saveCreds).catch((error) => {
          this.#credsError = error;
          if (this.#stopping) {
            this.logger.error(errorSummary(error), 'Credencials no persistides durant shutdown');
          } else {
            this.#fatal(error, 'No s’han pogut persistir les credencials');
          }
        });
      }

      if (generation !== this.#generation) return;

      const connection = events['connection.update'];
      if (this.#stopping || this.#halted) {
        if (connection?.connection === 'close') this.#connected = false;
        return;
      }
      if (connection) await this.#onConnectionUpdate(connection, generation);

      const cap = events['message-capping.update'];
      if (cap) {
        this.outbound.applyMessageCap(cap);
        this.#notify('onLimitState', this.onLimitState, { type: 'message-capping', value: cap });
      }

      const mapping = events['lid-mapping.update'];
      if (mapping) this.#notify('onLidMapping', this.onLidMapping, mapping);

      for (const metadata of events['groups.upsert'] || []) {
        if (metadata?.id) this.#putGroupMetadata(metadata);
      }
      for (const update of events['groups.update'] || []) {
        if (update?.id) this.#invalidateGroup(update.id);
      }
      const participants = events['group-participants.update'];
      if (participants?.id) this.#invalidateGroup(participants.id);

      const upsert = events['messages.upsert'];
      if (upsert?.type === 'notify') {
        for (const message of upsert.messages || []) this.#accept(message);
      }
    });
  }

  async #onConnectionUpdate(update, generation) {
    if (Object.hasOwn(update, 'reachoutTimeLock')) {
      const lock = update.reachoutTimeLock || { isActive: false };
      this.outbound.applyReachoutTimelock(lock);
      this.outbound.clearPause('startup-limits');
      this.#limitsConfirmedGeneration = generation;
      this.#notify('onLimitState', this.onLimitState, {
        type: 'reachout-timelock',
        value: lock,
      });
    }
    if (update.qr) this.#notify('onQr', this.onQr, update.qr);

    if (update.connection === 'open') {
      this.#connected = true;
      clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = null;
      clearTimeout(this.#stableTimer);
      this.#stableTimer = setTimeout(() => this.reconnectPolicy.opened(), 120_000);
      void this.#finishOpening(this.#socket, generation);
      return;
    }
    if (update.connection !== 'close') return;
    if (this.#lastClosedGeneration === generation) return;
    this.#lastClosedGeneration = generation;

    this.#connected = false;
    clearTimeout(this.#stableTimer);
    const code = disconnectCode(update.lastDisconnect?.error);
    const decision = this.reconnectPolicy.decision(code);
    if (!decision.reconnect) {
      this.#fatal(
        Object.assign(new Error(`Desconnexió que requerix intervenció manual (${code || 'sense codi'})`), {
          code,
        }),
        'No es reconnectarà automàticament',
      );
      return;
    }
    if (decision.circuitOpen) {
      this.#notify('onLimitState', this.onLimitState, {
        type: 'reconnect-circuit',
        delayMs: decision.delayMs,
      });
    }
    if (this.#reconnectTimer || this.#stopping || generation !== this.#generation) return;
    const scheduledGeneration = generation;
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (
        !this.#stopping &&
        !this.#halted &&
        !this.#connected &&
        scheduledGeneration === this.#generation
      ) {
        void this.#openSocket().catch((error) => this.#scheduleOpenFailure(error));
      }
    }, decision.delayMs);
  }

  #scheduleOpenFailure(error) {
    if (this.#stopping || this.#halted || this.#reconnectTimer) return;
    const decision = this.reconnectPolicy.decision(disconnectCode(error));
    if (!decision.reconnect) {
      this.#fatal(error, 'Creació de socket fallida de manera fatal');
      return;
    }
    const scheduledGeneration = this.#generation;
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (
        !this.#stopping &&
        !this.#halted &&
        !this.#connected &&
        scheduledGeneration === this.#generation
      ) {
        void this.#openSocket().catch((next) => this.#scheduleOpenFailure(next));
      }
    }, decision.delayMs);
  }

  async #finishOpening(socket, generation) {
    const lockKnown = await this.#refreshAccountLimits(socket, generation);
    if (
      socket !== this.#socket ||
      generation !== this.#generation ||
      this.#stopping ||
      this.#halted
    ) {
      return;
    }
    if (!lockKnown && this.#limitsConfirmedGeneration !== generation) {
      this.#notify('onLimitState', this.onLimitState, { type: 'limit-check-failed' });
      return;
    }
    this.outbound.clearPause('startup-limits');
    this.#notify('onReady', this.onReady, this.status);
  }

  async #refreshAccountLimits(socket, generation) {
    if (!socket || socket !== this.#socket) return false;
    const requestStartedAt = Date.now();
    const [lock, cap] = await Promise.allSettled([
      typeof socket.fetchAccountReachoutTimelock === 'function'
        ? socket.fetchAccountReachoutTimelock()
        : Promise.resolve(null),
      typeof socket.fetchNewChatMessageCap === 'function'
        ? socket.fetchNewChatMessageCap()
        : Promise.resolve(null),
    ]);
    if (socket !== this.#socket || generation !== this.#generation) return false;
    if (lock.status === 'fulfilled' && lock.value) {
      this.outbound.applyReachoutTimelock(lock.value, { confirmedAt: requestStartedAt });
      this.#limitsConfirmedGeneration = generation;
      if (lock.value.isActive) {
        this.#notify('onLimitState', this.onLimitState, {
          type: 'reachout-timelock',
          value: lock.value,
        });
      }
    }
    if (cap.status === 'fulfilled' && cap.value) {
      this.outbound.applyMessageCap(cap.value);
      if (this.outbound.blocksNewChats) {
        this.#notify('onLimitState', this.onLimitState, {
          type: 'message-capping',
          value: cap.value,
        });
      }
    }
    return lock.status === 'fulfilled' && Boolean(lock.value);
  }

  #accept(message) {
    if (!message?.message || !message.key?.id || message.key.fromMe) return;
    let address;
    try {
      address = addressingOf(message);
    } catch (error) {
      this.logger.warn(errorSummary(error), 'Missatge sense adreçament vàlid');
      return;
    }
    if (
      isJidStatusBroadcast(address.chatJid) ||
      isJidNewsletter(address.chatJid) ||
      isJidBroadcast(address.chatJid)
    ) {
      return;
    }
    void this.#cacheMessage(message).catch(() => undefined);
    void this.inboundQueue.enqueue(address.queueKey, () => this.#process(message, address)).catch((error) => {
      const fields = { ...errorSummary(error), chat: redactJid(address.chatJid) };
      if (error instanceof QueueFullError) this.logger.warn(fields, 'Entrada descartada: cua plena');
      else this.logger.error(fields, 'Fallada processant entrada');
    });
  }

  #groupIsAllowed(chatJid) {
    return this.config.allowAllGroups || this.allowedGroups.has(chatJid);
  }

  #directIsAllowed(senderJid) {
    return this.config.allowAllDirects || this.allowedDirects.has(senderJid);
  }

  #groupActivation(content, text) {
    const context = contextOf(content);
    const ownIds = [this.#socket?.user?.id, this.#socket?.user?.lid].filter(Boolean);
    const mentioned = (context?.mentionedJid || []).some((jid) =>
      ownIds.some((own) => safeSameUser(jid, own)),
    );
    const quoted =
      Boolean(context?.stanzaId) &&
      ownIds.some((own) => safeSameUser(context?.participant, own));
    const prefix = this.config.groupPrefix;
    if (prefix instanceof RegExp) prefix.lastIndex = 0;
    const commanded = prefix instanceof RegExp ? prefix.test(text) : false;
    return { active: mentioned || quoted || commanded, commanded };
  }

  async #process(message, address) {
    const eventId = eventIdOf(message);
    if (!(await this.replyLedger.claim(eventId))) return;
    const receivedAt = messageTimeMs(message);
    const expiresAt = receivedAt + this.config.replyTtlMs;
    if (Date.now() > expiresAt) {
      await this.replyLedger.markDone(eventId);
      return;
    }

    let audio;
    let image;
    try {
      const { content, usedAssociatedChild } = unwrapIncomingContent(message.message);
      let text = textOf(content);
      if (address.isGroup) {
        if (!this.#groupIsAllowed(address.chatJid)) {
          await this.replyLedger.markDone(eventId);
          return;
        }
        const activation = this.#groupActivation(content, text);
        if (!activation.active) {
          await this.replyLedger.markDone(eventId);
          return;
        }
        if (activation.commanded) {
          this.config.groupPrefix.lastIndex = 0;
          text = text.replace(this.config.groupPrefix, '').trim();
        }
      } else {
        // Missatges privats: Fail-closed segons IAIA_DIRECTES
        if (!this.#directIsAllowed(address.senderJid)) {
          await this.replyLedger.markDone(eventId);
          return;
        }
      }

      // Extracció de mitjans citats si el missatge actual no en té
      let mediaContent = content;
      let mediaUsedAssociated = usedAssociatedChild;
      const quoted = content?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!content?.audioMessage && !content?.imageMessage && quoted) {
        if (quoted.audioMessage || quoted.imageMessage) {
          mediaContent = quoted;
          mediaUsedAssociated = true;
        }
      }

      let mediaError = null;
      const handleMediaError = (err) => {
        mediaError = err;
        this.logger.error({ ...errorSummary(err), chat: redactJid(address.chatJid) }, 'Descàrrega fallida');
        return null; // Evitem que caiga a la catch exterior on es moriria en silenci
      };

      if (mediaContent?.audioMessage) {
        audio = await downloadAudioSafe({
          getSocket: () => (this.#connected ? this.#socket : null),
          message,
          content: mediaContent,
          usedAssociatedChild: mediaUsedAssociated,
          logger: this.logger,
          maxBytes: this.config.maxAudioBytes,
          maxSeconds: this.config.maxAudioSeconds,
          timeoutMs: this.config.audioDownloadTimeoutMs,
        }).catch(handleMediaError);
      }
      if (mediaContent?.imageMessage) {
        image = await downloadImageSafe({
          getSocket: () => (this.#connected ? this.#socket : null),
          message,
          content: mediaContent,
          usedAssociatedChild: mediaUsedAssociated,
          logger: this.logger,
          maxBytes: this.config.maxImageBytes,
          timeoutMs: this.config.imageDownloadTimeoutMs,
        }).catch(handleMediaError);
      }
      if (!text && !audio && !image && !mediaError) {
        await this.replyLedger.markDone(eventId);
        return;
      }

      // Si hi ha hagut error a la descàrrega, reescrivim text perquè el cervell veja què passa i avise l'usuari
      if (mediaError) {
        text = text ? `${text}\n\n*(Avís per a tu: L'arxiu o foto no s'ha pogut descarregar. Avisa-ho amb naturalitat.)*` : "*(Avís intern: L'usuari ha enviat una foto o àudio però no s'ha pogut baixar. Avisa-li que hi ha hagut un error tècnic de cobertura i que ho reenvie.)*";
      }

      const envelope = Object.freeze({
        eventId: hashId(eventId),
        chatJid: address.chatJid,
        senderJid: address.senderJid,
        senderAltJid: address.senderAltJid,
        senderAliases: address.senderAliases,
        isGroup: address.isGroup,
        isLid: address.isLid,
        text: text || null,
        audio,
        image,
        receivedAt,
      });
      const reply = normaliseReply(
        await withTimeout(
          (signal) => this.handleInbound({
            ...envelope,
            signal,
            sendProgress: async (progressText) => {
              try {
                const progOutgoing = buildOutgoingContent({ text: progressText }, this.config);
                if (!progOutgoing) return;
                await this.outbound.sendReply(
                  address.chatJid,
                  { isGroup: address.isGroup, expiresAt, rateKey: address.queueKey, reactive: true },
                  async () => {
                    const socket = this.#socket;
                    if (socket && this.#connected) {
                      await socket.sendMessage(address.chatJid, progOutgoing, { quoted: message });
                    }
                  }
                );
              } catch (error) {
                this.logger.warn(errorSummary(error), 'Fallada enviant missatge de progrés');
              }
            },
          }),
          this.config.processTimeoutMs,
          'Cervell de la IAIA',
          (error) => this.#fatal(error, 'Cervell no cooperatiu'),
        ),
      );
      const outgoing = reply ? buildOutgoingContent(reply, this.config) : null;
      if (!outgoing) {
        await this.replyLedger.markDone(eventId);
        return;
      }

      try {
        await this.outbound.sendReply(
          address.chatJid,
          {
            isGroup: address.isGroup,
            expiresAt,
            rateKey: address.queueKey,
            reactive: true,
          },
          async () => {
            // Abans de sendMessage: un error posterior és ambigu i NO s'ha de repetir.
            await this.replyLedger.markAttempted(eventId);
            const socket = this.#socket;
            if (!socket || !this.#connected) {
              throw new OutboundBlockedError('NOT_CONNECTED', 'Socket tancat abans de l’enviament');
            }
            try {
              const sent = await socket.sendMessage(address.chatJid, outgoing, {
                quoted: message,
                mediaUploadTimeoutMs: 60_000,
              });
              if (!sent) throw new Error('Baileys no ha retornat el missatge enviat');
              await this.#cacheMessage(sent);
            } catch (error) {
              if (Number(disconnectCode(error)) === 463) {
                this.outbound.pauseOutbound('local-463');
                this.#notify('onLimitState', this.onLimitState, {
                  type: 'send-restriction',
                  code: 463,
                });
              }
              throw error;
            }
          },
        );
        await this.replyLedger.markDone(eventId);
      } catch (error) {
        // Si markAttempted ja s'ha escrit, el ledger impedix un doble enviament.
        const state = await this.replyLedger.read(eventId);
        if (state?.state === 'processing') await this.replyLedger.markDone(eventId);
        this.logger.error(
          {
            ...errorSummary(error),
            chat: redactJid(address.chatJid),
            event: hashId(eventId).slice(0, 12),
          },
          'Resposta no enviada; no es reintenta automàticament',
        );
      }
    } catch (error) {
      if (error?.code === 'MEDIA_WATCHDOG_TIMEOUT') {
        // Baileys rc13 no sempre propaga AbortSignal fins al fetch. Una
        // descàrrega realment encallada para el transport per impedir que la
        // cua cree més operacions òrfenes; el supervisor ha de reiniciar-lo.
        this.#fatal(error, 'Descàrrega de mèdia no cooperativa');
      }
      await this.replyLedger.markDone(eventId).catch(() => undefined);
      this.logger.error(
        {
          ...errorSummary(error),
          chat: redactJid(address.chatJid),
          event: hashId(eventId).slice(0, 12),
        },
        'Entrada descartada de manera segura',
      );
    } finally {
      audio?.bytes?.fill(0);
      image?.bytes?.fill(0);
    }
  }

  #cacheMessage(message) {
    if (!message?.key?.id || !message?.message) return Promise.resolve();
    return this.messageStore.set(message.key.id, message.message).catch((error) => {
      this.logger.error(errorSummary(error), 'No s’ha pogut persistir la cache de missatges');
      throw error;
    });
  }

  async #getCachedMessage(key) {
    return this.messageStore.get(key?.id);
  }

  async #cachedGroupMetadata(jid, socket) {
    const cached = this.groupCache.get(jid);
    if (cached) return cached;
    if (!socket || socket !== this.#socket || !this.#connected) return undefined;
    const generation = this.#generation;
    const version = this.#groupVersions.get(jid) || 0;
    const existing = this.#groupFetches.get(jid);
    if (existing?.generation === generation && existing?.version === version) {
      return existing.promise;
    }
    const record = { generation, version, promise: null };
    record.promise = socket
      .groupMetadata(jid)
      .then((metadata) => {
        const stillCurrent =
          socket === this.#socket &&
          generation === this.#generation &&
          version === (this.#groupVersions.get(jid) || 0) &&
          this.#groupFetches.get(jid) === record;
        if (!stillCurrent) return undefined;
        if (metadata) this.groupCache.set(jid, metadata);
        return metadata;
      })
      .finally(() => {
        if (this.#groupFetches.get(jid) === record) this.#groupFetches.delete(jid);
      });
    this.#groupFetches.set(jid, record);
    return record.promise;
  }

  #invalidateGroup(jid) {
    this.#groupVersions.set(jid, (this.#groupVersions.get(jid) || 0) + 1);
    this.groupCache.del(jid);
    this.#groupFetches.delete(jid);
  }

  #putGroupMetadata(metadata) {
    this.#invalidateGroup(metadata.id);
    this.groupCache.set(metadata.id, metadata);
  }

  #fatal(error, context) {
    if (this.#halted || this.#stopping) return;
    this.#halted = true;
    this.#connected = false;
    clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = null;
    this.inboundQueue.close();
    this.outbound.close();
    // #performStop observa esta mateixa promesa i només allibera el lock si
    // acaba satisfactòriament. Ací evitem una segona crida idempotent enganyosa.
    void this.#endSocket(this.#socket).catch(() => undefined);
    const wrapped = Object.assign(new Error(`${context}: ${error?.message || error}`), {
      cause: error,
      code: error?.code,
    });
    this.logger.fatal(errorSummary(wrapped), 'Transport WhatsApp aturat');
    this.#notify('onFatal', this.onFatal, wrapped);
    void this.stop('fatal').catch((stopError) => {
      this.logger.error(errorSummary(stopError), 'Teardown fatal incomplet');
    });
  }

  stop(reason = 'shutdown') {
    if (this.#stopPromise) return this.#stopPromise;
    this.#stopPromise = this.#performStop(reason);
    return this.#stopPromise;
  }

  async #performStop(reason) {
    this.#stopping = true;
    clearTimeout(this.#reconnectTimer);
    clearTimeout(this.#stableTimer);
    this.#reconnectTimer = null;
    this.inboundQueue.close();
    const deadline = Date.now() + this.config.shutdownTimeoutMs;
    const remaining = () => Math.max(0, deadline - Date.now());

    // #openSocket revalida #stopping després de cada await. Esperar-lo abans
    // d'alliberar el lock impedix crear una socket òrfena després del SIGTERM.
    const connecting = this.#connectPromise;
    let connectSettled = true;
    if (connecting) {
      connectSettled = await fulfillsBefore(connecting, remaining());
    }

    // Primer parem l'admissió d'entrada, però deixem acabar i enviar els jobs
    // ja admesos mentre la socket continue sana.
    const inboundDrained = await this.inboundQueue.drain(remaining());
    this.#allowOutbound = false;
    this.#connected = false;
    this.outbound.close();

    const queuesDrained = await fulfillsBefore(
      Promise.all([
        this.outbound.drain(),
        this.credsWriter.drain(),
        this.messageStore.drain(),
      ]),
      remaining(),
    );
    const socketEnded = await fulfillsBefore(
      this.#endSocket(this.#socket),
      Math.max(1, remaining()),
    );
    await new Promise((resolve) => setImmediate(resolve));
    const finalCredsDrained = await fulfillsBefore(
      this.credsWriter.drain(),
      Math.max(1, remaining()),
    ).catch(() => false);
    this.#socket = null;
    const drained =
      connectSettled &&
      inboundDrained &&
      queuesDrained &&
      socketEnded &&
      finalCredsDrained &&
      !this.#unsafeSocketClose &&
      !this.#credsError;
    // Si alguna part queda encallada, conservem el lock fins que el supervisor
    // mate el procés: alliberar-lo permetria dos propietaris de la mateixa
    // sessió i provocaria connectionReplaced.
    if (drained) {
      await this.instanceLock.release().catch((error) => {
        this.logger.warn(errorSummary(error), 'No s’ha pogut alliberar el lock de procés');
      });
    } else {
      await this.instanceLock.preserve().catch((error) => {
        this.logger.warn(errorSummary(error), 'No s’ha pogut preservar el lock de procés');
      });
    }
    this.logger.info({ reason, drained }, 'Transport WhatsApp tancat sense logout');
    if (this.#credsError) {
      throw Object.assign(new Error('Shutdown amb credencials no persistides'), {
        cause: this.#credsError,
        code: 'CREDS_NOT_SAVED',
      });
    }
    if (!drained) {
      throw Object.assign(new Error('Shutdown esgotà el temps de drenatge'), {
        code: 'SHUTDOWN_TIMEOUT',
      });
    }
  }
}

export async function createHardenedBaileysAdapter(options) {
  const adapter = new HardenedBaileysAdapter(options);
  await adapter.start();
  return adapter;
}

export function installShutdownHandlers(adapter) {
  let stopping = false;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    void adapter.stop(signal).then(
      () => {
        process.exitCode = 0;
      },
      (error) => {
        console.error('[WHATSAPP] Shutdown incomplet:', error.message);
        process.exitCode = 1;
      },
    );
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return () => {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  };
}
