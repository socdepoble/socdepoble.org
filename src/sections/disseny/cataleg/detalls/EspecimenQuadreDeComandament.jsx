import { Especimen } from '../Especimen.jsx';
import { QuadreDeComandament } from '../../../../components/PedraSeca/index.js';

/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · El motlle de
   tauler compacte, amb dades inventades: un tauler de visites (com el de
   /legal) i una caixa del dia d'un TPV, amb la mateixa peça. */
const VISTES = [12, 4, 0, 0, 0, 0, 3, 9, 21, 34, 28, 19, 25, 40, 18, 12, 22, 31, 27, 15, 9, 6, 11, 8];
const VISITANTS = [3, 1, 0, 0, 0, 0, 1, 4, 7, 9, 8, 6, 7, 11, 5, 4, 6, 8, 7, 5, 3, 2, 4, 3];
const HORES = VISTES.map((vistes, h) => {
  const hh = String(h).padStart(2, '0');
  return { id: `h${hh}`, etiqueta: `${hh}:00 h`, marca: h % 6 === 0 ? hh : '', valors: { visitants: VISITANTS[h], vistes } };
});
const enParaules = (valor, una, moltes) => `${valor.toLocaleString('ca-ES')} ${valor === 1 ? una : moltes}`;

const VENDES = [0, 0, 0, 0, 0, 0, 0, 42, 118, 96, 64, 71, 133, 158, 87, 20, 0, 0, 39, 77, 102, 81, 46, 0];
const EUROS = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' });
const CAIXA = VENDES.map((euros, h) => {
  const hh = String(h).padStart(2, '0');
  return { id: `c${hh}`, etiqueta: `${hh}:00 h`, marca: h % 6 === 0 ? hh : '', valors: { euros } };
});

/* Gauntlet f8 (F8-CRIT-03) · Una gestoria: el resultat de cada mes pot ser
   negatiu, i la gràfica el baixa des de la línia del zero. */
const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
const RESULTAT = [1840, -320, 615, 2210, -40, 1325, 980, -760, 1490, 2045, 0, 1180];
const ANY = MESOS.map((mes, m) => ({ id: `m${m}`, etiqueta: mes, marca: m % 3 === 0 ? mes.slice(0, 3) : '', valors: { resultat: RESULTAT[m] } }));

export default function EspecimenQuadreDeComandament() {
  return (
    <Especimen id="quadre-comandament" nom="QuadreDeComandament" fitxer="src/components/PedraSeca/organismes/QuadreDeComandament.jsx"
      descripcio="El motlle de tauler compacte de Sóc de Poble, com els d’Umami, Holded o Loyverse: una píndola d’estat, targetes baixes d’etiqueta i xifra, l’explicació de cada xifra fora de les caixes, una gràfica d’una o dues sèries amb el detall exacte del punt sota el ratolí, el dit o el teclat, i un rànquing d’una línia per fila. Tot arriba per props; la peça no demana res a ningú. Estils: src/css/taulers.css."
      contracte={[
        ['estat', '{ text, viu }', 'null', 'La píndola de dalt; viu: punt verd.'],
        ['periode', 'node', 'null', 'De quan són les xifres, en cos de paràgraf.'],
        ['xifres', '{ clau, nom, valor, lector? }[]', '[]', 'Targetes KPI: només etiqueta i xifra; lector, el text sencer.'],
        ['explicacio', 'node', 'null', 'Què vol dir cada xifra, a tota amplada i fora de les caixes.'],
        ['grafica', '{ titol, series, punts, destacat?, detall?, llengua?, buit, falta }', 'null', 'Una o dues sèries; la primera va davant, estreta i fosca. Alçades exactes; els negatius baixen des de la línia del zero; un valor absent (null) no pinta barra i el detall per defecte diu «—». Sense detall, el valor va amb el format de llengua («ca»). punts: null, la dada no ha arribat.'],
        ['ranquing', '{ titol, intro?, files, buit, falta, nota? }', 'null', 'files: { clau, nom, codi?, valor, proporcio? } (proporció de 0 a 1, amplada exacta).'],
        ['peu', 'node', 'null', 'Al final: d’on venen les xifres, l’enllaç a l’original…'],
        ['nivell', '2-6', '4', 'El nivell del títol del rànquing.']
      ]}
      a11y={[
        'Cada punt de la gràfica és un botó amb el detall sencer per nom; un sol tabulador entra al grup i les fletxes, Inici i Fi el recorren.',
        'El detall de davall de la gràfica és text real, no un title, i mana l’última interacció: el ratolí, el dit o el teclat. El dibuix de les barres és aria-hidden.',
        'Un anell del color de la targeta separa les dues sèries (cada parella veïna, 3:1 o més); en colors forçats, colors del sistema i la columna triada amb una vora de traços.',
        'Amb el dit, tota la gràfica és superfície de toc: es toca o s’arrossega en horitzontal, i en vertical la pàgina fa scroll.',
        'El rànquing és una llista amb el nom del seu títol; la barra de proporció és decoració.'
      ]}
      fes={['Posar l’explicació de les xifres a explicacio, amb el cos de la pàgina.', 'Donar un detall(punt) en paraules («03:00 h: 136 vistes · 9 visitants»).', 'Passar els valors tal qual: un negatiu, negatiu, i una dada que no hi és, null (mai un zero).']}
      noFacis={['Explicacions dins de les targetes KPI.', 'Demanar dades des de la peça: arriben per props.', 'Més de dues sèries: fes-ne dues gràfiques.']}>
      <QuadreDeComandament
        nivell={5}
        estat={{ viu: true, text: 'En línia ara mateix: 3 persones (mostra)' }}
        periode="Les últimes 24 hores, fins a les 23:40 (mostra)."
        xifres={[
          { clau: 'visitants', nom: 'Visitants', valor: '41' },
          { clau: 'visites', nom: 'Visites', valor: '58' },
          { clau: 'vistes', nom: 'Vistes', valor: '384' },
          { clau: 'rebot', nom: 'Percentatge de rebot', valor: '31 %' },
          { clau: 'temps', nom: 'Temps mitjà de visita', valor: '4 min 12 s', lector: '4 minuts i 12 segons' }
        ]}
        explicacio={(
          <ul>
            <li><strong>Visitants</strong>: navegadors diferents que han entrat.</li>
            <li><strong>Vistes</strong>: pàgines obertes en total.</li>
          </ul>
        )}
        grafica={{
          titol: 'Visitants i vistes de cada hora (mostra)',
          series: [{ clau: 'visitants', nom: 'Visitants' }, { clau: 'vistes', nom: 'Vistes' }],
          punts: HORES,
          destacat: 'h23',
          detall: ({ etiqueta, valors }) => `${etiqueta}: ${enParaules(valors.vistes, 'vista', 'vistes')} · ${enParaules(valors.visitants, 'visitant', 'visitants')}`,
          buit: 'Cap vista (mostra).',
          falta: 'La gràfica no ha arribat (mostra).'
        }}
        ranquing={{
          titol: 'Les seccions més visitades (mostra)',
          files: [
            { clau: 'xat', nom: 'Xat', codi: '/xat', valor: '18 visitants', proporcio: 1 },
            { clau: 'mur', nom: 'El Mur', codi: '/mur', valor: '11 visitants', proporcio: 11 / 18 },
            { clau: 'notes', nom: 'Bloc de notes', codi: '/notes', valor: '6 visitants', proporcio: 6 / 18 }
          ],
          buit: 'Cap secció (mostra).',
          falta: 'La llista no ha arribat (mostra).'
        }}
        peu={<p>Xifres inventades per a la mostra.</p>}
      />
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <QuadreDeComandament
          nivell={5}
          estat={{ viu: false, text: 'Caixa tancada (mostra)' }}
          xifres={[
            { clau: 'vendes', nom: 'Vendes', valor: EUROS.format(1134.5) },
            { clau: 'tiquets', nom: 'Tiquets', valor: '87' }
          ]}
          grafica={{
            titol: 'Vendes de cada hora (mostra)',
            series: [{ clau: 'euros', nom: 'Vendes' }],
            punts: CAIXA,
            detall: ({ etiqueta, valors }) => `${etiqueta}: ${EUROS.format(valors.euros)}`,
            buit: 'Cap venda (mostra).',
            falta: 'Les vendes no han arribat (mostra).'
          }}
          ranquing={{
            titol: 'El més venut (mostra)',
            files: [
              { clau: 'cafe', nom: 'Cafè', valor: '64' },
              { clau: 'esmorzar', nom: 'Esmorzar', valor: '23' }
            ],
            buit: 'Res venut (mostra).',
            falta: 'La llista no ha arribat (mostra).'
          }}
        />
      </div>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <QuadreDeComandament
          estat={{ viu: false, text: 'Exercici tancat (mostra)' }}
          xifres={[{ clau: 'resultat', nom: 'Resultat de l’any', valor: EUROS.format(RESULTAT.reduce((suma, euros) => suma + euros, 0)) }]}
          grafica={{
            titol: 'Resultat de cada mes (mostra)',
            series: [{ clau: 'resultat', nom: 'Resultat' }],
            punts: ANY,
            detall: ({ etiqueta, valors }) => `${etiqueta}: ${EUROS.format(valors.resultat)}`,
            buit: 'Cap moviment (mostra).',
            falta: 'Els comptes no han arribat (mostra).'
          }}
        />
      </div>
    </Especimen>
  );
}
