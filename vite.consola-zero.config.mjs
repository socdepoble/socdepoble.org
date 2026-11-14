/* Onada R24 · Consola Zero (P-G de l'informe 261114 «consola_404_chunks») ·
   Embolcall de vite.config.js per al build sense xarxa de l'arnés
   (tooling/gates/consola-zero.mjs). Només el crida l'arnés, mai el build de
   producció:
     · envDir és una carpeta buida que l'arnés crea dins del seu scratch
       (SDP_CONSOLA_ZERO_ENVDIR, absoluta i sense cap .env*): cap .env real no
       entra al paquet. Les VITE_* sintètiques arriben pel process.env del
       fill que llança l'arnés, mai prefixades a la línia d'ordres.
     · Amb SDP_CONSOLA_ZERO_SAL, el connector afig una constant al final de
       src/main.jsx: l'entrada canvia de nom i, amb ella, la cascada de hashes
       de tots els trossos que n'importen (CA-3 de l'informe). Així es fabrica
       el build B d'un desfasament A→B sense tocar cap fitxer del repositori.
   La resta (connectors, trossos d'arrencada, cacheDir propi) és la de
   vite.config.js, sense cap canvi. 
   Onada R24.2 (Porta Cadena C5) · Viu a l'arrel, amb les altres configuracions
   de Vite: tooling/gates/ no importa cap paquet extern (Pedra Seca).
*/
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config.js';

export const VARIABLE_ENVDIR = 'SDP_CONSOLA_ZERO_ENVDIR';
export const VARIABLE_SAL = 'SDP_CONSOLA_ZERO_SAL';

/** La carpeta d'entorn ha de ser absoluta, existir i no tindre cap .env*. */
export function envDirBuit(valor) {
  if (typeof valor !== 'string' || !path.isAbsolute(valor)) {
    throw new Error(`${VARIABLE_ENVDIR} ha de ser un camí absolut (l'arnés el crea dins del seu scratch)`);
  }
  const estat = fs.lstatSync(valor, { throwIfNoEntry: false });
  if (!estat || !estat.isDirectory() || estat.isSymbolicLink()) throw new Error(`${VARIABLE_ENVDIR} no és una carpeta pròpia: ${valor}`);
  const envs = fs.readdirSync(valor).filter((nom) => nom.startsWith('.env'));
  if (envs.length) throw new Error(`${VARIABLE_ENVDIR} ha d'estar buida de .env*: ${envs.join(', ')}`);
  return valor;
}

/** El connector de la sal: una constant al final de l'entrada pròpia, i res més. */
export function connectorSal(sal) {
  return {
    name: 'sdp-consola-zero-sal',
    enforce: 'pre',
    transform(codi, id) {
      if (!sal || !id.split('?')[0].endsWith('/src/main.jsx')) return null;
      return { code: `${codi}\nglobalThis.__SDP_CONSOLA_ZERO_SAL__ = ${JSON.stringify(String(sal))};\n`, map: null };
    }
  };
}

export default defineConfig(async (entorn) => {
  if (entorn.command !== 'build') throw new Error('vite.consola-zero.config.mjs només serveix per a `vite build` (l’arnés servix el dist amb el seu servidor propi)');
  const envDir = envDirBuit(process.env[VARIABLE_ENVDIR]);
  const config = typeof base === 'function' ? await base(entorn) : base;
  return mergeConfig(config, { envDir, plugins: [connectorSal(process.env[VARIABLE_SAL] || '')] });
});
