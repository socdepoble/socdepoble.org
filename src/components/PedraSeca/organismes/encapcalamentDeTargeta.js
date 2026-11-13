/**
 * encapcalamentDeTargeta.js — la capçalera de lectura d'UniversalCard
 * (autoria, poble, data i hora, sense inventar-ne cap) com a peça de la
 * Pedra Seca (R21.6).
 *
 * La pinten també les apps que es compilen com a mòdul (la Nevera,
 * l'esquelet comú del Bar i de la Nevera, el tauler de la Gestoria): el cos
 * d'un mòdul la pren de SocDePoble.nucli.pedraSeca (nucli 1.6.0,
 * src/apps/plataforma/contracteNucli.js), que nomena cada nom pel seu fitxer
 * de Pedra Seca. Este és el fitxer d'este nom.
 *
 * La implementació és una de sola, la de la font editorial compartida
 * (components/universal/editorial.js, que UniversalCard ja porta): ací es
 * publica la MATEIXA funció, sense embolcall. Una funció pura: cap dada del
 * backend, cap sessió, cap context de la pàgina.
 */
import { encapcalamentDeTargeta as encapcalamentEditorial } from '../../universal/editorial.js';

export const encapcalamentDeTargeta = encapcalamentEditorial;
