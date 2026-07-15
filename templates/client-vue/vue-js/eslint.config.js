import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,mjs,jsx,vue}'],
    extends: [
      js.configs.recommended,
      pluginVue.configs['flat/essential'],
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
