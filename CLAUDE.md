# 聚蚁(sub2api 二开)项目记忆

> 下次会话请先通读本文件。生产有事直接跳「更新 SOP」和「当前状态」。

## 项目定位

上游 [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api) 的**私有品牌二开**,品牌"聚蚁"(JuYi,蚁群隐喻:多订阅聚合成一个 API)。
生产站 **https://vvct.site**(38.246.245.106,SSH MCP `default`;链路 nginx容器:443 → 127.0.0.1:8181 sub2api-nginx → sub2api:8080)。

- 私有仓库:https://github.com/dawanglaohu/sub2api-private (GitHub 账号 dawanglaohu,GCM 已存凭据)
- 本地 remote:`upstream` = 上游(只读勿推);`private` = 私有仓库
- 分支:`main` = 上游镜像(仅参考);**`custom` = 二开主分支(默认分支,一切开发在此)**
- 上游 v* tags 已同步进私有仓库(CI 合并新 tag 时会一并推)

## 当前状态(2026-08-13)

- **生产镜像:`ghcr.io/dawanglaohu/sub2api:custom-5a262630`,自报版本 0.1.176**(= 上游 v0.1.176 + 全部二开,**无任何 Grok PR 私货**;CI 全自动合并,无冲突)
- **#4043 已退役**(R9):上游 v0.1.155 用 #4094/#4188 系列重新实现了 billing 配额探测(QueryQuota 混合探测+rolling 24h 免费额度+本地账期统计),我们的 4043 保留全部换成上游原版。custom 相对上游 tag 的差异从此= 二开清单 + setting_handler_update.go(ext:),硬校验口径见 R8(**2026-08-08 实测 52 文件**,清单与 v0.1.168 时逐字一致)
- 回滚位:`custom-8b52d224`(v0.1.172,见 `/opt/sub2api-tool/previous-image`)
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
   解冲突唯一原则:**二开清单文件取 ours,其余一切取 theirs**(setting_handler_update.go 手工保留 ext: 11 行)。
   解完硬校验:`git diff v0.1.x --name-only --staged` 必须只剩二开清单+setting_handler_update.go,
   多出的文件 `git checkout v0.1.x -- <f>` 强制对齐。前端 `pnpm run build` 过了再提交。
   **推送顺序铁律:先 `git push private v0.1.x`(tag),后 `git push private custom`(分支)**——
   分支 push 立刻触发构建,tag 晚到 CI 的 `git describe` 就取旧 tag,镜像自报旧版本号
   (R8/R9 各踩一次;标错了去 Actions 手动 Run workflow 勾 force_build 重建)。
   部署前可验版本:`docker run --rm --entrypoint sh <镜像> -c 'strings /app/sub2api | grep -xE "0\.1\.[0-9]+"'`。
4. 镜像标签:`custom-<sha8>`(不可变,生产用)/ `v<版本>-custom` / `custom-latest`(移动,生产禁用)。

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

## 设计决策(颜色边界,回答"为什么有些颜色不跟主题")

- **跟主题(品牌位)**:按钮/链接/激活态/复选框/分组徽章/容量活跃态/图表主色/表格底色
- **刻意保留(语义位)**:平台徽章(Claude 橙、OpenAI 绿、Gemini 蓝——平台身份编码);
  状态语义(错误红、成功绿、警示黄:过期/满载/临期);上游 stats 卡片的多彩图标(信息区分)

## 二开文件清单

新增:`styles/juyi.css`(字体+主题变量+hex/蚁径动画)、`assets/fonts/*.woff2`、
`components/brand/BrandMark.vue`、`components/home/AntTrailPipeline.vue`、`views/home/JuyiHome.vue`、
`components/juyi/{UserEndpointHero,HiveAccountGrid,JuyiSwarmCanvas,JuyiAppearanceMenu}.vue`、
`composables/useJuyiAppearance.ts`、`i18n/locales/{zh,en}/juyi.ts`、`public/logo.svg`、
`deploy/juyi/{update-from-ghcr.sh,smoke-compose.yml,seed-buy-menu.sql}`

修改:`tailwind.config.js`(变量化 primary/暖 dark/字体/阴影渐变)、`main.ts`(+2行)、`index.html`(favicon)、
`views/HomeView.vue`(壳)、`views/{user,admin}/DashboardView.vue`(各插1组件)、`i18n/*/index.ts`(+1行)、
`components/layout/AppSidebar.vue`(ext:外链+外观菜单)、`components/layout/AuthLayout.vue`(动效背景)、
`components/common/VersionBadge.vue`(封更新)、`components/common/DataTable.vue`(暖化)、
`components/common/GroupBadge.vue`、`components/account/AccountCapacityCell.vue`、
`.github/workflows/custom-build.yml`;另有 GroupsView/UsersView/图表等 sed 式颜色收编

## 本地开发

```bash
cd frontend && corepack enable && corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile
pnpm dev --port 5201     # 无后端,公开设置接口报错属预期
pnpm run build           # vue-tsc + vite,CI 同款验证
```
Playwright 验证生产走 https://vvct.site(本机代理只通 443;服务器高位端口从本机不可达,烟测断言在服务器 curl 做)。
