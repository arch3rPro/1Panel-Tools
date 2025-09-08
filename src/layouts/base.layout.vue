<script lang="ts" setup>
import { computed } from 'vue';
import { Home2, Menu2 } from '@vicons/tabler';
import { NIcon, useThemeVars } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import HeroGradient from '../assets/hero-gradient.svg?component';
import MenuLayout from '../components/MenuLayout.vue';
import NavbarButtons from '../components/NavbarButtons.vue';
import CollapsibleToolMenu from '@/components/CollapsibleToolMenu.vue';
import CommandPalette from '@/modules/command-palette/command-palette.vue';
import LocaleSelector from '@/modules/i18n/components/locale-selector.vue';
import { config } from '@/config';
import { useStyleStore } from '@/stores/style.store';
import { useToolStore } from '@/tools/tools.store';
import type { ToolCategory } from '@/tools/tools.types';

const themeVars = useThemeVars();
const styleStore = useStyleStore();
const version = config.app.version;
const commitSha = config.app.lastCommitSha.slice(0, 7);

const { t } = useI18n();

const toolStore = useToolStore();
const { favoriteTools, toolsByCategory } = storeToRefs(toolStore);

const tools = computed<ToolCategory[]>(() => [
  ...(favoriteTools.value.length > 0 ? [{ name: t('tools.categories.favorite-tools'), components: favoriteTools.value }] : []),
  ...toolsByCategory.value,
]);
</script>

<template>
  <MenuLayout class="menu-layout" :class="{ isSmallScreen: styleStore.isSmallScreen }">
    <template #sider>
      <RouterLink to="/" class="hero-wrapper">
        <HeroGradient class="gradient" />
        <div class="text-wrapper">
          <div class="title">
            1Panel - Tools
          </div>
          <div class="divider" />
          <div class="subtitle">
            1Panel AppStore Creator
          </div>
        </div>
      </RouterLink>

      <div class="sider-content">
        <div class="sider-main">
          <div v-if="styleStore.isSmallScreen" flex flex-col items-center>
            <LocaleSelector w="90%" />

            <div flex justify-center>
              <NavbarButtons />
            </div>
          </div>

          <CollapsibleToolMenu :tools-by-category="tools" />
        </div>

        <div class="footer">
          <div>
            1Panel-Tools

            <c-link target="_blank" rel="noopener" href="https://github.com/arch3rPro/1Panel-Tools/releases/tag/v0.2.0">
              v0.2.0
            </c-link>

            <template v-if="commitSha && commitSha.length > 0">
              -
              <c-link
                target="_blank"
                rel="noopener"
                type="primary"
                :href="`https://github.com/arch3rPro/1Panel-Tools/tree/${commitSha}`"
              >
                {{ commitSha }}
              </c-link>
            </template>
          </div>
          <div>
            © {{ new Date().getFullYear() }}
            <c-link target="_blank" rel="noopener" href="https://arch3rpro.github.io/">
              arch3rPro
            </c-link>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div flex items-center justify-center gap-2>
        <c-button
          circle
          variant="text"
          :aria-label="$t('home.toggleMenu')"
          @click="styleStore.isMenuCollapsed = !styleStore.isMenuCollapsed"
        >
          <NIcon size="25" :component="Menu2" />
        </c-button>

        <c-tooltip :tooltip="$t('home.home')" position="bottom">
          <c-button to="/" circle variant="text" :aria-label="$t('home.home')">
            <NIcon size="25" :component="Home2" />
          </c-button>
        </c-tooltip>

        <CommandPalette />

        <LocaleSelector v-if="!styleStore.isSmallScreen" />

        <div>
          <NavbarButtons v-if="!styleStore.isSmallScreen" />
        </div>
      </div>
      <slot />
    </template>
  </MenuLayout>
</template>

<style lang="less" scoped>
// ::v-deep(.n-layout-scroll-container) {
//     @percent: 4%;
//     @position: 25px;
//     @size: 50px;
//     @color: #eeeeee25;
//     background-image: radial-gradient(@color @percent, transparent @percent),
//         radial-gradient(@color @percent, transparent @percent);
//     background-position: 0 0, @position @position;
//     background-size: @size @size;
// }

.support-button {
  background: rgb(37, 99, 108);
  background: linear-gradient(48deg, rgba(37, 99, 108, 1) 0%, rgba(59, 149, 111, 1) 60%, rgba(20, 160, 88, 1) 100%);
  color: #fff !important;
  transition: padding ease 0.2s !important;

  &:hover {
    color: #fff;
    padding-left: 30px;
    padding-right: 30px;
  }
}

.footer {
  text-align: center;
  color: #838587;
  padding: 20px 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: inherit;
}

.sider-content {
  padding-top: 20px;
  padding-bottom: 0;
  height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.sider-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 120px;
}

.hero-wrapper {
  position: sticky;
  display: flex;
  left: 0;
  z-index: 10;
  height: 150px;
  overflow: hidden;
  position: relative;

  .gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .text-wrapper {
    position: absolute;
    left: 0;
    width: 100%;
    text-align: center;
    top: 16px;
    color: #fff;

    .title {
      font-size: 25px;
      font-weight: 600;
    }

    .divider {
      width: 50px;
      height: 2px;
      border-radius: 4px;
      background-color: v-bind('themeVars.primaryColor');
      margin: 0 auto 5px;
    }

    .subtitle {
      font-size: 16px;
    }
  }
}
</style>
