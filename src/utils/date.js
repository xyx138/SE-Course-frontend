/**
 * 格式化日期
 * @param {string|number|Date} date 日期字符串、时间戳或Date对象
 * @param {boolean} showTime 是否显示时间
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, showTime = false) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (!showTime) {
    return `${year}-${month}-${day}`;
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取相对时间描述
 * @param {string|number|Date} date 日期字符串、时间戳或Date对象
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  
  // 小于1周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  
  // 大于1周，返回日期
  return formatDate(date);
} 