import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const BUCKET = process.env.MINIO_BUCKET ?? "farmflow"

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

function farmKey(farmId: string, key: string) {
  return `farms/${farmId}/${key}`
}

export async function uploadFile(
  farmId: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType?: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: farmKey(farmId, key),
      Body: body,
      ContentType: contentType,
    })
  )
  return farmKey(farmId, key)
}

export async function getPresignedUploadUrl(
  farmId: string,
  key: string,
  contentType: string,
  expiresIn = 600
) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: farmKey(farmId, key),
      ContentType: contentType,
    }),
    { expiresIn }
  )
}

export async function getPresignedDownloadUrl(
  farmId: string,
  key: string,
  expiresIn = 3600
) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: farmKey(farmId, key),
    }),
    { expiresIn }
  )
}

export async function deleteFile(farmId: string, key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: farmKey(farmId, key),
    })
  )
}
