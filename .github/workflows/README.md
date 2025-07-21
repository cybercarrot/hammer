# GitHub Actions 构建说明

本项目配置了自动化构建和发布流程，支持多平台打包。

## Workflow 文件

### 1. `build.yml` - 正式构建和发布

**触发条件：**
- 推送 git tag (格式: `v*`)
- 手动触发 (workflow_dispatch)
- Pull Request 到 master 分支

**支持平台：**
- Windows x64 (Squirrel 安装包)
- macOS x64 (ZIP 压缩包)
- macOS ARM64 (ZIP 压缩包)
- Linux x64 (DEB 和 RPM 包)

**产物：**
- Windows: `*.exe` 安装程序, `*.nupkg` 更新包
- macOS: `*.zip` 应用程序包
- Linux: `*.deb` 和 `*.rpm` 包

### 2. `test-build.yml` - 测试构建

**触发条件：**
- 推送到 master/main/develop 分支
- Pull Request 到 master/main 分支
- 手动触发

**功能：**
- 代码检查 (linting)
- 格式检查 (formatting)
- 构建测试 (package/make)

## 使用说明

### 发布新版本

1. 确保代码已合并到 master 分支
2. 更新 `package.json` 中的版本号
3. 创建并推送 git tag：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions 会自动构建所有平台的包并创建 Release

### 测试构建

- 推送代码到 master 分支会自动触发测试构建
- 可以在 Actions 页面手动触发测试构建

### 查看构建状态

访问项目的 GitHub Actions 页面查看构建状态和下载构建产物。

## 配置文件

### forge.config.ts

已配置支持多平台打包：
- Windows: MakerSquirrel (自动更新支持)
- macOS: MakerZIP  
- Linux: MakerDeb + MakerRpm

### package.json

包含所有必需的 Electron Forge 依赖：
- `@electron-forge/maker-squirrel`
- `@electron-forge/maker-zip`
- `@electron-forge/maker-deb`
- `@electron-forge/maker-rpm`

## 注意事项

1. **Windows 代码签名**: 如需代码签名，需要在 GitHub Secrets 中配置证书信息
2. **macOS 公证**: 如需 macOS 公证，需要配置 Apple Developer 证书
3. **Linux 依赖**: 构建时会自动安装必要的系统依赖
4. **缓存**: 使用 Node.js 缓存加速构建过程

## 故障排除

### 常见问题

1. **构建失败**: 检查依赖是否正确安装
2. **平台特定问题**: 查看对应平台的构建日志
3. **发布失败**: 确保 GITHUB_TOKEN 权限正确

### 调试步骤

1. 查看 Actions 日志中的 "List output files" 步骤
2. 检查 artifacts 上传是否成功
3. 验证 forge.config.ts 配置是否正确