/* Onada 11 (261010; prompt 261010_1730, tasca 2; brainstorming 261009_2005 §5
   nivell 1, F3) · La faceta «Estil del poble» del Tauler de superadmin:
   l'editor de tokens estructurats (el CSS lliure el va descartar el Mestre,
   261010_1140: «enfocar-se a l'editor de tokens estructurats»).
   · La llista TOKENS_EDITABLES (config/estil.js) amb el valor vigent de cada
     token (el personalitzat, o el que es veu ara a l'arrel: el canònic o el
     girat pel crom), un CampText de color per als colors i un Selector per als
     radis; el to del crom amb un CampText de color com al PanellCrom (deltaDe);
     els parells de contrast per davall de 7:1 en roig, i bloquegen «Desar».
   · «Previsualitza» aplica l'esborrany a l'arrel (aplicaEstil: el mateix full
     que EstilDelPoble); «Torna al que hi ha desat» descarta l'esborrany i
     reaplica el desat; «Desar» crida adminDesaPersonalitzacio('estil') amb la
     versió que s'editava i diu l'error pel codi ('cal-segon-factor',
     'conflicte-versio'…) amb la frase de MISSATGE_PERSONALITZACIO; «Historial»
     llista les versions (adminHistorialPersonalitzacio) amb «Restaurar» cap a
     l'esborrany; «Exporta JSON» baixa el payload.
   · Sense la capacitat 'personalitzacio' (un node que no l'oferix): EstatBuit,
     sense cap crida al port.
   · En desmuntar-se, l'arrel torna al que hi ha desat: la previsualització no
     sobreviu a la faceta.
   · AdminSection.jsx no es toca ací: FACETA_ESTIL és el que necessita qui
     munta el menú del Tauler per a afegir-hi esta faceta.
   Textos en valencià, literals: només els veu el superadmin (com el Tauler). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, Carregant, EstatBuit, GrupCamps, Selector } from '../../components/PedraSeca/index.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { adminDesaPersonalitzacio, adminHistorialPersonalitzacio, teCapacitat } from '../../data/backendPort.js';
import { MISSATGE_PERSONALITZACIO } from '../../data/errorsBackend.js';
import {
  CANON, CANON_RADIS, CONTRAST_MINIM, ESCALA_RADIS, TOKENS_EDITABLES, ambCrom, contrastosDe, normalitzaTo, validaEstil, valorValid
} from '../../config/estil.js';
import { aplicaEstil, llevaEstil } from '../../config/aplicaEstil.js';
import { CANON_BLAU, base, deltaDe, giraTo } from '../../config/crom.js';

export const FACETA_ESTIL = Object.freeze({ id: 'estil', titol: 'Estil del poble', icona: Palette });

const GRUPS = Object.freeze([
  ['fons', 'Fons'], ['text', 'Text'], ['accent', 'Accent (taronja)'], ['accio', 'Acció (blau)'], ['estat', 'Estats'], ['radi', 'Radis']
]);

/* L'etiqueta visible de cada token; el nom tècnic va a l'ajuda del Camp. */
const ETIQUETES = Object.freeze({
  '--sdp-fons-app': 'Fons de l’app', '--sdp-fons-targeta': 'Fons de la targeta', '--sdp-fons-elevat': 'Fons elevat',
  '--sdp-fons-superficie': 'Superfície', '--sdp-fons-roca': 'Roca (barres)', '--sdp-sobre-roca': 'Text sobre la roca',
  '--sdp-fons-subtil': 'Fons subtil', '--sdp-fons-invers': 'Fons invers',
  '--sdp-text-titol': 'Títols', '--sdp-text-cos': 'Text de cos', '--sdp-text-suau': 'Text suau',
  '--sdp-text-invers': 'Text invers', '--sdp-text-desactivat': 'Text desactivat',
  '--sdp-accent': 'Accent', '--sdp-accent-hover': 'Accent en passar-hi', '--sdp-accent-subtil': 'Accent subtil',
  '--sdp-sobre-accent': 'Text sobre l’accent', '--sdp-accent-text': 'Text d’accent',
  '--sdp-accent-text-hover': 'Text d’accent en passar-hi', '--sdp-accent-titol': 'Títols d’accent',
  '--sdp-accio': 'Acció', '--sdp-accio-hover': 'Acció en passar-hi', '--sdp-accio-forta': 'Acció forta',
  '--sdp-accio-subtil': 'Acció subtil', '--sdp-accio-control': 'Control d’acció',
  '--sdp-accio-control-hover': 'Control d’acció en passar-hi', '--sdp-sobre-accio': 'Text sobre l’acció',
  '--sdp-accio-text': 'Text d’acció', '--sdp-focus': 'Anell de focus', '--sdp-focus-invers': 'Focus invers',
  '--sdp-focus-sobre-accio': 'Focus sobre l’acció',
  '--sdp-error': 'Error', '--sdp-error-fons': 'Fons d’error', '--sdp-error-text': 'Text d’error',
  '--sdp-avis': 'Avís', '--sdp-avis-fons': 'Fons d’avís', '--sdp-avis-text': 'Text d’avís',
  '--sdp-exit': 'Èxit', '--sdp-exit-fons': 'Fons d’èxit', '--sdp-exit-text': 'Text d’èxit',
  '--sdp-info': 'Informació', '--sdp-info-fons': 'Fons d’informació', '--sdp-info-text': 'Text d’informació',
  '--sdp-radi-s': 'Radi xicotet', '--sdp-radi-m': 'Radi mitjà', '--sdp-radi-g': 'Radi gran', '--sdp-radi-xl': 'Radi extra'
});
const etiquetaDe = (nom) => ETIQUETES[nom] || nom.replace(/^--sdp-/, '');
const OPCIONS_RADI = ESCALA_RADIS.map((valor) => ({ valor, etiqueta: valor }));
const FORMAT_DATA = new Intl.DateTimeFormat('ca', { dateStyle: 'medium', timeStyle: 'short' });

/* Com AdminSection: un port que no és a punt i llança també val com a «sense». */
function ambCapacitatPersonalitzacio() {
  try { return teCapacitat('personalitzacio') === true; } catch { return false; }
}

/* Els tokens vàlids d'un estil desat ({ payload } o null), copiats. */
function tokensDe(desat) {
  const tokens = desat?.payload?.tokens;
  if (!tokens || typeof tokens !== 'object') return {};
  return Object.fromEntries(Object.entries(tokens).filter(([nom, valor]) => valorValid(nom, valor)));
}

/* El que es veu ara a l'arrel per a cada token de la llista: només valors del seu tipus. */
function llegirVigents(arrel) {
  const cs = getComputedStyle(arrel);
  const vigents = {};
  for (const { nom } of TOKENS_EDITABLES) {
    const valor = cs.getPropertyValue(nom).trim().toLowerCase();
    if (valorValid(nom, valor)) vigents[nom] = valor;
  }
  return vigents;
}

const textDError = (err) => MISSATGE_PERSONALITZACIO[err?.code] || MISSATGE_PERSONALITZACIO.desconegut;
const ratioText = (ratio) => (ratio === null ? 'sense valor' : `${ratio.toFixed(2).replace('.', ',')}:1`);
function dataDe(iso) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? String(iso) : FORMAT_DATA.format(data);
}

function CampToken({ token, valor, personalitzat, onCanvi, onCanon }) {
  const { nom, tipus } = token;
  const opcions = valor || tipus === 'color' ? OPCIONS_RADI : [{ valor: '', etiqueta: '(sense valor)', desactivat: true }, ...OPCIONS_RADI];
  return (
    <Camp etiqueta={etiquetaDe(nom)} ajuda={nom} className={personalitzat ? 'sdp-estil__camp sdp-estil__camp--personalitzat' : 'sdp-estil__camp'}>
      {tipus === 'color'
        ? <CampText tipus="color" value={valor || '#000000'} onChange={(e) => onCanvi(nom, e.target.value)} />
        : <Selector opcions={opcions} value={valor} onChange={(e) => onCanvi(nom, e.target.value)} />}
      {personalitzat ? <Boto varietat="fantasma" onClick={() => onCanon(nom)} aria-label={`Tornar ${etiquetaDe(nom)} al cànon`}>Cànon</Boto> : null}
    </Camp>
  );
}

function Historial({ entrades, onRestaura }) {
  if (!entrades.length) return <p className="sdp-camp__ajuda">Encara no hi ha cap versió desada.</p>;
  return (
    <ul className="sdp-estil__historial" aria-label="Versions desades">
      {entrades.map((e) => (
        <li key={e.versio} className="sdp-estil__versio">
          <span>{`Versió ${e.versio}`}{e.creat ? ` · ${dataDe(e.creat)}` : ''}{e.autor ? ` · ${e.autor}` : ''}</span>
          <Boto onClick={() => onRestaura(e)} aria-label={`Restaurar la versió ${e.versio}`}>Restaurar</Boto>
        </li>
      ))}
    </ul>
  );
}

export function FacetaEstil() {
  const { personalitzacio, refresh } = useCoreContent();
  const sessio = useSessioOpcional();
  const desat = personalitzacio?.estil ?? null;
  /* La identitat de `personalitzacio` canvia amb cada revalidació del contingut:
     l'esborrany només es refà quan el que hi ha desat canvia de veres. */
  const clauDesat = JSON.stringify(desat ?? null);
  const [potPersonalitzar] = useState(ambCapacitatPersonalitzacio);
  const [arrel, setArrel] = useState(null);
  const [vigents, setVigents] = useState({});
  const [tokens, setTokens] = useState(() => tokensDe(desat));
  const [to, setTo] = useState(() => normalitzaTo(desat?.payload?.crom?.to ?? 0));
  const [colorCrom, setColorCrom] = useState(null);
  const [versio, setVersio] = useState(desat?.versio ?? null);
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState(null);
  const [historial, setHistorial] = useState(null);   // null (plegat) | 'carregant' | [{ versio, payload, creat, autor }]
  const viu = useRef(true);
  const desatRef = useRef(desat);
  desatRef.current = desat;

  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);

  /* El desat ha canviat (després de «Desar» i del refresh, o perquè algú altre ha desat): l'esborrany el seguix. */
  useEffect(() => {
    const d = desatRef.current;
    setTokens(tokensDe(d));
    setTo(normalitzaTo(d?.payload?.crom?.to ?? 0));
    setVersio(d?.versio ?? null);
    setColorCrom(null);
  }, [clauDesat]);

  /* L'arrel de la instància, com el PanellCrom (node.closest('.sdp-root')); fora d'una instància, el propi node. */
  const setNode = useCallback((node) => {
    if (node) setArrel((actual) => actual || node.closest('.sdp-root') || node);
  }, []);

  /* Els valors vigents es lligen una vegada, abans de cap previsualització. */
  useEffect(() => {
    if (arrel) setVigents(llegirVigents(arrel));
  }, [arrel]);

  /* En desmuntar: l'arrel torna al que hi ha desat (o a res). */
  useEffect(() => {
    if (!arrel) return undefined;
    return () => {
      const d = desatRef.current;
      if (d?.payload) aplicaEstil(arrel, d.payload); else llevaEstil(arrel);
    };
  }, [arrel]);

  const payload = useMemo(() => ambCrom({ tokens }, to), [tokens, to]);
  const desatTokens = desat?.payload?.tokens ?? {};
  /* Els vigents per al contrast, sense l'estil desat que l'arrel ja porta aplicat
     (EstilDelPoble): un token desat que l'esborrany no porta tornarà al cànon en
     desar, i és contra el cànon que es jutja el parell, no contra el valor vell
     que encara es veu. Els altres vigents (el canònic o el girat pel crom) queden. */
  const vigentsNets = useMemo(() => {
    const nets = { ...vigents };
    for (const nom of Object.keys(tokensDe(desat))) {
      if (CANON[nom]) nets[nom] = CANON[nom]; else delete nets[nom];
    }
    return nets;
  }, [vigents, desat]);
  const contrastos = useMemo(() => contrastosDe(tokens, vigentsNets), [tokens, vigentsNets]);
  const baixos = contrastos.filter((c) => c.passa === false);
  const errors = useMemo(() => validaEstil(payload, vigentsNets), [payload, vigentsNets]);
  const bloquejat = errors.length > 0 || desant;
  const colorMostrat = colorCrom ?? (arrel ? giraTo(base(arrel).canons[CANON_BLAU], to) : '') ?? '';

  /* El cànon conegut: els colors dels parells de contrast i els quatre radis. */
  const canonDe = (nom) => CANON[nom] ?? CANON_RADIS[nom];
  const valorMostrat = (nom) => {
    if (tokens[nom] !== undefined) return tokens[nom];
    /* Un token desat ja és el que es veu a l'arrel: sense ell a l'esborrany, el cànon. */
    if (desatTokens[nom] !== undefined) return canonDe(nom) ?? vigents[nom] ?? '';
    return vigents[nom] ?? canonDe(nom) ?? '';
  };

  const canvia = (nom, valor) => setTokens((actuals) => ({ ...actuals, [nom]: valor }));
  /* Front D4 (integració) · Sense cap variable sobrant: la porta de codi mort
     (qualitat.fantasmes) linta tot src sense configuració en línia. */
  const reinicia = (nom) => setTokens((actuals) => Object.fromEntries(Object.entries(actuals).filter(([clau]) => clau !== nom)));
  const canviaCrom = (hex) => {
    setColorCrom(hex);
    setTo(arrel ? normalitzaTo(deltaDe(arrel, hex)) : 0);
  };

  const previsualitza = () => { if (arrel) aplicaEstil(arrel, payload); };
  const tornaAlDesat = () => {
    setTokens(tokensDe(desat));
    setTo(normalitzaTo(desat?.payload?.crom?.to ?? 0));
    setColorCrom(null);
    setAvis(null);
    if (!arrel) return;
    if (desat?.payload) aplicaEstil(arrel, desat.payload); else llevaEstil(arrel);
  };

  /* Promise.resolve().then: el port llança de manera síncrona si el mètode no hi és, i això també acaba a l'avís. */
  const desa = () => {
    if (bloquejat) return;
    setDesant(true);
    setAvis(null);
    Promise.resolve()
      .then(() => adminDesaPersonalitzacio({ clau: 'estil', payload, versio }))
      .then((resultat) => {
        if (!viu.current) return;
        setVersio(resultat?.versio ?? null);
        setAvis({ to: 'exit', text: `Estil desat per a tot el poble (versió ${resultat?.versio ?? '?'}).` });
        if (arrel) aplicaEstil(arrel, payload);
        refresh?.();
      })
      .catch((err) => { if (viu.current) setAvis({ to: 'error', text: textDError(err) }); })
      .finally(() => { if (viu.current) setDesant(false); });
  };

  const commutaHistorial = () => {
    if (historial !== null) { setHistorial(null); return; }
    setHistorial('carregant');
    Promise.resolve()
      .then(() => adminHistorialPersonalitzacio('estil'))
      .then((llista) => { if (viu.current) setHistorial(Array.isArray(llista) ? llista : []); })
      .catch((err) => {
        if (!viu.current) return;
        setHistorial(null);
        setAvis({ to: 'error', text: textDError(err) });
      });
  };

  const restaura = (entrada) => {
    const p = entrada?.payload;
    setTokens(tokensDe({ payload: p }));
    setTo(normalitzaTo(p?.crom?.to ?? 0));
    setColorCrom(null);
    setAvis({ to: 'info', text: `Versió ${entrada.versio} carregada a l’esborrany: previsualitza-la i desa-la si et convenç.` });
  };

  const exporta = () => {
    const text = JSON.stringify(payload, null, 2);
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setAvis({ to: 'info', text: `Este navegador no baixa fitxers des d’ací. L’estil, en JSON: ${text}` });
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const enllac = document.createElement('a');
    enllac.href = url;
    enllac.download = `estil-del-poble-v${versio ?? 0}.json`;
    enllac.click();
    URL.revokeObjectURL(url);
  };

  if (!potPersonalitzar) {
    return (
      <EstatBuit icona={Palette} titol="Este node no oferix la personalització de l’estil">
        Cal un backend amb la capacitat «personalitzacio» per a desar l’estil del poble.
      </EstatBuit>
    );
  }

  return (
    <section ref={setNode} className="sdp-estil" aria-label="Estil del poble">
      {sessio?.calSegonFactor ? (
        <Alerta to="avis" viva={false} titol={MISSATGE_PERSONALITZACIO['cal-segon-factor']}>
          Pots previsualitzar, però el servidor no desarà res fins que confirmes el segon factor a «El compte».
        </Alerta>
      ) : null}

      {GRUPS.map(([grup, llegenda]) => (
        <GrupCamps key={grup} llegenda={llegenda} className="sdp-estil__grup">
          {TOKENS_EDITABLES.filter((t) => t.grup === grup).map((t) => (
            <CampToken key={t.nom} token={t} valor={valorMostrat(t.nom)} personalitzat={tokens[t.nom] !== undefined}
              onCanvi={canvia} onCanon={reinicia} />
          ))}
        </GrupCamps>
      ))}

      <GrupCamps llegenda="Crom" className="sdp-estil__grup sdp-estil__grup--crom">
        <Camp etiqueta="Color principal"
          ajuda="Es pren només el to: la lluminositat i el croma de cada esglaó es conserven, i el taronja gira amb el mateix delta (crom.js).">
          <CampText tipus="color" value={colorMostrat || '#0984e3'} onChange={(e) => canviaCrom(e.target.value)} />
        </Camp>
        <p className="sdp-camp__ajuda">Gir aplicat: {to.toFixed(1)}°{to === 0 ? ' — paleta canònica intacta' : ''}</p>
      </GrupCamps>

      <section className="sdp-estil__contrast" aria-label="Contrast">
        <h3 className="sdp-estil__subtitol">{`Contrast (mínim ${CONTRAST_MINIM}:1)`}</h3>
        <ul className="sdp-estil__parells">
          {contrastos.map((c) => (
            <li key={`${c.text}/${c.fons}`} className={c.passa === false ? 'sdp-estil__parell sdp-estil__parell--baix' : 'sdp-estil__parell'}>
              {`${etiquetaDe(c.text)} sobre ${etiquetaDe(c.fons)}: ${ratioText(c.ratio)}${c.passa === false ? ' · insuficient' : ''}`}
            </li>
          ))}
        </ul>
        {baixos.length ? (
          <Alerta to="error" viva={false} titol="Contrast insuficient">
            {`${baixos.length} ${baixos.length === 1 ? 'parell no arriba' : 'parells no arriben'} a ${CONTRAST_MINIM}:1: «Desar» queda bloquejat fins que ho arregles.`}
          </Alerta>
        ) : null}
      </section>

      <div className="sdp-estil__accions">
        <Boto onClick={previsualitza} disabled={!arrel}>Previsualitza</Boto>
        <Boto onClick={tornaAlDesat}>Torna al que hi ha desat</Boto>
        <Boto varietat="primari" onClick={desa} disabled={bloquejat} carregant={desant}>Desar</Boto>
        <Boto onClick={commutaHistorial} aria-expanded={historial !== null}>Historial</Boto>
        <Boto onClick={exporta}>Exporta JSON</Boto>
      </div>

      {avis ? <Alerta to={avis.to} onTanca={() => setAvis(null)}>{avis.text}</Alerta> : null}
      {historial === 'carregant' ? <Carregant etiqueta="Carregant l’historial…" /> : null}
      {Array.isArray(historial) ? <Historial entrades={historial} onRestaura={restaura} /> : null}
    </section>
  );
}
