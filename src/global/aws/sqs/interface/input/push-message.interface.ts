export interface PushMessageInput {
  /**
   * The length of time, in seconds, for which to delay a specific message.
   * Valid values: 0 to 900. It is applicable when you push single message.
   */
  delaySeconds?: number;

  /**
   * This parameter applies only to FIFO (first-in-first-out) queues.
   * The tag that specifies that a message belongs to a specific message group.
   * Messages that belong to the same message group are processed in a FIFO manner
   */
  messageGroupId?: string;

  /**
   * This parameter applies only to FIFO (first-in-first-out) queues.
   * The token used for deduplication of sent messages.
   * If a message with a particular MessageDeduplicationId is sent successfully,
   * any messages sent with the same MessageDeduplicationId are accepted successfully
   * but aren't delivered during the 5-minute deduplication interval.
   */
  messageDeduplicationId?: string;

  /**
   * The message to send. The maximum string size is 256 KB.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: { [key: string]: any } | string;
}
