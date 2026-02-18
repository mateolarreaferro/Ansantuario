import { unfurl } from 'unfurl.js'

export interface LinkPreviewData {
  title?: string
  description?: string
  image?: string
  favicon?: string
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  try {
    const result = await unfurl(url, { timeout: 5000 })

    return {
      title: result.open_graph?.title || result.title || undefined,
      description: result.open_graph?.description || result.description || undefined,
      image: result.open_graph?.images?.[0]?.url || undefined,
      favicon: result.favicon || undefined
    }
  } catch {
    return { title: url }
  }
}
