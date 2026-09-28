#!/bin/bash
set -e

# ============================================================
# ai_worker_front 前端部署脚本
# 用法: ./deploy.sh [ssh_user]  (默认 root)
# 模式: 本地 Vite 构建 -> scp 上传 dist -> 远程 nginx reload
# ============================================================

REMOTE_IP="101.42.173.225"
SSH_USER="${1:-root}"
REMOTE_DIR="/usr/local/app/ai_worker_front"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  ai_worker_front 前端部署脚本"
echo "  服务器: ${SSH_USER}@${REMOTE_IP}"
echo "  远程目录: ${REMOTE_DIR}"
echo "=========================================="

# ----------------------------------------------------------
# 1. 本地构建 (Vite + React)
# ----------------------------------------------------------
echo ""
echo "[1/5] 本地构建前端..."
cd "${LOCAL_DIR}"
npm install --silent
npm run build
if [ ! -d "dist" ]; then
    echo "    [错误] 构建失败，dist 目录不存在"
    exit 1
fi
echo "    构建完成: dist/"

# ----------------------------------------------------------
# 2. 创建远程目录结构
# ----------------------------------------------------------
echo ""
echo "[2/5] 创建远程目录结构..."
ssh "${SSH_USER}@${REMOTE_IP}" "mkdir -p ${REMOTE_DIR}/dist"

# ----------------------------------------------------------
# 3. 上传静态文件 + nginx 配置
# ----------------------------------------------------------
echo ""
echo "[3/5] 上传静态文件..."
# 打包 dist 再上传，比 scp -r 逐文件上传快很多
cd "${LOCAL_DIR}"
tar czf /tmp/ai_worker_front_dist.tar.gz -C dist .
scp /tmp/ai_worker_front_dist.tar.gz "${SSH_USER}@${REMOTE_IP}:/tmp/ai_worker_front_dist.tar.gz"
rm -f /tmp/ai_worker_front_dist.tar.gz

# 远程解压，先清空旧文件再解压
ssh "${SSH_USER}@${REMOTE_IP}" bash <<EOF
set -e
rm -rf ${REMOTE_DIR}/dist/*
cd ${REMOTE_DIR}/dist
tar xzf /tmp/ai_worker_front_dist.tar.gz
rm -f /tmp/ai_worker_front_dist.tar.gz
echo "    静态文件已解压到 ${REMOTE_DIR}/dist"
EOF

# 上传 nginx 配置
scp nginx.conf "${SSH_USER}@${REMOTE_IP}:${REMOTE_DIR}/nginx.conf"
echo "    nginx 配置已上传"

# ----------------------------------------------------------
# 4. 安装/更新 nginx 配置并 reload
# ----------------------------------------------------------
echo ""
echo "[4/5] 配置 nginx..."
ssh "${SSH_USER}@${REMOTE_IP}" bash <<'NGINX_EOF'
set -e
REMOTE_DIR="/usr/local/app/ai_worker_front"

# 检查 nginx 是否安装
if ! command -v nginx &>/dev/null; then
    echo "    [错误] nginx 未安装，请先安装: yum install -y nginx 或 apt install -y nginx"
    exit 1
fi

# 复制配置到 nginx conf.d 目录（不覆盖主 nginx.conf，避免与其他服务冲突）
if [ -d /etc/nginx/conf.d ]; then
    cp -f ${REMOTE_DIR}/nginx.conf /etc/nginx/conf.d/ai_worker.conf
    echo "    nginx 配置已复制到 /etc/nginx/conf.d/ai_worker.conf"
else
    echo "    [警告] /etc/nginx/conf.d 不存在，请手动复制 ${REMOTE_DIR}/nginx.conf"
fi

# 测试配置
if nginx -t 2>&1; then
    echo "    nginx 配置测试通过"
else
    echo "    [错误] nginx 配置测试失败"
    exit 1
fi

# reload 或启动 nginx
if pgrep -x nginx &>/dev/null; then
    nginx -s reload
    echo "    nginx 已 reload"
else
    nginx
    echo "    nginx 已启动"
fi
NGINX_EOF

# ----------------------------------------------------------
# 5. 验证前端可访问
# ----------------------------------------------------------
echo ""
echo "[5/5] 验证前端..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${REMOTE_IP}:8094/" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
    echo "    前端可访问: http://${REMOTE_IP}:8094/ (HTTP 200)"
else
    echo "    [警告] 前端返回 HTTP ${HTTP_CODE}，可能仍在启动中"
    echo "    手动检查: curl -I http://${REMOTE_IP}:8094/"
fi

# 验证 API 代理 (使用公开的 health 端点，agents 端点需要 access code)
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${REMOTE_IP}:8094/api/v1/health" 2>/dev/null || echo "000")
if [[ "$API_CODE" == "200" ]]; then
    echo "    API 代理正常: http://${REMOTE_IP}:8094/api/v1/health (HTTP 200)"
else
    echo "    [警告] API 代理返回 HTTP ${API_CODE}，请确认后端 ai_worker 已部署并运行在 8083"
fi

echo ""
echo "=========================================="
echo "  ai_worker_front 前端部署完成!"
echo "  访问地址: http://${REMOTE_IP}:8094/"
echo "  API 代理: http://${REMOTE_IP}:8094/api/v1/* -> 127.0.0.1:8083"
echo "  静态文件: ${REMOTE_DIR}/dist"
echo "  nginx 配置: /etc/nginx/conf.d/ai_worker.conf (端口 8094)"
echo "=========================================="
