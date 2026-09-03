import type { Gender } from '~/composables/useProfileApi'

export type CompanionApplicationStatus = 'PENDING' | 'ASSESSING' | 'APPROVED' | 'REJECTED'
export type CompanionContactType = 'PHONE' | 'EMAIL'

export type CompanionApplicationDraft = {
  applicantName: string
  gameNickname: string
  regionCode: string
  introduction: string
  tagIds: number[]
  contactType: CompanionContactType
  contactValue: string
  phoneCountry: string
  gender: Gender | null
  birthDate: string | null
}

export type CompanionApplication = CompanionApplicationDraft & {
  id: string
  status: CompanionApplicationStatus
  gameTags: { id: number; label: string }[]
  submittedAt: string
  updatedAt: string
  assessor: { userId: number; name: string } | null
  assessmentResult: string | null
  reviewOpinion: string | null
}

export type AccountCompletion = {
  oauthBound: boolean
  email: string
  phone: string
  emailVerified: boolean
  phoneVerified: boolean
  companionApplicationAllowed: boolean
}

type BackendApplicationStatus = 'SUBMITTED' | 'IN_ASSESSMENT' | 'APPROVED' | 'REJECTED'
type BackendCompanionApplication = {
  id: number | string
  applicantNickname: string | null
  applicantPhone: string | null
  applicantEmail: string | null
  applicantRegionCode: string | null
  realName: string
  gender: Gender | null
  birthDate: string | null
  selfIntro: string | null
  gameNickname: string
  tags: { id: number; label: string }[]
  contactCountryCode: string | null
  contactPhone: string | null
  contactEmail: string | null
  status: BackendApplicationStatus
  reviewerId: number | null
  reviewerNickname: string | null
  reviewResult: string | null
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
}

const statusFromBackend = (status: BackendApplicationStatus): CompanionApplicationStatus => {
  if (status === 'SUBMITTED') return 'PENDING'
  if (status === 'IN_ASSESSMENT') return 'ASSESSING'
  return status
}

const fromBackend = (source: BackendCompanionApplication): CompanionApplication => {
  const phone = source.contactPhone
    ? `${source.contactCountryCode || ''}${source.contactPhone}`
    : ''
  return {
    id: String(source.id),
    applicantName: source.realName || source.applicantNickname || '',
    gameNickname: source.gameNickname || '',
    regionCode: source.applicantRegionCode || '',
    introduction: source.selfIntro || '',
    tagIds: source.tags.map(tag => tag.id),
    contactType: source.contactEmail ? 'EMAIL' : 'PHONE',
    contactValue: source.contactEmail || phone,
    phoneCountry: source.contactCountryCode || '',
    gender: source.gender,
    birthDate: source.birthDate,
    status: statusFromBackend(source.status),
    gameTags: source.tags,
    submittedAt: source.createdAt,
    updatedAt: source.reviewedAt || source.createdAt,
    assessor: source.reviewerId ? { userId: source.reviewerId, name: source.reviewerNickname || String(source.reviewerId) } : null,
    assessmentResult: source.reviewResult,
    reviewOpinion: source.reviewComment
  }
}

export function useCompanionApplication() {
  const application = useState<CompanionApplication | null>('companion-application', () => null)
  const accountCompletion = useState<AccountCompletion | null>('companion-account-completion', () => null)
  const { request: authedRequest } = useAuthedApi()
  const request = <T>(path: string, options: Record<string, unknown> = {}) => authedRequest<T>(path, options, 'Companion application request failed')

  const loadMyApplication = async () => {
    const source = await request<BackendCompanionApplication | null>('companion-applications/me')
    application.value = source ? fromBackend(source) : null
    return application.value
  }

  const submitApplication = async (draft: CompanionApplicationDraft) => {
    await request<number | string>('companion-applications', {
      method: 'POST',
      body: {
        realName: draft.applicantName,
        gender: draft.gender || 'UNDISCLOSED',
        birthDate: draft.birthDate || null,
        selfIntro: draft.introduction,
        gameNickname: draft.gameNickname,
        gameRankProofObjectKey: null,
        tagIds: draft.tagIds,
        contactCountryCode: draft.contactType === 'PHONE' ? draft.phoneCountry : null,
        contactPhone: draft.contactType === 'PHONE' ? draft.contactValue : null,
        contactEmail: draft.contactType === 'EMAIL' ? draft.contactValue : null
      }
    })
    const created = await loadMyApplication()
    if (!created) throw new Error('The application was submitted but could not be loaded')
    return created
  }

  const loadAccountCompletion = async () => {
    accountCompletion.value = await request<AccountCompletion>('profile/me/companion-readiness')
    return accountCompletion.value
  }

  const sendContactCode = async (channel: CompanionContactType, identifier: string) => {
    await request<void>('profile/me/contact-verification-codes', { method: 'POST', body: { channel, identifier } })
    return { developmentCode: null }
  }

  const verifyContact = async (channel: CompanionContactType, identifier: string, code: string) => {
    accountCompletion.value = await request<AccountCompletion>('profile/me/contacts', {
      method: 'PUT', body: { channel, identifier, verificationCode: code }
    })
    return accountCompletion.value
  }

  return {
    application,
    accountCompletion,
    loadMyApplication,
    submitApplication,
    loadAccountCompletion,
    sendContactCode,
    verifyContact
  }
}
