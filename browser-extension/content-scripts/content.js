/**
 * 通用内容脚本
 * 提供基础功能，所有平台适配器都可以使用
 */

 WelfareHelperContent = window.WelfareHelperContent || {
    initialized: false,
    platform: null,
    apiBase: 'http://127.0.0.1:5000/api',

    init(platform) {
        if (this.initialized) return;

        this.platform = platform;
        this.initialized = true;

        this.detectForms();
        this.setupMessageListener();
        this.monitorPageChanges();
    },

    /**
     * 检测页面中的表单
     */
    detectForms() {
        const forms = document.querySelectorAll('form, [role="form"], .form');
        forms.forEach(form => {
            this.makeFormInteractive(form);
        });
    },

    /**
     * 使表单可交互
     */
    makeFormInteractive(form) {
        const inputs = form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], textarea');

        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                this.handleInputFocus(e.target);
            });
        });
    },

    /**
     * 处理输入框焦点事件
     */
    handleInputFocus(input) {
        if (input.dataset.welfareHandled) return;

        const fieldInfo = this.analyzeField(input);
        if (fieldInfo.type) {
            input.dataset.welfareHandled = 'true';
            this.addFillButton(input, fieldInfo);
        }
    },

    /**
     * 分析字段类型
     */
    analyzeField(input) {
        const name = input.name || input.id || '';
        const placeholder = input.placeholder || '';
        const label = this.findInputLabel(input);

        const combined = (name + placeholder + label).toLowerCase();

        if (combined.includes('phone') || combined.includes('mobile') || combined.includes('电话')) {
            return { type: 'phone' };
        }
        if (combined.includes('name') || combined.includes('姓名')) {
            return { type: 'name' };
        }
        if (combined.includes('address') || combined.includes('地址')) {
            return { type: 'address' };
        }
        if (combined.includes('idcard') || combined.includes('身份证')) {
            return { type: 'idcard' };
        }

        return { type: null };
    },

    /**
     * 查找输入框标签
     */
    findInputLabel(input) {
        const id = input.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label.textContent;
        }

        // 查找前置标签
        let previous = input.previousElementSibling;
        while (previous) {
            if (previous.tagName === 'LABEL') {
                return previous.textContent;
            }
            previous = previous.previousElementSibling;
        }

        return '';
    },

    /**
     * 添加自动填充按钮
     */
    addFillButton(input, fieldInfo) {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = '🤖 自动填充';
        button.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            z-index: 1000;
        `;

        // 设置输入框为相对定位
        if (getComputedStyle(input).position === 'static') {
            input.style.position = 'relative';
        }

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.autoFillField(input, fieldInfo.type);
        });

        input.parentElement.appendChild(button);
    },

    /**
     * 自动填充字段
     */
    async autoFillField(input, fieldType) {
        try {
            const response = await this.apiCall('/user/auto-fill', 'POST', {
                platform: this.platform,
                fieldType
            });

            if (response.success && response.data.value) {
                input.value = response.data.value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                this.showSuccessMessage(input);
            } else {
                throw new Error('没有找到对应的值');
            }
        } catch (error) {
            console.error('自动填充失败:', error);
            this.showErrorMessage(input, '自动填充失败');
        }
    },

    /**
     * 显示成功提示
     */
    showSuccessMessage(input) {
        const toast = document.createElement('div');
        toast.innerHTML = '✅ 填充成功';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * 显示错误提示
     */
    showErrorMessage(input, message) {
        const toast = document.createElement('div');
        toast.innerHTML = '❌ ' + message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    /**
     * 监听页面变化
     */
    monitorPageChanges() {
        const observer = new MutationObserver(() => {
            this.detectForms();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getFormData') {
                const formData = this.collectFormData();
                sendResponse({ success: true, data: formData });
            }
        });
    },

    /**
     * 收集表单数据
     */
    collectFormData() {
        return {
            url: window.location.href,
            platform: this.platform,
            forms: Array.from(document.querySelectorAll('form')).map(form => ({
                action: form.action,
                fields: Array.from(form.querySelectorAll('input, textarea')).map(field => ({
                    name: field.name,
                    id: field.id,
                    type: field.type,
                    value: field.value
                }))
            }))
        };
    },

    /**
     * API调用
     */
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
            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('API调用失败:', error);
            return { success: false, message: 'API调用失败' };
        }
    },

    /**
     * 日志记录
     */
    log(action, details) {
        this.apiCall('/logs/add', 'POST', {
            platform: this.platform,
            action,
            details,
            url: window.location.href
        });
    }
};

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);