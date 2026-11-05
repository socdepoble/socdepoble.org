import { resolveAsset } from '../../../config/assetResolver.js';

export const MANIFEST_SOURCE_URL = 'https://socdepoble.net/2022/11/17/manifest-de-poble/';
export const MANIFEST_PDF_URL = 'https://drive.google.com/file/d/17H8EY4LTWlImwiusvuXlhv9ScpG3iE9M/view?usp=sharing';
export const MANIFEST_PROPOSTES_URL = 'https://docs.google.com/document/d/1_6HZhtCiCfVywoLJLzaRl4DbEoVSg1liLMB_vTz512U/edit?usp=sharing';
export const MANIFEST_ADHESIO_URL = 'https://forms.gle/g9TZ75WPwgGHrP8H7';

const arxiuManifest = '/assets/mur/manifest-de-poble/';
const arxiuAplec = '/assets/events/aplec-2023/';
const fora = { target: '_blank', rel: 'noopener noreferrer' };

/** El cos conserva els blocs de WP 16893 amb jerarquia i enllaços interns.
 * La figura inicial és l'única imatge del logotip: la meta omet la Hero duplicada. */
export function ManifestDePobleArticle() {
  return (
    <article className="detail-content manifest-de-poble">
      <h3>Un document obert dels pobles</h3>
      <figure>
        <a href={MANIFEST_PDF_URL} {...fora}>
          <img src={resolveAsset(`${arxiuManifest}logo-manifest-de-poble-retallat.webp`)}
            alt="Logotip del Manifest de Poble" width="1024" height="891" loading="lazy" decoding="async" />
        </a>
        <figcaption>
          És un <strong>document obert</strong> que <strong>analitza la problemàtica dels xicotets pobles rurals de les comarques de l’Alcoià, el Comtat i les Marines i planteja solucions i escenaris de millora. Es poden fer comentaris al PDF</strong>, i a totes les pàgines hi ha la data de revisió. Està previst fer un <a href="/events/aplec-2023">Aplec pel Territori</a> en gener per completar aquest Manifest i canalitzar les nostres demandes.
        </figcaption>
      </figure>

      <div className="manifest-de-poble__documents sdp-accions">
        <a className="sdp-boto sdp-boto--secundari" href={MANIFEST_PDF_URL} {...fora}>Llegir el Manifest de Poble (PDF)</a>
        <a className="sdp-boto sdp-boto--secundari" href={MANIFEST_PROPOSTES_URL} {...fora}>Propostes locals al Manifest de Poble</a>
      </div>
      <figure>
        <a href={MANIFEST_PDF_URL} {...fora}>
          <img src={resolveAsset(`${arxiuManifest}Manifest_de_Poble_1.webp`)}
            alt="Primera pàgina del Manifest de Poble; el document complet es pot consultar en PDF"
            width="1600" height="2262" loading="lazy" decoding="async" />
        </a>
        <figcaption>Primera pàgina del Manifest. Consulta el PDF per a llegir-lo complet i comprovar la data de cada revisió.</figcaption>
      </figure>

      <h3>Dos pilars per a revitalitzar els pobles</h3>
      <p><strong>Arran de l’incendi d’Ebo en l’estiu del 2022 on es van cremar 12.000 ha i molts pobles van ser desallotjats, hem decidit unir esforços per posar fil a l’agulla i començar a treballar pel vertader problema dels pobles menuts mediterranis:</strong></p>
      <h4>Despoblament</h4>
      <h4>Abandonament de l’agricultura</h4>
      <p className="sdp-paragraf-centrat"><strong>Revitalitzant estos aspectes, la resta fluirà sol!</strong></p>
      <p>La <a href="http://zona14.org" {...fora}><strong>Coordinadora d’Estudis Eòlics</strong></a> i l’<a href="/rentonar"><strong>Associació El Rentonar</strong></a> amb el <a href="/socdepoble"><strong>Projecte Soc de Poble</strong></a> proposem a tots els <strong>pobles d’interior i menuts</strong> de les comarques de l’<strong>Alcoià, Comtat i Marines del País Valencià</strong> fer un <a href={MANIFEST_PDF_URL} {...fora}><strong>llistat individualitzat d’exigències</strong></a>.</p>
      <figure>
        <a href="https://www.facebook.com/aplecpelterritori" {...fora}>
          <img src={resolveAsset(`${arxiuAplec}socdepoble_facebook-128x128-1.png`)}
            alt="Aplec pel Territori al Facebook" width="128" height="128" loading="lazy" decoding="async" />
        </a>
        <figcaption>Aplec pel Territori al Facebook</figcaption>
      </figure>
      <p>Les <strong>característiques puntuals</strong> són diferents, en <strong>turisme</strong>, en <strong>envelliment</strong>, en <strong>comunicacions</strong>, en proximitat a grans nuclis, en <strong>serveis bàsics</strong>… però les <strong>línies estratègiques conductores</strong> que ens afecten a tots els pobles són els que recull aquest manifest. Els sotasignats som <strong>associacions amb llarga trajectòria</strong> en la defensa del territori i del nostre patrimoni natural i humà vinculat sobre tot al <strong>món rural</strong>.</p>
      <h3>Vertebrar-nos és crucial per a entendre que som els garants de la custòdia del territori!</h3>
      <p className="sdp-paragraf-centrat"><strong>Posa’t en contacte amb la Comissió Redactora si creus que pots aportar!</strong></p>

      <div className="manifest-de-poble__organitzadores" aria-label="Entitats impulsores">
        <a href="http://zona14.org" {...fora}>
          <img src={resolveAsset(`${arxiuAplec}logo-coordinadora-circular-300x300.jpg`)} alt="Coordinadora d’Estudis Eòlics del Comtat" width="300" height="300" loading="lazy" decoding="async" />
        </a>
        <a href="/rentonar">
          <img src={resolveAsset(`${arxiuAplec}logo-rentonar-300x300.png`)} alt="Associació El Rentonar" width="300" height="300" loading="lazy" decoding="async" />
        </a>
        <a href="/socdepoble">
          <img src={resolveAsset(`${arxiuAplec}logo-socdepoble-300x300.png`)} alt="Projecte Sóc de Poble" width="300" height="300" loading="lazy" decoding="async" />
        </a>
      </div>

      <h3>Un Aplec per a completar el Manifest</h3>
      <p>Està previst fer un <a href="/events/aplec-2023"><strong>Aplec pel Territori</strong></a> en gener per <strong>completar aquest Manifest</strong> i <strong>canalitzar les nostres demandes</strong>.</p>
      <figure>
        <a href="/events/aplec-2023">
          <img src={resolveAsset(`${arxiuAplec}aplec-pel-territori-2023-A4-1900px-1.jpg`)} alt="Cartell A4 del 2n Aplec pel Territori" width="1343" height="1900" loading="lazy" decoding="async" />
        </a>
        <figcaption><a href="/events/aplec-2023">Aplec pel Territori</a>. Diumenge, 29 de gener, a les 10.30. Benillup. Convocatòria històrica de 2023.</figcaption>
      </figure>
      <figure>
        <a href={resolveAsset(`${arxiuAplec}ponents-aplec-2023-1900px.jpg`)} {...fora}>
          <img src={resolveAsset(`${arxiuAplec}ponents-aplec-2023-1900px.jpg`)} alt="Cartell dels ponents del 2n Aplec pel Territori" width="1343" height="1900" loading="lazy" decoding="async" />
        </a>
      </figure>

      <section className="sdp-subtargeta manifest-de-poble__adhesio" aria-labelledby="manifest-adhesio">
        <h3 id="manifest-adhesio">Formulari d’Adhesió al Manifest de Poble</h3>
        <p><strong>També pots firmar baix.</strong> El botó d’<strong>adhesió</strong> obri el formulari extern en una altra pestanya per a poder continuar llegint esta pàgina.</p>
        <div className="sdp-accions">
          <a className="sdp-boto sdp-boto--primari" href={MANIFEST_ADHESIO_URL} {...fora}>
            Adherir-me al Manifest de Poble <span className="sdp-sr-only">(s’obri en una altra pestanya)</span>
          </a>
        </div>
      </section>

      <h3>Font original i avís de drets</h3>
      <p><a href={MANIFEST_SOURCE_URL} {...fora}><strong>Sóc de Poble · Manifest de Poble</strong></a>, WordPress <strong>16893</strong>, publicat el <time dateTime="2022-11-17T23:50:00+01:00">17 de novembre de 2022</time>. Es conserven el text, les figures i els enllaços de la font amb maquetació <strong>Pedra Seca</strong>; el formulari extern es mostra com un enllaç accessible. <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" {...fora}><strong>CC BY-NC-SA 4.0 Sóc de Poble</strong></a>.</p>
    </article>
  );
}
