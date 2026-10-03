/**
 * La Nevera de Casa · «Llista nova»: el nom i prou (Dialeg de Pedra Seca).
 * El que s'escriu no va mai a la URL; la llista nova, sí (/llista/<id>).
 * `onCrea(nom)` torna null si l'ha creada (i qui la crida tanca el diàleg) o
 * el text que explica per què no: el diàleg el mostra i es queda obert.
 */
import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Boto, Camp, CampText, Dialeg } from '../../../components/PedraSeca/index.js';
import { LIMITS } from '../nucli/index.js';

export function DialegNovaLlista({ obert, onTanca, onCrea }) {
  const id = useId();
  const [nom, setNom] = useState('');
  const [error, setError] = useState(null);
  /* Cada obertura comença en blanc. */
  const [eraObert, setEraObert] = useState(obert);
  if (obert !== eraObert) {
    setEraObert(obert);
    if (obert) {
      setNom('');
      setError(null);
    }
  }
  const envia = (event) => {
    event.preventDefault();
    if (!nom.trim()) {
      setError('Escriu un nom per a la llista (per exemple, «Mercat del dijous»).');
      return;
    }
    const motiu = onCrea(nom);
    setError(typeof motiu === 'string' ? motiu : null);
  };
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Llista nova"
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca('boto')}>Cancel·la</Boto>
          <Boto varietat="primari" tipus="submit" form={id} icona={Plus}>Crea la llista</Boto>
        </>
      )}
    >
      {obert ? (
        <form id={id} onSubmit={envia} noValidate>
          <Camp etiqueta="Nom de la llista" error={error}>
            <CampText value={nom} maxLength={LIMITS.nom} autoComplete="off" onChange={(event) => setNom(event.target.value)} />
          </Camp>
        </form>
      ) : null}
    </Dialeg>
  );
}
