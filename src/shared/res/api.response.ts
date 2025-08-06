import { HttpStatus } from '@nestjs/common';

class ApiResponse<T> {
  constructor(
    public statusCode: number,
    public data: T,

    public message?: string,

    public error?: string,
  ) {
    this.data = this.serializeBigInt(data);
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(
      JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value,
      ),
    );
  }
}

class OkResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'OK') {
    super(HttpStatus.OK, data, message, null);
  }
}

class InternalServerErrorResponse extends ApiResponse<null> {
  constructor(error = 'Internal Server Error') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, null, null, error);
  }
}

class CreatedResponse<T> extends ApiResponse<T> {
  constructor(data: T, message = 'Created') {
    super(HttpStatus.CREATED, data, message, null);
  }
}

class BadRequestResponse extends ApiResponse<null> {
  constructor(error = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, null, null, error);
  }
}

class NotFoundResponse extends ApiResponse<null> {
  constructor(error = 'Not Found') {
    super(HttpStatus.NOT_FOUND, null, null, error);
  }
}

class ForbiddenResponse extends ApiResponse<null> {
  constructor(error = 'Access Denied') {
    super(HttpStatus.FORBIDDEN, null, null, error);
  }
}

export {
  ApiResponse,
  OkResponse,
  CreatedResponse,
  BadRequestResponse,
  NotFoundResponse,
  InternalServerErrorResponse,
  ForbiddenResponse,
};
