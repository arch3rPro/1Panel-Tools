<script setup lang="ts">
import _ from 'lodash';
import { useHead } from '@vueuse/head';
import { useToolStore } from '@/tools/tools.store';

const toolStore = useToolStore();

const desc = 'Collection of handy online tools for developers, with great UX. IT Tools is a free and open-source collection of handy online tools for developers & people working in IT.';
const title = 'About - IT Tools';
useHead({
  title,
  meta: [
    {
      itemprop: 'name',
      content: title,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'twitter:title',
      content: title,
    },
    {
      name: 'description',
      content: desc,
    },
    {
      itemprop: 'description',
      content: desc,
    },
    {
      property: 'og:description',
      content: desc,
    },
    {
      property: 'twitter:description',
      content: desc,
    },
  ],
});

const orderedTools = computed(() => _.orderBy(toolStore.tools, ['category', 'name'], ['asc', 'asc']));
</script>

<template>
  <c-markdown :markdown="$t('about.content-fork')" mx-auto mt-50px />

  <n-card :title="$t('about.alltools-title', { toolsCount: toolStore.tools.length })" mx-auto mt-50px>
    <n-table>
      <thead>
        <tr>
          <th>
            {{ $t('about.tools.category') }}
          </th>
          <th>
            {{ $t('about.tools.name') }}
          </th>
          <th>
            {{ $t('about.tools.desc') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(tool, ix) in orderedTools" :key="ix">
          <td>
            {{ tool.category }}
          </td>
          <td>
            <router-link :to="tool.path" class="decoration-none" target="_blank">
              {{ tool.name }}
            </router-link>
          </td>
          <td>
            {{ tool.description }}
          </td>
        </tr>
      </tbody>
    </n-table>
  </n-card>
</template>
