
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
  author: string;     // Tác giả - cột mới trong template
  category: string;
  publishDate: string;
  publishDateFull: string;
  creator: string;    // Người tạo
  views: number;
  displayStatus: string;
  // Đếm ảnh theo loại
  imageKhaiThac?: number;  // Ảnh khai thác (không có nguồn/tác giả)
  imageTuLieu?: number;    // Ảnh tư liệu (Nguồn: ... hoặc Ảnh: Tư liệu)
  imageTacGia?: number;    // Ảnh có tên tác giả (Ảnh: Tên tác giả)
  imageCountLoaded?: boolean; // Đánh dấu đã đếm ảnh chưa
}
