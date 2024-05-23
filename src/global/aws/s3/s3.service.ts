import { randomUUID as uuidv4 } from 'crypto';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  _Object,
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectRequest,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';

import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  S3Object,
  UploadRes,
  UploadInput,
  S3GetObjectFailed,
  S3GetObjectResultSet,
  S3GetObjectSuccess,
  ListObjectsOptions,
  ListObjectsResultSet,
  S3GetSignedUrlInput,
} from './s3.interface';

import { AwsRegion, S3SignedUrlOperation } from './enum';

@Injectable()
export class S3Service {
  public readonly client: S3Client;

  public readonly region: AwsRegion;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<AwsRegion>('AWS_REGION');

    this.client = new S3Client({ region: this.region });
  }

  public async createFolder(
    bucketName: string,
    folderName: string,
  ): Promise<void> {
    let formattedFolderName = folderName;

    const one = 1;

    if (formattedFolderName[formattedFolderName.length - one] !== '/') {
      formattedFolderName = `${formattedFolderName}/`;
    }

    const request: PutObjectRequest = {
      Bucket: bucketName,
      Key: formattedFolderName,
    };

    const command = new PutObjectCommand(request);

    await this.client.send(command);
  }

  public async upload(
    name: string,
    uploadInput: UploadInput,
  ): Promise<UploadRes> {
    const { mimeType, body, storageClass, folderPath, acl, uploadFileName } =
      uploadInput;

    const { ext, mime } = mimeType;

    const fileName = `${uploadFileName || uuidv4()}.${ext}`;

    const key = folderPath ? `${folderPath}/${fileName}` : fileName;

    const uploads = new Upload({
      client: this.client,
      params: {
        Bucket: name,
        Key: key,
        Body: body,
        ACL: acl,
        StorageClass: storageClass,
        ContentType: mime,
      },
    });

    await uploads.done();

    return { url: this.getObjectUrl(name, key), key, fileName };
  }

  public async getObject(
    name: string,
    key: string,
  ): Promise<S3GetObjectSuccess> {
    const command = new GetObjectCommand({ Bucket: name, Key: key });
    const { Body, ContentType, ContentLength } = await this.client.send(
      command,
    );

    const defaultSize = 0;

    return {
      size: ContentLength || defaultSize,
      key,
      mimeType: ContentType,
      body: Body || '',
    };
  }

  public async getMultipleObject(
    name: string,
    keys: string[],
  ): Promise<S3GetObjectResultSet> {
    const failed: S3GetObjectFailed[] = [];
    const success: S3GetObjectSuccess[] = [];

    await Promise.all(
      keys.map(async (key) => {
        try {
          const command = new GetObjectCommand({ Bucket: name, Key: key });
          const { Body, ContentType, ContentLength } = await this.client.send(
            command,
          );

          const defaultSize = 0;

          /* istanbul ignore next */
          success.push({
            key,
            body: Body || '',
            mimeType: ContentType || '',
            size: ContentLength || defaultSize,
          });
        } catch (err) {
          failed.push({ key, errorMsg: (err as Error).message });
        }
      }),
    );

    return { success, failed };
  }

  public async listObjects(
    name: string,
    options?: ListObjectsOptions,
  ): Promise<ListObjectsResultSet> {
    const { prefix, delimiter, limit, offset, getAllKeys } = options || {};

    const command = new ListObjectsCommand({
      Bucket: name,
      ...(limit && { MaxKeys: limit }),
      ...(offset && { Marker: offset }),
      ...(prefix && { Prefix: prefix }),
      ...(delimiter && { Delimiter: delimiter }),
    });

    const { Contents, NextMarker } = await this.client.send(command);

    const items = this.getItems(name, Contents, getAllKeys);

    return {
      items,
      count: items.length,
      ...(NextMarker && { offset: NextMarker }),
    };
  }

  public async getSignedUrl(
    name: string,
    signedUrlInput: S3GetSignedUrlInput,
  ): Promise<string> {
    const { operation, key, expiryTime } = signedUrlInput;

    let command;

    if (operation === S3SignedUrlOperation.GET) {
      command = new GetObjectCommand({ Bucket: name, Key: key });

      return getSignedUrl(this.client, command, { expiresIn: expiryTime });
    }

    command = new PutObjectCommand({ Bucket: name, Key: key });

    return getSignedUrl(this.client, command, { expiresIn: expiryTime });
  }

  private getItems(
    name: string,
    objects?: _Object[],
    getAllKeys?: boolean,
  ): S3Object[] {
    if (!objects) {
      return [];
    }

    const items: S3Object[] = [];

    objects.forEach((obj) => {
      if (!obj.Key || (!getAllKeys && obj.Key.endsWith('/'))) {
        return;
      }

      const defaultSize = 0;
      const fileName = obj.Key.split('/').pop() || '';

      items.push({
        key: obj.Key,
        fileName,
        size: obj.Size || defaultSize,
        url: this.getObjectUrl(name, obj.Key),
        storageClass: obj.StorageClass || '',
        ...(obj.LastModified && { lastModified: obj.LastModified }),
      });
    });

    return items;
  }

  private getObjectUrl(name: string, key: string): string {
    return `https://s3.${this.region}.amazonaws.com/${name}/${key}`;
  }
}
