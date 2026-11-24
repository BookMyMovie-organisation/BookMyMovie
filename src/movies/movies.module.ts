import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MovieSilver, MovieSilverSchema } from './schemas/movie-silver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MovieSilver.name, schema: MovieSilverSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MoviesModule {}
