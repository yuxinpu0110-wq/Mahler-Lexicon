# 谱曲同步复用研究 — 2026-10-23

## 当前状态

尚未完成第三乐章连续谱曲同步。已有：2个用户审阅的片段试听窗口、3条整轨波形、48页手动浏览谱面。谱例对应不等于连续跟谱。以下是资料调查与技术建议，未安装或跑通新对齐算法，未新增正式音乐条目。

## 用户视频：有参考价值，但不是项目录音

https://www.youtube.com/watch?v=C-1d0OY6o0k

读取公开观看页的 videoDetails / shortDescription 及 oEmbed 元数据：标题 Mahler: Symphony No. 2 (with Score) [Bernstein]；作者 symphony7526。说明列 London Symphony Orchestra、Sheila Armstrong、Janet Baker、Edinburgh Festival Chorus。第三乐章章节36:12到47:02，约650秒。项目录音为纽约爱乐／DG／1987，第三乐章三个文件合计684.826667秒。

因此不能直接拷贝时间戳，也不能只按总时长同比缩放。视频说明没有提供机器可读的逐页/逐小节时间映射或符号谱下载；未观看全部视频，尚未确认画面所用谱本与翻页粒度，不能宣称已提取它的同步数据。未下载视频音视频流、未绕过下载限制、未联系作者。

可复用路径（工程推断）：取得作者可使用的翻页映射或项目文件；若参考录音也可用于本地处理，先做参考录音与项目录音的非线性音频对齐，将参考翻页点迁移到项目音轨，再人工检查。若只有可使用的视频文件，可在谱面区域做画面变化检测生成翻页候选，再与项目扫描页做图像匹配。页面布局/谱本不同须另建页段对应，不是简单页码相减。图像匹配只能定位页段，不能推出音符和和声。

## 可复用工具

| 项目 | 实际用途 | 对本项目的判断 |
| --- | --- | --- |
| [Sync Toolbox](https://github.com/groupmm/synctoolbox) | Python离线音频-音频、音频-符号谱同步；多尺度DTW及音乐特征；提供完整notebook | 优先试验。项目是固定文件播放，不需要运行时实时跟随。先输出离线JSON，网页只查表。LICENCE原文为MIT，不能因GitHub API的NOASSERTION误判为无许可证。 |
| [SSV alignment](https://github.com/Signature-Sound-Vienna/alignment) | 基于Sync Toolbox生成录音之间与MEI谱音映射，MIT | 可参考内容生产流程和输出；尚未找到本项目马二的现成映射。 |
| [Listen Here](https://github.com/Signature-Sound-Vienna/listenHere) | 使用对齐结果进行交互聆听，AGPL-3.0 | 参考同步、比较体验，不为了这一功能替换现有React应用。 |
| [Partitura](https://github.com/CPJKU/partitura) | 符号谱读写、音符数组和谱位处理，Apache-2.0 | 供MusicXML/MEI进入离线对齐管线；不是现成马二谱库，也不是单独安装即可自动完成同步。 |
| [Matchmaker](https://github.com/pymatchmaker/matchmaker) | 实时谱跟随，支持文件仿真输入，Apache-2.0 | 若以后支持现场输入再考虑；论文以钢琴为中心，不能直接假设对大型管弦乐同样可靠。 |
| [Matchmaker demo](https://github.com/pymatchmaker/matchmaker-demo) | 带高亮界面的原型，PDF支持实验性 | 已检查backend/app/omr_parser.py，PDF路线仍解析Audiveris的识别结果，并未绕过OMR。 |
| [Audiveris](https://github.com/Audiveris/audiveris) | 扫描乐谱的OMR与MusicXML输出，AGPL-3.0 | 没有可用符号谱时的备选；先试少量关键页，不直接对48页全管弦乐总谱承诺零校对。 |
| [ScoreFlip](https://github.com/andy157ko/scoreflip) | 先人工翻页录一遍参考，再按音频相似度翻PDF页 | 说明不识别音符也可做页同步；仓库自述仅测合成音频、仍早期，不能当成管弦乐生产级验证。 |

Sync Toolbox许可证：https://raw.githubusercontent.com/groupmm/synctoolbox/master/LICENCE 。工具代码许可不等于输入谱面/录音使用依据。

## 符号谱候选与排除项

1. [MuseScore马二目录](https://musescore.com/song/symphony_no_2_in_c_minor-5171644)：检索结果列出Musicbro456的第三乐章转录，53 parts、46页、约10:10。当前只核实目录候选；直接读取该目录收到403，未取得具体MusicXML/MSCZ，未确认完整性、配器、转录来源及使用许可。不能标为已取得可用总谱。
2. [第三乐章四手联弹版](https://musescore.com/user/84251/scores/409441)：存在标题明确的候选页面。尚未取得可导出的符号文件或核对编曲者及小节结构。可在核对后尝试用作对齐参考；不能用于证明原作配器，也不能直接把重新排版后的页码套到项目总谱。
3. [PDMX](https://github.com/pnlong/PDMX)及[Zenodo记录](https://zenodo.org/records/15571083)：提供MusicXML、元数据和索引，适合筛查既有社区转录；尚未筛出并验证完整马二第三乐章。应检查no_license_conflict子集，不假定所有文件的内外许可描述一致。本轮未下载14.4GB全库。
4. [Sao Mai的Mahler #2](https://saomaicenter.org/en/music-library/mahler-2?language=vi)：确有MXL附件，但页面明确是第五乐章、21小节、2页、铜管节选；排除为第三乐章全谱来源。
5. [TROMPA报告](https://trompamusic.eu/deliverables/TR-D5.2-Score_Edition_Component_v2.pdf)：检索到的马二编码案例只涉及第一乐章前103小节的钢琴改编；不能算第三乐章全谱已经符号化。完整第四交响曲编码也不能误报成第二交响曲。

MusicXML、MEI、MuseScore原生MSCZ/MSCX都可以成为符号输入，不必局限于.xml后缀。没有确认文件前不引入自动分析结论。

## 推荐实施顺序

1. 先完成固定录音的“页/系统级同步”，独立于符号谱。已有48页只需每个有效页段的时间锚点，必要时加系统边界；可人工打一遍翻页点或导入可使用的现成映射。一个页段一条定位，工作量与页/系统数量相关，不是与所有音符数量相关。翻页点须以页面实际音乐进入位置为准，不能无校对照搬视频的提前翻页。
2. 自动化作为离线内容制作工具：优先取得现成MusicXML/MSCZ/MEI；经谱本对应检查后提取小节与拍位置，生成合成参考/符号特征，与项目录音做分段DTW。先对30–60秒样本试验，再扩展整章。尚未实测准确率、耗时与依赖兼容性。
3. 若无可用XML，但取得带映射的参考录音，音频-音频对齐也可迁移页/系统锚点，不需要OMR。对重复段、延长记号、速度突变、静音和分轨边界设置检查点；不能以单个总时长比例取代非线性对齐。
4. 仅在上述谱源与复用路线失败时，用Audiveris试验少量所需页面/声部；不以全谱OCR作为播放器同步的先决条件。
5. 输出区分estimated/needs_review/reviewed。同步数据标明edition、scoreAssetHash、trackId、fingerprint、fileLocalSeconds、page/system/measure粒度、算法与锚点来源。三个分轨先在离线计算时建立累计偏移，导出必须拆回对应文件本地秒；跨轨页段分成两条。未知范围留空，不假装逐音精确。
6. 页同步与音乐条目分别验收：自动翻对页不等于动机、和声与音符分析通过审阅。播放时只更新固定谱区，不滚动主页面、抢焦点或自动暂停；手动翻谱须有“恢复跟随”。

## 本轮结论

可以且应该复用，首选离线同步工具与符号谱，不从零写识别系统。当前最短交付路线是页/系统锚点同步；全谱MusicXML可进一步降低精细定位和分析工作量，但仍需确认转录质量与版次对应。没有发现并验证可直接套用到本项目NYP录音的完整同步文件；本轮只完成调查，没有冒充已经完成自动同步实验。
