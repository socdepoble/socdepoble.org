import {capturaEdicioEditorial,CLAU_EDITORIAL_DE_SECCIO,marcaFilesEditorials,aplicaCanvisEditorials} from '../editorialPublicada.js';
import { capturaConsultaRevisionsSeed, capturaRevisioSeed, capturaRespostaRevisioSeed, aplicaRevisionsSeed, errorRevisioSeed, esFontPublicaRevisioSeed, marcaFontRevisioSeed } from '../seedRevisions.js';
import { capturaConsultaProjeccionsCataleg, capturaCursorProjeccionsCataleg, creaCursorProjeccionsCataleg, projeccioCatalegDe, errorProjeccioCataleg } from '../projeccionsCataleg.js';
/**
 * contingutLocal.js — El contingut del poble de l'adaptador local (T1 · D01):
 * loadCoreContent, el Mur, la Multimèdia, la pàgina de secció, l'agenda, les
 * publicacions dels veïns i la personalització del poble.
 *
 * Porta, sense la branca remota, supabase/content.js (publicacions i
 * seccions) i supabase/personalitzacio.js (versions i historial). Les
 * publicacions viuen en un magatzem d'esta instància: és el camí d'escriptura
 * d'una restauració. Totes les eixides són còpies.
 */
import { SECCIONS_PAGINABLES } from '../contracte.js';
import { getDefaultUserId } from '../identitat.js';
import { elementDeFilaPublicada, mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { CODI_PERSONALITZACIO, errorDePersonalitzacio } from '../errorsBackend.js';
import { poblesDeLEstat, totesDeLEstat } from '../dadesObertesLot.js';
import { unioPerId } from './dadesObertesLocal.js';
import { hidrataCatalegAgents } from '../catalegAgents.js';
import { normalitzaFilesEditorials } from '../contingutEditorialPublic.js';

const SECCIONS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);
/* La secció de cada llista de loadMur i de loadMultimedia (content.js). */
const SECCIO_DE_LA_LLISTA = Object.freeze({ feedPosts: 'mur', events: 'events', marketItems: 'mercat', mediaItems: 'multimedia' });
const LIMIT_SECCIO = 50;
const CLAUS_PERSONALITZACIO = Object.freeze(['taxonomia', 'estil']);
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
/* El text de supabase/utils.js per a un 403: una publicació d'una altra persona. */
const SENSE_PERMIS = 'No tens permís per a realitzar aquesta acció.';

const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/* L'instant (ms) d'un moment de l'agenda: un Date, un dia 'AAAA-MM-DD' (la
   mitjanit local, com el calendari) o un text ISO. null si no ho és. */
function instantDe(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.getTime();
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const dia = DIA.exec(valor.trim());
  if (dia) return new Date(Number(dia[1]), Number(dia[2]) - 1, Number(dia[3])).getTime();
  const ms = Date.parse(valor);
  return Number.isNaN(ms) ? null : ms;
}

/* JSON finit i sense accessors, capturat abans d'esperar. El sostre de
   65536 bytes també compta espais estructurals com jsonb::text al servidor.
   Profunditat/nodes limiten el treball abans de serialitzar. */
export function capturaPayloadPersonalitzacioLocal(payload) {
  const invalid = () => { throw errorDePersonalitzacio(CODI_PERSONALITZACIO.DESCONEGUT); };
  const vistos = new Set(); let nodes = 0, espais = 0, expansioNumerica = 0;
  const copia = (valor, nivell) => {
    if (++nodes > 10000 || nivell > 32) invalid();
    if (valor === null || typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
      if (valor.length > 65536 || valor.includes('\u0000')) invalid();
      for (let i = 0; i < valor.length; i++) {
        const n = valor.charCodeAt(i);
        if (n >= 0xd800 && n <= 0xdbff) { const seguent = valor.charCodeAt(++i); if (!(seguent >= 0xdc00 && seguent <= 0xdfff)) invalid(); }
        else if (n >= 0xdc00 && n <= 0xdfff) invalid();
      }
      return valor;
    }
    if (typeof valor === 'number') {
      if (!Number.isFinite(valor)) invalid();
      const text = String(valor), exp = /e([+-]?\d+)$/i.exec(text);
      if (exp) { const decimals = text.indexOf('.') < 0 ? 0 : text.indexOf('e') - text.indexOf('.') - 1;
        const e = Number(exp[1]), digits = text.slice(0, text.indexOf('e')).replace(/[-.]/g, '').length;
        const llarga = (valor < 0 ? 1 : 0) + (e >= decimals ? digits + e - decimals : e < 0 ? 2 - e - 1 + digits : digits + 1);
        expansioNumerica += Math.max(0, llarga - text.length);
      }
      return valor;
    }
    if (!valor || typeof valor !== 'object' || vistos.has(valor) || Object.getOwnPropertySymbols(valor).length) invalid();
    const array = Array.isArray(valor), proto = Object.getPrototypeOf(valor);
    if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) invalid();
    vistos.add(valor);
    const descriptors = Object.getOwnPropertyDescriptors(valor), claus = Object.keys(descriptors).filter(k => !(array && k === 'length'));
    if (array && (claus.length !== valor.length || claus.some((k, i) => k !== String(i)))) invalid();
    espais += Math.max(0, claus.length - 1) + (array ? 0 : claus.length);
    const resultat = array ? [] : {};
    for (const clau of claus) {
      const d = descriptors[clau];
      if (!Object.hasOwn(d, 'value') || !d.enumerable || ['__proto__', 'constructor', 'prototype'].includes(clau)) invalid();
      copia(clau, nivell + 1);
      Object.defineProperty(resultat, clau, { value: copia(d.value, nivell + 1), enumerable: true, writable: true, configurable: true });
    }
    vistos.delete(valor); return resultat;
  };
  if (!esObjectePla(payload) || Array.isArray(payload)) invalid();
  const resultat = copia(payload, 0);
  if (new TextEncoder().encode(JSON.stringify(resultat)).length + espais + expansioNumerica > 65536) invalid();
  return resultat;
}
const RE_TENANT_LOCAL = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const errorAdministracioLocal = (code) => Object.assign(new Error(code === 'no-disponible' ? 'Cal injectar autoritat local explícita.' : code === 'sense-sessio' ? 'Cal iniciar sessió.' : code === 'abast-invalid' ? 'Cal un tenant explícit i coherent.' : 'L’autoritat local no autoritza esta operació.'), { code });

export function creaContingutLocal(e) {
  /* id → { id, sectionId, ownerUserId, authorOrgId, title, description, createdAt, updatedAt, payload } */
  const publicacions = new Map();
  /* tenantId → Map(clau → { actual: { payload, versio }, historial: [{ versio, payload, creat, autor }] }) */
  const personalitzacions = new Map();
  const editorials = new Map();
  const revisionsSeed = e.revisionsLlavor?.actuals ?? new Map();
  const autoriaRevisionsSeed = e.revisionsLlavor?.autoria ?? new Map();
  const editorialDe=clau=>{if(!editorials.has(clau))editorials.set(clau,{items:e.copia(e.coleccio(clau)),versio:1});return editorials.get(clau);};
  const fontSeedPublica = (seccio, id) => {
    const sources = editorialDe(CLAU_EDITORIAL_DE_SECCIO[seccio]).items.filter(item => item.id === id);
    return sources.length === 1 && esFontPublicaRevisioSeed(sources[0]) ? sources[0] : null;
  };
  /* B4-S1 · La versió editorial només viatja quan l'edició és possible (política
     administracioLocal injectada): sense ella, el local i Supabase en mode seed
     tornen exactament les mateixes dades (conformitat.equivalencia). */
  const versioVisible=versio=>(e.opcions.administracioLocal?versio:null);
  e.alTancar(() => { publicacions.clear(); personalitzacions.clear(); editorials.clear(); revisionsSeed.clear(); autoriaRevisionsSeed.clear(); });

  /* Els actes de l'agenda es validen una vegada: un acte que el calendari no
     sabria pintar (sense id o sense inici) no entra al node. */
  const actes = e.coleccio('actesAgenda').map((acte) => {
    if (!esObjectePla(acte) || acte.id === undefined || acte.id === null || instantDe(acte.inici) === null) {
      throw new TypeError('[adaptadorLocal] Cada acte de l’agenda necessita id i inici.');
    }
    return acte;
  });

  const magatzemDe = tenantId => personalitzacions.get(tenantId);
  const personalitzacio = (tenantId = e.configuracio.tenantId) => Object.fromEntries(CLAUS_PERSONALITZACIO.map((clau) => {
    const actual = magatzemDe(tenantId)?.get(clau)?.actual;
    return [clau, actual ? { payload: e.copia(actual.payload), versio: actual.versio } : null];
  }));

  /* Les publicacions d'una secció, de la més nova a la més vella (estable amb empats), amb el mapatge del port. */
  const publicacionsDe = (seccio) => [...publicacions.values()]
    .filter((fila) => fila.sectionId === seccio)
    .sort((a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : a.id > b.id ? -1 : 0) : (a.createdAt < b.createdAt ? 1 : -1)))
    .map((fila) => elementDeFilaPublicada({ id: fila.id, payload: e.copia(fila.payload), titol: fila.title,
      createdAt: fila.createdAt, updatedAt: fila.updatedAt, ownerUserId: fila.ownerUserId, authorOrgId: fila.authorOrgId,
      /* IDEA-61 (T0, prompt 261102_1532; L1-A3) · La secció de la fila, no la del payload. */
      sectionId: fila.sectionId }));
  /* T2 · D04/D10 · Les notícies i els actes restaurats (dadesObertesLocal.js) són de l'administració del node. */
  const RESTAURADES_DE_LA_LLISTA = Object.freeze({ feedPosts: 'noticies', events: 'agenda' });
  /* La llista de l'administració (llavor o dades, amb el que s'hi ha restaurat) i, si n'hi ha, les dels veïns, com content.js. */
  const llista = (clau) => {
    const restaurada = RESTAURADES_DE_LA_LLISTA[clau];
    const editorial=editorialDe(clau);
    const seccioSeed = clau === 'feedPosts' ? 'mur' : clau === 'events' ? 'events' : null;
    const revisades = seccioSeed ? aplicaRevisionsSeed(editorial.items, [...revisionsSeed.values()].filter(row => row.seccio === seccioSeed && fontSeedPublica(row.seccio, row.id)), editorial.versio) : editorial.items;
    /* Àrbitre R11 (R33-L2-01) · La font de la revisió viatja amb la mateixa política que _editorialVersio. */
    const originals=marcaFilesEditorials(seccioSeed ? marcaFontRevisioSeed(revisades, versioVisible(editorial.versio)) : revisades,clau,versioVisible(editorial.versio));
    const base = restaurada ? unioPerId(originals, totesDeLEstat(e.dadesObertes.estat, restaurada)) : originals;
    const veins = publicacionsDe(SECCIO_DE_LA_LLISTA[clau]);
    return normalitzaFilesEditorials(veins.length ? mergeById(base, veins) : base);
  };
  /* T2 · D04/D10 · Els pobles de la llavor (o de `dades`) i els restaurats que no hi són (per id o slug). */
  const pobles = () => {
    const base = e.copia(e.coleccio('towns'));
    const coneguts = new Set(base.flatMap((poble) => [poble?.id, poble?.slug]).filter((clau) => typeof clau === 'string'));
    const restaurats = poblesDeLEstat(e.dadesObertes.estat).filter((poble) => !coneguts.has(poble.slug))
      .map((poble) => ({ id: poble.slug, slug: poble.slug, name: poble.nom, title: poble.nom }));
    return normalitzaFilesEditorials([...base, ...restaurats]);
  };

  const clauValida = (clau) => {
    const nom = String(clau ?? '').trim();
    if (!CLAUS_PERSONALITZACIO.includes(nom)) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CLAU_INVALIDA);
    return nom;
  };
  const usuariDeLaSessio = () => {
    const usuari = e.usuari();
    if (!usuari?.id) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.SENSE_SESSIO);
    return usuari;
  };
  /* El node local no té segon factor (aal2): el contracte només deixa desar
     amb ell, i el magatzem obert és una tria explícita de qui el crea. */
  const exigixSegonFactor = () => {
    if (!e.opcions.personalitzacioOberta) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CAL_SEGON_FACTOR);
  };

  /* Cap selecció administrativa passa per ci(): no es reserva al tenant
     propi davant d'un selector absent, contradictori o desconegut. */
  const tenantSeleccionat = (config = {}, obligatori = true) => {
    const presents = ['tenantId', 'tenant_id'].filter(k => Object.hasOwn(config, k) && config[k] !== undefined);
    if (!presents.length) { if (obligatori) throw errorAdministracioLocal('abast-invalid'); return e.configuracio.tenantId; }
    if (presents.some(k => typeof config[k] !== 'string' || !RE_TENANT_LOCAL.test(config[k]))) throw errorAdministracioLocal('abast-invalid');
    const id = config[presents[0]].toLowerCase();
    if (presents.some(k => config[k].toLowerCase() !== id)) throw errorAdministracioLocal('abast-invalid');
    return id;
  };
  const comprova = (abast, config) => { abast(); if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError'); };
  const autoritzaLocal = async (operacio, tenantId, config) => {
    const abast = e.abast(); comprova(abast, config);
    const autoritat = e.opcions.administracioLocal;
    if (!autoritat) throw errorAdministracioLocal('no-disponible');
    const personaId = e.usuari()?.id;
    if (!personaId) throw errorAdministracioLocal('sense-sessio');
    if (tenantId !== null && !autoritat.pobles.some(p => p.id === tenantId)) throw errorAdministracioLocal('sense-permis');
    const resultat = await autoritat.autoritza(Object.freeze({ personaId, operacio, tenantId }));
    comprova(abast, config);
    if (resultat !== true) throw errorAdministracioLocal('sense-permis');
    return { personaId, comprova: () => comprova(abast, config) };
  };
  const preparaPersonalitzacio = async (operacio, config) => {
    const tenantId = tenantSeleccionat(config, e.opcions.administracioLocal !== null);
    if (e.opcions.administracioLocal) return { tenantId, ...await autoritzaLocal(operacio, tenantId, config) };
    /* El ganxo antic obert només afecta el tenant propi; mai autoritza B. */
    if (tenantId !== e.configuracio.tenantId) throw errorAdministracioLocal('sense-permis');
    const usuari = usuariDeLaSessio(); exigixSegonFactor();
    const abast = e.abast();
    return { tenantId, personaId: usuari.id, comprova: () => comprova(abast, config) };
  };

  return {
    async loadCoreContent(ownerUserId = getDefaultUserId()) {
      return {
        towns: pobles(), pages: marcaFilesEditorials(editorialDe('pages').items,'pages',versioVisible(editorialDe('pages').versio)), pageCopy: {},
        // Seed reads share the same canonical catalogue as the Supabase seed
        // port. A real local node keeps its own catalogue and authority.
        agents: e.mode === 'seed' ? hidrataCatalegAgents(e.copia(e.coleccio('agents'))) : e.copia(e.coleccio('agents')),
        ownerUserId, personalitzacio: personalitzacio()
      };
    },

    /* Sense `paginacio`: el node local servix totes les publicacions a la primera pàgina. */
    async loadMur() {
      return { feedPosts: llista('feedPosts'), events: llista('events'), marketItems: llista('marketItems') };
    },

    async loadMultimedia() {
      return { mediaItems: llista('mediaItems') };
    },

    /* Contracte (paginacioSeccions): sense servidor, cap pàgina més. Este node
       no emet mai cap cursor, i un cursor que no és seu no val. */
    async loadSeccioPage({ seccio, cursor = null, limit = LIMIT_SECCIO } = {}) {
      if (!Object.hasOwn(SECCIONS_PAGINABLES, seccio)) throw new Error('Esta secció no es pagina.');
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > LIMIT_SECCIO) throw new Error('Límit de la secció invàlid.');
      if (cursor !== null) throw new Error('Cursor de la secció invàlid per a este àmbit.');
      return { elements: [], complete: true, nextCursor: null };
    },

    /* Els actes que toquen el rang semiobert [desde, fins): comencen abans de
       `fins` i acaben (o comencen, si no tenen fi) a partir de `desde`. */
    async loadActesAgenda({ desde, fins } = {}) {
      const inici = instantDe(desde);
      const final = instantDe(fins);
      if (inici === null || final === null || inici > final) throw new TypeError('Rang de l’agenda invàlid.');
      return e.copia(actes.filter((acte) => {
        const comenca = instantDe(acte.inici);
        const acaba = instantDe(acte.fi) ?? comenca;
        return comenca < final && acaba >= inici;
      }));
    },

    /* supabase/content.js · appendSectionSubmissionNetworkOnly, sense xarxa:
       la publicació es desa en este node. Upsert per id (mai duplicats); la
       d'una altra persona no es toca. Una entitat només signa si qui publica
       l'administra (la regla de M18 al servidor). 'notes' es desa però no es llista. */
    async loadProjeccionsCataleg(input = {}) {
      const query = capturaConsultaProjeccionsCataleg(input);
      const ownerId = query.audiencia === 'privada' ? e.usuari()?.id?.toLowerCase() : null;
      if (query.audiencia === 'privada' && !ownerId) throw errorProjeccioCataleg('sense-sessio');
      const scope = { tenantId: e.configuracio.tenantId.toLowerCase(), ownerId, audiencia: query.audiencia };
      const cursor = capturaCursorProjeccionsCataleg(query.cursor, scope);
      const seccio = query.audiencia === 'privada' ? 'notes' : 'mur';
      const rows = publicacionsDe(seccio).map(row => ({ ...row, sectionId: seccio }))
        .filter(row => projeccioCatalegDe(row)?.audiencia === query.audiencia && (!ownerId || row.ownerUserId.toLowerCase() === ownerId))
        .filter(row => !cursor || row.created_at < cursor.instant || (row.created_at === cursor.instant && row.id < cursor.id))
        .slice(0, query.limit);
      return { items: rows, cursor: rows.length ? creaCursorProjeccionsCataleg(rows.at(-1), scope) : null };
    },
    async appendSectionSubmissionNetworkOnly(submission) {
      /* Este node no declara revocacioPublicacions ni una transacció comuna
         entre Notes persistents i el Mur en memòria. Un descriptor atòmic
         mai es degrada a l’upsert legacy: tampoc una consulta pot escriure. */
      if (submission && (typeof submission === 'object' || typeof submission === 'function')
          && ['noteId', 'operationId', 'expectedNoteRevision', 'consulta'].some(key => key in submission)) {
        throw Object.assign(new Error('Este node local no oferix publicació atòmica de notes.'), { code: 'no-disponible' });
      }
      const ownerUserId = e.usuari()?.id;
      if (!ownerUserId) throw new Error('Cal iniciar sessió per publicar.');
      const sectionId = String(submission?.sectionId || '').trim();
      if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
      const id = String(submission?.id || e.nouId());
      const basePayload = esObjectePla(submission?.payload) ? submission.payload : {};
      const actor = submission?.actor;
      if (actor?.tipus === 'entitat' && !actor.id) throw new Error('Falta l’entitat que signa la publicació.');
      const authorOrgId = actor?.tipus === 'entitat' ? String(actor.id) : null;
      if (authorOrgId && !e.perfils.listMyOrganizations(e.usuari()).some((org) => String(org.id) === authorOrgId)) {
        throw Object.assign(new Error(SENSE_PERMIS), { status: 403 });
      }
      const previa = publicacions.get(id);
      if (previa && previa.ownerUserId !== ownerUserId) throw Object.assign(new Error(SENSE_PERMIS), { status: 403 });
      /* R56 · Les mateixes invariants que section_submissions al servidor:
         reintentar o republicar no redaten ni mouen la fila a una altra
         secció. La comprovació precedix qualsevol canvi al magatzem. */
      if (previa && previa.sectionId !== sectionId) {
        throw Object.assign(new Error('SDP-SEC-002: section_id is immutable'), { code: 'P0001', status: 400 });
      }
      const createdAt = previa?.createdAt || submission?.createdAt || e.ara().toISOString();
      const payload = mapSectionSubmissionToItem({ ...submission, id, ownerUserId, sectionId, createdAt,
        payload: { ...basePayload, id, ownerUserId, sectionId, created_at: basePayload.created_at || createdAt } });
      /* Sense actor (una crida d'abans d'I2), la signatura que ja tenia es conserva. */
      const signatura = actor ? authorOrgId : previa?.authorOrgId ?? null;
      const stored = { id, ownerUserId, authorOrgId: signatura, sectionId, title: submission?.title || payload.title || '',
        description: submission?.description || payload.description || payload.summary || '', createdAt, payload };
      publicacions.set(id, e.copia({ ...stored, updatedAt: e.ara().toISOString() }));
      return e.copia(stored);
    },

    /* FEDI-16 · Només el catàleg injectat és administrable; no són els
       pobles públics de loadCoreContent ni els d'una restauració oberta. */
    async adminActualitzaPublicacioEditorial(input,config={}){
      const edicio=capturaEdicioEditorial(input),tenantId=tenantSeleccionat(config,false);
      if(tenantId!==e.configuracio.tenantId)throw errorAdministracioLocal('sense-permis');
      const autoritat=await autoritzaLocal('adminActualitzaPublicacioEditorial',tenantId,config);
      autoritat.comprova();
      const clau=CLAU_EDITORIAL_DE_SECCIO[edicio.seccio],actual=editorialDe(clau);
      if(actual.versio!==edicio.versio)throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CONFLICTE_VERSIO);
      const matches=actual.items.filter(item=>item.id===edicio.id);
      if(matches.length!==1)throw errorAdministracioLocal('no-disponible');
      const item={...aplicaCanvisEditorials(matches[0],edicio.canvis,edicio.seccio),updated_at:e.ara().toISOString()};
      actual.items=actual.items.map(v=>v.id===edicio.id?item:v);actual.versio++;
      return {item:marcaFilesEditorials([item],clau,actual.versio)[0],versio:actual.versio};
    },
    async loadSeedRevisions(input, config = {}) {
      const query = capturaConsultaRevisionsSeed(input), tenantId = tenantSeleccionat(config, false);
      if (tenantId !== e.configuracio.tenantId) throw errorRevisioSeed('sense-permis');
      const sourceVersion = editorialDe(CLAU_EDITORIAL_DE_SECCIO[query.seccio]).versio;
      return e.copia([...revisionsSeed.values()].filter(row => row.seccio === query.seccio && query.ids.includes(row.id) && row.fontVersio === sourceVersion && fontSeedPublica(row.seccio, row.id)));
    },
    async desaRevisioSeed(input, config = {}) {
      const revision = capturaRevisioSeed(input), tenantId = tenantSeleccionat(config, false), checkScope = e.abast();
      if (tenantId !== e.configuracio.tenantId) throw errorRevisioSeed('sense-permis');
      const actor = e.usuari()?.id;
      if (!actor) throw errorRevisioSeed('sense-sessio');
      const source = fontSeedPublica(revision.seccio, revision.id);
      if (!source) throw errorRevisioSeed('no-disponible');
      const sourceVersion = editorialDe(CLAU_EDITORIAL_DE_SECCIO[revision.seccio]).versio;
      if (sourceVersion !== revision.fontVersio) throw errorRevisioSeed('conflicte-versio');
      if (source.owner_user_id !== actor || source.author_org_id) {
        const authority = await autoritzaLocal('desaRevisioSeed', tenantId, config);
        authority.comprova();
      }
      comprova(checkScope, config);
      if (editorialDe(CLAU_EDITORIAL_DE_SECCIO[revision.seccio]).versio !== sourceVersion || !fontSeedPublica(revision.seccio, revision.id)) throw errorRevisioSeed('conflicte-versio');
      const key = `${revision.seccio}:${revision.id}`, previous = revisionsSeed.get(key);
      /* Àrbitre R11 (R33-L2-02) · Mateix CAS que l'SQL: sobre el parell (font, versió); una font nova comença a 0. */
      const vigent = previous?.fontVersio === revision.fontVersio ? previous.versio : 0;
      if (vigent !== revision.versio) throw errorRevisioSeed('conflicte-versio');
      const row = { ...revision, camps: { ...(vigent ? previous.camps : {}), ...revision.camps }, versio: revision.versio + 1 };
      /* R33-L2-03 · La fila fusionada ha de ser llegible: ni més llarga ni més gran que el que accepta el lector. */
      capturaRespostaRevisioSeed(row);
      const previousAuthor = autoriaRevisionsSeed.get(key), now = e.ara().toISOString();
      revisionsSeed.set(key, e.copia(row));
      autoriaRevisionsSeed.set(key, { id: previousAuthor?.id ?? e.nouId(), authorId: actor,
        authorPayload: { ...(previousAuthor?.authorId === actor && previous?.fontVersio === revision.fontVersio ? previousAuthor.authorPayload : {}), ...revision.camps },
        createdAt: previousAuthor?.createdAt ?? now, updatedAt: now });
      return e.copia(row);
    },
    async adminLlistaPobles(config = {}) {
      tenantSeleccionat(config, false);
      const autoritat = await autoritzaLocal('adminLlistaPobles', null, config);
      autoritat.comprova();
      return e.opcions.administracioLocal.pobles.map(poble => ({ ...poble }));
    },
    async adminLligPersonalitzacio(config = {}) {
      const tenantId = tenantSeleccionat(config);
      const autoritat = await autoritzaLocal('adminLligPersonalitzacio', tenantId, config);
      autoritat.comprova(); return personalitzacio(tenantId);
    },

    async adminDesaPersonalitzacio({ clau, payload, versio } = {}, config = {}) {
      const nom = clauValida(clau);
      const net = capturaPayloadPersonalitzacioLocal(payload);
      const esperada = versio == null ? 0 : versio;
      if (!Number.isSafeInteger(esperada) || esperada < 0) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.DESCONEGUT);
      const autoritat = await preparaPersonalitzacio('adminDesaPersonalitzacio', config);
      autoritat.comprova();
      const magatzem = magatzemDe(autoritat.tenantId) ?? new Map();
      const entrada = magatzem.get(nom) ?? { actual: null, historial: [] };
      const actual = entrada.actual?.versio ?? 0;
      if (esperada !== actual) throw errorDePersonalitzacio(CODI_PERSONALITZACIO.CONFLICTE_VERSIO);
      const nova = { payload: net, versio: actual + 1 };
      const registre = { versio: nova.versio, payload: e.copia(net), creat: e.ara().toISOString(), autor: String(autoritat.personaId) };
      autoritat.comprova();
      entrada.actual = nova; entrada.historial.push(registre);
      magatzem.set(nom, entrada); personalitzacions.set(autoritat.tenantId, magatzem);
      return { clau: nom, payload: e.copia(net), versio: nova.versio };
    },

    async adminHistorialPersonalitzacio(clau, config = {}) {
      const nom = clauValida(clau);
      const autoritat = await preparaPersonalitzacio('adminHistorialPersonalitzacio', config);
      autoritat.comprova();
      return [...(magatzemDe(autoritat.tenantId)?.get(nom)?.historial ?? [])].reverse().map(registre => e.copia(registre));
    }
  };
}
