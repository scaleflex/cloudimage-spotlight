// ---------------------------------------------------------------------------
// Autoplay controller
// Advances scenes on a timer. Pauses on hidden tab, stops at last scene.
// ---------------------------------------------------------------------------

export interface AutoplayCallbacks {
  next: () => void;
  isLastScene: () => boolean;
  onComplete: () => void;
}

export interface AutoplayController {
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  setInterval: (ms: number) => void;
  destroy: () => void;
}

/**
 * Create an autoplay controller that advances scenes on a timer.
 *
 * - Pauses when `document.visibilityState === 'hidden'`
 * - Resumes when tab becomes visible (if was playing before hide)
 * - Stops at last scene (does not loop)
 * - Does NOT reflect state to any DOM attribute
 */
export function createAutoplayController(
  interval: number,
  callbacks: AutoplayCallbacks,
): AutoplayController {
  let timerId: ReturnType<typeof setInterval> | null = null;
  let playing = false;
  let pausedByVisibility = false;
  let currentInterval = interval;

  function tick(): void {
    if (callbacks.isLastScene()) {
      // Stop at end — fire complete and pause
      pause();
      callbacks.onComplete();
      return;
    }
    callbacks.next();
  }

  function play(): void {
    if (playing) return;
    playing = true;
    pausedByVisibility = false;
    startTimer();
  }

  function pause(): void {
    if (!playing) return;
    playing = false;
    pausedByVisibility = false;
    stopTimer();
  }

  function startTimer(): void {
    stopTimer();
    timerId = setInterval(tick, currentInterval);
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'hidden') {
      if (playing) {
        pausedByVisibility = true;
        stopTimer();
      }
    } else if (document.visibilityState === 'visible') {
      if (pausedByVisibility && playing) {
        pausedByVisibility = false;
        startTimer();
      }
    }
  }

  // Listen for visibility changes
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return {
    play,
    pause,
    isPlaying: () => playing,
    setInterval: (ms: number) => {
      currentInterval = ms;
      if (playing) {
        startTimer(); // restart with new interval
      }
    },
    destroy: () => {
      stopTimer();
      playing = false;
      pausedByVisibility = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
  };
}
