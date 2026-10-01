import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { SelectorDataHora } from '../../../../components/PedraSeca/index.js';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { usePastillaCalendari } from '../../../../components/universal/barres/pastillaCalendari.js';
import { DialegEmoticona } from '../../../../components/universal/classificacio/DialegEmoticona.jsx';

/* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja, en
   els quatre casos que decidix emoticonaDeBarra (utils/emoji.js): edició
   sense i amb emoticona, lectura sense i amb. Es pinta dins de la BarraTaronja
   de veres, perquè el botó és de la família dels cercles de la barra. Els dos
   botons d'edició obrin el DialegEmoticona real i el document de mostra canvia.
   La data segueix la regla del Mestre (260928): en edició, la pastilla de
   l'editor (SelectorDataHora) sense data triada, que diu la d'ara (el
   calendari complet és a l'espècimen del Calendari); en lectura, una data
   fixa de creació.
   Ordre del Mestre, 261001 (tasca 4 i carril A) · En lectura la pastilla
   porta hora i és clicable, com a les pàgines: obri el Calendari en el mes
   de la data (abril de 2026). */

const AUTORIA = {
  authorName: 'Sóc de Poble',
  authorLocation: 'La Torre de les Maçanes',
  authorAvatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
};
const DATA_LECTURA = { time: '11:00', date: '25/04/26', dateTime: '2026-04-25T11:00:00' };
const INICIALS = Object.freeze({ sense: '', amb: '🍅' });

function Barra({ etiqueta, emoticona, onObri }) {
  const alCalendari = usePastillaCalendari(DATA_LECTURA);
  return (
    <div className="sdp-especimen__barres">
      {onObri ? (
        <BarraTaronja {...AUTORIA} etiqueta={etiqueta} emoticona={emoticona} onObriEmoticona={onObri}
          barActions={<SelectorDataHora valor={null} />} />
      ) : (
        <BarraTaronja {...AUTORIA} etiqueta={etiqueta} emoticona={emoticona}
          {...DATA_LECTURA} onDateTime={alCalendari.onClick} etiquetaData={alCalendari.etiqueta} />
      )}
    </div>
  );
}

export default function EspecimenEmoticonaBarra() {
  const [emoticones, setEmoticones] = useState(INICIALS);
  const [obert, setObert] = useState(null); // 'sense' | 'amb'
  const tanca = () => setObert(null);
  return (
    <>
      <Llinatge id="emoticona-barra" />
      <Especimen id="emoticona-barra" nom="EmoticonaBarra · l’espai central de la barra taronja"
        fitxer="src/components/universal/EmoticonaBarra.jsx · utils/emoji.js (emoticonaDeBarra)"
        descripcio="La barra taronja té tres columnes: autoria, l’espai central i les accions amb la data. Al centre viu l’emoticona del document. El mode es deduïx de la presència d’onObri, com la bola del món: amb ell és edició i sense, lectura. A la barra taronja, la ploma blanca (lucide Feather) és este botó: vol dir «triar l’emoticona» i es veu en edició mentre no n’hi ha cap. Fora de la barra, la botonera de classificació de davall del títol també la mostra al seu botó Emoticona quan no n’hi ha cap. L’autodesament ja no la fa servir: el seu glif és el núvol (CloudUpload)."
        contracte={[
          ['emoticona', 'string', "''", 'El camp CRU del document: un sol emoji o res. Mai el model de vista de la llista, que porta la 🪶 de reserva.'],
          ['onObri', 'fn | null', 'null', 'Amb ell, edició: un <button aria-haspopup="dialog"> que obri el diàleg d’emoticona del pare. Sense, lectura.'],
          ['emoticonaDeBarra', '({ mode, icon }) => { mostra, glif, triada }', '—', "Funció pura (utils/emoji.js): mostra és 'boto', 'glif' o 'res'. La fa servir també la caputxa de la UniversalCard."],
        ]}
        a11y={[
          'En edició és un botó amb nom: «Triar l’emoticona del document», o «Emoticona del document: 🍅. Canviar-la». Anuncia que obri una finestra.',
          'En lectura l’emoticona és role="img" amb nom; sense emoticona, la cel·la és buida i aria-hidden.',
          'El focus del botó porta l’anell de la barra (--sdp-sobre-accent): damunt del taronja, l’anell general no arriba al contrast.'
        ]}
        fes={[
          'Passar-li sempre el camp cru del document (icon), mai item.icon de la llista.',
          'Obrir el mateix diàleg que el botó «Emoticona» de la botonera de davall del títol: tots dos es conserven.',
          'En edició, la pastilla de data diu la data triada al calendari o, si no n’hi ha, la d’ara (decisió del Mestre, 260928); la data fixa, només en lectura, on la pastilla obri el Calendari en el mes de la data (261001).'
        ]}
        noFacis={[
          'Pintar la ploma en lectura, o fer-la servir per a dir «canvis pendents».',
          'Una emoticona per defecte: sense tria, la cel·la queda buida.'
        ]}>
        <h4>Edició sense emoticona: la ploma blanca</h4>
        <Barra etiqueta="Autoria i data (espècimen, edició sense emoticona)" emoticona={emoticones.sense} onObri={() => setObert('sense')} />
        <h4>Edició amb emoticona: l’emoticona és el botó</h4>
        <Barra etiqueta="Autoria i data (espècimen, edició amb emoticona)" emoticona={emoticones.amb} onObri={() => setObert('amb')} />
        <h4>Lectura sense emoticona: la cel·la queda buida</h4>
        <Barra etiqueta="Autoria i data (espècimen, lectura sense emoticona)" emoticona="" />
        <h4>Lectura amb emoticona</h4>
        <Barra etiqueta="Autoria i data (espècimen, lectura amb emoticona)" emoticona="🍅" />
        {obert ? (
          <DialegEmoticona key={obert} obert onTanca={tanca} actual={emoticones[obert]}
            onDesa={(emoji) => { setEmoticones((previ) => ({ ...previ, [obert]: emoji })); tanca(); }} />
        ) : null}
      </Especimen>
    </>
  );
}
