<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  childEnabled?: boolean;
  labelEn: string;
  labelZh: string;
  rule?: string;
  key?: string;
  values?: Array<{ label: string; value: string }>;
  child?: {
    default: string;
    envKey: string;
    required: boolean;
    type: string;
  };
  // 多语言标签支持
  multiLanguageEnabled?: boolean;
  multiLanguageLabels?: Array<{ lang: string; label: string }>;
  // 选择器控制选项
  multiple?: boolean;
  allowCreate?: boolean;
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
    labelEn: 'Port',
    labelZh: '端口',
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
  { label: 'Apps - 可供选择的服务依赖', value: 'apps' },
  { label: 'Service - 固定的服务依赖', value: 'service' },
  { label: 'Select - 选择器', value: 'select' },
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

// 校验规则选项
const ruleOptions = [
  { label: 'paramPort - 端口范围 1-65535', value: 'paramPort' },
  { label: 'paramCommon - 英文数字.-_，长度2-30', value: 'paramCommon' },
  { label: 'paramComplexity - 复杂密码，长度6-30', value: 'paramComplexity' },
  { label: 'paramHttp - 必须以 http:// 或 https:// 开头', value: 'paramHttp' },
  { label: 'paramExtUrl - HTTP(S) URL格式', value: 'paramExtUrl' },
];

// 多语言标签选项
const languageOptions = [
  { label: '英文 (en)', value: 'en' },
  { label: '简体中文 (zh)', value: 'zh' },
  { label: '繁体中文 (zh-Hant)', value: 'zh-Hant' },
  { label: '日语 (ja)', value: 'ja' },
  { label: '韩语 (ko)', value: 'ko' },
  { label: '俄语 (ru)', value: 'ru' },
  { label: '葡萄牙语 (pt-br)', value: 'pt-br' },
  { label: '马来语 (ms)', value: 'ms' },
];

// 键名转换函数
const transformKeys = (obj: any): any => {
  const keyMappings: Record<string, string> = {
    zhHant: 'zh-Hant',
    ptBr: 'pt-br',
  };
  
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const transformed: any = {};
    Object.keys(obj).forEach(key => {
      const transformedKey = keyMappings[key] || key;
      transformed[transformedKey] = transformKeys(obj[key]);
    });
    return transformed;
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
        ...(appForm.value.memoryRequired && appForm.value.memoryRequired > 0 ? {
          memoryRequired: appForm.value.memoryUnit === 'GB' 
            ? appForm.value.memoryRequired * 1024 
            : appForm.value.memoryRequired
        } : {}),
        architectures: appForm.value.architectures,
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
    // 使用对象操作替代字符串替换
    const composeObj = yaml.parse(dockerCompose.value);
    
    // 移除 version 字段
    delete composeObj.version;
    
    // 1. 删除所有 networks 配置
    delete composeObj.networks;
    
    // 2. 处理服务配置
    if (composeObj.services) {
      const services = composeObj.services;
      let serviceIndex = 0;
      
      Object.keys(services).forEach(serviceName => {
        const service = services[serviceName];
        serviceIndex++;
        
        // 设置容器名称
        const containerName = serviceIndex === 1 ? '${CONTAINER_NAME}' : `\${CONTAINER_NAME}-${serviceName}`;
        service.container_name = containerName;
        
        // 处理端口映射 - 只处理第一个服务的第一个端口
        if (serviceIndex === 1 && service.ports && Array.isArray(service.ports)) {
          if (service.ports.length > 0) {
            const firstPort = service.ports[0];
            // 提取外部端口号
            const portMatch = String(firstPort).match(/^(\d+):(\d+)/);
            if (portMatch) {
              service.ports[0] = `\${PANEL_APP_PORT_HTTP}:${portMatch[2]}`;
            }
          }
        }
        
        // 删除服务中的 networks 配置
        delete service.networks;
      });
      
      // 为每个服务添加 1panel-network 网络
      Object.keys(services).forEach(serviceName => {
        const service = services[serviceName];
        service.networks = ['1panel-network'];
        
        // 添加标签
        service.labels = service.labels || {};
        service.labels.createdBy = 'Apps';
      });
    }
    
    // 3. 添加全局网络配置
    composeObj.networks = {
      '1panel-network': {
        external: true
      }
    };
    
    // 使用更好的YAML输出格式
    return yaml.stringify(composeObj, { indent: 2 });
  } catch (e) {
    return `# 转换失败: ${e}`;
  }
});

// 生成应用参数配置
const appParamsYaml = computed(() => {
  try {
    const formFields = appParams.value.map(param => {
      // 构建多语言label字段（仅从multiLanguageLabels构建，不包含基础labelEn/labelZh）
      const labelField: Record<string, string> = {};
      
      // 处理多语言标签（仅在启用时添加，且只处理multiLanguageLabels中的值）
      if (param.multiLanguageEnabled && param.multiLanguageLabels) {
        param.multiLanguageLabels.forEach((item) => {
          if (item.label && item.label.trim()) {
            labelField[item.lang] = item.label.trim();
          }
        });
      }
      
      const field: any = {
        default: param.default || '',
        envKey: param.envKey || '',
        required: param.required || false,
        type: param.type || 'text',
      };
      
      // 总是添加labelEn和labelZh字段（如果存在）
      if (param.labelEn && param.labelEn.trim()) {
        field.labelEn = param.labelEn.trim();
      }
      if (param.labelZh && param.labelZh.trim()) {
        field.labelZh = param.labelZh.trim();
      }
      
      // 如果启用了多语言标签且有值，则添加label字段
      if (param.multiLanguageEnabled && Object.keys(labelField).length > 0) {
        field.label = labelField;
      }
      
      // 添加可选字段（只有当字段有值时才包含）
      if (param.edit !== undefined && param.edit !== false) field.edit = param.edit;
      if (param.rule && param.rule.trim() && param.type !== 'apps') field.rule = param.rule;
      if (param.random !== undefined && param.random !== false) field.random = param.random;
      if (param.key && param.key.trim()) field.key = param.key;
      
      // 处理 child 字段（仅在apps类型下，childEnabled 为 true 且 child.envKey 有值时添加）
      if (param.type === 'apps' && param.childEnabled && param.child && param.child.envKey && param.child.envKey.trim()) {
        field.child = {
          default: param.child.default || '',
          envKey: param.child.envKey,
          required: param.child.required || false,
          type: param.child.type || 'service'
        };
      }
      
      // 处理 values 数组（选择器和 apps 类型）
      if (param.values && Array.isArray(param.values) && param.values.length > 0) {
        // 过滤掉空的选项
        const validValues = param.values.filter(opt => 
          opt.label && opt.label.trim() && opt.value && opt.value.trim()
        );
        if (validValues.length > 0) {
          field.values = validValues;
        }
      }
      
      // 处理选择器类型特有的字段
      if (param.type === 'select') {
        if (param.multiple !== undefined && param.multiple !== false) {
          field.multiple = param.multiple;
        }
        if (param.allowCreate !== undefined && param.allowCreate !== false) {
          field.allowCreate = param.allowCreate;
        }
      }
      
      return field;
    });
    
    const data = {
      additionalProperties: {
        formFields
      }
    };
    
    // 使用transformKeys转换键名格式并使用更好的YAML输出格式
    const transformedData = transformKeys(data);
    return yaml.stringify(transformedData, { indent: 2, lineWidth: -1 });
  } catch (e) {
    return `# 生成失败: ${e}`;
  }
});

// 监听参数类型变化，自动初始化或清理相关字段
const handleParamTypeChange = (param: AppParam) => {
  // 清理所有类型特定字段
  delete param.values;
  delete param.key;
  // 清理所有child相关字段
  delete param.child;
  param.childEnabled = false; // 重置Child设置为关闭状态
  param.rule = ''; // 重置校验规则
  
  // 根据新类型设置字段默认值，但不影响用户手动设置的开关状态
  switch (param.type) {
    case 'select':
      param.default = '';
      param.values = [{ label: '选项1', value: 'option1' }];
      param.rule = ''; // 选择器通常不需要特殊校验
      param.edit = false;
      param.random = false;
      param.multiple = false; // 默认不支持多选
      param.allowCreate = false; // 默认不支持创建新选项
      break;
    case 'apps':
      param.default = 'mysql';
      param.values = [{ label: 'MySQL', value: 'mysql' }, { label: 'PostgreSQL', value: 'postgresql' }];
      // 不再自动设置child字段，由用户通过childEnabled开关控制
      delete param.rule; // 彻底删除校验规则字段
      param.edit = false;
      param.random = false;
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
    case 'service':
      param.default = '';
      param.key = 'mysql'; // 依赖Key默认值为mysql
      param.rule = ''; // 固定服务依赖通常不需要特殊校验
      param.edit = false; // Service类型不需要可编辑开关
      param.random = false; // Service类型不需要随机字符开关
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
    case 'password':
      param.default = '';
      param.rule = 'paramComplexity'; // 密码需要复杂密码校验
      param.edit = true;
      param.random = true;
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
    case 'number':
      param.default = '8080';
      param.rule = 'paramPort'; // 数字类型默认使用端口范围校验规则
      param.edit = true;
      param.random = true;
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
    case 'tool':
      param.default = '';
      param.rule = 'paramCommon'; // 工具类型通常用通用校验
      param.edit = true;
      param.random = true;
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
    default: // 'text'
      param.default = '';
      param.rule = 'paramCommon'; // 文本类型用通用校验
      param.edit = true;
      param.random = true;
      // 清理选择器特有字段
      delete param.multiple;
      delete param.allowCreate;
      break;
  }
};

// 监听多选模式变化
const handleMultipleChange = (param: AppParam, enabled: boolean) => {
  if (enabled) {
    // 启用多选时，将默认值转换为数组格式
    if (param.default && !Array.isArray(param.default)) {
      param.default = [param.default];
    }
  } else {
    // 关闭多选时，将数组转换为单个值
    if (Array.isArray(param.default)) {
      param.default = param.default.length > 0 ? param.default[0] : '';
    }
  }
};

// 监听允许创建选项变化
const handleAllowCreateChange = (param: AppParam, enabled: boolean) => {
  // 允许创建选项时，通常需要调整校验规则
  if (enabled) {
    // 可以在这里添加一些额外的校验规则或提示
    console.log('允许创建新选项已启用');
  }
};

// 添加新参数
const addParam = () => {
  const newParam: AppParam = {
    id: Date.now(),
    envKey: '',
    type: 'text',
    labelEn: '',
    labelZh: '',
    required: false,
    edit: false,
    random: false,
    childEnabled: false,
    default: '',
    rule: '',
    key: '',
    values: [],
    // 初始化多语言标签字段
    multiLanguageEnabled: false,
    multiLanguageLabels: [],
    // 初始化选择器控制选项
    multiple: false,
    allowCreate: false
  };
  
  // 调用类型变化处理函数来设置合适的默认值和校验规则
  handleParamTypeChange(newParam);
  
  appParams.value.push(newParam);
};

// 添加选项
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

// 获取可用的语言选项（过滤掉已使用的语言）
const getAvailableLanguages = (param: AppParam, currentIndex: number) => {
  if (!param.multiLanguageLabels) return languageOptions;
  
  const usedLanguages = param.multiLanguageLabels
    .map((item, index) => ({ lang: item.lang, index }))
    .filter(item => item.index !== currentIndex) // 排除当前项
    .map(item => item.lang);
    
  return languageOptions.filter(lang => !usedLanguages.includes(lang.value));
};

// 多语言标签管理函数
const addLanguageLabel = (param: AppParam) => {
  if (!param.multiLanguageLabels) {
    param.multiLanguageLabels = [];
  }
  // 找一个未使用的语言代码
  const usedLanguages = param.multiLanguageLabels.map(item => item.lang);
  const availableLanguage = languageOptions.find(lang => !usedLanguages.includes(lang.value));
  if (availableLanguage) {
    param.multiLanguageLabels.push({ lang: availableLanguage.value, label: '' });
  }
};

const removeLanguageLabel = (param: AppParam, lang: string) => {
  if (param.multiLanguageLabels) {
    const index = param.multiLanguageLabels.findIndex(item => item.lang === lang);
    if (index !== -1) {
      param.multiLanguageLabels.splice(index, 1);
    }
  }
};

const updateLanguageKey = (param: AppParam, oldLang: string, newLang: string) => {
  if (param.multiLanguageLabels && oldLang !== newLang) {
    const item = param.multiLanguageLabels.find(item => item.lang === oldLang);
    if (item) {
      item.lang = newLang;
    }
  }
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

const PLACEHOLDERS = {
  appKey: 'undefined-app',
  appName: 'My Application',
  descEn: 'This is an auto-generated application configuration for 1Panel.',
  descZh: '这是为 1Panel 自动生成的应用程序配置。',
  version: 'latest'
};
const appVersion = ref('1.0.0');

// 打包下载所有配置
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
  // 滚动到真正的页面顶部
  const elements = document.querySelectorAll('.n-layout-scroll-container');
  if (elements.length > 0) {
    const scrollContainer = elements[elements.length - 1] as HTMLElement;
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

// 监听参数变化，仅在apps类型下处理child相关逻辑
watch(appParams.value, (newParams) => {
  newParams.forEach(param => {
    // 仅在apps类型下才处理child相关逻辑
     if (param.type === 'apps') {
       if (param.childEnabled && !param.child) {
         param.child = { 
           default: '',
           envKey: 'PANEL_DB_HOST',
           required: true,
           type: 'service'
         };
       }
       if (!param.childEnabled && param.child) {
         delete param.child;
       }
     } else {
      // 非apps类型，清理所有child相关字段
      if (param.child) {
        delete param.child;
      }
      param.childEnabled = false;
    }
  });
}, { deep: true });

onMounted(() => {
  setTimeout(() => {
    manageScrollListeners();
    setTimeout(handleScroll, 100);
  }, 500);
});
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
                <n-select 
                  v-model:value="param.type" 
                  :options="paramTypes" 
                  @update:value="() => handleParamTypeChange(param)"
                />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <!-- 特定参数类型的选项配置 -->
          <div v-if="param.type === 'select' || param.type === 'apps' || param.type === 'service'">
            <n-alert v-if="param.type === 'apps'" type="info" title="可供选择的服务依赖" class="mb-4">
              用户可以通过一级菜单选择依赖的服务(App)，例如：MySQL、MariaDB、PostgreSQL 等，通过子菜单选择已安装的服务实例。
              <br>一级菜单的选项值必须填写官方应用商店中应用的Key
            </n-alert>
            
            <div v-if="param.type === 'select' || param.type === 'apps'">
              <n-form-item :label="param.type === 'apps' ? '服务依赖选项' : '选择器选项'" required>
                <div class="options-container">
                  <div v-for="(option, optionIndex) in param.values" :key="optionIndex" class="param-form">
                    <n-grid :cols="param.type === 'apps' ? '4' : '3'" x-gap="8">
                      <n-gi>
                        <n-input
                          v-model:value="option.label"
                          placeholder="显示标签"
                          style="width: 100%; min-width: 0"
                        />
                      </n-gi>
                      <n-gi :span="param.type === 'apps' ? '2' : '1'">
                        <n-input
                          v-model:value="option.value"
                          :placeholder="param.type === 'apps' ? '选项值: 官方应用商店中应用的Key' : '选项值'"
                          style="width: 100%; min-width: 0"
                        />
                      </n-gi>
                      <n-gi>
                        <n-button
                          @click="removeOption(param, optionIndex)"
                          type="error"
                          quaternary
                          size="small"
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
                    size="small"
                  >
                    添加选项
                  </n-button>
                </div>
              </n-form-item>
            </div>
          </div>
          
          <!-- 选择器类型特有的控制选项 -->
          <div v-if="param.type === 'select'">
            <n-grid cols="2" x-gap="12">
              <n-gi>
                <n-form-item label="多选模式">
                  <n-switch 
                    v-model:value="param.multiple" 
                    @update:value="(val) => handleMultipleChange(param, val)"
                  />
                </n-form-item>
              </n-gi>
              
              <n-gi>
                <n-form-item label="允许创建">
                  <n-switch 
                    v-model:value="param.allowCreate" 
                    @update:value="(val) => handleAllowCreateChange(param, val)"
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
          </div>
          
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="默认值">
                <n-input v-model:value="param.default" placeholder="默认值" style="width: 100%; min-width: 0" />
              </n-form-item>
            </n-gi>
            
            <n-gi v-if="param.type !== 'service' && param.type !== 'apps'">
              <n-form-item label="校验规则">
                <n-select v-model:value="param.rule" :options="ruleOptions" clearable />
              </n-form-item>
            </n-gi>
            
            <!-- Service类型的依赖Key，缩短显示 -->
            <n-gi v-if="param.type === 'service'">
              <n-form-item label="依赖Key" required>
                <n-input 
                  v-model:value="param.key" 
                  placeholder="如: mysql, redis, 值必须填写官方应用商店中应用的Key"
                  style="width: 100%; min-width: 0"
                />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="英文标签">
                <n-input v-model:value="param.labelEn" placeholder="English Label" style="width: 100%; min-width: 0" />
              </n-form-item>
            </n-gi>
            
            <n-gi>
              <n-form-item label="中文标签">
                <n-input v-model:value="param.labelZh" placeholder="中文标签" style="width: 100%; min-width: 0" />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <!-- 多语言标签开关 -->
          <n-grid cols="2" x-gap="12">
            <n-gi>
              <n-form-item label="启用多语言标签">
                <n-switch v-model:value="param.multiLanguageEnabled" />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <!-- 多语言标签配置 -->
          <div v-if="param.multiLanguageEnabled">
            <n-alert type="info" title="多语言标签配置" class="mb-4">
              启用后可通过下拉框选择语言，然后填写对应的标签值
            </n-alert>
            
            <n-form-item label="多语言标签" required>
              <div class="options-container">
                <div 
                  v-for="(labelItem, index) in param.multiLanguageLabels" 
                  :key="index" 
                  class="param-form"
                >
                  <n-grid cols="4" x-gap="8">
                    <n-gi span="1">
                      <n-select
                        v-model:value="labelItem.lang"
                        :options="getAvailableLanguages(param, index)"
                        @update:value="(newLang) => updateLanguageKey(param, labelItem.lang, newLang)"
                        placeholder="选择语言"
                        style="width: 100%; min-width: 0"
                      />
                    </n-gi>
                    <n-gi span="2">
                      <n-input
                        v-model:value="labelItem.label"
                        :placeholder="`${labelItem.lang} 标签值`"
                        style="width: 100%; min-width: 0"
                      />
                    </n-gi>
                    <n-gi>
                      <n-button
                        @click="removeLanguageLabel(param, labelItem.lang)"
                        type="error"
                        quaternary
                        size="small"
                      >
                        删除标签
                      </n-button>
                    </n-gi>
                  </n-grid>
                </div>
                
                <n-button
                  @click="addLanguageLabel(param)"
                  type="primary"
                  dashed
                  size="small"
                >
                  添加语言标签
                </n-button>
              </div>
            </n-form-item>
          </div>
          
          <n-grid cols="4" x-gap="12">
            <n-gi>
              <n-form-item label="是否必填">
                <n-switch v-model:value="param.required" />
              </n-form-item>
            </n-gi>
            
            <n-gi v-if="param.type !== 'service'">
              <n-form-item label="可编辑">
                <n-switch v-model:value="param.edit" />
              </n-form-item>
            </n-gi>
            
            <n-gi v-if="param.type !== 'service'">
              <n-form-item label="随机字符">
                <n-switch v-model:value="param.random" />
              </n-form-item>
            </n-gi>
            
            <n-gi v-if="param.type === 'apps'">
              <n-form-item label="Child设置">
                <n-switch v-model:value="param.childEnabled" />
              </n-form-item>
            </n-gi>
          </n-grid>
          
          <!-- 可选的服务依赖子菜单（仅在Apps类型下显示，由Child开关控制） -->
          <div v-if="param.type === 'apps' && param.childEnabled">
            <n-card title="可选的服务依赖子菜单" class="mb-4">
              <n-grid cols="2" x-gap="12">
                <n-gi>
                  <n-form-item label="默认值">
                    <n-input v-model:value="param.child.default" placeholder="默认值为空" style="width: 100%; min-width: 0" />
                  </n-form-item>
                </n-gi>
                
                <n-gi>
                  <n-form-item label="环境变量Key" required>
                    <n-input v-model:value="param.child.envKey" placeholder="如: PANEL_DB_HOST" style="width: 100%; min-width: 0" />
                  </n-form-item>
                </n-gi>
              </n-grid>
              
              <n-grid cols="2" x-gap="12">
                <n-gi>
                  <n-form-item label="是否必填">
                    <n-switch v-model:value="param.child.required" />
                  </n-form-item>
                </n-gi>
                
                <n-gi>
                  <n-form-item label="类型">
                    <n-select 
                      v-model:value="param.child.type" 
                      :options="[{ label: 'Service', value: 'service' }]" 
                      disabled
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
            </n-card>
          </div>
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
    
    <!-- 添加回到顶部的浮动按钮 -->
    <transition name="fade">
      <div
        v-if="showBackToTop"
        class="back-to-top-btn"
        title="返回顶部"
        @click="scrollToTop"
      >
        <svg t="1720595052079" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4279" width="200" height="200">
          <path d="M752.736 431.063C757.159 140.575 520.41 8.97 504.518 0.41V0l-0.45 0.205-0.41-0.205v0.41c-15.934 8.56-252.723 140.165-248.259 430.653-48.21 31.457-98.713 87.368-90.685 184.074 8.028 96.666 101.007 160.768 136.601 157.287 35.595-3.482 25.232-30.31 25.232-30.31l12.206-50.095s52.47 80.569 69.304 80.528c15.114-1.23 87-0.123 95.6 0h0.82c8.602-0.123 80.486-1.23 95.6 0 16.794 0 69.305-80.528 69.305-80.528l12.165 50.094s-10.322 26.83 25.272 30.31c35.595 3.482 128.574-60.62 136.602-157.286 8.028-96.665-42.475-152.617-90.685-184.074z m-248.669-4.26c-6.758-0.123-94.781-3.359-102.891-107.192 2.95-98.714 95.97-107.438 102.891-107.93 6.964 0.492 99.943 9.216 102.892 107.93-8.11 103.833-96.174 107.07-102.892 107.192z m-52.019 500.531c0 11.838-9.42 21.382-21.012 21.382a21.217 21.217 0 0 1-21.054-21.34V821.74c0-11.797 9.421-21.382 21.054-21.382 11.591 0 21.012 9.585 21.012 21.382v105.635z m77.333 57.222a21.504 21.504 0 0 1-21.34 21.626 21.504 21.504 0 0 1-21.34-21.626V827.474c0-11.96 9.543-21.668 21.299-21.668 11.796 0 21.38 9.708 21.38 21.668v157.082z m71.147-82.043c0 11.796-9.42 21.34-21.053 21.34a21.217 21.217 0 0 1-21.013-21.34v-75.367c0-11.755 9.421-21.299 21.013-21.299 11.632 0 21.053 9.544 21.053 21.3v75.366z" fill="#FFF" p-id="4280"></path>
        </svg>
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
  z-index: 999;
  position: fixed;
  bottom: 20px;
  right: 20px;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3eaf7c;
  padding: 10px;
  box-shadow: 2px 2px 10px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.back-to-top-btn:hover {
  background-color: #71cda3;
  transform: translateY(-2px);
}

.back-to-top-btn .icon {
  width: 100%;
  height: 100%;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


</style>