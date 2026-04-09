#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
福利助手 - 主程序入口
"""

import os
import sys
import logging
from flask import Flask
from flask_cors import CORS

# 设置环境变量
os.environ['PYTHONIOENCODING'] = 'utf-8'

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Database
from api import api_blueprint
from scheduler import WelfareScheduler

def setup_logging():
    """设置日志系统"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('welfare_helper.log', encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
    
    # 启用CORS
    CORS(app)
    
    # 注册蓝图
    app.register_blueprint(api_blueprint, url_prefix='/api')
    
    return app

def main():
    """主函数"""
    try:
        # 设置日志
        setup_logging()
        logger = logging.getLogger(__name__)
        
        logger.info("=" * 50)
        logger.info("福利助手启动中...")
        logger.info("=" * 50)
        
        # 初始化数据库
        logger.info("正在初始化数据库...")
        db = Database()
        db.initialize()
        logger.info("数据库初始化完成")
        
        # 创建Flask应用
        logger.info("正在创建Web应用...")
        app = create_app()
        
        # 启动调度器
        logger.info("正在启动任务调度器...")
        scheduler = WelfareScheduler()
        scheduler.start()
        logger.info("任务调度器启动完成")
        
        # 启动Web服务器
        logger.info("正在启动Web服务器...")
        logger.info("服务地址: http://127.0.0.1:5000")
        logger.info("=" * 50)
        
        # 运行Flask应用
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False
        )
        
    except KeyboardInterrupt:
        logger.info("接收到停止信号，正在关闭服务...")
        scheduler.stop()
        logger.info("福利助手已停止")
    except Exception as e:
        logger.error(f"启动失败: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()