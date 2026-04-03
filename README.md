# AI Code Review Agent 🏆

Welcome to the **AI-Powered Code Review and Multi-Stage Deployment** system. This agent automates the entire PR lifecycle—from review and risk analysis to production deployment.

## 🚀 How It Works
1.  **AI Review**: Automatically analyzes the PR diff for bugs, edge cases, and best practices.
2.  **Risk Scoring**: A second analysis classifies the PR risk as **LOW, MEDIUM, or HIGH**.
3.  **Conditional Promotion**:
    *   **🟢 LOW RISK**: Automated promotion through **dev → staging → main**.
    *   **🔴 HIGH RISK**: Workflow halts and waits for manual human approval (indicated via a PR comment).

---

## 🛠️ Setup & Pre-requisites (For Repo Owner)

### 1. GitHub Configuration
*   **Branches**: Ensure that the following branches already exist in your repository:
    *   `dev` (the source branch for the initial PR)
    *   `staging`
    *   `main`
*   **Personal Access Token (PAT)**:
    *   Generate a token at [GitHub Settings](https://github.com/settings/tokens).
    *   **Permissions**: At a minimum, you need `repo` scope (contains `repo:status`, `public_repo`, `repo_deployment`, `repo:invite`, and `security_events`).

### 2. Environment Variables (.env)
Create a `.env` file in the root directory (based on the provided template):
```env
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo
GITHUB_PR_NUMBER=1
GITHUB_TOKEN=your_personal_access_token
GITHUB_DEV_BRANCH=dev
GITHUB_STAGING_BRANCH=staging
GITHUB_MAIN_BRANCH=main
```

### 3. Installation
Before running, ensure all dependencies are installed:
```bash
npm install
```

---

## 🏃 Running the Agent
Simply run the main entry point:
```bash
node index.js
```

---

## 🎯 Important Considerations
*   **Manual Gate**: If a PR touches sensitive auth or payment logic, the AI will likely tag it as **HIGH RISK**. This is a safety feature—don't bypass it without carefully reviewing the code yourself!
*   **Rate Limits**: Be mindful of your GitHub API rate limits if running this script frequently.
*   **No CI Check Integration**: The current version promotes code as long as the AI deems it safe. It is highly recommended to have actual CI (like GitHub Actions) running on the branches before merging in production environments.
*   **Merge Conflicts**: If the promotion branches (`staging` or `main`) are out of sync with `dev`, the merge operation will fail with an error. Ensure your branches are correctly aligned before starting a promotion cycle.

---

### 📂 Directory Structure
- `index.js`: Main orchestration logic.
- `github.js`: API wrappers for GitHub interaction.
- `agent.yaml`: AI agent configuration and skills.
- `skills/`: Modular AI capabilities (Review, Orchestration, Risk-Scoring, Promotion).

---
*Built for the GitAgent Hackathon* 🚀
