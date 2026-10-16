/**
 * CopyrightPage.jsx — «Drets d'autor» a pantalla completa, dins de l'editor.
 *
 * T39 (ordre del Mestre, 260928) · El diàleg xicotet del selector passa a ser
 * una vista que ocupa la columna de l'editor (DocumentEditor la munta com a
 * germana de la closca, i la closca s'amaga però continua muntada: TipTap i
 * l'autodesament no es desmunten). Explica cada llicència amb un exemple de
 * poble i diu d'on ve la llicència de sèrie (l'herència des del Perfil).
 *
 * CONTRACTE (pur: sense contextos ni router; es pot pintar al catàleg)
 *   valor      · el copyright d'ara ('CC BY-NC-SA 4.0 Sóc de Poble', 'CC BY 4.0', 'x · CC0 1.0'…)
 *   autor      · el nom del text de sèrie de «Copyright (C)» (© autor)
 *   ambit      · 'publicacio' | 'perfil' | 'compte' | 'neutre' — quin avís d'herència es pinta
 *   perDefecte · la llicència heretada de sèrie (només àmbit 'publicacio'), o null
 *   onDesa(valor) · desar; el pare decidix el camí (desaLocal + desaCamp)
 *   onTanca(motiu: 'esc'|'tornar'|'boto') · tornar al document sense desar
 *   esborrany  · { valor, tria, text } d'una obertura anterior, o null: es
 *                recupera només sobre el mateix valor i amb una opció que hi siga
 *   onEsborrany({ valor, tria, text }) · cada canvi de tria o de text, perquè
 *                el pare el guarde (Escape dins del text lliure no el perd)
 *   La casella de CC0 no forma part de l'esborrany: cada vegada es torna a acceptar.
 *   Opcionals (pla 261016, Bloc 3.1), per a quan la vista no és dins d'un
 *   document; sense elles, el DOM i els textos de sempre:
 *   etiquetaTornar · el botó de dalt («Tornar al document»)
 *   introduccio    · el paràgraf de davall del títol (el de sempre diu «Ara té «valor»»)
 *   llegenda       · la del grup d'opcions («Tria els drets d’esta obra»)
 *
 * Es conserven del selector vell: l'acceptació irrevocable de CC0 (mateix text i
 * mateixa casella, menys a «El compte»: ACCEPTACIO_CC0), el límit 246 + 10 =
 * 256 i el valor «text · CC0 1.0».
 * Res no canvia fins que es prem «Desar autoria»: és una decisió legal, no una
 * tecla, i la pàgina ho diu.
 *
 * D15 (ordre del Mestre, 260930) · La Creative Commons de sèrie és la primera
 * opció i «Copyright (C)» l'última, amb un text lliure (omplit amb «© autor»)
 * que sempre es desa començant per «©» i amb 256 caràcters com a màxim en
 * total. L'esborrany porta el text de l'opció triada: el de Copyright si és
 * eixa, i si no el text lliure CC0, com fins ara.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Copyright, CreativeCommons, Globe, History, PenLine } from 'lucide-react';
import { Alerta, AreaText, Boto, Camp, Casella, GrupOpcions, Insignia } from '../../PedraSeca/index.js';
import {
  LLICENCIA_PER_DEFECTE, LLICENCIES, MARCA_CC0, MAXIM_COPYRIGHT, MAXIM_TEXT_LLIURE, OPCIO_ACTUAL,
  copyrightBuit, copyrightDe, llargariaDe, llicenciaDe, maximTextCopyright, requereixCC0, reservatsDe,
  tallaTextCopyright, triaDe, valorDe,
} from './llicencies.js';

const ICONES = { reservats: Copyright, cc: CreativeCommons, domini: Globe, lliure: PenLine, actual: History };

/* La pista que l'avís de la nota donava abans a tothom, ara dita només per a
   qui és certa: una entitat tria els seus drets de sèrie a la seua fitxa. */
const PISTA_ENTITAT = 'Si publiques com a entitat, els drets de sèrie de l’entitat es trien a la seua fitxa del Perfil.';
/* Pla 261016 (Bloc 3.1; ordre del Mestre) · I la persona, els de les seues
   notes, a «El compte» (l'ajust 'drets-notes' de PerfilContext). */
const PISTA_PERSONA = 'Els drets de sèrie de les teues notes es trien a «El compte» del Perfil.';

/* L'acceptació irrevocable de CC0. La de sempre parla de l'obra que s'edita.
   Gauntlet 261016 (encàrrec E; revisió adversarial, P3) · A «El compte» no hi
   ha cap obra: es trien els drets amb què naixeran les notes noves, i això és
   el que es diu i el que s'accepta. La casella hi continua sent obligatòria
   per a desar CC0 com a valor de sèrie. */
const ACCEPTACIO_CC0 = Object.freeze({
  obra: Object.freeze({
    avis: 'En confirmar esta opció dedicaràs la teua obra al domini públic amb CC0: altres persones podran copiar-la, modificar-la i usar-la comercialment. Esta renúncia és irrevocable en la mesura permesa per la llei. El text personalitzat no afegix restriccions a CC0.',
    casella: 'Tinc els drets necessaris i accepte dedicar esta obra a CC0.',
  }),
  compte: Object.freeze({
    avis: 'En confirmar esta opció, les teues notes noves naixeran dedicades al domini públic (CC0): altres persones les podran copiar, modificar i usar comercialment. Esta renúncia és irrevocable en la mesura permesa per la llei. El text personalitzat no afegix restriccions a CC0.',
    casella: 'Tinc els drets necessaris i accepte que les meues notes noves naixquen dedicades a CC0.',
  }),
});

/** Els textos de l'avís d'herència, per àmbit. Null: sense avís. */
export function avisHerencia(ambit, perDefecte) {
  if (ambit === 'perfil') {
    return {
      titol: 'Les teues notes noves ho heretaran',
      text: 'Estos drets són els de la teua fitxa i, a partir d’ara, els de sèrie de les notes que crees amb «CREAR NOTA» des d’este dispositiu. Les notes que ja tens no canvien: cadascuna guarda els seus.',
    };
  }
  /* Pla 261016 (Bloc 3.1; ordre del Mestre) · «El compte» de la persona: la
     vista no és dins de cap nota, i el que es tria són els drets amb què
     naixeran les notes noves. Les que ja hi són no canvien. */
  if (ambit === 'compte') {
    return {
      titol: 'Les teues notes noves naixen amb estos drets',
      text: 'Estos són els drets amb què naixen les teues notes noves. Les que ja tens no canvien: cadascuna guarda els seus.',
    };
  }
  /* Directiva de Dignitat Humana (pla 261015_1900) · La fitxa d'una persona ja
     no tria drets (una persona no és una obra): l'avís no envia ningú «a la
     teua fitxa del Perfil». Diu el que és cert per a qualsevol actor, persona
     o entitat: amb què naixen les notes noves, que ací només canvia esta i
     que els de sèrie d'una entitat es trien a la fitxa de l'entitat.
     Pla 261016 (Bloc 3.1) · I on es trien els de la persona: «El compte». */
  if (ambit === 'publicacio') {
    return perDefecte ? {
      titol: 'Només canvia esta nota',
      text: `Les notes noves naixen amb els drets de sèrie «${perDefecte}». Si els canvies ací, només canvien per a esta nota: les altres guarden els seus. ${PISTA_PERSONA} ${PISTA_ENTITAT}`,
    } : {
      titol: 'Només canvia esta nota',
      text: `En este dispositiu encara no hi ha drets de sèrie: les notes noves que crees amb «CREAR NOTA» naixen amb «${LLICENCIA_PER_DEFECTE}». Ací només canvies esta nota. ${PISTA_PERSONA} ${PISTA_ENTITAT}`,
    };
  }
  return null;
}

/** Una opció del catàleg en la forma de GrupOpcions «targetes»: el nom és
    antetítol + títol; l'explicació, l'exemple i els permisos en són la descripció. */
function opcioDe(llicencia, antetitol) {
  const Icona = ICONES[llicencia.icona] || Copyright;
  return {
    valor: llicencia.id,
    antetitol,
    etiqueta: llicencia.nom,
    ajuda: (
      <>
        {llicencia.explicacio}
        {llicencia.exemple ? <span className="sdp-drets__exemple">Exemple: {llicencia.exemple}</span> : null}
      </>
    ),
    icona: <Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
    detall: llicencia.permisos.length ? (
      <>{llicencia.permisos.map((p) => <Insignia key={p.text} to={p.to}>{p.text}</Insignia>)}</>
    ) : undefined,
    className: llicencia.id === 'cc-by-nc-sa' ? 'sdp-targeta-opcio--destacada' : undefined,
  };
}

/* Poliment T39 · T47 (ordre del Mestre, 260928) · Un esborrany es recupera
   només si és del mateix valor d'ara i la seua opció existix en esta obertura
   («Mantindre» només hi és quan el valor no és cap del catàleg). Torna null
   si no hi ha res a recuperar o si és igual que el punt de partida. */
function esborranyRecuperable(esborrany, base) {
  if (!esborrany || esborrany.valor !== base.valor) return null;
  const { tria } = esborrany;
  if (!llicenciaDe(tria) || (tria === 'actual' && base.id !== 'actual')) return null;
  const text = tallaDelText(tria, esborrany.text);
  return tria === base.id && text === base.text ? null : { tria, text };
}

/* D15 · Cada opció amb text té el seu: el text lliure CC0 (246) i el de
   «Copyright (C)» (256 en total, omplit de sèrie amb «© autor»).
   F4 (revisió adversarial T1–T4, 260930) · El de «Copyright (C)» es talla al
   que es desarà sencer: 254 si no comença per «©» (la marca «© » en porta 2),
   256 si hi comença, per punts de codi. El camp mai mostra més del que es desa. */
const clauDelText = (tria) => (tria === 'reservats' ? 'reservats' : 'lliure');
const tallaDelText = (tria, text) => (tria === 'reservats'
  ? tallaTextCopyright(text)
  : String(text ?? '').slice(0, MAXIM_TEXT_LLIURE));

function textosInicials({ id, text }, recuperat, autor) {
  const textos = { lliure: '', reservats: reservatsDe(autor) };
  if (id === 'lliure' || id === 'reservats') textos[id] = text;
  if (recuperat) textos[clauDelText(recuperat.tria)] = recuperat.text;
  return textos;
}

export function CopyrightPage({
  valor: valorRebut = '', autor = '', ambit = 'neutre', perDefecte = null, esborrany = null, onEsborrany, onDesa, onTanca,
  etiquetaTornar = 'Tornar al document', introduccio = null, llegenda = 'Tria els drets d’esta obra',
}) {
  /* El valor d'ara es fixa en obrir: si canviara amb la vista oberta, l'opció
     «Mantindre» no ha d'aparéixer, desaparéixer ni desar un altre text. */
  const [inicial] = useState(() => {
    const base = { ...triaDe(valorRebut), valor: String(valorRebut ?? '') };
    return { ...base, recuperat: esborranyRecuperable(esborrany, base) };
  });
  const { valor, recuperat } = inicial;
  const [tria, setTria] = useState(recuperat?.tria ?? inicial.id);
  const [textos, setTextos] = useState(() => textosInicials(inicial, recuperat, autor));
  const [acceptat, setAcceptat] = useState(false);
  const idTitol = useId();
  const titolRef = useRef(null);

  /* En obrir, el focus va al títol: el lector anuncia on s'és. */
  useEffect(() => { titolRef.current?.focus(); }, []);

  const cc0 = requereixCC0(tria);
  const lliure = tria === 'lliure';
  const reservats = tria === 'reservats';
  const textLliure = textos.lliure.slice(0, MAXIM_TEXT_LLIURE);
  const textReservats = tallaTextCopyright(textos.reservats);
  const potDesar = !(cc0 && !acceptat) && !(lliure && !textLliure.trim()) && !(reservats && copyrightBuit(textReservats));

  const opcions = [
    ...(inicial.id === 'actual' ? [opcioDe(OPCIO_ACTUAL, valor)] : []),
    ...LLICENCIES.map((llicencia) => opcioDe(llicencia,
      llicencia.id === 'reservats' ? reservatsDe(autor)
        : llicencia.id === 'lliure' ? `El teu text${MARCA_CC0}` : llicencia.codi)),
  ];

  const informa = (canvis) => onEsborrany?.({ valor, tria, text: textos[clauDelText(tria)], ...canvis });

  const canvia = (id) => {
    setTria(id);
    setAcceptat(false);
    informa({ tria: id, text: textos[clauDelText(id)] });
  };

  const canviaText = (event) => {
    const nou = tallaDelText(tria, event.target.value);
    setTextos((abans) => ({ ...abans, [clauDelText(tria)]: nou }));
    informa({ text: nou });
  };

  const desa = () => {
    if (!potDesar) return;
    onDesa?.(valorDe(tria, { text: reservats ? textReservats : textLliure, autor, actual: valor }));
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    onTanca?.('esc');
  };

  const avis = avisHerencia(ambit, perDefecte);
  const acceptacio = ambit === 'compte' ? ACCEPTACIO_CC0.compte : ACCEPTACIO_CC0.obra;

  return (
    <section className="sdp-drets" aria-labelledby={idTitol} onKeyDown={onKeyDown}>
      <header className="sdp-drets__cap">
        <Boto varietat="fantasma" icona={ArrowLeft} onClick={() => onTanca?.('tornar')}>{etiquetaTornar}</Boto>
        <h2 id={idTitol} ref={titolRef} tabIndex={-1} className="sdp-drets__titol">Drets d’autor</h2>
        <p className="sdp-drets__intro">
          {introduccio ?? <>Tria qui pot usar esta obra i com. Ara té «{valor}». Res no canvia fins que prems «Desar autoria».</>}
        </p>
      </header>

      <div className="sdp-drets__cos">
        {recuperat ? (
          <Alerta to="info" titol="Continues on ho havies deixat">
            <p>Esta tria i este text són els que tenies en eixir, sense desar. Res no canvia fins que prems «Desar autoria».</p>
          </Alerta>
        ) : null}
        {avis ? <Alerta to="info" titol={avis.titol}><p>{avis.text}</p></Alerta> : null}

        <GrupOpcions aspecte="targetes" llegenda={llegenda} valor={tria} onCanvi={canvia}
          textTriada="Triada" opcions={opcions} />

        {lliure ? (
          <Camp etiqueta={`Text lliure (màxim ${MAXIM_COPYRIGHT} caràcters amb la marca CC0)`}
            ajuda={`Escriu l’autoria com vols que es llija. La marca «${MARCA_CC0.trim()}» s’hi afig sola.`}>
            <AreaText maxLength={MAXIM_TEXT_LLIURE} value={textLliure} onChange={canviaText} />
            <p className="sdp-camp__ajuda sdp-drets__comptador" aria-live="polite">
              {textLliure.length + MARCA_CC0.length} / {MAXIM_COPYRIGHT}
            </p>
          </Camp>
        ) : null}

        {reservats ? (
          <Camp etiqueta={`Text del copyright (màxim ${MAXIM_COPYRIGHT} caràcters)`}
            ajuda="Escriu qui té els drets com vols que es llija. Si no comença per «©», s’hi afig sol.">
            <AreaText maxLength={maximTextCopyright(textReservats)} value={textReservats} onChange={canviaText} />
            <p className="sdp-camp__ajuda sdp-drets__comptador" aria-live="polite">
              {llargariaDe(copyrightDe(textReservats))} / {MAXIM_COPYRIGHT}
            </p>
          </Camp>
        ) : null}

        {cc0 ? (
          <div className="sdp-drets__cc0">
            <p>{acceptacio.avis}</p>
            <p>
              <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">
                Llegir les condicions de CC0<span className="sdp-nomes-lector"> (s’obri en una pestanya nova)</span>
              </a>
            </p>
            <Casella etiqueta={acceptacio.casella} checked={acceptat}
              onChange={(event) => setAcceptat(event.target.checked)} />
          </div>
        ) : (
          <p className="sdp-drets__enllac">
            <a href="https://creativecommons.org/cc-licenses/" target="_blank" rel="noreferrer">
              Consultar les llicències Creative Commons<span className="sdp-nomes-lector"> (s’obri en una pestanya nova)</span>
            </a>
          </p>
        )}
      </div>

      <footer className="sdp-drets__peu">
        <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
        <Boto varietat="primari" disabled={!potDesar} onClick={desa}>Desar autoria</Boto>
      </footer>
    </section>
  );
}

export default CopyrightPage;
