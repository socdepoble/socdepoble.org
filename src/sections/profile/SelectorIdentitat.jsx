import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { Avatar, Dropdown, DropdownItem } from '../../components/PedraSeca';

const ROL = Object.freeze({ owner: 'Propietari', admin: 'Administra' });

/**
 * Amb quina identitat actua la persona (ella o una organització on mana).
 * Viu a la barra taronja de l'Editor Universal (identityActions de
 * DocumentEditor), a la fitxa del Perfil. La identitat triada ací és la que
 * signa el que es publica al Mur, també les notes del Bloc, que no porten
 * selector propi (el Bloc de Notes no es toca, per ordre del Mestre).
 *
 * Només depén d'IdentitatContext i de Pedra Seca. Els estils són a
 * PerfilShell.css, que index.css carrega sempre.
 *
 * El disparador NO és un <button>: el Dropdown de Pedra Seca ja l'embolcalla
 * amb un div role="button" i un botó dins d'un altre no és vàlid. Tot el
 * nom accessible va en text per al lector; l'avatar és decoració, perquè
 * el seu nom (alt + text ocult) es llegiria dues vegades.
 */
export function SelectorIdentitat() {
  const { identitats = [], actor, setActor } = useIdentitat();
  if (identitats.length < 2) return null;

  const nomActor = actor?.nom || 'tu';
  return (
    <Dropdown
      right
      className="perfil-selector"
      minWidth="280px"
      trigger={(
        <span className="btn-icon-orange" title="Canviar identitat">
          <span className="sdp-nomes-lector">{`Canviar identitat. Ara actues com a ${nomActor}`}</span>
          <span aria-hidden="true">
            <Avatar nom={actor?.nom} src={actor?.avatar} mida="xs" />
          </span>
        </span>
      )}
    >
      {identitats.map((identitat) => {
        const rol = identitat.tipus === 'entitat' ? ROL[identitat.rol] || identitat.rol : null;
        return (
          <DropdownItem
            key={`${identitat.tipus}:${identitat.id}`}
            /* Només la classe que té regla (PerfilShell.css): una classe sense
               estils és deute per a la porta de Pedra Seca. */
            className={identitat.activa ? 'perfil-selector__opcio--activa' : undefined}
            onClick={() => setActor(identitat.tipus, identitat.id)}
            icon={(
              <span aria-hidden="true">
                <Avatar nom={identitat.nom} src={identitat.avatar} mida="xs" />
              </span>
            )}
          >
            <span>{rol ? `${identitat.nom} · ${rol}` : identitat.nom}</span>
            {identitat.activa ? <span className="sdp-nomes-lector">, identitat activa</span> : null}
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}

export default SelectorIdentitat;
