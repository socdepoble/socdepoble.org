/**
 * TargetaAdministrar.jsx — «Vols administrar {Org}?» a la vista Connectar
 * (T43, ordre del Mestre, 260928).
 *
 * Presentacional (Alerta, Boto, Camp i AreaText de Pedra Seca; zero CSS): tot
 * li arriba per props, i així es pot pintar al catàleg. Els textos diuen el
 * que passa de veres en cada estat: què vol dir administrar, que les
 * converses de l'organització també es veuran, qui llegirà la justificació i
 * que canviar d'identitat és sempre una tria a part.
 * Onada R32.35b · Lot 03 · Internacionalitzada en les 5 llengües (ca, es, en,
 * eu, gl) via diccionari modular diferit amb valencià idèntic byte a byte.
 */
import { useState } from 'react';
import { useUIStateOpcional } from '../../../app/contexts/UIContext';
import { Alerta, AreaText, Boto, Camp, Carregant } from '../../../components/PedraSeca/index.js';
import { dataCurta, textDeLaLectura, textDeLError } from './estatAdministracio.js';
import { etiquetaRolAdministrarOrg, textosAdministrarOrg } from './i18nAdministrarOrganitzacio.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitConnectar from '../../../css/diferit-connectar.css?inline';

const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'connectar', cssDiferitConnectar); };

export const LIMIT_JUSTIFICACIO = 1000;

function useIdiomaOpcional(idiomaProp) {
  const ui = useUIStateOpcional();
  return idiomaProp || ui?.language || 'ca';
}

export function TargetaAdministrar({
  estat, nom, rol = null, data = null, carregant = false, error = null, errorLectura = null, actiu = false, ambRevisio = true,
  idioma = null, onConnecta, onActua, onEditaFitxa, onEntra
}) {
  const [justificacio, setJustificacio] = useState('');
  const lang = useIdiomaOpcional(idioma);
  const tx = textosAdministrarOrg(lang);
  /* T43b-3 · Sense un nom de confiança, un text neutre (i ben apostrofat en ca). */
  const org = nom || tx.orgNeutra;
  const Org = nom || tx.OrgNeutra;
  const deOrg = tx.deOrg(nom);
  const textError = textDeLError(error, lang);
  const textLectura = textDeLaLectura(errorLectura, lang);
  const etiquetaRol = rol ? etiquetaRolAdministrarOrg(rol, lang) : null;
  const dataFormada = dataCurta(data, lang);

  const formulari = (etiquetaBoto) => (
    <form ref={adoptaEstilsDiferits} aria-label={tx.formAria(org)} onSubmit={(e) => { e.preventDefault(); onConnecta?.(justificacio.trim()); }}>
      {ambRevisio ? (
        <Camp
          etiqueta={tx.campEtiqueta}
          ajuda={tx.campAjuda(LIMIT_JUSTIFICACIO)}
        >
          <AreaText value={justificacio} maxLength={LIMIT_JUSTIFICACIO} files={3} onChange={(e) => setJustificacio(e.target.value)} />
        </Camp>
      ) : null}
      <div className="sdp-alerta__accions">
        <Boto varietat="secundari" tipus="submit" carregant={carregant}>{etiquetaBoto}</Boto>
      </div>
    </form>
  );

  const explicacio = (
    <>
      <p ref={adoptaEstilsDiferits}>{tx.explicacio1(org)}</p>
      <p>{tx.explicacio2(deOrg)}</p>
      <p>{tx.explicacio3}</p>
      {ambRevisio
        ? <p ref={adoptaEstilsDiferits}>{tx.explicacioRevisio}</p>
        : <p ref={adoptaEstilsDiferits}>{tx.explicacioProves}</p>}
    </>
  );

  let cos;
  switch (estat) {
    case 'sense-sessio':
      cos = (
        <Alerta to="info" titol={tx.volsAdministrar(org)}
          accions={<Boto varietat="secundari" onClick={onEntra}>{tx.entrar}</Boto>}>
          <p ref={adoptaEstilsDiferits}>{tx.senseSessioText}</p>
        </Alerta>
      );
      break;
    case 'no-disponible':
      cos = (
        <Alerta to="info" titol={tx.formAria(org)}>
          <p ref={adoptaEstilsDiferits}>{tx.noDisponibleText}</p>
        </Alerta>
      );
      break;
    case 'administres':
      cos = (
        <Alerta to="exit" titol={tx.jaLAdministres}
          accions={(
            <>
              {actiu ? null : <Boto varietat="secundari" onClick={onActua}>{tx.actuaComA(org)}</Boto>}
              <Boto varietat="secundari" onClick={onEditaFitxa}>{tx.editaFitxa(deOrg)}</Boto>
            </>
          )}>
          <p ref={adoptaEstilsDiferits}>{etiquetaRol ? tx.jaAdministresAmbRol(org, etiquetaRol) : tx.jaAdministresSenseRol(org)}</p>
          <p>{actiu ? tx.araActues(org) : tx.editarNoCanvia}</p>
        </Alerta>
      );
      break;
    case 'activant':
      cos = (
        <Alerta to="exit" titol={tx.jaLAdministres}>
          <p ref={adoptaEstilsDiferits} aria-busy="true">{tx.activantText(org)}</p>
        </Alerta>
      );
      break;
    case 'comprovant':
      /* T43b-2 · Encara no se sap si ja hi ha una petició: cap formulari. */
      cos = <Carregant etiqueta={tx.comprovantEtiqueta(org)} />;
      break;
    case 'pendent':
      cos = (
        <Alerta to="info" titol={tx.peticioEnviada}>
          <p ref={adoptaEstilsDiferits}>{dataFormada
            ? tx.pendentAmbData(dataFormada, org)
            : tx.pendentSenseData(org)}</p>
        </Alerta>
      );
      break;
    case 'rebutjada':
      /* Correcció C17 (260928) · Porta un formulari: fora de la regió viva (viva={false}). */
      cos = (
        <Alerta to="avis" titol={tx.rebutjadaTitol} viva={false}>
          <p ref={adoptaEstilsDiferits}>{tx.rebutjadaText}</p>
          {formulari(tx.tornarADemanar)}
        </Alerta>
      );
      break;
    case 'te-propietaria':
      cos = (
        <Alerta to="avis" titol={tx.tePropietariaTitol(Org)}>
          <p ref={adoptaEstilsDiferits}>{tx.tePropietariaText}</p>
        </Alerta>
      );
      break;
    case 'no-del-poble':
      cos = (
        <Alerta to="avis" titol={tx.noDelPobleTitol}>
          <p ref={adoptaEstilsDiferits}>{tx.noDelPobleText(org)}</p>
        </Alerta>
      );
      break;
    case 'membre':
      cos = (
        <Alerta to="info" titol={tx.eresMembreTitol(deOrg)}>
          <p ref={adoptaEstilsDiferits}>{tx.eresMembreText(deOrg)}</p>
        </Alerta>
      );
      break;
    default:
      /* Correcció C17 (260928) · Quatre paràgrafs i un formulari: no es
         llegixen de colp en aparéixer després de 'comprovant' (viva={false}). */
      cos = (
        <Alerta to="info" titol={tx.volsAdministrar(org)} viva={false}>
          {explicacio}
          {formulari(ambRevisio ? tx.demanarAdministrar : tx.administrarAra)}
        </Alerta>
      );
  }

  return (
    <div ref={adoptaEstilsDiferits} className="sdp-connectar__seccio">
      {cos}
      {textLectura ? <Alerta to="avis" titol={tx.noComprovatTitol}>{textLectura}</Alerta> : null}
      {textError ? <Alerta to="error" titol={tx.noEnviatTitol}>{textError}</Alerta> : null}
    </div>
  );
}

export default TargetaAdministrar;
