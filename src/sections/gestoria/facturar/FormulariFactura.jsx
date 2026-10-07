/**
 * FormulariFactura.jsx — pas 3 de la Facturació: una factura nova.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 2 del mapa de la Gestoria). El formulari de la gent que
 * factura, no del ram:
 *   · el tipus en llenguatge planer: completa (F1), simplificada o tiquet
 *     (F2, amb «els preus ja porten l'IVA») i completa en lloc de tiquets
 *     (F3, que tria quins tiquets del llibre substituïx);
 *   · el client (no a la simplificada), les línies amb el seu IVA i, mentre
 *     s'escriu, el total que calcularà el nucli;
 *   · el número que tindrà la factura (seguentNumero) es mostra abans i
 *     viatja amb l'emissió: si entremig se n'ha emés un altre, el nucli el
 *     refusa i se'n mostra el nou;
 *   · abans d'emetre, la confirmació: una factura emesa no s'esborra (es
 *     rectifica o s'anul·la), i això es diu.
 * Sense xarxa: tot passa per emissio.emet sobre el llibre d'este ordinador.
 */
import { useEffect, useMemo, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, Casella, GrupCamps, GrupOpcions, Selector } from '../../../components/PedraSeca/organismes/formulari.jsx';
import {
  OPCIONS_IVA, OPCIONS_TIPUS, dadesDeFactura, errorsDeFactura, euros, facturaBuida, liniaBuida, tiquetsSubstituibles, totalsDeFactura
} from './nucli/formulari.js';
import { AvisDeZona, ErrorsDelFormulari } from './peces.jsx';

function Linia({ linia, numero, ivaInclos, onCanvia, onLleva }) {
  const canvia = (camp) => (event) => onCanvia(camp, event.target.value);
  return (
    <GrupCamps llegenda={`Línia ${numero}`}>
      <Camp etiqueta="Concepte" obligatori>
        <CampText value={linia.concepte} onChange={canvia('concepte')} />
      </Camp>
      <Camp etiqueta="Quantitat" obligatori>
        <CampText value={linia.quantitat} inputMode="decimal" onChange={canvia('quantitat')} />
      </Camp>
      <Camp etiqueta={ivaInclos ? 'Preu per unitat, amb l’IVA' : 'Preu per unitat, sense l’IVA'} obligatori ajuda="En euros, amb coma per als cèntims: 12,50.">
        <CampText value={linia.preu} inputMode="decimal" onChange={canvia('preu')} />
      </Camp>
      <Camp etiqueta="IVA">
        <Selector value={linia.tipusIva} opcions={OPCIONS_IVA} onChange={canvia('tipusIva')} />
      </Camp>
      {onLleva ? <Boto varietat="fantasma" onClick={onLleva}>{`Lleva la línia ${numero}`}</Boto> : null}
    </GrupCamps>
  );
}

export function FormulariFactura({ f }) {
  const [formulari, setFormulari] = useState(() => facturaBuida(f.dataDeHui()));
  const [numero, setNumero] = useState({ numero: null, error: null });
  const [errors, setErrors] = useState([]);
  const [confirmant, setConfirmant] = useState(null);
  const [refresc, setRefresc] = useState(0);
  const { seguentNumero } = f;
  const registres = f.tots.length;

  /* El número que tindria ara la factura: es torna a demanar quan canvien el tipus, la data o el llibre. */
  useEffect(() => {
    let actual = true;
    seguentNumero({ tipus: formulari.tipus, dataExpedicio: formulari.dataExpedicio }).then((r) => {
      if (actual) setNumero(r);
    });
    return () => {
      actual = false;
    };
  }, [seguentNumero, formulari.tipus, formulari.dataExpedicio, registres, refresc]);

  const lectura = useMemo(() => dadesDeFactura(formulari), [formulari]);
  const totals = useMemo(() => totalsDeFactura(lectura.dades, f.config, numero.numero ?? undefined), [lectura, f.config, numero.numero]);
  const tiquets = useMemo(() => tiquetsSubstituibles(f.cadena), [f.cadena]);
  const ambClient = formulari.tipus !== 'F2';

  const posa = (camp, valor) => setFormulari((abans) => ({ ...abans, [camp]: valor }));
  const posaClient = (camp) => (event) => setFormulari((abans) => ({ ...abans, client: { ...abans.client, [camp]: event.target.value } }));
  const posaLinia = (i) => (camp, valor) => setFormulari((abans) => ({
    ...abans, linies: abans.linies.map((l, j) => (j === i ? { ...l, [camp]: valor } : l))
  }));
  const llevaLinia = (i) => () => setFormulari((abans) => ({ ...abans, linies: abans.linies.filter((_, j) => j !== i) }));
  const commutaTiquet = (clau) => setFormulari((abans) => ({
    ...abans, substituides: abans.substituides.includes(clau) ? abans.substituides.filter((c) => c !== clau) : [...abans.substituides, clau]
  }));

  function revisa(event) {
    event.preventDefault();
    if (!lectura.dades) {
      setErrors(lectura.errors);
      return;
    }
    if (!numero.numero) {
      setErrors([numero.error?.message ?? 'Encara no se sap quin número tindrà: espera un moment i torna-ho a provar.']);
      return;
    }
    const delNucli = errorsDeFactura(lectura.dades, f.config, numero.numero);
    setErrors(delNucli);
    if (delNucli.length) return;
    setConfirmant({ dades: lectura.dades, numero: numero.numero, total: totals?.importTotal ?? null });
  }

  async function emet() {
    const { dades, numero: numSerie } = confirmant;
    const r = await f.emet({ ...dades, numSerie });
    setConfirmant(null);
    if (r.ok) setFormulari(facturaBuida(formulari.dataExpedicio, formulari.tipus));
    else setRefresc((n) => n + 1);
  }

  /* Troballa F3 (261007): sobre un llibre amb incidències, el número següent podria repetir el d'una
     factura perduda i la còpia bona ja no es podria restaurar. Primer s'arregla el llibre. */
  if (f.bloquejatPerCadena) {
    return (
      <Alerta to="error" viva={false} titol="Ara no es pot emetre cap factura">
        <p>
          La cadena del llibre té incidències (pas 4). Si tens una còpia bona del llibre, restaura-la al pas 5:
          quan la cadena torne a ser correcta, podràs tornar a emetre.
        </p>
      </Alerta>
    );
  }
  if (!f.potEmetre) {
    return f.errorEmissio
      ? <ErrorsDelFormulari titol="Amb estes dades no es pot emetre" errors={[f.errorEmissio.message]} />
      : <p>Per a emetre factures, primer cal desar les dades de l’empresa (pas 1) i les factures d’abans (pas 2).</p>;
  }

  return (
    <form className="sdp-gestoria-panell__bloc" noValidate onSubmit={revisa}>
      <GrupOpcions llegenda="Quina factura fas?" valor={formulari.tipus} aspecte="targetes" textTriada="Triada"
        opcions={OPCIONS_TIPUS} onCanvi={(valor) => setFormulari((abans) => ({ ...abans, tipus: valor, substituides: [] }))} />
      <Camp etiqueta="Data de la factura" obligatori ajuda="Com a molt, la d’avui.">
        <CampText tipus="date" value={formulari.dataExpedicio} min={f.config.facturacio.dataPas} max={f.dataDeHui()}
          onChange={(event) => posa('dataExpedicio', event.target.value)} />
      </Camp>
      <dl className="sdp-gestoria-panell__dades">
        <div>
          <dt>Número que tindrà</dt>
          <dd aria-live="polite">{numero.numero ?? (numero.error ? 'No se’n pot donar cap' : 'Calculant…')}</dd>
        </div>
      </dl>
      {numero.error ? <ErrorsDelFormulari titol="Amb esta data no es pot emetre" errors={[numero.error.message]} /> : null}

      {ambClient ? (
        <GrupCamps llegenda="El client">
          <Camp etiqueta="NIF del client" obligatori>
            <CampText value={formulari.client.nif} autoComplete="off" onChange={posaClient('nif')} />
          </Camp>
          <Camp etiqueta="Nom o raó social" obligatori>
            <CampText value={formulari.client.nom} autoComplete="off" onChange={posaClient('nom')} />
          </Camp>
          <Camp etiqueta="Adreça" obligatori>
            <CampText value={formulari.client.adreca} autoComplete="off" onChange={posaClient('adreca')} />
          </Camp>
          <Camp etiqueta="Codi postal" obligatori>
            <CampText value={formulari.client.codiPostal} inputMode="numeric" autoComplete="off" onChange={posaClient('codiPostal')} />
          </Camp>
          <Camp etiqueta="Població" obligatori>
            <CampText value={formulari.client.poblacio} autoComplete="off" onChange={posaClient('poblacio')} />
          </Camp>
        </GrupCamps>
      ) : (
        <Casella etiqueta="Els preus ja porten l’IVA (com en un tiquet de caixa)" checked={formulari.ivaInclos}
          onChange={(event) => posa('ivaInclos', event.target.checked)} />
      )}

      {formulari.tipus === 'F3' ? (
        tiquets.length ? (
          <GrupCamps llegenda="Quins tiquets substituïx">
            {tiquets.map((t) => (
              <Casella key={t.clau} etiqueta={t.etiqueta} checked={formulari.substituides.includes(t.clau)} onChange={() => commutaTiquet(t.clau)} />
            ))}
          </GrupCamps>
        ) : <p>No hi ha cap tiquet al llibre que es puga substituir.</p>
      ) : null}

      {formulari.linies.map((linia, i) => (
        <Linia key={i} linia={linia} numero={i + 1} ivaInclos={formulari.tipus === 'F2' && formulari.ivaInclos}
          onCanvia={posaLinia(i)} onLleva={formulari.linies.length > 1 ? llevaLinia(i) : null} />
      ))}
      <div className="sdp-gestoria-panell__accions-fila">
        <Boto varietat="secundari" onClick={() => posa('linies', [...formulari.linies, liniaBuida()])}>Afig una línia</Boto>
      </div>
      <Camp etiqueta="Descripció de l’operació (opcional)" ajuda="Si la deixes buida, és el concepte de la primera línia.">
        <CampText value={formulari.descripcio} onChange={(event) => posa('descripcio', event.target.value)} />
      </Camp>

      {totals ? (
        <dl className="sdp-gestoria-panell__dades">
          <div><dt>Base imposable</dt><dd>{euros(totals.baseTotal)}</dd></div>
          <div><dt>IVA</dt><dd>{euros(totals.quotaTotal)}</dd></div>
          <div><dt>Total</dt><dd>{euros(totals.importTotal)}</dd></div>
        </dl>
      ) : <p className="sdp-gestoria-panell__nota">El total apareix quan la factura està completa.</p>}

      <ErrorsDelFormulari titol="Falta alguna cosa a la factura" errors={errors} />
      <AvisDeZona avis={f.avis} zona="factura" onTanca={f.tancaAvis} />
      <div className="sdp-gestoria-panell__accions">
        <Boto varietat="primari" tipus="submit" carregant={f.ocupat === 'emetent'} disabled={Boolean(f.ocupat)}>Revisa i emet la factura</Boto>
      </div>

      <DialegConfirmacio obert={Boolean(confirmant)} onTanca={() => setConfirmant(null)} onConfirma={emet}
        titol={confirmant ? `Emets la factura ${confirmant.numero}?` : 'Emets la factura?'}
        descripcio="Una factura emesa entra al llibre i ja no s’esborra: si cal, es rectifica o s’anul·la."
        etiquetaConfirma="Sí, emet-la" etiquetaCancela="Encara no" carregant={f.ocupat === 'emetent'}>
        {confirmant?.total !== null && confirmant?.total !== undefined ? <p>{`Total: ${euros(confirmant.total)}.`}</p> : null}
      </DialegConfirmacio>
    </form>
  );
}
