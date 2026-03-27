# Obsidian Comic Reader

一个功能强大的 Obsidian 漫画阅读插件，让你在 Obsidian 中享受沉浸式的漫画阅读体验。

## ✨ 功能特性

### 📖 阅读功能
- **多格式支持**: 支持 ZIP/CBZ 格式漫画文件
- **多种阅读模式**:
  - 单页模式 - 传统翻页阅读
  - 双页模式 - 同时显示两页，适合大屏幕
  - 韩漫模式 (Webtoon) - 长条滚动阅读，适合韩国条漫
- **缩略图导航**: 底部缩略图栏，快速跳转到任意页面
- **键盘快捷键**: 方向键翻页，流畅阅读体验
- **图片复制**: 右键菜单复制当前图片到剪贴板
- **图片缓存**: 智能缓存和预加载，流畅翻页体验

### �� 漫画管理
- **漫画库**: 扫描 Vault 中的漫画文件，表格展示
- **搜索过滤**: 快速搜索漫画文件
- **多字段排序**: 按文件名、大小、修改时间、最近阅读排序
- **历史记录**: 自动记录阅读历史，快速重新打开

### ⚙️ 设置界面
- **阅读设置**: 默认模式、阅读方向、自动保存进度
- **漫画库设置**: 扫描文件夹、子文件夹扫描
- **界面设置**: 缩略图大小、页码显示、语言
- **性能设置**: 缓存大小、预加载页数

## 🚀 安装

### 手动安装
1. 下载最新的 release 文件
2. 解压到 Obsidian 插件目录: `<vault>/.obsidian/plugins/comic-reader/`
3. 重启 Obsidian
4. 在设置中启用插件

### 从源码构建
```bash
# 克隆仓库
git clone https://github.com/Lemon695/obsidian-comic-reader.git

# 安装依赖
npm install

# 构建
npm run build

# 开发模式
npm run dev
```

## 📖 使用方法

### 打开漫画
1. 点击左侧 Ribbon 栏的 📖 图标
2. 选择 ZIP/CBZ 格式的漫画文件
3. 开始阅读！

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `←` / `→` | 上一页 / 下一页 |
| `Home` / `End` | 第一页 / 最后一页 |
| `Space` | 下一页 |
| `1` / `2` / `3` | 切换阅读模式 |
| 鼠标移到底部 | 显示缩略图栏 |
| 右键点击 | 显示菜单 |

### 漫画库
1. 点击左侧 Ribbon 栏的 📚 图标打开漫画库
2. 浏览 Vault 中的所有漫画文件
3. 使用搜索框过滤文件
4. 点击表头排序
5. 点击文件名打开漫画

### 历史记录
1. 点击左侧 Ribbon 栏的 🕐 图标
2. 查看最近阅读的漫画
3. 点击重新打开

### 阅读模式切换
- **单页模式**: 默认模式，适合传统漫画
- **双页模式**: 同时显示两页，适合大屏幕
- **韩漫模式**: 长条滚动，适合韩国条漫

## 🛠️ 开发

### 项目结构
```
src/
├── main.ts                         # 插件入口
├── constants.ts                    # 常量定义
│
├── core/                           # 核心模块
│   ├── event-bus.ts                # 事件总线
│   └── state-manager.ts            # 状态管理器
│
├── types/                          # 类型定义
│   ├── comic.ts                    # 漫画类型
│   ├── reader.ts                   # 阅读器类型
│   ├── settings.ts                 # 设置类型
│   └── history.ts                  # 历史记录类型
│
├── services/                       # 服务层
│   ├── comic-parser/               # 漫画解析器
│   │   ├── base-parser.ts          # 解析器基类
│   │   └── zip-parser.ts           # ZIP 解析器
│   ├── file-service.ts             # 文件服务
│   ├── storage-service.ts          # 存储服务
│   ├── history-service.ts          # 历史记录服务
│   └── image-service.ts            # 图片服务
│
└── views/                          # 视图层
    ├── reader/                     # 阅读器视图
    │   ├── manga-reader-view.ts    # 主视图
    │   ├── components/             # UI 组件
    │   └── modes/                  # 阅读模式
    ├── library/                    # 漫画库视图
    └── settings/                   # 设置标签页
```

### 架构设计
- **事件驱动**: 使用 EventBus 实现模块间解耦通信
- **服务层**: 业务逻辑与视图分离，提高可测试性
- **策略模式**: 支持多种漫画格式和阅读模式的扩展
- **组件化**: UI 组件可复用，易于维护

### 技术栈
- TypeScript
- Obsidian API
- JSZip (ZIP 文件解析)
- esbuild (构建工具)

### 开发命令
```bash
npm run dev      # 开发模式（监听文件变化）
npm run build    # 生产构建
```

## 📋 路线图

查看 [ARCHITECTURE.md](docs/ARCHITECTURE.md) 了解详细的架构设计和开发计划。

### 已完成
- [x] ZIP/CBZ 格式支持
- [x] 单页/双页/韩漫阅读模式
- [x] 设置界面
- [x] 架构重构（服务层、事件总线）

### 计划中的功能
- [ ] CBR 格式支持
- [ ] PDF 格式支持
- [ ] 书签功能
- [ ] 阅读进度自动保存
- [ ] 缩放功能
- [ ] 全屏模式
- [ ] 阅读方向切换 (LTR/RTL)
- [ ] 国际化支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的知识管理工具
- [JSZip](https://stuk.github.io/jszip/) - JavaScript ZIP 库
