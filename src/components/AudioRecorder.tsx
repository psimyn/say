import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioRecorder: React.FC<Props> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const timeInterval = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(59, 130, 246)';
      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyser for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Try to use MP3 encoding, fall back to default if not supported
      const options = {
        mimeType: 'audio/mpeg',
        audioBitsPerSecond: 256000
      };

      try {
        mediaRecorder.current = new MediaRecorder(stream, options);
      } catch (e) {
        // If MP3 is not supported, try other common formats
        const formats = [
          'audio/mp3',
          'audio/webm;codecs=mp3',
          'audio/webm',
          'audio/ogg'
        ];
        
        for (const format of formats) {
          if (MediaRecorder.isTypeSupported(format)) {
            mediaRecorder.current = new MediaRecorder(stream, { mimeType: format });
            break;
          }
        }

        // If none of the above worked, use default format
        if (!mediaRecorder.current) {
          mediaRecorder.current = new MediaRecorder(stream);
        }
      }

      mediaRecorder.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.current.start();
      setIsRecording(true);
      timeInterval.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setRecordingTime(0);
    }
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      // Convert to MP3 if not already in MP3 format
      const blob = new Blob([event.data], { type: 'audio/mpeg' });
      onRecordingComplete(blob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-24 bg-white rounded-lg"
        width={800}
        height={100}
      />
      <div className="text-xl font-semibold">
        {isRecording ? `Recording: ${formatTime(recordingTime)}` : 'Ready to Record'}
      </div>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-full text-white text-lg font-semibold ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all`}
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;
