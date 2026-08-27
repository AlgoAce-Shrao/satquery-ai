/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { MinimalHeader } from './MinimalHeader';
import { CinematicScrollCanvas } from './CinematicScrollCanvas';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { SolutionSection } from './SolutionSection';
import { AgentWorkflowSection } from './AgentWorkflowSection';
import { EarthResponseSection } from './EarthResponseSection';
import { ApplicationsSection } from './ApplicationsSection';
import { FutureVisionSection } from './FutureVisionSection';
import { CinematicCTA } from './CinematicCTA';

interface LandingPageProps {
  onLaunchMissionControl?: (query?: string) => void;
  onLaunchApp?: () => void;
  onLaunchWithQuery?: (query: string) => void;
  onOpenUploadWizard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchMissionControl,
  onLaunchApp,
  onLaunchWithQuery,
  onOpenUploadWizard,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);

  const handleLaunch = () => {
    if (onLaunchMissionControl) {
      onLaunchMissionControl();
    } else if (onLaunchApp) {
      onLaunchApp();
    }
  };

  const handleQuery = (queryText: string) => {
    if (onLaunchMissionControl) {
      onLaunchMissionControl(queryText);
    } else if (onLaunchWithQuery) {
      onLaunchWithQuery(queryText);
    } else {
      handleLaunch();
    }
  };

  const handleScrollDown = () => {
    if (problemRef.current) {
      problemRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroller
    let lenis: Lenis | null = null;
    let rafId: number;

    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      const onScroll = (e: { progress: number }) => {
        setScrollProgress(Math.max(0, Math.min(1, e.progress)));
      };

      lenis.on('scroll', onScroll);

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis initialization skipped, falling back to native scroll:', e);
    }

    // 2. Native Scroll Listener Fallback / Redundancy
    const handleNativeScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.max(0, Math.min(1, window.scrollY / totalHeight));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    handleNativeScroll();

    return () => {
      window.removeEventListener('scroll', handleNativeScroll);
      if (lenis) {
        lenis.destroy();
      }
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#080907] text-[#E8E4D8] selection:bg-[#C88A45] selection:text-black overflow-x-hidden"
    >
      {/* 1. Top Minimal Sticky Header */}
      <MinimalHeader onLaunchApp={handleLaunch} onAboutClick={handleScrollDown} />

      {/* 2. Persistent 3D WebGL Earth, Space, and Satellite Spine */}
      <CinematicScrollCanvas scrollProgress={scrollProgress} />

      {/* 3. Chapter 0: Hero Section (Wide Orbital Framing) */}
      <HeroSection onLaunchApp={handleLaunch} onScrollDown={handleScrollDown} />

      {/* 4. Chapter 1: The Problem Section (Spacecraft Approach & Analyst Telemetry) */}
      <div ref={problemRef}>
        <ProblemSection />
      </div>

      {/* 5. Chapter 2: Natural Language Query Solution */}
      <SolutionSection
        onLaunchWithQuery={handleQuery}
        onLaunchApp={handleLaunch}
      />

      {/* 6. Chapter 3: Multi-Agent Intelligence Architecture */}
      <AgentWorkflowSection />

      {/* 7. Chapter 4: Visual Evidence & Remote-Sensing Response */}
      <EarthResponseSection />

      {/* 8. Chapter 5: One Intelligence, Many Earth Problems (6 Application Domains) */}
      <ApplicationsSection onSelectApplication={handleQuery} />

      {/* 9. Chapter 6: The Future of Conversational Earth Exploration */}
      <FutureVisionSection />

      {/* 10. Chapter 7: Final Orbital Sunrise Call to Action */}
      <CinematicCTA onLaunchApp={handleLaunch} />
    </div>
  );
};
