import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Enable CORS (Allow Vercel to talk to Render)
  app.enableCors({
    origin: '*', // Allow all for now (safest for testing)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('PharmaCore ERP API')
    .setDescription('The Enterprise backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 3. LISTEN ON SYSTEM PORT (Fix for Render)
  // If Render gives a port, use it. If not, use 3000.
  await app.listen(process.env.PORT || 3000); 
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();