# 1Panel-Tools

## 概述

1Panel-Tools 是一个专门设计的工具集，旨在简化为 1Panel AppStore 创建应用程序的过程。该集合中的主要工具是 Docker Compose 到 1Panel AppStore 的转换器，它将标准的 Docker Compose 文件转换为 1Panel AppStore 所需的格式。

## 功能特点

- **Docker Compose 转换**：自动将 Docker Compose 文件转换为 1Panel AppStore 格式
- **参数配置**：轻松定义和管理应用程序参数
- **元数据管理**：设置应用程序名称、描述、标签和其他元数据
- **多语言支持**：配置中英文描述
- **导出功能**：下载转换后的文件，准备提交到 1Panel AppStore

## 快速开始

### 前提条件

- Node.js (v14 或更高版本)
- pnpm (v9.11.0 或更高版本)

### 安装

```bash
# 克隆仓库
git clone https://github.com/arch3rPro/1Panel-Tools.git
cd 1Panel-Tools

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

应用程序将自动重定向到 Docker Compose 到 1Panel AppStore 的转换工具。

## 使用方法

1. **输入 Docker Compose**：将您的 Docker Compose 文件粘贴到编辑器中
2. **配置应用程序**：设置应用程序名称、键值、描述和其他元数据
3. **定义参数**：为您的应用程序添加参数（端口、环境变量等）
4. **预览转换**：查看生成的 1Panel AppStore 文件
5. **导出**：下载转换后的文件，用于 1Panel AppStore

### Docker 使用方法

#### 使用 Docker Run

```bash
# 拉取并运行 Docker 镜像
docker run -d --name 1panel-tools -p 8080:80 vuldocker/1panel-tools:latest
```

访问工具：http://localhost:8080

#### 使用 Docker Compose

使用项目 `docker-compose.yml` 文件，修改映射端口，内容如下：

```yaml
version: '3'
services:
  1panel-tools:
    image: vuldocker/1panel-tools:latest
    container_name: 1panel-tools
    ports:
      - "8080:80"
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

访问工具：http://localhost:8080

## 1Panel AppStore 格式

转换器生成的文件遵循 1Panel AppStore 格式：

```
├── app-key/
    ├── logo.png
    ├── data.yml
    ├── README.md
    └── version/
        ├── data.yml
        ├── docker-compose.yml
        └── scripts/
```

## 许可证

本项目采用 GNU GPLv3 许可证 - 详情请参阅 LICENSE 文件。

## 致谢

- 基于 IT-Tools 项目框架
- 专为 1Panel AppStore 应用程序开发设计