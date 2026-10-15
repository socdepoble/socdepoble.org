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
 * Onada 6 (261009, front «gestoria-facturació»: emetre de veres):
 *   · la retenció d'IRPF (cap, 7 % o 15 %) a les factures amb client, i el
 *     total a pagar que en resulta;
 *   · la data de l'operació, si és d'un altre dia que la factura;
 *   · l'exempció de l'article 20 de la Llei de l'IVA, al selector de l'IVA;
 *   · la rectificativa: quines factures del llibre corregix, la causa (R1 a
 *     R4) o R5 si són tiquets, i si les substituïx senceres o només porta la
 *     diferència. El client es copia de la primera factura triada i va
 *     darrere de la tria mentre no s'escriu a mà; si el que hi ha no és el de
 *     la factura, ho diu i el deixa copiar. Les triades han de ser d'un sol
 *     client (correccions de la revisió, 261009).
 * Prompt 261014_1605, front G1 (la factura en tres preguntes, abans del 20):
 *   · «Qui factura?» · el nom legal i el NIF del perfil (pas 1), només per a
 *     llegir-los; «A qui i què?» · el client, les línies i la retenció;
 *     «Revisa i emet» · la data, el número, els totals i el botó (PODER 5);
 *     la nota de «Qui factura?» diu on es canvien: sense factures, tot al
 *     pas 1; amb el perfil fixat (f.perfilFixat), només el nom legal;
 *   · el client d'una factura anterior del llibre, en un selector que omple
 *     els camps (es poden editar) amb la mateixa còpia de la rectificativa; a
 *     la rectificativa no hi és: el client és el de la factura que corregix
 *     (PODER 2);
 *   · el tipus, la data de l'operació i la descripció, dins de «Més
 *     opcions»: la completa (F1) per defecte, i el desplegable obert si n'hi
 *     ha alguna triada, amb el resum que ho diu (PODER 4);
 *   · emesa bé, la factura s'obri sola en paper (useFacturacio) i, en
 *     tancar-la, el focus torna a «Revisa i emet la factura» (PODER 1).
 * Sense xarxa: tot passa per emissio.emet sobre el llibre d'este ordinador.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, Casella, GrupCamps, GrupOpcions, Selector } from '../../../components/PedraSeca/organismes/formulari.jsx';
import {
  OPCIONS_CAUSA, OPCIONS_IVA, OPCIONS_MODALITAT, OPCIONS_RETENCIO, OPCIONS_TIPUS, avisDelClient, clauDelClient, clientBuit, clientsDelLlibre,
  commutaRectificada, dadesDeFactura, errorsDeFactura, euros, facturaBuida, liniaBuida, mesOpcionsDe, rectificables, tipusEfectiu,
  tiquetsSubstituibles, totalsDeFactura
} from './nucli/formulari.js';
import { AvisDeZona, ErrorsDelFormulari } from './peces.jsx';

function Linia({ linia, numero, ivaInclos, diferencies, onCanvia, onLleva }) {
  const canvia = (camp) => (event) => onCanvia(camp, event.target.value);
  return (
    <GrupCamps llegenda={`Línia ${numero}`}>
      <Camp etiqueta="Concepte" obligatori>
        <CampText value={linia.concepte} spellCheck={false} onChange={canvia('concepte')} />
      </Camp>
      <Camp etiqueta="Quantitat" obligatori>
        <CampText value={linia.quantitat} inputMode="decimal" onChange={canvia('quantitat')} />
      </Camp>
      <Camp etiqueta={ivaInclos ? 'Preu per unitat, amb l’IVA' : 'Preu per unitat, sense l’IVA'} obligatori
        ajuda={diferencies ? 'En euros, amb coma per als cèntims; el que resta, en negatiu: -12,50.' : 'En euros, amb coma per als cèntims: 12,50.'}>
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
  /* PODER 4: «Més opcions» obert a mà (el toggle del <details>); obert també si n'hi ha alguna triada. */
  const [mesOpcionsObertes, setMesOpcionsObertes] = useState(false);
  /* PODER 1: les accions del formulari, per a tornar el focus a «Revisa i emet» en tancar la factura emesa. */
  const accions = useRef(null);
  const { seguentNumero } = f;
  const registres = f.tots.length;
  const tipus = tipusEfectiu(formulari, f.cadena);

  /* El número que tindria ara la factura: es torna a demanar quan canvien el tipus, la data o el llibre. */
  useEffect(() => {
    let actual = true;
    seguentNumero({ tipus, dataExpedicio: formulari.dataExpedicio }).then((r) => {
      if (actual) setNumero(r);
    });
    return () => {
      actual = false;
    };
  }, [seguentNumero, tipus, formulari.dataExpedicio, registres, refresc]);

  const lectura = useMemo(() => dadesDeFactura(formulari, f.cadena), [formulari, f.cadena]);
  const totals = useMemo(() => totalsDeFactura(lectura.dades, f.config, numero.numero ?? undefined), [lectura, f.config, numero.numero]);
  const tiquets = useMemo(() => tiquetsSubstituibles(f.cadena), [f.cadena]);
  const corregibles = useMemo(() => rectificables(f.cadena), [f.cadena]);
  const avisClient = useMemo(() => avisDelClient(formulari, f.cadena), [formulari, f.cadena]);
  const clients = useMemo(() => clientsDelLlibre(f.cadena), [f.cadena]);
  const ambClient = tipus !== 'F2' && tipus !== 'R5';
  const rectificativa = formulari.tipus === 'R';
  const mesOpcions = mesOpcionsDe(formulari);
  /* PODER 2: a la rectificativa, el client va darrere de la factura que corregix (commutaRectificada). */
  const opcionsClient = rectificativa || !clients.length ? null : [
    { valor: '', etiqueta: 'Cap: un client nou' },
    ...clients.map((c) => ({ valor: c.clau, etiqueta: c.etiqueta }))
  ];

  const posa = (camp, valor) => setFormulari((abans) => ({ ...abans, [camp]: valor }));
  /* El client escrit a mà ja no és el copiat: deixa d'anar darrere de la tria de factures a corregir. */
  const posaClient = (camp) => (event) => setFormulari((abans) => ({
    ...abans, client: { ...abans.client, [camp]: event.target.value }, clientCopiat: false
  }));
  const posaLinia = (i) => (camp, valor) => setFormulari((abans) => ({
    ...abans, linies: abans.linies.map((l, j) => (j === i ? { ...l, [camp]: valor } : l))
  }));
  const llevaLinia = (i) => () => setFormulari((abans) => ({ ...abans, linies: abans.linies.filter((_, j) => j !== i) }));
  const commutaTiquet = (clau) => setFormulari((abans) => ({
    ...abans, substituides: abans.substituides.includes(clau) ? abans.substituides.filter((c) => c !== clau) : [...abans.substituides, clau]
  }));
  /* Triar una factura a corregir: el client copiat (o buit) va darrere de la tria (commutaRectificada). */
  const triaRectificada = (clau) => setFormulari((abans) => commutaRectificada(abans, clau, f.cadena));
  const copiaClient = (client) => setFormulari((abans) => ({ ...abans, client, clientCopiat: true }));
  /* PODER 2: el client d'una factura anterior omple els camps amb la mateixa còpia; «Cap» els buida. */
  const triaClient = (event) => {
    const triat = clients.find((c) => c.clau === event.target.value);
    if (triat) copiaClient(triat.client);
    else setFormulari((abans) => ({ ...abans, client: clientBuit(), clientCopiat: false }));
  };
  /* PODER 1: on torna el focus en tancar la factura que s'ha obert sola. */
  const accioPrincipal = () => accions.current?.querySelector('button[type="submit"]') ?? null;

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
    setConfirmant({ dades: lectura.dades, numero: numero.numero, total: totals?.importTotal ?? null, liquid: totals?.retencio ? totals.liquid : null });
  }

  async function emet() {
    const { dades, numero: numSerie } = confirmant;
    const r = await f.emet({ ...dades, numSerie });
    setConfirmant(null);
    if (r.ok) {
      setFormulari(facturaBuida(formulari.dataExpedicio, formulari.tipus));
      /* PODER 1: després de tancar el diàleg, la factura emesa s'obri sola amb «Imprimeix o desa en PDF». */
      f.mostraEmesa(r.resultat, accioPrincipal);
    } else setRefresc((n) => n + 1);
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
      <h3 className="sdp-gestoria-panell__subtitol">Qui factura?</h3>
      <dl className="sdp-gestoria-panell__dades">
        <div><dt>Nom legal</dt><dd>{f.config.nom}</dd></div>
        <div><dt>NIF</dt><dd>{f.config.nif}</dd></div>
      </dl>
      {/* Prompt 261014_1605, G1: amb factures emeses el NIF ja no es canvia (PasPerfil, PERFIL_FIXAT del
          magatzem del perfil); la nota no promet el que el pas 1 no deixa fer. */}
      <p className="sdp-gestoria-panell__nota">
        {f.perfilFixat
          ? 'Són les dades de l’empresa del pas 1: el nom legal es canvia allí; el NIF ja no, perquè hi ha factures emeses.'
          : 'Són les dades de l’empresa del pas 1: es canvien allí.'}
      </p>

      <h3 className="sdp-gestoria-panell__subtitol">A qui i què?</h3>
      <details className="sdp-gestoria-panell__documents" open={mesOpcionsObertes || mesOpcions.obertes}
        onToggle={(event) => setMesOpcionsObertes(event.currentTarget.open)}>
        <summary>{mesOpcions.resum}</summary>
        <div className="sdp-gestoria-panell__bloc">
          <GrupOpcions llegenda="Quina factura fas?" valor={formulari.tipus} aspecte="targetes" textTriada="Triada"
            opcions={OPCIONS_TIPUS} onCanvi={(valor) => setFormulari((abans) => ({ ...abans, tipus: valor, substituides: [], rectificades: [] }))} />
          <Camp etiqueta="Data de l’operació (opcional)" ajuda="Només si la venda o el servei és d’un altre dia que la factura.">
            <CampText tipus="date" value={formulari.dataOperacio} onChange={(event) => posa('dataOperacio', event.target.value)} />
          </Camp>
          <Camp etiqueta="Descripció de l’operació (opcional)" ajuda="Si la deixes buida, és el concepte de la primera línia.">
            <CampText value={formulari.descripcio} spellCheck={false} onChange={(event) => posa('descripcio', event.target.value)} />
          </Camp>
        </div>
      </details>

      {rectificativa ? (
        corregibles.length ? (
          <>
            <GrupCamps llegenda="Quina factura corregix">
              {corregibles.map((opcio) => (
                <Casella key={opcio.clau} etiqueta={opcio.etiqueta} checked={formulari.rectificades.includes(opcio.clau)}
                  onChange={() => triaRectificada(opcio.clau)} />
              ))}
            </GrupCamps>
            {tipus === 'R5' ? (
              <p className="sdp-gestoria-panell__nota">Corregix tiquets: serà una rectificativa de factura simplificada (R5).</p>
            ) : (
              <Camp etiqueta="Per què la corregixes">
                <Selector value={formulari.causa} opcions={OPCIONS_CAUSA} onChange={(event) => posa('causa', event.target.value)} />
              </Camp>
            )}
            <GrupOpcions llegenda="Com la corregixes?" valor={formulari.modalitat} opcions={OPCIONS_MODALITAT}
              onCanvi={(valor) => posa('modalitat', valor)} />
          </>
        ) : <p>No hi ha cap factura al llibre que es puga rectificar.</p>
      ) : null}

      {ambClient ? (
        <GrupCamps llegenda="El client">
          {opcionsClient ? (
            <Camp etiqueta="Client d’una factura anterior (opcional)" ajuda="Tria’l i s’ompliran les seues dades, que pots canviar abans d’emetre.">
              <Selector value={clauDelClient(clients, formulari.client)} opcions={opcionsClient} onChange={triaClient} />
            </Camp>
          ) : null}
          <Camp etiqueta="NIF del client" obligatori>
            <CampText value={formulari.client.nif} autoComplete="off" spellCheck={false} onChange={posaClient('nif')} />
          </Camp>
          <Camp etiqueta="Nom o raó social" obligatori>
            <CampText value={formulari.client.nom} autoComplete="off" spellCheck={false} onChange={posaClient('nom')} />
          </Camp>
          <Camp etiqueta="Adreça" obligatori>
            <CampText value={formulari.client.adreca} autoComplete="off" spellCheck={false} onChange={posaClient('adreca')} />
          </Camp>
          <Camp etiqueta="Codi postal" obligatori>
            <CampText value={formulari.client.codiPostal} inputMode="numeric" autoComplete="off" spellCheck={false} onChange={posaClient('codiPostal')} />
          </Camp>
          <Camp etiqueta="Població" obligatori>
            <CampText value={formulari.client.poblacio} autoComplete="off" spellCheck={false} onChange={posaClient('poblacio')} />
          </Camp>
        </GrupCamps>
      ) : (
        <Casella etiqueta="Els preus ja porten l’IVA (com en un tiquet de caixa)" checked={formulari.ivaInclos}
          onChange={(event) => posa('ivaInclos', event.target.checked)} />
      )}
      {/* Davall dels camps, perquè no els moga mentre s'escriu (correcció de la revisió, 261009). */}
      {ambClient && avisClient ? (
        <Alerta to="avis" titol="Este client no és el de la factura que corregixes"
          accions={<Boto varietat="secundari" onClick={() => copiaClient(avisClient.client)}>Copia el client de la factura</Boto>}>
          <p>{avisClient.text}</p>
        </Alerta>
      ) : null}

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
        <Linia key={i} linia={linia} numero={i + 1} ivaInclos={!ambClient && formulari.ivaInclos}
          diferencies={rectificativa && formulari.modalitat === 'I'}
          onCanvia={posaLinia(i)} onLleva={formulari.linies.length > 1 ? llevaLinia(i) : null} />
      ))}
      <div className="sdp-gestoria-panell__accions-fila">
        <Boto varietat="secundari" onClick={() => posa('linies', [...formulari.linies, liniaBuida()])}>Afig una línia</Boto>
      </div>
      {ambClient ? (
        <Camp etiqueta="Retenció d’IRPF" ajuda="Si factures una activitat professional a una empresa o a un professional, et retenen una part.">
          <Selector value={formulari.retencio} opcions={OPCIONS_RETENCIO} onChange={(event) => posa('retencio', event.target.value)} />
        </Camp>
      ) : null}

      <h3 className="sdp-gestoria-panell__subtitol">Revisa i emet</h3>
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

      {totals ? (
        <dl className="sdp-gestoria-panell__dades">
          <div><dt>Base imposable</dt><dd>{euros(totals.baseTotal)}</dd></div>
          <div><dt>IVA</dt><dd>{euros(totals.quotaTotal)}</dd></div>
          <div><dt>Total</dt><dd>{euros(totals.importTotal)}</dd></div>
          {totals.retencio ? <div><dt>{`Retenció d’IRPF (${totals.retencio.percentatge} %)`}</dt><dd>{euros(-totals.retencio.import)}</dd></div> : null}
          {totals.retencio ? <div><dt>Total a pagar</dt><dd>{euros(totals.liquid)}</dd></div> : null}
        </dl>
      ) : <p className="sdp-gestoria-panell__nota">El total apareix quan la factura està completa.</p>}

      <ErrorsDelFormulari titol="Falta alguna cosa a la factura" errors={errors} />
      <AvisDeZona avis={f.avis} zona="factura" onTanca={f.tancaAvis} />
      <div className="sdp-gestoria-panell__accions" ref={accions}>
        <Boto varietat="primari" tipus="submit" carregant={f.ocupat === 'emetent'} disabled={Boolean(f.ocupat)}>Revisa i emet la factura</Boto>
      </div>

      <DialegConfirmacio obert={Boolean(confirmant)} onTanca={() => setConfirmant(null)} onConfirma={emet}
        titol={confirmant ? `Emets la factura ${confirmant.numero}?` : 'Emets la factura?'}
        descripcio="Una factura emesa entra al llibre i ja no s’esborra: si cal, es rectifica o s’anul·la."
        etiquetaConfirma="Sí, emet-la" etiquetaCancela="Encara no" carregant={f.ocupat === 'emetent'}>
        {confirmant?.total !== null && confirmant?.total !== undefined ? <p>{`Total: ${euros(confirmant.total)}.`}</p> : null}
        {confirmant?.liquid !== null && confirmant?.liquid !== undefined ? <p>{`A pagar, amb la retenció: ${euros(confirmant.liquid)}.`}</p> : null}
      </DialegConfirmacio>
    </form>
  );
}
