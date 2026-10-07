import { readFileSync } from "node:fs";
import path from "node:path";
import LegacyApp from "./legacy-app";

// The original app renders into this static shell and keeps its data in
// localStorage. Its math comes from src/lib/model; screens move to React
// components in later steps.
const shell = readFileSync(path.join(process.cwd(), "src/app/shell.html"), "utf8");

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: shell }} />
      <LegacyApp />
    </>
  );
}
