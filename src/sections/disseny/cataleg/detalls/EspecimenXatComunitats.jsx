/**
 * EspecimenXatComunitats.jsx — les comunitats del Xat (onada 3, T67, i
 * onada 3B; Pedra Seca §9): la fitxa d'una comunitat a la columna de llista
 * (FitxaComunitat, captures 19.42.54 i 19.43.00) i la vista «Comunitats» de
 * la columna central (VistaComunitats, captura 19.41.43), amb dades i buida.
 *
 * Components de producció sobre la llavor de mostraDelXat(), dins d'una
 * columna com la de la closca (.sdp-xat), sense cap context de l'app.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import FitxaComunitat from '../../../xat/components/FitxaComunitat.jsx';
import VistaComunitats from '../../../xat/components/VistaComunitats.jsx';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';
const CAP = Object.freeze([]);

function Columna({ etiqueta, children }) {
  return (
    <div className="sdp-xat sdp-xat-especimen">
      <aside className="sdp-workspace-column" aria-label={etiqueta}>{children}</aside>
    </div>
  );
}

export default function EspecimenXatComunitats() {
  const [avis, setAvis] = useState('Prem una fila, «Veure-ho tot» o un «+».');
  const [filActiu, setFilActiu] = useState('g-sdp');
  const { comunitats } = mostraDelXat();
  const obriFil = (id) => { setFilActiu(id); setAvis(`Obriria la conversa ${id} a la columna dreta.`); };
  const soc = comunitats.find((c) => c.fil.id === 'c-sdp') || comunitats[0];

  return (
    <Especimen id="xat-comunitats" nom="Xat · comunitats" fitxer="src/sections/xat/components/ (FitxaComunitat, VistaComunitats)"
      descripcio="Una comunitat no té missatges: agrupa els seus Avisos (el canal, amb el megàfon) i els seus grups. La fitxa viu a la columna de llista (/xat?comunitat=<id>) i porta «+ Afegir grup». La vista «Comunitats» (/xat?vista=comunitats, des del rail) les posa totes una darrere de l’altra: capçalera amb l’avatar quadrat i el nom en negreta, els Avisos primer, els grups amb l’hora i l’avanç de la llista, i «Veure-ho tot ›», que obri la fitxa."
      contracte={[
        ['FitxaComunitat', '{ comunitat, filActiuId?, onObriFil, onAfegirGrup, locale, t, joId? }', '—', 'La fitxa a la columna de llista; «Afegir grup» diu d’on naixen els grups.'],
        ['VistaComunitats', '{ comunitats, filActiuId?, onObriFil, onObriComunitat, onNova, esquerra?, carregant?, locale, t, joId? }', '—', 'La vista de la columna central; esquerra és el botó que obri el rail (estret i mitjà).'],
        ['fillsEnOrdre', '(fills) => fills', '[]', 'Els Avisos primer i després els grups, sense tocar-ne l’ordre d’activitat.']
      ]}
      a11y={[
        'Cada comunitat de la vista és una regió amb el seu nom (aria-labelledby a la capçalera h3).',
        '«Veure-ho tot» porta el nom de la comunitat en el nom accessible: «Veure-ho tot de Sóc de Poble».',
        'Les files són les de la llista: el tipus en text per a lectors de pantalla i aria-current a la conversa oberta.'
      ]}
      fes={['Els Avisos sempre primer, amb el megàfon, encara que el canal haja heretat una imatge.', 'Dir d’on naixen les comunitats: de la Pàgina Universal d’una entitat o d’un poble.']}
      noFacis={['Crear comunitats des del «+»: cap RPC en crea; el «+» avisa.', 'Obrir una comunitat com si fóra una conversa.']}>
      <h4>Fitxa d’una comunitat (columna de llista)</h4>
      <Columna etiqueta="Fitxa de mostra">
        <div className="sdp-workspace-column__body">
          <FitxaComunitat comunitat={soc} filActiuId={filActiu} onObriFil={obriFil}
            onAfegirGrup={() => setAvis('Afegir grup: avisaria que els grups naixen d’una Pàgina Universal.')} locale={LOCALE} t={t} joId="jo" />
        </div>
      </Columna>

      <h4>Vista «Comunitats» (columna central)</h4>
      <Columna etiqueta="Comunitats">
        <VistaComunitats comunitats={comunitats} filActiuId={filActiu} onObriFil={obriFil}
          onObriComunitat={(id) => setAvis(`Veure-ho tot: obriria la fitxa de ${id}.`)}
          onNova={() => setAvis('«+»: avisaria que les comunitats naixen de la Pàgina Universal d’una entitat o d’un poble.')}
          locale={LOCALE} t={t} joId="jo" />
      </Columna>

      <h4>Vista «Comunitats» sense cap comunitat</h4>
      <Columna etiqueta="Comunitats sense cap">
        <VistaComunitats comunitats={CAP} onNova={() => setAvis('«+»: avisaria d’on naixen.')} locale={LOCALE} t={t} />
      </Columna>
      <p role="status">{avis}</p>
    </Especimen>
  );
}
