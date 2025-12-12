import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  BitbucketCommit,
  BitbucketPaginatedResponse,
  BitbucketDiffResponse,
  BitbucketDiffStat,
  CommitData,
  FileChange,
} from "../types";

export class BitbucketService {
  private client: AxiosInstance;
  private workspace: string;
  private repoSlug: string;

  constructor(workspace: string, repoSlug: string, accessToken: string) {
    this.workspace = workspace;
    this.repoSlug = repoSlug;
    this.client = axios.create({
      baseURL: "https://api.bitbucket.org/2.0",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async fetchAllCommits(maxPages = 50): Promise<CommitData[]> {
    const commits: CommitData[] = [];
    let url:
      | string
      | null = `/repositories/${this.workspace}/${this.repoSlug}/commits`;
    let page = 0;

    while (url && page < maxPages) {
      const response: AxiosResponse<
        BitbucketPaginatedResponse<BitbucketCommit>
      > = await this.client.get<BitbucketPaginatedResponse<BitbucketCommit>>(
        url
      );

      // Fetch detailed info for each commit (including diff stats)
      const commitPromises = response.data.values.map((c: BitbucketCommit) =>
        this.fetchCommitDetails(c)
      );

      const mapped = await Promise.all(commitPromises);
      commits.push(...mapped);

      url = response.data.next
        ? response.data.next.replace(this.client.defaults.baseURL!, "")
        : null;
      page++;

      if (page % 10 === 0) console.log(`Fetched ${commits.length} commits...`);
    }

    return commits;
  }

  private async fetchCommitDetails(
    commit: BitbucketCommit
  ): Promise<CommitData> {
    try {
      // Fetch diff stats for this commit
      const diffStats = await this.fetchCommitDiffStats(commit.hash);

      return this.mapCommit(commit, diffStats);
    } catch (error) {
      console.warn(
        `Failed to fetch diff stats for commit ${commit.hash}:`,
        error
      );
      // Return commit without diff stats if fetch fails
      return this.mapCommit(commit, []);
    }
  }

  private async fetchCommitDiffStats(
    commitHash: string
  ): Promise<BitbucketDiffStat[]> {
    try {
      const diffUrl = `/repositories/${this.workspace}/${this.repoSlug}/diffstat/${commitHash}`;
      const response: AxiosResponse<BitbucketDiffResponse> =
        await this.client.get<BitbucketDiffResponse>(diffUrl);

      return response.data.values || [];
    } catch (error) {
      // If diff endpoint fails, return empty array
      return [];
    }
  }

  private mapCommit(
    commit: BitbucketCommit,
    diffStats: BitbucketDiffStat[]
  ): CommitData {
    const { name, email } = this.parseAuthor(commit.author.raw);

    // Map diff stats to FileChange format
    const filesChanged: FileChange[] = diffStats.map((stat) => ({
      path: stat.new?.path || stat.old?.path || "unknown",
      status: stat.status,
      oldPath:
        stat.old?.path && stat.old.path !== stat.new?.path
          ? stat.old.path
          : undefined,
      additions: stat.lines_added,
      deletions: stat.lines_removed,
    }));

    // Calculate totals
    const totalAdditions = diffStats.reduce(
      (sum, stat) => sum + (stat.lines_added || 0),
      0
    );
    const totalDeletions = diffStats.reduce(
      (sum, stat) => sum + (stat.lines_removed || 0),
      0
    );

    return {
      hash: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      message: commit.message.trim(),
      author: name,
      authorEmail: email,
      date: new Date(commit.date).toISOString(),
      parentHashes: commit.parents.map((p) => p.hash.substring(0, 7)),
      repository: `${this.workspace}/${this.repoSlug}`,
      // New fields
      commitUrl: commit.links?.html?.href,
      diffUrl: commit.links?.diff?.href,
      filesChanged,
      filesChangedCount: filesChanged.length,
      totalAdditions,
      totalDeletions,
      summary: commit.summary?.raw || commit.rendered?.message?.raw,
    };
  }

  private parseAuthor(raw: string): { name: string; email: string } {
    const match = raw.match(/^(.+?)\s*<(.+?)>$/);
    return match
      ? { name: match[1].trim(), email: match[2] }
      : { name: raw, email: "" };
  }
}
