/**
 * PasPerfil.jsx — pas 1 de la Facturació: les dades de l'empresa que emet.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 2 del mapa de la Gestoria, sobre el perfil fiscal del pas 1).
 * Sense dades desades, el formulari curt: NIF, nom legal i comercial,
 * domicili fiscal i data de pas, amb la validació del nucli
 * (configEmpresa.js). També es pot importar el .json de la configuració (el
 * mateix que llig el Tauler): omple el formulari i es conserva tot el que
 * porta de més (comptes, prefixos, altres domicilis). Amb dades desades, el
 * resum i «Canvia les dades»: cada desament és una versió nova i les
 * anteriors no es toquen.
 * Troballa F4 de la revisió (ordre del Mestre, 261007): quan ja hi ha factures
 * emeses amb el NIF vigent, el NIF i la data de pas són de només lectura (un
 * NIF nou amagaria les factures emeses; una data de pas avançada deixaria
 * emetre dies que facturava l'eina d'abans). Un .json d'un altre NIF es
 * refusa, i el d'este conserva la data de pas vigent. El magatzem del perfil
 * ho torna a comprovar en desar (PERFIL_FIXAT).
 */
import { useId, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Camp, CampText, GrupCamps } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { configDeFormulari, configDeJson, dataCurta, errorsDelPerfil, formulariDeConfig, formulariImportat } from './nucli/formulari.js';
import { AvisDeZona, ErrorsDelFormulari, llegixText } from './peces.jsx';

/* El domicili fiscal d'una configuració, en una línia. */
function domiciliDe(config) {
  const fiscal = config.domicilis.find((d) => d.id === config.domiciliFiscal);
  return fiscal ? `${fiscal.adreca}, ${fiscal.codiPostal} ${fiscal.poblacio}${fiscal.provincia ? ` (${fiscal.provincia})` : ''}` : '';
}

export function PasPerfil({ f }) {
  const [obert, setObert] = useState(() => !f.config);
  const [formulari, setFormulari] = useState(() => formulariDeConfig(f.config));
  const [base, setBase] = useState(() => f.config);
  const [errors, setErrors] = useState([]);
  const [importat, setImportat] = useState(null);
  const idForm = useId();
  /* La configuració vigent, quan ja és fixa: el NIF i la data de pas no canvien. */
  const fixada = f.perfilFixat ? f.config : null;

  const canvia = (camp) => (event) => setFormulari((abans) => ({ ...abans, [camp]: event.target.value }));
  const obri = () => {
    setFormulari(formulariDeConfig(f.config));
    setBase(f.config);
    setErrors([]);
    setImportat(null);
    setObert(true);
  };

  async function importa(event) {
    const fitxer = event.target.files?.[0];
    if (!fitxer) return;
    let text;
    try {
      text = await llegixText(fitxer);
    } catch {
      setErrors(['No s’ha pogut llegir el fitxer: torna a triar-lo.']);
      return;
    }
    const { config, errors: delFitxer } = configDeJson(text);
    if (delFitxer.length) {
      setErrors(delFitxer);
      return;
    }
    const importacio = formulariImportat(config, fixada);
    if (importacio.errors.length) {
      setErrors(importacio.errors);
      return;
    }
    setBase(config);
    setFormulari(importacio.formulari);
    setErrors([]);
    setImportat(fitxer.name);
  }

  async function desa(event) {
    event.preventDefault();
    const trobats = errorsDelPerfil(formulari, base, fixada);
    setErrors(trobats);
    if (trobats.length) return;
    const r = await f.desaConfig(configDeFormulari(formulari, base));
    if (r.ok) setObert(false);
  }

  if (f.config && !obert) {
    const versio = f.perfil.config;
    return (
      <>
        <dl className="sdp-gestoria-panell__dades">
          <div><dt>NIF</dt><dd>{f.config.nif}</dd></div>
          <div><dt>Nom legal</dt><dd>{f.config.nom}</dd></div>
          {f.config.nomComercial ? <div><dt>Nom comercial</dt><dd>{f.config.nomComercial}</dd></div> : null}
          <div><dt>Domicili fiscal</dt><dd>{domiciliDe(f.config)}</dd></div>
          <div><dt>Data de pas</dt><dd>{dataCurta(f.config.facturacio.dataPas)}</dd></div>
        </dl>
        <p className="sdp-gestoria-panell__nota">
          {`Versió ${versio.versio} del perfil, desada en este ordinador. Les dades no ixen d’ací.`}
        </p>
        <AvisDeZona avis={f.avis} zona="perfil" onTanca={f.tancaAvis} />
        <div className="sdp-gestoria-panell__accions">
          <Boto varietat="secundari" onClick={obri}>Canvia les dades de l’empresa</Boto>
        </div>
      </>
    );
  }

  return (
    <form id={idForm} className="sdp-gestoria-panell__bloc" noValidate onSubmit={desa}>
      <p>
        Estes dades van a cada factura com a emissor. Es guarden només en este ordinador, i cada canvi es
        guarda com una versió nova: les factures ja fetes conserven les dades del dia que es van emetre.
      </p>
      <Camp etiqueta="Importa la configuració (opcional)"
        ajuda="Si ja tens el fitxer .json de l’empresa (el mateix que llig el Tauler), tria’l i s’omplirà el formulari.">
        <CampText tipus="file" accept=".json,application/json" textBoto="Tria el fitxer" onChange={importa} />
      </Camp>
      {importat ? (
        <p className="sdp-gestoria-panell__nota">
          {`Dades carregades de «${importat}»: revisa-les i desa-les.${fixada ? ' La data de pas no canvia: ja hi ha factures emeses.' : ''}`}
        </p>
      ) : null}
      <GrupCamps llegenda="L’empresa">
        <Camp etiqueta="NIF" obligatori
          ajuda={fixada ? 'Ja hi ha factures emeses amb este NIF: no es pot canviar.' : 'El DNI, el NIE o el CIF de qui factura.'}>
          <CampText value={formulari.nif} autoComplete="off" spellCheck={false} readOnly={Boolean(fixada)} onChange={canvia('nif')} />
        </Camp>
        <Camp etiqueta="Nom legal" obligatori ajuda="La raó social, o el nom i els cognoms si eres autònom.">
          <CampText value={formulari.nom} autoComplete="organization" spellCheck={false} onChange={canvia('nom')} />
        </Camp>
        <Camp etiqueta="Nom comercial (opcional)" ajuda="El nom amb què et coneix la gent, si no és el legal.">
          <CampText value={formulari.nomComercial} spellCheck={false} onChange={canvia('nomComercial')} />
        </Camp>
      </GrupCamps>
      <GrupCamps llegenda="Domicili fiscal">
        <Camp etiqueta="Adreça" obligatori>
          <CampText value={formulari.adreca} autoComplete="street-address" spellCheck={false} onChange={canvia('adreca')} />
        </Camp>
        <Camp etiqueta="Codi postal" obligatori>
          <CampText value={formulari.codiPostal} inputMode="numeric" autoComplete="postal-code" spellCheck={false} onChange={canvia('codiPostal')} />
        </Camp>
        <Camp etiqueta="Població" obligatori>
          <CampText value={formulari.poblacio} spellCheck={false} onChange={canvia('poblacio')} />
        </Camp>
        <Camp etiqueta="Província (opcional)">
          <CampText value={formulari.provincia} spellCheck={false} onChange={canvia('provincia')} />
        </Camp>
      </GrupCamps>
      <Camp etiqueta="Data de pas" obligatori
        ajuda={fixada
          ? 'Ja hi ha factures emeses des d’este dia: la data de pas no es pot canviar.'
          : 'El primer dia que factures amb este programa. Les factures d’abans d’eixe dia les fa l’eina que feies servir.'}>
        <CampText tipus="date" value={formulari.dataPas} readOnly={Boolean(fixada)} onChange={canvia('dataPas')} />
      </Camp>
      <ErrorsDelFormulari titol="Revisa les dades de l’empresa" errors={errors} />
      <AvisDeZona avis={f.avis} zona="perfil" onTanca={f.tancaAvis} />
      <div className="sdp-gestoria-panell__accions">
        <Boto varietat="primari" tipus="submit" carregant={f.ocupat === 'perfil'}>Desa les dades de l’empresa</Boto>
        {f.config ? <Boto varietat="secundari" onClick={() => setObert(false)}>Deixa-ho com estava</Boto> : null}
      </div>
    </form>
  );
}
