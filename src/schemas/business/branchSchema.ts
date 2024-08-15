import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { OperatingPeriod } from '../operatingPeriod/operatingPeriod.schema';
import { Business } from './businessSchema';
import { Device } from '../devices/device.schema';

@Schema({ timestamps: true })
export class Branch {
  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  logo: string;

  @Prop({ default: false })
  status: boolean;

  //le vamos a meter la clave devices, para referenciar a los dispositivos que tiene el branch
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Device' }],
    default: [],
  })
  devices: Device[];

  @Prop({ default: '00:00' })
  initOperatingPeriod: string;

  @Prop({ default: '00:00' })
  closeOperatingPeriod: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'OperatingPeriod',
  })
  operatingPeriod: OperatingPeriod;
  // vamos a referenciar a que negocio pertenece y este sera un campo requerido
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Business',
  })
  businessId: Business;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
