import type { BundleResolver } from "../bundle/resolve.ts";
import type { Logger } from "../core/logger.ts";
import type { Workspace } from "../executor/workspace.ts";
import type { ConversionHandler, HandlerContext } from "./base.ts";
import { BinaryBridgeHandler } from "./bridges/binary.ts";
import { TextBridgeHandler } from "./bridges/text.ts";
import { FfmpegHandler } from "./native/ffmpeg.ts";
import { ImageMagickHandler } from "./native/imagemagick.ts";
import { PandocHandler } from "./native/pandoc.ts";
import { SevenZipHandler } from "./native/sevenzip.ts";

export class HandlerRegistry {
  private readonly handlers: ConversionHandler[];
  private readonly availability = new Map<string, boolean>();

  constructor(handlers?: ConversionHandler[]) {
    this.handlers =
      handlers ??
      [
        new FfmpegHandler(),
        new ImageMagickHandler(),
        new PandocHandler(),
        new SevenZipHandler(),
        new TextBridgeHandler(),
        new BinaryBridgeHandler(),
      ];
  }

  async init(ctx: {
    workspace: Workspace;
    bundle: BundleResolver;
    logger: Logger;
    timeoutMs?: number;
  }): Promise<void> {
    const handlerContext: HandlerContext = {
      workspace: ctx.workspace,
      bundle: ctx.bundle,
      logger: ctx.logger,
      timeoutMs: ctx.timeoutMs,
    };

    for (const handler of this.handlers) {
      if (handler.init) {
        await handler.init(handlerContext);
      }
      if (handler.isAvailable) {
        this.availability.set(handler.name, await handler.isAvailable(handlerContext));
      } else {
        this.availability.set(handler.name, true);
      }
    }
  }

  all(): ConversionHandler[] {
    return [...this.handlers];
  }

  availableHandlers(): ConversionHandler[] {
    return this.handlers.filter((handler) => this.availability.get(handler.name) ?? true);
  }

  status(): Array<{ name: string; available: boolean }> {
    return this.handlers.map((handler) => ({
      name: handler.name,
      available: this.availability.get(handler.name) ?? true,
    }));
  }
}
