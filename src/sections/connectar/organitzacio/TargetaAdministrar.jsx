/**
 * TargetaAdministrar.jsx — «Vols administrar {Org}?» a la vista Connectar
 * (T43, ordre del Mestre, 260928).
 *
 * Presentacional (Alerta, Boto, Camp i AreaText de Pedra Seca; zero CSS): tot
 * li arriba per props, i així es pot pintar al catàleg. Els textos diuen el
 * que passa de veres en cada estat: què vol dir administrar, que les
 * converses de l'organització també es veuran, qui llegirà la justificació i
 * que canviar d'identitat és sempre una tria a part.
 */
import { useState } from 'react';
import { Alerta, AreaText, Boto, Camp, Carregant } from '../../../components/PedraSeca/index.js';
import { etiquetaDeRol } from '../../../components/universal/identitat/rols.js';
import { dataCurta, textDeLaLectura, textDeLError } from './estatAdministracio.js';

export const LIMIT_JUSTIFICACIO = 1000;

export function TargetaAdministrar({
  estat, nom, rol = null, data = null, carregant = false, error = null, errorLectura = null, actiu = false, ambRevisio = true,
  onConnecta, onActua, onEditaFitxa, onEntra
}) {
  const [justificacio, setJustificacio] = useState('');
  /* T43b-3 · Sense un nom de confiança, un text neutre (i ben apostrofat). */
  const org = nom || 'esta organització';
  const Org = nom || 'Esta organització';
  const deOrg = nom ? `de ${nom}` : 'd’esta organització';
  const textError = textDeLError(error);
  const textLectura = textDeLaLectura(errorLectura);

  const formulari = (etiquetaBoto) => (
    <form aria-label={`Administrar ${org}`} onSubmit={(e) => { e.preventDefault(); onConnecta?.(justificacio.trim()); }}>
      {ambRevisio ? (
        <Camp
          etiqueta="Explica breument qui eres (opcional)"
          ajuda={`La teua explicació la llegirà l’equip de Sóc de Poble. Fins a ${LIMIT_JUSTIFICACIO.toLocaleString('ca-ES')} caràcters.`}
        >
          <AreaText value={justificacio} maxLength={LIMIT_JUSTIFICACIO} files={3} onChange={(e) => setJustificacio(e.target.value)} />
        </Camp>
      ) : null}
      <div className="sdp-alerta__accions">
        <Boto varietat="primari" tipus="submit" carregant={carregant}>{etiquetaBoto}</Boto>
      </div>
    </form>
  );

  const explicacio = (
    <>
      <p>{`Si t’hi connectes per a administrar-la, podràs editar la seua fitxa i publicar en el seu nom. El que publiques com a ${org} anirà signat per ${org}, no per tu.`}</p>
      <p>{`Com a administradora veuràs també les converses ${deOrg} amb la gent del poble.`}</p>
      <p>Actuar com a l’organització no és automàtic: ho tries tu, i pots tornar a ser tu quan vullgues des de l’avatar de la barra de dalt.</p>
      {ambRevisio
        ? <p>La petició la revisarà l’equip de Sóc de Poble abans de donar-te l’alta.</p>
        : <p>En este poble de proves l’alta és immediata.</p>}
    </>
  );

  let cos;
  switch (estat) {
    case 'sense-sessio':
      cos = (
        <Alerta to="info" titol={`Vols administrar ${org}?`}
          accions={<Boto varietat="primari" onClick={onEntra}>Entrar</Boto>}>
          <p>Per a administrar una organització has d’entrar amb el teu compte.</p>
        </Alerta>
      );
      break;
    case 'no-disponible':
      cos = (
        <Alerta to="info" titol={`Administrar ${org}`}>
          <p>Este poble encara no permet connectar-se a organitzacions des de l’app.</p>
        </Alerta>
      );
      break;
    case 'administres':
      cos = (
        <Alerta to="exit" titol="Ja l’administres"
          accions={(
            <>
              {actiu ? null : <Boto varietat="primari" onClick={onActua}>{`Actua com a ${org}`}</Boto>}
              <Boto varietat="secundari" onClick={onEditaFitxa}>{`Edita la fitxa ${deOrg}`}</Boto>
            </>
          )}>
          <p>{rol && etiquetaDeRol(rol) ? `Ja administres ${org} · ${etiquetaDeRol(rol)}.` : `Ja administres ${org}.`}</p>
          <p>{actiu
            ? `Ara actues com a ${org}: el que publiques anirà signat per ${org}.`
            : 'Editar la fitxa no canvia amb qui actues. Per a publicar en el seu nom, tria «Actua com a».'}</p>
        </Alerta>
      );
      break;
    case 'activant':
      cos = (
        <Alerta to="exit" titol="Ja l’administres">
          <p aria-busy="true">{`Estem afegint ${org} a les teues identitats…`}</p>
        </Alerta>
      );
      break;
    case 'comprovant':
      /* T43b-2 · Encara no se sap si ja hi ha una petició: cap formulari. */
      cos = <Carregant etiqueta={`Comprovant si ja has demanat administrar ${org}…`} />;
      break;
    case 'pendent':
      cos = (
        <Alerta to="info" titol="Petició enviada">
          <p>{dataCurta(data)
            ? `Petició enviada el ${dataCurta(data)}. Quan l’aprove l’equip de Sóc de Poble, ${org} apareixerà a l’avatar de la barra de dalt.`
            : `Ja tens una petició pendent per a ${org}. Quan l’aprove l’equip de Sóc de Poble, apareixerà a l’avatar de la barra de dalt.`}</p>
        </Alerta>
      );
      break;
    case 'rebutjada':
      /* Correcció C17 (260928) · Porta un formulari: fora de la regió viva (viva={false}). */
      cos = (
        <Alerta to="avis" titol="La teua última petició no s’ha aprovat" viva={false}>
          <p>Pots tornar-ho a demanar explicant qui eres.</p>
          {formulari('Tornar a demanar-ho')}
        </Alerta>
      );
      break;
    case 'te-propietaria':
      cos = (
        <Alerta to="avis" titol={`${Org} ja té qui l’administra`}>
          <p>Encara no es pot demanar entrar com a administradora des de l’app: parla amb qui la porta.</p>
        </Alerta>
      );
      break;
    case 'no-del-poble':
      cos = (
        <Alerta to="avis" titol="Només la gent d’este poble">
          <p>{`Per a administrar ${org} has de ser del poble on està registrada.`}</p>
        </Alerta>
      );
      break;
    case 'membre':
      cos = (
        <Alerta to="info" titol={`Eres membre ${deOrg}`}>
          <p>{`Eres membre ${deOrg}, però no l’administres. Si has d’editar la fitxa, parla amb qui l’administra.`}</p>
        </Alerta>
      );
      break;
    default:
      /* Correcció C17 (260928) · Quatre paràgrafs i un formulari: no es
         llegixen de colp en aparéixer després de 'comprovant' (viva={false}). */
      cos = (
        <Alerta to="info" titol={`Vols administrar ${org}?`} viva={false}>
          {explicacio}
          {formulari('Connectar-me com a administradora')}
        </Alerta>
      );
  }

  return (
    <div className="sdp-connectar__seccio">
      {cos}
      {textLectura ? <Alerta to="avis" titol="No s’ha pogut comprovar">{textLectura}</Alerta> : null}
      {textError ? <Alerta to="error" titol="No s’ha pogut enviar">{textError}</Alerta> : null}
    </div>
  );
}

export default TargetaAdministrar;
