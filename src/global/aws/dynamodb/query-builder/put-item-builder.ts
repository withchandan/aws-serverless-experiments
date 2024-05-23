/* istanbul ignore file */
/* eslint-disable object-curly-newline */
import { Query } from './query';

import { PutItemParam, Filter, Item } from '../interface';

export class PutItemBuilder extends Query {
  private Item: Item;

  constructor(tableName: string, item: Item) {
    super(tableName);
    this.Item = item;
  }

  public setCondition(condition?: Filter): PutItemBuilder {
    super.setCondition(condition);

    return this;
  }

  public getPutItemParams(): PutItemParam {
    return {
      TableName: this.TableName,
      Item: this.Item,
      ...(this.ConditionExpression && {
        ConditionExpression: this.ConditionExpression,
      }),
      ...(this.isObjectEmpty(this.ExpressionAttributeValues) && {
        ExpressionAttributeValues: this.ExpressionAttributeValues,
      }),
    };
  }
}
