#!/bin/bash

# 福利助手安装脚本 - Linux/Mac版本

echo "========================================"
echo "  福利助手 - 合规福利获取浏览器扩展"
echo "  安装程序 v0.1.0"
echo "========================================"
echo ""

# 检查Python环境
echo "[1/5] 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未检测到Python3环境，请先安装Python 3.10+"
    exit 1
fi
echo "✅ Python环境检查通过"

# 检查pip
echo ""
echo "[2/5] 检查pip环境..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ 未检测到pip3，请检查Python安装"
    exit 1
fi
echo "✅ pip环境检查通过"

# 检查pip3
PIP_CMD=$(command -v pip3 || command -v pip)
echo "使用pip命令: $PIP_CMD"

# 创建虚拟环境
echo ""
echo "[3/5] 创建Python虚拟环境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ 虚拟环境创建成功"
else
    echo "ℹ️  虚拟环境已存在，跳过创建"
fi

# 激活虚拟环境并安装依赖
echo ""
echo "[4/5] 安装Python依赖包..."
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ 依赖包安装失败"
    exit 1
fi
echo "✅ 依赖包安装完成"

# 初始化数据库
echo ""
echo "[5/5] 初始化数据库..."
mkdir -p database
python3 << EOF
import sqlite3
import os

db_path = 'database/welfare_helper.db'
schema_path = 'database/schema.sql'

if os.path.exists(schema_path):
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn = sqlite3.connect(db_path)
        conn.executescript(f.read())
        conn.commit()
        conn.close()
    print("✅ 数据库初始化完成")
else:
    print("⚠️  数据库schema文件不存在，跳过初始化")
EOF

if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi

# 安装系统服务
echo ""
echo "========================================"
echo " 安装系统服务"
echo "========================================"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux系统
    read -p "是否安装为系统服务（开机自动启动）？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在创建systemd服务..."
        cat > /tmp/welfare-helper.service << EOF
[Unit]
Description=Welfare Helper Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/python $(pwd)/python-backend/main.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo cp /tmp/welfare-helper.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable welfare-helper
        echo "✅ 系统服务安装完成"
        echo "启动服务: sudo systemctl start welfare-helper"
        echo "停止服务: sudo systemctl stop welfare-helper"
    else
        echo "⏭️  跳过系统服务安装"
    fi

elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS系统
    read -p "是否创建启动代理（开机自动启动）？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在创建LaunchAgent..."
        PLIST_PATH="$HOME/Library/LaunchAgents/com.welfarehelper.plist"
        
        cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.welfarehelper</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(pwd)/venv/bin/python</string>
        <string>$(pwd)/python-backend/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
        
        launchctl load "$PLIST_PATH"
        echo "✅ 启动代理创建完成"
        echo "启动服务: launchctl start com.welfarehelper"
        echo "停止服务: launchctl stop com.welfarehelper"
    else
        echo "⏭️  跳过启动代理创建"
    fi
fi

# 浏览器扩展安装指导
echo ""
echo "========================================"
echo " 浏览器扩展安装"
echo "========================================"
echo "请按照以下步骤安装浏览器扩展："
echo ""
echo "1. 打开Chrome/Edge浏览器"
echo "2. 访问：chrome://extensions/"
echo "3. 启用"开发者模式""
echo "4. 点击"加载已解压的扩展程序""
echo "5. 选择本目录的 browser-extension 文件夹"
echo ""
echo "安装完成后，浏览器地址栏会显示福利助手图标"
echo ""

# 创建桌面快捷方式
echo "创建桌面快捷方式..."
SHORTCUT_FILE="$HOME/Desktop/WelfareHelper.desktop"
cat > "$SHORTCUT_FILE" << EOF
[Desktop Entry]
Name=福利助手
Comment=Welfare Helper - 合规福利获取助手
Exec=$(pwd)/venv/bin/python $(pwd)/python-backend/main.py
Icon=$(pwd)/browser-extension/icons/icon48.png
Terminal=true
Type=Application
StartupNotify=true
Categories=Utility;Application;
EOF

chmod +x "$SHORTCUT_FILE"
echo "✅ 桌面快捷方式创建完成"

# 安装完成
echo ""
echo "========================================"
echo "  🎉 安装完成！"
echo "========================================"
echo ""
echo "后端服务操作说明："
echo "  - 启动服务：     python3 python-backend/main.py"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "  - 或使用服务：  sudo systemctl start welfare-helper"
    echo "  - 停止服务：     sudo systemctl stop welfare-helper"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  - 或使用代理：  launchctl start com.welfarehelper"
    echo "  - 停止代理：     launchctl stop com.welfarehelper"
fi
echo ""
echo "配置文件位置："
echo "  - 用户配置：        database/welfare_helper.db"
echo "  - 浏览器扩展配置：  browser-extension/popup/"
echo ""
echo "文档位置："
echo "  - 用户指南：        docs/USER_GUIDE.md"
echo "  - 常见问题：        docs/FAQ.md"
echo ""
read -p "是否立即启动后端服务？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "启动后端服务..."
    source venv/bin/activate
    python3 python-backend/main.py &
    echo "✅ 后端服务已启动"
    echo "请确保浏览器扩展已正确安装"
else
    echo "跳过启动服务"
fi

echo ""
echo "感谢使用福利助手！"
echo ""