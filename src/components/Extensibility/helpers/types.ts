import { StoreKeys, StoreSchemaType } from '@ui-schema/ui-schema';

type SchemaOnChangeParam = {
  storeKeys: StoreKeys;
  scopes: string[];
  type: string;
  schema: StoreSchemaType;
  required?: boolean;
  data: { value: number | string | null };
};

export type SchemaOnChangeParams = SchemaOnChangeParam | SchemaOnChangeParam[];
