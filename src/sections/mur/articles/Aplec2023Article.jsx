import { resolveAsset } from '../../../config/assetResolver.js';
import { APLEC_GALLERY, APLEC_SOURCE_URL, APLEC_VIDEO_ID } from './aplec2023Content.js';

const galeriaPrincipal = APLEC_GALLERY.slice(0, 25);
const galeriaComplementaria = APLEC_GALLERY.slice(25);

function Fotografies({ fotografies, inici = 0 }) {
  return (
    <div className="aplec-2023__galeria">
      {fotografies.map((foto, index) => (
        <figure key={foto.wpId} data-wp-media-id={foto.wpId}>
          {/* Ordre del Mestre (30-10-2026, T4.2) · Les fotos del cos obrin el visor de l'App
              (que ofereix l'enllaç de la imatge); un <a> al voltant les trauria del visor. */}
          <img src={resolveAsset(foto.src)} alt={foto.alt} width={foto.width} height={foto.height} loading="lazy" decoding="async" />
          <figcaption>Fotografia {inici + index + 1}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Aplec2023Article() {
  return (
    <article className="detail-content aplec-2023">
      <h3 className="detail-content__titol">El 2n Aplec a À Punt NTC</h3>
      <div className="aplec-2023__video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${APLEC_VIDEO_ID}`}
          title="2n Aplec pel Territori - Benillup: NTC À Punt"
          width="1080" height="608" loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <p className="detail-content__paragraph">
        Reportatge d’<strong>À Punt NTC</strong> sobre l’Aplec del <time dateTime="2023-01-29">29 de gener de 2023</time>.{' '}
        <a href={`https://www.youtube.com/watch?v=${APLEC_VIDEO_ID}`} target="_blank" rel="noopener noreferrer">Obri el vídeo a YouTube</a>.
        Les gravacions històriques de Facebook es poden consultar a{' '}
        <a href="https://www.facebook.com/aplecpelterritori" target="_blank" rel="noopener noreferrer">l’arxiu de l’Aplec</a>.
      </p>

      <h3 className="detail-content__titol">25 fotografies de l’Aplec a Benillup</h3>
      <Fotografies fotografies={galeriaPrincipal} />
      <details className="aplec-2023__complement">
        <summary>9 fotografies més de l’arxiu original</summary>
        <Fotografies fotografies={galeriaComplementaria} inici={25} />
      </details>
      <p className="detail-content__paragraph">
        La font de Sóc de Poble conserva actualment <strong>34 fotografies</strong>.
        Ací es mostren les 25 de la galeria principal i les 9 complementàries, en l’ordre de l’arxiu.
      </p>

      <div>
<hr />


<h3 className="detail-content__titol" id="nota-premsa-aplec-2023">Nota de premsa post-Aplec</h3>


<p className="detail-content__paragraph"><em>El Comtat, 30 de gener 2023</em></p>


<p className="detail-content__paragraph">Ahir diumenge 29 de gener del 2023 en Benillup es va celebrar el 2n Aplec pel Territori. La sala estava a curumull amb 200 assistents asseguts i uns altres tants dempeus que van desafiar el fred i la neu i es van aplegar per a interaccionar amb 13 ponents experts en el món rural.</p>


<p className="detail-content__paragraph">El format de l’Aplec era molt atractiu perquè l’objectiu era que les persones vingudes de tots els pobles de les comarques parlaren amb els i les ponents de tu a tu sobre els problemes i les propostes per a revitalitzar els nostres pobles.</p>


<p className="detail-content__paragraph">El fil conductor va ser l’incendi d’aquest estiu i com això ens ha vertebrat i ens ha fet adonar que el món rural té problemes estructurals que cal resoldre perquè la custòdia del territori recau, en gran mesura, en els poblets rurals i menuts. Una de les qüestions més repetides va ser que hi haja un sou per als agricultors que llauren les terres (siguen productives o no) i així es trenque la continuïtat de la massa forestal. Tindre bancals llaurats enmig de la serra pot fer de tallafocs però també, com van reclamar els bombers, és una salvaguarda per als mitjans d’extinció. Però sobre tot és recuperar un paisatge típic mediterrani, el mosaic, que és un niu de biodiversitat i una manera de viure idiosincràtica que no hauríem de perdre i que en altres parts del món, els gestors del territori, estan proposant com a solució.</p>


<p className="detail-content__paragraph">La quantitat de gent va fer impossible ni tan sols oir totes les preguntes que el públic haguera volgut formular i moltes coses van quedar sobre la taula emplaçant-nos de manera tàcita a continuar treballant per trobar solucions a problemes molt concrets que ja no deuen estar plantejats des de les ciutats cap als pobles sinó, tenint en compte les seues veus.</p>


<p className="detail-content__paragraph">L’acte va representar un empoderament de la gent dels pobles i va suposar l’inici d’una sèrie de reivindicacions per a què d’una volta per totes, el poc pes demogràfic no siga una excusa per no donar importància a un territorit i unes gents que mereixen ser ciutadania de 1a com ho són els de les ciutats grans.</p>


<hr />


<h3 className="detail-content__titol">Si vols participar en la redacció del <a href="https://drive.google.com/file/d/17H8EY4LTWlImwiusvuXlhv9ScpG3iE9M/view?usp=sharing" rel="noopener noreferrer" target="_blank">Manifest de Poble</a>, pots unir-te al <a href="https://t.me/manifest_de_poble" rel="noopener noreferrer" target="_blank">Grup de Treball en Telegram</a>:</h3>


<p className="detail-content__paragraph">TELEGRAM: <strong>Manifest de Poble – Grup de treball: <a href="https://t.me/manifest_de_poble" rel="noopener noreferrer" target="_blank">https://t.me/manifest_de_poble</a></strong></p>


<div className="aplec-2023__figura"><a href="https://t.me/manifest_de_poble" rel="noopener noreferrer" target="_blank"><img alt="telegram manifest de poble.jpg" decoding="async" height="456" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/telegram-manifest-de-poble.jpg")} width="617" /></a></div>


<hr />


<h3 className="detail-content__titol">Podeu veure les actualitzacions al <a href="https://www.facebook.com/aplecpelterritori" rel="noopener noreferrer" target="_blank">Facebook de l’Aplec pel Territori</a></h3>


<div className="aplec-2023__figura"><a href="https://www.facebook.com/aplecpelterritori" rel="noopener noreferrer" target="_blank"><img alt="facebook aplec pel territori.jpg" decoding="async" height="622" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/facebook-aplec-pel-territori.jpg")} width="1246" /></a></div>


<hr />


<div className="aplec-2023__organitzadores">
<div className="aplec-2023__figura"><a href="http://zona14.org" rel="noopener noreferrer" target="_blank"><img alt="Coordinadora d'Estudis Eòlics del Comtat" decoding="async" height="300" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/logo-coordinadora-circular-300x300.jpg")} width="300" /></a></div>
<div className="aplec-2023__figura"><a href="https://rentonar.blogspot.com" rel="noopener noreferrer" target="_blank"><img alt="Logo Associació El Rentonar" decoding="async" height="300" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/logo-rentonar-300x300.png")} width="300" /></a></div>
<div className="aplec-2023__figura"><a href="https://socdepoble.net" rel="noopener noreferrer" target="_blank"><img alt="Logo Sóc de Poble. Portal de Pobles Connectats" decoding="async" height="300" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/logo-socdepoble-300x300.png")} width="300" /></a></div>
</div>


<hr />


<h3 className="detail-content__titol">PRESENTACIÓ ABANS DE L’APLEC</h3>


<hr />


<h3 className="detail-content__titol">Nou Aplec pel Territori, arrel de l’incendi d’aquest estiu</h3>


<p className="detail-content__paragraph"><a href={resolveAsset("/assets/events/aplec-2023/aplec-pel-territori-2023-A4-1900px-1.jpg")} rel="noopener noreferrer" target="_blank">Obri el cartell A4 complet</a>. Per al dinar s’ha de reservar taula al restaurant, que és el lloc on fem l’acte: <strong>Balcó de Travadell – 673 61 98 59</strong>. Informació històrica de la convocatòria de 2023.</p>


<h3 className="detail-content__titol">APLEC PEL TERRITORI. DIUMENGE, 29 DE GENER, A LES 10.30. BENILLUP</h3>


<h3 className="detail-content__titol">La <a href="http://zona14.org" rel="noopener noreferrer" target="_blank">Coordinadora d’Estudis Eòlics</a> i l’<a href="https://rentonar.blogspot.com" rel="noopener noreferrer" target="_blank">Associació El Rentonar</a> amb el <a href="https://socdepoble.net" rel="noopener noreferrer" target="_blank">Projecte Soc de Poble</a> hem organitzat a Benillup un nou Aplec pel Territori com a resposta a l’incendi que va assolar les nostres comarques en agost del 2022.</h3>


<div className="aplec-2023__figura"><a href="https://socdepoble.net/wp-content/uploads/2023/01/ponents-aplec-2023-1900px.jpg" rel="noopener noreferrer" target="_blank"><img alt="ponents aplec 2023 1900px.jpg" decoding="async" height="1900" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/ponents-aplec-2023-1900px.jpg")} width="1343" /></a><p className="aplec-2023__peu">El proper diumenge 29 de gener, a Benillup, a les 11 del matí les associacions <strong>Coordinadora d’Estudis Eòlics del Comtat i Rentonar</strong> han organitzat un Aplec pel territori motivat per l’incendi d’aquest estiu, però per a intentar tractar temes de més calat com són el despoblament rural i l’abandonament agrícola.</p></div>


<hr />


<h3 className="detail-content__titol">El format de l’Aplec és innovador</h3>


<p className="detail-content__paragraph"><strong>No volem que facen discursos els ponents</strong> convidats sinó <strong>que escolten preguntes, inquietuds i suggeriments que la gent dels pobles</strong> els vulga formular. Només <strong>Enric Moltó, geògraf i climatòleg</strong>, farà una <strong>intervenció</strong> de 30 min.</p>


<p className="detail-content__paragraph">Els <strong>ponents</strong> convidats representen un planter d’experts de tots els sectors <strong>vinculats al món rura</strong>l:</p>


<ul className="detail-content__llista">
<li><strong>Javier Cendra</strong>: Alcalde de Planes i Diputat per Alacant.</li>
<li><strong>Javier Navarro</strong>: Alcalde de Benillup.</li>
<li><strong>Rafa Climent</strong>: Conseller d’Economia Sostenible, Sectors Productius, Comerç i Treballl.</li>
<li><strong>Imma Orozco</strong>: Directora General de Política Territorial i Paisatge.</li>
<li><strong>Rosa Pardo</strong>: Directora General de Política Territorial i Paisatge.</li>
<li><strong>David Torres</strong>: Director General de Desenvolupament Rural.</li>
<li><strong>Mauro Ferrando</strong>: Jove agricultor i treballador de l’almàssera de Milleneta.</li>
<li><strong>Isabel Sancho</strong>: Regidora de Fageca, Tècnica de promoció econòmica en Cocentaina i vinculada a la promoció del turisme rural.</li>
<li><strong>Òscar Ponsoda</strong>: President de la Societat de Caçadors de Famorca.</li>
<li><strong>Adán Lloret</strong>: Bomber Forestal a la Font Roja.</li>
<li><strong>Alejandro Molina</strong>: Llaurador i president de COARVAL i de la Cooperativa Cofrudeca de Bèlgida.</li>
<li><strong>Artemi Cerdà</strong>: Geògraf, professor d’universitat i llaurador.</li>
</ul>


<h3 className="detail-content__titol">En la segona quinzena d’agost un incendi va colpir el nostre territori calcinant més de 12.000 ha i 100 km de perimetre.</h3>


<div className="aplec-2023__figura"><a href="https://www.facebook.com/aplecpelterritori" rel="noopener noreferrer" target="_blank"><img alt="socdepoble_facebook 128x128 1.png" decoding="async" height="128" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/socdepoble_facebook-128x128-1.png")} width="128" /></a><p className="aplec-2023__peu">Aplec pel Territori al Facebook</p></div>


<p className="detail-content__paragraph">Aquest incendi, originat de forma espontània en una tormenta seca va cremar a gran velocitat des de Pego fins a Benialfaquí. Alguns pobles van haver de ser desallotjats i moltes persones vam viure amb un ai al cor l’avanç de les flames. Els nombrosos mitjans van treballar de manera incansable tant en aquest incendi com en el de Begís.</p>


<p className="detail-content__paragraph">Des d’aquell moment, les dues coordinadores es van plantejar que alguna cosa calia fer per entendre què estava passant amb els gran incendis i quin era el futur previsible. Un canvi de tendència en els diagnòstics va fer moure la necessitat de reflexionar sobre el fenòmen. D’una banda, la idea no és evitar el foc sinó saber què hem de fer quan passe perquè passarà, i d’altra banda, els incendis agafen grans dimensions perquè estem perdent el mosaic tan típic del mediterrani (paisatge mixt agro-forestal).</p>


<p className="detail-content__paragraph">La conclusió lògica d’aquests arguments és que els focs de les nostres serres són deguts al despoblament i a l’abandonament agrícola. I és en aquesta doble línia que les coordinadores decidiren muntar un nou Aplec pel Territori. I clar, l’àrea de cobertura no només inclou les zones de l’incendi sinó altres pobles també que responen al mateix perfil.</p>


<p className="detail-content__paragraph">Una de les mancances de es va detectar en l’incendi va ser el desempar que moltes persones van sentir quan se’ls va desallotjar de sa casa i, per aquest motiu, s’han iniciat un munt de reunions xicotetes en cadascun dels pobles per a preparar l’Aplec on se’ls informa de l’esdeveniment i també s’intenta fer un recull de peticions de cada poble per tal de lliurar-les als polítics que seran convidats a l’Aplec. El resultat d’aquestes reunions és el <strong><a href="/mur/manifest-de-poble" rel="noreferrer noopener">Manifest de Poble</a></strong>, un document viu i en constant actualització que pretén destacar les necessitats particulars que caldria atendre per tal de revitalitzar els nostres petits pobles rurals. L’enllaç es pot consultar ací.</p>


<p className="detail-content__paragraph">Al 2n Aplec pel territori es pretén que tant científics, com polítics, com gent dels pobles puguen establir un fòrum de debat d’iniciatives per a dinamitzar els pobles. No es pretén buscar culpables sinó proposar solucions i cercar llocs on eixes idees hagen sigut ja satisfactòries per a poder-les implementar a casa nostra.</p>


<hr />


<div className="aplec-2023__figura"><a href="https://socdepoble.net/wp-content/uploads/2022/12/aplec-pel-territori-reunions-als-pobles-1.jpg" rel="noopener noreferrer" target="_blank"><img alt="aplec pel territori reunions als pobles 1 1024x766.jpg" decoding="async" height="766" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/aplec-pel-territori-reunions-als-pobles-1-1024x766.jpg")} width="1024" /></a><p className="aplec-2023__peu">S’adjunta una foto d’una de les darreres reunions que englobava els pobles de Millena, Gorga, Balones i Quatretondeta. Altres reunions han sigut als pobles de Fageca, Tollos, Beniaia, Vall d’Alcalà, Vall de Gallinera, Planes, Benillup, Benialfaquí, Benimassot, La Torre de les Maçanes, Vall d’Ebo i n’hi ha d’altres previstes.</p></div>


<hr />


<div className="aplec-2023__figura"><a href="/mur/manifest-de-poble" rel="noopener"><img alt="Manifest de Poble. Logo" decoding="async" height="891" loading="lazy" src={resolveAsset("/assets/events/aplec-2023/logo-manifest-de-poble-1024x891.png")} width="1024" /></a><p className="aplec-2023__peu"><a href="https://drive.google.com/file/d/17H8EY4LTWlImwiusvuXlhv9ScpG3iE9M/view?usp=sharing" rel="noopener noreferrer" target="_blank"><strong>Enllaç al Manifest de Poble en Format PDF</strong></a>: És un <strong>document obert</strong> que <strong>analitza la problemàtica dels xicotets pobles rurals de les comarques de l’Alcoià, el Comtat i les Marines i planteja solucions i escenaris de millora. Es poden fer comentaris al pdf</strong>, i a totes les pàgines hi ha la data de revisió. Està previst fer un <strong><a href="https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/" rel="noopener noreferrer" target="_blank">Aplec pel Territori</a></strong> en gener per completar aquest Manifest i canalitzar les nostres demandes.</p></div>
      </div>
      <p className="detail-content__paragraph">
        <a href={APLEC_SOURCE_URL} target="_blank" rel="noopener noreferrer">Font original: Sóc de Poble · 2n Aplec pel Territori (WordPress 16880)</a>.
        Text, fotografies i cartells de l’arxiu de l’Aplec; informació històrica de 2022–2023.
      </p>
    </article>
  );
}
