/**
 * insigniaBetaOberta.js — la insígnia «En proves · Beta oberta» a les pàgines de la Gestoria.
 *
 * Onada R24 · A-gestoria-tpv-apps-1 (R22) i IDEA-244 / P0-113 (ordres del
 * Mestre, 261111): la Gestoria és oberta a la web publicada i en proves.
 * Amb l'aprovació en este navegador (tractors/AprovacioEnLinia.jsx), les set
 * entrades que depenien d'un tractor (Tauler, Bancs, Impostos, Full
 * trimestral, Escàner Local, Històric i IA, Identitat i Finestreta) s'obrin, i
 * cada pàgina porta la mateixa insígnia del Panell de Control: el text
 * valencià de TEXTOS_BETA_OBERTA i la classe CLASSE_BETA_OBERTA de
 * src/sections/plugins/registrePlugins.js, amb la regla canònica de
 * components.css (cap estil nou). El carril no pot importar res de fora
 * (gestoria/privacitat.test.js): les dues dades es copien ací i
 * aprovacioEnProduccio.test.jsx les confronta amb el registre. La Gestoria
 * només parla valencià (les seues pàgines no passen pel traductor).
 */
import { codiIdiomaGestoria, tg } from './i18nGestoria.js';

export const ETIQUETA_BETA_OBERTA = Object.freeze({ text: 'En proves · Beta oberta', className: 'sdp-insignia-beta-oberta' });

const PER_IDIOMA = Object.freeze({
  ca: ETIQUETA_BETA_OBERTA,
  es: Object.freeze({ text: tg('es', 'En proves · Beta oberta'), className: 'sdp-insignia-beta-oberta' }),
  en: Object.freeze({ text: tg('en', 'En proves · Beta oberta'), className: 'sdp-insignia-beta-oberta' }),
  eu: Object.freeze({ text: tg('eu', 'En proves · Beta oberta'), className: 'sdp-insignia-beta-oberta' }),
  gl: Object.freeze({ text: tg('gl', 'En proves · Beta oberta'), className: 'sdp-insignia-beta-oberta' })
});

export function etiquetaBetaOberta(idioma = 'ca') {
  return PER_IDIOMA[codiIdiomaGestoria(idioma)] ?? ETIQUETA_BETA_OBERTA;
}

/**
 * v1.2.26 · Cap píndola de la Gestoria no ix de la Gestoria (D3 de l'integrador, Lot C1-3,
 * sobre IDEA-365, Llibre Mestre, línia 3825). Les píndoles taxonòmiques de les cards
 * públiques són clicables (rutaDePindola.js), però les de la Gestoria no són taxonomia
 * publicada: són estats («Estimació incompleta», «Sense factures», «En obres»), terminis,
 * esta insígnia i les metadades del mòdul («GESTORIA», «PANELL INTERN», «Banc», «Impostos»).
 * A més, eixir per una píndola faria oblidar la lectura dels extractes (ordre del Mestre del
 * 14-10-2026, punt 5). Les targetes (TargetaTauler), les pàgines de targeta (PaginaTargeta) i
 * les pàgines dels mòduls (la closca, l'Històric i la Finestreta) les pinten amb
 * `inerta: true`: el mateix text i la mateixa classe, sense enllaç. Viu ací, al fitxer de la
 * insígnia, perquè ja és font dels tres tractors que les pinten (tractors.js). Pur: no toca
 * la llista que rep.
 * @param {Array<string|{ text: string, className?: string, lang?: string }>|null|undefined} etiquetes
 * @returns {Array<object>|null|undefined} la mateixa llista, sense buits i amb cada píndola inerta
 */
export function pindolesInertes(etiquetes) {
  if (!Array.isArray(etiquetes)) return etiquetes;
  return etiquetes.filter(Boolean)
    .map((etiqueta) => (typeof etiqueta === 'string' ? { text: etiqueta, inerta: true } : { ...etiqueta, inerta: true }));
}
