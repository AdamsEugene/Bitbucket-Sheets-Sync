import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  BitbucketCommit,
  BitbucketPaginatedResponse,
  CommitData,
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
      const mapped = response.data.values.map((c: BitbucketCommit) =>
        this.mapCommit(c)
      );
      commits.push(...mapped);

      url = response.data.next
        ? response.data.next.replace(this.client.defaults.baseURL!, "")
        : null;
      page++;

      if (page % 10 === 0) console.log(`Fetched ${commits.length} commits...`);
    }

    return commits;
  }

  private mapCommit(commit: BitbucketCommit): CommitData {
    const { name, email } = this.parseAuthor(commit.author.raw);
    return {
      hash: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      message: commit.message.trim(),
      author: name,
      authorEmail: email,
      date: new Date(commit.date).toISOString(),
      parentHashes: commit.parents.map((p) => p.hash.substring(0, 7)),
      repository: `${this.workspace}/${this.repoSlug}`,
    };
  }

  private parseAuthor(raw: string): { name: string; email: string } {
    const match = raw.match(/^(.+?)\s*<(.+?)>$/);
    return match
      ? { name: match[1].trim(), email: match[2] }
      : { name: raw, email: "" };
  }
}
