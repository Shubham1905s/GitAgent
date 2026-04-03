import { query } from "gitclaw";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commentOnPR, createPR, getPRDiff, mergePR } from "./github.js";

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
  const devBranch = process.env.GITHUB_DEV_BRANCH || "dev";
  const stagingBranch = process.env.GITHUB_STAGING_BRANCH || "staging";
  const mainBranch = process.env.GITHUB_MAIN_BRANCH || "main";

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
  await commentOnPR(owner, repo, pullNumber, `AI Review\n\n${finalResponse}`);

  const normalizedResponse = finalResponse.toLowerCase();
  const isSafe = !normalizedResponse.includes("error");

  if (!isSafe) {
    console.log("❌ PR not safe. Skipping promotion.");
    console.log("\n=== AGENT RESPONSE ===\n");
    console.log(finalResponse);
    return;
  }

  console.log(`Promoting ${devBranch} -> ${stagingBranch}...`);
  const stagingPR = await createPR(
    owner,
    repo,
    `Promote ${devBranch} -> ${stagingBranch}`,
    devBranch,
    stagingBranch,
    "Automated promotion after AI PR review.",
  );

  console.log("Merging to staging...");
  await mergePR(owner, repo, stagingPR.number);

  console.log(`Promoting ${stagingBranch} -> ${mainBranch}...`);
  const mainPR = await createPR(
    owner,
    repo,
    `Promote ${stagingBranch} -> ${mainBranch}`,
    stagingBranch,
    mainBranch,
    "Automated promotion after staging approval gate.",
  );

  console.log("Merging to main...");
  await mergePR(owner, repo, mainPR.number);

  console.log("\n=== AGENT RESPONSE ===\n");
  console.log(finalResponse);
  console.log("\n✅ Done! Check your PR.");
}

run().catch((error) => {
  console.error("\n=== AGENT ERROR ===\n");
  console.error(error.message || String(error));
  process.exit(1);
});
