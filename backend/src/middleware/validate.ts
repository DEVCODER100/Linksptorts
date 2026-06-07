import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    sendError(res, (first as any).msg || 'Validation error', 400, 'VALIDATION_ERROR');
    return;
  }
  next();
};

export const validateCreateListing = [
  body('type')
    .isIn(['trial', 'event', 'tournament', 'admission', 'training_camp'])
    .withMessage('type must be one of: trial, event, tournament, admission, training_camp'),
  body('title')
    .trim().notEmpty().withMessage('title is required')
    .isLength({ max: 200 }).withMessage('title must be 200 characters or fewer'),
  body('description')
    .trim().notEmpty().withMessage('description is required')
    .isLength({ max: 5000 }).withMessage('description must be 5000 characters or fewer'),
  body('startDate')
    .notEmpty().withMessage('startDate is required')
    .isISO8601().withMessage('startDate must be a valid date'),
  body('sports')
    .optional()
    .isArray().withMessage('sports must be an array'),
  body('participantFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('participantFee must be a non-negative number'),
  body('participantLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('participantLimit must be a positive integer'),
  handleValidationErrors,
];

export const validateCreateJob = [
  body('title')
    .trim().notEmpty().withMessage('title is required')
    .isLength({ max: 200 }).withMessage('title must be 200 characters or fewer'),
  body('description')
    .trim().notEmpty().withMessage('description is required')
    .isLength({ max: 10000 }).withMessage('description must be 10000 characters or fewer'),
  body('category')
    .isIn(['coach', 'pe_teacher', 'fitness_trainer', 'sports_physio', 'nutritionist', 'manager', 'admin', 'other'])
    .withMessage('category must be one of: coach, pe_teacher, fitness_trainer, sports_physio, nutritionist, manager, admin, other'),
  body('location')
    .trim().notEmpty().withMessage('location is required')
    .isLength({ max: 200 }).withMessage('location must be 200 characters or fewer'),
  body('jobType')
    .isIn(['full_time', 'part_time', 'contract', 'internship'])
    .withMessage('jobType must be one of: full_time, part_time, contract, internship'),
  body('salaryMin')
    .optional()
    .isFloat({ min: 0 }).withMessage('salaryMin must be a non-negative number'),
  body('salaryMax')
    .optional()
    .isFloat({ min: 0 }).withMessage('salaryMax must be a non-negative number'),
  handleValidationErrors,
];
