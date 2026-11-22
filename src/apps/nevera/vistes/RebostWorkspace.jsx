import { useMemo } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Accions, Boto } from '../../../components/PedraSeca/index.js';
import {
  CatalegWorkspace,
  DetallCataleg,
  declaraNivellInicialEspai,
  declaraVistaPerDefecteEspai
} from '../../../components/universal/workspace/index.js';
import { useApp } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { nomLlistaVisible } from '../mercadona.js';
import { autoriaDArticle } from './autoria.js';
import { AvisNevera } from './AvisNevera.jsx';
import { useVistaNevera } from './context.js';
import { textosCasa } from './vestits.js';
import { modelRebostWorkspace } from './modelRebostWorkspace.js';

const ID_REBOST_WORKSPACE = 'nevera-rebost-p069';
/* Onada R32.26 · IDEA-303 · En pantalla estreta, el Rebost obri directament la
   graella d'aliments ('middle' + 'rajola') en lloc del calaix fosc de carpetes. */
declaraNivellInicialEspai(ID_REBOST_WORKSPACE, 'middle');
declaraVistaPerDefecteEspai(ID_REBOST_WORKSPACE, 'rajola');

export function RebostWorkspace({ params = {} }) {
  const { idioma: idiomaApp = 'ca' } = useApp();
  const { estat, accions, llistaVigent, ruta, llegit, mode, idioma = idiomaApp } = useVistaNevera();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const txCasa = textosCasa(idioma);
  const model = useMemo(() => modelRebostWorkspace(estat, idioma), [estat, idioma]);
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
  const potEscriure = llegit && mode !== 'lectora';
  const renderDetail = ({ item }) => {
    const article = item?.dades;
    const aCasa = article ? estat.casa.find(entrada => entrada.articleId === article.id) : null;
    const aLaLlista = article ? llista.linies.some(linia => linia.articleId === article.id) : false;
    return <DetallCataleg title={item?.title || tx.rebost} subtitle={item?.subtitle || tx.laNeveraDeCasa}
      lead={item?.lead || tx.rebostLead}
      author={article ? autoriaDArticle(article) : null} rellotgeViu showShare={false} showConnect={false} showComment={false}>
      <Accions role="group" aria-label={tx.laNeveraDeCasa}>
        <Link to={ruta('llista', llista.id)}>{tx.obriLaCompra(nomLlista)}</Link>
        <Link to={ruta('casa', llista.id)}>{tx.queTincACasa}</Link>
      </Accions>
      <AvisNevera sempre />
      {article ? <>
        <h3>{tx.elTeuRebost}</h3>
        <p>{aCasa ? txCasa[aCasa.estat] : tx.noMarcatACasa}</p>
        <Accions role="group" aria-label={tx.elTeuRebost}>
          {Object.entries(txCasa).map(([valor, etiqueta]) => <Boto key={valor} disabled={!potEscriure}
            aria-pressed={aCasa?.estat === valor} onClick={() => accions.marcaACasa(article.id, valor)}>{etiqueta}</Boto>)}
          {aCasa && <Boto disabled={!potEscriure} onClick={() => accions.marcaACasa(article.id, null)}>{tx.deixaDeSeguirlo}</Boto>}
          <Boto disabled={!potEscriure || aLaLlista} onClick={() => accions.afig(llista.id, article.id)}>
            {aLaLlista ? tx.jaEsALlistaNom(nomLlista) : tx.afigALlistaNom(nomLlista)}
          </Boto>
        </Accions>
        <h3>{tx.infoProducteTitol}</h3>
        <p>{tx.infoProducteText}</p>
      </> : <><h3>{tx.catalegICarpetes}</h3><p>{tx.catalegICarpetesText}</p></>}
    </DetallCataleg>;
  };
  /* v1.2.17 · Gauntlet R1 (L3-15) · El mateix id que declaren el nivell i la vista inicials. */
  return <CatalegWorkspace font="nevera" destiPublicacio="rebost" id={ID_REBOST_WORKSPACE} model={model} ruta={ruta('rebost')} privateItems
    labels={{ categories: tx.categoriesDelRebost, items: tx.rebost, all: tx.totElCataleg, search: tx.buscaAlRebost, empty: txBuit.rebostEmpty, noResults: txBuit.rebostNoResults }}
    renderDetail={renderDetail} />;
}
