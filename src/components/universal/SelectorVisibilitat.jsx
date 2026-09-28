/**
 * SelectorVisibilitat.jsx — «Qui ho pot vore?»: pública o privada, amb avís.
 *
 * T41 (ordre del Mestre, 260928) · La bola del món de la barra taronja i el
 * botó PUBLICAR de la barra d'eines ja no canvien res en silenci: obrin esta
 * finestra, que explica les dues eixides i demana confirmació. És la mateixa
 * finestra flotant de la barra que la data de publicació (Dialeg lloc="barra").
 *
 * CONTRACTE
 *   obert · onTanca(motiu: 'esc'|'vel'|'boto'|'fet') · esPublica (estat actual) ·
 *   onTria(publica) → Promise<boolean|void> | boolean | void · textos · bloqueig
 *   null | { opcio: 'publica'|'privada', motiu } · comNom (identitat que signa)
 *
 * Confirmar SEMPRE crida onTria(triada === 'publica'): el consumidor decidix
 * (el Perfil posa el valor explícit; Notes publica o actualitza al Mur).
 *   · Torna false → es queda oberta (el consumidor ja ho ha dit).
 *   · AbortError (la sessió ha canviat) → es tanca en silenci.
 *   · Un altre error → el motiu en línia (role=alert) i es queda oberta.
 *   · Mentre treballa, ni Escape, ni el vel, ni Tancar la tanquen. Si el
 *     navegador la tanca igualment (dos Escape seguits, Dialeg avisa amb
 *     { forcat: true }), s'accepta, i la pròxima obertura continua on era:
 *     la tria, el treball en curs i l'error que haja arribat mentrestant.
 * No sap res del backend (Model B): només rep l'estat i una funció.
 */
import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { Alerta, Boto, Dialeg, GrupOpcions } from '../PedraSeca/index.js';

/** Textos genèrics (el consumidor en passa de propis: visibilitatFitxa.js, visibilitatNota.js). */
export const TEXTOS_VISIBILITAT = Object.freeze({
  titol: 'Qui ho pot vore?',
  descripcio: 'Tria si este document és públic o privat.',
  llegenda: 'Visibilitat',
  publica: Object.freeze({
    etiqueta: 'Públic', explicacio: 'Qualsevol persona del poble el pot llegir.', accio: 'Fer-lo públic', accioIgual: 'Deixar-lo públic',
  }),
  privada: Object.freeze({
    etiqueta: 'Privat', explicacio: 'Amb el candau tancat, només el veus tu.', accio: 'Fer-lo privat', accioIgual: 'Deixar-lo privat',
  }),
  /* Només on és cert que es pot desfer; si no, `irreversible` avisa abans de publicar. */
  reversible: null,
  irreversible: null,
  /* El que encara no fa el servidor quan es tria «pública» (es diu, no s'amaga). */
  avisPublica: null,
});

const ICONES = { publica: Globe, privada: Lock };
const ESTAT_ACTUAL = 'Com està ara';

export function SelectorVisibilitat({
  obert, onTanca, esPublica = false, onTria, textos = TEXTOS_VISIBILITAT, bloqueig = null, comNom = null,
}) {
  const actual = esPublica ? 'publica' : 'privada';
  const bloquejada = (opcio) => bloqueig?.opcio === opcio;
  const inicial = bloquejada(actual) ? (actual === 'publica' ? 'privada' : 'publica') : actual;
  const [triada, setTriada] = useState(inicial);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(null);
  /* Poliment T41 (ordre del Mestre, 260928) · Tancada pel navegador mentre
     treballava: la pròxima obertura no reinicia res. */
  const [reprendre, setReprendre] = useState(false);

  /* Cada obertura comença de nou: l'estat de ara, sense error (ajust durant
     el render; el <dialog> es queda muntat i el focus torna al disparador). */
  const [obertAbans, setObertAbans] = useState(obert);
  if (obert !== obertAbans) {
    setObertAbans(obert);
    if (obert && reprendre) {
      setReprendre(false);
    } else if (obert) {
      setTriada(inicial);
      setError(null);
      setOcupat(false);
    }
  }

  const tanca = (motiu, info) => {
    if (ocupat) {
      if (!info?.forcat) return;
      setReprendre(true);
    }
    onTanca?.(motiu);
  };

  const confirma = async () => {
    if (ocupat || bloquejada(triada)) return;
    setOcupat(true);
    setError(null);
    try {
      const resultat = await onTria?.(triada === 'publica');
      setOcupat(false);
      if (resultat !== false) {
        // Ja està fet: si s'havia tancat mentrestant, la pròxima obertura comença de nou.
        setReprendre(false);
        onTanca?.('fet');
      }
    } catch (e) {
      setOcupat(false);
      if (e?.name === 'AbortError') {
        setReprendre(false);
        onTanca?.('fet');
        return;
      }
      setError(e?.message || 'No s’ha pogut canviar la visibilitat.');
    }
  };

  const opcio = (valor) => {
    const Icona = ICONES[valor];
    return {
      valor,
      antetitol: valor === actual ? ESTAT_ACTUAL : undefined,
      etiqueta: textos[valor].etiqueta,
      ajuda: textos[valor].explicacio,
      icona: <Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
      desactivada: bloquejada(valor),
    };
  };

  const etiquetaPrimari = triada === actual ? textos[triada].accioIgual : textos[triada].accio;
  const publicaNova = triada === 'publica' && actual !== 'publica';

  return (
    <Dialeg obert={obert} onTanca={tanca} titol={textos.titol} descripcio={textos.descripcio}
      mida="m" lloc="barra" className="sdp-selector-visibilitat" tancaEnVel={!ocupat}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={ocupat}>Cancel·lar</Boto>
          <Boto varietat="primari" onClick={confirma} carregant={ocupat} disabled={bloquejada(triada)}>{etiquetaPrimari}</Boto>
        </>
      )}>
      {comNom ? <p className="sdp-selector-visibilitat__com">Publicaràs com a <strong>{comNom}</strong>.</p> : null}
      {/* Correcció C20 (260928) · El motiu del bloqueig abans de les opcions:
          es llig (i es veu, sense baixar) abans de trobar l'opció desactivada. */}
      {bloqueig ? <Alerta to="avis">{bloqueig.motiu}</Alerta> : null}
      <GrupOpcions aspecte="targetes" llegenda={textos.llegenda} valor={triada} onCanvi={setTriada}
        disabled={ocupat} textTriada="Triada" opcions={[opcio('publica'), opcio('privada')]} />
      {!bloqueig && textos.reversible ? <Alerta to="info">{textos.reversible}</Alerta> : null}
      {triada === 'publica' && textos.avisPublica ? <Alerta to="avis">{textos.avisPublica}</Alerta> : null}
      {publicaNova && textos.irreversible ? <Alerta to="avis">{textos.irreversible}</Alerta> : null}
      {error ? <Alerta to="error">{error}</Alerta> : null}
    </Dialeg>
  );
}

export default SelectorVisibilitat;
