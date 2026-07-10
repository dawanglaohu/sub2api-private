# 聚蚁(sub2api 二开)项目记忆

> 下次会话请先通读本文件。生产有事直接跳「更新 SOP」和「当前状态」。

## 项目定位

上游 [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api) 的**私有品牌二开**,品牌"聚蚁"(JuYi,蚁群隐喻:多订阅聚合成一个 API)。
生产站 **https://vvct.site**(38.246.245.106,SSH MCP `default`;链路 nginx容器:443 → 127.0.0.1:8181 sub2api-nginx → sub2api:8080)。

- 私有仓库:https://github.com/dawanglaohu/sub2api-private (GitHub 账号 dawanglaohu,GCM 已存凭据)
- 本地 remote:`upstream` = 上游(只读勿推);`private` = 私有仓库
- 分支:`main` = 上游镜像(仅参考);**`custom` = 二开主分支(默认分支,一切开发在此)**
- 上游 v* tags 已同步进私有仓库(CI 合并新 tag 时会一并推)

## 当前状态(2026-07-10)

- **生产镜像:`ghcr.io/dawanglaohu/sub2api:custom-0102b9b1`,自报版本 0.1.150**(= 上游 v0.1.150 + 全部二开)
- 回滚位:`custom-754469e4`(见 `/opt/sub2api-tool/previous-image`)
- DB 备份:每次 switch 前跑 `bash /root/sub2api-deploy/backup.sh` → /root/sub2api-backups(保留 14 天)
- 管理台设置(存 DB,更新永不丢):site_name=聚蚁、site_logo=/logo.svg、site_subtitle=品牌句、
  custom_menu_items=[兑换码购买 → `ext:https://pay.ldxp.cn/shop/NG0GBH88`]、home_content=空(走聚蚁落地页)

## 更新 SOP(上游发新版时)

1. **CI 自动**:每日 UTC 02:23(北京 10:23)自动 merge 上游最新 release tag → 构建推送镜像。
   手动触发:GitHub Actions → "Custom Build" → Run workflow(force_build 可强制)。
2. **服务器三连**(root@38.246.245.106):
   ```bash
   /opt/sub2api-tool/update-from-ghcr.sh pull  custom-<sha8>
   /opt/sub2api-tool/update-from-ghcr.sh smoke custom-<sha8>   # 隔离烟测:/health + 聚蚁 UI 标记
   bash /root/sub2api-deploy/backup.sh                          # 全库备份
   /opt/sub2api-tool/update-from-ghcr.sh switch custom-<sha8>   # 改 .env SUB2API_IMAGE + compose up -d
   ```
   出事:`update-from-ghcr.sh rollback`(可再次执行切回)。`status` 看全景。
3. **merge 冲突时**(CI 红灯):本地 `git fetch upstream --tags && git checkout custom && git merge v0.1.x`,
   解决冲突(我们的改动见下方"二开清单",冲突多半在 tailwind.config/main.ts/两个 DashboardView/AppSidebar/VersionBadge),push 即重新构建。
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
