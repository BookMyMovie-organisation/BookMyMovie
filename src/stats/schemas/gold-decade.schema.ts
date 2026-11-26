import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_decades', versionKey: false })
export class GoldDecade {
  @Prop({ type: Number, required: true })
  decade: number;

  @Prop({ type: Number, default: 0 })
  movieCount: number;

  @Prop({ type: Number, default: 0 })
  averageRuntime: number;

  @Prop({ type: Number, default: 0 })
  averageRating: number;
}

export type GoldDecadeDocument = HydratedDocument<GoldDecade>;

export const GoldDecadeSchema = SchemaFactory.createForClass(GoldDecade);

GoldDecadeSchema.index({ decade: 1 }, { unique: true });
