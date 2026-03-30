import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class Workspace {
  readonly root: string;
  readonly inputDir: string;
  readonly stepsDir: string;
  readonly outputDir: string;
  readonly logsDir: string;

  private constructor(root: string) {
    this.root = root;
    this.inputDir = join(root, "input");
    this.stepsDir = join(root, "steps");
    this.outputDir = join(root, "output");
    this.logsDir = join(root, "logs");
  }

  static async create(prefix = "convert-"): Promise<Workspace> {
    const root = await mkdtemp(join(tmpdir(), prefix));
    const workspace = new Workspace(root);
    await mkdir(workspace.inputDir, { recursive: true });
    await mkdir(workspace.stepsDir, { recursive: true });
    await mkdir(workspace.outputDir, { recursive: true });
    await mkdir(workspace.logsDir, { recursive: true });
    return workspace;
  }

  stepDir(index: number): string {
    const normalized = String(index + 1).padStart(2, "0");
    return join(this.stepsDir, normalized);
  }

  async ensureStepDir(index: number): Promise<string> {
    const path = this.stepDir(index);
    await mkdir(path, { recursive: true });
    return path;
  }

  async cleanup(keepTemp: boolean): Promise<void> {
    if (keepTemp) {
      return;
    }
    await rm(this.root, { recursive: true, force: true });
  }
}
