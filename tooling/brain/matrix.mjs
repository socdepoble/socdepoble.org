import { prepara } from './context_documental.mjs';
export async function matrixCLI(args = process.argv.slice(2)) {
  try {
    const json = args.includes('--json');
    const unknown = args.filter(a => a.startsWith('--') && a !== '--json' && !a.startsWith('--protocol='));
    if (unknown.length) throw new Error(`Arguments desconeguts: ${unknown.join(', ')}`);
    const ids = args.filter(a => a.startsWith('--protocol=')).map(a => a.slice(11));
    const task = args.filter(a => !a.startsWith('--')).join(' ');
    const result = prepara(task, ids);
    // CLI de diagnòstic: no autoritza escriptures ni deixa rebuts al diari.
    console.log(json ? JSON.stringify(result, null, 2) : result.contingut);
    return 0;
  } catch (e) { console.error(`[MATRIX] ${e.message}`); return 2; }
}
process.exitCode = await matrixCLI();