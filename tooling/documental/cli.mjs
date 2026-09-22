import { arrel } from '../lib/arrel.mjs';
export const ROOT = arrel({desDe:import.meta.url});
export function options(args = process.argv.slice(2)) {
  const out = {_:[]};
  for (let i=0;i<args.length;i++) {
    if (!args[i].startsWith('--')) {out._.push(args[i]); continue;}
    const [key, ...value] = args[i].slice(2).split('=');
    out[key] = value.length ? value.join('=') : args[i+1] && !args[i+1].startsWith('--') ? args[++i] : true;
  }
  return out;
}
