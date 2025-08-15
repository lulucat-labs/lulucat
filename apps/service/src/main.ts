import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TasksService } from './modules/tasks/tasks.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀，排除 swagger 文档路径
  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });

  // 获取任务服务，并将当前设备上正在运行的任务标记为失败
  const tasksService = app.get(TasksService);
  await tasksService.markRunningTasksAsFailed();

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('LuluCat API')
    .setDescription('The LuluCat API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // 添加持久化授权配置
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
bootstrap();
