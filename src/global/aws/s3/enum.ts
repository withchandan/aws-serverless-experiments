/* eslint-disable no-shadow */

export enum ACL {
  PRIVATE = 'private',
  PUBLIC_R = 'public-read',
  PUBLIC_RW = 'public-read-write',
  AUTHENTICATED_R = 'authenticated-read',
  BUCKET_OWNER_R = 'bucket-owner-read',
  BUCKET_OWNER_FC = 'bucket-owner-full-control',
}

export enum AwsRegion {
  SA_EAST_1 = 'sa-east-1',
  US_EAST_2 = 'us-east-2',
  US_EAST_1 = 'us-east-1',
  EU_WEST_1 = 'eu-west-1',
  US_WEST_1 = 'us-west-1',
  US_WEST_2 = 'us-west-2',
  AP_SOUTH_1 = 'ap-south-1',
  CN_NORTH_1 = 'cn-north-1',
  EU_CENTRAL_1 = 'eu-central-1',
  AP_SOUTHEAST_1 = 'ap-southeast-1',
  AP_SOUTHEAST_2 = 'ap-southeast-2',
  AP_NORTHEAST_1 = 'ap-northeast-1',
  AP_NORTHEAST_2 = 'ap-northeast-2',
  AP_NORTHEAST_3 = 'ap-northeast-3',
  AP_EAST_1 = 'ap-east-1',
  CA_CENTRAL_1 = 'ca-central-1',
  EU_WEST_2 = 'eu-west-2',
  EU_WEST_3 = 'eu-west-3',
  EU_NORTH_1 = 'eu-north-1',
  ME_SOUTH_1 = 'me-south-1',
}

export enum S3SignedUrlOperation {
  GET = 'getObject',
  PUT = 'putObject',
}

export enum StorageClass {
  STANDARD = 'STANDARD',
  REDUCED_REDUNDANCY = 'REDUCED_REDUNDANCY',
  STANDARD_IA = 'STANDARD_IA',
  ONEZONE_IA = 'ONEZONE_IA',
  INTELLIGENT_TIERING = 'INTELLIGENT_TIERING',
  GLACIER = 'GLACIER',
  DEEP_ARCHIVE = 'DEEP_ARCHIVE',
}
