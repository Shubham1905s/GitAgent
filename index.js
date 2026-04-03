import { query } from "gitclaw";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commentOnPR, createPR, getPRDiff, mergePR } from "./github.js";

/**
 * polyfill for createAgent if not exported by gitclaw
 */
async function createAgent({ repoPath }) {
  return {
    run: async ({ input }) => {
      const result = query({
        dir: repoPath,
        prompt: input,
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
      return finalResponse;
    },
  };
}

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
  const pull_number = Number(process.env.GITHUB_PR_NUMBER);
  const devBranch = process.env.GITHUB_DEV_BRANCH || "dev";
  const stagingBranch = process.env.GITHUB_STAGING_BRANCH || "staging";
  const mainBranch = process.env.GITHUB_MAIN_BRANCH || "main";

  if (!owner || !repo || !Number.isInteger(pull_number) || pull_number <= 0) {
    throw new Error(
      "Missing GitHub config. Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_PR_NUMBER in .env.",
    );
  }

  const agent = await createAgent({
    repoPath: "./",
  });

  console.log("Fetching PR...");
  const diff = await getPRDiff(owner, repo, pull_number);

  // 🔍 Code Review
  console.log("Running AI review...");
  const review = await agent.run({
    input: `Review this GitHub pull request diff. Focus on correctness, bugs, and edge cases.\n\nDiff:\n${diff}`,
  });

  await commentOnPR(owner, repo, pull_number, "### 🤖 AI Review\n" + review);

  // ⚠️ Risk Scoring
  console.log("Analyzing risk...");
  const risk = await agent.run({
    input: `Analyze the risk of this PR diff. Classify it as LOW RISK, MEDIUM RISK, or HIGH RISK.\n\nDiff:\n${diff}`,
  });

  await commentOnPR(owner, repo, pull_number, "### ⚠️ Risk Analysis\n" + risk);

  const isHighRisk = risk.toLowerCase().includes("high");

  // 🧠 Decision Logic
  if (isHighRisk) {
    console.log("⚠️ High risk PR. Waiting for human approval.");

    await commentOnPR(
      owner,
      repo,
      pull_number,
      "🚨 High-risk PR detected. Requires manual approval before promotion."
    );

    return;
  }

  console.log("✅ Low risk PR. Auto promoting...");

  // 🚀 Promote dev → staging
  console.log(`Promoting ${devBranch} -> ${stagingBranch}...`);
  const stagingPR = await createPR(
    owner,
    repo,
    `Promote ${devBranch} -> ${stagingBranch}`,
    devBranch,
    stagingBranch,
    "Automated promotion after AI PR review."
  );

  await mergePR(owner, repo, stagingPR.number);

  // 🚀 Promote staging → main
  console.log(`Promoting ${stagingBranch} -> ${mainBranch}...`);
  const mainPR = await createPR(
    owner,
    repo,
    `Promote ${stagingBranch} -> ${mainBranch}`,
    stagingBranch,
    mainBranch,
    "Automated promotion after staging approval gate."
  );

  await mergePR(owner, repo, mainPR.number);

  await commentOnPR(
    owner,
    repo,
    pull_number,
    "🚀 Successfully promoted to production!"
  );

  console.log("🎉 Done!");
}

run().catch((error) => {
  console.error("\n=== AGENT ERROR ===\n");
  console.error(error.message || String(error));
  process.exit(1);
});
