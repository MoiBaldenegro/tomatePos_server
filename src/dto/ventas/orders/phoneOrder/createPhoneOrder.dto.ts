import { IsArray, IsOptional, IsString } from 'class-validator';

export class createPhoneDto {
  @IsString()
  code: string;

  @IsString()
  user: string;

  @IsString()
  userId: string;

  @IsString()
  checkTotal: string;

  @IsString()
  status: string;

  @IsArray()
  products: [];

  @IsArray()
  payment: [];

  @IsString()
  @IsOptional()
  orderName: string;
}
