// Background Service Worker for Welfare Helper
// Chrome Extension Manifest V3

console.log('Welfare Helper Background Service Worker initialized');

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        // First installation
        console.log('Welfare Helper installed for the first time');

        // Set default settings
        chrome.storage.local.set({
            welfareHelperSettings: {
                notificationEnabled: true,
                autoFillEnabled: true,
                soundEnabled: false,
                platforms: {
                    mobile: false,
                    unicom: false,
                    telecom: false,
                    jd: false,
                    taobao: false,
                    pdd: false
                }
            }
        });
    } else if (details.reason === 'update') {
        // Extension update
        console.log('Welfare Helper updated to version:', chrome.runtime.getManifest().version);
    }
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);

    if (request.action === 'getSystemStatus') {
        // Check system status
        checkSystemStatus().then(status => {
            sendResponse({ success: true, data: status });
        }).catch(error => {
            sendResponse({ success: false, message: error.message });
        });
        return true; // async response
    }

    if (request.action === 'openOptionsPage') {
        // Open settings page
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup/config.html')
        });
        sendResponse({ success: true });
    }

    if (request.action === 'sendNotification') {
        // Send notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: request.title || 'Welfare Helper',
            message: request.message || ''
        });
        sendResponse({ success: true });
    }

    if (request.action === 'getSettings') {
        // Get settings
        chrome.storage.local.get(['welfareHelperSettings'], (result) => {
            sendResponse({ success: true, data: result.welfareHelperSettings || {} });
        });
        return true;
    }

    if (request.action === 'saveSettings') {
        // Save settings
        chrome.storage.local.set({
            welfareHelperSettings: request.data
        }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'storeUserData') {
        // Store user data (encrypted)
        chrome.storage.local.set({
            welfareHelperUserInfo: request.data
        }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'getUserData') {
        // Get user data
        chrome.storage.local.get(['welfareHelperUserInfo'], (result) => {
            sendResponse({ success: true, data: result.welfareHelperUserInfo || {} });
        });
        return true;
    }
});

// Alarm handling for periodic checks
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm triggered:', alarm.name);

    if (alarm.name === 'periodicWelfareCheck') {
        performWelfareCheck();
    }
});

// Function to check system status
async function checkSystemStatus() {
    try {
        // Try to connect to backend API
        const response = await fetch('http://127.0.0.1:5000/api/system/status');

        if (response.ok) {
            const data = await response.json();
            return {
                status: 'running',
                backendConnected: true,
                ...data.data
            };
        } else {
            return {
                status: 'error',
                backendConnected: false,
                message: 'Backend API returned error'
            };
        }
    } catch (error) {
        return {
            status: 'disconnected',
            backendConnected: false,
            message: 'Cannot connect to backend service'
        };
    }
}

// Function to perform periodic welfare checks
async function performWelfareCheck() {
    try {
        console.log('Performing periodic welfare check');

        // Get current settings
        const settings = await new Promise((resolve) => {
            chrome.storage.local.get(['welfareHelperSettings'], (result) => {
                resolve(result.welfareHelperSettings || {});
            });
        });

        if (!settings.platforms) return;

        // Check each enabled platform
        for (const [platform, enabled] of Object.entries(settings.platforms)) {
            if (enabled) {
                console.log(`Checking welfare for platform: ${platform}`);
                // Platform-specific check logic would go here
            }
        }

    } catch (error) {
        console.error('Periodic welfare check failed:', error);
    }
}

// Set up periodic alarm
chrome.alarms.create('periodicWelfareCheck', {
    periodInMinutes: 30 // Check every 30 minutes
});

// Extension initialization
console.log('Welfare Helper Background Service Worker ready');

// Keep service worker alive (prevents premature termination)
setInterval(() => {
    console.log('Heartbeat - keeping service worker alive');
}, 300000); // Every 5 minutes