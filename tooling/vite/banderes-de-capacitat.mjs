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
 *
 * En compilar, este connector les definix com a literals ('1' o ''), perquè el
 * codi que les mira (`import.meta.env.VITE_SDP_… === '1'`) es plegue i Rollup
 * deixe fora del paquet tot el que queda mort. Un valor que no és exactament '1'
 * (true, " 1", yes) compta com a apagat. En desenvolupament i a les proves no fa
 * res: vi.stubEnv les governa. És una fulla de Node: només importa node:path i vite.
 */
import path from 'node:path';
import { loadEnv } from 'vite';

export const BANDERES_DE_CAPACITAT = Object.freeze(['VITE_SDP_XAT_RITME', 'VITE_SDP_IAIA_SERVIDOR', 'VITE_SDP_PUSH_NATIU', 'VITE_SDP_COPUBLICACIO']);

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
