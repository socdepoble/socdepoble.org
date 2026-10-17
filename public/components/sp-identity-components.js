/**
 * SP-IDENTITY-COMPONENTS.JS
 * Font única de veritat per a la identitat visual de Sóc de Poble.
 */

// ---------------------------------------------------------------
// 1. FONT ÚNICA DE VERITAT (l'única cosa que s'edita quan canvia l'avatar)
// ---------------------------------------------------------------
/* Gauntlet 261016 (Bloc -1) · La ruta canònica de la foto de la persona
   pilot, la mateixa de PERSONA_PILOT.avatar (src/data/identitatsSeed.js, que
   la llig del catàleg d'agents). Este fitxer es servix tal qual des de
   public/ i no pot importar la llavor: la prova identitatDual.guarda.test.js
   fixa que les dues rutes són iguals. */
export const SP_IDENTITY = {
  avatarUrl: '/assets/fotos/javi-llinares-perfil-1200px.jpg',
  avatarAlt: 'Perfil Javi',
  displayName: 'Javi Llinares',
  role: 'La Torre de les Maçanes',
};

const IDENTITY_EVENT = 'sp-identity-changed';

/**
 * Canvia l'avatar (o qualsevol camp) en calent i notifica tots els
 * components ja renderitzats a la pàgina, sense recarregar.
 */
export function setIdentity(patch) {
  Object.assign(SP_IDENTITY, patch);
  document.dispatchEvent(new CustomEvent(IDENTITY_EVENT));
}

// ---------------------------------------------------------------
// 2. <sp-top-bar> — Barra Superior Negra (arrel de navegació)
// ---------------------------------------------------------------
class SpTopBar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this._onChange = () => this.render();
    document.addEventListener(IDENTITY_EVENT, this._onChange);
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener(IDENTITY_EVENT, this._onChange);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        header {
          height: 56px;
          background: var(--sp-black-100, #000000);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .brand-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          height: 44px;
          width: auto;
          object-fit: contain;
        }
        .brand-text {
          color: var(--sp-white-100, #ffffff);
          font-weight: 700;
          font-size: 1rem;
        }
        .icons-container {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .icon-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        .icon-btn svg {
          width: 20px;
          height: 20px;
        }
        @media (max-width: 600px) {
          .icon-btn { display: none; }
          .icon-btn.mobile-visible { display: flex; }
        }
      </style>
      <header>
        <div class="brand-container">
          <a href="/xat" style="text-decoration: none; display: flex; align-items: center;">
            <img src="/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png" alt="Sóc de Poble" class="logo" style="cursor: pointer;">
          </a>
          <span class="brand-text"><slot name="brand"></slot></span>
        </div>
        <div class="icons-container">
          <button class="icon-btn" aria-label="Web"><i data-lucide="globe"></i></button>
          <button class="icon-btn" aria-label="Accessibilitat">
            <svg height="24" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" version="1.1" viewBox="0 0 378 378" width="24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1,0,0,1,-90.708661,-207.874016)"><g><g transform="matrix(24.691498,0,0,24.691498,-12199.825444,-16336.661576)"><path d="M510.274,677.289L509.67,674.885C509.67,674.885 509.633,674.691 509.448,674.582C509.264,674.473 507.403,673.364 507.403,673.364C507.323,673.317 507.236,673.29 507.15,673.279C507.132,673.275 507.114,673.272 507.096,673.272L506.81,673.272C506.812,673.268 506.814,673.263 506.818,673.258C507.047,672.996 507.186,672.653 507.186,672.277C507.186,671.772 506.935,671.325 506.551,671.055C506.522,671.035 506.505,670.993 506.508,670.958C506.511,670.93 506.513,670.9 506.513,670.871C506.513,670.417 506.145,670.05 505.691,670.05C505.238,670.05 504.87,670.418 504.87,670.871C504.87,670.9 504.872,670.93 504.875,670.958C504.879,670.993 504.861,671.035 504.832,671.055C504.448,671.325 504.197,671.772 504.197,672.277C504.197,672.653 504.336,672.996 504.565,673.258C504.569,673.263 504.571,673.268 504.574,673.272L504.179,673.272C504.131,673.272 504.087,673.287 504.048,673.308C504.007,673.323 504.966,673.341 503.928,673.364L503.841,673.417L502.505,674.211C502.505,674.211 501.951,674.535 501.838,674.608C501.707,674.693 501.672,674.841 501.672,674.841L501.181,676.792C500.865,676.936 500.72,677.175 500.72,677.175C500.539,677.456 500.541,677.791 500.541,677.791L500.541,684.983C500.541,684.983 500.549,685.27 500.855,685.27C501.16,685.27 501.183,685.006 501.183,685.006C501.183,685.006 501.188,677.967 501.195,677.883L501.195,677.875C501.28,677.975 501.395,678.05 501.531,678.084C501.585,678.097 501.639,678.104 501.692,678.104C501.975,678.104 502.233,677.918 502.317,677.637C502.342,677.706 502.359,677.818 502.39,677.988C502.437,678.243 503.006,678.327 502.992,677.881C502.977,677.434 502.818,677.252 502.616,676.983C502.59,676.947 502.556,676.915 502.518,676.885C502.515,676.883 502.513,676.881 502.511,676.879L502.829,675.614L502.85,675.531L502.893,675.505L503.672,675.042L503.491,676.155L503.229,677.765L502.609,681.571C502.609,681.716 502.726,681.833 502.871,681.833L503.81,681.833L503.81,684.701C503.81,684.802 503.835,684.898 503.875,684.983C503.981,685.203 504.204,685.357 504.465,685.357C504.761,685.357 505.008,685.159 505.089,684.89C505.107,684.83 505.12,684.767 505.12,684.701L505.12,681.833L506.185,681.833L506.185,684.701C506.185,684.709 506.187,684.716 506.187,684.723C506.199,685.075 506.486,685.357 506.84,685.357C507.06,685.357 507.255,685.247 507.373,685.08C507.449,684.972 507.495,684.843 507.495,684.701L507.495,681.833L508.439,681.833C508.584,681.833 508.701,681.716 508.701,681.571L508.321,679.296L507.605,675.009L508.481,675.531L509.005,677.609C509.05,677.79 509.168,677.934 509.32,678.02C509.416,678.074 509.525,678.104 509.64,678.104C509.692,678.104 509.746,678.097 509.799,678.084C510.15,677.996 510.363,677.64 510.274,677.289" style="fill:currentColor;fill-rule:nonzero;"></path></g></g></g></svg>
          </button>
          <button class="icon-btn" aria-label="Cercador"><i data-lucide="search"></i></button>
          <button class="icon-btn" aria-label="Tema fosc"><i data-lucide="moon"></i></button>
          <button class="icon-btn mobile-visible" aria-label="Perfil">
            <img src="${SP_IDENTITY.avatarUrl}" alt="${SP_IDENTITY.avatarAlt}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
          </button>
        </div>
      </header>
    `;

    // Renderitzar icones Lucide dins l'Shadow DOM
    if (window.lucide) {
      window.lucide.createIcons({ root: this.shadowRoot });
    }
  }
}

// ---------------------------------------------------------------
// 3. <uc-caputxa> — Targeta taronja d'Autor
// ---------------------------------------------------------------
class UcCaputxa extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this._onChange = () => this.render();
    document.addEventListener(IDENTITY_EVENT, this._onChange);
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener(IDENTITY_EVENT, this._onChange);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .caputxa {
          background: var(--sp-orange-100, #FF7300);
          color: var(--sp-black-100, #000000); 
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 56px;
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .left-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .meta { 
          display: flex; 
          flex-direction: column; 
          justify-content: center;
        }
        .nom { 
          font-weight: 700; 
          font-size: 15px; 
          line-height: 1.1; 
        }
        .rol { 
          font-size: 13px; 
          opacity: 0.8; 
          line-height: 1.1; 
        }
        ::slotted([slot="right"]) {
          font-size: 13px;
        }
      </style>
      <div class="caputxa">
        <div class="left-content">
          <img class="avatar" src="${SP_IDENTITY.avatarUrl}" alt="${SP_IDENTITY.avatarAlt}">
          <div class="meta">
            <span class="nom">${SP_IDENTITY.displayName}</span>
            <span class="rol">${SP_IDENTITY.role}</span>
          </div>
        </div>
        <slot name="right"></slot>
      </div>
    `;
  }
}

customElements.define('sp-top-bar', SpTopBar);
customElements.define('uc-caputxa', UcCaputxa);
