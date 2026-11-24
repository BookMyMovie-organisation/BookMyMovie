import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyListSilver,
  DailyListSilverSchema,
} from './schemas/daily-list-silver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyListSilver.name, schema: DailyListSilverSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ListsModule {}
