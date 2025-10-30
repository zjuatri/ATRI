// 工具函数模块

// 支持的域名列表
const SUPPORTED_DOMAINS = [
  'studywisdomh5.zhihuishu.com',
  'fusioncourseh5.zhihuishu.com'
];

// 检查当前 URL 是否在支持的域名下
function isSupportedDomain(url = window.location.href) {
  return SUPPORTED_DOMAINS.some(domain => url.includes(domain));
}

// 检查是否为特定页面类型
function isPageType(type, url = window.location.href) {
  // type 可以是: 'exam', 'mastery', 'pointOfMastery', 'examAnalysis', 'study'
  if (!isSupportedDomain(url)) return false;
  
  const isFusionDomain = url.includes('fusioncourseh5.zhihuishu.com');
  
  switch(type) {
    case 'exam':
      // exam 页面排除 pointOfMastery 和 examAnalysis
      if (isFusionDomain) {
        return url.includes('/exam') && !url.includes('/point/') && !url.includes('/examPreview/');
      } else {
        return url.includes('/exam') && !url.includes('/pointOfMastery') && !url.includes('/examAnalysis');
      }
      
    case 'mastery':
      return url.includes('/study/mastery') || url.includes('/mastery');
      
    case 'pointOfMastery':
      // studywisdomh5: /pointOfMastery
      // fusioncourseh5: /point/
      if (isFusionDomain) {
        return url.includes('/point/');
      } else {
        return url.includes('/pointOfMastery');
      }
      
    case 'examAnalysis':
      // studywisdomh5: /examAnalysis
      // fusioncourseh5: /examPreview/
      if (isFusionDomain) {
        return url.includes('/examPreview/');
      } else {
        return url.includes('/examAnalysis');
      }
      
    case 'study':
      return url.includes('/study');
      
    default:
      return false;
  }
}

// 提取URL参数
async function extractExamParams() {
  try {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const isFusionDomain = url.href.includes('fusioncourseh5.zhihuishu.com');
    
    let knowledgeId, recruitAndCourseId, secretStr, timestamp;
    
    if (isFusionDomain) {
      // fusioncourseh5 域名：参数在 URL 路径中
      // 示例: /exam/1100000101/370449/RjBNRp2Lv1SJZ7yN/5af4d53ceeb0c49551a8e5b1d61e2a9f
      const pathParts = url.pathname.split('/').filter(p => p);
      
      if (pathParts[0] === 'exam' && pathParts.length >= 4) {
        knowledgeId = pathParts[3]; // RjBNRp2Lv1SJZ7yN
        recruitAndCourseId = params.get('recruitAndCourseId');
        
        // 如果从 URL 获取不到 recruitAndCourseId，尝试从 storage 读取
        if (!recruitAndCourseId) {
          try {
            const result = await chrome.storage.local.get(['savedRecruitAndCourseId']);
            if (result.savedRecruitAndCourseId) {
              recruitAndCourseId = result.savedRecruitAndCourseId;
              console.log('📋 [fusion] 从 storage 读取 recruitAndCourseId:', recruitAndCourseId);
            }
          } catch (e) {
            console.warn('⚠️ 读取 storage 失败:', e);
          }
        }
        
        secretStr = params.get('secretStr');
        timestamp = params.get('timestamp');
        
        console.log('📋 [fusion] 从路径提取参数:', {
          knowledgeId,
          recruitAndCourseId,
          pathParts
        });
      }
    } else {
      // studywisdomh5 域名：参数在查询字符串中
      knowledgeId = params.get('knowledgeId');
      recruitAndCourseId = params.get('recruitAndCourseId');
      secretStr = params.get('secretStr');
      timestamp = params.get('timestamp');
    }
    
    if (knowledgeId && recruitAndCourseId) {
      // 保存 recruitAndCourseId 到 storage 供后续使用
      try {
        await chrome.storage.local.set({ savedRecruitAndCourseId: recruitAndCourseId });
        console.log('💾 [提取参数] 保存 recruitAndCourseId 到 storage:', recruitAndCourseId);
      } catch (e) {
        console.warn('⚠️ 保存 recruitAndCourseId 失败:', e);
      }
      
      // 生成文件名
      const fileName = `${knowledgeId}_${recruitAndCourseId}.json`;
      
      return {
        knowledgeId,
        recruitAndCourseId,
        secretStr,
        timestamp,
        fileName
      };
    }
    
    console.warn('⚠️ 未能提取到必要的参数:', { knowledgeId, recruitAndCourseId });
    return null;
  } catch (e) {
    console.error('❌ 提取URL参数失败:', e);
    return null;
  }
}

// 生成唯一ID
function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 等待元素出现
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// 延迟执行
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 安全地发送 Chrome 消息
async function safeSendMessage(message) {
  try {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Runtime error:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  } catch (err) {
    console.error('❌ 发送消息失败:', err.message);
    throw err;
  }
}
