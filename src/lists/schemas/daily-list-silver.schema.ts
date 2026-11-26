import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  DAILY_LISTS,
  LIST_DATE_FORMAT,
} from '../../collect/schemas/daily-list-bronze.schema';
import type { DailyList } from '../../collect/schemas/daily-list-bronze.schema';
import { MovieSilver } from '../../movies/schemas/movie-silver.schema';

@Schema({ collection: 'daily_lists_silver', versionKey: false })
export class DailyListSilver {
  @Prop({ type: Number, ref: MovieSilver.name, required: true })
  movieId: number;

  @Prop({ type: String, required: true, match: LIST_DATE_FORMAT })
  date: string;

  @Prop({ type: String, enum: DAILY_LISTS, required: true })
  list: DailyList;

  @Prop({ type: Number, required: true })
  rank: number;
}

export type DailyListSilverDocument = HydratedDocument<DailyListSilver>;

export const DailyListSilverSchema =
  SchemaFactory.createForClass(DailyListSilver);

DailyListSilverSchema.index({ movieId: 1, date: 1, list: 1 }, { unique: true });
DailyListSilverSchema.index({ date: 1 });
