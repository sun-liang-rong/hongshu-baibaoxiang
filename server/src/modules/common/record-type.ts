import { BadRequestException } from '@nestjs/common';
import { GenerateType } from '@prisma/client/index';

const recordTypes = new Set<string>(Object.values(GenerateType));

export const parseRecordType = (type?: string): GenerateType | undefined => {
  if (!type) {
    return undefined;
  }

  if (!recordTypes.has(type)) {
    throw new BadRequestException('记录类型不正确');
  }

  return type as GenerateType;
};
