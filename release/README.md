# 下载即用的发行版

普通听众请到 [GitHub Releases](https://github.com/yuxinpu0110-wq/Mahler-Lexicon/releases/latest) 下载 `Mahler-Lexicon-*-windows-x64.zip`。

**不要把 GitHub 的 “Code → Download ZIP” 当作免安装包**：那是源码，仍需要开发环境。

发行包适用于 Windows 10／11 的 x64 电脑，内置运行环境、五个完整乐章录音及谱页。完整解压后双击 `START.cmd`，浏览器会自动打开；无需另装 Node.js、FFmpeg 或导入音频。详细操作与常见问题见[使用指南](使用指南.md)。

此目录下的 `Mahler-Lexicon-*-windows-x64/` 是本地生成的独立成品目录，对应 ZIP 作为 Release 附件上传，不进入 Git。可复制整个文件夹到其他电脑使用。

开发者重新封装：

```powershell
npm ci
npm run release:package
```

打包需要 Windows x64、Node.js 24 和构建录音所用的 FFmpeg。脚本复制本机 Node.js 运行时、获取对应版本的官方许可证，构建清单、校验和与 ZIP；不包含本地工作记录、工具缓存或开发依赖。分发前可运行 `npm run test:portable`。

macOS／Linux 用户可从源码运行：安装 Node.js 24 与 FFmpeg 后执行 `npm ci`、`npm run dev`。本次免安装附件为 Windows x64 版。
