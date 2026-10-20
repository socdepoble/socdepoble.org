/**
 * LlistaBloquejos.jsx — Fase D (261020, tasca 2; pla 261020_1300 · App Store
 * 1.2 i Google Play UGC) · Les persones i les entitats que has bloquejat, amb
 * «Desbloqueja» a cada fila: el camí de tornada d'un bloqueig. La MATEIXA
 * peça a dos llocs (crítica 261020, 18): el Control del xat (Privacitat i
 * seguretat) i el perfil (Privacitat i dades). Per això viu ací i no al xat.
 *
 * Rep el valor de useModeracio (`moderacio`); no sap res del backend. Una
 * sola línia d'estat, en este ordre: sense ningú que mire (un visitant del
 * remot), entra al compte; carregant; sense la migració, els bloquejos de la
 * sessió (un avís); qualsevol altra fallada, un error. Després, la llista o
 * «No has bloquejat ningú». Desbloquejar no demana confirmació (es pot
 * tornar a bloquejar) i la fila se'n va a l'instant; si el servidor diu que
 * no, torna i l'error es diu ací, en línia. El focus passa a la fila
 * següent (o a la línia «No has bloquejat ningú»): no cau al <body>.
 * `ambTitol` (true): l'H3 «Persones i entitats bloquejades»; el perfil ja en
 * posa el seu al bloc (ambTitol={false}).
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { Alerta, Boto } from '../PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import { TEXTOS_MODERACIO, omple, textDErrorDeModeracio } from '../PedraSeca/organismes/textosModeracio.js';

const NO_DISPONIBLE = 'no-disponible';

export function LlistaBloquejos({ moderacio, ambTitol = true }) {
  const t = useTraductorOpcional();
  const [error, setError] = useState(null);
  const llistaRef = useRef(null);
  const buitRef = useRef(null);
  /* L'índex de la fila que s'acaba de desbloquejar: el focus hi va després. */
  const focusPendent = useRef(null);
  const llistaDelValor = moderacio?.bloquejats;
  const bloquejats = Array.isArray(llistaDelValor) ? llistaDelValor : [];

  useLayoutEffect(() => {
    const index = focusPendent.current;
    if (index == null) return;
    focusPendent.current = null;
    const botons = llistaRef.current?.querySelectorAll('button') ?? [];
    const desti = botons.length ? botons[Math.min(index, botons.length - 1)] : buitRef.current;
    desti?.focus?.({ preventScroll: true });
  }, [llistaDelValor]);

  if (!moderacio) return null;
  const estat = moderacio.estatBloquejos;
  const sessioNomes = estat === 'error' && moderacio.codiErrorBloquejos === NO_DISPONIBLE;
  const titol = ambTitol ? <h3>{tradueix(t, TEXTOS_MODERACIO.bloquejosTitol)}</h3> : null;

  if (!moderacio.potBloquejar) {
    return (
      <>
        {titol}
        <p role="status">{tradueix(t, TEXTOS_MODERACIO.bloquejosSenseSessio)}</p>
      </>
    );
  }

  const desbloqueja = async (bloqueig, index) => {
    setError(null);
    focusPendent.current = index;
    try {
      await moderacio.desbloqueja?.(bloqueig);
    } catch (e) {
      focusPendent.current = null;
      setError(e);
    }
  };

  const senseNom = tradueix(t, TEXTOS_MODERACIO.bloquejosSenseNom);
  let linia = null;
  if (estat === 'carregant') linia = <p role="status">{tradueix(t, TEXTOS_MODERACIO.bloquejosCarregant)}</p>;
  else if (sessioNomes) linia = <Alerta to="avis">{tradueix(t, TEXTOS_MODERACIO.bloquejosNomesSessio)}</Alerta>;
  else if (estat === 'error') linia = <Alerta to="error">{tradueix(t, TEXTOS_MODERACIO.bloquejosError)}</Alerta>;
  /* «No has bloquejat ningú» només quan se sap: mai mentre carrega ni amb la llista del servidor fallida. */
  const buit = !bloquejats.length && (estat === 'llest' || sessioNomes);

  return (
    <>
      {titol}
      {linia}
      {bloquejats.length ? (
        <ul className="sdp-bloquejos" ref={llistaRef}>
          {bloquejats.map((bloqueig, index) => {
            const nom = String(bloqueig.nom || '').trim() || senseNom;
            return (
              <li key={`${bloqueig.tipus}:${bloqueig.id}`} className="sdp-bloquejos__fila">
                <span className="sdp-bloquejos__nom">{nom}</span>
                <Boto varietat="secundari" aria-label={omple(tradueix(t, TEXTOS_MODERACIO.desbloqueja), { nom })}
                  onClick={() => desbloqueja({ tipus: bloqueig.tipus, id: bloqueig.id, nom: bloqueig.nom }, index)}>
                  {tradueix(t, TEXTOS_MODERACIO.bloquejosDesbloqueja)}
                </Boto>
              </li>
            );
          })}
        </ul>
      ) : buit ? (
        <p ref={buitRef} tabIndex={-1}>{tradueix(t, TEXTOS_MODERACIO.bloquejosBuit)}</p>
      ) : null}
      {error ? <Alerta to="error">{tradueix(t, textDErrorDeModeracio(error))}</Alerta> : null}
    </>
  );
}

export default LlistaBloquejos;
