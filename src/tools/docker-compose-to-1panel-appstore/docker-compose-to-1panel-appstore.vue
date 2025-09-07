<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDownloadFileFromBase64 } from '@/composable/downloadBase64';
import { textToBase64 } from '@/utils/base64';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import yaml from 'yaml';
import { Plus as IconPlus, Download as IconDownload } from '@vicons/tabler';

// 参数类型定义
interface AppParam {
  id: number;
  envKey: string;
  type: string;
  default: string;
  required: boolean;
  edit?: boolean;
  random?: boolean;
  label: {
    en: string;
    zh: string;
  };
  rule?: string;
  key?: string;
  values?: Array<{ label: string; value: string }>;
}

// 表单数据
const appForm = ref({
  key: 'my-app',
  name: 'My Application',
  description: {
    en: 'A powerful application',
    zh: '一个强大的应用程序',
  },
  tags: ['Tool'],
  type: 'website',
  crossVersionUpdate: true,
  limit: 0,
  website: 'https://example.com',
  github: 'https://github.com/user/repo',
  document: 'https://docs.example.com',
});

// Docker Compose 内容
const dockerCompose = ref(`services:
  app:
    image: nginx:alpine
    container_name: my-app
    restart: always
    ports:
      - "8080:80"
    environment:
      NODE_ENV: production
      
  database:
    image: mysql:8.0
    container_name: my-database
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: appdb
    volumes:
      - ./data/mysql:/var/lib/mysql`);

// 应用参数配置
const appParams = ref<AppParam[]>([
  {
    id: Date.now(),
    envKey: 'PANEL_APP_PORT_HTTP',
    type: 'number',
    default: '8080',
    required: true,
    edit: true,
    label: {
      en: 'Port',
      zh: '端口',
    },
    rule: 'paramPort'
  }
]);

// 可选标签
const availableTags = [
  { label: '建站', value: 'Website' },
  { label: '数据库', value: 'Database' },
  { label: 'Web 服务器', value: 'Server' },
  { label: '运行环境', value: 'Runtime' },
  { label: '实用工具', value: 'Tool' },
  { label: '云存储', value: 'Storage' },
  { label: 'AI', value: 'AI' },
  { label: 'BI', value: 'BI' },
  { label: 'CRM', value: 'CRM' },
  { label: '安全', value: 'Security' },
  { label: '开发工具', value: 'DevTool' },
  { label: 'DevOps', value: 'DevOps' },
  { label: '中间件', value: 'Middleware' },
  { label: '多媒体', value: 'Media' },
  { label: '邮件服务', value: 'Email' },
  { label: '休闲游戏', value: 'Game' },
  { label: '本地', value: 'Local' },
];

// 应用类型选项
const typeOptions = [
  { label: 'Website - 网站类型（支持一键部署）', value: 'website' },
  { label: 'Runtime - 运行环境类型', value: 'runtime' },
  { label: 'Tool - 工具类型', value: 'tool' },
];

// 参数类型选项
const paramTypes = [
  { label: 'Text - 文本', value: 'text' },
  { label: 'Password - 密码', value: 'password' },
  { label: 'Number - 数字', value: 'number' },
  { label: 'Service - 服务依赖', value: 'service' },
  { label: 'Select - 选择器', value: 'select' },
];

// 校验规则选项
const ruleOptions = [
  { label: 'paramPort - 端口范围 1-65535', value: 'paramPort' },
  { label: 'paramExtUrl - HTTP(S) URL格式', value: 'paramExtUrl' },
  { label: 'paramCommon - 英文数字.-_，长度2-30', value: 'paramCommon' },
  { label: 'paramComplexity - 复杂密码，长度6-30', value: 'paramComplexity' },
];

// 生成应用声明文件 data.yml
const appDeclarationYaml = computed(() => {
  try {
    const chineseTagNames = appForm.value.tags.map(tag => {
      const tagOption = availableTags.find(option => option.value === tag);
      return tagOption ? tagOption.label : tag;
    });
    
    const data = {
      name: appForm.value.name,
      tags: chineseTagNames,
      title: appForm.value.description.zh || appForm.value.name,
      description: {
        en: appForm.value.description.en,
        zh: appForm.value.description.zh,
      },
      additionalProperties: {
        key: appForm.value.key,
        name: appForm.value.name,
        tags: appForm.value.tags,
        shortDescZh: appForm.value.description.zh,
        shortDescEn: appForm.value.description.en,
        type: appForm.value.type,
        crossVersionUpdate: appForm.value.crossVersionUpdate,
        limit: appForm.value.limit,
        website: appForm.value.website,
        github: appForm.value.github,
        document: appForm.value.document,
      }
    };
    return yaml.stringify(data, { indent: 2 });
  } catch (e) {
    return `# 生成失败: ${e}`;
  }
});

// 转换 Docker Compose（核心转换逻辑）
const convertedDockerCompose = computed(() => {
  try {
    let content = dockerCompose.value;
    
    // 移除 version 字段
    content = content.replace(/^version:\s*['"]?[^\n]*['"]?\s*\n?/m, '');
    
    // 1. 删除原docker-compose中所有networks配置
    // 删除服务中的 networks 配置块（4个空格缩进）
    content = content.replace(/^\s{4}networks:\s*\n(\s{6}.*\n)*/gm, '');
    // 删除文件末尾的全局 networks 配置
    content = content.replace(/\n\s*networks:\s*\n(\s{2}.*\n)*\s*$/g, '');
    
    // 2. 处理容器名称
    let serviceCount = 0;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // 匹配服务定义行（两个空格缩进的服务名）
      const serviceMatch = lines[i].match(/^(\s{2})([a-zA-Z0-9_-]+):\s*$/);
      if (serviceMatch) {
        serviceCount++;
        const indent = serviceMatch[1];
        const serviceName = serviceMatch[2];
        const containerName = serviceCount === 1 ? '${CONTAINER_NAME}' : `\${CONTAINER_NAME}-${serviceName}`;
        
        // 查找 image 或 build 行并添加 container_name
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('image:') || lines[j].includes('build:')) {
            // 检查是否已存在 container_name
            let hasContainerName = false;
            for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
              if (lines[k].includes('container_name:')) {
                hasContainerName = true;
                break;
              }
              // 如果遇到下一个服务或配置块结束，则停止检查
              if (lines[k].trim() && !lines[k].startsWith(' ') && !lines[k].startsWith('\t')) {
                break;
              }
            }
            if (!hasContainerName) {
              lines.splice(j + 1, 0, `${indent}${indent}container_name: ${containerName}`);
            }
            break;
          }
        }
      }
    }
    content = lines.join('\n');
    
    // 3. 处理端口映射 - 只处理第一个服务的端口映射
    let firstServiceFound = false;
    content = content.replace(/^(\s*- \s*["']?)(\d+)(:\d+)(["']?)\s*$/gm, (match, prefix, port, internalPort, suffix) => {
      // 只处理第一个服务的端口映射
      if (!firstServiceFound) {
        firstServiceFound = true;
        return `${prefix}\${PANEL_APP_PORT_HTTP}${internalPort}${suffix}`;
      }
      // 其他服务的端口映射保持不变
      return match;
    });
    
    // 4. 给每个服务添加1panel networks配置（精确处理）
    // 首先找到所有服务的名称和位置
    const serviceInfo = [];
    const lines2 = content.split('\n');
    
    // 确定 services 块的范围
    let servicesStartIndex = -1;
    let servicesEndIndex = lines2.length;
    
    for (let i = 0; i < lines2.length; i++) {
      const line = lines2[i];
      if (line.trim() === 'services:') {
        servicesStartIndex = i;
      } else if (servicesStartIndex !== -1 && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
        // 遇到下一个顶级配置块
        servicesEndIndex = i;
        break;
      }
    }
    
    // 只在 services 块内查找服务，并确保只识别真正的服务（有image或build配置的）
    for (let i = servicesStartIndex + 1; i < servicesEndIndex; i++) {
      const serviceMatch = lines2[i].match(/^(\s{2})([a-zA-Z0-9_-]+):\s*$/);
      if (serviceMatch) {
        // 检查该服务下面是否有image或build配置
        let hasImageOrBuild = false;
        for (let j = i + 1; j < servicesEndIndex; j++) {
          // 如果遇到下一个服务，则停止检查
          if (lines2[j].match(/^(\s{2})([a-zA-Z0-9_-]+):\s*$/)) {
            break;
          }
          // 检查是否有image或build配置
          if (lines2[j].includes('image:') || lines2[j].includes('build:')) {
            hasImageOrBuild = true;
            break;
          }
        }
        
        // 只有包含image或build的服务才是真正的服务
        if (hasImageOrBuild) {
          serviceInfo.push({
            index: i,
            name: serviceMatch[2],
            indent: serviceMatch[1]
          });
        }
      }
    }
    
    // 从后往前处理服务（避免索引变化影响）
    for (let i = serviceInfo.length - 1; i >= 0; i--) {
      const service = serviceInfo[i];
      const serviceIndex = service.index;
      
      // 找到服务块的结束位置
      let serviceEndIndex = servicesEndIndex;
      for (let j = serviceIndex + 1; j < servicesEndIndex; j++) {
        // 检查是否是下一个服务的开始（两个空格缩进的服务名）
        if (lines2[j].match(/^(\s{2})([a-zA-Z0-9_-]+):\s*$/)) {
          serviceEndIndex = j;
          break;
        }
      }
      
      // 检查是否已存在 networks 配置
      let hasNetworks = false;
      for (let j = serviceIndex + 1; j < serviceEndIndex; j++) {
        // 检查是否是 networks: 配置行（四个空格缩进）
        if (lines2[j].match(/^\s{4}networks:\s*$/)) {
          hasNetworks = true;
          break;
        }
      }
      
      // 如果没有 networks 配置，则添加
      if (!hasNetworks) {
        // 在服务块结束前插入 networks 配置，确保正确的缩进
        lines2.splice(serviceEndIndex, 0, '    networks:', '      - 1panel-network');
      }
    }
    
    content = lines2.join('\n');
    
    // 5. 末尾处设置networks全局网络
    content = content.trim() + `\n\nnetworks:\n  1panel-network:\n    external: true`;
    
    // 6. 添加标签
    content = content.replace(/(\s{4}networks:\s*\n\s{6}- 1panel-network)/g, '$1\n    labels:\n      createdBy: "Apps"');
    
    return content;
  } catch (e) {
    return `# 转换失败: ${e}`;
  }
});

// 生成应用参数配置
const appParamsYaml = computed(() => {
  try {
    const formFields = appParams.value.map(param => {
      const field: any = {
        default: param.default,
        envKey: param.envKey,
        label: param.label,
        required: param.required,
        type: param.type,
      };
      
      if (param.edit) field.edit = param.edit;
      if (param.rule) field.rule = param.rule;
      if (param.random) field.random = param.random;
      if (param.key) field.key = param.key;
      if (param.values) field.values = param.values;
      
      return field;
    });
    
    const data = {
      additionalProperties: {
        formFields
      }
    };
    
    return yaml.stringify(data, { indent: 2 });
  } catch (e) {
    return `# 生成失败: ${e}`;
  }
});

// 添加新参数
const addParam = () => {
  appParams.value.push({
    id: Date.now(),
    envKey: '',
    type: 'text',
    default: '',
    required: false,
    edit: false,
    random: false,
    label: {
      en: '',
      zh: '',
    },
    rule: '',
    key: '',
    values: []
  });
};

// 删除参数
const removeParam = (index: number) => {
  appParams.value.splice(index, 1);
};

// 下载功能
const appDeclarationBase64 = computed(() => `data:text/yaml;base64,${textToBase64(appDeclarationYaml.value)}`);
const convertedDockerComposeBase64 = computed(() => `data:text/yaml;base64,${textToBase64(convertedDockerCompose.value)}`);
const appParamsBase64 = computed(() => `data:text/yaml;base64,${textToBase64(appParamsYaml.value)}`);

const { download: downloadAppDeclaration } = useDownloadFileFromBase64({ source: appDeclarationBase64, filename: 'data.yml' });
const { download: downloadDockerCompose } = useDownloadFileFromBase64({ source: convertedDockerComposeBase64, filename: 'docker-compose.yml' });
const { download: downloadAppParams } = useDownloadFileFromBase64({ source: appParamsBase64, filename: 'params-data.yml' });

const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
};
</script>

<template>
  <div>
    <c-card title="应用基本信息" mb-4>
      <n-form label-placement="left" label-width="140px">
        <n-form-item label="应用Key" required>
          <n-input v-model:value="appForm.key" placeholder="仅限英文，用于Linux创建文件夹" />
        </n-form-item>
        
        <n-form-item label="应用名称" required>
          <n-input v-model:value="appForm.name" placeholder="应用显示名称" />
        </n-form-item>
        
        <n-form-item label="英文描述" required>
          <n-input v-model:value="appForm.description.en" placeholder="English description" />
        </n-form-item>
        
        <n-form-item label="中文描述" required>
          <n-input v-model:value="appForm.description.zh" placeholder="中文描述，不要超过30个字" />
        </n-form-item>
        
        <n-grid cols="2" x-gap="12">
          <n-gi>
            <n-form-item label="应用标签">
              <n-select
                v-model:value="appForm.tags"
                multiple
                :options="availableTags"
                placeholder="选择应用标签"
              />
            </n-form-item>
          </n-gi>
          
          <n-gi>
            <n-form-item label="应用类型" required>
              <n-select v-model:value="appForm.type" :options="typeOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>
        
        <n-grid cols="2" x-gap="12">
          <n-gi>
            <n-form-item label="跨版本升级">
              <n-switch v-model:value="appForm.crossVersionUpdate" />
            </n-form-item>
          </n-gi>
          
          <n-gi>
            <n-form-item label="安装数量限制">
              <n-input-number v-model:value="appForm.limit" :min="0" placeholder="0代表无限制" />
            </n-form-item>
          </n-gi>
        </n-grid>
        
        <n-form-item label="官网地址">
          <n-input v-model:value="appForm.website" placeholder="https://example.com" />
        </n-form-item>
        
        <n-form-item label="GitHub地址">
          <n-input v-model:value="appForm.github" placeholder="https://github.com/user/repo" />
        </n-form-item>
        
        <n-form-item label="文档地址">
          <n-input v-model:value="appForm.document" placeholder="https://docs.example.com" />
        </n-form-item>
      </n-form>
    </c-card>

    <c-card title="应用声明文件 (data.yml)" mb-4>
      <n-alert type="info" mb-2>
        放置在应用主目录下，用于声明应用的基本信息。
      </n-alert>
      <div mb-4>
        <n-button @click="downloadAppDeclaration" type="primary" block>
          <template #icon>
            <n-icon><IconDownload /></n-icon>
          </template>
          下载应用声明文件 (data.yml)
        </n-button>
      </div>
      <TextareaCopyable :value="appDeclarationYaml" language="yaml" :download-file-name="''" />
    </c-card>

    <c-card title="Docker Compose 配置" mb-4>
      <c-label label="Docker Compose YAML 内容" mb-2>
        <div relative w-full>
          <c-monaco-editor
            v-model:value="dockerCompose"
            theme="vs-dark"
            language="yaml"
            height="300px"
            :options="MONACO_EDITOR_OPTIONS"
          />
        </div>
      </c-label>
      <n-alert type="info" mb-2>
        转换器会自动将通用的Docker Compose格式转换为1Panel标准配置。
      </n-alert>
      <div mb-4>
        <n-button @click="downloadDockerCompose" type="primary" block>
          <template #icon>
            <n-icon><IconDownload /></n-icon>
          </template>
          下载 Docker Compose 配置 (docker-compose.yml)
        </n-button>
      </div>
      <TextareaCopyable :value="convertedDockerCompose" language="yaml" :download-file-name="''" />
    </c-card>

    <c-card title="应用参数配置" mb-4>
      <n-alert type="info" mb-4>
        配置应用安装时需要用户填写的参数，如端口、数据库连接信息等。
      </n-alert>
      
      <div v-for="(param, index) in appParams" :key="param.id" class="param-form">
        <n-card :title="`参数 ${index + 1}`" class="mb-4">
          <template #header-extra>
            <n-button @click="removeParam(index)" type="error" size="small">删除</n-button>
          </template>
          
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="环境变量Key" required>
                <n-input v-model:value="param.envKey" placeholder="如: PANEL_APP_PORT_HTTP" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="参数类型" required>
                <n-select v-model:value="param.type" :options="paramTypes" />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="默认值">
                <n-input v-model:value="param.default" placeholder="默认值" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="校验规则">
                <n-select v-model:value="param.rule" :options="ruleOptions" clearable />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="英文标签">
                <n-input v-model:value="param.label.en" placeholder="English Label" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="中文标签">
                <n-input v-model:value="param.label.zh" placeholder="中文标签" />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <n-grid cols="4" x-gap="12">
            <n-gi>
              <n-form-item label="是否必填">
                <n-switch v-model:value="param.required" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="可编辑">
                <n-switch v-model:value="param.edit" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="随机字符">
                <n-switch v-model:value="param.random" />
              </n-form-item>
            </n-gi>
            
            <n-gi v-if="param.type === 'service'">
              <n-form-item label="依赖Key">
                <n-input v-model:value="param.key" placeholder="如: mysql, redis" />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-card>
      </div>
      
      <n-button @click="addParam" type="primary" dashed block size="large" mb-4>
        <template #icon>
          <n-icon><IconPlus /></n-icon>
        </template>
        添加参数
      </n-button>
      
      <n-divider>参数配置预览</n-divider>
      
      <div mb-4>
        <n-button @click="downloadAppParams" type="primary" block>
          <template #icon>
            <n-icon><IconDownload /></n-icon>
          </template>
          下载参数配置 (params-data.yml)
        </n-button>
      </div>
      
      <TextareaCopyable :value="appParamsYaml" language="yaml" :download-file-name="''" />
    </c-card>
  </div>
</template>

<style scoped>
.param-form {
  margin-bottom: 16px;
}
</style>