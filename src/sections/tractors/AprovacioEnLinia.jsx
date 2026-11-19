/**
 * AprovacioEnLinia.jsx — aprovar un tractor a la mateixa pantalla que el necessita.
 *
 * Onada R24 · CODEX-R24-12 (P1) i A-gestoria-tpv-apps-1 (R22, opció A del §11,
 * via del consentiment explícit). La Gestoria és oberta a la web publicada
 * (P0-113, IDEA-244), però el panell de Tractors (PanellTractors.jsx) només
 * existix al servidor de desenvolupament (EINES_LOCALS de la Wiki): fora de
 * DEV, «Obri el panell de Tractors» portava a una pàgina de documentació sense
 * accions, i un navegador nou no podia acabar mai el pas.
 *
 * Fora de DEV, AccioAprovacio obri DialegAprovacio amb la fitxa sencera del
 * tractor i aprova pel MATEIX camí que el panell (useTractors().aprova): la
 * mateixa empremta de la versió (registreTractors), el mateix registre
 * (preparaRegistre) signat amb WebAuthn i verificació d'usuari
 * (signaAmbWebAuthn, i la clau de plataforma registrada la primera vegada), la
 * mateixa verificació (verificaRegistre), el mateix magatzem d'este navegador
 * i el nivell mínim del manifest. Cap drecera: sense una signatura vàlida no
 * es desa res, i abans de cada lectura el tractor torna a exigir l'aprovació
 * (exigeixAprovacio, fail-closed). Qui aprova és la persona que farà servir el
 * tractor amb les seues dades, en este navegador: no és cap aprovació del
 * Mestre ni val per a cap altre navegador.
 *
 * RevocaAprovacio és l'altra meitat del mateix contracte: fora de DEV, amb el
 * tractor aprovat en este navegador, «Revoca l’aprovació» desa el registre
 * «revocat» de sempre (useTractors().revoca) i la pantalla torna a l'avís. Les
 * fitxes ho diuen així.
 *
 * Al servidor de desenvolupament, el camí de sempre: el botó que porta al
 * panell de Tractors, amb les mateixes paraules, i cap botó de revocar (es
 * revoca al panell): cap píxel canvia en DEV. El literal import.meta.env.DEV
 * el reemplaça Vite: al paquet de producció, la branca del panell no hi arriba
 * (AprovacioEnLinia.produccio.test.js).
 */
import { useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import DialegAprovacio, { textError } from './DialegAprovacio.jsx';

const codiDe = (idioma) => {
  const c = String(idioma || 'ca').toLowerCase().split('-')[0];
  return ['ca', 'es', 'en', 'eu', 'gl'].includes(c) ? c : 'ca';
};

const TEXTOS_DEV = import.meta.env.DEV === true ? Object.freeze({
  ca: Object.freeze({ lloc: 'al panell de Tractors', boto: 'Obri el panell de Tractors' }),
  es: Object.freeze({ lloc: 'en el panel de Tractores', boto: 'Abrir el panel de Tractores' }),
  en: Object.freeze({ lloc: 'in the Tractors panel', boto: 'Open Tractors panel' }),
  eu: Object.freeze({ lloc: 'Traktoreen panelean', boto: 'Ireki Traktoreen panela' }),
  gl: Object.freeze({ lloc: 'no panel de Tractores', boto: 'Abrir o panel de Tractores' })
}) : null;

const TEXTOS_PROD = Object.freeze({
  ca: Object.freeze({ lloc: 'en este navegador', llig: 'Llig la fitxa i aprova’l', revoca: 'Revoca l’aprovació', de: (nom) => `de «${nom}»` }),
  es: Object.freeze({ lloc: 'en este navegador', llig: 'Leer la ficha y aprobarlo', revoca: 'Revocar la aprobación', de: (nom) => `de «${nom}»` }),
  en: Object.freeze({ lloc: 'in this browser', llig: 'Read spec sheet & approve', revoca: 'Revoke approval', de: (nom) => `for “${nom}”` }),
  eu: Object.freeze({ lloc: 'nabigatzaile honetan', llig: 'Irakurri fitxa eta onartu', revoca: 'Baliogabetu onespena', de: (nom) => `«${nom}» traktorearena` }),
  gl: Object.freeze({ lloc: 'neste navegador', llig: 'Ler a ficha e aprobalo', revoca: 'Revogar a aprobación', de: (nom) => `de «${nom}»` })
});

/**
 * On s'aprova, per a les frases de les portes: «al panell de Tractors» al
 * servidor de desenvolupament i «en este navegador» a la web publicada.
 * @returns {string}
 */
export function onSAprova(idioma = 'ca') {
  const llengua = codiDe(idioma);
  return import.meta.env.DEV === true ? TEXTOS_DEV[llengua].lloc : TEXTOS_PROD[llengua].lloc;
}

/**
 * L'acció de l'avís «Cal aprovar el tractor».
 * @param {{ porta?: object|null, id: string, onObreTractors?: () => void, varietat?: string, idioma?: string }} p
 */
export function AccioAprovacio({ porta = null, id, onObreTractors, varietat = 'primari', idioma = 'ca' }) {
  const llengua = codiDe(idioma);
  if (import.meta.env.DEV === true) {
    return <Boto varietat={varietat} onClick={onObreTractors}>{TEXTOS_DEV[llengua].boto}</Boto>;
  }
  return <AprovaEnEsteNavegador porta={porta} id={id} varietat={varietat} idioma={llengua} />;
}

/* El botó i el diàleg. DialegAprovacio es munta sempre i canvia de `key` a
   cada obertura (el seu contracte): cada obertura comença neta i el focus
   torna al botó. Aprovada, la pantalla deixa de pintar l'avís i el botó se'n
   va amb ell. Sense porta o sense el tractor al catàleg, cap botó: res a
   aprovar, i res que prometa. */
function AprovaEnEsteNavegador({ porta, id, varietat, idioma = 'ca' }) {
  const [obert, setObert] = useState(false);
  const [obertures, setObertures] = useState(0);
  const fila = filaDe(porta, id);
  if (!fila || typeof porta.aprova !== 'function') return null;
  const tx = TEXTOS_PROD[codiDe(idioma)];

  const obri = () => {
    setObertures((n) => n + 1);
    setObert(true);
  };
  /* L'empremta que es veia: si el codi ha canviat mentrestant, useTractors no aprova res (EMPREMTA_DIVERGENT). */
  const aprova = async ({ nivell, confirmacio }) => {
    await porta.aprova(id, { nivell, confirmacio, empremta: fila.empremta });
    setObert(false);
  };

  return (
    <>
      <Boto varietat={varietat} onClick={obri} disabled={!fila.empremta}>{tx.llig}</Boto>
      <DialegAprovacio key={obertures} obert={obert} manifest={fila.manifest} empremta={fila.empremta}
        webauthn={porta.webauthn === true} fitxa={fila.fitxa ?? ''} idioma={idioma}
        onTanca={() => setObert(false)} onAprova={aprova} />
    </>
  );
}

/* La fila del tractor a la porta (useTractors().tractors), o null. */
function filaDe(porta, id) {
  return Array.isArray(porta?.tractors) ? porta.tractors.find((t) => t.id === id) ?? null : null;
}

/**
 * Fora de DEV, amb el tractor aprovat: el botó que en revoca l'aprovació en este navegador. Revocar és
 * immediat, com al panell, i no esborra res més: tornar-lo a aprovar demana llegir i signar de nou. En DEV, o
 * sense una aprovació vigent, res.
 * @param {{ porta?: object|null, id: string, idioma?: string }} p
 */
export function RevocaAprovacio({ porta = null, id, idioma = 'ca' }) {
  const [revocant, setRevocant] = useState(false);
  const [error, setError] = useState(null);
  if (import.meta.env.DEV === true) return null;
  const fila = filaDe(porta, id);
  if (!fila || fila.estat !== 'aprovat' || typeof porta.revoca !== 'function') return null;
  const llengua = codiDe(idioma);
  const tx = TEXTOS_PROD[llengua];
  const revoca = async () => {
    setRevocant(true);
    setError(null);
    try {
      await porta.revoca(id);
    } catch (e) {
      setError(textError(e, llengua));
    } finally {
      setRevocant(false);
    }
  };
  return (
    <>
      <Boto varietat="secundari" onClick={revoca} carregant={revocant}>
        {tx.revoca}{' '}<span className="sdp-nomes-lector">{tx.de(fila.manifest?.nom ?? id)}</span>
      </Boto>
      {error ? <Alerta to="error" titol={error.titol}>{error.detall || null}</Alerta> : null}
    </>
  );
}
