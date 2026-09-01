import type { RegionNode } from './useProfileApi'

/** 国家 + 一级行政区两层树，只读参考数据；复用 useProfileApi().getRegions() 的请求逻辑和
 * RegionNode 类型（profile 页面的地区选择器已经在用），这里只加一层 useState 缓存 + 便捷查询，
 * 避免每个用到的组件各自重新请求一次。 */
export function useRegions() {
  const profileApi = useProfileApi()
  const tree = useState<RegionNode[]>('common-region-tree', () => [])
  const loaded = useState('common-region-tree-loaded', () => false)

  const load = async () => {
    if (loaded.value) return tree.value
    tree.value = await profileApi.getRegions() || []
    loaded.value = true
    return tree.value
  }

  const countries = computed(() => tree.value)
  const provincesOf = (countryCode: string) => tree.value.find(c => c.code === countryCode)?.children || []

  return { tree, countries, loaded, load, provincesOf }
}
