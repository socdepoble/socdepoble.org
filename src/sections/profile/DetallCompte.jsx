import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ajustosPersona, ajustosOrganitzacio } from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';

/* ═══════════════════════════════════════════════════════════════════
   EL COMPTE · el que no és la fitxa pública

   Només els ajustos del catàleg amb `lloc: 'compte'`: correu,
   contrasenya, sessió i estat del perfil per a la persona; identificador,
   membres i eixida per a una organització. Els drets de la persona (les
   meues dades, consentiment i baixa) tenen pàgina pròpia a l'espai de
   treball: DetallPrivacitat, «Privacitat i dades».
   ═══════════════════════════════════════════════════════════════════ */

export function DetallCompte({ identitat, guardarAjust, pujaMitja }) {
  const persona = identitat?.mena === 'persona';
  const dades = identitat?.dades;

  const ajustos = useMemo(() => {
    const cataleg = persona ? ajustosPersona : ajustosOrganitzacio;
    return cataleg(dades || {}).filter((ajust) => ajust.lloc === 'compte');
  }, [persona, dades]);

  if (!identitat) return null;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="El compte"
      lead={persona
        ? 'Les dades d’accés: correu, contrasenya, sessió i estat del perfil.'
        : `Identificador, membres i eixida de ${identitat.nom}.`}
      topBarData={{
        authorName: identitat.nom,
        authorAvatar: identitat.avatar || '',
        authorLocation: dades?.town_name || '',
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
