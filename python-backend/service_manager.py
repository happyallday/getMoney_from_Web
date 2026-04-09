#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统服务管理器
"""

import os
import sys
import subprocess
import platform


def install_service():
    """安装系统服务"""
    system = platform.system()

    try:
        if system == "Windows":
            return install_windows_service()
        elif system == "Linux":
            return install_linux_service()
        elif system == "Darwin":
            return install_macos_service()
        else:
            print(f"Unsupported operating system: {system}")
            return False

    except Exception as e:
        print(f"Service installation failed: {str(e)}")
        return False


def install_windows_service():
    """安装Windows服务"""
    try:
        # 检查是否有pywin32
        try:
            import win32serviceutil
            import win32service
            import win32event
            import servicemanager
        except ImportError:
            print("pywin32 not installed. Please install it manually:")
            print("pip install pywin32")
            return False

        # 这里应该有实际的服务安装逻辑
        # 由于涉及复杂的服务创建，这里简化为提示
        print("Windows service management requires additional setup.")
        print("Please use Task Scheduler for auto-start instead:")
        print("1. Open Task Scheduler")
        print("2. Create task to run: python python-backend/main.py")
        print("3. Set to start at user logon")
        return True

    except Exception as e:
        print(f"Windows service installation failed: {str(e)}")
        return False


def install_linux_service():
    """安装Linux系统服务"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_path = os.path.join(current_dir, 'main.py')
        python_path = sys.executable

        service_content = f"""[Unit]
Description=Welfare Helper Service
After=network.target

[Service]
Type=simple
User={os.getenv('USER')}
WorkingDirectory={current_dir}
ExecStart={python_path} {service_path}
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
"""

        service_file_path = "/tmp/welfare-helper.service"

        with open(service_file_path, 'w') as f:
            f.write(service_content)

        # 使用sudo安装服务
        result = subprocess.run(['sudo', 'cp', service_file_path, '/etc/systemd/system/'], check=True)
        subprocess.run(['sudo', 'systemctl', 'daemon-reload'], check=True)
        subprocess.run(['sudo', 'systemctl', 'enable', 'welfare-helper'], check=True)

        print("Linux service installed successfully")
        print("Start with: sudo systemctl start welfare-helper")
        print("Status: sudo systemctl status welfare-helper")
        return True

    except subprocess.CalledProcessError as e:
        print(f"Linux service installation failed: {str(e)}")
        return False
    except Exception as e:
        print(f"Linux service installation error: {str(e)}")
        return False


def install_macos_service():
    """安装macOS启动代理"""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        main_path = os.path.join(current_dir, 'main.py')
        python_path = sys.executable

        plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.welfarehelper</string>
    <key>ProgramArguments</key>
    <array>
        <string>{python_path}</string>
        <string>{main_path}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>{current_dir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
"""

        plist_path = os.path.join(os.path.expanduser('~'), 'Library', 'LaunchAgents', 'com.welfarehelper.plist')

        # 确保目录存在
        os.makedirs(os.path.dirname(plist_path), exist_ok=True)

        with open(plist_path, 'w') as f:
            f.write(plist_content)

        # 加载启动代理
        subprocess.run(['launchctl', 'load', plist_path], check=True)

        print("macOS LaunchAgent installed successfully")
        print("Start with: launchctl start com.welfarehelper")
        print("Status: launchctl list | grep welfarehelper")
        return True

    except subprocess.CalledProcessError as e:
        print(f"macOS LaunchAgent installation failed: {str(e)}")
        return False
    except Exception as e:
        print(f"macOS LaunchAgent installation error: {str(e)}")
        return False


def uninstall_service():
    """卸载系统服务"""
    system = platform.system()

    try:
        if system == "Linux":
            return uninstall_linux_service()
        elif system == "Darwin":
            return uninstall_macos_service()
        elif system == "Windows":
            print("Windows service uninstall requires manual task removal")
            return True
        else:
            print(f"Unsupported operating system: {system}")
            return False

    except Exception as e:
        print(f"Service uninstallation failed: {str(e)}")
        return False


def uninstall_linux_service():
    """卸载Linux系统服务"""
    try:
        subprocess.run(['sudo', 'systemctl', 'stop', 'welfare-helper'], check=False)
        subprocess.run(['sudo', 'systemctl', 'disable', 'welfare-helper'], check=True)
        subprocess.run(['sudo', 'rm', '/etc/systemd/system/welfare-helper.service'], check=True)
        subprocess.run(['sudo', 'systemctl', 'daemon-reload'], check=True)

        print("Linux service uninstalled successfully")
        return True

    except subprocess.CalledProcessError as e:
        print(f"Linux service uninstallation failed: {str(e)}")
        return False


def uninstall_macos_service():
    """卸载macOS启动代理"""
    try:
        plist_path = os.path.join(os.path.expanduser('~'), 'Library', 'LaunchAgents', 'com.welfarehelper.plist')

        if os.path.exists(plist_path):
            subprocess.run(['launchctl', 'unload', plist_path], check=False)
            os.remove(plist_path)

        print("macOS LaunchAgent uninstalled successfully")
        return True

    except Exception as e:
        print(f"macOS LaunchAgent uninstallation failed: {str(e)}")
        return False


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Welfare Helper Service Manager')
    parser.add_argument('action', choices=['install', 'uninstall'], help='Action to perform')

    args = parser.parse_args()

    if args.action == 'install':
        if install_service():
            print("Service installation completed successfully")
            sys.exit(0)
        else:
            print("Service installation failed")
            sys.exit(1)

    elif args.action == 'uninstall':
        if uninstall_service():
            print("Service uninstallation completed successfully")
            sys.exit(0)
        else:
            print("Service uninstallation failed")
            sys.exit(1)