// Worker de proves: la regex antiga no pot bloquejar el runner fins que acabe.
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
const module = await import(pathToFileURL(workerData.module).href);
const text = workerData.pattern.repeat(workerData.length);
const start = performance.now();
const result = workerData.method === 'textPla' ? module.textPla(text, 160)
  : workerData.method === 'campBuit' ? module.campBuit(text)
  : workerData.method === 'extreuEditorial' ? module.extreuEditorial('# ' + text).titol.slice(0, 160)
  : workerData.method === 'extreuEditorialSuffix' ? module.extreuEditorial('# ' + text + 'x#').titol.slice(0, 160)
  : module.pobleAllowsIndex('/pobles/prova', { contingut_local_verificat: true, content: text });
parentPort.postMessage({ result, elapsedMs: performance.now() - start });
