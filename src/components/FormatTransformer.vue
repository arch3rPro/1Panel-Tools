<script setup lang="ts">
import _ from 'lodash';
import { Base64 } from 'js-base64';
import type { UseValidationRule } from '@/composable/validation';
import CInputText from '@/ui/c-input-text/c-input-text.vue';
import { useDownloadFileFromBase64 } from '@/composable/downloadBase64';
import { translate as t } from '@/plugins/i18n.plugin';

const props = withDefaults(
  defineProps<{
    transformer?: (v: string) => string
    inputValidationRules?: UseValidationRule<string>[]
    inputLabel?: string
    inputPlaceholder?: string
    inputDefault?: string
    outputLabel?: string
    outputLanguage?: string
    downloadFileName?: string
    downloadButtonText?: string
    rows?: number
  }>(),
  {
    transformer: _.identity,
    inputValidationRules: () => [],
    inputLabel: t('formatTransformer.input'),
    inputDefault: '',
    inputPlaceholder: t('formatTransformer.input-placeholder'),
    outputLabel: t('formatTransformer.output'),
    outputLanguage: '',
    downloadFileName: '',
    downloadButtonText: t('formatTransformer.download'),
    rows: 15,
  },
);

const {
  transformer, inputValidationRules, inputLabel, outputLabel, outputLanguage,
  inputPlaceholder, inputDefault, downloadFileName, downloadButtonText, rows,
} = toRefs(props);

const inputElement = ref<typeof CInputText>();

const input = ref(inputDefault.value);
const output = computed(() => transformer.value(input.value));

const outputBase64 = computed(() => Base64.encode(output.value));
const { download } = useDownloadFileFromBase64(
  {
    source: outputBase64,
    filename: downloadFileName,
  });
</script>

<template>
  <CInputText
    ref="inputElement"
    v-model:value="input"
    :placeholder="inputPlaceholder"
    :label="inputLabel"
    :rows="rows"
    autosize
    raw-text
    multiline
    test-id="input"
    :validation-rules="inputValidationRules"
    monospace
    mb-1
  />

  <div overflow-auto>
    <div mb-5px>
      {{ outputLabel }}
    </div>
    <textarea-copyable :value="output" :language="outputLanguage" :follow-height-of="inputElement?.inputWrapperRef" />

    <div v-if="downloadFileName !== '' && output !== ''" mt-5 flex justify-center>
      <c-button secondary @click="download">
        {{ downloadButtonText }}
      </c-button>
    </div>
  </div>
</template>
