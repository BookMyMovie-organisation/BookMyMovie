import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'gold_roi', versionKey: false })
export class GoldRoi {
  @Prop({ type: String, required: true })
  genre: string;

  @Prop({ type: String, required: true })
  budgetBracket: string;

  @Prop({ type: Number, default: 0 })
  movieCount: number;

  @Prop({ type: Number, default: 0 })
  medianRoi: number;
}

export type GoldRoiDocument = HydratedDocument<GoldRoi>;

export const GoldRoiSchema = SchemaFactory.createForClass(GoldRoi);

GoldRoiSchema.index({ genre: 1, budgetBracket: 1 }, { unique: true });
