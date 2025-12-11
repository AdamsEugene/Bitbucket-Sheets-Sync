import express, { Request, Response } from "express";
import cors from "cors";
import { loadConfig } from "./config";
import { BitbucketService } from "./services/bitbucket.service";
import { GoogleSheetsService } from "./services/google-sheets.service";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Bitbucket to Sheets API is running" });
});

// Generate report endpoint
app.post("/api/generate-report", async (req: Request, res: Response) => {
  try {
    console.log("🚀 Starting Bitbucket to Google Sheets sync...\n");

    const config = loadConfig();

    console.log(
      `📦 Repository: ${config.bitbucket.workspace}/${config.bitbucket.repoSlug}`
    );

    // Fetch commits from Bitbucket
    console.log("\n📥 Fetching commits from Bitbucket...");
    const bitbucket = new BitbucketService(
      config.bitbucket.workspace,
      config.bitbucket.repoSlug,
      config.bitbucket.accessToken
    );

    const commits = await bitbucket.fetchAllCommits();
    console.log(`✅ Fetched ${commits.length} commits`);

    // Write to Google Sheets
    console.log("\n📤 Writing commits to Google Sheets...");
    const sheets = new GoogleSheetsService(
      config.google.spreadsheetId,
      config.google.credentialsPath
    );

    await sheets.writeCommits(commits);
    console.log("✅ Successfully wrote commits to Google Sheets");

    res.json({
      success: true,
      message: "Report generated successfully",
      commitsCount: commits.length,
      repository: `${config.bitbucket.workspace}/${config.bitbucket.repoSlug}`,
      spreadsheetId: config.google.spreadsheetId,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// GET endpoint for convenience (triggers the same sync)
app.get("/api/generate-report", async (req: Request, res: Response) => {
  try {
    console.log(
      "🚀 Starting Bitbucket to Google Sheets sync (GET request)...\n"
    );

    const config = loadConfig();

    console.log(
      `📦 Repository: ${config.bitbucket.workspace}/${config.bitbucket.repoSlug}`
    );

    const bitbucket = new BitbucketService(
      config.bitbucket.workspace,
      config.bitbucket.repoSlug,
      config.bitbucket.accessToken
    );

    const commits = await bitbucket.fetchAllCommits();
    console.log(`✅ Fetched ${commits.length} commits`);

    const sheets = new GoogleSheetsService(
      config.google.spreadsheetId,
      config.google.credentialsPath
    );

    await sheets.writeCommits(commits);
    console.log("✅ Successfully wrote commits to Google Sheets");

    res.json({
      success: true,
      message: "Report generated successfully",
      commitsCount: commits.length,
      repository: `${config.bitbucket.workspace}/${config.bitbucket.repoSlug}`,
      spreadsheetId: config.google.spreadsheetId,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(
    `📊 Generate report: POST/GET http://localhost:${PORT}/api/generate-report`
  );
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
