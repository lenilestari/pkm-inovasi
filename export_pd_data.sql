-- Export data Partial Discharge riil untuk menggantikan kolom `pd_worsening_synthetic`
-- di prototype/pkm-dga/dga_composite_score.ipynb.
--
-- Cara pakai:
-- 1. Jalankan STEP 0 di bawah dulu -- ini list semua asset_id/name yang ada di modul PD.
--    Cocokkan (baca manual) mana yang namanya mirip/sama dengan 21 trafo DGA di notebook:
--    TR-26, TR-27, TR-40, TR-44, TR-311B, TR-312A, TR-312, F6P-1001MVTR, 1N-TR-001,
--    2N-TR-001, 2N-TR-002, TR-Kolam-Renang, TR-317-Rasamala, TR-Melati-216, TR-YDPK,
--    TR-1-HV-4, F5O-TR55, F5O-TR512A, TR-34, TR-AOP-P4, TR-314C-Srigading.
--    Kalau tidak ada nama yang mirip sama sekali -> berarti trafo itu memang belum
--    terdaftar di modul PD (belum dipasang sensor PD / belum diinput), itu wajar --
--    tinggal skip trafo tsb untuk sisi PD.
-- 2. Setelah tahu asset_id PD yang match, isi ke klausa WHERE query STEP 1 di bawah.
-- 3. Jalankan STEP 1, export hasilnya ke CSV, bawa ke project pkm-inovasi untuk
--    di-join dengan data DGA.

-- ============================================================
-- STEP 0: Lihat semua asset PD yang ada -- buat mencocokkan nama/asset_id secara manual
-- ============================================================
SELECT
    a.asset_id,
    a.name AS asset_name,
    a.voltage_level,
    a.is_dga_applicable,
    COUNT(m.uuid) AS jumlah_pengukuran
FROM partial_discharge_assets a
LEFT JOIN partial_discharge_asset_measurements m
    ON m.asset_uuid = a.uuid AND m.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.asset_id, a.name, a.voltage_level, a.is_dga_applicable
ORDER BY a.asset_id;

-- ============================================================
-- STEP 1: Export detail pengukuran untuk asset_id yang sudah dicocokkan dari STEP 0
-- ============================================================
SELECT
    a.asset_id,
    a.name            AS asset_name,
    a.voltage_level,
    a.criticality,
    m.uuid            AS measurement_uuid,
    m.measured_at,
    m.overall_severity,
    m.humidity,
    m.temperature,
    r.method,
    r.unit,
    r.value,
    r.severity        AS reading_severity,
    r.threshold_watch,
    r.threshold_warning,
    r.threshold_critical,
    rp.name           AS reading_point_name,
    rp.phase,
    rp.position
FROM partial_discharge_assets a
JOIN partial_discharge_asset_measurements m
    ON m.asset_uuid = a.uuid AND m.deleted_at IS NULL
JOIN partial_discharge_asset_measurement_readings r
    ON r.measurement_uuid = m.uuid AND r.deleted_at IS NULL
JOIN partial_discharge_asset_reading_points rp
    ON rp.uuid = r.reading_point_uuid AND rp.deleted_at IS NULL
WHERE a.deleted_at IS NULL
    -- AND a.asset_id IN ('TR-221', 'TR-40', 'TR-44', ...)  -- isi sesuai mapping ke 21 trafo DGA
ORDER BY a.asset_id, m.measured_at, rp.name;
