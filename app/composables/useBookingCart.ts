import type { BookingCartLineView, BookingId } from './useBookingApi'

export function useBookingCart() {
  const api = useBookingApi()
  const items = useState<BookingCartLineView[]>('booking-cart', () => [])
  const loading = useState('booking-cart-loading', () => false)
  const loaded = useState('booking-cart-loaded', () => false)
  const drawerOpen = useState('booking-cart-drawer', () => false)
  const selectedIds = useState<string[]>('booking-cart-selected', () => [])

  const count = computed(() => items.value.length)
  const selectedIdSet = computed(() => new Set(selectedIds.value))
  const selectedLines = computed(() => items.value.filter(line => selectedIdSet.value.has(String(line.id))))
  const selectedTotal = computed(() => selectedLines.value.reduce((sum, line) => sum + Number(line.estimatedPrice || 0), 0))
  const allSelected = computed(() => items.value.length > 0 && selectedIds.value.length === items.value.length)

  const syncSelection = (lines: BookingCartLineView[], keepExisting = false) => {
    const available = new Set(lines.map(line => String(line.id)))
    if (!keepExisting) {
      selectedIds.value = lines.map(line => String(line.id))
      return
    }
    const retained = selectedIds.value.filter(id => available.has(id))
    selectedIds.value = retained.length ? retained : lines.map(line => String(line.id))
  }

  const refresh = async () => {
    loading.value = true
    try {
      items.value = await api.listBookingCart() || []
      syncSelection(items.value, loaded.value)
      loaded.value = true
      return items.value
    } finally { loading.value = false }
  }

  const remove = async (lineId: BookingId) => {
    await api.removeBookingCartLine(lineId)
    selectedIds.value = selectedIds.value.filter(id => id !== String(lineId))
    await refresh()
  }

  const toggleLine = (lineId: BookingId) => {
    const id = String(lineId)
    selectedIds.value = selectedIdSet.value.has(id)
      ? selectedIds.value.filter(item => item !== id)
      : [...selectedIds.value, id]
  }

  const toggleSelectAll = () => {
    selectedIds.value = allSelected.value ? [] : items.value.map(line => String(line.id))
  }

  const checkout = async () => {
    if (!selectedLines.value.length) throw new Error('请至少选择一条点单')
    return api.checkoutBookingCart(selectedLines.value.map(line => line.id))
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
    remove,
    toggleLine,
    toggleSelectAll,
    checkout,
    clear,
    openDrawer,
    closeDrawer
  }
}
