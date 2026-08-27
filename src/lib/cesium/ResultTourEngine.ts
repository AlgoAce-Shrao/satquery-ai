import { AnalysisResult } from '../../types/geospatial';
import { EarthCameraController } from './EarthCameraController';

export interface TourEngineOptions {
  stepIntervalMs?: number;
  autoStart?: boolean;
}

export class ResultTourEngine {
  private results: AnalysisResult[] = [];
  private currentIndex: number = 0;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private stepIntervalMs: number = 7500;
  private cameraController: EarthCameraController;
  private onStepChange?: (index: number, result: AnalysisResult) => void;
  private onStateChange?: (isRunning: boolean) => void;

  constructor(cameraController: EarthCameraController, options?: TourEngineOptions) {
    this.cameraController = cameraController;
    if (options?.stepIntervalMs) this.stepIntervalMs = options.stepIntervalMs;
    this.isRunning = options?.autoStart ?? false;
  }

  public setCallbacks(
    onStepChange: (index: number, result: AnalysisResult) => void,
    onStateChange?: (isRunning: boolean) => void
  ) {
    this.onStepChange = onStepChange;
    this.onStateChange = onStateChange;
  }

  public setResults(results: AnalysisResult[], startIndex: number = 0) {
    this.stopTimer();
    this.results = results;
    this.currentIndex = Math.min(Math.max(0, startIndex), Math.max(0, results.length - 1));

    if (this.results.length > 0) {
      this.navigateToCurrentIndex(false);
      if (this.isRunning && this.results.length > 1) {
        this.startTimer();
      }
    }
  }

  public pause(dueToUserGesture: boolean = false) {
    if (this.isRunning) {
      this.isRunning = false;
      this.stopTimer();
      if (this.onStateChange) this.onStateChange(false);
    }
  }

  public resume() {
    if (!this.isRunning && this.results.length > 0) {
      this.isRunning = true;
      if (this.onStateChange) this.onStateChange(true);
      this.navigateToCurrentIndex(true);
      if (this.results.length > 1) {
        this.startTimer();
      }
    }
  }

  public toggle() {
    if (this.isRunning) {
      this.pause(false);
    } else {
      this.resume();
    }
  }

  public next() {
    if (this.results.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.results.length;
    this.navigateToCurrentIndex(true);
    if (this.isRunning) this.resetTimer();
  }

  public previous() {
    if (this.results.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.results.length) % this.results.length;
    this.navigateToCurrentIndex(true);
    if (this.isRunning) this.resetTimer();
  }

  public selectIndex(index: number) {
    if (index < 0 || index >= this.results.length) return;
    this.currentIndex = index;
    this.navigateToCurrentIndex(true);
    if (this.isRunning) this.resetTimer();
  }

  private navigateToCurrentIndex(smooth: boolean = true) {
    const current = this.results[this.currentIndex];
    if (!current) return;

    if (this.onStepChange) {
      this.onStepChange(this.currentIndex, current);
    }

    this.cameraController.flyToLocation(
      current.location.lat,
      current.location.lon,
      1.35,
      smooth ? 1600 : 0
    );
  }

  private startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.next();
    }, this.stepIntervalMs);
  }

  private resetTimer() {
    this.startTimer();
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public dispose() {
    this.stopTimer();
  }
}
