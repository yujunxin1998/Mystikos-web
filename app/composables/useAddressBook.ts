import type { Address, AddressPayload } from './useCommerceApi'

export function useAddressBook() {
  const api = useCommerceApi()
  const addresses = useState<Address[]>('commerce-addresses', () => [])
  const loading = useState('commerce-addresses-loading', () => false)
  const loaded = useState('commerce-addresses-loaded', () => false)
  const defaultAddress = computed(() => addresses.value.find(a => a.isDefault) || addresses.value[0] || null)

  const refresh = async () => {
    loading.value = true
    try {
      addresses.value = await api.listAddresses() || []
      loaded.value = true
      return addresses.value
    } finally { loading.value = false }
  }
  const create = async (payload: AddressPayload) => { const id = await api.createAddress(payload); await refresh(); return id }
  const update = async (addressId: number, payload: AddressPayload) => { await api.updateAddress(addressId, payload); await refresh() }
  const remove = async (addressId: number) => { await api.removeAddress(addressId); await refresh() }
  const setDefault = async (addressId: number) => { await api.setDefaultAddress(addressId); await refresh() }
  const clear = () => { addresses.value = []; loaded.value = false }

  return { addresses, defaultAddress, loading, loaded, refresh, create, update, remove, setDefault, clear }
}
