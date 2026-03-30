import { arch, platform } from "node:process";

export function platformKey(): string {
  const os = platform;
  const cpu = arch;

  const osPart = os === "win32" ? "windows" : os === "darwin" ? "macos" : os;
  const cpuPart = cpu === "x64" ? "x64" : cpu === "arm64" ? "arm64" : cpu;
  return `${osPart}-${cpuPart}`;
}
