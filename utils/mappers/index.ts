import { DataMapper } from './types';
import { AlphaVantageAdapter } from './adapters/AlphaVantageAdapter';
import { GenericJSONAdapter } from './adapters/GenericJSONAdapter';

export const mappers: Record<string, DataMapper> = {
  [AlphaVantageAdapter.id]: AlphaVantageAdapter,
  [GenericJSONAdapter.id]: GenericJSONAdapter,
};

export function getMapper(id: string): DataMapper {
  return mappers[id] || GenericJSONAdapter;
}

export * from './types';
