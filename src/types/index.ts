// Bitbucket API Types
export interface BitbucketAuthor {
  raw: string;
  user?: {
    display_name: string;
    uuid: string;
    account_id: string;
  };
}

export interface BitbucketParent {
  hash: string;
  type: string;
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: BitbucketAuthor;
  parents: BitbucketParent[];
  repository?: {
    name: string;
    full_name: string;
  };
  type?: string;
  summary?: {
    raw: string;
    markup: string;
    html: string;
    type: string;
  };
  links?: {
    self?: { href: string };
    html?: { href: string };
    diff?: { href: string };
    approve?: { href: string };
    comments?: { href: string };
  };
  rendered?: {
    message?: {
      raw: string;
      markup: string;
      html: string;
      type: string;
    };
  };
}

export interface BitbucketDiffStat {
  type: string;
  status: "added" | "removed" | "modified" | "renamed";
  old?: {
    path: string;
    type: string;
  };
  new?: {
    path: string;
    type: string;
  };
  lines_added?: number;
  lines_removed?: number;
}

export interface BitbucketDiffResponse {
  pagelen: number;
  values: BitbucketDiffStat[];
  page?: number;
  size?: number;
}

export interface BitbucketPaginatedResponse<T> {
  values: T[];
  pagelen: number;
  size?: number;
  page?: number;
  next?: string;
  previous?: string;
}

// Application Types
export interface FileChange {
  path: string;
  status: "added" | "removed" | "modified" | "renamed";
  oldPath?: string;
  additions?: number;
  deletions?: number;
}

export interface CommitData {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  parentHashes: string[];
  repository: string;
  // New fields
  commitUrl?: string;
  diffUrl?: string;
  filesChanged: FileChange[];
  filesChangedCount: number;
  totalAdditions?: number;
  totalDeletions?: number;
  summary?: string;
  branch?: string;
}

export interface Config {
  bitbucket: {
    workspace: string;
    repoSlug: string;
    accessToken: string;
  };
  google: {
    spreadsheetId: string;
    credentialsPath: string;
  };
}
