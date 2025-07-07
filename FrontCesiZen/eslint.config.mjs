import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      // Désactiver les apostrophes non échappées (problématique avec le français)
      'react/no-unescaped-entities': 'off',
      
      // Assouplir les règles TypeScript
      '@typescript-eslint/no-unused-vars': 'warn', // warning au lieu d'erreur
      '@typescript-eslint/no-explicit-any': 'warn', // warning au lieu d'erreur
      
      // Assouplir les règles de const/let
      'prefer-const': 'warn',
      
      // Assouplir les règles des hooks React
      'react-hooks/exhaustive-deps': 'warn',
      
      // Désactiver les warnings d'images Next.js (garde la flexibilité)
      '@next/next/no-img-element': 'warn',
      
      // Désactiver les liens HTML Next.js si nécessaire
      '@next/next/no-html-link-for-pages': 'warn',
    },
  }),
];

export default eslintConfig;
