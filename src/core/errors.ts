export enum ExitCode {
  Ok = 0,
  ConversionFailed = 1,
  InvalidArgs = 2,
  UnsupportedRoute = 3,
  EnvironmentError = 4,
  InternalError = 5,
}

export class CliError extends Error {
  readonly exitCode: ExitCode;

  constructor(message: string, exitCode: ExitCode) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}
