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

export { ApiResponse };
