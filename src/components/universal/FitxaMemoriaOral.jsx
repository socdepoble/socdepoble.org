/**
 * FitxaMemoriaOral.jsx — La «Fitxa de memòria oral (OKF v0.2)» de «🎴 Proposa
 * Card» (T3.2, marató 261101; IDEA-29 i IDEA-41 del Llibre Mestre).
 *
 * Germana de DocumentEditor, que l'obri després del clic. Només pinta la
 * fitxa que li donen: el motor (estructura i revisió) és del consumidor
 * (DocumentEditor · adapter.memoriaOral; el Bloc, sections/notes/
 * memoriaOralDelBloc.js), i el component universal no importa cap secció.
 *
 * Un diàleg de Pedra Seca, sense cap classe nova:
 *  · amb fitxa OKF: el títol, la descripció, el resum, el poble i les
 *    etiquetes (amb les paraules del relat que les justifiquen) i els avisos;
 *    i sempre, dins d'un <details> natiu «Veure la fitxa sencera», el fitxer
 *    sencer (el markdown OKF) en un quadre de només lectura: la persona veu
 *    tot el que signa abans de signar-ho (Gauntlet 2, 261101, G2-MO-03). Els
 *    noms de les etiquetes i els avisos passen pel traductor
 *    (editor.memoriaOral.tema.<id> i editor.memoriaOral.avis.<codi>), amb el
 *    text del motor com a reserva (G2-MO-07); el fitxer es queda en valencià;
 *  · la casella «L'he revisada», que crida revisa() (marcaRevisioHumana) i,
 *    desmarcada, torna a l'esborrany; l'estat de revisió, en una regió viva;
 *    i «Descarrega la fitxa», el markdown OKF en un Blob amb el nom del seu
 *    camí, sense xarxa;
 *  · la correcció abans de signar (Gauntlet 261101, B2-04): si la màquina hi
 *    ha trobat pobles, el poble del relat es tria entre ells (o cap) amb un
 *    GrupOpcions; si hi ha trobat etiquetes, cada una és una Casella que la
 *    persona pot desmarcar. Quan marca «L'he revisada»,
 *    revisa(fitxa, { etiquetes, municipi }) segella la fitxa amb la correcció
 *    (frontmatter, cos i camí); mentre és revisada, la correcció queda tancada, i
 *    desmarcar-la la torna a obrir tal com estava. Sense ningú que signe, es
 *    veu però no es pot tocar. L'esborrany que es descarrega abans de
 *    revisar és la proposta de la màquina, i el text ho diu;
 *  · afegir el que falta (D-5, pla 261101_1246, decisió del Mestre): amb
 *    cercaPoble, el camp «Un altre poble» tria un poble que la màquina no ha
 *    trobat, escrit com el diu la gent («Jijona», «la Torre», «Alcoy»), i en
 *    fa una opció més del grup; amb etiquetaNova, el camp «Etiqueta nova»
 *    afig una etiqueta del vocabulari o una de lliure, com una Casella més
 *    («… (afegida en la revisió)») que es pot desmarcar sense que isca del
 *    DOM (el focus no es perd); tornar-la a marcar passa pels mateixos límits
 *    que «Afig». La revisió rep aleshores també `etiquetesLliures`. Un anunci
 *    amagat (aria-live) diu què s'ha afegit o per què no, i després d'un error
 *    el focus torna al camp. El motor (àlies, catàleg i límits) és del
 *    consumidor; sense les dues funcions, o sense ningú que signe, el DOM de
 *    sempre;
 *  · dins de l'app nativa (o sense URL.createObjectURL), on un enllaç blob:
 *    no desa res, cap botó que no faria res: el <details> ja naix obert, i el
 *    quadre diu que se'n copie el text;
 *  · sense fitxa OKF (motiu buit, llavor o massa-llarg), un text curt i res més.
 * La revisió només viu en el diàleg obert: canvia la fitxa que es descarrega
 * i no es desa enlloc. Tancar i tornar a obrir torna a l'esborrany.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alerta, AreaText, Boto, Camp, CampText, Casella, Dialeg, Fila, GrupCamps, GrupOpcions, Pila } from '../PedraSeca/index.js';
import { esAppNativa } from '../../config/origenPublic.js';

const TIPUS_MARKDOWN = 'text/markdown;charset=utf-8';
/* D-5 · El text més llarg dels camps «Un altre poble» i «Etiqueta nova». */
const MAX_TEXT_CAMP = 80;

/* El text curt de cada motiu sense fitxa OKF (memoriaOral.js · MOTIUS_MEMORIA). */
const SENSE_FITXA = Object.freeze({
  buit: ['editor.memoriaOral.motiu.buit', 'La nota encara no té cap relat: escriu-lo al cos i torna a provar.'],
  llavor: ['editor.memoriaOral.motiu.llavor', 'El cos encara és la plantilla de format: escriu-hi el relat i torna a provar.'],
  'massa-llarg': ['editor.memoriaOral.motiu.massaLlarg', 'El relat és massa llarg per a analitzar-lo en el navegador.']
});

/** El nom del fitxer: el camí OKF de la fitxa (memoria-oral/<poble>/<slug>.md) en un sol nom. */
export function nomDeLaFitxa(cami) {
  return String(cami ?? '').split('/').filter(Boolean).join('_') || 'memoria-oral.md';
}

/* Cert si este navegador pot desar un fitxer generat amb un enllaç blob:. */
function potDescarregar() {
  return !esAppNativa() && typeof globalThis.URL?.createObjectURL === 'function';
}

/* El markdown, desat amb un Blob i un enllaç despenjat (Llei 06: l'app pot
   viure dins d'un shadow root), com DetallPoble i DetallPrivacitat. Cap peça
   universal no ho oferix encara (Gauntlet 2, 261101, G2-MO-11): quan n'hi
   haja una, esta funció hi ha de passar. */
function descarregaMarkdown(text, nom) {
  const urls = globalThis.URL;
  const url = urls.createObjectURL(new Blob([text], { type: TIPUS_MARKDOWN }));
  const enllac = globalThis.document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  // Safari necessita que la URL visca un moment després del clic.
  try { enllac.click(); } finally { setTimeout(() => urls.revokeObjectURL(url), 1000); }
}

/* Les etiquetes i els pobles que la màquina ha proposat, tal com venen. */
const llistaDe = (valor) => (Array.isArray(valor) ? valor.filter((e) => e && typeof e.id === 'string') : []);

/* Un id de tema o un codi d'avís que pot fer de tros de clau. */
const TROS_DE_CLAU = /^[A-Za-z][A-Za-z0-9]{0,40}$/;

/* El text d'una etiqueta: el nom (traduït; el del vocabulari, de reserva) i,
   entre parèntesis, les paraules del relat, tal com les va escriure la persona. */
function textEtiqueta(e, t) {
  const nom = TROS_DE_CLAU.test(e.id) ? t(`editor.memoriaOral.tema.${e.id}`, e.nom) : e.nom;
  return e.proves?.length ? `${nom} (${e.proves.join(', ')})` : nom;
}

/* Els avisos del motor, traduïts pel seu codi (codisAvis, paral·lel a avisos);
   sense codi, el text tal com ve. */
function textosAvisos(fitxa, t) {
  const avisos = Array.isArray(fitxa?.avisos) ? fitxa.avisos : [];
  const codis = Array.isArray(fitxa?.codisAvis) && fitxa.codisAvis.length === avisos.length ? fitxa.codisAvis : [];
  return avisos.flatMap((avis, n) => {
    if (typeof avis !== 'string') return [];
    const codi = codis[n];
    return [typeof codi === 'string' && TROS_DE_CLAU.test(codi) ? t(`editor.memoriaOral.avis.${codi}`, avis) : avis];
  });
}

/* Un text del motor amb paràgrafs separats per una línia en blanc (el resum
   d'un relat sense puntuació, B2-09): un <p> per paràgraf; un de sol, tal qual. */
function ambParagrafs(text) {
  const paragrafs = String(text).split('\n\n').filter(Boolean);
  return paragrafs.length > 1 ? paragrafs.map((p, n) => <p key={n}>{p}</p>) : text;
}

/* D-5 · Un text del traductor amb el seu marcador ({nom}, {n}) omplit; amb
   una funció, perquè un «$» del valor no faça de patró. */
const omple = (text, marcador, valor) => String(text).replace(marcador, () => String(valor));

/* Retorn dins d'un camp fa l'acció del seu botó (no mentre es compon amb un IME). */
const ambRetorn = (accio) => (event) => {
  if (event.key !== 'Enter' || event.nativeEvent?.isComposing) return;
  event.preventDefault();
  accio(event);
};

/* Després d'afegir des del botó, el focus torna al camp: el botó s'apaga en
   buidar-se el camp, i un botó apagat perdria el focus. El camp és el de la
   mateixa Pila que el botó. */
const tornaAlCamp = (event) => event?.currentTarget?.closest?.('.sdp-pila')?.querySelector?.('input')?.focus?.();

/* D-5 · El nom d'una etiqueta afegida: la del vocabulari, pel traductor; la
   lliure, tal com l'ha deixada el motor. */
const nomEtiqueta = (e, t) => (e.lliure !== true && TROS_DE_CLAU.test(e.id) ? t(`editor.memoriaOral.tema.${e.id}`, e.nom) : e.nom);

/* D-5 · L'error del camp «Etiqueta nova» per a un resultat d'etiquetaNova que no és «ok». */
function errorDEtiqueta(resultat, t) {
  if (resultat?.estat === 'repetida') return t('editor.memoriaOral.etiquetaRepetida', 'Esta etiqueta ja hi és.');
  if (resultat?.estat === 'massa') {
    return resultat.lliures === true
      ? omple(t('editor.memoriaOral.massaEtiquetesLliures', 'Ja hi ha {n} etiquetes lliures: lleva’n alguna abans d’afegir-ne més.'), '{n}', resultat.maxim)
      : omple(t('editor.memoriaOral.massaEtiquetes', 'Ja hi ha {n} etiquetes: lleva’n alguna abans d’afegir-ne més.'), '{n}', resultat.maxim);
  }
  return t('editor.memoriaOral.etiquetaInvalida', 'Escriu una etiqueta de 2 a 40 caràcters, amb lletres o xifres.');
}

/**
 * Props: obert, onTanca, fitxa (la d'estructuraMemoriaOral, en esborrany),
 * revisa ((fitxa, { etiquetes, municipi, etiquetesLliures? }) => fitxa
 * revisada, o null: la casella apagada), cercaPoble ((text) => { estat:
 * 'trobat' | 'ambigu' | 'cap' | 'buit', poble? }, opcional, D-5),
 * etiquetaNova ((text, idsMarcats) => { estat: 'ok' | 'repetida' | 'massa' |
 * 'invalida', etiqueta?, maxim?, lliures? }, opcional, D-5), descripcio (el
 * resultat de la Card, opcional) i t (el traductor, (clau, reserva)). La
 * correcció comença en la proposta de la màquina cada volta que el diàleg es
 * munta (DocumentEditor en canvia la `key` a cada obertura). Els camps
 * d'afegir només hi són amb revisa i la seua funció.
 */
export function FitxaMemoriaOral({ obert, onTanca, fitxa, revisa = null, cercaPoble = null, etiquetaNova = null, descripcio = null, t }) {
  const [revisada, setRevisada] = useState(null);
  const [errorRevisio, setErrorRevisio] = useState(false);
  const proposades = llistaDe(fitxa?.etiquetes);
  const candidats = llistaDe(fitxa?.candidats);
  const [triades, setTriades] = useState(() => proposades.map((e) => e.id));
  /* '' és «cap d'estos pobles»: cap id de poble no és buit. */
  const [poble, setPoble] = useState(() => fitxa?.municipi?.id ?? '');
  /* D-5 · El que afig la persona: pobles que no són candidats i etiquetes
     ({ id, nom, lliure, clau }); les desmarcades es queden, desmarcades. */
  const [poblesAfegits, setPoblesAfegits] = useState([]);
  const [afegides, setAfegides] = useState([]);
  const [textPoble, setTextPoble] = useState('');
  const [errorPoble, setErrorPoble] = useState(null);
  const [textNova, setTextNova] = useState('');
  const [errorEtiqueta, setErrorEtiqueta] = useState(null);
  const [anunci, setAnunci] = useState('');
  const actual = revisada ?? fitxa;
  const okf = actual?.okf ?? null;
  const descarregable = Boolean(okf) && potDescarregar();
  const potRevisar = typeof revisa === 'function';
  const tancada = !potRevisar || Boolean(revisada);
  const ambPobleNou = potRevisar && typeof cercaPoble === 'function';
  const ambEtiquetaNova = potRevisar && typeof etiquetaNova === 'function';
  const esMarcada = (id) => triades.includes(id);

  const canviaRevisio = (event) => {
    if (!event.target.checked) {
      setRevisada(null);
      setErrorRevisio(false);
      return;
    }
    try {
      /* Sense res afegit, la correcció de sempre: { etiquetes, municipi }. */
      const lliures = afegides.filter((e) => e.lliure && esMarcada(e.id)).map((e) => e.nom);
      setRevisada(revisa(fitxa, {
        etiquetes: [...proposades, ...afegides.filter((e) => !e.lliure)].filter((e) => esMarcada(e.id)).map((e) => e.id),
        municipi: poble || null,
        ...(lliures.length ? { etiquetesLliures: lliures } : {})
      }));
      setErrorRevisio(false);
    } catch {
      setRevisada(null);
      setErrorRevisio(true);
    }
  };
  /* D-5 · Les marcades, menys una: el que el motor compta per als límits. */
  const marcadesMenys = (id) => [...proposades, ...afegides].filter((e) => e.id !== id && esMarcada(e.id)).map((e) => e.id);
  /* D-5 · Un error del camp «Etiqueta nova», també per al lector de pantalla. */
  const diuErrorEtiqueta = (missatge) => {
    setErrorEtiqueta(missatge);
    setAnunci(missatge);
  };
  const canviaEtiqueta = (id) => (event) => {
    const marcada = event.target.checked;
    /* D-5 (Gauntlet T6a-G01) · Tornar a marcar-ne una passa pels mateixos
       límits que «Afig» (5 lliures i 10 en total): si no hi cap, es queda
       desmarcada (la casella és controlada) i el camp diu per què. */
    if (marcada && ambEtiquetaNova) {
      let resultat = null;
      try {
        resultat = etiquetaNova(id, marcadesMenys(id));
      } catch {
        resultat = null;
      }
      if (resultat?.estat === 'massa') {
        diuErrorEtiqueta(errorDEtiqueta(resultat, t));
        return;
      }
    }
    /* Desmarcar-ne una canvia les marcades: l'error d'abans ja no hi toca. */
    if (!marcada) setErrorEtiqueta(null);
    setTriades((abans) => (marcada ? [...abans, id] : abans.filter((x) => x !== id)));
  };

  /* D-5 · «Tria este poble»: el que diu el motor del consumidor (àlies i
     catàleg); trobat, es tria (i, si no és candidat, és una opció més). */
  const triaPoble = (event) => {
    if (tancada || !ambPobleNou || !textPoble.trim()) return;
    let resultat = null;
    try {
      resultat = cercaPoble(textPoble);
    } catch {
      resultat = null;
    }
    const trobat = resultat?.estat === 'trobat' && typeof resultat.poble?.id === 'string' && resultat.poble.id ? resultat.poble : null;
    if (!trobat) {
      const missatge = resultat?.estat === 'ambigu'
        ? t('editor.memoriaOral.pobleAmbigu', 'Hi ha més d’un poble amb este nom: escriu-lo sencer.')
        : t('editor.memoriaOral.pobleDesconegut', 'No coneixem cap poble amb este nom. Prova amb el nom oficial o amb el que diu la gent.');
      /* Gauntlet T6a-G02 · L'error s'anuncia i el focus torna al camp per a corregir-lo. */
      setErrorPoble(missatge);
      setAnunci(missatge);
      tornaAlCamp(event);
      return;
    }
    const candidat = candidats.find((c) => c.id === trobat.id);
    const nom = String(candidat?.nom ?? trobat.nom ?? trobat.id);
    if (!candidat) setPoblesAfegits((abans) => (abans.some((p) => p.id === trobat.id) ? abans : [...abans, { id: trobat.id, nom }]));
    setPoble(trobat.id);
    setTextPoble('');
    setErrorPoble(null);
    setAnunci(omple(t('editor.memoriaOral.pobleTriat', 'Poble triat: {nom}.'), '{nom}', nom));
    tornaAlCamp(event);
  };

  /* D-5 · «Afig»: una etiqueta del vocabulari o lliure. Si ja hi és però
     desmarcada (una proposada o una afegida), es torna a marcar. */
  const afigEtiqueta = (event) => {
    if (tancada || !ambEtiquetaNova || !textNova.trim()) return;
    let resultat = null;
    try {
      resultat = etiquetaNova(textNova, marcadesMenys(null));
    } catch {
      resultat = null;
    }
    const nova = resultat?.estat === 'ok' && typeof resultat.etiqueta?.id === 'string' && resultat.etiqueta.id ? resultat.etiqueta : null;
    if (!nova) {
      /* Gauntlet T6a-G02 · L'error s'anuncia i el focus torna al camp. */
      diuErrorEtiqueta(errorDEtiqueta(resultat, t));
      tornaAlCamp(event);
      return;
    }
    const clau = typeof nova.clau === 'string' ? nova.clau : nova.id;
    const existent = proposades.find((e) => e.id === nova.id) ?? afegides.find((e) => e.id === nova.id || e.clau === clau);
    const etiqueta = existent ?? { id: nova.id, nom: String(nova.nom ?? nova.id), lliure: nova.lliure === true, clau };
    if (!existent) setAfegides((abans) => [...abans, etiqueta]);
    setTriades((abans) => (abans.includes(etiqueta.id) ? abans : [...abans, etiqueta.id]));
    setTextNova('');
    setErrorEtiqueta(null);
    setAnunci(omple(t('editor.memoriaOral.etiquetaAfegida', 'Etiqueta afegida: {nom}.'), '{nom}', nomEtiqueta(etiqueta, t)));
    tornaAlCamp(event);
  };

  const titol = t('editor.memoriaOral.titol', 'Fitxa de memòria oral (OKF v0.2)');
  if (!okf) {
    const [clau, reserva] = SENSE_FITXA[fitxa?.motiu] ?? SENSE_FITXA.buit;
    return (
      <Dialeg obert={obert} onTanca={onTanca} titol={titol} descripcio={descripcio} mida="m">
        <p>{t(clau, reserva)}</p>
      </Dialeg>
    );
  }

  const avisos = textosAvisos(actual, t);
  const resum = typeof actual.resum === 'string' ? actual.resum : '';
  /* Les opcions del poble: els candidats i, darrere, els que ha triat la persona. */
  const opcionsPoble = [
    ...candidats.map((c) => ({ valor: c.id, etiqueta: c.nom })),
    ...poblesAfegits.filter((p) => !candidats.some((c) => c.id === p.id)).map((p) => ({ valor: p.id, etiqueta: p.nom }))
  ];
  const ambEtiquetes = proposades.length > 0 || afegides.length > 0;
  const etiquetaMarcada = (id) => (revisada ? llistaDe(revisada.etiquetes).some((x) => x.id === id) : esMarcada(id));
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={titol} descripcio={descripcio} mida="m"
      accions={descarregable ? (
        <Boto varietat="primari" onClick={() => descarregaMarkdown(okf.markdown, nomDeLaFitxa(okf.cami))}>
          {t('editor.memoriaOral.descarrega', 'Descarrega la fitxa')}
        </Boto>
      ) : null}>
      <Pila gap={4}>
        {potRevisar && !revisada && ambPobleNou && ambEtiquetaNova ? (
          <p>{t('editor.memoriaOral.correccioAmbAfegir', 'Abans de marcar «L’he revisada», desmarca les etiquetes que no hi toquen, afig les que hi falten i tria el poble del relat. La correcció entra a la fitxa quan la marques com a revisada; fins aleshores, la que descarregues és la proposta de la màquina.')}</p>
        ) : potRevisar && !revisada && (candidats.length > 0 || proposades.length > 0) ? (
          <p>{t('editor.memoriaOral.correccio', 'Abans de marcar «L’he revisada», desmarca les etiquetes que no hi toquen i tria el poble del relat. La correcció entra a la fitxa quan la marques com a revisada; fins aleshores, la que descarregues és la proposta de la màquina.')}</p>
        ) : null}
        <dl>
          <dt>{t('editor.memoriaOral.camp.titol', 'Títol')}</dt>
          <dd>{actual.titol}</dd>
          <dt>{t('editor.memoriaOral.camp.descripcio', 'Descripció')}</dt>
          <dd>{actual.descripcio}</dd>
          {resum ? (
            <>
              <dt>{t('editor.memoriaOral.camp.resum', 'Resum')}</dt>
              <dd>{ambParagrafs(resum)}</dd>
            </>
          ) : null}
          {candidats.length ? null : (
            <>
              <dt>{t('editor.memoriaOral.camp.poble', 'Poble detectat')}</dt>
              {/* Gauntlet T6a-G05 · Amb el selector, l'aplicació sí que en coneix
                  d'altres (els municipis de referència): el text no ho nega. */}
              <dd>{ambPobleNou
                ? t('editor.memoriaOral.capPobleAlRelat', 'La màquina no n’ha reconegut cap al relat')
                : t('editor.memoriaOral.capPoble', 'Cap dels pobles que coneix l’aplicació')}</dd>
            </>
          )}
          {ambEtiquetes ? null : (
            <>
              <dt>{t('editor.memoriaOral.camp.etiquetes', 'Etiquetes')}</dt>
              <dd>{t('editor.memoriaOral.capEtiqueta', 'Cap del vocabulari rural')}</dd>
            </>
          )}
        </dl>
        {opcionsPoble.length ? (
          <GrupOpcions
            llegenda={t('editor.memoriaOral.camp.pobleDelRelat', 'Poble del relat')}
            opcions={[
              ...opcionsPoble,
              { valor: '', etiqueta: t('editor.memoriaOral.capDEstos', 'Cap d’estos pobles') }
            ]}
            valor={revisada ? (revisada.municipi?.id ?? '') : poble}
            onCanvi={setPoble}
            disabled={tancada}
          />
        ) : null}
        {ambPobleNou ? (
          <Pila gap={2}>
            <Camp etiqueta={t('editor.memoriaOral.altrePoble', 'Un altre poble')}
              ajuda={t('editor.memoriaOral.altrePobleAjuda', 'Escriu-lo com el dius: Xixona o Jijona, la Torre o Torremanzanas, Alcoi o Alcoy.')}
              error={errorPoble}>
              <CampText autoComplete="off" spellCheck={false} maxLength={MAX_TEXT_CAMP} value={textPoble} disabled={tancada}
                onChange={(event) => { setTextPoble(event.target.value); setErrorPoble(null); }}
                onKeyDown={ambRetorn(triaPoble)} />
            </Camp>
            <Fila gap={2}>
              <Boto onClick={triaPoble} disabled={tancada || !textPoble.trim()}>
                {t('editor.memoriaOral.triaPoble', 'Tria este poble')}
              </Boto>
            </Fila>
          </Pila>
        ) : null}
        {ambEtiquetes ? (
          <GrupCamps llegenda={t('editor.memoriaOral.camp.etiquetes', 'Etiquetes')}>
            {proposades.map((e) => (
              <Casella key={e.id} etiqueta={textEtiqueta(e, t)}
                checked={etiquetaMarcada(e.id)}
                disabled={tancada}
                onChange={canviaEtiqueta(e.id)} />
            ))}
            {afegides.map((e) => (
              <Casella key={`afegida-${e.id}`} etiqueta={`${nomEtiqueta(e, t)} (${t('editor.memoriaOral.afegida', 'afegida en la revisió')})`}
                checked={etiquetaMarcada(e.id)}
                disabled={tancada}
                onChange={canviaEtiqueta(e.id)} />
            ))}
          </GrupCamps>
        ) : null}
        {ambEtiquetaNova ? (
          <Pila gap={2}>
            <Camp etiqueta={t('editor.memoriaOral.novaEtiqueta', 'Etiqueta nova')}
              ajuda={t('editor.memoriaOral.novaEtiquetaAjuda', 'Una o dues paraules, fins a 40 caràcters. Si és del vocabulari rural, s’hi reconeix.')}
              error={errorEtiqueta}>
              <CampText autoComplete="off" maxLength={MAX_TEXT_CAMP} value={textNova} disabled={tancada}
                onChange={(event) => { setTextNova(event.target.value); setErrorEtiqueta(null); }}
                onKeyDown={ambRetorn(afigEtiqueta)} />
            </Camp>
            <Fila gap={2}>
              <Boto icona={Plus} onClick={afigEtiqueta} disabled={tancada || !textNova.trim()}>
                {t('section.comu.afegeix', 'Afig')}
              </Boto>
            </Fila>
          </Pila>
        ) : null}
        {ambPobleNou || ambEtiquetaNova ? <p className="sdp-nomes-lector" aria-live="polite">{anunci}</p> : null}
        {avisos.length ? (
          <Alerta to="avis" viva={false} titol={t('editor.memoriaOral.avisos', 'Avisos')}>
            <ul className="sdp-llista">
              {avisos.map((avis, n) => <li key={n}>{avis}</li>)}
            </ul>
          </Alerta>
        ) : null}
        {/* G2-MO-03 · El fitxer sencer, sempre i abans de la casella que el
            signa: plegat on es pot descarregar, obert on només es pot copiar
            (l'app nativa). */}
        <details open={!descarregable}>
          <summary>{t('editor.memoriaOral.veureFitxa', 'Veure la fitxa sencera')}</summary>
          <Camp etiqueta={t('editor.memoriaOral.text', 'La fitxa, en Markdown')}
            ajuda={descarregable
              ? t('editor.memoriaOral.textSencer', 'És el fitxer sencer, tal com es descarrega.')
              : t('editor.memoriaOral.senseDescarrega', 'Ací no es pot desar com a fitxer: copia’n el text.')}>
            <AreaText files={8} readOnly spellCheck={false} value={okf.markdown} />
          </Camp>
        </details>
        <Casella
          etiqueta={t('editor.memoriaOral.revisada', 'L’he revisada')}
          ajuda={revisa
            ? t('editor.memoriaOral.revisadaAjuda', 'La fitxa que descarregues passa d’esborrany a revisada per una persona; el fitxer no porta cap identificador del teu compte.')
            : t('editor.memoriaOral.senseCompte', 'Per a signar la revisió cal entrar amb el teu compte.')}
          checked={Boolean(revisada)}
          disabled={typeof revisa !== 'function'}
          onChange={canviaRevisio}
        />
        <p role="status">
          {errorRevisio
            ? t('editor.memoriaOral.errorRevisio', 'No s’ha pogut signar la revisió: la fitxa continua en esborrany.')
            : revisada
              ? t('editor.memoriaOral.estat.revisada', 'Estat: revisada per una persona.')
              : t('editor.memoriaOral.estat.esborrany', 'Estat: esborrany, pendent de revisió humana.')}
        </p>
      </Pila>
    </Dialeg>
  );
}

export default FitxaMemoriaOral;
