# Firestore Pagination Materializer

This utility allows you to read the data in batches, reducing the number of Firestore reads required.

> EVERYTHING IN THIS REPOSITORY HAS BEEN CREATED BY GPT-4, including the code, documentation, repository name and this README.md file

Firestore's billing model is based on the number of read, write, and delete operations performed on the database.

When implementing a pagination system in Firestore, it's important to consider the number of read operations that will be required to retrieve the data. Retrieving a large dataset could result in many read operations and consequently increase costs. By implementing materialized pagination, we can reduce the number of read operations required to fetch data and optimize the costs.

Let's take the example of a blog website that displays a list of the newest blog articles, 20 articles per page. Without materialized pagination, fetching documents to display a single page would result in 20 read operations. On high traffic websites, this would be an inefficient use of Firestore and could result in high costs.

With materialized pagination, we can fetch the newest blog articles in small batches or pages, ie. 20 articles with a single read operation. While Firestore provides [data bundles](https://firebase.google.com/docs/firestore/bundles) for this use case, it has it's limitations. For example, it is not viable for use cases where you expect that each of your users will be making different queries or want different pieces of information. Pagination materializer can use the metadata parameter to pass additional information, such as a unique identifier of a query, so you can build batches for each user or a cluster of users separately.

## Installation

```bash
pnpm install mirorac/firestore-pagination-materializer
```

## Usage

### Creating and reading pages

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
const destinationCollection = collection(firestore, 'article_listing_pages')

// Define the query constraints and batch size
const queryParams = [
  orderBy('timestamp', 'desc'),
  where('status', '==', 'published'),
]
const metadata = {
  id: 'newest-articles',
}
const batchSize = 20

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

### Minimal Vue 3 pagination

```vue
<template>
  <ul>
    <li v-for="article in articles" :key="article.id">
      {{ article.title }}
    </li>
  </ul>
  <button @click="loadMore">Load more</button>
</template>
<script setup lang="ts">
import { db as firestore } from '~/plugins/firebase/db'
import { collection } from 'firebase/firestore'
import { readMaterializedPages } from '~/plugins/firestore-pagination-materialized'
import { ref } from 'vue'

// Define the source and destination collections
const destinationCollection = collection(firestore, 'article_listing_pages')

// Identify the query
const metadata = {
  id: 'newest-articles',
}

const articles = ref<any>([])
const loader = readMaterializedPages(destinationCollection, metadata)
async function loadMore() {
  const page = (await loader.next()).value
  if (page) {
    console.log('Page data:', page.data)
    console.log('Page metadata:', page.metadata)
    articles.value.push(...page.data)
  }
}

// load the first page
loadMore()
</script>
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
