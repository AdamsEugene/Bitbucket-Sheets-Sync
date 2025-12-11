import { loadConfig } from "./config";
import { BitbucketService } from "./services/bitbucket.service";
import { GoogleSheetsService } from "./services/google-sheets.service";

async function main(): Promise<void> {
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

  console.log("\n🎉 Sync completed successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
