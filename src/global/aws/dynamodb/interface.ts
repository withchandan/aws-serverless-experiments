/* eslint-disable no-shadow */

import { Select, ReturnValue } from '@aws-sdk/client-dynamodb';

import { ConditionType } from './enum';

export interface Condition {
  colName: string;
  colValue?: string | number | boolean | string[] | number[];
  condition: ConditionType;
}

export interface Item {
  [key: string]: unknown;
}

export interface Filter {
  and?: Condition | Condition[];
  or?: Condition | Condition[];
}

export type KeyValueType = string | number;

export interface KeyObject {
  [key: string]: KeyValueType;
}

export interface PrimaryKeyCondition {
  attName: string;
  attValue: KeyValueType;
  condition: ConditionType.EQUAL;
}

export interface SecondaryKeyCondition {
  attName: string;
  attValue: KeyValueType | string[] | number[];
  condition: ConditionType;
}

export interface KeyCondition {
  primaryKey: PrimaryKeyCondition;
  secondaryKey?: SecondaryKeyCondition;
}

// add reverse option
export interface QueryOptions {
  limit?: number;
  offset?: string;
  select?: Select;
  indexName?: string;
  reverseSort?: boolean;
}

export interface QueryResponse<T> {
  items: T[];
  offset?: string;
}

export interface UpdateInput {
  key: KeyObject;
  remove?: string[];
  update?: Item;
  add?: Record<string, number | string>;
  condition?: Filter;
  returnValues?: ReturnValue;
}

export interface Put {
  data: Item;
  condition?: Filter;
}

export interface Delete {
  key: Item;
  condition?: Filter;
}

export interface ConditionCheck {
  key: Item;
  condition: Filter;
}

export interface TransactWriteInput {
  conditionCheck?: ConditionCheck;
  put?: Put;
  delete?: Delete;
  update?: UpdateInput;
  tableName: string;
}

export interface TransactWriteOptions {
  returnValuesOnConditionFailure?: 'ALL_OLD' | 'NONE';
}

export interface PutItemParam {
  TableName: string;
  Item: Record<string, unknown>;
  ReturnValues?: string;
  ConditionExpression?: string;
}

export interface DeleteItemParam {
  TableName: string;
  Key: Item;
  ConditionExpression?: string;
  ExpressionAttributeNames?: { [key: string]: string };
  ExpressionAttributeValues?: Record<string, unknown>;
}

export interface UpdateParam {
  TableName: string;
  Key: Item;
  UpdateExpression: string;
  ExpressionAttributeValues?: Record<string, unknown>;
  ReturnValues: ReturnValue;
  ConditionExpression?: string;
}
