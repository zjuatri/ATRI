// Content Script 主入口 - 消息监听和初始化

console.log('🚀 ZhiHuiShu Content Script Loaded');

// 全局状态变量
window.currentExamParams = null;
window.currentSecretStr = null;
window.currentTimestamp = null;
window.detectedInputs = [];
window.currentExamFile = null;
window.targetButton = null;

// 保存的 recruitAndCourseId (在同一个刷题流程中不变)
window.savedRecruitAndCourseId = null;

// 自动答题相关变量
window.isAutoAnswering = false;
window.answerCounter = 1;
window.autoAnswerInterval = null;
window.currentExamQuestions = [];

// 页面加载时，恢复自动答题状态（仅在特定页面）
(async function restoreAutoAnsweringState() {
  try {
    const result = await chrome.storage.local.get(['isAutoAnswering']);
    if (result.isAutoAnswering) {
      console.log('🔄 [恢复状态] 检测到自动答题状态');
      
      // 只在 exam、pointOfMastery、examAnalysis 页面才恢复状态
      // 在 mastery 页面不自动恢复，需要用户手动点击开始
      const shouldRestore = isPageType('exam') || 
                           isPageType('pointOfMastery') || 
                           isPageType('examAnalysis');
      
      if (shouldRestore) {
        console.log('✅ [恢复状态] 当前页面支持恢复，恢复自动答题状态');
        window.isAutoAnswering = true;
        console.log('📍 [恢复状态] 当前 URL:', window.location.href);
        
        // 如果是考试页面，等待题目数据加载
        if (isPageType('exam')) {
          console.log('📝 [恢复状态] 当前在考试页面，等待题目数据...');
          // autoAnswerInExamPage 会在收到题目数据后自动调用
        }
      } else {
        console.log('ℹ️ [恢复状态] 当前在 mastery 页面，清除自动答题状态');
        // 在 mastery 页面时清除状态，避免显示"自动答题中"
        await chrome.storage.local.set({ isAutoAnswering: false });
        window.isAutoAnswering = false;
      }
    } else {
      console.log('ℹ️ [恢复状态] 无需恢复，当前未启用自动答题');
    }
  } catch (e) {
    console.error('❌ [恢复状态] 恢复状态失败:', e);
  }
})();

// 监听来自页面的消息（拦截器发送的）
window.addEventListener('message', function(event) {
  // 只接受来自同一窗口的消息
  if (event.source !== window) return;
  
  console.log('📨 [content] 收到页面消息:', event.data.type);
  
  if (event.data.type === 'EXAM_DATA_INTERCEPTED') {
    console.log('✅ [content] Content Script 接收到拦截的考试数据:', event.data.data);
    
    const examData = event.data.data;
    const questions = examData.questions || [];
    
    // 保存当前考试的题目列表（按请求中的顺序）
    window.currentExamQuestions = questions;
    console.log('📝 [content] 题目数量:', questions.length);
    console.log('📋 [content] 题目顺序:', window.currentExamQuestions.map(q => q.questionId));
    
    // 重新提取URL参数，确保使用最新的参数 (async)
    extractExamParams().then(params => {
      window.currentExamParams = params;
      console.log('📋 当前考试参数:', window.currentExamParams);
      
      // 如果有当前考试参数，处理题目数据
      if (window.currentExamParams && questions.length > 0) {
        console.log('🚀 发送题目数据到 background 处理...');
        safeSendMessage({
          action: 'processExamData',
          fileName: window.currentExamParams.fileName,
          questions: questions
        }).then(response => {
          if (response && response.success) {
            console.log('✅ 题目数据处理完成:', response.result);
            
            // 🔥 关键：保存题库数据到全局变量
            if (response.result && response.result.examFile) {
              window.currentExamFile = response.result.examFile;
              console.log('💾 [content] 已加载题库数据:', window.currentExamFile);
              console.log('📊 [content] 题库中题目数量:', window.currentExamFile.totalQuestions);
            } else {
              console.warn('⚠️ [content] 返回数据中没有 examFile');
            }
            
            // 如果正在自动答题，开始答题
            if (window.isAutoAnswering) {
              console.log('🤖 [content] 自动答题模式：题库已更新，准备开始答题...');
              console.log('📊 [content] 当前页面 URL:', window.location.href);
              console.log('📋 [content] 题目数量:', window.currentExamQuestions.length);
              console.log('🔢 [content] 计数器值:', window.answerCounter);
              
              setTimeout(() => {
                window.answerCounter = 1;
                console.log('🚀 [content] 重置计数器并调用 autoAnswerInExamPage()');
                autoAnswerInExamPage();
              }, 1500);
            } else {
              console.log('⏸️ [content] 当前未开启自动答题模式');
            }
          } else {
            console.error('❌ 题目数据处理失败:', response);
          }
        }).catch(err => {
          console.error('❌ 发送消息失败:', err.message);
        });
      } else {
        if (!window.currentExamParams) {
          console.warn('⚠️ 当前考试参数未初始化，无法处理题目数据');
          console.warn('⚠️ 当前URL:', window.location.href);
        }
        if (questions.length === 0) {
          console.warn('⚠️ 没有题目数据');
        }
      }
    }).catch(err => {
      console.error('❌ 提取URL参数失败:', err);
    });
  }
  
  // 拦截 getUserAnswers 响应（答题分析页面）
  if (event.data.type === 'USER_ANSWERS_INTERCEPTED') {
    console.log('✅ 接收到答题分析数据:', event.data.data);
    handleUserAnswersData(event.data.data);
  }
});

// 检查当前页面域名并初始化
if (isSupportedDomain()) {
  console.log('✅ 智慧树页面检测成功:', window.location.href);
  
  // 如果是考试页面，检测所有 input 组件并提取URL参数
  if (isPageType('exam')) {
    console.log('📝 检测到考试页面，开始扫描 input 组件');
    
    // 提取URL参数 (async)
    extractExamParams().then(params => {
      window.currentExamParams = params;
      console.log('📋 [init] 考试参数:', window.currentExamParams);
    });
    
    // 监听URL变化（用于单页应用导航）
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('🔄 URL 已变化:', currentUrl);
        lastUrl = currentUrl;
        
        if (isPageType('exam', currentUrl)) {
          // 重新提取参数 (async)
          extractExamParams().then(params => {
            window.currentExamParams = params;
          });
          
          // 如果正在自动答题，开始答题
          if (window.isAutoAnswering) {
            console.log('🚀 检测到进入 exam 页面，准备答题');
            console.log('📊 当前题目数据状态:', window.currentExamQuestions?.length || 0, '题');
            
            setTimeout(() => {
              window.answerCounter = 1;
              
              // 如果已有题目数据，直接开始答题
              if (window.currentExamQuestions && window.currentExamQuestions.length > 0) {
                console.log('✅ 题目数据已存在，立即开始答题');
                autoAnswerInExamPage();
              } else {
                console.log('⏳ 等待题目数据拦截...');
                // 题目数据会在拦截到请求后自动触发答题
              }
            }, 2000);
          }
        } else if (isPageType('pointOfMastery', currentUrl)) {
          // 跳转到 pointOfMastery 页面，处理进度检查
          if (window.isAutoAnswering) {
            console.log('🔄 检测到跳转到 pointOfMastery 页面');
            setTimeout(() => {
              handlePointOfMasteryPage();
            }, 2000);
          }
        } else if (isPageType('examAnalysis', currentUrl)) {
          // 跳转到 examAnalysis 页面，等待答题分析数据
          if (window.isAutoAnswering) {
            console.log('🔄 检测到跳转到 examAnalysis 页面，等待数据加载...');
            // 数据会在拦截到 getUserAnswers 请求后自动处理
          }
        }
      }
    });
    
    urlObserver.observe(document, { subtree: true, childList: true });
    
    // 同时监听 popstate 和 hashchange 事件
    window.addEventListener('popstate', () => {
      console.log('🔄 popstate 事件触发');
      const currentUrl = window.location.href;
      if (isPageType('exam', currentUrl)) {
        extractExamParams().then(params => {
          window.currentExamParams = params;
        });
      } else if (isPageType('pointOfMastery', currentUrl) && window.isAutoAnswering) {
        setTimeout(() => {
          handlePointOfMasteryPage();
        }, 2000);
      } else if (isPageType('examAnalysis', currentUrl) && window.isAutoAnswering) {
        console.log('🔄 检测到跳转到 examAnalysis 页面（popstate）');
      }
    });
    
    window.addEventListener('hashchange', () => {
      console.log('🔄 hashchange 事件触发');
      const currentUrl = window.location.href;
      if (isPageType('exam', currentUrl)) {
        extractExamParams().then(params => {
          window.currentExamParams = params;
        });
      } else if (isPageType('pointOfMastery', currentUrl) && window.isAutoAnswering) {
        setTimeout(() => {
          handlePointOfMasteryPage();
        }, 2000);
      } else if (isPageType('examAnalysis', currentUrl) && window.isAutoAnswering) {
        console.log('🔄 检测到跳转到 examAnalysis 页面（hashchange）');
      }
    });
    
    setTimeout(() => {
      // 只在考试页面检测 input，examAnalysis 页面不需要
      if (!window.location.href.includes('examAnalysis')) {
        detectInputElements();
      }
    }, 2000);
  }
  
  // 在所有页面显示浮窗
  setTimeout(() => {
    initDisplayBox();
  }, 1000);
  
  // 启动按钮监控（仅在 mastery 页面）
  if (isPageType('mastery')) {
    setTimeout(() => {
      // startButtonMonitor(); // 如果需要监控按钮
    }, 2000);
  }
}

// 监听来自 popup 或 background 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('📨 收到消息:', request);
  
  if (request.action === 'testAction') {
    console.log('收到测试操作:', request.data);
    sendResponse({ success: true, message: '操作成功' });
  }
  
  if (request.action === 'startAutoAnswering') {
    console.log('🚀 收到开始自动答题指令');
    startAutoAnswering();
    sendResponse({ success: true });
  }
  
  if (request.action === 'stopAutoAnswering') {
    console.log('⏸️ 收到停止自动答题指令');
    stopAutoAnswering();
    sendResponse({ success: true });
  }
  
  return true; // 保持消息通道打开
});

console.log('✅ Content Script 初始化完成');
