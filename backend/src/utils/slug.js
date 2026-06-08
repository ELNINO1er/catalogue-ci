const slugify = require("slugify");

async function generateUniqueSlug(Model, name) {
  const base = slugify(name, { lower: true, strict: true, locale: "fr" }) || "commerce";
  let slug = base;
  let suffix = 1;

  while (await Model.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

module.exports = { generateUniqueSlug };
