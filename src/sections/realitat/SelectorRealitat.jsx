import { useEffect, useState } from 'react';
import { Lightbulb, MessagesSquare, Network, PowerOff } from 'lucide-react';
import { GrupOpcions, IaiaIcon } from '../../components/PedraSeca/index.js';
import { setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia, esIaiaActiva, nivellIaiaDesat } from './nivellIaia.js';

/* R21.5 · Selector de presència de la IAIA MarIA al peu de /iaia.
   L'única intel·ligència artificial del Mas és la IAIA MarIA: s'han eliminat
   per complet el desplegable d'acompanyants, el grup d'avatars i qualsevol
   referència a altres assistents, acompanyants o agents. Quatre nivells nets
   dedicats exclusivament a la IAIA MarIA (0 Apagada, 1 Passiva, 2 Interactiva,
   3 Activa).
   R21 (honestedat_textos-05) · Cada text diu el que fa el codi, i res més:
   el 0 la trau del xat (XatContext · iaiaApagada); de l'1 al 3, el xat és el
   mateix (respon quan li escrius, amb suggeriments ràpids a la seua
   conversa); a partir del 2, la seua icona de dalt s'il·lumina (App.jsx ·
   esIaiaActiva), i el 3 encara no té cap funció pròpia. Si un nivell guanya
   una capacitat, primer el codi i després el text. Cada text és un parell
   [clau i18n, reserva en valencià], amb les cinc llengües als diccionaris. */
const NIVELLS = [
  {
    id: 0,
    etiqueta: ['section.realitat.nivell0.etiqueta', 'Apagada'],
    Icona: PowerOff,
    descripcio: ['section.realitat.nivell0.descripcio', 'La IAIA MarIA desapareix del xat: ni la seua conversa, ni respostes, ni suggeriments.'],
    estat: ['section.realitat.nivell0.estat', 'La IAIA MarIA està apagada: no apareix al xat, no respon i no hi ha suggeriments de pregunta. Al xat, només tu i la gent d’este poble.'],
    detall: ['section.realitat.nivell0.detall', 'Apagada · Fora del xat']
  },
  {
    id: 1,
    etiqueta: ['section.realitat.nivell1.etiqueta', 'Passiva'],
    Icona: Lightbulb,
    descripcio: ['section.realitat.nivell1.descripcio', 'La IAIA MarIA és al xat i només respon quan li escrius.'],
    estat: ['section.realitat.nivell1.estat', 'La IAIA MarIA és al xat i espera: només respon quan li escrius, a la seua conversa o amb @iaia en un grup on estiga. A la seua conversa hi ha suggeriments ràpids de pregunta. Respon amb el que troba a la Wiki de Poble i l’enllaç a la font; si el servidor oferix el servei de la IAIA, la pregunta s’hi pot enviar.'],
    detall: ['section.realitat.nivell1.detall', 'Al xat · Només respon si li escrius']
  },
  {
    id: 2,
    etiqueta: ['section.realitat.nivell2.etiqueta', 'Interactiva'],
    Icona: MessagesSquare,
    descripcio: ['section.realitat.nivell2.descripcio', 'Al xat, igual que el nivell 1. A més, la seua icona de dalt de la pantalla s’il·lumina.'],
    estat: ['section.realitat.nivell2.estat', 'Al xat, la IAIA MarIA fa el mateix que al nivell 1: només respon quan li escrius. L’única diferència és que la seua icona de dalt de la pantalla s’il·lumina en taronja, si el dispositiu no té activat el moviment reduït.'],
    detall: ['section.realitat.nivell2.detall', 'Al xat · La icona s’il·lumina']
  },
  {
    id: 3,
    etiqueta: ['section.realitat.nivell3.etiqueta', 'Activa'],
    Icona: Network,
    descripcio: ['section.realitat.nivell3.descripcio', 'De moment, igual que el nivell 2: encara no té cap funció pròpia.'],
    estat: ['section.realitat.nivell3.estat', 'De moment, el nivell 3 fa el mateix que el 2: al xat, la IAIA MarIA només respon quan li escrius, i la seua icona s’il·lumina. Encara no hi ha cap funció pròpia d’este nivell.'],
    detall: ['section.realitat.nivell3.detall', 'Com el nivell 2 · Sense funció pròpia encara']
  }
];

const ARA = ['section.realitat.ara', 'Ara: nivell {nivell} · {etiqueta}'];
const ANTETITOL = ['section.realitat.antetitol', 'Nivell {nivell}'];
const NIVELL_ACTUAL = ['section.realitat.nivellActual', 'Nivell actual'];

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

const SUBTITOL_PRESENCIA_IAIA = Object.freeze({
  ca: 'Tu decidixes quanta presència té la IAIA MarIA',
  es: 'Tú decides cuánta presencia tiene la IAIA MarIA',
  en: 'You decide how much presence IAIA MarIA has',
  eu: 'Zuk erabakitzen duzu zer presentzia duen IAIA MarIAk',
  gl: 'Ti decides canta presenza ten a IAIA MarIA'
});

export default function SelectorRealitat() {
  const { t, language } = useUIActions();
  const [level, setLevel] = useState(nivellIaiaDesat);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal(CLAU_NIVELL_IAIA, level.toString());
      anunciaNivellIaia(level);
    }
  }, [level]);

  const tr = ([clau, reserva]) => t(clau, reserva);
  const nivellActual = NIVELLS.find((n) => n.id === level) ?? NIVELLS[1];
  const activa = esIaiaActiva(nivellActual.id);
  const codiIdioma = String(language || 'ca').toLowerCase().split('-')[0];
  const subtitolReserva = SUBTITOL_PRESENCIA_IAIA[codiIdioma] || SUBTITOL_PRESENCIA_IAIA.ca;
  const subtitolTraduit = t('section.realitat.subtitle', subtitolReserva);
  const subtitolNet = /acompanya|acompaña|stays by your side|laguntzen/i.test(subtitolTraduit)
    ? subtitolReserva
    : subtitolTraduit;

  return (
    <>
      <h3>{subtitolNet}</h3>
      <p>
        {t(
          'section.realitat.lead',
          'Cada nivell diu fins on pot arribar la IAIA MarIA. La tria es guarda només en este navegador i la pots canviar quan vulgues.'
        )}
      </p>
      <div className="sdp-realitat">
        <div className="sdp-realitat__estat">
          <span className={activa ? 'sdp-realitat__iaia sdp-realitat__iaia--activa' : 'sdp-realitat__iaia'} aria-hidden="true">
            <IaiaIcon />
          </span>
          <div className="sdp-realitat__estat-text">
            <p className="sdp-realitat__estat-titol">
              {tr(ARA).replace('{nivell}', String(nivellActual.id)).replace('{etiqueta}', tr(nivellActual.etiqueta))}
            </p>
            <p className="sdp-realitat__estat-desc">{tr(nivellActual.estat)}</p>
          </div>
        </div>

        <GrupOpcions
          aspecte="targetes"
          textTriada={tr(NIVELL_ACTUAL)}
          llegenda={t('section.realitat.nivells', "Nivell d'interacció amb la IAIA MarIA")}
          nom="nivell-iaia"
          opcions={NIVELLS.map((n) => ({
            valor: n.id,
            antetitol: tr(ANTETITOL).replace('{nivell}', String(n.id)),
            etiqueta: tr(n.etiqueta),
            ajuda: tr(n.descripcio),
            icona: <n.Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
            detall: (
              <>
                <Pedres plenes={n.id} />
                {tr(n.detall)}
              </>
            )
          }))}
          valor={level}
          onCanvi={(valor) => setLevel(Number(valor))}
        />
      </div>
    </>
  );
}
