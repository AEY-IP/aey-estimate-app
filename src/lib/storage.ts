import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.YC_STORAGE_REGION!,
  endpoint: process.env.YC_STORAGE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.YC_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YC_STORAGE_SECRET_ACCESS_KEY!
  }
})

const BUCKET = process.env.YC_STORAGE_BUCKET!

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
  isPublic: boolean = false
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private'
    }
  })

  await upload.done()
  
  if (isPublic) {
    return `${process.env.YC_STORAGE_ENDPOINT}/${BUCKET}/${key}`
  }
  
  return key
}

export async function deleteFile(keyOrUrl: string): Promise<void> {
  let key = keyOrUrl
  
  if (keyOrUrl.startsWith('http')) {
    const url = new URL(keyOrUrl)
    key = url.pathname.split('/').slice(2).join('/')
  }
  
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key
    }))
  } catch (error) {
    console.error('Error deleting file from YC:', error)
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  console.log('🔐 Генерация signed URL для ключа:', key);
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  })
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  console.log('✅ Signed URL сгенерирован:', signedUrl.substring(0, 100) + '...');
  return signedUrl;
}

export function extractKeyFromUrl(url: string): string | null {
  try {
    if (url.includes('storage.yandexcloud.net')) {
      const urlObj = new URL(url)
      return urlObj.pathname.split('/').slice(2).join('/')
    }
    return null
  } catch {
    return null
  }
}

export async function downloadFileAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}
