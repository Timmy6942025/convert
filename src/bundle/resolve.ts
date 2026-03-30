import { constants as fsConstants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CliError, ExitCode } from "../core/errors.ts";
import type { BundleManifest, PlatformManifest } from "./manifest.ts";
import { platformKey } from "./platform.ts";

function isExecutable(path: string): Promise<boolean> {
  return access(path, fsConstants.X_OK)
    .then(() => true)
    .catch(() => false);
}

export class BundleResolver {
  readonly assetsDir: string;
  private manifestCache?: BundleManifest;

  constructor(assetsDir?: string) {
    if (assetsDir) {
      this.assetsDir = assetsDir;
      return;
    }

    const fromEnv = process.env.CONVERT_ASSETS_DIR;
    if (fromEnv) {
      this.assetsDir = fromEnv;
      return;
    }

    const currentDir = dirname(fileURLToPath(import.meta.url));
    this.assetsDir = join(currentDir, "../../assets");
  }

  private async manifest(): Promise<BundleManifest | undefined> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    const manifestPath = join(this.assetsDir, "manifest.json");
    try {
      const contents = await readFile(manifestPath, "utf8");
      this.manifestCache = JSON.parse(contents) as BundleManifest;
      return this.manifestCache;
    } catch {
      return undefined;
    }
  }

  async resolveBinary(name: string, allowSystem = true): Promise<string | undefined> {
    const envKey = `CONVERT_BIN_${name.toUpperCase()}`;
    const fromEnv = process.env[envKey];
    if (fromEnv && (await isExecutable(fromEnv))) {
      return fromEnv;
    }

    const manifest = await this.manifest();
    const platform = platformKey();
    const platformManifest: PlatformManifest | undefined = manifest?.platforms[platform];
    const relative = platformManifest?.bins[name];
    if (relative) {
      const candidate = join(this.assetsDir, platform, relative);
      if (await isExecutable(candidate)) {
        return candidate;
      }
    }

    if (allowSystem) {
      const fromSystem = Bun.which(name);
      if (fromSystem) {
        return fromSystem;
      }
    }

    return undefined;
  }

  async mustResolveBinary(name: string): Promise<string> {
    const path = await this.resolveBinary(name);
    if (!path) {
      throw new CliError(
        `Required binary not found: ${name}. Run 'convert doctor' for details.`,
        ExitCode.EnvironmentError,
      );
    }
    return path;
  }
}
