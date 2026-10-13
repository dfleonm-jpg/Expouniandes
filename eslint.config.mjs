import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // La app inicializa deliberadamente cierto estado dentro de un efecto en
      // el PRIMER render del cliente (valores de localStorage, `window`,
      // `Date`, `crypto.randomUUID`, media queries...) para que el render del
      // servidor y el del cliente coincidan y no haya errores de hidratación.
      // Es un patrón correcto y buscado; la regla nueva del compilador de React
      // lo marca como error, así que lo bajamos a aviso para no romper el lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
