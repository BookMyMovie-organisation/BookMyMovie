import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_kpis', versionKey: false })
export class GoldKpis {
  @Prop({ type: Number, default: 0 })
  totalMovies: number;

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  nowPlayingCount: number;

  @Prop({ type: String, default: null })
  topGenre: string | null;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type GoldKpisDocument = HydratedDocument<GoldKpis>;

export const GoldKpisSchema = SchemaFactory.createForClass(GoldKpis);
