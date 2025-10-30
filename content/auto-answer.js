// 自动答题模块 - 核心答题逻辑

// 检测页面中的所有 input 元素
function detectInputElements() {
  const inputs = document.querySelectorAll('input');
  
  // 过滤掉父元素有 display: none 的 input
  const visibleInputs = Array.from(inputs).filter(input => {
    // 检查 input 本身和所有父元素的 display 属性
    let element = input;
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none') {
        return false; // 父元素或自身有 display: none，过滤掉
      }
      element = element.parentElement;
    }
    return true; // 可见的 input
  });
  
  // 总是更新检测结果
  console.log(`🔍 检测到 ${visibleInputs.length} 个可见 input 元素（总共 ${inputs.length} 个）`);
  
  window.detectedInputs = visibleInputs.map((input, index) => {
    const info = {
      index: index + 1,
      type: input.type || 'text',
      name: input.name || '',
      id: input.id || '',
      placeholder: input.placeholder || '',
      value: input.value || '',
      className: input.className || '',
      element: input
    };
    
    // 只打印 radio/checkbox 类型的 input
    if (info.type === 'radio' || info.type === 'checkbox') {
      console.log(`  可见 Input ${index + 1}:`, {
        type: info.type,
        id: info.id,
        name: info.name,
        className: info.className,
        placeholder: info.placeholder
      });
    }
    
    return info;
  });
  
  // 更新显示框
  if (window.updateDisplayBoxContent) {
    window.updateDisplayBoxContent();
  }
  
  return window.detectedInputs;
}

// 在考试页面自动答题
async function autoAnswerInExamPage() {
  if (!window.isAutoAnswering) {
    console.log('⏸️ 自动答题已停止');
    return;
  }
  
  console.log(`📝 [autoAnswer] 开始答题流程，当前计数器: ${window.answerCounter}`);
  console.log(`📊 [autoAnswer] 当前题目数据: ${window.currentExamQuestions?.length || 0} 题`);
  
  // 🔥 检查是否已加载题库数据
  if (!window.currentExamFile && window.currentExamParams) {
    console.log('⚠️ 题库数据未加载，尝试从 background 获取...');
    try {
      const response = await safeSendMessage({
        action: 'getExamFile',
        fileName: window.currentExamParams.fileName
      });
      
      if (response && response.success && response.examFile) {
        window.currentExamFile = response.examFile;
        console.log('✅ 已加载题库数据:', window.currentExamFile.totalQuestions, '题');
      } else {
        console.warn('⚠️ 题库数据不存在，将使用默认答案');
      }
    } catch (e) {
      console.error('❌ 加载题库数据失败:', e);
    }
  }
  
  // 检查是否有题目数据
  if (!window.currentExamQuestions || window.currentExamQuestions.length === 0) {
    console.warn('⚠️ 没有题目数据，等待题目加载...');
    console.log('💡 提示: 页面可能已刷新，等待拦截新的考试数据请求');
    
    // 检查拦截器状态
    if (window.__INTERCEPTOR_READY__) {
      console.log('✅ 拦截器已就绪');
    } else {
      console.warn('⚠️ 拦截器可能未就绪，检查 page-interceptor.js 是否已加载');
    }
    
    let waitCount = 0;
    const maxWait = 5;
    
    const waitForData = () => {
      waitCount++;
      console.log(`⏳ 等待题目数据... (${waitCount}/${maxWait})`);
      console.log(`📊 currentExamQuestions.length: ${window.currentExamQuestions?.length || 0}`);
      console.log(`🔍 拦截器状态: ${window.__INTERCEPTOR_READY__ ? '就绪' : '未就绪'}`);
      
      if (window.currentExamQuestions && window.currentExamQuestions.length > 0) {
        console.log('✅ 题目数据已加载，继续答题');
        autoAnswerInExamPage();
      } else if (waitCount < maxWait && window.isAutoAnswering) {
        setTimeout(waitForData, 2000);
      } else {
        console.error('❌ 等待超时，题目数据未加载');
        console.error('💡 可能原因：');
        console.error('   1. 页面未发送 exam/start 请求');
        console.error('   2. 请求已发送但拦截器未捕获');
        console.error('   3. 响应数据格式不符合预期');
        console.error('请检查 Network 面板中是否有 exam/start 请求');
      }
    };
    
    setTimeout(waitForData, 2000);
    return;
  }
  
  // 开始答题流程：点击第一个 item
  console.log('🚀 [autoAnswer] 开始答题流程');
  clickNextQuestion();
}

// 检测并填入答案
async function detectAndFillAnswer() {
  console.log('🔍 [detectAndFill] 开始检测 input 并填入答案');
  
  // 等待100ms让页面稳定
  await delay(100);
  
  // 重新检测 input
  detectInputElements();
  
  // 获取当前题目的ID和答案
  if (!window.currentExamQuestions || window.answerCounter > window.currentExamQuestions.length) {
    console.error('❌ 题目计数器超出范围');
    return;
  }
  
  const currentQuestion = window.currentExamQuestions[window.answerCounter - 1];
  if (!currentQuestion) {
    console.error('❌ 未找到当前题目信息');
    return;
  }
  
  console.log(`📝 当前题目 ${window.answerCounter}:`, currentQuestion.questionId);
  console.log(`💡 题目名称:`, currentQuestion.questionName?.substring(0, 50) + '...');
  
  // 从题库获取答案
  let answer = null;
  if (window.currentExamFile && window.currentExamFile.questions) {
    const questionData = window.currentExamFile.questions[currentQuestion.questionId];
    if (questionData) {
      answer = questionData.answer;
      console.log(`📚 从题库获取答案: ${answer}`);
    }
  }
  
  if (answer === null) {
    console.warn('⚠️ 题库中没有此题答案，使用默认答案 1');
    answer = 1;
  }
  
  // 获取可见的 input
  const visibleInputs = window.detectedInputs.filter(input => {
    const isValidType = input.type === 'radio' || input.type === 'checkbox';
    const isVisible = input.element && document.body.contains(input.element);
    return isValidType && isVisible;
  });
  
  if (visibleInputs.length === 0) {
    console.warn('⚠️ 没有检测到可见的 radio/checkbox input，2秒后重试');
    setTimeout(() => {
      detectAndFillAnswer();
    }, 2000);
    return;
  }
  
  // 填入答案
  console.log(`✅ 填入答案: ${answer} (第 ${answer} 个选项)`);
  fillAnswerOnly(answer);
}

// 只填入答案，不处理后续逻辑
function fillAnswerOnly(answerIndex) {
  // 获取所有可见的 input (radio 或 checkbox 类型)
  const visibleInputs = window.detectedInputs.filter(input => {
    const isValidType = input.type === 'radio' || input.type === 'checkbox';
    const isVisible = input.element && document.body.contains(input.element);
    return isValidType && isVisible;
  });
  
  console.log(`📋 可见的 radio/checkbox input 数量: ${visibleInputs.length}`);
  console.log(`💡 需要填入第 ${answerIndex} 个 input`);
  
  // 点击第 answerIndex 个 input (索引从1开始)
  const targetInput = visibleInputs[answerIndex - 1];
  if (targetInput && targetInput.element) {
    console.log(`✅ 点击第 ${answerIndex} 个 input (类型: ${targetInput.type})`);
    targetInput.element.click();
    
    // 也尝试触发 change 事件
    const changeEvent = new Event('change', { bubbles: true });
    targetInput.element.dispatchEvent(changeEvent);
    
    // 对于 checkbox，可能需要触发 input 事件
    if (targetInput.type === 'checkbox') {
      const inputEvent = new Event('input', { bubbles: true });
      targetInput.element.dispatchEvent(inputEvent);
    }
    
    // 等待1秒后，计数器加一并点击下一题
    setTimeout(() => {
      window.answerCounter++;
      console.log(`📊 计数器更新为: ${window.answerCounter}`);
      clickNextQuestion();
    }, 1000);
  } else {
    console.error(`❌ 第 ${answerIndex} 个 input 不存在，可用 input 数量: ${visibleInputs.length}`);
    // 等待1秒后继续
    setTimeout(() => {
      window.answerCounter++;
      clickNextQuestion();
    }, 1000);
  }
}

// 点击下一题或提交
function clickNextQuestion() {
  console.log(`🔍 [clickNext] 准备点击第 ${window.answerCounter} 题`);
  console.log(`📊 [clickNext] 总题目数: ${window.currentExamQuestions?.length || 0}`);
  
  // 检查是否所有题目都已答完
  if (window.answerCounter > (window.currentExamQuestions?.length || 0)) {
    console.log('🎉 所有题目已答完，点击提交');
    clickSubmitButton();
    return;
  }
  
  // 重新检测所有 div.item
  const allItems = document.querySelectorAll('div.item');
  console.log(`🔍 [clickNext] 找到 ${allItems.length} 个 div.item`);
  
  if (allItems.length === 0) {
    console.error('❌ 没有找到任何 div.item');
    return;
  }
  
  // 点击第 answerCounter 个 item（索引从0开始）
  const targetItem = allItems[window.answerCounter - 1];
  if (targetItem) {
    console.log(`✅ [clickNext] 点击第 ${window.answerCounter} 个 item`);
    targetItem.click();
    
    // 点击后等待检测 input
    setTimeout(() => {
      detectAndFillAnswer();
    }, 500);
  } else {
    console.error(`❌ 第 ${window.answerCounter} 个 item 不存在`);
  }
}

// 点击提交按钮
function clickSubmitButton() {
  console.log('🎯 [submit] 查找提交按钮');
  
  // 查找提交按钮
  const submitButton = document.querySelector('div.submit');
  if (submitButton) {
    console.log('✅ [submit] 找到提交按钮，点击');
    submitButton.click();
    
    // 触发多种事件
    submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    submitButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    submitButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    
    console.log('✅ [submit] 已点击提交按钮');
    console.log('⏳ [submit] 等待跳转到 pointOfMastery 或 examAnalysis 页面...');
    
    // 提交后会跳转，主动监听页面变化
    let checkCount = 0;
    const maxChecks = 20; // 最多检查 20 次（10 秒）
    
    const checkPageChange = setInterval(() => {
      checkCount++;
      const currentUrl = window.location.href;
      console.log(`🔍 [submit] 检查页面变化 (${checkCount}/${maxChecks}):`, currentUrl);
      
      if (isPageType('pointOfMastery', currentUrl)) {
        console.log('✅ [submit] 检测到跳转到 pointOfMastery 页面');
        clearInterval(checkPageChange);
        
        // 等待页面加载完成后处理
        setTimeout(() => {
          if (window.handlePointOfMasteryPage) {
            console.log('🚀 [submit] 调用 handlePointOfMasteryPage');
            window.handlePointOfMasteryPage();
          } else {
            console.error('❌ [submit] handlePointOfMasteryPage 函数不存在');
          }
        }, 1500);
        
      } else if (isPageType('examAnalysis', currentUrl)) {
        console.log('✅ [submit] 检测到跳转到 examAnalysis 页面');
        clearInterval(checkPageChange);
        // examAnalysis 页面会通过拦截器自动处理
        
      } else if (checkCount >= maxChecks) {
        console.warn('⚠️ [submit] 页面未跳转，停止检查');
        clearInterval(checkPageChange);
      }
    }, 500);
    
  } else {
    console.error('❌ [submit] 未找到提交按钮');
  }
}

// 开始自动答题
async function startAutoAnswering() {
  console.log('🚀 [start] 开始自动刷题');
  window.isAutoAnswering = true;
  window.answerCounter = 1;
  window.currentExamQuestions = []; // 重置题目列表
  
  // 保存状态到 storage
  try {
    await chrome.storage.local.set({ isAutoAnswering: true });
    console.log('✅ 自动答题状态已保存到 storage');
  } catch (e) {
    console.error('❌ 保存状态失败:', e);
  }
  
  if (window.updateDisplayBoxContent) {
    window.updateDisplayBoxContent();
  }
  
  // 查找第一个未完成的题目并点击
  if (window.findAndClickNextUncompleted) {
    window.findAndClickNextUncompleted();
  }
}

// 停止自动答题
async function stopAutoAnswering() {
  console.log('⏸️ [stop] 停止自动刷题');
  window.isAutoAnswering = false;
  window.answerCounter = 1;
  window.currentExamQuestions = []; // 清空题目列表
  
  // 清除状态
  try {
    await chrome.storage.local.set({ isAutoAnswering: false });
    console.log('✅ 已清除自动答题状态');
  } catch (e) {
    console.error('❌ 清除状态失败:', e);
  }
  
  if (window.autoAnswerInterval) {
    clearInterval(window.autoAnswerInterval);
    window.autoAnswerInterval = null;
  }
  
  if (window.updateDisplayBoxContent) {
    window.updateDisplayBoxContent();
  }
}
