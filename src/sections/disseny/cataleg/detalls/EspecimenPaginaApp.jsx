/**
 * EspecimenPaginaApp.jsx — la Pàgina Universal de les apps (ordre del Mestre,
 * 261004, prompt 261004_0515; D-A del xat de les 06:38). Pedra Seca §9:
 * l'espècimen abans de la producció (el detall de Notícies i de la Nevera).
 * Dades de mostra, sense cap persona.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Boto, PaginaApp } from '../../../../components/PedraSeca/index.js';

export default function EspecimenPaginaApp() {
  const [avis, setAvis] = useState('Encara no has premut cap botó de la mostra.');
  return (
    <Especimen id="pagina-app" nom="PaginaApp · la Pàgina Universal de les apps" fitxer="src/components/PedraSeca/organismes/PaginaApp.jsx"
      descripcio="El detall d’un element d’una app (una notícia, un article de la Nevera) amb l’anatomia de sempre: barra blava (Tornar, Índex, Traduir, Comentar, Compartir i Connectar), portada, barra taronja d’autoria i data, el bloc del títol i l’article. Munta PageFrame, però és la porta que les apps sí que poden obrir: sense traductor (Traduir ho diu i cap text ix cap al servei), sense telemetria (el Connectar no compta) i amb les imatges privades (una portada o un avatar d’un servidor de fora no es pinten). La pastilla de data és text: un element d’una app no és al Calendari."
      contracte={[
        ['title / subtitle / lead', 'node', '—', 'L’H1 únic de la pàgina, l’H2 i l’entradilla (PageFrame).'],
        ['author', '{ nom, avatar, href, poble }', 'null', 'La barra taronja. Sense, signa «Sóc de Poble» i porta a la pàgina del projecte (T6). L’avatar passa pel filtre privat.'],
        ['date / time / dateTime', 'string', '—', 'La pastilla de la barra taronja, en text.'],
        ['heroImage / heroAlt', 'string', '—', 'La portada: només el mateix origen o el de mitjans, demanada sense referent. Una de fora no es pinta.'],
        ['labels', '(string | { text, className })[]', '[]', 'Les píndoles de davall de l’H1.'],
        ['accioPrincipal', 'node', 'null', 'L’acció gran de la pàgina, dins del bloc del títol (div.page-title-accio), davall de l’H1 i de les etiquetes.'],
        ['onBack', 'fn', '—', 'Tornar de la barra blava: tanca el detall.'],
        ['refTitol', 'ref', '—', 'Un ref a l’H1 (amb tabIndex -1) per a portar-hi el focus quan s’obri.'],
        ['objecte / onComment / onShare / onConnect / showComment / showShare / showConnect', '—', '—', 'Les accions de la barra blava, com a PageFrame. Sense, les de sempre. Una llista privada no té res a compartir: showShare={false}.'],
        ['children', 'node', '—', 'El cos, dins de l’article de la pàgina.']
      ]}
      a11y={['Un sol H1: el títol de la pàgina. En esta mostra no n’hi ha cap, perquè la pàgina de Disseny ja porta el seu.', 'Amb refTitol, l’H1 rep el focus en obrir el detall (tabIndex -1).']}
      fes={['El detall d’un element d’una app: PaginaApp, per la façana de Pedra Seca.', 'Una imatge d’un article de fora: no es pinta; l’enllaç a l’article sí.']}
      noFacis={['Importar PageFrame, UniversalPage o el traductor des de src/apps.', 'Comptar el Connectar d’una app a la telemetria.']}>
      <PaginaApp
        subtitle="Obri la biblioteca de dissabte"
        lead="Cada dissabte de 10:00 a 13:00, amb préstec de llibres i jocs per a la canalla."
        author={{ nom: 'Notícies del Poble', poble: 'La Torre de les Maçanes', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' }}
        time="09:30" date="04/10/26" dateTime="2026-10-04T09:30"
        heroImage="/assets/nano_cards/mur_nano_card.jpg"
        labels={[{ text: 'Notícies', className: 'sdp-badge-system' }]}
        accioPrincipal={<Boto varietat="primari" onClick={() => setAvis('Has premut l’acció principal de la mostra.')}>Desa per a després</Boto>}
        onBack={() => setAvis('Has premut Tornar: el detall es tancaria.')}
      >
        <p>La biblioteca municipal obri també els dissabtes de matí. Hi haurà un racó de jocs de taula i un taller de lectura.</p>
      </PaginaApp>
      <p role="status">{avis}</p>
    </Especimen>
  );
}
