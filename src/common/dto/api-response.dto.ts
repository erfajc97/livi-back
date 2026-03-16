export class ApiResponseDto<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;

  constructor(
    statusCode: number,
    message: string,
    data: T,
    path: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

export class ApiErrorDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;

  constructor(
    statusCode: number,
    message: string | string[],
    error: string,
    path: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
