import { useMemo } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Accions, Boto } from '../../../components/PedraSeca/index.js';
import { CatalegWorkspace, DetallCataleg } from '../../../components/universal/workspace/index.js';
import { useApp } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { autoriaDArticle } from './autoria.js';
import { AvisNevera } from './AvisNevera.jsx';
import { useVistaNevera } from './context.js';
import { TEXTOS_CASA } from './vestits.js';
import { modelRebostWorkspace } from './modelRebostWorkspace.js';

export function RebostWorkspace({ params = {} }) {
  const { idioma = 'ca' } = useApp();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const { estat, accions, llistaVigent, ruta, llegit, mode } = useVistaNevera();
  const model = useMemo(() => modelRebostWorkspace(estat), [estat]);
  const llista = llistaVigent(params);
  const potEscriure = llegit && mode !== 'lectora';
  const renderDetail = ({ item }) => {
    const article = item?.dades;
    const aCasa = article ? estat.casa.find(entrada => entrada.articleId === article.id) : null;
    const aLaLlista = article ? llista.linies.some(linia => linia.articleId === article.id) : false;
    return <DetallCataleg title={item?.title || tx.rebost} subtitle={item?.subtitle || tx.laNeveraDeCasa}
      lead={item?.lead || tx.rebostLead}
      author={article ? autoriaDArticle(article) : null} rellotgeViu showShare={false} showConnect={false} showComment={false}>
      <Accions>
        <Link to={ruta('llista', llista.id)}>{tx.obriLaCompra(llista.nom)}</Link>
        <Link to={ruta('casa', llista.id)}>{tx.queTincACasa}</Link>
      </Accions>
      <AvisNevera sempre />
      {article ? <>
        <h3>{tx.elTeuRebost}</h3>
        <p>{aCasa ? TEXTOS_CASA[aCasa.estat] : tx.noMarcatACasa}</p>
        <Accions>
          {Object.entries(TEXTOS_CASA).map(([valor, etiqueta]) => <Boto key={valor} disabled={!potEscriure}
            aria-pressed={aCasa?.estat === valor} onClick={() => accions.marcaACasa(article.id, valor)}>{etiqueta}</Boto>)}
          {aCasa && <Boto disabled={!potEscriure} onClick={() => accions.marcaACasa(article.id, null)}>{tx.deixaDeSeguirlo}</Boto>}
          <Boto disabled={!potEscriure || aLaLlista} onClick={() => accions.afig(llista.id, article.id)}>
            {aLaLlista ? tx.jaEsALlistaNom(llista.nom) : tx.afigALlistaNom(llista.nom)}
          </Boto>
        </Accions>
        <h3>{tx.infoProducteTitol}</h3>
        <p>{tx.infoProducteText}</p>
      </> : <><h3>{tx.catalegICarpetes}</h3><p>{tx.catalegICarpetesText}</p></>}
    </DetallCataleg>;
  };
  return <CatalegWorkspace font="nevera" destiPublicacio="rebost" id="nevera-rebost-p069" model={model} ruta={ruta('rebost')} privateItems
    labels={{ categories: tx.categoriesDelRebost, items: tx.rebost, all: tx.totElCataleg, search: tx.buscaAlRebost, empty: txBuit.rebostEmpty, noResults: txBuit.rebostNoResults }}
    renderDetail={renderDetail} />;
}
