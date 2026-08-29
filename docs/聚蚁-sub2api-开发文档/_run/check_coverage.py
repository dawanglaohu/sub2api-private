#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查整个 Git 仓库是否都能映射到知识库模块。

该脚本只给每个 tracked file 指定一个“主要维护模块”。跨模块关系仍由
第 06/17 节和任务笔记表达；这里的目标是让新增目录或新业务域无法静默游离在知识库之外。

用法：
    python3 docs/聚蚁-sub2api-开发文档/_run/check_coverage.py --root .
    python3 docs/聚蚁-sub2api-开发文档/_run/check_coverage.py --root . --check
"""

import argparse
import collections
import os
import re
import subprocess
import sys
from pathlib import Path

VAULT_DIRNAME = "聚蚁-sub2api-开发文档"
MODULE_SOURCE = Path("02-设计") / "06-系统架构与模块划分.md"
MATRIX_SOURCE = Path("05-附录") / "21-整仓覆盖矩阵.md"


def starts(stem, names):
    return any(stem == name or stem.startswith(name + "_") for name in names)


def is_test_or_fixture(path):
    name = path.rsplit("/", 1)[-1]
    return (
        name.endswith("_test.go")
        or name.endswith(".spec.ts")
        or name.endswith(".test.ts")
        or "/__tests__/" in path
        or "/testdata/" in path
        or path.startswith("deploy/tests/")
        or path.startswith("frontend/audit.json")
        or path.startswith("backend/internal/integration/")
        or path.startswith("backend/internal/testutil/")
    )


def classify_service(path):
    stem = Path(path).stem
    if starts(stem, {"plugin"}):
        return "M9"
    if starts(stem, {"batch_image", "image_task", "image_storage"}):
        return "M7"
    if starts(stem, {"ops", "channel_monitor", "content_moderation", "audit_log", "security_audit"}):
        return "M8"
    if starts(stem, {
        "payment", "usage", "subscription", "billing", "pricing", "profit",
        "balance", "custom_group_usage", "affiliate_rebate", "custom_channel_time_pricing",
        "image_billing", "image_output_accounting", "model_pricing", "service_tier_billing",
    }):
        return "M6"
    if starts(stem, {
        "auth", "api_key", "passkey", "totp", "registration", "refresh_token",
        "ratelimit", "invalid_auth", "identity", "user_profile_identity",
        "auth_cache", "pending_identity", "aliyun_captcha", "tencent_captcha",
        "turnstile", "oauth", "oauth_refresh",
    }):
        return "M3"
    if starts(stem, {
        "account", "group", "scheduler", "composite", "session", "quota",
        "rpm", "temp_unsched", "shadow", "credential", "credentials",
        "concurrency", "refresh_policy", "model_rate_limit",
    }):
        return "M4"
    if starts(stem, {
        "openai", "openai_gateway", "gateway", "grok", "gemini", "geminicli",
        "antigravity", "anthropic", "bedrock", "claude", "cn", "upstream",
        "websearch", "video", "media", "ollama", "vertex", "thinking",
        "token", "http", "sse", "request", "response", "parse", "metadata",
        "header", "digest", "crs", "internal500", "codex_image_generation_bridge",
        "image_generation_intent", "model_not_found_error", "models_list_response_limit",
    }):
        return "M5"
    if starts(stem, {
        "setting", "settings", "announcement", "proxy", "redeem", "promo",
        "affiliate", "backup", "data_management", "scheduled_test",
        "error_passthrough", "tls_fingerprint", "channel", "model_plaza",
        "user_attribute", "notification", "notify_email", "email", "system",
        "update", "custom_page", "deferred", "leader", "slice", "sql",
    }):
        return "M14"
    if starts(stem, {"admin", "user", "dashboard"}):
        return "M11"
    if starts(stem, {"domain_constants", "idempotency", "wire", "timing_wheel"}):
        return "M1"
    return None


def classify_handler(path):
    stem = Path(path).stem
    is_admin = path.startswith("backend/internal/handler/admin/")
    if is_admin:
        if starts(stem, {"plugin"}):
            return "M9"
        if starts(stem, {"ops", "channel_monitor", "content_moderation", "audit_log"}):
            return "M8"
        if starts(stem, {"payment", "usage", "subscription"}):
            return "M6"
        if starts(stem, {"apikey", "user_handler"}):
            return "M3"
        if starts(stem, {"account", "group", "openai_oauth", "gemini_oauth", "grok", "antigravity_oauth", "cn_provider"}):
            return "M4"
        if starts(stem, {"dashboard"}):
            return "M11"
        if starts(stem, {
            "affiliate", "announcement", "backup", "channel", "compliance",
            "data_management", "error_passthrough", "id_list", "idempotency",
            "promo", "proxy", "redeem", "scheduled_test", "setting_handler",
            "snapshot_cache", "system", "tls_fingerprint", "user_attribute",
        }):
            return "M14"
        return None
    if starts(stem, {"plugin"}):
        return "M9"
    if starts(stem, {"batch_image", "async_image"}):
        return "M7"
    if starts(stem, {"ops", "channel_monitor", "content_moderation", "security_audit", "audit_log"}):
        return "M8"
    if starts(stem, {"payment", "payment_webhook", "usage", "subscription"}):
        return "M6"
    if starts(stem, {"auth", "api_key", "passkey", "totp", "user_handler"}):
        return "M3"
    if starts(stem, {"account", "group"}):
        return "M4"
    if starts(stem, {
        "gateway", "gateway_handler", "openai", "openai_gateway", "grok",
        "gemini", "endpoint", "failover", "composite", "stream", "request",
        "image", "logging", "concurrency", "no_account", "user_msg_queue",
    }):
        return "M5"
    if starts(stem, {
        "announcement", "available_channel", "redeem", "setting_handler", "page",
        "affiliate", "backup", "channel", "cn_provider", "compliance",
        "data_management", "error_passthrough", "model_plaza", "promo", "proxy",
        "scheduled_test", "system", "tls_fingerprint", "user_attribute",
    }):
        return "M14"
    if starts(stem, {"handler", "idempotency", "wire"}):
        return "M1"
    return None


def classify_backend(path):
    if is_test_or_fixture(path):
        return "M15"
    if path.startswith("backend/ent/") or path.startswith("backend/migrations/"):
        return "M2"
    if path.startswith("backend/internal/repository/"):
        return "M2"
    if path.startswith("backend/internal/domain/") or path.startswith("backend/internal/model/"):
        return "M2"
    if path.startswith("backend/cmd/server/"):
        return "M1"
    if path.startswith("backend/cmd/cleanup-ingress-reject-logs/"):
        return "M8"
    if path.startswith("backend/cmd/profit-preview/"):
        return "M6"
    if path.startswith("backend/cmd/jwtgen/"):
        return "M3"
    if path.startswith("backend/resources/model-pricing/"):
        return "M6"
    if path == "backend/scripts/resolve-version.sh":
        return "M13"
    if path.startswith("backend/scripts/"):
        return "M8"
    if path.startswith("backend/pkg/pluginapi/"):
        return "M9"
    if path.startswith("backend/internal/securityaudit/"):
        return "M8"
    if path.startswith("backend/internal/payment/"):
        return "M6"
    if path.startswith("backend/internal/platform/"):
        return "M5"
    if path.startswith("backend/internal/middleware/"):
        return "M3"
    if path.startswith("backend/internal/config/") or path.startswith("backend/internal/setup/"):
        return "M1"
    if path.startswith("backend/internal/server/") or path.startswith("backend/internal/web/"):
        return "M1"
    if path.startswith("backend/internal/util/"):
        return "M1"
    if path.startswith("backend/internal/pkg/"):
        parts = path.split("/")
        domain = parts[3] if len(parts) > 3 else ""
        if domain in {"anthropicfp", "antigravity", "apicompat", "claude", "gemini", "geminicli", "googleapi", "openai", "openai_compat", "websearch", "xai"}:
            return "M5"
        if domain in {"ip", "oauth", "redissession", "tlsfingerprint"}:
            return "M3"
        if domain == "usagestats":
            return "M6"
        if domain in {"ctxkey", "errors", "httpclient", "httputil", "logger", "pagination", "proxyurl", "proxyutil", "response", "servertiming", "sysutil", "timezone"}:
            return "M1"
        return None
    if path.startswith("backend/internal/service/openai_ws_v2/") or path.startswith("backend/internal/service/prompts/"):
        return "M5"
    if path.startswith("backend/internal/service/"):
        return classify_service(path)
    if path.startswith("backend/internal/handler/dto/"):
        return "M1"
    if path.startswith("backend/internal/handler/quotaview/"):
        return "M4"
    if path.startswith("backend/internal/handler/"):
        return classify_handler(path)
    if path in {"backend/Dockerfile", "backend/Makefile", "backend/.dockerignore"}:
        return "M13"
    if path in {"backend/go.mod", "backend/go.sum", "backend/.golangci.yml"}:
        return "M15"
    return None


def classify_frontend(path):
    if is_test_or_fixture(path):
        return "M15"
    if path in {
        "frontend/package.json", "frontend/pnpm-lock.yaml", "frontend/tsconfig.json",
        "frontend/tsconfig.node.json", "frontend/vite.config.ts", "frontend/vitest.config.ts",
        "frontend/tailwind.config.js", "frontend/postcss.config.js", "frontend/.eslintrc.cjs",
        "frontend/.eslintignore", "frontend/.npmrc",
    }:
        return "M15"
    brand_prefixes = (
        "frontend/src/components/juyi/", "frontend/src/components/brand/",
        "frontend/src/components/home/", "frontend/src/views/home/",
        "frontend/src/assets/fonts/", "frontend/src/i18n/locales/zh/juyi.ts",
        "frontend/src/i18n/locales/en/juyi.ts", "frontend/src/styles/juyi.css",
        "frontend/public/",
    )
    if path.startswith(brand_prefixes):
        return "M12"
    if path.startswith("frontend/src/features/"):
        return "M8"
    shell_prefixes = (
        "frontend/src/api/client.ts", "frontend/src/api/tokenRefresh.ts",
        "frontend/src/stores/", "frontend/src/router/", "frontend/src/utils/",
        "frontend/src/types/", "frontend/src/constants/", "frontend/src/composables/",
        "frontend/src/directives/", "frontend/src/i18n/", "frontend/src/assets/",
        "frontend/src/styles/", "frontend/src/App.vue", "frontend/src/main.ts",
        "frontend/src/style.css", "frontend/src/vite-env.d.ts", "frontend/index.html",
    )
    if path.startswith(shell_prefixes):
        return "M10"
    if path.startswith(("frontend/src/views/", "frontend/src/components/", "frontend/src/api/")):
        return "M11"
    return None


def classify_doc(path):
    if path.startswith("docs/" + VAULT_DIRNAME + "/"):
        return "VAULT"
    if path.startswith("docs/PAYMENT") or path == "docs/ADMIN_PAYMENT_INTEGRATION_API.md":
        return "M6"
    if path in {"docs/ASYNC_IMAGE_TASKS.md", "docs/BATCH_IMAGE_MVP.md"}:
        return "M7"
    if path == "docs/COMPOSITE_GROUPS.md":
        return "M4"
    if path == "docs/PLUGIN_DEVELOPMENT.md":
        return "M9"
    if path == "docs/channel-monitor-v2-safe-defaults.md":
        return "M8"
    if path.startswith("docs/legal/"):
        return "M14"
    return None


def classify(path):
    if path.startswith("docs/"):
        return classify_doc(path)
    if is_test_or_fixture(path):
        return "M15"
    if path.startswith("backend/"):
        return classify_backend(path)
    if path.startswith("frontend/"):
        return classify_frontend(path)
    if path.startswith("deploy/"):
        return "M15" if path.startswith("deploy/tests/") else "M13"
    if path.startswith(".github/workflows/"):
        return "M13"
    if path == ".github/audit-exceptions.yml":
        return "M15"
    if path.startswith("openspec/changes/add-openai-compatible-prompt-audit/"):
        return "M8"
    if path == "openspec/config.yaml":
        return "M15"
    if path.startswith("skills/sub2api-admin/"):
        return "M14"
    if path.startswith("tools/") or path.startswith("assets/"):
        return "M15"
    if path in {"Dockerfile", "Dockerfile.goreleaser", "Makefile", ".dockerignore", ".goreleaser.yaml", ".goreleaser.simple.yaml"}:
        return "M13"
    if path in {".gitattributes", ".gitignore", "CLA.md", "CLAUDE.md", "DEV_GUIDE.md", "LICENSE", "README.md", "README_CN.md", "README_JA.md"}:
        return "M15"
    return None


def module_ids(vault):
    text = (vault / MODULE_SOURCE).read_text(encoding="utf-8")
    return set(re.findall(r"^\|\s*(M\d{1,2})\s*\|", text, re.M))


def matrix_counts(vault):
    text = (vault / MATRIX_SOURCE).read_text(encoding="utf-8")
    return {
        mid: int(count.replace(",", ""))
        for mid, count in re.findall(r"^\|\s*(M\d{1,2})\s*\|\s*([\d,]+)\s*\|", text, re.M)
    }


def tracked_files(root):
    result = subprocess.run(
        # core.quotepath=false: keep non-ASCII paths as raw UTF-8 instead of
        # quoted octal escapes, so the vault-dir prefix match below works.
        ["git", "-C", str(root), "-c", "core.quotepath=false", "ls-files"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
    )
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=None, help="项目根目录；默认从脚本位置推导")
    parser.add_argument("--check", action="store_true", help="有未归属文件时返回 1")
    args = parser.parse_args()

    vault = Path(__file__).resolve().parent.parent
    root = Path(args.root).resolve() if args.root else vault.parent.parent
    files = tracked_files(root)
    known_modules = module_ids(vault)
    documented_counts = matrix_counts(vault)
    assignments = collections.defaultdict(list)
    unknown = []
    invalid_modules = []

    for path in files:
        owner = classify(path)
        if owner == "VAULT":
            continue
        if owner is None:
            unknown.append(path)
            continue
        if owner not in known_modules:
            invalid_modules.append((path, owner))
            continue
        assignments[owner].append(path)

    checked = sum(len(v) for v in assignments.values())
    print("整仓覆盖校验")
    print("  tracked files: %d" % len(files))
    print("  vault 自身文件: %d" % sum(1 for p in files if classify(p) == "VAULT"))
    print("  已归属文件: %d" % checked)
    for mid in sorted(assignments, key=lambda x: int(x[1:])):
        print("  %s: %d" % (mid, len(assignments[mid])))

    if invalid_modules:
        print("\n引用了未定义模块：")
        for path, owner in invalid_modules:
            print("  - %s -> %s" % (path, owner))
    if unknown:
        print("\n未归属文件：")
        for path in unknown:
            print("  - " + path)

    count_mismatches = []
    for mid in sorted(known_modules, key=lambda x: int(x[1:])):
        actual = len(assignments.get(mid, []))
        documented = documented_counts.get(mid)
        if documented != actual:
            count_mismatches.append((mid, documented, actual))
    if count_mismatches:
        print("\n第 21 节覆盖矩阵数量已过期：")
        for mid, documented, actual in count_mismatches:
            print("  - %s: 文档=%s 实际=%d" % (mid, documented, actual))

    problems = len(invalid_modules) + len(unknown) + len(count_mismatches)
    if problems:
        print("\n发现 %d 个覆盖问题" % problems)
        return 1 if args.check else 0
    print("  未归属文件: 0")
    print("  覆盖检查通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
