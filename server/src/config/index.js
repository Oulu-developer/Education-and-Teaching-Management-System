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
  // 新闻热点多源（要闻/国际/学术科技/财经/政治），逐源抓取、失败跳过、结果合并
  // type: 'sina' 走新浪滚动新闻 JSON 接口（实时、带图）；'rss' 走标准 RSS
  newsFeeds: [
    { name: '新浪要闻', category: '要闻', type: 'sina', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&k=&num=20&page=1' },
    { name: '新浪国际', category: '国际', type: 'sina', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2511&k=&num=20&page=1' },
    { name: '新浪科技', category: '学术', type: 'sina', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=20&page=1' },
    { name: '新浪财经', category: '财经', type: 'sina', url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2517&k=&num=20&page=1' },
    { name: '人民网时政', category: '政治', type: 'rss', url: 'http://www.people.com.cn/rss/politics.xml' },
  ],
  newsMaxItems: 30,
};

/**
 * 每日系统格言库（励志名人名言，按日期哈希轮换推送，隔天自动更新）。
 * 结构 { content, author }：content 为格言正文，author 为出处/作者。
 */
export const QUOTES = [
  { content: '天行健，君子以自强不息。', author: '《周易》' },
  { content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { content: '志不强者智不达，言不信者行不果。', author: '墨子' },
  { content: '天将降大任于斯人也，必先苦其心志，劳其筋骨。', author: '孟子' },
  { content: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子' },
  { content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { content: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { content: '会当凌绝顶，一览众山小。', author: '杜甫' },
  { content: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { content: '天生我材必有用，千金散尽还复来。', author: '李白' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
  { content: '合抱之木，生于毫末；九层之台，起于累土。', author: '老子' },
  { content: '千里之行，始于足下。', author: '老子' },
  { content: '老骥伏枥，志在千里；烈士暮年，壮心不已。', author: '曹操' },
  { content: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
  { content: '有志者，事竟成。', author: '《后汉书》' },
  { content: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。', author: '陶渊明' },
  { content: '世上无难事，只要肯登攀。', author: '毛泽东' },
  { content: '为中华之崛起而读书。', author: '周恩来' },
  { content: '少年智则国智，少年富则国富，少年强则国强。', author: '梁启超' },
  { content: '苟利国家生死以，岂因祸福避趋之。', author: '林则徐' },
  { content: '横眉冷对千夫指，俯首甘为孺子牛。', author: '鲁迅' },
  { content: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
  { content: '天才就是百分之一的灵感，加上百分之九十九的汗水。', author: '爱迪生' },
  { content: '成功就是屡遭挫折而热情不减。', author: '丘吉尔' },
  { content: '我成功是因为我有决心，从不踌躇。', author: '拿破仑' },
  { content: '生活就像海洋，只有意志坚强的人才能到达彼岸。', author: '马克思' },
  { content: '书籍是人类进步的阶梯。', author: '高尔基' },
  { content: '知识就是力量。', author: '培根' },
  { content: '人的天职在于勇于探索真理。', author: '哥白尼' },
  { content: '我走得很慢，但我从不后退。', author: '林肯' },
  { content: '不要等待机会，而要创造机会。', author: '佚名' },
  { content: '生命不止，奋斗不息。', author: '卡莱尔' },
  { content: '只要功夫深，铁杵磨成针。', author: '谚语' },
  { content: '冰冻三尺，非一日之寒；水滴石穿，非一日之功。', author: '谚语' },
  { content: '有志者，事竟成；破釜沉舟，百二秦关终属楚。', author: '蒲松龄' },
  { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { content: '读书破万卷，下笔如有神。', author: '杜甫' },
  { content: '学如逆水行舟，不进则退。', author: '《增广贤文》' },
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
