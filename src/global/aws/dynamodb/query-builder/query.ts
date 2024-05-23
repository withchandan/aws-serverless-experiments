/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable object-curly-newline */
import { format } from 'util';

import { Filter, Condition, Item } from '../interface';
import { ConditionType } from '../enum';

export class Query {
  protected TableName: string;

  protected ConditionExpression: string;

  protected ExpressionAttributeValues: Item;

  constructor(tableName: string) {
    this.TableName = tableName;
    this.ConditionExpression = '';
    this.ExpressionAttributeValues = {};
  }

  public setCondition(condition?: Filter): Query {
    if (!condition || !Object.keys(condition).length) {
      return this;
    }

    const { and, or } = condition;
    let andCondition = '';
    let orCondition = '';

    if (and) {
      let array;

      if (Array.isArray(and)) {
        array = and;
      } else {
        array = [and];
      }

      andCondition = this.getFilterCondition(array, 'and');
    }

    if (or) {
      let array;

      if (Array.isArray(or)) {
        array = or;
      } else {
        array = [or];
      }

      orCondition = this.getFilterCondition(array, 'or');
    }

    this.ConditionExpression = this.mergeConditions(andCondition, orCondition);

    return this;
  }

  protected getKey(key: string): string {
    return `:${key}`;
  }

  protected isObjectEmpty(obj: Record<string, any>): number {
    return Object.keys(obj).length;
  }

  // KeyConditionExpression: 'HashKey = :hkey and RangeKey > :rkey',
  // ExpressionAttributeValues: {
  //   ':hkey': 'key',
  //   ':rkey': 2015
  // }
  private getFilterCondition(array: Condition[], type: 'and' | 'or'): string {
    let condition = '';

    array.forEach((e, i) => {
      if (i) {
        condition += ` ${type} `;
      }

      switch (e.condition) {
        case ConditionType.EXISTS:
        case ConditionType.NOT_EXISTS:
          condition += format(e.condition, e.colName);
          break;
        case ConditionType.CONTAINS: {
          const key = this.getKey(e.colName);

          condition += `${e.condition}(${e.colName}, ${key})`;
          this.ExpressionAttributeValues[key] = e.colValue;
          break;
        }
        case ConditionType.BETWEEN: {
          condition += `${e.colName} ${e.condition} :start and :end`;

          /* istanbul ignore else */
          if (Array.isArray(e.colValue)) {
            const [start, end] = e.colValue;

            this.ExpressionAttributeValues[':start'] = start;
            this.ExpressionAttributeValues[':end'] = end;
          }
          break;
        }
        case ConditionType.IN: {
          const keys: string[] = [];

          /* istanbul ignore else */
          if (Array.isArray(e.colValue)) {
            e.colValue.forEach((value: string | number, index: number) => {
              const key = this.getKey(`uniqueId${index}`);

              keys.push(key);
              this.ExpressionAttributeValues[key] = value;
            });
          }

          condition += `${e.colName} ${e.condition} (${keys.join(',')})`;
          break;
        }
        case ConditionType.BEGINS_WITH: {
          const key = this.getKey(e.colName);

          condition += `${e.condition}(${e.colName}  ,${key})`;
          this.ExpressionAttributeValues[key] = e.colValue;
          break;
        }
        default: {
          const key = this.getKey(e.colName);

          condition += `${e.colName} ${e.condition} ${key}`;
          this.ExpressionAttributeValues[key] = e.colValue;
          break;
        }
      }
    });

    return condition;
  }

  private mergeConditions(andCondition: string, orCondition: string): string {
    let cond = andCondition;

    if (orCondition) {
      if (andCondition) {
        cond += ` and `;
      }

      cond += `(${orCondition})`;
    }

    return cond;
  }
}
