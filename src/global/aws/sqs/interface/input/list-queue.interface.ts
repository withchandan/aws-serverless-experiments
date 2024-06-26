export interface ListQueueOptions {
  /**
   * A string to use for filtering the list results. Only those
   * queues whose name begins with the specified string are
   * returned. Queue URLs and names are case-sensitive.
   */
  prefix?: string;
}
