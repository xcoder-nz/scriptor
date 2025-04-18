const { FlatCompat } = require('@eslint/eslintrc');
const js              = require('@eslint/js');
const globals         = require('globals');
const pluginJest      = require('eslint-plugin-jest');    // ← add this
const path            = require('path');


// 1) Initialize FlatCompat with the core configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig:       js.configs.all,
});

module.exports = [
  // 2) Global ignores: this object has *only* ignores → applies to all files
  { 
    ignores: [
      'eslint.config.cjs',
      'jest.config.js',
      'examples/**',
      'tests/integration/setupNock.js'
    ]
  },

  // 3) Node.js globals + disable no-require & no-undef in JS/CJS
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.configs['flat/recommended'].globals, // or `.environments.globals`
      parserOptions: { ecmaVersion: 2023, sourceType: 'module' }
    },
    ...pluginJest.configs['flat/recommended'],               // spreads rule definitions
  },

  // 4) Jest plugin + globals for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: { jest: pluginJest },  
    languageOptions: {
      globals: pluginJest.configs['flat/recommended'].globals, // Jest’s describe/it/etc. :contentReference[oaicite:3]{index=3}
      parserOptions: { ecmaVersion: 2023, sourceType: 'module' }
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/valid-expect':      'error'
    },
  },

  // 5) Core ESLint + TS‑plugin recommended rules
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ),

  // 6) TS parser + your overrides
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project:   [path.resolve(__dirname, 'tsconfig.json')],
        sourceType:'module',
        ecmaVersion:2023
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      // your TS rule overrides here
    },
  },
];
