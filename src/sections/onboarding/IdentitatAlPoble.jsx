import { useEffect, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, GrupCamps, Selector } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { POBLE_FUNDACIONAL } from '../../data/identitatsSeed.js';
import { carregaNomenclatorIne, cercaMunicipisIne, nomsAmbMunicipisIne } from '../pobles/nomenclatorIne.js';
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
   Canviar-lo conserva els altres pobles triats a «El compte».
   R16-S (P0-79 / IDEA-210, ordre del Mestre del 261109) · A la mateixa fitxa,
   els altres pobles (afegir-ne i llevar-ne: el principal sempre queda) i el
   cercador dels 8.132 municipis de l'INE, que es baixen en un tros a banda
   quan s'hi escriu (nomenclatorIne.js) i entren a les dues llistes. Un
   homònim hi va amb la província. La cita de la font (condició de
   reutilització de l'INE) és a l'ajuda del cercador. */
const p = (nom, reserva) => Object.freeze([`section.onboarding.identitatPoble.${nom}`, reserva]);
export const TEXTOS_IDENTITAT_AL_POBLE = Object.freeze({
  titol: p('titol', 'El teu identificador i el teu poble'),
  etiquetaUsuari: p('etiquetaUsuari', 'Identificador'),
  etiquetaPoble: p('etiquetaPoble', 'El teu poble'),
  etiquetaDesaUsuari: p('etiquetaDesaUsuari', 'Desa l’identificador'),
  ajudaUsuari: p('ajudaUsuari', 'Es veu amb una @ davant a la teua fitxa pública, només si el teu perfil és públic.'),
  ajudaPoble: p('ajudaPoble', 'El teu poble principal. Si en tens més, afig-los ací davall o a «El compte».'),
  desat: p('desat', 'Desat.'),
  pendentTitol: p('pendentTitol', 'Pendent de migració al servidor'),
  pendentUsuari: p('pendentUsuari', '{missatge} El teu identificador @{usuari} es queda escrit ací, sense desar: torna-ho a provar quan s’haja aplicat.'),
  pendentPoble: p('pendentPoble', '{missatge} El poble «{poble}» no s’ha desat: continua el d’abans.'),
  errorDesaUsuari: p('errorDesaUsuari', 'No s’ha pogut desar l’identificador.'),
  errorDesaPoble: p('errorDesaPoble', 'No s’ha pogut desar el poble.'),
  triaPoble: p('triaPoble', 'Tria un poble…'),
  proposatTitol: p('proposatTitol', 'Et proposem @{usuari}'),
  proposatDacord: p('proposatDacord', 'D’acord, vull @{usuari}'),
  proposatExplicacio: p('proposatExplicacio', 'L’hem fet amb el teu nom. Si t’agrada, queda-te’l; si no, escriu-ne un altre ací davall.'),
  fesServirProposta: p('fesServirProposta', 'Fes servir @{proposta}'),
  etiquetaCercaIne: p('etiquetaCercaIne', 'Cerca entre els 8.132 municipis d’Espanya'),
  ajudaCercaIne: p('ajudaCercaIne', 'Escriu el nom d’un municipi i apareixerà a les llistes de davall.'),
  fontIne: p('fontIne', 'Font: elaboració pròpia amb dades de l’INE (www.ine.es), relació de municipis a 1 de gener de 2026.'),
  placeholderCercaIne: p('placeholderCercaIne', 'Per exemple, Busot'),
  etiquetaAltresPobles: p('etiquetaAltresPobles', 'Altres pobles'),
  ajudaAltresPobles: p('ajudaAltresPobles', 'Pots ser de més d’un poble: el principal va primer i la resta, darrere.'),
  triaAltrePoble: p('triaAltrePoble', 'Afig un altre poble…'),
  llevaPoble: p('llevaPoble', 'Lleva {poble}'),
});
export const TITOL_IDENTITAT_AL_POBLE = TEXTOS_IDENTITAT_AL_POBLE.titol[1];
export const ETIQUETA_USUARI = TEXTOS_IDENTITAT_AL_POBLE.etiquetaUsuari[1];
export const ETIQUETA_POBLE = TEXTOS_IDENTITAT_AL_POBLE.etiquetaPoble[1];
export const ETIQUETA_DESA_USUARI = TEXTOS_IDENTITAT_AL_POBLE.etiquetaDesaUsuari[1];
export const AJUDA_USUARI = TEXTOS_IDENTITAT_AL_POBLE.ajudaUsuari[1];
export const AJUDA_POBLE = TEXTOS_IDENTITAT_AL_POBLE.ajudaPoble[1];
export const TEXT_DESAT = TEXTOS_IDENTITAT_AL_POBLE.desat[1];
/* APP-D1 (pla 261029_0216, Pas 2) · El servidor encara no té 2610282100: la
   RPC de l'identificador (NO-DISPONIBLE) o una columna del poble
   (ErrorColumnaAbsent) no hi són. No és cap error de la persona ni res a
   corregir: un avís (role=status, no alert) amb el motiu de l'adaptador i el
   valor que s'ha quedat sense desar, mai «Desat.» ni el camp en roig. */
export const TITOL_PENDENT_DE_MIGRACIO = TEXTOS_IDENTITAT_AL_POBLE.pendentTitol[1];
const esPendentDeMigracio = (err) => err?.code === 'NO-DISPONIBLE' || err?.name === 'ErrorColumnaAbsent';

/** El poble principal nou al davant i la resta dels triats darrere, sense repetir-lo. */
export function pobleAmbPrincipal(actual, principal) {
  return [principal, ...llistaDePobles(actual).filter((nom) => nom !== principal)].join(' · ');
}

/** Un altre poble darrere dels triats, sense repetir-lo. Sense cap triat, darrere de `principal` (el preseleccionat). */
function pobleAmbAfegit(actual, nou, principal = '') {
  const triats = llistaDePobles(actual);
  return llistaDePobles([...(triats.length ? triats : [principal]), nou]).join(' · ');
}

/** Els triats sense `llevat`; el principal no se'n va mai. */
function pobleSenseLlevat(actual, llevat) {
  const [principal, ...altres] = llistaDePobles(actual);
  return llistaDePobles([principal, ...altres.filter((nom) => nom !== llevat)]).join(' · ');
}

export function IdentitatAlPoble({ usuari = '', confirmat = false, poble = '', pobles = [], desactivat = false, onDesaUsuari, onDesaPoble }) {
  const t = useTraductorOpcional();
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
  const [cercaIne, setCercaIne] = useState('');
  const [municipisIne, setMunicipisIne] = useState([]);
  const consultaIne = useRef(0);
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
    const motiu = validaUsername(net, { actual: usuari, t });
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
      setEstat(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.desat));
      tornaAlCamp.current = alCamp;
    } catch (err) {
      if (esPendentDeMigracio(err)) {
        setPendent(omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.pendentUsuari), { missatge: err.message, usuari: net }));
        return;
      }
      setError(String(err?.message || tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.errorDesaUsuari)));
      if (err?.code === 'ocupat' && typeof err.proposta === 'string') setProposta(err.proposta);
    } finally {
      setDesant(false);
    }
  };

  /* R16-S · Cada lletra del cercador llança una cerca a l'INE; només la de
     l'última consulta entra a les llistes (una de vella que arriba tard no
     xafa la nova). Buit, cap municipi de més. */
  const canviaCercaIne = (event) => {
    const text = event.target.value;
    const torn = consultaIne.current + 1;
    consultaIne.current = torn;
    setCercaIne(text);
    if (!text.trim()) {
      setMunicipisIne([]);
      return;
    }
    void cercaMunicipisIne(text).then((trobats) => {
      if (consultaIne.current === torn) setMunicipisIne(trobats);
    });
  };

  const nomsDelCataleg = nomsAmbMunicipisIne(pobles, municipisIne);
  const triats = llistaDePobles(poble);
  const principal = triats[0] || (nomsDelCataleg.includes(POBLE_FUNDACIONAL) ? POBLE_FUNDACIONAL : '');
  const opcionsDePoble = [
    ...(principal ? [] : [{ valor: '', etiqueta: tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.triaPoble) }]),
    ...[...new Set([...(principal ? [principal] : []), ...nomsDelCataleg])]
      .sort((a, b) => a.localeCompare(b, 'ca')).map((nom) => ({ valor: nom, etiqueta: nom })),
  ];
  const opcionsAltresPobles = [
    { valor: '', etiqueta: tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.triaAltrePoble) },
    ...nomsDelCataleg.filter((nom) => nom !== principal && !triats.includes(nom)).map((nom) => ({ valor: nom, etiqueta: nom })),
  ];
  /* `mostrat` és el que diu l'avís si el servidor encara no té la columna. */
  const desaPobles = async (cadena, mostrat = cadena) => {
    if (!cadena || cadena === poble || typeof onDesaPoble !== 'function') return;
    setEstat('');
    setErrorPoble('');
    setPendent('');
    setDesant(true);
    try {
      await onDesaPoble(cadena);
      setEstat(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.desat));
    } catch (err) {
      if (esPendentDeMigracio(err)) {
        setPendent(omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.pendentPoble), { missatge: err.message, poble: mostrat }));
        return;
      }
      setErrorPoble(String(err?.message || tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.errorDesaPoble)));
    } finally {
      setDesant(false);
    }
  };
  const canviaPoble = (event) => {
    const nou = event.target.value;
    if (!nou || nou === principal) return undefined;
    return desaPobles(pobleAmbPrincipal(poble, nou), nou);
  };
  const afegeixPoble = (event) => (event.target.value ? desaPobles(pobleAmbAfegit(poble, event.target.value, principal)) : undefined);
  const llevaPoble = (nom) => desaPobles(pobleSenseLlevat(poble, nom));

  const proposat = Boolean(usuari) && !confirmat && !confirmatAra;
  return (
    <div ref={arrel}>
      <GrupCamps llegenda={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.titol)}>
        {proposat ? (
          <Alerta
            titol={omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.proposatTitol), { usuari })}
            accions={(
              <Boto varietat="primari" icona={AtSign} onClick={() => desa(usuari, { alCamp: true })} disabled={desactivat || desant}>
                {omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.proposatDacord), { usuari })}
              </Boto>
            )}
          >
            {tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.proposatExplicacio)}
          </Alerta>
        ) : null}
        {pendent ? <Alerta to="avis" titol={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.pendentTitol)}>{pendent}</Alerta> : null}
        <Camp etiqueta={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.etiquetaUsuari)} ajuda={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.ajudaUsuari)} error={error || undefined}>
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
            {tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.etiquetaDesaUsuari)}
          </Boto>
          {proposta ? (
            <Boto varietat="fantasma" onClick={() => { setValor(proposta); desa(proposta); }} disabled={desactivat || desant}>
              {omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.fesServirProposta), { proposta })}
            </Boto>
          ) : null}
        </div>
        {nomsDelCataleg.length && typeof onDesaPoble === 'function' ? (
          <>
            <Camp
              etiqueta={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.etiquetaCercaIne)}
              ajuda={`${tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.ajudaCercaIne)} ${tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.fontIne)}`}
            >
              <CampText
                name="cercaMunicipi"
                value={cercaIne}
                placeholder={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.placeholderCercaIne)}
                onFocus={() => { void carregaNomenclatorIne(); }}
                onChange={canviaCercaIne}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                disabled={desactivat || desant}
              />
            </Camp>
            <Camp etiqueta={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.etiquetaPoble)} ajuda={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.ajudaPoble)} error={errorPoble || undefined}>
              <Selector name="poble" opcions={opcionsDePoble} value={principal} onChange={canviaPoble} disabled={desactivat || desant} />
            </Camp>
            {opcionsAltresPobles.length > 1 ? (
              <Camp etiqueta={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.etiquetaAltresPobles)} ajuda={tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.ajudaAltresPobles)}>
                <Selector name="altrePoble" opcions={opcionsAltresPobles} value="" onChange={afegeixPoble} disabled={desactivat || desant} />
              </Camp>
            ) : null}
            {triats.length > 1 ? (
              <div className="sdp-alerta__accions">
                {triats.slice(1).map((nom) => (
                  <Boto key={nom} varietat="fantasma" onClick={() => llevaPoble(nom)} disabled={desactivat || desant}>
                    {omple(tradueix(t, TEXTOS_IDENTITAT_AL_POBLE.llevaPoble), { poble: nom })}
                  </Boto>
                ))}
              </div>
            ) : null}
          </>
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
