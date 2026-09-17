import fs from 'node:fs';
import css from 'css';

const legatPath = 'src/css/legat.css';
const componentsPath = 'src/css/components.css';
const modulesPath = 'src/css/modules.css';
const basePath = 'src/css/base.css';

const zombies = [
  'avatar-group',
  'avatar-lg', 'avatar-md', 'avatar-xl', 'avatar-xs',
  'badge-danger', 'badge-default', 'badge-outline', 'badge-primary',
  'btn-create', 'btn-ghost', 'btn-icon--settings', 'btn-realitat',
  'chat-empty',
  'ctl-main-container', 'ctl-secondary-tools', 'ctl-section-lead', 'ctl-section-title', 'ctl-section-utilitats',
  'dropdown-container',
  'editor-scroll-area', 'editor-shell--main',
  'folder-item',
  'form-trellat', 'input-trellat',
  'hidden-on-mobile',
  'login-switcher',
  'mur-filter',
  'note-list'
];

const componentClasses = [
  'sp-card', 'btn', 'icon', 'badge', 'avatar', 'pill', 'page-btn', 'btn-icon'
];

const legatCode = fs.readFileSync(legatPath, 'utf8');
const ast = css.parse(legatCode, { source: legatPath });

const remainingRules = [];
const componentRules = [];
let reducedMotionRule = null;

for (const rule of ast.stylesheet.rules) {
  if (rule.type === 'media' && rule.media.includes('prefers-reduced-motion: reduce')) {
    reducedMotionRule = rule;
    continue;
  }
  
  if (rule.type === 'rule') {
    // Check if it's a zombie
    const isZombie = rule.selectors.some(sel => zombies.some(z => sel.includes('.' + z)));
    if (isZombie) continue;
    
    // Check if it's a component
    const isComponent = rule.selectors.some(sel => componentClasses.some(c => sel.includes('.' + c)));
    if (isComponent) {
      componentRules.push(rule);
      continue;
    }
  } else if (rule.type === 'media') {
    // For media rules, we have to look inside their rules
    let hasComponent = false;
    let hasZombie = false;
    
    if (rule.rules) {
      for (let i = rule.rules.length - 1; i >= 0; i--) {
        const childRule = rule.rules[i];
        if (childRule.type === 'rule') {
          const isZ = childRule.selectors.some(sel => zombies.some(z => sel.includes('.' + z)));
          if (isZ) { hasZombie = true; rule.rules.splice(i, 1); continue; }
          const isC = childRule.selectors.some(sel => componentClasses.some(c => sel.includes('.' + c)));
          if (isC) { hasComponent = true; }
        }
      }
    }
    
    if (hasComponent && !rule.rules.length) continue;
    if (hasComponent) {
      componentRules.push(rule);
      continue;
    }
  }
  
  remainingRules.push(rule);
}

// Write prefers-reduced-motion to base.css
if (reducedMotionRule) {
  const reducedCode = css.stringify({ type: 'stylesheet', stylesheet: { rules: [reducedMotionRule] } });
  fs.appendFileSync(basePath, '\n/* Migrat des de legat.css */\n' + reducedCode + '\n');
}

// Write component rules to components.css
if (componentRules.length > 0) {
  const compCode = css.stringify({ type: 'stylesheet', stylesheet: { rules: componentRules } });
  fs.appendFileSync(componentsPath, '\n/* Migrat des de legat.css */\n' + compCode + '\n');
}

// Write remaining rules to modules.css under @layer legacy
if (remainingRules.length > 0) {
  const remCode = css.stringify({ type: 'stylesheet', stylesheet: { rules: remainingRules } });
  fs.appendFileSync(modulesPath, '\n@layer legacy {\n' + remCode + '\n}\n');
}

console.log('CSS Migration successful!');
