import { useMemo } from 'react';
import { Bot, FileStack, FolderOpen, Lock, Timer } from 'lucide-react';
import { EstatBuit, Taula } from '../../../components/PedraSeca';
import { Mono } from '../peces.jsx';
import { GraellaXifres } from '../XifresMas.jsx';
import { xifresDeFamilia, xifresDeGrup } from '../xifresMas.js';
import { etiquetaNode } from './grafMapa.js';
import { capesActors } from './actorsMapa.js';

/* Actors del Mas (05_actors_i_salut.md): la pestanya «Actores» d'Emowe, capa
   per capa. Cada capa ix del Mapa; la relació amb la capa del costat va
   escrita en la targeta (qui dispara quin candat, qui carrega què), perquè es
   puga llegir també sense vore cap línia.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada arnés, carregador,
   candat, tasca i lloc del sòl és una targeta sencera amb la boina de Sóc de
   Poble i pàgina pròpia (pecesMapa.js, XifresMas.jsx). Derogat per l'ordre
   del Mestre del 261004 (xat: cap xifra solta): les peces com a targetes
   compactes del Panell de Control (TargetaResum), sense boina ni pàgina. Els
   estats (ACTIU, SENSE CONSUMIDOR, VIU, MORT, FALTA…) són les etiquetes de
   cada targeta, com abans.
   Correcció 261004 (verificador de la segona passada) · «Els que conversen»
   comença per la xifra «agents» del tauler, que es tracta ací. Les targetes
   de la pàgina són les de la vista «actors» (VISTES_XIFRES): sense Mapa no
   es pot saber quines peces hi ha, i cap no té targeta ni pàgina. */

const noms = (nodes) => nodes.map((n) => n.atributs?.arnes ?? etiquetaNode(n)).join(', ');

export function ActorsMapa({ mapa }) {
  const capes = useMemo(() => capesActors(mapa), [mapa]);
  const { arnesos, carregadors } = capes;
  /* Correcció 261004 (verificador de la tercera passada, punt 5) · Els
     candats i el sòl porten la targeta del seu recompte davant de les peces:
     la coberta en destacava el nombre i els estats sense cap targeta. */
  const peces = useMemo(() => ({
    recompte: xifresDeGrup('actors', mapa),
    arnesos: xifresDeFamilia('arnes', mapa),
    carregadors: xifresDeFamilia('carregador', mapa),
    recompteCandats: xifresDeGrup('candats', mapa),
    candats: xifresDeFamilia('candat', mapa),
    tasques: [...xifresDeFamilia('tasca', mapa), ...xifresDeGrup('sense-llancador', mapa)],
    recompteSol: xifresDeGrup('sol', mapa),
    sol: xifresDeFamilia('lloc', mapa)
  }), [mapa]);
  const senseCodex = !arnesos.some((a) => a.node.id === 'agent:codex');

  return (
    <>
      <p>
        Al capdamunt, el Mestre: demana, revisa i decidix. Davall, capa per capa, el que el
        Mapa troba al voltant dels agents. Cada targeta porta el seu estat; el que falta es
        diu, no s'amaga. Les relacions entre capes van escrites en cada targeta: qui dispara
        quin candat i qui carrega què en arrencar.
      </p>

      <section>
        <h3>Els que conversen</h3>
        <p>Cada arnés és l'eina amb què el Mestre parla amb un agent. Dispara els seus candats i carrega la memòria d'arrencada.</p>
        <p>
          Els dotze membres del Consell no hi apareixen: el compilador encara no
          llig <Mono>.agents/consell.json</Mono>.
          {/* T10 (ordre del Mestre, 260930): l'absència de Codex es diu mentre dure. */}
          {senseCodex ? <> Codex tampoc: al Mapa no ha arribat cap <Mono>.codex/hooks.json</Mono>.</> : null}
        </p>
        <p>SENSE CONSUMIDOR significa que els candats (hooks) existeixen al repositori, però la telemetria visual no pot acreditar quin agent els dispara. Pot faltar una configuració, com <Mono>CLAUDE.md</Mono>, que declare qui els consumix; l'etiqueta no prova que no s'executen. DESCONEGUT vol dir que els candats estan declarats per a un client que els pot consumir, però el Mas encara no té cap evidència que salten.</p>
        <GraellaXifres xifres={[...peces.recompte, ...peces.arnesos]} generat={mapa.generat} />
        {peces.arnesos.length ? null : <EstatBuit icona={Bot} titol="Cap arnés al Mapa" />}
      </section>

      <section>
        <h3>La memòria d’arrencada</h3>
        <p>El que s'ha carregat abans de la primera paraula. Un carregador que cap arnés no declara carregar només compta si algú el llig a mà.</p>
        {carregadors.length ? <>
          <GraellaXifres xifres={peces.carregadors} generat={mapa.generat} />
          <Taula titol="Què es carrega en arrencar" densa>
            <thead>
              <tr><th scope="col">Carregador</th><th scope="col">Carrega</th><th scope="col">Qui el carrega</th></tr>
            </thead>
            <tbody>
              {carregadors.map((c) => (
                <tr key={c.node.id}>
                  <th scope="row"><Mono>{etiquetaNode(c.node)}</Mono></th>
                  <td>{c.carrega.map((n) => (n.tipus === 'skill' ? etiquetaNode(n) : <Mono key={n.id}>{etiquetaNode(n)}</Mono>))
                    .flatMap((x, i) => (i ? [' · ', x] : [x]))}</td>
                  <td>{c.perQui.length ? noms(c.perQui) : 'cap arnés'}</td>
                </tr>
              ))}
            </tbody>
          </Taula>
        </> : <EstatBuit icona={FileStack} titol="Cap càrrega d’arrencada declarada" />}
      </section>

      <section>
        <h3>Els candats</h3>
        <p>
          Els hooks intercepten cada eina de l'agent abans o després d'executar-se. Un candat
          sense consumidor acreditat és una promesa: està declarat, però ningú no demostra que salte.
        </p>
        <GraellaXifres xifres={[...peces.recompteCandats, ...peces.candats]} generat={mapa.generat} />
        {peces.candats.length ? null : <EstatBuit icona={Lock} titol="Cap candat al Mapa" />}
      </section>

      <section>
        <h3>El que corre sol</h3>
        <p>Les tasques que llança el rellotge del sistema (launchd), sense ningú davant. Les que el registre declara i ningú no llança, a part.</p>
        {peces.tasques.length
          ? <GraellaXifres xifres={peces.tasques} generat={mapa.generat} />
          : <EstatBuit icona={Timer} titol="Res no corre sol">Cap tasca del Mapa té llançador: els agents només treballen mentre algú els parla.</EstatBuit>}
      </section>

      <section>
        <h3>El sòl</h3>
        <p>On treballen: els llocs on les peces deixen la faena o la lligen.</p>
        <GraellaXifres xifres={[...peces.recompteSol, ...peces.sol]} generat={mapa.generat} />
        {peces.sol.length ? null : <EstatBuit icona={FolderOpen} titol="Cap lloc declarat" />}
      </section>
    </>
  );
}
