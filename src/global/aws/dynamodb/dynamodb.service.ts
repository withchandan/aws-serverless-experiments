/* eslint-disable object-curly-newline */
/* istanbul ignore file */
import { Injectable } from '@nestjs/common';
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  BatchGetCommand,
  BatchWriteCommand,
  DynamoDBDocumentClient,
  DeleteCommand,
  TransactWriteCommandInput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  DynamoDBClient,
  AttributeValue,
  ReturnValue,
} from '@aws-sdk/client-dynamodb';

import {
  KeyCondition,
  QueryOptions,
  QueryResponse,
  TransactWriteInput,
} from './interface';
import {
  DeleteItemBuilder,
  PutItemBuilder,
  QueryBuilder,
  UpdateQueryBuilder,
} from './query-builder';

@Injectable()
export class DynamodbService {
  private readonly client: DynamoDBDocumentClient;

  constructor() {
    const ddbClient = new DynamoDBClient({ region: 'ap-south-1' });
    const marshallOptions = {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = { wrapNumbers: false };
    const translateConfig = { marshallOptions, unmarshallOptions };
    // Create the DynamoDB Document client.

    this.client = DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }

  public async write<T>(tableName: string, data: T): Promise<void> {
    // Set the parameters.
    const params = {
      TableName: tableName,
      Item: data,
    };

    await this.client.send(new PutCommand(params));
  }

  public async findOne<T>(
    tableName: string,
    pk: string,
    sk: string,
  ): Promise<T | undefined> {
    const command = new GetCommand({
      TableName: tableName,
      Key: { pk, sk },
    });

    const { Item } = await this.client.send(command);

    return Item as T;
  }

  public async update<T, V>(
    tableName: string,
    pk: string,
    sk: string,
    data: V,
  ): Promise<T> {
    let updateExpression = `SET`;
    const expressionAttributes: Record<string, AttributeValue> = {};

    Object.entries(data).forEach((entry, index) => {
      if (index) {
        updateExpression += ',';
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [key, value] = entry;

      updateExpression += ` ${key} = :${key}`;
      expressionAttributes[`:${key}`] = value as AttributeValue;
    });

    const params = {
      TableName: tableName,
      Key: { pk, sk } as unknown as Record<string, AttributeValue>,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributes,
      ReturnValues: ReturnValue.ALL_NEW,
    };
    const { Attributes } = await this.client.send(new UpdateCommand(params));

    return Attributes as T;
  }

  public async batchWrite<T>(tableName: string, data: T[]): Promise<void> {
    const params = {
      RequestItems: {
        [tableName]: data.map((ele) => ({ PutRequest: { Item: ele } })),
      },
    };

    await this.client.send(new BatchWriteCommand(params));
  }

  public async batchRead<T>(
    tableName: string,
    keys: Record<string, unknown>[],
  ): Promise<T[]> {
    const command = new BatchGetCommand({
      RequestItems: { [tableName]: { Keys: keys } },
    });

    const { Responses } = await this.client.send(command);

    return Responses[tableName] as T[];
  }

  public async query<T>(
    tableName: string,
    key: KeyCondition,
    options?: QueryOptions,
  ): Promise<QueryResponse<T>> {
    const qb = new QueryBuilder(tableName, key);

    if (options) {
      const { indexName, offset, limit, select, reverseSort } = options;

      qb.setIndex(indexName)
        .setLimit(limit)
        .setOffset(offset)
        .setSelect(select)
        .setReverseSort(reverseSort);
    }

    const params = qb.getParam();
    const command = new QueryCommand(params);
    const result = await this.client.send(command);

    const { Items, LastEvaluatedKey } = result;

    return {
      items: (Items || []) as T[],
      ...(LastEvaluatedKey && { offset: JSON.stringify(LastEvaluatedKey) }),
    };
  }

  public async delete(
    tableName: string,
    pk: string,
    sk: string,
  ): Promise<void> {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { pk, sk },
    });

    await this.client.send(command);
  }

  public async atomicUpdate<T>(
    tableName: string,
    pk: string,
    sk: string,
    updateData: Record<string, number | string>,
  ): Promise<T> {
    const updateQueryBuilder = new UpdateQueryBuilder(tableName, { pk, sk });
    const params = updateQueryBuilder
      .setAddAttributes(updateData)
      .getUpdateParam();

    const command = new UpdateCommand(params);

    const { Attributes } = await this.client.send(command);

    return Attributes as T;
  }

  public async transactWrite(
    transactWriteInput: TransactWriteInput[],
  ): Promise<void> {
    const TransactItems: TransactWriteCommandInput = { TransactItems: [] };

    transactWriteInput.forEach((item) => {
      if (item.put) {
        const params = new PutItemBuilder(item.tableName, item.put.data)
          .setCondition(item.put.condition)
          .getPutItemParams();

        /* istanbul ignore else */
        if (TransactItems.TransactItems) {
          TransactItems.TransactItems.push({ Put: params });
        }
      }

      if (item.delete) {
        const params = new DeleteItemBuilder(item.tableName, item.delete.key)
          .setCondition(item.delete.condition)
          .getDeleteItemParam();

        /* istanbul ignore else */
        if (TransactItems.TransactItems) {
          TransactItems.TransactItems.push({ Delete: params });
        }
      }

      if (item.update) {
        const { update } = item;

        const updateQueryBuilder = new UpdateQueryBuilder(
          item.tableName,
          update.key,
        );
        const params = updateQueryBuilder
          .setCondition(update.condition)
          .setUpdateAttributes(update.update)
          .setRemoveAttributes(update.remove)
          .setAddAttributes(update.add)
          .getUpdateParam();

        /* istanbul ignore else */
        if (TransactItems.TransactItems) {
          TransactItems.TransactItems.push({ Update: params });
        }
      }

      if (item.conditionCheck) {
        const params = new DeleteItemBuilder(
          item.tableName,
          item.conditionCheck.key,
        )
          .setCondition(item.conditionCheck.condition)
          .getDeleteItemParam();

        /* istanbul ignore else */
        if (TransactItems.TransactItems) {
          TransactItems.TransactItems.push({
            ConditionCheck: {
              ...params,
              ConditionExpression: params.ConditionExpression,
            },
          });
        }
      }
    });

    const command = new TransactWriteCommand(TransactItems);

    await this.client.send(command);
  }
}
