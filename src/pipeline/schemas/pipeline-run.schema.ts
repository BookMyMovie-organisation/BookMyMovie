import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const PIPELINE_TRIGGERS = ['cron', 'manual'] as const;
export type PipelineTrigger = (typeof PIPELINE_TRIGGERS)[number];

export const PIPELINE_STATUSES = ['running', 'success', 'failed'] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

@Schema({ _id: false, versionKey: false })
export class PipelineRunCounts {
  @Prop({ type: Number, default: 0 })
  fetched: number;

  @Prop({ type: Number, default: 0 })
  inserted: number;

  @Prop({ type: Number, default: 0 })
  updated: number;

  @Prop({ type: Number, default: 0 })
  rejected: number;
}

export const PipelineRunCountsSchema =
  SchemaFactory.createForClass(PipelineRunCounts);

@Schema({ collection: 'pipeline_runs', versionKey: false })
export class PipelineRun {
  @Prop({ type: Date, required: true, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: String, enum: PIPELINE_TRIGGERS, required: true })
  trigger: PipelineTrigger;

  @Prop({ type: String, enum: PIPELINE_STATUSES, default: 'running' })
  status: PipelineStatus;

  @Prop({ type: PipelineRunCountsSchema, default: () => ({}) })
  counts: PipelineRunCounts;

  @Prop({ type: [String], default: [] })
  errorMessages: string[];
}

export type PipelineRunDocument = HydratedDocument<PipelineRun>;

export const PipelineRunSchema = SchemaFactory.createForClass(PipelineRun);
