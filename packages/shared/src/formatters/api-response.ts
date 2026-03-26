export class ApiResponse {
  static success<T>(data: T, message: string = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, code?: string) {
    return {
      success: false,
      message,
      code,
    };
  }
}
