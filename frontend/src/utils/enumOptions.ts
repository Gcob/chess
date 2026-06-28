export function enumToOptions<T extends string>(
  enumObj: Record<string, T>,
  baseKey: string,
  t: (key: string) => string,
): Array<{value: T; label: string}> {
  return Object.values(enumObj).map(value => ({
    value,
    label: t(`${baseKey}.${value}`),
  }))
}
