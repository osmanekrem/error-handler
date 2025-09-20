import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

import packageJson from './package.json' with { type: 'json' };

const createConfig = (input, outputName) => ({
  input,
  output: [
    {
      file: `dist/${outputName}.js`,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: `dist/${outputName}.esm.js`,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
  external: ['@trpc/server', 'express', 'fastify', 'hono'],
});

export default [
  // Main bundle (everything)
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    external: ['@trpc/server', 'express', 'fastify', 'hono'],
  },
  // Modular bundles
  createConfig('src/core.ts', 'core'),
  createConfig('src/factories.ts', 'factories'),
  createConfig('src/express.ts', 'express'),
  createConfig('src/hono.ts', 'hono'),
  createConfig('src/fastify.ts', 'fastify'),
  createConfig('src/patterns.ts', 'patterns'),
  createConfig('src/metrics.ts', 'metrics'),
  createConfig('src/cache.ts', 'cache'),
  // Type definitions
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
