export class HttpError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);

    this.status = status;

    Object.setPrototypeOf(this, HttpError.prototype);

    this.name = this.constructor.name;
  }
}
