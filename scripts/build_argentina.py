
import json
import re
import sys
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = ROOT / "local.xlsx"
OUTPUT_FILE = ROOT / "argentina.json"
SHEET_NAME = "Etiquetas_localidades"

COLUMN_MAP = {
    "Código de jurisdicción": "jurisdictionCode",
    "Jurisdicción": "province",
    "Código de departamento": "departmentCode",
    "Departamento": "department",
    "Código de aglomerado": "agglomerationCode",
    "Aglomerado": "agglomeration",
    "Código de localidad": "localityCode",
    "Localidad": "locality",
    "Tipo de localidad": "localityType",
    "Código  de gobierno Local": "localGovernmentCode",
    "Gobierno local": "localGovernment",
    "Categoría de gobierno local": "localGovernmentCategory",
}


def clean(value):
    if pd.isna(value):
        return ""

    text = str(value).strip()

    if text.lower() in {"nan", "none", "nat"}:
        return ""

    return re.sub(r"\s+", " ", text)


def main():
    if not INPUT_FILE.is_file():
        raise FileNotFoundError(
            f"Excel file not found: {INPUT_FILE}"
        )

    df = pd.read_excel(
        INPUT_FILE,
        sheet_name=SHEET_NAME,
        dtype=str,
        keep_default_na=False,
        engine="openpyxl",
    )

    # Remove incidental whitespace from headers.
    df.columns = [
        re.sub(r"\s+", " ", str(column)).strip()
        for column in df.columns
    ]

    # The source has two spaces in this column name.
    normalized_map = {
        re.sub(r"\s+", " ", source).strip(): target
        for source, target in COLUMN_MAP.items()
    }

    missing = [
        source for source in normalized_map
        if source not in df.columns
    ]

    if missing:
        raise ValueError(
            "Required Excel columns missing: "
            + ", ".join(missing)
        )

    # Normalize the original headers to their JSON field names.
    df = df.rename(columns=normalized_map)

    records = []
    seen_codes = set()

    for _, row in df.iterrows():
        record = {
            key: clean(row[key])
            for key in COLUMN_MAP.values()
        }

        # Exclude blank rows and source notes.
        if not all(
            record[key]
            for key in (
                "jurisdictionCode",
                "province",
                "localityCode",
                "locality",
            )
        ):
            continue

        code = record["localityCode"]

        # Preserve official codes as strings, including leading zeros.
        if code in seen_codes:
            raise ValueError(
                f"Duplicate locality code found: {code}"
            )

        seen_codes.add(code)
        records.append(record)

    if not records:
        raise ValueError("No valid locality records found.")

    records.sort(
        key=lambda record: (
            record["province"].casefold(),
            record["department"].casefold(),
            record["locality"].casefold(),
            record["localityCode"],
        )
    )

    # Compact JSON with Unicode and Spanish accents preserved.
    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
        newline="\n",
    ) as output:
        json.dump(
            records,
            output,
            ensure_ascii=False,
            separators=(",", ":"),
            allow_nan=False,
        )

    # Read back the exact generated file.
    with OUTPUT_FILE.open(
        "r",
        encoding="utf-8",
    ) as source:
        verified = json.load(source)

    if len(verified) != len(records):
        raise ValueError("JSON record count mismatch.")

    print("Argentina JSON generated successfully.")
    print(f"Valid locality records: {len(verified):,}")
    print(f"Output: {OUTPUT_FILE}")
    print(f"Size: {OUTPUT_FILE.stat().st_size:,} bytes")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
