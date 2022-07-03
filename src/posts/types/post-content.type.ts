interface PostBlock {
  // Unique Id of the block
  id?: string;

  // Tool type
  type: string;

  // Saved Block data

  data: Record<string, any>;

  // Block Tunes data
  tunes?: { [name: string]: any };
}

export interface PostContent {
  // Editor's version
  version?: string;

  // Timestamp of saving in milliseconds
  time?: number;

  // Saved Blocks
  blocks: PostBlock[];
}
