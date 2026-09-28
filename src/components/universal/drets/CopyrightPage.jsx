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
 *   valor      · el copyright d'ara ('© Sóc de Poble', 'CC BY 4.0', 'x · CC0 1.0'…)
 *   autor      · el nom per a «Tots els drets reservats» (© autor)
 *   ambit      · 'publicacio' | 'perfil' | 'neutre' — quin avís d'herència es pinta
 *   perDefecte · la llicència heretada de sèrie (només àmbit 'publicacio'), o null
 *   onDesa(valor) · desar; el pare decidix el camí (desaLocal + desaCamp)
 *   onTanca(motiu: 'esc'|'tornar'|'boto') · tornar al document sense desar
 *   esborrany  · { valor, tria, text } d'una obertura anterior, o null: es
 *                recupera només sobre el mateix valor i amb una opció que hi siga
 *   onEsborrany({ valor, tria, text }) · cada canvi de tria o de text, perquè
 *                el pare el guarde (Escape dins del text lliure no el perd)
 *   La casella de CC0 no forma part de l'esborrany: cada vegada es torna a acceptar.
 *
 * Es conserven del selector vell: l'acceptació irrevocable de CC0 (mateix text i
 * mateixa casella), el límit 246 + 10 = 256 i el valor «text · CC0 1.0».
 * Res no canvia fins que es prem «Desar autoria»: és una decisió legal, no una
 * tecla, i la pàgina ho diu.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Copyright, CreativeCommons, Globe, History, PenLine } from 'lucide-react';
import { Alerta, AreaText, Boto, Camp, Casella, GrupOpcions, Insignia } from '../../PedraSeca/index.js';
import {
  LLICENCIES, MARCA_CC0, MAXIM_COPYRIGHT, MAXIM_TEXT_LLIURE, OPCIO_ACTUAL,
  llicenciaDe, requereixCC0, reservatsDe, triaDe, valorDe,
} from './llicencies.js';

const ICONES = { reservats: Copyright, cc: CreativeCommons, domini: Globe, lliure: PenLine, actual: History };

/** Els textos de l'avís d'herència, per àmbit. Null: sense avís. */
export function avisHerencia(ambit, perDefecte) {
  if (ambit === 'perfil') {
    return {
      titol: 'Les teues notes noves ho heretaran',
      text: 'Estos drets són els de la teua fitxa i, a partir d’ara, els de sèrie de les notes que crees amb «CREAR NOTA» des d’este dispositiu. Les notes que ja tens no canvien: cadascuna guarda els seus.',
    };
  }
  if (ambit === 'publicacio') {
    return perDefecte ? {
      titol: 'Només canvia esta nota',
      text: `Els drets de sèrie del teu Perfil són «${perDefecte}»: són els que porten les notes noves. Si els canvies ací, només canvien per a esta nota. Per a les futures, canvia’ls a la teua fitxa del Perfil.`,
    } : {
      titol: 'Només canvia esta nota',
      text: 'En este dispositiu encara no hi ha drets de sèrie del teu Perfil. Si els tries a la teua fitxa, les notes noves que crees amb «CREAR NOTA» els portaran; mentrestant es mostren amb «© Sóc de Poble». Ací només canvies esta nota.',
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
  const text = String(esborrany.text ?? '').slice(0, MAXIM_TEXT_LLIURE);
  return tria === base.id && text === base.text ? null : { tria, text };
}

export function CopyrightPage({
  valor: valorRebut = '', autor = '', ambit = 'neutre', perDefecte = null, esborrany = null, onEsborrany, onDesa, onTanca,
}) {
  /* El valor d'ara es fixa en obrir: si canviara amb la vista oberta, l'opció
     «Mantindre» no ha d'aparéixer, desaparéixer ni desar un altre text. */
  const [inicial] = useState(() => {
    const base = { ...triaDe(valorRebut, autor), valor: String(valorRebut ?? '') };
    return { ...base, recuperat: esborranyRecuperable(esborrany, base) };
  });
  const { valor, recuperat } = inicial;
  const [tria, setTria] = useState(recuperat?.tria ?? inicial.id);
  const [text, setText] = useState(recuperat?.text ?? inicial.text);
  const [acceptat, setAcceptat] = useState(false);
  const idTitol = useId();
  const titolRef = useRef(null);

  /* En obrir, el focus va al títol: el lector anuncia on s'és. */
  useEffect(() => { titolRef.current?.focus(); }, []);

  const cc0 = requereixCC0(tria);
  const lliure = tria === 'lliure';
  const textLliure = text.slice(0, MAXIM_TEXT_LLIURE);
  const potDesar = !(cc0 && !acceptat) && !(lliure && !textLliure.trim());

  const opcions = [
    ...(inicial.id === 'actual' ? [opcioDe(OPCIO_ACTUAL, valor)] : []),
    ...LLICENCIES.map((llicencia) => opcioDe(llicencia,
      llicencia.id === 'reservats' ? reservatsDe(autor)
        : llicencia.id === 'lliure' ? `El teu text${MARCA_CC0}` : llicencia.codi)),
  ];

  const informa = (canvis) => onEsborrany?.({ valor, tria, text, ...canvis });

  const canvia = (id) => {
    setTria(id);
    setAcceptat(false);
    informa({ tria: id });
  };

  const canviaText = (event) => {
    const nou = event.target.value.slice(0, MAXIM_TEXT_LLIURE);
    setText(nou);
    informa({ text: nou });
  };

  const desa = () => {
    if (!potDesar) return;
    onDesa?.(valorDe(tria, { text: textLliure, autor, actual: valor }));
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    onTanca?.('esc');
  };

  const avis = avisHerencia(ambit, perDefecte);

  return (
    <section className="sdp-drets" aria-labelledby={idTitol} onKeyDown={onKeyDown}>
      <header className="sdp-drets__cap">
        <Boto varietat="fantasma" icona={ArrowLeft} onClick={() => onTanca?.('tornar')}>Tornar al document</Boto>
        <h2 id={idTitol} ref={titolRef} tabIndex={-1} className="sdp-drets__titol">Drets d’autor</h2>
        <p className="sdp-drets__intro">
          Tria qui pot usar esta obra i com. Ara té «{valor}». Res no canvia fins que prems «Desar autoria».
        </p>
      </header>

      <div className="sdp-drets__cos">
        {recuperat ? (
          <Alerta to="info" titol="Continues on ho havies deixat">
            <p>Esta tria i este text són els que tenies en eixir, sense desar. Res no canvia fins que prems «Desar autoria».</p>
          </Alerta>
        ) : null}
        {avis ? <Alerta to="info" titol={avis.titol}><p>{avis.text}</p></Alerta> : null}

        <GrupOpcions aspecte="targetes" llegenda="Tria els drets d’esta obra" valor={tria} onCanvi={canvia}
          textTriada="Triada" opcions={opcions} />

        {lliure ? (
          <Camp etiqueta={`Text lliure (màxim ${MAXIM_COPYRIGHT} caràcters amb la marca CC0)`}
            ajuda={`Escriu l’autoria com vols que es llija. La marca «${MARCA_CC0.trim()}» s’hi afig sola.`}>
            <AreaText maxLength={MAXIM_TEXT_LLIURE} value={textLliure} onChange={canviaText} />
            <p className="sdp-camp__ajuda sdp-drets__comptador" aria-live="polite">
              {Math.min(text.length, MAXIM_TEXT_LLIURE) + MARCA_CC0.length} / {MAXIM_COPYRIGHT}
            </p>
          </Camp>
        ) : null}

        {cc0 ? (
          <div className="sdp-drets__cc0">
            <p>En confirmar esta opció dedicaràs la teua obra al domini públic amb CC0: altres persones podran copiar-la, modificar-la i usar-la comercialment. Esta renúncia és irrevocable en la mesura permesa per la llei. El text personalitzat no afegix restriccions a CC0.</p>
            <p>
              <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">
                Llegir les condicions de CC0<span className="sdp-nomes-lector"> (s’obri en una pestanya nova)</span>
              </a>
            </p>
            <Casella etiqueta="Tinc els drets necessaris i accepte dedicar esta obra a CC0." checked={acceptat}
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
