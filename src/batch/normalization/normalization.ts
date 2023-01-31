import { v4 as uuidv4 } from 'uuid'
import { Metadonnees } from '../../shared/domain/metadonnees'
import { generateUniqueId } from './services/generateUniqueId'
import { normalizeDatesToIso8601 } from './services/convertDates'
import { removeUnnecessaryCharacters } from './services/removeUnnecessaryCharacters'
import { Context } from '../../shared/infrastructure/utils/context'
import { MockUtils } from '../../shared/infrastructure/utils/mock.utils'
import { CustomLogger } from '../../shared/infrastructure/utils/customLogger.utils'
import { ConvertedDecisionWithMetadonneesDto } from '../../shared/infrastructure/dto/convertedDecisionWithMetadonnees.dto'
import { fetchDecisionListFromS3 } from './services/fetchDecisionListFromS3'
import { DecisionS3Repository } from '../../shared/infrastructure/repositories/decisionS3.repository'
import { DecisionMongoRepository } from './repositories/decisionMongo.repository'
// import DecisionMongoRepository from './repositories/decisionMongo.repository'

const decisionContent = new MockUtils().decisionContent

const normalizationContext = new Context()
export const logger = new CustomLogger(normalizationContext)

const decisionMongoRepository = new DecisionMongoRepository()

const s3Repository = new DecisionS3Repository()
const bucketNameIntegre = process.env.SCW_BUCKET_NAME_RAW

export async function normalizationJob(
  decisionContent: string
): Promise<ConvertedDecisionWithMetadonneesDto[]> {
  const listConvertedDecision: ConvertedDecisionWithMetadonneesDto[] = []

  try {
    normalizationContext.start()
    normalizationContext.setCorrelationId(uuidv4())
    const decisionList = await fetchDecisionListFromS3()
    if (decisionList.length > 0) {
      for (const decisionName of decisionList) {
        const decision = await s3Repository.getDecisionByFilename(decisionName)
        const metadonnees = decision.metadonnees

        logger.log('[NORMALIZATION JOB] Normalization job starting for decision ' + decisionName)

        const idDecision = generateUniqueId(metadonnees)
        logger.log('[NORMALIZATION JOB] Decision ID generated', idDecision)

        const cleanedDecision = removeUnnecessaryCharacters(decisionContent)
        logger.log('[NORMALIZATION JOB] Unnecessary characters removed from decision.', idDecision)

        const convertedDecision = normalizeDatesToIso8601(cleanedDecision)
        logger.log('[NORMALIZATION JOB] Decision dates converted to ISO8601.', idDecision)

        const transformedMetadonnees: Metadonnees = metadonnees
        transformedMetadonnees.idDecision = idDecision
        await decisionMongoRepository.saveDecision(transformedMetadonnees)
        logger.log('[NORMALIZATION JOB] Metadonnees saved in database.', idDecision)

        decision.metadonnees = transformedMetadonnees
        await s3Repository.saveDecisionNormalisee(JSON.stringify(decision), decisionName)
        logger.log('[NORMALIZATION JOB] Metadonnees saved in normalized bucket.', idDecision)

        await s3Repository.deleteDecision(decisionName, bucketNameIntegre)
        logger.log('[NORMALIZATION JOB] Decision deleted in raw bucket.', idDecision)

        logger.log(
          '[NORMALIZATION JOB] End of normalization job for decision ' + decisionName,
          idDecision
        )
        listConvertedDecision.push({
          metadonnees: transformedMetadonnees,
          decisionNormalisee: convertedDecision
        })
      }

      return listConvertedDecision
    } else {
      logger.log('No decisions found to normalize... Exiting now')
      return []
    }
  } catch (error) {
    logger.error(error)
    process.exit(1)
  } finally {
    process.exit()
  }
}

normalizationJob(decisionContent)
