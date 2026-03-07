import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ListingsController } from './listings.controller';
import { MediaController } from './media.controller';

@Module({
  controllers: [HealthController, ListingsController, MediaController],
})
export class AppModule {}
