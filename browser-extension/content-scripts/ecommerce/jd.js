/* 电商平台适配器 - 京东 */

(function() {
    const PLATFORM = 'jd';

    function initJD() {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.init(PLATFORM);
            setupJDSpecificFeatures();
            monitorJDWelfare();
        }
    }

    function setupJDSpecificFeatures() {
        // 定期检测页面特定功能
        setInterval(() => {
            detectJingDouCheckIn();
            detectCouponCollection();
            detectActivityReservation();
        }, 5000);

        // 初始化时立即检测
        detectJingDouCheckIn();
        detectCouponCollection();
        detectActivityReservation();
    }

    function detectJingDouCheckIn() {
        const indicatiors = [
            '京豆签到',
            '签到领京豆',
            '每日签到',
            'checkin'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (indicatiors.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.jdHandled) {
                    addJDHelperButton(button, '京豆签到');
                    button.dataset.jdHandled = 'true';
                }
            }
        });
    }

    function detectCouponCollection() {
        const couponIndicators = [
            '优惠券',
            '领券',
            '红包',
            'coupon'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (couponIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.jdCouponHandled) {
                    addJDHelperButton(button, '领券');
                    button.dataset.jdCouponHandled = 'true';
                }
            }
        });
    }

    function detectActivityReservation() {
        const reservationIndicators = [
            '预约',
            '抢购',
            '立即领取'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (reservationIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.jdReserveHandled) {
                    addJDHelperButton(button, '活动参与');
                    button.dataset.jdReserveHandled = 'true';
                }
            }
        });
    }

    function addJDHelperButton(element, action) {
        const helperBtn = document.createElement('button');
        helperBtn.innerHTML = '🤖 ' + action;
        helperBtn.style.cssText = `
            background: #e4393c;
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
            handleJDAction(element, action);
        });

        if (element.parentElement) {
            element.parentElement.appendChild(helperBtn);
        }
    }

    function handleJDAction(element, action) {
        try {
            logAction('操作尝试', `准备执行: ${action}`);

            const confirmed = confirm(`福利助手：检测到${action}操作，是否继续？`);
            if (!confirmed) {
                logAction('操作取消', `用户取消${action}操作`);
                return;
            }

            element.click();
            recognizeActionResult(action);

        } catch (error) {
            console.error('京东操作失败:', error);
            logAction('操作失败', `错误: ${error.message}`);
            showNotification('操作失败', error.message);
        }
    }

    function recognizeActionResult(action) {
        const successIndicators = [
            '成功',
            '已完成',
            '已签到',
            '京豆+'
        ];

        const errorIndicators = [
            '失败',
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
        logAction('操作失败', `失败原因: 可能已${action}过`);
        showNotification(`${action}失败`, '可能已经操作过了，请检查');
    }

    function handleActionTimeout(action) {
        logAction('操作超时', '操作未在指定时间内完成');
        showNotification('操作超时', '请稍后手动操作');
    }

    function monitorJDWelfare() {
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                logAction('页面切换', `导航到: ${currentUrl}`);
                detectJingDouCheckIn();
                detectCouponCollection();
                detectActivityReservation();
            }
        }, 2000);

        // 监控京豆值
        monitorJingDouValue();
    }

    function monitorJingDouValue() {
        setInterval(() => {
            const jingDouSelectors = [
                '.jbean',
                '.jd-jbean',
                '[data-jbean]'
            ];

            jingDouSelectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    const value = element.textContent.match(/\d+/);
                    if (value) {
                        logJingDouUpdate(value[0]);
                    }
                }
            });
        }, 30000);
    }

    function logJingDouUpdate(value) {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.apiCall('/welfare/update', 'POST', {
                platform: PLATFORM,
                type: 'jingdou',
                value: parseInt(value),
                timestamp: new Date().toISOString()
            });
        }
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

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initJD);
    } else {
        initJD();
    }

})();