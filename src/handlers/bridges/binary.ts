import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult } from "../base.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

export class BinaryBridgeHandler implements ConversionHandler {
  readonly name = "binary-bridge";
  readonly capabilities = {
    startupCost: 1,
    priority: 5,
    deterministic: true,
    supportsAnyInput: true,
  };

  readonly rules = [{ from: "*", to: "*", cost: 420, lossless: false }];

  async convert(_ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    await mkdir(dirname(request.outputPath), { recursive: true });
    await copyFile(request.input.path, request.outputPath);
    return { output: await toFileArtifact(request.outputPath) };
  }
}
