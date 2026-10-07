/**
 * CopiaLlibre.jsx — pas 5 de la Facturació: la còpia obligatòria del llibre.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 3 del mapa de la Gestoria, buit G9). El llibre viu al
 * navegador, que el pot esborrar: la còpia fora del navegador és l'única
 * manera de no perdre'l. Dos camins per a fer-la, segons el navegador:
 *   · desar-la en una carpeta que tria la persona (Chrome i Edge; el patró de
 *     fontNavegador, que no sobreescriu mai);
 *   · descarregar-la (tots).
 * Cada còpia deixa la seua marca al perfil fiscal: la pantalla diu quan es
 * va fer l'última i quants registres s'han fet des d'aleshores, i la
 * verificació de la cadena la fa servir per a detectar un llibre truncat.
 * Restaurar una còpia la verifica sencera abans de tocar res i només hi afig
 * el que falta (restauraCopia). Amb la cadena amb incidències, la còpia que es
 * fa porta «incidencia» al nom i no deixa marca (troballa F2, 261007).
 */
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { dataHoraAmbHus } from '../facturacio/registre/empremta.js';
import { ACCEPTA_COPIA, registresSenseCopia } from './nucli/copia.js';
import { dataCurta } from './nucli/formulari.js';
import { AvisDeZona, llegixText } from './peces.jsx';

/** L'estat de la còpia per a la insígnia del pas: { to, text }. */
export function insigniaDeLaCopia(f) {
  /* Troballa F2 (261007): amb la cadena amb incidències, cap còpia d'ara és bona; mai «Al dia». */
  if (f.informe && !f.informe.valida) return { to: 'error', text: 'Llibre amb incidències' };
  if (!f.perfil.copia) return { to: 'avis', text: 'Sense còpia' };
  const pendents = f.config ? registresSenseCopia(f.cadena, f.perfil.copia, f.config.nif) : 0;
  return pendents ? { to: 'avis', text: 'Còpia antiga' } : { to: 'exit', text: 'Al dia' };
}

export function CopiaLlibre({ f }) {
  const copia = f.perfil.copia;
  const pendents = f.config ? registresSenseCopia(f.cadena, copia, f.config.nif) : 0;
  const quan = copia ? dataHoraAmbHus(copia.instant) : null;
  const ocupat = Boolean(f.ocupat);

  async function restaura(event) {
    const fitxer = event.target.files?.[0];
    if (!fitxer) return;
    let text;
    try {
      text = await llegixText(fitxer);
    } catch {
      text = '';
    }
    await f.restaura(text);
  }

  return (
    <>
      <p>
        El llibre viu en este navegador, que el pot esborrar si es netegen les dades del lloc. Fes-ne còpia cada
        dia que factures i guarda-la també fora d’este ordinador: un llapis USB o la carpeta de la gestoria.
      </p>
      {copia ? (
        <p>{`L’última còpia és «${copia.dades.nomFitxer ?? 'sense nom'}», del ${dataCurta(quan.slice(0, 10))} a les ${quan.slice(11, 16)}.`}</p>
      ) : (
        <Alerta to="avis" viva={false} titol="Encara no hi ha cap còpia del llibre">
          Fes-ne una ara: sense còpia, si el navegador esborra les dades, el llibre es perd.
        </Alerta>
      )}
      {f.informe && !f.informe.valida ? (
        <Alerta to="error" viva={false} titol="El llibre té incidències">
          Si tens una còpia bona del llibre, restaura-la ací baix. Una còpia feta ara porta «incidencia» al nom: serveix
          per a la gestoria, però no substituïx l’última còpia bona.
        </Alerta>
      ) : null}
      {copia && pendents ? (
        <Alerta to="avis" viva={false} titol="Hi ha registres sense còpia">
          {`Des de l’última còpia s’han fet ${pendents === 1 ? 'un registre' : `${pendents} registres`}: fes-ne una altra.`}
        </Alerta>
      ) : null}
      <div className="sdp-gestoria-panell__accions">
        {f.potTriarCarpeta ? (
          <Boto varietat="primari" disabled={ocupat} carregant={f.ocupat === 'exportant'} onClick={() => f.exporta('carpeta')}>
            Desa la còpia en una carpeta
          </Boto>
        ) : null}
        <Boto varietat={f.potTriarCarpeta ? 'secundari' : 'primari'} disabled={ocupat} onClick={() => f.exporta('descarrega')}>
          Descarrega la còpia
        </Boto>
      </div>
      <AvisDeZona avis={f.avis} zona="copia" onTanca={f.tancaAvis} />
      <Camp etiqueta="Restaura una còpia"
        ajuda="Tria un fitxer de còpia del llibre (.json). Abans de tocar res es verifica la cadena sencera; només s’hi afig el que falta i mai es reescriu el que ja hi ha.">
        <CampText tipus="file" accept={ACCEPTA_COPIA} textBoto="Tria la còpia" disabled={ocupat} onChange={restaura} />
      </Camp>
    </>
  );
}
