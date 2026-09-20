export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, string>;

  constructor(message: string, statusCode = 400, details?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
