
/**
 * Optimized service to fetch raw HTML content using CORS proxies.
 * Uses race mechanism for fastest response and shorter timeouts.
 */
export async function fetchHtmlContent(url: string): Promise<string> {
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  // Proxy configurations ordered by typical speed
  const proxyConfigs = [
    {
      name: 'CorsProxy.io',
      url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      parse: async (res: Response) => res.text()
    },
    {
      name: 'AllOrigins',
      url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&timestamp=${Date.now()}`,
      parse: async (res: Response) => {
        const data = await res.json();
        return data.contents;
      }
    },
    {
      name: 'CodeTabs',
      url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      parse: async (res: Response) => res.text()
    }
  ];

  // Try to fetch from all proxies in parallel, return first successful result
  const fetchFromProxy = async (config: typeof proxyConfigs[0]): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout (reduced from 10s)

    try {
      const response = await fetch(config.url(targetUrl), {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await config.parse(response);
      if (html && html.length > 500) {
        console.log(`✓ Lấy dữ liệu thành công từ ${config.name}`);
        return html;
      }
      throw new Error("Nội dung trả về quá ngắn hoặc trống.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`${config.name}: ${err.message}`);
    }
  };

  // Race all proxies - return first successful result
  try {
    // First try racing the fastest proxies
    const result = await Promise.any(proxyConfigs.map(fetchFromProxy));
    return result;
  } catch (aggregateError: any) {
    // All proxies failed
    const errors = aggregateError.errors?.map((e: Error) => e.message).join('; ') || 'Lỗi không xác định';
    throw new Error(`Không thể truy cập trang web. Lỗi: ${errors}`);
  }
}
