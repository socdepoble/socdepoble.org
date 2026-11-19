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
 *
 * Onada R24 (CODEX-R24-12) · `fitxa` (opcional): el Markdown de la fitxa del
 * tractor. Al panell de Tractors la fitxa és darrere del diàleg i no cal; fora
 * de DEV (AprovacioEnLinia.jsx) no hi ha cap panell, i el diàleg la porta
 * sencera abans de «He llegit la fitxa sencera», amb els títols al nivell i
 * l'estil del panell (h5 i h6 dins de .sdp-tractors-panell__fitxa). Es pinta
 * amb elements de React (fitxaTractor.js: cap HTML, cap sanejador), perquè la
 * closca de la Gestoria també es compila com a mòdul net. Sense `fitxa`, el
 * DOM de sempre.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Dialeg } from '../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, Casella } from '../../components/PedraSeca/organismes/formulari.jsx';
import { blocsDeFitxa, trossosEnLinia } from './fitxaTractor.js';
import { empremtaCurta } from './nucli/empremta.js';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';
import cssDiferitTractors from '../../css/diferit-tractors.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'tractors', cssDiferitTractors); };

const codiIdiomaDialeg = (idioma) => {
  const c = String(idioma || 'ca').toLowerCase().split('-')[0];
  return ['ca', 'es', 'en', 'eu', 'gl'].includes(c) ? c : 'ca';
};

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

const TEXTOS_DIALEG_I18N = Object.freeze({
  es: Object.freeze({
    errorDefecte: 'No se ha podido completar la operación.',
    cancella: 'Cancelar',
    titol: (nom) => `Aprobar «${nom}»`,
    descripcio: (versio, curta) => `Apruebas la versión ${versio} con la huella corta ${curta}. Si cambia una sola línea del código, del manifiesto o de la ficha, la aprobación deja de valer.`,
    senseEmpremta: 'Esta versión no tiene huella: no se puede aprobar.',
    empremtaCurta: 'Huella corta:',
    cap: 'ninguna',
    fitxaAria: 'Ficha explicativa',
    heLlegit: 'He leído la ficha entera',
    ajudaDins: 'Qué hace, qué lee, qué escribe, qué no hace nunca y sus límites. Está aquí arriba, dentro de este diálogo.',
    ajudaFora: 'Qué hace, qué lee, qué escribe, qué no hace nunca y sus límites. Está en el panel, detrás de este diálogo.',
    signatura: 'Firma',
    signaturaText: 'Touch ID, Windows Hello o una llave de acceso. El gesto de verificación lo haces tú.',
    signaBoto: 'Firmar con Touch ID o llave de acceso',
    noPotSignarTitol: 'Este navegador no puede firmar',
    noPotSignarText: 'Este tractor exige firma con Touch ID o llave de acceso, y este navegador no la ofrece (o la página no está en un contexto seguro).',
    confirmacioTitol: 'Confirmación escrita',
    exigeixSignatura: 'Este tractor exige firma: la confirmación escrita no basta.',
    escriuEmpremta: 'Escribe la huella corta',
    ajudaEmpremta: (curta) => `Es ${curta}. Mayúsculas, espacios y guiones no importan.`,
    aprovaConfirmacio: 'Aprobar con confirmación escrita'
  }),
  en: Object.freeze({
    errorDefecte: 'Could not complete the operation.',
    cancella: 'Cancel',
    titol: (nom) => `Approve “${nom}”`,
    descripcio: (versio, curta) => `You are approving version ${versio} with short hash ${curta}. If a single line of code, manifest or spec sheet changes, approval is invalidated.`,
    senseEmpremta: 'This version has no hash: it cannot be approved.',
    empremtaCurta: 'Short hash:',
    cap: 'none',
    fitxaAria: 'Spec sheet',
    heLlegit: 'I have read the entire spec sheet',
    ajudaDins: 'What it does, reads, writes, never does and its limits. Shown right above inside this dialog.',
    ajudaFora: 'What it does, reads, writes, never does and its limits. Shown in the panel behind this dialog.',
    signatura: 'Cryptographic signature',
    signaturaText: 'Touch ID, Windows Hello or a passkey. You perform the verification gesture.',
    signaBoto: 'Sign with Touch ID or passkey',
    noPotSignarTitol: 'This browser cannot sign',
    noPotSignarText: 'This tractor requires Touch ID or a passkey signature, and this browser does not provide one in this context.',
    confirmacioTitol: 'Written confirmation',
    exigeixSignatura: 'This tractor requires a hardware/passkey signature: written confirmation is not accepted.',
    escriuEmpremta: 'Type the short hash',
    ajudaEmpremta: (curta) => `It is ${curta}. Case, spaces and hyphens are ignored.`,
    aprovaConfirmacio: 'Approve with written confirmation'
  }),
  eu: Object.freeze({
    errorDefecte: 'Ezin izan da eragiketa osatu.',
    cancella: 'Utzi',
    titol: (nom) => `Onartu «${nom}»`,
    descripcio: (versio, curta) => `${versio} bertsioa onartzen duzu ${curta} aztarna laburrarekin. Kodeko, manifestuko edo fitxako lerro bakar bat aldatzen bada, onespenak balioa galtzen du.`,
    senseEmpremta: 'Bertsio honek ez du aztarnarik: ezin da onartu.',
    empremtaCurta: 'Aztarna laburra:',
    cap: 'bat ere ez',
    fitxaAria: 'Azalpen-fitxa',
    heLlegit: 'Fitxa osoa irakurri dut',
    ajudaDins: 'Zer egiten duen, zer irakurtzen eta idazten duen, zer ez duen inoiz egiten eta bere mugak. Hemen goian dago.',
    ajudaFora: 'Zer egiten duen, zer irakurtzen eta idazten duen, zer ez duen inoiz egiten eta bere mugak. Atzeko panelean dago.',
    signatura: 'Sinadura',
    signaturaText: 'Touch ID, Windows Hello edo pasagako bat. Egiaztapen-keinua zuk egiten duzu.',
    signaBoto: 'Sinatu Touch ID edo pasagakoarekin',
    noPotSignarTitol: 'Nabigatzaile honek ezin du sinatu',
    noPotSignarText: 'Traktore honek Touch ID edo pasagako bidezko sinadura eskatzen du, eta nabigatzaile honek ez du eskaintzen.',
    confirmacioTitol: 'Idatzizko berrespena',
    exigeixSignatura: 'Traktore honek sinadura eskatzen du: idatzizko berrespenak ez du balio.',
    escriuEmpremta: 'Idatzi aztarna laburra',
    ajudaEmpremta: (curta) => `${curta} da. Maiuskulak, zuriuneak eta marratxoak ez dira kontuan hartzen.`,
    aprovaConfirmacio: 'Onartu idatzizko berrespenarekin'
  }),
  gl: Object.freeze({
    errorDefecte: 'Non se puido completar a operación.',
    cancella: 'Cancelar',
    titol: (nom) => `Aprobar «${nom}»`,
    descripcio: (versio, curta) => `Aprobas a versión ${versio} coa pegada curta ${curta}. Se cambia unha soa liña do código, do manifesto ou da ficha, a aprobación deixa de valer.`,
    senseEmpremta: 'Esta versión non ten pegada: non se pode aprobar.',
    empremtaCurta: 'Pegada curta:',
    cap: 'ningunha',
    fitxaAria: 'Ficha explicativa',
    heLlegit: 'Lin a ficha enteira',
    ajudaDins: 'Que fai, que le, que escribe, que non fai nunca e os seus límites. Está aquí enriba, dentro deste diálogo.',
    ajudaFora: 'Que fai, que le, que escribe, que non fai nunca e os seus límites. Está no panel, detrás deste diálogo.',
    signatura: 'Sinatura',
    signaturaText: 'Touch ID, Windows Hello ou unha chave de paso. O xesto de verificación falo ti.',
    signaBoto: 'Asinar con Touch ID ou chave de paso',
    noPotSignarTitol: 'Este navegador non pode asinar',
    noPotSignarText: 'Este tractor esixe sinatura con Touch ID ou chave de paso, e este navegador non a ofrece neste contexto.',
    confirmacioTitol: 'Confirmación escrita',
    exigeixSignatura: 'Este tractor esixe sinatura: a confirmación escrita non abonda.',
    escriuEmpremta: 'Escribe a pegada curta',
    ajudaEmpremta: (curta) => `É ${curta}. Maiúsculas, espazos e guións non importan.`,
    aprovaConfirmacio: 'Aprobar con confirmación escrita'
  })
});

/* { titol, detall }: el text clar i, si n'hi ha, el motiu tècnic de la porta. */
export function textError(error, idioma = 'ca') {
  const llengua = codiIdiomaDialeg(idioma);
  const detall = typeof error?.message === 'string' ? error.message.trim() : '';
  const defecte = llengua === 'ca' ? 'No s’ha pogut completar l’operació.' : TEXTOS_DIALEG_I18N[llengua].errorDefecte;
  const titol = TEXTOS_ERROR[error?.codi] ?? defecte;
  return { titol, detall: detall && detall !== titol ? detall : '' };
}

/* El text d'una línia de la fitxa: negreta i codi com a elements, la resta com a text. */
function EnLinia({ text }) {
  return trossosEnLinia(text).map((tros, i) => {
    if (tros.tipus === 'fort') return <strong ref={adoptaEstilsDiferits} key={i}>{tros.text}</strong>;
    if (tros.tipus === 'codi') return <code ref={adoptaEstilsDiferits} key={i}>{tros.text}</code>;
    return tros.text;
  });
}

/* La fitxa sencera. Penja del diàleg com del tractor al panell: «#» és un h5 i la resta, h6. */
function FitxaDelTractor({ fitxa, etiqueta = 'Fitxa explicativa' }) {
  return (
    <section ref={adoptaEstilsDiferits} className="sdp-tractors-panell__fitxa" aria-label={etiqueta}>
      {blocsDeFitxa(fitxa).map((bloc, i) => {
        if (bloc.tipus === 'titol') {
          const Titol = bloc.nivell <= 1 ? 'h5' : 'h6';
          return <Titol key={i}><EnLinia text={bloc.text} /></Titol>;
        }
        if (bloc.tipus === 'llista') {
          const Llista = bloc.ordenada ? 'ol' : 'ul';
          return (
            <Llista key={i}>
              {bloc.elements.map((element, j) => (
                <li ref={adoptaEstilsDiferits} key={j}>
                  <EnLinia text={element.text} />
                  {element.fills.length ? (
                    <ul ref={adoptaEstilsDiferits}>{element.fills.map((fill, k) => <li ref={adoptaEstilsDiferits} key={k}><EnLinia text={fill.text} /></li>)}</ul>
                  ) : null}
                </li>
              ))}
            </Llista>
          );
        }
        return <p ref={adoptaEstilsDiferits} key={i}><EnLinia text={bloc.text} /></p>;
      })}
    </section>
  );
}

function curtaDe(empremta) {
  try {
    return empremtaCurta(empremta);
  } catch {
    return null;
  }
}

export default function DialegAprovacio({ obert, onTanca, onAprova, manifest, empremta, webauthn = false, fitxa = null, idioma = 'ca' }) {
  const llengua = codiIdiomaDialeg(idioma);
  const tx = llengua === 'ca' ? null : TEXTOS_DIALEG_I18N[llengua];
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
      if (viu.current) setError(textError(e, llengua));
    } finally {
      if (viu.current) setOcupat(null);
    }
  }

  const nom = manifest?.nom ?? 'tractor';
  const ambFitxa = typeof fitxa === 'string' && fitxa.trim() !== '';

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={tx ? tx.titol(nom) : `Aprova «${nom}»`}
      descripcio={curta
        ? (tx ? tx.descripcio(manifest?.versio ?? '', curta) : `Aproves la versió ${manifest?.versio ?? ''} amb l’empremta curta ${curta}. Si canvia una sola línia del codi, del manifest o de la fitxa, l’aprovació deixa de valdre.`)
        : (tx ? tx.senseEmpremta : 'Esta versió no té empremta: no es pot aprovar.')}
      tancaEnVel={!ocupat}
      mida={ambFitxa ? 'g' : undefined}
      accions={<Boto varietat="secundari" onClick={() => tanca('boto')} disabled={Boolean(ocupat)}>{tx ? tx.cancella : 'Cancel·la'}</Boto>}
    >
      <div ref={adoptaEstilsDiferits} className="sdp-tractors-dialeg">
        <p className="sdp-tractors-dialeg__empremta">
          {tx ? tx.empremtaCurta : 'Empremta curta:'} <strong className="sdp-tractors-dialeg__curta">{curta ?? (tx ? tx.cap : 'cap')}</strong>
        </p>
        {ambFitxa ? <FitxaDelTractor fitxa={fitxa} etiqueta={tx ? tx.fitxaAria : 'Fitxa explicativa'} /> : null}
        <Casella
          etiqueta={tx ? tx.heLlegit : 'He llegit la fitxa sencera'}
          ajuda={ambFitxa
            ? (tx ? tx.ajudaDins : 'Què fa, què llig, què escriu, què no fa mai i els seus límits. És ací dalt, dins d’este diàleg.')
            : (tx ? tx.ajudaFora : 'Què fa, què llig, què escriu, què no fa mai i els seus límits. És al panell, darrere d’este diàleg.')}
          checked={llegit}
          onChange={(e) => setLlegit(e.target.checked)}
          disabled={Boolean(ocupat)}
        />

        {webauthn ? (
          <section ref={adoptaEstilsDiferits} className="sdp-tractors-dialeg__via" aria-labelledby={idSignatura}>
            <h3 id={idSignatura} className="sdp-tractors-dialeg__titol">{tx ? tx.signatura : 'Signatura'}</h3>
            <p>
              {tx ? tx.signaturaText : 'Touch ID, Windows Hello o una clau de pas. El gest de verificació el fas tu; ara bé, un programa que ja controle este navegador podria registrar-hi una clau pròpia.'}
            </p>
            <Boto varietat="primari" onClick={() => envia('signatura')} disabled={!potAprovar}
              carregant={ocupat === 'signatura'}>
              {tx ? tx.signaBoto : 'Signa amb Touch ID o clau de pas'}
            </Boto>
          </section>
        ) : exigeixSignatura ? (
          <Alerta to="avis" viva={false} titol={tx ? tx.noPotSignarTitol : 'Este navegador no pot signar'}>
            {tx ? tx.noPotSignarText : 'Este tractor exigix la signatura amb Touch ID o una clau de pas, i este navegador no l’oferix (o la pàgina no s’ha obert en un context segur: https o localhost).'}
          </Alerta>
        ) : null}

        <section className="sdp-tractors-dialeg__via" aria-labelledby={idConfirmacio}>
          <h3 id={idConfirmacio} className="sdp-tractors-dialeg__titol">{tx ? tx.confirmacioTitol : 'Confirmació escrita'}</h3>
          {exigeixSignatura ? (
            <p ref={adoptaEstilsDiferits}>{tx ? tx.exigeixSignatura : 'Este tractor exigix signatura: la confirmació escrita no hi val.'}</p>
          ) : null}
          <Camp etiqueta={tx ? tx.escriuEmpremta : 'Escriu l’empremta curta'}
            ajuda={curta ? (tx ? tx.ajudaEmpremta(curta) : `És ${curta}. Majúscules, espais i guions no importen.`) : undefined}>
            <CampText value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" spellCheck={false}
              disabled={exigeixSignatura || Boolean(ocupat)} />
          </Camp>
          <Boto varietat={webauthn ? 'secundari' : 'primari'} onClick={() => envia('confirmacio')}
            disabled={exigeixSignatura || !potAprovar || !text.trim()} carregant={ocupat === 'confirmacio'}>
            {tx ? tx.aprovaConfirmacio : 'Aprova amb confirmació escrita'}
          </Boto>
        </section>

        {error ? <Alerta to="error" titol={error.titol}>{error.detall || null}</Alerta> : null}
      </div>
    </Dialeg>
  );
}
