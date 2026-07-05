import type {Composer} from 'vue-i18n'

type Translator = Pick<Composer, 't' | 'te'>

// Resolves a translation key to its gendered form via a `_m`/`_f` suffix convention, falling back to
// the base key when no gendered override exists (or `gender` is undefined). vue-i18n has no built-in
// equivalent to i18next's `context` option, so this reimplements the same idea by hand: `te()` checks
// whether the suffixed key exists before using it.
export function tGender(
  i18n: Translator,
  key: string,
  gender?: 'm' | 'f',
  params?: Record<string, unknown>,
): string {
  const args = params ?? {}
  if (!gender) return String(i18n.t(key, args))

  const genderedKey = `${key}_${gender}`
  return String(i18n.te(genderedKey) ? i18n.t(genderedKey, args) : i18n.t(key, args))
}
