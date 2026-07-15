const SOFT_HYPHEN = '\u00AD'

export function withSoftHyphens(text: string) {
  return text
    .split(' ')
    .map(word => (word.length > 8 ? word.replace(/(.{5})(?=.)/g, `$1${SOFT_HYPHEN}`) : word))
    .join(' ')
}
