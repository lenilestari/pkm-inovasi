"""
Simulasi data Partial Discharge (PD) untuk 20 trafo RIIL yang datanya dipakai di
dga_composite_score.ipynb (data DGA asli dari laporan Petrolab, ground truth lab).

KENAPA SCRIPT INI ADA:
Modul PD di database (be-plant-maintenance) ternyata isinya data dummy/seed dengan
asset_id acak (TR-AMM-1011B, TR-PLB-1003A, dst) -- TIDAK ADA satupun yang match dengan
20 trafo riil di atas (lihat prototype/pkm-dga/export_pd_data.sql STEP 0 hasilnya).
Jadi tidak mungkin join data PD riil x DGA riil sekarang.

Solusi sementara untuk keperluan riset (PKM): simulasikan pembacaan PD untuk 20 trafo
riil tsb, dengan struktur kolom & pola nilai PERSIS seperti data PD yang sudah ada di
database (method/unit/threshold/reading_point convention dari STEP 1 export), supaya
bisa langsung dipakai gantikan `pd_worsening_synthetic` di notebook.

YANG RIIL vs YANG DISIMULASIKAN (harus jujur ke pembaca notebook/laporan):
- RIIL: asset_id, manufacture_year, sample_date, lab_status, lab_fault_type (dari DGA)
- ASUMSI/PLACEHOLDER (bukan dari sumber manapun): voltage_level, criticality
- SIMULASI PENUH: measurement_uuid, overall_severity, humidity, temperature, method,
  unit, value pembacaan PD, reading_severity, reading_point/phase/position.
  Nilai PD untuk kasus "Partial Discharge" sengaja diskalakan mengikuti kadar H2 (ppm)
  dari data DGA riil supaya trennya masuk akal (H2 naik -> simulasi PD ikut naik) --
  ini korelasi buatan untuk demo pola, BUKAN pembacaan sensor PD sungguhan.

Output: simulated_pd_data.csv, struktur kolom sama dengan hasil STEP 1 export_pd_data.sql
supaya bisa langsung disandingkan / menggantikan pd_worsening_synthetic di notebook.
"""
import csv
import math
import uuid
from datetime import date

import numpy as np

# --- 1. Data DGA riil (asset_id, manufacture_year, sample_date, h2, lab_status, lab_fault_type) ---
# Disalin dari raw_rows di dga_composite_score.ipynb (h2 dipakai untuk skala simulasi PD).
RAW_ROWS = [
    ('TR-26', 1974, '2023-03-27', 2, 3, 'Normal'),
    ('TR-26', 1974, '2023-07-25', 6, 2, 'Normal'),
    ('TR-26', 1974, '2023-11-23', 2, 1, 'Normal'),
    ('TR-27', 2012, '2023-03-27', 5, 1, 'Normal'),
    ('TR-27', 2012, '2023-11-23', 8, 1, 'Normal'),
    ('1N-TR-001', 2014, '2023-05-03', 3, 2, 'Normal'),
    ('1N-TR-001', 2014, '2024-02-06', 3, 1, 'Normal'),
    ('2N-TR-001', 2018, '2023-05-03', 26, 1, 'Normal'),
    ('2N-TR-001', 2018, '2024-02-07', 18, 1, 'Normal'),
    ('TR-31', 1975, '2023-05-03', 0, 1, 'Normal'),
    ('TR-31', 1975, '2024-02-06', 5, 1, 'Normal'),
    ('F6P-1001MVTR', 2014, '2023-03-27', 0, 1, 'Normal'),
    ('F6P-1001MVTR', 2014, '2023-11-23', 0, 1, 'Normal'),
    ('TR-314C-Srigading', 2010, '2024-02-07', 0, 1, 'Normal'),
    ('TR-314C-Srigading', 2010, '2024-06-06', 7, 1, 'Normal'),
    ('TR-Kolam-Renang', 2010, '2024-02-06', 0, 1, 'Normal'),
    ('TR-Kolam-Renang', 2010, '2024-03-05', 5, 2, 'Stray Gassing'),
    ('F5O-TR55', 1991, '2016-11-18', 1088, 1, 'Normal'),
    ('F5O-TR55', 1991, '2020-09-17', 439, 1, 'Normal'),
    ('F5O-TR55', 1991, '2023-05-23', 424, 3, 'Stray Gassing'),
    ('F5O-TR55', 1991, '2024-06-05', 420, 2, 'Stray Gassing'),
    ('F5O-TR512A', 1991, '2016-11-18', 8, 1, 'Normal'),
    ('F5O-TR512A', 1991, '2020-09-17', 30, 1, 'Normal'),
    ('F5O-TR512A', 1991, '2023-05-23', 0, 3, 'Stray Gassing'),
    ('F5O-TR512A', 1991, '2024-06-05', 8, 2, 'Stray Gassing'),
    ('TR-40', 2014, '2023-03-27', 2559, 3, 'Partial Discharge'),
    ('TR-40', 2014, '2023-07-25', 2593, 3, 'Partial Discharge'),
    ('TR-40', 2014, '2023-11-23', 2541, 3, 'Partial Discharge'),
    ('TR-44', 1976, '2023-03-27', 619, 3, 'Partial Discharge'),
    ('TR-44', 1976, '2023-07-25', 21126, 3, 'Partial Discharge'),
    ('TR-44', 1976, '2023-11-23', 8385, 3, 'Partial Discharge'),
    ('TR-221', 2008, '2023-05-23', 47966, 3, 'Partial Discharge'),
    ('TR-221', 2008, '2024-06-05', 50438, 3, 'Partial Discharge'),
    ('TR-Melati-216', 1990, '2023-05-23', 707, 3, 'Partial Discharge'),
    ('TR-Melati-216', 1990, '2024-06-05', 1025, 3, 'Partial Discharge'),
    ('TR-YDPK', 2018, '2023-05-23', 8472, 3, 'Partial Discharge'),
    ('TR-YDPK', 2018, '2024-06-06', 10529, 3, 'Partial Discharge'),
    ('TR-34', 1975, '2023-05-03', 1836, 3, 'Partial Discharge'),
    ('TR-34', 1975, '2024-06-06', 5921, 3, 'Partial Discharge'),
    ('TR-AOP-P4', 1989, '2023-05-03', 6228, 3, 'Partial Discharge'),
    ('TR-AOP-P4', 1989, '2024-02-06', 5105, 3, 'Partial Discharge'),
    ('TR-1-HV-4', 2021, '2023-05-23', 4, 3, 'Thermal Cellulose'),
    ('TR-1-HV-4', 2021, '2024-06-05', 2, 3, 'Thermal Cellulose'),
    ('TR-311B', 1993, '2023-03-29', 85, 3, 'Mild Overheating Paper'),
    ('TR-311B', 1993, '2023-07-25', 2, 2, 'Mild Overheating Paper'),
    ('TR-311B', 1993, '2023-11-23', 4, 2, 'Mild Overheating Paper'),
    ('TR-312A', 1985, '2023-03-29', 2, 2, 'Attention'),
    ('TR-312A', 1985, '2023-07-25', 2, 1, 'Attention'),
    ('TR-312A', 1985, '2023-11-23', 2, 2, 'Attention'),
    ('TR-36', 1974, '2023-03-27', 4, 1, 'Normal'),
    ('TR-36', 1974, '2023-11-23', 4, 1, 'Normal'),
    ('TR-41', 1976, '2023-03-27', 2, 1, 'Normal'),
    ('TR-41', 1976, '2023-11-23', 2, 1, 'Normal'),
    ('TR-42', 1976, '2023-03-27', 2, 1, 'Normal'),
    ('TR-42', 1976, '2023-11-23', 2, 1, 'Normal'),
    ('TR-43', 1976, '2023-03-27', 3, 1, 'Normal'),
    ('TR-43', 1976, '2023-11-23', 10, 1, 'Normal'),
    ('TR-51A', 1999, '2016-11-18', 5, 1, 'Normal'),
    ('TR-51A', 1999, '2020-09-18', 7, 1, 'Normal'),
    ('TR-51A', 1999, '2023-03-27', 2, 1, 'Normal'),
    ('TR-51A', 1999, '2023-11-23', 2, 1, 'Normal'),
    ('TR-51', 1991, '2016-11-18', 272, 1, 'Normal'),
    ('TR-51', 1991, '2020-09-18', 2, 1, 'Normal'),
    ('TR-51', 1991, '2023-03-27', 3, 1, 'Normal'),
    ('TR-51', 1991, '2023-11-23', 2, 1, 'Normal'),
    ('TR-52', 1991, '2016-11-18', 1594, 1, 'Normal'),
    ('TR-52', 1991, '2020-09-18', 914, 1, 'Normal'),
    ('TR-52', 1991, '2023-03-27', 9, 1, 'Normal'),
    ('TR-52', 1991, '2023-11-23', 9, 1, 'Normal'),
    ('TR-56', 1991, '2023-03-27', 2, 1, 'Normal'),
    ('TR-56', 1991, '2023-11-23', 2, 1, 'Normal'),
    ('TR-57', 1991, '2023-03-27', 2, 1, 'Normal'),
    ('TR-57', 1991, '2023-11-23', 3, 1, 'Normal'),
    ('TR-TRANSPORT-210', 2003, '2023-03-27', 2, 1, 'Normal'),
    ('TR-TRANSPORT-210', 2003, '2023-11-23', 2, 1, 'Normal'),
    ('TR-PEPAYA-214', 1999, '2023-03-27', 4, 1, 'Normal'),
    ('TR-PEPAYA-214', 1999, '2023-11-23', 4, 1, 'Normal'),
    ('TR-PEPAYA-215', 1999, '2023-03-27', 2, 1, 'Normal'),
    ('TR-PEPAYA-215', 1999, '2023-11-23', 2, 1, 'Normal'),
    ('TR-DIKLAT', 1990, '2023-03-27', 3, 1, 'Normal'),
    ('TR-DIKLAT', 1990, '2023-11-23', 4, 1, 'Normal'),
    ('F6P-2001MVTR', 2014, '2023-03-27', 2, 1, 'Normal'),
    ('F6P-2001MVTR', 2014, '2023-11-23', 2, 1, 'Normal'),
    ('F6P-1001LVTR', 2014, '2023-03-27', 24, 1, 'Normal'),
    ('F6P-1001LVTR', 2014, '2023-11-23', 38, 1, 'Normal'),
    ('F6P-2001LVTR', 2014, '2023-03-27', 8, 1, 'Normal'),
    ('F6P-2001LVTR', 2014, '2023-11-23', 16, 1, 'Normal'),
    ('2N-TR-002', 2018, '2023-05-03', 362, 3, 'Attention'),
    ('2N-TR-002', 2018, '2024-02-07', 10, 2, 'Attention'),
    ('GP-3001LVTR', 2014, '2023-05-03', 89, 2, 'Normal'),
    ('GP-3001LVTR', 2014, '2024-02-06', 74, 1, 'Normal'),
    ('F6P-3001MVTR', 2014, '2023-03-27', 2, 1, 'Normal'),
    ('F6P-3001MVTR', 2014, '2024-02-06', 2, 1, 'Normal'),
    ('GP-3002LVTR', 2014, '2023-05-03', 2, 1, 'Normal'),
    ('GP-3002LVTR', 2014, '2024-02-06', 2, 1, 'Normal'),
    ('GP-3002MVTR', 2014, '2023-05-03', 2, 1, 'Normal'),
    ('GP-3002MVTR', 2014, '2024-02-06', 2, 1, 'Normal'),
    ('3N-TR-002', 2018, '2023-05-03', 2, 1, 'Normal'),
    ('3N-TR-002', 2018, '2024-02-07', 7, 1, 'Normal'),
    ('TR-317-Rasamala', 1999, '2023-05-03', 27, 1, 'Normal'),
    ('TR-317-Rasamala', 1999, '2024-02-06', 19, 1, 'Normal'),
    ('TR-32', 1975, '2023-05-03', 76, 1, 'Normal'),
    ('TR-32', 1975, '2024-02-06', 66, 1, 'Normal'),
    ('TR-325-Rasamala', 1999, '2023-05-03', 2, 1, 'Normal'),
    ('TR-325-Rasamala', 1999, '2024-02-06', 2, 1, 'Normal'),
    ('TR-329-Gurame', 1999, '2023-05-04', 2, 1, 'Normal'),
    ('TR-329-Gurame', 1999, '2024-02-07', 2, 1, 'Normal'),
    ('TR-45', 1976, '2023-05-03', 4, 2, 'Normal'),
    ('TR-45', 1976, '2024-02-06', 5, 1, 'Normal'),
    ('TR-46', 1976, '2023-05-03', 7, 1, 'Normal'),
    ('TR-46', 1976, '2024-02-06', 5, 1, 'Normal'),
    ('TR-47', 1976, '2023-05-03', 2, 2, 'Normal'),
    ('TR-47', 1976, '2024-02-06', 2, 1, 'Normal'),
    ('TR-48', 1976, '2023-05-03', 2, 2, 'Normal'),
    ('TR-48', 1976, '2024-02-06', 16, 1, 'Normal'),
    ('TR-35', 1999, '2023-05-23', 14, 1, 'Normal'),
    ('TR-35', 1999, '2024-02-07', 12, 1, 'Normal'),
    ('TR-1-HV-1', 2021, '2023-05-23', 4, 1, 'Normal'),
    ('TR-1-HV-1', 2021, '2024-06-05', 2, 1, 'Normal'),
    ('TR-1-HV-2', 2021, '2023-05-23', 10, 1, 'Normal'),
    ('TR-1-HV-2', 2021, '2024-06-05', 2, 1, 'Normal'),
    ('TR-1-HV-3', 2021, '2023-05-23', 2, 1, 'Normal'),
    ('TR-1-HV-3', 2021, '2024-06-05', 2, 1, 'Normal'),
    ('TR-328-Bawal', 1999, '2023-05-03', 2, 1, 'Normal'),
    ('TR-328-Bawal', 1999, '2024-06-06', 2, 1, 'Normal'),
    ('TR-Selasih-314E', 2010, '2023-05-23', 4, 1, 'Normal'),
    ('TR-Selasih-314E', 2010, '2024-06-06', 2, 1, 'Normal'),
    ('TR-REL-A', 2012, '2023-05-23', 21, 2, 'Normal'),
    ('TR-REL-A', 2012, '2024-06-06', 2, 1, 'Normal'),
    ('TR-REL-B', 2012, '2023-05-23', 25, 1, 'Normal'),
    ('TR-REL-B', 2012, '2024-06-06', 2, 1, 'Normal'),
    ('TR-REL-C', 2012, '2023-05-23', 19, 1, 'Normal'),
    ('TR-REL-C', 2012, '2024-06-06', 2, 1, 'Normal'),
    ('TR-Peresmian-1', 1990, '2023-05-23', 86, 1, 'Normal'),
    ('TR-Peresmian-1', 1990, '2024-06-05', 71, 1, 'Normal'),
    ('TR-Peresmian-2', 2013, '2023-05-23', 9, 1, 'Normal'),
    ('TR-Peresmian-2', 2013, '2024-06-05', 2, 1, 'Normal'),
    ('TR-314D-Gandaria', 2010, '2023-05-03', 2, 1, 'Normal'),
    ('TR-314D-Gandaria', 2010, '2024-06-06', 2, 1, 'Normal'),
    ('F5O-TR59', 1991, '2016-11-18', 5, 1, 'Normal'),
    ('F5O-TR59', 1991, '2020-09-17', 27, 1, 'Normal'),
    ('F5O-TR59', 1991, '2023-05-23', 11, 2, 'Normal'),
    ('F5O-TR59', 1991, '2024-06-06', 12, 1, 'Normal'),
    ('F5O-TR512', 1991, '2016-11-18', 12, 1, 'Normal'),
    ('F5O-TR512', 1991, '2020-09-17', 54, 1, 'Normal'),
    ('F5O-TR512', 1991, '2023-05-23', 2, 2, 'Normal'),
    ('F5O-TR512', 1991, '2024-06-05', 19, 1, 'Normal'),
    ('F5O-TR510', 1991, '2016-11-18', 5, 1, 'Normal'),
    ('F5O-TR510', 1991, '2020-09-17', 13, 1, 'Normal'),
    ('F5O-TR510', 1991, '2023-05-23', 2, 1, 'Normal'),
    ('F5O-TR510', 1991, '2024-06-05', 2, 1, 'Normal'),
    ('2N-TR-001', 2018, '2024-06-07', 12, 1, 'Normal'),
    ('TR-BANDENG-327', 1999, '2023-03-27', 195, 2, 'Attention'),
    ('TR-BANDENG-327', 1999, '2023-07-25', 218, 3, 'Attention'),
    ('TR-BANDENG-327', 1999, '2023-11-23', 185, 2, 'Attention'),
    ('GP-3001ELVTR', 2014, '2023-05-03', 221, 3, 'Attention'),
    ('GP-3001ELVTR', 2014, '2023-11-23', 211, 2, 'Attention'),
    ('1N-TR-002', 2014, '2023-05-03', 2, 3, 'Attention'),
    ('1N-TR-002', 2014, '2024-06-07', 2, 2, 'Attention'),
    ('TR-45B', 1976, '2023-05-03', 2, 2, 'Stray Gassing'),
    ('TR-45B', 1976, '2024-02-06', 2, 2, 'Stray Gassing'),
]

# --- 2. Pola PD dari data dummy yang sudah ada di DB (method/unit/threshold tetap 1 method
#     per aset -- di sini kita pakai UHF/mV, sesuai contoh TR-AMM-1019 di STEP 1 export) ---
METHOD, UNIT = "UHF", "mV"
THRESH_WATCH, THRESH_WARNING, THRESH_CRITICAL = 50.0, 200.0, 500.0
PHASES = ["R", "S", "T"]
POSITIONS = ["Top", "Bottom"]

# Rentang nilai dasar (mV) per lab_fault_type, dipilih supaya severity band-nya masuk akal
# relatif terhadap threshold di atas.
BASE_RANGE = {
    "Normal": (5, 35),
    "Stray Gassing": (20, 85),
    "Thermal Cellulose": (20, 90),
    "Mild Overheating Paper": (70, 230),
    "Attention": (70, 230),
}

CRITICALITY_BY_FAULT = {
    "Normal": "Medium",
    "Stray Gassing": "Medium",
    "Thermal Cellulose": "High",
    "Mild Overheating Paper": "High",
    "Attention": "High",
    "Partial Discharge": "Urgent",
}


def severity_of(value):
    if value >= THRESH_CRITICAL:
        return "Critical"
    if value >= THRESH_WARNING:
        return "Warning"
    if value >= THRESH_WATCH:
        return "Watch"
    return "Normal"


def pd_intensity_from_h2(h2):
    """Skala H2 (ppm, riil) -> nilai dasar PD (mV, simulasi). Log-scale supaya rentang
    H2 700..50000 ppm memetakan ke sekitar 270..2200 mV (Warning s/d jauh di atas Critical)."""
    h2 = max(h2, 1)
    return 250.0 + (math.log1p(h2) - 6.5) * 450.0


def dominant_phase_for(asset_id):
    # Deterministik per aset supaya "fasa dominan" konsisten antar tanggal pengukuran.
    return PHASES[sum(ord(c) for c in asset_id) % 3]


def main():
    rows_out = []
    for asset_id, manufacture_year, sample_date, h2, lab_status, fault in RAW_ROWS:
        seed = abs(hash((asset_id, sample_date))) % (2**32)
        rng = np.random.default_rng(seed)
        measurement_uuid = str(uuid.UUID(bytes=rng.bytes(16)))

        if fault == "Partial Discharge":
            base_value = pd_intensity_from_h2(h2)
        else:
            lo, hi = BASE_RANGE.get(fault, (5, 35))
            base_value = rng.uniform(lo, hi)

        humidity = round(rng.uniform(40, 75), 2)
        temperature = round(rng.uniform(28, 38) + (8 if fault in ("Thermal Cellulose", "Mild Overheating Paper") else 0), 2)

        dominant = dominant_phase_for(asset_id)
        reading_severities = []
        readings = []
        for phase in PHASES:
            phase_factor = rng.uniform(0.95, 1.15) if phase == dominant else rng.uniform(0.55, 0.85)
            for position in POSITIONS:
                pos_factor = rng.uniform(0.9, 1.1)
                value = round(base_value * phase_factor * pos_factor, 3)
                sev = severity_of(value)
                reading_severities.append(sev)
                readings.append((phase, position, value, sev))

        order = {"Normal": 0, "Watch": 1, "Warning": 2, "Critical": 3}
        overall_severity = max(reading_severities, key=lambda s: order[s])
        criticality = CRITICALITY_BY_FAULT.get(fault, "Medium")

        for phase, position, value, sev in readings:
            rows_out.append({
                "asset_id": asset_id,
                "asset_name": asset_id,
                "voltage_level": "",  # tidak ada di sumber DGA -- placeholder, isi manual bila perlu
                "criticality": criticality,
                "measurement_uuid": measurement_uuid,
                "measured_at": sample_date,
                "overall_severity": overall_severity,
                "humidity": humidity,
                "temperature": temperature,
                "method": METHOD,
                "unit": UNIT,
                "value": value,
                "reading_severity": sev,
                "threshold_watch": THRESH_WATCH,
                "threshold_warning": THRESH_WARNING,
                "threshold_critical": THRESH_CRITICAL,
                "reading_point_name": f"{METHOD} {phase}-{position}",
                "phase": phase,
                "position": position,
                # kolom tambahan untuk transparansi (bukan bagian skema STEP 1 asli):
                "lab_fault_type": fault,
                "lab_status": lab_status,
                "h2_ppm": h2,
            })

    fieldnames = list(rows_out[0].keys())
    out_path = "simulated_pd_data.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"Ditulis {len(rows_out)} baris reading ({len(RAW_ROWS)} measurement x 6 reading_point) -> {out_path}")

    # Ringkasan overall_severity per fault type untuk sanity check
    from collections import Counter
    by_fault = {}
    seen_measurements = set()
    for r in rows_out:
        key = (r["asset_id"], r["measured_at"])
        if key in seen_measurements:
            continue
        seen_measurements.add(key)
        by_fault.setdefault(r["lab_fault_type"], Counter())[r["overall_severity"]] += 1
    print("\nRingkasan overall_severity per lab_fault_type (per measurement, bukan per reading):")
    for fault, counter in by_fault.items():
        print(f"  {fault:25s} {dict(counter)}")


if __name__ == "__main__":
    main()
