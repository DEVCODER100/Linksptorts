import { Response } from 'express';
import { AuthRequest } from '../types';
import { PredictorSubmission } from '../models/PredictorSubmission';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/v1/predictor — save (upsert) the caller's bracket prediction.
export const savePrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, champion } = req.body as { data?: unknown; champion?: string };
    if (data === undefined) { sendError(res, 'No prediction data provided', 400); return; }

    const doc = await PredictorSubmission.findOneAndUpdate(
      { userId: req.user!._id },
      { $set: { data, champion: champion || null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    sendSuccess(res, { id: doc._id, updatedAt: doc.updatedAt }, 'Prediction saved', 201);
  } catch {
    sendError(res, 'Failed to save prediction', 500);
  }
};

// GET /api/v1/predictor/mine — the caller's saved prediction (to restore it).
export const getMyPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await PredictorSubmission.findOne({ userId: req.user!._id });
    sendSuccess(res, doc ? { data: doc.data, champion: doc.champion, updatedAt: doc.updatedAt } : null, 'Fetched');
  } catch {
    sendError(res, 'Failed to fetch your prediction', 500);
  }
};
