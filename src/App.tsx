/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/header/Header';
import { Footer } from './components/footer/Footer';
import { CesiumGlobeViewer, VisualizationMode, TelemetryData } from './components/globe/CesiumGlobeViewer';
import { InvestigationStatusHUD } from './components/query/InvestigationStatusHUD';
import { SpatialResultHUD } from './components/results/SpatialResultHUD';
import { TopRankedPanel } from './components/results/TopRankedPanel';
import { WorldMinimap } from './components/results/WorldMinimap';
import { GlobeLayerControls } from './components/globe/GlobeLayerControls';
import { TourControls } from './components/results/TourControls';
import { EvidenceDrawer } from './components/results/EvidenceDrawer';
import { QueryModal } from './components/query/QueryModal';
import { EvidenceModal } from './components/results/EvidenceModal';
import { TemporalComparisonViewer } from './components/results/TemporalComparisonViewer';
import { MultimodalViewer } from './components/results/MultimodalViewer';
import { ErrorBanner } from './components/query/ErrorBanner';
import { UploadWizardModal } from './components/upload/UploadWizardModal';
import { ActiveInputBanner } from './components/upload/ActiveInputBanner';
import { InteractiveImageCanvas } from './components/upload/InteractiveImageCanvas';
import { LandingPage } from './components/landing/LandingPage';
import { QueryApiClient } from './services/api/queryApiClient';
import { queryEngine } from './services/queryEngine';
import { observationRegistry } from './services/observationRegistry';
import { satQueryOrchestrator } from './services/satQueryOrchestrator';
import { QueryExecutionState, AnalysisResult, ExecutionPipelineStage } from './types/geospatial';
import { ObservationFilter } from './types/observation';
import { AnalysisInput } from './types/upload';
import { Search, Layers, FileText, Settings, Compass, BarChart2 } from 'lucide-react';

const INITIAL_QUERY = 'Globally, find the 10 regions that experienced the largest decrease in vegetation over the last year and automatically tour through them from highest to lowest severity.';

export default function App() {
  const [currentView, setCurrentView] = useState<'LANDING' | 'APP'>('LANDING');

  const [executionState, setExecutionState] = useState<QueryExecutionState>(() =>
    queryEngine.createInitialState(INITIAL_QUERY)
  );

  const [activeAnalysisInput, setActiveAnalysisInput] = useState<AnalysisInput | null>(null);

  const [currentFilter, setCurrentFilter] = useState<ObservationFilter>({
    category: 'ALL',
    severity: 'ALL',
    modality: 'ALL',
    dataStatus: 'ALL',
  });

  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('DIFFERENCE');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [showSatelliteImagery, setShowSatelliteImagery] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isHUDVisible, setIsHUDVisible] = useState(true);

  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isTemporalComparisonOpen, setIsTemporalComparisonOpen] = useState(false);
  const [isMultimodalViewerOpen, setIsMultimodalViewerOpen] = useState(false);
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState(false);
  const [isPixelCanvasOpen, setIsPixelCanvasOpen] = useState(false);

  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryData>({
    lat: -10.83,
    lon: -55.86,
    altitudeKm: 1650,
    heading: 0,
    pitch: -55,
  });

  const tourTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeQueryTokenRef = useRef<number>(0);

  const runQuery = async (queryText: string) => {
    const token = ++activeQueryTokenRef.current;

    if (tourTimerRef.current) {
      clearInterval(tourTimerRef.current);
      tourTimerRef.current = null;
    }

    // If an active user input is loaded, route query through SatQueryOrchestrator
    if (activeAnalysisInput) {
      handleLaunchUploadedAnalysis(activeAnalysisInput, queryText);
      return;
    }

    const initialState = queryEngine.createInitialState(queryText);
    setExecutionState({
      ...initialState,
      status: 'PROCESSING',
      rawQuery: queryText,
      systemMessage: 'Submitting query to the analysis service...',
    });
    setIsHUDVisible(true);

    try {
      const response = await QueryApiClient.executeQuery(queryText, (update) => {
        if (activeQueryTokenRef.current === token) {
          setExecutionState((prev) => ({
            ...prev,
            ...update,
          }));
        }
      });

      // A newer query has since been submitted — discard this now-stale response.
      if (activeQueryTokenRef.current !== token) return;

      const results = response.results;
      const observationId = results[0]
        ? `${results[0].siteCode.replace('SITE_', '')}-${results[0].observationPeriod.afterDate}`
        : `SAT-${new Date().toISOString().slice(0, 10)}`;

      setExecutionState({
        ...initialState,
        queryId: response.queryId || initialState.queryId,
        rawQuery: response.rawQuery || queryText,
        structuredQuery: response.structuredQuery || initialState.structuredQuery,
        status: 'COMPLETED',
        currentStepIndex: initialState.steps.length - 1,
        results,
        activeResultIndex: 0,
        isTourActive: Boolean(response.visualization?.autoNavigate && results.length > 1),
        observationId,
        filterCount: results.length,
        systemMessage: results.length > 0
          ? `Identified ${results.length} matching observations. Flying to ${results[0].regionName}.`
          : 'The analysis service completed the query but found no matching observations.',
      });
      setIsHUDVisible(true);
    } catch (err: any) {
      if (activeQueryTokenRef.current !== token) return;
      setExecutionState({
        ...initialState,
        status: 'ERROR',
        systemMessage: `Query failed: ${err.message || 'Unable to reach the analysis service.'}`,
      });
    }
  };

  /**
   * Dispatches analysis of an uploaded input through SatQueryOrchestrator
   */
  const handleLaunchUploadedAnalysis = async (input: AnalysisInput, prompt: string) => {
    if (tourTimerRef.current) {
      clearInterval(tourTimerRef.current);
      tourTimerRef.current = null;
    }

    setActiveAnalysisInput(input);
    const plan = satQueryOrchestrator.planWorkflow(input, prompt);

    setExecutionState({
      status: 'PROCESSING',
      rawQuery: prompt,
      category: 'ALL',
      steps: plan.stages,
      currentStepIndex: 0,
      results: [],
      activeResultIndex: 0,
      filterCount: 1,
      observationId: `INGEST-${input.images.primary.fileName.slice(0, 8).toUpperCase()}`,
      systemMessage: `Initiating agentic analysis pipeline: ${plan.recommendedWorkflow}...`,
      isTourActive: false,
    });
    setIsHUDVisible(true);

    try {
      const result = await satQueryOrchestrator.executeAnalysis(
        input,
        prompt,
        (stage: ExecutionPipelineStage) => {
          setExecutionState((prev) => {
            const stepIndex = prev.steps.findIndex((s) => s.stage === stage.stage);
            return {
              ...prev,
              currentStepIndex: stepIndex >= 0 ? stepIndex : prev.currentStepIndex + 1,
              systemMessage: `Processing: ${stage.title} - ${stage.description}`,
            };
          });
        }
      );

      setExecutionState({
        status: 'COMPLETED',
        rawQuery: prompt,
        category: result.category || 'ALL',
        steps: plan.stages,
        currentStepIndex: plan.stages.length - 1,
        results: [result],
        activeResultIndex: 0,
        filterCount: 1,
        observationId: result.siteCode || 'INGEST-RESULT',
        systemMessage: `Analysis complete: ${result.headline} (${result.confidence * 100}% confidence)`,
        isTourActive: false,
      });

      // Auto-open appropriate modality viewer if relevant
      if (input.mode === 'BI_TEMPORAL' && result.temporalComparison) {
        setIsTemporalComparisonOpen(true);
      } else if (input.mode === 'OPTICAL_SAR' && result.multimodalData) {
        setIsMultimodalViewerOpen(true);
      }
    } catch (err: any) {
      setExecutionState((prev) => ({
        ...prev,
        status: 'ERROR',
        systemMessage: `Analysis failed: ${err.message || 'Unknown execution error'}`,
      }));
    }
  };

  const handleClearActiveInput = () => {
    setActiveAnalysisInput(null);
    runQuery(INITIAL_QUERY);
  };

  const handleFilterChange = (newFilter: ObservationFilter) => {
    setCurrentFilter(newFilter);
    const filteredResults = observationRegistry.getAnalysisResults(newFilter);

    if (tourTimerRef.current) {
      clearInterval(tourTimerRef.current);
      tourTimerRef.current = null;
    }

    setExecutionState((prev) => ({
      ...prev,
      results: filteredResults,
      activeResultIndex: 0,
      filterCount: filteredResults.length,
      observationId: filteredResults[0]
        ? `${filteredResults[0].siteCode.replace('SITE_', '')}-${filteredResults[0].observationPeriod.afterDate}`
        : 'FILTERED-QUERY',
      systemMessage: `Applied filter: Found ${filteredResults.length} observations in registry.`,
      isTourActive: false,
    }));
    setIsHUDVisible(true);
  };

  // Pause tour when user manually drags, rotates, or interacts with the globe
  const handleUserInteract = useCallback(() => {
    if (executionState.isTourActive) {
      setExecutionState((prev) => ({
        ...prev,
        isTourActive: false,
      }));
    }
  }, [executionState.isTourActive]);

  // Automated Tour Timer Loop
  useEffect(() => {
    if (executionState.isTourActive && executionState.results.length > 1) {
      if (tourTimerRef.current) clearInterval(tourTimerRef.current);

      tourTimerRef.current = setInterval(() => {
        setExecutionState((prev) => {
          if (!prev.isTourActive || prev.results.length === 0) return prev;
          const nextIndex = (prev.activeResultIndex + 1) % prev.results.length;
          return {
            ...prev,
            activeResultIndex: nextIndex,
            observationId: `${prev.results[nextIndex].siteCode.replace('SITE_', '')}-${prev.results[nextIndex].observationPeriod.afterDate}`,
          };
        });
      }, 7500);
    } else {
      if (tourTimerRef.current) {
        clearInterval(tourTimerRef.current);
        tourTimerRef.current = null;
      }
    }

    return () => {
      if (tourTimerRef.current) clearInterval(tourTimerRef.current);
    };
  }, [executionState.isTourActive, executionState.results.length]);

  // Tour Control Actions
  const handleToggleTour = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      isTourActive: !prev.isTourActive,
    }));
  }, []);

  const handleSelectResultIndex = useCallback((index: number) => {
    setIsHUDVisible(true);
    setExecutionState((prev) => {
      if (index < 0 || index >= prev.results.length) return prev;
      return {
        ...prev,
        activeResultIndex: index,
        observationId: `${prev.results[index].siteCode.replace('SITE_', '')}-${prev.results[index].observationPeriod.afterDate}`,
      };
    });
  }, []);

  const handlePreviousSite = useCallback(() => {
    setIsHUDVisible(true);
    setExecutionState((prev) => {
      if (prev.results.length === 0) return prev;
      const prevIndex = (prev.activeResultIndex - 1 + prev.results.length) % prev.results.length;
      return {
        ...prev,
        activeResultIndex: prevIndex,
        observationId: `${prev.results[prevIndex].siteCode.replace('SITE_', '')}-${prev.results[prevIndex].observationPeriod.afterDate}`,
      };
    });
  }, []);

  const handleNextSite = useCallback(() => {
    setIsHUDVisible(true);
    setExecutionState((prev) => {
      if (prev.results.length === 0) return prev;
      const nextIndex = (prev.activeResultIndex + 1) % prev.results.length;
      return {
        ...prev,
        activeResultIndex: nextIndex,
        observationId: `${prev.results[nextIndex].siteCode.replace('SITE_', '')}-${prev.results[nextIndex].observationPeriod.afterDate}`,
      };
    });
  }, []);

  // Keyboard Shortcuts (Space for Tour, Arrows for Next/Prev, Cmd+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQueryModalOpen((prev) => !prev);
      } else if (e.key === ' ' && !isQueryModalOpen && !isEvidenceModalOpen) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleToggleTour();
        }
      } else if (e.key === 'ArrowRight' && !isQueryModalOpen && !isEvidenceModalOpen) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          handleNextSite();
        }
      } else if (e.key === 'ArrowLeft' && !isQueryModalOpen && !isEvidenceModalOpen) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          handlePreviousSite();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleTour, handleNextSite, handlePreviousSite, isQueryModalOpen, isEvidenceModalOpen]);

  const handleLaunchMissionControl = (initialQuery?: string) => {
    const targetQuery = initialQuery && initialQuery.trim() ? initialQuery.trim() : INITIAL_QUERY;
    setCurrentView('APP');
    runQuery(targetQuery);
  };

  const handleOpenUploadFromLanding = () => {
    setCurrentView('APP');
    setIsUploadWizardOpen(true);
  };

  const handleReturnToLanding = () => {
    setCurrentView('LANDING');
  };

  const activeResult: AnalysisResult | null =
    executionState.results[executionState.activeResultIndex] || null;

  const totalRegistryCount = observationRegistry.getAllObservations().length;

  if (currentView === 'LANDING') {
    return (
      <LandingPage
        onLaunchMissionControl={handleLaunchMissionControl}
        onOpenUploadWizard={handleOpenUploadFromLanding}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050506] text-white font-sans overflow-hidden flex flex-col p-0 md:p-1.5 lg:p-2">
      {/* Outer Mission-Control Frame */}
      <div className="flex-1 flex flex-col bg-[#050506] border-0 md:border-2 lg:border-4 border-[#18181f] overflow-hidden shadow-2xl relative">
        {/* Top Header with Embedded Query Bar and Filter Controls */}
        <Header
          observationId={executionState.observationId}
          currentQuery={executionState.rawQuery}
          isProcessing={executionState.status === 'PROCESSING'}
          onOpenQueryModal={() => setIsQueryModalOpen(true)}
          onOpenImageUpload={() => setIsUploadWizardOpen(true)}
          onNavigateToLanding={handleReturnToLanding}
          onSubmitQuery={(q) => runQuery(q)}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          totalRegistryCount={totalRegistryCount}
          filteredCount={executionState.results.length}
        />

        {/* Phase 3: Active Analysis Ingestion Context Banner */}
        <ActiveInputBanner
          activeInput={activeAnalysisInput}
          onOpenWizard={() => setIsUploadWizardOpen(true)}
          onOpenPixelInspector={() => setIsPixelCanvasOpen(true)}
          onClearInput={handleClearActiveInput}
        />

        {/* Central Workspace: 3D Earth Dominates the Screen */}
        <main className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Left Vertical Quick Access Toolbar */}
          <div className="absolute top-20 left-2 z-20 hidden xl:flex flex-col items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 border border-white/15">
            <button
              onClick={() => setIsQueryModalOpen(true)}
              title="Query Prompts (⌘K)"
              className="p-2 text-white/60 hover:text-[#3df2ff] hover:bg-white/10 transition-all"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsHUDVisible((prev) => !prev)}
              title="Toggle Result HUD"
              className={`p-2 transition-all ${
                isHUDVisible
                  ? 'text-[#3df2ff] bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsTemporalComparisonOpen(true)}
              title="Bi-Temporal Split Comparison"
              className="p-2 text-white/60 hover:text-[#ff4e00] hover:bg-white/10 transition-all"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMultimodalViewerOpen(true)}
              title="Multimodal Optical + SAR Fusion"
              className="p-2 text-white/60 hover:text-[#0284c7] hover:bg-white/10 transition-all"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEvidenceDrawerOpen((prev) => !prev)}
              title="Evidence & Spectra"
              className={`p-2 transition-all ${
                isEvidenceDrawerOpen
                  ? 'text-[#3df2ff] bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>

          {/* 3D Cesium Earth Engine Viewport */}
          <CesiumGlobeViewer
            activeResult={activeResult}
            allResults={executionState.results}
            isTourActive={executionState.isTourActive}
            visualizationMode={visualizationMode}
            overlayOpacity={overlayOpacity}
            showSatelliteImagery={showSatelliteImagery}
            showTerrain={showTerrain}
            showBorders={showBorders}
            showMarkers={showMarkers}
            onSelectResult={handleSelectResultIndex}
            onUserInteract={handleUserInteract}
            onTelemetryChange={setLiveTelemetry}
          />

          {/* AI Investigation Status HUD during Query Processing */}
          {executionState.status === 'PROCESSING' && (
            <InvestigationStatusHUD
              query={executionState.rawQuery}
              steps={executionState.steps}
              currentStepIndex={executionState.currentStepIndex}
            />
          )}

          {/* Error Banner: surfaces backend/CORS/analysis failures instead of failing silently */}
          {executionState.status === 'ERROR' && (
            <ErrorBanner
              message={executionState.systemMessage}
              onDismiss={() => setExecutionState((prev) => ({ ...prev, status: 'IDLE' }))}
            />
          )}

          {/* Spatial Floating Result Card (Active Insight) */}
          {executionState.status === 'COMPLETED' && activeResult && isHUDVisible && (
            <SpatialResultHUD
              activeResult={activeResult}
              currentIndex={executionState.activeResultIndex}
              totalCount={executionState.results.length}
              onOpenEvidence={() => setIsEvidenceDrawerOpen(true)}
              onOpenTemporalComparison={() => setIsTemporalComparisonOpen(true)}
              onOpenMultimodalViewer={() => setIsMultimodalViewerOpen(true)}
              onPrevious={handlePreviousSite}
              onNext={handleNextSite}
              onClose={() => setIsHUDVisible(false)}
            />
          )}

          {/* Top Right Ranked Regions List Panel */}
          {executionState.status === 'COMPLETED' && executionState.results.length > 0 && (
            <TopRankedPanel
              results={executionState.results}
              currentIndex={executionState.activeResultIndex}
              onSelectIndex={handleSelectResultIndex}
            />
          )}

          {/* Bottom Left Globe Layer Controls */}
          {executionState.status === 'COMPLETED' && (
            <GlobeLayerControls
              mode={visualizationMode}
              opacity={overlayOpacity}
              showSatelliteImagery={showSatelliteImagery}
              showTerrain={showTerrain}
              showBorders={showBorders}
              showMarkers={showMarkers}
              onModeChange={setVisualizationMode}
              onOpacityChange={setOverlayOpacity}
              onToggleSatelliteImagery={() => setShowSatelliteImagery((prev) => !prev)}
              onToggleTerrain={() => setShowTerrain((prev) => !prev)}
              onToggleBorders={() => setShowBorders((prev) => !prev)}
              onToggleMarkers={() => setShowMarkers((prev) => !prev)}
            />
          )}

          {/* Bottom Right World Overview Minimap */}
          {executionState.status === 'COMPLETED' && executionState.results.length > 0 && (
            <WorldMinimap
              results={executionState.results}
              activeResult={activeResult}
              telemetry={liveTelemetry}
              onSelectIndex={handleSelectResultIndex}
            />
          )}

          {/* Tour Controls (Previous, Pause/Resume, Next) */}
          {executionState.status === 'COMPLETED' && executionState.results.length > 0 && (
            <TourControls
              results={executionState.results}
              currentIndex={executionState.activeResultIndex}
              isTourActive={executionState.isTourActive}
              onSelectIndex={handleSelectResultIndex}
              onToggleTour={handleToggleTour}
              onPrevious={handlePreviousSite}
              onNext={handleNextSite}
            />
          )}

          {/* Slide-out Evidence & Spectral Bands Drawer */}
          <EvidenceDrawer
            isOpen={isEvidenceDrawerOpen}
            activeResult={activeResult}
            onClose={() => setIsEvidenceDrawerOpen(false)}
            onOpenEvidenceModal={() => setIsEvidenceModalOpen(true)}
          />
        </main>

        {/* Modals & Fullscreen Overlays */}
        <QueryModal
          isOpen={isQueryModalOpen}
          currentQuery={executionState.rawQuery}
          onClose={() => setIsQueryModalOpen(false)}
          onSubmitQuery={(q) => runQuery(q)}
        />

        <EvidenceModal
          isOpen={isEvidenceModalOpen}
          activeResult={activeResult}
          onClose={() => setIsEvidenceModalOpen(false)}
        />

        {/* Phase 2: Interactive Bi-Temporal Comparison Split Slider */}
        {activeResult && (
          <TemporalComparisonViewer
            isOpen={isTemporalComparisonOpen}
            activeResult={activeResult}
            onClose={() => setIsTemporalComparisonOpen(false)}
          />
        )}

        {/* Phase 2: Interactive Multimodal Optical + SAR Fusion Viewer */}
        {activeResult && (
          <MultimodalViewer
            isOpen={isMultimodalViewerOpen}
            activeResult={activeResult}
            onClose={() => setIsMultimodalViewerOpen(false)}
          />
        )}

        {/* Phase 3: Intelligent Satellite Image Ingestion & Workflow Routing */}
        <UploadWizardModal
          isOpen={isUploadWizardOpen}
          onClose={() => setIsUploadWizardOpen(false)}
          onLaunchAnalysis={(input, prompt) => {
            handleLaunchUploadedAnalysis(input, prompt);
          }}
        />

        {/* Phase 3: Interactive Zoom & Pan Pixel Evidence Canvas */}
        {activeAnalysisInput && (
          <InteractiveImageCanvas
            isOpen={isPixelCanvasOpen}
            onClose={() => setIsPixelCanvasOpen(false)}
            image={activeAnalysisInput.images.primary}
            analysisResult={activeResult}
          />
        )}

        {/* Bottom Status Footer */}
        <Footer systemMessage={executionState.systemMessage} status={executionState.status} />
      </div>
    </div>
  );
}
