// Background Service Worker
console.log('Background service worker started');

// 存储考试数据
let examDataStore = {};

// 监听插件安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  // 初始化存储
  chrome.storage.sync.set({
    settings: {
      enabled: true,
      version: '1.0.0'
    }
  });
  
  // 加载已保存的考试数据
  chrome.storage.local.get(['examDataStore'], (result) => {
    if (result.examDataStore) {
      examDataStore = result.examDataStore;
      console.log('加载已保存的考试数据:', examDataStore);
    }
  });
});

// 保存考试数据到 storage
function saveExamData() {
  chrome.storage.local.set({ examDataStore }, () => {
    console.log('考试数据已保存');
  });
}

// 获取或创建考试文件数据
function getOrCreateExamFile(fileName) {
  if (!examDataStore[fileName]) {
    examDataStore[fileName] = {
      fileName: fileName,
      questions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('创建新的考试文件:', fileName);
  }
  return examDataStore[fileName];
}

// 更新考试题目数据
function updateExamQuestions(fileName, questions) {
  console.log('📝 开始更新考试题目，文件:', fileName, '题目数量:', questions.length);
  
  const examFile = getOrCreateExamFile(fileName);
  let addedCount = 0;
  
  questions.forEach(question => {
    const questionId = question.questionId;
    
    // 如果题目不存在，添加到文件中
    if (!examFile.questions[questionId]) {
      examFile.questions[questionId] = {
        questionId: questionId,
        answer: 1, // 默认答案为1
        questionName: question.questionName || '',
        questionType: question.questionType || null,
        options: question.optionVos || [],
        addedAt: new Date().toISOString()
      };
      addedCount++;
      console.log(`➕ 新增题目 ${questionId}:`, examFile.questions[questionId]);
    } else {
      console.log(`⏭️ 题目 ${questionId} 已存在，跳过`);
    }
  });
  
  examFile.updatedAt = new Date().toISOString();
  examFile.totalQuestions = Object.keys(examFile.questions).length;
  
  // 保存到 storage
  saveExamData();
  
  console.log(`✅ 文件 ${fileName} 更新完成，新增 ${addedCount} 题，总计 ${examFile.totalQuestions} 题`);
  
  return {
    fileName,
    addedCount,
    totalQuestions: examFile.totalQuestions,
    examFile
  };
}

// 监听网络请求，拦截特定URL
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = details.url;
    
    // 检查是否是目标URL
    if (url.includes('aistudy.zhihuishu.com/gateway/t/v1/exam/start')) {
      console.log('截获目标请求:', url);
      
      // 解析URL参数
      try {
        const urlObj = new URL(url);
        const secretStr = urlObj.searchParams.get('secretStr');
        const dateFormate = urlObj.searchParams.get('dateFormate');
        
        console.log('secretStr:', secretStr);
        console.log('dateFormate:', dateFormate);
        
        // 发送消息给content script显示参数
        if (secretStr) {
          chrome.tabs.sendMessage(details.tabId, {
            action: 'showSecretStr',
            secretStr: secretStr,
            dateFormate: dateFormate,
            fullUrl: url
          }).catch(err => console.log('Message send error:', err));
        }
        
        // 如果请求有body，尝试解析响应数据
        // 注意: onBeforeRequest 无法直接获取响应体，需要使用其他方法
        // 我们将在下面使用 fetch 监听来处理响应数据
        
      } catch (e) {
        console.error('解析URL失败:', e);
      }
    }
  },
  {
    urls: [
      "https://aistudy.zhihuishu.com/gateway/t/v1/exam/start*"
    ]
  }
);

// 监听来自 content script 或 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  if (request.action === 'getData') {
    // 处理数据请求
    sendResponse({ success: true, data: 'Data from background' });
  }
  
  if (request.action === 'initExamFile') {
    // 初始化考试文件
    const fileName = request.params.fileName;
    const examFile = getOrCreateExamFile(fileName);
    console.log('初始化考试文件:', fileName, examFile);
    sendResponse({ success: true, examFile });
  }
  
  if (request.action === 'processExamData') {
    // 处理考试数据
    console.log('📥 收到处理考试数据请求:', request);
    const { fileName, questions } = request;
    const result = updateExamQuestions(fileName, questions);
    sendResponse({ success: true, result });
    
    // 通知 content script 数据已处理
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'examDataProcessed',
        result
      }).catch(err => console.log('⚠️ 通知失败:', err));
    }
  }
  
  if (request.action === 'getExamFile') {
    // 获取考试文件数据
    const fileName = request.fileName;
    const examFile = examDataStore[fileName] || null;
    sendResponse({ success: true, examFile });
  }
  
  if (request.action === 'downloadExamFile') {
    // 下载JSON文件
    const fileName = request.fileName;
    const examFile = examDataStore[fileName];
    if (examFile) {
      // 转换为简化格式
      const jsonData = Object.values(examFile.questions).map(q => ({
        questionId: q.questionId,
        answer: q.answer
      }));
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true
      });
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: '文件不存在' });
    }
  }
  
  if (request.action === 'clearExamFile') {
    // 清空单个题库文件
    const fileName = request.fileName;
    if (examDataStore[fileName]) {
      examDataStore[fileName] = {
        fileName: fileName,
        questions: {},
        createdAt: examDataStore[fileName].createdAt,
        updatedAt: new Date().toISOString(),
        totalQuestions: 0
      };
      saveExamData();
      console.log('✅ 题库已清空:', fileName);
      sendResponse({ success: true, examFile: examDataStore[fileName] });
    } else {
      sendResponse({ success: false, error: '文件不存在' });
    }
  }
  
  if (request.action === 'clearAllExams') {
    // 清空所有题库
    const count = Object.keys(examDataStore).length;
    examDataStore = {};
    saveExamData();
    console.log(`✅ 已清空所有题库，共 ${count} 个文件`);
    sendResponse({ success: true, clearedCount: count });
  }
  
  if (request.action === 'updateAnswers') {
    // 更新题目答案（答错的题目答案 +1）
    const fileName = request.fileName;
    const updates = request.updates || [];
    
    console.log('📝 收到答案更新请求:', fileName, '需要更新', updates.length, '题');
    
    const examFile = getOrCreateExamFile(fileName);
    let updatedCount = 0;
    
    updates.forEach(update => {
      const questionId = update.questionId;
      const action = update.action;
      
      if (examFile.questions[questionId]) {
        const currentAnswer = examFile.questions[questionId].answer;
        
        if (action === 'increment') {
          // 答案 +1
          const newAnswer = currentAnswer + 1;
          examFile.questions[questionId].answer = newAnswer;
          console.log(`✅ 题目 ${questionId} 答案更新: ${currentAnswer} -> ${newAnswer}`);
          updatedCount++;
        }
      } else {
        console.warn(`⚠️ 题目 ${questionId} 不在题库中，无法更新`);
      }
    });
    
    if (updatedCount > 0) {
      examFile.updatedAt = new Date().toISOString();
      saveExamData();
      console.log(`✅ 成功更新 ${updatedCount} 道题目的答案`);
    }
    
    sendResponse({ 
      success: true, 
      updatedCount: updatedCount,
      examFile: examFile
    });
  }
  
  return true; // 保持消息通道开放以支持异步响应
});
