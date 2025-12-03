import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Enable CORS so Frontend can talk to Backend
  app.enableCors();

  // 2. Configure Swagger (The API Manual)
  const config = new DocumentBuilder()
    .setTitle('PharmaCore ERP API')
    .setDescription('The Enterprise backend API description for Inventory, HR, and Sales.')
    .setVersion('1.0')
    .addBearerAuth() // Adds the "Authorize" button to test JWTs
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  // 3. Host the manual at /api
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();