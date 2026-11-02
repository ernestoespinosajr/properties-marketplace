-- ---------------------------------------------------------------------------
-- Datos de demostracion
--
-- Correr DESPUES de las migraciones y DESPUES de haber registrado al menos una
-- cuenta de broker desde /registro. Las propiedades se asignan al broker mas
-- antiguo que exista; si no hay ninguno, el script no hace nada y avisa.
--
-- Es idempotente: se puede correr las veces que haga falta.
-- ---------------------------------------------------------------------------

do $$
declare
  broker uuid;
begin
  select id into broker
  from public.profiles
  where rol = 'broker'
  order by created_at
  limit 1;

  if broker is null then
    raise notice 'Sin brokers registrados: no se cargo nada. Registra una cuenta de broker en /registro y vuelve a correr este archivo.';
    return;
  end if;

  insert into public.properties
    (owner_id, slug, titulo, descripcion, ubicacion, lat, lng, operacion, categoria,
     disponibilidad, precio, moneda, superficie, uso_suelo, antiguedad,
     dato_label, dato_valor, estado, destacado)
  values
    (broker, 'nave-logistica-tultitlan-iii',
     'Nave Logistica Tultitlan III',
     'Nave de ultima generacion con 12 andenes de carga, patio de maniobras de 45 metros y piso industrial de alta resistencia. Certificacion LEED en tramite y subestacion electrica propia.',
     'Tultitlan, Estado de Mexico', 19.6453, -99.1697, 'venta', 'industrial',
     'inmediata', 42500000, 'MXN', 8500, 'Industrial Pesado', 2,
     'Andenes', '12 posiciones', 'activo', true),

    (broker, 'macrolote-comercial-cancun',
     'Macrolote Comercial Cancun',
     'Terreno con frente de 80 metros sobre avenida principal, uso de suelo mixto aprobado y factibilidad de servicios completa. Ideal para plaza comercial o desarrollo de usos mixtos.',
     'Cancun, Quintana Roo', 21.1619, -86.8515, 'venta', 'solar',
     'inmediata', 18900000, 'MXN', 12000, 'Mixto Comercial', 0,
     'Frente', '80 metros lineales', 'activo', true),

    (broker, 'local-ancla-polanco',
     'Local Ancla en Polanco',
     'Local en planta baja sobre corredor de alto trafico peatonal, con escaparate de 14 metros y salida de humos autorizada. Entrega en obra gris con instalaciones preparadas.',
     'Polanco, Ciudad de Mexico', 19.4326, -99.1904, 'renta', 'local',
     '30-dias', 285000, 'MXN', 320, 'Comercial', 8,
     'Escaparate', '14 metros', 'activo', false),

    (broker, 'oficina-prime-santa-fe',
     'Oficina Prime Santa Fe',
     'Piso completo en torre corporativa clase A, con planta libre, doble altura en recepcion y 18 cajones de estacionamiento. Edificio con certificacion energetica y acceso controlado.',
     'Santa Fe, Ciudad de Mexico', 19.3600, -99.2740, 'renta', 'oficina',
     'inmediata', 420000, 'MXN', 950, 'Corporativo', 5,
     'Estacionamientos', '18 cajones', 'activo', false),

    (broker, 'solar-industrial-apodaca',
     'Solar Industrial Apodaca',
     'Predio plano y consolidado a ocho minutos del aeropuerto internacional, con acceso para tractocamion y todos los servicios a pie de terreno. Uso de suelo industrial vigente.',
     'Apodaca, Nuevo Leon', 25.7817, -100.1886, 'venta', 'solar',
     'preventa', 31000000, 'MXN', 20000, 'Industrial', 0,
     'Acceso', 'Doble carril', 'activo', false),

    (broker, 'centro-distribucion-guadalajara',
     'Centro de Distribucion Guadalajara',
     'Centro de distribucion con 24 andenes, refrigeracion en 3.000 metros cuadrados y oficinas administrativas integradas. Operacion continua las 24 horas autorizada.',
     'El Salto, Jalisco', 20.5167, -103.1833, 'renta', 'industrial',
     'inmediata', 1250000, 'MXN', 15400, 'Industrial Pesado', 4,
     'Andenes', '24 posiciones', 'activo', false)
  on conflict (slug) do nothing;

  raise notice 'Propiedades de demostracion asignadas al broker %', broker;
end $$;
