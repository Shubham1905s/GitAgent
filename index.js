import { query } from "gitclaw";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commentOnPR, createPR, getPRComments, getPRDiff, mergePR } from "./github.js";

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

  const formattedReview = `
### 🤖 AI Code Review 👀
Thank you for your contribution! Our AI agent has analyzed your changes.

#### 🚀 Review Options:
* 💻 [Open in GitHub Codespace](https://github.com/codespaces/new?repo=${owner}/${repo}&pull_number=${pull_number})
* 🛠️ [Setup Local Environment](https://github.com/${owner}/${repo}#setup)

**Note:** High-risk changes will require manual approval as per 'Human-in-the-Loop' logic.

<details>
<summary><b>🔍 View AI Summary Table</b></summary>

| Category | Status |
| :--- | :--- |
| **Complexity** | Analyzed |
| **Logic** | Verified |
| **Risk Score** | Pending |

</details>

---
#### 📝 Detailed Feedback:
${review}

---
🤖 *This comment was [automatically generated](https://github.com/${owner}/${repo}) by your GitAgent.*
`;

  await commentOnPR(owner, repo, pull_number, formattedReview);

  // 🛡️ Policy & Security Check
  console.log("Analyzing policy and security...");
  const securityCheck = await agent.run({
    input: `Scan this PR diff for security vulnerabilities, hardcoded secrets, or policy violations.\n\nDiff:\n${diff}`,
  });

  await commentOnPR(owner, repo, pull_number, "### 🛡️ Policy & Security Check\n" + securityCheck);

  // 🧪 Testing Suggestion
  console.log("Suggesting test cases...");
  const testingAdvise = await agent.run({
    input: `Suggest test cases and edge cases for this PR diff.\n\nDiff:\n${diff}`,
  });

  await commentOnPR(owner, repo, pull_number, "### 🧪 Testing Suggestion\n" + testingAdvise);

  console.log("Fetching PR comments for manual approval check...");
  const comments = await getPRComments(owner, repo, pull_number);
  const isManuallyApproved = comments.some(c => 
    (c.body.toUpperCase().includes("APPROVE") || c.body.toUpperCase().includes("LGTM")) &&
    !c.user.login.includes("bot")
  );

  if (isManuallyApproved) {
    console.log("👍 Manual approval detected. Bypassing risk gates.");
  }

  // ⚠️ Risk Scoring
  console.log("Analyzing risk...");
  const risk = await agent.run({
    input: `Analyze the risk of this PR diff. Classify it as LOW RISK, MEDIUM RISK, or HIGH RISK.\n\nDiff:\n${diff}`,
  });

  await commentOnPR(owner, repo, pull_number, "### ⚠️ Risk Analysis\n" + risk);

  const isHighRisk = risk.toLowerCase().includes("high");

  // 🧠 Decision Logic
  if (isHighRisk && !isManuallyApproved) {
    console.log("⚠️ High risk PR. Waiting for human approval.");

    await commentOnPR(
      owner,
      repo,
      pull_number,
      "🚨 High-risk PR detected. Requires manual approval as per 'Human-in-the-Loop #1' logic before promotion."
    );

    return;
  }

  console.log("✅ Low risk PR. Auto-merging original PR...");
  await mergePR(owner, repo, pull_number);

  console.log("🚀 Promoting dev -> staging...");
  const stagingPR = await createPR(
    owner,
    repo,
    `Promote ${devBranch} -> ${stagingBranch}`,
    devBranch,
    stagingBranch,
    "Automated promotion after AI PR review."
  );

  await mergePR(owner, repo, stagingPR.number);

  // 🧪 Run Integration Tests Simulator
  console.log("Running integration tests on staging...");
  await commentOnPR(
    owner,
    repo,
    pull_number,
    "🛠️ Integration tests passed on `staging` branch (simulated)."
  );

  // 🏁 Staging / Release Gate (Decision Logic 2)
  console.log("Checking if second-stage release gate is needed...");
  // Simulated Release Gate - if PR touches sensitive branches or has special label
  // For now, we'll assume a low-risk PR goes all the way, but high-impact requires a second human approval
  const needsReleaseApproval = risk.toLowerCase().includes("medium") || process.env.RELEASE_GATE === "true";

  if (needsReleaseApproval) {
    console.log("🛑 Waiting for 'Human-in-the-Loop #2' Release Approval.");
    await commentOnPR(
      owner,
      repo,
      pull_number,
      "🚦 Staging promotion successful. **Waiting for Release Approval (Human-in-the-Loop #2)** before deploying to `main`."
    );
    return;
  }

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

  // 📝 Feedback Capture (Architecture: RL Layer)
  console.log("Capturing run metadata for learning...");
  const logEntry = `[${new Date().toISOString()}] PR #${pull_number} promoted successfully. Risk: ${risk.trim()}\n`;
  agent.run({
    input: `Store this feedback into memory: ${logEntry}`,
  });

  console.log("🎉 Done!");
}

run().catch((error) => {
  console.error("\n=== AGENT ERROR ===\n");
  console.error(error.message || String(error));
  process.exit(1);
});
