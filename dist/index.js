"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMaterializedPages = exports.materializePaginationResults = exports.readPages = exports.savePageToCollection = void 0;
const firestore_1 = require("firebase/firestore");
/**
 * Saves a page of data with a cursor and metadata to a Firestore collection.
 *
 * @param {CollectionReference} collectionRef - Reference to the Firestore collection.
 * @param {DocumentData[]} data - Array of Firestore document data to be saved.
 * @param {string|null} cursor - Cursor indicating the end of the page.
 * @param {Record<string, any>} [metadata] - Optional metadata to be saved with the page.
 * @returns {Promise<void>}
 */
function savePageToCollection(collectionRef, data, cursor, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, firestore_1.addDoc)(collectionRef, {
            cursor: cursor,
            data: data,
            metadata: metadata,
        });
    });
}
exports.savePageToCollection = savePageToCollection;
/**
 * Reads pages of data from a Firestore collection based on query parameters.
 * Yields an object with the page data, cursor, and metadata as a Generator.
 *
 * @param {QueryConstraint[]} queryParams - Array of query constraints to filter the data.
 * @param {CollectionReference} collectionRef - Reference to the Firestore collection.
 * @param {number} batchSize - Maximum number of documents to read per page.
 * @param {Record<string, any>} [metadata] - Optional metadata to be saved with each page.
 * @yields {Promise<PaginationData>}
 * @returns {AsyncGenerator}
 */
function readPages(queryParams, collectionRef, batchSize, metadata) {
    return __asyncGenerator(this, arguments, function* readPages_1() {
        let lastCursor = null;
        let pageNumber = 1;
        while (true) {
            let currentQuery = (0, firestore_1.query)(collectionRef, ...queryParams, (0, firestore_1.limit)(batchSize));
            if (lastCursor) {
                currentQuery = (0, firestore_1.query)(currentQuery, (0, firestore_1.startAfter)(lastCursor.id));
            }
            const querySnapshot = yield __await((0, firestore_1.getDocs)(currentQuery));
            if (querySnapshot.empty) {
                break;
            }
            const data = [];
            let cursor = null;
            querySnapshot.forEach((doc) => {
                data.push(doc.data());
                cursor = doc.id;
            });
            lastCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
            const pageMetadata = metadata
                ? Object.assign(Object.assign({}, metadata), { pageNumber: pageNumber }) : { pageNumber: pageNumber };
            yield yield __await({
                cursor: cursor,
                data: data,
                metadata: pageMetadata,
            });
            pageNumber++;
        }
    });
}
exports.readPages = readPages;
/**
 * Materializes the pages of data from a Firestore collection to another collection.
 * Saves each page with cursor and metadata in the destination collection.
 *
 * @param {QueryConstraint[]} queryParams - Array of query constraints to filter the data.
 * @param {CollectionReference} sourceCollectionRef - Reference to the Firestore source collection.
 * @param {CollectionReference} destinationCollectionRef - Reference to the Firestore destination collection.
 * @param {number} batchSize - Maximum number of documents to read per page.
 * @param {Record<string, any>} [metadata] - Optional metadata to be saved with each page.
 * @returns {Promise<void>}
 */
function materializePaginationResults(queryParams, sourceCollectionRef, destinationCollectionRef, batchSize, metadata) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (var _d = true, _e = __asyncValues(readPages(queryParams, sourceCollectionRef, batchSize, metadata)), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                _c = _f.value;
                _d = false;
                try {
                    const page = _c;
                    yield savePageToCollection(destinationCollectionRef, page.data, page.cursor, page.metadata);
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
exports.materializePaginationResults = materializePaginationResults;
/**
 * Asynchronously generates pages of data from a Firestore collection that has been previously
 * materialized using the `materializePaginationResults` function.
 *
 * @async
 * @generator
 * @function
 * @param {CollectionReference<DocumentData>} collectionRef - A reference to the Firestore collection.
 * @param {Record<string, any>} [metadataFilter] - An optional object containing metadata properties to filter by.
 * @yields {Object} An object containing the data and metadata of a page.
 * @property {DocumentData[]} data - An array of the document data for the current page.
 * @property {Record<string, any>} [metadata] - An optional object containing metadata for the current page.
 * @returns {void}
 */
function readMaterializedPages(collectionRef, metadataFilter) {
    return __asyncGenerator(this, arguments, function* readMaterializedPages_1() {
        let lastCursor = null;
        while (true) {
            let currentQuery = (0, firestore_1.query)(collectionRef, (0, firestore_1.orderBy)('cursor'), (0, firestore_1.startAfter)(lastCursor));
            if (metadataFilter) {
                for (const [key, value] of Object.entries(metadataFilter)) {
                    currentQuery = (0, firestore_1.query)(currentQuery, (0, firestore_1.where)(`metadata.${key}`, '==', value));
                }
            }
            const querySnapshot = yield __await((0, firestore_1.getDocs)(currentQuery));
            if (querySnapshot.empty) {
                break;
            }
            for (const doc of querySnapshot.docs) {
                lastCursor = doc.data().cursor;
                yield yield __await({
                    data: doc.data().data,
                    metadata: doc.data().metadata,
                });
            }
        }
    });
}
exports.readMaterializedPages = readMaterializedPages;
