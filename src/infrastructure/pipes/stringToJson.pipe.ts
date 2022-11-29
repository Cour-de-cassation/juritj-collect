import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class StringToJsonPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      throw new BadRequestException('You must provide "metadonnees" field')
    }
    try {
      return JSON.parse(value)
    } catch (error) {
      throw new BadRequestException('JSON format is invalid')
    }
  }
}
