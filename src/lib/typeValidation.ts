import { ApplicationStatus, ApplicationItem, TimelineEntry } from '../types';

/**
 * 验证应用状态字符串是否为有效的 ApplicationStatus
 */
export const validateApplicationStatus = (status: string): ApplicationStatus => {
  const validStatuses: ApplicationStatus[] = ['已投递', '笔试中', '一面', '二面', 'Offer', 'Rejected', '已结束'];

  if (validStatuses.includes(status as ApplicationStatus)) {
    return status as ApplicationStatus;
  }

  console.warn(`[TypeValidation] Invalid ApplicationStatus: "${status}", defaulting to '已投递'`);
  return '已投递';
};

/**
 * 验证时间线条目
 */
export const validateTimelineEntry = (entry: Partial<TimelineEntry>): TimelineEntry => {
  const defaultEntry: TimelineEntry = {
    id: entry.id || Math.random().toString(36).substr(2, 9),
    status: validateApplicationStatus(entry.status || '已投递'),
    date: entry.date || new Date().toISOString().split('T')[0],
    note: entry.note || '',
  };

  return defaultEntry;
};

/**
 * 创建安全的 ApplicationItem 对象
 * 提供默认值并验证所有字段
 */
export const createApplicationItem = (data: Partial<ApplicationItem>): ApplicationItem => {
  const defaultItem: ApplicationItem = {
    id: data.id || Math.random().toString(36).substr(2, 9),
    company: data.company || '',
    position: data.position || '',
    channel: data.channel || '',
    status: validateApplicationStatus(data.status || '已投递'),
    applyDate: data.applyDate || new Date().toISOString().split('T')[0],
    interviewDate: data.interviewDate,
    notes: data.notes || '',
    timeline: Array.isArray(data.timeline)
      ? data.timeline.map(validateTimelineEntry)
      : [],
    updatedAt: data.updatedAt || new Date().toISOString(),
  };

  return defaultItem;
};

/**
 * 安全地更新 ApplicationItem 对象
 */
export const updateApplicationItem = (
  existing: ApplicationItem,
  updates: Partial<ApplicationItem>
): ApplicationItem => {
  const updated: ApplicationItem = {
    ...existing,
    ...updates,
  };

  // 验证状态字段
  if (updates.status !== undefined) {
    updated.status = validateApplicationStatus(updates.status);
  }

  // 验证时间线
  if (updates.timeline !== undefined) {
    updated.timeline = Array.isArray(updates.timeline)
      ? updates.timeline.map(validateTimelineEntry)
      : existing.timeline;
  }

  updated.updatedAt = new Date().toISOString();

  return updated;
};

/**
 * 验证从表单数据创建的对象
 */
export const validateFormData = (formData: any): Partial<ApplicationItem> => {
  const validated: Partial<ApplicationItem> = {};

  if (formData.company !== undefined) {
    validated.company = String(formData.company).trim();
  }

  if (formData.position !== undefined) {
    validated.position = String(formData.position).trim();
  }

  if (formData.channel !== undefined) {
    validated.channel = String(formData.channel).trim();
  }

  if (formData.status !== undefined) {
    validated.status = validateApplicationStatus(String(formData.status));
  }

  if (formData.applyDate !== undefined) {
    validated.applyDate = String(formData.applyDate);
  }

  if (formData.interviewDate !== undefined) {
    validated.interviewDate = String(formData.interviewDate);
  }

  if (formData.notes !== undefined) {
    validated.notes = String(formData.notes).trim();
  }

  return validated;
};