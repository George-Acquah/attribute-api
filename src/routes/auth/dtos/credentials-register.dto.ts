import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CredentialsRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
