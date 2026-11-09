import { useUIActions } from '../../app/contexts/UIContext';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { OBRA_QUE_DINEM } from '../../data/patrimoni/queDinem.js';

/* Onada R14 · Els crèdits del receptari «Què dinem?» i l'enllaç al PDF sencer, els mateixos a /page/receptes i a
   cada /receptes/:slug. L'obra és de l'associació que la va editar (el PDF no nomena cap altra autoria); l'ISBN es
   mostra tal com està imprés (el número imprés no és un ISBN vàlid, i ací no es corregix); els vídeos són del canal
   que el llibre imprimix a cada recepta. `tr` és traductorPatrimoni(t): les claus patrimoni.receptes.* són als 5
   diccionaris. El PDF passa per resolRecursPropi: dins del connector de WordPress, '/assets/…' viu sota la base del
   connector.
   Arreglos R14 · El botó diu el format i la mida (OBRA_QUE_DINEM.pdfBytes, la del fitxer: una prova ho comprova), en
   MB i amb els decimals de la llengua de la interfície. Dins de l'app nativa no hi ha botó: <a download> no desa res
   al WebView (el mateix criteri que DetallPoble, R-09); es diu on es descarrega. */
const megabytes = (bytes, llengua) => {
  try {
    return new Intl.NumberFormat(llengua || 'ca', { maximumFractionDigits: 1 }).format(bytes / 1e6);
  } catch {
    return (Math.round(bytes / 1e5) / 10).toString();
  }
};

export default function CreditsQueDinem({ tr, nivell = 'h3' }) {
  const { language: llengua } = useUIActions();
  const Titol = nivell === 'h2' ? 'h2' : 'h3';
  const obra = OBRA_QUE_DINEM;
  const titol = tr('patrimoni.receptes.obra', 'L’obra i els seus drets');
  const mida = megabytes(obra.pdfBytes, llengua);
  return (
    <section aria-label={titol}>
      <Titol>{titol}</Titol>
      <dl>
        <dt>{tr('patrimoni.receptes.edicio', 'Edició')}</dt>
        <dd lang="ca">«{obra.titol}» · {obra.associacio} · {obra.lloc} · {obra.any}</dd>
        <dt>{tr('patrimoni.receptes.dipositLegal', 'Dipòsit legal')}</dt>
        <dd>{obra.dipositLegal}</dd>
        <dt>{tr('patrimoni.receptes.isbn', 'ISBN, tal com està imprés')}</dt>
        <dd>{obra.isbnImpres}</dd>
        <dt>{tr('patrimoni.receptes.drets', 'Drets')}</dt>
        <dd>{tr('patrimoni.receptes.permis', 'Text i làmines amb permís d’ús.')}</dd>
        <dt>{tr('patrimoni.receptes.videos', 'Vídeos de les receptes')}</dt>
        <dd>{tr('patrimoni.receptes.canal', 'Del canal «{canal}», a YouTube', { canal: obra.canalVideos })}</dd>
      </dl>
      {esAppNativa()
        ? <p>{tr('patrimoni.receptes.pdfNatiu', 'Dins de l’app el llibre en PDF ({mida} MB) no es pot desar a les descàrregues: descarrega’l des de socdepoble.org.', { mida })}</p>
        : (
          <p>
            <a className="sdp-boto sdp-boto--secundari" href={resolRecursPropi(obra.pdf)} download type="application/pdf">
              {tr('patrimoni.receptes.pdf', 'Descarrega el llibre sencer (PDF, {mida} MB)', { mida })}
            </a>
          </p>
        )}
    </section>
  );
}
