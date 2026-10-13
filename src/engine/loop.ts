// Fixed-timestep accumulator: the sim ticks at a constant rate regardless of frame rate.
// Render reads `alpha` to interpolate between the previous and current sim states.

export class FixedStep {
  private acc = 0;
  alpha = 0;

  constructor(readonly stepMs: number, private readonly maxTicksPerFrame = 400) {}

  /** Returns how many ticks to run for this frame. */
  advance(realDeltaMs: number, speed: number): number {
    this.acc += realDeltaMs * speed;
    let ticks = Math.floor(this.acc / this.stepMs);
    this.acc -= ticks * this.stepMs;
    if (ticks > this.maxTicksPerFrame) {
      ticks = this.maxTicksPerFrame;
      this.acc = 0;
    }
    this.alpha = this.acc / this.stepMs;
    return ticks;
  }

  reset(): void {
    this.acc = 0;
    this.alpha = 0;
  }
}
