class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
        this.queryConditions = {}; // Initialize an object to hold all combined query conditions
    }

    async filter() { // Made async to handle Category.findOne
        const queryStringObj = { ...this.queryString };
        const excludesFields = ['page', 'sort', 'limit', 'fields', 'keyword', 'genre', 'rating']; // Add genre and rating here
        excludesFields.forEach((field) => delete queryStringObj[field]);

        // 1. Handle genre -> convert genre name to category ID
        if (this.queryString.genre) {
            const Category = require('../models/categoryModel'); // Assuming Category model is here
            const category = await Category.findOne({ name: this.queryString.genre });
            if (category) {
                this.queryConditions.category = category._id.toString();
            } else {
                // If genre not found, return an empty query to signify no results
                this.mongooseQuery = this.mongooseQuery.find({ _id: null }); // No documents will match
                return this;
            }
        }

        // 2. Handle rating filter
        if (this.queryString.rating) {
            this.queryConditions.ratingAverage = { $gte: Number(this.queryString.rating) };
        }

        // Apply filtration using [gte, gt, lte, lt] from remaining queryStringObj
        let queryStr = JSON.stringify(queryStringObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        const parsedQueryObj = JSON.parse(queryStr);

        // Merge parsedQueryObj into queryConditions
        Object.assign(this.queryConditions, parsedQueryObj);

        // Apply all collected conditions to the mongoose query
        this.mongooseQuery = this.mongooseQuery.find(this.queryConditions);

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt'); // Corrected to createdAt
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v');
        }
        return this;
    }

   search(modelName) {
    if (this.queryString.keyword) {
        const keyword = this.queryString.keyword;
        const keywordSearchConditions = [];

        if (modelName === 'Product') {
            // 1. Search for the entire keyword phrase (case-insensitive)
            keywordSearchConditions.push(
                { title: { $regex: keyword, $options: 'i' } },
                { author: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } } // <--- تم إضافة هذا السطر
            );

            // 2. Split the keyword into individual words and search for each word
            const words = keyword.split(/\s+/).filter(Boolean);
            if (words.length > 1) {
                words.forEach(word => {
                    keywordSearchConditions.push(
                        { title: { $regex: word, $options: 'i' } },
                        { author: { $regex: word, $options: 'i' } },
                        { description: { $regex: word, $options: 'i' } } // <--- تم إضافة هذا السطر
                    );
                });
            }
        } else if (modelName === 'Category' || modelName === 'User') {
            keywordSearchConditions.push({ name: { $regex: keyword, $options: 'i' } });
        }

        if (keywordSearchConditions.length > 0) {
            this.queryConditions.$and = this.queryConditions.$and || [];
            this.queryConditions.$and.push({ $or: keywordSearchConditions });
        }
    }
   
    this.mongooseQuery = this.mongooseQuery.find(this.queryConditions);
    return this;
}


    paginate(countDocuments) {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 8; 
        const skip = (page - 1) * limit;
        const endIndex = page * limit;

        // Pagination result
        const pagination = {};
        pagination.currentPage = page;
        pagination.limit = limit;
        pagination.numberOfPages = Math.ceil(countDocuments / limit);

        // next page
        if (endIndex < countDocuments) {
            pagination.next = page + 1;
        }
        if (skip > 0) {
            pagination.prev = page - 1;
        }
        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

        this.paginationResult = pagination;
        return this;
    }
}

module.exports = ApiFeatures;
