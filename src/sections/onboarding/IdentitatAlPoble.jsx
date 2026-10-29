import { useEffect, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, GrupCamps, Selector } from '../../components/PedraSeca/index.js';
import { POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';
import { llistaDePobles } from '../pobles/nomsDelPoble.js';
import { MAXIM_USERNAME, netejaUsernameEnEscriure, normalitzaUsername, validaUsername } from './onboardingModel.js';

/* P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) · El
   @usuari i el poble de la persona, a la seua fitxa (PerfilEditor) des de la
   primera entrada, també després d'entrar amb Google o Apple: l'alta ja hi
   ha deixat una proposta (2610282100) i, mentre la persona no l'ha triada
   (username_confirmat_at null), es diu com a proposta, amb «D'acord» per a
   quedar-se-la. El canvi passa per la RPC (onDesaUsuari: updateProfile amb
   `username`), mai pel PATCH ni per l'autodesament: un 409 a la cua
   deixaria un esborrany per sempre. La validació en línia és la del
   servidor (validaUsername) i, si ja és d'algú, la proposta que torna.
   El poble: el principal, del catàleg del Mas, amb La Torre de les Maçanes
   preseleccionada si encara no n'hi ha cap (ordre del Mestre del 261028).
   Canviar-lo conserva els altres pobles triats a «El compte». */
export const TITOL_IDENTITAT_AL_POBLE = 'El teu identificador i el teu poble';
export const ETIQUETA_USUARI = 'Identificador';
export const ETIQUETA_POBLE = 'El teu poble';
export const ETIQUETA_DESA_USUARI = 'Desa l’identificador';
export const AJUDA_USUARI = 'Es veu amb una @ davant a la teua fitxa pública, només si el teu perfil és públic.';
export const AJUDA_POBLE = 'El teu poble principal. Si en tens més, es trien a «El compte».';
export const TEXT_DESAT = 'Desat.';
/* APP-D1 (pla 261029_0216, Pas 2) · El servidor encara no té 2610282100: la
   RPC de l'identificador (NO-DISPONIBLE) o una columna del poble
   (ErrorColumnaAbsent) no hi són. No és cap error de la persona ni res a
   corregir: un avís (role=status, no alert) amb el motiu de l'adaptador i el
   valor que s'ha quedat sense desar, mai «Desat.» ni el camp en roig. */
export const TITOL_PENDENT_DE_MIGRACIO = 'Pendent de migració al servidor';
const esPendentDeMigracio = (err) => err?.code === 'NO-DISPONIBLE' || err?.name === 'ErrorColumnaAbsent';

/** El poble principal nou al davant i la resta dels triats darrere, sense repetir-lo. */
export function pobleAmbPrincipal(actual, principal) {
  return [principal, ...llistaDePobles(actual).filter((nom) => nom !== principal)].join(' · ');
}

export function IdentitatAlPoble({ usuari = '', confirmat = false, poble = '', pobles = [], desactivat = false, onDesaUsuari, onDesaPoble }) {
  const [valor, setValor] = useState(usuari);
  const [error, setError] = useState('');
  /* Revisió del Bloc H (R3) · L'error del poble és del seu Camp: el de
     l'identificador queda per a desa(). */
  const [errorPoble, setErrorPoble] = useState('');
  const [proposta, setProposta] = useState('');
  const [pendent, setPendent] = useState('');
  const [estat, setEstat] = useState('');
  const [desant, setDesant] = useState(false);
  const [confirmatAra, setConfirmatAra] = useState(false);
  const [vist, setVist] = useState(usuari);
  /* Ajust en pintar: un identificador nou del servidor (una altra lectura) torna al camp. */
  if (vist !== usuari) {
    setVist(usuari);
    setValor(usuari);
  }

  /* Revisió del Bloc H (R4) · Confirmada la proposta, el botó «D'acord» se'n
     va amb l'Alerta: el focus passa al camp de l'identificador quan torna a
     estar actiu (en acabar de desar). GrupCamps i CampText no reenvien la
     ref (React 18): el camp es busca dins de l'embolcall. */
  const arrel = useRef(null);
  const tornaAlCamp = useRef(false);
  useEffect(() => {
    if (desant || !tornaAlCamp.current) return;
    tornaAlCamp.current = false;
    arrel.current?.querySelector('input[name="username"]')?.focus();
  }, [desant]);

  const desa = async (candidat, { alCamp = false } = {}) => {
    const net = normalitzaUsername(candidat);
    const motiu = validaUsername(net, { actual: usuari });
    setEstat('');
    setProposta('');
    setPendent('');
    if (motiu) {
      setError(motiu);
      return;
    }
    setError('');
    setDesant(true);
    try {
      await onDesaUsuari(net);
      setValor(net);
      setConfirmatAra(true);
      setEstat(TEXT_DESAT);
      tornaAlCamp.current = alCamp;
    } catch (err) {
      if (esPendentDeMigracio(err)) {
        setPendent(`${err.message} El teu identificador @${net} es queda escrit ací, sense desar: torna-ho a provar quan s’haja aplicat.`);
        return;
      }
      setError(String(err?.message || 'No s’ha pogut desar l’identificador.'));
      if (err?.code === 'ocupat' && typeof err.proposta === 'string') setProposta(err.proposta);
    } finally {
      setDesant(false);
    }
  };

  const nomsDelCataleg = [...new Set((pobles || []).map((nom) => String(nom || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ca'));
  const principal = llistaDePobles(poble)[0] || (nomsDelCataleg.includes(POBLE_FUNDACIONAL) ? POBLE_FUNDACIONAL : '');
  const opcionsDePoble = [
    ...(principal ? [] : [{ valor: '', etiqueta: 'Tria un poble…' }]),
    ...[...new Set([...(principal ? [principal] : []), ...nomsDelCataleg])]
      .sort((a, b) => a.localeCompare(b, 'ca')).map((nom) => ({ valor: nom, etiqueta: nom })),
  ];
  const canviaPoble = async (event) => {
    const nou = event.target.value;
    if (!nou || nou === principal || typeof onDesaPoble !== 'function') return;
    setEstat('');
    setErrorPoble('');
    setPendent('');
    setDesant(true);
    try {
      await onDesaPoble(pobleAmbPrincipal(poble, nou));
      setEstat(TEXT_DESAT);
    } catch (err) {
      if (esPendentDeMigracio(err)) {
        setPendent(`${err.message} El poble «${nou}» no s’ha desat: continua el d’abans.`);
        return;
      }
      setErrorPoble(String(err?.message || 'No s’ha pogut desar el poble.'));
    } finally {
      setDesant(false);
    }
  };

  const proposat = Boolean(usuari) && !confirmat && !confirmatAra;
  return (
    <div ref={arrel}>
      <GrupCamps llegenda={TITOL_IDENTITAT_AL_POBLE}>
        {proposat ? (
          <Alerta
            titol={`Et proposem @${usuari}`}
            accions={(
              <Boto varietat="primari" icona={AtSign} onClick={() => desa(usuari, { alCamp: true })} disabled={desactivat || desant}>
                {`D’acord, vull @${usuari}`}
              </Boto>
            )}
          >
            L’hem fet amb el teu nom. Si t’agrada, queda-te’l; si no, escriu-ne un altre ací davall.
          </Alerta>
        ) : null}
        {pendent ? <Alerta to="avis" titol={TITOL_PENDENT_DE_MIGRACIO}>{pendent}</Alerta> : null}
        <Camp etiqueta={ETIQUETA_USUARI} ajuda={AJUDA_USUARI} error={error || undefined}>
          <CampText
            name="username"
            value={valor}
            onChange={(event) => { setValor(netejaUsernameEnEscriure(event.target.value)); setError(''); setProposta(''); setPendent(''); setEstat(''); }}
            autoComplete="nickname"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={MAXIM_USERNAME}
            disabled={desactivat || desant}
          />
        </Camp>
        <div className="sdp-alerta__accions">
          <Boto onClick={() => desa(valor)} disabled={desactivat || desant || normalitzaUsername(valor) === usuari} carregant={desant}>
            {ETIQUETA_DESA_USUARI}
          </Boto>
          {proposta ? (
            <Boto varietat="fantasma" onClick={() => { setValor(proposta); desa(proposta); }} disabled={desactivat || desant}>
              {`Fes servir @${proposta}`}
            </Boto>
          ) : null}
        </div>
        {nomsDelCataleg.length && typeof onDesaPoble === 'function' ? (
          <Camp etiqueta={ETIQUETA_POBLE} ajuda={AJUDA_POBLE} error={errorPoble || undefined}>
            <Selector name="poble" opcions={opcionsDePoble} value={principal} onChange={canviaPoble} disabled={desactivat || desant} />
          </Camp>
        ) : null}
      </GrupCamps>
      {/* R4 · Sempre muntada i buida en repòs: «Desat.» hi entra després i el
          lector de pantalla l'anuncia. Fora de la graella de GrupCamps: dins,
          en una pantalla molt ampla, la línia buida prenia una columna i
          estrenyia els camps. Buida, fa 0 px (p:last-child, base.css). */}
      <p className="sdp-camp__ajuda" role="status">{estat}</p>
    </div>
  );
}

export default IdentitatAlPoble;
