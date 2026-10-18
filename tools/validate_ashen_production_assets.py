#!/usr/bin/env python3
"""Validate generated Ashen Crown GLB character assets and PBR texture budgets."""
from __future__ import annotations
import json
import struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = ROOT / "Assets" / "Models"
MODEL_PATHS = (
    MODEL_ROOT / "Characters" / "AshenSentinel.glb",
    MODEL_ROOT / "Bosses" / "AshenRegent.glb",
)
NPC_ROSTER_PATH = MODEL_ROOT / "NPC" / "AshenNPCRoster.glb"
TEXTURES = (
    "AshenShared_BaseColor.png",
    "AshenShared_Normal.png",
    "AshenShared_MetallicRoughness.png",
    "AshenShared_Emissive.png",
)
EXPECTED_ANIMATIONS = {"Idle", "Walk", "Run", "Light1", "Heavy", "Enrage"}

def read_glb(path: Path, require_hero_animation: bool = True) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError(f"{path}: GLB is truncated")
    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or total_length != len(data):
        raise ValueError(f"{path}: invalid GLB header or declared length")
    json_length, json_type = struct.unpack_from("<II", data, 12)
    if json_type != 0x4E4F534A or 20 + json_length > len(data):
        raise ValueError(f"{path}: missing JSON chunk")
    document = json.loads(data[20:20 + json_length].decode("utf-8").rstrip(" \\0"))
    binary_header = 20 + json_length
    binary_length, binary_type = struct.unpack_from("<II", data, binary_header)
    if binary_type != 0x004E4942 or binary_header + 8 + binary_length > len(data):
        raise ValueError(f"{path}: missing or truncated binary chunk")
    buffer_length = document.get("buffers", [{}])[0].get("byteLength", 0)
    if buffer_length > binary_length:
        raise ValueError(f"{path}: buffer length exceeds binary chunk")
    if len(document.get("materials", [])) < 5:
        raise ValueError(f"{path}: expected 5 authored PBR material groups")
    if len(document.get("images", [])) != 4:
        raise ValueError(f"{path}: expected 4 embedded PBR texture maps")
    if require_hero_animation:
        names = {animation.get("name") for animation in document.get("animations", [])}
        if not EXPECTED_ANIMATIONS.issubset(names):
            raise ValueError(f"{path}: missing expected animation clips: {EXPECTED_ANIMATIONS - names}")
        if len(document.get("meshes", [])) < 30:
            raise ValueError(f"{path}: mesh groups look incomplete")
        if path.stat().st_size > 12 * 1024 * 1024:
            raise ValueError(f"{path}: model exceeds the 12 MiB hero asset budget")
    else:
        models = [node.get("name", "") for node in document.get("nodes", []) if node.get("name", "").startswith("NPCMODEL_")]
        if len(models) < 50:
            raise ValueError(f"{path}: expected at least 50 distinct NPC model roots, got {len(models)}")
        if not len(document.get("meshes", [])) >= len(models) * 5:
            raise ValueError(f"{path}: each NPC should expose multiple production material groups")
        if path.stat().st_size > 24 * 1024 * 1024:
            raise ValueError(f"{path}: NPC roster exceeds the 24 MiB shared-pack budget")
    return document

def main() -> None:
    for texture_name in TEXTURES:
        path = MODEL_ROOT / "Textures" / texture_name
        with Image.open(path) as image:
            if image.size != (1024, 1024):
                raise ValueError(f"{path}: expected 1024x1024, got {image.size}")
            if image.mode not in ("RGB", "RGBA"):
                raise ValueError(f"{path}: expected RGB/RGBA, got {image.mode}")
    for model_path in MODEL_PATHS:
        doc = read_glb(model_path)
        print(f"OK {model_path.relative_to(ROOT)}: {len(doc['meshes'])} mesh groups, {len(doc['animations'])} clips, {model_path.stat().st_size:,} bytes")
    roster_doc = read_glb(NPC_ROSTER_PATH, require_hero_animation=False)
    roster_count = sum(node.get("name", "").startswith("NPCMODEL_") for node in roster_doc.get("nodes", []))
    print(f"OK {NPC_ROSTER_PATH.relative_to(ROOT)}: {roster_count} distinct NPC roots, {len(roster_doc['meshes'])} PBR material batches, {NPC_ROSTER_PATH.stat().st_size:,} bytes")
    print("OK shared PBR textures: four 1024x1024 maps; GLB headers, embedded maps, character roots and hero animation clips validated.")

if __name__ == "__main__":
    main()
