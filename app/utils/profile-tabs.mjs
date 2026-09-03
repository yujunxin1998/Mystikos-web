export const profileTabs = ['profile', 'security', 'orders', 'wallet']

export const normalizeProfileTab = (value) => profileTabs.includes(value) ? value : 'profile'

export const profileTabLocation = (tab, currentQuery = {}) => {
  const query = { ...currentQuery }
  if (tab === 'profile') delete query.tab
  else query.tab = tab

  return {
    path: '/profile',
    query,
    hash: ''
  }
}

export const profileTabAriaCurrent = (tab, activeTab) => tab === activeTab ? 'page' : undefined

export const profileRootClasses = (dialogOpen) => ({ 'has-modal': Boolean(dialogOpen) })
