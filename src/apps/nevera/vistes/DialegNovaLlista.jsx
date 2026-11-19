/**
 * La Nevera de Casa · «Llista nova»: el nom i prou (Dialeg de Pedra Seca).
 * El que s'escriu no va mai a la URL; la llista nova, sí (/llista/<id>).
 * `onCrea(nom)` torna null si l'ha creada (i qui la crida tanca el diàleg) o
 * el text que explica per què no: el diàleg el mostra i es queda obert.
 */
import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Boto, Camp, CampText, Dialeg } from '../../../components/PedraSeca/index.js';
import { textosVistaNevera } from '../i18nNevera.js';
import { LIMITS } from '../nucli/index.js';
import { useVistaNevera } from './context.js';

export function DialegNovaLlista({ obert, onTanca, onCrea }) {
  const { idioma = 'ca' } = useVistaNevera() || {};
  const tx = textosVistaNevera(idioma);
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
      setError(tx.escriuNomLlistaEx);
      return;
    }
    const motiu = onCrea(nom);
    setError(typeof motiu === 'string' ? motiu : null);
  };
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={tx.llistaNovaTitol}
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca('boto')}>{tx.cancella}</Boto>
          <Boto varietat="primari" tipus="submit" form={id} icona={Plus}>{tx.creaLaLlista}</Boto>
        </>
      )}
    >
      {obert ? (
        <form id={id} onSubmit={envia} noValidate>
          <Camp etiqueta={tx.nomDeLaLlista} error={error}>
            <CampText value={nom} maxLength={LIMITS.nom} autoComplete="off" onChange={(event) => setNom(event.target.value)} />
          </Camp>
        </form>
      ) : null}
    </Dialeg>
  );
}
