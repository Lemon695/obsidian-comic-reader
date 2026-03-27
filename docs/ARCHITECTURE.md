# Obsidian Comic Reader - 架构设计文档

## 目录

1. [项目概述](#项目概述)
2. [当前架构分析](#当前架构分析)
3. [升级设计目标](#升级设计目标)
4. [新架构设计](#新架构设计)
5. [模块详细设计](#模块详细设计)
6. [数据流设计](#数据流设计)
7. [开发任务清单](#开发任务清单)

---

## 项目概述

Obsidian Comic Reader 是一个为 Obsidian 笔记软件开发的漫画阅读插件，旨在为漫画爱好者提供沉浸式的阅读体验。

### 当前版本功能

- ZIP 格式漫画文件解析
- 单页/韩漫模式阅读
- 缩略图导航
- 历史记录管理
- 漫画库浏览

### 升级愿景

打造一个**功能完整、体验流畅、高度可扩展**的漫画阅读器，支持多种格式、多种阅读模式，并提供完善的阅读进度管理。

---

## 当前架构分析

### 现有目录结构

```
src/
├── main.ts                    # 插件入口（295行，职责过多）
├── constants.ts               # 常量定义
├── type/
│   └── types.ts               # 类型定义
└── view/
    ├── manga-reader-view.ts   # 阅读视图（433行，职责过多）
    └── manga-library-view.ts  # 漫画库视图
```

### 存在的问题

#### 1. 架构层面
- **职责不清晰**: main.ts 同时处理插件生命周期、历史记录、文件访问
- **耦合度高**: 视图层直接处理 ZIP 解析、图片加载等业务逻辑
- **缺少服务层**: 没有独立的服务模块处理核心业务
- **状态管理分散**: 阅读状态、设置状态分散在各处

#### 2. 功能层面
- **格式支持有限**: 仅支持 ZIP，不支持 CBR/CBZ/PDF
- **阅读体验不完整**: 缺少书签、进度保存、双页模式
- **设置功能缺失**: 无法通过 UI 配置插件
- **国际化缺失**: 界面文本硬编码

#### 3. 代码质量
- **类型安全不足**: 多处使用类型断言
- **错误处理不完善**: 错误信息不友好
- **缺少测试**: 无单元测试覆盖
- **文档不完善**: README 几乎为空

---

## 升级设计目标

### 核心原则

1. **单一职责**: 每个模块只负责一件事
2. **开闭原则**: 对扩展开放，对修改关闭
3. **依赖倒置**: 高层模块不依赖低层模块，都依赖抽象
4. **接口隔离**: 使用小而专一的接口

### 设计目标

| 目标 | 描述 |
|------|------|
| 高内聚低耦合 | 模块职责清晰，依赖关系简单 |
| 可扩展性 | 易于添加新格式、新阅读模式 |
| 可测试性 | 核心逻辑可独立测试 |
| 用户体验 | 流畅的阅读体验，完善的功能 |
| 性能优化 | 大文件加载、内存管理优化 |

---

## 新架构设计

### 目录结构

```
src/
├── main.ts                         # 插件入口（精简）
├── constants.ts                    # 常量定义
│
├── types/                          # 类型定义
│   ├── index.ts                    # 类型导出
│   ├── comic.ts                    # 漫画相关类型
│   ├── reader.ts                   # 阅读器相关类型
│   ├── settings.ts                 # 设置相关类型
│   └── events.ts                   # 事件相关类型
│
├── core/                           # 核心模块
│   ├── plugin-manager.ts           # 插件管理器
│   ├── event-bus.ts                # 事件总线
│   └── state-manager.ts            # 状态管理器
│
├── services/                       # 服务层
│   ├── comic-parser/               # 漫画解析服务
│   │   ├── index.ts                # 解析器工厂
│   │   ├── base-parser.ts          # 解析器基类
│   │   ├── zip-parser.ts           # ZIP 解析器
│   │   ├── cbz-parser.ts           # CBZ 解析器
│   │   ├── cbr-parser.ts           # CBR 解析器
│   │   └── pdf-parser.ts           # PDF 解析器
│   │
│   ├── image-service.ts            # 图片处理服务
│   ├── storage-service.ts          # 存储服务
│   ├── history-service.ts          # 历史记录服务
│   ├── bookmark-service.ts         # 书签服务
│   └── file-service.ts             # 文件访问服务
│
├── views/                          # 视图层
│   ├── reader/                     # 阅读器视图
│   │   ├── manga-reader-view.ts    # 主视图
│   │   ├── components/             # 视图组件
│   │   │   ├── toolbar.ts          # 工具栏
│   │   │   ├── thumbnail-bar.ts    # 缩略图栏
│   │   │   ├── page-indicator.ts   # 页码指示器
│   │   │   └── context-menu.ts     # 右键菜单
│   │   └── modes/                  # 阅读模式
│   │       ├── base-mode.ts        # 模式基类
│   │       ├── single-page-mode.ts # 单页模式
│   │       ├── double-page-mode.ts # 双页模式
│   │       └── webtoon-mode.ts     # 韩漫模式
│   │
│   ├── library/                    # 漫画库视图
│   │   ├── manga-library-view.ts   # 主视图
│   │   └── components/             # 视图组件
│   │       ├── search-bar.ts       # 搜索栏
│   │       ├── file-table.ts       # 文件表格
│   │       └── folder-tree.ts      # 文件夹树
│   │
│   └── settings/                   # 设置视图
│       └── settings-tab.ts         # 设置标签页
│
├── utils/                          # 工具函数
│   ├── file-utils.ts               # 文件工具
│   ├── image-utils.ts              # 图片工具
│   ├── format-utils.ts             # 格式化工具
│   └── dom-utils.ts                # DOM 工具
│
├── i18n/                           # 国际化
│   ├── index.ts                    # i18n 管理器
│   ├── zh-CN.ts                    # 中文
│   └── en.ts                       # 英文
│
└── styles/                         # 样式（可选拆分）
    ├── reader.css                  # 阅读器样式
    ├── library.css                 # 漫画库样式
    └── settings.css                # 设置样式
```

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Plugin Entry                             │
│                          (main.ts)                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Core Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Plugin    │  │   Event     │  │       State             │  │
│  │   Manager   │  │   Bus       │  │       Manager           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Comic   │ │  Image   │ │ History  │ │ Bookmark │           │
│  │  Parser  │ │  Service │ │ Service  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐                                      │
│  │  File    │ │ Storage  │                                      │
│  │  Service │ │ Service  │                                      │
│  └──────────┘ └──────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        View Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Reader View    │  │  Library View   │  │  Settings Tab   │  │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │                 │  │
│  │  │ Components│  │  │  │ Components│  │  │                 │  │
│  │  └───────────┘  │  │  └───────────┘  │  │                 │  │
│  │  ┌───────────┐  │  │                 │  │                 │  │
│  │  │   Modes   │  │  │                 │  │                 │  │
│  │  └───────────┘  │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 模块详细设计

### 1. 核心模块 (Core)

#### 1.1 事件总线 (EventBus)

用于模块间解耦通信。

```typescript
// src/core/event-bus.ts
interface EventMap {
  'comic:loaded': { comic: ComicInfo };
  'comic:page-changed': { index: number; total: number };
  'comic:mode-changed': { mode: ReadingMode };
  'bookmark:added': { bookmark: Bookmark };
  'history:updated': { history: HistoryItem[] };
  'settings:changed': { settings: Partial<Settings> };
}

class EventBus {
  private listeners: Map<string, Set<Function>>;

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void;
  off<K extends keyof EventMap>(event: K, callback: Function): void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
}
```

#### 1.2 状态管理器 (StateManager)

集中管理应用状态。

```typescript
// src/core/state-manager.ts
interface AppState {
  currentComic: ComicInfo | null;
  currentPage: number;
  readingMode: ReadingMode;
  settings: Settings;
  history: HistoryItem[];
  bookmarks: Bookmark[];
}

class StateManager {
  private state: AppState;

  getState(): AppState;
  setState(partial: Partial<AppState>): void;
  subscribe(callback: (state: AppState) => void): () => void;
}
```

### 2. 服务层 (Services)

#### 2.1 漫画解析服务

使用策略模式支持多种格式。

```typescript
// src/services/comic-parser/base-parser.ts
abstract class BaseComicParser {
  abstract readonly supportedExtensions: string[];
  abstract canParse(file: File): boolean;
  abstract parse(file: File): Promise<ComicData>;
  abstract getPage(index: number): Promise<Blob>;
  abstract getThumbnail(index: number): Promise<Blob>;
  abstract dispose(): void;
}

// src/services/comic-parser/index.ts
class ComicParserFactory {
  private parsers: BaseComicParser[] = [];

  register(parser: BaseComicParser): void;
  getParser(file: File): BaseComicParser | null;
}
```

#### 2.2 图片服务

处理图片加载、缓存、转换。

```typescript
// src/services/image-service.ts
class ImageService {
  private cache: Map<string, Blob>;
  private preloadQueue: number[];

  loadImage(index: number): Promise<string>;  // 返回 Blob URL
  preloadImages(indices: number[]): void;
  generateThumbnail(blob: Blob, size: number): Promise<Blob>;
  copyToClipboard(blob: Blob): Promise<void>;
  clearCache(): void;
}
```

#### 2.3 书签服务

管理阅读书签和进度。

```typescript
// src/services/bookmark-service.ts
interface Bookmark {
  id: string;
  comicPath: string;
  pageIndex: number;
  createdAt: number;
  note?: string;
}

interface ReadingProgress {
  comicPath: string;
  lastPage: number;
  totalPages: number;
  lastReadAt: number;
}

class BookmarkService {
  addBookmark(comicPath: string, pageIndex: number, note?: string): Promise<Bookmark>;
  removeBookmark(id: string): Promise<void>;
  getBookmarks(comicPath: string): Promise<Bookmark[]>;

  saveProgress(comicPath: string, pageIndex: number, totalPages: number): Promise<void>;
  getProgress(comicPath: string): Promise<ReadingProgress | null>;
}
```

### 3. 视图层 (Views)

#### 3.1 阅读模式

使用策略模式支持多种阅读模式。

```typescript
// src/views/reader/modes/base-mode.ts
abstract class BaseReadingMode {
  abstract readonly name: string;
  abstract readonly icon: string;

  abstract render(container: HTMLElement, images: string[]): void;
  abstract goToPage(index: number): void;
  abstract nextPage(): void;
  abstract previousPage(): void;
  abstract dispose(): void;
}

// 具体模式
class SinglePageMode extends BaseReadingMode { }
class DoublePageMode extends BaseReadingMode { }
class WebtoonMode extends BaseReadingMode { }
```

#### 3.2 视图组件

可复用的 UI 组件。

```typescript
// src/views/reader/components/toolbar.ts
class Toolbar {
  constructor(container: HTMLElement, options: ToolbarOptions);

  addButton(icon: string, tooltip: string, onClick: () => void): void;
  addSeparator(): void;
  addDropdown(options: DropdownOptions): void;
  setPageInfo(current: number, total: number): void;
}

// src/views/reader/components/thumbnail-bar.ts
class ThumbnailBar {
  constructor(container: HTMLElement, options: ThumbnailBarOptions);

  setImages(images: string[]): void;
  setCurrentIndex(index: number): void;
  onSelect(callback: (index: number) => void): void;
  show(): void;
  hide(): void;
}
```

### 4. 类型定义

```typescript
// src/types/comic.ts
interface ComicInfo {
  path: string;
  name: string;
  format: ComicFormat;
  pageCount: number;
  fileSize: number;
  lastModified: number;
}

type ComicFormat = 'zip' | 'cbz' | 'cbr' | 'pdf';

interface ComicData {
  info: ComicInfo;
  pages: PageInfo[];
}

interface PageInfo {
  index: number;
  filename: string;
  width?: number;
  height?: number;
}

// src/types/reader.ts
type ReadingMode = 'single' | 'double' | 'webtoon';
type ReadingDirection = 'ltr' | 'rtl';  // 左到右 / 右到左

interface ReaderState {
  comic: ComicInfo | null;
  currentPage: number;
  mode: ReadingMode;
  direction: ReadingDirection;
  zoom: number;
  isFullscreen: boolean;
}

// src/types/settings.ts
interface Settings {
  // 阅读设置
  defaultMode: ReadingMode;
  defaultDirection: ReadingDirection;
  defaultZoom: number;
  autoSaveProgress: boolean;

  // 漫画库设置
  libraryFolders: string[];
  scanSubfolders: boolean;

  // 历史记录设置
  maxHistoryItems: number;

  // 界面设置
  showThumbnailBar: boolean;
  thumbnailSize: number;
  language: 'zh-CN' | 'en';
}
```

---

## 数据流设计

### 打开漫画流程

```
用户操作
    │
    ▼
┌─────────────────┐
│   FileService   │  请求文件访问
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ComicParser    │  解析漫画文件
│    Factory      │  选择合适的解析器
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  StateManager   │  更新状态
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    EventBus     │  发送 comic:loaded 事件
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│Reader │ │ History   │
│ View  │ │ Service   │
└───────┘ └───────────┘
```

### 翻页流程

```
用户操作 (键盘/点击/缩略图)
    │
    ▼
┌─────────────────┐
│  ReadingMode    │  处理翻页逻辑
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ImageService   │  加载图片（带缓存）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  StateManager   │  更新当前页码
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    EventBus     │  发送 comic:page-changed 事件
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────────┐
│Page   │ │Thumb  │ │ Bookmark  │
│Indicator│ │Bar  │ │ Service   │
└───────┘ └───────┘ └───────────┘
                    (自动保存进度)
```

---

## 开发任务清单

### Phase 1: 基础架构重构 (优先级: 高)

- [ ] **1.1 创建核心模块**
  - [ ] 实现 EventBus 事件总线
  - [ ] 实现 StateManager 状态管理器
  - [ ] 编写单元测试

- [ ] **1.2 重构类型定义**
  - [ ] 拆分类型文件
  - [ ] 完善类型定义
  - [ ] 移除类型断言

- [ ] **1.3 创建服务层**
  - [ ] 实现 FileService 文件服务
  - [ ] 实现 StorageService 存储服务
  - [ ] 重构 HistoryService 历史记录服务

### Phase 2: 漫画解析器重构 (优先级: 高)

- [ ] **2.1 解析器架构**
  - [ ] 创建 BaseComicParser 基类
  - [ ] 实现 ComicParserFactory 工厂
  - [ ] 重构 ZipParser

- [ ] **2.2 新格式支持**
  - [ ] 实现 CBZ 解析器
  - [ ] 实现 CBR 解析器 (需要 unrar.js)
  - [ ] 实现 PDF 解析器 (需要 pdf.js)

### Phase 3: 阅读器视图重构 (优先级: 高)

- [ ] **3.1 阅读模式重构**
  - [ ] 创建 BaseReadingMode 基类
  - [ ] 重构 SinglePageMode
  - [ ] 重构 WebtoonMode
  - [ ] 实现 DoublePageMode

- [ ] **3.2 组件化**
  - [ ] 提取 Toolbar 组件
  - [ ] 提取 ThumbnailBar 组件
  - [ ] 提取 PageIndicator 组件
  - [ ] 提取 ContextMenu 组件

- [ ] **3.3 图片服务**
  - [ ] 实现 ImageService
  - [ ] 添加图片缓存
  - [ ] 添加预加载功能
  - [ ] 优化内存管理

### Phase 4: 新功能开发 (优先级: 中)

- [ ] **4.1 书签功能**
  - [ ] 实现 BookmarkService
  - [ ] 添加书签 UI
  - [ ] 实现阅读进度自动保存

- [ ] **4.2 设置界面**
  - [ ] 实现 SettingsTab
  - [ ] 添加阅读设置
  - [ ] 添加漫画库设置
  - [ ] 添加界面设置

- [ ] **4.3 阅读体验增强**
  - [ ] 实现缩放功能
  - [ ] 实现全屏模式
  - [ ] 实现阅读方向切换 (LTR/RTL)
  - [ ] 实现自动翻页

### Phase 5: 漫画库增强 (优先级: 中)

- [ ] **5.1 功能增强**
  - [ ] 支持多文件夹
  - [ ] 添加文件夹树视图
  - [ ] 显示阅读进度
  - [ ] 显示封面预览

- [ ] **5.2 性能优化**
  - [ ] 实现虚拟滚动
  - [ ] 添加封面缓存
  - [ ] 优化大量文件扫描

### Phase 6: 国际化与文档 (优先级: 中)

- [ ] **6.1 国际化**
  - [ ] 实现 i18n 管理器
  - [ ] 提取所有文本
  - [ ] 添加中文翻译
  - [ ] 添加英文翻译

- [ ] **6.2 文档完善**
  - [ ] 完善 README
  - [ ] 添加使用说明
  - [ ] 添加截图/GIF
  - [ ] 添加开发文档

### Phase 7: 质量保证 (优先级: 低)

- [ ] **7.1 测试**
  - [ ] 配置测试框架
  - [ ] 编写核心模块测试
  - [ ] 编写服务层测试
  - [ ] 编写集成测试

- [ ] **7.2 代码质量**
  - [ ] 配置 ESLint 规则
  - [ ] 添加 Prettier
  - [ ] 启用严格 TypeScript 检查
  - [ ] 代码审查和重构

---

## 技术选型

### 新增依赖

| 依赖 | 用途 | 备注 |
|------|------|------|
| unrar.js | CBR 格式解析 | 纯 JS 实现 |
| pdfjs-dist | PDF 格式解析 | Mozilla 官方库 |
| vitest | 单元测试 | 快速、兼容 Jest |

### 构建优化

- 考虑代码分割，按需加载解析器
- 使用 Web Worker 处理大文件解析
- 优化 Tree Shaking

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| CBR 解析库体积大 | 插件体积增加 | 按需加载 |
| PDF.js 兼容性 | 部分 PDF 无法解析 | 提供降级方案 |
| 大文件内存占用 | 性能问题 | 流式加载、及时释放 |
| 重构影响现有功能 | 用户体验下降 | 分阶段发布、充分测试 |

---

## 版本规划

| 版本 | 内容 | 预计 |
|------|------|------|
| v1.1.0 | Phase 1-2: 架构重构 + 新格式支持 | - |
| v1.2.0 | Phase 3: 阅读器重构 | - |
| v1.3.0 | Phase 4: 书签 + 设置 | - |
| v1.4.0 | Phase 5: 漫画库增强 | - |
| v1.5.0 | Phase 6: 国际化 | - |
| v2.0.0 | 全部完成 + 稳定版 | - |

---

## 附录

### A. 快捷键规划

| 快捷键 | 功能 |
|--------|------|
| ← / → | 上一页 / 下一页 |
| ↑ / ↓ | 滚动 (韩漫模式) |
| Home / End | 第一页 / 最后一页 |
| Space | 下一页 |
| F | 全屏切换 |
| B | 添加书签 |
| 1 / 2 / 3 | 切换阅读模式 |
| + / - | 缩放 |
| 0 | 重置缩放 |
| Esc | 退出全屏 / 关闭 |

### B. 设置项规划

```typescript
interface Settings {
  // 阅读设置
  defaultMode: 'single' | 'double' | 'webtoon';
  defaultDirection: 'ltr' | 'rtl';
  defaultZoom: number;  // 100
  autoSaveProgress: boolean;  // true
  preloadPages: number;  // 3

  // 漫画库设置
  libraryFolders: string[];  // ['/']
  scanSubfolders: boolean;  // true
  showHiddenFiles: boolean;  // false

  // 历史记录设置
  maxHistoryItems: number;  // 50
  clearHistoryOnExit: boolean;  // false

  // 界面设置
  showThumbnailBar: boolean;  // true
  thumbnailSize: number;  // 80
  showPageNumber: boolean;  // true
  showToolbar: boolean;  // true
  language: 'zh-CN' | 'en' | 'auto';  // 'auto'

  // 性能设置
  maxCacheSize: number;  // 100 (MB)
  enableHardwareAcceleration: boolean;  // true
}
```

---

*文档版本: 1.0*
*创建日期: 2026-02-06*
*作者: Claude (AI Assistant)*
