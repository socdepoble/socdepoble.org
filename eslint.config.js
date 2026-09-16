import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['warn', { 'varsIgnorePattern': '^React$' }],
      'no-unsafe-finally': 'off',
      'no-control-regex': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='className'] > Literal[value=/(^|\\s)(sdp-)?(p-[0-9]|m-[0-9]|mt-[0-9]|mb-[0-9]|pt-[0-9]|pb-[0-9]|px-[0-9]|py-[0-9]|mx-[0-9]|my-[0-9]|gap-[0-9]|bg-[a-z]+-[0-9]+|text-[a-z]+-[0-9]+|rounded|shadow)(\\s|$)/]",
          message: "🚫 PEDRA SECA: Està prohibit l'ús de classes visuals directes de Tailwind (colors, ombres, radis, marges numèrics). Usa exclusivament els tokens 'sdp-*' o classes semàntiques de Components Universals. Les utilitats de layout pur (flex, grid, absolute) estan permeses."
        }
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/supabase-js'],
              message: "Llei de l'Enxufabilitat: Les importacions de Supabase han d'estar aïllades en src/data/adaptadors/ o src/data/supabase/."
            }
          ]
        }
      ],
      'eol-last': ['error', 'always']
    },
  },
  {
    files: ['src/data/supabaseBackend.js', 'src/data/supabase/**/*.js', 'src/data/adaptadors/**/*.js'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  {
    files: ['tooling/wiki/**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }]
    }
  }
];
