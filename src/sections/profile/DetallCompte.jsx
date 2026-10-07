import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila } from '../../components/universal/editorial.js';
import { ajustosPersona, ajustosOrganitzacio } from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';

/* ═══════════════════════════════════════════════════════════════════
   EL COMPTE · el que no és la fitxa pública

   Només els ajustos del catàleg amb `lloc: 'compte'`: correu,
   contrasenya, sessió i estat del perfil per a la persona; correu,
   identificador, membres i eixida per a una organització. Els drets de la
   persona (les meues dades, consentiment i baixa) tenen pàgina pròpia a
   l'espai de treball: DetallPrivacitat, «Privacitat i dades».

   T43 (ordre del Mestre, 260928) · `contacte` és el correu opcional de
   l'organització tal com l'ha llegit PerfilContext (només per a qui
   l'administra). Sense ell, els ajustos del correu es pinten tancats.

   Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de
   portar a la pàgina de l'autor que l'ha creada». La barra taronja d'esta
   pàgina privada porta a la fitxa pública pròpia: la persona, per l'id de
   la seua fila (dades.id, no 'jo'); una organització, per rutaDAutoria
   (l'entitat pilot, /projecte); un agent IA, /perfil/:id. La mateixa tria
   que rutaDeFitxaPublica de PerfilEditor, que no s'importa: les proves del
   Perfil substituïxen eixe mòdul sencer.
   ═══════════════════════════════════════════════════════════════════ */

function rutaDeLaFitxa(identitat) {
  if (identitat.mena === 'persona') return rutaDePerfil('persona', identitat.dades?.id);
  if (identitat.mena === 'agent') return rutaDePerfil('ia', identitat.id);
  return rutaDAutoria({ tipus: identitat.mena === 'grup' ? 'grup' : 'entitat', id: identitat.id });
}

export function DetallCompte({ identitat, guardarAjust, pujaMitja, contacte = null }) {
  const persona = identitat?.mena === 'persona';
  const dades = identitat?.dades;

  const ajustos = useMemo(() => {
    const cataleg = persona ? ajustosPersona(dades || {}) : ajustosOrganitzacio(dades || {}, contacte);
    return cataleg.filter((ajust) => ajust.lloc === 'compte');
  }, [persona, dades, contacte]);

  if (!identitat) return null;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="El compte"
      lead={persona
        ? 'Les dades d’accés: correu, contrasenya, sessió i estat del perfil.'
        : `Correu, identificador, membres i eixida de ${identitat.nom}.`}
      /* T51 · la data real del compte: creació o última modificació de la
         fila (profiles o l'organització). */
      {...dataDeFila(dades)}
      topBarData={{
        authorName: identitat.nom,
        authorAvatar: identitat.avatar || '',
        authorLocation: dades?.town_name || '',
        authorHref: rutaDeLaFitxa(identitat),
      }}
    >
      <div className="perfil-compte">
        {ajustos.map((ajust) => (
          <Bloc key={ajust.id} titol={ajust.titol}>
            <DetallAjust ajust={ajust} identitat={identitat} guardarAjust={guardarAjust} pujaMitja={pujaMitja} />
          </Bloc>
        ))}
      </div>
    </UniversalPage>
  );
}

export default DetallCompte;
