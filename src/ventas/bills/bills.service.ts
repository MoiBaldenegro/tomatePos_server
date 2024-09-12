import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBillDto } from 'src/dto/ventas/bills/createBill.Dto';
import { UpdateBillDto } from 'src/dto/ventas/bills/updateBill.Dto';
import { Bills, BillsDocument } from 'src/schemas/ventas/bills.schema';
import {
  BILL_TO_BILL,
  BILL_TO_NOTE,
  NOTE_TO_BILL,
  NOTE_TO_NOTE,
} from './cases';
import { Notes } from 'src/schemas/ventas/notes.schema';
import { OperatingPeriod } from 'src/schemas/operatingPeriod/operatingPeriod.schema';
import { OperatingPeriodService } from 'src/operating-period/operating-period.service';
import { PhoneOrder } from 'src/schemas/ventas/orders/phoneOrder.schema';
import { RappiOrder } from 'src/schemas/ventas/orders/rappiOrder.schema';
import { ToGoOrder } from 'src/schemas/ventas/orders/toGoOrder.schema';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(ToGoOrder.name) private toGoOrderModel: Model<ToGoOrder>,
    @InjectModel(RappiOrder.name) private rappiOrderModel: Model<RappiOrder>,
    @InjectModel(PhoneOrder.name) private phoneOrderModel: Model<PhoneOrder>,
    @InjectModel(Bills.name) private billsModel: Model<BillsDocument>,
    @InjectModel(Notes.name) private noteModel: Model<Notes>,
    @InjectModel(OperatingPeriod.name)
    private operatingPeriodModel: Model<OperatingPeriod>,
    private readonly operatingPeriodService: OperatingPeriodService,
  ) {}

  async findAll() {
    try {
      return await this.billsModel
        .find()
        .populate({
          path: 'payment',
        })
        .populate({
          path: 'notes',
        });
    } catch (error) {
      throw new Error(error);
    }
  }
  /*
  async findCurrent() {
    try {
      return await this.billsModel
        .find({
          status: ENABLE_STATUS,
        })
        .populate({
          path: 'payment',
        })
        .populate({
          path: 'notes',
        });
    } catch (error) {
      throw new Error(error);
    }
  }
    */

  async findOne(id: string) {
    try {
      return await this.billsModel
        .findById(id)
        .populate({
          path: 'payment',
        })
        .populate({
          path: 'notes',
        });
    } catch (error) {
      throw new Error(error);
    }
  }

  async create(createBill: CreateBillDto) {
    try {
      const lastBill = await this.billsModel
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      const nextBillCode = lastBill
        ? this.getNextBillCode(parseFloat(lastBill.code))
        : 1;
      const formatCode = this.formatCode(nextBillCode.toString());

      const billToCreate = new this.billsModel({
        ...createBill,
        code: formatCode,
      });
      await billToCreate.save();
      return billToCreate;
    } catch (error) {
      throw error;
    }
  }

  private getNextBillCode(lastBillCode: number): number {
    return lastBillCode + 1;
  }

  /*
  async create(createBill: CreateBillDto) {
    const session = await this.billsModel.startSession();
    session.startTransaction();

    try {
      // Obtener el valor actual del contador y formatear el billCode
      const billCodeCounter = await this.getNextBillCodeCounter(session);
      const formattedBillCode = this.formatBillCode(billCodeCounter);

      // Incrementar el contador en la base de datos
      await this.incrementBillCodeCounter(session);

      // Crear la nueva factura con el billCode formateado
      const billToCreate = new this.billsModel({
        ...createBill,
        billCode: formattedBillCode,
      });

      await billToCreate.save({ session });

      await session.commitTransaction();
      session.endSession();

      return billToCreate;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      throw error;
    }
  }
 */
  async delete(id: string) {
    return await this.billsModel.findByIdAndDelete(id);
  }

  async update(id: string, updatedBill: UpdateBillDto) {
    return await this.billsModel.findByIdAndUpdate(id, updatedBill, {
      new: true,
    });
  }

  async transferProducts(body: any) {
    const session = await this.billsModel.startSession();
    session.startTransaction();

    // receiving data
    const receivingProducts = body.receivingBill.products; // ✅
    const receivingTotal = receivingProducts
      .reduce(
        (a, b) =>
          a + parseFloat(b.quantity > 1 ? b.priceInSiteBill : b.priceInSite),
        0,
      )
      .toFixed(2)
      .toString();

    const receivingUpdate = {
      products: receivingProducts,
      checkTotal: receivingTotal,
    };

    // send data
    const sendBillProducts = body.sendBill.products;
    const sendBillcheckTotal = sendBillProducts
      .reduce(
        (a, b) =>
          a + parseFloat(b.quantity > 1 ? b.priceInSiteBill : b.priceInSite),
        0,
      )
      .toFixed(2)
      .toString();

    const updateSendBill = {
      products: sendBillProducts,
      checkTotal: sendBillcheckTotal,
    };

    try {
      switch (body.case) {
        case BILL_TO_BILL:
          // hacemos los cambios en la cuenta principal
          const currentReceivingBill = await this.billsModel.findByIdAndUpdate(
            body.receivingBill._id,
            receivingUpdate,
          );

          const currentSendBill = await this.billsModel.findByIdAndUpdate(
            body.sendBill._id,
            updateSendBill,
          );

          if (!currentReceivingBill) {
            throw new NotFoundException(`No se encuentra la cuenta, error`);
          }
          await session.commitTransaction();
          session.endSession();
          return currentReceivingBill;

        case NOTE_TO_NOTE:
          const updateReceivingNote = await this.noteModel.findByIdAndUpdate(
            body.receivingBill._id,
            receivingUpdate,
          );
          const currentBill = await this.billsModel
            .findById(body.receivingBill.accountId)
            .populate({ path: 'notes' });

          const noteToNoteTotal = currentBill.notes
            .reduce((a, b) => {
              return a + parseInt(b.checkTotal);
            }, 0)
            .toString();
          const noteToNoteProducts = currentBill.notes.flatMap(
            (element) => element.products,
          );
          const updateDataBillToNote = {
            products: noteToNoteProducts,
            checkTotal: noteToNoteTotal,
          };

          const updateReceivingBillToNote =
            await this.billsModel.findByIdAndUpdate(
              currentBill._id,
              updateDataBillToNote,
              { new: true },
            );

          // Ahora actualizamos la mesa que envio
          const updateSendNote = await this.noteModel.findByIdAndUpdate(
            body.sendBill._id,
            updateSendBill,
          );

          const currentSendBillNoteToNote = await this.billsModel
            .findById(body.sendBill.accountId)
            .populate({ path: 'notes' });

          const noteToNoteSendTotal = currentBill.notes
            .reduce((a, b) => {
              return a + parseInt(b.checkTotal);
            }, 0)
            .toString();

          const noteToNoteSendProducts =
            currentSendBillNoteToNote.notes.flatMap(
              (element) => element.products,
            );
          const updateDatasSendBillToNote = {
            products: noteToNoteSendProducts,
            checkTotal: noteToNoteSendTotal,
          };

          const updateSendBillToNote = await this.billsModel.findByIdAndUpdate(
            currentBill._id,
            updateDatasSendBillToNote,
            { new: true },
          );
          await session.commitTransaction();
          session.endSession();
          return updateReceivingNote;

        case BILL_TO_NOTE:
          // actualizamos la nota que recibe
          const updateReceivingBillToNoteCase =
            await this.noteModel.findByIdAndUpdate(
              body.receivingBill._id,
              receivingUpdate,
            );
          const currentBillToNote = await this.billsModel
            .findById(body.receivingBill.accountId)
            .populate({ path: 'notes' });

          const billToNoteTotal = currentBillToNote.notes
            .reduce((a, b) => {
              return a + parseInt(b.checkTotal);
            }, 0)
            .toString();
          const BillToNoteProducts = currentBillToNote.notes.flatMap(
            (element) => element.products,
          );
          const updateDataBillToNoteCase = {
            products: BillToNoteProducts,
            checkTotal: billToNoteTotal,
          };

          const updReceivingBillToNoteCase =
            await this.billsModel.findByIdAndUpdate(
              currentBillToNote._id,
              updateDataBillToNoteCase,
              { new: true },
            );

          // ahora actualizamos la cuenta que envia
          const currentSendBilltoNote = await this.billsModel.findByIdAndUpdate(
            body.sendBill._id,
            updateSendBill,
          );

          await session.commitTransaction();
          session.endSession();
          return updateReceivingBillToNoteCase;

        case NOTE_TO_BILL:
          console.log('Ultimo metodo funciona'); ////////////////
          const currentReceivingNoteToBill =
            await this.billsModel.findByIdAndUpdate(
              body.receivingBill._id,
              receivingUpdate,
            );

          // actualizamos la nota que envia por ultimo
          const updateSendNoteToBill = await this.noteModel.findByIdAndUpdate(
            body.sendBill._id,
            updateSendBill,
          );

          const currentNoteToBill = await this.billsModel
            .findById(body.sendBill.accountId)
            .populate({ path: 'notes' });

          const noteToBillSendTotal = currentNoteToBill.notes
            .reduce((a, b) => {
              return a + parseInt(b.checkTotal);
            }, 0)
            .toString();

          const noteToBillSendProducts = currentNoteToBill.notes.flatMap(
            (element) => element.products,
          );
          const updateDatasSendNoteToBill = {
            products: noteToBillSendProducts,
            checkTotal: noteToBillSendTotal,
          };

          const updateSendNoteToBillCase =
            await this.billsModel.findByIdAndUpdate(
              currentBill._id,
              updateDatasSendNoteToBill,
              { new: true },
            );

          await session.commitTransaction();
          session.endSession();
          return currentReceivingNoteToBill;

        default:
          throw new Error('No existe el caso');
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
    }
  }
  // echar a andar este metodo
  async findCurrent(id?: string) {
    const session = await this.operatingPeriodModel.startSession();
    session.startTransaction();
    try {
      const currentPeriod = id
        ? await this.operatingPeriodService.getCurrent(id)
        : await this.operatingPeriodService.getCurrent();

      console.log('currentPeriod', currentPeriod);
      if (!currentPeriod) {
        throw new NotFoundException(
          'No se encontro ningun periodo actualmente',
        );
      }
      // traeremos todas  las cuentas que matching con el periodo actual
      const bills = await this.billsModel
        .find({
          operatingPeriod: currentPeriod[0]._id,
        })
        .populate({
          path: 'payment',
          populate: {
            path: 'transactions',
          },
        });
      // traeremos todas las ordenes que matching con el periodo actual
      const toGoOrders = await this.toGoOrderModel
        .find({
          operatingPeriod: currentPeriod[0]._id,
        })
        .populate({
          path: 'payment',
          populate: {
            path: 'transactions',
          },
        });
      console.log('toGoOrders', toGoOrders);
      const rappiOrders = await this.rappiOrderModel
        .find({
          operatingPeriod: currentPeriod[0]._id,
        })
        .populate({
          path: 'payment',
          populate: {
            path: 'transactions',
          },
        });
      console.log('rappiOrders', rappiOrders);
      const phoneOrders = await this.phoneOrderModel
        .find({
          operatingPeriod: currentPeriod[0]._id,
        })
        .populate({
          path: 'payment',
          populate: {
            path: 'transactions',
          },
        });
      console.log('phoneOrders', phoneOrders);

      const allOrders = [
        ...bills,
        ...toGoOrders,
        ...rappiOrders,
        ...phoneOrders,
      ];
      console.log(` allOrders ${allOrders}`);
      await session.commitTransaction();
      session.endSession();
      return allOrders;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  private formatCode(code: string): string {
    // todo
    // formatear correctamente el codigo de la factura
    return code.padStart(6, '0');
  }

  /*
  async getNextBillCodeCounter(session?: ClientSession): Promise<number> {
    const result = await this.billsModel.findOneAndUpdate(
      {},
      { $inc: { billCodeCounter: 1 } },
      { new: true, upsert: true, select: 'billCodeCounter', session },
    );

    return result ? result.billCodeCounter : 1;
  }

  async incrementBillCodeCounter(session?: ClientSession): Promise<void> {
    await this.billsModel.updateOne(
      {},
      { $inc: { billCodeCounter: 1 } },
      { session },
    );
  }P

  private formatBillCode(counter: number): string {
    // Formatear el contador como "001"
    return counter.toString().padStart(3, '0');
  }
  */
}
