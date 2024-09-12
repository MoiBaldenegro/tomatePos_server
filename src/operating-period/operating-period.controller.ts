import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { OperatingPeriodService } from './operating-period.service';

@Controller('operating-period')
export class OperatingPeriodController {
  constructor(private operatingPeriodService: OperatingPeriodService) {}

  @Get()
  async findAll() {
    try {
      const periodArray = await this.operatingPeriodService.findAll();
      if (!periodArray) {
        throw new NotFoundException(
          'No se encontro ningun periodo actualmente',
        );
      }
      return periodArray;
    } catch (error) {
      throw new NotFoundException('Ha ocurrido algo inesperado');
    }
  }

  @Get('/current')
  async current() {
    try {
      const currenPeriod = await this.operatingPeriodService.getCurrent();
      if (!currenPeriod) {
        throw new NotFoundException('No se han iniciado operaciones');
      }
      return currenPeriod;
    } catch (error) {
      throw new NotFoundException(
        `Ha ocurrido algo inesperado. Mas informacion: ${error}`,
      );
    }
  }

  @Get('/total-sells')
  async totalSells() {
    try {
      const totalSells =
        await this.operatingPeriodService.getTotalSellsService();
      if (!totalSells) {
        throw new NotFoundException('No se han iniciado operaciones');
      }
      return totalSells;
    } catch (error) {
      throw new NotFoundException(
        `Ha ocurrido algo inesperado. Mas informacion: ${error}`,
      );
    }
  }

  @Put('close-period/:id')
  async closePeriod(@Param('id') id: string) {
    try {
      const res = await this.operatingPeriodService.closePeriod(id);
      if (!res) {
        throw new NotFoundException('No se ha podido cerrar el periodo');
      }
      return res;
    } catch (error) {
      throw new NotFoundException(
        `Ha ocurrido algo inesperado. Mas informacion: ${error}`,
      );
    }
  }

  // controller para aprovar un periodo
  @Put('approve-period/:id')
  async approvePeriod(@Param('id') id: string, @Body() body: any) {
    try {
      const res = await this.operatingPeriodService.approvePeriod(id, body);
      if (!res) {
        throw new NotFoundException('No se ha podido cerrar el periodo');
      }
      return res;
    } catch (error) {
      throw new NotFoundException(
        `Ha ocurrido algo inesperado. Mas informacion: ${error}`,
      );
    }
  }
}
