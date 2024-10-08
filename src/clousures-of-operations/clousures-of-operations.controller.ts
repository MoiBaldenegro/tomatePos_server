import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ClousuresOfOperationsService } from './clousures-of-operations.service';

@Controller('clousures-of-operations')
export class ClousuresOfOperationsController {
  constructor(
    private clousuresOfOperationsService: ClousuresOfOperationsService,
  ) {}

  @Post('cashier-session')
  async closeCashierSession(@Body() body: any) {
    try {
      const result =
        await this.clousuresOfOperationsService.closeCashierSession(body);
      if (!result) {
        throw new NotFoundException('No se ha podido cerrar la caja');
      }
      return result;
    } catch (error) {
      throw new NotFoundException('No se ha podido cerrar la caja');
    }
  }

  @Post('period')
  async closePeriod(@Body() body: any) {
    try {
      const result = await this.clousuresOfOperationsService.closePeriod(body);
      if (!result) {
        throw new NotFoundException('No se ha podido cerrar la caja');
      }
      return result;
    } catch (error) {
      throw new NotFoundException('No se ha podido cerrar la caja');
    }
  }
}
