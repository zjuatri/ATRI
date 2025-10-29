// 页面拦截器 - 在页面全局作用域运行
(function() {
  console.log('📡 [page-interceptor] Fetch 拦截器已注入到页面全局作用域');
  console.log('📍 [page-interceptor] 当前时间:', new Date().toISOString());
  console.log('📍 [page-interceptor] 当前 URL:', window.location.href);
  
  // 设置一个标记，表示拦截器已就绪
  window.__INTERCEPTOR_READY__ = true;
  console.log('✅ [page-interceptor] 拦截器就绪标记已设置');
  
  // 保存原始的 fetch 函数
  const originalFetch = window.fetch;
  
  // 重写 fetch 函数
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
    console.log('🌐 [page-interceptor] Fetch 请求:', url);
    
    // 调用原始 fetch
    const response = await originalFetch.apply(this, args);
    
    // 检查是否是考试开始请求
    if (url && url.includes('aistudy.zhihuishu.com/gateway/t/v1/exam/start')) {
      console.log('🎯 [page-interceptor] 拦截到 exam/start 请求!');
      console.log('📥 [page-interceptor] 响应状态:', response.status);
      
      // 克隆响应以便读取
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        console.log('📦 [page-interceptor] exam/start 响应数据:', data);
        console.log('📝 [page-interceptor] 题目数量:', data.data?.questions?.length || 0);
        
        // 如果有题目数据，发送给 content script
        if (data.code === 200 && data.data && data.data.questions) {
          console.log('✅ [page-interceptor] 发送 EXAM_DATA_INTERCEPTED 消息');
          window.postMessage({
            type: 'EXAM_DATA_INTERCEPTED',
            data: data.data
          }, '*');
        } else {
          console.warn('⚠️ [page-interceptor] 响应数据格式不正确:', data);
        }
      } catch (e) {
        console.error('❌ [page-interceptor] 解析响应失败:', e);
      }
    }
    
    // 检查是否是获取用户答案请求（答题分析页面）
    if (url && url.includes('aistudy.zhihuishu.com/gateway/t/v1/exam/getUserAnswers')) {
      console.log('🎯 [page-interceptor] 拦截到 getUserAnswers 请求!');
      console.log('📥 [page-interceptor] 响应状态:', response.status);
      
      // 克隆响应以便读取
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        console.log('📦 答题分析数据:', data);
        
        // 如果有题目数据，发送给 content script
        if (data.code === 200 && data.data && data.data.questions) {
          console.log('📝 发送答题分析数据，题目数量:', data.data.questions.length);
          window.postMessage({
            type: 'USER_ANSWERS_INTERCEPTED',
            data: data.data
          }, '*');
        }
      } catch (e) {
        console.error('❌ 解析答题分析响应失败:', e);
      }
    }
    
    return response;
  };
  
  // 同样拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalOpen.call(this, method, url, ...rest);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      // 拦截考试开始请求
      if (this._url && this._url.includes('aistudy.zhihuishu.com/gateway/t/v1/exam/start')) {
        console.log('✅ XHR 拦截到考试请求:', this._url);
        
        try {
          const data = JSON.parse(this.responseText);
          console.log('📦 考试数据 (XHR):', data);
          
          if (data.code === 200 && data.data && data.data.questions) {
            console.log('📝 发送题目数据 (XHR)，题目数量:', data.data.questions.length);
            window.postMessage({
              type: 'EXAM_DATA_INTERCEPTED',
              data: data.data
            }, '*');
          }
        } catch (e) {
          console.error('❌ 解析 XHR 响应失败:', e);
        }
      }
      
      // 拦截获取用户答案请求
      if (this._url && this._url.includes('aistudy.zhihuishu.com/gateway/t/v1/exam/getUserAnswers')) {
        console.log('✅ XHR 拦截到答题分析请求:', this._url);
        
        try {
          const data = JSON.parse(this.responseText);
          console.log('📦 答题分析数据 (XHR):', data);
          
          if (data.code === 200 && data.data && data.data.questions) {
            console.log('📝 发送答题分析数据 (XHR)，题目数量:', data.data.questions.length);
            window.postMessage({
              type: 'USER_ANSWERS_INTERCEPTED',
              data: data.data
            }, '*');
          }
        } catch (e) {
          console.error('❌ 解析 XHR 答题分析响应失败:', e);
        }
      }
    });
    
    return originalSend.apply(this, args);
  };
  
  console.log('✅ Fetch 和 XHR 拦截器设置完成');
})();
