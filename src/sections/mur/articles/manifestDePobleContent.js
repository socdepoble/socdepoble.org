/* P0-26 / IDEA-97 (Onada R6, Bloc 1) · El Manifest de Poble (WP 16893) com a
   contingut editorial: el cos sencer és este HTML, que viu en
   MANIFEST_DE_POBLE_POST.content (feedSeed.js) i que l'editor de /notes pot
   editar paràgraf a paràgraf. Només nodes que l'editor (TipTap: títols,
   paràgrafs, negreta, enllaços amb classe, imatge de bloc, Subtargeta) i el
   sanejador (sanitize.js) entenen igual: cap figure, details, time ni id.
   Les classes dels contenidors (manifest-de-poble__*) són de lectura
   (modules.css); l'editor, en desar, conserva el text, les imatges i els
   enllaços de text. */
export const MANIFEST_SOURCE_URL = 'https://socdepoble.net/2022/11/17/manifest-de-poble/';
export const MANIFEST_PDF_URL = 'https://drive.google.com/file/d/17H8EY4LTWlImwiusvuXlhv9ScpG3iE9M/view?usp=sharing';
export const MANIFEST_PROPOSTES_URL = 'https://docs.google.com/document/d/1_6HZhtCiCfVywoLJLzaRl4DbEoVSg1liLMB_vTz512U/edit?usp=sharing';
export const MANIFEST_ADHESIO_URL = 'https://forms.gle/g9TZ75WPwgGHrP8H7';

const ARXIU_MANIFEST = '/assets/mur/manifest-de-poble/';
const ARXIU_APLEC = '/assets/events/aplec-2023/';
const FORA = 'target="_blank" rel="noopener noreferrer"';
const img = (src, alt, width, height) => `<img src="${src}" alt="${alt}" width="${width}" height="${height}" loading="lazy" decoding="async">`;

export const MANIFEST_DE_POBLE_HTML = [
  '<h3>Un document obert dels pobles</h3>',
  `<a href="${MANIFEST_PDF_URL}" ${FORA}>${img(`${ARXIU_MANIFEST}logo-manifest-de-poble-retallat.webp`, 'Logotip del Manifest de Poble', 1024, 891)}</a>`,
  '<p>És un <strong>document obert</strong> que <strong>analitza la problemàtica dels xicotets pobles rurals de les comarques de l’Alcoià, el Comtat i les Marines i planteja solucions i escenaris de millora. Es poden fer comentaris al PDF</strong>, i a totes les pàgines hi ha la data de revisió. Està previst fer un <a href="/events/aplec-2023">Aplec pel Territori</a> en gener per completar aquest Manifest i canalitzar les nostres demandes.</p>',
  '<div class="manifest-de-poble__documents sdp-accions">',
  `<a class="sdp-boto sdp-boto--secundari" href="${MANIFEST_PDF_URL}" ${FORA}>Llegir el Manifest de Poble (PDF)</a>`,
  `<a class="sdp-boto sdp-boto--secundari" href="${MANIFEST_PROPOSTES_URL}" ${FORA}>Propostes locals al Manifest de Poble</a>`,
  '</div>',
  `<a href="${MANIFEST_PDF_URL}" ${FORA}>${img(`${ARXIU_MANIFEST}Manifest_de_Poble_1.webp`, 'Primera pàgina del Manifest de Poble; el document complet es pot consultar en PDF', 1600, 2262)}</a>`,
  '<p>Primera pàgina del Manifest. Consulta el PDF per a llegir-lo complet i comprovar la data de cada revisió.</p>',
  '<h3>Dos pilars per a revitalitzar els pobles</h3>',
  '<p><strong>Arran de l’incendi d’Ebo en l’estiu del 2022 on es van cremar 12.000 ha i molts pobles van ser desallotjats, hem decidit unir esforços per posar fil a l’agulla i començar a treballar pel vertader problema dels pobles menuts mediterranis:</strong></p>',
  '<h4>Despoblament</h4>',
  '<h4>Abandonament de l’agricultura</h4>',
  '<p class="sdp-paragraf-centrat"><strong>Revitalitzant estos aspectes, la resta fluirà sol!</strong></p>',
  `<p>La <a href="http://zona14.org" ${FORA}><strong>Coordinadora d’Estudis Eòlics</strong></a> i l’<a href="/rentonar"><strong>Associació El Rentonar</strong></a> amb el <a href="/socdepoble"><strong>Projecte Soc de Poble</strong></a> proposem a tots els <strong>pobles d’interior i menuts</strong> de les comarques de l’<strong>Alcoià, Comtat i Marines del País Valencià</strong> fer un <a href="${MANIFEST_PDF_URL}" ${FORA}><strong>llistat individualitzat d’exigències</strong></a>.</p>`,
  `<a href="https://www.facebook.com/aplecpelterritori" ${FORA}>${img(`${ARXIU_APLEC}socdepoble_facebook-128x128-1.png`, 'Aplec pel Territori al Facebook', 128, 128)}</a>`,
  '<p>Aplec pel Territori al Facebook</p>',
  '<p>Les <strong>característiques puntuals</strong> són diferents, en <strong>turisme</strong>, en <strong>envelliment</strong>, en <strong>comunicacions</strong>, en proximitat a grans nuclis, en <strong>serveis bàsics</strong>… però les <strong>línies estratègiques conductores</strong> que ens afecten a tots els pobles són els que recull aquest manifest. Els sotasignats som <strong>associacions amb llarga trajectòria</strong> en la defensa del territori i del nostre patrimoni natural i humà vinculat sobre tot al <strong>món rural</strong>.</p>',
  '<h3>Vertebrar-nos és crucial per a entendre que som els garants de la custòdia del territori!</h3>',
  '<p class="sdp-paragraf-centrat"><strong>Posa’t en contacte amb la Comissió Redactora si creus que pots aportar!</strong></p>',
  '<div class="manifest-de-poble__organitzadores">',
  `<a href="http://zona14.org" ${FORA}>${img(`${ARXIU_APLEC}logo-coordinadora-circular-300x300.jpg`, 'Coordinadora d’Estudis Eòlics del Comtat', 300, 300)}</a>`,
  `<a href="/rentonar">${img(`${ARXIU_APLEC}logo-rentonar-300x300.png`, 'Associació El Rentonar', 300, 300)}</a>`,
  `<a href="/socdepoble">${img(`${ARXIU_APLEC}logo-socdepoble-300x300.png`, 'Projecte Sóc de Poble', 300, 300)}</a>`,
  '</div>',
  '<h3>Un Aplec per a completar el Manifest</h3>',
  '<p>Està previst fer un <a href="/events/aplec-2023"><strong>Aplec pel Territori</strong></a> en gener per <strong>completar aquest Manifest</strong> i <strong>canalitzar les nostres demandes</strong>.</p>',
  `<a href="/events/aplec-2023">${img(`${ARXIU_APLEC}aplec-pel-territori-2023-A4-1900px-1.jpg`, 'Cartell A4 del 2n Aplec pel Territori', 1343, 1900)}</a>`,
  '<p><a href="/events/aplec-2023">Aplec pel Territori</a>. Diumenge, 29 de gener, a les 10.30. Benillup. Convocatòria històrica de 2023.</p>',
  `<a href="${ARXIU_APLEC}ponents-aplec-2023-1900px.jpg" ${FORA}>${img(`${ARXIU_APLEC}ponents-aplec-2023-1900px.jpg`, 'Cartell dels ponents del 2n Aplec pel Territori', 1343, 1900)}</a>`,
  '<div class="sdp-subtargeta manifest-de-poble__adhesio" data-sdp-subtargeta="">',
  '<h3>Formulari d’Adhesió al Manifest de Poble</h3>',
  '<p><strong>També pots firmar baix.</strong> El botó d’<strong>adhesió</strong> obri el formulari extern en una altra pestanya per a poder continuar llegint esta pàgina.</p>',
  `<div class="sdp-accions"><a class="sdp-boto sdp-boto--primari" href="${MANIFEST_ADHESIO_URL}" ${FORA}>Adherir-me al Manifest de Poble <span class="sdp-sr-only">(s’obri en una altra pestanya)</span></a></div>`,
  '</div>',
  '<h3>Font original i avís de drets</h3>',
  `<p><a href="${MANIFEST_SOURCE_URL}" ${FORA}><strong>Sóc de Poble · Manifest de Poble</strong></a>, WordPress <strong>16893</strong>, publicat el 17 de novembre de 2022. Es conserven el text, les figures i els enllaços de la font amb maquetació <strong>Pedra Seca</strong>; el formulari extern es mostra com un enllaç accessible. <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" ${FORA}><strong>CC BY-NC-SA 4.0 Sóc de Poble</strong></a>.</p>`
].join('\n');
