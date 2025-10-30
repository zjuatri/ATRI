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

// 动态更新悬浮框样式（根据答题状态）
function updateDisplayBoxStyle(box, isAnswering) {
  if (!box) return;
  
  if (isAnswering) {
    // 答题中：使用竖长背景图 background.png (2798x3387, 比例约 1:1.21)
    box.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-image: url('${chrome.runtime.getURL('assets/background.png')}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      color: #1e40af;
      padding: 20px 18px;
      border-radius: 16px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.8);
      cursor: move;
      width: 280px;
      max-height: 90vh;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      user-select: none;
      scrollbar-width: thin;
      scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    `;
  } else {
    // 未答题：使用横长背景图 background2.jpg (2560x980, 比例约 2.6:1)
    box.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-image: url('${chrome.runtime.getURL('assets/background2.jpg')}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      color: #1e40af;
      padding: 18px 20px;
      border-radius: 16px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.8);
      cursor: move;
      width: 420px;
      max-height: 250px;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      user-select: none;
      scrollbar-width: thin;
      scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    `;
  }
}

// 创建浮窗显示框
function createDisplayBox() {
  if (displayBox) return displayBox;
  
  // 检查 body 是否存在
  if (!document.body) {
    console.warn('⚠️ document.body 不存在，延迟创建浮窗');
    return null;
  }
  
  const box = document.createElement('div');
  // 初始样式会在 updateDisplayBoxStyle 中设置
  box.id = 'atri-display-box';
  
  // 设置初始样式
  updateDisplayBoxStyle(box, false); // 初始状态为未答题
  
  // 自定义滚动条样式
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #atri-display-box::-webkit-scrollbar {
      width: 6px;
    }
    #atri-display-box::-webkit-scrollbar-track {
      background: transparent;
    }
    #atri-display-box::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.3);
      border-radius: 3px;
    }
    #atri-display-box::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  `;
  if (!document.head.querySelector('#atri-scrollbar-style')) {
    styleSheet.id = 'atri-scrollbar-style';
    document.head.appendChild(styleSheet);
  }
  
  box.id = 'atri-display-box';
  
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
  
  // 根据答题状态更新样式
  updateDisplayBoxStyle(displayBox, window.isAutoAnswering || false);
  
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
    <div style="margin-bottom: 14px; text-align: center; background: rgba(255, 255, 255, 0.85); padding: 12px 10px; border-radius: 10px; backdrop-filter: blur(8px);">
      <div style="font-weight: 700; font-size: 15px; color: #1e40af; margin-bottom: 4px;">🎓 ATRI</div>
      <div style="font-size: 11px; color: #3b82f6; opacity: 0.85;">高性能智慧树刷题助手</div>
      <div style="font-size: 10px; color: #60a5fa; opacity: 0.7; margin-top: 3px;">拖动移动</div>
    </div>
    
    ${isStudyPage ? `
      <div style="margin-bottom: 10px; padding: 10px; background: rgba(255, 255, 255, 0.75); border-radius: 8px; backdrop-filter: blur(5px); border: 1px solid rgba(59, 130, 246, 0.25);">
        <div style="font-size: 11px; font-weight: 600; margin-bottom: 4px; color: #1e40af;">📍 学习页面</div>
        ${isMasteryPage ? `<div style="font-size: 10px; opacity: 0.8; color: #1e40af;">目标按钮: ${buttonStatus}</div>` : ''}
      </div>
    ` : ''}
    
    ${window.isAutoAnswering ? `
      <div style="margin-bottom: 10px; padding: 10px; background: rgba(236, 253, 245, 0.9); border-radius: 8px; backdrop-filter: blur(5px); border: 1.5px solid rgba(34, 197, 94, 0.4);">
        <div style="font-size: 11px; font-weight: 600; color: #15803d;">🤖 自动答题中...</div>
        <div style="font-size: 10px; opacity: 0.85; margin-top: 4px; color: #15803d;">
          进度: ${window.answerCounter || 0} / ${window.currentExamQuestions?.length || 0}
        </div>
      </div>
      <div style="margin-top: 8px;">
        <button id="stopAnsweringBtn" style="
          width: 100%;
          padding: 10px;
          background: rgba(255, 255, 255, 0.9);
          color: #3b82f6;
          border: 2px solid #93c5fd;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
          letter-spacing: 0.5px;
        " onmouseover="this.style.background='rgba(239, 246, 255, 1)'; this.style.borderColor='#60a5fa'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.25)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.borderColor='#93c5fd'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.15)'">
          ⏸️ 停止答题
        </button>
      </div>
    ` : ''}
    
    ${isMasteryPage && !window.isAutoAnswering ? `
      <div style="margin-top: 10px;">
        <button id="autoAnswerToggleBtn" style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          border: 2px solid #93c5fd;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 3px 10px rgba(59, 130, 246, 0.2);
          letter-spacing: 0.5px;
        " onmouseover="this.style.background='linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(59, 130, 246, 0.3)'" onmouseout="this.style.background='linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(59, 130, 246, 0.2)'">
          🚀 开始刷题
        </button>
      </div>
    ` : ''}
    
    <div style="margin-top: 12px; padding: 12px; background: rgba(255, 255, 255, 0.65); border-radius: 10px; backdrop-filter: blur(8px); border: 1px solid rgba(147, 197, 253, 0.3);">
      <button id="showAnswersBtn" style="
        width: 100%;
        padding: 9px;
        background: rgba(255, 255, 255, 0.85);
        color: #2563eb;
        border: 1.5px solid #bfdbfe;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.12);
        margin-bottom: 8px;
        letter-spacing: 0.3px;
      " onmouseover="this.style.background='rgba(239, 246, 255, 1)'; this.style.borderColor='#93c5fd'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.85)'; this.style.borderColor='#bfdbfe'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(59, 130, 246, 0.12)'">
        📋 显示答案 JSON
      </button>
      
      <button id="clearCurrentExamBtn" style="
        width: 100%;
        padding: 9px;
        background: rgba(255, 255, 255, 0.85);
        color: #f59e0b;
        border: 1.5px solid #fcd34d;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.12);
        letter-spacing: 0.3px;
      " onmouseover="this.style.background='rgba(254, 252, 232, 1)'; this.style.borderColor='#fbbf24'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px rgba(245, 158, 11, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.85)'; this.style.borderColor='#fcd34d'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(245, 158, 11, 0.12)'">
        🗂️ 清空当前题库
      </button>
      
      <button id="clearAllAnswersBtn" style="
        width: 100%;
        padding: 9px;
        background: rgba(255, 255, 255, 0.85);
        color: #2563eb;
        border: 1.5px solid #bfdbfe;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.12);
        letter-spacing: 0.3px;
      " onmouseover="this.style.background='rgba(239, 246, 255, 1)'; this.style.borderColor='#93c5fd'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 10px rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.85)'; this.style.borderColor='#bfdbfe'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(59, 130, 246, 0.12)'">
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
  
  // 绑定清空当前题库按钮事件（所有页面）
  const clearCurrentBtn = displayBox.querySelector('#clearCurrentExamBtn');
  if (clearCurrentBtn) {
    clearCurrentBtn.addEventListener('click', () => {
      console.log('🗂️ 用户点击清空当前题库按钮');
      clearCurrentExam();
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

// 清空当前题库
function clearCurrentExam() {
  // 检查是否有当前考试文件名
  const fileName = window.currentExamParams?.fileName;
  
  if (!fileName) {
    showNotification('⚠️ 当前没有考试题库', 'error');
    console.warn('⚠️ 没有找到当前考试的文件名');
    return;
  }
  
  // 确认对话框
  const confirmed = confirm(`⚠️ 确定要清空当前题库吗？\n\n文件名: ${fileName}\n\n此操作无法撤销！`);
  
  if (!confirmed) {
    console.log('❌ 用户取消了清空操作');
    return;
  }
  
  console.log('🗑️ 开始清空当前题库:', fileName);
  
  // 发送清空请求到 background
  safeSendMessage({
    action: 'clearExamFile',
    fileName: fileName
  }).then(response => {
    if (response && response.success) {
      console.log('✅ 当前题库已清空:', fileName);
      showNotification(`✅ 已清空题库: ${fileName}`, 'success');
      
      // 清空本地缓存
      window.currentExamFile = response.examFile;
      
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
