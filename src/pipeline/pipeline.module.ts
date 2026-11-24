import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PipelineRun, PipelineRunSchema } from './schemas/pipeline-run.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PipelineRun.name, schema: PipelineRunSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PipelineModule {}
