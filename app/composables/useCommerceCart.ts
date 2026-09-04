import type { CartLine } from './useCommerceApi'

export function useCommerceCart() {
  const api = useCommerceApi()
  const items = useState<CartLine[]>('commerce-cart', () => [])
  const loading = useState('commerce-cart-loading', () => false)
  const loaded = useState('commerce-cart-loaded', () => false)
  const drawerOpen = useState('commerce-cart-drawer', () => false)
  const selectedIds = useState<number[]>('commerce-cart-selected', () => [])

  const count = computed(() => items.value.reduce((sum, line) => sum + Number(line.quantity || 0), 0))
  const selectedIdSet = computed(() => new Set(selectedIds.value))
  const selectedLines = computed(() => items.value.filter(line => selectedIdSet.value.has(line.productId)))
  const selectedTotal = computed(() => selectedLines.value.reduce((sum, line) => sum + Number(line.subtotal || 0), 0))
  const allSelected = computed(() => items.value.length > 0 && selectedIds.value.length === items.value.length)

  const syncSelection = (lines: CartLine[], keepExisting = false) => {
    const available = new Set(lines.map(line => line.productId))
    if (!keepExisting) {
      selectedIds.value = lines.map(line => line.productId)
      return
    }
    const retained = selectedIds.value.filter(id => available.has(id))
    selectedIds.value = retained.length ? retained : lines.map(line => line.productId)
  }

  const refresh = async () => {
    loading.value = true
    try {
      items.value = await api.getCart() || []
      syncSelection(items.value, loaded.value)
      loaded.value = true
      return items.value
    } finally { loading.value = false }
  }

  const add = async (productId: number, quantity = 1) => {
    await api.addToCart(productId, quantity)
    await refresh()
  }

  const remove = async (productId: number) => {
    await api.removeFromCart(productId)
    selectedIds.value = selectedIds.value.filter(id => id !== productId)
    await refresh()
  }

  const toggleLine = (productId: number) => {
    selectedIds.value = selectedIdSet.value.has(productId)
      ? selectedIds.value.filter(id => id !== productId)
      : [...selectedIds.value, productId]
  }

  const toggleSelectAll = () => {
    selectedIds.value = allSelected.value ? [] : items.value.map(line => line.productId)
  }

  const clear = () => {
    items.value = []
    selectedIds.value = []
    loaded.value = false
    drawerOpen.value = false
  }

  const openDrawer = () => { drawerOpen.value = true }
  const closeDrawer = () => { drawerOpen.value = false }

  return {
    items,
    loading,
    loaded,
    drawerOpen,
    selectedIds,
    selectedIdSet,
    selectedLines,
    selectedTotal,
    allSelected,
    count,
    refresh,
    add,
    remove,
    toggleLine,
    toggleSelectAll,
    clear,
    openDrawer,
    closeDrawer
  }
}
