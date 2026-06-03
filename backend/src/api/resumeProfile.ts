import { Router, Request, Response } from 'express';
import { createResumeFileSignedUrl, deleteResumeProfile, getResumeProfile, saveResumeProfile } from '../lib/resumeProfile';
import { extractResumeText, resumeUpload, textField } from '../lib/resumeUpload';

const router = Router();

function canAccessUser(req: Request, res: Response, userId: string): boolean {
  if (!req.authUserId) {
    res.status(401).json({ error: 'Sign in to manage your resume profile.' });
    return false;
  }
  if (req.authUserId !== userId) {
    res.status(403).json({ error: 'You do not have access to this resume profile.' });
    return false;
  }
  return true;
}

router.get('/:userId', async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (!canAccessUser(req, res, userId)) return;

  try {
    const profile = await getResumeProfile(userId);
    const fileUrl = profile?.file_path ? await createResumeFileSignedUrl(userId) : null;
    return res.status(200).json({ profile, fileUrl });
  } catch (error: any) {
    console.error('Resume Profile Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch resume profile' });
  }
});

router.post('/:userId', resumeUpload.single('resumeFile'), async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const pastedResume = textField(req.body.resumeText || req.body.context);

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (!canAccessUser(req, res, userId)) return;

  try {
    const uploadedResumeText = await extractResumeText(req.file);
    const resumeText = [pastedResume, uploadedResumeText].filter(Boolean).join('\n\n').trim();

    if (resumeText.length < 80) {
      return res.status(400).json({ error: 'Paste or upload a resume with enough readable content.' });
    }

    const profile = await saveResumeProfile({
      userId,
      resumeText,
      source: pastedResume && uploadedResumeText ? 'mixed' : req.file ? 'upload' : 'pasted_text',
      fileName: req.file?.originalname || null,
      file: req.file,
    });

    const fileUrl = profile ? await createResumeFileSignedUrl(userId) : null;
    return res.status(200).json({ profile, fileUrl });
  } catch (error: any) {
    console.error('Resume Profile Save Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save resume profile' });
  }
});

router.delete('/:userId', async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (!canAccessUser(req, res, userId)) return;

  try {
    const deleted = await deleteResumeProfile(userId);
    return res.status(200).json({ deleted });
  } catch (error: any) {
    console.error('Resume Profile Delete Error:', error);
    return res.status(500).json({ error: 'Failed to delete resume profile' });
  }
});

export default router;
