import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ProcessService } from './process.service';

@Controller('process')
export class ProcessController {
  constructor(private processService: ProcessService) {}

  @Get('sell-current-total')
  async getSellCurrentTotal() {
    try {
      const totalCurrentSells = await this.processService.totalCurrentSells();
      if (!totalCurrentSells) {
        throw new NotFoundException('No se ha encontrado ninguna cuenta');
      }
      return totalCurrentSells;
    } catch (error) {
      throw new NotFoundException('Ha ocurrido algo inesperado');
    }
  }

  @Get('income-current-total')
  async getIncomeCurrentTotal() {
    try {
      const totalCurrentSells = await this.processService.getCurrentIncome();
      if (!totalCurrentSells) {
        throw new NotFoundException('No se ha encontrado ninguna cuenta');
      }
      return totalCurrentSells;
    } catch (error) {
      throw new NotFoundException('Ha ocurrido algo inesperado');
    }
  }
}
