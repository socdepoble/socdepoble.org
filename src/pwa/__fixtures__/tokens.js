/* Proves de la PWA (Fase 0, 261003) · els valors dels tokens de Pedra Seca es
   lligen de la font (src/css/tokens.css i design-tokens.css), no s'escriuen a
   mà a les proves: així la prova diu «és el token», no «és este hex». */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FONTS = ['src/css/tokens.css', 'src/css/design-tokens.css']
  .map((ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8'))
  .join('\n');

/** Valor d'un token: la PRIMERA declaració (el bloc clar de :root) i seguint var(). */
export function valorDelToken(nom, vistos = new Set()) {
  if (vistos.has(nom)) throw new Error(`Cicle de tokens: ${nom}`);
  vistos.add(nom);
  // El nom és [a-z0-9-]: no cal escapar-lo. Davant, cap caràcter de nom (no és el sufix d'un altre).
  const declaracio = new RegExp(`(?:^|[^a-z0-9-])${nom}\\s*:\\s*([^;]+);`, 'm').exec(FONTS);
  if (!declaracio) throw new Error(`Token absent: ${nom}`);
  const valor = declaracio[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const referencia = /^var\((--[a-z0-9-]+)\)$/i.exec(valor);
  return referencia ? valorDelToken(referencia[1], vistos) : valor.toLowerCase();
}

/** Tots els colors hexadecimals declarats com a valor directe d'algun token. */
export function paletaDeTokens() {
  return new Set([...FONTS.matchAll(/--[a-z0-9-]+\s*:\s*(#[0-9a-f]{3,8})\b/gi)].map((m) => m[1].toLowerCase()));
}
