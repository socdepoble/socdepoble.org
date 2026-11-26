/**
 * Sanejament R15 (B2 · P1-01, R15-REG-05, Q-06; B3 · P1-03, R15A-NAT-01) · Les
 * capacitats del kit R54 que depenen de peces de servidor que la producció encara
 * NO té (migracions 2611080430/0431/0432, funcions iaia i notifica-xat-desperta,
 * google-services.json i el compte de servei d'FCM) només s'encenen amb una
 * bandera de build explícita:
 *   VITE_SDP_XAT_RITME=1      ritme del xat (xat_ritme, xat_presencia) i el desvetllador
 *   VITE_SDP_IAIA_SERVIDOR=1  la IAIA amb servidor (funció iaia)
 *   VITE_SDP_PUSH_NATIU=1     el cicle de push natiu (FCM/APNs)
 *   VITE_SDP_COPUBLICACIO=1   co-publicació registrada (migració 2611111735)
 *   VITE_SDP_CONSENS_ISOGLOSSES=1  consens del joc «D'on parles?» (capacitat
 *                             consensIsoglosses; migracions R23 de la RPC
 *                             resum_consens_isoglosses_poble i de les seues taules)
 *   VITE_SDP_MUR_VISIBILITAT=1  v1.2.23 · costura bandera del Mur · la RPC7 del Mur
 *                             públic (llig_mur_public_v7, migració 20261122160300);
 *                             src/data/supabase/content.js la llig amb
 *                             `import.meta.env?.VITE_SDP_MUR_VISIBILITAT === '1'`,
 *                             i el define literal també plega eixe accés opcional
 *   VITE_SDP_XAT_CERCA=1      v1.2.25 · costures 8 i 9 · la cerca dins d'una conversa (capacitat
 *                             xatCerca; RPC xat_cerca_missatges_fil_v2 i xat_missatge_fil_per_id de la
 *                             migració 20261125010000, NO aplicada)
 *
 * En compilar, este connector les definix com a literals ('1' o ''), perquè el
 * codi que les mira (`import.meta.env.VITE_SDP_… === '1'`) es plegue i Rollup
 * deixe fora del paquet tot el que queda mort. Un valor que no és exactament '1'
 * (true, " 1", yes) compta com a apagat. En desenvolupament i a les proves no fa
 * res: vi.stubEnv les governa. És una fulla de Node: només importa node:path i vite.
 */
import path from 'node:path';
import { loadEnv } from 'vite';

/* v1.2.23 · costura bandera del Mur · VITE_SDP_MUR_VISIBILITAT entra a la llista: els builds web, natiu i WP la
   pleguen com a literal ('1' o ''), igual que les altres, en lloc de deixar-la a l'objecte import.meta.env del build.
   Apagada, negociaVisibilitatMur queda `() => false` i la lectura pública del Mur va directa a la RPC6. */
export const BANDERES_DE_CAPACITAT = Object.freeze(['VITE_SDP_XAT_RITME', 'VITE_SDP_IAIA_SERVIDOR', 'VITE_SDP_PUSH_NATIU', 'VITE_SDP_COPUBLICACIO', 'VITE_SDP_CONSENS_ISOGLOSSES', 'VITE_SDP_MUR_VISIBILITAT', 'VITE_SDP_XAT_CERCA']);

/** Els valors tal com els veu Vite: els .env de envDir i l'entorn del procés. */
export function valorsDeLesBanderes(config = {}, mode = 'production') {
  if (config.envDir === false) return Object.fromEntries(BANDERES_DE_CAPACITAT.map((nom) => [nom, String(process.env[nom] ?? '')]));
  const envDir = path.resolve(path.resolve(config.root ?? process.cwd()), config.envDir ?? '');
  const env = loadEnv(mode, envDir, 'VITE_SDP_');
  return Object.fromEntries(BANDERES_DE_CAPACITAT.map((nom) => [nom, String(env[nom] ?? '')]));
}

/** El `define` literal: '1' només si el valor és exactament '1'; si no, ''. */
export function defineDeLesBanderes(valors = {}) {
  return Object.fromEntries(BANDERES_DE_CAPACITAT.map((nom) => [`import.meta.env.${nom}`, JSON.stringify(valors[nom] === '1' ? '1' : '')]));
}

export default function banderesDeCapacitat() {
  return {
    name: 'sdp-banderes-de-capacitat',
    enforce: 'pre',
    config(config, { mode, command }) {
      if (command !== 'build') return null;
      return { define: defineDeLesBanderes(valorsDeLesBanderes(config, mode)) };
    }
  };
}
