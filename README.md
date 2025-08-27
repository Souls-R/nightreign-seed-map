# Night Reign Seed Map Generator

一个基于 Next.js 和 React 的地图生成器应用，使用 Tailwind CSS 和 shadcn/ui 组件库构建。

## 功能特性

- 🗺️ **地图生成**: 输入地图ID即可生成对应的游戏地图
- 🎨 **现代化UI**: 使用 Tailwind CSS 和 shadcn/ui 构建的美观界面
- 📱 **响应式设计**: 支持桌面和移动设备
- ⚡ **高性能**: 基于 Next.js 15 的现代化架构
- 🧩 **组件化**: 模块化的组件结构，易于维护和扩展

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **图标**: Lucide React

## 项目结构

```
src/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 应用布局
│   └── page.tsx             # 主页面
└── components/
    ├── ui/                  # shadcn/ui 组件
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── card.tsx
    │   ├── label.tsx
    │   └── alert.tsx
    ├── MapGenerator.tsx     # 主生成器组件
    ├── MapInput.tsx         # 输入组件
    ├── MapCanvas.tsx        # Canvas 显示组件
    └── MapStatus.tsx        # 状态显示组件
public/
├── maps.json               # 地图数据
└── static/                 # 地图资源图片
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
# 或
yarn build
yarn start
# 或
pnpm build
pnpm start
```

## 使用说明

1. 在地图ID输入框中输入有效的地图ID（如 0, 1, 2 等）
2. 点击"生成地图"按钮
3. 等待地图生成完成
4. 查看生成的地图图像，包含所有游戏元素和标注

## 组件说明

### MapGenerator
主组件，负责整体业务逻辑和状态管理。

### MapInput
输入组件，包含地图ID输入框和生成按钮。

### MapCanvas
Canvas 显示组件，用于渲染生成的地图。

### MapStatus
状态显示组件，显示加载状态和错误信息。

## 部署

推荐使用 Vercel 进行部署：

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 自动部署完成

## 许可证

MIT License
