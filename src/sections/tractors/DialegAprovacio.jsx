/**
 * DialegAprovacio.jsx — aprovar la versió exacta d'un tractor.
 *
 * Sobre el Dialeg de Pedra Seca (<dialog> natiu: showModal a la SPA, capa
 * local a l'encastament): rol dialog, modalitat, focus atrapat i restaurat, i
 * Escape tanca. Cal marcar «He llegit la fitxa sencera». Dues vies: signatura
 * WebAuthn (si el navegador en té) i confirmació escrita de l'empremta curta,
 * desactivada si el manifest exigix signatura. Mentre treballa, no es tanca.
 *
 * El pare l'ha de muntar sempre i canviar-li `key` a cada obertura: així el
 * focus torna al botó que l'ha obert i cada obertura comença neta.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Dialeg } from '../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, Casella } from '../../components/PedraSeca/organismes/formulari.jsx';
import { empremtaCurta } from './nucli/empremta.js';

/* ErrorAprovacio.codi (i els de la UI) → què ha passat i què pot fer el Mestre. */
const TEXTOS_ERROR = Object.freeze({
  APROVACIO_REQUERIDA: 'Este tractor no té cap aprovació vigent.',
  EMPREMTA_DIVERGENT: 'El codi o la fitxa han canviat: torna a llegir la fitxa i aprova la versió nova.',
  APROVACIO_CADUCADA: 'L’aprovació ha caducat: cal tornar a aprovar el tractor.',
  APROVACIO_REVOCADA: 'L’aprovació està revocada: cal tornar a aprovar el tractor.',
  NIVELL_INSUFICIENT: 'Este tractor exigix la signatura amb Touch ID o clau de pas: la confirmació escrita no hi val.',
  SIGNATURA_INVALIDA: 'La signatura no s’ha completat o no és vàlida. No s’ha aprovat res: torna-ho a provar.',
  CONFIRMACIO_INCORRECTA: 'L’empremta escrita no coincidix amb l’empremta curta. Copia-la tal com es veu (majúscules i guions no importen).',
  EMPREMTA_INCOMPLETA: 'Falten fitxers del tractor: no es pot aprovar una versió incompleta.',
  EMPREMTA_INVALIDA: 'No s’ha pogut calcular l’empremta d’esta versió: no es pot aprovar.'
});

/* { titol, detall }: el text clar i, si n'hi ha, el motiu tècnic de la porta. */
export function textError(error) {
  const detall = typeof error?.message === 'string' ? error.message.trim() : '';
  const titol = TEXTOS_ERROR[error?.codi] ?? 'No s’ha pogut completar l’operació.';
  return { titol, detall: detall && detall !== titol ? detall : '' };
}

function curtaDe(empremta) {
  try {
    return empremtaCurta(empremta);
  } catch {
    return null;
  }
}

export default function DialegAprovacio({ obert, onTanca, onAprova, manifest, empremta, webauthn = false }) {
  const [llegit, setLlegit] = useState(false);
  const [text, setText] = useState('');
  const [ocupat, setOcupat] = useState(null);
  const [error, setError] = useState(null);
  const [obertAbans, setObertAbans] = useState(obert);
  const viu = useRef(true);
  const idSignatura = useId();
  const idConfirmacio = useId();

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  /* Cada obertura comença de zero, encara que el pare no canvie la key. */
  if (obert !== obertAbans) {
    setObertAbans(obert);
    if (obert) {
      setLlegit(false);
      setText('');
      setError(null);
    }
  }

  const curta = curtaDe(empremta);
  const exigeixSignatura = manifest?.nivellMinim === 'signatura';
  const potAprovar = Boolean(curta) && llegit && !ocupat;

  const tanca = (motiu, info) => {
    // Dos Escape seguits: el navegador ja l'ha tancat i el pare ho ha de saber.
    if (ocupat && !info?.forcat) return;
    if (info === undefined) onTanca?.(motiu);
    else onTanca?.(motiu, info);
  };

  async function envia(nivell) {
    setOcupat(nivell);
    setError(null);
    try {
      await onAprova?.({ nivell, confirmacio: nivell === 'confirmacio' ? text : undefined });
    } catch (e) {
      if (viu.current) setError(textError(e));
    } finally {
      if (viu.current) setOcupat(null);
    }
  }

  const nom = manifest?.nom ?? 'tractor';

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={`Aprova «${nom}»`}
      descripcio={curta
        ? `Aproves la versió ${manifest?.versio ?? ''} amb l’empremta curta ${curta}. Si canvia una sola línia del codi, del manifest o de la fitxa, l’aprovació deixa de valdre.`
        : 'Esta versió no té empremta: no es pot aprovar.'}
      tancaEnVel={!ocupat}
      accions={<Boto varietat="secundari" onClick={() => tanca('boto')} disabled={Boolean(ocupat)}>Cancel·la</Boto>}
    >
      <div className="sdp-tractors-dialeg">
        <p className="sdp-tractors-dialeg__empremta">
          Empremta curta: <strong className="sdp-tractors-dialeg__curta">{curta ?? 'cap'}</strong>
        </p>
        <Casella
          etiqueta="He llegit la fitxa sencera"
          ajuda="Què fa, què llig, què escriu, què no fa mai i els seus límits. És al panell, darrere d’este diàleg."
          checked={llegit}
          onChange={(e) => setLlegit(e.target.checked)}
          disabled={Boolean(ocupat)}
        />

        {webauthn ? (
          <section className="sdp-tractors-dialeg__via" aria-labelledby={idSignatura}>
            <h3 id={idSignatura} className="sdp-tractors-dialeg__titol">Signatura</h3>
            <p>
              Touch ID, Windows Hello o una clau de pas. El gest de verificació el fas tu; ara bé, un programa que
              ja controle este navegador podria registrar-hi una clau pròpia.
            </p>
            <Boto varietat="primari" onClick={() => envia('signatura')} disabled={!potAprovar}
              carregant={ocupat === 'signatura'}>
              Signa amb Touch ID o clau de pas
            </Boto>
          </section>
        ) : exigeixSignatura ? (
          <Alerta to="avis" viva={false} titol="Este navegador no pot signar">
            Este tractor exigix la signatura amb Touch ID o una clau de pas, i este navegador no l’oferix
            (o la pàgina no s’ha obert en un context segur: https o localhost).
          </Alerta>
        ) : null}

        <section className="sdp-tractors-dialeg__via" aria-labelledby={idConfirmacio}>
          <h3 id={idConfirmacio} className="sdp-tractors-dialeg__titol">Confirmació escrita</h3>
          {exigeixSignatura ? (
            <p>Este tractor exigix signatura: la confirmació escrita no hi val.</p>
          ) : null}
          <Camp etiqueta="Escriu l’empremta curta"
            ajuda={curta ? `És ${curta}. Majúscules, espais i guions no importen.` : undefined}>
            <CampText value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false}
              disabled={exigeixSignatura || Boolean(ocupat)} />
          </Camp>
          <Boto varietat={webauthn ? 'secundari' : 'primari'} onClick={() => envia('confirmacio')}
            disabled={exigeixSignatura || !potAprovar || !text.trim()} carregant={ocupat === 'confirmacio'}>
            Aprova amb confirmació escrita
          </Boto>
        </section>

        {error ? <Alerta to="error" titol={error.titol}>{error.detall || null}</Alerta> : null}
      </div>
    </Dialeg>
  );
}
