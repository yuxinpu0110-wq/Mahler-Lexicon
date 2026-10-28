# Mahler Lexicon · macOS 使用指南

## 选择下载文件

打开 [发行版下载页](https://github.com/yuxinpu0110-wq/Mahler-Lexicon/releases/latest)，在 Assets 中选择：

| Mac 类型 | 下载文件 |
| --- | --- |
| Apple 芯片（M1／M2／M3／M4等） | `Mahler-Lexicon-v0.1.0-macos-arm64.zip` |
| Intel 处理器 | `Mahler-Lexicon-v0.1.0-macos-x64.zip` |

可以在  →“关于本机”查看“芯片／处理器”。需要 **macOS 13.5 或更新版本**，这是随包提供的 Node.js 24 运行时的系统要求：[Node.js 官方说明](https://github.com/nodejs/nodejs.org/blob/main/apps/site/pages/en/blog/migrations/v22-to-v24.mdx)。

## 解压和启动

1. 完整下载 ZIP，双击解压，或使用系统“归档实用工具”打开。
2. 打开解压出的整个文件夹，双击 **START.command**。
3. 终端窗口会显示本机地址并打开默认浏览器。保留终端窗口，点击网页中的“播放”。
4. 如果浏览器没有打开，复制终端中的 `http://127.0.0.1:47823/` 地址；端口占用时以终端实际显示为准。

无需安装 Node.js、Python、FFmpeg，也无需导入录音。请不要直接双击 `app/index.html`，也不要只复制 START.command 一个文件。建议预留2GB磁盘空间；包内网页、五个完整乐章、谱面和导读可离线使用，在线字体不可用时使用系统字体。建议使用当前版本的 Safari、Chrome 或 Edge。

本包采用本地浏览器界面与终端启动器，不是经过 Apple 公证的 `.app` 安装程序。若系统首次阻止运行，请先核对来源及同名 `.sha256` 校验文件，再依照系统提示对这个启动器使用“打开”或在“系统设置 → 隐私与安全性”允许本次打开。无需全局关闭 Gatekeeper 或其他系统安全保护。具体步骤见 [Apple 官方说明](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac)。

可在终端校验下载文件，例如 Apple 芯片版：

```sh
shasum -a 256 ~/Downloads/Mahler-Lexicon-v0.1.0-macos-arm64.zip
```

结果应与下载页同名 `.sha256` 附件一致。ZIP 已记录 START.command 和 runtime/node 的可执行权限；如使用其他解压工具导致权限丢失，可重新用系统“归档实用工具”解压。

## 使用与退出

- 默认打开第三乐章，顶部可切换五个乐章；“连续播放”控制是否进入下一乐章。
- 自由检索适合边听边看谱与导读。正文中的小节链接可暂停并定位，范围引用可设置回听区间。
- 启发探索播放时显示一句悬浮追问；点击整句可暂停并展开赏析、结构、和声与配器。
- 第四、五乐章声乐段可切换德语、德中和德英唱词。
- 系统开启减少动态效果时，光场起伏和定位透镜弹性会减少。
- 退出时先暂停，在启动终端按 Control+C，或关闭该终端窗口。只关闭网页不会结束本地服务器。

更多操作和内容精度说明见 [通用使用指南](https://github.com/yuxinpu0110-wq/Mahler-Lexicon/blob/main/release/使用指南.md)。小节时间与框选仍是既有待校核估计，不因增加Mac封装而提高准确性。

## 本次验证范围

本包在Windows环境交叉封装。已核对官方运行时压缩包SHA-256、Mach-O处理器架构、ZIP可执行权限及所有成品文件的哈希；网页与本地服务器复用已验收的v0.1.0成品。**尚未在Mac实机验证启动、系统拦截提示及Safari播放**，如遇问题请反馈系统版本、芯片类型和启动窗口的错误信息。
