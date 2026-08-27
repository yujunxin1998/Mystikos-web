import type { WishlistLine } from './useCommerceApi'
import { summarizeWishlist } from '../utils/commerce-api.mjs'

export function useCommerceWishlist() {
  const api = useCommerceApi()
  const items = useState<WishlistLine[]>('commerce-wishlist', () => [])
  const loading = useState('commerce-wishlist-loading', () => false)
  const loaded = useState('commerce-wishlist-loaded', () => false)
  const summary = computed(() => summarizeWishlist(items.value))

  const refresh = async () => {
    loading.value = true
    try {
      items.value = await api.getWishlist() || []
      loaded.value = true
      return items.value
    } finally { loading.value = false }
  }
  const add = async (productId: number) => { await api.addToWishlist(productId); await refresh() }
  const remove = async (productId: number) => { await api.removeFromWishlist(productId); await refresh() }
  const clear = () => { items.value = []; loaded.value = false }

  return { items, loading, loaded, summary, refresh, add, remove, clear }
}
