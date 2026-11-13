/**
 * comunitatLocal.js — La comunitat de l'adaptador local (T1 · D01): perfils
 * públics, organitzacions, membres, correu de contacte, reclamacions, agents,
 * directori, titular, moderació, normes de convivència i seguiments.
 *
 * Compon localPerfils.js i localSeguiments.js (les instàncies d'este
 * adaptador), que ja fan de servidor en seed i local, amb les mateixes
 * entrades i els mateixos codis que l'adaptador Supabase (organizations.js,
 * perfils.js, seguiments.js). El magatzem de la moderació es porta de
 * supabase/moderacio.js i viu a la instància (e.moderacio): els seguiments
 * hi lligen els bloquejos de qui actua, i el compte l'exporta.
 *
 * Dos guardes que el servidor local compost no té i el remot sí:
 * updateOrganization i updateAgent només desen si qui crida administra
 * l'organització o l'agent (en remot, la RLS). Totes les eixides són còpies.
 */
import {
  CODI_MODERACIO, LIMIT_DIRECTORI_ENTITATS, TIPUS_BLOQUEIG_PUBLICACIO, VERSIO_NORMES_CONVIVENCIA, autorDelContracte, comDelContracte,
  denunciaDelContracte, destinatariaDeTransferencia, errorDeMembre, errorDeModeracio, errorDeTitular, membreDOrganitzacio,
  errorDeConnexions, subjecteConnexionsDelContracte, seguitDelContracte, titularDelContracte
} from '../contracte.js';
import { CODI_ENTRADA, ambCodi } from '../errorsBackend.js';
import { normalitzaCorreu, validaCorreu } from '../correuOrganitzacio.js';
import { esPobleImpossible, pobleDelFiltre } from '../pobleOrganitzacio.js';
import { entitatsDeLEstat } from '../dadesObertesLot.js';
/* L'UUID públic d'una publicació (desbloquejaAutor amb tipus 'publicacio'). */
const RE_UUID_PUBLICACIO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Els camps del port cap a les columnes d'organizations (organizations.js · updateOrganization). */
const CAMPS_ORGANITZACIO = Object.freeze({
  name: 'name', slug: 'slug', description: 'description', kind: 'kind', parentOrganizationId: 'parent_organization_id',
  lema: 'lema', logo_url: 'logo_url', visibility: 'visibility', presentacio_html: 'presentacio_html', hero_url: 'hero_url',
  hero_video_url: 'hero_video_url', copyright: 'copyright', town_name: 'town_name'
});
const LIMIT_JUSTIFICACIO = 1000;
const errorAmbCodi = (missatge, code) => Object.assign(new Error(missatge), { code });
const sensePermis = (missatge) => Object.assign(new Error(missatge), { status: 403 });
const limitDelDirectori = (valor) => {
  const n = Math.trunc(Number(valor));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, LIMIT_DIRECTORI_ENTITATS) : LIMIT_DIRECTORI_ENTITATS;
};
const clauDeBloqueig = ({ tipus, id }) => `${tipus}:${id}`;
/* T2 · D04/D10 · Una entitat restaurada (dadesObertesLot.js) amb la forma
   d'organization_directory, com les del padró local: les columnes que no
   porta, null, i cap visibility. Per a la consulta, el plegat del padró
   (localPerfils.js · plegaDelDirectori): minúscules, sense diacrítics ni
   punt volat. */
const COLUMNES_DIRECTORI = Object.freeze(['id', 'tenant_id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description',
  'created_at', 'updated_at', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name']);
const filaDeDirectori = (entitat) => Object.fromEntries(COLUMNES_DIRECTORI.map((columna) => [columna, entitat[columna] ?? null]));
const plega = (valor) => String(valor ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[\u00b7\u2027\u2219]/g, '').toLowerCase();
const casaAmbLaConsulta = (consulta) => {
  const paraules = plega(consulta).split(/[^\p{L}\p{N}'\u2019-]+/u).filter(Boolean);
  return (fila) => paraules.every((paraula) => [fila.name, fila.slug, fila.lema, fila.description].some((camp) => plega(camp).includes(paraula)));
};
const perNomIId = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ca') || String(a.id).localeCompare(String(b.id));

export function creaComunitatLocal(e) {
  const { perfils, seguiments, moderacio } = e;

  const exigixSessio = (error) => {
    const usuari = e.usuari();
    if (!usuari?.id) throw error();
    return usuari;
  };
  const bloquejosDe = (persona) => {
    if (!moderacio.bloquejos.has(persona)) moderacio.bloquejos.set(persona, new Map());
    return moderacio.bloquejos.get(persona);
  };

  /* FEDI23 · El poble només el governa l'autoritat explícita injectada.
     Els selectors de poble es resolen per id o slug, mai pel tenant de reserva. */
  const contextConnexions = async (operacio, dades, config = {}, gestio = false) => {
    const subjecte = subjecteConnexionsDelContracte(dades);
    const context = e.contextSeguiments();
    if (subjecte.tipus !== 'poble') return context;
    const declarats = e.opcions.administracioLocal?.pobles ?? [];
    const candidats = [...declarats, ...e.coleccio('towns').map(p => ({ id: String(p.id ?? ''), slug: p.slug, nom: p.nom ?? p.title ?? p.name }))];
    const poble = candidats.find(p => p.id === subjecte.id || p.slug === subjecte.id) ?? null;
    if (!poble) { if (gestio) throw errorDeConnexions('SDP-CONN-003'); return { ...context, poble: null }; }
    if (!gestio) return { ...context, poble };
    if (!context.usuari?.id) throw errorDeConnexions('SDP-CONN-000');
    const autoritat = e.opcions.administracioLocal;
    if (!autoritat || !declarats.some(p => p.id === poble.id)) throw errorDeConnexions('SDP-CONN-002');
    const comprova = e.abast();
    const permís = await autoritat.autoritza(Object.freeze({ personaId: String(context.usuari.id), operacio, tenantId: poble.id }));
    comprova();
    if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
    if (permís !== true) throw errorDeConnexions('SDP-CONN-002');
    return { ...context, poble, gestionaPoble: true };
  };

  const ambContextConnexions = async (operacio, subjecte, config, gestio, executa) => {
    const comprova = e.abast();
    const context = await contextConnexions(operacio, subjecte, config, gestio);
    // També per als contextos personals síncrons: await cedix una microtasca.
    // Una cancel·lació/canvi de sessió ha d'aturar-se abans de tocar el magatzem.
    comprova();
    if (config.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
    return e.copia(executa(context));
  };

  return {
    async preferenciesConnexions(dades, config = {}) {
      return ambContextConnexions('preferenciesConnexions', dades, config, true, context => seguiments.preferenciesConnexions(dades, context));
    },
    async desaVisibilitatConnexions(dades, config = {}) {
      return ambContextConnexions('desaVisibilitatConnexions', { tipus: dades.tipus, id: dades.id }, config, true, context => seguiments.desaVisibilitatConnexions(dades, context));
    },
    async connexionsPubliquesDe(dades, config = {}) {
      return ambContextConnexions('connexionsPubliquesDe', dades, config, false, context => seguiments.connexionsPubliquesDe(dades, context));
    },
    async membresIEntitatsConnectadesDe(dades, config = {}) {
      return ambContextConnexions('membresIEntitatsConnectadesDe', dades, config, false, context => seguiments.membresIEntitatsConnectadesDe(dades, context));
    },
    async inclouPersonaEnEntitat(dades) { return e.copia(seguiments.inclouPersonaEnEntitat(dades, e.contextSeguiments())); },
    async solicitaUnirSeAEntitat(dades) { return e.copia(seguiments.solicitaUnirSeAEntitat(dades, e.contextSeguiments())); },
    /* ── Organitzacions ── */
    async listMyOrganizations() {
      const usuari = e.usuari();
      return usuari?.id ? e.copia(perfils.listMyOrganizations(usuari)) : [];
    },

    /* El node local no crea organitzacions noves: la llavor les porta i l'alta
       real és del servidor (organizations.js, mode local). */
    async createOrganization() {
      throw ambCodi(new Error('Inicia sessió des del formulari d’entrada abans de crear una organització al servidor.'), CODI_ENTRADA.MODE_LOCAL);
    },

    async updateOrganization(id, updates = {}) {
      const canvis = {};
      for (const [origen, desti] of Object.entries(CAMPS_ORGANITZACIO)) if (updates?.[origen] !== undefined) canvis[desti] = updates[origen];
      if (!Object.keys(canvis).length) throw new Error('Cap camp de l’organització per desar.');
      const usuari = e.usuari();
      const meues = usuari?.id ? perfils.listMyOrganizations(usuari) : [];
      if (!meues.some((org) => String(org.id) === String(id))) throw sensePermis("No s'ha pogut actualitzar l'organització.");
      return e.copia(perfils.updateOrganization(id, canvis));
    },

    /* T2 · D04/D10 · Amb les entitats que s'hi han restaurat (una restaurada
       substituïx la del padró amb el mateix id), el mateix ordre i el mateix límit. */
    async listPublicOrganizations(filtre = {}) {
      const consulta = typeof filtre?.consulta === 'string' ? filtre.consulta.trim() : '';
      const poble = pobleDelFiltre(filtre?.poble);
      if (poble && esPobleImpossible(poble)) return [];
      const limit = limitDelDirectori(filtre?.limit);
      const restaurades = entitatsDeLEstat(e.dadesObertes.estat, { nom: poble }).filter(casaAmbLaConsulta(consulta)).map(filaDeDirectori);
      if (!restaurades.length) return e.copia(perfils.listPublicOrganizations({ consulta, limit, ...(poble ? { poble } : {}) }));
      const ids = new Set(restaurades.map((fila) => String(fila.id)));
      const delPadro = perfils.listPublicOrganizations({ consulta, ...(poble ? { poble } : {}) }).filter((fila) => !ids.has(String(fila.id)));
      return e.copia([...delPadro, ...restaurades].sort(perNomIId).slice(0, limit));
    },

    async loadPerfilPublic(idOSlug) {
      const clau = String(idOSlug ?? '').trim();
      if (!clau) return null;
      return e.copia(perfils.loadPerfilPublic(clau, e.usuari()) ?? null);
    },

    /* ── Agents IA ── */
    async listMyAgents() {
      const usuari = e.usuari();
      return usuari?.id ? e.copia(perfils.listMyAgents(usuari)) : [];
    },

    async updateAgent(id, updates = {}) {
      const usuari = e.usuari();
      const meus = usuari?.id ? perfils.listMyAgents(usuari) : [];
      if (!meus.some((agent) => String(agent.id) === String(id))) throw sensePermis("No s'ha pogut actualitzar l'agent.");
      return e.copia(perfils.updateAgent(id, updates ?? {}));
    },

    /* ── Reclamacions i correu de contacte ── */
    async reclamaOrganitzacio(orgId, opcions = {}) {
      const usuari = exigixSessio(() => errorAmbCodi('Cal iniciar sessió per a administrar una organització.', 'SDP-CLAIM-000'));
      const justificacio = String(opcions?.justificacio ?? '').trim().slice(0, LIMIT_JUSTIFICACIO);
      return e.copia(perfils.reclamaOrganitzacio(orgId, usuari, { justificacio }));
    },

    async lesMevesReclamacions() {
      const usuari = e.usuari();
      return usuari?.id ? e.copia(perfils.lesMevesReclamacions(usuari)) : [];
    },

    async llegeixContacteOrganitzacio(orgId) {
      const usuari = exigixSessio(() => errorAmbCodi('Cal iniciar sessió.', 'SDP-ORGMAIL-000'));
      return e.copia(perfils.llegeixContacteOrganitzacio(orgId, usuari));
    },

    async desaContacteOrganitzacio(orgId, dades = {}) {
      const usuari = exigixSessio(() => errorAmbCodi('Cal iniciar sessió.', 'SDP-ORGMAIL-000'));
      const correu = normalitzaCorreu(dades?.correu ?? '');
      if (correu && !validaCorreu(correu)) throw errorAmbCodi('Escriu un correu vàlid, com ara forn@exemple.cat.', 'CORREU-INVALID');
      return e.copia(perfils.desaContacteOrganitzacio(orgId, { correu, public: dades?.public === true }, usuari));
    },

    /* ── Membres d'una organització ── */
    async llistaMembresOrganitzacio(orgId) {
      const usuari = exigixSessio(() => errorDeMembre('SDP-ORGMEM-000'));
      return e.copia(perfils.llistaMembresOrganitzacio(orgId, usuari));
    },

    async desaMembreOrganitzacio(orgId, dades = {}) {
      const usuari = exigixSessio(() => errorDeMembre('SDP-ORGMEM-000'));
      return e.copia(perfils.desaMembreOrganitzacio(orgId, membreDOrganitzacio(dades), usuari));
    },

    async llevaMembreOrganitzacio(orgId, dades = {}) {
      const usuari = exigixSessio(() => errorDeMembre('SDP-ORGMEM-000'));
      return e.copia(perfils.llevaMembreOrganitzacio(orgId, membreDOrganitzacio(dades, { ambRol: false }), usuari));
    },

    /* IDEA-24 (marató 261101_2143, B4) · La transferència atòmica de la
       propietat (capacitat 'transferenciaPropietat'): la mateixa regla
       d'entrada que l'adaptador Supabase (destinatariaDeTransferencia) i les
       regles de localPerfils, que canvia els dos rols en un sol pas síncron. */
    async transfereixPropietatOrganitzacio(orgId, dades = {}) {
      const usuari = exigixSessio(() => errorDeMembre('SDP-ORGMEM-000'));
      const destinataria = destinatariaDeTransferencia(dades);
      return e.copia(perfils.transfereixPropietatOrganitzacio(orgId, destinataria.id, usuari));
    },

    /* ── La titular que ha triat mostrar-se ── */
    async loadTitularPublic(orgId) {
      const clau = String(orgId ?? '').trim();
      const usuari = e.usuari();
      if (!clau || !usuari?.id) return null;
      return titularDelContracte(perfils.loadTitularPublic(clau, usuari, { bloquejos: e.bloquejosDe(e.qui()) }));
    },

    async estatTitularPublic(orgId) {
      const usuari = exigixSessio(() => errorDeTitular('SDP-TIT-000'));
      return e.copia(perfils.estatTitularPublic(String(orgId ?? '').trim(), usuari));
    },

    async marcaTitularPublic(orgId, titularPublic) {
      if (typeof titularPublic !== 'boolean') throw errorDeTitular('SDP-TIT-002');
      const usuari = exigixSessio(() => errorDeTitular('SDP-TIT-000'));
      return e.copia(perfils.marcaTitularPublic(String(orgId ?? '').trim(), titularPublic, usuari));
    },

    /* ── Moderació (supabase/moderacio.js, branca local): qui actua és la
       sessió o el convidat; la denúncia val també sense sessió. ── */
    async denunciaContingut(dades = {}) {
      const denuncia = denunciaDelContracte(dades);
      const qui = String(e.qui());
      const { tipus, id } = denuncia.objecte;
      const repetida = moderacio.denuncies.some((d) => d.qui === qui && d.tipus === tipus && d.id === id);
      if (!repetida) moderacio.denuncies.push({ qui, tipus, id, motiu: denuncia.motiu, detall: denuncia.detall,
        autor: denuncia.autor, filId: denuncia.filId, creatAl: e.ara().toISOString() });
      return { rebuda: true, repetida };
    },

    async llistaBloquejos() {
      return e.copia(e.bloquejosDe(e.qui()));
    },

    async bloquejaAutor(dades = {}) {
      const autor = autorDelContracte(dades);
      const qui = String(e.qui());
      if (autor.tipus === 'persona' && autor.id === qui) throw errorDeModeracio(CODI_MODERACIO.AUTOBLOQUEIG);
      const meus = bloquejosDe(qui);
      const ja = meus.get(clauDeBloqueig(autor));
      if (ja) return e.copia(ja);
      const bloqueig = { ...autor, creatAl: e.ara().toISOString() };
      meus.set(clauDeBloqueig(autor), bloqueig);
      return e.copia(bloqueig);
    },

    /* Gauntlet R22 (sql-01) · El contracte accepta { tipus: 'publicacio', id: UUID }
       (el bloqueig opac de 2611122200). Este magatzem no en fa cap: un UUID vàlid
       no desbloqueja res ({ desbloquejat: false }); un altre id, OBJECTIU_INVALID. */
    async desbloquejaAutor(dades = {}) {
      if (dades?.tipus === TIPUS_BLOQUEIG_PUBLICACIO) {
        if (!RE_UUID_PUBLICACIO.test(String(dades.id ?? '').trim())) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
        return { desbloquejat: false };
      }
      const autor = autorDelContracte(dades, { ambNom: false });
      return { desbloquejat: Boolean(moderacio.bloquejos.get(String(e.qui()))?.delete(clauDeBloqueig(autor))) };
    },

    /* ── Normes de convivència (contracte: sense sessió, acceptadaAl null i 'sense-sessio') ── */
    async estatNormes() {
      const usuari = e.usuari();
      const desat = usuari?.id ? moderacio.normes.get(String(usuari.id)) : null;
      return { versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: desat?.versio === VERSIO_NORMES_CONVIVENCIA ? desat.acceptadaAl : null };
    },

    async acceptaNormes(versio) {
      if (versio !== VERSIO_NORMES_CONVIVENCIA) throw errorDeModeracio(CODI_MODERACIO.VERSIO_INVALIDA);
      const usuari = exigixSessio(() => errorDeModeracio(CODI_MODERACIO.SENSE_SESSIO));
      const estat = { versio, acceptadaAl: e.ara().toISOString() };
      moderacio.normes.set(String(usuari.id), estat);
      return { ...estat };
    },

    /* ── Seguiments (supabase/seguiments.js, branca local) ── */
    async segueix(dades = {}) {
      const seguit = seguitDelContracte(dades);
      return e.copia(seguiments.segueix({ ...seguit, com: comDelContracte(dades) }, e.contextSeguiments()));
    },

    async deixaDeSeguir(dades = {}) {
      const seguit = seguitDelContracte(dades);
      return e.copia(seguiments.deixaDeSeguir({ ...seguit, com: comDelContracte(dades) }, e.contextSeguiments()));
    },

    async estatSeguiment(dades = {}) {
      const seguit = seguitDelContracte(dades);
      return e.copia(seguiments.estatSeguiment({ ...seguit, com: comDelContracte(dades) }, e.contextSeguiments()));
    },

    async elsMeusSeguiments() {
      return e.copia(seguiments.elsMeusSeguiments(e.contextSeguiments()));
    },

    async quiEmSegueix(opcions = {}) {
      const orgId = opcions?.orgId ?? null;
      const entitat = orgId !== null && orgId !== '' ? seguitDelContracte({ tipus: 'entitat', id: orgId }).id : null;
      return e.copia(seguiments.quiEmSegueix({ orgId: entitat }, e.contextSeguiments()));
    }
  };
}
