/** Public operator capability descriptor. Never contains or hashes the HMAC key.
 * Rotation requires a new key ID and explicit historical checkpoint migration.
 */
import os from 'node:os';
import path from 'node:path';
export const MIRROR_AUTH_KEY_ID='node0-r8-local-1';
export const MIRROR_AUTH_ALGORITHM='HMAC-SHA256';
export function autenticitatMirallLocal(homeDir=os.homedir()){
 if(typeof homeDir!=='string'||!path.isAbsolute(homeDir)||path.resolve(homeDir)!==homeDir||/[\p{Cc}\p{Cf}\\]/u.test(homeDir))throw Error('mirror_authentication_invalid');
 return Object.freeze({keyFile:path.join(homeDir,'.config/socdepoble/workspace-mirror-authentication.bin'),keyId:MIRROR_AUTH_KEY_ID});
}
