/**
 * 云数据库客户端（WorkBuddy Cloud Service）
 * 基于 @tencent-ai/workbuddy-cloud-sdk 的 PostgREST 风格客户端。
 * 采用「公开共享读写」策略（anon + authenticated 均可读写），教师/朋友无需登录即可共用一套数据。
 */
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import { config } from './index.js';
import { AppError } from '../utils/response.js';

export const cloud = createWorkBuddyCloud({
  endpoint: config.cloud.endpoint,
  publishableKey: config.cloud.publishableKey,
});

/** 单表查询入口：from('student').select(...).eq(...) */
export function from(table) {
  return cloud.database.from(table);
}

/**
 * 执行一条 supabase-js 风格查询链，解包 { data, error } 信封。
 * 出错统一抛 AppError；成功返回 data（数组或单个对象，取决于是否 .single()/.maybeSingle()）。
 */
export async function run(builder, failMessage = '云数据库操作失败') {
  const { data, error } = await builder;
  if (error) {
    throw new AppError(`${failMessage}：${error.message || error.code || '未知错误'}`);
  }
  return data;
}
