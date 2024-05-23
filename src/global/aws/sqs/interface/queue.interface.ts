import {
  DeleteMessageInput,
  ListQueueOptions,
  PushMessageInput,
} from './input';
import { DeleteMessageRes, PushMessageRes } from './output';

export interface Queue {
  createQueue(name: string): Promise<string>;

  deleteQueue(name: string): Promise<void>;

  clearQueue(name: string): Promise<void>;

  getQueueUrl(name: string): Promise<string>;

  push(
    name: string,
    message: PushMessageInput | PushMessageInput[],
  ): Promise<PushMessageRes>;

  deleteMessage(
    name: string,
    message: DeleteMessageInput | DeleteMessageInput[],
  ): Promise<DeleteMessageRes>;

  listQueues(options?: ListQueueOptions): Promise<string[]>;
}
