/**
 * index.ts · T5 (P1-07, 261024) · La funció `noticies` del backend (Supabase
 * Edge Functions): l'embolcall de Deno.serve i prou. Tota la lògica és a
 * gestor.js (pur, provat a gestor.test.js) i la llista blanca, a fonts.json.
 *
 * Cap secret: és un servei públic de només lectura.
 * Es desplega sense verificar el JWT (el Lector el crida sense sessió):
 *   supabase functions deploy noticies --no-verify-jwt
 * El desplegament és del Mestre, mai d'un agent (supabase/README.md,
 * «Funció `noticies` (lector territorial)»).
 *
 * T5b i D-08 de Codex (261024) · Les fonts personals (?url=) passen per ací
 * també, però APAGADES per defecte. R6 L-12 (261024, Lector final): les
 * imatges dels hosts que no són del catàleg ni dels seus CDN, també. Només es
 * lligen tres variables, i cap és un secret:
 *   SDP_NOTICIES_PERSONALS         només '1' les encén; sense valor, o un altre, apagades
 *   SDP_NOTICIES_IMATGES_EXTERNES  només '1' encén les imatges de fora del catàleg;
 *                                  sense valor, o un altre, apagades (403 imatge_de_fora)
 *   SUPABASE_URL                   la posa la plataforma; només se'n pren el host, que
 *                                  cap adreça de fora no pot demanar
 * El resoledor de noms és Deno.resolveDns si l'entorn el té (un nom que no
 * existix, NotFound, és cap resposta; qualsevol altre error, no es baixa res).
 * Si no el té, el gestor TANCA les personals (503 personals_sense_dns) i les
 * imatges de fora dels hosts del catàleg (503 imatge_sense_dns): mai «sense
 * resoledor, és pública». T1 (261024_1800): amb resoledor, també es resolen
 * els hosts aprovats (el catàleg i els seus CDN), i una resposta privada, una
 * família fallada o cap adreça els veta; sense, valen per la llista blanca nativa
 * (HOSTS_DEL_SISTEMA, gestor.js).
 * Abans d'encendre unes o altres, el Mestre ha de
 * tancar el DNS rebinding amb un egrés aïllat (README). Cap registre: ni la consola ni
 * l'adreça demanada.
 */
/* global Deno */
import cataleg from './fonts.json' with { type: 'json' };
import { creaGestor } from './gestor.js';

const variable = (nom: string): string | null => {
  try {
    return Deno.env.get(nom) ?? null;
  } catch {
    return null;
  }
};

const hostDe = (adreca: string | null): string | null => {
  try {
    return adreca ? new URL(adreca).hostname : null;
  } catch {
    return null;
  }
};

const resolDns = typeof Deno.resolveDns === 'function'
  ? async (host: string, tipus: 'A' | 'AAAA', { signal }: { signal?: AbortSignal } = {}): Promise<string[]> => {
    try {
      return await Deno.resolveDns(host, tipus, { signal });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return [];
      throw error;
    }
  }
  : null;

const gestiona = creaGestor({
  cataleg,
  personals: variable('SDP_NOTICIES_PERSONALS') === '1',
  imatgesExternes: variable('SDP_NOTICIES_IMATGES_EXTERNES') === '1',
  resolDns,
  hostsVetats: [hostDe(variable('SUPABASE_URL'))].filter((host): host is string => Boolean(host))
});

Deno.serve((peticio, info) => gestiona(peticio, info));
