// Popup 页面脚本
document.addEventListener('DOMContentLoaded', function() {
  const actionBtn = document.getElementById('actionBtn');
  
  // 支持的域名列表
  const SUPPORTED_DOMAINS = [
    'studywisdomh5.zhihuishu.com',
    'fusioncourseh5.zhihuishu.com'
  ];
  
  // 检查 URL 是否在支持的域名下
  function isSupportedDomain(url) {
    return SUPPORTED_DOMAINS.some(domain => url.includes(domain));
  }
  
  // 检查当前页面是否为智慧树页面
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    if (currentUrl && isSupportedDomain(currentUrl)) {
      document.querySelector('.content p').textContent = '✅ 已检测到智慧树页面';
      document.querySelector('.content p').style.color = '#4CAF50';
    } else {
      document.querySelector('.content p').textContent = '⚠️ 请在智慧树页面使用此插件';
      document.querySelector('.content p').style.color = '#ff9800';
    }
  });
  
  actionBtn.addEventListener('click', function() {
    // 向当前标签页发送消息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      if (!currentUrl || !isSupportedDomain(currentUrl)) {
        alert('请在智慧树页面使用此功能！');
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'testAction',
        data: 'Hello from popup!'
      }, function(response) {
        if (response) {
          console.log('Response from content script:', response);
          alert('操作成功！');
        }
      });
    });
  });
  
  // 加载保存的设置
  chrome.storage.sync.get(['settings'], function(result) {
    console.log('Loaded settings:', result.settings);
  });
});
