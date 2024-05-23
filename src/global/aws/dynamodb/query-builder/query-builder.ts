/* istanbul ignore file */
/* eslint-disable max-len */
import { Select } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';

import { KeyCondition } from '../interface';

import { ConditionType } from '../enum';

export class QueryBuilder {
  private TableName: string;

  private IndexName?: string;

  private Limit?: number;

  private Select?: Select;

  private KeyConditionExpression: string;

  private ScanIndexForward?: boolean;

  private ExpressionAttributeValues: Record<string, unknown> = {};

  private ExclusiveStartKey?: Record<string, unknown>;

  constructor(tableName: string, key: KeyCondition) {
    const { primaryKey, secondaryKey } = key;

    this.TableName = tableName;
    this.KeyConditionExpression = `${primaryKey.attName} = :${primaryKey.attName}`;
    this.ExpressionAttributeValues[`:${primaryKey.attName}`] =
      primaryKey.attValue;

    if (secondaryKey) {
      switch (secondaryKey.condition) {
        case ConditionType.BEGINS_WITH:
          this.KeyConditionExpression += ` and ${secondaryKey.condition}(${secondaryKey.attName}  , :${secondaryKey.attName})`;
          this.ExpressionAttributeValues[`:${secondaryKey.attName}`] =
            secondaryKey.attValue;
          break;
        default:
          this.KeyConditionExpression += ` and ${secondaryKey.attName} ${secondaryKey.condition} :${secondaryKey.attName}`;
          this.ExpressionAttributeValues[`:${secondaryKey.attName}`] =
            secondaryKey.attValue;
      }
    }
  }

  public setLimit(limit?: number): QueryBuilder {
    if (!limit) {
      return this;
    }

    this.Limit = limit;

    return this;
  }

  public setOffset(offset?: string): QueryBuilder {
    if (!offset) {
      return this;
    }

    this.ExclusiveStartKey = JSON.parse(offset) as Record<string, unknown>;

    return this;
  }

  public setIndex(index?: string): QueryBuilder {
    if (!index) {
      return this;
    }

    this.IndexName = index;

    return this;
  }

  public setSelect(select?: Select): QueryBuilder {
    if (!select) {
      return this;
    }

    this.Select = select;

    return this;
  }

  public setReverseSort(bool?: boolean): QueryBuilder {
    if (typeof bool !== 'boolean') {
      return this;
    }

    this.ScanIndexForward = bool;

    return this;
  }

  public getParam(): QueryCommandInput {
    return {
      TableName: this.TableName,
      KeyConditionExpression: this.KeyConditionExpression,
      ExpressionAttributeValues: this.ExpressionAttributeValues,
      ...(this.Limit && { Limit: this.Limit }),
      ...(this.Select && { Select: this.Select }),
      ...(this.IndexName && { IndexName: this.IndexName }),
      ...(this.ExclusiveStartKey && {
        ExclusiveStartKey: this.ExclusiveStartKey,
      }),
      ...(typeof this.ScanIndexForward === 'boolean' && {
        ScanIndexForward: this.ScanIndexForward,
      }),
    };
  }
}
