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
  // 新闻热点多源（国内要闻/国际/学术科技/政治），逐源抓取、失败跳过、结果合并
  // type: 'sina' 走新浪滚动新闻 JSON 接口（带图片）；'rss' 走标准 RSS
  newsFeeds: [
    { name: '新浪要闻', category: '要闻', type: 'sina', lid: '2509', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&k=&num=12&page=1' },
    { name: '新浪国际', category: '国际', type: 'sina', lid: '2511', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2511&k=&num=12&page=1' },
    { name: '新浪科技', category: '学术', type: 'sina', lid: '2516', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=12&page=1' },
    { name: '人民网时政', category: '政治', type: 'rss', url: 'http://www.people.com.cn/rss/politics.xml' },
    { name: '新华网时政', category: '政治', type: 'rss', url: 'http://www.xinhuanet.com/politics/news_politics.xml' },
  ],
  newsMaxItems: 24,
};

/** 每日系统格言库（按日期哈希轮换推送一句，另一句由教师手动添加） */
export const QUOTES = [
  '书山有路勤为径，学海无涯苦作舟。',
  '学而不思则罔，思而不学则殆。',
  '知之者不如好之者，好之者不如乐之者。',
  '不积跬步，无以至千里；不积小流，无以成江海。',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '业精于勤，荒于嬉；行成于思，毁于随。',
  '博学之，审问之，慎思之，明辨之，笃行之。',
  '千里之行，始于足下。',
  '温故而知新，可以为师矣。',
  '三人行，必有我师焉。',
  '敏而好学，不耻下问。',
  '锲而舍之，朽木不折；锲而不舍，金石可镂。',
  '天行健，君子以自强不息。',
  '少壮不努力，老大徒伤悲。',
  '黑发不知勤学早，白首方悔读书迟。',
  '盛年不重来，一日难再晨。及时当勉励，岁月不待人。',
  '路漫漫其修远兮，吾将上下而求索。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '问渠那得清如许？为有源头活水来。',
  '会当凌绝顶，一览众山小。',
  '非淡泊无以明志，非宁静无以致远。',
  '读万卷书，行万里路。',
  '玉不琢，不成器；人不学，不知义。',
  '勤能补拙是良训，一分辛苦一分才。',
  '今日事，今日毕。',
  '水滴石穿，绳锯木断。',
  '一寸光阴一寸金，寸金难买寸光阴。',
  '志不强者智不达。',
  '为中华之崛起而读书。',
  '世上无难事，只怕有心人。',
  '天才在于积累，聪明在于勤奋。',
  '兴趣是最好的老师。',
  '胜人者有力，自胜者强。',
  '吾生也有涯，而知也无涯。',
  '学如逆水行舟，不进则退。',
  '冰冻三尺，非一日之寒。',
  '举一而反三，闻一而知十。',
  '独学而无友，则孤陋而寡闻。',
  '君子博学而日参省乎己，则知明而行无过矣。',
  '授人以鱼，不如授人以渔。',
];

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
