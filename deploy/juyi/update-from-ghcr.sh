#!/usr/bin/env bash
# sub2api 生产更新脚本 —— 镜像来源固定为私有仓库 CI 构建产物
#   代码仓库: https://github.com/dawanglaohu/sub2api-private (custom 分支)
#   镜像地址: ghcr.io/dawanglaohu/sub2api
#     push custom 分支 => custom-<sha8>(不可变) / v<版本>-custom / custom-latest(移动)
#     每日定时自动合并上游 release 后同样产出以上标签
#
# 用法:
#   ./update-from-ghcr.sh status          查看生产容器/钉住镜像/回滚位
#   ./update-from-ghcr.sh pull <tag>      拉取指定标签
#   ./update-from-ghcr.sh smoke <tag>     隔离烟测(默认 127.0.0.1:18080, 临时 pg/redis, 不碰生产数据)
#   ./update-from-ghcr.sh smoke-down      清理烟测栈
#   ./update-from-ghcr.sh switch <tag>    切换生产(.env 的 SUB2API_IMAGE + compose up -d)
#   ./update-from-ghcr.sh rollback        回滚到上一个镜像(可再次执行切回)
#
# 守则(沿用 kiro-rs 体系):
#   - 生产禁用 custom-latest 等移动标签, 只用 custom-<sha8> 不可变标签
#   - 烟测绝不挂生产 data/postgres 卷
#   - 后端启动会做前向数据库迁移;跨大版本回滚前先核对 /root/sub2api-deploy/backups
set -euo pipefail

IMAGE_REPO="ghcr.io/dawanglaohu/sub2api"
DEPLOY_DIR="/root/sub2api-deploy"
ENV_FILE="$DEPLOY_DIR/.env"
TOOL_DIR="/opt/sub2api-tool"
SMOKE_DIR="/opt/sub2api-smoke"
SMOKE_PORT="${SMOKE_PORT:-18080}"
SMOKE_BIND="${SMOKE_BIND:-127.0.0.1}"

cmd="${1:-status}"; tag="${2:-}"
need_tag() { [ -n "$tag" ] || { echo "错误: 需要镜像标签, 例: $0 $cmd custom-1910d17b"; exit 1; }; }
current_image() { grep -E '^SUB2API_IMAGE=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true; }

case "$cmd" in
  status)
    echo "== 生产容器 =="
    docker inspect sub2api --format '状态: {{.State.Status}}  启动: {{.State.StartedAt}}
镜像: {{.Config.Image}}  上游版本: {{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null || echo "(sub2api 容器不存在)"
    echo "== .env 钉住的镜像 =="
    echo "SUB2API_IMAGE=$(current_image)"
    echo "== 回滚位 =="
    cat "$TOOL_DIR/previous-image" 2>/dev/null || echo "(无记录)"
    echo "== 本地 GHCR 镜像 =="
    docker images "$IMAGE_REPO" --format '{{.Repository}}:{{.Tag}}  {{.CreatedAt}}' | head -8
    ;;

  pull)
    need_tag
    docker pull "$IMAGE_REPO:$tag"
    docker images "$IMAGE_REPO:$tag" --format '已就绪: {{.Repository}}:{{.Tag}}  ID:{{.ID}}'
    ;;

  smoke)
    need_tag
    docker compose -p sub2api-smoke -f "$SMOKE_DIR/docker-compose.yml" down -v --remove-orphans >/dev/null 2>&1 || true
    SMOKE_IMAGE="$IMAGE_REPO:$tag" SMOKE_PORT="$SMOKE_PORT" SMOKE_BIND="$SMOKE_BIND" \
      docker compose -p sub2api-smoke -f "$SMOKE_DIR/docker-compose.yml" up -d
    echo "等待健康检查(最多 120s)..."
    ok=0
    for i in $(seq 1 40); do
      if curl -sf "http://127.0.0.1:$SMOKE_PORT/health" >/dev/null 2>&1; then ok=1; break; fi
      sleep 3
    done
    if [ "$ok" != 1 ]; then
      echo "烟测失败: /health 未就绪"; docker logs sub2api-smoke --tail 40; exit 1
    fi
    echo "/health OK"
    if curl -s "http://127.0.0.1:$SMOKE_PORT/" | grep -q 'logo.svg'; then
      echo "UI 标记 OK(检测到聚蚁构建产物 logo.svg)"
    else
      echo "失败: 首页未检测到聚蚁 UI 标记"; exit 1
    fi
    echo "烟测通过。浏览器人工验证: SMOKE_BIND=0.0.0.0 $0 smoke $tag 后访问 http://<服务器IP>:$SMOKE_PORT"
    echo "  烟测管理员: smoke@juyi.test / Smoke-Pass-123 (临时库, 随 smoke-down 销毁)"
    ;;

  smoke-down)
    docker compose -p sub2api-smoke -f "$SMOKE_DIR/docker-compose.yml" down -v --remove-orphans
    echo "烟测栈已清理"
    ;;

  switch)
    need_tag
    docker image inspect "$IMAGE_REPO:$tag" >/dev/null 2>&1 || { echo "本地无该镜像, 先执行: $0 pull $tag"; exit 1; }
    mkdir -p "$TOOL_DIR"
    prev="$(current_image)"; [ -n "$prev" ] || prev="weishaw/sub2api:latest"
    echo "$prev" > "$TOOL_DIR/previous-image"
    cp "$ENV_FILE" "$ENV_FILE.bak-switch-$(date +%Y%m%d-%H%M%S)"
    if grep -qE '^SUB2API_IMAGE=' "$ENV_FILE"; then
      sed -i "s|^SUB2API_IMAGE=.*|SUB2API_IMAGE=$IMAGE_REPO:$tag|" "$ENV_FILE"
    else
      printf '\n# 聚蚁二开镜像(update-from-ghcr.sh 管理)\nSUB2API_IMAGE=%s:%s\n' "$IMAGE_REPO" "$tag" >> "$ENV_FILE"
    fi
    (cd "$DEPLOY_DIR" && docker compose up -d sub2api)
    echo "等待生产健康(最多 120s)..."
    for i in $(seq 1 40); do
      st=$(docker inspect sub2api --format '{{.State.Health.Status}}' 2>/dev/null || echo none)
      if [ "$st" = "healthy" ]; then
        echo "切换完成: $IMAGE_REPO:$tag (回滚位: $prev)"
        exit 0
      fi
      sleep 3
    done
    echo "警告: 健康检查超时, 排查: docker logs sub2api --tail 50 ; 回滚: $0 rollback"
    exit 1
    ;;

  rollback)
    prev=$(cat "$TOOL_DIR/previous-image" 2>/dev/null || true)
    [ -n "$prev" ] || { echo "无回滚记录"; exit 1; }
    cur="$(current_image)"
    sed -i "s|^SUB2API_IMAGE=.*|SUB2API_IMAGE=$prev|" "$ENV_FILE"
    echo "$cur" > "$TOOL_DIR/previous-image"
    (cd "$DEPLOY_DIR" && docker compose up -d sub2api)
    echo "已回滚到 $prev (再次 rollback 可切回 $cur)"
    ;;

  *)
    echo "用法: $0 status | pull <tag> | smoke <tag> | smoke-down | switch <tag> | rollback"
    exit 1
    ;;
esac
