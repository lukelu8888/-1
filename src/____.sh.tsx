#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo "===================================="
echo "   福建高盛达富建材 - B2B外贸系统"
echo "===================================="
echo ""
echo "正在检查环境..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null
then
    echo -e "${RED}❌ 错误：未检测到Node.js${NC}"
    echo ""
    echo "请先安装Node.js："
    echo "1. 访问 https://nodejs.org/"
    echo "2. 下载macOS安装包"
    echo "3. 安装后重新运行此脚本"
    echo ""
    echo "或使用Homebrew安装："
    echo "   brew install node"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

echo -e "${GREEN}✅ Node.js版本：${NC}"
node -v
echo ""

# 检查npm
if ! command -v npm &> /dev/null
then
    echo -e "${RED}❌ 错误：npm未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm版本：${NC}"
npm -v
echo ""

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 首次运行，正在安装依赖...${NC}"
    echo "这可能需要几分钟，请耐心等待..."
    echo ""
    npm install
    
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ 依赖安装失败${NC}"
        echo ""
        echo "尝试切换到国内镜像源："
        npm config set registry https://registry.npmmirror.com
        echo "再次安装..."
        npm install
    fi
fi

echo ""
echo "===================================="
echo "   正在启动网站..."
echo "===================================="
echo ""
echo -e "${BLUE}启动成功后，浏览器访问：${NC}"
echo ""
echo -e "   ${GREEN}👉 http://localhost:5173${NC}"
echo ""
echo "提示："
echo "- 不要关闭此窗口，关闭后网站会停止"
echo "- 按 Ctrl+C 可以停止网站"
echo ""
echo "===================================="
echo ""

# 启动开发服务器
npm run dev
