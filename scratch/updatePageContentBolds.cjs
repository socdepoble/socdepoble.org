const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/sections/text/pageContent.js', 'utf8');

const newHtml = `
      <h3>La Visió i el Paradigma</h3>
      <p><strong>Sóc de Poble</strong> és una <strong>xarxa social cívica</strong> i descentralitzada dissenyada específicament per a <strong>entorns rurals</strong>. La nostra <strong>missió final</strong>, l'horitzó on mirem, és <strong>connectar els pobles</strong> mitjançant la <strong>sobirania tecnològica</strong> i assolir la <strong>llibertat</strong> d'una <strong>xarxa autònoma</strong> que funcione <strong>sense internet</strong>. Volem <strong>defugir dels grans monopolis</strong> de dades (les Big Tech) i els intermediaris que compliquen la vida. L'objectiu és que quan un <strong>uelo toque una pantalla</strong>, simplement <strong>sàpiga què fer</strong>, sense pensar en menús, frameworks, IAs ni arquitectura.</p>
      
      <p>La nostra <strong>visió de futur</strong> continua mantenint el rumb cap a eixa <strong>autonomia total</strong> (forjada sense connexió), on la xarxa puga <strong>sobreviure</strong> i ser completament <strong>funcional</strong> inclús si la <strong>connexió mundial cau</strong>, de forma completament <strong>descentralitzada i lliure</strong>.</p>

      <h3>L'Arquitectura de l'"Enxufe": Com ens connectem hui?</h3>
      <p>Per a comprendre com Sóc de Poble és <strong>immune al pas del temps</strong>, cal entendre una idea fonamental: la <strong>separació</strong> entre la <strong>façana</strong> (l'App) i el <strong>magatzem</strong> (les dades). Tradicionalment, una web està <strong>cosida al servidor</strong> que la manté; <strong>si el servidor tanca, la web desapareix</strong>.</p>
      <p>Per això dissenyem un <strong>projecte endollable</strong>. Sóc de Poble és un <strong>client pur</strong> que pot viure a <strong>qualsevol lloc</strong>, i el lloc on es guarden els missatges o les fotos actua només com un <strong>"enxufe" a la paret</strong>. El pragmatisme ens diu que, per donar un <strong>servei útil</strong> i eficient a tothom hui mateix, necessitem una <strong>infraestructura robusta</strong> en línia. Ací és on entra <strong>Sollutia</strong> (Supabase).</p>
      <p>Aquesta infraestructura al núvol és la peça fonamental inicial per tindre l'<strong>aplicació connectada i veloç</strong> a internet. Però el <strong>poder real</strong> rau en el fet que <strong>el connector es pot canviar</strong> per qualsevol altre. Si demà calguera, aquest enxufe <strong>es podria desconnectar</strong> de Sollutia i <strong>connectar-se directament a WordPress</strong>, a <strong>Joomla</strong> o fins i tot a <strong>Wikimedia</strong>. Ells farien de motor per a retornar resultats i dades a l'App <strong>sense que la interfície canvie</strong> absolutament res. Preparant el camí per la desitjada <strong>versió autònoma</strong>.</p>

      <h3>El Cicle de Vida, el Disseny i la Intel·ligència Artificial</h3>
      <p>Us heu preguntat mai per què tot el <strong>disseny sencer</strong>, la <strong>Wiki</strong> del projecte, la <strong>constitució</strong>, el <strong>codi font</strong> i les <strong>lleis de governança s'integren públicament</strong> a la mateixa aplicació? De què s'alimenta realment aquesta web?</p>
      <p>La resposta és el <strong>nostre llegat</strong>. Hui utilitzem la <strong>Intel·ligència Artificial</strong> com a eina incansable de treball (IAs com MarIA, Claude o Codex) per ajudar-nos a <strong>construir i programar ràpidament</strong>. Perquè ens puguen <strong>ajudar bé</strong>, les IAs necessiten <strong>llegir i entendre</strong> les nostres normes, el nostre disseny Pedra Seca i la nostra filosofia "Trellat". <strong>Per això tot està ací dins</strong>.</p>
      <p>Tanmateix, Sóc de Poble es construeix <strong>per a quan la IA desaparega</strong>. Si demà els algoritmes d'intel·ligència artificial <strong>deixaren d'existir</strong> o foren massa cars, <strong>el projecte no cauria</strong> ni quedaria orfe. Com <strong>tot el pensament</strong>, la tecnologia i les decisions <strong>ja estan escrites en llenguatge humà</strong> a la Wiki i explicades de dalt a baix, <strong>no farà falta cap IA</strong> per mantenir-ho. Qualsevol <strong>desenvolupador podrà continuar la feina</strong>. I si el dia de demà existeixen <strong>IAs superiors</strong>, simplement llegint aquesta Wiki podran <strong>millorar el projecte</strong> sense destruir la <strong>nostra identitat</strong>.</p>

      <h3>El Fedivers i les Micro-Xarxes Socials Connectades</h3>
      <p>El nostre anhel <strong>no és convertir Sóc de Poble en una plataforma monolítica gegant</strong> que atrape tothom, sinó <strong>obrir les portes al Fedivers</strong>.</p>
      <p>Aleshores, què és el Fedivers? Imagineu que <strong>diferents pobles</strong>, cadascun amb la <strong>seua pròpia plaça</strong>, la seua pròpia gent i el seu propi alcalde, tinguen la seua <strong>versió independent</strong> de Sóc de Poble. El Fedivers <strong>permet que aquestes "illes" es comuniquen</strong> entre si. Així, <strong>algú del poble A</strong> pot enviar un <strong>missatge a un veí del poble B</strong>, malgrat que <strong>no compartisquen</strong> el mateix servidor ni els <strong>mateixos amos</strong>.</p>
      <p>Aquesta idea no ens l'hem inventada nosaltres. Ja fa anys, projectes pioners com <strong>Diaspora</strong> van intentar crear l'<strong>alternativa a Facebook</strong> utilitzant pods descentralitzats, on <strong>la pròpia gent era mestressa de les seues dades</strong>. Més recentment, el <strong>triomf de Mastodon</strong> com a xarxa descentralitzada ha demostrat que <strong>aquest paradigma és possible i robust</strong>.</p>
      <p>La nostra intenció és forjar <strong>micro-xarxes socials rurals</strong>, mantingudes i <strong>connectades per persones</strong> que creuen profundament que una <strong>eina de comunicació ciutadana</strong> és una <strong>utilitat social bàsica</strong>, no una via per <strong>extreure beneficis i comercialitzar atenció</strong>.</p>

      <h3>Els Orígens (2013): La Llavor del Portal de Pobles Connectats</h3>
      <p>L'<strong>essència d'aquest projecte</strong> es va forjar <strong>fa més d'una dècada</strong>, cap a l'any 2013-2014, amb un <strong>manifest claríssim</strong> que ja s'allotjava originalment al domini <em>socdepoble.net</em>:</p>
      
      <blockquote class="page-content-quote">
        "Un projecte per crear una xarxa social descentralitzada de programari lliure. Un Portal de Pobles Connectats per compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals."
      </blockquote>

      <p>En aquella època, Sóc de Poble <strong>ja comptava amb més de 160.000 seguidors</strong> actius a Facebook. Conscient del <strong>perill de dependre d'aquells algoritmes privats</strong>, el projecte va alçar un <strong>primer mapa</strong> del que havia de ser <strong>l'eixida a la sobirania rural</strong>.</p>
      
      <h3>La Transformació: Del Somni de 2013 al Mas Indestructible d'Hui</h3>
      <p>Si comparem <strong>aquella visió històrica</strong> amb la <strong>realitat actual</strong>, veurem com allò que abans era un "Mòdul Social" bàsic, hui és el robust <strong>Mur Universal on tothom comparteix notícies</strong>, i un <strong>Xat en viu extremadament àgil</strong> on comunicar-nos, però <strong>sense cedir les dades a corporacions</strong> estrangeres. El "Directori Local" hui s'ha expandit cap a un <strong>Mercat autòcton, l'Agenda i un Mapa integral</strong>.</p>
      <p>El respecte per la <strong>Privacitat i el Programari Lliure</strong> s'ha convertit en <strong>l'estàndard ètic irrenunciable</strong>: zero cookies comercials i <strong>zero telemetria invasiva</strong>. Les teues dades, textos i missatges <strong>són completament el teu patrimoni</strong>.</p>

      <h3>El Cercle Virtuós i la Qualitat de Llaurador</h3>
      <p>Nosaltres <strong>no construïm per a entorns de laboratori asèptics</strong>. Si una aplicació funciona perfectament <strong>al camp, sota el sol</strong> amb les <strong>mans brutes de terra</strong> i amb <strong>telèfons humils</strong>, funcionarà gloriosament a <strong>qualsevol altre lloc</strong>.</p>

      <h3>La Visió Fonamental (Les quatre infografies històriques)</h3>
      <p>Per entendre l'<strong>abast original que hui estem construint pedra a pedra</strong>, val la pena <strong>recuperar les quatre infografies mestres</strong> elaborades fa més d'una dècada. Constitueixen la <strong>llavor inalterable que ens guia</strong>.</p>

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
console.log("Successfully updated pageContent.js with bold texts");
