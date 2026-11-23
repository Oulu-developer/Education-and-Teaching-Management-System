# 教育教学管理系统（网页版）

面向教师的班级教学管理系统，包含首页概览、课表安排、随机点名、学生成绩、智能组卷（超链接）、学生信息、荣誉积分 7 大模块。数据存储在 WorkBuddy 云数据库，免登录、朋友可直接访问使用。

## 功能清单

| 模块 | 说明 |
|---|---|
| ① 首页概览 | 每日格言（增删）、今日待办（增删 + 最迟时间 + 未完成提醒）、时政热点（人民网 RSS 每日更新）、考试倒计时、班级总人数 |
| ② 课表安排 | 上传课表图片（视觉大模型 OCR 识别）、在线编辑、保存 |
| ③ 随机点名 | 从学生名单随机抽取（单个 / 5 个 / 10 个），点名后评定积分实时记入荣誉积分 |
| ④ 学生成绩 | 导入 Excel 成绩文件，按总分自动排序，展示各科成绩 |
| ⑤ 智能组卷 | 超链接跳转到独立智能组卷系统 |
| ⑥ 学生信息 | 多班级管理，学生姓名/性别/家长联系方式增删改，导入学生名单 |
| ⑦ 荣誉积分 | 实时积分排名榜（数据来自随机点名评定） |

## 技术架构

- **前端**：Vue 3 + Vite + Vue Router（hash 模式）
- **后端**：Node.js + Express（单端口托管静态页面 + REST API）
- **数据库**：WorkBuddy 云数据库（PostgreSQL，`@tencent-ai/workbuddy-cloud-sdk`）
- **OCR**：云服务免密钥视觉大模型（前端直接调用，识别课表图片）
- **时政热点**：人民网/新华网免费 RSS（`fast-xml-parser` 解析，懒加载缓存）

## 功能截图
<img width="300" height="500" alt="4236ac4c265b84958e50d3c656450ad1" src="https://github.com/user-attachments/assets/a29b39db-4592-4858-a111-69f0212d6029" /><img width="300" height="500" alt="4de8ae1b25acb3d071fa09bf676133cb" src="https://github.com/user-attachments/assets/747926fa-f44d-4277-8eba-db20dba6ec82" /><img width="300" height="500" alt="938c8915ec9f1e86a4763819be3e9964" src="https://github.com/user-attachments/assets/e22c04a1-58b1-4cf7-b47f-8c128121ba22" /><img width="300" height="500" alt="2a00922d5beb321ded45c5955385a3e8" src="https://github.com/user-attachments/assets/c8277d24-5932-4349-a17c-a96bf216d36c" /><img width="300" height="500" alt="5d0f36271f5e70e61da36a2b12b74f38" src="https://github.com/user-attachments/assets/185d051b-1544-4db6-9957-e00daebf57bf" />



## 目录结构

```
edu-management/
├── server/            # Node/Express 后端
│   └── src/{config, services, routes, utils}
└── web/               # Vue 前端
    └── src/{views, components, router, api, styles, store}
```

## 本地运行

```bash
cd edu-management/server && npm install   # 后端依赖
cd ../web && npm install                   # 前端依赖

# 后端（端口 3002，默认已内置云数据库配置）
cd ../server && npm run dev

# 前端（端口 5174，/api 代理到 3002）
cd ../web && npm run dev
```

浏览器打开 http://localhost:5174。

## 构建与部署

```bash
cd edu-management/web && npm run build   # 产物输出到 server/public
```

前后端合并为单端口服务（Express 同时提供静态页面与 API），可直接发布。

## 云数据库说明

- 数据表：`class`、`student`、`todo`、`quote`、`exam`、`schedule`、`points`、`grade`、`news`（共 9 张）。
- 采用「匿名共享读写」策略，朋友无需登录即可共用一套数据。
- `endpoint` / `publishableKey` 为公开值，可在 `server/src/config/index.js` 或 `server/.env` 中覆盖（`CLOUD_ENDPOINT` / `CLOUD_PUBLISHABLE_KEY`）。
