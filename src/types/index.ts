export type Option = {
  prefix?: string;
};

type Role = 'editor' | 'reader' | string;
export type PageType =
  | 'page'
  | 'collection_view'
  | 'collection'
  | 'text'
  | 'header'
  | 'sub_header'
  | 'sub_sub_header'
  | 'divider'
  | 'break'
  | 'to_do'
  | 'numbered_list'
  | 'bulleted_list'
  | 'column_list'
  | 'column'
  | 'image';

export type NotionUser = {
  email: string;
  family_name: string;
  given_name: string;
  id: string;
  onboarding_completed: boolean;
  profile_photo: string;
  version: number;
};

// Bold, Italic, Strike, Anchor
type VisualizedTag = 'b' | 'i' | 's' | 'a';
type ParentTable = 'space' | 'block';

type NotionData = {
  id: string;
  content?: string[];
  type: PageType;
  properties: {
    title?: Array<Array<string | Array<Array<VisualizedTag>>>>;
    checked?: Array<Array<'Yes' | string>>;
    source?: Array<Array<string>>;
  };
  format?: {
    page_icon?: string;
    page_cover?: string;
    column_ratio?: number;
  };
  parent_id: string;
  parent_table: ParentTable;
  children?: NotionData[]; // Custom property for parsing array to tree
};

export type NotionResponse = {
  recordMap: {
    block: {
      [id: string]: {
        role: Role;
        value: NotionData;
      };
    };
    notion_user: {
      [id: string]: {
        role: Role;
        value: NotionUser;
      };
    };
  };
};

export type NotionContent = {
  type: string;
  id: string;
  title: string;
  titleString: string;
  content: string;
  resource?: string;
};

export type Type = 'NotionContent' | 'NotionBoard' | 'NotionList' | 'NotionTable' | 'NotionGallery';
