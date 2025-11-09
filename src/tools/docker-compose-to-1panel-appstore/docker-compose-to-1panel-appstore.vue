<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDownloadFileFromBase64 } from '@/composable/downloadBase64';
import { textToBase64 } from '@/utils/base64';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import yaml from 'yaml';
import { Plus as IconPlus, Download as IconDownload } from '@vicons/tabler';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// 参数类型定义
interface AppParam {
  id: number;
  envKey: string;
  type: string;
  default: string;
  required: boolean;
  edit?: boolean;
  random?: boolean;
  labelZh: string;
  labelEn: string;
  label: {
    zh: string;
    zhHant?: string;
    en: string;
    ja?: string;
    ko?: string;
    ms?: string;
    ptBr?: string;
    ru?: string;
    tr?: string;
  };
  description?: {
    zh: string;
    zhHant: string;
    en: string;
    ja: string;
    ko: string;
    ms: string;
    ptBr: string;
    ru: string;
    tr: string;
  };
  child?: {
    default: string;
    envKey: string;
    type: string;
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
    zh: '',
    zhHant: '',
    en: '',
    ja: '',
    ko: '',
    ms: '',
    ptBr: '',
    ru: '',
  },
  tags: ['Tool'],
  type: 'website',
  crossVersionUpdate: true,
  limit: 0,
  website: 'https://example.com',
  github: 'https://github.com/user/repo',
  document: 'https://docs.example.com',
  memoryRequired: undefined as number | undefined,
  memoryUnit: 'GB',
  architectures: ['amd64', 'arm64'],
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
    labelZh: 'HTTP 端口',
    labelEn: 'HTTP Port',
    label: {
      zh: 'HTTP 端口',
      zhHant: 'HTTP 連接埠',
      en: 'HTTP Port',
      ja: 'HTTP ポート',
      ko: 'HTTP 포트',
      ms: 'Port HTTP',
      ptBr: 'Porta HTTP',
      ru: 'HTTP Порт',
      tr: 'HTTP Portu',
    },
    description: {
      zh: '设置应用的 HTTP 访问端口，有效范围: 1-65535',
      zhHant: '設定應用程式的 HTTP 存取連接埠，有效範圍: 1-65535',
      en: 'Set the HTTP access port for the application, valid range: 1-65535',
      ja: 'アプリケーションのHTTPアクセスポートを設定します。有効範囲: 1-65535',
      ko: '애플리케이션의 HTTP 접근 포트를 설정합니다. 유효 범위: 1-65535',
      ms: 'Tetapkan port akses HTTP untuk aplikasi, julat sah: 1-65535',
      ptBr: 'Defina a porta de acesso HTTP para o aplicativo, intervalo válido: 1-65535',
      ru: 'Установите порт доступа HTTP для приложения, допустимый диапазон: 1-65535',
      tr: 'Uygulama için HTTP erişim portunu ayarlayın, geçerli aralık: 1-65535',
    },
    child: {
      default: '',
      envKey: '',
      type: 'service'
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

// 内存需求单位选项
const memoryUnitOptions = [
  { label: 'GB', value: 'GB' },
  { label: 'MB', value: 'MB' },
];

// 架构选项
const architectureOptions = [
  { label: 'amd64', value: 'amd64' },
  { label: 'arm64', value: 'arm64' },
  { label: 'arm/v7', value: 'arm/v7' },
  { label: 'arm/v6', value: 'arm/v6' },
  { label: 'arm/v5', value: 'arm/v5' },
  { label: 'loong64', value: 'loong64' },
  { label: 'mips64', value: 'mips64' },
  { label: 'mips64le', value: 'mips64le' },
  { label: 'ppc64le', value: 'ppc64le' },
  { label: 'riscv64', value: 'riscv64' },
  { label: 's390x', value: 's390x' },
  { label: 'x86 (i386)', value: '386' },
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
  { label: 'Apps - 可供选择的服务依赖', value: 'apps' },
  { label: 'Service - 固定的服务依赖', value: 'service' },
  { label: 'Select - 选择器', value: 'select' },
];

// 校验规则选项
const ruleOptions = [
  { label: 'paramPort - 端口范围 1-65535', value: 'paramPort' },
  { label: 'paramExtUrl - HTTP(S) URL格式', value: 'paramExtUrl' },
  { label: 'paramCommon - 英文数字.-_，长度2-30', value: 'paramCommon' },
  { label: 'paramComplexity - 复杂密码，长度6-30', value: 'paramComplexity' },
];

// 键名转换函数
const transformKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyMappings: Record<string, string> = {
        zhHant: 'zh-Hant',
        ptBr: 'pt-br',
      };
      const newKey = keyMappings[key] || key;
      newObj[newKey] = transformKeys(value);
    }
    return newObj;
  }
  return obj;
};

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
      description: appForm.value.description.zh,
      additionalProperties: {
        key: appForm.value.key,
        name: appForm.value.name,
        tags: appForm.value.tags,
        shortDescZh: appForm.value.description.zh,
        shortDescEn: appForm.value.description.en,
        description: {
          en: appForm.value.description.en,
          zh: appForm.value.description.zh,
          zhHant: appForm.value.description.zhHant,
          ja: appForm.value.description.ja,
          ms: appForm.value.description.ms,
          ptBr: appForm.value.description.ptBr,
          ru: appForm.value.description.ru,
          ko: appForm.value.description.ko,
        },
        type: appForm.value.type,
        crossVersionUpdate: appForm.value.crossVersionUpdate,
        limit: appForm.value.limit,
        website: appForm.value.website,
        github: appForm.value.github,
        document: appForm.value.document,
        ...(appForm.value.memoryRequired && appForm.value.memoryRequired > 0 ? {
          memoryRequired: appForm.value.memoryUnit === 'GB' 
            ? appForm.value.memoryRequired * 1024 
            : appForm.value.memoryRequired
        } : {}),
        architectures: appForm.value.architectures,
      }
    };
    const transformedData = transformKeys(data);
    return yaml.stringify(transformedData, { indent: 2, lineWidth: -1 });
  } catch (e) {
    return `# 生成失败: ${e}`;
  }
});

// 转换 Docker Compose（核心转换逻辑）
const convertedDockerCompose = computed(() => {
  try {
    // 反序列化为 JavaScript 对象
    const composeObj = yaml.parse(dockerCompose.value);
    
    // 1. 移除 version 字段
    delete composeObj.version;
    
    // 2. 删除所有 networks 配置
    delete composeObj.networks;
    
    // 3. 处理容器名称和网络配置
    let firstService = true;
    
    if (composeObj.services) {
      Object.keys(composeObj.services).forEach((serviceName, index) => {
        const service = composeObj.services[serviceName];
        
        // 3.1 设置容器名称
        service.container_name = firstService 
          ? '${CONTAINER_NAME}' 
          : `\${CONTAINER_NAME}-${serviceName}`;
        
        // 3.2 处理端口映射（只处理第一个服务的端口）
        if (firstService && service.ports) {
          service.ports = service.ports.map((portMapping: string, portIndex: number) => {
            // 只替换第一个端口映射
            if (portIndex === 0) {
              // 解析端口映射，如 "8080:80" 或 "8080:80/tcp"
              const portParts = portMapping.split(':');
              if (portParts.length >= 2) {
                // 将主机端口替换为变量，保持容器端口不变
                const containerPort = portParts[1];
                return `\${PANEL_APP_PORT_HTTP}:${containerPort}`;
              }
            }
            return portMapping;
          });
        }
        
        // 3.3 添加 networks 配置
        service.networks = ['1panel-network'];
        
        // 3.4 添加 labels
        if (!service.labels) {
          service.labels = {};
        }
        service.labels.createdBy = "Apps";
        
        // 标记第一个服务已处理
        if (firstService) {
          firstService = false;
        }
      });
    }
    
    // 4. 添加全局 networks 配置
    composeObj.networks = {
      '1panel-network': {
        external: true
      }
    };
    
    // 序列化为 YAML
    return yaml.stringify(composeObj, { indent: 2 });
  } catch (e) {
    return `# 转换失败: ${e}\n\n原始内容:\n${dockerCompose.value}`;
  }
});

// 生成应用参数配置
const appParamsYaml = computed(() => {
  try {
    const formFields = appParams.value.map(param => {
      const field: any = {
        default: param.default,
        envKey: param.envKey,
        labelZh: param.label.zh,
        labelEn: param.label.en,
        label: param.label,
      };
      
      const child: any = {
        default: '',
        envKey: param.child.envKey,
        required: false,
        type: 'service',
      };

      const description: any = {};
      for (const [key, value] of Object.entries(param.description)) {
        if (value !== undefined && value !== null && value !== '') {
          description[key] = value;
        }
      }
      
      // 只有当有非空标签时才添加 description 字段
      if (Object.keys(description).length > 0) {
        field.description = description;
      }

      field.required = param.required;
      field.type = param.type;
      if (param.edit) field.edit = param.edit;
      if (param.rule) field.rule = param.rule;
      if (param.random) field.random = param.random;
      if (param.type === 'service' && param.key) field.key = param.key;
      if ((param.type === 'apps' || param.type === 'select') && param.values && param.values.length > 0) field.values = param.values;
      if (param.type === 'apps') field.child = child;
      return field;
    });
    
    const data = {
      additionalProperties: {
        formFields
      }
    };
    const transformedData = transformKeys(data);
    return yaml.stringify(transformedData, { indent: 2, lineWidth: -1 });
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
    labelZh: '',
    labelEn: '',
    label: {
      zh: '',
      zhHant: '',
      en: '',
      ja: '',
      ko: '',
      ms: '',
      ptBr: '',
      ru: '',
      tr: '',
    },
    description: {
      zh: '',
      zhHant: '',
      en: '',
      ja: '',
      ko: '',
      ms: '',
      ptBr: '',
      ru: '',
      tr: '',
    },
    child: {
      default: '',
      envKey: '',
      type: '',
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

// 为 Select 类型添加选项
const addOption = (param: AppParam) => {
  if (!param.values) {
    param.values = [];
  }
  param.values.push({ label: '', value: '' });
};

// 删除选项
const removeOption = (param: AppParam, index: number) => {
  if (param.values) {
    param.values.splice(index, 1);
  }
};

// 下载功能
const appDeclarationBase64 = computed(() => `data:text/yaml;base64,${textToBase64(appDeclarationYaml.value)}`);
const convertedDockerComposeBase64 = computed(() => `data:text/yaml;base64,${textToBase64(convertedDockerCompose.value)}`);
const appParamsBase64 = computed(() => `data:text/yaml;base64,${textToBase64(appParamsYaml.value)}`);

const { download: downloadAppDeclaration } = useDownloadFileFromBase64({ source: appDeclarationBase64, filename: 'data.yml' });
const { download: downloadDockerCompose } = useDownloadFileFromBase64({ source: convertedDockerComposeBase64, filename: 'docker-compose.yml' });
const { download: downloadAppParams } = useDownloadFileFromBase64({ source: appParamsBase64, filename: 'data.yml' });

const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
};

const PLACEHOLDERS = {
  appKey: 'undefined-app',
  appName: 'My Application',
  descEn: 'This is an auto-generated application configuration for 1Panel.',
  descZh: '这是为 1Panel 自动生成的应用程序配置。',
  version: 'latest'
};
const appVersion = ref('1.0.0');
// 打包下载
const downloadAllAsZip = async () => {
  try {
    const zip = new JSZip();
    const appKey = appForm.value.key.trim() || PLACEHOLDERS.appKey;
    const version = appVersion.value.trim() || PLACEHOLDERS.version;
    // 创建根目录
    const rootFolder = zip.folder(appKey);
    if (rootFolder) {
      // 添加根目录文件
      rootFolder.file('data.yml', appDeclarationYaml.value);
      const appName = appForm.value.name.trim() || PLACEHOLDERS.appName;
      const descZh = appForm.value.description.zh.trim() || PLACEHOLDERS.descZh;
      const descEn = appForm.value.description.en.trim() || PLACEHOLDERS.descEn;
      const readmeContentZH = `# ${appName}\n\n${descZh}\n`;
      const readmeContentEN = `# ${appName}\n\n${descEn}\n`;
      rootFolder.file('README.md', readmeContentZH);
      rootFolder.file('README_en.md', readmeContentEN);
      // 创建版本目录
      const versionFolder = rootFolder.folder(version);
      if (versionFolder) {
        // 添加版本目录文件
        versionFolder.file('data.yml', appParamsYaml.value);
        versionFolder.file('docker-compose.yml', convertedDockerCompose.value);
      }
    }
    // 生成 ZIP 文件并下载
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${appKey}.zip`);
  } catch (error) {
    console.error('打包下载失败:', error);
  }
};
// 回到顶部
const scrollToTop = () => {
  const topElement = document.querySelector('h1') as HTMLElement;
  topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
// 监听滚动事件
const showBackToTop = ref(false);
const handleScroll = () => {
  const elements = document.querySelectorAll('.n-layout-scroll-container');
  showBackToTop.value = (elements[elements.length - 1] as HTMLElement)?.scrollTop > 650;
};
// 添加和移除滚动事件监听器
const manageScrollListeners = () => {
  const elements = document.querySelectorAll('.n-layout-scroll-container');
  elements.forEach(el => {
    const element = el as HTMLElement;
    if (element.scrollHeight > element.clientHeight) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
  });
};
onMounted(() => {
  setTimeout(() => {
    manageScrollListeners();
    setTimeout(handleScroll, 100);
  }, 500);
});
</script>

<template>
  <div>
    <c-card title="打包下载应用配置" mb-4>
      <n-alert type="info" mb-4>
        输入应用版本号，将所有配置文件打包下载为 ZIP 文件。
      </n-alert>
      <n-grid cols="3" x-gap="12">
        <n-gi span="2">
          <n-form-item label="应用版本" required>
            <n-input v-model:value="appVersion" placeholder="例如: 1.0.0" />
          </n-form-item>
        </n-gi>
        <n-gi>
          <n-form-item label=" ">
            <n-button 
              @click="downloadAllAsZip" 
              type="primary" 
              block
            >
              <template #icon>
                <n-icon><IconDownload /></n-icon>
              </template>
              打包下载所有配置
            </n-button>
          </n-form-item>
        </n-gi>
      </n-grid>
      <n-alert type="warning" class="mt-4">
  <div>打包后的 ZIP 文件结构：</div>
  <pre class="file-tree">{{ appForm.key || 'undefined-app' }}/
├── data.yml (应用声明文件)
├── README.md (中文说明文档)
├── README_en.md (英文说明文档)
└── {{ appVersion || 'latest' }}/
      ├── data.yml (参数配置文件)
      └── docker-compose.yml (Docker Compose 配置)</pre>
      </n-alert>
    </c-card>
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
        
        <n-form-item label="简体中文描述" required>
          <n-input v-model:value="appForm.description.zh" placeholder="中文描述，不要超过30个字" />
        </n-form-item>
        
        <n-form-item label="繁体中文描述" required>
          <n-input v-model:value="appForm.description.zhHant" placeholder="" />
        </n-form-item>
        
        <n-form-item label="日本语描述" required>
          <n-input v-model:value="appForm.description.ja" placeholder="" />
        </n-form-item>
        
        <n-form-item label="韩语描述" required>
          <n-input v-model:value="appForm.description.ko" placeholder="" />
        </n-form-item>
        
        <n-form-item label="马来语描述" required>
          <n-input v-model:value="appForm.description.ms" placeholder="" />
        </n-form-item>
        
        <n-form-item label="巴西葡萄牙语描述" required>
          <n-input v-model:value="appForm.description.ptBr" placeholder="" />
        </n-form-item>
        
        <n-form-item label="俄罗斯语描述" required>
          <n-input v-model:value="appForm.description.ru" placeholder="" />
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

        <n-grid cols="2" x-gap="12">
          <n-gi>
            <n-form-item label="内存需求">
              <n-input-group>
                <n-input-number v-model:value="appForm.memoryRequired" :min="0" placeholder="留空表示没有内存需求" />
                <n-select 
                  v-model:value="appForm.memoryUnit" 
                  :options="memoryUnitOptions" 
                  style="width: 100px"
                  placeholder="单位"
                />
              </n-input-group>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="支持架构">
              <n-select v-model:value="appForm.architectures" multiple :options="architectureOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>
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
          
          <n-grid v-if="param.type === 'select' || param.type === 'apps' || param.type === 'service'" cols="2" x-gap="12">
            <n-gi v-if="param.type === 'apps'" span="2">
              <n-alert type="info" title="可供选择的服务依赖" class="mb-4">
                用户可以通过一级菜单选择依赖的服务(App)，例如：MySQL、MariaDB、PostgreSQL 等，通过子菜单选择已安装的服务实例。
                <br>一级菜单的选项值必须填写官方应用商店中应用的Key
              </n-alert>
            </n-gi>
            <n-gi v-if="param.type === 'select' || param.type === 'apps'" :span="param.type === 'apps' ? '1' : '2'">
              <n-form-item :label="param.type === 'apps' ? '服务依赖选项' : '选择器选项'" required>
                <div class="options-container">
                  <div v-for="(option, optionIndex) in param.values" :key="optionIndex" class="param-form">
                    <n-grid :cols="param.type === 'apps' ? '4' : '3'" x-gap="8">
                      <n-gi>
                        <n-input
                          v-model:value="option.label"
                          placeholder="显示标签"
                        />
                      </n-gi>
                      <n-gi :span="param.type === 'apps' ? '2' : '1'">
                        <n-input
                          v-model:value="option.value"
                          :placeholder="param.type === 'apps' ? '选项值: 官方应用商店中应用的Key' : '选项值'"
                        />
                      </n-gi>
                      <n-gi>
                        <n-button
                          @click="removeOption(param, optionIndex)"
                          type="error"
                          quaternary
                        >
                          删除选项
                        </n-button>
                      </n-gi>
                    </n-grid>
                  </div>
                  <n-button
                    @click="addOption(param)"
                    type="primary"
                    dashed
                  >
                    添加选项
                  </n-button>
                </div>
              </n-form-item>
            </n-gi>
            <n-gi v-if="param.type === 'apps'">
              <n-card title="可选的服务依赖子菜单" class="mb-4">
                <n-form-item label="环境变量Key" required>
                  <n-input v-model:value="param.child.envKey" placeholder="如: PANEL_DB_HOST" />
                </n-form-item>
              </n-card>
            </n-gi>
            
            <n-gi v-if="param.type === 'service'">
              <n-form-item label="依赖Key">
                <n-input v-model:value="param.key" placeholder="如: mysql, redis, 值必须填写官方应用商店中应用的Key" />
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
          <n-card title="表单标签 (必填)" class="mb-4">
            <n-grid cols="3" x-gap="12">
              <n-gi>
                <n-form-item label="简体中文标签">
                  <n-input v-model:value="param.label.zh" placeholder="简体中文标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="繁体中文标签">
                  <n-input v-model:value="param.label.zhHant" placeholder="繁体中文标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="英文标签">
                  <n-input v-model:value="param.label.en" placeholder="英文标签" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="3" x-gap="12">
              <n-gi>
                <n-form-item label="日本语标签">
                  <n-input v-model:value="param.label.ja" placeholder="日本语标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="韩语标签">
                  <n-input v-model:value="param.label.ko" placeholder="韩语标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="马来语标签">
                  <n-input v-model:value="param.label.ms" placeholder="马来语标签" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="3" x-gap="12">
              <n-gi>
                <n-form-item label="葡萄牙语 (巴西) 标签">
                  <n-input v-model:value="param.label.ptBr" placeholder="葡萄牙语 (巴西) 标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="俄罗斯语标签">
                  <n-input v-model:value="param.label.ru" placeholder="俄罗斯语标签" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="土耳其语标签">
                  <n-input v-model:value="param.label.tr" placeholder="土耳其语标签" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-card>

          <n-card title="表单描述 (可选)" class="mb-4">
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="简体中文描述">
                  <n-input v-model:value="param.description.zh" placeholder="简体中文描述" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="繁体中文描述">
                  <n-input v-model:value="param.description.zhHant" placeholder="繁体中文描述" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="英文描述">
                  <n-input v-model:value="param.description.en" placeholder="英文描述" />
                </n-form-item>
              </n-gi>
            
              <n-gi>
                <n-form-item label="日本语描述">
                  <n-input v-model:value="param.description.ja" placeholder="日本语描述" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="韩语描述">
                  <n-input v-model:value="param.description.ko" placeholder="韩语描述" />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="马来语描述">
                  <n-input v-model:value="param.description.ms" placeholder="马来语描述" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="葡萄牙语 (巴西) 描述">
                  <n-input v-model:value="param.description.ptBr" placeholder="葡萄牙语 (巴西) 描述" />
                </n-form-item>
              </n-gi>
            
              <n-gi>
                <n-form-item label="俄罗斯语描述">
                  <n-input v-model:value="param.description.ru" placeholder="俄罗斯语描述" />
                </n-form-item>
              </n-gi>
            </n-grid>
            
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="土耳其语描述">
                  <n-input v-model:value="param.description.tr" placeholder="土耳其语描述" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-card>
          
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
    <!-- 添加回到顶部的浮动按钮 -->
    <transition name="fade">
      <div
        v-if="showBackToTop"
        class="back-to-top-btn"
        @click="scrollToTop"
      >
        <n-button type="primary" circle size="large">
          <template #icon>
            <n-icon>
              <!-- 可以使用一个向上的箭头图标 -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </n-icon>
          </template>
        </n-button>
        <div class="btn-text">返回打包下载</div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.param-form {
  margin-bottom: 16px;
}
/* 添加回到顶部按钮的样式 */
.back-to-top-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
.back-to-top-btn:hover {
  transform: translateY(-2px);
}
.btn-text {
  margin-top: 8px;
  font-size: 12px;
  color: #18a058;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>