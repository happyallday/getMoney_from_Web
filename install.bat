@echo off
chcp 65001 >nul
echo ========================================
echo   福利助手 - 合规福利获取浏览器扩展
echo   安装程序 v0.1.0
echo ========================================
echo.

:: 检查Python环境
echo [1/5] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Python环境，请先安装Python 3.10+
    pause
    exit /b 1
)
echo ✅ Python环境检查通过

:: 检查pip
echo.
echo [2/5] 检查pip环境...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到pip，请检查Python安装
    pause
    exit /b 1
)
echo ✅ pip环境检查通过

:: 创建虚拟环境
echo.
echo [3/5] 创建Python虚拟环境...
if not exist venv (
    python -m venv venv
    echo ✅ 虚拟环境创建成功
) else (
    echo ℹ️  虚拟环境已存在，跳过创建
)

:: 激活虚拟环境并安装依赖
echo.
echo [4/5] 安装Python依赖包...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ 依赖包安装失败
    pause
    exit /b 1
)
echo ✅ 依赖包安装完成

:: 初始化数据库
echo.
echo [5/5] 初始化数据库...
python -c "import sqlite3; conn = sqlite3.connect('database/welfare_helper.db'); conn.executescript(open('database/schema.sql', 'r', encoding='utf-8').read()); conn.commit(); conn.close()"
if errorlevel 1 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo ✅ 数据库初始化完成

:: 安装系统服务
echo.
echo ========================================
echo  安装系统服务
echo ========================================
choice /C YN /M "是否安装为系统服务（开机自动启动）？"
if errorlevel 2 goto :skip_service
if errorlevel 1 goto :install_service

:install_service
echo 正在安装系统服务...
python python-backend/service_manager.py install
if errorlevel 1 (
    echo ❌ 系统服务安装失败，可以手动运行后端服务
) else (
    echo ✅ 系统服务安装成功
    echo 上次启动服务: net start WelfareHelper
)
goto :service_done

:skip_service
echo ⏭️  跳过系统服务安装

:service_done

:: 浏览器扩展安装指导
echo.
echo ========================================
echo  浏览器扩展安装
echo ========================================
echo 请按照以下步骤安装浏览器扩展：
echo.
echo 1. 打开Chrome/Edge浏览器
echo 2. 访问：chrome://extensions/
echo 3. 启用"开发者模式"
echo 4. 点击"加载已解压的扩展程序"
echo 5. 选择本目录的 browser-extension 文件夹
echo.
echo 安装完成后，浏览器地址栏会显示福利助手图标
echo.

:: 创建桌面快捷方式
echo 创建桌面快捷方式...
set "shortcut_target=%CD%\browser-extension"
set "shortcut_name=福利助手"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\%shortcut_name%.url');$s.TargetPath='%CD%';$s.Save()"
echo ✅ 桌面快捷方式创建完成

:: 安装完成
echo.
echo ========================================
echo  🎉 安装完成！
echo ========================================
echo.
echo 后端服务操作说明：
echo   - 启动服务：         python python-backend/main.py
echo   - 或使用服务：      net start WelfareHelper
echo   - 停止服务：         net stop WelfareHelper
echo.
echo 配置文件位置：
echo   - 用户配置：        database/welfare_helper.db
echo   - 浏览器扩展配置：  browser-extension/popup/
echo.
echo 文档位置：
echo   - 用户指南：        docs/USER_GUIDE.md
echo   - 常见问题：        docs/FAQ.md
echo.
echo ========================================
echo.

choice /C YN /M "是否立即启动后端服务？"
if errorlevel 2 goto :end
if errorlevel 1 goto :start_service

:start_service
echo 启动后端服务...
start python python-backend/main.py
echo ✅ 后端服务已启动
echo 请确保浏览器扩展已正确安装
echo.

:end
echo 感谢使用福利助手！
echo.
pause