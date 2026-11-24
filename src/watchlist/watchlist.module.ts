import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Watchlist, WatchlistSchema } from './schemas/watchlist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Watchlist.name, schema: WatchlistSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class WatchlistModule {}
