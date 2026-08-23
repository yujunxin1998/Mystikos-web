<script setup lang="ts">
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

const props = withDefaults(defineProps<{
  modelValue: string
  country: CountryCode
  label?: string
  placeholder?: string
}>(), { label: 'Phone number', placeholder: 'Mobile number' })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:country': [value: CountryCode]
}>()

const { locale } = useMystikos()
const displayNames = computed(() => new Intl.DisplayNames([locale.value === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }))
const countries = computed(() => getCountries().map(code => ({
  code,
  name: displayNames.value.of(code) || code,
  callingCode: getCountryCallingCode(code)
})).sort((a, b) => a.name.localeCompare(b.name, locale.value === 'zh' ? 'zh-CN' : 'en')))
const parsed = computed(() => props.modelValue.trim() ? parsePhoneNumberFromString(props.modelValue, props.country) : null)
const invalid = computed(() => Boolean(props.modelValue.trim()) && !parsed.value?.isValid())

defineExpose({
  e164: () => parsed.value?.isValid() ? parsed.value.number : '',
  valid: () => Boolean(parsed.value?.isValid())
})
</script>

<template>
  <label class="companion-field companion-field-wide">
    <span>{{ label }}</span>
    <div class="international-phone" :class="{ invalid }">
      <select :value="country" :aria-label="locale === 'zh' ? '国家或地区' : 'Country or region'" @change="emit('update:country', ($event.target as HTMLSelectElement).value as CountryCode)">
        <option v-for="item in countries" :key="item.code" :value="item.code">{{ item.name }} +{{ item.callingCode }}</option>
      </select>
      <input :value="modelValue" type="tel" inputmode="tel" autocomplete="tel-national" :placeholder="placeholder" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
    </div>
    <small v-if="invalid" class="field-error">{{ locale === 'zh' ? '请输入该国家或地区有效的手机号' : 'Enter a valid number for this country or region' }}</small>
  </label>
</template>
