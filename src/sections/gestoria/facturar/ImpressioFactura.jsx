/**
 * ImpressioFactura.jsx — la factura emesa en paper: la vista prèvia i la còpia per a imprimir.
 *
 * Onada 6 (261009, front «gestoria-facturació»: «emetre factures des de Sóc
 * de Poble [...] i estar preparada per a la nova llei VeriFactu»). Des del
 * llibre (pas 4), cada factura es mostra com un full: el model és el
 * d'impressio.js (les mencions de la factura completa, la simplificada i la
 * rectificativa) i el QR de cotejo es dibuixa amb qrDibuix.js.
 *   · Imprimir és window.print() del mateix document: res s'obri en una
 *     finestra nova (privacitat.test.js veta window.open fora de l'enviament)
 *     i res ix d'este ordinador. «Desa en PDF» és el diàleg d'impressió del
 *     sistema.
 *   · El full es pinta a la pantalla, dins del pas 4, i se'n fa una còpia
 *     (cloneNode del mateix full, refeta cada vegada que canvia) penjada del
 *     <body>, que només es veu en imprimir: sense react-dom, que la guarda de
 *     privacitat no admet a la Gestoria. Mentre la vista és oberta, l'<html>
 *     porta sdp-gestoria-imprimint i la regla @media print del bloc de la
 *     Gestoria (modules.css) amaga la resta del document: així no s'imprimix
 *     la closca ni es talla el full per l'scroll del visor. En tancar-la, la
 *     còpia i la classe se'n van.
 *   · El paper no canvia amb el tema: tinta i paper són els dos tokens de la
 *     roca, que no s'inverteixen (com VistaPreviaFull.jsx).
 *   · «La menció VERI*FACTU» és un interruptor apagat i desactivat, amb el
 *     perquè: només es pot posar quan el programa envie els registres a
 *     l'AEAT, i encara no ho fa. El QR sí que hi va (es pot llevar) i,
 *     davall de la seua adreça, el paper diu que la seu de l'AEAT encara no
 *     hi trobarà la factura (correcció de la revisió, 261009: l'avís ha
 *     d'arribar a qui la rep, no només a la pantalla de qui l'emet).
 *   · La còpia porta `hidden`: si el full de la Gestoria no arriba al <body>
 *     del document (l'encastament carrega els estils dins de la seua ombra),
 *     la còpia no es veu mai a la pàgina de l'amfitrió.
 * Prompt 261014_1605, front G1 · PODER 3: davall del títol, «Imprimeix o desa
 * en PDF» i «Tanca la factura»; els dos interruptors (el QR, encés, i la
 * menció VERI*FACTU, apagada) i la seua nota van dins d'un desplegable de
 * detalls tècnics, tancat d'entrada. El paper no canvia: el QR hi continua.
 * Proves: `imprimix` s'injecta (jsdom no imprimix).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Interruptor } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { RETOL_QR, modelDeFactura } from './nucli/impressio.js';

/** La classe de l'<html> mentre hi ha una factura per imprimir. */
export const CLASSE_IMPRIMINT = 'sdp-gestoria-imprimint';

function imprimixPerDefecte() {
  window.print();
}

/* Nom, NIF i domicili d'una part de la factura. */
function Part({ titol, persona }) {
  return (
    <div className="sdp-gestoria-factura__part">
      <p className="sdp-gestoria-factura__etiqueta">{titol}</p>
      <p className="sdp-gestoria-factura__nom">{persona.nom}</p>
      {persona.nomComercial ? <p>{persona.nomComercial}</p> : null}
      <p>{`NIF ${persona.nif}`}</p>
      {persona.domicili.map((linia) => <p key={linia}>{linia}</p>)}
    </div>
  );
}

/* El full de la factura: el mateix a la pantalla i en paper (la còpia per a imprimir en clona el node). */
function FullFactura({ model, refFull }) {
  const { qr } = model;
  return (
    <article ref={refFull} className="sdp-gestoria-factura__full" aria-label={`${model.titol} ${model.numero}`}>
      <header className="sdp-gestoria-factura__cap">
        {qr ? (
          <figure className="sdp-gestoria-factura__qr">
            <figcaption className="sdp-gestoria-factura__etiqueta">{RETOL_QR}</figcaption>
            <svg className="sdp-gestoria-factura__qr-dibuix" viewBox={`0 0 ${qr.costat} ${qr.costat}`} shapeRendering="crispEdges"
              role="img" aria-label="Codi QR de cotejo de la factura a l’AEAT">
              <rect className="sdp-gestoria-factura__qr-paper" width={qr.costat} height={qr.costat} />
              <path className="sdp-gestoria-factura__qr-tinta" d={qr.d} />
            </svg>
          </figure>
        ) : null}
        <div className="sdp-gestoria-factura__identitat">
          <p className="sdp-gestoria-factura__titol">{model.titol}</p>
          <dl className="sdp-gestoria-factura__claus">
            <div><dt>Número</dt><dd>{model.numero}</dd></div>
            <div><dt>Data d’expedició</dt><dd>{model.dataExpedicio}</dd></div>
            {model.dataOperacio ? <div><dt>Data de l’operació</dt><dd>{model.dataOperacio}</dd></div> : null}
            {model.venciment ? <div><dt>Venciment</dt><dd>{model.venciment}</dd></div> : null}
          </dl>
          {model.anulada ? <p className="sdp-gestoria-factura__anulada">Anul·lada: el llibre en guarda el registre d’anul·lació.</p> : null}
        </div>
      </header>

      <div className="sdp-gestoria-factura__parts">
        <Part titol="Emissor" persona={model.emissor} />
        {model.destinatari ? <Part titol="Client" persona={model.destinatari} /> : null}
      </div>
      {model.referencies.length ? (
        <ul className="sdp-gestoria-factura__mencions">
          {model.referencies.map((text) => <li key={text}>{text}</li>)}
        </ul>
      ) : null}
      <p>{`Descripció de l’operació: ${model.descripcio}`}</p>

      <table className="sdp-gestoria-factura__taula">
        <thead>
          <tr>
            <th scope="col">Concepte</th>
            <th scope="col" data-tipus="xifra">Quantitat</th>
            <th scope="col" data-tipus="xifra">{model.ivaInclos ? 'Preu amb IVA' : 'Preu unitari'}</th>
            <th scope="col" data-tipus="xifra">IVA</th>
            <th scope="col" data-tipus="xifra">{model.ivaInclos ? 'Import amb IVA' : 'Import'}</th>
          </tr>
        </thead>
        <tbody>
          {model.linies.map((linia, i) => (
            <tr key={`${i}-${linia.concepte}`}>
              <td>
                {linia.concepte}
                {linia.detall ? <span className="sdp-gestoria-factura__detall">{linia.detall}</span> : null}
              </td>
              <td data-tipus="xifra">{linia.quantitat}</td>
              <td data-tipus="xifra">{linia.preu}</td>
              <td data-tipus="xifra">{linia.iva}</td>
              <td data-tipus="xifra">{linia.import}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="sdp-gestoria-factura__taula">
        <thead>
          <tr>
            <th scope="col">Tipus d’IVA</th>
            <th scope="col" data-tipus="xifra">Base imposable</th>
            <th scope="col" data-tipus="xifra">Quota</th>
          </tr>
        </thead>
        <tbody>
          {model.desglossament.map((grup) => (
            <tr key={grup.tipus}>
              <td>{grup.tipus}</td>
              <td data-tipus="xifra">{grup.base}</td>
              <td data-tipus="xifra">{grup.quota}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="sdp-gestoria-factura__totals">
        {model.totals.map((total) => (
          <div key={total.etiqueta} data-principal={total.principal ? 'true' : 'false'}>
            <dt>{total.etiqueta}</dt>
            <dd>{total.valor}</dd>
          </div>
        ))}
      </dl>
      {model.mencions.length ? (
        <ul className="sdp-gestoria-factura__mencions">
          {model.mencions.map((text) => <li key={text}>{text}</li>)}
        </ul>
      ) : null}
      {qr ? <p className="sdp-gestoria-factura__url">{qr.url}</p> : null}
      {qr?.avis ? <p className="sdp-gestoria-factura__avis-qr">{qr.avis}</p> : null}
    </article>
  );
}

/**
 * La factura d'un registre d'alta, amb els seus controls.
 * @param {{ registre: object, anulada?: boolean, onTanca: () => void, imprimix?: () => void }} props
 */
export function ImpressioFactura({ registre, anulada = false, onTanca, imprimix = imprimixPerDefecte }) {
  const [ambQr, setAmbQr] = useState(true);
  const idTitol = useId();
  const titol = useRef(null);
  const full = useRef(null);
  const copia = useRef(null);
  const lectura = useMemo(() => {
    try {
      return { model: modelDeFactura(registre, { anulada, ambQr }), error: null };
    } catch (error) {
      return { model: null, error };
    }
  }, [registre, anulada, ambQr]);

  /* Mentre la vista és oberta, imprimir el document és imprimir esta factura: la còpia penja del <body>
     i l'<html> porta la classe. En obrir-la, el focus va al seu títol. */
  useEffect(() => {
    const arrel = document.documentElement;
    const node = document.createElement('div');
    node.className = 'sdp-gestoria-factura-impresa';
    node.setAttribute('aria-hidden', 'true');
    /* La còpia porta el NIF i l'adreça i viu fora del contenidor de l'app: tampoc es traduïx. */
    node.setAttribute('translate', 'no');
    node.hidden = true;
    document.body.append(node);
    copia.current = node;
    arrel.classList.add(CLASSE_IMPRIMINT);
    titol.current?.focus();
    return () => {
      node.remove();
      copia.current = null;
      arrel.classList.remove(CLASSE_IMPRIMINT);
    };
  }, []);

  /* La còpia es refà, del full que es veu, cada vegada que canvia (amb QR o sense). */
  useEffect(() => {
    copia.current?.replaceChildren(...(full.current ? [full.current.cloneNode(true)] : []));
  }, [lectura]);

  return (
    <section className="sdp-gestoria-factura" aria-labelledby={idTitol}>
      <div className="sdp-gestoria-factura__barra">
        <h3 id={idTitol} ref={titol} tabIndex={-1} className="sdp-gestoria-panell__subtitol">{`La factura ${registre.numSerie}`}</h3>
        <div className="sdp-gestoria-panell__accions">
          <Boto varietat="primari" icona={Printer} onClick={imprimix} disabled={!lectura.model}>Imprimeix o desa en PDF</Boto>
          <Boto varietat="secundari" onClick={onTanca}>Tanca la factura</Boto>
        </div>
        <details className="sdp-gestoria-panell__documents">
          <summary>Detalls tècnics: el QR i la menció VERI*FACTU</summary>
          <div className="sdp-gestoria-panell__bloc">
            <Interruptor etiqueta="El QR tributari a la factura" actiu={ambQr} onCanvi={setAmbQr} />
            <Interruptor etiqueta="La menció «VERI*FACTU»" actiu={false} desactivat />
            <p className="sdp-gestoria-panell__nota">
              La menció «VERI*FACTU» només es podrà posar quan el programa envie cada registre a l’AEAT, i encara no ho fa.
              Mentrestant, si algú llig el QR, la seu de l’AEAT no hi trobarà esta factura: el full ho diu davall de l’adreça del QR.
            </p>
          </div>
        </details>
      </div>
      {lectura.model ? <FullFactura model={lectura.model} refFull={full} /> : (
        <Alerta to="error" viva={false} titol="Esta factura no es pot mostrar">
          <p>{lectura.error?.message ?? 'El registre no porta una factura que es puga imprimir.'}</p>
        </Alerta>
      )}
    </section>
  );
}
