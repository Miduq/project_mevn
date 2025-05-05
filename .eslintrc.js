module.exports = {
  root: true, // Evita que busque configuraciones en carpetas superiores
  env: {
    node: true, // Entorno Node.js
    es2021: true, // Soporte para sintaxis moderna de JS (puedes poner 'latest' o 2022)
  },
  extends: [
    'eslint:recommended', // Reglas básicas recomendadas por ESLint
  ],
  parserOptions: {
    ecmaVersion: 'latest', // Usar el parser estándar de ESLint para JS moderno
  },
  // NO especificamos 'parser: "@babel/eslint-parser"'
  // NO necesitamos 'requireConfigFile: false' porque no usamos el parser de Babel
  rules: {
    // Puedes añadir o modificar reglas aquí si quieres
    'no-unused-vars': 'warn', // Avisa de variables no usadas (útil)
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Permite console en desarrollo
    // ...otras reglas...
  },
};
