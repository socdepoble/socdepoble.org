/**
 * serveiSafataDenunciesDiligents.js — Adaptador pur de vista per a la Safata
 * d'Administració de Denúncies Diligents (LSSI Art. 16 · Onada R32.17 · Lot 02 · D-R32.15-2).
 *
 * Regles d'arquitectura i seguretat:
 *  · Consumix exclusivament la capacitat opcional `denunciesDiligents` del port neutral
 *    (`teCapacitat`, `llistaDenunciesDiligents`, `revisaDenunciaDiligent`).
 *  · Zero spread JSONB insegur: cada camp remot o d'ampliació es coacciona primitivament.
 *  · Quan el mode és local o la capacitat remota no està disponible, ho informa
 *    explícitament (Llei 0) i mostra a part els avisos pendents de la cua local d'este dispositiu.
 *  · Manté i reutilitza un `operacioId` UUID v4 estable per a cada combinació
 *    `(id, versio, estat, justificacio)` per protegir contra doble clic i reintents de xarxa.
 */
import {
  llistaDenunciesDiligents as portLlistaDenunciesDiligents,
  revisaDenunciaDiligent as portRevisaDenunciaDiligent,
  teCapacitat as portTeCapacitat
} from '../../../data/backendPort.js';
import {
  ESTATS_DENUNCIA_DILIGENT,
  transicioDenunciaDiligentPermesa
} from '../../../data/moderacio/denunciesDiligents.js';
import { normalizeBackendConfig } from '../../../config/backendConfig.js';
import { nouIdOperacioDenuncia } from '../../../components/universal/enviaDenunciaLssi.js';
import { lligCuaDenunciesLocals } from '../../../components/universal/i18nDenunciaContingut.js';
import { normalitzaNfcSeguraUi } from '../../../utils/normalitzaEntradaUi.js';

export const FILTRES_SAFATA_LSSI = Object.freeze(['pendent', 'en_revisio', 'retirada', 'desestimada']);

const MAPA_FILTRE_A_ESTATS_PORT = Object.freeze({
  pendent: Object.freeze(['rebuda']),
  en_revisio: Object.freeze(['en_revisio']),
  retirada: Object.freeze(['ocultacio_cautelar', 'resolta']),
  desestimada: Object.freeze(['arxivada'])
});

const RE_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;
const RE_PREFIX_LSSI16 = /^\[LSSI-16:([a-z0-9_]{1,40})\]\s*/i;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AMPLIACIONS_LSSI = 5;
const MARGE_PREFIX_DETALL_LSSI = 1064;

function textSanejat(valor, max = 2000) {
  if (typeof valor !== 'string') return '';
  /* Gauntlet v1.2.13 · normalitzaNfcSeguraUi torna null per damunt del seu pressupost (llargària, marques combinants
     seguides o un surrogat solt). Una fila hostil o una justificació llarga no poden tombar la safata: el text es
     mostra sense normalitzar, sense caràcters de control i retallat a `max` punts de codi. */
  const nfc = normalitzaNfcSeguraUi(valor, { maxLongitud: max * 2 + 256 });
  const net = (nfc ?? valor).replace(RE_CONTROL, '').trim();
  if (!net) return '';
  return Array.from(net).slice(0, max).join('');
}

function dataIsoSegura(valor) {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();
  if (!t || t.length > 64) return null;
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? t : null;
}

function enterPositiuSegur(valor) {
  return Number.isSafeInteger(valor) && valor >= 1 && valor < 2147483647 ? valor : null;
}

function coaccionaAmpliacions(valor) {
  if (!Array.isArray(valor)) return Object.freeze([]);
  const netes = [];
  for (let i = 0; i < valor.length && netes.length < MAX_AMPLIACIONS_LSSI; i += 1) {
    const item = valor[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const detall = textSanejat(item.detall ?? item.text ?? '', 1000);
    if (!detall) continue;
    netes.push(Object.freeze({
      detall,
      creatAl: dataIsoSegura(item.creatAl ?? item.created_at ?? null)
    }));
  }
  return Object.freeze(netes);
}

/**
 * Coacciona primitivament una fila del DTO remot de `llistaDenunciesDiligents`,
 * preservant camps additius d'auditoria (`ampliacions`, `recompte`, `creatAl`)
 * sense fer mai spread d'objectes JSONB desconeguts.
 */
export function coaccionaFilaSafataRemota(cru) {
  if (!cru || typeof cru !== 'object' || Array.isArray(cru)) return null;
  const id = typeof cru.id === 'string' && RE_UUID.test(cru.id.trim()) ? cru.id.trim().toLowerCase() : '';
  const publicacioId = typeof cru.publicacioId === 'string' && RE_UUID.test(cru.publicacioId.trim())
    ? cru.publicacioId.trim().toLowerCase()
    : '';
  const estat = typeof cru.estat === 'string' && ESTATS_DENUNCIA_DILIGENT.includes(cru.estat) ? cru.estat : '';
  const versio = enterPositiuSegur(cru.versio);
  const motiuBase = textSanejat(cru.motiu, 64);
  if (!id || !publicacioId || !estat || versio === null || !motiuBase) return null;

  const detallComplet = textSanejat(cru.detall ?? '', MARGE_PREFIX_DETALL_LSSI);
  const mPrefix = RE_PREFIX_LSSI16.exec(detallComplet);
  const submotiuLssi = mPrefix ? mPrefix[1].toLowerCase() : null;
  const detallSensePrefix = mPrefix ? detallComplet.slice(mPrefix[0].length).trim() : detallComplet;
  const detallVisible = Array.from(detallSensePrefix).slice(0, 1000).join('');

  const recompte = enterPositiuSegur(cru.recompte ?? cru.recompteRebuts ?? null);
  const creatAl = dataIsoSegura(cru.creatAl ?? cru.created_at ?? cru.updatedAt ?? cru.updated_at ?? null);
  const ampliacions = coaccionaAmpliacions(cru.ampliacions ?? cru.ampliacionsAudit ?? null);

  return Object.freeze({
    id,
    publicacioId,
    motiu: motiuBase,
    submotiuLssi,
    detall: detallVisible,
    detallCru: detallComplet,
    estat,
    versio,
    creatAl,
    recompte,
    ampliacions
  });
}

export function estatsPortDeFiltre(filtre) {
  const clau = String(filtre || 'pendent').trim();
  if (Object.hasOwn(MAPA_FILTRE_A_ESTATS_PORT, clau)) return MAPA_FILTRE_A_ESTATS_PORT[clau];
  if (ESTATS_DENUNCIA_DILIGENT.includes(clau)) return Object.freeze([clau]);
  return MAPA_FILTRE_A_ESTATS_PORT.pendent;
}

export function accionsTransicioPermeses(estatActual) {
  return ESTATS_DENUNCIA_DILIGENT.filter((desti) => transicioDenunciaDiligentPermesa(estatActual, desti));
}

function esModeRemot(config) {
  try {
    return normalizeBackendConfig(config || {}).dataMode === 'remote';
  } catch {
    return false;
  }
}

function lligCuaLocalPendent() {
  return lligCuaDenunciesLocals()
    .filter((item) => item.estatSincronitzacio !== 'servidor')
    .map((item) => Object.freeze({
      denunciaId: textSanejat(item.denunciaId, 80),
      tipus: textSanejat(item.tipus, 40),
      recursId: textSanejat(item.recursId, 80),
      titol: textSanejat(item.titol, 160),
      motiu: textSanejat(item.motiu, 64),
      detall: textSanejat(item.detall, 1000),
      operacioId: typeof item.operacioId === 'string' && RE_UUID.test(item.operacioId) ? item.operacioId.toLowerCase() : null,
      creatAl: dataIsoSegura(item.creatAl)
    }));
}

/**
 * Carrega la safata d'administració LSSI combinant amb transparència Llei 0
 * les files remotes del port neutral i els avisos pendents en aquest dispositiu.
 */
export async function carregaSafataDenunciesDiligents(
  { filtre = 'pendent', limit = 50, config = null } = {},
  port = null
) {
  const api = port || {
    teCapacitat: portTeCapacitat,
    llistaDenunciesDiligents: portLlistaDenunciesDiligents
  };
  const limitSegur = Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : 50;
  const cuaLocalPendent = Object.freeze(lligCuaLocalPendent());

  let teCap = false;
  try {
    teCap = api.teCapacitat('denunciesDiligents') === true;
  } catch {
    teCap = false;
  }

  if (!esModeRemot(config) || !teCap) {
    return Object.freeze({
      mode: 'nomes-cua-local',
      disponibleRemot: false,
      motiuNoRemot: !esModeRemot(config) ? 'mode-local' : 'sense-capacitat',
      remotes: Object.freeze([]),
      cuaLocalPendent
    });
  }

  const estats = estatsPortDeFiltre(filtre);
  const perEstat = Math.max(1, Math.min(100, Math.floor(limitSegur / estats.length) || limitSegur));
  try {
    const llistes = await Promise.all(
      estats.map((estat) => api.llistaDenunciesDiligents({ estat, limit: perEstat }, config || {}))
    );
    const vistes = new Map();
    for (const grup of llistes) {
      if (!Array.isArray(grup)) continue;
      for (const cru of grup) {
        /* Gauntlet v1.2.13 · Una fila que no es pot coaccionar es descarta: les altres continuen arribant a la safata. */
        let neta = null;
        try { neta = coaccionaFilaSafataRemota(cru); } catch { neta = null; }
        if (neta && !vistes.has(neta.id)) vistes.set(neta.id, neta);
      }
    }
    return Object.freeze({
      mode: 'remot-i-cua-local',
      disponibleRemot: true,
      motiuNoRemot: null,
      remotes: Object.freeze([...vistes.values()]),
      cuaLocalPendent
    });
  } catch (err) {
    const codi = String(err?.code ?? err?.codi ?? '');
    if (codi === 'LSSI_DILIGENT_UNAVAILABLE') {
      return Object.freeze({
        mode: 'nomes-cua-local',
        disponibleRemot: false,
        motiuNoRemot: 'no-disponible',
        remotes: Object.freeze([]),
        cuaLocalPendent
      });
    }
    throw err;
  }
}

/**
 * Registra d'un sol colp idempotent una decisió motivada de revisió LSSI Art. 16.
 * Usa `registreOperacions` (Map opcional) per conservar el mateix `operacioId` UUID
 * en cas de reintent de la mateixa decisió i evitar duplicitats per doble clic o tall de xarxa.
 */
export async function aplicaRevisioDenunciaDiligent(
  {
    id,
    estatEsperat,
    versio,
    estat,
    justificacio,
    operacioId = null,
    config = null,
    registreOperacions = null
  } = {},
  port = null
) {
  const api = port || {
    teCapacitat: portTeCapacitat,
    revisaDenunciaDiligent: portRevisaDenunciaDiligent
  };

  const justificacioNeta = textSanejat(justificacio, 2000);
  if (!justificacioNeta) {
    throw Object.assign(new TypeError('Cal escriure una justificació motivada.'), {
      code: 'JUSTIFICACIO_OBLIGATORIA'
    });
  }
  if (!transicioDenunciaDiligentPermesa(estatEsperat, estat)) {
    throw Object.assign(new TypeError('Transició d’estat LSSI no permesa.'), {
      code: 'TRANSICIO_INVALIDA'
    });
  }

  let teCap = false;
  try {
    teCap = api.teCapacitat('denunciesDiligents') === true;
  } catch {
    teCap = false;
  }
  if (!esModeRemot(config) || !teCap) {
    throw Object.assign(new Error('La revisió diligent requerix el servidor remot actiu.'), {
      code: 'LSSI_DILIGENT_UNAVAILABLE'
    });
  }

  const clauIntent = `${String(id).toLowerCase()}:${versio}:${estat}:${justificacioNeta}`;
  let opUuid = typeof operacioId === 'string' && RE_UUID.test(operacioId) ? operacioId.toLowerCase() : null;
  if (!opUuid && registreOperacions instanceof Map) {
    opUuid = registreOperacions.get(clauIntent) || null;
  }
  if (!opUuid) {
    opUuid = nouIdOperacioDenuncia();
    if (!opUuid) {
      throw Object.assign(new Error('Generador criptogràfic UUID no disponible.'), {
        code: 'SENSE_UUID'
      });
    }
    if (registreOperacions instanceof Map) {
      registreOperacions.set(clauIntent, opUuid);
    }
  }

  const rebut = await api.revisaDenunciaDiligent(
    {
      id,
      estatEsperat,
      versio,
      estat,
      justificacio: justificacioNeta,
      operacioId: opUuid
    },
    config || {}
  );

  const rebutId = typeof rebut?.id === 'string' && RE_UUID.test(rebut.id.trim())
    ? rebut.id.trim().toLowerCase()
    : '';
  const rebutEstat = typeof rebut?.estat === 'string' && ESTATS_DENUNCIA_DILIGENT.includes(rebut.estat)
    ? rebut.estat
    : '';
  const rebutVersio = enterPositiuSegur(rebut?.versio);
  if (!rebutId || !rebutEstat || rebutVersio === null) {
    throw Object.assign(new Error('El servidor remot ha tornat un rebut de revisió invàlid.'), {
      code: 'REBUT_REVISIO_INVALID'
    });
  }

  if (registreOperacions instanceof Map) {
    registreOperacions.delete(clauIntent);
  }

  return Object.freeze({
    id: rebutId,
    estat: rebutEstat,
    versio: rebutVersio,
    repetida: rebut.repetida === true,
    operacioId: opUuid
  });
}
