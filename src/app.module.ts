import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { CollectModule } from './collect/collect.module';
import databaseConfig from './config/database.config';
import { HealthModule } from './health/health.module';
import { ListsModule } from './lists/lists.module';
import { MoviesModule } from './movies/movies.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().uri().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('database.uri'),
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    HealthModule,
    PipelineModule,
    CollectModule,
    MoviesModule,
    ListsModule,
    StatsModule,
    UsersModule,
    WatchlistModule,
  ],
})
export class AppModule {}
