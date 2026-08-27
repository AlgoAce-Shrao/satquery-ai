-- Seed Initial Critical Earth Observation Regions
INSERT INTO regions (id, name, country, continent, area_sqkm, centroid, geom)
VALUES 
(
    'reg_amazon_arc',
    'Amazon Southern Deforestation Frontier (Mato Grosso)',
    'Brazil',
    'South America',
    14250.0,
    ST_SetSRID(ST_MakePoint(-55.86, -10.83), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((-57.0 -12.0, -54.0 -12.0, -54.0 -9.5, -57.0 -9.5, -57.0 -12.0))', 4326))
),
(
    'reg_punjab_basin',
    'Indo-Gangetic Plain & Punjab Agri-Basin',
    'India',
    'Asia',
    8930.0,
    ST_SetSRID(ST_MakePoint(75.85, 30.90), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((74.5 29.8, 77.2 29.8, 77.2 32.0, 74.5 32.0, 74.5 29.8))', 4326))
),
(
    'reg_aral_sea',
    'South Aral Sea Basin Desiccation Complex',
    'Uzbekistan / Kazakhstan',
    'Central Asia',
    19800.0,
    ST_SetSRID(ST_MakePoint(59.25, 45.00), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((58.0 43.5, 61.0 43.5, 61.0 46.5, 58.0 46.5, 58.0 43.5))', 4326))
),
(
    'reg_sundarbans',
    'Sundarbans Mangrove Delta Complex',
    'Bangladesh / India',
    'Asia',
    4120.0,
    ST_SetSRID(ST_MakePoint(89.20, 21.95), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((88.5 21.3, 90.0 21.3, 90.0 22.6, 88.5 22.6, 88.5 21.3))', 4326))
),
(
    'reg_borneo_kalimantan',
    'Central Kalimantan Peatland Forest Corridor',
    'Indonesia',
    'Asia',
    11500.0,
    ST_SetSRID(ST_MakePoint(113.92, -1.85), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((112.5 -3.0, 115.5 -3.0, 115.5 -0.5, 112.5 -0.5, 112.5 -3.0))', 4326))
),
(
    'reg_congo_salonga',
    'Salonga Basin Tropical Canopy',
    'DR Congo',
    'Africa',
    16400.0,
    ST_SetSRID(ST_MakePoint(21.50, -2.20), 4326),
    ST_Multi(ST_GeomFromText('POLYGON((20.0 -3.5, 23.0 -3.5, 23.0 -1.0, 20.0 -1.0, 20.0 -3.5))', 4326))
)
ON CONFLICT (id) DO NOTHING;
