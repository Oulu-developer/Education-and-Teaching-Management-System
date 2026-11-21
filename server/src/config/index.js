/**
 * 全局配置与业务字典
 * 约定：所有可变配置优先从环境变量读取；云数据库 endpoint/publishableKey 为公开值（非密钥）。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
// .env 位于 server/ 目录（src/config 向上两级）
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

export const config = {
  port: Number(process.env.PORT || 3002),
  // 云数据库（WorkBuddy Cloud Service）。endpoint 与 publishableKey 均为公开值，供 SDK 初始化；
  // 也随 /api/meta 下发给前端，用于前端直接调用免密钥视觉大模型（课表 OCR）。
  cloud: {
    endpoint: process.env.CLOUD_ENDPOINT || 'https://edu-system-36225.app.workbuddy.host',
    publishableKey:
      process.env.CLOUD_PUBLISHABLE_KEY ||
      'wbpk_rEBQ886CgQWt3M7gfatIDJ_7n2eEV2J1vAKfoentp4gq6BXtcjDx6g4',
  },
  // 智能组卷独立系统链接（「智能组卷」入口跳转地址，可在 .env 覆盖）
  examLink:
    process.env.EXAM_LINK ||
    'https://smart-exam-26814.app.workbuddy.host/?sharecode=ZGDJ7M6W7Z',
  // 时政热点 RSS 源（人民网/新华网免费官方源），按顺序抓取，首个成功即用
  newsFeeds: [
    { name: '人民网时政', url: 'http://www.people.com.cn/rss/politics.xml' },
    { name: '新华网时政', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
  ],
  newsMaxItems: 10,
};

/** 年级字典（覆盖小学、初中、高中、大学，多班级按年级分组） */
export const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三',
  '大一', '大二', '大三', '大四',
];

/** 星期（课表列） */
export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

/** 默认节次数量（课表行） */
export const PERIODS = 8;
