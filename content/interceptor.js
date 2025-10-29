// 拦截器脚本 - 通过加载外部脚本的方式注入到页面全局作用域
(function() {
  'use strict';
  
  // 创建 script 元素，加载外部脚本文件
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/page-interceptor.js');
  script.onload = function() {
    console.log('✅ 页面拦截器脚本已加载');
    this.remove();
  };
  
  // 注入到页面
  (document.head || document.documentElement).appendChild(script);
  
  console.log('✅ 拦截器脚本注入已启动');
})();

