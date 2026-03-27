import { describe, it, expect } from 'vitest';
import {
  createNavigationState,
  navigateNext,
  navigatePrev,
  navigateGoTo,
  navigateGoToId,
  createSkipDetail,
} from '../src/navigation';
import type { SpotlightConfig } from '../src/types';
import type { NavigationCallbacks } from '../src/navigation';

function makeConfig(sceneCount: number): SpotlightConfig {
  return {
    version: '1.0',
    ciToken: 'demo',
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      id: `scene-${i}`,
      image: `https://example.com/img${i}.jpg`,
      title: `Scene ${i}`,
    })),
  };
}

function makeCallbacks(): NavigationCallbacks & { calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {
    onSceneChange: [],
    onComplete: [],
  };
  return {
    calls,
    onSceneChange: (detail) => calls.onSceneChange.push([detail]),
    onComplete: (detail) => calls.onComplete.push([detail]),
  };
}

describe('Navigation state machine', () => {
  describe('createNavigationState', () => {
    it('initializes at scene 0', () => {
      const state = createNavigationState(makeConfig(3));
      expect(state.currentIndex).toBe(0);
      expect(state.totalScenes).toBe(3);
      expect(state.startTime).toBeGreaterThan(0);
    });
  });

  describe('navigateNext', () => {
    it('advances to the next scene', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateNext(state, config, cb);

      expect(state.currentIndex).toBe(1);
      expect(cb.calls.onSceneChange).toHaveLength(1);
      expect(cb.calls.onSceneChange[0][0]).toMatchObject({ from: 0, to: 1 });
    });

    it('dispatches cis:complete on last scene without advancing', () => {
      const config = makeConfig(2);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateNext(state, config, cb); // 0 → 1
      navigateNext(state, config, cb); // last scene → complete

      expect(state.currentIndex).toBe(1); // did not advance
      expect(cb.calls.onComplete).toHaveLength(1);
      expect(cb.calls.onComplete[0][0]).toMatchObject({
        totalScenes: 2,
      });
      expect((cb.calls.onComplete[0][0] as Record<string, unknown>).timeSpent).toBeGreaterThanOrEqual(0);
    });

    it('includes config in complete detail', () => {
      const config = makeConfig(1);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateNext(state, config, cb);

      expect(cb.calls.onComplete[0][0]).toHaveProperty('config');
    });
  });

  describe('navigatePrev', () => {
    it('goes to previous scene', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateNext(state, config, cb); // 0 → 1
      navigatePrev(state, config, cb); // 1 → 0

      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(2);
      expect(cb.calls.onSceneChange[1][0]).toMatchObject({ from: 1, to: 0 });
    });

    it('is no-op on first scene', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigatePrev(state, config, cb);

      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });
  });

  describe('navigateGoTo', () => {
    it('jumps to specific scene', () => {
      const config = makeConfig(5);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoTo(3, state, config, cb);

      expect(state.currentIndex).toBe(3);
      expect(cb.calls.onSceneChange[0][0]).toMatchObject({ from: 0, to: 3 });
    });

    it('is no-op for out-of-range index', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoTo(5, state, config, cb);
      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(0);

      navigateGoTo(-1, state, config, cb);
      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });

    it('is no-op for same index', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoTo(0, state, config, cb);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });

    it('includes scene and totalScenes in detail', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoTo(2, state, config, cb);

      const detail = cb.calls.onSceneChange[0][0] as Record<string, unknown>;
      expect(detail.totalScenes).toBe(3);
      expect(detail.scene).toHaveProperty('id', 'scene-2');
    });
  });

  describe('navigateGoToId', () => {
    it('jumps to scene by ID', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoToId('scene-2', state, config, cb);

      expect(state.currentIndex).toBe(2);
    });

    it('is no-op for non-existent ID', () => {
      const config = makeConfig(3);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateGoToId('nonexistent', state, config, cb);

      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });
  });

  describe('createSkipDetail', () => {
    it('returns correct skip detail', () => {
      const config = makeConfig(5);
      const state = createNavigationState(config);
      state.currentIndex = 2;

      const detail = createSkipDetail(state, config);

      expect(detail.atScene).toBe(2);
      expect(detail.scene.id).toBe('scene-2');
      expect(detail.totalScenes).toBe(5);
    });
  });

  describe('single-scene edge case', () => {
    it('next() on single scene dispatches complete', () => {
      const config = makeConfig(1);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigateNext(state, config, cb);

      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onComplete).toHaveLength(1);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });

    it('prev() on single scene is no-op', () => {
      const config = makeConfig(1);
      const state = createNavigationState(config);
      const cb = makeCallbacks();

      navigatePrev(state, config, cb);

      expect(state.currentIndex).toBe(0);
      expect(cb.calls.onSceneChange).toHaveLength(0);
    });
  });
});
