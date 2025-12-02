import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ENABLE CORS: Allows the frontend to talk to this backend
  //app.enableCors(); 
  app.enableCors({
  origin: '*', // Allow ALL connections (Easiest for testing)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
});
  
  await app.listen(3000);
}
bootstrap();
