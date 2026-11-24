import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({
  collection: 'watchlists',
  versionKey: false,
  timestamps: { createdAt: false, updatedAt: true },
})
export class Watchlist {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Number], default: [] })
  movieIds: number[];

  updatedAt: Date;
}

export type WatchlistDocument = HydratedDocument<Watchlist>;

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);
