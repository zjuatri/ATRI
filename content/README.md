# Content Scripts 文件结构说明

## 📁 文件组织

原来的 `content.js` (1643 行) 已经被拆分成 6 个模块化文件：

### 1. **interceptor.js** (原有文件)
- **作用**: 注入页面拦截器脚本
- **职责**: 加载 `page-interceptor.js` 到页面全局作用域

### 2. **utils.js** (~100 行)
- **作用**: 工具函数和辅助方法
- **包含**:
  - `SUPPORTED_DOMAINS` - 支持的域名列表
  - `isSupportedDomain()` - 检查域名
  - `isPageType()` - 检查页面类型
  - `extractExamParams()` - 提取URL参数
  - `waitForElement()` - 等待元素出现
  - `delay()` - 延迟执行
  - `safeSendMessage()` - 安全发送Chrome消息

### 3. **ui.js** (~200 行)
- **作用**: UI 相关功能
- **包含**:
  - `createDisplayBox()` - 创建浮窗
  - `updateDisplayBoxContent()` - 更新浮窗内容
  - `showNotification()` - 显示通知消息
  - 拖动相关函数
  - CSS 动画样式

### 4. **auto-answer.js** (~300 行)
- **作用**: 自动答题核心逻辑
- **包含**:
  - `detectInputElements()` - 检测输入框
  - `autoAnswerInExamPage()` - 自动答题主流程
  - `detectAndFillAnswer()` - 检测并填入答案
  - `fillAnswerOnly()` - 填入答案
  - `clickNextQuestion()` - 点击下一题
  - `clickSubmitButton()` - 点击提交
  - `startAutoAnswering()` - 开始答题
  - `stopAutoAnswering()` - 停止答题

### 5. **page-handlers.js** (~300 行)
- **作用**: 处理不同页面的特定逻辑
- **包含**:
  - `findAndClickNextUncompleted()` - mastery 页面：查找未完成题目
  - `handlePointOfMasteryPage()` - pointOfMastery 页面处理
  - `handleUserAnswersData()` - examAnalysis 页面：处理答题分析
  - `clickSubmitInAnalysisPage()` - examAnalysis 页面：点击提交

### 6. **content-main.js** (~250 行)
- **作用**: 主入口文件
- **包含**:
  - 全局状态变量初始化
  - 消息监听 (来自拦截器和扩展)
  - URL 变化监听
  - 页面初始化逻辑
  - 状态恢复

## 🔄 加载顺序

在 `manifest.json` 中，脚本按以下顺序加载：

```json
"js": [
  "content/interceptor.js",      // 1. 注入拦截器
  "content/utils.js",            // 2. 工具函数 (其他模块依赖)
  "content/ui.js",               // 3. UI 模块
  "content/auto-answer.js",      // 4. 答题逻辑
  "content/page-handlers.js",    // 5. 页面处理
  "content/content-main.js"      // 6. 主入口 (调用其他模块)
]
```

## 📊 模块依赖关系

```
content-main.js (主入口)
    ├── utils.js (工具函数)
    ├── ui.js (UI 显示)
    ├── auto-answer.js (答题逻辑)
    │   ├── utils.js
    │   └── ui.js
    └── page-handlers.js (页面处理)
        ├── utils.js
        ├── ui.js
        └── auto-answer.js
```

## 🎯 优势

1. **可维护性**: 每个文件职责单一，易于理解和修改
2. **可读性**: 文件行数控制在 100-300 行之间
3. **可测试性**: 独立模块便于单元测试
4. **可扩展性**: 添加新功能只需修改对应模块
5. **协作友好**: 多人可同时编辑不同模块

## ⚠️ 注意事项

1. **加载顺序很重要**: 必须先加载 `utils.js`，因为其他模块依赖它
2. **全局变量**: 使用 `window.` 前缀来共享状态
3. **函数调用**: 模块间可以直接调用函数（已在全局作用域）
4. **Chrome API**: 只有 content script 才能访问 Chrome API

## 🔧 旧文件处理

原 `content/content.js` 文件已被拆分，建议：
- 保留作为备份（重命名为 `content.js.backup`）
- 或者直接删除

## 📝 未来改进

可以考虑进一步优化：
1. 使用 ES6 模块 (需要配置 type="module")
2. 使用 TypeScript 增加类型安全
3. 使用打包工具 (webpack/rollup) 进行模块打包
