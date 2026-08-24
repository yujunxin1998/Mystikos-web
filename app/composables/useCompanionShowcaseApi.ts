export type ShowcaseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
export type ShowcaseView = {
  id: number
  userId: number
  applicantNickname: string
  status: ShowcaseStatus
  bio: string | null
  tagline: string | null
  availability: string | null
  coverUrl: string | null
  coverObjectKey: string | null
  tags: { id: number; label: string }[]
  photoUrls: string[]
  videoUrls: string[]
  audioUrls: string[]
  photoObjectKeys: string[]
  videoObjectKeys: string[]
  audioObjectKeys: string[]
  reviewComment: string | null
  published: boolean
  publishedAt: string | null
}
export type PublicShowcaseView = {
  userId: string
  nickname: string
  avatarUrl: string | null
  bio: string | null
  tagline: string | null
  availability: string | null
  coverUrl: string | null
  tags: { id: number; label: string }[]
  photoUrls: string[]
  videoUrls: string[]
  audioUrls: string[]
  publishedAt: string
}
export type PublicShowcaseCard = {
  userId: string
  nickname: string
  avatarUrl: string | null
  bio: string | null
  tagline: string | null
  availability: string | null
  tags: { id: number; category: string; label: string }[]
  coverPhotoUrl: string | null
  publishedAt: string
}
export type PageResult<T> = { records: T[]; total: number; pageNum: number; pageSize: number }
type UploadResult = { objectKey: string; url: string }
type ApiResponse<T> = { code: number; message?: string; data: T | null }

export function useCompanionShowcaseApi() {
  const { accessToken } = useDemoAuth()
  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (!response || response.code !== 200) throw new Error(response?.message || 'Companion showcase request failed')
    return response.data as T
  }
  const upload = (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<UploadResult>('files/upload', { method: 'POST', body })
  }
  const getMine = () => request<ShowcaseView | null>('companion-showcase/me')
  const saveDraft = (draft: { bio: string; tagline: string; availability: string; tagIds: number[]; coverObjectKey: string | null; photoObjectKeys: string[]; videoObjectKeys: string[]; audioObjectKeys: string[] }) => request<void>('companion-showcase/me/draft', { method: 'PUT', body: draft })
  const submit = () => request<void>('companion-showcase/me/submit', { method: 'POST' })
  const reorderMedia = (body: { photoObjectKeys: string[]; videoObjectKeys: string[]; audioObjectKeys: string[] }) => request<void>('companion-showcase/me/media-order', { method: 'PUT', body })
  const getPublished = (userId: number | string) => request<PublicShowcaseView>(`companions/${userId}/showcase`)
  const browsePublished = (params: { pageNum?: number; pageSize?: number; tagId?: number | null; keyword?: string } = {}) => {
    const query = new URLSearchParams({ pageNum: String(params.pageNum || 1), pageSize: String(params.pageSize || 12) })
    if (params.tagId) query.set('tagId', String(params.tagId))
    if (params.keyword?.trim()) query.set('keyword', params.keyword.trim())
    return request<PageResult<PublicShowcaseCard>>(`companions?${query}`)
  }
  return { upload, getMine, saveDraft, submit, reorderMedia, getPublished, browsePublished }
}
