/* istanbul ignore file */
/* eslint-disable object-curly-newline */
import { Query } from './query';

import { DeleteItemParam, Filter, Item } from '../interface';

export class DeleteItemBuilder extends Query {
  private Key: Item;

  constructor(tableName: string, key: Item) {
    super(tableName);
    this.Key = key;
  }

  public setCondition(condition?: Filter): DeleteItemBuilder {
    super.setCondition(condition);

    return this;
  }

  public getDeleteItemParam(): DeleteItemParam {
    return {
      TableName: this.TableName,
      Key: this.Key,
      ...(this.ConditionExpression && {
        ConditionExpression: this.ConditionExpression,
      }),
      ...(this.isObjectEmpty(this.ExpressionAttributeValues) && {
        ExpressionAttributeValues: this.ExpressionAttributeValues,
      }),
    };
  }
}
