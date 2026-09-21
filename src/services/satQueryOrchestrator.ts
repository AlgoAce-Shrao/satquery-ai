/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SatQuery Agentic Orchestrator
 * Coordinates the full remote-sensing intelligence pipeline:
 * Input Validation → Intent Classification → Specialist Tool Selection →
 * Provider Execution → Spatial Evidence Extraction → AnalysisResult Compilation.
 */

import {
  AnalysisInput,
  WorkflowExecutionPlan,
  SpecialistToolDefinition,
} from '../types/upload';
import { AnalysisResult, ExecutionPipelineStage } from '../types/geospatial';
import { ToolRegistry } from './tools/toolRegistry';
import { AnalysisProvider } from './providers/analysisProvider';
import { MockAnalysisProvider } from './providers/mockAnalysisProvider';
import { ColabMLAnalysisProvider } from './providers/colabMLAnalysisProvider';
import { RealAnalysisProvider } from './providers/realAnalysisProvider';

export class SatQueryOrchestrator {
  private static instance: SatQueryOrchestrator;
  private currentProvider: AnalysisProvider;
  private colabProvider: ColabMLAnalysisProvider;
  private realProvider: RealAnalysisProvider;
  private mockProvider: MockAnalysisProvider;
  private hasConfiguredRemoteProvider: boolean;
  private hasConfiguredGateway: boolean;

  private constructor() {
    const configuredEndpoint =
      (import.meta as any).env?.VITE_COLAB_INFERENCE_URL ||
      (import.meta as any).env?.VITE_COLAB_ML_SERVER_URL;
    const gatewayUrl = (import.meta as any).env?.VITE_SPRING_BOOT_API_URL;
    this.mockProvider = new MockAnalysisProvider();
    this.colabProvider = new ColabMLAnalysisProvider(configuredEndpoint);
    this.realProvider = new RealAnalysisProvider(gatewayUrl);
    this.hasConfiguredRemoteProvider = Boolean(configuredEndpoint);
    this.hasConfiguredGateway = Boolean(gatewayUrl);
    // Preference order: the already-deployed gateway (real pixel analysis, no extra
    // infra to stand up) > an explicitly configured external Colab/GPU endpoint > mock.
    this.currentProvider = this.hasConfiguredGateway
      ? this.realProvider
      : this.hasConfiguredRemoteProvider
      ? this.colabProvider
      : this.mockProvider;
  }

  public static getInstance(): SatQueryOrchestrator {
    if (!SatQueryOrchestrator.instance) {
      SatQueryOrchestrator.instance = new SatQueryOrchestrator();
    }
    return SatQueryOrchestrator.instance;
  }

  public getActiveProvider(): AnalysisProvider {
    return this.currentProvider;
  }

  public setProvider(type: 'MOCK' | 'COLAB' | 'REAL', customUrl?: string) {
    if (type === 'COLAB') {
      if (customUrl) {
        this.colabProvider.setEndpointUrl(customUrl);
        this.hasConfiguredRemoteProvider = true;
      }
      this.currentProvider = this.colabProvider;
    } else if (type === 'REAL') {
      this.currentProvider = this.realProvider;
    } else {
      this.currentProvider = this.mockProvider;
    }
  }

  /**
   * Plans the agentic workflow by inspecting inputs, query intent, and tool readiness.
   */
  public planWorkflow(input: AnalysisInput, query: string): WorkflowExecutionPlan {
    const classifiedIntent = this.classifyIntent(input, query);
    const selectedTools = ToolRegistry.selectToolsForTask(classifiedIntent, input.mode);
    const recommendedWorkflow = this.getWorkflowName(classifiedIntent, input.mode);

    const stages: ExecutionPipelineStage[] = [
      {
        id: 'stg_init',
        stage: 'QUERY_RECEIVED',
        title: 'Query & Input Ingestion',
        description: `Ingested ${input.mode} observation payload.`,
      },
      {
        id: 'stg_val',
        stage: 'INPUT_VALIDATED',
        title: 'Input Compatibility Verification',
        description: input.validationReport.summary,
      },
      {
        id: 'stg_route',
        stage: 'TASK_IDENTIFIED',
        title: 'Agentic Task Routing',
        description: `Routed to ${recommendedWorkflow} pipeline.`,
      },
      {
        id: 'stg_dispatch',
        stage: 'SPECIALIST_TOOL_SELECTED',
        title: 'Specialist Model Execution',
        description: `Executing [${selectedTools.map((t) => t.name).join(', ')}]`,
      },
      {
        id: 'stg_analysis',
        stage: 'REMOTE_SENSING_ANALYSIS',
        title: 'Feature & Index Computation',
        description: 'Analyzing spectral reflectance, temporal deltas & textural signatures.',
      },
      {
        id: 'stg_spatial',
        stage: 'SPATIAL_EVIDENCE_EXTRACTED',
        title: 'Spatial Footprint Extraction',
        description: 'Localizing polygon coordinates and calculating affected hectare metrics.',
      },
      {
        id: 'stg_synth',
        stage: 'INSIGHT_GENERATED',
        title: 'Intelligence Synthesis',
        description: 'Compiling structured observations, severity scores and evidence cards.',
      },
    ];

    return {
      planId: `PLAN_${Date.now()}`,
      classifiedIntent,
      recommendedWorkflow,
      selectedTools,
      stages,
      // Heuristic: routing confidence, not an analysis-result confidence. Higher when
      // validation passed cleanly and a specialist tool was actually matched to the task.
      confidenceScore:
        (input.validationReport.canExecuteAnalysis ? 0.7 : 0.4) + Math.min(selectedTools.length, 2) * 0.1,
      reasoningNotes: [
        `Input mode [${input.mode}] matched with [${selectedTools.length}] specialist tools.`,
        `Intent [${classifiedIntent}] prioritized based on linguistic indicators in prompt.`,
      ],
    };
  }

  /**
   * Executes the full orchestrated intelligence workflow for an uploaded input.
   */
  public async executeAnalysis(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void
  ): Promise<AnalysisResult> {
    // Preference order: real gateway raster analysis > configured Colab endpoint > mock.
    // A demo must always produce a result — mock output is honestly labeled DEMO_DATA
    // (see mockAnalysisProvider.ts / dataStatusLabels.ts) rather than silently pretending
    // to be real, so falling back to it is truthful, not a fabrication.
    let activeProvider = this.currentProvider;

    if (activeProvider.type === 'REAL_RASTER_ENGINE') {
      const isLive = await activeProvider.isAvailable();
      if (!isLive) {
        console.warn('Gateway raster-analysis endpoint unreachable. Falling back to Colab (if configured) or mock.');
        activeProvider = this.hasConfiguredRemoteProvider ? this.colabProvider : this.mockProvider;
      }
    }

    if (activeProvider.type === 'COLAB_ML_SERVER') {
      const isLive = await activeProvider.isAvailable();
      if (!isLive) {
        console.warn('Colab ML server unreachable. Falling back to SatQuery Rule Engine (demo data).');
        activeProvider = this.mockProvider;
      }
    }

    // 2. Execute through provider — if even a provider that just passed its own
    // availability check fails mid-request (network blip, cold-start race, malformed
    // response), fall back to mock rather than surfacing a dead-end error during a demo.
    const intent = this.classifyIntent(input, query);
    try {
      return await activeProvider.execute(input, query, onProgressStage, intent);
    } catch (error) {
      if (activeProvider.type === 'MOCK_RULE_ENGINE') {
        throw error; // mock itself failing is a real bug, not a reachability issue — don't mask it
      }
      console.warn(`${activeProvider.name} execution failed (${error}). Falling back to SatQuery Rule Engine (demo data).`);
      return await this.mockProvider.execute(input, query, onProgressStage, intent);
    }
  }

  public classifyIntent(input: AnalysisInput, query: string): string {
    const q = query.toLowerCase();
    const mode = input.mode;

    if (mode === 'OPTICAL_SAR' || (q.includes('optical') && q.includes('sar'))) {
      return 'MULTIMODAL_ANALYSIS';
    }

    if (
      q.includes('highlight') ||
      q.includes('grounding') ||
      q.includes('where is') ||
      q.includes('water body') ||
      q.includes('outline')
    ) {
      return 'REGION_GROUNDING';
    }

    if (
      mode === 'BI_TEMPORAL' ||
      q.includes('what changed') ||
      q.includes('change between') ||
      q.includes('expansion') ||
      q.includes('loss') ||
      q.includes('decrease') ||
      q.includes('increase')
    ) {
      if (q.includes('vegetation') || q.includes('forest') || q.includes('canopy')) {
        return 'VEGETATION_CHANGE';
      }
      if (q.includes('urban') || q.includes('built-up') || q.includes('building')) {
        return 'URBAN_CHANGE';
      }
      if (q.includes('flood') || q.includes('water') || q.includes('inundation')) {
        return 'FLOOD_ANALYSIS';
      }
      return 'CHANGE_DETECTION';
    }

    if (q.includes('describe') || q.includes('land cover') || q.includes('land-cover') || q.includes('classify')) {
      return 'LAND_COVER_ANALYSIS';
    }

    return 'VISUAL_QUESTION_ANSWERING';
  }

  private getWorkflowName(intent: string, mode: string): string {
    switch (intent) {
      case 'MULTIMODAL_ANALYSIS':
        return 'Optical + SAR Cross-Modal Fusion';
      case 'REGION_GROUNDING':
        return 'Text-Guided Spatial Grounding';
      case 'VEGETATION_CHANGE':
        return 'Bi-Temporal Canopy Loss & Vegetation Delta';
      case 'URBAN_CHANGE':
        return 'Bi-Temporal Urban Expansion Delineation';
      case 'FLOOD_ANALYSIS':
        return 'Hydro-Inundation & Flood Extent Mapping';
      case 'CHANGE_DETECTION':
        return 'Bi-Temporal Radiometric Difference Analysis';
      case 'LAND_COVER_ANALYSIS':
        return 'Multi-Spectral Land-Cover Partitioning';
      default:
        return 'Remote-Sensing Scene Question Answering';
    }
  }
}

export const satQueryOrchestrator = SatQueryOrchestrator.getInstance();
