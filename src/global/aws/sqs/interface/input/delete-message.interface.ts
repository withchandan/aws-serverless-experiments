export interface AwsQueue {
  /**
   * A receipt handle.
   */
  receiptHandle: string;
}

export interface DeleteMessageInput extends AwsQueue {
  /**
   * An identifier for this particular receipt handle. This is used to communicate the result.
   */
  id: string;
}
