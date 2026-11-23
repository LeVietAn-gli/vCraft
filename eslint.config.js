import js from '@eslint/js'
import globals from 'globals'
import hooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['**/dist/**'] },
  js.configs.recommended,
  {
    files: ['backend/**/*.js', 'frontend/vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]' }],
    },
  },
]
