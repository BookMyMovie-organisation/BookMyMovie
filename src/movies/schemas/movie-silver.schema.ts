import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'movies_silver', versionKey: false })
export class MovieSilver {
  @Prop({ type: Number, required: true })
  _id: number;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: Date, default: null })
  releaseDate: Date | null;

  @Prop({ type: Number, default: null })
  year: number | null;

  @Prop({ type: Number, default: null })
  decade: number | null;

  @Prop({ type: Number, default: null })
  runtime: number | null;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: String, default: null })
  director: string | null;

  @Prop({ type: [String], default: [] })
  cast: string[];

  @Prop({ type: String, default: null })
  certificationCA: string | null;

  @Prop({ type: String, default: null })
  language: string | null;

  @Prop({ type: Number, default: null })
  budget: number | null;

  @Prop({ type: Number, default: null })
  revenue: number | null;

  @Prop({ type: Number, default: null })
  roi: number | null;

  @Prop({ type: Number, default: 0 })
  voteAverage: number;

  @Prop({ type: Number, default: 0 })
  voteCount: number;

  @Prop({ type: Number, default: 0 })
  popularity: number;

  @Prop({ type: String, default: null })
  posterPath: string | null;

  @Prop({ type: [Number], default: [] })
  recommendations: number[];

  @Prop({ type: Boolean, default: false })
  isManual: boolean;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type MovieSilverDocument = HydratedDocument<MovieSilver>;

export const MovieSilverSchema = SchemaFactory.createForClass(MovieSilver);
