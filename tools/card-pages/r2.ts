import { createHash } from 'node:crypto'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

export function createR2Client(config: Pick<R2Config, 'accountId' | 'accessKeyId' | 'secretAccessKey'>): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export function md5Hex(content: string): string {
  return createHash('md5').update(content, 'utf8').digest('hex')
}

/** 列出 bucket 現有物件的 key → ETag（S3 相容 API 對非 multipart 上傳的 ETag 即內容的 MD5 hex，含引號）。 */
export async function listRemoteObjects(client: S3Client, bucket: string): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  let continuationToken: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }),
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.ETag) result.set(obj.Key, obj.ETag)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
  return result
}

export async function putObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: string,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  )
}

/** S3 DeleteObjects 一次最多 1000 個 key，超過需分批。 */
export async function deleteObjects(client: S3Client, bucket: string, keys: readonly string[]): Promise<void> {
  const BATCH = 1000
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH)
    if (batch.length === 0) continue
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map(Key => ({ Key })) },
      }),
    )
  }
}
