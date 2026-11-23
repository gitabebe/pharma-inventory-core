import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'admin@pharmacy.com', description: 'The email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '123456', description: 'The password' })
  @IsOptional()
  @IsString()
  pass?: string;

  @ApiPropertyOptional({ example: '123456', description: 'The password' })
  @IsOptional()
  @IsString()
  password?: string;
}
