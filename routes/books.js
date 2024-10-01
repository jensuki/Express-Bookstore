const express = require("express");
const Book = require("../models/book");
const { validate } = require('jsonschema');
const bookSchema = require('../schemas/bookSchema.json')
const bookSchemaUpdate = require('../schemas/bookSchemaUpdate.json')

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    // validate req.body with bookSchema
    const validation = validate(req.body, bookSchema);
    //if validation fails, return 400 and validation errors
    if (!validation.valid) {
      return res.status(400).json({
        status: 400,
        errors: validation.errors.map(error => error.stack)
      })
    }
    // if validated, create book
    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    // ensure isbn is not being updated
    if ('isbn' in req.body) {
      return res.status(400).json({
        status: 400,
        message: "Not Allowed"
      })
    }
    // validate req.body updates with bookSchemaUpdate
    const validation = validate(req.body, bookSchemaUpdate);
    if (!validation.valid) {
      return res.status(400).json({
        status: 400,
        errors: validation.errors.map(error => error.stack)
      })
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
