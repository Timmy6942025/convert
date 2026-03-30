export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export class ConsoleLogger implements Logger {
  private readonly verbose: boolean;
  private readonly quiet: boolean;

  constructor(verbose: boolean, quiet: boolean) {
    this.verbose = verbose;
    this.quiet = quiet;
  }

  info(message: string): void {
    if (!this.quiet) {
      console.log(message);
    }
  }

  warn(message: string): void {
    if (!this.quiet) {
      console.warn(message);
    }
  }

  error(message: string): void {
    console.error(message);
  }

  debug(message: string): void {
    if (this.verbose && !this.quiet) {
      console.log(message);
    }
  }
}
