process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

// declare sample book isbn for test cases
let book_isbn;


// before each test, insert new book
beforeEach(async () => {
    const result = await db.query(`
    INSERT INTO books
    (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES (
    '123456789',
    'https://amazon.com/fakebook',
    'Fake Author',
    'English',
    200,
    'Fake Publishers',
    'A Fake Book',
    2024
    ) RETURNING isbn`);

    book_isbn = result.rows[0].isbn // store isbn for use in tests
})

afterEach(async () => {
    await db.query(`DELETE FROM books`);
})

afterAll(async () => {
    await db.end();
})

// test GET /books
describe('GET /books', () => {
    test('it should return a list of all books', async () => {
        const resp = await request(app).get('/books');
        expect(resp.statusCode).toBe(200);
        expect(resp.body.books).toHaveLength(1);
        expect(resp.body.books[0]).toHaveProperty('author')
        expect(resp.body.books[0].isbn).toEqual(book_isbn);
    })
})

// test GET /books/:isbn
describe('GET /books/:isbn', () => {
    test('it should get a single book', async () => {
        const resp = await request(app).get(`/books/${book_isbn}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body.book.isbn).toBe(book_isbn);
    })
    test('it should return 404 if book not found', async () => {
        const resp = await request(app).get(`/books/000`)
        expect(resp.statusCode).toBe(404);
    })
})

// test POST /books
describe('POST /books', () => {
    test('it should create a new book', async () => {
        const newBook = {
            isbn: '987654321',
            amazon_url: 'https://amazon.com/newbook',
            author: 'New Author',
            language: 'English',
            pages: 300,
            publisher: 'New Publisher',
            title: 'A New Book',
            year: 2022
        }
        const resp = await request(app)
            .post(`/books`)
            .send(newBook);
        expect(resp.statusCode).toBe(201);
        expect(resp.body.book.isbn).toBe('987654321')
    })
    test('it should return 400 for missing required fields', async () => {
        const invalidBook = {
            isbn: '987654321'
        }
        const resp = await request(app)
            .post(`/books`)
            .send(invalidBook)
        expect(resp.statusCode).toBe(400);
        expect(resp.body.errors).toBeDefined();
    })
})

// test PUT /books/:isbn
describe('PUT /books/:isbn', () => {
    test('it should update an exisitng book', async () => {
        const updatedBook = {
            amazon_url: 'https://amazon.com/updatedbook',
            author: 'Updated Author',
            language: 'English',
            pages: 400,
            publisher: 'Updated Publisher',
            title: 'An Updated Book',
            year: 2023
        };
        const resp = await request(app)
            .put(`/books/${book_isbn}`)
            .send(updatedBook)
        expect(resp.statusCode).toBe(200);
        expect(resp.body.book.title).toBe('An Updated Book');
    })
    test('it should return 400 if trying to change isbn', async () => {
        const invalidUpdate = {
            isbn: '999999999',
            amazon_url: 'https://amazon.com/updatedbook',
            author: 'Updated Author',
            language: 'English',
            pages: 400
        }
        const resp = await request(app)
            .put(`/books/${book_isbn}`)
            .send(invalidUpdate);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.message).toBe('Not Allowed')
    })
    test('it should return 404 if book not found', async () => {
        const resp = await request(app)
            .put(`/books/0000000}`)
            .send({
                amazon_url: 'https://amazon.com/updatedbook',
                author: 'Updated Author',
                title: 'An Updated Book'
            })
        expect(resp.statusCode).toBe(404);
    })
})

// test DELETE /books/:isbn
describe('DELETE /books/:isbn', () => {
    test('it should delete a book', async () => {
        const resp = await request(app)
            .delete(`/books/${book_isbn}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body.message).toBe('Book deleted')
    })
    test('should return 404 if book not found', async () => {
        const resp = await request(app).delete(`/books/00000`)
        expect(resp.statusCode).toBe(404);
    })
})