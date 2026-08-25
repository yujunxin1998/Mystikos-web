export type Gender = 'MALE' | 'FEMALE' | 'UNDISCLOSED'

export type ProfileTag = { id: number; category: string; label: string }
export type RegionNode = {
  code: string
  parentCode: string | null
  level: string
  nameZh: string
  nameEn: string
  children: RegionNode[]
}
export type UserProfile = {
  userId: number
  phone: string | null
  email: string | null
  nickname: string | null
  privacyAnonymous: boolean
  gender: Gender | null
  avatarObjectKey: string | null
  avatarUrl: string | null
  birthDate: string | null
  bio: string | null
  regionCode: string | null
  tags: ProfileTag[]
  roles: string[]
}

type ApiResponse<T> = { code: number; message?: string; data: T | null }

export function useProfileApi() {
  const { accessToken } = useDemoAuth()

  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (!response || response.code !== 200) throw new Error(response?.message || 'Profile request failed')
    return response.data as T
  }

  const avatarProxyUrl = (objectKey: string) => `/api/profile/avatar?objectKey=${encodeURIComponent(objectKey)}`
  const getProfile = async () => {
    const profile = await request<UserProfile>('profile/me')
    if (profile.avatarObjectKey) profile.avatarUrl = avatarProxyUrl(profile.avatarObjectKey)
    return profile
  }
  const getTags = () => request<ProfileTag[]>('tags?category=GAME_TYPE')
  const getRegions = () => request<RegionNode[]>('regions/tree')
  const updateProfile = (profile: Pick<UserProfile, 'nickname' | 'gender' | 'avatarObjectKey' | 'birthDate' | 'bio' | 'regionCode'>) =>
    request<void>('profile/me', { method: 'PUT', body: profile })
  const updateTags = (tagIds: number[]) => request<void>('profile/me/tags', { method: 'PUT', body: { tagIds } })
  const updatePrivacy = (anonymous: boolean) => request<void>('profile/privacy', { method: 'PUT', body: { anonymous } })
  const uploadAvatar = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const response = await $fetch<ApiResponse<{ objectKey: string; url: string }>>('/api/profile/avatar', {
      method: 'POST', body: form, headers: { authorization: `Bearer ${accessToken.value}` }, ignoreResponseError: true
    })
    if (!response || response.code !== 200 || !response.data) throw new Error(response?.message || 'Avatar upload failed')
    return { objectKey: response.data.objectKey, url: avatarProxyUrl(response.data.objectKey) }
  }

  return { getProfile, getTags, getRegions, updateProfile, updateTags, updatePrivacy, uploadAvatar }
}
