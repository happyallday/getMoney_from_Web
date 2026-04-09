const API_BASE_URL = 'http://127.0.0.1:5000/api';

class SettingsManager {
    constructor() {
        this.platforms = ['mobile', 'unicom', 'telecom', 'jd', 'taobao', 'pdd'];
        this.settings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.initializeUI();
    }

    async loadSettings() {
        try {
            // 从Chrome存储加载设置
            chrome.storage.local.get(['welfareHelperSettings'], (result) => {
                if (result.welfareHelperSettings) {
                    this.settings = result.welfareHelperSettings;
                } else {
                    this.settings = this.getDefaultSettings();
                }
                this.applySettings();
            });

            // 加载平台状态
            await this.loadPlatformStatuses();

        } catch (error) {
            console.error('设置加载失败:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            notificationEnabled: true,
            autoFillEnabled: true,
            soundEnabled: false,
            platforms: {}
        };
    }

    async loadPlatformStatuses() {
        try {
            const response = await this.apiCall('/platforms/status');
            if (response.success) {
                response.data.forEach(platform => {
                    this.settings.platforms[platform.name] = platform.active;
                });
                this.saveSettings();
            }
        } catch (error) {
            console.error('平台状态加载失败:', error);
        }
    }

    applySettings() {
        // 应用通用设置
        document.getElementById('notification-enabled').checked = this.settings.notificationEnabled;
        document.getElementById('autofill-enabled').checked = this.settings.autoFillEnabled;
        document.getElementById('sound-enabled').checked = this.settings.soundEnabled;

        // 应用平台设置
        this.platforms.forEach(platform => {
            const checkbox = document.getElementById(`${platform}-enabled`);
            if (checkbox) {
                checkbox.checked = this.settings.platforms[platform] || false;
                this.updatePlatformCard(platform, checkbox.checked);
            }
        });

        // 加载用户信息
        this.loadUserInfo();
    }

    bindEvents() {
        // 平台开关事件
        this.platforms.forEach(platform => {
            const checkbox = document.getElementById(`${platform}-enabled`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.handlePlatformToggle(platform, e.target.checked);
                });
            }
        });

        // 通用设置事件
        document.getElementById('notification-enabled').addEventListener('change', (e) => {
            this.settings.notificationEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('autofill-enabled').addEventListener('change', (e) => {
            this.settings.autoFillEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveSettings();
        });

        // 用户表单提交
        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserInfo();
        });
    }

    initializeUI() {
        // 添加平台卡片点击事件
        this.platforms.forEach(platform => {
            const card = document.querySelector(`[data-platform="${platform}"]`);
            const checkbox = document.getElementById(`${platform}-enabled`);
            if (card && checkbox) {
                card.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.click();
                    }
                });
            }
        });
    }

    async handlePlatformToggle(platform, enabled) {
        try {
            this.updatePlatformCard(platform, enabled);

            const response = await this.apiCall(`/platforms/${platform}/toggle`, 'POST');

            if (response.success) {
                this.settings.platforms[platform] = enabled;
                this.saveSettings();
                this.showNotification('设置更新', `${this.getPlatformName(platform)}已${enabled ? '启用' : '禁用'}`);
            } else {
                throw new Error(response.message || '操作失败');
            }
        } catch (error) {
            console.error('平台切换失败:', error);
            // 回复UI状态
            const checkbox = document.getElementById(`${platform}-enabled`);
            checkbox.checked = !enabled;
            this.updatePlatformCard(platform, !enabled);
            this.showNotification('操作失败', error.message);
        }
    }

    updatePlatformCard(platform, enabled) {
        const card = document.querySelector(`[data-platform="${platform}"]`);
        if (card) {
            if (enabled) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        }
    }

    async saveUserInfo() {
        try {
            const userInfo = {
                name: document.getElementById('userName').value,
                phone: document.getElementById('userPhone').value,
                idCard: document.getElementById('userIdCard').value,
                address: document.getElementById('userAddress').value
            };

            // 实际加密和存储逻辑
            const encryptedInfo = this.encryptUserInfo(userInfo);

            chrome.storage.local.set({
                welfareHelperUserInfo: encryptedInfo
            }, () => {
                this.showNotification('保存成功', '用户信息已保存');
            });

        } catch (error) {
            console.error('用户信息保存失败:', error);
            this.showNotification('保存失败', '用户信息保存失败');
        }
    }

    loadUserInfo() {
        chrome.storage.local.get(['welfareHelperUserInfo'], (result) => {
            if (result.welfareHelperUserInfo) {
                try {
                    const userInfo = this.decryptUserInfo(result.welfareHelperUserInfo);
                    document.getElementById('userName').value = userInfo.name || '';
                    document.getElementById('userPhone').value = userInfo.phone || '';
                    document.getElementById('userIdCard').value = userInfo.idCard || '';
                    document.getElementById('userAddress').value = userInfo.address || '';
                } catch (error) {
                    console.error('用户信息解密失败:', error);
                }
            }
        });
    }

    encryptUserInfo(userInfo) {
        // 简单的Base64编码作为示例，实际应该使用更强的加密
        const jsonString = JSON.stringify(userInfo);
        return btoa(encodeURIComponent(jsonString));
    }

    decryptUserInfo(encrypted) {
        try {
            const jsonString = decodeURIComponent(atob(encrypted));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('解密失败:', error);
            return {};
        }
    }

    saveSettings() {
        chrome.storage.local.set({
            welfareHelperSettings: this.settings
        });
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            chrome.storage.local.clear(() => {
                this.settings = this.getDefaultSettings();
                this.applySettings();
                this.showNotification('清除成功', '所有数据已清除');
            });
        }
    }

    exportData() {
        chrome.storage.local.get(null, (data) => {
            const exportData = {
                settings: this.settings,
                timestamp: new Date().toISOString(),
                version: '0.1.0'
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `welfare-helper-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('导出成功', '数据已导出到文件');
        });
    }

    showNotification(title, message) {
        if (chrome.notifications && this.settings.notificationEnabled) {
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

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('API调用失败:', error);
            return { success: false, message: 'API调用失败' };
        }
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
}

function goBack() {
    window.location.href = 'index.html';
}

// 实例化设置管理器
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});