import fs from "fs";
import path from "path";
import type { BenchmarkSnapshot } from "@/lib/benchmarks/snapshotSchema";

const SNAPSHOTS_DIR = path.join(process.cwd(), "benchmarks", "snapshots");
const BASELINES_DIR = path.join(process.cwd(), "benchmarks", "baselines");

export function listSnapshotPaths(): string[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(SNAPSHOTS_DIR, f))
    .sort(); // ISO filenames sort chronologically
}

export function loadSnapshot(filePath: string): BenchmarkSnapshot {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as BenchmarkSnapshot;
}

export function loadLatestSnapshot(): BenchmarkSnapshot | null {
  const paths = listSnapshotPaths();
  if (paths.length === 0) return null;
  return loadSnapshot(paths[paths.length - 1]);
}

export function loadPreviousSnapshot(currentRunId: string): BenchmarkSnapshot | null {
  const paths = listSnapshotPaths();
  // Exclude the current run's file (same runId encoded in filename)
  const safe = currentRunId.replace(/[:.]/g, "-");
  const others = paths.filter((p) => !p.includes(safe));
  if (others.length === 0) return null;
  return loadSnapshot(others[others.length - 1]);
}

export function loadBaseline(name = "baseline-v1"): BenchmarkSnapshot | null {
  const filePath = path.join(BASELINES_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return loadSnapshot(filePath);
}

export function listSnapshots(): BenchmarkSnapshot[] {
  return listSnapshotPaths().map(loadSnapshot);
}
