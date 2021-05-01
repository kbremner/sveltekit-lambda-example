import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/lambda.ts',
  output: {
    file: 'files/lambda.cjs',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve()],
  external: ['./app.cjs', ...require('module').builtinModules],
};
