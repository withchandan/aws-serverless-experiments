export interface DeleteMessageSuccess {
  /**
   * Id of deleted message.
   */
  id: string;
}

export interface DeleteMessageFailed {
  /**
   * The Id of an entry in a batch request.
   */
  id: string;

  /**
   * A message explaining why the action failed on this entry.
   */
  errorMsg?: string;

  /**
   * An error code representing why the action failed on this entry.
   */
  errorCode?: string;
}

export interface DeleteMessageRes {
  /**
   * List of successfully deleted messages.
   */
  success: DeleteMessageSuccess[];

  /**
   * List of messages which failed to delete.
   */
  failed: DeleteMessageFailed[];
}
