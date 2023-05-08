const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const orgName = "ossf";

// Replace with your desired repository names
const repoList = [
  'wg-endusers',
  'wg-best-practices-os-developers',
  'wg-security-tooling',
  'wg-supply-chain-integrity',
  'wg-vulnerability-disclosures',
  'wg-securing-critical-projects',
  'wg-identifying-security-threats',
  'wg-securing-software-repos'
];

// Define your desired section order
const sectionOrder = [
  "Motivation",
  "Objective",
  "Vision",
  "Scope",
  "Current Work",
  "Quick Start",
  "Get Involved",
  "Meeting times",
  "Governance",
  "Project Maintainers",
  "Project Collaborators",
  "Active projects",
  "Licenses",
  "Charter",
  "Antitrust Policy Notice"
];


function clearReadmeFiles() {
  for (const repoName of repoList) {
    const readmePath = path.join(repoName, "README.md");
    if (fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, "");
    }
  }
}

function reorderReadmeContent(content) {
  const sections = {};
  const regex = /^##\s(.+?)(?:\r?\n|\r)/gm;// A regex pattern to match sections with their headings
  let match;

  // Extract the first paragraph
  const firstParagraphRegex = /(^[\s\S]*?(?=\n\n))/;
  const firstParagraph = (content.match(firstParagraphRegex) || [""])[0].trim();

  while ((match = regex.exec(content)) !== null) {
    const sectionTitle = match[1].trim();
    const sectionStart = match.index;
    const sectionEnd = content.indexOf("\n##", sectionStart + match[0].length) || content.length;

    // Extract the section content and store it in the 'sections' object
    sections[sectionTitle] = content.slice(sectionStart, sectionEnd).trim();
  }

  // Reorder the sections based on the 'sectionOrder' array
  let reorderedContent = firstParagraph;
  for (const title of sectionOrder) {
    if (sections[title]) {
      reorderedContent += `\n\n## ${title}\n\n${sections[title]}`;
    }
  }

  return reorderedContent.trim();
}

async function fetchReadmes() {
  // Clear existing README files before fetching new content
  clearReadmeFiles();

  for (const repoName of repoList) {
    try {
      const readmeData = await octokit.repos.getReadme({ owner, repo: repoName });
      const readmeContent = Buffer.from(readmeData.data.content, "base64").toString();

      // Reorder the content based on the defined rules
      const reorderedContent = reorderReadmeContent(readmeContent);

      // Save the reordered README file directly in the repository's folder
      if (!fs.existsSync(repoName)) {
        fs.mkdirSync(repoName);
      }
      fs.writeFileSync(path.join(repoName, "README.md"), reorderedContent);
    } catch (error) {
      console.error(`Error fetching README for ${repoName}: ${error.message}`);
    }
  }
}

fetchReadmes();