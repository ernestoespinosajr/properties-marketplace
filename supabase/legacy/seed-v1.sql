-- Datos actuales (los que estaban hardcoded en src/data) — correr después de schema.sql

insert into plans (id, nombre, rango, min_props, max_props, precio, periodo, destacado, beneficios, orden) values
('inicial', 'Paquete Inicial', 'De 3 a 5 propiedades', 3, 5, 45, 'USD / mes', false,
  array['Hasta 5 activos publicados', 'Ficha técnica con galería de fotos', 'Contacto directo por correo', 'Vigencia de 30 días por publicación'], 1),
('profesional', 'Paquete Profesional', 'De 5 a 20 propiedades', 5, 20, 129, 'USD / mes', true,
  array['Hasta 20 activos publicados', '2 propiedades destacadas en portada', 'Perfil de agencia verificado', 'Estadísticas de visitas y contactos', 'Soporte prioritario'], 2),
('corporativo', 'Paquete Corporativo', 'De 20 propiedades en adelante', 20, null, 349, 'USD / mes', false,
  array['Inventario ilimitado', 'Posicionamiento preferente en búsquedas', 'Carga masiva del inventario', 'Asesor de cuenta dedicado', 'Reportes mensuales de desempeño'], 3)
on conflict (id) do nothing;

insert into properties (id, titulo, ubicacion, operacion, categoria, precio, superficie, uso_suelo, disponibilidad, antiguedad, dato_label, dato_valor, imagen, descripcion) values
('nave-logistica-tultitlan-iii', 'Nave Logística Tultitlán III', 'Parque Industrial, Estado de México', 'venta', 'industrial', 42500000, 4200, 'Industrial Pesado', 'inmediata', 2, 'Altura Libre', '12.5 metros', '/images/nave-industrial.jpg',
  'Nave logística de última generación con andenes de carga, piso industrial de alta resistencia y acceso directo a corredor carretero. Ideal para operaciones de distribución regional.'),
('macrolote-comercial-cancun', 'Macrolote Comercial Cancún', 'Zona Hotelera Norte, Quintana Roo', 'venta', 'solar', 18900000, 2850, 'Mixto Comercial', 'preventa', 0, 'Frente', '45 metros', '/images/solar-comercial.jpg',
  'Solar urbano con uso de suelo mixto comercial y servicios municipales completos. Excelente frente sobre avenida primaria con alto flujo vehicular y peatonal.'),
('local-flagship-polanco', 'Local Flagship Polanco', 'Av. Masaryk, Ciudad de México', 'renta', 'local', 145000, 185, 'Comercial AA', 'inmediata', 6, 'Disponibilidad', 'Inmediata', '/images/local-comercial.jpg',
  'Local en esquina sobre el corredor comercial más exclusivo de la ciudad. Doble frente acristalado, altura de losa de 4.2 m y entrega en obra gris terminada.'),
('corporativo-santa-fe-piso-14', 'Corporativo Santa Fe — Piso 14', 'Santa Fe, Ciudad de México', 'renta', 'oficina', 320000, 640, 'Oficinas AAA', '30-dias', 12, 'Estacionamientos', '18 cajones', '/images/oficina-prime.jpg',
  'Piso completo en torre certificada LEED con planta libre, doble sistema de aire acondicionado y lobby de doble altura con seguridad 24/7.'),
('parque-industrial-apodaca', 'Parque Industrial Apodaca — Módulo B', 'Apodaca, Nuevo León', 'renta', 'industrial', 410000, 6800, 'Industrial Ligero', '30-dias', 4, 'Andenes', '8 unidades', '/images/nave-industrial.jpg',
  'Módulo industrial dentro de parque privado con caseta de acceso, patio de maniobras de 40 m y subestación eléctrica propia.'),
('solar-corredor-bajio', 'Solar Corredor Industrial Bajío', 'Silao, Guanajuato', 'venta', 'solar', 27400000, 14500, 'Industrial', 'preventa', 0, 'Frente', '120 metros', '/images/solar-comercial.jpg',
  'Terreno plano listo para desarrollar dentro del corredor automotriz del Bajío, con factibilidad de agua, drenaje y media tensión.')
on conflict (id) do nothing;
