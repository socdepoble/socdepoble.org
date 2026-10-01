const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/sections/text/pageContent.js', 'utf8');

const newHtml = `
      <h3>La Visió i el Paradigma</h3>
      <p>Sóc de Poble és una xarxa social cívica i descentralitzada dissenyada específicament per a entorns rurals. La nostra missió final, l'horitzó on mirem, és connectar els pobles mitjançant la <strong>sobirania tecnològica</strong> i assolir la llibertat d'una <em>xarxa autònoma que funcione sense internet</em>. Volem defugir dels grans monopolis de dades (les Big Tech) i els intermediaris que compliquen la vida. L'objectiu és que quan un uelo toque una pantalla, simplement sàpiga què fer, sense pensar en menús, frameworks, IAs ni arquitectura.</p>
      
      <p>La nostra visió de futur continua mantenint el rumb cap a eixa <strong>autonomia total (forjada sense connexió)</strong>, on la xarxa puga sobreviure i ser completament funcional inclús si la connexió mundial cau, de forma completament descentralitzada i lliure.</p>

      <h3>L'Arquitectura de l'"Enxufe": Com ens connectem hui?</h3>
      <p>Per a comprendre com Sóc de Poble és immune al pas del temps, cal entendre una idea fonamental: la separació entre la façana (l'App) i el magatzem (les dades). Tradicionalment, una web està cosida al servidor que la manté; si el servidor tanca, la web desapareix.</p>
      <p>Per això dissenyem un projecte <em>endollable</em>. Sóc de Poble és un client pur que pot viure a qualsevol lloc, i el lloc on es guarden els missatges o les fotos actua només com un "enxufe" a la paret. El pragmatisme ens diu que, per donar un servei útil i eficient a tothom hui mateix, necessitem una infraestructura robusta en línia. Ací és on entra <strong>Sollutia</strong> (Supabase).</p>
      <p>Aquesta infraestructura al núvol és la peça fonamental inicial per tindre l'aplicació connectada i veloç a internet. Però el poder real rau en el fet que el connector es pot canviar per qualsevol altre. Si demà calguera, aquest enxufe es podria desconnectar de Sollutia i connectar-se directament a <strong>WordPress</strong>, a <strong>Joomla</strong> o fins i tot a <strong>Wikimedia</strong>. Ells farien de motor per a retornar resultats i dades a l'App sense que la interfície canvie absolutament res. Preparant el camí per la desitjada versió autònoma.</p>

      <h3>El Cicle de Vida, el Disseny i la Intel·ligència Artificial</h3>
      <p>Us heu preguntat mai per què tot el disseny sencer, la Wiki del projecte, la constitució, el codi font i les lleis de governança s'integren públicament a la mateixa aplicació? De què s'alimenta realment aquesta web?</p>
      <p>La resposta és el nostre llegat. Hui utilitzem la Intel·ligència Artificial com a eina incansable de treball (IAs com MarIA, Claude o Codex) per ajudar-nos a construir i programar ràpidament. Perquè ens puguen ajudar bé, les IAs necessiten llegir i entendre les nostres normes, el nostre disseny Pedra Seca i la nostra filosofia "Trellat". Per això tot està ací dins.</p>
      <p>Tanmateix, Sóc de Poble es construeix **per a quan la IA desaparega**. Si demà els algoritmes d'intel·ligència artificial deixaren d'existir o foren massa cars, el projecte no cauria ni quedaria orfe. Com tot el pensament, la tecnologia i les decisions ja estan escrites en llenguatge humà a la Wiki i explicades de dalt a baix, no farà falta cap IA per mantenir-ho. Qualsevol desenvolupador podrà continuar la feina. I si el dia de demà existeixen IAs superiors, simplement llegint aquesta Wiki podran millorar el projecte sense destruir la nostra identitat.</p>

      <h3>El Fedivers i les Micro-Xarxes Socials Connectades</h3>
      <p>El nostre anhel no és convertir Sóc de Poble en una plataforma monolítica gegant que atrape tothom, sinó obrir les portes al <strong>Fedivers</strong>.</p>
      <p>Aleshores, què és el Fedivers? Imagineu que diferents pobles, cadascun amb la seua pròpia plaça, la seua pròpia gent i el seu propi alcalde, tinguen la seua versió independent de Sóc de Poble. El Fedivers permet que aquestes "illes" es comuniquen entre si. Així, algú del poble A pot enviar un missatge a un veí del poble B, malgrat que no compartisquen el mateix servidor ni els mateixos amos.</p>
      <p>Aquesta idea no ens l'hem inventada nosaltres. Ja fa anys, projectes pioners com <strong>Diaspora</strong> van intentar crear l'alternativa a Facebook utilitzant <em>pods</em> descentralitzats, on la pròpia gent era mestressa de les seues dades. Més recentment, el triomf de <strong>Mastodon</strong> com a xarxa descentralitzada ha demostrat que aquest paradigma és possible i robust.</p>
      <p>La nostra intenció és forjar micro-xarxes socials rurals, mantingudes i connectades per persones que creuen profundament que una eina de comunicació ciutadana és una <strong>utilitat social</strong> bàsica, no una via per extreure beneficis i comercialitzar atenció.</p>

      <h3>Els Orígens (2013): La Llavor del Portal de Pobles Connectats</h3>
      <p>L'essència d'aquest projecte es va forjar fa més d'una dècada, cap a l'any 2013-2014, amb un manifest claríssim que ja s'allotjava originalment al domini <em>socdepoble.net</em>:</p>
      
      <blockquote class="page-content-quote">
        "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
      </blockquote>

      <p>En aquella època, Sóc de Poble ja comptava amb més de 160.000 seguidors actius a Facebook. Conscient del perill de dependre d'aquells algoritmes privats, el projecte va alçar un primer mapa del que havia de ser l'eixida a la sobirania rural.</p>
      
      <h3>La Transformació: Del Somni de 2013 al Mas Indestructible d'Hui</h3>
      <p>Si comparem aquella visió històrica amb la realitat actual, veurem com allò que abans era un "Mòdul Social" bàsic, hui és el robust <strong>Mur Universal</strong> on tothom comparteix notícies, i un <strong>Xat en viu</strong> extremadament àgil on comunicar-nos, però sense cedir les dades a corporacions estrangeres. El "Directori Local" hui s'ha expandit cap a un <strong>Mercat autòcton</strong>, l'<strong>Agenda</strong> i un <strong>Mapa</strong> integral.</p>
      <p>El respecte per la "Privacitat i el Programari Lliure" s'ha convertit en l'estàndard ètic irrenunciable: zero cookies comercials i zero telemetria invasiva. Les teues dades, textos i missatges són completament el teu patrimoni.</p>

      <h3>El Cercle Virtuós i la Qualitat de Llaurador</h3>
      <p>Nosaltres no construïm per a entorns de laboratori asèptics. Si una aplicació funciona perfectament al camp, sota el sol amb les mans brutes de terra i amb telèfons humils, funcionarà gloriosament a qualsevol altre lloc.</p>

      <h3>La Visió Fonamental (Les quatre infografies històriques)</h3>
      <p>Per entendre l'abast original que hui estem construint pedra a pedra, val la pena recuperar les quatre infografies mestres elaborades fa més d'una dècada. Constitueixen la llavor inalterable que ens guia.</p>

      <div class="">
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-1.jpg" alt="Infografia 1: Valors innegociables i descentralització" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-2.jpg" alt="Infografia 2: Mapeig col·laboratiu geolocalitzat" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-3.jpg" alt="Infografia 3: Viver d'emprenedors rurals" class="" />
        </div>
        <div class="media-frame">
          <img src="/assets/img/que-es-socdepoble-4.jpg" alt="Infografia 4: Mòdul social rural" class="" />
        </div>
      </div>
`;

// Extract existing HTML and replace it
const startToken = '"html": "\\n      <h3>La Visió i el Paradigma</h3>';
const endToken = '        </div>\\n      </div>\\n"\n  },\n  "constitucio"';

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find start or end token in pageContent.js");
    process.exit(1);
}

// Convert newHtml to JSON safe string to fit inside the `html` field
const escapedHtml = JSON.stringify(newHtml);
// Remove first and last quote from JSON.stringify
const cleanEscapedHtml = escapedHtml.substring(1, escapedHtml.length - 1);

const newContent = content.substring(0, startIndex) + '"html": "' + cleanEscapedHtml + '"\n  },\n  "constitucio"' + content.substring(endIndex + endToken.length);

fs.writeFileSync('src/sections/text/pageContent.js', newContent);
console.log("Successfully updated pageContent.js");
