// ─────────────────────────────────────────────────────────────────────────────
// Queue event emitter — bridges Bull events to WebSocket-ready events
// ─────────────────────────────────────────────────────────────────────────────

import { EventEmitter } from "node:events";
import type Bull from "bull";
import type { RenderJobData } from "../queues/renderQueue.js";

/* ══════════════════════════════════════════════════════════════════════════════
 *  Event types
 * ══════════════════════════════════════════════════════════════════════════════ */

export interface QueueProgressEvent {
  type: "job:progress";
  jobId: string;
  jobType: string;
  progress: number;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface QueueCompletedEvent {
  type: "job:completed";
  jobId: string;
  jobType: string;
  result: unknown;
  timestamp: string;
}

export interface QueueFailedEvent {
  type: "job:failed";
  jobId: string;
  jobType: string;
  error: string;
  attemptsMade: number;
  timestamp: string;
}

export type QueueEvent = QueueProgressEvent | QueueCompletedEvent | QueueFailedEvent;

/* ══════════════════════════════════════════════════════════════════════════════
 *  Global event emitter singleton
 * ══════════════════════════════════════════════════════════════════════════════ */

class QueueEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitProgress(jobId: string, jobType: string, progress: number, data?: Record<string, unknown>) {
    const event: QueueProgressEvent = {
      type: "job:progress",
      jobId,
      jobType,
      progress,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit("job:progress", event);
    this.emit("job:*", event);
  }

  emitCompleted(jobId: string, jobType: string, result: unknown) {
    const event: QueueCompletedEvent = {
      type: "job:completed",
      jobId,
      jobType,
      result,
      timestamp: new Date().toISOString(),
    };
    this.emit("job:completed", event);
    this.emit("job:*", event);
  }

  emitFailed(jobId: string, jobType: string, error: string, attemptsMade: number) {
    const event: QueueFailedEvent = {
      type: "job:failed",
      jobId,
      jobType,
      error,
      attemptsMade,
      timestamp: new Date().toISOString(),
    };
    this.emit("job:failed", event);
    this.emit("job:*", event);
  }
}

export const queueEvents = new QueueEventBus();

/* ══════════════════════════════════════════════════════════════════════════════
 *  Attach Bull queue events to the bus
 * ══════════════════════════════════════════════════════════════════════════════ */

export function attachQueueEvents(queue: Bull.Queue<RenderJobData>): void {
  // Use "global:" prefixed events so they fire regardless of whether
  // the worker runs in the same process or a separate one.
  queue.on("global:progress", (jobId: string, progress: number) => {
    // Global events only provide job ID; fetch type from job data asynchronously
    queue.getJob(jobId).then((job) => {
      if (job) {
        queueEvents.emitProgress(jobId, job.data.type, progress);
      }
    });
  });

  queue.on("global:completed", (jobId: string) => {
    queue.getJob(jobId).then((job) => {
      if (job) {
        queueEvents.emitCompleted(jobId, job.data.type, job.returnvalue);
        console.log(`✅ Job ${jobId} (${job.data.type}) completed`);
      }
    });
  });

  queue.on("global:failed", (jobId: string, err: string) => {
    queue.getJob(jobId).then((job) => {
      if (job) {
        queueEvents.emitFailed(jobId, job.data.type, err, job.attemptsMade);
        console.error(`❌ Job ${jobId} (${job.data.type}) failed:`, err);
      }
    });
  });

  queue.on("global:stalled", (jobId: string) => {
    console.warn(`⚠️  Job ${jobId} stalled`);
  });
}
