export interface PushMessageSuccess {
  /**
   * An identifier for the message in this batch.
   */
  id?: string;

  /**
   * An identifier for the message.
   */
  messageId: string;
}

export interface PushMessageFailed {
  /**
   * The Id of an entry in a batch request.
   */
  id?: string;

  /**
   * A message explaining why the action failed on this entry.
   */
  errorMsg?: string;

  /**
   * An error code representing why the action failed on this entry.
   */
  errorCode?: string;
}

export interface PushMessageRes {
  /**
   * List of pushed messages.
   */
  success: PushMessageSuccess[];

  /**
   * List of messages failed to push.
   */
  failed: PushMessageFailed[];
}
