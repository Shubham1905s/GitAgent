import { query } from "gitclaw";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commentOnPR, getPRDiff } from "./github.js";

function loadLocalEnv() {
  const envPath = resolve(".env");
  if (!existsSync(envPath)) return;

  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadLocalEnv();

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const pullNumber = Number(process.env.GITHUB_PR_NUMBER);

  if (!owner || !repo || !Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new Error(
      "Missing GitHub config. Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_PR_NUMBER in .env.",
    );
  }

  console.log("Fetching PR...");
  const diff = await getPRDiff(owner, repo, pullNumber);

  console.log("Running AI review...");

  const result = query({
    dir: "./",
    prompt: [
      "Review this GitHub pull request diff.",
      "Focus on correctness, bugs, edge cases, missing tests, and security concerns.",
      "Keep the feedback concise and actionable.",
      "",
      `Repository: ${owner}/${repo}`,
      `Pull Request: #${pullNumber}`,
      "",
      "Diff:",
      diff,
    ].join("\n"),
  });

  let finalResponse = "";

  for await (const message of result) {
    if (message.type === "assistant") {
      finalResponse = message.content;
    }

    if (message.type === "system" && message.subtype === "error") {
      throw new Error(message.content);
    }
  }

  if (!finalResponse) {
    throw new Error("No response received from the agent.");
  }

  console.log("Posting comment...");
  await commentOnPR(owner, repo, pullNumber, finalResponse);

  console.log("\n=== AGENT RESPONSE ===\n");
  console.log(finalResponse);
  console.log("\n✅ Done! Check your PR.");
}

run().catch((error) => {
  console.error("\n=== AGENT ERROR ===\n");
  console.error(error.message || String(error));
  process.exit(1);
});
