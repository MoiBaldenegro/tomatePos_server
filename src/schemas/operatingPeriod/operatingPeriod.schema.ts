import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { DailyRegister } from '../dailyRegister/createDailyRegister';
import { Schema as MongooseSchema } from 'mongoose';
import { CashierSession } from '../cashierSession/cashierSession';
import { OperationalClousure } from './operationalClousure';
import { User } from '../users.schema';

interface CashIn {
  init: boolean;
  amount: string;
}

export enum State {
  ACTIVE = 'ACTIVE',
  CONFLICT = 'CONFLICT',
  CLOSED = 'CLOSED',
  APPROVED = 'APPROVED',
}
/*
interface OperationalClousure {
  state: State;
  totalSellsAmount: string;
  totalRestaurantAmount: string;
  totalToGoAmount: string;
  totalPhoneAmount: string;
  totalRappiAmount: string;
  totalCashInAmount: string;
  totalDebitAmount: string;
  totalCreditAmount: string;
  totalTransferAmount: string;
  totalDeliveryAmount: string;
  // numero de transacciones
  totalDiners: number;
  finishedAccounts: number; // ver como se comporta esto
  togoOrdersTotal: number;
  phoneOrdersTotal: number;
  restaurantOrdersTotal: number; //esto a que seria igual de las de arriba?
  rappiOrdersTotal: number;
  //descuentos
  numberOfDiscounts: number;
  discountTotalAmount: string;
  numberOfNotesWithDiscount: number;
  notesWithDiscountTotalAmount: string;
  numberOfproductsWithDiscount: number;
  productsWithDiscountTotalAmount: string;

  // cortesías
  numberOfCourtesies: number;
  courtesiesTotalAmount: string;
  numberOfNotesWithCourtesy: number;
  notesWithCourtesyTotalAmount: string;
  numberOfproductsWithCourtesy: number;
  productsWithCourtesyTotalAmount: string;

  // cancellations
  numberOfCancellations: number;
  cancellationsTotalAmount: string;
  numberOfNotesWithCancellation: number;
  notesWithCancellationTotalAmount: string;
  numberOfproductsWithCancellation: number;
  productsWithCancellationTotalAmount: string;
}
  */

@Schema({ timestamps: true })
export class OperatingPeriod {
  @Prop({ default: true })
  status: boolean;

  @Prop({
    default: [],
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'DailyRegister' }],
  })
  dailyRegisters: DailyRegister[];

  @Prop({
    default: [],
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CashierSession' }],
  })
  sellProcess: CashierSession[];

  @Prop({ required: true, default: '0.00' })
  withdrawals?: string;

  @Prop({
    type: {
      init: { type: Boolean, default: false },
      amount: { type: String, default: '$0.00' },
    },
    default: { init: false, amount: '$0.00' },
  })
  cashIn?: CashIn;

  // Aquí solo referenciamos la clase
  @Prop({ type: OperationalClousure })
  operationalClousure?: OperationalClousure;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: User;
}

export const OperatingPeriodSchema =
  SchemaFactory.createForClass(OperatingPeriod);
