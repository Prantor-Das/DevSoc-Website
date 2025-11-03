class ApiError extends Error {
  public statusCode: number;
  public data: any | null;
  public success: boolean;
  public errors: any[];

  /**
   * Custom API Error class
   * @param statusCode - HTTP status code
   * @param message - Error message
   * @param errors - Extra error details
   * @param stack - Custom stack trace
   */
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack: string = ""
  ) {
    super(message);

    // Fix for extending built-in Error in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack ?? "";
    }
  }
}

export { ApiError };
