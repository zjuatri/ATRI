// UI 模块 - 浮窗显示和界面更新

// UI 状态变量
let displayBox = null;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// 创建浮窗显示框
function createDisplayBox() {
  if (displayBox) return displayBox;
  
  // 检查 body 是否存在
  if (!document.body) {
    console.warn('⚠️ document.body 不存在，延迟创建浮窗');
    return null;
  }
  
  const box = document.createElement('div');
  box.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
    color: #1e40af;
    padding: 15px 20px;
    border-radius: 12px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
    border: 2px solid #3b82f6;
    cursor: move;
    min-width: 320px;
    backdrop-filter: blur(10px);
    user-select: none;
  `;
  
  // 添加拖动事件监听
  box.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  document.body.appendChild(box);
  displayBox = box;
  return box;
}

// 拖动开始
function dragStart(e) {
  if (e.target === displayBox || displayBox.contains(e.target)) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
  }
}

// 拖动中
function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    setTranslate(currentX, currentY, displayBox);
  }
}

// 拖动结束
function dragEnd(e) {
  isDragging = false;
}

// 设置位置
function setTranslate(xPos, yPos, el) {
  if (el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
}

// 初始化显示框
function initDisplayBox() {
  const box = createDisplayBox();
  if (box) {
    updateDisplayBoxContent();
  } else {
    // 如果创建失败（body 不存在），等待 DOM 加载后重试
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const box = createDisplayBox();
        if (box) updateDisplayBoxContent();
      });
    } else {
      // DOM 已加载，稍后重试
      setTimeout(() => {
        const box = createDisplayBox();
        if (box) updateDisplayBoxContent();
      }, 100);
    }
  }
}

// 更新显示框的完整内容
function updateDisplayBoxContent() {
  if (!displayBox) return;
  
  const isStudyPage = isPageType('study');
  const isMasteryPage = isPageType('mastery');
  const hasButton = window.targetButton && document.body.contains(window.targetButton);
  const buttonStatus = hasButton ? 
    '<span style="color: #4ade80;">● 已找到</span>' : 
    '<span style="color: #fbbf24;">● 未找到</span>';
  
  const hasSecretStr = window.currentSecretStr !== null;
  const isExamPage = isPageType('exam');
  const hasExamFile = window.currentExamFile !== null;
  
  displayBox.innerHTML = `
    <div style="margin-bottom: 12px; font-weight: 600; font-size: 16px; display: flex; align-items: center; justify-content: space-between; color: #1e40af;">
      <span>🎓 ATRI高性能智慧树刷题助手</span>
      <span style="font-size: 12px; font-weight: normal; opacity: 0.7; color: #3b82f6;">拖动移动</span>
    </div>
    
    ${isStudyPage ? `
      <div style="margin-bottom: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px; color: #1e40af;">📍 学习页面</div>
        ${isMasteryPage ? `<div style="font-size: 11px; opacity: 0.8; color: #1e40af;">目标按钮: ${buttonStatus}</div>` : ''}
      </div>
    ` : ''}
    
    ${!isExamPage && window.detectedInputs && window.detectedInputs.length > 0 ? `
      <div style="margin-bottom: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <div style="font-size: 12px; opacity: 0.9; color: #1e40af;">🎯 检测到 ${window.detectedInputs.length} 个输入框</div>
        <div style="font-size: 11px; opacity: 0.7; margin-top: 4px; color: #1e40af;">
          ${window.detectedInputs.slice(0, 3).map(input => 
            `<div>• ${input.type}: ${input.name || input.id || '未命名'}</div>`
          ).join('')}
          ${window.detectedInputs.length > 3 ? `<div>...还有 ${window.detectedInputs.length - 3} 个</div>` : ''}
        </div>
      </div>
    ` : ''}
    
    ${window.isAutoAnswering ? `
      <div style="margin-top: 8px; padding: 8px; background: rgba(34, 197, 94, 0.15); border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.3);">
        <div style="font-size: 12px; font-weight: 600; color: #15803d;">🤖 自动答题中...</div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px; color: #15803d;">
          当前进度: ${window.answerCounter || 0} / ${window.currentExamQuestions?.length || 0}
        </div>
      </div>
      <div style="margin-top: 8px;">
        <button id="stopAnsweringBtn" style="
          width: 100%;
          padding: 8px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          ⏸️ 停止答题
        </button>
      </div>
    ` : ''}
    
    ${isMasteryPage && !window.isAutoAnswering ? `
      <div style="margin-top: 12px;">
        <button id="autoAnswerToggleBtn" style="
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          🚀 开始刷题
        </button>
      </div>
    ` : ''}
    
    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(59, 130, 246, 0.3);">
      <button id="showAnswersBtn" style="
        width: 100%;
        padding: 8px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        margin-bottom: 6px;
      " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        📋 显示答案 JSON
      </button>
      
      <button id="clearAllAnswersBtn" style="
        width: 100%;
        padding: 8px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        🗑️ 清空所有题库
      </button>
    </div>

  `;
  
  // 绑定停止按钮事件（在所有页面，当正在答题时）
  if (window.isAutoAnswering) {
    const stopBtn = displayBox.querySelector('#stopAnsweringBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        console.log('🛑 用户点击停止答题按钮');
        if (window.stopAutoAnswering) {
          window.stopAutoAnswering();
        }
      });
    }
  }
  
  // 绑定开始刷题按钮事件（仅在 mastery 页面且未在答题时）
  if (isMasteryPage && !window.isAutoAnswering) {
    const toggleBtn = displayBox.querySelector('#autoAnswerToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (window.startAutoAnswering) {
          window.startAutoAnswering();
        }
      });
    }
  }
  
  // 绑定显示答案 JSON 按钮事件（所有页面）
  const showAnswersBtn = displayBox.querySelector('#showAnswersBtn');
  if (showAnswersBtn) {
    showAnswersBtn.addEventListener('click', () => {
      console.log('📋 用户点击显示答案 JSON 按钮');
      showAnswersJSON();
    });
  }
  
  // 绑定清空所有题库按钮事件（所有页面）
  const clearAllBtn = displayBox.querySelector('#clearAllAnswersBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      console.log('🗑️ 用户点击清空所有题库按钮');
      clearAllAnswers();
    });
  }
}

// 清空所有题库
function clearAllAnswers() {
  // 确认对话框
  const confirmed = confirm('⚠️ 确定要清空所有题库吗？\n\n这将删除所有已保存的答案数据，此操作无法撤销！');
  
  if (!confirmed) {
    console.log('❌ 用户取消了清空操作');
    return;
  }
  
  console.log('🗑️ 开始清空所有题库...');
  
  // 发送清空请求到 background
  safeSendMessage({
    action: 'clearAllExams'
  }).then(response => {
    if (response && response.success) {
      console.log(`✅ 所有题库已清空，共清空 ${response.clearedCount || 0} 个文件`);
      showNotification(`✅ 已清空 ${response.clearedCount || 0} 个题库`, 'success');
      
      // 清空本地缓存
      window.currentExamFile = null;
      
      // 更新显示
      updateDisplayBoxContent();
    } else {
      console.error('❌ 清空题库失败:', response);
      showNotification('❌ 清空题库失败', 'error');
    }
  }).catch(err => {
    console.error('❌ 清空题库请求失败:', err);
    showNotification('❌ 清空题库失败', 'error');
  });
}

// 显示答案 JSON
function showAnswersJSON() {
  if (!window.currentExamParams || !window.currentExamParams.fileName) {
    showNotification('⚠️ 未找到考试参数', 'warning');
    console.warn('⚠️ currentExamParams:', window.currentExamParams);
    return;
  }
  
  console.log('📋 请求答案 JSON:', window.currentExamParams.fileName);
  
  // 请求 background 获取答案数据
  safeSendMessage({
    action: 'getAnswerJSON',
    fileName: window.currentExamParams.fileName
  }).then(response => {
    if (response && response.success) {
      const data = response.data;
      console.log('✅ 答案 JSON:', data);
      
      // 创建一个模态窗口显示 JSON
      createJSONModal(data, window.currentExamParams.fileName);
    } else {
      showNotification('❌ 获取答案失败', 'error');
      console.error('❌ 获取答案失败:', response);
    }
  }).catch(err => {
    showNotification('❌ 请求失败', 'error');
    console.error('❌ 请求失败:', err);
  });
}

// 创建 JSON 显示模态窗口
function createJSONModal(data, fileName) {
  // 移除已存在的模态窗口
  const existingModal = document.querySelector('#zhsAnswerModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'zhsAnswerModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 800px;
    max-height: 80vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  `;
  
  const jsonStr = JSON.stringify(data, null, 2);
  const questionCount = data.questions ? Object.keys(data.questions).length : 0;
  
  content.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
      <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        📋 答案 JSON - ${fileName}
      </h3>
      <div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
        题目数量: ${questionCount}
      </div>
    </div>
    
    <div style="flex: 1; overflow: auto; padding: 20px;">
      <pre style="margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.5; color: #1f2937; white-space: pre-wrap; word-break: break-word;">${jsonStr}</pre>
    </div>
    
    <div style="padding: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
      <button id="copyJSONBtn" style="
        padding: 10px 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        📋 复制 JSON
      </button>
      <button id="closeModalBtn" style="
        padding: 10px 20px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        关闭
      </button>
    </div>
  `;
  
  modal.appendChild(content);
  
  if (document.body) {
    document.body.appendChild(modal);
  }
  
  // 绑定关闭按钮
  const closeBtn = content.querySelector('#closeModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // 绑定复制按钮
  const copyBtn = content.querySelector('#copyJSONBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(jsonStr).then(() => {
        showNotification('✅ JSON 已复制到剪贴板', 'success');
        copyBtn.textContent = '✅ 已复制';
        setTimeout(() => {
          copyBtn.textContent = '📋 复制 JSON';
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        showNotification('❌ 复制失败', 'error');
      });
    });
  }
}

// 显示通知消息
function showNotification(message, type = 'info', duration = 3000) {
  // 检查 body 是否存在
  if (!document.body) {
    console.log('📢 通知:', message);
    return;
  }
  
  const notification = document.createElement('div');
  
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (document.body && notification.parentNode === document.body) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;

// 安全地添加样式到页面
if (document.head) {
  document.head.appendChild(style);
} else {
  // 如果 document.head 还不存在，等待 DOM 加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(style);
    });
  } else {
    // 作为备选，尝试添加到 documentElement
    (document.documentElement || document.body).appendChild(style);
  }
}
