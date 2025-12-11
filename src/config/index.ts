import * as dotenv from "dotenv";
import { Config } from "../types";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function loadConfig(): Config {
  return {
    bitbucket: {
      workspace: requireEnv("BITBUCKET_WORKSPACE"),
      repoSlug: requireEnv("BITBUCKET_REPO_SLUG"),
      accessToken: requireEnv("BITBUCKET_ACCESS_TOKEN"),
    },
    google: {
      spreadsheetId: requireEnv("GOOGLE_SPREADSHEET_ID"),
      credentialsPath:
        process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json",
    },
  };
}
