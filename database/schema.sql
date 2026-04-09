-- Welfare Helper 数据库结构
-- 创建日期: 2024-04-09
-- 版本: 1.0.0

-- 用户配置表 (配置数据加密存储)
CREATE TABLE IF NOT EXISTS user_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    platform TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_configs_key ON user_configs(key);
CREATE INDEX IF NOT EXISTS idx_user_configs_platform ON user_configs(platform);

-- 操作记录表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_operation_logs_platform ON operation_logs(platform);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- 福利数据表
CREATE TABLE IF NOT EXISTS welfare_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_welfare_data_platform ON welfare_data(platform);
CREATE INDEX IF NOT EXISTS idx_welfare_data_status ON welfare_data(status);

-- 统计信息表
CREATE TABLE IF NOT EXISTS statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    metric TEXT NOT NULL,
    value INTEGER NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, metric, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_statistics_platform ON statistics(platform);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认系统设置
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
    ('version', '0.1.0', '系统版本号'),
    ('last_check_time', '', '上次检查福利时间'),
    ('notification_enabled', 'true', '是否启用通知'),
    ('auto_fill_enabled', 'true', '是否启用自动填充');

-- 创建触发器自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_user_configs_timestamp
AFTER UPDATE ON user_configs
BEGIN
    UPDATE user_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_welfare_data_timestamp
AFTER UPDATE ON welfare_data
BEGIN
    UPDATE welfare_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_system_settings_timestamp
AFTER UPDATE ON system_settings
BEGIN
    UPDATE system_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;