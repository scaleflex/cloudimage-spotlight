import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutoplayController, type AutoplayController } from '../src/autoplay';

describe('autoplay controller', () => {
  let controller: AutoplayController;
  let nextFn: ReturnType<typeof vi.fn>;
  let isLastFn: ReturnType<typeof vi.fn>;
  let completeFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    nextFn = vi.fn();
    isLastFn = vi.fn().mockReturnValue(false);
    completeFn = vi.fn();

    controller = createAutoplayController(4000, {
      next: nextFn,
      isLastScene: isLastFn,
      onComplete: completeFn,
    });
  });

  afterEach(() => {
    controller.destroy();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Basic play/pause
  // -------------------------------------------------------------------------

  describe('play/pause', () => {
    it('does not auto-advance until play() is called', () => {
      vi.advanceTimersByTime(8000);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('advances on interval after play()', () => {
      controller.play();
      vi.advanceTimersByTime(4000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('advances multiple times', () => {
      controller.play();
      vi.advanceTimersByTime(12000);
      expect(nextFn).toHaveBeenCalledTimes(3);
    });

    it('stops advancing after pause()', () => {
      controller.play();
      vi.advanceTimersByTime(4000);
      expect(nextFn).toHaveBeenCalledTimes(1);

      controller.pause();
      vi.advanceTimersByTime(8000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('resumes after play → pause → play', () => {
      controller.play();
      vi.advanceTimersByTime(4000);
      controller.pause();
      vi.advanceTimersByTime(4000);
      controller.play();
      vi.advanceTimersByTime(4000);

      expect(nextFn).toHaveBeenCalledTimes(2);
    });

    it('isPlaying reflects current state', () => {
      expect(controller.isPlaying()).toBe(false);

      controller.play();
      expect(controller.isPlaying()).toBe(true);

      controller.pause();
      expect(controller.isPlaying()).toBe(false);
    });

    it('double play() is safe', () => {
      controller.play();
      controller.play();
      vi.advanceTimersByTime(4000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('double pause() is safe', () => {
      controller.play();
      controller.pause();
      expect(() => controller.pause()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Stop at last scene
  // -------------------------------------------------------------------------

  describe('stop at last scene', () => {
    it('pauses and fires onComplete at last scene', () => {
      isLastFn.mockReturnValue(true);

      controller.play();
      vi.advanceTimersByTime(4000);

      expect(nextFn).not.toHaveBeenCalled();
      expect(completeFn).toHaveBeenCalledTimes(1);
      expect(controller.isPlaying()).toBe(false);
    });

    it('does not loop after reaching last scene', () => {
      isLastFn
        .mockReturnValueOnce(false) // tick 1: not last
        .mockReturnValueOnce(false) // tick 2: not last
        .mockReturnValue(true);     // tick 3+: last

      controller.play();
      vi.advanceTimersByTime(12000);

      expect(nextFn).toHaveBeenCalledTimes(2);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Visibility handling
  // -------------------------------------------------------------------------

  describe('visibility handling', () => {
    it('pauses timer when tab becomes hidden', () => {
      controller.play();
      vi.advanceTimersByTime(2000); // half interval

      // Simulate tab hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(8000);
      expect(nextFn).not.toHaveBeenCalled(); // timer paused
    });

    it('resumes timer when tab becomes visible again', () => {
      controller.play();

      // Hide tab
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Show tab
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(4000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('does not resume if was manually paused before hide', () => {
      controller.play();
      controller.pause();

      // Tab hidden then visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(8000);
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // setInterval
  // -------------------------------------------------------------------------

  describe('setInterval', () => {
    it('changes the interval', () => {
      controller.play();
      controller.setInterval(2000);

      vi.advanceTimersByTime(2000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('interval change takes effect immediately when playing', () => {
      controller.play();
      vi.advanceTimersByTime(3000); // not yet at 4000ms
      controller.setInterval(1000);
      vi.advanceTimersByTime(1000);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // destroy
  // -------------------------------------------------------------------------

  describe('destroy', () => {
    it('stops the timer', () => {
      controller.play();
      controller.destroy();

      vi.advanceTimersByTime(8000);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('removes visibility listener', () => {
      controller.play();
      controller.destroy();

      // Simulate visibility change — should not throw or resume
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      expect(() => document.dispatchEvent(new Event('visibilitychange'))).not.toThrow();
    });
  });
});
