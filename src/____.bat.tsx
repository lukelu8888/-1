@echo off
chcp 65001 >nul
echo ====================================
echo    福建高盛达富建材 - B2B外贸系统
echo ====================================
echo.
echo 正在检查环境...
echo.

:: 检查Node.js是否安装
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js
    echo.
    echo 请先安装Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载LTS版本
    echo 3. 安装后重启电脑
    echo 4. 再次运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js版本：
node -v
echo.

:: 检查node_modules是否存在
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    echo 这可能需要几分钟，请耐心等待...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败
        echo.
        echo 尝试切换到国内镜像源：
        npm config set registry https://registry.npmmirror.com
        echo 再次安装...
        npm install
    )
)

echo.
echo ====================================
echo    正在启动网站...
echo ====================================
echo.
echo 启动成功后，浏览器访问：
echo.
echo    👉 http://localhost:5173
echo.
echo 提示：
echo - 不要关闭此窗口，关闭后网站会停止
echo - 按 Ctrl+C 可以停止网站
echo.
echo ====================================
echo.

:: 启动开发服务器
npm run dev

pause
