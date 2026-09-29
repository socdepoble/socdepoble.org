/**
 * EspecimenXatRail.jsx — el rail del Xat i les vistes que obri (onada 3B,
 * captura 19.11.50; Pedra Seca §9): RailXat desplegat, amb les seccions
 * plegables «Més» i «Comunitats» i el peu fix, i plegat (només icones); i
 * VistaEnConstruccio en les tres vistes que encara no fan res (Telefonades,
 * Contingut multimèdia i Destacats, captures 19.41.49, 19.41.58 i 19.42.17).
 *
 * El rail és el de producció dins d'un AppGridContext de mentida (mida
 * «ample»): la navegació es fa local amb `onVes`, i prémer una entrada la
 * marca com a activa, amb el marcador blanc de 3px (T62b). Les seccions es
 * pleguen i despleguen de veres, però amb recordaSeccions={false}: una
 * demostració del catàleg no toca les preferències del rail de l'app.
 */
import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import { ENTRADES_RAIL, RailXat, entradaDeVista } from '../../../xat/components/ClosCaXat.jsx';
import VistaEnConstruccio, { VISTES_EN_CONSTRUCCIO, textosDeVista } from '../../../xat/components/VistaEnConstruccio.jsx';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

const t = (clau, alternativa) => alternativa;
const noop = () => {};
const AMPLE = Object.freeze({ mida: 'ample', setPanellObert: noop, panellObert: null });

/* De la ruta que demanaria el rail a l'entrada activa, com ho fa XatSection. */
export function activaDeRuta(ruta) {
  const url = new URL(ruta, 'https://socdepoble.org');
  if (url.pathname === '/control-xat') return { activa: 'control', comunitatActiva: null };
  const vista = url.searchParams.get('vista');
  if (vista && entradaDeVista(vista)) return { activa: vista, comunitatActiva: null };
  const comunitat = url.searchParams.get('comunitat');
  if (comunitat) return { activa: 'comunitat', comunitatActiva: comunitat };
  return { activa: 'converses', comunitatActiva: null };
}

function Rail({ plegat, etiqueta, comunitats, setAvis }) {
  const [estat, setEstat] = useState({ activa: 'comunitats', comunitatActiva: null });
  const ves = (ruta) => {
    setEstat(activaDeRuta(ruta));
    setAvis(`El rail portaria a ${ruta}.`);
  };
  return (
    <div className={`sdp-xat sdp-xat-especimen sdp-xat-especimen--rail${plegat ? ' sdp-xat-especimen--carril' : ''}`} role="group" aria-label={etiqueta}>
      <AppGridContext.Provider value={AMPLE}>
        <RailXat
          {...estat}
          plegat={plegat}
          onAlterna={() => setAvis(plegat ? 'Expandir: el rail es desplegaria.' : 'Replegar: el rail es plegaria.')}
          titol="Menú"
          t={t}
          comunitats={comunitats}
          joId="jo"
          joNom="Javi Llinares"
          onVes={ves}
          recordaSeccions={false}
        />
      </AppGridContext.Provider>
    </div>
  );
}

export default function EspecimenXatRail() {
  const [avis, setAvis] = useState('Prem una entrada del rail o un control de les vistes.');
  const { comunitats } = useMemo(() => mostraDelXat(), []);

  return (
    <Especimen id="xat-rail" nom="Xat · rail i vistes" fitxer="src/sections/xat/components/ClosCaXat.jsx (RailXat) · VistaEnConstruccio.jsx"
      descripcio="El menú de l’esquerra del Xat, calcat del de WhatsApp per a Mac: Xats, Novetats, Comunitats, Telefonades i Contingut multimèdia; la secció plegable «Més» amb Destacats; la secció plegable «Comunitats» amb les comunitats (avatar quadrat); i, al peu, l’avatar propi, «Tu» i el llapis «Edita el perfil». Plegat, les mateixes entrades en el mateix ordre. Novetats obri el Control del xat (excepció de l’onada 3B); les altres, una vista de la columna central. Telefonades, Contingut multimèdia i Destacats encara no fan res: la seua vista ho diu."
      contracte={[
        ['RailXat', '{ activa, comunitatActiva?, plegat, onAlterna, titol, t, comunitats?, joId?, joNom?, onVes?, recordaSeccions? }', "'converses' · recordaSeccions: true", "activa: 'converses', 'control', 'comunitat' o l’id d’una vista; onVes substituïx la navegació; recordaSeccions: false no desa les seccions (el catàleg). Llig la mida d’AppGridShell (useAppGrid)."],
        ['ENTRADES_RAIL', '{ id, accio, Icona, clau, text, seccio? }[]', '—', "accio: 'converses' (/xat), 'control' (/control-xat, commutador) o 'vista' (/xat?vista=<id>)."],
        ['clauSeccio(id)', "'mes' | 'comunitats'", '—', 'La preferència de cada secció plegable (getVal/setVal), com la del rail. La secció que conté l’entrada activa s’obri en arribar-hi, sense tocar la preferència.'],
        ['VistaEnConstruccio', '{ titol, icona?, icones?, subtitol?, accio?, segments?, cerca?, descripcio?, esquerra?, onEnConstruccio?, t }', '—', 'La columna central d’una vista sense lògica: controls inerts (aria-disabled) i la targeta «En construcció». icones: botons d’icona de la fila de títol ({ etiqueta, Icona }).'],
        ['textosDeVista(id, t)', "'telefonades' | 'multimedia' | 'destacats'", 'null', 'Els textos de cada vista, traduïts, calcats de la seua captura.']
      ]}
      a11y={[
        'L’entrada de la vista oberta porta aria-current="page" i, a més del blau, el marcador blanc de 3px (WCAG 1.4.1).',
        '«Novetats» és un commutador: aria-pressed diu si el Control està obert.',
        'Les seccions són botons amb aria-expanded i aria-controls; el nom diu «Secció …» perquè no es confonga amb l’entrada «Comunitats». Plegades, el contingut és hidden.',
        'Si la persona plega la secció on és l’entrada activa, la capçalera porta el marcador blanc i el nom diu «…, amb la pàgina actual».',
        'Fora d’ample, triar una entrada torna el focus al botó que obri el rail, també quan la tria canvia la fila de títol de la columna central.',
        'Els controls de les vistes en construcció es poden enfocar i llegir (aria-disabled, no disabled) i, en prémer-los, diuen «En construcció».'
      ]}
      fes={['Totes les icones i els avatars del rail, de 24 i sobre l’eix de 28.', 'Dir què hi haurà en cada vista en construcció i que encara no està disponible.']}
      noFacis={['Un toast de «pendent» en lloc de la vista: l’esquelet de navegació ha de ser el de la captura.', 'Copiar el verd de WhatsApp: el rail és crom fosc.']}>
      <h4>Desplegat: seccions «Més» i «Comunitats» i el peu</h4>
      <Rail plegat={false} etiqueta="Rail desplegat de mostra" comunitats={comunitats} setAvis={setAvis} />

      <h4>Plegat: només icones</h4>
      <Rail plegat={true} etiqueta="Rail plegat de mostra" comunitats={comunitats} setAvis={setAvis} />

      <h4>Vistes en construcció</h4>
      {Object.keys(VISTES_EN_CONSTRUCCIO).map((id) => {
        const entrada = ENTRADES_RAIL.find((e) => e.id === id);
        const titol = t(entrada.clau, entrada.text);
        return (
          <div key={id} className="sdp-xat sdp-xat-especimen">
            <aside className="sdp-workspace-column" aria-label={titol}>
              <VistaEnConstruccio {...textosDeVista(id, t)} titol={titol} icona={entrada.Icona} t={t}
                onEnConstruccio={() => setAvis(`${titol}: en construcció.`)} />
            </aside>
          </div>
        );
      })}
      <p role="status">{avis}</p>
    </Especimen>
  );
}
