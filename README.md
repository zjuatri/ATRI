# ZhiHuiShu 浏览器插件

智慧树浏览器扩展插件

## 项目结构

```
ZhiHuiShu/
├── manifest.json          # 插件配置文件
├── background/            # 后台脚本
│   └── background.js
├── content/               # 内容脚本
│   └── content.js
├── popup/                 # 弹出页面
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── icons/                 # 图标文件
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 功能说明

- **manifest.json**: 插件的配置文件，定义了插件的基本信息、权限和组件
- **background/**: 后台服务工作线程，处理跨页面的逻辑
- **content/**: 内容脚本，注入到网页中执行
- **popup/**: 点击插件图标时显示的弹出页面

## 安装方法

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions/` 或 `edge://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目文件夹

## 开发说明

### Manifest V3
本插件使用 Manifest V3 规范，这是 Chrome 扩展的最新标准。

### 主要组件

1. **Service Worker (background.js)**
   - 处理后台任务
   - 监听事件
   - 管理状态

2. **Content Script (content.js)**
   - 注入到网页中
   - 可以访问和修改 DOM
   - 与页面脚本隔离

3. **Popup (popup.html/js/css)**
   - 用户界面
   - 与用户交互
   - 可以与 content script 和 background 通信

## 开发计划

- [ ] 添加图标文件
- [ ] 实现具体功能
- [ ] 添加选项页面
- [ ] 完善用户界面
- [ ] 添加测试

## 许可证

MIT

## 使用接口：
题目
https://studywisdomh5.zhihuishu.com/exam?knowledgeId=x26K7nlDxLcKqZJa&recruitAndCourseId=495f595c41504859444a58595845584359

- recruitAndCourseId=495f595c41504859444a58595845584359：课程相关ID
- knowledgeId=x26K7nlDxLcKqZJa：知识点ID
- secretStr=au+C2IRNmIXjLMkr/PYInWDjr5AfyExr1t3Bll68xLRfzNKYN5/nVAb7RtVvA9Q8eFn6MYpHQopLu/uFNCHBGnhLhAr6PjwvW1dpfrbj0hE=:鉴权

答案
https://aistudy.zhihuishu.com/gateway/t/v1/exam/getUserAnswers?secretStr=m%2BS%2F4vlpjxZRwIy%2FrS5DL7bt%2FrI76btO50klcU6qU8qV5fueUf343oka3Cr8YqPnJ3OWjLzvYNulkjDE3CkBYurAFIzp8DwudUFqldn2uqxUT21agtD0gJn1B23XD7LXzYAM6YEdgUgJrYA8cnv4mQ%3D%3D&dateFormate=1761749259000
## 逻辑
截取网络获得鉴权秘钥->反复提交获取正确答案