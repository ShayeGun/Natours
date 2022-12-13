module.exports = class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const excludes = ['page', 'sort', 'limit', 'fields'];
    excludes.forEach((el) => {
      delete queryObj[el];
    });

    // SEARCH QUERY WITH MONGODB OPERATORS :

    const str = JSON.stringify(queryObj).replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(str));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const queryStr = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(queryStr);
    } else {
      this.query = this.query.sort('name');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const queryFields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(queryFields);
    } else {
      this.query = this.query.select('-__v -_id');
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 5;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
};
