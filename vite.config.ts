import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Unocss from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import VueI18n from '@intlify/unplugin-vue-i18n/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: true,
      include: [resolve(__dirname, 'locales/**')],
      strictMessage: false,
      escapeHtml: true,
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
        'vue-i18n',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
      vueTemplate: true,
      dts: true,
    }),
    Icons({ compiler: 'vue3' }),
    vue(),
    svgLoader(),
    Components({
      dirs: ['src/'],
      extensions: ['vue'],
      include: [/\.vue$/, /\.vue\?vue/],
      resolvers: [NaiveUiResolver(), IconsResolver({ prefix: 'icon' })],
      dts: true,
    }),
    Unocss(),
    nodePolyfills({
      include: ['buffer', 'process', 'util'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    __VUEUSE_OPTIONS_API__: 'false',
    'import.meta.env.PACKAGE_VERSION': JSON.stringify('1.0.0'),
  },
  build: {
    target: 'esnext',
    minify: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'naive-ui'],
        },
      },
    },
  },
});
