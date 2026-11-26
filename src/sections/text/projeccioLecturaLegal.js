/**
 * projeccioLecturaLegal.js — IDEA-340 (v1.2.24) + IDEA-373 / IDEA-374 (v1.2.26 · Lot G26-4)
 *
 * Projecció pura de lectura per a `/legal` (`TextSection.jsx`):
 *   - Conserva 100 % intacta en disc i en memòria la cadena `legalContent.html`
 *     perquè l'empremta criptogràfica segellada `SDP-RGPD-021` (`SHA_25`) i les
 *     portes `politicaPrivacitat25/26.migracio.test.js` no es trenquen mai.
 *   - En pintar `/legal`, substitueix el bloc final d'agraïments per un `<h3>`
 *     en caixa natural d'oració (`Reconeixements i fonts d'inspiració`), la
 *     `UniversalCard` incrustada cap a `/page/reconeixements` i un paràgraf
 *     humà amb enllaç contextual i 7 etiquetes `<strong>` (Llei 35).
 *   - Retira els `<hr />` decoratius sobrers i passa els `<h3>` històrics en
 *     majúscules a caixa natural d'oració Pedra Seca perquè títols i prosa
 *     fluïsquen al costat de les targetes flotants sense buits verticals.
 */

const PATRO_BLOC_RECONEIXEMENTS_LEGAL = /<hr \/>\s*<h3>RECONEIXEMENTS I FONTS D['’]INSPIRACIÓ<\/h3>[\s\S]*?(?=<hr \/>\s*<blockquote class="page-content-quote">)/;
/* Lot C1-3 (Gauntlet G26, Lent 2, punt 6) · Sense \s* al davant: amb ell, una tirada llarga d'espais
   sense cap <hr> darrere es tornava a recórrer des de cada posició (80.000 espais, uns 3 s). Ara cada
   intent comença per «<hr» i el cost és lineal. Només canvia l'espai en blanc entre blocs, que no es pinta. */
const PATRO_HR_DECORATIU = /<hr\s*\/?>\s*/gi;
const TITOLS_CAIXA_ORACIO_LEGAL = [
  ['<h3>AVÍS LEGAL</h3>', '<h3>Avís legal</h3>'],
  ['<h3>POLÍTICA DE PRIVACITAT I PROTECCIÓ DE DADES</h3>', '<h3>Política de privacitat i protecció de dades</h3>'],
  ['<h3>EMMAGATZEMATGE AL TEU DISPOSITIU (POLÍTICA DE GALETES)</h3>', '<h3>Emmagatzematge al teu dispositiu (política de galetes)</h3>'],
];

export const BLOC_TARGETA_RECONEIXEMENTS_LEGAL = `<h3>Reconeixements i fonts d'inspiració</h3>
    <div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta"><div data-sdp-targeta="pagina:reconeixements" class="sdp-targeta" data-ruta="/page/reconeixements" data-titol="Reconeixements i fonts d&#39;inspiració" data-subtitol="Divulgadors, laboratoris d&#39;investigació, codi obert i mestres del camí" data-entradilla="Cap eina naix del no-res. Reunim ací el nostre agraïment viu als divulgadors tecnològics, projectes de programari lliure, cartografia oberta i laboratoris d&#39;intel·ligència artificial que nodrixen diàriament Sóc de Poble." data-imatge="/assets/nano_cards/reconeixements_nano_card.webp" data-autor="Sóc de Poble" data-autor-ruta="/projecte"><a href="/page/reconeixements" rel="noopener noreferrer nofollow">Reconeixements i fonts d&#39;inspiració</a></div></div>
    <p>A <strong>Sóc de Poble</strong> creiem en la <strong>generositat del coneixement compartit</strong>, en la <strong>cultura lliure</strong> i en el <strong>deure ètic de citar les fonts</strong>. Tots els agraïments als <strong>divulgadors tecnològics, programari lliure i laboratoris d'investigació</strong> viuen en la seua pàgina pròpia en creixement continu, <a href="/page/reconeixements"><strong>Reconeixements i fonts d'inspiració</strong></a>, perquè aquest document conserve <strong>intacta la claredat legal i de privacitat</strong>.</p>

    `;

export function projeccioLecturaLegal(html) {
  if (typeof html !== 'string' || !html) return html;
  if (!PATRO_BLOC_RECONEIXEMENTS_LEGAL.test(html)) return html;
  let resultat = html.replace(PATRO_BLOC_RECONEIXEMENTS_LEGAL, BLOC_TARGETA_RECONEIXEMENTS_LEGAL);
  resultat = resultat.replace(PATRO_HR_DECORATIU, '\n\n    ');
  for (const [antic, nou] of TITOLS_CAIXA_ORACIO_LEGAL) {
    resultat = resultat.replace(antic, nou);
  }
  return resultat;
}
