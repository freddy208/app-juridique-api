import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@test.com',
    description:
      'Email de l’utilisateur pour recevoir le lien de réinitialisation',
  })
  @IsEmail()
  email: string;
}
