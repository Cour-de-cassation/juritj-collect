import { DecisionTJDTO, LabelStatus } from 'dbsder-api-types'
import { logger } from '../index'
import { codeNACListNotPublic, codeNACListPartiallyPublic } from '../infrastructure/codeNACList'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import { normalizationFormatLogs } from '../index'
import { codeDecisionListTransmissibleToCC } from '../infrastructure/codeDecisionList'

export function computeLabelStatus(decisionDto: DecisionTJDTO): LabelStatus {
  const dateCreation = new Date(decisionDto.dateCreation)
  const dateDecision = new Date(decisionDto.dateDecision)
  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeLabelStatus',
    msg: 'Starting computeLabelStatus...'
  }

  if (isDecisionInTheFuture(dateCreation, dateDecision)) {
    logger.error({
      ...formatLogs,
      msg: 'Incorrect date, dateDecision must be before dateCreation.. Changing LabelStatus to ignored_dateDecisionIncoherente.'
    })
    return LabelStatus.IGNORED_DATE_DECISION_INCOHERENTE
  }

  if (decisionDto.public === false) {
    logger.error({
      ...formatLogs,
      msg: 'Decision is not public, changing LabelStatus to ignored_decisionNonPublique.'
    })

    return LabelStatus.IGNORED_DECISION_NON_PUBLIQUE
  }

  if (isDecisionOlderThanSixMonths(dateCreation, dateDecision)) {
    logger.error({
      ...formatLogs,
      msg: 'Incorrect date, dateDecision must be less than 6 months old. Changing LabelStatus to ignored_dateDecisionIncoherente.'
    })
    return LabelStatus.IGNORED_DATE_DECISION_INCOHERENTE
  }

  // We don't check if NACCode is provided because it is a mandatory field for TJ decisions (but optional for DBSDER API)
  if (isDecisionPartiallyPublic(decisionDto.NACCode)) {
    logger.info({
      ...formatLogs,
      msg: 'Decision can not be treated by Judilibre because NACCode indicates that the decision is partially public, changing LabelStatus to ignored_codeNACdeDecisionPartiellementPublique.'
    })

    return LabelStatus.IGNORED_CODE_NAC_DECISION_PARTIELLEMENT_PUBLIQUE
  }

  if (isDecisionNotPublic(decisionDto.NACCode)) {
    logger.info({
      ...formatLogs,
      msg: 'Decision can not be treated by Judilibre because NACCode indicates that the decision can not be public, changing LabelStatus to ignored_codeNACdeDecisionNonPublique.'
    })

    return LabelStatus.IGNORED_CODE_NAC_DECISION_NON_PUBLIQUE
  }

  if (!isDecisionFromTJTransmissibleToCC(decisionDto.codeDecision)) {
    logger.error({
      ...formatLogs,
      msg: 'Decision can not be treated by Judilibre because NACCode is not in authorized NACCode list, changing LabelStatus to ignored_codeNACnonTransmisCC.'
    })
    return LabelStatus.IGNORED_CODE_NAC_NON_TRANSMIS_CC
  }

  return decisionDto.labelStatus
}

function isDecisionInTheFuture(dateCreation: Date, dateDecision: Date): boolean {
  return dateDecision > dateCreation
}

function isDecisionOlderThanSixMonths(dateCreation: Date, dateDecision: Date): boolean {
  const monthDecision = new Date(dateDecision.getFullYear(), dateDecision.getMonth()).toISOString()
  const sixMonthsBeforeMonthCreation = new Date(
    dateCreation.getFullYear(),
    dateCreation.getMonth() - 6
  ).toISOString()
  return monthDecision < sixMonthsBeforeMonthCreation
}

function isDecisionFromTJTransmissibleToCC(codeNAC: string): boolean {
  return codeDecisionListTransmissibleToCC.includes(codeNAC)
}

function isDecisionNotPublic(codeNAC: string): boolean {
  return codeNACListNotPublic.includes(codeNAC)
}

function isDecisionPartiallyPublic(codeNAC: string): boolean {
  return codeNACListPartiallyPublic.includes(codeNAC)
}
