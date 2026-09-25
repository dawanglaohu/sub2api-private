# 聚蚁(sub2api 二开)项目记忆

> 下次会话请先通读本文件。生产有事直接跳「更新 SOP」和「当前状态」。

## 项目定位

上游 [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api) 的**私有品牌二开**,品牌"聚蚁"(JuYi,蚁群隐喻:多订阅聚合成一个 API)。
生产站 **https://vvct.site**(38.246.245.106,SSH MCP `default`;链路 nginx容器:443 → 127.0.0.1:8181 sub2api-nginx → sub2api:8080)。

- 私有仓库:https://github.com/dawanglaohu/sub2api-private (GitHub 账号 dawanglaohu,GCM 已存凭据)
- 本地 remote:`upstream` = 上游(只读勿推);`private` = 私有仓库
- 分支:`main` = 上游镜像(仅参考);**`custom` = 二开主分支(默认分支,一切开发在此)**
- 上游 v* tags 需手工同步进私有仓库(**CI 自动合并不推 tag**,R17 实证;每次本地合并时补推,先 tag 后分支)

## 当前状态(2026-09-25)

- **生产镜像:`ghcr.io/dawanglaohu/sub2api:custom-7e3c68da`,自报版本 0.2.8**(= 上游 v0.2.8 + 全部二开,**无任何 Grok PR 私货**)
- **#4043 已退役**(R9):上游 v0.1.155 用 #4094/#4188 系列重新实现了 billing 配额探测(QueryQuota 混合探测+rolling 24h 免费额度+本地账期统计),我们的 4043 保留全部换成上游原版。custom 相对上游 tag 的差异从此= 二开清单 + setting_handler_update.go(ext:),硬校验口径见 R8(R13 51 → R14 57 → **R15 70 文件**;docs/知识库另计)
- ⚠️ **R15 起二开碰了上游功能代码**(监控页 V2:2 个后端文件 + ChannelStatusV2View 整页重写)。
  上游合并时**不能再无脑「二开清单取 ours」**,先读「监控页 V2 合并策略」那一节
- 回滚位:`custom-31f3387b`(v0.2.5 + 全部二开,见 `/opt/sub2api-tool/previous-image`)
- DB 备份:每次 switch 前跑 `bash /root/sub2api-deploy/backup.sh` → /root/sub2api-backups(保留 14 天)
- 管理台设置(存 DB,更新永不丢):site_name=聚蚁、site_logo=/logo.svg、site_subtitle=品牌句、
  custom_menu_items=[兑换码购买 → `ext:https://pay.ldxp.cn/shop/NG0GBH88`]、home_content=空(走聚蚁落地页)

## 更新 SOP(上游发新版时)

1. **CI 自动**:每日 UTC 02:23(北京 10:23)自动 merge 上游最新 release tag → 构建推送镜像。
   手动触发:GitHub Actions → "Custom Build" → Run workflow(force_build 可强制)。
   **找新镜像标签认准 GHCR 版本列表(`/user/packages/container/sub2api/versions`,含 `v0.1.x-custom` 别名),
   别拿 CI run 的 `head_sha` 去猜**——run 的 head_sha 是触发时的 sha,sync 步骤 merge 上游 tag 后
   会产生新提交,镜像标签用的是 merge 后那个 sha(R12:run 显示 093b0e2d,镜像却是 custom-5a262630)。
2. **服务器三连**(root@38.246.245.106):
   ```bash
   /opt/sub2api-tool/update-from-ghcr.sh pull  custom-<sha8>
   /opt/sub2api-tool/update-from-ghcr.sh smoke custom-<sha8>   # 隔离烟测:/health + 聚蚁 UI 标记
   bash /root/sub2api-deploy/backup.sh                          # 全库备份
   /opt/sub2api-tool/update-from-ghcr.sh switch custom-<sha8>   # 改 .env SUB2API_IMAGE + compose up -d
   ```
   出事:`update-from-ghcr.sh rollback`(可再次执行切回)。`status` 看全景。
3. **merge 冲突时**(CI 红灯):本地 `git fetch upstream --tags && git checkout custom && git merge v0.1.x`。
   解冲突默认原则:**二开清单文件取 ours,其余一切取 theirs**(setting_handler_update.go 手工保留 ext: 11 行)。
   **但「取 ours」只对纯品牌/装饰类改动成立** —— 我们碰了上游功能代码的地方必须逐个手术,见下方
   「监控页 V2 合并策略」(R15 起,这是全项目冲突风险最高的一块)。
   **两个例外(R13)**:① 取 ours 前先用 `git diff <上一tag> HEAD -- <file>` 看净差异形态,
   若只是被摁住的上游版本号/被删的上游步骤(不是品牌或功能改动),那是历史残留,取 theirs 反而根除复发;
   ② "双方各加一行 import"型冲突要**保留双方**(如 AppSidebar 的 JuyiAppearanceMenu + 上游 Icon)。
   解完硬校验:`git diff v0.1.x --name-only --staged` 必须只剩二开清单+setting_handler_update.go,
   多出的文件 `git checkout v0.1.x -- <f>` 强制对齐。前端 `pnpm run build` 过了再提交,
   **动过 channel-monitor-v2 的话还要 `pnpm vitest run src/features/channel-monitor-v2`(49 个)**。
   **推送顺序铁律:先 `git push private v0.1.x`(tag),后 `git push private custom`(分支)**——
   分支 push 立刻触发构建,tag 晚到 CI 的 `git describe` 就取旧 tag,镜像自报旧版本号
   (R8/R9 各踩一次;标错了去 Actions 手动 Run workflow 勾 force_build 重建)。
   部署前可验版本:`docker run --rm --entrypoint sh <镜像> -c 'strings /app/sub2api | grep -xE "0\.1\.[0-9]+"'`。
4. 镜像标签:`custom-<sha8>`(不可变,生产用)/ `v<版本>-custom` / `custom-latest`(移动,生产禁用)。

## 监控页 V2 合并策略(R15 新增,上游一动这块就要看这里)

**为什么单列**:R15 之前二开只碰过 1 个后端文件(setting_handler_update.go,纯校验放行)。
R15 起我们改了 `channel_monitor_v2.go` 的**业务逻辑**,并重写了 `ChannelStatusV2View.vue`
(净减 848 行)。而 channel-monitor-v2 是**上游正在活跃迭代的新功能**——
无脑 `取 ours` 会静默丢掉上游的修复,无脑 `取 theirs` 会把整个页面打回原形。
这两种错都不会报错,只会在生产上变成「页面回到官方样子」或「监控数据不对」。

| 文件 | 冲突时怎么办 |
|---|---|
| `backend/internal/service/channel_monitor_v2.go` | **不要整文件取 ours。**我们只改了 `ParseFilter` 的桶映射(24h→5min、新增 3d→15min、7d→1h,约 14 行)。取 theirs 后**只把这段 case 分支重新贴回去**,其余全部让上游赢 |
| `backend/internal/service/channel_monitor_v2_test.go` | 同上:只保我们新增的 3 段断言(24h/3d/7d),其余取 theirs |
| `frontend/src/api/channelMonitorV2.ts` | 我们只在 `MonitorRange` 联合类型里加了 `'3d'`。**取 theirs 再补回 `'3d'`**,别取 ours(会丢上游新增的字段/类型) |
| `frontend/src/views/user/ChannelStatusV2View.vue` | **取 ours**(整页是我们重写的),但必须 `git log <旧tag>..<新tag> -- <file>` 看上游动了什么:若上游新增了接口字段或查询参数,要**手工移植进我们的版本**,否则页面会调用一个已经改签名的 API |
| `frontend/src/features/channel-monitor-v2/{ModelStatusCard.vue,modelStatus.ts}` | 纯新增文件,上游没有同名文件,通常不冲突。**但它们依赖上游的 API 响应结构**,上游改了 `MonitorRow`/`buckets` 形状就要跟着改 |
| `frontend/src/features/channel-monitor-v2/__tests__/*` | `designSystem.structure.spec.ts` 是**改上游的**(取 ours);另两个 spec 是新增的 |
| `frontend/src/i18n/locales/{zh,en}/channelMonitorV2.ts` | 「双方各加文案」型冲突,**保留双方**(同 R13 的 AppSidebar) |
| `frontend/mock-monitor-server.mjs` | 纯二开新增,不进构建产物,冲突不可能;上游改了响应结构记得同步它,否则本地 mock 会骗人 |

**三条不能丢的业务约束**(改这块前先读,它们是踩过坑才有的):
1. **活跃判定只能用 `buckets` 存在性 + score,绝不能用 `request_count`** —— 非管理员响应会把绝对请求数清零,
   用它判断会让普通用户看到一片空白。这条最容易在合并时被上游版本覆盖掉。
2. **色带固定 60 块**(`downsampleMonitorSlots` 全窗口均匀降采样,组大小差 ≤1,健康取组内最差),
   任何时间范围都全窗口覆盖、无横向滚动。上游若改回「每桶一格」会撑破卡片。
3. **查询失败只展示陈旧提示,不得渲染成「健康」**,否则是在误报。

完整设计与代码位置见 `docs/聚蚁-sub2api-开发文档/图谱/任务/M8-T1.md`。


## 铁律

1. **管理台"执行更新/回滚版本"永远不能用**(已隐藏入口,VersionBadge `allowSelfUpdate=false`):
   它下载上游官方二进制,会覆盖聚蚁 UI。"检查更新"提示灯保留(只读上游 release 版本号)。
2. **不给 frontend/package.json 加依赖**——pnpm-lock.yaml 与上游合并冲突是大坑;资源一律 vendored
   (字体 woff2 在 src/assets/fonts/)。
3. 新功能**新文件**(components/juyi/、styles/juyi.css、views/home/、i18n juyi 命名空间);
   改上游文件只做小而准的插入。
4. 官方 `/root/sub2api-deploy/docker-compose.yml` 不改;定制走 override + .env。
5. 上游 .gitignore 忽略 `scripts/` 与 `CLAUDE.md`——本文件与服务器脚本存档提交需 `git add -f`
   (脚本存档在 `deploy/juyi/`,不受影响)。

## 迭代日志

**R1(2026-07-10 上午)基础设施 + 三页面二开**
- 私有仓库/分支/CI 建立;上游 4 个 workflow 已 disable(防空耗分钟数)
- 蚁巢工学设计:蜜琥珀 primary + 暖褐 dark + 蜂窝纹理;新蚁标(logo.svg/logo.png/BrandMark.vue)
- 全新落地页 JuyiHome(蚁径管线 hero、三步接入+真实 curl、特性 bento、平台墙、FAQ);
  HomeView 壳化保留 home_content 覆盖
- 用户仪表盘 UserEndpointHero(问候+端点快复);管理台 HiveAccountGrid(账号蜂巢健康图)
- 服务器接入:override 钉镜像、update-from-ghcr.sh、smoke 栈;切换 0.1.133→0.1.149+二开

**R2(2026-07-10 下午)五项需求**
- 多主题(蜜琥珀/信息素青/靛夜/炭玫)+ 字体切换(黑体/宋体/等宽):primary 改 CSS 变量
  `rgb(var(--jy-p-*))`,useJuyiAppearance + JuyiAppearanceMenu(侧栏底部+主页顶栏),localStorage 持久化
- JuyiSwarmCanvas 蚁群动态背景(登录/注册/主页;颜色跟主题变量;reduced-motion/隐藏页降级)
- 侧边栏自定义菜单 `ext:` 前缀 → 新窗口外链(AppSidebar);"兑换码购买"菜单项已写入 DB(seed 存档 deploy/juyi/seed-buy-menu.sql)
- 管理台"执行更新/回滚"入口隐藏
- 一轮颜色收编:残留 teal、checkbox 蓝、violet 徽章、图表色板首色 → primary

**R3(2026-07-10 晚)管理表格跟主题(用户截图反馈)**
- DataTable.vue sticky 表头/固定列硬编码冷灰 rgb(31 41 55)/rgb(17 24 39) → 暖褐 rgb(54 46 35)/rgb(36 30 22)
  (名称列/操作列"色块不跟主题"的元凶)
- GroupBadge 分组徽章:按平台着色(全 Anthropic 时满屏橙)→ 统一 primary 主题色
- AccountCapacityCell:黄色只留 ≥80% 负载警示,常态活跃走 primary

**R4(2026-07-10 晚)版本号标注修复**
- 根因:上游发版"先打 tag 后补 VERSION 文件",tag 树里文件滞后一版(v0.1.150 树写 0.1.149)
- CI decide 改为 `git describe` 最新可达 v* tag 定版,文件兜底;merge 时把 tag 推进私有仓库

**R5(2026-07-11)后端放行 ext: 菜单前缀**
- 管理台保存自定义菜单时后端校验拒绝 `ext:` 前缀(setting_handler_update.go),
  已加分支:`ext:` 后必须是绝对 http(s) URL;至此 ext: 外链模式前后端闭环

**R6(2026-07-12)首次直接合并上游 open PR(Grok 修复,未等上游发版)**
- 需求:提前合入上游未合并的 PR#4037(Grok CLI 版本头)与 PR#4043(配额改走 xAI CLI 计费 API+免费号支持)
- 做法(open PR 合并 SOP,与 tag 合并并列):`git fetch upstream pull/<N>/head:pr-<N>` 后
  **`git merge --no-ff`(禁 cherry-pick!)**——保 PR head SHA 为祖先,上游正式合并后 tag 合并自动识别已合入
- 两 PR 互相冲突 3 文件:取 4043 侧(其 setGrokCLICommonHeaders 是 applyGrokCLIHeaders 超集,
  且 4037 的 UA sub2api-grok/1.0 会覆盖 4043 的 grok-shell UA 破坏免费号 CLI 代理识别);
  4037 修复保留在 4043 未重构的路径(cc_pipeline/media/account_test)
- 额外修了 4043 上游自带的 2 个红测试(/responses 路径 UA 断言仍是旧值 sub2api-grok/1.0 → grokCLIUserAgent)
- 注意:合 open PR 会捎带其 base 上尚未发版的上游 main 提交(本次 17 个 fix),属预期
- head SHA 对账:pr-4037=a02150a4、pr-4043=8ce18fda;合并提交 aee4bc64/80d5286c

**R7(2026-07-12)添加 Grok 账户 OAuth 报错排查 + 合并 PR#4009、放弃 #3541**
- 症状:管理台添加 Grok 账户,在 grok.com 授权页遇 Cloudflare "origin invalid response"(**xAI 侧源站问题,非本站**);
  随后 exchange-code 必然 502,根因 xAI 返回 `400 invalid_grant`(授权未真正完成,code 无效)。
  日志锚点:`grok_oauth_handler.go:72 GROK_OAUTH_TOKEN_EXCHANGE_FAILED`。上游无专项修复 PR。
  **处置**:授权页报错属 xAI 风控/源站抖动——换网络/浏览器/时段重试,或给账户配代理;每次只生成一次授权链接,
  code 一次性且时效短,拿到立即贴回。后端逻辑无 bug(PKCE+state 校验完整)
- **#3541 放弃**:其功能(Grok 账号测试路由 xAI)上游已另行实现(testGrokAccountConnection 已在),硬合必大冲突
- **#4009 合入**(head 4641533e,合并提交 57c3e2dd):xAI API key 账号、OAuth 强制路由 CLI proxy(GetGrokBaseURL)、
  **传输层统一 CLI 身份头 applyGrokCLIProxyHeaders(http_upstream.go,按 host=cli-chat-proxy.grok.com 生效,
  UA=xai-grok-workspace/<v>,env XAI_GROK_CLI_VERSION 可覆盖版本)**、additional_tools 过滤、别名定价、
  UseKeyModal CLI/OpenCode 配置生成;go.mod 提升 x/mod 为直接依赖(版本未变,go.sum 不动)。
  它修了 #3952/#4079 等"添加后测试报 426 版本头"问题——与添加时的 OAuth 授权报错是两回事
- 冲突 3 文件全取 HEAD:#4009 的配额条改进作用于 #4043 已删除的旧 UI(bars→billing credits 展示),丢弃;
  quota 测试 URL 修正已被 #4043 重写涵盖。**头体系运行时以传输层为准**(service 层两套头对 CLI proxy 流量被覆盖)
- 教训:合 PR 前先查它要改的功能是否已被上游别的提交实现(#3541);auto-merge 成功≠语义正确,须逐文件 net-diff 审查;
  **用户报"登录错误"要先问清是哪个登录**(站内登录 vs 第三方 OAuth 授权页)

**R8(2026-07-13)Grok RT 导入号 403 排查(账号侧结论) + 合并 v0.1.153、舍弃 #4037/#4009 私有适配**
- 403 "chat endpoint denied"/"Access denied." 排查闭环:**CLI 头已带齐且 xAI 确认收到**(错误回显 x_xai_token_auth=xai-grok-cli);
  x-userid 加与不加无差;IP 未被封(本地/服务器无认证探测形态一致);上游无同类集体反馈。
  实锤:该 RT 后被 xAI 报 "Refresh token has been revoked",AT 刷出 29 分钟即整体失效(连 billing 都 401)——
  **外部来源共享 RT 被另一方 rotate/风控,账号侧问题,sub2api 无可修**。处置:自有订阅号走 OAuth 或官方 CLI 导出 RT
- 诊断工具箱:错误回显判头达没达;RT 验证日志锚点 grok_oauth_handler.go:109;DB 查 credentials 键结构/scope;
  服务器 curl 矩阵(带/不带头 × responses/billing/user)分层定位
- **v0.1.153 合并(合并提交 a4bd64d9)**:上游已收编 #4009(rebase 版,merge b73d8c3e)与 #4037 内容 →
  这两个 PR 涉及区域**全取上游原版,舍弃我们全部预合并适配**(含 R6 改的 2 处 UA 断言);
  **#4043 上游未合,保留 ours 4 文件**(grok_quota_service.go/_test、AccountUsageCell.vue/spec),
  并移植上游 1dedb209(配额耗尽持久化为限流)进 billing 版 ProbeUsage+mock 断言
- **提前合 open PR 的代价教训**:PR 被作者 rebase 后上游正式合并,tag 合并必冲突(本次 11 文件,CI 红灯一天);
  硬校验法:`git diff v0.1.153..custom --name-only` 必须精确等于 二开清单+未合 PR 净文件+ext:,多一个都是残差;
  取 ours 前必查 `git log v0.1.151..v0.1.153 -- <file>` 有无第三方提交会被覆盖(本次差点丢 1dedb209)

**R10(2026-07-26)合并 v0.1.165(常规更新)**
- 7/25、7/26 每日 CI 连续红灯,根因:上游 v0.1.164 新增 composite(组合订阅)平台,在 GroupBadge.vue
  的平台着色分支加了 cyan 配色,与 R3「分组徽章统一 primary」冲突。取 ours(我们本就不按平台着色,
  composite 自然落入统一 primary,无功能损失);其余全部自动合并,ext: 11 行完好
- 硬校验:合并前后 `git diff v0.1.x --name-only` 清单逐字一致(51 文件);烟测/备份/切换按 SOP 走完

**R11(2026-08-08)合并 v0.1.172(常规更新,接手上次会话遗留的半成品 merge)**
- 现场:CI 自 8/1 起连续 8 天红灯(全部卡在 "Sync latest upstream release into custom" = merge 冲突),
  生产停在 v0.1.168。**本地工作区留着上次会话未提交的 merge**(`git status` 显示 "All conflicts fixed
  but you are still merging",MERGE_HEAD = v0.1.172 的 tag object 61ba94d2,542 文件已暂存)
- **接手半成品 merge 的验收姿势**(不要重做,先证明它是对的):① `git tag --points-at $(cat .git/MERGE_HEAD)`
  确认合的是哪个 tag(annotated tag 的 MERGE_HEAD 是 tag object sha,不等于 `git rev-list -n1 <tag>`);
  ② 硬校验清单 `git diff <tag> --name-only --staged`;③ **与上一版基线做 comm 对比**
  (`git diff v0.1.168 <上一次合并提交> --name-only` vs 本次清单)——比记数字更可靠,本次 52=52 逐字一致;
  ④ `git log <旧tag>..<新tag> --name-only -- <清单文件>` 列出上游动过的二开文件(本次 8 个),
  逐个看净差异形态是否仍是"纯二开"(ext: 11 行 / 颜色收编 1 行 / HomeView 壳化 -689 行 / backend-ci -3 行)
- 上游本区间 203 个提交,`v0.1.167` 上游跳号不存在;私有仓库缺 166/168/169/170/171/172 六个 tag,一次补推
- 踩坑:`git push private custom` 首次 `schannel: failed to receive handshake` (SSL 抖动),重试即过;
  推送顺序铁律照旧(tag 先→分支后),镜像自报版本实测 0.1.172 ✅
- 落地:CI run 31242238920 绿灯 → 镜像 `custom-8b52d224` → pull/版本验证/smoke/备份(280M)/switch 全过,
  vvct.site 200、title「聚蚁」、logo.svg 在位,日志无 error

**R12(2026-08-13)升级到 v0.1.176(纯运维,CI 全自动无冲突)**
- 自 R11 起 CI 连续绿灯:8/11 合 v0.1.173(093b0e2d)、8/13 合 v0.1.176(5a262630)。
  **v0.1.173 那版从未部署,生产从 0.1.172 直接跳到 0.1.176**(跳版无碍,镜像是全量构建)
- 排查坑:CI run 列表最新一条 head_sha 仍是 093b0e2d,差点误判"没合新版本"——见更新 SOP 第 1 条
- 服务器四连全过:pull → `strings` 验版本实测 0.1.176 → smoke(/health + logo.svg 标记)→
  备份 282M(sub2api-20260813-060632.sql.gz)→ switch;回滚位落到 custom-8b52d224
- 验收:内部 8181 HTTP 200 + title「聚蚁 - AI API Gateway」,本机 Playwright 打开 vvct.site
  落地页完整(蚁径管线/模型墙/FAQ/页脚),容器日志 3 分钟零 error。
  注意**服务器上 curl 自己的公网域名会 HTTP 000**(出网/DNS 侧问题,非站点故障),
  验收要么走 `127.0.0.1:8181`,要么从本机浏览器验

**R13(2026-08-25)升级到 v0.1.183 + 根除"每次上游升 Go 就冲突"的老毛病**
- 现场:CI 自 8/19 起连续 7 天红灯(全卡在 `Sync latest upstream release into custom`),生产停在 0.1.176;
  本地又留着上次会话的半成品 merge(MERGE_HEAD=v0.1.182)。**期间上游已发到 v0.1.183**——
  果断 `git merge --abort` 弃掉 182 那半场,直接合 183(否则合完 182,CI 次日还要为 183 再冲一次)
- **红灯真因(重要)**:冲突的 3 个文件 `backend-ci.yml`/`release.yml`/`security-scan.yml` 里,
  所谓"二开差异"其实只是**历史 merge 残留**——把上游的 Go 版本断言摁在 `go1.26.5`(还删了几行测试脚本调用)。
  上游升到 `go1.27.0` 必然逐字冲突。查 API 确认这 3 个 workflow 全是 `disabled_manually`
  (只有 `custom-build.yml` 是 active),**内容对生产镜像零影响** → 全部 `git checkout <tag> --` 对齐上游,
  一劳永逸。二开面积 54 → **51 文件**(净减这 3 个);以后上游再升 Go 不会再卡 CI
- 判断"某冲突是不是真二开"的姿势:`git diff <上一tag> HEAD -- <file>` 看净差异形态。
  是品牌/功能改动才取 ours;若只是被摁住的上游版本号/被删的上游步骤,那是残留,取 theirs
- **AppSidebar.vue 是"双方各加一行 import"型冲突,必须保留双方**:ours 的 `JuyiAppearanceMenu` +
  theirs 的 `Icon`(上游 OAuth transport 插件用 `h(Icon,{name:'cube'})` 渲染侧栏图标,删了 vue-tsc 直接报错)。
  这类冲突不能无脑取 ours——`pnpm run build` 是最后一道闸
- GroupBadge.vue 取 ours(上游新增 kimi/zhipu/deepseek 平台配色,同 R10 composite,自然落入统一 primary);
  HomeView.vue 取 ours(壳化,上游给官方首页加的模型广场入口与我们无关);
  GroupsView/SettingsView/SubscriptionsView 自动合并,净差异仍是纯颜色收编
- 私有仓库 tag 落后 11 个(v0.1.173~183,其中 **v0.1.174 上游跳号不存在**),一次补推 10 个;
  推送顺序铁律照旧(tag 先→分支后),镜像自报版本实测 **0.1.183** ✅
- 落地:CI run 32865386270 绿灯 → 镜像 `custom-ff078d86`(别名 v0.1.183-custom)→
  pull → `strings` 验版本 → smoke → 备份 312M(sub2api-20260825-153612.sql.gz)→ switch;
  回滚位落到 `custom-5a262630`。验收:内部 8181 HTTP 200 + title「聚蚁」、logo.svg 200、日志零 error、
  本机 Playwright 打开 vvct.site 落地页完整。**别忘了 `smoke-down` 清理烟测栈**(3 个容器会一直挂着)

**R14(2026-08-29)UI 二次改版上线(纯二开发布,不涉上游合并)**
- 内容:JuyiSwarmCanvas 退役→新增 `JuyiSwarmField`(可控密度/强度/蜂巢锚点,AuthLayout 与 JuyiHome 共用);
  AntTrailPipeline 蚁径管线重做;新增 `composables/useJuyiReveal.ts`(滚动入场)与
  `directives/juyiCount.ts`(KPI 数字滚动,main.ts 注册 `v-jy-count`);juyi.css +529 行动效变量;
  UserEndpointHero/HiveAccountGrid/admin DashboardView 视觉对齐。**未加任何 npm 依赖**(铁律 2 保持)
- 新碰 2 个上游文件,都是小而准插入:`AppHeader.vue`(+`juyi-float-header` class 1 处)、
  `AppLayout.vue`(浮动侧栏留 10px 间隙,主列 margin 72/256 → 92/276)。二开面积 51 → **57 文件**
- `docUrlSanitization.spec.ts` 改指 JuyiHome:该测试自 R1 起就该改——HomeView 已壳化,
  doc_url 清洗逻辑搬到了 JuyiHome,测试却仍读 HomeView.vue(读的是空壳,断言形同虚设)。
  **CI 不跑前端单测,这类失效测试只能靠本地 `pnpm vitest run` 发现**
- 同时提交 `docs/聚蚁-sub2api-开发文档/` 知识库(110 文件):上游 `.gitignore` 的 `docs/*` 会吞掉它,
  需在其后加 `!docs/聚蚁-sub2api-开发文档/` + `!docs/聚蚁-sub2api-开发文档/**` 两行开洞
  (只放行子文件不放行目录则无效)
- **纯二开发布走 push 触发,不是等每日定时**:push custom → CI `Sync` 步跳过(`if: event != push`)→
  直接构建。版本号仍由 `git describe` 取 v0.1.183,故镜像别名 `v0.1.183-custom` 会移到新 sha
  (生产只认不可变的 `custom-<sha8>`,无影响)。注意 workflow 的 `paths-ignore: ['**.md','docs/**']`——
  **只改文档的 push 不会触发构建**,本次因同 push 含 .vue 才触发
- 落地:CI run 33229326999 绿灯(7m37s)→ 镜像 `custom-8ef64720` → pull → `strings` 验版本 0.1.183 →
  smoke(额外 curl 烟测栈 assets grep `juyi-float-header`/`jy-count` 确认新前端真进了镜像)→
  备份 318M(sub2api-20260829-024738.sql.gz)→ switch → smoke-down;回滚位落到 `custom-ff078d86`

**R15(2026-08-30)监控页 V2 重设计(首次改上游业务代码)+ 登录页哨兵 + 蚁群步态**
- **监控页 V2**(用户四轮迭代):移除筛选/状态栏 → 时间范围块(24h/3d/7d);按平台分组、每模型一张
  诊断卡;指标改 metric-chip 小方块。逻辑从视图抽到 `modelStatus.ts` + `ModelStatusCard.vue`,
  视图净减 848 行。后端 `ParseFilter` 桶映射同步扩展:24h 1h→**5min**(288 格,命中固定 5m rollup)、
  新增 **3d→15min**(从 1m facts 重分箱)、7d 12h→**1h**(骑 1h rollup)
- **这是二开第一次改上游业务逻辑**,合并风险从此不同:后端文件 1 → 3,且 channel-monitor-v2 是
  上游活跃迭代区。**专门写了「监控页 V2 合并策略」一节**(逐文件说明取 ours / 取 theirs / 手工移植),
  以及三条不能丢的业务约束(活跃判定用 buckets 存在性而非 request_count、色带固定 60 块、
  查询失败不得渲染成健康)。**下次合上游动到这块,先读那一节再动手**
- **登录页哨兵** `JuyiAntSentry.vue`:卡片左右各一只卡通蚂蚁卫兵(六角蜂蜡盔+信息素长矛),
  六个交互状态 —— 点普通框低头看、点密码框捂眼、点「显示密码」从指缝偷看(MutationObserver 盯 type)、
  输入时触角快抖、提交时举矛敬礼、待机呼吸/眨眼/瞳孔跟随指针。
  **零侵入**:全靠 document 级事件委托,LoginView(745 行)/RegisterView(1076 行)一行未改;
  挂在 AuthLayout 上,登录/注册/找回密码三页通吃。`<900px` 不渲染(两侧无余量)
- 蚁群步态 v4:六足改交替三角步态,**步频由线速度反推**(步幅÷线速度)而非拍脑袋定常数,否则必打滑;
  速度模型从「每秒推进多少 t」改成恒定线速度(9 条路径弧长从 ~550 差到 ~1800,按 t 匀速会让短路上
  线速度只有长路 1/3)。首版 8-11Hz 被用户判为"太快、抽象"——每周期只有 5-7 帧,人眼读到的是抖动;
  降到 ~4.2Hz(14 帧/周期),同时放大步幅与蚁体,否则慢步频×小步幅=看着像钉在原地。
  **「抽象」的真正主因不是腿,是驮的光粒光晕半径 5.6 把上半身罩成亮斑**,收到 3.4 后轮廓立刻清晰
- 去掉登录卡顶部 3px 渐变彩条(用户:"AI 味太重")——与"卡片侧边彩条"同类的 AI 生成痕迹
- 新增 `--jy-ant-stroke`:暗色下 `--jy-ant-leg` 是亮琥珀,直接当描边会和金色躯体糊成一团
- 落地:CI run 84b8240d 绿灯 → 镜像 `custom-84b8240d` → pull → `strings` 验版本 0.1.183 →
  smoke → 备份 → switch → smoke-down;回滚位落到 `custom-8ef64720`。
  验证:前端 49 个监控单测 + `pnpm run build` 全过;本地无 Go,后端靠 CI 的 docker build 兜编译

**R16(2026-08-31)监控页明细窗修复(纯二开发布)**
- 症状:模型卡色带上悬停/点击首尾色块,区间明细窗只露出一半——卡片 `article` 的 `overflow-hidden`
  (色带必须被卡片裁住)把绝对定位的明细窗一并裁掉了,旧代码还把窗**夹进色带宽度**(half=110)、
  等于主动摁回卡片内
- 改法:明细窗 `<Teleport to="body">` + `position: fixed` 物理脱离卡片;锚点改 `getBoundingClientRect`
  取视口坐标;nextTick 量出窗尺寸后水平夹进视口(左右各 8px),上方放不下则翻到色带下方,
  并预留 **84px 让开浮动 header**(header z=30 < 窗 z-70,不让开就会盖住它);
  fixed 是视口锚定,窗打开期间监听 `scroll`(capture)/`resize` 直接关闭,避免滚动脱锚
- **副作用会咬测试**:窗不在组件根内了,`wrapper.find('[role=tooltip]')` 永远为空——
  单测改从 `document.body.querySelector` 查;`designSystem.structure.spec.ts` 加了
  「必须 Teleport 出卡片」断言防回退
- 验证:本地 dev + `mock-monitor-server.mjs` 用 Playwright 实测三种位置(最左溢出卡片、
  最右夹在视口内、贴顶自动下翻);49 个监控单测 + `pnpm run build` 过
- 落地:push 触发 CI run 33349486524 绿灯(7m16s)→ 镜像 `custom-2dba8964` → pull(digest 与 CI 一致)→
  `strings` 验版本 0.1.183 **且 grep 到 `bucket-detail pointer-events-none fixed`**(确认新前端真进了镜像)→
  smoke → 备份 320M(sub2api-20260831-021738.sql.gz)→ switch → smoke-down;回滚位落到 `custom-84b8240d`

**R17(2026-09-14)升级到 v0.2.4(首次跨大版本 0.1→0.2,监控页 V2 合并策略首战)**
- 现场:CI 自 9/9 起连续 5 天红灯(卡在 `Sync`),生产停在 0.1.183。期间 CI **已自动无冲突合入**
  v0.1.185/v0.2.0/v0.2.1/v0.2.3 四个 tag(私有 `custom` 领先本地 4 个 merge 提交,先 `--ff-only` 对齐),
  卡住的是 v0.2.4。**接手时先验 CI 自动合的那几版有没有静默动到监控 V2**:
  `git diff v0.2.3 custom --name-only | grep -v docs` = 70 与 R15 清单逐字一致,后端 `ParseFilter` 24h/3d/7d 桶映射完好
- v0.2.4 冲突 2 文件,均取 ours:① GroupBadge.vue(上游新增 MiniMax 平台配色,同 R10/R13 套路);
  ② **ChannelStatusV2View.vue(合并策略首次实战)**:上游 #6759 加了「隐藏用户排名」开关
  (`isChannelMonitorUserRankingHidden`,tab 裁剪 + 跳过 `/users`)与「TTFT 缺样本显示中性」(`ttftDisplayState`)。
  按策略 `git diff v0.2.3 v0.2.4 -- <file>` 逐段核对:我们的重写版**没有用户排名 tab、不调 `/users`、
  不用上游 MetricCell 的 ttft state**,两处改动对我们零作用面 → 整文件取 ours,无需手工移植。
  后端 `channel_monitor_v2.go` 上游只加了 `hideUserRankingForViewer`,与我们的 case 分支不相邻,自动合并干净
- 私有仓库 tag 落后 7 个(v0.1.184~v0.2.4;**CI 自动合并并不推 tag**),一次补推;
  推送顺序铁律照旧(tag 先→分支后),CI 日志 `build=true version=0.2.4 sha8=8c712f25` ✅
- 本机现在有 `gh` CLI 2.98(已登录 dawanglaohu),排查 CI 直接 `gh run list/view --log-failed`,
  不必再绕服务器 PAT。查 GHCR 版本列表用 `gh api user/packages/...`(**不带前导斜杠**,Git Bash 会把
  `/user/...` 改写成文件路径)
- 落地:push 触发 CI run 34794345028 绿灯(~8min)→ 镜像 `custom-8c712f25` → pull → `strings` 验版本 0.2.4
  且 grep 二进制内 6 处二开标记(juyi-float-header/bucket-detail…fixed/JuyiAntSentry/jy-count)→ smoke →
  备份 318M(sub2api-20260914-010836.sql.gz)→ switch → smoke-down;回滚位落到 `custom-2dba8964`。
  验收:8181 HTTP 200 + title「聚蚁」、logo.svg 200、5 分钟日志零 error/migrat 报错,真实用户 `/auth/me` 200,
  本机 `curl --resolve` 走公网 443 同样 200
- 前端验证口径更新:`pnpm vitest run src/features/channel-monitor-v2` 现在是 **57 个**(上游加了 MetricCell/monitorFormat 用例)

**R18(2026-09-17)升级到 v0.2.5(CI 全自动无冲突,纯运维)+ 排查「未能更新任何能力元数据」警告**
- 现场:9/16 每日 CI 已自动无冲突合入 v0.2.5(私有 `custom` 领先本地 1 个 merge 提交,`--ff-only` 对齐)。
  硬校验 `git diff v0.2.5 custom --name-only | grep -v docs` = 70,与 R17 清单 comm 逐字一致;
  `git log v0.2.4..v0.2.5 -- <监控 V2 七个文件>` 为空,上游本区间没碰监控页,桶映射/`'3d'` 完好
- 私有仓库缺 v0.2.5 tag(CI 自动合并不推 tag,同 R17),补推;tag push 不触发构建,镜像已是 CI 合并后的 sha
- **`gh run list` 要带 `-R dawanglaohu/sub2api-private`**——本地 remote 没有 `origin`,gh 会默认解析到
  `upstream`(Wei-Shaw/sub2api)报 404 workflow not found。`gh api user/packages/...` 当前 token 缺 read:packages
  scope 报 403,镜像标签改从 `gh run view <id> --log | grep image.name` 拿(`ghcr.io/...:custom-31f3387b`)
- 落地:镜像 `custom-31f3387b`(digest 485df794 与 CI 一致)→ `strings` 验版本 0.2.5 且 6 处二开标记齐全
  (juyi-float-header/bucket-detail…fixed/JuyiAntSentry/jy-count/JuyiSwarmField/ModelStatusCard)→ smoke →
  备份 314M(sub2api-20260917-080101.sql.gz)→ switch → smoke-down;回滚位落到 `custom-8c712f25`。
  验收:8181 HTTP 200 + title「聚蚁」、logo.svg 200、/health ok、启动后日志零 error/migrat 报错
- **「模型 ID 已同步,但未能更新任何能力元数据」根因(上游设计限制,非故障)**:
  `SyncUpstreamModelCatalog`(`backend/internal/service/upstream_models.go`)先读上游 `/models` 响应里的
  能力字段(reasoning/context_window/input_modalities…),不全就去 models.dev 注册表按账号 base_url 匹配
  provider 补齐;每个模型都补不齐 → 返回 `upstream_model_metadata_incomplete` → 前端弹这条警告。
  实测:① 我们的中转站(api.zzshu.cc / st.walkcoding.top)`/models` 只回 id/display_name/type/created,零能力字段;
  ② models.dev 里 anthropic/xai/openai 三个 provider **没有 `api` 字段**,按 URL 前缀永远匹配不上,
  已知 host 兜底只认 api.openai.com/chatgpt.com/opencode.ai——我们全部账号(中转站、kiro-rs 内网、
  cli-chat-proxy.grok.com)一个都不在名单,连官方 api.anthropic.com 也匹配不上。
  **影响面:模型 ID 白名单照常同步成功;能力元数据只服务 Codex 类客户端的模型目录展示**
  (reasoning 档位/模态/上下文窗口),Anthropic 中转账号无感。DB 里 `accounts.extra` 无一条
  `upstream_model_metadata`,验证了从未成功写入。要消警告只能改上游匹配逻辑(加已知 host 或
  按 platform 直接映射 provider),属上游功能范围,本轮不动

**R19(2026-09-25)升级到 v0.2.8(本地合并无冲突,纯运维)**
- 9/18 后每日 CI 未再合入新版(v0.2.7/v0.2.8 未被自动合),本地直接 `git merge v0.2.8`,零冲突
- 硬校验:`git diff v0.2.8 HEAD` 非 docs 清单 70,与 v0.2.5 基线 comm 逐字一致;上游 v0.2.5..v0.2.8 未碰监控 V2 七个文件;
  `'3d'`、`case "3d"`、ext: 均在。`pnpm run build` 过,监控单测现为 **51 个**全过
- 补推 tag v0.2.7/v0.2.8(先 tag 后分支)→ CI run 36085048116 绿灯 → 镜像 `custom-7e3c68da`(version=0.2.8)→
  pull → strings 验 0.2.8 + 6 处二开标记 → smoke → 备份 306M(sub2api-20260925-021722.sql.gz)→ switch → smoke-down;
  回滚位 `custom-31f3387b`。验收:8181 200 + title「聚蚁」、logo.svg 200、日志零 error

## 设计决策(颜色边界,回答"为什么有些颜色不跟主题")

- **跟主题(品牌位)**:按钮/链接/激活态/复选框/分组徽章/容量活跃态/图表主色/表格底色
- **刻意保留(语义位)**:平台徽章(Claude 橙、OpenAI 绿、Gemini 蓝——平台身份编码);
  状态语义(错误红、成功绿、警示黄:过期/满载/临期);上游 stats 卡片的多彩图标(信息区分)

## 二开文件清单

新增:`styles/juyi.css`(字体+主题变量+hex/蚁径动画+R14 入场动效)、`assets/fonts/*.woff2`、
`components/brand/BrandMark.vue`、`components/home/AntTrailPipeline.vue`、`views/home/JuyiHome.vue`、
`components/juyi/{UserEndpointHero,HiveAccountGrid,JuyiSwarmField,JuyiAppearanceMenu,JuyiAntSentry}.vue`
(R14:JuyiSwarmField 取代已删除的 JuyiSwarmCanvas;R15:JuyiAntSentry 登录页哨兵)、
`composables/{useJuyiAppearance,useJuyiReveal}.ts`、`directives/juyiCount.ts`、
`i18n/locales/{zh,en}/juyi.ts`、`public/logo.svg`、
`deploy/juyi/{update-from-ghcr.sh,smoke-compose.yml,seed-buy-menu.sql}`、
`docs/聚蚁-sub2api-开发文档/`(知识库,需 .gitignore 开洞放行)、
**R15 监控页**:`features/channel-monitor-v2/{ModelStatusCard.vue,modelStatus.ts}`、
`features/channel-monitor-v2/__tests__/{ModelStatusCard,modelStatus}.spec.ts`、
`frontend/mock-monitor-server.mjs`(dev mock,不进构建产物)

修改:`tailwind.config.js`(变量化 primary/暖 dark/字体/阴影渐变)、`main.ts`(+5行:juyi.css + v-jy-count)、
`index.html`(favicon)、`.gitignore`(docs 白名单 + .finesse/)、
`views/HomeView.vue`(壳)、`views/{user,admin}/DashboardView.vue`(各插1组件)、`i18n/*/index.ts`(+1行)、
`components/layout/AppSidebar.vue`(ext:外链+外观菜单)、`components/layout/AuthLayout.vue`(动效背景+R15 哨兵挂载)、
`components/layout/AppHeader.vue`(R14 浮动头 1 class)、`components/layout/AppLayout.vue`(R14 主列 margin)、
`components/common/VersionBadge.vue`(封更新)、`components/common/DataTable.vue`(暖化)、
`components/common/GroupBadge.vue`、`components/account/AccountCapacityCell.vue`、
`components/layout/__tests__/docUrlSanitization.spec.ts`(R14 改指 JuyiHome)、
`.github/workflows/custom-build.yml`;另有 GroupsView/UsersView/图表等 sed 式颜色收编

**R15 起碰了上游功能代码(冲突处理见上方「监控页 V2 合并策略」,不能无脑取 ours)**:
`backend/internal/service/channel_monitor_v2.go`(ParseFilter 桶映射 ~14 行)、
`backend/internal/service/channel_monitor_v2_test.go`(3 段断言)、
`frontend/src/views/user/ChannelStatusV2View.vue`(整页重写,−848 行)、
`frontend/src/api/channelMonitorV2.ts`(MonitorRange 加 `'3d'`)、
`frontend/src/i18n/locales/{zh,en}/channelMonitorV2.ts`(各 +20 行文案)、
`frontend/src/features/channel-monitor-v2/__tests__/designSystem.structure.spec.ts`

> **二开面积:R13 51 → R14 57 → R15 70 文件**(docs/ 知识库另计)。
> 硬校验口径:`git diff v0.1.x --name-only | grep -v '^"docs/'` 应等于本清单。
> 后端从 1 个文件变成 3 个,合并风险等级随之上升——别再当成"纯前端二开"。

## 本地开发

```bash
cd frontend && corepack enable && corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile
pnpm dev --port 5201     # 无后端,公开设置接口报错属预期
pnpm run build           # vue-tsc + vite,CI 同款验证
```
Playwright 验证生产走 https://vvct.site(本机代理只通 443;服务器高位端口从本机不可达,烟测断言在服务器 curl 做)。

<!-- vault:begin -->
## 先读这个：项目知识库

本项目的设计、任务拆分、边界处理、实现记录，全部沉淀在这里：

    docs/聚蚁-sub2api-开发文档/

**动手写任何代码之前，先读 `docs/聚蚁-sub2api-开发文档/_MOC.md`**。它是总索引，告诉你查什么去哪找。

规模：15 个模块 · 31 个任务 · 43 条边界。

### 查东西去哪

| 你要找 | 路径 |
|---|---|
| 项目目标、明确不做什么 | `docs/聚蚁-sub2api-开发文档/00-概览/` |
| 技术栈与被否方案 | `docs/聚蚁-sub2api-开发文档/01-约束/05-技术栈.md` |
| 架构、数据模型、接口约定 | `docs/聚蚁-sub2api-开发文档/02-设计/` |
| 界面风格与交互规范 | `docs/聚蚁-sub2api-开发文档/02-设计/09-UI.md`、`10-UX.md` |
| **某个模块负责什么、代码在哪** | `docs/聚蚁-sub2api-开发文档/图谱/模块/<模块ID>.md` |
| **某个任务的完整要求与实现记录** | `docs/聚蚁-sub2api-开发文档/图谱/任务/<任务ID>.md` |
| **某种异常情况该怎么处理** | `docs/聚蚁-sub2api-开发文档/图谱/边界/<边界ID>.md` |

任务 ID 形如 `M1-T1`，模块 `M1`，边界 `E-01`。三类笔记互相 `[[链接]]`，
顺着链接走能从任何一个点找到相关的全部上下文。

### 动代码的规矩

- 二开维护基线是 `custom`；如需隔离分支，可从它创建 `task/<任务ID>`。未经用户明确要求，不推送、不合并、不部署。
- 只做当前任务范围内的事，不提前做后面的。
- 验收标准和边界编号是硬指标，不是参考。每条都要能指到具体代码。
- 业务变更不要顺手改源章节；知识库维护任务应先改第 06/11/17 节源表，再重跑生成器。
- **落地前必须回填** `图谱/任务/<任务ID>.md` 的「代码位置」和「实施沉淀」两段。
  代码位置格式：`` `路径:行号` — 说明 ``，一行一处。
  没回填不得落地——知识库烂掉，都是从没人回填开始的。

_本段由 build_vault.py 生成，重跑会覆盖；这两个标记之外的内容不会动。_
<!-- vault:end -->
