export function normalizeUrlForComparison(
  value,
) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  try {
    const parsedUrl =
      new URL(trimmedValue)

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return ''
    }

    return parsedUrl.href
  } catch {
    return ''
  }
}

export function findDuplicateRecentResult(
  value,
  recentResults,
) {
  const normalizedValue =
    normalizeUrlForComparison(value)

  if (
    !normalizedValue ||
    !Array.isArray(recentResults)
  ) {
    return null
  }

  return (
    recentResults.find(
      (recentResult) => {
        const originalUrl =
          recentResult?.originalUrl ??
          recentResult?.shortLink
            ?.originalUrl ??
          ''

        return (
          normalizeUrlForComparison(
            originalUrl,
          ) === normalizedValue
        )
      },
    ) ?? null
  )
}