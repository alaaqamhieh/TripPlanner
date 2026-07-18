export function StarRating({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <span className="star-rating" title={`Popularity ${filled}/5`} aria-label={`Popularity ${filled} out of 5`}>
      {'★'.repeat(filled)}
      <span className="star-rating__off">{'★'.repeat(5 - filled)}</span>
    </span>
  )
}
