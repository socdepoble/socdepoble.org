/**
 * Saber.jsx — el diccionari i la guia.
 *
 *   /diccionari(/:entitat)   mig: les entitats · detall: els seus camps (la taula del diccionari.js)
 *   /guia(/:apartat)         mig: els apartats · detall: el text
 * El diccionari de la pantalla és el mateix que va a la fulla «Diccionari» de l'XLSX.
 */
import { LlistaArticles, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { ENTITATS } from '../nucli/diccionari.js';
import { textValorsAdmesos } from '../nucli/full.js';
import { APARTATS_GUIA, FINALITAT } from '../textos.js';
import { MarcSalut, useNavegaSalut, useTextosSalut } from './comunes.jsx';

export function Entitats({ params }) {
  const navega = useNavegaSalut();
  const tx = useTextosSalut();
  const articles = ENTITATS.map((entitat) => ({
    id: entitat.id, nom: entitat.nom, secundari: entitat.definicio, categoriaId: 'diccionari', estat: params?.entitat === entitat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol={tx.diccionari} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.queSApunta} textos={{ 'en-colleccio': tx.obert }} onTria={(article) => navega(['diccionari', article.id])} />
    </MarcSalut>
  );
}

export function CampsEntitat({ params }) {
  const tx = useTextosSalut();
  const entitat = ENTITATS.find((candidata) => candidata.id === params?.entitat);
  if (!entitat) {
    return (
      <MarcSalut titol={tx.diccionari}>
        <Pila gap={4}>
          <p>{tx.diccionariIntro}</p>
          <p>{FINALITAT}</p>
        </Pila>
      </MarcSalut>
    );
  }
  return (
    <MarcSalut titol={entitat.nom}>
      <Pila gap={4}>
        <p>{entitat.definicio}</p>
        <Taula titol={tx.campsDe(entitat.nom)}>
          <thead>
            <tr><th scope="col">{tx.camp}</th><th scope="col">{tx.valors}</th><th scope="col">{tx.queEs}</th><th scope="col">{tx.perQueImporta}</th></tr>
          </thead>
          <tbody>
            {entitat.camps.map((camp) => (
              <tr key={camp.clau}>
                <th scope="row">{camp.etiqueta}</th>
                <td>{textValorsAdmesos(camp) || '—'}</td>
                <td>{camp.definicio}</td>
                <td>{camp.perQueImporta}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </Pila>
    </MarcSalut>
  );
}

export function ApartatsGuia({ params }) {
  const navega = useNavegaSalut();
  const tx = useTextosSalut();
  const articles = APARTATS_GUIA.map((apartat) => ({
    id: apartat.id, nom: apartat.titol, categoriaId: 'guia', estat: params?.apartat === apartat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol={tx.guia} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.apartatsGuia} textos={{ 'en-colleccio': tx.obert }} onTria={(article) => navega(['guia', article.id])} />
    </MarcSalut>
  );
}

export function TextGuia({ params }) {
  const apartat = APARTATS_GUIA.find((candidat) => candidat.id === params?.apartat) || APARTATS_GUIA[0];
  return (
    <MarcSalut titol={apartat.titol}>
      <Pila gap={4}>
        {apartat.paragrafs.map((paragraf) => <p key={paragraf}>{paragraf}</p>)}
      </Pila>
    </MarcSalut>
  );
}
