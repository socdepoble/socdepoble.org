/**
 * esborranys.js — El text a mig escriure de cada conversa (torn 260930, T1),
 * com a les apps de missatgeria: canvies de xat i, en tornar, el camp
 * conserva el que hi havies deixat.
 *
 * Magatzem en memòria (un Map) per clau. La clau la dona XatSection
 * (`clauEsborrany` = `ambitEstable::fil`, d'useXat()), perquè el text d'una
 * persona o d'un actor no aparega en un altre. Revisió adversarial 260930
 * (P2): la clau ja no porta la generació del JWT, que puja a cada renovació i
 * deixava els esborranys en claus que ningú no tornava a llegir. No toca cap
 * emmagatzematge persistent ni ix del navegador: recarregar la pàgina el
 * buida, i `buidaEsborranys` el buida en calent (XatContext, quan canvia la
 * persona: eixir o entrar; i les proves).
 * Onada R24 (CODEX-R24-13) · Mentre hi ha cap esborrany, el mòdul ho marca al
 * registre de l'estat pendent (src/pwa/estatsPendents.js, només la clau del
 * proveïdor, cap text): la recuperació de desplegament no recarrega sola i el
 * text no es perd. Buidat (també en canviar de persona), la marca se'n va.
 */
import { marcaEstatPendent, netejaEstatPendent } from '../../pwa/estatsPendents.js';

const esborranys = new Map();
const CLAU_PENDENT = 'xat.esborranys';
const senyalaPendent = () => (esborranys.size ? marcaEstatPendent(CLAU_PENDENT) : netejaEstatPendent(CLAU_PENDENT));

/** El text desat per a `clau`, o '' si no n'hi ha (o si no hi ha clau). */
export function llegixEsborrany(clau) {
  if (!clau) return '';
  return esborranys.get(String(clau)) ?? '';
}

/** Desa `text` per a `clau`; un text buit esborra l'entrada. Sense clau, no fa res. */
export function desaEsborrany(clau, text) {
  if (!clau) return;
  const valor = String(text ?? '');
  if (valor) esborranys.set(String(clau), valor);
  else esborranys.delete(String(clau));
  senyalaPendent();
}

/** Oblida l'esborrany de `clau` (en enviar). */
export function esborraEsborrany(clau) {
  if (!clau) return;
  esborranys.delete(String(clau));
  senyalaPendent();
}

/** Oblida tots els esborranys. */
export function buidaEsborranys() {
  esborranys.clear();
  senyalaPendent();
}
