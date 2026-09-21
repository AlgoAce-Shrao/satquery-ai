-- Migration 003: seed catalogue observations used by the PostGIS-backed data service.
INSERT INTO observations (
    id, region_id, satellite, sensor, acquisition_date, cloud_cover_percent,
    resolution_meters, spectral_bands, footprint
) VALUES
(
    'obs_amazon_001', 'reg_amazon_arc', 'Sentinel-2 MSI L2A', 'Multispectral Instrument (MSI)',
    DATE '2026-06-20', 2.4, 10.0,
    '[
      {"band":"B02","name":"Blue","wavelength":"490 nm","beforeReflectance":0.038,"afterReflectance":0.072},
      {"band":"B03","name":"Green","wavelength":"560 nm","beforeReflectance":0.052,"afterReflectance":0.091},
      {"band":"B04","name":"Red","wavelength":"665 nm","beforeReflectance":0.031,"afterReflectance":0.158},
      {"band":"B08","name":"NIR","wavelength":"842 nm","beforeReflectance":0.485,"afterReflectance":0.231},
      {"band":"B11","name":"SWIR-1","wavelength":"1610 nm","beforeReflectance":0.125,"afterReflectance":0.284}
    ]'::jsonb,
    ST_GeomFromText('POLYGON((-56.2 -11.1, -55.5 -11.1, -55.4 -10.5, -56.1 -10.5, -56.2 -11.1))', 4326)
),
(
    'obs_punjab_002', 'reg_punjab_basin', 'Sentinel-2 MSI L2A', 'Multispectral Instrument (MSI)',
    DATE '2026-05-12', 1.1, 10.0,
    '[
      {"band":"B03","name":"Green","wavelength":"560 nm","beforeReflectance":0.062,"afterReflectance":0.088},
      {"band":"B04","name":"Red","wavelength":"665 nm","beforeReflectance":0.042,"afterReflectance":0.135},
      {"band":"B08","name":"NIR","wavelength":"842 nm","beforeReflectance":0.460,"afterReflectance":0.285},
      {"band":"B11","name":"SWIR-1","wavelength":"1610 nm","beforeReflectance":0.140,"afterReflectance":0.245}
    ]'::jsonb,
    ST_GeomFromText('POLYGON((75.4 30.5, 76.3 30.5, 76.3 31.3, 75.4 31.3, 75.4 30.5))', 4326)
),
(
    'obs_aral_003', 'reg_aral_sea', 'Landsat-9 OLI-2', 'Operational Land Imager (OLI)',
    DATE '2026-07-05', 0.5, 30.0,
    '[
      {"band":"B03","name":"Green","wavelength":"561 nm","beforeReflectance":0.110,"afterReflectance":0.240},
      {"band":"B04","name":"Red","wavelength":"655 nm","beforeReflectance":0.070,"afterReflectance":0.290},
      {"band":"B05","name":"NIR","wavelength":"865 nm","beforeReflectance":0.025,"afterReflectance":0.310},
      {"band":"B06","name":"SWIR-1","wavelength":"1609 nm","beforeReflectance":0.015,"afterReflectance":0.380}
    ]'::jsonb,
    ST_GeomFromText('POLYGON((58.8 44.5, 59.7 44.5, 59.7 45.5, 58.8 45.5, 58.8 44.5))', 4326)
),
(
    'obs_sundarbans_004', 'reg_sundarbans', 'Sentinel-2 MSI L2A', 'Multispectral Instrument (MSI)',
    DATE '2026-03-05', 3.8, 10.0,
    '[
      {"band":"B03","name":"Green","wavelength":"560 nm","beforeReflectance":0.058,"afterReflectance":0.075},
      {"band":"B04","name":"Red","wavelength":"665 nm","beforeReflectance":0.034,"afterReflectance":0.105},
      {"band":"B08","name":"NIR","wavelength":"842 nm","beforeReflectance":0.440,"afterReflectance":0.295},
      {"band":"B11","name":"SWIR-1","wavelength":"1610 nm","beforeReflectance":0.095,"afterReflectance":0.185}
    ]'::jsonb,
    ST_GeomFromText('POLYGON((88.8 21.6, 89.6 21.6, 89.6 22.3, 88.8 22.3, 88.8 21.6))', 4326)
)
ON CONFLICT (id) DO NOTHING;
