import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { PipelineRun } from '../../pipeline/schemas/pipeline-run.schema';

@Schema({ collection: 'movies_bronze', versionKey: false })
export class MovieBronze {
  @Prop({ type: Number, required: true })
  _id: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  raw: Record<string, unknown>;

  @Prop({ type: Date, required: true })
  fetchedAt: Date;

  @Prop({ type: Types.ObjectId, ref: PipelineRun.name, default: null })
  runId: Types.ObjectId | null;
}

export type MovieBronzeDocument = HydratedDocument<MovieBronze>;

export const MovieBronzeSchema = SchemaFactory.createForClass(MovieBronze);

MovieBronzeSchema.index({ runId: 1 });
MovieBronzeSchema.index({ fetchedAt: -1 });
