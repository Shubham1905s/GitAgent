import fetch from "node-fetch";

function getGithubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN in environment.");
  }
  return token;
}

export async function getPRDiff(owner, repo, pullNumber) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Authorization: `token ${getGithubToken()}`,
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "code-review-agent",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch PR diff (${res.status}): ${body}`);
  }

  return await res.text();
}

export async function commentOnPR(owner, repo, issueNumber, body) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${getGithubToken()}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "code-review-agent",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Failed to post PR comment (${res.status}): ${responseBody}`);
  }

  return await res.json();
}
