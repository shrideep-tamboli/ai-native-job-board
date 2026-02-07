# Screener pipeline demo notebook

## Quick start

1. **Start the Next.js API** (from project root):
   ```bash
   npm run dev
   ```
   The API will be at `http://localhost:3000`.

2. **Install Python deps** (only `requests` is needed for the notebook):
   ```bash
   pip install requests
   ```

3. **Set a GitHub token** (required for the Extract step):
   - Create a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope.
   - In the notebook: set `GITHUB_TOKEN` in the "Step 1" cell, or export it:
     ```bash
     export GITHUB_TOKEN=ghp_xxxx
     ```

4. **Set Gemini API key** (required for the Evaluate step):
   - In the project root `.env` (or `.env.local`): `GEMINI_API_KEY=your_key`
   - The Next.js server reads this; the notebook does not need it.

5. **Open and run the notebook**:
   ```bash
   jupyter notebook screener_pipeline_demo.ipynb
   ```
   Or use VS Code / Cursor with the Jupyter extension. Run cells in order.

## What the notebook does

| Cell / step | Action |
|-------------|--------|
| Setup | Imports, base URL (`http://localhost:3000`) |
| Step 1 | GitHub token (env or paste) |
| Step 2 | **Extract** — `POST /api/screener/extract` with a repo URL → ArtifactBundle |
| Inspect | Optional: pretty-print repo meta and sample commits |
| Step 3 | Define **Data Science Researcher** job description |
| Step 4 | **Evaluate** — `POST /api/screener/evaluate` with bundle + job → score and explanation |
| Step 5 | Optional: helper to run extract + evaluate in one go |

To score a **different GitHub profile**, change `REPO_URL` in Step 2 and re-run from there. To try a **different role**, edit `JOB_DESCRIPTION` in Step 3 and re-run from Step 4.
