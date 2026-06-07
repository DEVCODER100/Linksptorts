import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: ApiResponse<T>['pagination']
): Response => {
  const response: ApiResponse<T> = { success: true, data, message };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code = 'ERROR',
  details?: unknown
): Response => {
  const response: ApiResponse = {
    success: false,
    error: { code, message, details },
  };
  return res.status(statusCode).json(response);
};

export const createNotification = async (
  recipientId: string,
  type: string,
  title: string,
  message: string,
  referenceId?: string,
  referenceType?: string
) => {
  const { Notification } = await import('../models/Notification');
  return Notification.create({ recipientId, type, title, message, referenceId, referenceType });
};
