import { supabase } from './supabase';

const RESUME_BUCKET = process.env.SUPABASE_RESUME_BUCKET || 'resume-profiles';

export type ResumeProfileInput = {
  userId: string;
  resumeText: string;
  source: 'upload' | 'pasted_text' | 'mixed';
  fileName?: string | null;
  file?: Express.Multer.File;
};

function safeFileName(fileName: string): string {
  return fileName
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120) || 'resume';
}

async function uploadResumeFile(userId: string, file?: Express.Multer.File) {
  if (!file) return null;

  const filePath = `${userId}/${Date.now()}-${safeFileName(file.originalname)}`;
  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    console.warn('Resume file storage upload skipped:', error.message);
    return null;
  }

  return {
    bucket: RESUME_BUCKET,
    path: filePath,
    mimeType: file.mimetype || null,
    size: file.size,
  };
}

export async function saveResumeProfile(input: ResumeProfileInput) {
  if (!input.userId || !input.resumeText.trim()) return null;

  const storedFile = await uploadResumeFile(input.userId, input.file);
  const { data, error } = await supabase
    .from('resume_profiles')
    .upsert(
      {
        user_id: input.userId,
        resume_text: input.resumeText.trim(),
        source: input.source,
        file_name: input.fileName || null,
        file_bucket: storedFile?.bucket || null,
        file_path: storedFile?.path || null,
        file_mime: storedFile?.mimeType || null,
        file_size: storedFile?.size || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('user_id, source, file_name, file_bucket, file_path, file_mime, file_size, updated_at')
    .single();

  if (error) {
    console.warn('Resume profile save skipped:', error.message);
    return null;
  }

  return data;
}

export async function getResumeProfile(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('resume_profiles')
    .select('user_id, resume_text, source, file_name, file_bucket, file_path, file_mime, file_size, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Resume profile fetch failed:', error.message);
    return null;
  }

  return data;
}

export async function createResumeFileSignedUrl(userId: string) {
  const profile = await getResumeProfile(userId);
  if (!profile?.file_bucket || !profile?.file_path) return null;

  const { data, error } = await supabase.storage
    .from(profile.file_bucket)
    .createSignedUrl(profile.file_path, 60 * 10);

  if (error) {
    console.warn('Resume signed URL failed:', error.message);
    return null;
  }

  return data.signedUrl;
}

export async function deleteResumeProfile(userId: string) {
  const profile = await getResumeProfile(userId);

  if (profile?.file_bucket && profile?.file_path) {
    const { error: storageError } = await supabase.storage
      .from(profile.file_bucket)
      .remove([profile.file_path]);

    if (storageError) {
      console.warn('Resume storage delete skipped:', storageError.message);
    }
  }

  const { error } = await supabase
    .from('resume_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.warn('Resume profile delete failed:', error.message);
    return false;
  }

  return true;
}
