import { MAXIM_USERNAME } from './onboardingModel.js';
/* P1-68 (pla 261028_1526, Bloc H) · Els dos camps de l'alta (/registre):
   l'identificador, que seguix el nom fins que la persona el toca, i el
   poble, amb La Torre de les Maçanes triat de sèrie. El mateix marcatge que
   la resta de camps del formulari d'OnboardingSteps (els noms dels camps
   són els de `fields`: username i poble). Viuen en este fitxer, a banda
   d'OnboardingSteps (que no ha de créixer en divs), amb les claus i18n de la
   resta de l'alta; el bloc del perfil és IdentitatAlPoble.jsx. */
export function CampsDIdentitatALAlta({ t, error, usuari, poble, pobles = [], onChange, desactivat = false }) {
  return (
    <>
      <div className={error ? 'sdp-camp ' : 'sdp-camp'}>
        <label className="sdp-camp__etiqueta" htmlFor="reg-username">{t('section.login.registre.usuari', 'El teu identificador')}</label>
        <input
          id="reg-username"
          className="sdp-control"
          type="text"
          name="username"
          value={usuari}
          onChange={onChange}
          autoComplete="nickname"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={MAXIM_USERNAME}
          aria-invalid={Boolean(error)}
          aria-describedby="onboarding-username-help"
          disabled={desactivat}
        />
        <p id="onboarding-username-help" className={error ? 'sdp-camp__error' : 'sdp-camp__ajuda'}>
          {error || t('section.login.registre.ajudaUsuari', 'Es fa amb el teu nom i es veu amb una @ davant si el teu perfil és públic. Si ja és d’algú, hi afegirem -2.')}
        </p>
      </div>
      {pobles.length ? (
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor="reg-poble">{t('section.login.registre.poble', 'El teu poble')}</label>
          <select
            id="reg-poble"
            className="sdp-control sdp-control--selector"
            name="poble"
            value={poble}
            onChange={onChange}
            aria-describedby="onboarding-poble-help"
            disabled={desactivat}
          >
            {poble ? null : <option value="">{t('section.login.registre.triaPoble', 'Tria un poble…')}</option>}
            {pobles.map((nom) => <option key={nom} value={nom}>{nom}</option>)}
          </select>
          <p id="onboarding-poble-help" className="sdp-camp__ajuda">{t('section.login.registre.ajudaPoble', 'Si n’ets de més d’un, els altres es trien al teu perfil.')}</p>
        </div>
      ) : null}
    </>
  );
}
