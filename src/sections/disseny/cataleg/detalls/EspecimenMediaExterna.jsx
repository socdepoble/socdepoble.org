import { Play } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Accordion, AccordionItem } from '../../../../components/PedraSeca/index.js';

export default function EspecimenMediaExterna() {
  return (
    <Especimen id="media-externa" nom="Media externa: vídeo, mapa i àudio" fitxer="src/css/modules.css (.embed-container · .audio-player)"
      descripcio="Incrustacions de tercers amb contenidor de proporció fixa i peu de foto, mapa amb alternativa textual i reproductor d'àudio del podcast local."
      a11y={['Tot iframe porta title.', 'El mapa té un enllaç alternatiu a OpenStreetMap.', 'Peu de foto (.embed-caption) en text.']}
      fes={['youtube-nocookie i referrerPolicy estricta.', 'loading="lazy" als iframes fora de la primera pantalla.']}
      noFacis={['Autoplay amb so.', 'Incrustar sense peu que diga què és.']}>
      <h4>Vídeo (HTML5 natiu)</h4>
      <div className="embed-container">
        <iframe
          src="https://www.youtube-nocookie.com/embed/Fadaa7Kyxm0"
          title="Sóc de Poble: Portal de pobles connectats"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
      <div className="embed-caption">Sóc de Poble: Portal de pobles connectats (2013)</div>
      <Accordion>
        <AccordionItem title="Descripció del vídeo original">
          <p>Un projecte per col·laborar en el desenvolupament sostenible i tecnològic en entorns rurals. Sóc de Poble serà un portal de pobles connectats on compartir informació, experiències i idees que faciliten el desenvolupament sostenible i tecnològic en entorns rurals, per posar en valor els recursos locals, que són l’essència de la nostra identitat.</p>
          <ol>
            <li>Base de dades obertes. Mapa directori de recursos locals.</li>
            <li>Cercador temàtic.</li>
            <li>Xarxa social de productivitat.</li>
            <li>Revista digital.</li>
            <li>Vivers TIC de poble: vivers virtuals d’emprenedors rurals.</li>
          </ol>
          <h4>Guió del vídeo</h4>
          <p>Pepet toca el clarinet. Viu tranquil i bé en un poble menut. Vol aprendre més, però ha d’anar a la ciutat… A l’altra banda de les muntanyes viu la Rosa, apicultora, que ha de baixar a vendre la seua mel. Sóc de Poble vol ser pont, xarxa oberta que connecte pobles, persones, empreses i col·lectius. Sóc de poble… i tinc veu. I tu? Et sumes?</p>
        </AccordionItem>
      </Accordion>

      <h4>Mapa (iframe amb alternativa)</h4>
      <iframe
        width="100%"
        height="360"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="Mapa de La Torre de les Maçanes a OpenStreetMap"
        src="https://www.openstreetmap.org/export/embed.html?bbox=-0.61,38.50,-0.22,38.71&layer=mapnik&marker=38.5919,-0.4184"
      />
      <div className="embed-caption"><a href="https://www.openstreetmap.org/?mlat=38.5919&mlon=-0.4184#map=12/38.5919/-0.4184" target="_blank" rel="noopener noreferrer">Veure el mapa més gran a OpenStreetMap →</a></div>

      <h4>Àudio (podcast local)</h4>
      <div className="audio-player">
        <button type="button" className="audio-play-btn" aria-label="Reproduir"><Play size={20} aria-hidden="true" /></button>
        <div className="audio-progress"><div className="audio-progress-fill"></div></div>
        <div className="audio-time">12:45</div>
      </div>
      <div className="embed-caption">Podcast «Històries de poble» · Episodi 1</div>
    </Especimen>
  );
}
