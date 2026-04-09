const API_BASE_URL = 'http://127.0.0.1:5000/api';

class WelfareHelper {
    constructor() {
        this.platforms = ['mobile', 'unicom', 'telecom', 'jd', 'taobao', 'pdd'];
        this.activities = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkSystemStatus();
        await this.loadPlatformStatus();
        await this.loadRecentActivities();
    }

    bindEvents() {
        document.getElementById('checkWelfare').addEventListener('click', () => this.checkWelfare());
        document.getElementById('openSettings').addEventListener('click', () => this.openSettings());

        this.platforms.forEach(platform => {
            const card = document.querySelector(`[data-platform="${platform}"]`);
            if (card) {
                card.addEventListener('click', () => this.togglePlatform(platform));
            }
        });
    }

    async checkSystemStatus() {
        try {
            const response = await this.apiCall('/system/status');
            const statusElement = document.getElementById('systemStatus');

            if (response.success) {
                statusElement.textContent = '运行正常';
                statusElement.style.color = '#27ae60';
            } else {
                throw new Error(response.message || '系统异常');
            }
        } catch (error) {
            const statusElement = document.getElementById('systemStatus');
            statusElement.textContent = '未连接';
            statusElement.style.color = '#e74c3c';
            console.error('系统状态检查失败:', error);
        }
    }

    async loadPlatformStatus() {
        try {
            const response = await this.apiCall('/platforms/status');

            if (response.success) {
                response.data.forEach(platform => {
                    const statusElement = document.getElementById(`${platform.name}-status`);
                    const card = document.querySelector(`[data-platform="${platform.name}"]`);

                    if (statusElement && card) {
                        statusElement.textContent = platform.active ? '已激活' : '未激活';
                        if (platform.active) {
                            card.classList.add('active');
                            statusElement.style.background = '#d5f5e3';
                            statusElement.style.color = '#27ae60';
                        }
                    }
                });
            }
        } catch (error) {
            console.error('平台状态加载失败:', error);
        }
    }

    async loadRecentActivities() {
        try {
            const response = await this.apiCall('/activities/recent');

            if (response.success && response.data.length > 0) {
                this.activities = response.data;
                this.renderActivities();
            }
        } catch (error) {
            console.error('活动记录加载失败:', error);
        }
    }

    async checkWelfare() {
        const button = document.getElementById('checkWelfare');
        button.disabled = true;
        button.textContent = '检查中...';

        try {
            const response = await this.apiCall('/welfare/check');

            if (response.success) {
                document.getElementById('dailyWelfare').textContent = response.data.count || 0;

                this.addActivity(
                    '手动检查',
                    '检查完成，发现新福利',
                    'success'
                );

                this.showNotification('福利检查完成', `发现 ${response.data.count || 0} 个新福利`);
            } else {
                throw new Error(response.message || '检查失败');
            }
        } catch (error) {
            this.addActivity('手动检查', '检查失败: ' + error.message, 'error');
            console.error('福利检查失败:', error);
        } finally {
            button.disabled = false;
            button.textContent = '检查福利';
        }
    }

    async togglePlatform(platform) {
        try {
            const response = await this.apiCall(`/platforms/${platform}/toggle`, 'POST');

            if (response.success) {
                const statusElement = document.getElementById(`${platform}-status`);
                const card = document.querySelector(`[data-platform="${platform}"]`);

                if (response.data.active) {
                    statusElement.textContent = '已激活';
                    statusElement.style.background = '#d5f5e3';
                    statusElement.style.color = '#27ae60';
                    card.classList.add('active');

                    this.addActivity(
                        '平台管理',
                        `启用${this.getPlatformName(platform)}`,
                        'success'
                    );
                } else {
                    statusElement.textContent = '未激活';
                    statusElement.style.background = '#f5f5f5';
                    statusElement.style.color = '#7f8c8d';
                    card.classList.remove('active');

                    this.addActivity(
                        '平台管理',
                        `禁用${this.getPlatformName(platform)}`,
                        'pending'
                    );
                }
            } else {
                throw new Error(response.message || '操作失败');
            }
        } catch (error) {
            console.error('平台切换失败:', error);
            this.showNotification('操作失败', error.message);
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    addActivity(type, description, status) {
        const activity = {
            type,
            description,
            status,
            timestamp: new Date().toISOString()
        };

        this.activities.unshift(activity);
        this.renderActivities();

        this.updateActivitiesList();
    }

    renderActivities() {
        const activityList = document.getElementById('activityList');

        if (this.activities.length === 0) {
            activityList.innerHTML = '<div class="empty-state">暂无活动记录</div>';
            return;
        }

        activityList.innerHTML = this.activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-info">
                    <div class="activity-title">${activity.description}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
                <div class="activity-status ${activity.status}">${this.getStatusText(activity.status)}</div>
            </div>
        `).join('');
    }

    async updateActivitiesList() {
        try {
            await this.apiCall('/activities/add', 'POST', {
                activities: this.activities.slice(0, 10)
            });
        } catch (error) {
            console.error('活动记录更新失败:', error);
        }
    }

    showNotification(title, message) {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title,
                message
            });
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        return await response.json();
    }

    getPlatformName(platform) {
        const names = {
            mobile: '中国移动',
            unicom: '中国联通',
            telecom: '中国电信',
            jd: '京东',
            taobao: '淘宝',
            pdd: '拼多多'
        };
        return names[platform] || platform;
    }

    getActivityIcon(type) {
        const icons = {
            '手动检查': '🔍',
            '平台管理': '⚙️',
            '福利获取': '🎁',
            '系统通知': '📢'
        };
        return icons[type] || '📝';
    }

    getStatusText(status) {
        const texts = {
            success: '成功',
            error: '失败',
            pending: '进行中'
        };
        return texts[status] || status;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return date.toLocaleDateString('zh-CN');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WelfareHelper();
});