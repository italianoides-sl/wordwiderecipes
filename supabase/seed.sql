INSERT INTO affiliate_products
  (name, name_es, name_mx, asin_es, asin_mx, asin_global, asin_br, category, price_range, match_keywords, cuisines)
VALUES
  ('Chile ancho seco', 'Chile ancho seco', 'Chile ancho seco', 'B00000001', 'B00000002', 'B00000003', 'B00000004', 'ingredient', 'budget', ARRAY['chile ancho','ancho','chiles secos'], ARRAY['mexicana']),
  ('Chile chipotle', 'Chile chipotle', 'Chile chipotle', 'B00000005', 'B00000006', 'B00000007', 'B00000008', 'ingredient', 'budget', ARRAY['chipotle','chile chipotle','adobo'], ARRAY['mexicana']),
  ('Epazote seco', 'Epazote seco', 'Epazote seco', 'B00000009', 'B00000010', 'B00000011', 'B00000012', 'ingredient', 'budget', ARRAY['epazote','hierba de olor'], ARRAY['mexicana']),
  ('Masa harina', 'Harina de maiz nixtamalizado', 'Masa harina', 'B00000013', 'B00000014', 'B00000015', 'B00000016', 'ingredient', 'budget', ARRAY['masa harina','nixtamal','tortillas'], ARRAY['mexicana']),
  ('Achiote paste', 'Pasta de achiote', 'Achiote', 'B00000017', 'B00000018', 'B00000019', 'B00000020', 'spice', 'budget', ARRAY['achiote','recado rojo','annatto'], ARRAY['mexicana','caribena']),
  ('Mexican oregano', 'Oregano mexicano', 'Oregano mexicano', 'B00000021', 'B00000022', 'B00000023', 'B00000024', 'spice', 'budget', ARRAY['oregano mexicano','oregano'], ARRAY['mexicana']),
  ('Dried guajillo chiles', 'Chile guajillo seco', 'Chile guajillo seco', 'B00000025', 'B00000026', 'B00000027', 'B00000028', 'ingredient', 'budget', ARRAY['guajillo','chile guajillo'], ARRAY['mexicana']),
  ('Canned tomatillos', 'Tomatillo en conserva', 'Tomatillo en conserva', 'B00000029', 'B00000030', 'B00000031', 'B00000032', 'ingredient', 'budget', ARRAY['tomatillo','tomate verde'], ARRAY['mexicana']),
  ('Pimenton de la Vera', 'Pimenton de la Vera', 'Pimenton ahumado', 'B00000033', 'B00000034', 'B00000035', 'B00000036', 'spice', 'mid', ARRAY['pimenton','pimenton de la vera','paprika ahumada'], ARRAY['espanola']),
  ('Extra virgin olive oil', 'Aceite de oliva virgen extra', 'Aceite de oliva virgen extra', 'B00000037', 'B00000038', 'B00000039', 'B00000040', 'ingredient', 'mid', ARRAY['aove','aceite de oliva','aceite de oliva virgen extra'], ARRAY['espanola','mediterranea']),
  ('Saffron threads', 'Azafran en hebras', 'Azafran', 'B00000041', 'B00000042', 'B00000043', 'B00000044', 'spice', 'premium', ARRAY['azafran','hebras de azafran'], ARRAY['espanola','persa','india']),
  ('Iberian ham', 'Jamon iberico', 'Jamon serrano', 'B00000045', 'B00000046', 'B00000047', 'B00000048', 'ingredient', 'premium', ARRAY['jamon','jamon iberico','jamon serrano'], ARRAY['espanola']),
  ('Bomba rice', 'Arroz bomba', 'Arroz bomba', 'B00000049', 'B00000050', 'B00000051', 'B00000052', 'ingredient', 'mid', ARRAY['arroz bomba','paella','arroz redondo'], ARRAY['espanola']),
  ('Sherry vinegar', 'Vinagre de Jerez', 'Vinagre de Jerez', 'B00000053', 'B00000054', 'B00000055', 'B00000056', 'ingredient', 'mid', ARRAY['vinagre de jerez','jerez'], ARRAY['espanola']),
  ('Comal', 'Comal', 'Comal', 'B00000057', 'B00000058', 'B00000059', 'B00000060', 'utensil', 'mid', ARRAY['comal','tortillas','asar chiles'], ARRAY['mexicana']),
  ('Molcajete', 'Molcajete', 'Molcajete', 'B00000061', 'B00000062', 'B00000063', 'B00000064', 'utensil', 'mid', ARRAY['molcajete','mortero','salsa martajada'], ARRAY['mexicana']),
  ('Paella pan', 'Paellera', 'Paellera', 'B00000065', 'B00000066', 'B00000067', 'B00000068', 'utensil', 'mid', ARRAY['paellera','paella pan','paella'], ARRAY['espanola']),
  ('Carbon steel wok', 'Wok de acero al carbono', 'Wok de acero al carbono', 'B00000069', 'B00000070', 'B00000071', 'B00000072', 'utensil', 'mid', ARRAY['wok','salteado','stir fry'], ARRAY['china','tailandesa','japonesa']),
  ('Mandoline slicer', 'Mandolina de cocina', 'Mandolina de cocina', 'B00000073', 'B00000074', 'B00000075', 'B00000076', 'utensil', 'mid', ARRAY['mandolina','laminar','cortes finos'], ARRAY['francesa','japonesa']),
  ('Digital kitchen scale', 'Bascula de cocina', 'Bascula de cocina', 'B00000077', 'B00000078', 'B00000079', 'B00000080', 'utensil', 'budget', ARRAY['bascula','peso exacto','gramos'], ARRAY['reposteria','global']),
  ('Instant-read thermometer', 'Termometro de cocina', 'Termometro de cocina', 'B00000081', 'B00000082', 'B00000083', 'B00000084', 'utensil', 'mid', ARRAY['termometro','temperatura interna','punto de coccion'], ARRAY['global']),
  ('Dutch oven', 'Cocotte', 'Olla de hierro', 'B00000085', 'B00000086', 'B00000087', 'B00000088', 'utensil', 'premium', ARRAY['cocotte','olla de hierro','dutch oven'], ARRAY['francesa','global']),
  ('Tortilla press', 'Prensa para tortillas', 'Prensa para tortillas', 'B00000089', 'B00000090', 'B00000091', 'B00000092', 'utensil', 'mid', ARRAY['prensa para tortillas','tortilladora','masa'], ARRAY['mexicana']),
  ('Mexican cookbook', 'Libro de cocina mexicana', 'Libro de cocina mexicana', 'B00000093', 'B00000094', 'B00000095', 'B00000096', 'book', 'mid', ARRAY['cocina mexicana','recetario mexicano'], ARRAY['mexicana']),
  ('Spanish cookbook', 'Libro de cocina espanola', 'Libro de cocina espanola', 'B00000097', 'B00000098', 'B00000099', 'B00000100', 'book', 'mid', ARRAY['cocina espanola','recetario espanol'], ARRAY['espanola']),
  ('Italian cookbook', 'Libro de cocina italiana', 'Libro de cocina italiana', 'B00000101', 'B00000102', 'B00000103', 'B00000104', 'book', 'mid', ARRAY['cocina italiana','pasta','risotto'], ARRAY['italiana']),
  ('Japanese cookbook', 'Libro de cocina japonesa', 'Libro de cocina japonesa', 'B00000105', 'B00000106', 'B00000107', 'B00000108', 'book', 'mid', ARRAY['cocina japonesa','sushi','ramen'], ARRAY['japonesa']),
  ('Thai cookbook', 'Libro de cocina tailandesa', 'Libro de cocina tailandesa', 'B00000109', 'B00000110', 'B00000111', 'B00000112', 'book', 'mid', ARRAY['cocina tailandesa','curry tailandes'], ARRAY['tailandesa']),
  ('Indian cookbook', 'Libro de cocina india', 'Libro de cocina india', 'B00000113', 'B00000114', 'B00000115', 'B00000116', 'book', 'mid', ARRAY['cocina india','masala','curry'], ARRAY['india']),
  ('French cookbook', 'Libro de cocina francesa', 'Libro de cocina francesa', 'B00000117', 'B00000118', 'B00000119', 'B00000120', 'book', 'mid', ARRAY['cocina francesa','salsas madre'], ARRAY['francesa'])
ON CONFLICT DO NOTHING;

INSERT INTO homepage_config (id, hero_content_ids, featured_technique, featured_ingredient, top_affiliate_id, trending_tags)
VALUES (1, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  hero_content_ids = EXCLUDED.hero_content_ids,
  featured_technique = EXCLUDED.featured_technique,
  featured_ingredient = EXCLUDED.featured_ingredient,
  top_affiliate_id = EXCLUDED.top_affiliate_id,
  trending_tags = EXCLUDED.trending_tags,
  updated_at = now();
