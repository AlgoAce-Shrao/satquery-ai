/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Colab PyTorch ML Server Adapter
 * Connects the SatQuery AI Agentic Orchestrator to an external high-performance
 * PyTorch vision backend running on Google Colab or Cloud Run GPU instances.
 */

import { AnalysisProvider } from './analysisProvider';
import { AnalysisInput, ColabAnalyzeRequest, ColabAnalyzeResponse } from '../../types/upload';
import { AnalysisResult, ExecutionPipelineStage } from '../../types/geospatial';

export class ColabMLAnalysisProvider implements AnalysisProvider {
  public id = 'colab_ml_server';
  public name = 'Google Colab PyTorch Vision-Language Model Engine';
  public type: 'COLAB_ML_SERVER' = 'COLAB_ML_SERVER';

  private endpointUrl: string;

  constructor(endpointUrl?: string) {
    this.endpointUrl =
      endpointUrl ||
      (import.meta as any).env?.VITE_COLAB_ML_SERVER_URL ||
      'http://localhost:8000';
  }

  public setEndpointUrl(url: string) {
    this.endpointUrl = url;
  }

  public getEndpointUrl(): string {
    return this.endpointUrl;
  }

  /**
   * Health check to determine if the Colab backend is live.
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpointUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Dispatches the image upload and natural language query payload to the Colab ML server.
   */
  public async execute(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void
  ): Promise<AnalysisResult> {
    const primary = input.images.primary;
    const secondary = input.images.secondary;

    const payload: ColabAnalyzeRequest = {
      query,
      task: input.validationReport.canExecuteAnalysis ? 'AUTO_DETECT' : 'GENERIC_VQA',
      inputMode: input.mode,
      images: {
        primary: {
          fileName: primary.fileName,
          modality: primary.modality,
          url: primary.previewUrl,
          metadata: primary.geospatialInfo,
        },
        secondary: secondary
          ? {
              fileName: secondary.fileName,
              modality: secondary.modality,
              url: secondary.previewUrl,
              metadata: secondary.geospatialInfo,
            }
          : undefined,
      },
      options: {
        confidenceThreshold: 0.75,
        returnHeatmaps: true,
        delineateMasks: true,
      },
    };

    if (onProgressStage) {
      onProgressStage({
        id: 'stg_colab_dispatch',
        stage: 'REMOTE_SENSING_ANALYSIS',
        title: 'Dispatching to Colab GPU Instance',
        description: `Sending multi-band tensors to ${this.endpointUrl}/api/v1/analyze`,
        durationMs: 800,
        outputSummary: 'Awaiting model inference response...',
      });
    }

    const response = await fetch(`${this.endpointUrl}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Colab ML backend responded with status: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ColabAnalyzeResponse;
    return data.analysisResult;
  }
}
