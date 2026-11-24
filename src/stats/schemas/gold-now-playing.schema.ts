import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_now_playing', versionKey: false })
export class GoldNowPlaying {
  @Prop({ type: Number, required: true })
  movieId: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: null })
  posterPath: string | null;

  @Prop({ type: Number, default: 0 })
  daysInTheaters: number;

  @Prop({ type: Number, default: 0 })
  rank: number;
}

export type GoldNowPlayingDocument = HydratedDocument<GoldNowPlaying>;

export const GoldNowPlayingSchema =
  SchemaFactory.createForClass(GoldNowPlaying);
