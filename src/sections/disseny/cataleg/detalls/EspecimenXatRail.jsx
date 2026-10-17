/**
 * EspecimenXatRail.jsx — el rail del Xat i les vistes que obri (onada 3B,
 * captura 19.11.50; Pedra Seca §9): RailXat desplegat, amb les seccions
 * plegables «Més» i «Comunitats» i el peu fix, i plegat (només icones); i
 * les vistes de la columna central: VistaEnConstruccio en les dos que encara
 * no fan res (Telefonades i Destacats, captures 19.41.49 i 19.42.17) i
 * VistaMultimedia (Contingut multimèdia, captura 19.41.58), operativa des de
 * l'ordre del Mestre del 261004 (prompt 261004_0515, T5), amb missatges de
 * mostra que porten enllaços (un amb domini enganyós).
 *
 * El rail és el de producció dins d'un AppGridContext de mentida (mida
 * «ample»): la navegació es fa local amb `onVes`, i prémer una entrada la
 * marca com a activa, amb el marcador blanc de 3px (T62b). Les seccions es
 * pleguen i despleguen de veres, però amb recordaSeccions={false}: una
 * demostració del catàleg no toca les preferències del rail de l'app.
 *
 * D16 (260930): «Novetats» és amagada (amagada: true a ENTRADES_RAIL) i el
 * rail no la pinta; el Control del xat s'obri des del Panell de Control.
 * D17: la vista Telefonades porta el seu avís propi (textosDeVista).
 *
 * Revisió adversarial 260930 (P2) · El peu és el de producció: RailXat rep
 * `onAjustos`, i «Tu: ajustos» (l'avatar i «Tu» desplegat; l'avatar plegat)
 * diu a l'avís que obriria el full. Sense onAjustos es pintava el peu
 * d'abans, que ja no existix a l'app.
 */
import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import { ENTRADES_RAIL, RailXat, entradaDeVista } from '../../../xat/components/ClosCaXat.jsx';
import VistaEnConstruccio, { textosDeVista } from '../../../xat/components/VistaEnConstruccio.jsx';
import VistaMultimedia from '../../../xat/components/VistaMultimedia.jsx';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

const t = (clau, alternativa) => alternativa;
const noop = () => {};
const AMPLE = Object.freeze({ mida: 'ample', setPanellObert: noop, panellObert: null });

/* Les vistes de la columna central, en l'ordre del rail. */
const VISTES = Object.freeze(['telefonades', 'multimedia', 'destacats']);

/* Missatges de mostra amb enllaços per a la pestanya «Enllaços» de
   Contingut multimèdia; el segon porta un domini punycode (l'avís). */
const MISSATGES_AMB_ENLLACOS = Object.freeze({
  'g-festes': [
    { id: 'mm-1', seq: 1, sender: 'other', author: 'Pepica', text: 'El programa de festes: https://socdepoble.org/festes', creatAl: '2026-10-02T17:30:00Z' },
    { id: 'mm-2', seq: 2, sender: 'me', text: 'I el cartell, ací: https://socdepoble.org/cartell', creatAl: '2026-09-21T10:15:00Z' }
  ],
  'k-torre': [
    { id: 'mm-3', seq: 1, sender: 'other', author: 'Ajuntament', text: 'Compte amb este enllaç: http://xn--pple-43d.com/entra', creatAl: '2026-10-03T08:00:00Z' }
  ]
});

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
          onAjustos={() => setAvis('Obriria el full «Ajustos».')}
          recordaSeccions={false}
        />
      </AppGridContext.Provider>
    </div>
  );
}

export default function EspecimenXatRail() {
  const [avis, setAvis] = useState('Prem una entrada del rail o un control de les vistes.');
  const { comunitats, fils } = useMemo(() => mostraDelXat(), []);

  return (
    <Especimen id="xat-rail" nom="Xat · rail i vistes" fitxer="src/sections/xat/components/ClosCaXat.jsx (RailXat) · VistaEnConstruccio.jsx · VistaMultimedia.jsx"
      descripcio="El menú de l’esquerra del Xat, amb el patró de missatgeria que la gent ja coneix: Xats, Comunitats, Telefonades i Contingut multimèdia; la secció plegable «Més» amb Destacats; la secció plegable «Comunitats» amb les comunitats (avatar quadrat); i, al peu, «Tu» (l’avatar propi i el nom en un sol botó), que obri el full «Ajustos», i el llapis «Edita el perfil», que porta al perfil. Plegat, les mateixes entrades en el mateix ordre, i l’avatar del peu obri el full «Ajustos». «Novetats» està amagada (D16): l’entrada es conserva, però el rail no la pinta i el Control del xat s’obri des de la targeta «Ajustos del xat» del Panell de Control. Cada entrada obri una vista de la columna central. Telefonades i Destacats encara no fan res: la seua vista ho diu, i Telefonades amb el seu avís propi (D17). Contingut multimèdia ja funciona (ordre del Mestre del 261004): el control segmentat canvia de pestanya; Enllaços mostra les URL dels missatges carregats, agrupades per mes, amb el domini, l’avís de domini enganyós i el botó que obri la conversa; Fitxers i Documents diuen que els adjunts arriben amb F1. La lupa, Ordena i Selecciona encara no fan res."
      contracte={[
        ['RailXat', '{ activa, comunitatActiva?, plegat, onAlterna, titol, t, comunitats?, joId?, joNom?, onVes?, onAjustos?, recordaSeccions? }', "'converses' · recordaSeccions: true", "activa: 'converses', 'control', 'comunitat' o l’id d’una vista; onVes substituïx la navegació; onAjustos(boto): el peu obri el full «Ajustos» (sense ell, el peu d’abans); recordaSeccions: false no desa les seccions (el catàleg). Llig la mida d’AppGridShell (useAppGrid)."],
        ['ENTRADES_RAIL', '{ id, accio, Icona, clau, text, seccio?, amagada? }[]', '—', "accio: 'converses' (/xat), 'control' (/control-xat, commutador) o 'vista' (/xat?vista=<id>). amagada: el rail no la pinta (Novetats, D16)."],
        ['clauSeccio(id)', "'mes' | 'comunitats'", '—', 'La preferència de cada secció plegable (getVal/setVal), com la del rail. La secció que conté l’entrada activa s’obri en arribar-hi, sense tocar la preferència.'],
        ['VistaEnConstruccio', '{ titol, icona?, icones?, subtitol?, accio?, segments?, cerca?, descripcio?, esquerra?, onEnConstruccio?, t }', '—', 'La columna central d’una vista sense lògica: controls inerts (aria-disabled) i la targeta «En construcció». icones: botons d’icona de la fila de títol ({ etiqueta, Icona }).'],
        ['textosDeVista(id, t)', "'telefonades' | 'destacats'", 'null', 'Els textos de cada vista en construcció, traduïts, segons la seua captura de referència. avis: l’avís propi de la vista (Telefonades, D17) o buit per al genèric. Null per a multimedia des del 261004.'],
        ['VistaMultimedia', '{ titol, icona?, esquerra?, fils?, missatgesPerFil?, onObriFil?, onEnConstruccio?, locale?, t }', "locale: 'ca-ES'", 'Contingut multimèdia operativa: la fila de títol i el control segmentat amb el DOM de VistaEnConstruccio (FilaDeTitolVista i FilaSegments); el contingut ve de multimediaXat.js. missatgesPerFil: objecte, Map o getThreadMessages. onObriFil(id): el botó germà de cada enllaç. onEnConstruccio: la lupa, Ordena i Selecciona, encara inerts.']
      ]}
      a11y={[
        'L’entrada de la vista oberta porta aria-current="page" i, a més del blau, el marcador blanc de 3px (WCAG 1.4.1).',
        '«Novetats» està amagada (D16): no és al DOM ni a l’ordre de tabulació; al Control del xat cap entrada visible porta aria-current.',
        'Les seccions són botons amb aria-expanded i aria-controls; el nom diu «Secció …» perquè no es confonga amb l’entrada «Comunitats». Plegades, el contingut és hidden.',
        'Si la persona plega la secció on és l’entrada activa, la capçalera porta el marcador blanc i el nom diu «…, amb la pàgina actual».',
        'Fora d’ample, triar una entrada torna el focus al botó que obri el rail, també quan la tria canvia la fila de títol de la columna central.',
        'El botó del peu es diu «Tu: ajustos» (comença pel que es veu) i porta aria-haspopup="dialog".',
        'Els controls de les vistes en construcció es poden enfocar i llegir (aria-disabled, no disabled) i, en prémer-los, diuen «En construcció».',
        'Contingut multimèdia: el control segmentat és un grup de commutadors amb aria-pressed; cada enllaç i el botó de la seua conversa són dos controls germans (mai un <a> dins d’un <button>), de var(--sdp-touch) d’alt; l’avís de domini enganyós és role="note".'
      ]}
      fes={['Totes les icones i els avatars del rail, de 24 i sobre l’eix de 28.', 'Dir què hi haurà en cada vista en construcció i que encara no està disponible.', 'Dir sempre que Contingut multimèdia només veu les converses obertes en esta sessió.']}
      noFacis={['Un toast de «pendent» en lloc de la vista: l’esquelet de navegació ha de ser el de la captura.', 'Copiar el verd d’una marca aliena: el rail és crom fosc.', 'Previsualitzar els enllaços (imatge i títol de la pàgina): demanaria un servidor intermediari.']}>
      <h4>Desplegat: seccions «Més» i «Comunitats» i el peu</h4>
      <Rail plegat={false} etiqueta="Rail desplegat de mostra" comunitats={comunitats} setAvis={setAvis} />

      <h4>Plegat: només icones</h4>
      <Rail plegat={true} etiqueta="Rail plegat de mostra" comunitats={comunitats} setAvis={setAvis} />

      <h4>Vistes de la columna central</h4>
      {VISTES.map((id) => {
        const entrada = ENTRADES_RAIL.find((e) => e.id === id);
        const titol = t(entrada.clau, entrada.text);
        const enConstruccio = () => setAvis(`${titol}: en construcció.`);
        return (
          <div key={id} className="sdp-xat sdp-xat-especimen">
            <aside className="sdp-workspace-column" aria-label={titol}>
              {id === 'multimedia' ? (
                <VistaMultimedia titol={titol} icona={entrada.Icona} t={t} fils={fils} missatgesPerFil={MISSATGES_AMB_ENLLACOS}
                  onObriFil={(filId) => setAvis(`Obriria la conversa ${filId} i conservaria la vista.`)} onEnConstruccio={enConstruccio} />
              ) : (
                <VistaEnConstruccio {...textosDeVista(id, t)} titol={titol} icona={entrada.Icona} t={t} onEnConstruccio={enConstruccio} />
              )}
            </aside>
          </div>
        );
      })}
      <p role="status">{avis}</p>
    </Especimen>
  );
}
