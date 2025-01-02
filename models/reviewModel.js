// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      maxlength: [500, 'Review cannot be more than 500 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Tour must must be rated 1 or higher'],
      max: [5, 'Tour cannot be rated higher than 5.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Adding a compound index with uniqe to make sure that every review can only have 1 unique review pr user pr tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// REVIEW This is causing problems in importing data
// FIXED The tour and user objects where written as arrays thus breaking the data trying to index

// QERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Adding the calculated average and number of Ratings to the database (ONLY WORKS IF THE ARRAY IF THE REVIEW EXISTS)
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// important to add the middleware for calcAverage on POST-middleware since it needs to work with the saved document and process that further.
reviewSchema.post('save', function () {
  // this. points to current review
  this.constructor.calcAverageRatings(this.tour);
  // targetting constructor lets us run the middleware on the model before the Review is actually defined
});

// TO UPDATE AND DELETE RATINGS - its a bit more complicated. WE CANNOT USE SCHEMA-MIDDLEWARE, ONLY QUERY MIDDLEWARE ON UPDATE AND DELETE ->
// Expression for anything starting with findOneAnd - because findByIdAnd is a short hand for for findOneAnd
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // find() has been changed in Mongoose updates. Chaining the method with .clone() seemed to fix the error "Query was already executed"
  this.r = await this.clone().findOne();
});

// We need to calculate based on the saved updated data. In this case it wont work to use post direct (since data needs to be updated).

// We change the pre-middleware to save the updated review as this.r so we can collect the data from the pre-middleware and use it in the post-middleware
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
