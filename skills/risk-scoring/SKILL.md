---
name: risk-scoring
description: Evaluates risk level of pull requests
---

# Risk Scoring

Analyze the provided diff and classify the risk level of the PR into one of:
- **LOW RISK**: Simple refactors, documentation updates, or small UI tweaks with no logic changes.
- **MEDIUM RISK**: New features, logic changes in non-critical paths, or standard bug fixes.
- **HIGH RISK**: Changes to auth, payments, security-sensitive code, large deletions, or changes to core infrastructure.

## Evaluation Criteria:
1. **Security Impact**: Does it handle secrets, passwords, or authentication?
2. **Business Impact**: Does it touch financial or private user data?
3. **Change Size**: Is it a massive diff?
4. **Complexity**: Are there intricate logic changes that are hard to verify?

## Output Format:
Your response should clearly state the risk level in the following format:
RISK: [LOW / MEDIUM / HIGH]
Followed by a brief justification.
