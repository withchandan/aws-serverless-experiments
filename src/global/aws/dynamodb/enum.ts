/* eslint-disable no-shadow */

export enum ReturnValue {
  NONE = 'NONE',
  ALL_OLD = 'ALL_OLD',
  ALL_NEW = 'ALL_NEW',
  UPDATE_NEW = 'UPDATE_NEW',
  UPDATED_OLD = 'UPDATED_OLD',
}

export enum ConditionType {
  EQUAL = '=',
  NOT_EQUAL = '<>',
  IN = 'in',
  LESS_OR_EQUAL = '<=',
  LESS_THAN = '<',
  GREATER_OR_EQUAL = '>=',
  GREATER_THAN = '>',
  BETWEEN = 'between',
  CONTAINS = 'contains',
  BEGINS_WITH = 'begins_with',
  EXISTS = 'attribute_exists(%s)',
  NOT_EXISTS = 'attribute_not_exists(%s)',
}

export enum UpdateAction {
  SET = 'SET',
  REMOVE = 'REMOVE',
  ADD = 'ADD',
  DELETE = 'DELETE',
}
