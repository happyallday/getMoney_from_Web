/* 运营商小程序适配器 - 中国移动 */

(function() {
    const PLATFORM = 'mobile';

    function initMobile() {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.init(PLATFORM);
            setupMobileSpecificFeatures();
            monitorWelfareActivities();
        }
    }

    function setupMobileSpecificFeatures() {
        // 检测中国移动小程序环境
        setInterval(() => {
            if (isMiniProgramEnv()) {
                detectCheckInButton();
                detectWelfarePage();
            }
        }, 5000);
    }

    function isMiniProgramEnv() {
        return window.__wxjs_environment === 'miniprogram' ||
               (window.navigator.userAgent.includes('MicroMessenger') && window.wx);
    }

    function detectCheckInButton() {
        const checkInSelectors = [
            'button:contains("签到")',
            'a:contains("签到")',
            '.check-in-btn',
            '#checkInBtn',
            '[data-action="checkin"]'
        ];

        checkInSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.dataset.welfareHandled) {
                    addHelperButton(element, '签到');
                    element.dataset.welfareHandled = 'true';
                }
            });
        });
    }

    function detectWelfarePage() {
        const welfareIndicators = [
            '积分',
            '福利',
            '优惠',
            '兑换',
            '活动'
        ];

        const pageContent = document.body.textContent;
        const hasWelfare = welfareIndicators.some(indicator =>
            pageContent.includes(indicator)
        );

        if (hasWelfare) {
            notifyWelfareDetected();
        }
    }

    function addHelperButton(element, action) {
        const helperBtn = document.createElement('button');
        helperBtn.innerHTML = '🤖 签到助手';
        helperBtn.style.cssText = `
            background: #2c3e50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
            vertical-align: middle;
        `;

        helperBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAction(element, action);
        });

        element.parentElement.appendChild(helperBtn);
    }

    function handleAction(element, action) {
        if (action === '签到') {
            performCheckIn(element);
        }
    }

    async function performCheckIn(element) {
        try {
            // 记录签到尝试
            logAction('签到尝试', `准备签到: ${window.location.href}`);

            // 等待用户确认
            const confirmed = confirm('福利助手：检测到签到按钮，是否继续签到？');
            if (!confirmed) {
                logAction('签到取消', '用户取消签到操作');
                return;
            }

            // 模拟点击签到按钮
            element.click();
            waitForSignInResult();

        } catch (error) {
            console.error('签到失败:', error);
            logAction('签到失败', `错误: ${error.message}`);
            showNotification('签到失败', error.message);
        }
    }

    function waitForSignInResult() {
        const checkInterval = setInterval(() => {
            const successIndicators = [
                '签到成功',
                '连续签到',
                '积分+',
                '获得'
            ];

            const errorIndicators = [
                '签到失败',
                '已签到',
                '重复签到'
            ];

            const pageContent = document.body.textContent;

            if (successIndicators.some(indicator => pageContent.includes(indicator))) {
                clearInterval(checkInterval);
                handleCheckInSuccess();
            } else if (errorIndicators.some(indicator => pageContent.includes(indicator))) {
                clearInterval(checkInterval);
                handleCheckInError();
            }
        }, 1000);

        // 30秒超时
        setTimeout(() => {
            clearInterval(checkInterval);
            handleCheckInTimeout();
        }, 30000);
    }

    function handleCheckInSuccess() {
        logAction('签到成功', `完成签到: ${window.location.href}`);
        showNotification('签到成功', '今日签到愉快！');
        updateWelfareCount();
    }

    function handleCheckInError() {
        logAction('签到失败', ' 可能已经签到过了');
        showNotification('签到失败', '可能已经签到过了，请检查');
    }

    function handleCheckInTimeout() {
        logAction('签到超时', '操作未在指定时间内完成');
        showNotification('签到超时', '请稍后手动签到');
    }

    function notifyWelfareDetected() {
        logAction('福利页面检测', `检测到福利页面: ${window.location.href}`);
        showNotification('福利页面', '检测到福利活动页面', {
            url: window.location.href
        });
    }

    function logAction(action, details) {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.log(action, details);
        }
    }

    function showNotification(title, message, options = {}) {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title,
                message,
                ...options
            });
        }
    }

    function updateWelfareCount() {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.apiCall('/welfare/increment', 'POST', {
                platform: PLATFORM,
                type: 'sign_in'
            });
        }
    }

    function monitorWelfareActivities() {
        // 监控页面URL变化（SPA应用）
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                logAction('页面变化', `导航到: ${currentUrl}`);
                detectWelfarePage();
            }
        }, 2000);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobile);
    } else {
        initMobile();
    }

})();