import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { ApiErrorDto } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // Debug: log all non-HTTP exceptions
    if (!(exception instanceof HttpException) && !(exception instanceof MulterError)) {
      console.error('[UnhandledException]', exception);
    }

    if (exception instanceof MulterError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no debe superar los 5 MB.'
          : 'No se pudo subir el archivo.';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || error;
      }
    }

    const errorResponse = new ApiErrorDto(status, message, error, request.url);

    response.status(status).json(errorResponse);
  }
}
