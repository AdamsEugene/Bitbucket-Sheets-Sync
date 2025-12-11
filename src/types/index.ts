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
export interface CommitData {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  parentHashes: string[];
  repository: string;
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
