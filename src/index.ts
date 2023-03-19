import {
  addDoc,
  CollectionReference,
  type DocumentData,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  Query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from 'firebase/firestore'

/**
 * Data structure for a single page in a paginated collection.
 * @interface PaginationData
 * @property {string | null} cursor - The ID of the last document of the current page. Null if this is the last page.
 * @property {DocumentData[]} data - An array of document data for the current page.
 * @property {Record<string, any>} [metadata] - Optional metadata associated with the current page.
 */
interface PaginationData {
  cursor: string | null
  data: DocumentData[]
  metadata?: Record<string, any>
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
export async function savePageToCollection(
  collectionRef: CollectionReference,
  data: DocumentData[],
  cursor: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  await addDoc(collectionRef, {
    cursor: cursor,
    data: data,
    metadata: metadata,
  })
}

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
export async function* readPages(
  queryParams: QueryConstraint[],
  collectionRef: CollectionReference,
  batchSize: number,
  metadata?: Record<string, any>
): AsyncGenerator<PaginationData, void, unknown> {
  let lastCursor: DocumentSnapshot | null = null
  let pageNumber = 1

  while (true) {
    let currentQuery = query(collectionRef, ...queryParams, limit(batchSize))
    if (lastCursor) {
      currentQuery = query(currentQuery, startAfter(lastCursor.id))
    }

    const querySnapshot = await getDocs(currentQuery)
    if (querySnapshot.empty) {
      break
    }

    const data: DocumentData[] = []
    let cursor: string | null = null
    querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
      data.push(doc.data())
      cursor = doc.id
    })

    lastCursor = querySnapshot.docs[querySnapshot.docs.length - 1]

    const pageMetadata = metadata
      ? { ...metadata, pageNumber: pageNumber }
      : { pageNumber: pageNumber }
    yield {
      cursor: cursor,
      data: data,
      metadata: pageMetadata,
    }

    pageNumber++
  }
}

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
export async function materializePaginationResults(
  queryParams: QueryConstraint[],
  sourceCollectionRef: CollectionReference,
  destinationCollectionRef: CollectionReference,
  batchSize: number,
  metadata?: Record<string, any>
): Promise<void> {
  for await (const page of readPages(
    queryParams,
    sourceCollectionRef,
    batchSize,
    metadata
  )) {
    await savePageToCollection(
      destinationCollectionRef,
      page.data,
      page.cursor,
      page.metadata
    )
  }
}

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
export async function* readMaterializedPages(
  collectionRef: CollectionReference,
  metadataFilter?: Record<string, any>
): AsyncGenerator<
  { data: DocumentData[]; metadata?: Record<string, any> },
  void,
  never
> {
  let lastCursor: string | null = null

  while (true) {
    let currentQuery: Query = query(
      collectionRef,
      orderBy('cursor'),
      startAfter(lastCursor)
    )

    if (metadataFilter) {
      for (const [key, value] of Object.entries(metadataFilter)) {
        currentQuery = query(
          currentQuery,
          where(`metadata.${key}`, '==', value)
        )
      }
    }

    const querySnapshot = await getDocs(currentQuery)
    if (querySnapshot.empty) {
      break
    }

    for (const doc of querySnapshot.docs) {
      lastCursor = doc.data().cursor
      yield {
        data: doc.data().data,
        metadata: doc.data().metadata,
      }
    }
  }
}
