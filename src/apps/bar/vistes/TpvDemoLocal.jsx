/**
 * El Bar · vistes/TpvDemoLocal.jsx — Onada R32.26 (IDEA-304).
 *
 * Mode Demo local 100 % en memòria per a qui entra a /app/bar/tpv sense sessió
 * i vol provar l'experiència de caixa estil Loyverse sense tocar IndexedDB,
 * sense obrir cap torn persistent i sense cap connexió al servidor.
 * Mostra sempre l'avís honest «Mode Demo en este dispositiu · Nota de consum
 * de mostra · no és factura».
 * v1.2.17 · Gauntlet R1 (L3-11) · Sempre la carta i el bar d'exemple (llavor.js), mai els del Bar real.
 * v1.2.17 · Gauntlet R1 (L3-12) · Una línia que no es pot afegir (999 unitats) no tomba la vista: ho diu una Alerta.
 * v1.2.17 · Gauntlet R2 (L3R2-05) · En obrir la Demo, el focus va a «Ix de la Demo» i no cau a <body> (WCAG 2.4.3).
 */
import { useEffect, useRef, useState } from 'react';
import { Alerta, Boto, Dialeg, Fila, Pila, UniversalTPV } from '../../../components/PedraSeca/index.js';
import { resolModificadors } from '../nucli/cataleg.js';
import { afegeixProducte, creaComanda } from '../nucli/comanda.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from '../nucli/llavor.js';
import { textError } from '../estat/textos.js';
import { textosUiBar } from '../i18nBar.js';
import { DialegPreuObert } from './Caixa.jsx';
import {
  articlesDelTpv, categoriesVestides, descripcioTria, llegixOpcio, necessitaTria,
  opcionsDetall, textosLiniesBar, tiquetDeComanda, triaLaVariant
} from './vestits.js';

const MOMENT_DEMO = '2026-10-02T09:00:00.000Z';

function comandaBuidaDemo() {
  return creaComanda({
    id: 'c-demo-local',
    tornId: 'torn-demo-local',
    origen: { tipus: 'barra' },
    ara: MOMENT_DEMO,
    per: 'Demo'
  });
}

export function TpvDemoLocal({ idioma = 'ca', onIx }) {
  const tx = textosUiBar(idioma);
  /* La carta de mostra que promet demoLocalText: una còpia per muntatge, en memòria. */
  const [carta] = useState(llavorCarta);
  const establiment = ESTABLIMENT_EXEMPLE;
  const ivaPerDefecte = establiment.ivaPerDefecte;

  const seguentLinia = useRef(1);
  const [comanda, setComanda] = useState(comandaBuidaDemo);
  const [producteTria, setProducteTria] = useState(null);
  const [preuPendent, setPreuPendent] = useState({ producte: null, variant: null, generacio: 0 });
  const [notaOberta, setNotaOberta] = useState(false);
  const [errorDemo, setErrorDemo] = useState(null);

  /* v1.2.17 · Gauntlet R2 (L3R2-05) · El focus d'entrada, a «Ix de la Demo». Boto no reenvia cap ref (React 18,
     sense forwardRef): la ref és del text del botó i el focus, del <button> que el conté. Es mou en una
     microtasca: UniversalTPV mesura la seua amplada en muntar i, en pantalla estreta, torna a muntar l'avís en
     la disposició d'una columna dins de la mateixa tasca; el botó del primer muntatge ja no hi seria. */
  const textIx = useRef(null);
  useEffect(() => {
    let viu = true;
    queueMicrotask(() => {
      if (viu) textIx.current?.closest('button')?.focus();
    });
    return () => { viu = false; };
  }, []);

  const perId = new Map(carta.productes.map((p) => [p.id, p]));
  const demanaTria = (producte) => necessitaTria(producte, carta.grups) || producte.variants.length > 1;
  const tiquet = tiquetDeComanda(comanda, idioma);

  /* v1.2.17 · Gauntlet R1 (L3-12) · L'estat següent es calcula fora de l'actualitzador: el nucli llança
     (p. ex. «Massa unitats en una línia») i l'error va a l'Alerta, no a React. */
  const afigEnMemoria = (producte, extra = {}) => {
    const idLinia = `l-demo-${seguentLinia.current}`;
    let seguent;
    try {
      seguent = afegeixProducte(comanda, { producte, ivaPerDefecte, ...extra }, { ara: MOMENT_DEMO, idLinia });
    } catch (error) {
      setErrorDemo(error);
      return;
    }
    seguentLinia.current += 1;
    setErrorDemo(null);
    setComanda(seguent);
  };

  const toca = (article) => {
    const producte = perId.get(article.id);
    if (!producte || producte.actiu === false) return;
    if (producte.preuObert && !triaLaVariant(producte)) {
      setPreuPendent((prev) => ({ producte, variant: null, generacio: prev.generacio + 1 }));
    } else if (demanaTria(producte)) {
      setProducteTria(producte);
    } else {
      afigEnMemoria(producte);
    }
  };

  const tria = {
    obert: Boolean(producteTria),
    titol: producteTria ? producteTria.nom : tx.tria,
    descripcio: producteTria ? descripcioTria(producteTria, carta.grups, idioma) : tx.triaVariant,
    opcions: producteTria
      ? opcionsDetall(producteTria, carta.grups, idioma).map((o) => ({ id: o.valor, nom: o.etiqueta, valor: o.ajuda }))
      : [],
    onTria: (opcio) => {
      if (!producteTria) return;
      const { varianteId, opcions } = llegixOpcio(opcio.id);
      const triat = producteTria;
      setProducteTria(null);
      if (triat.preuObert) {
        const variant = triaLaVariant(triat) ? triat.variants.find((v) => v.id === varianteId) || null : null;
        setPreuPendent((prev) => ({ producte: triat, variant, generacio: prev.generacio + 1 }));
        return;
      }
      afigEnMemoria(triat, { varianteId, modificadors: resolModificadors(triat, carta.grups, opcions) });
    },
    onTanca: (motiu) => {
      if (motiu !== 'tria') setProducteTria(null);
    }
  };

  const buida = () => {
    setNotaOberta(false);
    setErrorDemo(null);
    setComanda(comandaBuidaDemo());
  };

  const avisDemo = (
    <Alerta
      key="demo-local"
      to="avis"
      titol={tx.demoLocalTitol}
      accions={<Boto onClick={onIx}><span ref={textIx}>{tx.ixDeLaDemo}</span></Boto>}
    >
      {tx.demoLocalText}
    </Alerta>
  );
  const avisError = errorDemo ? (
    <Alerta key="demo-error" to="error" titol={tx.demoErrorTitol} onTanca={() => setErrorDemo(null)}>
      {textError(errorDemo, idioma)}
    </Alerta>
  ) : null;

  return (
    <>
      <UniversalTPV
        etiqueta={`${establiment.nom} · Demo`}
        marca={{ nom: establiment.nom }}
        avis={avisError ? [avisDemo, avisError] : [avisDemo]}
        tiquet={{
          titol: tx.tiquet,
          nom: tx.demoNomTiquet,
          comptador: tiquet.unitats,
          linies: tiquet.linies,
          total: tiquet.total,
          resum: tiquet.resum,
          textosEstat: textosLiniesBar(idioma),
          buit: { titol: tx.tiquetBuitTitol, text: tx.tiquetBuitText }
        }}
        accions={{
          secundaria: {
            text: tx.demoBuidaTiquet,
            desactivada: comanda.linies.length === 0,
            onClick: buida
          },
          principal: {
            text: tx.demoMostraNota,
            ...(tiquet.total ? { valor: tiquet.total.valor } : {}),
            desactivada: tiquet.pendentCents <= 0,
            onClick: () => setNotaOberta(true)
          }
        }}
        cataleg={{
          titol: tx.productes,
          categories: categoriesVestides(carta),
          articles: articlesDelTpv(carta, { comanda, establiment, idioma }),
          textosEstat: { 'en-colleccio': tx.aLaComanda },
          onTria: toca,
          desactivat: false,
          buit: { titol: tx.cartaBuidaTitol, text: tx.cartaBuidaText }
        }}
        tria={tria}
      />
      <DialegPreuObert
        key={`demo-preu-${preuPendent.generacio}`}
        producte={preuPendent.producte}
        variant={preuPendent.variant}
        idioma={idioma}
        onTanca={() => setPreuPendent((prev) => ({ ...prev, producte: null, variant: null }))}
        onAfig={(preuCents) => {
          if (preuPendent.producte) {
            afigEnMemoria(preuPendent.producte, {
              preuCents,
              ...(preuPendent.variant ? { varianteId: preuPendent.variant.id } : {})
            });
          }
          setPreuPendent((prev) => ({ ...prev, producte: null, variant: null }));
        }}
      />
      <Dialeg
        obert={notaOberta}
        onTanca={() => setNotaOberta(false)}
        titol={tx.demoNotaTitol}
        mida="s"
        accions={(
          <Fila justify="center">
            <Boto onClick={buida}>{tx.demoBuidaTiquet}</Boto>
            <Boto varietat="primari" onClick={() => setNotaOberta(false)}>{tx.tancaNota}</Boto>
          </Fila>
        )}
      >
        <Pila gap={3}>
          <Alerta to="avis">{tx.demoNotaAvis}</Alerta>
          {tiquet.linies.map((linia) => (
            <p key={linia.id}>
              {`${linia.quantitat} × ${linia.nom}${linia.detall ? ` (${linia.detall})` : ''} — ${linia.valor}`}
            </p>
          ))}
          {tiquet.resum.map((fila) => (
            <p key={fila.etiqueta}>{`${fila.etiqueta}: ${fila.valor}`}</p>
          ))}
          {tiquet.total ? <p>{tx.totalNota(tiquet.total.valor)}</p> : null}
        </Pila>
      </Dialeg>
    </>
  );
}
