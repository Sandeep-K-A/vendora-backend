const Product = require("../models/Product");
const Category = require("../models/Category");
const Store = require("../models/Store");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const { uploadImageToCloudinary } = require("../utils/uploadImage");

/*
 * POST /api/products
 * Creates a new product for the authenticated seller's store.
 * Validates submitted specifications against the subcategory's
 * specFields template before saving.
 */
const createProduct = async (req, res, next) => {
  const { name, aboutThisProduct, categoryId, subcategoryId, price, stock } =
    req.body;

  let keyHighlights = [];
  let specifications = [];
  let images = [];

  try {
    keyHighlights = req.body.keyHighlights
      ? JSON.parse(req.body.keyHighlights)
      : [];
    specifications = req.body.specifications
      ? JSON.parse(req.body.specifications)
      : [];
  } catch (err) {
    throw new ApiError(400, "Invalid keyHighlights or specifications format");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "You don`t have a store yet");
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const subcategory = category.subcategories.id(subcategoryId);

  if (!subcategory) {
    throw new ApiError(404, "Subcategory not found");
  }

  const requiredKeys = subcategory.specFields
    .filter((field) => field.required)
    .map((field) => field.key);
  const submittedKeys = specifications.map((spec) => spec.key);
  const missingKeys = requiredKeys.filter(
    (key) => !submittedKeys.includes(key),
  );

  if (missingKeys.length > 0) {
    const missingLabels = subcategory.specFields
      .filter((field) => missingKeys.includes(field.key))
      .map((field) => field.label);
    throw new ApiError(
      400,
      `Missing required specifications: ${missingLabels.join(", ")}`,
    );
  }

  // Upload images to Cloudinary
  if (req.files?.images) {
    for (const file of req.files.images) {
      const url = await uploadImageToCloudinary(
        file.buffer,
        "vendora/product-images",
      );
      images.push(url);
    }
  }

  if (images.length === 0) {
    throw new ApiError(400, "At least one product image is required");
  }

  const product = await Product.create({
    store: store._id,
    category: categoryId,
    subcategoryId,
    name,
    aboutThisProduct,
    keyHighlights,
    price,
    stock,
    images,
    specifications,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { product },
  });
};

/*
 * GET /api/products
 * Public product browsing with cursor-based pagination for infinite
 * scroll. Cursor is the createdAt timestamp of the last product seen.
 */
const getProducts = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 12;
  const {
    categorySlug,
    subcategorySlug,
    storeId,
    sort,
    minPrice,
    maxPrice,
    cursor,
  } = req.query;

  const activeStores = await Store.find({
    verificationStatus: "active",
  }).select("_id");
  const activeStoreIds = activeStores.map((s) => s._id);

  const filter = {
    isActive: true,
    store: { $in: activeStoreIds },
  };

  if (storeId) {
    filter.store = storeId;
  }

  if (categorySlug) {
    const category = await Category.findOne({
      slug: categorySlug,
      isActive: true,
    });

    if (!category) {
      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: { products: [], nextCursor: null, hasMore: false },
      });
    }

    filter.category = category._id;

    if (subcategorySlug) {
      const subcategory = category.subcategories.find(
        (s) => s.slug === subcategorySlug,
      );
      if (subcategory) {
        filter.subcategoryId = subcategory._id;
      }
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const specFilterParams = Object.entries(req.query).filter(([key]) =>
    key.startsWith("spec_"),
  );
  if (specFilterParams.length > 0) {
    filter.$and = specFilterParams.map(([param, values]) => {
      const specKey = param.replace("spec_", "");
      const valueList = Array.isArray(values) ? values : [values];
      return {
        specifications: {
          $elemMatch: { key: specKey, value: { $in: valueList } },
        },
      };
    });
  }

  const sortConfig = {
    newest: { field: "createdAt", order: -1 },
    "price-asc": { field: "price", order: 1 },
    "price-desc": { field: "price", order: -1 },
  };
  const { field: sortField, order: sortOrder } =
    sortConfig[sort] || sortConfig.newest;

  if (cursor) {
    const cursorValue = sortField === "price" ? Number(cursor) : cursor;
    const cursorCondition =
      sortOrder === -1 ? { $lt: cursorValue } : { $gt: cursorValue };

    if (sortField === "price") {
      filter.price = { ...filter.price, ...cursorCondition };
    } else {
      filter[sortField] = cursorCondition;
    }
  }

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort({ [sortField]: sortOrder })
    .limit(limit + 1);

  const hasMore = products.length > limit;
  const pageItems = hasMore ? products.slice(0, limit) : products;
  const nextCursor = hasMore
    ? pageItems[pageItems.length - 1][sortField]
    : null;

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: { products: pageItems, nextCursor, hasMore },
  });
};

/*
 * GET /api/products/me
 * Paginated, searchable, filterable, sortable list of the
 * authenticated seller's own products.
 */

const getMyProducts = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "You don`t have a store yet");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search, category, subcategory, sort } = req.query;

  const filter = { store: store._id };

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subcategoryId = subcategory;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    stockAsc: { stock: 1 },
  };
  const sortQuery = sortMap[sort] || sortMap.newest;

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: {
      products,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
};

/*
 * GET /api/products/:id
 * Full detail for a single product — public-readable shape, but here
 * scoped for the seller's own management view (ownership NOT enforced
 * yet — add a check if this should be seller-only).
 */
const getProductById = async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("store", "storeName slug logo verificationStatus");

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  if (product.store.verificationStatus !== "active") {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: { product },
  });
};

/*
 * GET /api/products/me/:id
 * Seller's own product detail — ownership enforced, no store-status
 * gate (a seller can view their own listing whether pending, active,
 * suspended, or rejected).
 */
const getMyProductById = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const product = await Product.findOne({
    _id: req.params.id,
    store: store._id,
  }).populate("category", "name slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: { product },
  });
};

/*
 * GET /api/products/spec-filters
 * For a given category/subcategory, returns distinct values for every
 * spec field marked filterable in that subcategory's template.
 */
const getSpecFilters = async (req, res, next) => {
  const { categorySlug, subcategorySlug } = req.query;

  if (!categorySlug || !subcategorySlug) {
    return res.status(200).json({
      success: true,
      message: "Spec filters fetched successfully",
      data: { specFilters: [] },
    });
  }

  const category = await Category.findOne({ slug: categorySlug });
  if (!category) {
    return res.status(200).json({
      success: true,
      message: "Spec filters fetched successfully",
      data: { specFilters: [] },
    });
  }

  const subcategory = category.subcategories.find(
    (s) => s.slug === subcategorySlug,
  );
  if (!subcategory) {
    return res.status(200).json({
      success: true,
      message: "Spec filters fetched successfully",
      data: { specFilters: [] },
    });
  }

  const activeStores = await Store.find({
    verificationStatus: "active",
  }).select("_id");
  const activeStoreIds = activeStores.map((s) => s._id);

  const filterableFields = subcategory.specFields.filter((f) => f.filterable);

  const products = await Product.find({
    isActive: true,
    store: { $in: activeStoreIds },
    subcategoryId: subcategory._id,
  }).select("specifications");

  const specFilters = filterableFields.map((field) => {
    const valueSet = new Set();
    products.forEach((p) => {
      const match = p.specifications.find((s) => s.key === field.key);
      if (match) valueSet.add(match.value);
    });

    return {
      key: field.key,
      label: field.label,
      values: Array.from(valueSet).sort(),
    };
  });

  res.status(200).json({
    success: true,
    message: "Spec filters fetched successfully",
    data: { specFilters },
  });
};

/*
 * PATCH /api/products/:id
 * Updates an existing product. Ownership enforced — a seller can only
 * edit their own products.
 */
const updateProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store || product.store.toString() !== store._id.toString()) {
    throw new ApiError(403, "You don't have permission to modify this product");
  }

  const { name, aboutThisProduct, price, stock } = req.body;

  if (name !== undefined) product.name = name;
  if (aboutThisProduct !== undefined)
    product.aboutThisProduct = aboutThisProduct;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;

  if (req.body.keyHighlights !== undefined) {
    try {
      product.keyHighlights = JSON.parse(req.body.keyHighlights);
    } catch (err) {
      throw new ApiError(400, "Invalid keyHighlights format");
    }
  }

  if (req.body.specifications !== undefined) {
    try {
      product.specifications = JSON.parse(req.body.specifications);
    } catch (err) {
      throw new ApiError(400, "Invalid specifications format");
    }
  }

  if (req.files?.images) {
    const newImages = [];
    for (const file of req.files.images) {
      const url = await uploadImageToCloudinary(
        file.buffer,
        "vendora/product-images",
      );
      newImages.push(url);
    }
    product.images = [...product.images, ...newImages];
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { product },
  });
};

/*
 * PATCH /api/products/:id/stock
 * Quick stock-only update — used by the inline stock editor.
 */
const updateProductStock = async (req, res, next) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    throw new ApiError(400, "A valid stock value is required");
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store || product.store.toString() !== store._id.toString()) {
    throw new ApiError(403, "You don't have permission to modify this product");
  }

  product.stock = stock;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    data: { product },
  });
};

/*
 * PATCH /api/products/:id/deactivate
 * Soft-deletes a product — hides it from buyer-facing views while
 * preserving it for historical order references.
 */
const deactivateProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const store = await Store.findOne({ owner: req.user._id });
  if (!store || product.store.toString() !== store._id.toString()) {
    throw new ApiError(403, "You don't have permission to modify this product");
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product removed from your store",
  });
};

/*
 * GET /api/products/trending
 * Returns products ranked by total quantity ordered (excluding
 * cancelled orders), across all time for now — could scope to a
 * rolling window (e.g. last 30 days) once order volume justifies it.
 */
const getTrendingProducts = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const topProductIds = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalOrdered: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalOrdered: -1 } },
    { $limit: limit },
  ]);

  const productIds = topProductIds.map((p) => p._id);

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).populate("category", "name slug");

  // Preserve the aggregation's ranking order — Mongo's $in doesn't
  // guarantee result order matches the input array order.
  const orderedProducts = productIds
    .map((id) => products.find((p) => p._id.toString() === id.toString()))
    .filter(Boolean);

  res.status(200).json({
    success: true,
    message: "Trending products fetched successfully",
    data: { products: orderedProducts },
  });
};

module.exports = {
  createProduct,
  getProducts,
  getMyProducts,
  getProductById,
  getMyProductById,
  getSpecFilters,
  updateProduct,
  updateProductStock,
  deactivateProduct,
  getTrendingProducts,
};
