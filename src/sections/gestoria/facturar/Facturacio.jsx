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
 *   3. Factura nova · F1, F2 o F3, amb el número i el total abans d'emetre.
 *   4. El llibre · la cadena verificada a la vista, i l'anul·lació.
 *   5. Còpia del llibre · desar-la o descarregar-la, i restaurar-ne una.
 * Dalt, si el navegador pot esborrar el llibre, es diu (demanaPersistencia).
 * Amb incidències greus a la cadena, el pas 3 queda «Aturada» i la via és
 * restaurar la còpia bona al pas 5 (troballa F3 de la revisió, 261007).
 * S'endolla pel pont i no per ShellGestoria: ShellGestoria és font del
 * tractor gestoria.tauler i tocar-la en tornaria l'aprovació a «pendent».
 * Cap crida de xarxa; la remissió a l'AEAT encara no existix i es diu.
 * Proves: totes les props van a useFacturacio (port, perfil, subtle, idb,
 * locks, emmagatzematge, rellotge, entorn, descarrega).
 */
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { CopiaLlibre, insigniaDeLaCopia } from './CopiaLlibre.jsx';
import { FormulariFactura } from './FormulariFactura.jsx';
import { LlibreFactures } from './LlibreFactures.jsx';
import { estatDeLaCadena } from './nucli/formulari.js';
import { PasLlegat } from './PasLlegat.jsx';
import { PasPerfil } from './PasPerfil.jsx';
import { Pas } from './peces.jsx';
import { useFacturacio } from './useFacturacio.js';

/* El que es diu de la persistència: només quan el navegador no la garantix. */
function AvisPersistencia({ f }) {
  if (f.persistencia === 'memoria') {
    return (
      <Alerta to="error" titol="Este llibre és de proves">
        Es perd en tancar la pestanya: no emetes res de veres ací.
      </Alerta>
    );
  }
  if (f.persistencia !== 'denegada' && f.persistencia !== 'sense-api') return null;
  return (
    <Alerta to="avis" titol="El navegador podria esborrar el llibre"
      accions={f.persistencia === 'denegada' ? <Boto varietat="secundari" onClick={f.demanaPersistencia}>Torna-ho a demanar</Boto> : null}>
      {f.persistencia === 'denegada'
        ? 'No ha acceptat guardar-lo de manera permanent: si li falta espai, el pot esborrar. '
        : 'Este navegador no deixa demanar que el guarde de manera permanent. '}
      Fes còpia del llibre (pas 5) cada dia que factures.
    </Alerta>
  );
}

export default function Facturacio(props) {
  const f = useFacturacio(props);

  if (f.fase === 'carregant') return <Carregant etiqueta="Obrint el llibre de factures…" />;
  if (f.fase === 'error') {
    return (
      <Alerta to="error" titol="Ací no es pot facturar">
        <p>{f.error?.message ?? 'El llibre de factures no s’ha pogut obrir.'}</p>
        <p>Si estàs en una finestra privada, obri la Gestoria en una de normal: el llibre necessita quedar-se guardat.</p>
      </Alerta>
    );
  }

  const cadena = estatDeLaCadena(f.informe);
  return (
    <div className="sdp-gestoria-panell">
      <div className="sdp-gestoria-panell__barra">
        <p>
          Factura des d’este ordinador, amb connexió o sense. Cada factura entra al llibre Veri*Factu encadenada a
          l’anterior, i ni el llibre ni les dades de l’empresa ixen d’ací.
        </p>
        {f.persistencia === 'concedida' ? <Insignia to="exit">El navegador no l’esborrarà</Insignia> : null}
      </div>
      <p className="sdp-gestoria-panell__avis">L’enviament a l’AEAT encara no està fet: el llibre el tindrà preparat.</p>
      <AvisPersistencia f={f} />
      <ol className="sdp-gestoria-panell__passos">
        <Pas numero={1} titol="Les dades de l’empresa" estat={f.config ? 'fet' : 'actiu'}>
          <PasPerfil f={f} />
        </Pas>
        <Pas numero={2} titol="Les factures d’abans" estat={f.llegat ? 'fet' : f.config ? 'actiu' : 'bloquejat'}>
          <PasLlegat f={f} />
        </Pas>
        <Pas numero={3} titol="Factura nova" estat={f.potEmetre ? 'actiu' : 'bloquejat'}
          insignia={f.bloquejatPerCadena ? { to: 'error', text: 'Aturada' } : null}>
          <FormulariFactura f={f} />
        </Pas>
        <Pas numero={4} titol="El llibre de factures" estat={f.informe?.valida ? 'fet' : 'actiu'} insignia={{ to: cadena.to, text: cadena.insignia }}>
          <LlibreFactures f={f} />
        </Pas>
        <Pas numero={5} titol="Còpia del llibre" estat="actiu" insignia={insigniaDeLaCopia(f)}>
          <CopiaLlibre f={f} />
        </Pas>
      </ol>
    </div>
  );
}
