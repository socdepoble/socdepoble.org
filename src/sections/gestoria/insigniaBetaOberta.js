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
export const ETIQUETA_BETA_OBERTA = Object.freeze({ text: 'En proves · Beta oberta', className: 'sdp-insignia-beta-oberta' });
