# 聚蚁(sub2api 二开)项目文档

## 项目定位

本仓库是上游 [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api) 的**私有二开分支**,品牌名"聚蚁"(JuYi),
生产站 https://vvct.site (38.246.245.106, 8181←sub2api-nginx←sub2api)。

- 私有仓库:https://github.com/dawanglaohu/sub2api-private
- 本地 remote:`upstream` = 上游公开仓库(只读,勿推送);`private` = 私有仓库
- 分支:`main` = 上游镜像(参考);**`custom` = 二开主分支(默认分支,一切开发在此)**

## 部署与远程更新体系

```
上游 release → CI 每日 UTC 02:23 自动 merge 最新 tag 进 custom → 构建镜像
push custom  → CI 直接构建
镜像: ghcr.io/dawanglaohu/sub2api:{custom-<sha8> 不可变 | v<版本>-custom | custom-latest 移动}
服务器: /opt/sub2api-tool/update-from-ghcr.sh  status|pull <tag>|smoke <tag>|smoke-down|switch <tag>|rollback
```

- CI workflow:`.github/workflows/custom-build.yml`(上游 4 个 workflow 已在仓库设置里禁用)
- merge 冲突时 CI 失败,本地处理:`git fetch upstream --tags && git merge <tag>`,解决后 push
- 服务器 compose:`/root/sub2api-deploy`(官方 docker-compose.yml **不改**;`docker-compose.override.yml`
  给 sub2api 服务加了 `image: ${SUB2API_IMAGE:-weishaw/sub2api:latest}`,由 `.env` 的 `SUB2API_IMAGE` 钉版本)
- 烟测栈:`/opt/sub2api-smoke/docker-compose.yml`(临时 pg/redis,烟测管理员 smoke@juyi.test / Smoke-Pass-123)
- 脚本存档:`deploy/juyi/`(上游 .gitignore 忽略 `scripts/`,所以放这里)
- 切生产前先 `bash /root/sub2api-deploy/backup.sh`(全库 pg_dump → /root/sub2api-backups,保留 14 天)

### 守则

1. **生产只用 `custom-<sha8>` 不可变标签**,禁用 latest 类移动标签
2. **管理后台的"执行更新/回滚版本"不可用**(二开已隐藏入口):它下载上游官方二进制,会覆盖聚蚁 UI;
   "检查更新"提示灯保留,看到新版本提示 = CI 次日自动跟进(或 Actions 页手动 Run workflow)
3. 烟测绝不挂生产 data/postgres 卷
4. 后端启动做前向 DB 迁移,跨大版本回滚前核对备份

## 二开内容清单(全部在 custom 分支)

**设计语言**:"蚁巢工学"——蜜琥珀主色 + 信息素青辅色 + 暖褐黑暗色 + 蜂窝六边形 + 蚁径粒子动效。
品牌标:六边形巢房 + 三点蚁径(`frontend/public/logo.svg` / `logo.png`,`BrandMark.vue`)。

**新增文件(零合并冲突)**:
- `frontend/src/styles/juyi.css` — 字体 @font-face(vendored woff2)、多主题 CSS 变量、hex-cell/蚁径动画
- `frontend/src/assets/fonts/*.woff2` — Space Grotesk + IBM Plex Mono(拉丁子集,**故意不走 npm 依赖**,
  避免 pnpm-lock.yaml 与上游合并冲突)
- `frontend/src/components/brand/BrandMark.vue` — 蚁标组件
- `frontend/src/components/home/AntTrailPipeline.vue` — 主页 hero 管线动画(订阅源→聚蚁核心→统一 API)
- `frontend/src/views/home/JuyiHome.vue` — 全新落地页(HomeView 只是薄壳,保留 home_content 覆盖逻辑)
- `frontend/src/components/juyi/UserEndpointHero.vue` — 用户仪表盘问候+端点快复卡
- `frontend/src/components/juyi/HiveAccountGrid.vue` — 管理台账号蜂巢健康图
- `frontend/src/components/juyi/JuyiSwarmCanvas.vue` — 蚁群 canvas 动态背景(登录/注册/主页,
  颜色跟随主题变量,reduced-motion/隐藏页自动降级)
- `frontend/src/components/juyi/JuyiAppearanceMenu.vue` + `composables/useJuyiAppearance.ts`
  — 多主题(蜜琥珀/信息素青/靛夜/炭玫)+ 字体(黑体/宋体/等宽)切换,localStorage 持久化
- `frontend/src/i18n/locales/{zh,en}/juyi.ts` — 二开文案(独立 `juyi.*` 命名空间)

**修改的上游文件(编辑面刻意最小化)**:
- `tailwind.config.js` — primary 改为 CSS 变量(多主题地基)、dark 改暖褐黑、字体/阴影/渐变 token
- `src/main.ts` — +2 行(juyi.css import、initJuyiAppearance)
- `index.html` — favicon 换 logo.svg
- `src/views/HomeView.vue` — 壳化(30 行)
- `src/views/user/DashboardView.vue`、`src/views/admin/DashboardView.vue` — 各插 1 个组件
- `src/i18n/locales/{zh,en}/index.ts` — 各 +1 行 spread
- `src/components/layout/AppSidebar.vue` — 自定义菜单项支持 `ext:` 前缀外链(新窗口打开)+ 外观菜单入口
- `src/components/layout/AuthLayout.vue` — 背景加蜂窝纹理+蚁群动效
- `src/components/common/VersionBadge.vue` — `allowSelfUpdate=false` 封禁自更新/回滚入口
- 颜色收编(sed 批量):残留 teal→primary、checkbox 蓝→primary、violet 徽章→primary、
  图表色板首色→琥珀;**平台语义徽章(Claude 橙/OpenAI 绿等)刻意保留**——是信息编码不是品牌色

**管理台可配置项(存 DB,更新永不丢)**:
- `site_name` = 聚蚁;`site_logo` = /logo.svg;`site_subtitle` = 品牌句
- `custom_menu_items`:"兑换码购买"外链(`ext:https://pay.ldxp.cn/shop/NG0GBH88`,用户可见)
- `home_content` 留空 → 走聚蚁落地页;填 HTML/URL 可整页覆盖(应急开关)

## 本地开发

```bash
cd frontend
corepack enable && corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile
pnpm dev --port 5201        # 本地无后端,设置走默认值/公开接口报错属预期
pnpm run build              # vue-tsc 类型检查 + vite 构建(CI 同款)
```

**开发纪律(保合并顺畅)**:新功能新文件(juyi 目录);改上游文件只做小而准的插入;
新 i18n 只进 juyi 命名空间;不给 package.json 加依赖(要资源就 vendored);
不改官方 docker-compose.yml。
