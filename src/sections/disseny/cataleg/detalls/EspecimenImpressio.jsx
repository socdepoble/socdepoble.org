import { useMemo } from 'react';
import { Especimen } from '../Especimen.jsx';
import DocumentPrintPreview, { buildPrintDocument } from '../../../../components/universal/DocumentPrintPreview.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · La vista A4 REAL de l'editor: els dos
   botons de sempre obrin el diàleg (sense portada i amb portada), i davall es
   veuen els dos papers que genera buildPrintDocument, la mateixa funció que
   omple l'iframe del diàleg. Cap document ix del dispositiu. */

const DOCUMENT = Object.freeze({
  title: 'La sega de l’arròs',
  subtitle: 'Crònica de la collita al poble',
  lead: '<p>Enguany la sega ha començat abans per la calor de setembre.</p>',
  content: '<h2>El camp</h2><p>Les parades s’han segat en tres dies, amb la màquina de la cooperativa.</p><h2>La festa</h2><p>El diumenge, paella per a tot el veïnat a la plaça.</p>',
  copyright: 'CC BY-SA 4.0 · Sóc de Poble',
});
const AUTORA = 'Pepa del Mas';

export default function EspecimenImpressio() {
  const papers = useMemo(() => ([
    ['Sense portada', buildPrintDocument(DOCUMENT, false, AUTORA)],
    ['Amb portada', buildPrintDocument(DOCUMENT, true, AUTORA)],
  ]), []);
  return (
    <>
      <Llinatge id="impressio" />
      <Especimen id="impressio" nom="DocumentPrintPreview · vista A4 i PDF" fitxer="src/components/universal/DocumentPrintPreview.jsx"
        descripcio="Dos botons obrin la vista prèvia: «Vista A4 / PDF» (sense portada) i «Crear portada». Al Bloc de Notes viuen davall del títol de l’editor, al costat dels drets d’autor; al Perfil, a l’apartat «Les vistes», fora de l’espai d’edició (ordre del Mestre, 261008). El document es prepara al dispositiu, dins d’un iframe aïllat amb una política de seguretat pròpia, i el navegador el pagina en A4 per a imprimir-lo o desar-lo com a PDF."
        contracte={[
          ['document', '{ title, subtitle, lead, content, copyright }', '—', 'El mateix objecte en local, a Sollutia o a WordPress. lead i content són HTML i es sanegen.'],
          ['author', 'string', "''", 'El nom de la portada.'],
          ['buildPrintDocument(doc, portada, autor)', '(objecte, boolean, string) => string', '—', 'L’HTML autònom del paper: escapa les metadades, sanega el text ric i no carrega cap recurs executable.'],
        ]}
        a11y={[
          'L’avís d’impressió és la descripció accessible del diàleg, fora del cos.',
          '«Incloure portada» és una Casella de Pedra Seca: refà el document en el moment.',
          'L’iframe porta títol («Document A4»); «Imprimir / Desar PDF» espera que el paper haja carregat.'
        ]}
        fes={[
          'Preparar el PDF al dispositiu, amb el motor del navegador.',
          'Un sol scroll dins del diàleg: el del paper.',
          'Al Perfil («Les vistes», DetallVistes), refer el document amb documentDeFitxa i l’esborrany de la cua: l’editor ja no està muntat, i el paper ha de dir el que la persona ha escrit.'
        ]}
        noFacis={[
          'Enviar el document a cap servei per a fer el PDF.',
          'Deute: els dos botons i «Imprimir» encara són button en brut amb classes (sdp-copyright-selector, sdp-boto), no Boto.'
        ]}>
        <div className="sdp-copyright-control">
          <DocumentPrintPreview document={DOCUMENT} author={AUTORA} />
        </div>
        <div className="sdp-especimen__papers">
          {papers.map(([nom, html]) => (
            <figure key={nom}>
              <iframe className="sdp-especimen__paper" title={`Paper de mostra: ${nom.toLowerCase()}`} sandbox="" srcDoc={html} />
              <figcaption>{nom}</figcaption>
            </figure>
          ))}
        </div>
      </Especimen>
    </>
  );
}
