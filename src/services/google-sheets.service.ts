import { google, sheets_v4 } from "googleapis";
import { JWT } from "google-auth-library";
import * as fs from "fs";
import { CommitData } from "../types";

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(spreadsheetId: string, credentialsPath: string) {
    this.spreadsheetId = spreadsheetId;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
  }

  async writeCommits(
    commits: CommitData[],
    sheetName = "Commits"
  ): Promise<void> {
    await this.ensureSheetExists(sheetName);
    await this.clearSheet(sheetName);

    const headers = [
      "Hash",
      "Short Hash",
      "Message",
      "Date",
      "Commit URL",
      "Diff URL",
      "Summary",
      "Files List",
    ];
    const rows = commits.map((c) => [
      c.hash,
      c.shortHash,
      this.formatMessageWithLinks(c.message),
      c.date,
      c.commitUrl ? `=HYPERLINK("${c.commitUrl}","View Commit")` : "",
      c.diffUrl ? `=HYPERLINK("${c.diffUrl}","View Diff")` : "",
      c.summary || "",
      c.filesChanged.map((f) => `${f.path} (${f.status})`).join("; "),
    ]);

    // Write the data - use USER_ENTERED so HYPERLINK formulas work
    // Messages are plain text with URLs that Google Sheets will auto-detect
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED", // Needed for HYPERLINK formulas in URL columns
      requestBody: { values: [headers, ...rows] },
    });

    await this.formatHeader(sheetName);
  }

  private async ensureSheetExists(sheetName: string): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const exists = spreadsheet.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );

    if (!exists) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }
  }

  private async clearSheet(sheetName: string): Promise<void> {
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
  }

  private formatMessageWithLinks(message: string): string {
    const jiraBaseUrl = "https://heatmap-dot-com.atlassian.net/browse/";

    let formattedMessage = message;

    // Handle ticket IDs at the start of message (e.g., "IMF-3216\nAdded site...")
    // Convert ticket ID to full URL - Google Sheets will auto-detect and make it clickable
    const ticketIdAtStartPattern = /^([A-Z]+-\d+)(\n|$)/;
    formattedMessage = formattedMessage.replace(
      ticketIdAtStartPattern,
      (match, ticketId, after) => {
        const url = `${jiraBaseUrl}${ticketId}`;
        return `${url}${after}`;
      }
    );

    // Full URLs are already present and will be auto-detected by Google Sheets
    // No need to convert them - just keep them as-is

    return formattedMessage;
  }

  private async formatHeader(sheetName: string): Promise<void> {
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId === undefined) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 8,
              },
            },
          },
        ],
      },
    });
  }
}
