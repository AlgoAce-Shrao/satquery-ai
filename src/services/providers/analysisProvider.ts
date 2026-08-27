/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analysis Provider Contract
 * Abstraction layer decoupling the agent orchestrator from specific backends
 * (Mock / Client Rule Engine vs. Remote Google Colab PyTorch Server).
 */

import { AnalysisInput } from '../../types/upload';
import { AnalysisResult, ExecutionPipelineStage } from '../../types/geospatial';

export interface AnalysisProvider {
  id: string;
  name: string;
  type: 'MOCK_RULE_ENGINE' | 'COLAB_ML_SERVER';
  isAvailable(): Promise<boolean>;
  execute(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void
  ): Promise<AnalysisResult>;
}
