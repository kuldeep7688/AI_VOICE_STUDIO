import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { RecordControls } from './RecordControls';
import { WaveformViz } from './WaveformViz';
import { PipelineStages } from './PipelineStages';
import { RunPipelineButton } from './RunPipelineButton';
import { StageOutput } from './StageOutput';
import { ErrorBanner } from '../common/ErrorBanner';
import { HelpFab } from '../ui/HelpFab';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useRecorder } from '../../hooks/useRecorder';
import { useVoices } from '../../hooks/useVoices';
import { runPipeline } from '../../lib/api';

export function StudioRecorderScreen() {
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const { voices } = useVoices();
  const { isRecording } = useRecorder();
  const { status, result, step, steps_completed, total_steps, error: jobError } = useJobPolling(currentJobId);
  const isProcessing = status === 'processing' || status === 'queued';

  const handleRun = useCallback(async () => {
    if (!recordingBlob || steps.length === 0) return;
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

      <div className="space-y-6">
        <RecordControls onRecordingComplete={setRecordingBlob} />
        <WaveformViz isRecording={isRecording} stream={null} />

        <PipelineStages
          steps={steps}
          targetLanguage={targetLanguage}
          voiceId={selectedVoiceId}
          voices={voices}
          onToggleStep={toggleStep}
          onLanguageChange={setTargetLanguage}
          onVoiceChange={setSelectedVoiceId}
        />

        <RunPipelineButton
          disabled={!recordingBlob || steps.length === 0}
          isLoading={isProcessing}
          step={step}
          stepsCompleted={steps_completed}
          totalSteps={total_steps}
          onClick={handleRun}
        />

        <StageOutput result={result} completedSteps={steps_completed} totalSteps={total_steps} />
      </div>

      <HelpFab />
    </>
  );
}
