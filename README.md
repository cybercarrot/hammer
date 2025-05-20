# 锤子 - 哔哩哔哩直播助手

一个功能丰富的B站直播辅助工具，专为B站主播设计，包含弹幕机、点歌机和控制台三大核心功能。

## 功能特点

### 弹幕机
- 无缝连接B站直播间
- 集成 [LAPLACE Chat](https://chat.laplace.live/) 作为弹幕展示系统
- 提供OBS专用链接，实现透明背景弹幕效果
- 支持弹幕同步设置和密钥管理

### 控制台
- 集成LAPLACE控制面板
- 实时直播数据监控
- 礼物统计和互动管理
- 支持热插拔式关联账号

### 点歌机（开发中）
- 支持观众点歌
- 歌曲队列管理
- 多平台音乐源支持

## 技术栈

- **主框架**：Electron + React + TypeScript
- **UI组件**：Radix UI + TailwindCSS
- **状态管理**：Zustand
- **构建工具**：Vite + Electron Forge

## 安装使用

### 环境要求
- Node.js 16+
- npm 或 yarn

### 开发环境设置
1. 克隆仓库
```
git clone https://github.com/yourusername/hammer.git
cd hammer
```

2. 安装依赖
```
npm install
```

3. 运行开发环境
```
npm run start
```

### 打包应用
```
npm run make
```

## 使用方法

1. 启动应用，默认进入弹幕机页面
2. 关联B站账号（通过设置页面）
3. 在弹幕机页面连接到LAPLACE Chat
4. 设置同步密钥以启用弹幕功能
5. 复制OBS链接以在OBS中使用透明背景弹幕

## 常见问题

- **Q: 如何关联B站账号？**
  A: 点击右上角用户图标，按照提示完成登录

- **Q: 如何在OBS中使用透明弹幕？**
  A: 在弹幕机页面复制OBS链接，然后在OBS中添加浏览器源并粘贴该链接

## 开发指南

欢迎贡献代码或提交问题！在提交PR前，请确保代码符合项目的格式规范：

```
npm run format
```

## 许可证

MIT 