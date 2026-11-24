import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyListBronze,
  DailyListBronzeSchema,
} from './schemas/daily-list-bronze.schema';
import { MovieBronze, MovieBronzeSchema } from './schemas/movie-bronze.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MovieBronze.name, schema: MovieBronzeSchema },
      { name: DailyListBronze.name, schema: DailyListBronzeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CollectModule {}
