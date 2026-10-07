import Script from "next/script";
import { readFileSync } from "node:fs";
import path from "node:path";

// Step 1 of the port: the original single-file app runs unchanged.
// public/ledger.js renders into this static shell and keeps its data in
// localStorage. Later steps move it into React components and Supabase.
const shell = readFileSync(path.join(process.cwd(), "src/app/shell.html"), "utf8");

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: shell }} />
      <Script src="/ledger.js" strategy="afterInteractive" />
    </>
  );
}
