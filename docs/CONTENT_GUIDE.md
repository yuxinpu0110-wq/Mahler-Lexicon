# 内容作者指南

真实与演示分目录维护。正式库 `content/real/catalog.json` 只收录已审阅的可定位事件；未定位线索保存到 `content/real/research.json`，不计入覆盖。`npm run content:check` 检查模型、引用和谱例文件存在性；`npm test` 测试数据与播放不变量。

## 正式数据结构

- `edition`：指定谱本版本 ID。不能混用初版、修订版或现代校订版编号。
- `sources`：id、title、usage、author、url、locator、accessed。URL 只接受 HTTP(S)。定位须可复查，usage 说明许可、使用方式和限制。
- `tracks`：id、recording、fingerprint（完整 `sha256:` 加 64 位十六进制）、movement、duration、source；可选 label。source 留空时要求本地导入；项目所有者指定的内置录音按 recording.json 维护并参与构建。一个录音的不同转码和分轨分别核验。
- `scoreRanges`：id、edition、movement、granularity、locator、可选 start/end 谱位、voices。region 粒度只记录可复查的页码/声部/区域描述，不填未经核查的小节拍位；measure 粒度必须有起止谱位。每个谱位包含稳定 measureId、独立显示编号 display、有理数 offset `[分子,分母]`，单位为四分音符；不假设四拍。
- `events`：id、title、category、movement、source、scoreRangeId、claimIds、review。真实事件不填写 demo 专用的 start/end、notes、fact/analysis/interpretation 或 related。
- `alignments`：id、event、trackId、edition、fingerprint、start/end（音轨本地秒，半开区间）、method=`manual`、uncertaintySeconds、可选 boundaryKind、review。试听窗口使用 boundaryKind=audition_window；没有测量误差时 uncertaintySeconds=null，不能把窗口余量当成精确对齐误差。时间属于具体音轨，不作为事件身份。一个事件可有多个文件的映射。
- `claims`：id、layer=`score_fact / analysis / interpretation`、text、sourceIds、review。意义解释以“某来源认为”表达；不把研究判断写成谱面事实。
- `relations`：id、from/to（当前均为事件 ID）、type=`quotation / transformation / recurrence / proposed`、claimIds、review。只有带有已审阅依据的关系才发布，不能因为外形相似就自动合并语汇。
- `excerpts`：id、scoreRangeId、url（本地 `/assets/` 下 PNG/JPG/WebP）、alt、page、sourceId、simplified、usage、review。图片失败时保留音频路径；无真实谱例时明确缺失，不使用演示单声部图冒充。
- `cues`：id、event、alignmentId、start/end、text（最多 50 字）、priority、source、review。每条提示绑定具体映射，不跨录音套用秒数。

`review` 包含 status（draft/needs_review/reviewed）、reviewer、date（YYYY-MM-DD）、method（核查方法与回听说明）。正式事件、引用主张、关系、谱例与提示须 reviewed；没有依据不能填入虚构审阅人或日期。schema 校验只是结构检查，不能替代音乐审阅。

## 核对流程

1. 先确认具体演出、发行及文件，导入音频，记录 SHA-256；文件名不作为版本依据。
2. 暂停并选试听范围，打开“录音与内容准备”→“片段核对草稿”；填写页码、起止显示小节、观察，导出 JSON。
3. 草稿明确为 needs_review，录音身份为用户选择、未经音频验证；不包含音频或原文件名，不自动加入正式内容。
4. 回听并对照指定谱本，补齐稳定谱位、声音边界与误差说明；制作有使用依据的短谱例。
5. 分层写主张与来源，检查关系两端，完成 A/B 试听和返回验证；记录实际审阅者与核查方法。
6. 加入正式库并运行内容检查、测试和浏览器验收。覆盖统计从正式事件计算，不计草稿与演示。

当前有两个经用户审阅的第三乐章开头事件、原谱裁片和试听窗口。编辑通过本地 JSON 完成，无在线后台；审阅记录见 content/real/reviews.json。跨音轨返回须等目标文件加载后恢复位置与选择。

## 谱面观察入口

content/real/score-observations.json 独立保存仅谱面已核对的材料，必须明确reviewScope与alignmentStatus=needs_review。观察不计入正式事件，也不提供精确试听跳转。短裁片保存在public/assets/scores。原PDF哈希用于精确标识扫描版本；不能把其他扫描的PDF页码直接套用。导出片段草稿可选择观察ID，补齐真实音轨范围后继续审阅。

## 可试听草稿与正式内容隔离

content/real/alignment-drafts.json 仅保存真实录音的待回听窗口，不加入catalog.events或catalog.alignments。默认视图只加载正式条目；用户进入“对齐核对”后按严格音轨与指纹匹配叠加草稿。边界导出始终为needs_review，不能通过修改UI自动晋升为reviewed。曲谱图来自既有score-observations引用；没有真实听辨依据就不转入正式目录。

## 第三乐章整章巡览

`content/real/third-movement.json` 保存三个分轨的真实 RMS 波形、文件指纹、乐章累计偏移、48 页谱面索引与待审候选。偏移仅供导航，不把累计秒数写成事件身份。谱页独立浏览，不宣称随录音逐页跟谱。波形由派生 FLAC 解码为单声道 8kHz 后按约 1200 个区间计算 RMS 并归一化；不能据此识别乐器或给出和声结论。

新增候选先保存为 needs_review，试听范围只用于核对。分轨标题与谱面速度文字一致也不足以证明边界已经对齐；必须实际回听确认后再进入 catalog。已被审阅发布的旧 alignment-drafts 保留历史，界面按事件 ID 排除重复草稿。

## 曲谱同步与按谱标注

`content/real/score-sync.json`把谱面身份与录音秒数分离：regions中的稳定ID只由指定扫描页/系统组成；tracks内intervals按具体文件指纹保存本地秒数。sourceStart/sourceEnd是研究参考视频内的第三乐章相对时间，不能用于用户录音跳转。映射校验同时验证谱本、扫描SHA-256、音轨SHA-256和范围。

自动映射全部needs_review，与catalog中已审阅音乐事件分别维护。region的box仅为原谱裁切视窗，不是音符坐标或小节定义。页/系统草稿可以在播放器中导出；不能用这个ID冒充精确MusicXML音符ID。取得符号谱后须另建edition/encoding标识、稳定小节/音符ID和跨版次关系，再细化映射，不覆写扫描ID含义。人工核对的声音窗口继续进入正式alignments，自动翻页不能自动晋升为音乐条目。

## 小节工作包与研究卡（2026-10-23）

`content/real/measure-sync.json`为上述**同一扫描版本**建立第1–581小节的稳定ID（`ue-iii-m001`等），每条保留页码、系统、谱面矩形和研究参考视频区间；`tracks`保存三个具体录音文件的指纹及各自本地秒数。谱面位置经小节线检测与页84、88、89、100、117、118六处可复查视觉修正；独立论文第581小节的终点及第190/257/328/348/441/465/473/545/577小节的谱页位置作交叉检查，**不证明每条小节线或声音边界都已逐项审阅**。播放时显示的秒数在视频翻页窗口内按小节数量匀分，再经既有录音映射迁移，全部为估计值。不要把高亮矩形写成音符位置或把起止秒写成精确音头。

`content/real/measure-research.json`存放10条按小节范围索引的资料札记。每条分开记录谱面可查事实、来源的分析主张、动机/和声线索、意义解释与回听问题，并附标题、链接、页码或章节位置；`research_only`不计正式事件或提示。宽范围札记不能复制成每小节相同结论。论文和节目说明有分段/意义解释分歧时保留归属，不用AI自动补足缺失的音高、和弦或情绪。

面向听者的条目按“赏析、结构、和声、配器”阅读。赏析先写可直接听见的变化及其戏剧效果，用陈述式、循序渐进的语言；开放问句写入`prompt`，只在启发探索播放时出现。若谈作品“想表达什么”，须写明提出这种解释的来源，不把情绪当谱面事实。结构说明位置与经核验的材料关系；和声只写有谱面与听辨依据的关键和弦/进行；配器只写谱面与音响能共同支持的乐器和音色。后三层允许空缺，不能把研究札记直接粘贴为正式条目。来源与审阅记录可折叠展示，正文尽量不用论文口吻。

在播放器选择小节、回听附近并填写“这一小节的核验笔记”，导出的工作包含稳定小节ID、扫描指纹、谱面位置、音轨指纹、估计试听窗和有关札记。交给AI时应提供对应谱页图像或经过校对的符号谱，并要求它逐项指出依据；AI输出仍进入needs_review。正式发布需人工核对该小节谱面、录音边界、和声声部与关系两端，写入review记录，再迁移为catalog条目。只有材料来源可查、试听与谱例闭环成立时，才计入正式覆盖。

听者版正文现按 `src/authorFiles.ts` 显式选择五份作者稿（第一／二／五章v2，第三／四章v1），映射见 [作者目录说明](../content/listen_guide/README.md)，旧 `content/real/listening-guides.md` 仅作兼容样例。每份文档保留乐章号、每段依据ID与小节范围，以及“赏析、结构、和声、配器、提示”五个栏目。来源区明确区分作者稿与背景文献，不把陌生依据ID伪装成书目。`bar:` 只引用当前乐章：五章均有录音指纹绑定的估计定位；其余四章通过局部带编号谱段估算，显示附近页／系统。稿件范围不等于已核查谱位，未对应编号只浏览文字，不能按整章比例猜秒数。完整格式、编辑示例和按乐章导入流程见 [CONTENT_MARKDOWN.md](CONTENT_MARKDOWN.md)。导入通过校验才整体更新，失败保留旧内容；作者稿接入不自动计入正式事件。

## 四章小节导航（2026-10-27）

维护 `scripts/sync/work-measure-anchors.json` 的各视窗起始小节，再用 `build_work_measures.py` 生成 `content/real/work-measure-sync.json`。不要将作者段落边界直接当作音频锚点。数据验证同时检查谱本指纹、谱段引用、每章编号连续性、完整录音指纹与本地时间。第一章446–454未对应，不能夹到445或越界进入第二章。正式音乐事件仍须独立的谱面／录音／主张审阅，不因导航覆盖增加而自动发布。
