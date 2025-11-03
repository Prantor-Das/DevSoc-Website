class ApiResponse<T = any> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;

  /**
   * Standard API Response class
   * @param statusCode - HTTP status code
   * @param data - Response data
   * @param message - Response message (defaults to "Success")
   */
  constructor(statusCode: number, data: T, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
