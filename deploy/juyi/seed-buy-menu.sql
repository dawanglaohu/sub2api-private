-- 聚蚁:用户侧边栏"兑换码购买"外链菜单项(ext: 前缀 → 新窗口跳转卡网)
INSERT INTO settings (key, value, updated_at)
VALUES (
  'custom_menu_items',
  '[{"id":"buy-redeem","label":"兑换码购买","icon_svg":"<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"1.8\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z\"/></svg>","url":"ext:https://pay.ldxp.cn/shop/NG0GBH88","page_slug":"","visibility":"user","sort_order":1}]',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

SELECT key, left(value, 80) AS value_head FROM settings WHERE key = 'custom_menu_items';
