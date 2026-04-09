#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API路由模块
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import logging

api_blueprint = Blueprint('api', __name__)
logger = logging.getLogger(__name__)

# 导入数据库操作
from database import Database
db = Database()

@api_blueprint.route('/system/status', methods=['GET'])
def system_status():
    """获取系统状态"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'status': 'running',
                'version': '0.1.0',
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"系统状态查询失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/platforms/status', methods=['GET'])
def platforms_status():
    """获取所有平台状态"""
    try:
        platforms = ['mobile', 'unicom', 'telecom', 'jd', 'taobao', 'pdd']
        
        status_data = []
        for platform in platforms:
            enabled = db.get_platform_status(platform)
            status_data.append({
                'name': platform,
                'active': enabled
            })
        
        return jsonify({
            'success': True,
            'data': status_data
        })
    except Exception as e:
        logger.error(f"平台状态查询失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/platforms/<platform>/toggle', methods=['POST'])
def toggle_platform(platform):
    """切换平台启用状态"""
    try:
        data = request.get_json() or {}
        current_status = db.get_platform_status(platform)
        new_status = not current_status
        
        db.set_platform_status(platform, new_status)
        
        # 记录操作日志
        action = '启用' if new_status else '禁用'
        db.add_operation_log(
            platform=platform,
            action=f'平台{action}',
            status='success'
        )
        
        return jsonify({
            'success': True,
            'data': {
                'platform': platform,
                'active': new_status,
                'message': f'{action}成功'
            }
        })
    except Exception as e:
        logger.error(f"平台切换失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/activities/recent', methods=['GET'])
def recent_activities():
    """获取最近活动"""
    try:
        limit = request.args.get('limit', 10, type=int)
        activities = db.get_recent_activities(limit)
        
        formatted_activities = []
        for activity in activities:
            formatted_activities.append({
                'type': activity['action'],
                'description': activity['details'] or activity['action'],
                'status': activity['status'],
                'timestamp': activity['created_at']
            })
        
        return jsonify({
            'success': True,
            'data': formatted_activities
        })
    except Exception as e:
        logger.error(f"活动记录查询失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/welfare/check', methods=['POST'])
def check_welfare():
    """检查福利"""
    try:
        # 模拟检查福利逻辑
        count = db.get_today_welfare_count()
        
        # 记录检查操作
        db.add_operation_log(
            platform='system',
            action='福利检查',
            status='success',
            details=f'发现{count}个福利'
        )
        
        return jsonify({
            'success': True,
            'data': {
                'count': count,
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"福利检查失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/welfare/increment', methods=['POST'])
def increment_welfare():
    """增加福利计数"""
    try:
        data = request.get_json()
        platform = data.get('platform', 'unknown')
        welfare_type = data.get('type', 'general')
        
        db.increment_welfare_count(platform, welfare_type)
        
        return jsonify({
            'success': True,
            'message': '福利计数更新成功'
        })
    except Exception as e:
        logger.error(f"福利计数更新失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/user/auto-fill', methods=['POST'])
def auto_fill():
    """自动填充用户信息"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        field_type = data.get('fieldType')
        
        # 模拟获取填充数据
        fill_data = get_fill_data(platform, field_type)
        
        return jsonify({
            'success': True,
            'data': {
                'value': fill_data
            }
        })
    except Exception as e:
        logger.error(f"自动填充失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@api_blueprint.route('/logs/add', methods=['POST'])
def add_log():
    """添加操作日志"""
    try:
        data = request.get_json()
        
        db.add_operation_log(
            platform=data.get('platform'),
            action=data.get('action'),
            status='pending',
            details=data.get('details')
        )
        
        return jsonify({
            'success': True,
            'message': '日志添加成功'
        })
    except Exception as e:
        logger.error(f"日志添加失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

def get_fill_data(platform, field_type):
    """获取填充数据（模拟）"""
    data_map = {
        'phone': '13800138000',
        'name': '张三',
        'address': '北京市朝阳区',
        'idcard': '110101199001011234'
    }
    return data_map.get(field_type, '')