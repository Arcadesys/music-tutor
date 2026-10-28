import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  start: vi.fn(),
  trigger: vi.fn(),
  dispose: vi.fn(),
  construct: vi.fn(),
}));
vi.mock("tone", () => ({
  start: mock.start,
  now: () => 10,
  Synth: class {},
  PolySynth: class {
    constructor() {
      mock.construct();
    }
    toDestination() {
      return this;
    }
    triggerAttackRelease = mock.trigger;
    dispose = mock.dispose;
  },
  Frequency: (midi: number) => ({ toNote: () => `midi:${midi}` }),
}));
import { playPracticeEvents, stopPracticeAudio } from "../lib/audio";
const events = [
  { midis: [60], beat: 0, beats: 1 },
  { midis: [64], beat: 1, beats: 1 },
];
beforeEach(() => {
  stopPracticeAudio();
  vi.clearAllMocks();
  mock.start.mockResolvedValue(undefined);
});
describe("cancellable practice audio", () => {
  it("schedules displayed notes at the chosen tempo and disposes on stop", async () => {
    await playPracticeEvents(events, 120);
    expect(mock.trigger.mock.calls).toEqual([
      [["midi:60"], 0.45, 10.05],
      [["midi:64"], 0.45, 10.55],
    ]);
    stopPracticeAudio();
    expect(mock.dispose).toHaveBeenCalledOnce();
  });
  it("cannot start late after Stop during asynchronous audio initialization", async () => {
    let resolve!: () => void;
    mock.start.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const pending = playPracticeEvents(events, 60);
    stopPracticeAudio();
    resolve();
    await pending;
    expect(mock.construct).not.toHaveBeenCalled();
    expect(mock.trigger).not.toHaveBeenCalled();
  });
  it("only the newest request can play when two initializations overlap", async () => {
    const resolves: (() => void)[] = [];
    mock.start.mockImplementation(
      () => new Promise<void>((r) => resolves.push(r)),
    );
    const first = playPracticeEvents(events, 60);
    const second = playPracticeEvents(events, 120);
    resolves[1]();
    await second;
    resolves[0]();
    await first;
    expect(mock.construct).toHaveBeenCalledOnce();
    expect(mock.trigger).toHaveBeenCalledTimes(2);
  });
  it("stops an existing voice before replacement", async () => {
    await playPracticeEvents(events, 60);
    await playPracticeEvents(events, 90);
    expect(mock.dispose).toHaveBeenCalledOnce();
    expect(mock.construct).toHaveBeenCalledTimes(2);
  });
});
