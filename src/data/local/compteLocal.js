/**
 * compteLocal.js — La sessió i el compte de l'adaptador local (T1 · D01):
 * sessió, entrada, perfil propi, recuperació, salut, administració, segon
 * factor, compte (RGPD arts. 17 i 20) i consentiment (art. 7).
 *
 * La identitat és la de l'app (identitat.js): la sessió local naix fora del
 * port (sessioPilot.js, en desenvolupament) o, a les proves, amb desaSessio.
 * Per això tota l'entrada real (contrasenya, Google, enllaç, testimoni de
 * proveïdor i recuperació) rebutja amb el codi 'mode-local', com
 * supabase/auth.js en seed i local, sense tocar la sessió. El segon factor no
 * hi és ('no-disponible') i la llista de factors és buida.
 *
 * El compte i el consentiment viuen en memòria, per persona, i es porten de
 * supabase/compte.js amb les seues formes: la baixa és la quarantena de 30
 * dies de la migració 2609261500, i un consentiment revocat afig un acte
 * nou, mai n'esborra cap (art. 7.3).
 */
import { CODI_ENTRADA, CODI_SEGON_FACTOR, ambCodi, errorDeSegonFactor } from '../errorsBackend.js';
import { actualitzaUsuariSessio, adoptaSessioExterna, esborraSessio, getDefaultUserId, usuariDeSessio } from '../identitat.js';
import { oblidaRecuperacioPendent } from '../recuperacioPendent.js';
import { emojiSol } from '../../utils/emoji.js';
import { FORMA_USERNAME, MINIM_USERNAME, errorDUsername, normalitzaUsername } from '../../sections/onboarding/onboardingModel.js';

const FORMAT_EXPORTACIO = 'socdepoble.exportacio.v1';
/* El v_dies per defecte de la quarantena (2609261500_rgpd_compte_i_consentiment.sql). */
const DIES_DE_QUARANTENA = 30;
const DIA_MS = 24 * 60 * 60 * 1000;
const SENSE_BAIXA = Object.freeze({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
/* Els tipus del CHECK de consentiments (2609150000). */
const TIPUS_CONSENTIMENT = Object.freeze(['rgpd_acepta', 'marketing_butlleti', 'analitica']);
/* Les columnes de profiles que es poden desar i les que viatgen a la sessió (auth.js). */
const CAMPS_PERFIL = Object.freeze(['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public', 'lema', 'presentacio_html', 'hero_url', 'copyright', 'icon']);
const CAMPS_METADATA = Object.freeze(['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public']);

const modeLocal = () => ambCodi(new Error('L’entrada real encara s’està preparant. Recarrega el formulari d’entrada.'), CODI_ENTRADA.MODE_LOCAL);
const segonFactorAbsent = () => errorDeSegonFactor(CODI_SEGON_FACTOR.NO_DISPONIBLE);
const rebuigs = (noms, error) => Object.fromEntries(noms.map((nom) => [nom, async () => { throw error(); }]));
const ambIconNormalitzat = (updates) => (updates?.icon === undefined ? updates : { ...updates, icon: emojiSol(updates.icon) || null });

export function creaCompteLocal(e) {
  /* persona → { demanadaAl, motiu } */
  const baixes = new Map();
  /* persona → [{ tipus, accio, versio, al }], en ordre, sense esborrar mai res */
  const consentiments = new Map();
  e.alTancar(() => { baixes.clear(); consentiments.clear(); });

  const exigixSessio = () => {
    const usuari = e.usuari();
    if (!usuari?.id) throw new Error('Cal iniciar sessió.');
    return usuari;
  };
  const estatDeBaixa = (persona) => {
    const baixa = baixes.get(persona);
    if (!baixa) return { ...SENSE_BAIXA };
    return { demanada: true, demanadaAl: baixa.demanadaAl,
      purgaPrevistaAl: new Date(Date.parse(baixa.demanadaAl) + DIES_DE_QUARANTENA * DIA_MS).toISOString() };
  };
  /* L'últim acte de cada tipus, com estat_consentiment. */
  const darrersActes = (persona) => {
    const darrers = new Map();
    for (const acte of consentiments.get(persona) ?? []) darrers.set(acte.tipus, acte);
    return [...darrers.values()].map((acte) => ({ ...acte }));
  };
  const afigActe = (persona, acte) => {
    if (!consentiments.has(persona)) consentiments.set(persona, []);
    consentiments.get(persona).push(acte);
    return { ...acte };
  };

  /* desa_el_meu_usuari en local: la forma es mira ací, la resta la regla de localPerfils. */
  function desaElMeuUsername(valor) {
    const username = normalitzaUsername(valor);
    if (username.length < MINIM_USERNAME || !FORMA_USERNAME.test(username)) throw errorDUsername('SDP-USER-001');
    const usuari = e.usuari();
    if (!usuari?.id) throw errorDUsername('SDP-USER-000');
    const resposta = e.perfils.desaElMeuUsername(usuari, username);
    if (resposta?.desat === true && typeof resposta.usuari === 'string') {
      return { id: usuari.id, username: resposta.usuari,
        username_confirmat_at: typeof resposta.confirmat_al === 'string' ? resposta.confirmat_al : e.ara().toISOString() };
    }
    if (resposta?.desat === false && resposta.motiu === 'ocupat') {
      throw errorDUsername('ocupat', { proposta: typeof resposta.proposta === 'string' ? resposta.proposta : null });
    }
    throw errorDUsername('DESCONEGUT');
  }

  async function updateProfile(entrada) {
    if (entrada && typeof entrada === 'object' && Object.hasOwn(entrada, 'username')) {
      const { username, ...resta } = entrada;
      const fila = desaElMeuUsername(username);
      return Object.keys(resta).length ? { ...(await updateProfile(resta)), ...fila } : fila;
    }
    const updates = ambIconNormalitzat(entrada);
    const usuari = e.usuari();
    if (!usuari?.id) throw new Error('Cal iniciar sessió per a desar la fitxa.');
    const segurs = {};
    for (const camp of CAMPS_PERFIL) if (updates?.[camp] !== undefined) segurs[camp] = updates[camp];
    const fila = e.perfils.updateProfile(usuari, segurs);
    const metadades = {};
    for (const camp of CAMPS_METADATA) if (segurs[camp] !== undefined) metadades[camp] = segurs[camp];
    if (Object.keys(metadades).length) actualitzaUsuariSessio(metadades);
    return e.copia(fila);
  }

  /* Buida la sessió d'esta pestanya, oblida la recuperació en curs, tanca els
     canals del Xat d'esta instància i ho avisa (auth.js · tanca, sense revocació). */
  async function logout(_config, { scope = 'local', abast = 'actor' } = {}) {
    if (scope === 'others') return;
    esborraSessio({ abast: abast === 'pestanya' ? 'pestanya' : 'actor' });
    if (abast !== 'pestanya') oblidaRecuperacioPendent();
    await e.tancaCanals();
    globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  }

  return {
    /* ── Sessió (síncrones les quatre primeres) ── */
    getCurrentUser: () => usuariDeSessio(),
    getDefaultUserId: () => getDefaultUserId(),
    getRuntimeDataMode: () => e.mode,
    getBackendConfigurat: () => false,
    adoptaSessioExterna,
    async refrescaSessio() { return false; },
    async elMeuRol() { return e.usuari()?.id ? 'usuari' : null; },
    logout,
    async getProfile() {
      const usuari = e.usuari();
      return usuari?.id ? e.copia(e.perfils.getProfile(usuari)) : null;
    },
    updateProfile,

    /* ── L'entrada real és del servidor ── */
    ...rebuigs(['loginWithMagicLink', 'registerWithPassword', 'loginWithPassword', 'loginWithGoogle', 'recullTornadaOAuth',
      'updateUserPassword', 'demanaRecuperacioContrasenya', 'definixContrasenyaNova', 'entraAmbTokenDeProveidor'], modeLocal),

    /* ── Salut i administració: cap servidor ni cap superadmin local ── */
    async comprovaServidor() { return { ok: false }; },
    /* FEDI-16 · Un node local no publica cap mínim de botiga ni fa transport. */
    async versioMinimaClient() { return null; },
    async adminListUsers() { return []; },
    async adminListOrganizations() { return []; },

    /* ── Segon factor ── */
    async llistaFactors() { return []; },
    ...rebuigs(['inscriuFactor', 'reptaFactor', 'verificaFactor', 'retiraFactor'], segonFactorAbsent),

    /* ── Compte ── */
    async estatBaixa() {
      return estatDeBaixa(String(exigixSessio().id));
    },

    /* La baixa i, després, l'eixida de totes les sessions (de millor esforç):
       una baixa ja demanada conserva la seua data. */
    async demanaBaixa(opcions = {}, config = {}) {
      const persona = String(exigixSessio().id);
      const motiu = typeof opcions?.motiu === 'string' && opcions.motiu.trim() ? opcions.motiu.trim() : null;
      if (!baixes.has(persona)) baixes.set(persona, { demanadaAl: e.ara().toISOString(), motiu });
      const resultat = estatDeBaixa(persona);
      await logout(config, { scope: 'global' }).catch(() => {});
      return resultat;
    },

    async cancelaBaixa() {
      baixes.delete(String(exigixSessio().id));
      return { ...SENSE_BAIXA };
    },

    /* La portabilitat (art. 20): només les dades de la persona de la sessió,
       les notes en tots els estats (també la paperera i l'arxiu).
       PC155-01 · L'abast (persona, entrada i tancament) es captura abans
       d'esperar i es torna a mirar en tornar: un canvi de persona, una entrada
       nova o un destroy() en vol no lliuren res. Tot el que no espera es llig
       en el mateix tram que exigixSessio, i els seguiments amb el context de
       la persona capturada, mai el de la sessió viva. El format no canvia.
       La guarda de l'adaptador ja ha mirat l'abast de la crida abans d'entrar
       ací (AMB_ABAST_EN_CRIDAR, PC155-01-A1). */
    async exportaLesMeuesDades(config = {}) {
      const usuari = exigixSessio();
      const persona = String(usuari.id);
      const vigent = e.abast();
      const normes = e.moderacio.normes.get(persona) ?? null;
      const propies = e.copia({
        perfil: e.perfils.getProfile(usuari),
        seguiments: e.seguiments.elsMeusSeguiments(e.contextSeguiments(usuari)),
        bloquejos: e.bloquejosDe(persona),
        normes: normes ? { versio: normes.versio, acceptadaAl: normes.acceptadaAl } : null,
        consentiments: consentiments.get(persona) ?? [],
        seed_revisions: [...(e.revisionsLlavor?.actuals ?? new Map()).entries()].flatMap(([key, row]) => {
          const metadata = e.revisionsLlavor.autoria.get(key);
          return metadata?.authorId === persona ? [{ id: metadata.id, tenant_id: e.configuracio.tenantId, section: row.seccio,
            seed_id: row.id, payload: metadata.authorPayload, version: row.versio, source_version: row.fontVersio, author_id: persona,
            created_at: metadata.createdAt, updated_at: metadata.updatedAt }] : [];
        }),
        baixa: estatDeBaixa(persona)
      });
      const lectura = await e.notes.load(persona, e.ci(config));
      vigent();
      return e.copia({
        format: FORMAT_EXPORTACIO, node: 'local', generatAl: e.ara().toISOString(),
        perfil: propies.perfil,
        notes: lectura.notes || [],
        seguiments: propies.seguiments,
        bloquejos: propies.bloquejos,
        normes: propies.normes,
        consentiments: propies.consentiments,
        seed_revisions: propies.seed_revisions,
        baixa: propies.baixa
      });
    },

    /* ── Consentiment ── */
    async estatConsentiment() {
      const persona = String(exigixSessio().id);
      const politica = e.opcions.politica;
      const versioVigent = typeof politica?.versio === 'string' && politica.versio ? politica.versio : null;
      const actes = darrersActes(persona);
      const rgpd = actes.find((acte) => acte.tipus === 'rgpd_acepta');
      return {
        versioVigent, url: typeof politica?.url === 'string' && politica.url ? politica.url : null,
        textSha256: typeof politica?.textSha256 === 'string' && politica.textSha256 ? politica.textSha256 : null,
        consentiments: actes,
        calReconsentir: !(rgpd?.accio === 'accepta' && rgpd.versio === versioVigent)
      };
    },

    async registraConsentiment(tipus, versio) {
      if (!TIPUS_CONSENTIMENT.includes(tipus)) throw new TypeError('Tipus de consentiment invàlid.');
      if (versio !== null && versio !== undefined && typeof versio !== 'string') throw new TypeError('Versió de la política invàlida.');
      const persona = String(exigixSessio().id);
      return afigActe(persona, { tipus, accio: 'accepta', versio: versio || null, al: e.ara().toISOString() });
    },

    async revocaConsentiment(tipus) {
      if (typeof tipus !== 'string' || !tipus.trim()) throw new Error('Cal indicar quin consentiment es revoca.');
      if (!TIPUS_CONSENTIMENT.includes(tipus.trim())) throw new TypeError('Tipus de consentiment invàlid.');
      const persona = String(exigixSessio().id);
      afigActe(persona, { tipus: tipus.trim(), accio: 'revoca', versio: null, al: e.ara().toISOString() });
    }
  };
}
