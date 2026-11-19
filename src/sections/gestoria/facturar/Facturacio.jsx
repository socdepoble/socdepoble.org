/**
 * Facturacio.jsx — la pantalla de Facturació de la Gestoria (export per defecte:
 * el pont de l'app, src/apps/gestoria/AppGestoria.jsx, la carrega amb lazy()
 * dins de la seua PaginaApp, i només en desenvolupament).
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; passos 1 a 4 del mapa de la Gestoria). El nucli Veri*Factu
 * (facturacio/) ja era local i sòlid; faltaven la pantalla i la persistència.
 * Cinc passos, en targetes clares i amb textos per a qui no és del ram:
 *   1. Les dades de l'empresa · el perfil fiscal, desat en este ordinador.
 *   2. Les factures d'abans · el llegat de l'eina externa, que queda tancat.
 *   3. Factura nova · F1, F2, F3 o rectificativa (R1-R5; Onada 6), amb el
 *      número, la retenció d'IRPF i el total abans d'emetre.
 *   4. El llibre · la cadena verificada a la vista, l'anul·lació, la factura
 *      en paper i l'XML de prova per a l'AEAT (Onada 6).
 *   5. Còpia del llibre · desar-la o descarregar-la, i restaurar-ne una.
 * Dalt, si el navegador pot esborrar el llibre, es diu (demanaPersistencia).
 * Amb incidències greus a la cadena, el pas 3 queda «Aturada» i la via és
 * restaurar la còpia bona al pas 5 (troballa F3 de la revisió, 261007).
 * S'endolla pel pont i no per ShellGestoria: ShellGestoria és font del
 * tractor gestoria.tauler i tocar-la en tornaria l'aprovació a «pendent».
 * Cap crida de xarxa; la remissió a l'AEAT encara no existix i es diu.
 * Prompt 261014_1605, front G1 (la Facturació en tres preguntes, abans del 20):
 *   · PODER 3 · dalt, una frase planera i certa (el llibre i el perfil són
 *     a l'IndexedDB d'este navegador: portIndexedDB i magatzemPerfil); el
 *     llibre Veri*Factu i l'AEAT, en un desplegable de detalls tècnics;
 *   · PODER 5 · els passos 1 i 2, quan ja estan fets, es mostren recollits
 *     (PasPerfil i PasLlegat), i la Factura nova queda a dalt.
 * Proves: totes les props van a useFacturacio (port, perfil, subtle, idb,
 * locks, emmagatzematge, rellotge, entorn, descarrega, imprimix).
 *
 * Onada R32.5 (P0-112 / IDEA-285):
 *   · Extirpació del reclam «Veri*Factu» i clarificació honesta (cadena local en
 *     proves, no sistema Verifactu homologat ni remissió activa a l'AEAT).
 *   · Internacionalització en les 5 llengües (ca, es, en, eu, gl) via `idioma`.
 */
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { CopiaLlibre, insigniaDeLaCopia } from './CopiaLlibre.jsx';
import { FormulariFactura } from './FormulariFactura.jsx';
import { LlibreFactures } from './LlibreFactures.jsx';
import { estatDeLaCadena } from './nucli/formulari.js';
import { textosFacturacio } from './nucli/textosFacturacio.js';
import { localitzaEstatCadenaGestoria, tg } from '../i18nGestoria.js';
import { PasLlegat } from './PasLlegat.jsx';
import { PasPerfil } from './PasPerfil.jsx';
import { Pas } from './peces.jsx';
import { useFacturacio } from './useFacturacio.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitGestoria from '../../../css/diferit-gestoria.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'gestoria', cssDiferitGestoria); };

/* El que es diu de la persistència: només quan el navegador no la garantix. */
function AvisPersistencia({ f, tx }) {
  if (f.persistencia === 'memoria') {
    return (
      <Alerta to="error" titol={tx.memoriaTitol}>
        {tx.memoriaText}
      </Alerta>
    );
  }
  if (f.persistencia !== 'denegada' && f.persistencia !== 'sense-api') return null;
  return (
    <Alerta to="avis" titol={tx.esborratTitol}
      accions={f.persistencia === 'denegada' ? <Boto varietat="secundari" onClick={f.demanaPersistencia}>{tx.tornaDemanar}</Boto> : null}>
      {f.persistencia === 'denegada' ? tx.denegadaText : tx.senseApiText}
      {tx.copiaConsell}
    </Alerta>
  );
}

export default function Facturacio({ idioma = 'ca', ...props }) {
  const tx = textosFacturacio(idioma);
  const f = useFacturacio(props);

  if (f.fase === 'carregant') return <Carregant etiqueta={tx.obrint} />;
  if (f.fase === 'error') {
    return (
      <Alerta to="error" titol={tx.errorTitol}>
        <p ref={adoptaEstilsDiferits}>{tg(idioma, f.error?.message ?? tx.errorDefecte)}</p>
        <p>{tx.errorPrivada}</p>
      </Alerta>
    );
  }

  const cadena = localitzaEstatCadenaGestoria(estatDeLaCadena(f.informe), idioma);
  return (
    <div ref={adoptaEstilsDiferits} className="sdp-gestoria-panell">
      <div className="sdp-gestoria-panell__barra">
        <p>{tx.barraIntro}</p>
        {f.persistencia === 'concedida' ? <Insignia to="exit">{tx.noEsborrara}</Insignia> : null}
      </div>
      <details className="sdp-gestoria-panell__documents">
        <summary>{tx.detallsResum}</summary>
        <div className="sdp-gestoria-panell__bloc">
          <p>{tx.detallsCadena}</p>
          <p className="sdp-gestoria-panell__avis">{tx.detallsAvis}</p>
        </div>
      </details>
      <AvisPersistencia f={f} tx={tx} />
      <ol className="sdp-gestoria-panell__passos">
        <Pas numero={1} titol={tx.pas1} estat={f.config ? 'fet' : 'actiu'} idioma={idioma}>
          <PasPerfil f={f} idioma={idioma} />
        </Pas>
        <Pas numero={2} titol={tx.pas2} estat={f.llegat ? 'fet' : f.config ? 'actiu' : 'bloquejat'} idioma={idioma}>
          <PasLlegat f={f} idioma={idioma} />
        </Pas>
        <Pas numero={3} titol={tx.pas3} estat={f.potEmetre ? 'actiu' : 'bloquejat'} idioma={idioma}
          insignia={f.bloquejatPerCadena ? { to: 'error', text: tx.aturada } : null}>
          <FormulariFactura f={f} idioma={idioma} />
        </Pas>
        <Pas numero={4} titol={tx.pas4} estat={f.informe?.valida ? 'fet' : 'actiu'} idioma={idioma}
          insignia={{ to: cadena.to, text: cadena.insignia }}>
          <LlibreFactures f={f} tx={tx} idioma={idioma} />
        </Pas>
        <Pas numero={5} titol={tx.pas5} estat="actiu" idioma={idioma} insignia={insigniaDeLaCopia(f, idioma)}>
          <CopiaLlibre f={f} idioma={idioma} />
        </Pas>
      </ol>
    </div>
  );
}
