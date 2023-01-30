import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneesDto } from '../../shared/infrastructure/dto/metadonnees.dto'

export class SaveDecisionUsecase {
  constructor(private decisionsRepository: DecisionRepository) {}

  /**
   * Pour le SaveDecisionUseCase, nous choisissons de déroger à une règle fondamentale de la Clean Archi :
   * le Use Case va s'appuyer des éléments de l'infrastructure (metadonneeesDto et Express.Multer.file).
   * Nous faisons ce choix pour les raisons suivantes :
   * - A date, nous pensons que la taille de l'API (relativement petite) ne nécessite pas
   * de la complexifier avec des interfaces ou des entities du domaine
   *
   * - Le fichier de décision intègre est un élément central de l'API JuriTJ Collect, nous serons donc
   * fortement attentifs à toute évolution de cette librairie
   *
   * En cas d'évolution du contexte, nous créerons les interfaces et entities du domaine
   */
  async execute(decisionIntegre: Express.Multer.File, metadonnees: MetadonneesDto): Promise<void> {
    const requestDto = {
      decisionIntegre,
      metadonnees
    }
    const filename = decisionIntegre.originalname

    await this.decisionsRepository.saveDecisionIntegre(JSON.stringify(requestDto), filename)
  }
}
