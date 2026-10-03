'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Sparkles, Activity, ShieldCheck, Microscope } from 'lucide-react';

export function TopLabVideoBanner() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFullModal, setShowFullModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* ─── Top High-Tech Laboratory Animation & Video Showcase ─── */}
      <div className="relative bg-slate-950 text-white overflow-hidden border-b border-cyan-900/40">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/80 via-slate-950 to-cyan-950/80 pointer-events-none" />
        <div className="absolute -top-24 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Live status ticker */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-semibold text-[11px] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block -ml-3.5" />
                LIVE LAB AUTOMATION
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
                <ShieldCheck size={14} className="text-cyan-400" />
                NABL Accredited & ISO 15189 Certified Reference Laboratory
              </span>
            </div>

            {/* Center/Right: Video Controls & Quick Stats */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <Activity size={13} className="text-emerald-400" />
                  TAT: <strong className="text-white">3.4 hrs</strong>
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  Precision: <strong className="text-white">99.98%</strong>
                </span>
              </div>

              {/* Video Player Action Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 rounded-full px-2 py-0.5">
                <button
                  onClick={togglePlay}
                  className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause Lab Animation' : 'Play Lab Animation'}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <button
                  onClick={() => setShowFullModal(true)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer border-l border-slate-700 ml-1"
                >
                  <Microscope size={12} />
                  <span>Lab Tour (4K)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Compact Animated Laboratory Video Stream ─── */}
        <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-slate-900 border-t border-slate-800">
          {/* Animated clinical laboratory canvas/video simulation */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover opacity-60 filter contrast-125 saturate-150"
            poster="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80"
          >
            {/* High reliability medical lab video stream */}
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              type="video/mp4"
            />
          </video>

          {/* Interactive Scientific Hologram Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-slate-950 flex items-center justify-between px-6 sm:px-12 pointer-events-none">
            <div className="max-w-md space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                Robotic Pipetting & Automated Hematology Track
              </span>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                Integrated Roche Cobas 8000 & Sysmex XN-1000 automated diagnostic lines.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-xs">
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-mono">Daily Capacity</span>
                <span className="font-mono font-bold text-white text-sm">15,000+ Tests</span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-mono">Barcoded Tracking</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">100% Real-Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen Laboratory Facility Video Modal ─── */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Microscope size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Inside Our Ultra-Modern Central Laboratory</h3>
                  <p className="text-[11px] text-slate-400">Automated Clinical Pathology, Biochemistry & Molecular Hub</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/S_7gDff5z20?autoplay=1&mute=0&controls=1&rel=0"
                title="Automated Clinical Laboratory Virtual Tour"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800">
              <div className="flex items-center gap-4 text-slate-300">
                <span>✓ Fully Closed-Tube Barcode Sampling</span>
                <span>✓ Zero Cross-Contamination Guarantee</span>
                <span>✓ Triple Bi-Directional LIMS Verification</span>
              </div>
              <button
                onClick={() => setShowFullModal(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
