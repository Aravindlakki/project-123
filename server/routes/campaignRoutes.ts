import { Router } from 'express';
import {
  getCampaigns,
  createCampaign,
  getCampaignById,
  addContactToCampaign,
  campaignDraftMessage,
} from '../controllers/outreachController';
import { authenticate } from '../middlewares/authMiddleware';

export const campaignRouter = Router();

campaignRouter.get('/campaigns', authenticate, getCampaigns);
campaignRouter.post('/campaigns', authenticate, createCampaign);
campaignRouter.get('/campaigns/:id', authenticate, getCampaignById);
campaignRouter.post('/campaigns/:id/add-contact', authenticate, addContactToCampaign);
campaignRouter.get('/campaigns/:id/draft-message', authenticate, campaignDraftMessage);
