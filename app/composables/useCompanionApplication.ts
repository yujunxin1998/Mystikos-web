import type { UserProfile } from '~/composables/useProfileApi'

export type CompanionApplicationStatus = 'PENDING' | 'ASSESSING' | 'APPROVED' | 'REJECTED'
export type CompanionContactType = 'PHONE' | 'EMAIL'

export type CompanionApplicationDraft = {
  applicantName: string
  regionCode: string
  introduction: string
  tagIds: number[]
  contactType: CompanionContactType
  contactValue: string
  phoneCountry: string
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

type ApiResponse<T> = { code: number; message?: string; data: T | null }

const APPLICATION_KEY = 'mystikos_companion_application_v1'
const ACCOUNT_KEY = 'mystikos_companion_account_completion_v1'
const DEV_CODE = '246810'

const readStored = <T>(key: string): T | null => {
  if (!import.meta.client) return null
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : null
  } catch {
    return null
  }
}

const writeStored = (key: string, value: unknown) => {
  if (import.meta.client) localStorage.setItem(key, JSON.stringify(value))
}

export function useCompanionApplication() {
  const { accessToken } = useDemoAuth()
  const application = useState<CompanionApplication | null>('companion-application', () => null)
  const accountCompletion = useState<AccountCompletion | null>('companion-account-completion', () => null)
  const prototypeMode = import.meta.dev

  const request = async <T>(path: string, options: Record<string, unknown> = {}) => {
    const response = await $fetch<ApiResponse<T>>(`/api/auth-proxy/${path}`, {
      ...options,
      ignoreResponseError: true,
      headers: { authorization: `Bearer ${accessToken.value}`, ...((options.headers as object) || {}) }
    })
    if (!response || response.code !== 200) throw new Error(response?.message || 'Companion application request failed')
    return response.data as T
  }

  const loadMyApplication = async () => {
    if (prototypeMode) {
      application.value = readStored<CompanionApplication>(APPLICATION_KEY)
      return application.value
    }
    application.value = await request<CompanionApplication | null>('companion-applications/me')
    return application.value
  }

  const submitApplication = async (draft: CompanionApplicationDraft, gameTags: { id: number; label: string }[]) => {
    if (!prototypeMode) {
      application.value = await request<CompanionApplication>('companion-applications', { method: 'POST', body: draft })
      return application.value
    }
    const now = new Date().toISOString()
    application.value = {
      ...draft,
      id: `MK-CA-${Date.now().toString().slice(-8)}`,
      status: 'PENDING',
      gameTags,
      submittedAt: now,
      updatedAt: now,
      assessor: null,
      assessmentResult: null,
      reviewOpinion: null
    }
    writeStored(APPLICATION_KEY, application.value)
    return application.value
  }

  const loadAccountCompletion = async (profile: UserProfile) => {
    if (!prototypeMode) {
      accountCompletion.value = await request<AccountCompletion>('profile/me/companion-readiness')
      return accountCompletion.value
    }
    const stored = readStored<AccountCompletion>(ACCOUNT_KEY)
    const oauthBound = stored?.oauthBound ?? (!profile.email && !profile.phone)
    const email = stored?.email || profile.email || ''
    const phone = stored?.phone || profile.phone || ''
    const emailVerified = stored?.emailVerified ?? Boolean(profile.email)
    const phoneVerified = stored?.phoneVerified ?? Boolean(profile.phone)
    accountCompletion.value = {
      oauthBound,
      email,
      phone,
      emailVerified,
      phoneVerified,
      companionApplicationAllowed: emailVerified || phoneVerified
    }
    return accountCompletion.value
  }

  const sendContactCode = async (channel: CompanionContactType, identifier: string) => {
    if (prototypeMode) return { developmentCode: DEV_CODE }
    await request<void>('profile/me/contact-verification-codes', { method: 'POST', body: { channel, identifier } })
    return { developmentCode: null }
  }

  const verifyContact = async (channel: CompanionContactType, identifier: string, code: string) => {
    if (!prototypeMode) {
      accountCompletion.value = await request<AccountCompletion>('profile/me/contacts', {
        method: 'PUT', body: { channel, identifier, verificationCode: code }
      })
      return accountCompletion.value
    }
    if (code !== DEV_CODE) throw new Error('Invalid development verification code')
    const current = accountCompletion.value || {
      oauthBound: false, email: '', phone: '', emailVerified: false, phoneVerified: false, companionApplicationAllowed: false
    }
    const next: AccountCompletion = {
      ...current,
      email: channel === 'EMAIL' ? identifier : current.email,
      phone: channel === 'PHONE' ? identifier : current.phone,
      emailVerified: channel === 'EMAIL' ? true : current.emailVerified,
      phoneVerified: channel === 'PHONE' ? true : current.phoneVerified,
      companionApplicationAllowed: false
    }
    next.companionApplicationAllowed = next.emailVerified || next.phoneVerified
    accountCompletion.value = next
    writeStored(ACCOUNT_KEY, next)
    return next
  }

  return {
    application,
    accountCompletion,
    prototypeMode,
    loadMyApplication,
    submitApplication,
    loadAccountCompletion,
    sendContactCode,
    verifyContact
  }
}
