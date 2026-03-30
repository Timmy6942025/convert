import type { FileFormat } from "../core/types.ts";

export type ArtifactKind = "file" | "directory" | "sequence";

export interface ArtifactRef {
  kind: ArtifactKind;
  path: string;
  format?: FileFormat;
  size?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversionInput {
  artifact: ArtifactRef;
  format: FileFormat;
}

export interface ConversionOutput {
  artifacts: ArtifactRef[];
  format: FileFormat;
}
