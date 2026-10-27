# 来源与研究清单

查阅日期：2026-10-23。以下按阶段保留记录；当前状态以末尾更新与 PROGRESS.md 快照为准。

1. Utah Symphony / Utah Opera，Mahler Listening Guide: Symphony no. 2 in C Minor，2014-11。https://usuo.org/explore/2014/11/mahler-2-listening-guide/ 。网页检索摘要确认其论述第三乐章与《Des Antonius von Padua Fischpredigt》共享素材。仅链接和研究记录，不复制谱面、媒体或大段文字。具体谱位、时间及动机实例 needs_review；不计入核验事件。
2. Mahler Foundation，Listening Guide – Movement 3: In ruhig fliessender Bewegung。https://mahlerfoundation.net/mahler/listening-guide/listening-guide-movement-3-in-ruhig-fliessender-bewegung/ 。研究入口，未逐段审听；使用限制与谱例权利尚待核对，不打包音频。
3. 项目自制 generated-v1：60 秒单声道 WAV，12kHz；算法生成音阶及合成正弦音；谱例为虚构单声部八音图示，demo-score-v1。可随项目使用，非马勒原作，无真实小节编号。

真实录音：尚未选定。真实谱本：尚未选定。不得根据作品公版状态推断具体录音、扫描谱面可再分发。

下一批核验需要：可合法本地播放的马二五乐章音轨、指定谱本版本及页码体系、至少一个第三乐章实际动机出现及比较点、一个实际和声进行。未取得这些材料不生成虚构的精确时间与小节。

## 2026-10-23 目标录音选择与来源复查

用户已选定：Bernstein / New York Philharmonic / DG 1987。官方目录 https://leonardbernstein.com/discography?page=27 的 Symphony No. 2, Resurrection 条目列出 1987-04-21、Avery Fisher Hall、Barbara Hendricks、Christa Ludwig、Westminster Choir，以及 CD 4233952 GH2。仅登记书目元数据；未取得并审听该文件，不借目录推断分轨时间。

候选谱本：IMSLP #415748，Hofmeister 1897 初版的 Universal Edition 重印、RSL 扫描。已复查目录，未逐页检查扫描，不裁图分发，不与现代校订版混用。

本次已阅读 Utah Symphony 第三乐章文字段落，以及 Mahler Foundation 第三乐章 Transcript 开头。可作为歌曲素材关联和终乐章预示的研究线索；基金会转录含明显误听词，不能视为准确谱面记录。两项均保留 needs_review，不带伪造小节或录音时间。

当前可使用方式：用户自行本地导入音轨；参考网页只做链接和简短释义。音频未抓取、上传、购买或打包。

## 用户录音文件（2026-10-23）

用户提供 recording/Mahler Symphony No. 2 Resurrection 内25个分轨。来源身份按用户指定与内嵌标签记录，未外部上传。标签年份1987，艺术家包含纽约爱乐与伯恩斯坦；原编码 ALAC。具体文件列表、时长、原件/派生 FLAC 指纹保存于忽略目录 .local/recording.json。仅供本地开发和核对使用，不据此推断再分发许可。尚无已审阅音乐事件与对应谱段。

## 已核对谱页与项目录音交付（2026-10-23更新）

录音：项目所有者明确指定Recording内现有25个分轨纳入Git并作为成品播放资源。按该最新要求实施，本轮未外部发布。此条覆盖前文“仅本地开发、不打包”对该套录音的默认安排；不把所有者的交付指令改写成公版或特定授权书事实。

谱本：下载 https://s9.imslp.org/files/imglnks/usimg/e/e2/IMSLP415748-PMLP49406-GMahler_Symphony_No.2_fe_UE_reprint_RSL1.pdf 进行只读核查。文件21,262,557字节、209页；扉页显示Josef Weinberger、Universal-Edition、Friedrich Hofmeister。来源目录将该历史谱本列为Public Domain；使用的是历史扫描摘录，不是现代校订。

核对位置：印刷页80／本文件第80页，第三乐章开头两系统。只视觉核对速度文字、定音鼓声部与休止延长记号、弦乐连续音符及pizz.；不提供未听辨的精确音轨时间。两幅裁片保存public/assets/scores；PDF SHA-256、观察及核查范围记录于content/real/score-observations.json。整本下载仅作研究缓存，不加入Git或成品。

## 真实对齐草稿（2026-10-23）

使用已登记IIIa播放文件的SHA-256作为唯一声音源，读取开头18秒单声道16kHz波形；每20ms计算RMS并归一化，只作为可复查能量证据，不做识别或自动谱音对齐。人工目视找到约2.2秒和5.7秒的两组孤立能量，结合谱页80中两次第一定音鼓短音型的顺序，提出两条needs_review对应。试听窗口分别2.0–4.5和5.4–7.6秒，含余量。

谱面ff/kurz和f标记经裁片视觉复查。对应关系、乐器听辨与听觉边界尚未复核，草稿正文明确区分谱面事实与声音假设。未采用真实小节编号或未经依据的和声命名。不会因波形大小直接认定演奏动态。

## 用户审阅与第三乐章全谱巡览（当前状态）

用户明确回复“我review过了，是可以的”，本次仅将之前提交的两个开头试听窗口（IIIa 2.0–4.5、5.4–7.6 秒）登记为已审阅，审阅人记录为项目用户。确认范围不扩展到其他段落，不宣称开发工具完成了听辨。两组 ff/kurz 与 f 谱面标记的可见差别和比较关系均限定于页80裁片；无新的和声命名或精确小节号。

同一扫描 PDF SHA-256：e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6。第三乐章从印刷/文件页80开始，到127结束；128标题为第四乐章 Urlicht。已渲染80–127共48页供手动浏览。页99的排练号40处可见 Sehr getragen und gesangvoll，页105的排练号43处可见 Zum Tempo I zurückkehren；只核对这些文字及页段，不推断未经听辨的准确声音边界。

IIIb入口、IIIc入口及IIIc末尾15秒是3个待审试听候选。对应页99、105、127只是建议对照页，均未进入正式事件或导听统计。三条完整波形从项目实际播放文件生成，指纹及总时长684.826667秒由文件清单校验。

再次阅读 Utah Symphony / Bettie Jo Basinger 第三乐章段落，用简短署名释义提供鱼群布道歌曲背景、抒情段与戏剧性中断的阅读线索。文字不承担具体录音时间、谱位或和声证据；完整出处链接保留于整章巡览数据。没有另建歌曲音频播放器。

## 同步复用来源（2026-10-23）

- symphony7526，https://www.youtube.com/watch?v=C-1d0OY6o0k 。用户提供的跟谱研究视频，已下载到忽略缓存，第三乐章章节36:12–47:02。提取52个视图起点并以SIFT/RANSAC匹配项目已有原谱48页；没有将视频画面作为新谱页打包。参考媒体SHA-256和匹配内点数记录在score-sync.json evidence。0.25秒是提取画面的采样粒度，不是声音对齐误差保证。
- Classical Moments，https://www.youtube.com/watch?v=Mevfka7ZEng 。说明为Bernstein/LSO、Ely Cathedral 1973，独唱Armstrong/Baker。仅取得音轨做比较，没有下载4K整段演出影像、未入Git或成品。第三乐章章节37:48–48:46；和前一上传不能共享未经迁移的时间戳。
- LSO官方录音目录，https://londonso-assets.s3.amazonaws.com/uploads/2025/01/LSO-Discography-January-2025.pdf ，PDF页604（零索引604附近条目0920）记录31 Aug–2 Sep 1973、CBS/Unitel、Ely、独唱与合唱，以及LP/CD/DVD发行。书目一致不等于两个网络文件位级或逐秒一致。另见https://www.lso.co.uk/five-of-bernsteins-best-recordings-with-the-lso/ 。
- Sync Toolbox https://github.com/groupmm/synctoolbox ，本地安装1.4.2，MIT；实际运行MrMsDTW对齐，chroma_stft为10Hz，自动结果全部待核验。没有把相似度解释为音乐学关系或同源概率。
- https://gustavmahler.com/midi.html ，公开第三乐章MIDI，页面署名Junji Miki。仅下载研究候选，未加入应用、未将它转换成“已核验MusicXML”；最终52个视图同步不依赖该MIDI。
- PDMX索引 https://zenodo.org/records/15571083 ：本轮实际流式检查254077条记录，42条包含Mahler，未取得完整马二第三乐章符号谱。没有下载全库。

## 2026-10-23 小节索引与研究札记来源

- Sophia Louisa Tsougaraki, *Spiritual Conflict in Gustav Mahler's First and Second Symphonies*, University of Leeds PhD thesis, August 2004, pp. 105–108（PDF实际页104–107），尤其表4.3：https://etheses.whiterose.ac.uk/id/eprint/26101/1/411605.pdf 。表格给出第三乐章第1–581小节及A/B/中断等一种形式分段；正文明确比较Reilly与Floras的不同分法，并提出第465小节的降B小调和声叠加C持续低音。本文为学者分析，非该扫描版逐音转录，也没有提供项目录音时间。仅简短中文转述并链接；14MB论文PDF保存在被忽略研究缓存，不进入项目成品。
- Mahler Biographical Database and Catalogue of Works, “Symphony No. 2”, Table 1 items b/c：https://www.mahlercat.org.uk/Pages/Symph2/Symph2.htm 。第257–260小节对Hans Rott谐谑曲主题的暗示和第577–581小节对舒曼《Das ist ein Flöten und Geigen》末尾的引用仅登记为来源提出的关系；未并列核对两份谱本，不发布为已审阅动机。
- Oxford University Press, *Inside Mahler's Second Symphony: A Listener's Guide*, chapter 6 abstract：https://academic.oup.com/book/43103/chapter-abstract/361589053 。支持第三乐章利用鱼群布道歌曲材料、并非逐句照搬声乐旋律的研究线索；完整章节未获取，不从摘要推导具体小节音符。
- Berliner Philharmoniker, programme note：https://www.berliner-philharmoniker.de/en/programme-notes/gustav-mahler-symphony-no-2-in-c-minor-resurrection/ 。用作歌曲寓意与“绝望的呼喊”戏剧语境的机构解释；意义归属保留，不替代谱面或录音核验。
- IMSLP #415748历史UE重印扫描，同上PDF SHA-256：e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6。小节线几何来自原谱页80–127；页84、88、89、100、117、118六处修正记录于`content/real/measure-sync.json`。第465小节落在页116强奏起点、第473小节落在页118速度减缓段、第545小节落在页124排练号54位置、第577小节落在最后页127，这些与资料的定位相符；未逐项审阅全部边界或录音秒数。

## 2026-10-23 导读扩写补充来源

- Lew Smoley, Mahler Foundation, [Listening Guide — Movement 3](https://mahlerfoundation.net/mahler/listening-guide/listening-guide-movement-3-in-ruhig-fliessender-bewegung/), Transcript 第71—104行。用于弦乐旋转音型、木管与铜管音色、竖琴及尾声等**作者的听觉分析**。网页是语音转录，个别术语明显有误，不能当作谱面逐小节校勘；本项目只以简短中文转述，凡精确进入点未从原谱和项目音轨核实的均不写死。
- Tsougaraki 同上论文 pp. 106—110（PDF实际页105—109）进一步明确：第271小节后的织体变薄和竖琴突出；第473小节的下行材料与终乐章第14小节的关系；末五小节与舒曼歌曲的比较。这些是论文分析主张，未作为本项目已审阅动机关系。
- 23段导读的小窗口现按更多可查的音乐节点重排。第13/76/103/136/190/212/235/257/271/328/348/380/409/441/465/473/481/545/577小节等可在下列形式图或正文定位；第6/261/301/501等仍只是方便回听的编辑切窗，不宣称那里有独立形式断点。所有音频秒数仍取文件指纹绑定的估计映射。

## 2026-10-23 和声及配器扩写依据

- Katarina Marković, “Beyond the First Symphony: Transformations of the Concepts of Durchbruch and Transition in Mahler’s Later Wunderhorn Symphonies (2),” *Muzički talas* 16/39 (2010), [整期PDF](https://clio.rs/storage/media/2608/Muzicki_talas_39-2010_s.pdf), pp. 63–66、附录表2 p. 92（PDF页64–67、93）。本轮逐页查阅这几处：第一大段内F大调、降E大调、第136小节短暂插入和第186–188小节降D和弦；对比段C→D→C→E大调的路线；第271小节后E大调延长；第348–358小节降E大调、第380–408小节F大调；第465小节降B小调叠C低音；第481小节后的降A和弦、未解决七和弦及第544–545小节回到C。表2另列小号独奏与跨乐章材料。本文是一种分析读法；读者正文用听觉效果解释它，作者、页码和其他研究并列留在“解读依据”。
- 此次没有据此增加正式`catalog.events`或声称完成逐音校勘。原谱小节框由用户认为“差不多是准的”，但这并不等于各处录音起止已人工逐段听辨。文献中的和声与配器可用于带来源的听者导读，精确事件审阅继续独立记录。

## 2026-10-27 整乐章播放派生文件

从已授权项目内25个播放副本按原始分轨顺序拼接成5个完整乐章FLAC，未购入、抓取或上传新的媒体。`content/real/continuous-recording.json`逐个记录新播放文件SHA-256、总时长、来源文件SHA-256及起止偏移；原分轨音乐对齐仍保存在原始映射数据中。FFmpeg concat demuxer解码后重新无损编码为FLAC，避免直接拷贝FLAC数据包时保留首分轨时长头的问题。解码PCM哈希检查对比整乐章文件与原分轨顺序串接，五个乐章均一致；这检验拼接过程，不扩展音乐学审阅范围。

## 2026-10-27 用户提供的五乐章导读 v1.0

来源为项目用户本地提交的 `content/listen_guide/v1.0` 五份Markdown稿件，乐章、文件名和69段数量见该目录上一级README。保留正文、提示、小节范围与依据ID；仅修复第五乐章前置信息的分隔格式。未将作者文稿改写成机构资料或独立核验记录。

第三乐章原札记的外部文献作为相关背景继续可查，不声称这些资料逐句支持作者此次扩写。其他四章的新依据ID未附外部书目，界面来源区只登记项目作者稿；没有为这些ID编造网页、页码或审阅状态。本轮仅内容接入及交互验证，没有完成69段新增音乐事实、和声命名或其他四章谱音起止的独立核验。

## 2026-10-27 全曲页／系统同步来源

- 沿用上述IMSLP #415748历史UE重印扫描，PDF SHA-256仍为 `e56f9fb7f1e6507483b8cee8d806e722d95d9be8a8c265adf509dcd0e7d5d3f6`。本轮目视确认四章起止标题及页界：I PDF3–56、II57–79、IV128–133、V134–209；展示159张从该PDF渲染的原谱，未展示YouTube画面。PDF页序与显示的小节号分开。
- [用户提供的既有跟谱视频 C-1d0OY6o0k](https://www.youtube.com/watch?v=C-1d0OY6o0k)：本轮使用本机已有缓存，2fps检测翻页，用图像匹配识别对应扫描页；局部复核及5处视觉修正见 `scripts/sync/work-view-corrections.json`。参考视频与音轨只作离线研究，不打包进应用。
- [Sync Toolbox](https://github.com/groupmm/synctoolbox)：沿用本地安装的MIT工具，MrMsDTW全曲色度对齐；结果和输入指纹登记在 `content/real/work-score-sync.json` 的 evidence。算法输出仍是估计，余弦相似度不作为演奏版本相同或音乐事实已审阅的证据。
- Sophia Louisa Tsougaraki，既有[论文PDF](https://etheses.whiterose.ac.uk/id/eprint/26101/1/411605.pdf)，印刷页96–97第一乐章形式表及第116页终乐章说明：所用计数终点分别445与764。本轮用于发现作者稿454／712与常用编号的不一致，未据此替作者改稿或自动缩放映射。其他四章尚无可信小节索引，仍不把作者稿范围称为总谱小节总数。

## 2026-10-27 v2作者稿与唱词

第一／二／五章作者稿来源为用户提供的 `content/listen_guide/v2.0`，另两章保持v1；当前102段。第一章截断尾段从已有v1同一段恢复结构与缺失栏目，详见该目录README，不把恢复称为独立音乐学核验。

第四、第五章三语唱词直接来自用户提供的 `content/listen_guide/script/m4.md`、`m5.md`（7／16段），德、中、英均按原稿接入，不额外从网页取译文。稿件声明的文本背景分别为《少年魔角》与克洛普施托克／马勒；这是稿件元信息，未在本轮另作版本学校勘。原稿中的小节标签按作者编号保留。

唱词边界的谱面依据为同一已登记UE扫描PDF128–133及186–206的声乐谱表。通过既有参考视频翻页位置进行局部插值，再经全曲音频DTW迁移至DG连续文件；逐段位置与方法保存在 `scripts/sync/lyric-anchors.json` 与 `content/real/lyrics-sync.json`。所有新增时间为needs_review，未作逐字／逐段人工审听或完整小节编号核验；作者声明范围不自动成为独立审阅证据。

## 2026-10-27 四章小节编号的局部证据

沿用已登记的用户参考跟谱视频及同一UE扫描。逐视窗核查的是视频在谱表左上显示的小字小节号，不能把排练数字当作小节号。`scripts/sync/work-measure-anchors.json` 按47／25／7／65个视窗保存第一小节；视窗ID、稳定参考帧秒数、PDF页与分配范围保存在 `content/real/work-measure-sync.json` 的 `readings`。原视频、参考音频及项目音频指纹均随生成数据记录，原参考媒体留在忽略的研究缓存中。

末帧可见第一章445、第二章299、第五章764；第四章最后系统的起点58与终止线之间数得11小节，故终点68。第一章作者稿446–454未找到本谱对应位置，保留原文和差异；第四／第五章稿件分别止于67／762，后续谱位不补写解读。以上是谱位观察，不是对作者全部分析或所有声音边界的审阅。

每个带编号局部视频视窗内按小节数插值，经既有全曲DTW转换成完整乐章文件的本地秒。第五章第一个视窗的DTW平台使若干时间坍缩，改用该局部视窗已登记起止秒插值，`timing: local_view_subdivision_dtw_plateau` 明确记录。所有时间仍为needs_review；未进行逐小节人工审听、逐音对齐或新的音乐关系核验。
