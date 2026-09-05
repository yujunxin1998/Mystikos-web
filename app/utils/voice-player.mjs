const finiteSeconds = (value) => Number.isFinite(value) && value > 0 ? value : 0

export const formatPlaybackTime = (seconds) => {
  const total = Math.floor(finiteSeconds(seconds))
  const minutes = Math.floor(total / 60)
  const remainder = String(total % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}

export const playbackProgress = (currentTime, duration) => {
  const safeDuration = finiteSeconds(duration)
  if (!safeDuration) return 0
  return Math.min(100, Math.max(0, finiteSeconds(currentTime) / safeDuration * 100))
}

export const nextVoicePlaybackAction = (activeIndex, requestedIndex, isRequestedPlaying) => {
  if (activeIndex === requestedIndex && isRequestedPlaying) {
    return { command: 'pause', nextActiveIndex: null }
  }
  return { command: 'play', nextActiveIndex: requestedIndex }
}

export const transitionVoicePlayback = (currentState, event) => {
  if (event === 'request' || event === 'waiting') return 'loading'
  if (event === 'playing') return 'playing'
  if (event === 'failure') return 'error'
  if (event === 'pause' || event === 'ended') return 'idle'
  return currentState
}

export const shouldHandleVoiceMediaEvent = ({
  activeIndex,
  eventIndex,
  event,
  paused = false,
  ended = false,
  hasMediaError = false,
  reloading = false
}) => {
  if (activeIndex !== eventIndex) return false
  if (event === 'pause') return paused
  if (event === 'ended') return ended
  if (event === 'error') return hasMediaError
  if (event === 'abort') return !reloading
  return true
}
