import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoldDecade, GoldDecadeSchema } from './schemas/gold-decade.schema';
import { GoldGenre, GoldGenreSchema } from './schemas/gold-genre.schema';
import { GoldKpis, GoldKpisSchema } from './schemas/gold-kpis.schema';
import {
  GoldNowPlaying,
  GoldNowPlayingSchema,
} from './schemas/gold-now-playing.schema';
import { GoldRoi, GoldRoiSchema } from './schemas/gold-roi.schema';
import {
  GoldTrending,
  GoldTrendingSchema,
} from './schemas/gold-trending.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoldKpis.name, schema: GoldKpisSchema },
      { name: GoldGenre.name, schema: GoldGenreSchema },
      { name: GoldRoi.name, schema: GoldRoiSchema },
      { name: GoldDecade.name, schema: GoldDecadeSchema },
      { name: GoldNowPlaying.name, schema: GoldNowPlayingSchema },
      { name: GoldTrending.name, schema: GoldTrendingSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class StatsModule {}
