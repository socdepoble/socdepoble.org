import { useEffect, useId, useState } from 'react';
import { Lightbulb, MessagesSquare, Network, PowerOff } from 'lucide-react';
import { Avatar, Casella, GrupAvatars, GrupOpcions, IaiaIcon } from '../../components/PedraSeca/index.js';
import { AGENTS, tipusDAgent } from '../../data/agentsSeed.js';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia, esIaiaActiva, nivellIaiaDesat } from './nivellIaia.js';

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · El Selector de
   Realitat ja no és una pantalla solta (/realitat, ara una redirecció): és un
   bloc de la pàgina de la IAIA MarIA (/iaia, FitxaPublica de
   profile/PerfilPublicSection.jsx), al peu de la seua presentació. Qui
   coneix la IAIA hi tria, en el mateix lloc, quanta IA l'acompanya. El bloc
   obri amb el seu H3, com els apartats de la presentació
   (core-llegibilitat-text §2): l'H1 i l'H2 són els de la fitxa.

   T44 (ordre del Mestre, 260928) · cada nivell diu el seu propòsit.
   Ordre del Mestre (261021, pla 261021_0015 §11) · Reforma didàctica: cada
   nivell té el seu text propi al tauler d'estat (estat) i al detall de la
   targeta (detall), escrits per a qualsevol veí. Fora «la barra negra»: era
   argot de desenvolupament («Quina barra negra?»). La IAIA de la barra
   superior continua encenent-se a partir del nivell 2 (T30.2), però la
   interfície ja no en parla. Constant de mòdul: no es recrea. */
const NIVELLS = [
  {
    id: 0, etiqueta: 'Apagada', Icona: PowerOff, descripcio: 'La IA no intervé: ni suggeriments ni converses. Només tu i la gent del poble.',
    estat: "La intel·ligència artificial està completament desconnectada. L'aplicació funciona de manera tradicional: només tu i la gent del poble, amb privadesa manual absoluta i zero intervenció d'assistents.",
    detall: 'Completament apagada · Zero IA'
  },
  {
    id: 1, etiqueta: 'Passiva', Icona: Lightbulb, descripcio: 'La IA només respon quan li ho demanes. Mai no pren la iniciativa.',
    estat: "La IAIA MarIA i els assistents estan en silenci i a l'espera. Només respondran si tu els fas una pregunta directa o demanes la seua ajuda; mai no prendran la iniciativa ni t'interrompran.",
    detall: 'En espera · Només respon si tu li preguntes'
  },
  {
    id: 2, etiqueta: 'Interactiva', Icona: MessagesSquare, descripcio: 'Converses actives amb els acompanyants que tries tu.',
    estat: "Col·laboració activa amb els acompanyants que tu tries. Els assistents seleccionats t'ajuden a redactar missatges, traduir o proposar idees al mur i al xat.",
    detall: 'Activa · Amb els acompanyants que tries tu'
  },
  {
    id: 3, etiqueta: 'Connexió total', Icona: Network, descripcio: "Tots els agents del Mas t'acompanyen alhora, sense triar-los.",
    estat: "El Mas connectat en comunitat plena. Tots els assistents (la IAIA MarIA, El Gall del temps, El Pregoner, L'Artiste Nano Banana...) col·laboren automàticament per dinamitzar i cuidar el poble.",
    detall: 'Comunitat plena · Tot el Mas al teu servei'
  }
];

const LLISTA_CA = new Intl.ListFormat('ca', { type: 'conjunction' });

/** Mesurador d'intensitat 0-3: tres pedres, les n primeres plenes. Decoratiu. */
function Pedres({ plenes }) {
  return (
    <span className="sdp-realitat__pedres" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= plenes ? 'sdp-realitat__pedra sdp-realitat__pedra--plena' : 'sdp-realitat__pedra'} />
      ))}
    </span>
  );
}

export default function SelectorRealitat() {
  const { t } = useUIActions();
  const idAjudaCompanys = useId();

  const [level, setLevel] = useState(nivellIaiaDesat);

  const [selectedCompanions, setSelectedCompanions] = useState(() => {
    const desats = getVal('socdepoble-iaia-companions', []);
    return Array.isArray(desats) ? desats : [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal(CLAU_NIVELL_IAIA, level.toString());
      setVal('socdepoble-iaia-companions', selectedCompanions);
      /* T30.2 · la barra negra s'assabenta del nivell sense tornar a muntar-se. */
      anunciaNivellIaia(level);
    }
  }, [level, selectedCompanions]);

  const toggleCompanion = (id) => {
    setSelectedCompanions((previous) =>
      previous.includes(id)
        ? previous.filter((companionId) => companionId !== id)
        : [...previous, id]
    );
  };

  /* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL del
     catàleg són IA) · Els acompanyants són els agents que el catàleg classifica
     com a IA (tipusDAgent, la font única de data/agentsSeed.js): les IA i els
     personatges ANIMAL (hui, Marc el Gall: planter oficial de cinc, pla
     261021_0015 §12). Abans era una
     quarta còpia del vocabulari (AI o MASTER) que els deixava fora. Cap agent
     del catàleg porta el tipus MASTER (és l'abast, `scope`, de la IAIA, de Javi
     i de l'entitat), i un tipus desconegut és una persona: no hi entra. */
  const aiAgents = AGENTS.filter((agent) => tipusDAgent(agent) === 'ia');

  const nivellActual = NIVELLS.find((n) => n.id === level) ?? NIVELLS[1];
  const activa = esIaiaActiva(nivellActual.id);

  const acompanyants = (
    <fieldset className="sdp-grup sdp-realitat__acompanyants" aria-describedby={idAjudaCompanys}>
      <legend className="sdp-grup__llegenda">
        {t('section.realitat.acompanyants', 'Tria els teus acompanyants')}
      </legend>
      <p id={idAjudaCompanys} className="sdp-camp__ajuda">Marca amb quins acompanyants vols conversar.</p>
      <div className="sdp-realitat__graella">
        {aiAgents.map((agent) => {
          const triat = selectedCompanions.includes(agent.id);
          return (
            <Casella
              key={agent.id}
              className={triat ? 'sdp-realitat__company sdp-realitat__company--triat' : 'sdp-realitat__company'}
              checked={triat}
              onChange={() => toggleCompanion(agent.id)}
              etiqueta={(
                <>
                  {/* Sense `nom`: posaria un title i repetiria el nom escrit al costat. */}
                  <Avatar src={resolveAsset(agent.avatar_url)} mida="lg" alt="" llavor={agent.id} />
                  <span className="sdp-realitat__company-nom">{agent.name}</span>
                </>
              )}
              ajuda={agent.role}
            />
          );
        })}
      </div>
    </fieldset>
  );

  const connexio = (
    <div className="sdp-realitat__connexio">
      <GrupAvatars>
        {aiAgents.map((agent) => (
          <Avatar key={agent.id} src={resolveAsset(agent.avatar_url)} mida="md" alt="" llavor={agent.id} />
        ))}
      </GrupAvatars>
      <p className="sdp-realitat__connexio-text">
        Amb la connexió total t&apos;acompanyen tots alhora: {LLISTA_CA.format(aiAgents.map((agent) => agent.name))}.
      </p>
    </div>
  );

  return (
    <>
      <h3>{t('section.realitat.subtitle', "Tu decidixes quanta intel·ligència artificial t'acompanya")}</h3>
      <p>
        {t(
          'section.realitat.lead',
          'Cada nivell diu fins on pot arribar la IA. La tria es guarda només en este navegador i la pots canviar quan vulgues.'
        )}
      </p>
      {/* T44 (ordre del Mestre, 260928) · substituïx la llista grisa de T31:
          un tauler d'estat lligat a la IAIA de la barra negra, els nivells com
          a targetes (GrupOpcions aspecte="targetes": el control continua sent
          el ràdio natiu) i els acompanyants com a targetes-casella. */}
      <div className="sdp-realitat">
        {/* Sense regió viva: el ràdio ja anuncia el canvi i no es repetix. */}
        <div className="sdp-realitat__estat">
          <span className={activa ? 'sdp-realitat__iaia sdp-realitat__iaia--activa' : 'sdp-realitat__iaia'} aria-hidden="true">
            <IaiaIcon />
          </span>
          <div className="sdp-realitat__estat-text">
            <p className="sdp-realitat__estat-titol">Ara: nivell {nivellActual.id} · {nivellActual.etiqueta}</p>
            <p className="sdp-realitat__estat-desc">{nivellActual.estat}</p>
          </div>
        </div>

        <GrupOpcions
          aspecte="targetes"
          textTriada="Nivell actual"
          llegenda={t('section.realitat.nivells', "Nivell d'interacció amb la IAIA")}
          nom="nivell-iaia"
          opcions={NIVELLS.map((n) => ({
            valor: n.id,
            antetitol: `Nivell ${n.id}`,
            etiqueta: n.etiqueta,
            ajuda: n.descripcio,
            icona: <n.Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
            detall: (
              <>
                <Pedres plenes={n.id} />
                {n.detall}
              </>
            ),
            /* Ordre del Mestre (261021, pla 261021_0015 §11.4) · El que
               configura el nivell s'obri amb la seua targeta (GrupOpcions ·
               desplegable): triar els acompanyants, amb «Interactiva»; qui
               t'acompanya, amb «Connexió total». Abans quedaven soltes al
               final del formulari i en mòbil no es veien. */
            desplegable: n.id === 2 ? acompanyants : (n.id === 3 && aiAgents.length ? connexio : null)
          }))}
          valor={level}
          onCanvi={(valor) => setLevel(Number(valor))}
        />
      </div>
    </>
  );
}
