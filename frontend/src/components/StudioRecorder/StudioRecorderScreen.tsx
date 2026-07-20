import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { GlassPanel } from '../ui/GlassPanel';
import { SectionLabel } from '../ui/SectionLabel';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Knob } from '../ui/Knob';
import { WaveformViz } from './WaveformViz';
import { StageOutput } from './StageOutput';
import { ErrorBanner } from '../common/ErrorBanner';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useRecorder } from '../../hooks/useRecorder';
import { useVoices } from '../../hooks/useVoices';
import { runPipeline } from '../../lib/api';
import { createLogger } from '../../lib/logger';

const log = createLogger('studio-recorder');

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'de', label: 'German' },
  { id: 'hi', label: 'Hindi' },
];

export function StudioRecorderScreen() {
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [steps, setSteps] = useState<string[]>(['clean', 'transcribe']);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const { voices } = useVoices();
  const { isRecording, duration, audioBlob, start, stop } = useRecorder();
  const { status, result, step, steps_completed, total_steps, error: jobError } = useJobPolling(currentJobId);
  const isProcessing = status === 'processing' || status === 'queued';

  if (audioBlob && !isRecording && !recordingBlob) {
    setRecordingBlob(audioBlob);
  }

  const handleRun = useCallback(async () => {
    if (!recordingBlob || steps.length === 0) return;
    log.info(`Run pipeline: steps=${steps.join(',')} lang=${targetLanguage} voice=${selectedVoiceId}`);
    try {
      setScreenError(null);
      const jobId = await runPipeline(recordingBlob, steps, targetLanguage, selectedVoiceId || undefined);
      setCurrentJobId(jobId);
    } catch {
      setScreenError('Failed to start pipeline');
    }
  }, [recordingBlob, steps, targetLanguage, selectedVoiceId]);

  const toggleStep = (stepId: string) => {
    setSteps(prev =>
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    );
  };

  return (
    <>
      <ScreenHeader title="Studio Recorder" modelPill="canary-1b · BNR" />
      <ErrorBanner message={screenError || jobError} onDismiss={() => setScreenError(null)} />

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Main Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Studio Toolbar */}
          <div className="h-12 flex items-center justify-between px-4 bg-surface-container rounded-xl">
            <div className="flex items-center gap-4">
              <span className="text-[13px] font-medium text-on-surface">Untitled Project</span>
              <span className="text-[11px] font-mono text-on-surface-variant">48kHz · 24-bit</span>
            </div>
            <div className="flex items-center gap-2">
              {isRecording && (
                <span className="flex items-center gap-1.5 text-error font-mono text-[12px] tabular-nums">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  {String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
                </span>
              )}
              <button className="btn-press w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5">
                <Icon name="zoom_in" size={16} />
              </button>
              <button className="btn-press w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5">
                <Icon name="zoom_out" size={16} />
              </button>
            </div>
          </div>

          {/* Waveform Viewport */}
          <div className="flex-1 relative bg-surface-container rounded-xl border border-outline/20 overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Waveform canvas */}
            <WaveformViz isRecording={isRecording} stream={null} />
            {!isRecording && !recordingBlob && (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-mono text-[12px]">
                Record or upload audio to begin
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <GlassPanel className="flex items-center justify-center gap-6 py-4">
            <button className="btn-press flex flex-col items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
              <Icon name="stop" size={24} />
              <span className="text-[10px] font-mono">Stop</span>
            </button>
            <button
              onClick={isRecording ? stop : start}
              className={`btn-press w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all ${
                isRecording
                  ? 'border-error bg-error/10 text-error shadow-[0_0_20px_rgba(179,38,30,0.3)]'
                  : 'border-error/60 hover:border-error text-error'
              }`}
            >
              <Icon name={isRecording ? 'stop' : 'mic'} size={36} />
            </button>
            <button className="btn-press flex flex-col items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
              <Icon name="pause" size={24} />
              <span className="text-[10px] font-mono">Pause</span>
            </button>
          </GlassPanel>

          {/* Live Transcription Preview */}
          <GlassPanel className="p-4 max-h-32 overflow-y-auto">
            <SectionLabel>Live Transcription</SectionLabel>
            <p className="mt-2 text-[13px] text-on-surface-variant font-mono">
              {isRecording ? 'Listening...' : 'Start recording to see live transcription'}
            </p>
          </GlassPanel>
        </div>

        {/* Right Pipeline Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="space-y-3">
            <SectionLabel>Processing Pipeline</SectionLabel>

            {/* Pipeline checkboxes */}
            {[
              { id: 'clean', label: 'Clean', desc: 'BNR', disabled: true },
              { id: 'transcribe', label: 'Transcribe', desc: 'Canary-1B', disabled: false },
              { id: 'translate', label: 'Translate', desc: 'Canary-1B', disabled: false },
              { id: 'revoice', label: 'Re-voice', desc: 'magpie-tts', disabled: false },
            ].map(s => (
              <div key={s.id}>
                <label className={`flex items-center gap-3 py-2 ${s.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}>
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    steps.includes(s.id)
                      ? 'bg-primary border-primary text-on-primary'
                      : 'border-outline/50'
                  } ${s.disabled ? '' : 'group-hover:border-outline'}`}>
                    {steps.includes(s.id) && <Icon name="check" size={12} filled />}
                  </span>
                  <div className="flex-1">
                    <span className="text-[13px] text-on-surface">{s.label}</span>
                    <span className="ml-2 text-[10px] font-mono text-on-surface-variant">{s.desc}</span>
                    {s.disabled && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono text-on-surface-variant bg-surface-container-lowest border border-outline/20">
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <input type="checkbox" checked={steps.includes(s.id)} onChange={() => toggleStep(s.id)} className="hidden" disabled={s.disabled} />
                </label>
                {s.id === 'translate' && steps.includes('translate') && (
                  <select
                    value={targetLanguage}
                    onChange={e => setTargetLanguage(e.target.value)}
                    className="ml-7 mt-1 w-[calc(100%-28px)] px-3 py-1.5 bg-surface-container-lowest border border-outline/30 rounded-lg text-[12px] text-on-surface outline-none focus:border-primary/40"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                )}
                {s.id === 'revoice' && steps.includes('revoice') && (
                  <select
                    value={selectedVoiceId}
                    onChange={e => setSelectedVoiceId(e.target.value)}
                    className="ml-7 mt-1 w-[calc(100%-28px)] px-3 py-1.5 bg-surface-container-lowest border border-outline/30 rounded-lg text-[12px] text-on-surface outline-none focus:border-primary/40"
                  >
                    <option value="">Select voice...</option>
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Sensitivity */}
          <div className="pt-3 border-t border-outline/20">
            <SectionLabel>Sensitivity</SectionLabel>
            <div className="flex justify-center gap-8 mt-3">
              <Knob value={65} label="Gain" display="+6dB" />
              <Knob value={40} label="Comp" display="3:1" />
            </div>
          </div>

          {/* Run Pipeline */}
          <Button
            variant="primary-container"
            fullWidth
            disabled={!recordingBlob || steps.length === 0 || isProcessing}
            onClick={handleRun}
            className="py-3"
          >
            <Icon name="bolt" size={18} />
            <span className="font-mono text-[12px] tracking-[0.1em] uppercase">
              {isProcessing
                ? `Running ${step || ''} (${steps_completed}/${total_steps})`
                : 'Run Pipeline'}
            </span>
          </Button>

          <StageOutput result={result} completedSteps={steps_completed} totalSteps={total_steps} />
        </div>
      </div>
    </>
  );
}
