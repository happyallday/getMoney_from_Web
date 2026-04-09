/* 运营商小程序适配器 - 中国电信 */

(function() {
    const PLATFORM = 'telecom';

    function initTelecom() {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.init(PLATFORM);
            setupTelecomSpecificFeatures();
            monitorTelecomActivities();
        }
    }

    function setupTelecomSpecificFeatures() {
        setInterval(() => {
            if (isMiniProgramEnv()) {
                detectTelecomCheckIn();
                detectCoupons();
            }
        }, 5000);
    }

    function isMiniProgramEnv() {
        return window.__wxjs_environment === 'miniprogram' ||
               (window.navigator.userAgent.includes('MicroMessenger') && window.wx);
    }

    function detectTelecomCheckIn() {
        const checkInIndicators = [
            '电信签到',
            '每日签到',
            '天翼签到',
            'checkin'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (checkInIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.telecomHandled) {
                    addTelecomHelperButton(button, '签到');
                    button.dataset.telecomHandled = 'true';
                }
            }
        });
    }

    function detectCoupons() {
        const couponIndicators = [
            '领取优惠券',
            '优惠券',
            '话费券',
            '流量券'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (couponIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.telecomCouponHandled) {
                    addTelecomHelperButton(button, '优惠券');
                    button.dataset.telecomCouponHandled = 'true';
                }
            }
        });
    }

    function addTelecomHelperButton(element, action) {
        const helperBtn = document.createElement('button');
        helperBtn.innerHTML = '🤖 ' + action;
        helperBtn.style.cssText = `
            background: #ff6b00;
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
            handleTelecomAction(element, action);
        });

        if (element.parentElement) {
            element.parentElement.appendChild(helperBtn);
        }
    }

    function handleTelecomAction(element, action) {
        try {
            logAction('操作尝试', `准备执行: ${action}`);

            const confirmed = confirm(`福利助手：检测到${action}操作，是否继续？`);
            if (!confirmed) {
                logAction('操作取消', `用户取消${action}操作`);
                return;
            }

            element.click();
            detectActionResult(action);

        } catch (error) {
            console.error('电信操作失败:', error);
            logAction('操作失败', `错误: ${error.message}`);
            showNotification('操作失败', error.message);
        }
    }

    function detectActionResult(action) {
        const successIndicators = [
            '签到成功',
            '领取成功',
            '获得',
            '完成'
        ];

        const errorIndicators = [
            '签到失败',
            '已签到',
            '重复',
            '已领取'
        ];

        const checkInterval = setInterval(() => {
            const pageContent = document.body.textContent;

            if (successIndicators.some(indicator => pageContent.includes(indicator))) {
                clearInterval(checkInterval);
                handleActionSuccess(action);
            } else if (errorIndicators.some(indicator => pageContent.includes(indicator))) {
                clearInterval(checkInterval);
                handleActionError(action);
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(checkInterval);
            handleActionTimeout(action);
        }, 15000);
    }

    function handleActionSuccess(action) {
        logAction('操作成功', `完成${action}: ${window.location.href}`);
        showNotification(`${action}成功`, '操作已成功完成！');
        updateWelfareCount();
    }

    function handleActionError(action) {
        logAction('操作失败', '可能已操作过');
        showNotification(`${action}失败`, '可能已经操作过了，请检查');
    }

    function handleActionTimeout(action) {
        logAction('操作超时', '操作未在指定时间内完成');
        showNotification('操作超时', '请稍后手动操作');
    }

    function monitorTelecomActivities() {
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                logAction('页面切换', `导航到: ${currentUrl}`);
                detectTelecomCheckIn();
                detectCoupons();
            }
        }, 2000);
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
                type: 'welfare'
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTelecom);
    } else {
        initTelecom();
    }

})();