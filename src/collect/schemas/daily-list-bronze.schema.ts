import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export const DAILY_LISTS = ['now_playing', 'upcoming', 'trending'] as const;
export type DailyList = (typeof DAILY_LISTS)[number];

export const LIST_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

@Schema({ collection: 'daily_lists_bronze', versionKey: false })
export class DailyListBronze {
  @Prop({ type: String, enum: DAILY_LISTS, required: true })
  list: DailyList;

  @Prop({ type: String, required: true, match: LIST_DATE_FORMAT })
  date: string;

  @Prop({ type: String, default: 'CA' })
  region: string;

  @Prop({ type: Number, required: true })
  page: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  raw: Record<string, unknown>;
}

export type DailyListBronzeDocument = HydratedDocument<DailyListBronze>;

export const DailyListBronzeSchema =
  SchemaFactory.createForClass(DailyListBronze);

DailyListBronzeSchema.index(
  { list: 1, date: 1, region: 1, page: 1 },
  { unique: true },
);
