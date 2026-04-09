#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库管理模块
"""

import sqlite3
import os
import logging

class Database:
    """数据库管理类"""
    
    def __init__(self, db_path='database/welfare_helper.db'):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        
    def get_connection(self):
        """获取数据库连接"""
        # 确保数据库目录存在
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def initialize(self):
        """初始化数据库"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 读取并执行schema文件
            schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
            if os.path.exists(schema_path):
                with open(schema_path, 'r', encoding='utf-8') as f:
                    cursor.executescript(f.read())
            
            conn.commit()
            conn.close()
            
            self.logger.info("数据库初始化成功")
            
        except Exception as e:
            self.logger.error(f"数据库初始化失败: {str(e)}")
            raise
    
    def execute_query(self, query, params=None, fetch=None):
        """执行SQL查询"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = None
            if fetch == 'all':
                result = [dict(row) for row in cursor.fetchall()]
            elif fetch == 'one':
                row = cursor.fetchone()
                result = dict(row) if row else None
            
            conn.commit()
            conn.close()
            
            return result
            
        except Exception as e:
            self.logger.error(f"查询执行失败: {str(e)}")
            raise
    
    def get_config(self, key):
        """获取配置"""
        result = self.execute_query(
            "SELECT value FROM user_configs WHERE key = ?",
            (key,),
            fetch='one'
        )
        return result['value'] if result else None
    
    def set_config(self, key, value, platform=None):
        """设置配置"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_configs (key, value, platform)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    platform = excluded.platform,
                    updated_at = CURRENT_TIMESTAMP
            """, (key, value, platform))
            
            conn.commit()
            conn.close()
            
            self.logger.debug(f"配置更新: {key} = {value}")
            
        except Exception as e:
            self.logger.error(f"配置设置失败: {str(e)}")
            raise
    
    def get_platform_status(self, platform):
        """获取平台状态"""
        result = self.execute_query(
            "SELECT value FROM user_configs WHERE key = ?",
            (f'{platform}_enabled',),
            fetch='one'
        )
        return result['value'].lower() == 'true' if result else False
    
    def set_platform_status(self, platform, enabled):
        """设置平台状态"""
        self.set_config(
            f'{platform}_enabled',
            str(enabled).lower(),
            platform
        )
    
    def add_operation_log(self, platform, action, status, details=None, error_message=None):
        """添加操作日志"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO operation_logs (platform, action, status, details, error_message)
                VALUES (?, ?, ?, ?, ?)
            """, (platform, action, status, details, error_message))
            
            conn.commit()
            conn.close()
            
            self.logger.debug(f"操作日志: {platform} - {action} - {status}")
            
        except Exception as e:
            self.logger.error(f"操作日志添加失败: {str(e)}")
    
    def add_welfare_data(self, platform, title, description=None, url=None, start_time=None, end_time=None):
        """添加福利数据"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO welfare_data (platform, title, description, url, start_time, end_time, status)
                VALUES (?, ?, ?, ?, ?, ?, 'active')
            """, (platform, title, description, url, start_time, end_time))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"福利数据添加: {platform} - {title}")
            
        except Exception as e:
            self.logger.error(f"福利数据添加失败: {str(e)}")
    
    def get_recent_activities(self, limit=10):
        """获取最近的活动记录"""
        result = self.execute_query("""
            SELECT platform, action, status, details, created_at
            FROM operation_logs
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,), fetch='all')
        return result
    
    def increment_welfare_count(self, platform, welfare_type):
        """增加福利计数"""
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO statistics (platform, metric, value, date)
                VALUES (?, ?, 1, ?)
                ON CONFLICT(platform, metric, date) DO UPDATE SET
                    value = value + 1
            """, (platform, welfare_type, today))
            
            conn.commit()
            conn.close()
            
            self.logger.debug(f"福利计数增加: {platform} - {welfare_type}")
            
        except Exception as e:
            self.logger.error(f"福利计数更新失败: {str(e)}")
    
    def get_today_welfare_count(self):
        """获取今日福利数量"""
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        
        result = self.execute_query("""
            SELECT SUM(value) as total
            FROM statistics
            WHERE date = ?
        """, (today,), fetch='one')
        
        return result['total'] if result and result['total'] else 0