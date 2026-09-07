# Humraz Stories — Final Storage Setup

## What this package does
- Displays all stories from `data/stories.json`.
- Lets anyone submit a story.
- Strictly limits stories to **1–500 words** in both browser and server.
- Rejects invalid categories, duplicates and basic automated submissions.
- Securely writes accepted stories into the GitHub repository's `data/stories.json`.
- Once GitHub Pages redeploys, the story is visible to every visitor worldwide.

## Important security rule
A public GitHub Pages site cannot safely contain a GitHub token. Do **not** put a token in `stories.html`.
The included Cloudflare Worker is the secure bridge. Your stories are still stored directly in GitHub code (`data/stories.json`).

## Step 1 — Upload this project to GitHub
Upload all files while preserving this structure:
```
index.html
stories.html
data/stories.json
worker/worker.js
worker/wrangler.toml
README.md
```
Enable GitHub Pages for the repository.

## Step 2 — Create a fine-grained GitHub token
Create a fine-grained personal access token restricted to this repository only.
Repository permission required:
- Contents: Read and write

Do not paste this token into website code or commit it to GitHub.

## Step 3 — Deploy the free Cloudflare Worker
1. Create a Cloudflare account.
2. Go to Workers & Pages → Create Worker.
3. Use the code from `worker/worker.js`.
4. Add these environment variables:
   - `GITHUB_OWNER` = your GitHub username
   - `GITHUB_REPO` = your repository name
   - `GITHUB_BRANCH` = `main`
   - `GITHUB_FILE_PATH` = `data/stories.json`
   - `ALLOWED_ORIGIN` = your exact GitHub Pages origin, e.g. `https://username.github.io`
5. Add this as a **secret**:
   - `GITHUB_TOKEN` = your GitHub fine-grained token
6. Deploy the Worker.

## Step 4 — Connect the website
After deployment Cloudflare gives a Worker URL similar to:
```
https://humraz-stories-api.your-subdomain.workers.dev
```
Open `stories.html` and replace:
```js
const STORY_API_URL='PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE';
```
with your real Worker URL.
Commit and push that one change.

## Final flow
```
Visitor submits story
        ↓
Browser checks 500-word limit
        ↓
Cloudflare Worker validates again
        ↓
Worker securely updates data/stories.json in GitHub
        ↓
GitHub Pages publishes updated repository
        ↓
Story appears for every visitor
```

## Testing
Use the sample story from the conversation. After submitting:
1. The page should show: `Story saved successfully.`
2. Refresh the page.
3. Open `data/stories.json` in GitHub and confirm the new object exists.
4. Open the website from another device/browser after GitHub Pages finishes updating.

If the Worker URL has not been configured, the website intentionally refuses to pretend that a story was stored.


## Community story collection
This package includes 50 fictional sample student profiles and stories for catalog demonstration. They are illustrative content, not claimed testimonials from identifiable real students. Future story submissions should be emailed to humraz.online@gmail.com and reviewed before publication.
