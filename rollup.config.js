import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'cjs',
  dest: 'dist/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  onwarn: warning => {
    if (/external dependency/.test(warning.message)) return;
    console.warn(warning.message);
  }
};
