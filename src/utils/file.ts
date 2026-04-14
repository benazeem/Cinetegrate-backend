import fs from 'fs/promises';

export async function removeTempFile(path: string) {
  try {
    await fs.unlink(path);
  } catch (err) {
    console.error('Temp file cleanup failed:', err);
  }
}
