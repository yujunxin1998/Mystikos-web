export const companionAccent = (seed = '') => {
  const hash = [...seed].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0)
  return `hsl(${235 + (hash % 68)} 72% 67%)`
}
