import { CollectionReference, type DocumentData, QueryConstraint } from 'firebase/firestore';
/**
 * Data structure for a single page in a paginated collection.
 * @interface PaginationData
 * @property {string | null} cursor - The ID of the last document of the current page. Null if this is the last page.
 * @property {DocumentData[]} data - An array of document data for the current page.
 * @property {Record<string, any>} [metadata] - Optional metadata associated with the current page.
 */
interface PaginationData {
    cursor: string | null;
    data: DocumentData[];
    metadata?: Record<string, any>;
}
/**
 * Saves a page of data with a cursor and metadata to a Firestore collection.
 *
 * @param {CollectionReference} collectionRef - Reference to the Firestore collection.
 * @param {DocumentData[]} data - Array of Firestore document data to be saved.
 * @param {string|null} cursor - Cursor indicating the end of the page.
 * @param {Record<string, any>} [metadata] - Optional metadata to be saved with the page.
 * @returns {Promise<void>}
 */
export declare function savePageToCollection(collectionRef: CollectionReference, data: DocumentData[], cursor: string | null, metadata?: Record<string, any>): Promise<void>;
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
export declare function readPages(queryParams: QueryConstraint[], collectionRef: CollectionReference, batchSize: number, metadata?: Record<string, any>): AsyncGenerator<PaginationData, void, unknown>;
/**
 * Materializes the pages of data from a Firestore collection to another collection.
 * Saves each page with cursor and metadata in the destination collection.
 *
 * @param {QueryConstraint[]} - an array of query constraints used to filter the documents
 * @param {CollectionReference} sourceCollectionRef - the reference to the source collection to read documents from
 * @param {CollectionReference} destinationCollectionRef - the reference to the destination collection to save documents to
 * @param {number} batchSize - the number of documents to read in each page
 * @param {Record<string, any>} [metadata] - optional metadata to attach to each saved page
 *
 * @returns {Promise<void>} a Promise that resolves when all pages have been saved to the destination collection
 */
export declare function materializePaginationResults(queryParams: QueryConstraint[], sourceCollectionRef: CollectionReference, destinationCollectionRef: CollectionReference, batchSize: number, metadata?: Record<string, any>): Promise<void>;
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
export declare function readMaterializedPages(collectionRef: CollectionReference, metadataFilter?: Record<string, any>): AsyncGenerator<{
    data: DocumentData[];
    metadata?: Record<string, any>;
}, void, never>;
export {};
