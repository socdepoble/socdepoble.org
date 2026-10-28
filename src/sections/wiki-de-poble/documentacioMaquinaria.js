/**
 * documentacioMaquinaria.js · Pla 261027_0845 (Guarda Nocturna), §3 ·
 * Transparència radical: la documentació pública de la Maquinària de la IAIA
 * (la porta d'aprovació de tractors, els Sentinelles i el BIOS dels agents)
 * es llig també fora de desenvolupament. Les accions mecàniques (aprovar,
 * signar, revocar, posar a observar) continuen sent només del servidor local
 * de desenvolupament (decisió D3 del 261002: cap ruta /tractors ni /gestoria).
 *
 * Text pur, sense React ni cap importació dels carrils de la Gestoria o dels
 * Tractors: la Wiki de producció no pot portar-ne cap tros
 * (gestoria/privacitat.test.js). Per això el que expliquen els panells de
 * desenvolupament es diu ací amb paraules, i les proves (que sí poden llegir
 * els carrils) vigilen que no se'n desvie: els set sentinelles pel seu nom, i
 * el BIOS, el mateix que pinta el panell dels Agents (llevat dels títols:
 * markdownDelBios).
 * Revisió adversarial del bloc B (Guarda Nocturna 261027) · També els
 * tractors del catàleg, pel seu nom i en l'ordre de TRACTORS_GESTORIA: el
 * subtítol de la pàgina («Què fa cada tractor…») ho promet.
 *
 * El cos de cada pàgina parla en H3 (la capçalera de la UniversalPage ja porta
 * l'H1 i l'H2), com la porta d'aprovació dels panells i els documents de la
 * Wiki: parseMarkdown baixa un esglaó cada títol, i un «## » ix com a h3.
 * També el BIOS (markdownDelBios).
 *
 * La data de cada text (T51: «Cap document existeix sense data») no viu ací
 * sinó a WikiDePobleSection.jsx (DATA_DOCUMENTACIO), perquè la llista de la
 * Wiki la llig sense carregar este text: qui en canvie un, hi canvia la data.
 */
import { extreuEditorial } from './parseMarkdown.js';

/* L'ítem del BIOS: el seu cos és AGENTS.md mateix, no cap text d'ací. */
export const ID_BIOS = 'agents_panell';

/* L'avís de les pàgines que, en desenvolupament, porten botons. El BIOS no en
   porta cap (és lectura també en desenvolupament) i no el necessita. */
export const AVIS_NOMES_EN_LOCAL = Object.freeze({
  titol: 'Ací només es llig',
  text: 'Aprovar, signar, revocar o posar a observar només funciona al servidor local de desenvolupament. Esta pàgina explica què fa cada peça i com es governa; cap botó no hi actua.'
});

const TRACTORS = `## Per què hi ha una porta

Cap automatisme del Mas no corre a cegues. Cada tractor porta un manifest i una fitxa que diuen, en paraules planes, què fa, què llig, què escriu, si es connecta a la xarxa i si toca dades personals. El Mestre els llig a la porta i aprova la versió exacta que vol que corra: tot tractor nou s’aprova de manera explícita des de la Wiki abans de fer res (lliçó del Mestre, 261002).

## Què fa cada tractor

Hui el catàleg el formen els tractors de la Gestoria de Poble, que només corre al servidor local de desenvolupament. Cada un llig només en este ordinador el que tries.

- **Gestoria · Full trimestral de factures**: llig la carpeta de factures que tries, proposa el full trimestral per a la gestoria i avisa de les factures que podrien faltar.
- **Gestoria · Creuament amb el correu**: llig les capçaleres d’una exportació de correu que tries i les creua amb les factures del trimestre.
- **Gestoria · Tauler de l’empresa**: llig els extractes del banc que tries i en calcula la caixa real, la cobertura, les finances recents i la tresoreria de cada compte; amb les factures del Full trimestral, avisa de les que podrien faltar.
- **Gestoria · Històric del banc i despesa en IA**: classifica cada moviment dels extractes del banc per categoria i proveïdor, sense guardar-ne el text, i en calcula l’històric, la despesa en IA, les estimacions d’impostos i el llibre per a la gestora.
- **Gestoria · Escàner Local de la carpeta**: recorre la carpeta que tries, troba els extractes del banc, classifica les factures de cada trimestre i avisa de duplicats, de dates que no quadren i de buits.
- **Gestoria · Fitxa d’identitat i Finestreta**: llig els papers d’identitat de la carpeta que tries (mai els de salut, banc, credencials, renda ni herència), proposa els camps legals perquè els confirmes, en desa xifrats només els confirmats i els prepara per a copiar-los als tràmits, sense signar ni presentar res.

## L’empremta

L’empremta és un resum SHA-256 del manifest, de la fitxa i del text exacte de cada font declarada. L’empremta curta n’és el tros que es copia i es confirma. Si canvia una sola línia d’eixos fitxers, l’empremta canvia i el tractor torna a demanar aprovació.

## Com s’aprova

- **Confirmació escrita**: s’escriu l’empremta curta de la versió que es veu.
- **Signatura**: Touch ID o una clau de pas del navegador (WebAuthn). Qui toca dades personals la demana sempre.

Cada aprovació porta la seua data i, si el manifest ho diu, quan caduca. Es pot revocar en qualsevol moment: un tractor revocat no s’executa fins que es torna a aprovar. I la porta torna a mirar l’aprovació en el moment d’executar: la pantalla no diu mai «aprovat» si la porta diria que no.

## Els estats

- **Pendent**: esta versió encara no s’ha aprovat.
- **Aprovat**: aprovat i verificat. Només en este estat s’executa.
- **Caducat**: l’aprovació ha passat de data.
- **Revocat**: el Mestre hi ha dit que no.
- **Versió canviada**: l’empremta ja no és la que es va aprovar.
- **Incomplet**: falta algun fitxer declarat; no es pot aprovar ni executar.
- **Sense empremta**: no s’ha pogut calcular; tampoc es pot aprovar.

## On es guarda

Les aprovacions es guarden només al navegador on es fan: empremtes, dates i claus públiques, cap dada personal. Es poden exportar o oblidar. Cap tractor del catàleg no es connecta a la xarxa.`;

/* Els set, en l'ordre del seu registre (registreSentinelles.js). Les proves
   en comproven els noms; la resta és la descripció del seu manifest, dita
   ací amb paraules. */
const SENTINELLES = `## Què fa un sentinella

Un sentinella és un tractor de nivell L0: només observa. Llig els fitxers que tries en este ordinador, alça banderes (roges o grogues) i escriu un informe a la pantalla. No aplica, no esborra, no envia i no paga res, i cap no es connecta a la xarxa. El que proposa, ho decidix i ho fa una persona.

## La mateixa porta

Cada sentinella passa per la porta d’aprovació dels tractors, amb la seua empremta. Qui toca dades personals demana signatura; la resta, confirmació escrita. I abans d’observar torna a exigir l’aprovació, encara que la pantalla diga «aprovat».

## Els set sentinelles

- **Sentinella Estructural · Permisos i Connexió Universal**: contrasta la sessió, el perfil i les pertinences amb el contracte que diuen les migracions i proposa la reparació sense aplicar-la.
- **Sentinella Triturador Financer · Trituradora de Documents Locals**: llig en lot extractes del banc o de la targeta i fulls trimestrals de factures; proposa assentaments i assenyala discrepàncies d’IVA, tot pendent d’aprovar.
- **Sentinella Policia del Disseny**: revisa el JSX, el JS i el CSS amb les lleis de Pedra Seca i de l’App Grid Shell.
- **Sentinella Cònsol de Vendes**: llig els tancaments de torn del TPV i els escandalls i diu on es guanya, on es perd i quines vendes són atípiques.
- **Sentinella Enllaç del Torn**: llig la nota de traspàs del torn i assenyala comandes obertes, diferències de caixa, incidències i si la nota no s’ha llegit.
- **Sentinella Auditoria d’Aparador**: revisa les imatges d’un comerç abans de l’aparador: format, proporció, resolució, pes i si porten la ubicació GPS.
- **Sentinella Detectiu del Poble**: llig els missatges de la bústia, amaga les dades personals i troba els temes que es repetixen, sense mostrar cap text original.`;

const DOCUMENTACIO = Object.freeze({
  tractors_aprovacio: TRACTORS,
  sentinelles_panell: SENTINELLES
});

/**
 * El Markdown de la documentació d'una peça, o null si no en té (el BIOS en
 * té, però és AGENTS.md: markdownDelBios). Només les claus pròpies.
 * @param {unknown} id
 * @returns {string | null}
 */
export function documentacioDe(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(DOCUMENTACIO, id) ? DOCUMENTACIO[id] : null;
}

/**
 * El BIOS (AGENTS.md) llest per a parseMarkdown, amb la recepta del panell
 * dels Agents de desenvolupament, perquè les dues pàgines diguen el mateix (la
 * prova ho compara): el frontmatter en una cita, els enllaços d'Obsidian com a
 * ítems de la Wiki i sense l'H1 (el títol és de la pàgina).
 * Revisió adversarial del bloc B (Guarda Nocturna 261027) · Els títols no es
 * rebaixen ací: parseMarkdown ja en baixa un esglaó cada un, i un «## »
 * d'AGENTS.md ix com a h3 davall de l'H2 de la pàgina, com a la porta, als
 * Sentinelles i als documents de la Wiki. El panell dels Agents encara els
 * rebaixa dues voltes (l'h4 directament davall de l'H2, sense h3): és del
 * carril dels Tractors, i la prova compara les dues pàgines amb eixe esglaó
 * de diferència fins que el panell es corregisca. Derogat: «amb la resta de
 * títols un esglaó més avall».
 * @param {unknown} cru el text d'AGENTS.md
 * @returns {string}
 */
export function markdownDelBios(cru) {
  let text = String(cru ?? '');
  let frontmatter = '';
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    frontmatter = fm[1].trim();
    text = text.slice(fm[0].length);
  }
  text = text.replace(/\[\[(.*?)\]\]/g, '[$1](?item=$1)');
  const { entradilla, cos } = extreuEditorial(text);
  return `
${entradilla ? entradilla + '\n\n' : ''}
${frontmatter ? '> **Metadades del document (Frontmatter):**\n> ' + frontmatter.replace(/\n/g, '  \n> ') + '\n\n' : ''}
${cos}
`;
}
