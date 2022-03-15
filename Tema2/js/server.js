"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
var books = JSON.parse(fs.readFileSync('books.json').toString());
var genres = JSON.parse(fs.readFileSync('genres.json').toString());
const jsonHeader = { 'Content-Type': 'application/json; charset=utf-8' };
function getAllBooks() {
    return books;
}
function getBookById(id) {
    return books.find(book => book["id"] == id);
}
function bookCollectionRequest(receivedData, request, response) {
    var badRequest = true;
    if (request.method == "GET") {
        badRequest = false;
        response.writeHead(200, jsonHeader);
        response.write(JSON.stringify(getAllBooks()));
        response.end();
    }
    else if (request.method == "POST") {
        var receivedBook = JSON.parse(receivedData);
        if (isBookDTO(receivedBook) && checkGenres(receivedBook["genres"])) {
            badRequest = false;
            books.push({
                "id": getNewBookId(),
                "author": receivedBook["author"],
                "title": receivedBook["title"],
                "price": receivedBook["price"],
                "genres": receivedBook["genres"]
            });
            response.writeHead(201);
            response.end();
        }
    }
    if (badRequest) {
        response.writeHead(400);
        response.end();
    }
}
function bookInstanceRequest(receivedData, request, response, bookId) {
    var book = getBookById(bookId);
    var badRequest = true;
    if (!book) {
        response.writeHead(404);
        response.end();
        return;
    }
    if (request.method == "GET") {
        badRequest = false;
        response.writeHead(200, jsonHeader);
        response.write(JSON.stringify(book));
        response.end();
    }
    else if (request.method == "DELETE") {
        badRequest = false;
        books = books.filter(item => item.id != (book === null || book === void 0 ? void 0 : book.id));
        response.writeHead(200);
        response.end();
    }
    else if (request.method == "PUT") {
        var receivedBook = JSON.parse(receivedData);
        if (isBookDTO(receivedBook) && checkGenres(receivedBook["genres"])) {
            badRequest = false;
            book.author = receivedBook.author;
            book.genres = receivedBook.genres;
            book.title = receivedBook.title;
            book.price = receivedBook.price;
            response.writeHead(200);
            response.end();
        }
    }
    if (badRequest) {
        response.writeHead(400);
        response.end();
    }
}
function genreCollectionRequest(receivedData, request, response) {
    var badRequest = true;
    if (request.method == "GET") {
        badRequest = false;
        response.writeHead(200, jsonHeader);
        response.write(JSON.stringify(genres));
        response.end();
    }
    else if (request.method == "POST") {
        var receivedGenre = JSON.parse(receivedData);
        if ('name' in receivedGenre) {
            if (genres.find(genre => genre.name == receivedGenre["name"])) {
                response.writeHead(409);
                response.end();
                return;
            }
            genres.push({
                id: getNewGenreId(),
                "name": receivedGenre["name"]
            });
            response.writeHead(201);
            response.end();
            badRequest = false;
        }
    }
    if (badRequest) {
        response.writeHead(400);
        response.end();
    }
}
function genreInstanceRequest(receivedData, request, response, genreId) {
    var genre = genres.find(genre => genre["id"] == genreId);
    var badRequest = true;
    if (!genre) {
        response.writeHead(404);
        response.end();
        return;
    }
    if (request.method == "GET") {
        badRequest = false;
        response.writeHead(200, jsonHeader);
        response.write(JSON.stringify(genre));
        response.end();
    }
    else if (request.method == "DELETE") {
        badRequest = false;
        genres = genres.filter(item => item.id != (genre === null || genre === void 0 ? void 0 : genre.id));
        for (var book of books) {
            book.genres = book.genres.filter(id => id != (genre === null || genre === void 0 ? void 0 : genre.id));
        }
        response.writeHead(200);
        response.end();
    }
    else if (request.method == "PUT") {
        var receivedGenre = JSON.parse(receivedData);
        if ("name" in receivedGenre) {
            genre.name = receivedGenre["name"];
            badRequest = false;
            response.writeHead(200);
            response.end();
        }
    }
    if (badRequest) {
        response.writeHead(400);
        response.end();
    }
}
http.createServer((request, response) => { var request_1, request_1_1; return __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    var _b, _c;
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Max-Age', 2592000);
    const buffers = [];
    try {
        for (request_1 = __asyncValues(request); request_1_1 = yield request_1.next(), !request_1_1.done;) {
            const chunk = request_1_1.value;
            buffers.push(chunk);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (request_1_1 && !request_1_1.done && (_a = request_1.return)) yield _a.call(request_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    const data = Buffer.concat(buffers).toString();
    if ((_b = request.url) === null || _b === void 0 ? void 0 : _b.startsWith("/api/books")) {
        if (request.url == "/api/books") {
            bookCollectionRequest(data, request, response);
        }
        else {
            var bookIndex = Number(request.url.substring(11));
            if (bookIndex) {
                bookInstanceRequest(data, request, response, bookIndex);
            }
            else {
                response.writeHead(400);
                response.end();
            }
        }
    }
    else if ((_c = request.url) === null || _c === void 0 ? void 0 : _c.startsWith("/api/genres")) {
        if (request.url == "/api/genres") {
            genreCollectionRequest(data, request, response);
        }
        else {
            var genreId = Number(request.url.substring(12));
            if (genreId) {
                genreInstanceRequest(data, request, response, genreId);
            }
            else {
                response.writeHead(400);
                response.end();
            }
        }
    }
    else {
        response.writeHead(400);
        response.end();
    }
}); }).listen(8000);
function isBookDTO(arg) {
    return ('title' in arg) && ('author' in arg) && ('price' in arg) && ('genres' in arg);
}
function checkGenres(givenGenres) {
    for (var genre of givenGenres) {
        if (!genres.find(x => x.id == genre)) {
            return false;
        }
    }
    return true;
}
function getNewBookId() {
    return 1 + books.reduce((previous, current) => previous.id > current.id ? previous : current)["id"];
}
function getNewGenreId() {
    return 1 + genres.reduce((previous, current) => previous.id > current.id ? previous : current)["id"];
}
setInterval(() => {
    fs.writeFileSync("books.json", JSON.stringify(books, null, 4));
    fs.writeFileSync("genres.json", JSON.stringify(genres, null, 4));
}, 10000);
