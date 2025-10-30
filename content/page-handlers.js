// 页面处理模块 - 处理不同页面的特定逻辑

// 查找并点击下一个未完成的题目（mastery 页面）
function findAndClickNextUncompleted() {
  // 确保在 mastery 页面
  if (!isPageType('mastery')) {
    console.log('⚠️ 不在 mastery 页面，无法查找未完成的题目');
    if (window.stopAutoAnswering) window.stopAutoAnswering();
    return false;
  }
  
  const customContentDivs = document.querySelectorAll('div.custom-content');
  console.log('🔍 找到 custom-content div 数量:', customContentDivs.length);
  
  for (let i = 0; i < customContentDivs.length; i++) {
    const div = customContentDivs[i];
    
    // 查找 class 为 text 的 div
    const textDiv = div.querySelector('div.text');
    if (textDiv) {
      const span = textDiv.querySelector('span');
      if (span) {
        const text = span.textContent.trim();
        console.log(`📊 第 ${i + 1} 个题目进度:`, text);
        
        // 如果不是 100%，点击对应的按钮
        if (text !== '100%') {
          const button = div.querySelector('button');
          if (button) {
            console.log(`✅ 找到未完成的题目 (${i + 1})，进度: ${text}，准备点击按钮`);
            button.click();
            return true;
          }
        }
      }
    }
  }
  
  console.log('⚠️ 所有题目都已完成 100%');
  if (window.stopAutoAnswering) window.stopAutoAnswering();
  showNotification('🎉 所有题目都已完成！', 'success');
  return false;
}

// 处理 pointOfMastery 页面
function handlePointOfMasteryPage() {
  const currentUrl = window.location.href;
  console.log('🔍 [pointOfMastery] 当前页面 URL:', currentUrl);
  
  // 检查是否在 pointOfMastery 页面
  if (!isPageType('pointOfMastery', currentUrl)) {
    console.warn('⚠️ 不在 pointOfMastery 页面，等待跳转...');
    setTimeout(() => {
      if (window.isAutoAnswering) {
        handlePointOfMasteryPage();
      }
    }, 2000);
    return;
  }
  
  console.log('✅ [pointOfMastery] 已进入页面');
  console.log('🔍 [pointOfMastery] 开始查找 charts-label-rate...');
  
  // 查找 class="charts-label-rate" 的 div
  const chartsLabelRate = document.querySelector('div.charts-label-rate');
  
  if (!chartsLabelRate) {
    console.warn('⚠️ [pointOfMastery] 未找到 charts-label-rate，2秒后重试...');
    console.log('💡 [pointOfMastery] 提示：检查页面是否完全加载');
    
    // 列出页面上所有的 div
    const allDivs = document.querySelectorAll('div[class*="chart"]');
    console.log('🔍 [pointOfMastery] 找到包含 chart 的 div:', allDivs.length);
    allDivs.forEach((div, i) => {
      console.log(`  - div ${i}: class="${div.className}"`);
    });
    
    setTimeout(() => {
      if (window.isAutoAnswering) {
        handlePointOfMasteryPage();
      }
    }, 2000);
    return;
  }
  
  const rateText = chartsLabelRate.textContent.trim();
  console.log('📊 [pointOfMastery] 找到进度元素！');
  console.log('📊 [pointOfMastery] 当前进度:', `"${rateText}"`);
  console.log('📊 [pointOfMastery] 进度类型:', typeof rateText);
  console.log('📊 [pointOfMastery] 进度长度:', rateText.length);
  
  // 检查进度是否为 100%（文本可能是 "100%" 或 " 100%" 等格式）
  const isComplete = rateText.includes('100') && rateText.includes('%');
  console.log('📊 [pointOfMastery] 是否完成 100%:', isComplete);
  
  // 如果进度是 100%，点击 backup 返回 mastery 页面
  if (isComplete) {
    console.log('🎉 进度已达 100%，点击返回按钮');
    const backupDiv = document.querySelector('div.backup');
    
    if (backupDiv) {
      backupDiv.click();
      console.log('✅ 已点击返回按钮，等待跳转到 mastery 页面...');
      
      // 等待跳转后继续寻找未完成的题目
      setTimeout(() => {
        if (window.isAutoAnswering) {
          console.log('🔄 返回 mastery 页面，继续寻找未完成题目...');
          // 重置计数器
          window.answerCounter = 1;
          window.currentExamQuestions = [];
          
          // 等待页面加载完成
          setTimeout(() => {
            if (window.isAutoAnswering) {
              findAndClickNextUncompleted();
            }
          }, 2000);
        }
      }, 2000);
    } else {
      console.error('❌ 未找到 backup 按钮');
      if (window.stopAutoAnswering) window.stopAutoAnswering();
    }
  } else {
    // 进度未达 100，点击 line1-count-link 进入答题分析
    console.log('📝 [pointOfMastery] 进度未达 100%，准备点击查看分析按钮');
    console.log('🔍 [pointOfMastery] 开始查找 line1-count-link...');
    
    const line1CountLink = document.querySelector('div.line1-count-link');
    
    if (!line1CountLink) {
      console.error('❌ [pointOfMastery] 未找到 line1-count-link 按钮');
      console.log('💡 [pointOfMastery] 开始查找所有可能的按钮...');
      
      // 列出所有包含 link 或 count 的 div
      const allDivs = document.querySelectorAll('div[class*="line"], div[class*="count"], div[class*="link"]');
      console.log(`🔍 [pointOfMastery] 找到 ${allDivs.length} 个可能的 div:`);
      allDivs.forEach((div, i) => {
        console.log(`  - div ${i}:`, {
          className: div.className,
          text: div.textContent.trim().substring(0, 50),
          visible: div.offsetParent !== null
        });
      });
      
      // 尝试查找所有 div 并按文本内容匹配
      const allButtons = document.querySelectorAll('div');
      const possibleButtons = Array.from(allButtons).filter(div => {
        const text = div.textContent.trim();
        return text.includes('继续') || text.includes('练习') || text.includes('查看') || text.includes('分析');
      });
      console.log(`🔍 [pointOfMastery] 找到 ${possibleButtons.length} 个包含关键字的 div:`);
      possibleButtons.slice(0, 5).forEach((div, i) => {
        console.log(`  - 可能按钮 ${i}:`, {
          className: div.className,
          text: div.textContent.trim().substring(0, 50)
        });
      });
      
      if (window.stopAutoAnswering) window.stopAutoAnswering();
      return;
    }
    
    console.log('✅ [pointOfMastery] 找到 line1-count-link 按钮');
    console.log('📋 [pointOfMastery] 按钮信息:', {
      className: line1CountLink.className,
      text: line1CountLink.textContent.trim(),
      visible: line1CountLink.offsetParent !== null,
      display: window.getComputedStyle(line1CountLink).display
    });
    
    console.log('👆 [pointOfMastery] 准备点击按钮...');
    line1CountLink.click();
    console.log('✅ [pointOfMastery] 已执行 click()');
    
    // 也尝试触发其他事件
    try {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      line1CountLink.dispatchEvent(clickEvent);
      console.log('✅ [pointOfMastery] 已触发 MouseEvent');
    } catch (e) {
      console.warn('⚠️ [pointOfMastery] 触发事件失败:', e);
    }
    
    console.log('⏳ [pointOfMastery] 等待页面跳转...');
    
    if (line1CountLink) {
      line1CountLink.click();
      console.log('✅ 已点击查看分析，等待跳转到 examAnalysis 页面...');
      
      // 等待跳转到 examAnalysis 页面
      // getUserAnswers 请求会被拦截，然后调用 handleUserAnswersData
      // handleUserAnswersData 会更新答案并点击提交
      setTimeout(() => {
        const currentUrl = window.location.href;
        console.log('🔍 [pointOfMastery] 跳转后的 URL:', currentUrl);
        
        if (isPageType('examAnalysis', currentUrl)) {
          console.log('✅ 已跳转到 examAnalysis 页面，等待数据拦截...');
          // 数据会在拦截器中自动处理
        } else if (isPageType('exam', currentUrl)) {
          console.log('⚠️ 直接跳转到了 exam 页面（可能是新题目）');
          // 重置计数器并开始答题
          window.answerCounter = 1;
          window.currentExamQuestions = [];
          
          // 等待题目数据加载
          if (window.isAutoAnswering) {
            console.log('⏳ 等待题目数据加载...');
          }
        } else {
          console.warn('⚠️ 跳转到了未知页面，2秒后重试检测');
          setTimeout(() => {
            if (window.isAutoAnswering) {
              const retryUrl = window.location.href;
              if (isPageType('examAnalysis', retryUrl)) {
                console.log('✅ 延迟检测：已在 examAnalysis 页面');
              } else if (isPageType('exam', retryUrl)) {
                console.log('✅ 延迟检测：已在 exam 页面');
                window.answerCounter = 1;
              }
            }
          }, 2000);
        }
      }, 2000);
    } else {
      console.error('❌ 未找到查看分析按钮');
      if (window.stopAutoAnswering) window.stopAutoAnswering();
    }
  }
}

// 处理用户答案数据（examAnalysis 页面）
function handleUserAnswersData(data) {
  console.log('📊 [examAnalysis] 处理答题分析数据');
  
  if (!data || !data.questions) {
    console.error('❌ 数据格式错误');
    return;
  }
  
  if (!window.currentExamParams || !window.currentExamParams.fileName) {
    console.error('❌ 缺少考试参数，无法更新答案');
    console.error('   currentExamParams:', window.currentExamParams);
    showNotification('❌ 缺少考试参数', 'error');
    return;
  }
  
  const questions = data.questions;
  console.log('📝 总题目数:', questions.length);
  console.log('📋 题库文件:', window.currentExamParams.fileName);
  
  // 输出所有题目的答题情况，帮助调试
  console.log('📋 所有题目的答题情况:');
  questions.forEach((q, index) => {
    const isCorrect = q.userAnswerVo?.isCorrect;
    const answer = q.userAnswerVo?.answer;
    console.log(`  ${index + 1}. 题目 ${q.questionId}: isCorrect=${isCorrect}, answer=${answer}`);
  });
  
  // 找出所有答错的题目 (isCorrect 在 userAnswerVo 里)
  const wrongQuestions = questions.filter(q => q.userAnswerVo?.isCorrect === 2);
  console.log('❌ 答错的题目数:', wrongQuestions.length);
  
  if (wrongQuestions.length > 0) {
    console.log('📝 准备更新错误答案...');
    console.log('📋 当前题库文件名:', window.currentExamParams?.fileName);
    
    // 为每个错题更新答案
    // 注意：answer 是选项的 id（字符串），不是数字
    // 我们需要从选项列表中找到当前答案的 sort，然后 +1
    const updateList = wrongQuestions.map(q => {
      const currentAnswerId = q.userAnswerVo.answer;
      const currentOption = q.optionVos.find(opt => opt.id.toString() === currentAnswerId.toString());
      const currentSort = currentOption ? currentOption.sort : 1;
      const newSort = currentSort >= q.optionVos.length ? 1 : currentSort + 1;
      
      return {
        questionId: q.questionId,
        currentAnswer: currentSort,
        newAnswer: newSort
      };
    });
    
    console.log('📝 更新列表:', updateList);
    
    wrongQuestions.forEach((q, index) => {
      const update = updateList[index];
      console.log(`  ${index + 1}. 题目 ${q.questionId}: 当前答案序号 ${update.currentAnswer} → 更新为 ${update.newAnswer}`);
    });
    
    // 发送更新请求到 background
    safeSendMessage({
      action: 'updateAnswers',
      fileName: window.currentExamParams?.fileName,
      updates: updateList
    }).then(response => {
      console.log('📬 收到更新答案响应:', response);
      if (response && response.success) {
        console.log('✅ 答案更新完成，更新了', response.updatedCount, '题');
        
        // 🔥 输出更新后的题库状态
        if (response.examFile && response.examFile.questions) {
          console.log('📚 更新后的题库状态:');
          console.log('   文件名:', response.examFile.fileName);
          console.log('   总题目数:', response.examFile.totalQuestions);
          console.log('   更新时间:', response.examFile.updatedAt);
          
          // 输出所有更新的题目的新答案
          updateList.forEach(update => {
            const updatedQ = response.examFile.questions[update.questionId];
            if (updatedQ) {
              console.log(`   ✓ 题目 ${update.questionId}: 答案已更新为 ${updatedQ.answer}`);
            }
          });
          
          // 更新本地的 examFile
          window.currentExamFile = response.examFile;
          console.log('💾 已更新本地题库缓存');
        }
        
        showNotification(`✅ 已更新 ${response.updatedCount} 题答案`, 'success');
        
        // 等待一下再点击提交，确保数据已保存
        setTimeout(() => {
          if (window.isAutoAnswering) {
            clickSubmitInAnalysisPage();
          }
        }, 1000);
      } else {
        console.error('❌ 答案更新失败:', response);
      }
    }).catch(err => {
      console.error('❌ 发送更新请求失败:', err);
    });
  } else {
    console.log('✅ 所有题目都答对了！');
    showNotification('🎉 全部正确！', 'success');
    
    // 等待一下再点击提交
    setTimeout(() => {
      if (window.isAutoAnswering) {
        clickSubmitInAnalysisPage();
      }
    }, 1000);
  }
}

// 点击 examAnalysis 页面的提交按钮
function clickSubmitInAnalysisPage() {
  console.log('🔍 [examAnalysis] 查找提交按钮...');
  console.log('📍 当前页面 URL:', window.location.href);
  
  // 尝试多种选择器
  const selectors = [
    'div.submit',
    '.submit',
    'div[class*="submit"]',
    'button.submit',
    'div.confirm',
    '.confirm',
    'div.next',
    '.next'
  ];
  
  let submitElement = null;
  
  for (const selector of selectors) {
    submitElement = document.querySelector(selector);
    if (submitElement) {
      console.log(`✅ 找到提交元素 (${selector}):`, submitElement);
      break;
    }
  }
  
  if (submitElement) {
    console.log('🎯 准备点击提交按钮');
    console.log('按钮文本:', submitElement.textContent);
    console.log('按钮类名:', submitElement.className);
    
    // 尝试多种点击方式
    try {
      // 方式1: 直接点击
      submitElement.click();
      console.log('✅ 已执行 click()');
      
      // 方式2: 触发鼠标事件
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      submitElement.dispatchEvent(clickEvent);
      console.log('✅ 已触发 MouseEvent');
      
      // 方式3: 如果是 div，尝试查找内部的 button
      const innerButton = submitElement.querySelector('button');
      if (innerButton) {
        console.log('🔍 找到内部 button，点击');
        innerButton.click();
      }
      
    } catch (e) {
      console.error('❌ 点击失败:', e);
    }
    
    // 点击后会跳转回考试页面，等待页面加载
    setTimeout(() => {
      if (window.isAutoAnswering) {
        console.log('⏳ [examAnalysis] 等待跳转回考试页面...');
        console.log('📊 [examAnalysis] 当前 URL:', window.location.href);
        console.log('📊 [examAnalysis] currentExamQuestions:', window.currentExamQuestions?.length);
        
        // 重置计数器
        window.answerCounter = 1;
        console.log('🔄 [examAnalysis] 已重置计数器');
        
        // 清空题目数据，等待刷新后重新拦截
        console.log('� [examAnalysis] 清空题目数据，准备刷新页面');
        window.currentExamQuestions = [];
        
        // 等待跳转回考试页面
        setTimeout(() => {
          const currentUrl = window.location.href;
          console.log('📍 [examAnalysis] 检查当前 URL:', currentUrl);
          
          if (isPageType('exam', currentUrl) && window.isAutoAnswering) {
            console.log('✅ [examAnalysis] 已回到考试页面，准备刷新');
            
            // 刷新页面以重新发送 exam/start 请求
            setTimeout(() => {
              console.log('� [examAnalysis] 刷新页面以获取新题目...');
              window.location.reload();
            }, 500);
          } else {
            console.log('⚠️ [examAnalysis] 未回到考试页面或自动答题已停止');
            console.log('   - 当前页面类型:', isPageType('exam', currentUrl) ? 'exam' : '其他');
            console.log('   - 自动答题状态:', window.isAutoAnswering);
          }
        }, 2000);
      }
    }, 1000);
  } else {
    console.error('❌ 未找到提交按钮');
    showNotification('❌ 未找到提交按钮', 'error');
  }
}


