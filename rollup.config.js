import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import terser from '@rollup/plugin-terser';

import packageJson from './package.json' with { type: 'json' };

const isProduction = process.env.NODE_ENV === 'production';

const createConfig = (input, outputName) => ({
  input,
  output: [
    {
      file: `dist/${outputName}.js`,
      format: 'cjs',
      sourcemap: !isProduction,
      compact: isProduction,
    },
    {
      file: `dist/${outputName}.esm.js`,
      format: 'esm',
      sourcemap: !isProduction,
      compact: isProduction,
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true,
      dedupe: ['tslib'],
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: !isProduction,
    }),
    ...(isProduction ? [terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        dead_code: true,
        unused: true,
        side_effects: false,
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        conditionals: true,
        evaluate: true,
        booleans: true,
        loops: true,
        sequences: true,
        properties: true,
        comparisons: true,
        typeofs: true,
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        negate_iife: true,
        pure_getters: true,
        reduce_funcs: true,
        inline: 3,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: false,
        toplevel: true,
        module: true
      },
      mangle: {
        properties: {
          regex: /^_/
        },
        toplevel: true,
        eval: true,
        keep_fnames: false,
        reserved: []
      },
      format: {
        comments: false,
        beautify: false,
        ascii_only: true,
        keep_quoted_props: false,
        wrap_iife: false,
        wrap_func_args: false,
        semicolons: true,
        shebang: false,
        webkit: false,
        width: 80,
        max_line_len: 80,
        indent_level: 0,
        indent_start: 0,
        inline_script: false,
        keep_numbers: false,
        preamble: null,
        quote_style: 0,
        preserve_annotations: false,
        safari10: false
      }
    })] : []),
  ],
  external: ['@trpc/server', 'express', 'fastify', 'hono'],
});

export default [
  // Main bundle (everything) - optimized for production
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: !isProduction,
        compact: isProduction,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: !isProduction,
        compact: isProduction,
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true,
        dedupe: ['tslib'],
      }),
      commonjs({
        include: /node_modules/,
        transformMixedEsModules: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: !isProduction,
      }),
      ...(isProduction ? [terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          dead_code: true,
          unused: true,
          side_effects: false,
          passes: 3,
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          sequences: true,
          properties: true,
          comparisons: true,
          typeofs: true,
          collapse_vars: true,
          reduce_vars: true,
          hoist_funs: true,
          hoist_vars: true,
          if_return: true,
          join_vars: true,
          negate_iife: true,
          pure_getters: true,
          reduce_funcs: true,
          inline: 3,
          keep_fargs: false,
          keep_fnames: false,
          keep_infinity: false,
          toplevel: true,
          module: true
        },
        mangle: {
          properties: {
            regex: /^_/
          },
          toplevel: true,
          eval: true,
          keep_fnames: false,
          reserved: []
        },
        format: {
          comments: false,
          beautify: false,
          ascii_only: true,
          keep_quoted_props: false,
          wrap_iife: false,
          wrap_func_args: false,
          semicolons: true,
          shebang: false,
          webkit: false,
          width: 80,
          max_line_len: 80,
          indent_level: 0,
          indent_start: 0,
          inline_script: false,
          keep_numbers: false,
          preamble: null,
          quote_style: 0,
          preserve_annotations: false,
          safari10: false
        }
      })] : []),
      ...(isProduction ? [] : [visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })]),
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