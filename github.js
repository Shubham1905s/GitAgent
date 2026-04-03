import fetch from "node-fetch";

function getGithubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN in environment.");
  }
  return token;
}

function getGithubHeaders(extraHeaders = {}) {
  return {
    Authorization: `token ${getGithubToken()}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "code-review-agent",
    ...extraHeaders,
  };
}

export async function getPRDiff(owner, repo, pullNumber) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        ...getGithubHeaders(),
        Accept: "application/vnd.github.v3.diff",
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
        ...getGithubHeaders(),
        "Content-Type": "application/json",
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

export async function createPR(owner, repo, title, head, base, body = "") {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: {
        ...getGithubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        head,
        base,
        body,
      }),
    },
  );

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Failed to create PR (${res.status}): ${responseBody}`);
  }

  return await res.json();
}

export async function mergePR(owner, repo, pullNumber) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
    {
      method: "PUT",
      headers: getGithubHeaders(),
    },
  );
  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Failed to merge PR (${res.status}): ${responseBody}`);
  }

  return await res.json();
}

export async function getPRComments(owner, repo, pullNumber) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
    {
      headers: getGithubHeaders(),
    },
  );

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Failed to fetch PR comments (${res.status}): ${responseBody}`);
  }

  return await res.json();
}

