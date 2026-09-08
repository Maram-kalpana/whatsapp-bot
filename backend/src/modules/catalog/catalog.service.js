const path = require("path");
const { Product, Business, WhatsappNumber } = require("../../models");
const { HttpError } = require("../../utils/httpError");
const { graphPost, graphGet } = require("../../lib/meta");
const env = require("../../config/env");

function publicProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: Number(row.price),
    image_url: row.image_url || null,
    sku: row.sku || "",
    category: row.category || "",
    meta_product_id: row.meta_product_id || null,
    is_active: row.is_active,
  };
}

async function getProductOrThrow(businessId, id) {
  const row = await Product.findOne({ where: { id, business_id: businessId } });
  if (!row) throw new HttpError(404, "Product not found");
  return row;
}

async function listProducts(businessId, { q, category, active } = {}) {
  const where = { business_id: businessId };
  if (category) where.category = category;
  if (active === "true") where.is_active = true;
  if (active === "false") where.is_active = false;
  const rows = await Product.findAll({ where, order: [["id", "DESC"]] });
  let items = rows.map(publicProduct);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle),
    );
  }
  return items;
}

async function getProduct(businessId, id) {
  return publicProduct(await getProductOrThrow(businessId, id));
}

async function createProduct(businessId, body, file) {
  const row = await Product.create({
    business_id: businessId,
    name: body.name,
    description: body.description || null,
    price: body.price,
    sku: body.sku || null,
    category: body.category || null,
    image_url: file ? `/uploads/products/${path.basename(file.path)}` : null,
    is_active: body.is_active !== false,
  });
  return publicProduct(row);
}

async function updateProduct(businessId, id, body, file) {
  const row = await getProductOrThrow(businessId, id);
  if (body.name !== undefined) row.name = body.name;
  if (body.description !== undefined) row.description = body.description || null;
  if (body.price !== undefined) row.price = body.price;
  if (body.sku !== undefined) row.sku = body.sku || null;
  if (body.category !== undefined) row.category = body.category || null;
  if (body.is_active !== undefined) row.is_active = body.is_active;
  if (file) row.image_url = `/uploads/products/${path.basename(file.path)}`;
  await row.save();
  return publicProduct(row);
}

async function toggleActive(businessId, id, isActive) {
  const row = await getProductOrThrow(businessId, id);
  row.is_active = isActive;
  await row.save();
  return publicProduct(row);
}

async function removeProduct(businessId, id) {
  const row = await getProductOrThrow(businessId, id);
  await row.destroy();
}

function absoluteImageUrl(imageUrl) {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const base = env.clientOrigin || "http://localhost:4000";
  const apiBase = base.replace(":5173", ":4000");
  return `${apiBase}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

async function getCatalogSettings(businessId) {
  const business = await Business.findByPk(businessId);
  if (!business) throw new HttpError(404, "Business not found");
  const synced = await Product.count({
    where: { business_id: businessId, meta_product_id: { [require("sequelize").Op.ne]: null } },
  });
  return {
    meta_catalog_id: business.meta_catalog_id || "",
    synced_products: synced,
  };
}

async function updateCatalogSettings(businessId, body) {
  const business = await Business.findByPk(businessId);
  if (!business) throw new HttpError(404, "Business not found");
  business.meta_catalog_id = body.meta_catalog_id || null;
  await business.save();
  return getCatalogSettings(businessId);
}

async function resolveCatalogId(business) {
  if (business.meta_catalog_id) return business.meta_catalog_id;
  const wa = await WhatsappNumber.findOne({ where: { business_id: business.id }, order: [["id", "ASC"]] });
  if (!wa?.waba_id) throw new HttpError(400, "Connect WhatsApp number with WABA ID first");

  try {
    const created = await graphPost(`${wa.waba_id}/product_catalogs`, { name: `${business.name} Catalog` });
    business.meta_catalog_id = String(created.id);
    await business.save();
    return business.meta_catalog_id;
  } catch {
    throw new HttpError(
      400,
      "Could not create Meta catalog automatically. Set a catalog ID in Catalog Settings from Meta Commerce Manager.",
    );
  }
}

async function syncToMeta(businessId) {
  const business = await Business.findByPk(businessId);
  if (!business) throw new HttpError(404, "Business not found");

  const catalogId = await resolveCatalogId(business);
  const products = await Product.findAll({
    where: { business_id: businessId, is_active: true },
    order: [["id", "ASC"]],
  });

  const results = [];
  for (const product of products) {
    const payload = {
      name: product.name,
      description: product.description || product.name,
      price: Math.round(Number(product.price) * 100),
      currency: "INR",
      retailer_id: product.sku || `SKU_${product.id}`,
      availability: product.is_active ? "in stock" : "out of stock",
      image_url: absoluteImageUrl(product.image_url),
    };

    try {
      let metaProductId = product.meta_product_id;
      if (!metaProductId) {
        const created = await graphPost(`${catalogId}/products`, payload);
        metaProductId = String(created.id);
        product.meta_product_id = metaProductId;
        product.meta_catalog_id = catalogId;
        await product.save();
      }
      results.push({ id: product.id, name: product.name, meta_product_id: metaProductId, ok: true });
    } catch (err) {
      results.push({ id: product.id, name: product.name, ok: false, error: err.message });
    }
  }

  return {
    meta_catalog_id: catalogId,
    synced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

async function listSyncedProducts(businessId) {
  const rows = await Product.findAll({
    where: { business_id: businessId, is_active: true, meta_product_id: { [require("sequelize").Op.ne]: null } },
    order: [["name", "ASC"]],
  });
  return rows.map(publicProduct);
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  toggleActive,
  removeProduct,
  getCatalogSettings,
  updateCatalogSettings,
  syncToMeta,
  listSyncedProducts,
};
