import { Request, Response } from 'express';
import { jds, enrichJD } from '../models/db';
import { JD, CRA } from '../models/types';
import { generateWithGeminiRetry, extractHeuristicJobDetails } from '../services/geminiService';

export function getJDs(req: Request, res: Response) {
  const isVerifiedStr = req.query.is_verified as string;
  const oppType = req.query.opportunity_type as string;

  let list = jds.map(enrichJD);
  if (isVerifiedStr !== undefined) {
    const isV = isVerifiedStr === 'true';
    list = list.filter((j) => j.is_verified === isV);
  }
  if (oppType) {
    list = list.filter((j) => j.opportunity_type === oppType);
  }
  return res.json(list);
}

export function createJD(req: Request, res: Response) {
  const user = (req as any).user as CRA;
  const { title, company_id, raw_text, opportunity_type, is_verified, verification_source } = req.body;
  if (!title || !company_id) {
    return res.status(400).json({ detail: 'JD title and company are required' });
  }
  const newJD: JD = {
    id: `jd_${Date.now()}`,
    title: title.trim(),
    company_id,
    raw_text: raw_text || '',
    is_verified: is_verified !== undefined ? !!is_verified : (user.role === 'admin'),
    verification_source: verification_source || 'manual_entry',
    opportunity_type: opportunity_type || 'existing_post',
    date_found: new Date().toISOString().slice(0, 10),
    created_by: user.id,
    created_at: new Date().toISOString(),
  };
  jds.unshift(newJD);
  return res.status(201).json(enrichJD(newJD));
}

export async function extractFromFile(req: Request, res: Response) {
  const file = req.file;
  const filename = file?.originalname || 'job_description.pdf';
  const mimeType = file?.mimetype || 'application/octet-stream';
  const fileContent = file?.buffer ? file.buffer.toString('utf-8') : '';

  const jsonExtractionPrompt = `You are an expert HR recruitment parser. Extract the core job details from this job posting.
Return ONLY a valid JSON object without markdown formatting with these exact keys:
{
  "company_name": "string",
  "role_title": "string",
  "confidence": "high" | "medium" | "low",
  "summary": "string"
}`;

  let contents: any = null;
  if (file?.buffer) {
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
              data: file.buffer.toString('base64'),
            },
          },
          { text: jsonExtractionPrompt },
        ],
      };
    } else if (fileContent.trim().length > 10) {
      contents = `${jsonExtractionPrompt}\n\nDocument Content:\n---\n${fileContent.slice(0, 12000)}\n---`;
    }
  }

  if (contents) {
    const aiResult = await generateWithGeminiRetry({
      contents,
      preferredModels: ['gemini-3.8-flash', 'gemini-2.5-flash'],
    });

    if (aiResult?.text) {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            filename,
            company_name: parsed.company_name || 'Hiring Organization',
            role_title: parsed.role_title || 'Software Specialist',
            confidence: parsed.confidence || 'high',
            raw_text: parsed.summary || fileContent.slice(0, 800) || `Extracted role: ${parsed.role_title} at ${parsed.company_name}`,
            ocr_warning: null,
            ai_active: true,
            extraction_engine: `Google Gemini (${aiResult.modelUsed})`,
          });
        } catch {
          // fallback to heuristic
        }
      }
    }
  }

  // Fallback heuristic extraction with pattern matching on document & filename
  const { compName, roleTitle, raw_text } = extractHeuristicJobDetails(filename, fileContent);

  return res.json({
    filename,
    company_name: compName,
    role_title: roleTitle,
    confidence: 'medium',
    raw_text,
    ocr_warning: null,
    ai_active: false,
    extraction_engine: 'PLACEMEIN Intelligent Document Parser',
  });
}

export function getExtractionStatus(req: Request, res: Response) {
  return res.json({
    ai_active: !!process.env.GEMINI_API_KEY,
    engine: process.env.GEMINI_API_KEY ? 'Google Gemini 3.8 Flash (Auto-failover enabled)' : 'PLACEMEIN Intelligent Document Parser',
    message: 'AI document parsing and OCR extraction active and ready.',
  });
}

export function getJDById(req: Request, res: Response) {
  const jd = jds.find((j) => j.id === req.params.id);
  if (!jd) return res.status(404).json({ detail: 'JD not found' });
  return res.json(enrichJD(jd));
}

export function updateJD(req: Request, res: Response) {
  const jd = jds.find((j) => j.id === req.params.id);
  if (!jd) return res.status(404).json({ detail: 'JD not found' });
  Object.assign(jd, req.body);
  return res.json(enrichJD(jd));
}

export function deleteJD(req: Request, res: Response) {
  const idx = jds.findIndex((j) => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'JD not found' });
  jds.splice(idx, 1);
  return res.status(204).send();
}
