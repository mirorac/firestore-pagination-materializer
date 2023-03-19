# Firestore Pagination Materializer

This utility provides a set of functions to materialize pagination results from a Firestore collection.

> EVERYTHING IN THIS REPOSITORY HAS BEEN CREATED BY GPT-4, including code, documentation and this README.md

Materializing pagination results can be useful in a number of scenarios, especially when dealing with large datasets in Firestore. The process involves breaking up a query into smaller batches, reading and storing each batch of data along with a cursor to allow for efficient retrieval, and then fetching the materialized pages as needed.

This utility helps optimize costs of Firestore usage by reducing the number of reads required to retrieve a large dataset. Without materializing the pagination results, each time the query is executed, Firestore would need to read the entire dataset to determine the appropriate page to return, which could be very costly in terms of Firestore reads.

By storing the pagination results in a separate collection, the utility allows you to read the data in batches, reducing the number of Firestore reads required. In addition, the metadata provided by this utility can be used to filter the materialized pages, allowing you to retrieve only the data that is relevant to your use case. This can further reduce the number of reads required, optimizing Firestore usage and potentially reducing costs.

## Installation

```bash
pnpm install mirorac/firestore-pagination-materializer
```

## Usage

```typescript
import { getFirestore } from 'firebase/firestore'
import { collection } from 'firebase/firestore'
import {
  materializePaginationResults,
  readMaterializedPages,
} from 'firestore-pagination-materializer'

// Initialize Firestore
const firestore = getFirestore()

// Define the source and destination collections
const sourceCollection = collection(firestore, 'articles')
const destinationCollection = collection(firestore, '_pages')

// Define the query constraints and batch size
const queryParams = [
  orderBy('timestamp', 'desc'),
  where('status', '==', 'published'),
]
const metadata = {
  id: 'newest-articles',
}
const batchSize = 10

// Materialize the pagination results
await materializePaginationResults(
  queryParams,
  sourceCollection,
  destinationCollection,
  batchSize
)

// Read the materialized pages with metadata
for await (const page of readMaterializedPages(
  destinationCollection,
  metadata
)) {
  console.log('Page data:', page.data)
  console.log('Page metadata:', page.metadata)
}
```

## List of available functions

### `savePageToCollection`

```typescript
async function savePageToCollection(
  collectionRef: CollectionReference,
  data: DocumentData[],
  cursor: string | null,
  metadata?: Record<string, any>
): Promise<void>
```

This function saves a batch of data to the specified Firestore collection with an optional cursor and metadata.

- `collectionRef`: A reference to the Firestore collection to save the data to.
- `data`: An array of DocumentData to save to the collection.
- `cursor`: An optional cursor value to identify the end of the current page.
- `metadata`: An optional object containing additional metadata to store with the page.

### `readPages`

```typescript
async function* readPages(
  queryParams: QueryConstraint[],
  collectionRef: CollectionReference,
  batchSize: number,
  metadata?: Record<string, any>
): AsyncGenerator<PaginationData, void, unknown>
```

This is an async generator function that reads the source collection in batches using the provided query constraints and batch size, and adds an optional pageNumber field to the metadata.

- `queryParams`: An array of query constraints to filter and sort the data in the source collection.
- `collectionRef`: A reference to the Firestore collection to read from.
- `batchSize`: The number of documents to read per batch.
- `metadata`: An optional object containing additional metadata to include with each page.

### `materializePaginationResults`

```typescript
async function materializePaginationResults(
  queryParams: QueryConstraint[],
  sourceCollectionRef: CollectionReference,
  destinationCollectionRef: CollectionReference,
  batchSize: number,
  metadata?: Record<string, any>
): Promise<void>
```

This is the main function that accepts query constraints, source and destination collection references, and the batch size, and calls the readPages and savePageToCollection functions to materialize the pagination results with optional metadata.

- `queryParams`: An array of query constraints to filter and sort the data in the source collection.
- `sourceCollectionRef`: A reference to the Firestore collection to read from.
- `destinationCollectionRef`: A reference to the Firestore collection to save the materialized pages to.
- `batchSize`: The number of documents to read and save per batch.
- `metadata`: An optional object containing additional metadata to include with each page.

### `readMaterializedPages`

```typescript
async function* readMaterializedPages(
  collectionRef: CollectionReference,
  batchSize: number,
  metadataFilter?: Record<string, any>
): AsyncGenerator<{ data: DocumentData[]; metadata?: Record<string, any> }, void, unknown>
This is an async generator function that reads the materialized pages from the destination Firestore collection in batches and filters them based on optional metadata.
```

- `collectionRef`: A reference to the Firestore collection to read the materialized pages from.
- `batchSize`: The number of documents to read per batch.
- `metadataFilter`: An optional object containing key-value pairs to filter the materialized pages by metadata.
