/* P1-35 (pla 261028_1526 §3.5.2) · Empaquetats i llançament: la targeta del
   tauler de /consola i la seua pàgina, /consola/empaquetats. Les dades i les
   regles viuen a empaquetats.js (sense React); la lectura és la de useFontDev,
   la mateixa de consola.json i del Mapa, i fora de DEV no demana res.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · El recompte de
   plataformes al pas és una TargetaConsola amb boina i pàgina pròpia.
   Cap botó publica: la pàgina diu l'ordre exacta de cada plataforma per a
   copiar-la al terminal, on la pujada continua demanant --confirma. Cap
   classe nova: les peces són les de la Consola (peces.jsx i modules.css). */
import { useId } from 'react';
import { Package } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Carregant, EstatBuit, Insignia, MollaPa } from '../../components/PedraSeca';
import { RUTA_CONSOLA, copyConsola } from './consolaPagines.js';
import { Mono, Privat, PrivacitatConsola, TargetaConsola } from './peces.jsx';
import {
  ENTRADETA_EMPAQUETATS, ETIQUETA_NAV_EMPAQUETATS, SEMAFOR, TITOL_EMPAQUETATS,
  canonicaDesfasada, cobertaEmpaquetats, paginaEmpaquetats, plataformesEmpaquetades
} from './empaquetats.js';
import { VERSIO_SISTEMA, versioCanonica } from '../../config/versio.js';

/**
 * La secció del tauler: el seu H2, una línia que l'explica i una sola
 * targeta, que porta a la pàgina. `font` és la lectura de useFontDev
 * ({ estat, valor }).
 */
export function SeccioEmpaquetats({ font }) {
  const id = useId();
  const pagina = paginaEmpaquetats();
  const coberta = cobertaEmpaquetats(font.valor, font.estat);
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{TITOL_EMPAQUETATS}</h2>
      <p>{ENTRADETA_EMPAQUETATS}</p>
      <nav className="sdp-card-grid sdp-consola__graella" aria-label={ETIQUETA_NAV_EMPAQUETATS}>
        <TargetaConsola icona={Package} titol={pagina.title} subtitol={pagina.subtitle} entradilla={pagina.lead}
          dada={coberta.dada} etiquetes={coberta.etiquetes} a={pagina.ruta}
          creat={copyConsola().date} generat={font.valor?.generat ?? null} />
      </nav>
    </section>
  );
}

/* Una plataforma: el semàfor i el per què, el que declara, els artefactes
   de la carpeta de builds (només els noms), l'ordre que la publica i el
   fitxer que puja eixa ordre, que no és cap d'eixos artefactes. El cos de
   les pàgines de la Consola parla en H3. */
function Plataforma({ p }) {
  const id = useId();
  const semafor = SEMAFOR[p.semafor];
  return (
    <section aria-labelledby={id}>
      <h3 id={id}>{p.nom}</h3>
      <p><Insignia to={semafor.to}>{semafor.text}</Insignia> {p.motiu}</p>
      <p>
        Versió declarada: {p.versio ? <Mono>{p.build ? `${p.versio}+${p.build}` : p.versio}</Mono> : 'cap'}
        {p.font ? <> · Font: <Mono>{p.font}</Mono></> : null}
      </p>
      {p.artefactes.length ? (
        <>
          <p>
            {p.ultim
              ? (p.alDia ? 'A la carpeta de builds, l’últim artefacte és el de la versió declarada.' : `A la carpeta de builds, l’últim artefacte és de la ${p.ultim.versio}${p.ultim.build ? `+${p.ultim.build}` : ''}, no de la versió declarada.`)
              : 'A la carpeta de builds, cap artefacte porta la versió al nom.'}
          </p>
          <ul className="sdp-consola__evidencies" aria-label={`Artefactes de ${p.nom}, el més recent primer`}>
            {p.artefactes.map((a) => <li key={a.nom}><Mono>{a.nom}</Mono></li>)}
          </ul>
        </>
      ) : <p>Cap artefacte a la carpeta de builds.</p>}
      {p.ordre ? (
        <>
          <p>L’ordre per a publicar-la, per a copiar-la al terminal:</p>
          <pre className="sdp-consola__diagnosi-text"><Privat>{p.ordre}</Privat></pre>
          {p.fitxer ? <p>Puja <Mono>{p.fitxer}</Mono>, no cap artefacte de la carpeta de builds.</p> : null}
        </>
      ) : null}
      <p>{p.nota}</p>
    </section>
  );
}

/**
 * /consola/empaquetats. Sense font, diu per què (la font només la servix el
 * servidor local de desenvolupament) i no en pinta cap plataforma: la
 * Consola no inventa versions. Amb una lectura, les quatre plataformes. `peu`
 * és el panell de dades de totes les pàgines (ControlsConsola).
 */
export function PaginaEmpaquetats({ font, privat, peu }) {
  const copy = copyConsola();
  const pagina = paginaEmpaquetats();
  const plataformes = plataformesEmpaquetades(font.valor);
  return (
    <UniversalPage title={pagina.title} subtitle={pagina.subtitle} lead={pagina.lead} chrome="system" nivellMaxIndex={6}>
      <PrivacitatConsola.Provider value={privat}>
        <MollaPa className="sdp-molla--panell" passos={[{ etiqueta: copy.title, a: RUTA_CONSOLA }, { etiqueta: pagina.title }]} />
        <p>Versió Canònica del Sistema: <Mono>{versioCanonica()}</Mono></p>
        {canonicaDesfasada(font.valor) && (
          <Alerta to="avis" titol="La versió de package.json ha canviat">
            El servidor llig la {font.valor.canonica} i esta pàgina porta la {VERSIO_SISTEMA}: recarrega-la.
          </Alerta>
        )}
        {font.estat === 'loading' && <Carregant etiqueta="Llegint els empaquetats…" />}
        {font.estat === 'error' && (
          <Alerta to="error" titol="No s’han pogut llegir els empaquetats">
            {font.valor ? 'Es conserva l’última lectura bona. ' : ''}
            {font.error?.message || 'Torna a provar-ho amb Refrescar.'}
          </Alerta>
        )}
        {!font.valor && font.estat === 'absent' && (
          <EstatBuit icona={Package} titol="Empaquetats no disponibles">
            Esta pàgina viu de <Mono>GET /__iaia/empaquetats.json</Mono>, que només se servix al servidor
            local de desenvolupament i només llig noms d’artefactes i versions declarades. Sense eixa
            font no hi ha dades, i la Consola no en inventa.
          </EstatBuit>
        )}
        {font.valor && !font.valor.carpeta && (
          <Alerta to="avis" titol="No s’ha trobat la carpeta de builds">
            Les versions declarades es lligen igual; els artefactes, no.
          </Alerta>
        )}
        {plataformes.map((p) => <Plataforma key={p.id} p={p} />)}
        {peu}
      </PrivacitatConsola.Provider>
    </UniversalPage>
  );
}
