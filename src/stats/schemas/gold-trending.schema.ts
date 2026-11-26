import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_trending', versionKey: false })
export class GoldTrending {
  @Prop({ type: Number, required: true })
  movieId: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: null })
  posterPath: string | null;

  @Prop({ type: Number, default: 0 })
  daysTrending: number;

  @Prop({ type: Number, default: 0 })
  rankToday: number;
}

export type GoldTrendingDocument = HydratedDocument<GoldTrending>;

export const GoldTrendingSchema = SchemaFactory.createForClass(GoldTrending);

GoldTrendingSchema.index({ movieId: 1 }, { unique: true });
