import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'admin@pharmacy.com', description: 'The email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'The password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
