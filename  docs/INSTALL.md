# 福利助手 - 快速安装指南

## 📦 安装前准备

### 系统要求
- **操作系统**: Windows 10+, macOS 10.14+, 或主流Linux发行版
- **Python版本**: Python 3.10 或更高版本
- **浏览器**: Chrome 88+, Edge 88+, 或任何基于Chromium的浏览器

### 检查Python环境
Windows用户：
```cmd
python --version
```
或
```cmd
python3 --version
```

如果没有安装Python，请从 https://python.org/downloads/ 下载并安装。

## 🚀 安装步骤

### Windows系统

1. **下载项目**
   ```cmd
   git clone https://github.com/happyallday/getMoney_from_Web.git
   cd getMoney_from_Web
   ```

2. **运行安装脚本**
   ```cmd
   install.bat
   ```

3. **按提示完成安装**
   安装脚本会自动：
   - 检查Python环境
   - 创建虚拟环境
   - 安装依赖包
   - 初始化数据库
   - 创建桌面快捷方式

4. **安装浏览器扩展**
   - 打开Chrome/Edge浏览器
   - 访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目目录中的 `browser-extension` 文件夹

### macOS/Linux系统

1. **下载项目**
   ```bash
   git clone https://github.com/happyallday/getMoney_from_Web.git
   cd getMoney_from_Web
   ```

2. **运行安装脚本**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **按提示完成安装**

4. **安装浏览器扩展**
   - 打开Chrome/Edge浏览器
   - 访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目目录中的 `browser-extension` 文件夹

## 🔧 手动安装（如果自动安装失败）

### 1. 创建Python虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 2. 安装依赖
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 初始化数据库
```bash
python -c "import sqlite3; conn = sqlite3.connect('database/welfare_helper.db'); conn.executescript(open('database/schema.sql', 'r', encoding='utf-8').read()); conn.commit(); conn.close()"
```

### 4. 启动后端服务
```bash
python python-backend/main.py
```

### 5. 安装浏览器扩展
按照上述浏览器扩展安装步骤操作。

## 🎯 首次使用

### 1. 启动服务
**Windows**:
- 双击桌面快捷方式
- 或运行: `python python-backend/main.py`

**macOS/Linux**:
```bash
source venv/bin/activate
python python-backend/main.py
```

### 2. 配置扩展
- 点击浏览器工具栏的福利助手图标
- 进入设置页面
- 启用需要的平台
- 填写用户信息

### 3. 开始使用
- 访问支持的平台页面
- 扩展会自动检测福利活动
- 点击助手按钮完成操作

## 🛠️ 配置系统服务

### Windows系统
```cmd
python python-backend/service_manager.py install
net start WelfareHelper
```

### Linux系统 (systemd)
```bash
sudo systemctl start welfare-helper
sudo systemctl enable welfare-helper
```

### macOS系统 (LaunchAgent)
```bash
launchctl start com.welfarehelper
```

## 📱 卸载

### Windows系统
运行 `uninstall.bat`

### macOS/Linux系统
```bash
chmod +x uninstall.sh
./uninstall.sh
```

### 手动卸载
1. 停止后端服务
2. 删除项目目录
3. 在浏览器扩展管理页面移除扩展
4. 删除虚拟环境文件夹

## 🐛 常见问题

### 1. Python找不到
确保Python已正确安装并在PATH中。

### 2. 浏览器扩展加载失败
- 检查扩展文件路径是否正确
- 确保已启用开发者模式
- 查看浏览器开发者工具的错误信息

### 3. 后端服务无法启动
- 检查端口5000是否被占用
- 查看日志文件 `welfare_helper.log`
- 确认所有依赖已正确安装

### 4. 扩展无法连接到后端
- 确认后端服务正在运行
- 检查防火墙设置
- 确认API地址配置正确

## 📞 获取帮助

如果遇到问题：
1. 查看 [FAQ文档](FAQ.md)
2. 检查 GitHub Issues
3. 提交新的 Issue

## 🔒 安全提示

- 所有用户数据都经过加密存储
- 仅支持本地化和合规操作
- 不上传任何用户隐私数据
- 遵守平台服务条款

## 📝 许可证

本项目仅供个人学习和研究使用。

---

**安装完成后，享受合规高效的服务！**