import { ApiProperty } from '@nestjs/swagger'
import { MetadonneesDto } from './metadonnees.dto'

export class CollectDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Décision intègre au format wordperfect.'
  })
  decisionIntegre: any

  @ApiProperty({
    description: 'Metadonnées associées à la décision intègre.'
  })
  metadonnees: MetadonneesDto
}
