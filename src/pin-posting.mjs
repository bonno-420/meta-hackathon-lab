// Text entry (fix F1): pin a posting handed to the tool as text into
// the existing original format, and build the FACT-file and manifest
// shapes the existing approval tooling already consumes. Pinning is
// mechanical: the text is split into numbered lines exactly as given;
// nothing is interpreted, summarised, or completed here.

import { createHash } from "node:crypto";

export function sha256Bytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Pin posting text as a source artifact in the original format
// ({ id, version, lines: [{ id: "L01", text }, ...] }). Empty lines
// are dropped (they carry no statement); every kept line keeps its
// text byte-for-byte (after trimming surrounding whitespace, which is
// a presentation artefact of the text file, not content).
export function pinPostingText({ id, version = "v1", text }) {
  if (typeof id !== "string" || id.length === 0) throw new Error("pinPostingText: id is required");
  if (typeof text !== "string" || text.trim().length === 0) throw new Error("pinPostingText: text is empty");
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((t, i) => ({ id: `L${String(i + 1).padStart(2, "0")}`, text: t }));
  return { id, version, lines };
}

// Build a FACT file in the shape of src/facts/*-facts-v1.json from an
// extraction result's items.
export function buildFactsFile({ items, originalId, originalVersion, promptVersion, model, sourceRun }) {
  return {
    factsId: `${originalId}-facts`,
    factsVersion: 1,
    originalId,
    originalVersion,
    promptVersion: promptVersion ?? null,
    model: model ?? null,
    sourceRun: sourceRun ?? null,
    items: Array.isArray(items) ? items : [],
  };
}

// Build the manifest the approval-draft tooling checks hashes against
// ({ original: { id, version, sha256 }, sha256 } where sha256 is the
// FACT file's hash).
export function buildManifest({ originalId, originalVersion, originalSha256, factsSha256 }) {
  return {
    original: { id: originalId, version: originalVersion, sha256: originalSha256 },
    sha256: factsSha256,
  };
}
