# 哔哩哔哩直播助手

一个功能丰富的B站直播辅助工具，包含弹幕机、点歌机和控制台三大功能。

## 功能特点

### 弹幕机
- 支持连接到任何B站直播间
- 提供OBS专用链接，实现透明背景弹幕效果
- 使用 [LAPLACE Chat](https://chat.laplace.live/) 作为弹幕源

### 点歌机（开发中）
- 支持观众点歌
- 歌曲队列管理
- 多平台音乐源支持

### 控制台（开发中）
- 直播数据监控
- 礼物统计
- 用户互动管理

## 安装使用

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装步骤
1. 克隆仓库
```
git clone https://github.com/yourusername/bilibili-live-assistant.git
cd bilibili-live-assistant
```

2. 安装依赖
```
npm install
```

3. 运行开发环境
```
npm run start
```

4. 打包应用
```
npm run make
```

## 使用方法

1. 启动应用，默认进入弹幕机页面
2. 输入B站直播间房间号（纯数字ID）
3. 点击"连接"按钮
4. 如需OBS使用，可复制弹幕机底部显示的OBS链接

## 技术栈

- Electron
- React
- TypeScript
- TailwindCSS
- Zustand (状态管理)

## 贡献指南

欢迎提交 Pull Request 或 Issue！

## 许可证

MIT 