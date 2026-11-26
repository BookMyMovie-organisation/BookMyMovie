import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_genres', versionKey: false })
export class GoldGenre {
  @Prop({ type: String, required: true })
  genre: string;

  @Prop({ type: Number, default: 0 })
  movieCount: number;

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  medianRating: number;

  @Prop({ type: Number, default: 0 })
  averagePopularity: number;
}

export type GoldGenreDocument = HydratedDocument<GoldGenre>;

export const GoldGenreSchema = SchemaFactory.createForClass(GoldGenre);

GoldGenreSchema.index({ genre: 1 }, { unique: true });
