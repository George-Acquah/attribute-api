import { HttpStatus } from '@nestjs/common';

class ApiResponse<T> {
  constructor(
    public statusCode: number,

    public message: string,

    public data: T,
  ) {}
}

class OkResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'OK') {
    super(HttpStatus.OK, message, data);
  }
}

class InternalServerErrorResponse extends ApiResponse<null> {
  constructor(message = 'Internal Server Error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, null);
  }
}

class CreatedResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'Created') {
    super(HttpStatus.CREATED, message, data);
  }
}

class BadRequestResponse extends ApiResponse<null> {
  constructor(message = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, message, null);
  }
}

class NotFoundResponse extends ApiResponse<null> {
  constructor(message = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message, null);
  }
}

class FResponse extends ApiResponse<null> {
  constructor(message = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message, null);
  }
}

export {
  ApiResponse,
  OkResponse,
  CreatedResponse,
  BadRequestResponse,
  NotFoundResponse,
  InternalServerErrorResponse,
  FResponse,
};
