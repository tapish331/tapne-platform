// Minimal PostCSS config for Tailwind (placeholder for T15)
// Tolerant PostCSS config for tests: if plugins are not installed, degrade to empty.
function safeRequire(name) {
  try {
    return require(name);
  } catch (
    /** @type {any} */ _
  ) {
    return null;
  }
}

const tailwind = safeRequire('tailwindcss');
const autoprefixer = safeRequire('autoprefixer');

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: Object.fromEntries(
    [
      tailwind && ['tailwindcss', tailwind],
      autoprefixer && ['autoprefixer', autoprefixer],
    ].filter(Boolean)
  ),
};
