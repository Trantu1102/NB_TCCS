
export interface ArticleContent {
  siteName: string;
  title: string;
  author?: string;
  publishDate?: string;
  content: string; // HTML format
  summary?: string;
  mainImage?: string;
  url?: string;
}

export interface ExtractedData {
  success: boolean;
  data?: ArticleContent;
  error?: string;
}

export interface ExcelArticle {
  stt: number;
  title: string;
  status: string;
  url: string;
  type: string;
  category: string;
  publishDate: string;
  publishDateFull: string;
  creator: string;
  views: number;
  displayStatus: string;
}
