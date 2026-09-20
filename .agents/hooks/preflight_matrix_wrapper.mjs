import fs from 'node:fs';
import { prepara, identitatTorn, desaEmissio, invalidaEmissio, emet } from '../../tooling/brain/context_documental.mjs';
import { avis } from '../../tooling/brain/termometre_context.mjs';
try {
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!Number.isInteger(payload.invocationNum) || payload.invocationNum < 1) throw new Error('invocationNum invàlid');
  if (payload.invocationNum !== 1) {
    await emet(JSON.stringify({ injectSteps: [] }) + '\n');
  } else {
    const identity = identitatTorn(payload);
    invalidaEmissio(identity);
    const febre = avis(payload.transcriptPath);
    if (febre) throw new Error(febre.missatge);
    const ids = payload.matrixProtocols ?? [];
    const context = prepara(identity.task, ids);
    // No trunquem fonts: si el host té un límit, s'ha de fixar explícitament en bytes.
    const limit = Number(process.env.SDP_MAX_CONTEXT_BYTES || 1048576);
    if (!Number.isSafeInteger(limit) || limit <= 0 || Buffer.byteLength(context.contingut) > limit)
      throw new Error('Context complet excedix el límit configurat');
    await emet(JSON.stringify({ injectSteps: [{ ephemeralMessage: context.contingut }] }) + '\n');
    // Prova d'emissió al pipe. No és prova de recepció o comprensió del model.
    desaEmissio(context, identity, ids);
  }
} catch (e) { console.error(`[MATRIX] ${e.message}`); process.exitCode = 1; }