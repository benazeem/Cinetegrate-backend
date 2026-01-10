import { GetObjectAclCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost.localstack.cloud:4566",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

async function getObjectURL(key:any) {
  const command = new GetObjectAclCommand({
    Bucket: "sample-bucket",
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

console.log("Generated Signed URL:", await getObjectURL("AI Studio API.txt"));