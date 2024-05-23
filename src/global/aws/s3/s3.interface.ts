import { Readable } from 'stream';

import { PutObjectCommandInput } from '@aws-sdk/client-s3';

import { AwsRegion, ACL, S3SignedUrlOperation, StorageClass } from './enum';

export interface CreateBucketInput {
  acl?: ACL;
  region: AwsRegion;
}

export interface ListObjectsOptions {
  prefix?: string;
  limit?: number;
  offset?: string;
  delimiter?: string;
  getAllKeys?: boolean;
}

export interface S3GetSignedUrlInput {
  key: string;
  expiryTime?: number;
  operation: S3SignedUrlOperation;
}

export interface Mime {
  ext: string;
  mime: string;
}

export interface UploadInput {
  body: PutObjectCommandInput['Body'];
  mimeType: Mime;
  acl?: ACL;
  uploadFileName?: string;
  folderPath?: string;
  storageClass?: StorageClass;
}

export interface UploadRes {
  key: string;
  url: string;
  fileName: string;
}

export interface S3Object {
  key: string;
  lastModified?: Date;
  size: number;
  storageClass: string;
  url: string;
  fileName: string;
}

export interface ListObjectsResultSet {
  items: S3Object[];
  count: number;
  offset?: string;
}

export interface S3Bucket {
  name: string;
  creationDate: Date;
}

export interface S3BucketOwner {
  name: string;
  id: string;
}

export interface S3BucketList {
  buckets: S3Bucket[];
  owner: S3BucketOwner;
}

export interface S3GetObjectSuccess {
  size: number;
  key: string;
  mimeType: string;
  body: Readable | ReadableStream | Blob | string | undefined;
}

export interface S3GetObjectFailed {
  key: string;
  errorMsg: string;
}

export interface S3GetObjectResultSet {
  success: S3GetObjectSuccess[];
  failed: S3GetObjectFailed[];
}

export interface DeleteObjectResultSet {
  success: string[];
  failed: string[];
}

export interface BucketPolicy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
