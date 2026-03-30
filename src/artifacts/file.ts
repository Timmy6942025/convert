import { stat } from "node:fs/promises";
import type { ArtifactRef } from "./artifact.ts";

export async function toFileArtifact(path: string): Promise<ArtifactRef> {
  const fileStat = await stat(path);
  return {
    kind: "file",
    path,
    size: fileStat.size,
  };
}
