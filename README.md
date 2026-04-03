# 🚀 GitAgent: AI PR Review & Multistage Deployment

Welcome to **GitAgent**, the ultimate AI-powered code review and deployment orchestrator. This agent automates your entire Pull Request lifecycle—from scanning for security flaws to auto-promoting safe changes across your environments.

Built for the **GitAgent Hackathon** 🏆.

---

## 🌟 Key Features
*   **🤖 AI-Powered Review**: In-depth analysis of code logic, bugs, and edge cases.
*   **🛡️ Security & Policy Shield**: Parallel scan for hardcoded secrets and security vulnerabilities.
*   **🧪 Test Suggestion**: Automated generation of unit test ideas and edge cases for every PR.
*   **⚠️ Intelligent Risk Scoring**: Classifies PRs as LOW, MEDIUM, or HIGH risk.
*   **🤝 Human-in-the-Loop (HIL)**: If a PR is high risk, the agent halts and waits for your **"APPROVE"** or **"LGTM"** comment before proceeding.
*   **🚀 Automated Promotion**: Seamlessly promotes code through **dev → staging → main** based on AI and human feedback.

---

## 🛠️ Local Setup Instructions

Follow these steps to run the agent on your machine.

### 1. Pre-requisites
*   **Node.js**: v20 or higher.
*   **GitHub PAT**: A Personal Access Token with `repo` and `workflow` permissions. [Generate one here](https://github.com/settings/tokens).
*   **OpenRouter API Key**: Access to high-quality AI models. [Get one here](https://openrouter.ai/).

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/GitAgent.git
cd GitAgent/code-review-agent
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the `code-review-agent/` directory:
```env
OPENROUTER_API_KEY=your_openrouter_key
GITHUB_TOKEN=your_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
GITHUB_PR_NUMBER=1
GITHUB_DEV_BRANCH=dev
GITHUB_STAGING_BRANCH=staging
GITHUB_MAIN_BRANCH=main
```

### 5. Run the Agent Manually
```bash
node index.js
```

---

## ☁️ GitHub Actions Integration (Continuous Automation)

The agent can run automatically every time a PR is opened or commented on.

### 1. Add Secrets to GitHub
Go to your repository **Settings > Secrets and variables > Actions** and add:
*   `GITHUB_TOKEN`: (Usually automatic, but check permissions)
*   `OPENROUTER_API_KEY`: Your key from OpenRouter.

### 2. Automated Workflow
The included `.github/workflows/ai-review.yml` is already configured to:
1.  **Watch for PRs**: Review changes automatically on `dev`.
2.  **Watch for Comments**: If the agent stops for HIL, simply comment `APPROVE` on the PR to trigger the auto-merge.

---

## 📂 Project Structure
```text
├── agent.yaml          # AI manifest (name, skills, model)
├── SOUL.md            # Agent's identity and personality
├── RULES.md           # Hard constraints for the AI
├── index.js           # Main orchestration logic
├── github.js          # GitHub API integration wrappers
├── skills/            # Modular capabilities
│   ├── code-review/
│   ├── policy-security/
│   ├── testing/
│   └── risk-scoring/
└── .github/workflows/ # Automation configuration
```

---

## 🎯 Important Considerations
*   **Manual Gate**: Higher-risk logic (auth, payments) will always require a human "APPROVE" comment.
*   **Rate Limits**: Be mindful of GitHub and OpenRouter API limits.
*   **Promotion**: Ensure your `staging` and `main` branches exist before the agent tries to promote code.

Built with ❤️ by [Shubham1905s / GitAgent](https://github.com/Shubham1905s/GitAgent)
