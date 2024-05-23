/* istanbul ignore file */
/* eslint-disable object-curly-newline */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReturnValue } from '@aws-sdk/client-dynamodb';

import { Query } from './query';

import { UpdateAction } from '../enum';
import { UpdateParam, Filter, Item } from '../interface';

export class UpdateQueryBuilder extends Query {
  private Key: Item;

  private ReturnValues: ReturnValue;

  private UpdateExpression: string;

  constructor(tableName: string, key: Item) {
    super(tableName);

    this.Key = key;
    this.UpdateExpression = '';
    this.ExpressionAttributeValues = {};
    this.ReturnValues = ReturnValue.ALL_NEW;
  }

  public setRemoveAttributes(attributes?: string[]): UpdateQueryBuilder {
    if (!attributes) {
      return this;
    }

    this.UpdateExpression += ` ${UpdateAction.REMOVE} ${attributes.join(', ')}`;

    return this;
  }

  public setAddAttributes(
    attribute?: Record<string, number | string>,
  ): UpdateQueryBuilder {
    if (!attribute) {
      return this;
    }

    let addString = '';
    const entries = Object.entries(attribute);

    entries.forEach((entry, i) => {
      const [key, value] = entry;
      const uniqueId = this.getKey(`${UpdateAction.ADD}${i}`);

      if (i) {
        addString += `, ${key} ${uniqueId}`;
      } else {
        addString += `${key} ${uniqueId}`;
      }

      this.ExpressionAttributeValues[uniqueId] = value;
    });

    this.UpdateExpression += ` ${UpdateAction.ADD} ${addString}`;

    return this;
  }

  public setUpdateAttributes(
    attribute?: Record<string, any>,
  ): UpdateQueryBuilder {
    if (!attribute) {
      return this;
    }

    let conditionString = '';
    const entries = Object.entries(attribute);

    entries.forEach((entry, i) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [key, value] = entry;
      const uniqueId = this.getKey(`uniqueId${i}`);

      if (i) {
        conditionString += `, ${key} = ${uniqueId}`;
      } else {
        conditionString += `${key} = ${uniqueId}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.ExpressionAttributeValues[uniqueId] = value;
    });

    this.UpdateExpression += ` ${UpdateAction.SET} ${conditionString}`;

    return this;
  }

  public setCondition(condition?: Filter): UpdateQueryBuilder {
    super.setCondition(condition);

    return this;
  }

  public setReturnValues(value?: ReturnValue): UpdateQueryBuilder {
    /* istanbul ignore next */
    if (value) {
      this.ReturnValues = value;
    }

    return this;
  }

  public getUpdateParam(): UpdateParam {
    return {
      TableName: this.TableName,
      Key: this.Key,
      UpdateExpression: this.UpdateExpression.trim(),
      ...(this.isObjectEmpty(this.ExpressionAttributeValues) && {
        ExpressionAttributeValues: this.ExpressionAttributeValues,
      }),
      ReturnValues: this.ReturnValues,
      ...(this.ConditionExpression && {
        ConditionExpression: this.ConditionExpression,
      }),
    };
  }
}
