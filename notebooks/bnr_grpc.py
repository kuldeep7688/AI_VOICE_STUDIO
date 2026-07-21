"""
BNR gRPC client — calls NVIDIA BNR NIM via grpc.nvcf.nvidia.com:443.

Usage:
    from bnr_grpc import bnr_denoise
    cleaned = bnr_denoise(api_key, function_id, audio_wav_bytes, sample_rate=48000)

BNR uses gRPC (not REST). The function_id for the NVCF preview is:
    66518fde-1164-479b-a21f-f8240104505a
"""

import sys
import io
import struct
import grpc

# ═══════════════════════════════════════════════════════════════════════════════
# Embedded protobuf — auto-generated from bnr.proto (NVIDIA, MIT licensed)
# Source: https://github.com/NVIDIA-Maxine/nim-clients/tree/master/bnr
# ═══════════════════════════════════════════════════════════════════════════════

from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder

_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 5, 27, 2, "", "bnr.proto"
)

_sym_db = _symbol_database.Default()

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b"\n\tbnr.proto\x12\x12nvidia.ai4m.bnr.v1\"F\n\x12EnhanceAudioConfig\x12\x1c\n\x0fintensity_ratio\x18\x01 \x01(\x02H\x00\x88\x01\x01B\x12\n\x10_intensity_ratio\"|\n\x13EnhanceAudioRequest\x12\x1b\n\x11audio_stream_data\x18\x01 \x01(\x0cH\x00\x12\x38\n\x06config\x18\x02 \x01(\x0b\x32&.nvidia.ai4m.bnr.v1.EnhanceAudioConfigH\x00B\x0e\n\x0cstream_input\"~\n\x14EnhanceAudioResponse\x12\x1b\n\x11audio_stream_data\x18\x01 \x01(\x0cH\x00\x12\x38\n\x06config\x18\x02 \x01(\x0b\x32&.nvidia.ai4m.bnr.v1.EnhanceAudioConfigH\x00B\x0f\n\rstream_output2n\n\x03BNR\x12g\n\x0cEnhanceAudio\x12'.nvidia.ai4m.bnr.v1.EnhanceAudioRequest\x1a(.nvidia.ai4m.bnr.v1.EnhanceAudioResponse\"\x00(\x01\x30\x01b\x06proto3"
)

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, "bnr_pb2", _globals)

bnr_pb2 = type(sys)("bnr_pb2")
bnr_pb2.EnhanceAudioConfig = _globals["EnhanceAudioConfig"]
bnr_pb2.EnhanceAudioRequest = _globals["EnhanceAudioRequest"]
bnr_pb2.EnhanceAudioResponse = _globals["EnhanceAudioResponse"]

# Minimal gRPC stub (avoids importing the full bnr_pb2_grpc)
_ENHANCE_AUDIO_METHOD = "/nvidia.ai4m.bnr.v1.BNR/EnhanceAudio"


def _generate_request_transactional(
    wav_bytes: bytes, intensity_ratio: float | None = None
):
    """Yield chunks for transactional mode (raw WAV bytes in 64KB chunks)."""
    if intensity_ratio is not None:
        config = bnr_pb2.EnhanceAudioConfig()
        config.intensity_ratio = intensity_ratio
        yield bnr_pb2.EnhanceAudioRequest(config=config)

    CHUNK = 64 * 1024
    for i in range(0, len(wav_bytes), CHUNK):
        yield bnr_pb2.EnhanceAudioRequest(
            audio_stream_data=wav_bytes[i : i + CHUNK]
        )


def bnr_denoise(
    api_key: str,
    function_id: str,
    wav_bytes: bytes,
    sample_rate: int = 48000,
    intensity_ratio: float | None = None,
    verbose: bool = True,
) -> bytes:
    """Send audio to NVIDIA BNR NIM via gRPC and return denoised WAV bytes.

    Args:
        api_key:      NVIDIA API key (nvapi-...)
        function_id:  NVCF function ID (66518fde-...)
        wav_bytes:    Input WAV file as bytes
        sample_rate:  48000 or 16000 (must match WAV header)
        intensity_ratio: 0.0–1.0 (1.0 = max denoising, default)
        verbose:      Print progress

    Returns:
        Denoised WAV file as bytes (transactional mode)
    """
    metadata = (
        ("authorization", f"Bearer {api_key}"),
        ("function-id", function_id),
    )

    credentials = grpc.ssl_channel_credentials()
    target = "grpc.nvcf.nvidia.com:443"

    if verbose:
        print(f"→ BNR gRPC: {target}")
        print(f"  function-id: {function_id}")
        print(f"  audio size:  {len(wav_bytes)} bytes")
        print(f"  sample rate: {sample_rate} Hz")

    with grpc.secure_channel(target=target, credentials=credentials) as channel:
        response = channel.stream_stream(
            _generate_request_transactional(wav_bytes, intensity_ratio),
            _ENHANCE_AUDIO_METHOD,
            bnr_pb2.EnhanceAudioRequest.SerializeToString,
            bnr_pb2.EnhanceAudioResponse.FromString,
            metadata=tuple(metadata),
        )

        output = bytearray()
        for msg in response:
            if msg.HasField("audio_stream_data"):
                output.extend(msg.audio_stream_data)

    if verbose:
        print(f"← {len(output)} bytes (denoised WAV)")

    return bytes(output)
