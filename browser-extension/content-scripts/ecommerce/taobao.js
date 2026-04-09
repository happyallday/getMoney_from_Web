/* 电商平台适配器 - 淘宝/天猫 */

(function() {
    const PLATFORM = 'taobao';

    function initTaobao() {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.init(PLATFORM);
            setupTaobaoSpecificFeatures();
            monitorTaobaoWelfare();
        }
    }

    function setupTaobaoSpecificFeatures() {
        setInterval(() => {
            detectTaoJinbiCheckIn();
            detectCouponCollection();
            detectActivityParticipation();
        }, 5000);

        detectTaoJinbiCheckIn();
        detectCouponCollection();
        detectActivityParticipation();
    }

    function detectTaoJinbiCheckIn() {
        const checkInIndicators = [
            '淘金币签到',
            '每日签到',
            '领取淘金币',
            'taojinbi'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (checkInIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.taobaoHandled) {
                    addTaobaoHelperButton(button, '淘金币签到');
                    button.dataset.taobaoHandled = 'true';
                }
            }
        });
    }

    function detectCouponCollection() {
        const couponIndicators = [
            '领券',
            '优惠券',
            '红包',
            '购物券',
            'coupon'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (couponIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.taobaoCouponHandled) {
                    addTaobaoHelperButton(button, '领券');
                    button.dataset.taobaoCouponHandled = 'true';
                }
            }
        });
    }

    function detectActivityParticipation() {
        const activityIndicators = [
            '参与活动',
            '立即参与',
            '限时活动',
            '特惠'
        ];

        const pageButtons = document.querySelectorAll('button, a, .btn');
        pageButtons.forEach(button => {
            const buttonText = button.textContent || button.value || '';
            if (activityIndicators.some(indicator => buttonText.includes(indicator))) {
                if (!button.dataset.taobaoActivityHandled) {
                    addTaobaoHelperButton(button, '活动');
                    button.dataset.taobaoActivityHandled = 'true';
                }
            }
        });
    }

    function addTaobaoHelperButton(element, action) {
        const helperBtn = document.createElement('button');
        helperBtn.innerHTML = '🤖 ' + action;
        helperBtn.style.cssText = `
            background: #ff5000;
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
            handleTaobaoAction(element, action);
        });

        if (element.parentElement) {
            element.parentElement.appendChild(helperBtn);
        }
    }

    function handleTaobaoAction(element, action) {
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
            console.error('淘宝操作失败:', error);
            logAction('操作失败', `错误: ${error.message}`);
            showNotification('操作失败', error.message);
        }
    }

    function detectActionResult(action) {
        const successIndicators = [
            '签到成功',
            '淘金币+',
            '领取成功',
            '获得'
        ];

        const errorIndicators = [
            '签到失败',
            '已签到',
            '重复领取',
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

    function monitorTaobaoWelfare() {
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                logAction('页面切换', `导航到: ${currentUrl}`);
                detectTaoJinbiCheckIn();
                detectCouponCollection();
                detectActivityParticipation();
            }
        }, 2000);

        monitorTaoJinbiValue();
    }

    function monitorTaoJinbiValue() {
        setInterval(() => {
            const jinbiSelectors = [
                '.taojinbi',
                '.jinbi',
                '[data-jinbi]'
            ];

            jinbiSelectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    const value = element.textContent.match(/\d+/);
                    if (value) {
                        logJinbiUpdate(value[0]);
                    }
                }
            });
        }, 30000);
    }

    function logJinbiUpdate(value) {
        if (window.WelfareHelperContent) {
            window.WelfareHelperContent.apiCall('/welfare/update', 'POST', {
                platform: PLATFORM,
                type: 'taojinbi',
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTaobao);
    } else {
        initTaobao();
    }

})();