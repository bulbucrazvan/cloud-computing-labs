import * as http from "http";
import * as fs from "fs";
import { Book } from "./Book"; 
import { Genre } from "./Genre";

var books: Book[] = JSON.parse(fs.readFileSync('books.json').toString());
var genres: Genre[] = JSON.parse(fs.readFileSync('genres.json').toString());
const jsonHeader = {'Content-Type': 'application/json; charset=utf-8'};

function getAllBooks(): Book[] {
    return books;
}

function getBookById(id: number): Book | undefined {
    return books.find(book => book["id"] == id);
}

function bookCollectionRequest(receivedData: string, request: http.IncomingMessage, response: http.ServerResponse): void {
    var badRequest: boolean = true;
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

function bookInstanceRequest(receivedData: string, request: http.IncomingMessage, response: http.ServerResponse, bookId: number): void {
    var book: Book | undefined = getBookById(bookId);
    var badRequest: boolean = true;
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
        books = books.filter(item => item.id != book?.id);
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

function genreCollectionRequest(receivedData: string, request: http.IncomingMessage, response: http.ServerResponse): void {
    var badRequest: boolean = true;
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

function genreInstanceRequest(receivedData: string, request: http.IncomingMessage, response: http.ServerResponse, genreId: number): void {
    var genre: Genre | undefined = genres.find(genre => genre["id"] == genreId);
    var badRequest: boolean = true;
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
        genres = genres.filter(item => item.id != genre?.id);
        for (var book of books) {
            book.genres = book.genres.filter(id => id != genre?.id);
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

http.createServer(async (request: http.IncomingMessage, response: http.ServerResponse ) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Max-Age', 2592000);
    
    const buffers = [];
    for await (const chunk of request) {
        buffers.push(chunk);
    }
    const data: string = Buffer.concat(buffers).toString();

    if (request.url?.startsWith("/api/books")) {
        if (request.url == "/api/books") {
            bookCollectionRequest(data, request, response);
        }
        else {
            var bookIndex: number | null = Number(request.url.substring(11))
            if (bookIndex) {
                bookInstanceRequest(data, request, response, bookIndex);
            }
            else {
                response.writeHead(400);
                response.end();
            }
        }
    }
    else if (request.url?.startsWith("/api/genres")) {
        if (request.url == "/api/genres") {
            genreCollectionRequest(data, request, response);
        }
        else {
            var genreId: number | null = Number(request.url.substring(12))
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
}).listen(8000);

interface BookDTO {
    title: string,
    author: string,
    price: number,
    genres: number[]
}

function isBookDTO(arg: any): arg is BookDTO {
    return ('title' in arg) && ('author' in arg) && ('price' in arg) && ('genres' in arg);
}

function checkGenres(givenGenres: number[]): boolean {
    for (var genre of givenGenres) {
        if (!genres.find(x => x.id == genre)) {
            return false;
        }
    }
    return true;
}

function getNewBookId(): number {
    return 1 + books.reduce((previous, current) => previous.id > current.id ? previous : current)["id"]
}

function getNewGenreId(): number {
    return 1 + genres.reduce((previous, current) => previous.id > current.id ? previous : current)["id"]
}

setInterval(() => {
    fs.writeFileSync("books.json", JSON.stringify(books, null, 4));
    fs.writeFileSync("genres.json", JSON.stringify(genres, null, 4));
}, 10000)