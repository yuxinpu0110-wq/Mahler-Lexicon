# 第三乐章同步的离线制作

## 四章估计小节导航（2026-10-27）

`work-measure-anchors.json` 保存对参考视频144个局部视窗起始小节的可复查读取；排练数字不当作小节号。`content/real/work-measure-sync.json` 保存源视窗、编号、参考帧时间、PDF页、音频及谱本指纹和生成方法。范围为第一445／第二299／第四68／第五764；第一章作者g26的446–454未对应，不猜跨版换算。

```powershell
# 已有本地视频、参考音轨、PDF、整章音频及work-time-map缓存时：
.local/sync-env/Scripts/python scripts/sync/build_work_measures.py
npm run content:check
npm test
npm run build
npm run test:work-measures
```

生成器校验视频、参考音轨、连续文件、扫描谱指纹；只在每个带编号视窗内按小节数插值，再经已有DTW迁移到文件本地秒。第五章首视窗有DTW平台，回退到该局部视窗内插值并明确记录；不按整章总时长分配。结果全部needs_review，显示整页／系统，不生成个别小节矩形。第四、第五章末尾超出作者稿时保留无导读状态。后续须对停顿、变速与重要进入点逐段回听校正。

`read_measure_labels.py` 可辅助提取候选截图，需 OpenCV、FFmpeg、Tesseract 和 `tmp/sync/eng.traineddata`。它使用显式 `tessedit_create_tsv=1`，避免本地traineddata目录缺TSV配置时输出为空；候选绝不自动写入产品。`work-bars-detected.json` 的小节线误检仍未达到逐小节框的发布条件，不参与新导航。

下面保留页／系统同步及第三章索引的制作方法。

## 五乐章扩展（2026-10-27）

第三乐章原数据与小节索引保持独立，不重建覆盖。另四章使用 `content/real/work-score-sync.json`：第一章47视图／PDF3–56，第二章25视图／57–79，第四章7视图／128–133，第五章65视图／134–209。Listen Closer 按实际谱页／系统跟随，可选择谱段定位和回听；此扩展不生成未经确认的小节编号。

复用相同的本地参考视频、参考音频和已登记PDF。参考图像仅用于图像匹配，产品图片来自原PDF；媒体不上传，不额外打包参考录音或视频。Python工具仅用于离线制作，网页启动直接加载静态映射。

```powershell
# PyMuPDF、Pillow 用于PDF渲染；原同步环境的 requirements.txt 用于其余步骤。
python scripts/sync/render_work_score.py
.local/sync-env/Scripts/python scripts/sync/align_work_audio.py
.local/sync-env/Scripts/python scripts/sync/match_work_video.py
.local/sync-env/Scripts/python scripts/sync/recover_work_views.py
.local/sync-env/Scripts/python scripts/sync/build_work_maps.py
npm run content:check
npm run test:work-sync
```

完整录音先用10Hz色度特征作MrMsDTW；缓存逐0.1秒参考→全曲目标秒数。生成产品映射时减去目标乐章的准确累计起点，输出的时间始终为对应连续文件的本地秒。参考翻页来自2fps抽样的SIFT/RANSAC匹配；低特征页另作局部匹配，5处视觉修正记录在 `work-view-corrections.json`，包含原帧时间和谱页依据。所有207页覆盖已检查。输入视频、参考音频、目标录音、谱本的指纹均检查；输入变化须重做对应步骤。

全曲对齐平均余弦相似度0.850、其中位数0.903，仅反映特征匹配程度。独立与原第三乐章起止锚点对照误差约0.2／1.0秒；不能由此保证其他各处同样精确。映射仍为 `needs_review`，未逐段人工审听；翻页提前、安静段及变速可能造成偏差。扫描小节线检测本轮未达到可靠程度，没有用于运行时，也没有把作者稿454／299／67／712的范围凑成检测计数。

以下是原第三乐章工具链，供维护既有数据使用。

网页运行和正常构建直接使用 `content/real/score-sync.json`，不下载视频、不运行 Python，也不上传录音。

本轮复用用户提供的跟谱视频（C-1d0OY6o0k），提取第三乐章36:12–47:02的52个视图；SIFT/RANSAC将画面匹配回项目已有48页原谱。单页内系统切换与并排两页均保留实际粒度。之后用 Sync Toolbox MrMsDTW 把参考音轨时间迁移到纽约爱乐录音，跨分轨视图拆成文件内区间。结果全部needs_review。

本地重建：Python3.12、FFmpeg；在隔离虚拟环境安装requirements.txt。把可用于本地处理的参考素材放在以下忽略路径（本轮缓存已在）：

- tmp/sync/score-video.mp4：用户前一条跟谱视频的720p画面。
- tmp/sync/score-audio.m4a：该视频音轨。
- tmp/sync/concert-audio.m4a：Mevfka7ZEng视频音轨，仅辅助比较。
- tmp/pdfs/mahler2-hofmeister-ue.pdf：指定扫描，SHA-256见score-observations.json。
- .local/recording.json及其播放缓存：先运行npm run recording:prepare。

```powershell
python -m venv .local/sync-env
.local/sync-env/Scripts/python -m pip install -r scripts/sync/requirements.txt
.local/sync-env/Scripts/python scripts/sync/align.py
.local/sync-env/Scripts/python scripts/sync/match_video_pages.py
.local/sync-env/Scripts/python scripts/sync/build_maps.py
.local/sync-env/Scripts/python scripts/sync/build_measure_index.py
npm run content:check
npm test
npm run build
npm run test:sync
```

工具会复用tmp/sync中的特征缓存。更换参考文件或处理参数后必须清理对应的score-third.npy / concert-third.npy / nyp-third.npy，避免旧特征复用；删除前核对文件来源。缓存不是发布资源。本轮输入文件SHA-256与图像匹配内点数记录在score-sync.json的evidence字段；这些内点数与余弦相似度不是音乐事实审阅，也不是“同一录音”的概率。

score-layout.json只提供固定视窗裁切，不识别音符、小节或配器。扫描排版检测及页88上系统补充用于优化阅读范围，不作为MusicXML、真实小节编号或动机证据。

当前限制：视频翻页可能提前或滞后；音频DTW遇到相似再现、静音、延长记号仍需回听校对。52个视图覆盖全章，不等于52个事件已审阅。两页并列时不猜其中哪一小节正在响。完整MusicXML/MEI仍未取得，尚无音符级选择或自动和声分析。

## 小节索引

`scripts/sync/score-barlines-detected.json`保留从扫描页80–127提取的小节线候选（911×1232坐标）；`build_measure_index.py`记录6处可复查视觉修正：页84、89、117、118删除音符竖线误检，页88补入漏掉的上系统，页100补入3条清晰小节线。修正后共581小节，与Sophia Louisa Tsougaraki 2004年论文表4.3的终点相合；第190/257/328/348/441/465/473/545/577小节落在资料所述的对应谱页或记号处，提供比总数更有用的交叉检查。PDF SHA-256与音轨指纹必须仍匹配才能重建。索引有谱页/系统/矩形坐标，但没有音高或节奏符号。

小节时间的生成方法是先按参考视频的每个谱页/系统视图分组，再在组内按小节数**匀分时间**，最后将参考时间经既有DTW迁移至项目纽约爱乐三个文件。输出`content/real/measure-sync.json`中每个区间均为needs_review。此法方便按小节检索与制作标注草稿，但遇到延长记号、变速、重复和视频提前翻页会产生明显误差；开头两条已审阅试听窗口的确认也不能证明这些新小节秒数精确。导出工作包保留这个区别。下一步优先人工打关键小节的时间锚点、回听校正，再考虑通过可靠符号谱或小规模OMR实现逐音位置。

第三乐章48页谱图为1822×2464，约26.5MB，可用 `scripts/sync/render_score_pages.py` 从已登记PDF重建（需要PyMuPDF与Pillow）。


## 其余四章的小节框

`build_work_boxes.py`使用已注册PDF的911×1232缓存、`work-box-raster-systems.json`中的去斜系统边界以及`work-box-spatial-anchors.json`中的局部编号。先提取跨谱表的竖向墨迹候选，再用相邻已读编号约束小节数量；只采用实际墨迹位置，不均分页面宽度。所有1576框均needs_review，已检查系统顶部汇总图及若干原页／编号帧，但未完成逐框人工审阅。第一章参考1256.0秒左页实际399、右页405，861秒左页278、右页284；空间脚本据此修正两处读数，音频时间映射仍保留原局部估计。第二、四章开头短弱起与首个编号合框。

```powershell
.local/sync-env/Scripts/python scripts/sync/render_work_score.py
.local/sync-env/Scripts/python scripts/sync/build_work_boxes.py
npm run content:check
npm run test:score-motion
```

需要现有离线环境中的OpenCV、NumPy和Pillow；渲染使用PyMuPDF。生成前校验PDF指纹，缺页或基准尺寸不符会停止。结果写入`content/real/work-measure-boxes.json`；汇总报告和审阅图在忽略目录`tmp/sync/work-box-fit.json`与`box-audit-*.jpg`。输入中的系统和空间锚点仍是可修订的候选证据，不作为新的人工审听结果。正常网页启动与构建只读取生成JSON，不下载素材、不运行这些工具。
