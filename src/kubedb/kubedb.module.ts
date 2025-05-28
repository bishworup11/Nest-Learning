import { Module } from '@nestjs/common';
import { KubedbService } from './kubedb.service';
import { KubedbController } from './kubedb.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KubedbService],
  controllers: [KubedbController],
  exports: [KubedbService],
})
export class KubedbModule {}
