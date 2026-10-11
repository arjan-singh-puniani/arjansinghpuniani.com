#!/usr/bin/env python3
"""Prepare reproducible residue representations from public RCSB assemblies.

No runtime dependencies. Download uses curl with TLS verification. Run from any
directory: python3 scripts/prepare-molecules.py [--download] [--validate-only].
The generated positions are experimental C-alpha coordinates, not atomistic
molecular surfaces. Never infer whole-replisome docking from independent entries.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "molecules"
STRUCTURES = {
    "7PFO": {"resolution": 3.20, "expectedProteinChains": 19,
             "groups": {"cmg": [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13],
                        "epsilon": [7, 8], "accessory": [14, 15, 16, 19]}},
    "6TNZ": {"resolution": 4.05, "expectedProteinChains": 8,
             "groups": {"delta": [1, 2, 3, 4], "pcna": [5], "fen1": [6]}},
    "8QJ7": {"resolution": 3.07, "expectedProteinChains": 4,
             "groups": {"alpha": [1, 2, 3, 4]}},
}


def tokens(text: str):
    """Tokenize CIF 1.1, including quoted and semicolon multiline values."""
    lines = iter(text.splitlines())
    for line in lines:
        if line.startswith(";"):
            block = [line[1:]]
            for line in lines:
                if line.startswith(";"):
                    break
                block.append(line)
            else:
                raise ValueError("Unterminated CIF multiline string")
            yield "\n".join(block)
            continue
        pos = 0
        while pos < len(line):
            if line[pos].isspace():
                pos += 1
                continue
            if line[pos] == "#":
                break
            start = pos
            if line[pos] in "\"'":
                quote = line[pos]
                pos += 1
                start = pos
                while pos < len(line):
                    if line[pos] == quote and (pos + 1 == len(line) or line[pos + 1].isspace()):
                        yield line[start:pos]
                        pos += 1
                        break
                    pos += 1
                else:
                    raise ValueError("Unterminated CIF quoted string")
            else:
                while pos < len(line) and not line[pos].isspace():
                    pos += 1
                yield line[start:pos]


def parse_cif(text: str):
    data, stream = {}, list(tokens(text))
    i = 0
    while i < len(stream):
        token = stream[i]
        if token == "loop_":
            i += 1
            keys = []
            while i < len(stream) and stream[i].startswith("_"):
                keys.append(stream[i])
                i += 1
            if not keys:
                raise ValueError("CIF loop has no keys")
            values = []
            while i < len(stream):
                value = stream[i]
                if value.startswith("_") or value in ("loop_", "stop_") or value.startswith("data_"):
                    break
                values.append(value)
                i += 1
            if len(values) % len(keys):
                raise ValueError(f"Malformed CIF loop {keys[0]}")
            for n, key in enumerate(keys):
                data[key] = values[n::len(keys)]
        elif token.startswith("_"):
            if i + 1 == len(stream):
                raise ValueError(f"Missing CIF value {token}")
            data[token] = [stream[i + 1]]
            i += 2
        else:
            i += 1
    return data


def rows(data, prefix, columns):
    vectors = [data[f"{prefix}.{key}"] for key in columns]
    if len({len(v) for v in vectors}) != 1:
        raise ValueError(f"Inconsistent {prefix} loop columns")
    return (dict(zip(columns, row)) for row in zip(*vectors))


def point_center(points):
    return [round(sum(p[k] for p in points) / len(points), 3) for k in range(3)]


def lod_indices(chains, stride):
    indices = []
    for chain in chains:
        start, count = chain["start"], chain["count"]
        subset = list(range(start, start + count, stride))
        if subset[-1] != start + count - 1:
            subset.append(start + count - 1)
        indices.extend(subset)
    return indices


def prepare(pdb, raw):
    config = STRUCTURES[pdb]
    data = parse_cif(raw.decode("utf-8"))
    entities = {r["id"]: r["pdbx_description"] for r in rows(data, "_entity", ["id", "pdbx_description"])}
    polymers = {r["entity_id"]: r for r in rows(data, "_entity_poly", ["entity_id", "type", "pdbx_seq_one_letter_code_can"])}
    columns = ["group_PDB", "type_symbol", "label_atom_id", "label_alt_id", "label_comp_id", "label_asym_id", "label_entity_id",
               "label_seq_id", "auth_seq_id", "auth_asym_id", "Cartn_x", "Cartn_y", "Cartn_z", "occupancy", "pdbx_PDB_model_num"]
    chains, seen_atoms, atom_count, model_counts, heavy_atom_counts = {}, set(), 0, {}, {}
    for atom in rows(data, "_atom_site", columns):
        atom_count += 1
        model = atom["pdbx_PDB_model_num"]
        model_counts[model] = model_counts.get(model, 0) + 1
        if atom["type_symbol"] not in ("H", "D"):
            heavy_atom_counts[model] = heavy_atom_counts.get(model, 0) + 1
        entity = atom["label_entity_id"]
        if entity not in polymers or atom["pdbx_PDB_model_num"] != "1":
            continue
        protein = polymers[entity]["type"] == "polypeptide(L)"
        representative = "CA" if protein else "C4'"
        if atom["label_atom_id"] != representative or atom["label_alt_id"] not in (".", "?", "A"):
            continue
        if float(atom["occupancy"]) <= 0:
            continue
        chain_id = atom["label_asym_id"]
        residue = atom["label_seq_id"]
        key = (chain_id, residue)
        if key in seen_atoms:
            raise ValueError(f"Duplicate representative atom in {pdb}: {key}")
        seen_atoms.add(key)
        point = [float(atom[f"Cartn_{axis}"]) for axis in "xyz"]
        if not all(math.isfinite(v) for v in point):
            raise ValueError(f"Invalid coordinates in {pdb}")
        chain = chains.setdefault(chain_id, {"id": chain_id, "authId": atom["auth_asym_id"], "entityId": int(entity),
                                 "name": entities[entity], "protein": protein, "points": [], "residues": [], "breaks": [],
                                 "depositedResidues": len("".join(polymers[entity]["pdbx_seq_one_letter_code_can"].split()))})
        if chain["points"]:
            old_id = int(chain["residues"][-1][0])
            separation = math.dist(chain["points"][-1], point)
            if int(residue) != old_id + 1 or separation > (5.0 if protein else 9.0):
                chain["breaks"].append(len(chain["points"]))
        chain["points"].append(point)
        chain["residues"].append([int(residue), atom["auth_seq_id"], atom["label_comp_id"]])
    protein_chains = [chain for chain in chains.values() if chain["protein"]]
    if len(protein_chains) != config["expectedProteinChains"]:
        raise ValueError(f"{pdb}: expected {config['expectedProteinChains']} protein chains, got {len(protein_chains)}")
    all_points = [p for chain in chains.values() for p in chain["points"]]
    original_center = point_center(all_points)
    for chain in chains.values():
        chain["points"] = [[round(p[k] - original_center[k], 3) for k in range(3)] for p in chain["points"]]
    groups = {}
    for name, entity_ids in config["groups"].items():
        points, summaries = [], []
        for chain in protein_chains:
            if chain["entityId"] not in entity_ids:
                continue
            summaries.append({**{k: v for k, v in chain.items() if k not in ("points", "protein")},
                              "start": len(points), "count": len(chain["points"])})
            points.extend(chain["points"])
        if not points:
            raise ValueError(f"Missing {pdb} group {name}")
        groups[name] = {"points": points, "chains": summaries, "center": point_center(points),
                        "lod": {level: lod_indices(summaries, stride) for level, stride in [("low", 4), ("medium", 2), ("high", 1)]}}
    assigned = sum(len(group["chains"]) for group in groups.values())
    if assigned != len(protein_chains):
        raise ValueError(f"Unclassified protein chains in {pdb}: {assigned}/{len(protein_chains)}")
    dna = [{k: v for k, v in chain.items() if k != "protein"} for chain in chains.values() if not chain["protein"]]
    return {"schemaVersion": 1, "id": pdb, "title": data["_struct.title"][0], "units": "angstrom", "scale": 1,
            "originalCenter": original_center,
            "representation": "Experimental alpha-carbon residue beads; DNA C4-prime backbone points. No inferred missing residues.",
            "source": {"url": f"https://files.rcsb.org/download/{pdb}-assembly1.cif", "entryUrl": f"https://www.rcsb.org/structure/{pdb}",
                       "assembly": 1, "method": "ELECTRON MICROSCOPY", "resolutionAngstrom": config["resolution"],
                       "sha256": hashlib.sha256(raw).hexdigest(), "retrieved": "2026-10-11", "originalAtomCount": atom_count,
                       "sourceModelAtomCounts": model_counts, "selectedModel": 1, "selectedModelAtomCount": model_counts["1"],
                       "selectedModelHeavyAtomCount": heavy_atom_counts["1"]},
            "validation": {"proteinChains": len(protein_chains), "proteinResidues": sum(len(chain["points"]) for chain in protein_chains),
                           "dnaChains": len(dna), "allCoordinatesFinite": True, "allProteinChainsClassified": True},
            "groups": groups, "dna": dna}


def validate_asset(asset):
    for name, group in asset["groups"].items():
        size = len(group["points"])
        if not size or not all(len(p) == 3 and all(math.isfinite(v) for v in p) for p in group["points"]):
            raise ValueError(f"Invalid points: {asset['id']} {name}")
        if group["lod"]["high"] != list(range(size)):
            raise ValueError("High LOD must retain every modeled residue")
        for level in ("low", "medium", "high"):
            indices = group["lod"][level]
            if indices != sorted(set(indices)) or not all(0 <= i < size for i in indices):
                raise ValueError(f"Invalid {level} LOD indices")
        if not set(group["lod"]["low"]) <= set(group["lod"]["medium"]):
            raise ValueError("LOD subsets must be nested")
        if sum(c["count"] for c in group["chains"]) != size:
            raise ValueError("Chain counts disagree")
        next_start = 0
        for chain in group["chains"]:
            if chain["start"] != next_start or len(chain["residues"]) != chain["count"]:
                raise ValueError("Chain ranges or residue metadata disagree")
            if not all(0 < i < chain["count"] for i in chain["breaks"]):
                raise ValueError("Invalid trace break")
            next_start += chain["count"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Refresh public biological assembly 1 files using verified TLS")
    parser.add_argument("--validate-only", action="store_true", help="Validate existing generated JSON without regenerating")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for pdb in STRUCTURES:
        destination = OUT / f"{pdb.lower()}.json"
        if args.validate_only:
            asset = json.loads(destination.read_text())
        else:
            source = OUT / "source" / f"{pdb.lower()}-assembly1.cif.gz"
            raw_source = source.with_suffix("")
            if args.download:
                source.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(["curl", "--fail", "--location", "--retry", "2", "--max-time", "120",
                                f"https://files.rcsb.org/download/{pdb}-assembly1.cif", "-o", str(raw_source)], check=True)
            if raw_source.exists():
                raw = raw_source.read_bytes()
                source.write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
                raw_source.unlink()
            else:
                raw = gzip.decompress(source.read_bytes())
            asset = prepare(pdb, raw)
            validate_asset(asset)
            destination.write_text(json.dumps(asset, separators=(",", ":"), ensure_ascii=False) + "\n")
        validate_asset(asset)
        print(f"{pdb}: {asset['validation']}; {destination.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
