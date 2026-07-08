import { useEffect, useRef } from 'react';

interface Props {
  isRecording: boolean;
  stream: MediaStream | null;
}

export function WaveformViz({ isRecording, stream }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !stream || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      if (!canvasRef.current) return;
      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, cw, ch);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#76b900';
      ctx.beginPath();
      const sliceWidth = cw / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * ch) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(cw, ch / 2);
      ctx.stroke();
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      audioCtx.close();
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;
  return (
    <canvas ref={canvasRef} width={600} height={100} className="w-full h-24 rounded-[6px] bg-[--bg]" />
  );
}
