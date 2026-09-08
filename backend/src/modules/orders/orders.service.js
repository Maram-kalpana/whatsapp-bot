const { Op } = require("sequelize");
const { Order, Contact, Product } = require("../../models");
const { HttpError } = require("../../utils/httpError");

function formatOrder(row, contact) {
  return {
    id: row.id,
    contact_id: row.contact_id,
    customer_name: contact?.name || "Customer",
    customer_phone: contact?.phone_number || "",
    items: row.items || [],
    total_amount: Number(row.total_amount),
    status: row.status,
    payment_provider: row.payment_provider,
    razorpay_order_id: row.razorpay_order_id || null,
    razorpay_payment_id: row.razorpay_payment_id || null,
    payment_link: row.payment_link || null,
    created_at: row.created_at,
  };
}

async function getOrderOrThrow(businessId, id) {
  const row = await Order.findOne({ where: { id, business_id: businessId } });
  if (!row) throw new HttpError(404, "Order not found");
  return row;
}

async function listOrders(businessId, { from, to, q, status } = {}) {
  const where = { business_id: businessId };
  if (status) where.status = status;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  const rows = await Order.findAll({ where, order: [["created_at", "DESC"]] });
  const contactIds = [...new Set(rows.map((r) => r.contact_id))];
  const contacts = contactIds.length
    ? await Contact.findAll({ where: { id: { [Op.in]: contactIds } } })
    : [];
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));

  let orders = rows.map((r) => formatOrder(r, contactMap[r.contact_id]));
  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        String(o.id).includes(needle) ||
        o.customer_name.toLowerCase().includes(needle) ||
        o.customer_phone.includes(needle),
    );
  }
  return orders;
}

async function getOrder(businessId, id) {
  const row = await getOrderOrThrow(businessId, id);
  const contact = await Contact.findByPk(row.contact_id);
  return formatOrder(row, contact);
}

async function createOrder(businessId, body) {
  const contact = await Contact.findOne({ where: { id: body.contact_id, business_id: businessId } });
  if (!contact) throw new HttpError(400, "Contact not found");

  const items = [];
  let total = 0;
  for (const item of body.items) {
    let name = item.name;
    let price = Number(item.price);
    let sku = item.sku || null;
    if (item.product_id) {
      const product = await Product.findOne({ where: { id: item.product_id, business_id: businessId } });
      if (product) {
        name = product.name;
        price = Number(product.price);
        sku = product.sku;
      }
    }
    const quantity = item.quantity || 1;
    total += price * quantity;
    items.push({ product_id: item.product_id || null, name, sku, price, quantity });
  }

  const row = await Order.create({
    business_id: businessId,
    contact_id: contact.id,
    items,
    total_amount: total,
    status: "pending",
    payment_provider: body.payment_provider || "razorpay",
  });

  return getOrder(businessId, row.id);
}

async function updateStatus(businessId, id, status) {
  const row = await getOrderOrThrow(businessId, id);
  row.status = status;
  await row.save();
  return getOrder(businessId, id);
}

module.exports = { listOrders, getOrder, createOrder, updateStatus, getOrderOrThrow };
