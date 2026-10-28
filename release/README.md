# 下载即用的发行版

请到 [GitHub Releases](https://github.com/yuxinpu0110-wq/Mahler-Lexicon/releases/latest) 选择平台：`windows-x64.zip` 为Windows版；`macos-arm64.zip` 为Apple芯片Mac版；`macos-x64.zip` 为Intel Mac版。

**不要把 GitHub 的 “Code → Download ZIP” 当作免安装包**：那是源码，仍需要开发环境。

发行包适用于 Windows 10／11 的 x64 电脑，内置运行环境、五个完整乐章录音及谱页。完整解压后双击 `START.cmd`，浏览器会自动打开；无需另装 Node.js、FFmpeg 或导入音频。详细操作与常见问题见[使用指南](使用指南.md)。

此目录下的 `Mahler-Lexicon-*-windows-x64/` 是本地生成的独立成品目录，对应 ZIP 作为 Release 附件上传，不进入 Git。可复制整个文件夹到其他电脑使用。

开发者重新封装：

```powershell
npm ci
npm run release:package
```

打包需要 Windows x64、Node.js 24 和构建录音所用的 FFmpeg。脚本复制本机 Node.js 运行时、获取对应版本的官方许可证，构建清单、校验和与 ZIP；不包含本地工作记录、工具缓存或开发依赖。分发前可运行 `npm run test:portable`。

Mac便携包需要macOS 13.5及以上，解压后运行`START.command`，无需另装运行时。Mac包在Windows交叉封装，已校验官方运行时SHA-256、架构、可执行权限与文件完整性，尚未完成Mac实机验收。详细步骤见[macOS使用指南](macOS使用指南.md)。

开发者可在已有`dist/`之后执行`python3 scripts/package_macos.py`生成两种Mac包（Windows使用`python`），执行`python3 scripts/check_macos_package.py`进行归档检查。这项检查不替代Mac实机测试。Linux用户仍可从源码运行。
